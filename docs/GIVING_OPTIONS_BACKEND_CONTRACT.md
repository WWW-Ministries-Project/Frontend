# Giving Options — Backend Contract

Status: implemented (frontend + backend) — both phases.

Phase 1 is configuration only: church admins define giving options, and each one
gets a Paystack subaccount that payments are routed to. Phase 2 (donor checkout,
webhook, contribution records) is also implemented; see
`## Phase 2 — donor checkout and contributions` below and the design spec at
`docs/superpowers/specs/2026-08-01-giving-options-phase-2-design.md`.

## Routing, not splitting

Every giving option routes **100%** of its payments to its own settlement
account. That is encoded as subaccount `percentage_charge` = `100`, and there is
deliberately **no percentage field in the UI**. Nothing is split.

**The fee is donor-borne, not subaccount-borne — an earlier design tried the
latter and Paystack rejected it outright.** The original model had the
subaccount receive 100% of the payment *and* bear the Paystack fee
(`bearer: "subaccount"`). Paystack refuses that combination at initialize with
`"Invalid split transaction values"`: a subaccount cannot take the whole amount
and also pay the fee out of it. Every donation failed under that model; it
never worked in production.

What actually happens now, at transaction-init time
(`Backend/src/modules/finance/GivingOption/contributionService.ts`,
`Backend/src/libs/paystack/paystackFees.ts`):

- The charge is **grossed up**. The donor typed a donation amount; the fee for
  that amount (at the configured rate) is computed and added on top, so the
  card is charged `donation + fee`. Example: donor gives GHS 100 → charged
  GHS 101.95.
- The fee is routed to the **main account** as a flat `transaction_charge`
  equal to that fee, with `bearer: "account"` — the main account is named as
  bearer, so it receives exactly the fee and immediately pays it back out,
  netting **zero**.
- `percentage_charge` on the subaccount stays **100**. The subaccount still
  gets the whole payment; it's just that the payment sent to Paystack is now
  `donation + fee` instead of `donation`, so after the main account's
  `transaction_charge` is deducted, the subaccount nets exactly the donation.

Net effect: the fund receives the full amount the donor chose to give, the
donor covers the processing cost, and the main account is a zero-sum pass-through
for the fee — never a place giving money accumulates.

Do not confuse this with `bankAccountConfig.percentage`, which is an unrelated
finance-reporting allocation capped at 100% org-wide. The two never interact.

## Data model

`givingOption` (MySQL, migration `20260727120000_add_giving_options`):

| Column | Type | Notes |
|---|---|---|
| `id` | `VARCHAR(191)` | cuid, matches the other finance configs |
| `name` | `VARCHAR(191)` | unique per branch **among non-archived rows** (enforced in the service, not the DB) |
| `description` | `TEXT?` | |
| `currency` | `VARCHAR(191)` | defaults `GHS` |
| `account_type` | `VARCHAR(191)` | `ghipss` or `mobile_money` |
| `settlement_bank` | `VARCHAR(191)` | Paystack bank/provider **code** |
| `bank_name` | `VARCHAR(191)` | denormalized label, so lists render without hitting Paystack |
| `account_number` | `VARCHAR(191)` | 5–20 digits |
| `account_name` | `VARCHAR(191)` | |
| `subaccount_code` | `VARCHAR(191)?` unique | Paystack `ACCT_xxx` |
| `percentage_charge` | `DOUBLE` | always `100` |
| `bearer` | `VARCHAR(191)` | always `subaccount` |
| `is_active` | `BOOLEAN` | |
| `archived_at` | `DATETIME?` | non-null ⇒ soft-deleted |
| `paystack_synced_at` | `DATETIME?` | **null ⇒ local state and Paystack have drifted** |
| `branch_id` | `INT?` | FK → `branch`, `ON DELETE SET NULL` |
| `created_by` | `INT?` | user id, intentionally no FK |

`created_by` has no foreign key: it is an audit breadcrumb, and a deleted user
should not be able to block or cascade into financial configuration.

## Endpoints

