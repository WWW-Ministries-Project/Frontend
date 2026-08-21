# Member Order List + Order Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Members-panel "My Orders" list into order-number-grouped cards and add a real `/member/market/orders/:id` order-detail page, matching the two target screenshots, plus the minimal Backend support (a member-scoped cancel-order endpoint) needed to back it.

**Architecture:** Backend gets one new member-scoped endpoint (`PUT /orders/cancel-order`, mirroring the existing `can_retry_order_payment_scoped` owner-or-admin pattern) and a one-line `findOne` include fix. Frontend gets two new API client functions, a shared order-lifecycle-label helper, a new 3-stage progress stepper component, a new grouped-order-card component (member list only — the shared admin `Orders.tsx`/`MarketOrders.tsx` table is untouched), a new routed `OrderDetailsPage`, and a rewritten `MyOrders.tsx` that drops its Modal in favor of real navigation.

**Tech Stack:** Express + Prisma (Backend), React + TypeScript + Tailwind + react-router-dom v6 (Frontend). No test runner is configured in either repo — verification is manual (curl for Backend, `npm run lint` / `npx tsc --noEmit` / manual click-through for Frontend), per this repo's CLAUDE.md ("No test runner is configured. Do not add test scripts unless asked.").

**Spec:** `docs/superpowers/specs/2026-08-20-member-order-view-design.md`

---

## Task 1: Backend — `can_cancel_order_scoped` authorization middleware

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/middleware/authorization.ts:1539-1587` (insert right after `can_retry_order_payment_scoped`, before the `// Users/members` comment on line 1587)

- [ ] **Step 1: Add the middleware**

Insert this new method immediately after the closing `};` of `can_retry_order_payment_scoped` (line 1585), before the blank line + `// Users/members` comment (line 1587):

```ts
  // Member-initiated order cancellation. Mirrors
  // can_retry_order_payment_scoped's owner-or-admin pattern: a privileged
  // Marketplace-manage user may cancel any order; otherwise the caller must
  // own the order being cancelled.
  can_cancel_order_scoped = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const errorMessage = "Not authorized to cancel this order";
    const context = await this.getAccessContext(req, res, errorMessage);
    if (!context) return;

    const canManageAll =
      context.isPrivilegedUser &&
      hasActionPermission(context.permissions, "Marketplace", "manage");

    if (canManageAll) {
      return next();
    }

    const rawId = (req as any).body?.id;
    const orderId = toPositiveInt(rawId);

    if (orderId) {
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        select: { user_id: true },
      });

      // Order not found: let the controller's own lookup surface "Order not
      // found" — this guard only blocks a confirmed cross-owner access.
      if (order && order.user_id !== context.userId) {
        return this.unauthorized(res, errorMessage);
      }
    }

    return next();
  };
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit`
Expected: no new errors referencing `authorization.ts`.

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git add src/middleware/authorization.ts
git commit -m "feat(orders): add member-scoped cancel-order authorization

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Backend — `cancelOrder` service method + `findOne` include fix

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/orders/orderService.ts:341-347` (`findOne`)
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/orders/orderService.ts` (insert `cancelOrder` right after `updateDeliveryStatus`)

- [ ] **Step 1: Add `billing_details` to `findOne`'s include**

Current (lines 341-347):
```ts
  async findOne(id: number) {
    const order = await prisma.orders.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new Error("Order not found");
    return order;
  }
```

Change to:
```ts
  async findOne(id: number) {
    const order = await prisma.orders.findUnique({
      where: { id },
      include: { items: true, billing_details: true },
    });

    if (!order) throw new Error("Order not found");
    return order;
  }
```

- [ ] **Step 2: Add `cancelOrder`**

Find `updateDeliveryStatus` (starts at line 546) and its closing `}` (the method ends right before the blank line that precedes the next method). Insert this new method immediately after `updateDeliveryStatus` closes:

```ts
  async cancelOrder(orderId: number, actorUserId?: number | null) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.payment_status !== "pending") {
      throw new Error("Only orders awaiting payment can be cancelled");
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { delivery_status: "cancelled" },
      include: { items: true, billing_details: true },
    });

    const recipientUserId = Number(updatedOrder.user_id);
    if (Number.isInteger(recipientUserId) && recipientUserId > 0) {
      await notificationService.createInAppNotification({
        type: "order.cancelled",
        title: "Order cancelled",
        body: `Order ${updatedOrder.order_number || `#${updatedOrder.id}`} was cancelled.`,
        recipientUserId,
        actorUserId:
          Number.isInteger(Number(actorUserId)) && Number(actorUserId) > 0
            ? Number(actorUserId)
            : null,
        entityType: "ORDER",
        entityId: String(updatedOrder.id),
        actionUrl: "/member/market/orders",
        priority: "MEDIUM",
        dedupeKey: `order:${updatedOrder.id}:cancelled`,
      });
    }

    return updatedOrder;
  }
```

