# Marketplace Stock Enforcement — Order-Time Checks, Reservation, Back-in-Stock Notify

Status: design approved, not yet implemented.
Date: 2026-08-03.
Spans three repos: `Backend`, `Frontend` (this repo), `wwm-mobile`.

## Goal

Admins already set per-color/per-size stock on marketplace products
(`stock_managed` flag, `product_colour` + `product_stock` in Prisma). None of
it is enforced anywhere in the member ordering path, in any client, on the
backend. A member can select a zero-stock size, order any quantity, and the
backend accepts the order unconditionally — stock is never checked and never
decremented. This spec closes that gap end to end: reserve stock at order
creation, release it if payment doesn't complete, surface out-of-stock state
in both clients, and notify members who hit an out-of-stock item once it's
restocked.

## Architecture

Backend is the only place stock is checked or mutated — both clients read
stock counts that are already present in the existing product API payload
(`product_colours[].stock[].{size,stock}`) and enforce UI-side, but the
backend is the actual gate. No new read endpoint is needed for stock counts.

Order creation reserves stock (decrements immediately, inside the same
transaction that creates the order), rather than checking-then-decrementing
later at payment success. This matches how the existing Hubtel flow already
works: an order row exists in `pending` state before payment resolves, and
retries (`reinitiatePayment`) reuse the same order/items without re-checking
stock. Reserving at creation means a pending Hubtel checkout genuinely holds
the stock it claims, instead of two members racing for the last unit both
proceeding to payment.

The reservation is released (stock incremented back) when an order's
`payment_status` transitions to `failed` — driven by three paths that already
exist or are being extended, converging on one restock helper:

1. Paystack: `create()` calls `verifyPayment` synchronously; a non-success
   result transitions straight to `failed`.
2. Hubtel webhook/callback → `updateOrderStatusByHubtel`.
3. The daily reconciliation cron (`hubtelPaymentReconciliationCron.ts`,
   already scheduled, `0 0 * * *`) → `checkHubtelTransactionStatus`. This is
   being extended so pending orders older than 48h that Hubtel still won't
   confirm either way are force-transitioned to `failed` (and restocked),
   so reserved stock can't be held indefinitely by an abandoned checkout.

No `prisma.$transaction` exists anywhere in the Backend codebase today. Order
creation is the first use.

## Data model (Backend)

**`order_items`** gains two nullable columns, additive migration:

| Column | Type | Notes |
|---|---|---|
| `product_colour_id` | `Int?` | FK → `product_colour`, resolved at order-creation time from the item's `color` string. Null when the product isn't `stock_managed`. |
| `size_id` | `Int?` | FK → `sizes`, resolved from the item's `size` string. Null when the product isn't `stock_managed`. |

These exist so restock and back-in-stock detection can hit the exact
`product_stock` row later without re-parsing the `color`/`size` display
strings (which are unchanged and still stored as-is for display/history).

**New table `stock_notification_requests`** — one row per member waiting on
a specific color/size to come back:

| Column | Type | Notes |
|---|---|---|
| `id` | `Int` autoincrement | |
| `user_id` | `Int` | who to notify |
| `product_id` | `Int` | denormalized, for display in the notification |
| `product_colour_id` | `Int` | FK → `product_colour` |
| `size_id` | `Int` | FK → `sizes` |
| `created_at` | `DateTime` | |

Unique constraint on `(user_id, product_colour_id, size_id)` — repeated
failed attempts to buy the same out-of-stock combo don't create duplicate
subscriptions. Row is deleted once the notification fires (one-shot).

## Order creation flow (Backend)

`OrderService.create()`:

1. For every item whose `product.stock_managed === "yes"`, resolve
   `product_colour` (`product_id` + `colour === item.color`) → `product_stock`
   row (`product_colour_id` + `size_id` from `sizes.name === item.size`).
2. If any resolved row is missing, or `stock < quantity`, collect it as a
   shortage (`{ name, color, size, requested, available }`). Items on
   non-stock-managed products are never checked — unlimited, as today.
