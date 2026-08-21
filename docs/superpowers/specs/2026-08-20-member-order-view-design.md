# Member Order List + Order Detail Page — Design

Date: 2026-08-20
Status: Approved (pre-implementation)

## Goal

Redesign the Members-panel "My Orders" list and add a real "View Order" detail
page, matching two supplied target screenshots:

1. Orders list — order blocks grouped by order number, each with a header
   (order date, order number, Pay Now / Cancel Order), stacked product rows
   (image, name, variant, qty, price), and a trailing total/status/"View
   Order" link.
2. Order detail — status icon + label, order date/number, Contact Us / Cancel
   Order / Pay Now actions, a horizontal step progress bar, a shipping-info
   box, a product table, and a price breakdown block.

## Decisions (resolved during brainstorming)

| # | Question | Decision |
|---|---|---|
| 1 | Route vs modal for order detail | **Real routed page** at `/member/market/orders/:id`, not a modal. |
| 2 | Price breakdown fields (Subtotal/Shipping/Discount/Rounding/Total) — none exist in the data model | **Only Subtotal (computed) + Order Total (`total_amount`)**. Shipping & Handling / Discount / Rounding rows are dropped entirely — no fabricated numbers. |
| 3 | "Contact Us" button — no support feature exists | `mailto:` link, prefilled subject with the order number. |
| 4 | Support email address | `systemadmin@worldwidewordministries.org` (confirmed by user; not otherwise present in the codebase). |
| 5 | "Cancel Order" authorization — existing `update-delivery-status` endpoint is admin-only (`can_manage_marketplace`) | **New member-scoped Backend endpoint** `PUT /orders/cancel-order`, mirroring the existing `can_retry_order_payment_scoped` owner-or-admin pattern. Not a relaxation of the admin endpoint. |
| 6 | Step progress bar stages — no real shipping/tracking data model exists | **3 stages**: `Submit Order → Waiting for Delivery → Transaction Complete`. No separate "Been Shipped" stage; `delivery_status='shipped'` folds into "Waiting for Delivery". |
| 7 | Shipping-info box content | Always renders "Sorry, there is no shipping information yet" — there is no address/tracking data anywhere in the schema to show instead. Real shipment tracking is out of scope for this change. |

## Scope boundary

The target screenshots are the **member-facing storefront** view (note the
public shop nav bar: All Products / Audio / Power / …). This work touches:

- `src/pages/MembersPage/Pages/MyOrders.tsx` (list — member-facing)
- A new `src/pages/MembersPage/Pages/OrderDetailsPage.tsx` (detail — member-facing)

It explicitly does **not** touch the shared admin/staff order views
(`src/pages/HomePage/pages/MarketPlace/components/Orders/Orders.tsx`,
`MarketOrders.tsx`, `OrdersTableColumns.tsx`), which stay on their current
table/card layout. A new member-only presentational component is added for
the grouped card list rather than reworking the shared `Orders.tsx`, to avoid
collateral changes to the admin table.

## Backend changes

### 1. `findOne` — minor parity fix

`orderService.findOne(id)` currently includes only `items`. Add
`billing_details` to its `include`, matching `updateDeliveryStatus`'s include
shape, so the detail page has billing/customer info available if ever needed.
No route/permission change — `GET /orders/get-order-by-id` is already
protected by `[protect, can_view_orders_scoped]`, which already allows the
order's owner (see `can_view_orders_scoped` in `authorization.ts`).

### 2. New endpoint: `PUT /orders/cancel-order`

- Route: `orderRouter.put("/cancel-order", [protect, permissions.can_cancel_order_scoped], orderController.cancelOrder)`
- New middleware `can_cancel_order_scoped` in `authorization.ts`, copied from
  `can_retry_order_payment_scoped`'s shape:
  - Privileged user with `Marketplace`/`manage` → allowed.
  - Otherwise, look up the order by `id` (numeric) from `req.body.id`; if
    `order.user_id !== context.userId` → 401 "Not authorized to cancel this
    order". Order-not-found is left to the controller to surface.
- New controller `orderController.cancelOrder(req, res)`: reads `{ id }` from
  body, calls `orderService.cancelOrder(id, req.user?.id)`, returns 200 with
  the updated order or a 400 with `error.message` on failure.
