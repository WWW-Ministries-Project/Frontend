# Pledge Payments — Backend Contract

Members redeeming their own pledges through Paystack, and the per-pledge
subaccount that makes it possible.

This is deliberately modelled on
[GIVING_OPTIONS_BACKEND_CONTRACT.md](./GIVING_OPTIONS_BACKEND_CONTRACT.md) —
same routing model, same donor-borne fee, same settlement idempotency. Where the
two differ, it is called out. Read the giving contract first; this document
assumes it.

## A subaccount per pledge

Creating a pledge now creates a Paystack subaccount for it, exactly as creating
a giving option does. Payments are **routed, not split**: the subaccount is
created with `percentage_charge: 100`, so the whole redemption settles into that
account.

The payer covers the Paystack fee. `POST /transaction/initialize` is called with
the grossed-up total (`amount + fee`), `transaction_charge: fee`, and
`bearer: "account"` — so the main account receives exactly the fee and
immediately pays it out, netting zero, while the pledge's subaccount keeps the
whole redemption. Naming the subaccount as bearer is rejected by Paystack
("Invalid split transaction values"); it cannot both take 100% and pay the fee
out of it.

The fee schedule is shared with giving (`PAYSTACK_FEE_*`, see the giving
contract). There is no separate pledge fee configuration.

## Data model

### `pledge` — new columns

| Column | Type | Notes |
|---|---|---|
| `currency` | `String` default `"GHS"` | |
| `account_type` | `String` default `"ghipss"` | `"ghipss"` or `"mobile_money"` |
| `settlement_bank` | `String?` | Paystack bank/provider code |
| `bank_name` | `String?` | Human label, kept for display |
| `account_number` | `String?` | Never returned by the read endpoints — see below |
| `account_name` | `String?` | |
| `subaccount_code` | `String? @unique` | |
| `percentage_charge` | `Float` default `100` | Always 100; routing, not splitting |
| `bearer` | `String` default `"subaccount"` | Stored default only; the per-transaction bearer is `"account"` |
| `paystack_synced_at` | `DateTime?` | Null whenever local state and Paystack are known to have drifted |

Every column is nullable or defaulted, because pledges created before this
feature have no settlement account.

**The API treats the account as optional on both create and update**, and the
change is therefore purely additive — a client running a build from before this
field existed can still create and edit pledges. What it cannot do is create one
that takes money: a pledge with no subaccount reports
`can_be_paid_online: false` and no client offers a Pay button for it. Saving the
account later mints the subaccount (self-heal), so nothing is permanently stuck.

"Optional" means **absent entirely**. A payload carrying only some of the fields
is a client bug, not an opt-out, and is rejected with a 400 naming the missing
field — silently dropping a half-filled account would leave the pledge quietly
unpayable while the dashboard showed the details as saved.

The dashboard's own create form requires all of them, so every pledge created
through the UI gets its subaccount.

`GET /pledges/get-pledge` strips `account_number` and returns
`masked_account_number` instead: a pledge detail is readable by anyone with
`Pledges:view`, and a full settlement account number is not something that
audience needs.

Both read endpoints add:

```jsonc
{
  "currency": "GHS",
  "account_type": "ghipss",
  "bank_name": "Fidelity Bank",
  "account_name": "WWM Building Fund",
  "masked_account_number": "••••••3210",
  "is_synced": true,
  // The single flag clients gate a Pay button on.
  "can_be_paid_online": true
}
```

### `pledge_payment` — new table

A processor record, deliberately separate from `pledge_redemption`:

- `pledge_redemption` is the **ledger** entry — `Decimal(15,2)` in **major
  units**, written by staff or by a settlement, and final once written.
- `pledge_payment` is the **processor** record — integer **minor units**, a
  Paystack reference, and a status that is not final until the webhook or a
  verify call settles it.

Only a successful payment produces a redemption. `pledge_payment.redemption_id`
is `UNIQUE`, so settling twice cannot credit the pledger twice.

Key columns mirror `givingContribution`: `reference` (unique), `amount` (the
redemption — what the pledge receives), `fee`, `amount_charged` (what the card
was charged), `amount_paid`, `fee_actual`, `status`, `channel`, `paid_at`,
`paystack_response`, `receipt_sent_at`, `branch_id`.

Snapshots (`pledge_title`, `payer_name`, `payer_email`) are taken at
initialization, so renaming a pledge never rewrites a past receipt.

**Foreign key behaviour, and why:**

| FK | On delete | Reason |
|---|---|---|
| `pledge_id` | `RESTRICT` | Deleting a pledge that has taken money must fail rather than erase the history behind it. `PledgeService.remove` checks for successful payments first and answers 409 with a readable message; it deletes non-successful rows (which hold the same RESTRICT but have no ledger value) before deleting the pledge. |
| `pledger_id` | `SET NULL` (nullable) | Editing a pledge's groups cascades through pledgers. That edit must not be blocked by a settled payment, nor destroy one — the snapshots keep the payment attributable. |
| `redemption_id` | `SET NULL` (nullable, unique) | The ledger entry this payment produced. |

## Endpoints