Base: `/givingoption`. All routes require a bearer token.

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/create-giving-option` | `Giving:manage` | Creates the Paystack subaccount, then the row |
| GET | `/get-giving-options` | `Giving:view` | `page`, `take`, `branch_id`, `include_archived` |
| GET | `/:id` | `Giving:view` | |
| PUT | `/update-giving-option?id=` | `Giving:manage` | Syncs the subaccount |
| PUT | `/restore-giving-option?id=` | `Giving:manage` | |
| DELETE | `/delete-giving-option?id=` | `Giving:admin` | Archive (soft delete) |
| GET | `/banks?currency=GHS` | `Giving:manage` | Server-side proxy, cached 24h |
| GET | `/resolve-account?account_number=&bank_code=` | `Giving:manage` | Best effort; `data` may be `null` |

List and mutation responses follow the existing finance envelope
(`{ message, data, current_page, take, total, page_size, totalPages }`).

Every row is returned with two derived fields the frontend relies on:
`masked_account_number` (`••••1234`) and `is_synced` (`paystack_synced_at !== null`).

### Error semantics

| Status | Meaning |
|---|---|
| 409 | Name already used by an active option in that branch, or the option is archived and must be restored before editing |
| 422 | Validation failure, **or** Paystack rejected the request (its message is passed through verbatim) |
| 502 | Paystack unreachable or returned 5xx |
| 500 | `PAYSTACK_SECRET_KEY` not configured on the server |

## Write ordering and compensation

Paystack has no `DELETE /subaccount` endpoint. Only create, update (including
`active: false`), fetch, and list. Everything below follows from that.

- **Create** — Paystack first, then the DB. An option with no live subaccount
  cannot receive money, so persisting one would be a lie. If the insert then
  fails, the new subaccount is deactivated so it cannot quietly collect
  payments with no local record behind it.
- **Update** — Paystack first, then the DB, so a settlement account Paystack
  rejects is never persisted as accepted. If the DB write fails afterwards, the
  subaccount is rolled back to the values the DB still believes.
- **Update, self-heal** — a row whose `subaccount_code` is null gets a fresh
  subaccount instead of remaining permanently unable to receive payments.
- **Archive** — the local archive is authoritative: a hidden option can never be
  chosen at checkout. So archiving **succeeds even when Paystack is
  unreachable**; `paystack_synced_at` is cleared, the response message says the
  option needs re-syncing, and the card shows a warning.
- **Restore** — strict, and deliberately asymmetric with archive. An option
  visible in the UI must actually be able to receive money, so a Paystack
  failure aborts the restore with 502.

Any row with `paystack_synced_at = null` is a known-drift record. Re-saving it
re-syncs it.

## Credentials

`resolvePaystackCredentials(branchId)` in
`Backend/src/libs/paystack/paystackCredentials.ts` is the **only** place that
reads `PAYSTACK_SECRET_KEY` for this feature. Today it ignores `branchId` and
returns the org-wide env key.

Per-branch keys are a planned change, and this is the single seam for it: look
the branch's credential up, fall back to the env key, return the same shape.
No other file changes. Nothing else may read the env var directly, and the key
is never returned to the browser — that is why the bank list is proxied rather
than fetched client-side.

Env:

```
PAYSTACK_SECRET_KEY=sk_test_xxx     # already used by the marketplace orders module
PAYSTACK_BASE_URL=                  # optional; defaults to https://api.paystack.co
```

## Permissions

New canonical domain `Giving`, actions `view` / `manage` / `admin`, group
Administration, optional. Aliases: `Giving_Options`, `Giving Options`.

Existing access levels have no `Giving` key, so the domain falls back to
`Financials` on both sides — `PERMISSION_KEY_ALIASES` in
`Backend/src/middleWare/authorization.ts` and `DOMAIN_FALLBACKS` in
`Frontend/src/utils/accessControl.ts`. Consequence worth being explicit about:
**until an admin sets `Giving` explicitly, anyone who can manage Financials can
manage giving options.** No data backfill is required, and nobody is locked out
by the deploy. Setting `Giving` on an access level always overrides the fallback,
including setting it to `No_Access`.

## Phase 2 — donor checkout and contributions

Status: implemented. Design rationale and the fuller endpoint-by-endpoint walkthrough
live in `docs/superpowers/specs/2026-08-01-giving-options-phase-2-design.md`; this
section is the settled contract.

### Data model: `givingContribution`

One row per donor payment attempt. Money is stored as **integer minor units**
(pesewas), never a float, for the same reason as everywhere else in finance: binary
floats cannot represent decimal currency exactly.

| Column | Type | Notes |
|---|---|---|
| `id` | `VARCHAR(191)` | cuid |
| `reference` | `VARCHAR(191)` unique | generated by us (`WWM-GIVE-…`), handed to Paystack at init |
| `giving_option_id` | `VARCHAR(191)` | FK → `givingOption`, `ON DELETE RESTRICT` |
| `giving_option_name` | `VARCHAR(191)` | snapshot — renaming the option must not rewrite past receipts |
| `subaccount_code` | `VARCHAR(191)?` | snapshot of where the payment settled; **never returned to clients** (see below) |
| `user_id` | `INT?` | donor, deliberately no FK — a deleted user must not cascade into or block a financial record |
| `donor_name` / `donor_email` | `VARCHAR(191)` | snapshots, `donor_email` is the receipt target |
| `amount` | `INT` | minor units. The donation itself — what the giving option's subaccount receives and what the donor chose to give. **Not** what the card was charged; the fee is added on top of this |
| `fee` | `INT NOT NULL DEFAULT 0` | minor units. The Paystack fee the charge was grossed up by, at the rate configured (`PAYSTACK_FEE_PERCENT` etc.) when the payment started. Kept as its own column so a later rate change never rewrites history |
| `amount_charged` | `INT?` | minor units. `amount + fee` — what the donor's card was actually charged. Null for rows created before this column existed. **This**, not `amount`, is what `amount_paid` must be compared against |
| `amount_paid` | `INT?` | minor units. What **Paystack reported collecting** at settlement. Null until settled; can remain null even after a `success` write (see caveat) |
| `fee_actual` | `INT?` | minor units. The fee Paystack actually took, read from the verify payload. Differs from `fee` only when the configured fee rate has drifted from Paystack's real one — see the drift check below |
| `currency` | `VARCHAR(191)` | defaults `GHS` |
| `status` | `VARCHAR(191)` | `pending` \| `success` \| `failed` \| `abandoned` |
| `channel` | `VARCHAR(191)?` | `card` / `mobile_money`, reported by Paystack at settlement |
| `paid_at` | `DATETIME?` | set at settlement; left null rather than fabricated if Paystack's `paid_at` is missing or unparseable |
| `paystack_response` | `LONGTEXT?` | a whitelisted subset of the verify payload (see below) |
| `receipt_sent_at` | `DATETIME?` | non-null ⇒ receipt email confirmed sent |
| `branch_id` | `INT?` | FK → `branch`, `ON DELETE SET NULL` |

`fee`, `amount_charged` and `fee_actual` were added by migration
`20260802010000_add_giving_fee_columns`, alongside the donor-borne-fee change
described above. Rows created before that migration have `amount_charged` and
`fee_actual` as `NULL` and `fee` as `0` — they predate the gross-up entirely, so
`amount` was the full charge for them.

**Caveat — reconciliation query.** When Paystack's reported `amount` cannot be
parsed as an integer, the settlement code writes `amount_paid = NULL` while still
marking the row `success` (it logs the parse failure instead of blocking
settlement). In MySQL, `<>` never matches `NULL`, so a query of
`amount_paid <> amount_charged` silently skips exactly the rows most worth
finding. The correct query, falling back to `amount` for rows that predate the
gross-up (where `amount_charged` is `NULL`):

```sql
WHERE amount_paid IS NULL
   OR amount_paid <> COALESCE(amount_charged, amount)