- New service `orderService.cancelOrder(orderId, actorUserId?)`:
  - Loads the order; throws `"Order not found"` if missing.
  - Throws `"Only orders awaiting payment can be cancelled"` if
    `payment_status !== 'pending'`.
  - `prisma.orders.update({ where: { id: orderId }, data: { delivery_status: 'cancelled' }, include: { items: true, billing_details: true } })`.
  - Emits an in-app notification via `notificationService.createInAppNotification`
    (same pattern as `updateDeliveryStatus`), type `"order.cancelled"`.
  - Returns the updated order.

No Prisma migration needed — reuses the existing `cancelled` value of the
`delivery_status` enum.

## Frontend changes

### API clients

- `src/utils/api/apiFetch.ts`: add
  `fetchOrderById = (id: string | number): Promise<ApiResponse<...>> =>
  instance.get(\`orders/get-order-by-id\`, { params: { id } })`.
- `src/utils/api/apiPut.ts`: add
  `cancelOrder = (payload: { id: string | number }): Promise<ApiResponse<...>> =>
  instance.put(\`orders/cancel-order\`, payload)`.

### Types

Add an unflattened order-detail shape (distinct from the existing flattened
`IOrders` list-row type) in `src/utils/api/marketPlace/interface.ts`, e.g.:

```ts
export interface IOrderItem {
  id: number;
  name: string;
  image_url: string;
  color: string;
  size: string;
  price_amount: number;
  price_currency: string;
  quantity: number;
  product_type: string;
  product_category: string;
}

export interface IOrderDetail {
  id: number;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  delivery_status: "pending" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  reference: string;
  items: IOrderItem[];
  billing_details?: {
    first_name: string; last_name: string; email: string;
    phone_number: string; country: string;
  } | null;
}
```

### Shared status-mapping helper

New small module (e.g. `src/pages/MembersPage/utils/orderLifecycle.ts`) with
one function used by both the list and the detail page:

```ts
type LifecycleStage = "waiting_payment" | "payment_failed" | "waiting_delivery" | "complete" | "cancelled";

function getOrderLifecycle(order: { payment_status; delivery_status }): {
  stage: LifecycleStage;
  label: string;       // "Waiting for Payment" | "Payment Failed" | "Waiting for Delivery" | "Transaction Complete" | "Order Cancelled"
  canPay: boolean;     // payment_status === 'pending'
  canCancel: boolean;  // payment_status === 'pending'
}
```

Stepper steps (`Submit Order`, `Waiting for Delivery`, `Transaction
Complete`) are derived from `stage`: `Submit Order` always complete;
`Waiting for Delivery` complete once stage is `waiting_delivery` or later;
`Transaction Complete` complete once stage === `complete`. `cancelled` stage
bypasses the stepper and shows a standalone "Order Cancelled" banner instead.

### Routing

- `src/utils/const.ts`: add `orderDetails: "/member/market/orders/:id"` under
  the `member` group.
- `src/routes/appRoutes.tsx`: add a child route under the existing `orders`
  parent (or sibling) rendering `<OrderDetailsPage />` at
  `relativePath.member.orderDetails`.

### Components

- **`MyOrders.tsx`**: replace the current `Modal` + shared `Orders` grid with
  a new grouped list: group the flattened `IOrders[]` rows by `order_number`
  into blocks, render each block with the new card header (date, order
  number, Pay Now/Cancel Order gated by `canPay`/`canCancel`) and stacked
  product rows, ending in a total + status + "View Order" link that
  navigates to `relativePath.member.orderDetails` built with that order's id.
  `handleRetryPayment` (existing Pay Now logic) and a new `handleCancelOrder`
  (calls `cancelOrder`, then refetches) are wired to the header buttons.
- **`OrderDetailsPage.tsx`** (new): reads `:id` from the route, calls
  `fetchOrderById`, renders: status icon/label header with action buttons
  (Contact Us always; Pay Now/Cancel Order gated by `canPay`/`canCancel`),
  the 3-stage progress bar (or cancelled banner), the static shipping-info
  placeholder box, a product table (image/name/variant/qty/price per
  `items[]`), and the price block (Subtotal computed from `items`, Order
  Total from `total_amount`).
- Currency is rendered inline as `₵ {amount.toFixed(2)}` in the new
  components only (matches the screenshots); no app-wide currency formatter
  refactor.

## Out of scope

- Real shipping/tracking data (address capture, carrier, tracking number).
- Backend Shipping/Discount/Rounding fields or migration.
- Changes to the admin/staff order views (`Orders.tsx`, `MarketOrders.tsx`,
  `OrdersTableColumns.tsx`).
- A general in-app "Contact/Support" feature beyond the `mailto:` link.