This matches `updateDeliveryStatus`'s notification-call shape exactly (same `notificationService.createInAppNotification` fields, just a `type`/`title`/`body`/`dedupeKey` specific to cancellation).

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit`
Expected: no new errors referencing `orderService.ts`.

- [ ] **Step 4: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git add src/modules/orders/orderService.ts
git commit -m "feat(orders): add cancelOrder service method

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Backend — `cancelOrder` controller

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/orders/orderController.ts` (insert after `updateDeliveryStatus`, before the class's closing `}` on line 281)

- [ ] **Step 1: Add the controller method**

Insert immediately after `updateDeliveryStatus`'s closing `}` (line 280), before the class's closing `}` (line 281):

```ts

  async cancelOrder(req: Request, res: Response) {
    try {
      const { id } = req.body as { id?: number | string };
      const orderId = Number(id);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({ message: "A valid order id is required" });
      }

      const actorUserId = Number((req as any)?.user?.id);
      const updatedOrder = await orderService.cancelOrder(
        orderId,
        Number.isInteger(actorUserId) && actorUserId > 0 ? actorUserId : null,
      );

      return res.status(200).json({
        message: "Order cancelled successfully",
        data: updatedOrder,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to cancel order",
      });
    }
  }
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit`
Expected: no new errors referencing `orderController.ts`.

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git add src/modules/orders/orderController.ts
git commit -m "feat(orders): add cancelOrder controller

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Backend — route + manual verification

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/orders/orderRoutes.ts:659-663` (insert before the existing `/update-delivery-status` route)

- [ ] **Step 1: Add the route**

Insert immediately before the existing `orderRouter.put("/update-delivery-status", ...)` block (line 659):

```ts
/**
 * @swagger
 * /orders/cancel-order:
 *   put:
 *     summary: Cancel an order that is still awaiting payment
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Failed to cancel order
 */
orderRouter.put(
  "/cancel-order",
  [protect, permissions.can_cancel_order_scoped],
  orderController.cancelOrder,
);

```

- [ ] **Step 2: Start the dev server and smoke-test with curl**

Run: `cd /Users/akwaah/Documents/GitHub/Backend && npm run dev` (leave running)

In another shell, log in as a member to get a token, then:

```bash
# Replace TOKEN with a real member JWT and 42 with a real order id owned by
# that member, with payment_status still 'pending'.
curl -i -X PUT http://localhost:8080/orders/cancel-order \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": 42}'
```

Expected: `200` with `{"message":"Order cancelled successfully","data":{...,"delivery_status":"cancelled",...}}`.

Then verify the ownership guard: repeat with a different member's token against the same order id — expect `401` with `"Not authorized to cancel this order"`.

Then verify the business rule: repeat against an order whose `payment_status` is already `success` — expect `400` with `"Only orders awaiting payment can be cancelled"`.

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git add src/modules/orders/orderRoutes.ts
git commit -m "feat(orders): route PUT /orders/cancel-order

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Frontend — order-detail types

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/utils/api/marketPlace/interface.ts` (append after `IOrders`, i.e. after line 149)

- [ ] **Step 1: Add `IOrderItem` and `IOrderDetail`**

Insert after the `IOrders` interface (after line 149, before `export interface IProductSlice`):

```ts
// Unflattened order shape returned by GET /orders/get-order-by-id — one
// order with a real items[] array, as opposed to IOrders which is one
// flattened order+item row (mirrors the Backend's flattenOrders output used
// for order lists).
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

export interface IOrderBillingDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
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
  billing_details?: IOrderBillingDetails | null;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/utils/api/marketPlace/interface.ts
git commit -m "feat(orders): add IOrderItem/IOrderDetail types

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Frontend — API client functions

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/utils/api/apiFetch.ts:31-36` (import) and after line 669 (new function)
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/utils/api/apiPut.ts:29-34` (import) and after line 492 (new function)

- [ ] **Step 1: `fetchOrderById` — update the import**

In `apiFetch.ts`, change (lines 31-36):
```ts
import type {
  IMarket,
  IOrders,
  IProductType,
  IProductTypeResponse,
} from "./marketPlace/interface";
```
to:
```ts
import type {
  IMarket,
  IOrderDetail,
  IOrders,
  IProductType,
  IProductTypeResponse,
} from "./marketPlace/interface";
```

- [ ] **Step 2: `fetchOrderById` — add the function**

In `apiFetch.ts`, immediately after `fetchOrdersByUser` (after line 669, before the `// Fetch staff appointment availability` comment on line 671):

```ts

  fetchOrderById = (
    query?: QueryType
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.fetchFromApi(`orders/get-order-by-id`, query);
  };
```

- [ ] **Step 3: `cancelOrder` — update the import**

In `apiPut.ts`, change (lines 29-34):
```ts
import type {
  IMarket,
  IProductType,
  IProduct,
  IOrders,
} from "./marketPlace/interface";
```
to:
```ts
import type {
  IMarket,
  IProductType,
  IProduct,
  IOrders,
  IOrderDetail,
} from "./marketPlace/interface";
```

- [ ] **Step 4: `cancelOrder` — add the function**

In `apiPut.ts`, immediately after `updateOrderDeliveryStatus` (after its closing `};`, before the `// uodate church attendance` comment):

```ts

  cancelOrder = (
    payload: { id: number | string }
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.apiExecution.updateData("orders/cancel-order", payload);
  };
```

- [ ] **Step 5: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/utils/api/apiFetch.ts src/utils/api/apiPut.ts
git commit -m "feat(orders): add fetchOrderById/cancelOrder API clients

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Frontend — order lifecycle helper

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/MembersPage/utils/orderLifecycle.ts`

- [ ] **Step 1: Write the helper**

```ts
import type { IOrders, IOrderDetail } from "@/utils";

export type OrderLifecycleStage =
  | "waiting_payment"
  | "payment_failed"
  | "waiting_delivery"
  | "complete"
  | "cancelled";

export interface OrderLifecycle {
  stage: OrderLifecycleStage;
  label: string;
  canPay: boolean;
  canCancel: boolean;
}

type LifecycleInput = Pick<
  IOrders | IOrderDetail,
  "payment_status" | "delivery_status"
>;

const STAGE_LABELS: Record<OrderLifecycleStage, string> = {
  waiting_payment: "Waiting for Payment",
  payment_failed: "Payment Failed",
  waiting_delivery: "Waiting for Delivery",
  complete: "Transaction Complete",
  cancelled: "Order Cancelled",
};

/**
 * Single source of truth for order status wording, used by both the
 * member order list (badges) and the order detail page (progress bar).
 * There is no separate "Been Shipped" stage — delivery_status === "shipped"
 * folds into "waiting_delivery" since there is no real shipment-tracking
 * data model to justify a distinct stage.
 */
export function getOrderLifecycle(order: LifecycleInput): OrderLifecycle {
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  const deliveryStatus = String(order.delivery_status || "").toLowerCase();

  let stage: OrderLifecycleStage;
  if (deliveryStatus === "cancelled") {
    stage = "cancelled";
  } else if (paymentStatus === "failed") {
    stage = "payment_failed";
  } else if (paymentStatus === "pending") {
    stage = "waiting_payment";
  } else if (deliveryStatus === "delivered") {
    stage = "complete";
  } else {
    // paid (success), delivery pending or shipped
    stage = "waiting_delivery";
  }

  return {
    stage,
    label: STAGE_LABELS[stage],
    canPay: stage === "waiting_payment",
    canCancel: stage === "waiting_payment",
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/pages/MembersPage/utils/orderLifecycle.ts
git commit -m "feat(orders): add shared order lifecycle/label helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Frontend — 3-stage order progress stepper

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/MembersPage/components/OrderProgressStepper.tsx`

- [ ] **Step 1: Write the component**

Modeled on the existing 5-step `src/pages/HomePage/pages/MarketPlace/components/Orders/OrderStatusTimeline.tsx` (same `cn`/`CheckCircleIcon` visual language), but 3 steps and driven by `OrderLifecycleStage` instead of raw payment/delivery enums:

```tsx
import { CheckCircleIcon } from "@heroicons/react/24/solid";

import { cn } from "@/utils/cn";
import type { OrderLifecycleStage } from "@/pages/MembersPage/utils/orderLifecycle";

const STEPS = ["Submit Order", "Waiting for Delivery", "Transaction Complete"] as const;

interface IProps {
  stage: OrderLifecycleStage;
}

export function OrderProgressStepper({ stage }: IProps) {
  if (stage === "cancelled") {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
        This order was cancelled.
      </p>
    );
  }

  if (stage === "payment_failed") {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
        Payment failed — this order was not completed.
      </p>
    );
  }

  // Step 0 ("Submit Order") is always complete: the order exists.
  // Step 1 ("Waiting for Delivery") completes once payment succeeds.
  // Step 2 ("Transaction Complete") completes once delivery is marked delivered.
  const completedSteps =
    stage === "waiting_payment" ? 0 : stage === "waiting_delivery" ? 1 : 2;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center min-w-max">
        {STEPS.map((step, index) => {
          const isComplete = index <= completedSteps;
          const isCurrent = index === completedSteps + 1;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    isComplete
                      ? "border-primary bg-primary text-white"
                      : isCurrent
                      ? "border-primary text-primary"
                      : "border-lightGray text-primaryGray"
                  )}
                >
                  {isComplete ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-[11px]",
                    isComplete || isCurrent ? "font-medium text-primary" : "text-primaryGray"
                  )}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1",
                    index < completedSteps ? "bg-primary" : "bg-lightGray"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/pages/MembersPage/components/OrderProgressStepper.tsx
git commit -m "feat(orders): add 3-stage order progress stepper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Frontend — routing

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/utils/const.ts:118` (after `orders:`)
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/routes/appRoutes.tsx:70` (import) and the `orders` child route (around line 1174)

- [ ] **Step 1: Add the path constant**

In `const.ts`, change:
```ts
    orders: "/member/market/orders",
```
to:
```ts
    orders: "/member/market/orders",
    orderDetails: "/member/market/orders/:id",
```

- [ ] **Step 2: Import `OrderDetailsPage`**

In `appRoutes.tsx`, immediately after line 70 (`import { MyOrders } from "@/pages/MembersPage/Pages/MyOrders";`):
```ts
import { OrderDetailsPage } from "@/pages/MembersPage/Pages/OrderDetailsPage";
```

- [ ] **Step 3: Add the child route**

In `appRoutes.tsx`, immediately after the existing `orders` child route entry (the block with `path: relativePath.member.orders`, `name: "Orders"`, `element: <MyOrders />`), add a sibling entry:

```ts
          {
            path: relativePath.member.orderDetails,
            name: "Order Details",
            element: <OrderDetailsPage />,
            isPrivate: false,
          },
```

- [ ] **Step 4: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: fails here because `OrderDetailsPage.tsx` doesn't exist yet — that's fine, confirms the import is wired; Task 12 creates the file. Re-run after Task 12 to confirm it passes.

- [ ] **Step 5: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/utils/const.ts src/routes/appRoutes.tsx
git commit -m "feat(orders): add /member/market/orders/:id route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Frontend — grouped order card (member list)

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/MembersPage/components/MemberOrderGroup.tsx`

This renders one order-number block for the member list screenshot: header (date, order number, Pay Now/Cancel Order), stacked product rows, trailing total/status/"View Order" link. It receives the flattened `IOrders[]` rows that share one `order_number` — grouping happens in `MyOrders.tsx` (Task 11).

- [ ] **Step 1: Write the component**

```tsx
import { Link } from "react-router-dom";

import { Button } from "@/components";
import { encodeQuery } from "@/pages/HomePage/utils";
import { relativePath } from "@/utils";
import type { IOrders } from "@/utils";
import { getOrderLifecycle } from "@/pages/MembersPage/utils/orderLifecycle";

const formatMoney = (amount: number) => `₵ ${amount.toFixed(2)}`;

const formatOrderDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

interface IProps {
  orderNumber: string;
  rows: IOrders[];
  onPay: (order: IOrders) => void;
  onCancel: (order: IOrders) => void;
  isProcessing: boolean;
}

export function MemberOrderGroup({
  orderNumber,
  rows,
  onPay,
  onCancel,
  isProcessing,
}: IProps) {
  const first = rows[0];
  const lifecycle = getOrderLifecycle(first);
  const orderTotal = rows.reduce(
    (sum, row) => sum + Number(row.price_amount || 0) * Number(row.quantity || 0),
    0
  );
  const detailHref = `${relativePath.member.market}orders/${encodeQuery(
    String(first.order_id ?? first.id)
  )}`;

  return (
    <div className="border-b border-lightGray py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-lightGray/20 px-4 py-3">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-primaryGray">Order date: </span>
            <span className="font-semibold text-primary">
              {formatOrderDate(first.created_at || first.order_created_at || first.ordered_at)}
            </span>
          </p>
          <p>
            <span className="text-primaryGray">Order NO: </span>
            <span className="font-semibold text-primary">{orderNumber}</span>
          </p>
        </div>

        {(lifecycle.canPay || lifecycle.canCancel) && (
          <div className="flex items-center gap-2">
            {lifecycle.canPay && (
              <Button
                value="Pay Now"
                loading={isProcessing}
                disabled={isProcessing}
                onClick={() => onPay(first)}
              />
            )}
            {lifecycle.canCancel && (
              <Button
                value="Cancel Order"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => onCancel(first)}
              />
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-lightGray/60 px-4">
        {rows.map((row, index) => {
          const isLastRow = index === rows.length - 1;
          return (
            <div key={`${orderNumber}-${row.id}-${index}`} className="flex gap-4 py-4">
              <img
                src={row.image_url}
                alt={row.name}
                className="h-16 w-16 flex-shrink-0 rounded-lg border border-lightGray object-cover"
              />

              <div className="flex-1">
                <p className="font-medium text-primary">{row.name}</p>
                <p className="text-sm text-primaryGray">{row.color}</p>
              </div>

              <div className="w-16 text-center text-sm">
                <p className="text-primaryGray">Qty</p>
                <p className="font-semibold text-primary">X{row.quantity}</p>
              </div>

              <div className="w-24 text-center text-sm">
                <p className="text-primaryGray">Price</p>
                <p className="font-semibold text-primary">
                  {formatMoney(Number(row.price_amount || 0))}
                </p>
              </div>

              <div className="w-40 text-right text-sm">
                {isLastRow && (
                  <>
                    <p className="font-semibold text-primary">Total Price:</p>
                    <p className="text-lg font-bold text-primary">{formatMoney(orderTotal)}</p>
                    <p className="mt-1 text-primaryGray">{lifecycle.label}</p>
                    <Link to={detailHref} className="font-medium text-primary underline">
                      View Order &gt;
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no new errors (aside from the still-missing `OrderDetailsPage` import from Task 9, unrelated to this file).

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/pages/MembersPage/components/MemberOrderGroup.tsx
git commit -m "feat(orders): add grouped order card for member order list

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Frontend — rewrite `MyOrders.tsx`

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/MembersPage/Pages/MyOrders.tsx` (full rewrite)

- [ ] **Step 1: Replace the file contents**

```tsx
import { useCallback, useMemo, useState } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import { PaginationComponent } from "@/pages/HomePage/Components/reusable/PaginationComponent";
import { showNotification } from "@/pages/HomePage/utils";
import { MemberOrderGroup } from "@/pages/MembersPage/components/MemberOrderGroup";
import { api, decodeToken, IOrders, relativePath } from "@/utils";
import EmptyState from "@/components/EmptyState";

const PAGE_SIZE = 10;

export const MyOrders = () => {
  const user = decodeToken();
  const userId = user?.id ? String(user.id) : "";
  const { data, refetch } = useFetch(
    api.fetch.fetchOrdersByUser,
    userId ? { user_id: userId } : undefined,
    !userId
  );
  const [processingOrderKey, setProcessingOrderKey] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(1);

  const memberOrders = useMemo<IOrders[]>(() => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return [...data].sort((a, b) => Number(b.id) - Number(a.id));
    }

    const apiData = (data as { data?: IOrders[] }).data;
    if (Array.isArray(apiData)) {
      return [...apiData].sort((a, b) => Number(b.id) - Number(a.id));
    }

    return [];
  }, [data]);

  const getOrderKey = useCallback((order: IOrders) => {
    return String(
      order.order_number || order.reference || order.order_id || order.id
    );
  }, []);

  // Group the flattened one-row-per-line-item rows by order_number, in
  // descending order (newest order first, preserving memberOrders' sort).
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, IOrders[]>();
    for (const order of memberOrders) {
      const key = getOrderKey(order);
      const existing = groups.get(key);
      if (existing) existing.push(order);
      else groups.set(key, [order]);
    }
    return Array.from(groups.entries()).map(([orderNumber, rows]) => ({
      orderNumber,
      rows,
    }));
  }, [memberOrders, getOrderKey]);

  const pagedGroups = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return groupedOrders.slice(start, start + PAGE_SIZE);
  }, [groupedOrders, page]);

  const handleRetryPayment = useCallback(
    async (selectedOrder: IOrders) => {
      if ((selectedOrder.payment_status || "").toLowerCase() !== "pending") {
        showNotification("This order is already paid.", "error");
        return;
      }

      const orderKey = getOrderKey(selectedOrder);
      setProcessingOrderKey(orderKey);

      const retryOrderId = String(selectedOrder.order_id || selectedOrder.id || "").trim();
      if (!retryOrderId) {
        showNotification("Unable to process payment for this order.", "error");
        setProcessingOrderKey(null);
        return;
      }

      const payload = {
        id: retryOrderId,
        cancellation_url: `${window.location.origin}${relativePath.member.orders}`,
        return_url: `${window.location.origin}${relativePath.member.verify_payment}`,
      };

      try {
        const response = await api.post.retryOrderPayment(payload);
        const checkoutUrl = response?.data?.checkoutUrl;

        if (!checkoutUrl) {
          showNotification("Unable to start payment checkout.", "error");
          return;
        }

        window.location.href = checkoutUrl;
      } catch (error: unknown) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { message?: string } } })
            .response?.data?.message === "string"
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : "Failed to initiate payment.";

        showNotification(message || "Failed to initiate payment.", "error");
      } finally {
        setProcessingOrderKey(null);
      }
    },
    [getOrderKey]
  );

  const handleCancelOrder = useCallback(
    async (selectedOrder: IOrders) => {
      const orderKey = getOrderKey(selectedOrder);
      setProcessingOrderKey(orderKey);

      const orderId = String(selectedOrder.order_id || selectedOrder.id || "").trim();
      if (!orderId) {
        showNotification("Unable to cancel this order.", "error");
        setProcessingOrderKey(null);
        return;
      }

      try {
        await api.put.cancelOrder({ id: orderId });
        showNotification("Order cancelled.", "success");
        await refetch();
      } catch (error: unknown) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { message?: string } } })
            .response?.data?.message === "string"
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : "Failed to cancel order.";

        showNotification(message || "Failed to cancel order.", "error");
      } finally {
        setProcessingOrderKey(null);
      }
    },
    [getOrderKey, refetch]
  );

  if (groupedOrders.length === 0) {
    return <EmptyState scope="page" msg="You have not placed any orders yet" />;
  }

  return (
    <div className="rounded-xl bg-white">
      {pagedGroups.map(({ orderNumber, rows }) => (
        <MemberOrderGroup
          key={orderNumber}
          orderNumber={orderNumber}
          rows={rows}
          onPay={handleRetryPayment}
          onCancel={handleCancelOrder}
          isProcessing={processingOrderKey === orderNumber}
        />
      ))}

      <PaginationComponent
        total={groupedOrders.length}
        take={PAGE_SIZE}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: only the still-missing `OrderDetailsPage` error from Task 9 remains.

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/pages/MembersPage/Pages/MyOrders.tsx
git commit -m "feat(orders): regroup member order list by order number

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Frontend — `OrderDetailsPage`

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/MembersPage/Pages/OrderDetailsPage.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components";
import { OrderProgressStepper } from "@/pages/MembersPage/components/OrderProgressStepper";
import { getOrderLifecycle } from "@/pages/MembersPage/utils/orderLifecycle";
import { decodeQuery, showNotification } from "@/pages/HomePage/utils";
import { api, relativePath } from "@/utils";

const SUPPORT_EMAIL = "systemadmin@worldwidewordministries.org";

const formatMoney = (amount: number) => `₵ ${amount.toFixed(2)}`;

const formatOrderDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export function OrderDetailsPage() {
  const { id } = useParams();
  const orderId = decodeQuery(id || "");
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useFetch(api.fetch.fetchOrderById, { id: orderId }, !orderId);

  const order = response?.data;

  const handlePay = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      const payload = {
        id: String(order.id),
        cancellation_url: `${window.location.origin}${relativePath.member.orders}`,
        return_url: `${window.location.origin}${relativePath.member.verify_payment}`,
      };
      const res = await api.post.retryOrderPayment(payload);
      const checkoutUrl = res?.data?.checkoutUrl;
      if (!checkoutUrl) {
        showNotification("Unable to start payment checkout.", "error");
        return;
      }
      window.location.href = checkoutUrl;
    } catch {
      showNotification("Failed to initiate payment.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      await api.put.cancelOrder({ id: order.id });
      showNotification("Order cancelled.", "success");
      await refetch();
    } catch {
      showNotification("Failed to cancel order.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6" aria-busy="true" aria-live="polite">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        scope="page"
        msg={error ? "Failed to load this order" : "Order not found"}
        actionLabel="Back to orders"
        onAction={() => navigate(relativePath.member.orders)}
      />
    );
  }

  const lifecycle = getOrderLifecycle(order);
  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price_amount || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-lightGray/20 p-4">
        <div>
          <p className="text-lg font-semibold text-primary">{lifecycle.label}</p>
          <p className="text-sm text-primaryGray">
            Order date: <span className="font-medium text-primary">{formatOrderDate(order.created_at)}</span>
          </p>
          <p className="text-sm text-primaryGray">
            Order NO: <span className="font-medium text-primary">{order.order_number}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            value="Contact Us"
            variant="secondary"
            onClick={() => {
              window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                `Order ${order.order_number}`
              )}`;
            }}
          />
          {lifecycle.canCancel && (
            <Button
              value="Cancel Order"
              variant="secondary"
              disabled={isProcessing}
              onClick={handleCancel}
            />
          )}
          {lifecycle.canPay && (
            <Button value="Pay Now" loading={isProcessing} disabled={isProcessing} onClick={handlePay} />
          )}
        </div>
      </div>

      <OrderProgressStepper stage={lifecycle.stage} />

      <div className="rounded-lg bg-lightGray/20 p-4 text-sm text-primaryGray">
        Sorry, there is no shipping information yet
      </div>

      <div className="divide-y divide-lightGray/60 rounded-lg border border-lightGray">
        {order.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex gap-4 p-4">
            <img
              src={item.image_url}
              alt={item.name}
              className="h-16 w-16 flex-shrink-0 rounded-lg border border-lightGray object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-primary">{item.name}</p>
              <p className="text-sm text-primaryGray">{item.color}</p>
            </div>
            <div className="w-16 text-center text-sm">
              <p className="text-primaryGray">Qty</p>
              <p className="font-semibold text-primary">X{item.quantity}</p>
            </div>
            <div className="w-24 text-right text-sm">
              <p className="text-primaryGray">Price</p>
              <p className="font-semibold text-primary">{formatMoney(Number(item.price_amount || 0))}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
        <p className="flex items-center justify-between">
          <span className="text-primaryGray">Subtotal</span>
          <span className="font-medium text-primary">{formatMoney(subtotal)}</span>
        </p>
        <p className="flex items-center justify-between border-t border-lightGray pt-2 text-base">
          <span className="font-semibold text-primary">Order Total</span>
          <span className="font-bold text-primary">{formatMoney(Number(order.total_amount || 0))}</span>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no errors anywhere in the touched files (this resolves the dangling import from Task 9).

- [ ] **Step 3: Commit**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add src/pages/MembersPage/Pages/OrderDetailsPage.tsx
git commit -m "feat(orders): add OrderDetailsPage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npm run lint`
Expected: passes with `--max-warnings 0`. Fix any `no-console`/unused-var findings inline (prefix truly-unused args with `_`).

- [ ] **Step 3: Manual click-through**

Run: `cd /Users/akwaah/Documents/GitHub/Frontend && npm run dev`

- Log in as a member with at least one order in each state (`pending` payment, `success`+`pending` delivery, `success`+`delivered`, and one `cancelled` if available) — use the Backend curl from Task 4 to force a cancelled one if needed.
- Visit `/member/market/orders` — confirm order blocks group correctly by order number, Pay Now/Cancel Order only show for the pending-payment order, and "View Order" navigates to `/member/market/orders/:id`.
- On the detail page, confirm: header label matches lifecycle, stepper shows the right stage (or the cancelled/failed banner), the "no shipping information" box always renders, the product table lists every item with correct qty/price, Subtotal + Order Total compute correctly, and Contact Us opens a mailto to `systemadmin@worldwidewordministries.org`.
- Click Cancel Order on a pending-payment order and confirm it flips to "Order Cancelled" and disappears from the actionable set.

- [ ] **Step 4: Final commit (if manual fixes were needed)**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git add -A
git commit -m "fix(orders): address lint/manual-QA findings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