```

Anyone using the naive form (comparing against `amount`, or using `<>` without
the `IS NULL` branch) will miss the worst discrepancies without any error — it
just quietly returns fewer rows than it should.

**Fee drift check.** Separately from the reconciliation comparison above,
`settleContribution` also compares `fee_actual` (what Paystack actually took)
against `fee` (what we grossed the charge up by). These can differ even when
`amount_paid` matches `amount_charged` exactly — it means the configured fee
schedule (`PAYSTACK_FEE_PERCENT` / `PAYSTACK_FEE_CAP_MINOR_UNITS` /
`PAYSTACK_FEE_FLAT_MINOR_UNITS`) no longer matches Paystack's real rate, so
every donation since is off by that difference and the subaccount is receiving
slightly less (or more) than the donor chose to give. This is a **different**
problem from a payment mismatch — the charge went through fine, but the split
between fee and donation inside it was computed on a stale rate — and the
backend logs it separately (`"fee schedule drift"`) rather than folding it into
the amount-mismatch log line.

### Endpoints

Base `/givingoption`. All require a bearer token except the webhook.

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/available` | auth only | Non-archived, active, Paystack-synced options visible to the caller's branch or branch-less |
| GET | `/fee-preview?amount=<minor units>` | auth only | Creates nothing. Returns `{ amount, fee, amount_charged }` for a donation amount, so the app can show the donor the total before they commit. Computed server-side so a client copy of the fee formula can't drift from the configured rate |
| POST | `/initialize` | auth only | Starts a payment, returns `{ checkoutUrl, reference, contribution }`. Body: `{ giving_option_id, amount, client? }` — see "Choosing the landing page" below |
| GET | `/verify/:reference` | auth only | On-demand settle; 404 if unknown or belongs to another user |
| GET | `/my-contributions` | auth only | Caller's own history, paginated |
| DELETE | `/my-contributions?reference=<ref>` | auth only | Removes one of the caller's own unsuccessful attempts. See "Retrying and removing a failed attempt" |
| POST | `/retry-payment` | auth only | Starts a fresh attempt at one of the caller's failed attempts. Body: `{ reference, client? }`. Returns the same shape as `/initialize`, with a **new** reference |
| GET | `/contributions` | `Giving:view` | All contributions for finance staff, paginated, filterable by `branch_id`, `giving_option_id`, `status`, `from`, `to` |
| POST | `/paystack-webhook` | public, signature-verified | Only `charge.success` events move money; everything else is acknowledged and ignored |