3. Any shortages → **before creating anything**, if the request has a logged
   in `user_id`, upsert a `stock_notification_requests` row per shortage item
   (guest/`out`-flow checkout has no `user_id`, so nothing is created for
   guests — there's no one to notify). Then throw `InsufficientStockError`
   carrying the shortage list. No order, no billing row, no items are
   persisted for a rejected checkout.
4. No shortages → `prisma.$transaction`: create the order + items (stamping
   the resolved `product_colour_id`/`size_id` on each item) + billing details,
   then for each stock-managed item, `update` its `product_stock` row with
   `stock: { decrement: quantity }` guarded by `where: { stock: { gte:
   quantity } }`. If that conditional update matches zero rows (lost a race
   to a concurrent order between step 2's check and this update), throw
   inside the transaction — the whole thing rolls back, order included.
5. Controller maps `InsufficientStockError` to `409` with the shortage list
   in the body; distinct from the generic `500` path.

## Restock (Backend)

A shared helper, `restockOrderItems(orderId)`:

- Loads the order's items that have `product_colour_id`/`size_id` set
  (stock-managed items only — others were never decremented).
- For each, `product_stock.update({ stock: { increment: quantity } })`,
  capturing `before`/`after`.
- For each row where `before <= 0 && after > 0`, calls
  `notifyBackInStock(product_colour_id, size_id)` (see below).

Called from `updateOrderPayment()` when the new status is `"failed"` **and**
the order's previous status was not already `"failed"` — prevents double
restock if a webhook and the reconcile cron both eventually see the same
terminal state.

The cron's 48h force-fail path: `reconcilePendingHubtelPayments` currently
takes the 100 oldest `pending` orders and calls `checkHubtelTransactionStatus`
on each. It's extended so that if Hubtel's real status still normalizes to
`"pending"` **and** the order is older than 48h, the order is transitioned to
`"failed"` directly (same `updateOrderPayment` path, same restock trigger) —
rather than left pending forever. Orders younger than 48h that are still
genuinely in progress at Hubtel are left alone.

Known limitation, accepted: the cron only processes 100 pending orders per
run (existing `limit` param, unchanged). A backlog beyond that isn't part of
this spec.

## Back-in-stock notification (Backend)

`notifyBackInStock(productColourId, sizeId)`:

- Finds all `stock_notification_requests` rows matching that exact colour +
  size.
- For each, calls the existing `notificationService.createInAppNotification`
  (same one used for order payment status — in-app + SMS), with a message
  identifying the product/color/size that's back in stock and a link into
  the marketplace.
- Deletes the matched subscription rows after notifying (one-shot; a member
  who wants to be notified again has to hit the same out-of-stock item once
  more).

Wired into three call sites, all funneling through this one function:

1. `restockOrderItems` (order failure / cron force-fail).
2. The admin product-edit path (`productService.ts`, the existing
   delete-and-recreate-`product_stock` logic used when a product's colors/
   sizes/stock are edited) — before deleting the old rows, snapshot prior
   stock per `(product_colour_id, size_id)`; after recreating, diff against
   the new values and call `notifyBackInStock` wherever a combo went from
   `<= 0` to `> 0`. The colour/size IDs are stable across an edit as long as
   the color/size labels are unchanged (matched by label first, since the
   edit flow deletes and recreates rows by label, not by ID — this is an
   existing constraint of that flow, unchanged by this spec).

The pre-existing separate `updateProductColourStock` endpoint
(`productController.ts`) is unimplemented (`"Method not implemented"`) and
out of scope for this spec — it isn't the path admins currently use to
restock (they use full product edit), so it isn't wired into the notify hook.

## Frontend (web) — `src/pages/HomePage/pages/MarketPlace/` and `src/pages/MembersPage/Pages/`

- `ProductDetails.tsx`: size buttons disabled (visually distinct, not just
  inert) when that size's `stock <= 0`; a color swatch is disabled when every
  size under it is `0`. Quantity stepper's upper bound follows the selected
  size's `stock`.
- `ProductCard.tsx` (admin card, reused by the member `ProductsPage.tsx`
  grid): computed client-side, `out_of_stock = stock_managed === "yes" &&
  sum(product_colours[].stock[].stock) === 0` → an "Out of stock" badge on
  the card. No backend field needed; the data's already in the payload.
- Cart item (`ICartItem`, `cartSlice.ts`) gains a `stock: number` captured
  from the selected size at add-to-cart time.
- `CartTable.tsx`: the size `<Field>` options exclude zero-stock sizes for
  the item's color; the quantity `<Field>` upper bound follows `item.stock`.
- `CheckOutPage.tsx`: `createOrder` failure with `409` renders the specific
  shortage(s) from the response body instead of the generic error message,
  and does not silently retry.

## Mobile — `src/screens.tsx`, `src/ui-components.tsx`, `src/store.ts`, `src/types.ts`

- `ProductDetailsScreen`: same disable logic for `ColorSwatchPicker` and the
  size `Segment`. `QuantityStepper` gets a `max` prop wired from the selected
  variant's `stock` (the prop already exists on the component and is simply
  never passed today — `types.ts:30`'s `ProductOption.stock` field is read
  for the first time here).
- `ProductCard`/grid equivalent: same client-side `out_of_stock` computation
  as web, badge shown.
- `buildCartItem` carries the stock number into the cart item; `CartScreen`'s
  size-edit excludes zero-stock sizes for the chosen color.
- `CheckoutScreen.checkout`'s catch block distinguishes a `409` stock
  rejection from a generic failure and surfaces the specific shortage.

## Error handling

- `InsufficientStockError` (Backend, new) → `409`, body `{ error:
  "insufficient_stock", items: [{ name, color, size, requested, available }]
  }`. Both clients key off `error === "insufficient_stock"` to branch into
  the specific-shortage UI rather than the generic failure toast/alert.
- The conditional-decrement race-loss inside the `$transaction` throws a
  generic error that also rolls up to the same `409` shape (from the
  transaction's perspective it's indistinguishable from "insufficient stock
  at check time" — a concurrent order took it in between).
- Guest/`out`-flow checkout (no `user_id`) still gets the `409` and shortage
  list; it simply never gets a `stock_notification_requests` row, since
  there's no account to notify.

## Out of scope

- Fixing the pre-existing unimplemented `updateProductColourStock` endpoint.
- A "notify me" opt-in button for members who haven't yet attempted to buy an
  out-of-stock item — subscription is created automatically only from a
  rejected checkout attempt.
- Reconciliation backlog beyond the cron's existing 100-order-per-run limit.
- Any change to `payment_status`'s allowed values (`pending`/`success`/
  `failed` stay as-is; the 48h force-fail reuses `"failed"`, it does not add
  an `"expired"` state).
