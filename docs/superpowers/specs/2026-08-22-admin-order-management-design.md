# Admin Order Management — Edit / Delete / Place-on-behalf

Repos: Backend (`src/modules/orders`), Frontend (`MarketOrders.tsx` admin page). Extends the existing per-market order table — no new global orders page.

## 1. Data model (Backend migration)

`orders` table, two new nullable columns:
- `deleted_at DateTime?` — soft-delete marker. All read queries (`findAll`, `findByUserId`, `findOneByMarketplaceId`, `findOrderByName`, `findOne`) filter `deleted_at: null`.
- `placed_by_staff_id Int?` (FK → `user.id`) — set when an order is created via the admin "place on behalf" endpoint; null for member self-checkout.

## 2. Backend endpoints

| Endpoint | Guard | Purpose |
|---|---|---|
| `PUT /orders/update-order` | `can_manage_marketplace` | Edit billing fields, payment_status, delivery_status, existing line items (qty/color/size/price). No new-line add. |
| `DELETE /orders/delete-order` | `can_delete_marketplace` | Soft-delete one order (`{id}`). |
| `DELETE /orders/bulk-delete-orders` | `can_delete_marketplace` | Soft-delete many (`{ids: number[]}`). Returns `{deleted, skipped}`. |
| `POST /orders/create-for-member` | `can_manage_marketplace` | Admin builds an order for a chosen member. `payment_mode: "manual" \| "gateway"`. |

**Edit-order items**: diff old vs new `{product_colour_id, size_id, quantity}` per line, same stock math as `create()` — decrement extra stock on qty increase (409 `InsufficientStockError` if unavailable), restock delta on decrease, restock-then-reserve on variant change, restock in full on line removal. Item edits rejected (400) once `delivery_status` is `delivered` or `cancelled`. Billing/status fields stay editable regardless.

**Delete**: if `payment_status === "pending"`, restock via existing `restockOrderItems` before setting `deleted_at`. Paid orders are marked deleted without restocking.

**Create-for-member**: wraps existing `create()` (same stock-reservation transaction, same `InsufficientStockError`). `user_id` required (the member). `payment_mode`:
- `"manual"` — skip gateway init, set `payment_status` from `data.manual_status` (`"success"` or `"pending"`), stamp `order_number` + `placed_by_staff_id`.
- `"gateway"` — same as today's member checkout path, returns `checkoutUrl`.

## 3. Permissions (Frontend)

Add missing flag to `CANONICAL_PERMISSION_DOMAINS` in `accessControl.ts` (matches `delete_giving`/`delete_pledges` pattern):
```
delete_marketplace: { domain: "Marketplace", action: "admin" },
```
`manage_marketplace` gates Edit + Place-order UI; `delete_marketplace` gates Delete/Bulk-delete.

## 4. Frontend UI (`MarketOrders.tsx` / `Orders.tsx`)

- **Selection**: checkbox column, state `Set<order_id>` (not row index) — since one order renders as multiple item-rows, checking one row marks every row of that order. "Delete selected (n)" header button → `showDeleteDialog` → bulk-delete endpoint.
- **Row actions**: Edit (pencil) + Delete (trash), keyed by `order_id`.
  - Delete → `showDeleteDialog` → delete endpoint.
  - Edit → `EditOrderModal` (new), prefilled from `orders/get-order-by-id`: billing fields, payment/delivery status selects, editable line items (qty/color/size/price + remove). Submits to `update-order`; 409 shortage surfaces via `showNotification`.
- **"Place order for member"** header button → `CreateOrderForMemberModal` (new):
  1. Member picker (`FormikSelect`, existing members-for-options store, pattern from `StudentForm.tsx`).
  2. Product/variant picker scoped to current market (`product/list-products-by-market`) — product → color → size → qty → "Add line", repeatable, local component state (not the global cart store).
  3. Payment mode: "Mark as paid/COD" (Paid now / Pending) vs "Send payment link" (Paystack/Hubtel — shows returned `checkoutUrl` to copy/share).
  4. Submit → `create-for-member` → close + refetch market's order list.

## 5. New API layer functions (Frontend)

`apiPut.updateOrder`, `apiDelete.deleteOrder`, `apiDelete.bulkDeleteOrders`, `apiPost.createOrderForMember` — alongside existing `updateOrderDeliveryStatus`/`cancelOrder`.

## 6. Error handling

- Stock shortages (edit / create-for-member): same `InsufficientStockError` shape as checkout, `409`, itemized list, shown via `showNotification`.
- Bulk-delete partial failures (`skipped` ids): summary notification, not silent.
- Soft-deleted orders 404 like existing "not found" paths.