### Retrying and removing a failed attempt

Both actions are member-facing (`protect` only) and act **exclusively on the
caller's own rows** — a reference belonging to anyone else answers the same 404 as
one that does not exist, so neither endpoint can be used to probe which references
exist.

Both accept only a row whose charge is resolved and collected nothing, i.e.
status `failed` or `abandoned`:

- `success` → **409**. A collected gift is never retried (it would take a second
  payment) and never deleted.
- `pending` → verified against Paystack first, through the same idempotent
  settlement path as the webhook, and then re-read. Whatever that settles the row
  to is what the action is judged on. If the verify call itself fails, the row is
  treated as still pending and the action is refused with 409 — the safe direction
  when we cannot tell whether money moved. This matters most for mobile money: a
  charge sits `pending` while the customer completes a USSD prompt, and deleting
  that row would leave a later webhook settling against a reference no longer in
  the database.

`/retry-payment` mints a **new** reference rather than reusing the old one —
Paystack requires references to be unique per initialization — and reads the
giving option and the amount off the original row, so a retry cannot become a
different gift to a different fund. The failed attempt is left in place, which is
what `DELETE /my-contributions` is for. Clients must therefore verify the
reference the retry **returned**, not the one they sent.

The option's availability is re-checked on retry exactly as on `/initialize`, so
retrying against an option that has since been archived or has drifted out of sync
with Paystack answers 404 rather than taking a payment that cannot be routed.

The delete is a hard delete, guarded by a conditional `deleteMany` on
`status != "success"`: if a webhook settles the row between the status check and
the delete, zero rows match and the caller is told the payment completed rather
than the gift being silently erased.

### Route-ordering hazard

`GET /:id` (phase 1, for a single giving option) is registered last in
`Backend/src/modules/finance/GivingOption/route.ts`. Express matches by method
**and** path, so this only matters for the other `GET` routes: `/available`,
`/verify/:reference`, `/my-contributions` and `/contributions` must all stay
registered **above** it — which they currently are. (`POST /initialize` and
`POST /paystack-webhook` are unaffected regardless of ordering, since `GET /:id`
never matches a `POST` request.) If a `GET` route were moved below `/:id`,
Express would treat e.g. `"available"` as a giving-option id and answer 404
"not found" — a failure that looks like a data problem, not a routing one.

