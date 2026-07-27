# Giving Options — Backend Contract

Status: implemented (frontend + backend), phase 1 of 2.

Phase 1 is configuration only: church admins define giving options, and each one
gets a Paystack subaccount that payments will later be routed to. Phase 2 (donor
checkout, webhooks, contribution records) is not built yet, but the fields it
needs are already persisted.

## Routing, not splitting

Every giving option routes **100%** of its payments to its own settlement
account. That is encoded as:

- subaccount `percentage_charge` = `100`
- stored `bearer` = `"subaccount"` — at transaction-init time, phase 2 must send
  `bearer: "subaccount"` so the Paystack fee is deducted from the giving option's
  share rather than from a main account that receives nothing.

There is deliberately **no percentage field in the UI**. Nothing is split.

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

## Phase 2 hooks (not built)

What phase 2 needs that already exists: `subaccount_code`, `bearer`,
`percentage_charge`, `currency`, `is_active`/`archived_at`. What it still needs:
a transaction table keyed by `giving_option_id`, a webhook route with signature
verification, and `POST /transaction/initialize` passing
`subaccount: <subaccount_code>` and `bearer: "subaccount"`.

Only non-archived options may be offered at checkout.