Base `/pledges`. All require a bearer token.

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/my-pledges` | auth only | Rows where the caller **is** the pledger. Amounts in **major units**. |
| GET | `/payment-fee-preview?amount=<minor units>` | auth only | Creates nothing. `{ amount, fee, amount_charged }`. |
| POST | `/initialize-payment` | auth only | Body `{ pledger_id, amount, client? }`. Returns `{ checkoutUrl, reference, payment }`. |
| GET | `/verify-payment/:reference` | auth only | On-demand settle; 404 if unknown or belongs to another member. |
| GET | `/my-pledge-payments` | auth only | Caller's own history, paginated. |
| GET | `/pledge-payments?pledge_id=<id>` | `Pledges:view` | Every online payment against one pledge, paginated. |

`client` works exactly as it does for giving: an enum of `"web"` / `"mobile"`
(default `"mobile"`) that picks between two **server-known** landing pages,
never a URL.

| `client` | Callback URL |
|---|---|
| `"mobile"` | `PAYSTACK_PLEDGE_CALLBACK_URL`, else `${Frontend_URL}/out/pledge-complete` |
| `"web"` | `${Frontend_URL}/member/pledges/complete` |

`/out/pledge-complete` is inert and deep-links to `wwm-mobile://pledges` —
**not** to `wwm-mobile://payment/verify`. That screen verifies against the orders
endpoint and clears the member's cart; handing it a pledge reference produces a
failed lookup and nothing useful.

### Amount rules on `/initialize-payment`

- Minimum GHS 1.00 (100 minor units); maximum is the `INT` ceiling on the column.
- The amount may **not exceed the outstanding balance** on that pledger's pledge
  (422 with the balance in the message). An overpayment has no meaning in the
  ledger and refunding one is manual work for finance.
- A pledge with no live subaccount, or with `paystack_synced_at` null, answers
  409 rather than taking a payment it cannot route.
- Unknown `pledger_id` and "belongs to someone else" both answer the same 404,
  so the endpoint cannot be used to probe which pledger ids exist.

## One webhook, two settlement paths

There is exactly **one** Paystack webhook receiver in the app:
`POST /givingoption/paystack-webhook`. `Backend/index.ts` retains the raw request
body only for that path (`PAYSTACK_WEBHOOK_PATH`), so a second endpoint could not
verify a signature even if one were registered — it would see `rawBody`
undefined and reject every genuine event.

`Backend/src/libs/paystack/paystackSettlement.ts` therefore dispatches
`charge.success` by **reference prefix**:

| Prefix | Settler |
|---|---|
| `WWM-PLEDGE-` | `settlePledgePayment` |
| anything else (incl. `WWM-GIVE-`) | `settleContribution` |

Prefix, not "try both": each settler logs an unknown reference as a warning, so
fanning every event out to all of them would fill the log with false alarms for
payments belonging to another flow.

**No Paystack dashboard change is needed** — the existing webhook URL keeps
working and now covers pledges too.

## Settlement

Identical in shape to giving:

1. Non-terminal Paystack statuses (`ongoing`, `pending`, `processing`, `queued`)
   are left pending for the webhook to resolve. Only `failed`, `abandoned` and
   `reversed` are written as failures, and even then through a conditional
   update, because Paystack lets a payer retry a failed attempt on the same
   reference.
2. Success is claimed with a single conditional `updateMany` on
   `status != "success"`. MySQL row-locks for the duration, so exactly one of a
   racing webhook and verify call wins; the loser matches zero rows and does
   nothing further. That is what makes the redemption and the receipt happen
   once each.
3. The winner then writes the `pledge_redemption` (`method: "paystack"`, note
   carrying the reference) and links it via the unique `redemption_id`.
4. The receipt email is sent **without awaiting** — a slow SMTP send inside the
   webhook's acknowledgement path would manufacture the very race step 2 just
   resolved.

A mismatch between `amount_paid` and `amount_charged`, or between `fee_actual`
and `fee`, is logged as an error with the values interpolated into the message
(this repo's winston console transport renders only `{ level, message,
timestamp }`, so metadata-only fields are dropped).

If the redemption cannot be written — most plausibly because the pledger was
removed between initialization and settlement — the payment is still recorded as
successful and the failure is logged. The payment row is authoritative about the
charge; `redemption_id` staying null is the signal that the ledger entry is owed.

## Reconciliation cron

`Backend/src/cron-jobs/pledgePaymentReconciliationCron.ts`, every 30 minutes,
mirroring the giving sweep: rows `pending` for more than 15 minutes, capped at
100 per run, verified **sequentially** so a backlog cannot throttle the live
`/initialize-payment` calls payers are waiting on. Skipped entirely when
`PAYSTACK_SECRET_KEY` is unset. Gated by `RUN_BACKGROUND_JOBS` like every other
cron.

## Environment variables

```
PAYSTACK_PLEDGE_CALLBACK_URL=   # optional; where Paystack redirects a MOBILE payer
Frontend_URL=                   # fallback, and the origin for the web landing page
```

Everything else — `PAYSTACK_SECRET_KEY`, `PAYSTACK_BASE_URL`, `PAYSTACK_FEE_*`,
`RUN_BACKGROUND_JOBS` — is shared with giving and documented there.

## Clients

- **Web dashboard** — `Frontend/src/pages/HomePage/pages/FinanceManagement/Pledges/PledgeForm.tsx`
  collects the settlement account (bank list and account-name lookup proxied via
  the giving endpoints `/givingoption/banks` and `/givingoption/resolve-account`).
  `PledgesOverview` shows an "Online payment: Enabled / Unavailable" column.
- **Member portal (web)** — `More → Pledges` → `/member/pledges`
  (`MemberPledges.tsx`), returning to `/member/pledges/complete`.
- **Mobile** — `More → Pledges` → `PledgesScreen`, with `PledgePaymentsScreen`
  for history. Deep links: `wwm-mobile://pledges` and
  `wwm-mobile://pledges/payments`.