The webhook path has an equivalent hazard one level up the stack, closed the same
way: by deriving both halves from one shared source instead of spelling the path
twice. `Backend/src/libs/paystack/paystackWebhook.ts` exports
`PAYSTACK_WEBHOOK_MOUNT` (`/givingoption`), `PAYSTACK_WEBHOOK_ROUTE`
(`/paystack-webhook`), and `PAYSTACK_WEBHOOK_PATH` (their concatenation). The
router registers the handler at `PAYSTACK_WEBHOOK_ROUTE` (it is already mounted at
`PAYSTACK_WEBHOOK_MOUNT`), and `Backend/index.ts`'s `express.json({ verify })`
hook checks `req.url` against `PAYSTACK_WEBHOOK_PATH` to decide whether to stash
the raw body needed for signature verification. If those two ever used
independently-spelled path strings instead of the shared constants, drift between
them would fail **silently**: the raw body would never be captured, signature
verification would always return `false`, and every genuine webhook would be
rejected with 401 — with nothing in the logs to suggest a routing change was the
cause.

### Webhook status codes

`GivingContributionController.webhook` (`contributionController.ts`) is deliberate
about which HTTP status it returns, because Paystack's retry behaviour depends on
it:

| Situation | Status | Why |
|---|---|---|
| Valid signature, any expected outcome — including an unrecognised reference, an already-settled contribution, or a non-success Paystack status | `200 { message: "Received" }` | These all resolve quietly inside the settlement path without throwing. Answering anything but 200 here would make Paystack retry an event we've already fully handled |
| Invalid signature (missing/oversized body, missing header, length or digest mismatch) | `401 { message: "Invalid signature" }` | Paystack does not retry on 401; that's correct here because a bad signature will never become a good one on retry |
| Paystack key unconfigured (`PaystackConfigError` while verifying) | `500 { message: "Webhook verification unavailable" }` | A `401` would tell Paystack the event was **permanently** rejected and it would stop retrying, losing genuine payments for the whole misconfiguration window. `500` makes it keep retrying until the key is fixed |
| Infrastructure failure while processing (`service.handleWebhook` throws — dropped DB connection, deadlock, timeout) | `500 { message: "Webhook processing failed" }` | Every *expected* outcome returns without throwing, so only genuine infra failures reach this catch. A `200` here would consume Paystack's only retry and strand a paid contribution at `pending` forever |

These are not interchangeable: swapping the unconfigured-key case to 401, for
example, would turn a temporary ops problem into a permanently dropped payment.

### Settlement idempotency and replay

The webhook, the on-demand `GET /verify/:reference`, and the reconciliation cron
(below) all call the same function, `settleContribution` (`contributionService.ts`).
Its write is a single conditional
`updateMany({ where: { reference, status: { not: "success" } }, data: {...} })`,
not a read-check-write. MySQL row-locks for the duration of that statement, so
when any two of these callers race, exactly one of them can flip the row away
from non-success — the loser's `updateMany` matches zero rows and returns without
writing anything or sending a second receipt.

Paystack HMAC signatures in this implementation never expire — there is no
timestamp or nonce checked, only the digest over the raw body. That means a
captured valid webhook payload remains replayable indefinitely, not just during
some short window. The idempotent settle path is what makes that survivable: a
replayed webhook re-verifies, re-enters `settleContribution`, and no-ops on the
status guard.

### Non-terminal Paystack statuses

Paystack reports several non-final transaction statuses, including `ongoing`,
`pending`, `processing`, and `queued`. `ongoing` in particular is what a mobile
money charge reports while the donor is still completing the USSD prompt on their
phone — exactly the state a donor returning from the browser is most likely to be
in. `settleContribution` only treats `failed`, `abandoned`, and `reversed` as
terminal failure statuses (`TERMINAL_FAILURE_STATUSES`); anything else non-success
is left untouched, deliberately, for a later webhook or verify call to resolve.

Marking a non-terminal status as `failed` would tell the donor (or a polling
client) that the payment failed, inviting them to pay again while the original
mobile money charge is still in flight — a real risk of the donor being charged
twice for one intended gift.

### Known limitation: `reversed` is stored as `failed`

When Paystack reports `reversed`, the code writes `status: "failed"` (see the
`paystackStatus === "abandoned" ? "abandoned" : "failed"` branch in
`settleContribution`). This conflates a reversal — money that was collected and
then reversed — with a payment that was never collected at all. It is a known,
recorded decision rather than an oversight: `CONTRIBUTION_STATUSES` (the
vocabulary both clients filter and display against) has no `reversed` member.
Adding one would require a coordinated change across the web dashboard and the
mobile app's status handling — a cross-repo contract change, not a one-line fix —
so it has been deferred rather than done half-way.

### Reconciliation cron

`Backend/src/cron-jobs/givingPaymentReconciliationCron.ts` sweeps contributions
still `pending` after they've had time to resolve normally.

- **Staleness threshold:** rows older than 15 minutes (`STALE_THRESHOLD_MS`) — a
  contribution created seconds ago is a donor still on the Paystack page, and
  asking Paystack about it would waste rate-limit budget on a payment simply in
  progress.
- **Batch size:** up to 100 rows per run (`BATCH_SIZE`), oldest first.
- **Schedule:** every 30 minutes (`*/30 * * * *`), more frequent than the daily
  Hubtel sweep, because the gap being closed involves money Paystack has already
  collected into the church's subaccount.
- **Sequential, not parallel:** each stale row is verified and settled one at a
  time (a `for` loop, not `Promise.all`), to respect Paystack's per-integration
  rate limit and avoid throttling the live `/initialize` calls other donors are
  waiting on right now.
- **Per-row failures don't abort the batch:** each row's verify/settle call is
  wrapped in its own `try`/`catch`; one reference Paystack no longer recognises
  does not stop the rest of the batch from reconciling.
- Skipped entirely if `PAYSTACK_SECRET_KEY` is unset (nothing can be verified
  without it, and this must not spam admin notifications in an environment where
  Paystack giving isn't configured), and guarded against overlapping runs.

The gap it closes: a webhook that never arrives — dropped by a network blip, a
misconfigured URL, or an outage during delivery — leaves a contribution stuck at
`pending` while Paystack has already moved the money into the church's
subaccount. Without this sweep, that money has no record on our side at all.

### What `paystack_response` stores, and what it deliberately doesn't

`paystack_response` stores only a whitelisted subset of the Paystack verify
payload: `id`, `status`, `reference`, `amount`, `currency`, `channel`, `paid_at`,
and `gateway_response` (see `toStorablePayload` in `contributionService.ts`). The
full verify response is not stored, because it also carries customer PII, the
church's own settlement bank details, and `authorization.authorization_code` — a
reusable charge token. None of that has chargeback or reconciliation value, so
none of it is persisted.

For the same reason, `subaccount_code` is never included in any API response
(`CONTRIBUTION_SELECT` in `contributionService.ts` omits it): it's processor
plumbing with no donor-facing value, and there's no reason to hand it to a
client.

## Environment variables

```
PAYSTACK_SECRET_KEY=sk_test_xxx          # phase 1; also required for the reconciliation cron to run
PAYSTACK_BASE_URL=                       # optional; defaults to https://api.paystack.co
PAYSTACK_GIVING_CALLBACK_URL=            # optional; where Paystack redirects the donor after paying
Frontend_URL=                            # fallback for the callback URL if PAYSTACK_GIVING_CALLBACK_URL is unset
RUN_BACKGROUND_JOBS=true                 # set to false/0/no to disable all cron jobs, including this reconciliation sweep
PAYSTACK_FEE_PERCENT=1.95                # optional; the donor-borne fee rate, as a percentage of the donation
PAYSTACK_FEE_CAP_MINOR_UNITS=10000       # optional; GHS 100.00 - Paystack's cap on the domestic fee
PAYSTACK_FEE_FLAT_MINOR_UNITS=0          # optional; a flat fee added on top of the percentage, before the cap is applied
```

The three `PAYSTACK_FEE_*` variables are **configuration, not constants of
nature** (`Backend/src/libs/paystack/paystackFees.ts`). They default to
Paystack's standard published Ghana schedule, but an account with negotiated
rates must override them — otherwise every donation is grossed up by the wrong
amount, and the drift shows up as a `fee_actual` mismatch (see the fee drift
check above) rather than a failed payment.

`PAYSTACK_GIVING_CALLBACK_URL` is resolved entirely server-side
(`resolveCallbackUrl` in `contributionService.ts`), and deliberately so: accepting
a redirect target from the client would make this an open redirect on a payment
flow. If it is unset, the code falls back to `Frontend_URL` and constructs
`${Frontend_URL}/out/giving-complete`; if neither is set, no `callback_url`
is sent to Paystack at all (logged as a warning) and the donor is simply not
redirected back automatically.

**It must not point at `/out/verify-payment/:type`.** That page belongs to the
marketplace flow: it reads the reference from `order_reference` (Paystack sends
`reference` and `trxref`), verifies against the orders endpoint, and calls
`clearCart()`. Sending a donor there showed them "Missing payment reference" and
silently emptied their shopping basket. `/out/giving-complete` exists for giving
and is deliberately inert — it makes no API call, touches no client state, and
only offers the donor a deep link back into the mobile app. Settlement is the
webhook's job, with the app's on-demand verify as a second path; the landing page
is never on the critical path for the money.

For the same reason its deep link is **`wwm-mobile://give`**, not
`wwm-mobile://payment/verify`. The app's `PaymentVerifyScreen` is the marketplace
screen: it verifies against the orders endpoint and calls `clearCart()`. Pointing
the giving landing page at it merely moved the trap from the browser into the
app — a failed order lookup for a reference the orders endpoint has never heard
of. The link's only job is to put the donor back on the Give screen; the money is
settled by the webhook, and by the app's own verify call when the member returns
through the in-app browser.

`RUN_BACKGROUND_JOBS` gates every cron job registered in `Backend/index.ts`,
including the giving reconciliation sweep — not a giving-specific variable, but
the reconciliation cron is the reason it matters for this feature.

### Choosing the landing page: `client`

`POST /initialize` and `POST /retry-payment` both accept an optional `client` of
`"web"` or `"mobile"`, defaulting to `"mobile"`. It is an **enum, not a URL** — the two destinations are
both known to the server, so this stays a closed set and never becomes an open
redirect:

| `client` | Callback URL |
|---|---|
| `"mobile"` (default) | `PAYSTACK_GIVING_CALLBACK_URL`, else `${Frontend_URL}/out/giving-complete` |
| `"web"` | `<origin>/member/giving/complete`, where `<origin>` is the origin of `PAYSTACK_GIVING_CALLBACK_URL` if set, otherwise `Frontend_URL` |

The mobile page is inert and deep-links back into the app. The web page verifies
the reference against `/verify/:reference` and reports the outcome inline, which
is what the member portal's Giving screen sends donors to. An unrecognised value
falls back to `"mobile"` rather than erroring, so a client that predates this
field — or one from a future build — can still take a payment.

### Clients

- **Web dashboard** — `GivingOptionsOverview.tsx` lists the options as cards;
  clicking one opens `GivingOptionDetail.tsx` at
  `/home/finance/giving-options/:id`, which shows the settlement account, the sync
  state, and every transaction routed to that option (`/contributions` filtered by
  `giving_option_id`). `GivingContributions.tsx` is the same table unfiltered.
  Both render `components/ContributionsTable.tsx`, so the mismatch and fee-drift
  badges cannot end up on one page and not the other. The per-page totals are
  computed from the rows on screen and labelled as such — `/contributions` is
  paginated, so a figure called "total" would quietly mean "total of page 1".
- **Member portal (web)** — `/member/giving` (`MemberGiving.tsx`), returning to
  `/member/giving/complete`. History rows with status `failed` / `abandoned` offer
  **Try again** and **Delete**.
- **Mobile** — `GiveScreen`, with `GivingHistoryScreen` for history, where
  `failed` / `abandoned` rows offer the same two actions. A retry opens the new
  checkout URL and verifies the **new** reference the retry returned.
