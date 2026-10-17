# Admin Order Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins edit an order (billing/status/existing line items), delete orders (single + bulk, soft-delete), and place an order on behalf of a member — from the existing per-market admin orders table.

**Architecture:** Backend adds four endpoints to the existing `orders` module (`update-order`, `delete-order`, `bulk-delete-orders`, `create-for-member`) plus a soft-delete column and a stock-diff helper reused by edit and manual-payment create. Frontend adds two modals (`EditOrderModal`, `CreateOrderForMemberModal`) wired into the existing `MarketOrders.tsx` admin page, and turns on `TableComponent`'s existing (unused) row-selection/bulk-action support for bulk delete.

**Tech Stack:** Express + Prisma (MySQL) on Backend; React + TypeScript + Formik/Yup + Zustand + `@tanstack/react-table` on Frontend.

**No test runner exists in either repo** (see both `CLAUDE.md`s) — every verification step below uses `npx tsc --noEmit` / `npm run build` / `npm run lint` plus an explicit manual check (curl or a UI click-through), never a fabricated test command.

Spec: `docs/superpowers/specs/2026-08-22-admin-order-management-design.md`

---

## Backend (repo: `/Users/akwaah/Documents/GitHub/Backend`, base branch `main`)

### Task 1: Branch, schema, migration

**Files:**
- Modify: `prisma/schema.prisma:1662-1679` (`orders` model)
- Create: `prisma/migrations/20260822130000_add_order_soft_delete_and_staff_placement/migration.sql`

- [ ] **Step 1: Cut the branch**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git checkout main && git pull --ff-only
git checkout -b feat/admin-order-management
```

- [ ] **Step 2: Add the two columns to the `orders` model**

In `prisma/schema.prisma`, replace:

```prisma
model orders {
  id              Int              @id @default(autoincrement())
  order_number    String?
  total_amount    Float
  user_id         Int?
  payment_status  payment_status   @default(pending)
  delivery_status delivery_status  @default(pending)
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt
  reference       String
  billing_details billing_details?
  items           order_items[]
  user            user?            @relation(fields: [user_id], references: [id])

  @@index([user_id], map: "orders_user_id_fkey")
  @@index([reference], map: "orders_reference_idx")
  @@index([payment_status], map: "orders_payment_status_idx")
}
```

with:

```prisma
model orders {
  id                 Int              @id @default(autoincrement())
  order_number       String?
  total_amount       Float
  user_id            Int?
  payment_status     payment_status   @default(pending)
  delivery_status    delivery_status  @default(pending)
  created_at         DateTime         @default(now())
  updated_at         DateTime         @updatedAt
  reference          String
  deleted_at         DateTime?
  placed_by_staff_id Int?
  billing_details    billing_details?
  items              order_items[]
  user               user?            @relation(fields: [user_id], references: [id])

  @@index([user_id], map: "orders_user_id_fkey")
  @@index([reference], map: "orders_reference_idx")
  @@index([payment_status], map: "orders_payment_status_idx")
  @@index([placed_by_staff_id], map: "orders_placed_by_staff_id_idx")
}
```

(`placed_by_staff_id` is a plain scalar + FK constraint, not a Prisma object relation — it's an audit-only pointer to `user.id`, no need to touch the shared `user` model's relation list.)

- [ ] **Step 3: Write the migration SQL**

Create `prisma/migrations/20260822130000_add_order_soft_delete_and_staff_placement/migration.sql`:

```sql
-- Soft-delete marker + staff-placement audit trail for orders
ALTER TABLE `orders`
  ADD COLUMN `deleted_at` DATETIME(3) NULL,
  ADD COLUMN `placed_by_staff_id` INT NULL;

CREATE INDEX `orders_placed_by_staff_id_idx` ON `orders`(`placed_by_staff_id`);

ALTER TABLE `orders`
  ADD CONSTRAINT `orders_placed_by_staff_id_fkey`
  FOREIGN KEY (`placed_by_staff_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
```

- [ ] **Step 4: Verify schema is valid and Prisma Client regenerates**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client` with no errors — this is what makes `deleted_at`/`placed_by_staff_id` show up on `prisma.orders` types for the next tasks.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add prisma/schema.prisma prisma/migrations/20260822130000_add_order_soft_delete_and_staff_placement
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): add soft-delete and staff-placement columns

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Filter soft-deleted orders out of every read path

**Files:**
- Modify: `src/modules/orders/orderService.ts` — `findOrderByName`, `findAll`, `findOne`, `findByUserId`, `findOneByMarketplaceId`

- [ ] **Step 1: `findOrderByName`**

Replace:

```ts
  async findOrderByName(first_name?: string, last_name?: string) {
    const orders = await prisma.orders.findMany({
      where: {
        billing_details: {
          is: {
            ...(first_name ? { first_name: { contains: first_name } } : {}),
            ...(last_name ? { last_name: { contains: last_name } } : {}),
          },
        },
      },
```

with:

```ts
  async findOrderByName(first_name?: string, last_name?: string) {
    const orders = await prisma.orders.findMany({
      where: {
        deleted_at: null,
        billing_details: {
          is: {
            ...(first_name ? { first_name: { contains: first_name } } : {}),
            ...(last_name ? { last_name: { contains: last_name } } : {}),
          },
        },
      },
```

- [ ] **Step 2: `findAll`**

Replace:

```ts
  async findAll() {
    const orders = await prisma.orders.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
```

with:

```ts
  async findAll() {
    const orders = await prisma.orders.findMany({
      where: { deleted_at: null },
      orderBy: {
        id: "desc",
      },
      include: {
```

- [ ] **Step 3: `findOne`**

Replace:

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

with:

```ts
  async findOne(id: number) {
    const order = await prisma.orders.findFirst({
      where: { id, deleted_at: null },
      include: { items: true, billing_details: true },
    });

    if (!order) throw new Error("Order not found");
    return order;
  }
```

- [ ] **Step 4: `findByUserId`**

Replace:

```ts
  async findByUserId(userId: number) {
    const orders = prisma.orders.findMany({
      orderBy: {
        id: "desc",
      },
      where: { user_id: userId },
      include: {
```

with:

```ts
  async findByUserId(userId: number) {
    const orders = prisma.orders.findMany({
      orderBy: {
        id: "desc",
      },
      where: { user_id: userId, deleted_at: null },
      include: {
```

- [ ] **Step 5: `findOneByMarketplaceId`**

Replace:

```ts
    const orders = await prisma.orders.findMany({
      orderBy: {
        id: "desc",
      },
      where: {
        items: {
          some: {
            market_id: marketplaceId,
          },
        },
      },
      include: {
        items: {
          where: { market_id: marketplaceId },
          include: { product: true, market: true },
        },
        billing_details: true,
      },
    });

    // flattenOrders yields one row per item, by design (columns are
```

with:

```ts
    const orders = await prisma.orders.findMany({
      orderBy: {
        id: "desc",
      },
      where: {
        deleted_at: null,
        items: {
          some: {
            market_id: marketplaceId,
          },
        },
      },
      include: {
        items: {
          where: { market_id: marketplaceId },
          include: { product: true, market: true },
        },
        billing_details: true,
      },
    });

    // flattenOrders yields one row per item, by design (columns are
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/orders/orderService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): exclude soft-deleted orders from all read paths

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Stock-diff helpers (`restockVariant` / `reserveVariant` / `resolveSingleVariant`)

These three private helpers back both the item-edit path (Task 4) and the manual-payment create-for-member path (Task 6). Add them once here.

**Files:**
- Modify: `src/modules/orders/orderService.ts`

- [ ] **Step 1: Add the `Prisma` import**

Replace:

```ts
import { prisma } from "../../Models/context";
import axios from "axios";
```

with:

```ts
import { prisma } from "../../Models/context";
import { Prisma } from "@prisma/client";
import axios from "axios";
```

- [ ] **Step 2: Add the helpers right after `restockOrderItems`**

Find:

```ts
      const afterStock = beforeStock + item.quantity;
      if (beforeStock <= 0 && afterStock > 0) {
        await stockNotificationService.notifyBackInStock(colourId, sizeId);
      }
    }
  }

  private async updateOrderPayment(
```

Replace with:

```ts
      const afterStock = beforeStock + item.quantity;
      if (beforeStock <= 0 && afterStock > 0) {
        await stockNotificationService.notifyBackInStock(colourId, sizeId);
      }
    }
  }

  /**
   * Returns a stock-managed product's variant ids for a given color/size
   * name pair. Used when an edit changes an existing line's color/size —
   * resolveItemStock resolves a whole cart, this resolves one variant.
   */
  private async resolveSingleVariant(
    productId: number,
    colour: string,
    size: string,
  ): Promise<{ productColourId: number; sizeId: number }> {
    const colourRow = await prisma.product_colour.findFirst({
      where: { product_id: productId, colour },
      select: { id: true },
    });
    const sizeRow = await prisma.sizes.findFirst({
      where: { name: size },
      select: { id: true },
    });

    if (!colourRow || !sizeRow) {
      throw new Error(
        `Unknown color/size combination "${colour}/${size}" for this product`,
      );
    }

    return { productColourId: colourRow.id, sizeId: sizeRow.id };
  }

  /** Releases reserved stock back to a variant. No availability guard needed — restocking can't fail. */
  private async restockVariant(
    tx: Prisma.TransactionClient,
    productColourId: number,
    sizeId: number,
    quantity: number,
  ) {
    if (quantity <= 0) return;
    await tx.product_stock.update({
      where: {
        size_id_product_colour_id: {
          size_id: sizeId,
          product_colour_id: productColourId,
        },
      },
      data: { stock: { increment: quantity } },
    });
  }

  /**
   * Reserves stock for a variant, same race-safe updateMany + count guard as
   * create()'s stock reservation. Throws InsufficientStockError if unavailable.
   */
  private async reserveVariant(
    tx: Prisma.TransactionClient,
    productColourId: number,
    sizeId: number,
    quantity: number,
    itemName: string,
  ) {
    if (quantity <= 0) return;
    const decremented = await tx.product_stock.updateMany({
      where: {
        product_colour_id: productColourId,
        size_id: sizeId,
        stock: { gte: quantity },
      },
      data: { stock: { decrement: quantity } },
    });

    if (decremented.count === 0) {
      throw new InsufficientStockError([
        { name: itemName, color: "", size: "", requested: quantity, available: 0 },
      ]);
    }
  }

  private async updateOrderPayment(
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/orders/orderService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): add shared stock-diff helpers for edit/manual-create

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `updateOrder` (billing + status + existing-item edits)

**Files:**
- Modify: `src/modules/orders/orderService.ts`

- [ ] **Step 1: Add the input types and `updateOrder` + `applyItemEdits`**

Find the class-level type block near the top:

```ts
type ResolvedOrderItem = {
  productId: number;
  color: string;
  size: string;
  name: string;
  quantity: number;
  stockManaged: boolean;
  productColourId: number | null;
  sizeId: number | null;
  availableStock: number;
};
```

Replace with:

```ts
type ResolvedOrderItem = {
  productId: number;
  color: string;
  size: string;
  name: string;
  quantity: number;
  stockManaged: boolean;
  productColourId: number | null;
  sizeId: number | null;
  availableStock: number;
};

export type OrderItemEdit = {
  /** order_items.id of the line being changed. */
  id: number;
  quantity: number;
  color: string;
  size: string;
  price_amount: number;
  /** true = delete this line entirely (stock, if managed, is restocked in full). */
  removed?: boolean;
};

export type UpdateOrderInput = {
  id: number;
  billing?: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country: string;
    country_code: string;
  }>;
  payment_status?: "pending" | "success" | "failed";
  delivery_status?: "pending" | "shipped" | "delivered" | "cancelled";
  items?: OrderItemEdit[];
};
```

Now find `findOne` and insert `updateOrder` + `applyItemEdits` right after it:

```ts
  async findOne(id: number) {
    const order = await prisma.orders.findFirst({
      where: { id, deleted_at: null },
      include: { items: true, billing_details: true },
    });

    if (!order) throw new Error("Order not found");
    return order;
  }
```

Replace with:

```ts
  async findOne(id: number) {
    const order = await prisma.orders.findFirst({
      where: { id, deleted_at: null },
      include: { items: true, billing_details: true },
    });

    if (!order) throw new Error("Order not found");
    return order;
  }

  async updateOrder(data: UpdateOrderInput) {
    const order = await prisma.orders.findFirst({
      where: { id: data.id, deleted_at: null },
      include: { items: true, billing_details: true },
    });
    if (!order) throw new Error("Order not found");

    const editingItems = Array.isArray(data.items) && data.items.length > 0;
    if (
      editingItems &&
      ["delivered", "cancelled"].includes(order.delivery_status)
    ) {
      throw new Error(
        "Cannot edit items once delivery status is delivered or cancelled",
      );
    }

    await prisma.$transaction(async (tx) => {
      if (editingItems) {
        await this.applyItemEdits(tx, order.items, data.items!);
      }

      if (data.billing) {
        await tx.billing_details.update({
          where: { order_id: order.id },
          data: {
            ...(data.billing.first_name && {
              first_name: toSentenceCase(data.billing.first_name),
            }),
            ...(data.billing.last_name && {
              last_name: toSentenceCase(data.billing.last_name),
            }),
            ...(data.billing.email && { email: data.billing.email }),
            ...(data.billing.phone_number && {
              phone_number: data.billing.phone_number,
            }),
            ...(data.billing.country && { country: data.billing.country }),
            ...(data.billing.country_code && {
              country_code: data.billing.country_code,
            }),
          },
        });
      }

      if (data.payment_status || data.delivery_status) {
        await tx.orders.update({
          where: { id: order.id },
          data: {
            ...(data.payment_status && { payment_status: data.payment_status }),
            ...(data.delivery_status && {
              delivery_status: data.delivery_status,
            }),
          },
        });
      }
    });

    return prisma.orders.findFirst({
      where: { id: order.id },
      include: { items: true, billing_details: true },
    });
  }

  /**
   * Applies per-line edits inside the caller's transaction: qty deltas
   * reserve/restock the difference, a color/size change restocks the old
   * variant in full and reserves the new one, `removed` restocks in full
   * and deletes the line. Only stock-managed lines (product_colour_id +
   * size_id both set) touch product_stock at all.
   */
  private async applyItemEdits(
    tx: Prisma.TransactionClient,
    existingItems: { id: number; product_id: number | null; product_colour_id: number | null; size_id: number | null; color: string; size: string; quantity: number; name: string }[],
    edits: OrderItemEdit[],
  ) {
    const existingById = new Map(existingItems.map((item) => [item.id, item]));

    for (const edit of edits) {
      const existing = existingById.get(edit.id);
      if (!existing) {
        throw new Error(`Order item ${edit.id} does not belong to this order`);
      }

      const stockManaged =
        existing.product_colour_id != null && existing.size_id != null;
      const variantChanged =
        existing.color !== edit.color || existing.size !== edit.size;

      if (edit.removed) {
        if (stockManaged) {
          await this.restockVariant(
            tx,
            existing.product_colour_id!,
            existing.size_id!,
            existing.quantity,
          );
        }
        await tx.order_items.delete({ where: { id: edit.id } });
        continue;
      }

      if (stockManaged && variantChanged) {
        const resolved = await this.resolveSingleVariant(
          existing.product_id!,
          edit.color,
          edit.size,
        );
        await this.restockVariant(
          tx,
          existing.product_colour_id!,
          existing.size_id!,
          existing.quantity,
        );
        await this.reserveVariant(
          tx,
          resolved.productColourId,
          resolved.sizeId,
          edit.quantity,
          existing.name,
        );
        await tx.order_items.update({
          where: { id: edit.id },
          data: {
            color: edit.color,
            size: edit.size,
            quantity: edit.quantity,
            price_amount: edit.price_amount,
            product_colour_id: resolved.productColourId,
            size_id: resolved.sizeId,
          },
        });
        continue;
      }

      if (stockManaged) {
        const delta = edit.quantity - existing.quantity;
        if (delta > 0) {
          await this.reserveVariant(
            tx,
            existing.product_colour_id!,
            existing.size_id!,
            delta,
            existing.name,
          );
        } else if (delta < 0) {
          await this.restockVariant(
            tx,
            existing.product_colour_id!,
            existing.size_id!,
            -delta,
          );
        }
      }

      await tx.order_items.update({
        where: { id: edit.id },
        data: { quantity: edit.quantity, price_amount: edit.price_amount },
      });
    }
  }
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. If TypeScript complains about the `existingItems` param shape not matching `order.items` (the Prisma-generated `order_items[]` type has more fields than the inline type declares), that's fine — an object with *more* fields still satisfies a narrower inline type; if you see the opposite (a "possibly null" complaint on `product_id`/`product_colour_id`/`size_id`), it means those columns are nullable in the generated type already (as declared in `prisma/schema.prisma`), which the inline type already accounts for with `| null`.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/orders/orderService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): add updateOrder for billing/status/item edits

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `deleteOrder` + `bulkDeleteOrders`

**Files:**
- Modify: `src/modules/orders/orderService.ts`

- [ ] **Step 1: Add both methods after `cancelOrder`**

Find the end of `cancelOrder` (it returns `updatedOrder;` then the class continues with `initializeHubtelTransaction`):

```ts
    return updatedOrder;
  }

  async initializeHubtelTransaction(
```

Replace with:

```ts
    return updatedOrder;
  }

  /**
   * Soft-deletes an order. A pending (unpaid) order releases its reserved
   * stock first, same as cancelOrder — a paid order is left alone since
   * deleting a paid record is a hygiene action, not a cancellation.
   */
  async deleteOrder(orderId: number) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, deleted_at: null },
      select: { id: true, payment_status: true },
    });
    if (!order) throw new Error("Order not found");

    if (order.payment_status === "pending") {
      await this.restockOrderItems(orderId);
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { deleted_at: new Date() },
    });

    return { id: orderId };
  }

  /** Soft-deletes many orders independently — one bad id doesn't block the rest. */
  async bulkDeleteOrders(orderIds: number[]) {
    const results = await Promise.allSettled(
      orderIds.map((id) => this.deleteOrder(id)),
    );

    const deleted: number[] = [];
    const skipped: number[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") deleted.push(orderIds[index]);
      else skipped.push(orderIds[index]);
    });

    return { deleted: deleted.length, skipped };
  }

  async initializeHubtelTransaction(
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/orders/orderService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): add deleteOrder and bulkDeleteOrders (soft delete)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `createForMember`

**Files:**
- Modify: `src/modules/orders/orderService.ts`

- [ ] **Step 1: Add the input type and method**

Find the `retryHubtelPayment` method's opening (right after the `create` method ends):

```ts
  async retryHubtelPayment(
    orderToken: string | null | undefined,
    return_url: string | null,
    cancellation_url: string | null,
  ) {
```

Replace with:

```ts
  export type CreateOrderForMemberInput = {
    user_id: number;
    billing: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      country: string;
      country_code: string;
    };
    items: {
      market_id?: number | string;
      id?: number | string;
      product_id?: number | string;
      name: string;
      price_amount: number;
      price_currency: string;
      quantity: number;
      product_type: string;
      product_category: string;
      image_url: string;
      color: string;
      size: string;
    }[];
    payment_mode: "manual" | "gateway";
    /** Only used when payment_mode is "manual". Defaults to "success". */
    manual_status?: "success" | "pending";
    /** Only used when payment_mode is "gateway". */
    payment_type?: "paystack" | "hubtel";
    return_url?: string | null;
    cancellation_url?: string | null;
    placed_by_staff_id: number;
  };

  async createForMember(data: CreateOrderForMemberInput) {
    if (data.payment_mode === "gateway") {
      const total_amount = data.items.reduce(
        (sum, item) => sum + item.price_amount * item.quantity,
        0,
      );
      const created = await this.create({
        user_id: data.user_id,
        total_amount,
        payment_type: data.payment_type ?? "paystack",
        return_url: data.return_url ?? null,
        cancellation_url: data.cancellation_url ?? null,
        billing: data.billing,
        items: data.items,
      });
      await prisma.orders.update({
        where: { id: created.updated_order.id },
        data: { placed_by_staff_id: data.placed_by_staff_id },
      });
      return created;
    }

    const resolvedItems = await this.resolveItemStock(data.items);
    const shortages = resolvedItems.filter(
      (item) => item.stockManaged && item.availableStock < item.quantity,
    );
    if (shortages.length) {
      throw new InsufficientStockError(
        shortages.map((item) => ({
          name: item.name,
          color: item.color,
          size: item.size,
          requested: item.quantity,
          available: item.availableStock,
        })),
      );
    }

    const total_amount = data.items.reduce(
      (sum, item) => sum + item.price_amount * item.quantity,
      0,
    );
    const clientReference = this.generateReference();
    const manualStatus = data.manual_status ?? "success";

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.orders.create({
        data: {
          user_id: data.user_id,
          total_amount,
          reference: clientReference,
          payment_status: manualStatus,
          placed_by_staff_id: data.placed_by_staff_id,
          items: { create: this.buildItems(data.items, resolvedItems) },
          billing_details: { create: this.buildBilling(data.billing) },
        },
        include: { items: true, billing_details: true },
      });

      for (const item of resolvedItems) {
        if (!item.stockManaged) continue;
        await this.reserveVariant(
          tx,
          item.productColourId!,
          item.sizeId!,
          item.quantity,
          item.name,
        );
      }

      return created;
    });

    const orderNumber = this.generateOrderNumber(order.id);
    return prisma.orders.update({
      where: { id: order.id },
      data: { order_number: orderNumber },
      include: { items: true, billing_details: true },
    });
  }

  async retryHubtelPayment(
    orderToken: string | null | undefined,
    return_url: string | null,
    cancellation_url: string | null,
  ) {
```

- [ ] **Step 2: Fix the stray `export` (TypeScript doesn't allow `export` on a type declared inside a class body)**

The snippet above put `export type CreateOrderForMemberInput = {...}` where a class member goes — that's invalid. Move the type declaration above the class instead. Find:

```ts
export class OrderService {
  async findOrderByName(first_name?: string, last_name?: string) {
```

Replace with:

```ts
export type CreateOrderForMemberInput = {
  user_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country: string;
    country_code: string;
  };
  items: {
    market_id?: number | string;
    id?: number | string;
    product_id?: number | string;
    name: string;
    price_amount: number;
    price_currency: string;
    quantity: number;
    product_type: string;
    product_category: string;
    image_url: string;
    color: string;
    size: string;
  }[];
  payment_mode: "manual" | "gateway";
  /** Only used when payment_mode is "manual". Defaults to "success". */
  manual_status?: "success" | "pending";
  /** Only used when payment_mode is "gateway". */
  payment_type?: "paystack" | "hubtel";
  return_url?: string | null;
  cancellation_url?: string | null;
  placed_by_staff_id: number;
};

export class OrderService {
  async findOrderByName(first_name?: string, last_name?: string) {
```

Then, back in the `createForMember` insertion from Step 1, delete the now-duplicated inline `export type CreateOrderForMemberInput = {...};` block so only the method itself remains before `async retryHubtelPayment`.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/orders/orderService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): add createForMember (manual or gateway payment)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Controller methods

**Files:**
- Modify: `src/modules/orders/orderController.ts`

- [ ] **Step 1: Add the four new controller methods**

Find the end of the class:

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
}
```

Replace with:

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

  async updateOrder(req: Request, res: Response) {
    try {
      const { id, billing, payment_status, delivery_status, items } = req.body;
      const orderId = Number(id);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({ message: "A valid order id is required" });
      }

      const updatedOrder = await orderService.updateOrder({
        id: orderId,
        billing,
        payment_status,
        delivery_status,
        items,
      });

      return res.status(200).json({
        message: "Order updated successfully",
        data: updatedOrder,
      });
    } catch (error: any) {
      const status = error instanceof InsufficientStockError ? 409 : 400;
      return res.status(status).json({
        message: error.message || "Failed to update order",
      });
    }
  }

  async deleteOrder(req: Request, res: Response) {
    try {
      const orderId = Number(req.query.id ?? req.body?.id);
      if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({ message: "A valid order id is required" });
      }

      await orderService.deleteOrder(orderId);
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Failed to delete order",
      });
    }
  }

  async bulkDeleteOrders(req: Request, res: Response) {
    try {
      const rawIds = String(req.query.ids ?? "");
      const orderIds = rawIds
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0);

      if (orderIds.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one valid order id is required" });
      }

      const result = await orderService.bulkDeleteOrders(orderIds);
      return res.status(200).json({
        message: "Orders deleted successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Failed to delete orders",
      });
    }
  }

  async createForMember(req: Request, res: Response) {
    try {
      const actorUserId = Number((req as any)?.user?.id);
      if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
        return res
          .status(400)
          .json({ message: "Unable to identify the staff placing this order" });
      }

      const order = await orderService.createForMember({
        ...req.body,
        placed_by_staff_id: actorUserId,
      });

      return res.status(201).json({
        message: "Order placed successfully",
        data: order,
      });
    } catch (error: any) {
      const status = error instanceof InsufficientStockError ? 409 : 400;
      return res.status(status).json({
        message: error.message || "Failed to place order",
      });
    }
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/orders/orderController.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): add controller methods for edit/delete/create-for-member

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Routes

**Files:**
- Modify: `src/modules/orders/orderRoutes.ts`

- [ ] **Step 1: Add the four routes**

Find the end of the file:

```ts
orderRouter.put(
  "/update-delivery-status",
  [protect, permissions.can_manage_marketplace],
  orderController.updateDeliveryStatus,
);

export default orderRouter;
```

Replace with:

```ts
orderRouter.put(
  "/update-delivery-status",
  [protect, permissions.can_manage_marketplace],
  orderController.updateDeliveryStatus,
);

orderRouter.put(
  "/update-order",
  [protect, permissions.can_manage_marketplace],
  orderController.updateOrder,
);

orderRouter.delete(
  "/delete-order",
  [protect, permissions.can_delete_marketplace],
  orderController.deleteOrder,
);

orderRouter.delete(
  "/bulk-delete-orders",
  [protect, permissions.can_delete_marketplace],
  orderController.bulkDeleteOrders,
);

orderRouter.post(
  "/create-for-member",
  [protect, permissions.can_manage_marketplace],
  orderController.createForMember,
);

export default orderRouter;
```

- [ ] **Step 2: Verify the whole backend builds**

Run: `npm run build`
Expected: `tsc` passes with no errors, `dist/` regenerated.

- [ ] **Step 3: Manual verification against a running dev server**

Run: `npm run dev` in one terminal, then from another terminal (replace `<token>` with a staff bearer token that has `Marketplace: Can_Manage`/`Super_Admin`, and `<order_id>`/`<market_id>` with real ids from your dev DB):

```bash
# Edit: bump quantity on an existing item, change delivery status
curl -X PUT http://localhost:8080/orders/update-order \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"id": <order_id>, "delivery_status": "shipped", "items": [{"id": <order_item_id>, "quantity": 2, "color": "<existing color>", "size": "<existing size>", "price_amount": <existing price>}]}'
# Expected: 200, data.delivery_status === "shipped", the item's quantity updated, product_stock for that variant decremented by the delta.

# Delete: soft-delete it
curl -X DELETE "http://localhost:8080/orders/delete-order?id=<order_id>" \
  -H "Authorization: Bearer <token>"
# Expected: 200. A follow-up GET /orders/get-order-by-id?id=<order_id> now 404s.

# Bulk delete
curl -X DELETE "http://localhost:8080/orders/bulk-delete-orders?ids=<id1>,<id2>" \
  -H "Authorization: Bearer <token>"
# Expected: 200, data.deleted === 2 (or fewer + a skipped list if one id was already gone).

# Create for member, manual payment
curl -X POST http://localhost:8080/orders/create-for-member \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"user_id": <member_user_id>, "payment_mode": "manual", "manual_status": "success", "billing": {"first_name":"Jane","last_name":"Doe","email":"jane@example.com","phone_number":"0555555555","country":"Ghana","country_code":"GH"}, "items": [{"id": <product_id>, "market_id": <market_id>, "name":"Test Shirt","price_amount":50,"price_currency":"GHS","quantity":1,"product_type":"Apparel","product_category":"Shirts","image_url":"https://example.com/x.png","color":"Red","size":"M"}]}'
# Expected: 201, data.payment_status === "success", data.placed_by_staff_id === your staff user id, product_stock for that variant decremented by 1.
```

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/orders/orderRoutes.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(orders): wire routes for edit/delete/bulk-delete/create-for-member

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Push and open the PR**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend push -u origin feat/admin-order-management
gh -C /Users/akwaah/Documents/GitHub/Backend pr create --base main --title "feat(orders): admin edit/delete/place-on-behalf" --body "Adds update-order, delete-order, bulk-delete-orders, create-for-member. Soft-delete via orders.deleted_at. See Frontend PR for the paired UI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Frontend (repo: `/Users/akwaah/Documents/GitHub/Frontend`, base branch `development`)

### Task 9: Branch + types

**Files:**
- Modify: `src/utils/api/marketPlace/interface.ts`

- [ ] **Step 1: Cut the branch**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
git checkout development && git pull --ff-only
git checkout -b feat/admin-order-management
```

- [ ] **Step 2: Extend `IOrderBillingDetails` and `IOrderItem`, add payload types**

Replace:

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

with:

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
  product_id?: number | null;
  product_colour_id?: number | null;
  size_id?: number | null;
  market_id?: number | null;
}

export interface IOrderBillingDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code?: string;
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

export type OrderItemEditPayload = {
  id: number;
  quantity: number;
  color: string;
  size: string;
  price_amount: number;
  removed?: boolean;
};

export interface IUpdateOrderPayload {
  id: number | string;
  billing?: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country: string;
    country_code: string;
  }>;
  payment_status?: PaymentStatus extends string ? "pending" | "success" | "failed" : never;
  delivery_status?: "pending" | "shipped" | "delivered" | "cancelled";
  items?: OrderItemEditPayload[];
}

export interface ICreateOrderForMemberPayload {
  user_id: number | string;
  billing: IUserDetails;
  items: {
    market_id: number | string;
    id: number | string;
    name: string;
    price_amount: number;
    price_currency: string;
    quantity: number;
    product_type: string;
    product_category: string;
    image_url: string;
    color: string;
    size: string;
  }[];
  payment_mode: "manual" | "gateway";
  manual_status?: "success" | "pending";
  payment_type?: "paystack" | "hubtel";
  return_url?: string;
  cancellation_url?: string;
}
```

Note: `IUserDetails` is already declared (non-exported) above in this same file — export it so the new payload type (and the modal component in Task 13) can use it. Find:

```ts
interface IUserDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
}
```

Replace with:

```ts
export interface IUserDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/utils/api/marketPlace/interface.ts
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(orders): add types for order edit/create-for-member payloads

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: API layer functions

**Files:**
- Modify: `src/utils/api/apiPut.ts`
- Modify: `src/utils/api/apiDelete.ts`
- Modify: `src/utils/api/apiPost.ts`

- [ ] **Step 1: `apiPut.updateOrder`**

In `src/utils/api/apiPut.ts`, replace:

```ts
  cancelOrder = (
    payload: { id: number | string }
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.apiExecution.updateData("orders/cancel-order", payload);
  };
```

with:

```ts
  cancelOrder = (
    payload: { id: number | string }
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.apiExecution.updateData("orders/cancel-order", payload);
  };

  updateOrder = (
    payload: IUpdateOrderPayload
  ): Promise<ApiResponse<IOrderDetail>> => {
    return this.apiExecution.updateData("orders/update-order", payload);
  };
```

Add `IUpdateOrderPayload` to the existing import from the marketplace interface file at the top of `apiPut.ts`. Find:

```ts
  IOrders,
  IOrderDetail,
```

Replace with:

```ts
  IOrders,
  IOrderDetail,
  IUpdateOrderPayload,
```

- [ ] **Step 2: `apiDelete.deleteOrder` / `bulkDeleteOrders`**

In `src/utils/api/apiDelete.ts`, replace:

```ts
  clearAllNotifications = (): Promise<ApiResponse<NotificationClearAllPayload>> => {
    return this.apiExecution.deleteData("notifications");
  };
}
```

with:

```ts
  clearAllNotifications = (): Promise<ApiResponse<NotificationClearAllPayload>> => {
    return this.apiExecution.deleteData("notifications");
  };

  deleteOrder = (query: QueryType): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>("orders/delete-order", query);
  };

  /** query.ids is a comma-separated string of order ids, e.g. "12,13,14". */
  bulkDeleteOrders = (
    query: QueryType
  ): Promise<ApiResponse<{ deleted: number; skipped: number[] }>> => {
    return this.deleteFromApi<{ deleted: number; skipped: number[] }>(
      "orders/bulk-delete-orders",
      query
    );
  };
}
```

- [ ] **Step 3: `apiPost.createOrderForMember`**

In `src/utils/api/apiPost.ts`, replace:

```ts
  retryOrderPayment = (
    payload: RetryOrderPaymentPayload
  ): Promise<ApiResponse<CheckOutResponse>> => {
    return this.postToApi("orders/retry-payment", payload);
  };
```

with:

```ts
  retryOrderPayment = (
    payload: RetryOrderPaymentPayload
  ): Promise<ApiResponse<CheckOutResponse>> => {
    return this.postToApi("orders/retry-payment", payload);
  };

  createOrderForMember = (
    payload: ICreateOrderForMemberPayload
  ): Promise<ApiResponse<CheckOutResponse | IOrderDetail>> => {
    return this.postToApi("orders/create-for-member", payload);
  };
```

Add `ICreateOrderForMemberPayload` and `IOrderDetail` to the existing import block at the top of `apiPost.ts` (find the line importing `RetryOrderPaymentPayload` from the marketplace interface file and add the two new names next to it, matching however that import is currently formatted — same pattern as Step 1 above for `apiPut.ts`).

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/utils/api/apiPut.ts src/utils/api/apiDelete.ts src/utils/api/apiPost.ts
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(orders): add API layer functions for edit/delete/create-for-member

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: `EditOrderModal`

**Files:**
- Create: `src/pages/HomePage/pages/MarketPlace/components/Orders/EditOrderModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Field, FieldArray, Form, Formik } from "formik";
import { useMemo } from "react";
import { object, string } from "yup";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelect from "@/components/FormikSelect";
import { Actions } from "@/components/ui/form/Actions";
import type { IOrderDetail, IUpdateOrderPayload } from "@/utils/api/marketPlace/interface";

interface IProps {
  order: IOrderDetail | null;
  loading: boolean;
  onSubmit: (payload: IUpdateOrderPayload) => void;
  onClose: () => void;
}

const PAYMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
];

const DELIVERY_STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

interface IFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
  payment_status: string;
  delivery_status: string;
  items: {
    id: number;
    name: string;
    color: string;
    size: string;
    quantity: number;
    price_amount: number;
    removed: boolean;
  }[];
}

const validationSchema = object().shape({
  first_name: string().trim().required("Required"),
  last_name: string().trim().required("Required"),
  email: string().trim().email("Invalid email").required("Required"),
  phone_number: string().trim().required("Required"),
  country: string().trim().required("Required"),
});

export function EditOrderModal({ order, loading, onSubmit, onClose }: IProps) {
  const itemsLocked =
    order?.delivery_status === "delivered" || order?.delivery_status === "cancelled";

  const initialValues: IFormValues = useMemo(
    () => ({
      first_name: order?.billing_details?.first_name || "",
      last_name: order?.billing_details?.last_name || "",
      email: order?.billing_details?.email || "",
      phone_number: order?.billing_details?.phone_number || "",
      country: order?.billing_details?.country || "",
      country_code: order?.billing_details?.country_code || "",
      payment_status: order?.payment_status || "pending",
      delivery_status: order?.delivery_status || "pending",
      items: (order?.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price_amount: item.price_amount,
        removed: false,
      })),
    }),
    [order]
  );

  if (!order) return null;

  const handleSubmit = (values: IFormValues) => {
    onSubmit({
      id: order.id,
      billing: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_number: values.phone_number,
        country: values.country,
        country_code: values.country_code,
      },
      payment_status: values.payment_status as "pending" | "success" | "failed",
      delivery_status: values.delivery_status as
        | "pending"
        | "shipped"
        | "delivered"
        | "cancelled",
      items: itemsLocked
        ? undefined
        : values.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
            price_amount: item.price_amount,
            removed: item.removed,
          })),
    });
  };

  return (
    <div className="bg-white rounded-lg md:w-[42rem] text-primary space-y-4 overflow-auto">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, handleSubmit: submitForm }) => (
          <Form>
            <div className="bg-primary -mt-3 w-full p-6 text-white">
              <p className="text-2xl font-bold">Edit Order {order.order_number}</p>
            </div>

            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Field component={FormikInputDiv} name="first_name" label="First name *" />
                <Field component={FormikInputDiv} name="last_name" label="Last name *" />
                <Field component={FormikInputDiv} name="email" type="email" label="Email *" />
                <Field component={FormikInputDiv} name="phone_number" label="Phone *" />
                <Field component={FormikInputDiv} name="country" label="Country *" />
                <Field component={FormikInputDiv} name="country_code" label="Country code" />
                <Field
                  component={FormikSelect}
                  name="payment_status"
                  label="Payment status"
                  options={PAYMENT_STATUS_OPTIONS}
                />
                <Field
                  component={FormikSelect}
                  name="delivery_status"
                  label="Delivery status"
                  options={DELIVERY_STATUS_OPTIONS}
                />
              </div>

              <div>
                <p className="mb-2 font-semibold">Items</p>
                {itemsLocked && (
                  <p className="mb-2 text-sm text-gray-500">
                    Items can't be edited once delivery is delivered or cancelled.
                  </p>
                )}
                <FieldArray name="items">
                  {() => (
                    <div className="space-y-3">
                      {values.items.map((item, index) =>
                        item.removed ? null : (
                          <div
                            key={item.id}
                            className="grid grid-cols-6 items-end gap-2 rounded border p-3"
                          >
                            <p className="col-span-2 text-sm font-medium">{item.name}</p>
                            <Field
                              component={FormikInputDiv}
                              name={`items.${index}.color`}
                              label="Color"
                              disabled={itemsLocked}
                            />
                            <Field
                              component={FormikInputDiv}
                              name={`items.${index}.size`}
                              label="Size"
                              disabled={itemsLocked}
                            />
                            <Field
                              component={FormikInputDiv}
                              type="number"
                              name={`items.${index}.quantity`}
                              label="Qty"
                              disabled={itemsLocked}
                            />
                            <Field
                              component={FormikInputDiv}
                              type="number"
                              name={`items.${index}.price_amount`}
                              label="Price"
                              disabled={itemsLocked}
                            />
                            {!itemsLocked && (
                              <Button
                                type="button"
                                value="Remove line"
                                variant="secondary"
                                className="col-span-6 justify-self-start"
                                onClick={() => {
                                  const updated = [...values.items];
                                  updated[index] = { ...updated[index], removed: true };
                                  submitForm();
                                }}
                              />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </FieldArray>
              </div>

              <Actions onCancel={onClose} loading={loading} onSubmit={submitForm} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
```

- [ ] **Step 2: Fix the "Remove line" handler**

The inline `onClick` above calls `submitForm()` right after building `updated` but never applies `updated` to Formik state — that's a bug, not a placeholder to leave in. Replace the whole `!itemsLocked && (...)` block with a version that uses Formik's `setFieldValue` (destructure it from the render-prop args) instead of local-only mutation:

Replace:

```tsx
        {({ values, handleSubmit: submitForm }) => (
```

with:

```tsx
        {({ values, handleSubmit: submitForm, setFieldValue }) => (
```

Replace:

```tsx
                            {!itemsLocked && (
                              <Button
                                type="button"
                                value="Remove line"
                                variant="secondary"
                                className="col-span-6 justify-self-start"
                                onClick={() => {
                                  const updated = [...values.items];
                                  updated[index] = { ...updated[index], removed: true };
                                  submitForm();
                                }}
                              />
                            )}
```

with:

```tsx
                            {!itemsLocked && (
                              <Button
                                type="button"
                                value="Remove line"
                                variant="secondary"
                                className="col-span-6 justify-self-start"
                                onClick={() =>
                                  setFieldValue(`items.${index}.removed`, true)
                                }
                              />
                            )}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (`FieldArray` import from `formik` is used only for the wrapping — fine if lint flags it as replaceable with plain `.map`, but it's not an error.)

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/MarketPlace/components/Orders/EditOrderModal.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(orders): add EditOrderModal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: Wire edit + delete + bulk-delete into `MarketOrders.tsx`

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/Orders/MarketOrders.tsx`
- Modify: `src/pages/HomePage/pages/MarketPlace/components/Orders/Orders.tsx`

- [ ] **Step 1: Thread selection/bulk-action props through `Orders.tsx`**

`Orders.tsx` wraps `TableComponent`, which already supports `enableSelection` / `bulkActions` / `onBulkAction` — just forward them. Replace:

```tsx
interface IProps{
  orders: IOrders[] | undefined;
  tableColumns: ColumnDef<IOrders>[];
  searchCustomer?: boolean
  showExport?: boolean
  defaultMarketStatus?: "active" | "upcoming" | "ended" | "";
  renderOrderAction?: (order: IOrders) => ReactNode;
  headerAction?: ReactNode;
  enableOrderDateFilter?: boolean;
  onRowClick?: (order: IOrders) => void;
}
export const Orders = ({
  orders,
  tableColumns,
  searchCustomer = true,
  showExport,
  defaultMarketStatus = "",
  renderOrderAction,
  headerAction,
  enableOrderDateFilter = false,
  onRowClick,
}: IProps) => {
```

with:

```tsx
interface IProps{
  orders: IOrders[] | undefined;
  tableColumns: ColumnDef<IOrders>[];
  searchCustomer?: boolean
  showExport?: boolean
  defaultMarketStatus?: "active" | "upcoming" | "ended" | "";
  renderOrderAction?: (order: IOrders) => ReactNode;
  headerAction?: ReactNode;
  enableOrderDateFilter?: boolean;
  onRowClick?: (order: IOrders) => void;
  enableBulkDelete?: boolean;
  onBulkDelete?: (orders: IOrders[]) => void;
}
export const Orders = ({
  orders,
  tableColumns,
  searchCustomer = true,
  showExport,
  defaultMarketStatus = "",
  renderOrderAction,
  headerAction,
  enableOrderDateFilter = false,
  onRowClick,
  enableBulkDelete = false,
  onBulkDelete,
}: IProps) => {
```

Then replace the `TableComponent` call:

```tsx
        <TableComponent
          columns={tableColumns}
          data={allOrders || []}
          displayedCount={10}
          className="relative"
          onRowClick={onRowClick}
        />
```

with:

```tsx
        <TableComponent
          columns={tableColumns}
          data={allOrders || []}
          displayedCount={10}
          className="relative"
          onRowClick={onRowClick}
          enableSelection={enableBulkDelete}
          bulkActions={
            enableBulkDelete
              ? [{ label: "Delete selected", value: "delete", variant: "danger" }]
              : []
          }
          onBulkAction={(selectedRows, action) => {
            if (action === "delete") onBulkDelete?.(selectedRows);
          }}
        />
```

- [ ] **Step 2: Verify `Orders.tsx` compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/MarketPlace/components/Orders/Orders.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(orders): thread bulk-selection props through Orders table

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Wire edit/delete/bulk-delete into `MarketOrders.tsx`**

Replace the imports block:

```tsx
import { useFetch } from "@/CustomHooks/useFetch";
import { usePut } from "@/CustomHooks/usePut";
import { Orders } from "./Orders";
import { api, IOrders } from "@/utils";
import { useParams } from "react-router-dom";
import { decodeQuery } from "@/pages/HomePage/utils";
import { getBaseOrderColumns } from "./OrdersTableColumns";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import { showNotification } from "@/pages/HomePage/utils";
```

with:

```tsx
import { useFetch } from "@/CustomHooks/useFetch";
import { usePut } from "@/CustomHooks/usePut";
import { useDelete } from "@/CustomHooks/useDelete";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { Orders } from "./Orders";
import { Modal } from "@/components/Modal";
import { api, IOrders } from "@/utils";
import type { IOrderDetail, IUpdateOrderPayload } from "@/utils/api/marketPlace/interface";
import { useParams } from "react-router-dom";
import { decodeQuery, showDeleteDialog } from "@/pages/HomePage/utils";
import { getBaseOrderColumns } from "./OrdersTableColumns";
import { EditOrderModal } from "./EditOrderModal";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import { showNotification } from "@/pages/HomePage/utils";
```

Replace the state/hooks block at the top of the component:

```tsx
export function MarketOrders() {
  const { id } = useParams();
  const market_id = decodeQuery(String(id));
  const { data, refetch } = useFetch(api.fetch.fetchOrdersByMarket, { market_id });
  const [isReconciling, setIsReconciling] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const {
    data: deliveryStatusResponse,
    error: deliveryStatusError,
    loading: isUpdatingDeliveryStatus,
    updateData: updateDeliveryStatus,
  } = usePut(api.put.updateOrderDeliveryStatus);
```

with:

```tsx
export function MarketOrders() {
  const { id } = useParams();
  const market_id = decodeQuery(String(id));
  const { data, refetch } = useFetch(api.fetch.fetchOrdersByMarket, { market_id });
  const [isReconciling, setIsReconciling] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<IOrderDetail | null>(null);
  const { canAdmin } = useAccessControl();

  const {
    data: deliveryStatusResponse,
    error: deliveryStatusError,
    loading: isUpdatingDeliveryStatus,
    updateData: updateDeliveryStatus,
  } = usePut(api.put.updateOrderDeliveryStatus);

  const { data: orderDetailResponse, refetch: fetchOrderDetail } = useFetch(
    api.fetch.fetchOrderById,
    {},
    true
  );

  const {
    data: updatedOrderResponse,
    error: updateOrderError,
    loading: isUpdatingOrder,
    updateData: submitUpdateOrder,
  } = usePut(api.put.updateOrder);

  const { executeDelete: executeDeleteOrder, success: deleteOrderSuccess } = useDelete(
    api.delete.deleteOrder
  );
  const { executeDelete: executeBulkDeleteOrders, success: bulkDeleteSuccess } = useDelete(
    api.delete.bulkDeleteOrders
  );

  useEffect(() => {
    if (orderDetailResponse?.data) {
      setEditingOrder(orderDetailResponse.data as IOrderDetail);
    }
  }, [orderDetailResponse]);

  useEffect(() => {
    if (!updatedOrderResponse) return;
    showNotification("Order updated successfully", "success");
    setEditingOrder(null);
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedOrderResponse]);

  useEffect(() => {
    if (!updateOrderError) return;
    showNotification(updateOrderError.message || "Unable to update order", "error");
  }, [updateOrderError]);

  useEffect(() => {
    if (!deleteOrderSuccess) return;
    showNotification("Order deleted successfully", "success");
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteOrderSuccess]);

  useEffect(() => {
    if (!bulkDeleteSuccess) return;
    showNotification("Selected orders deleted successfully", "success");
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkDeleteSuccess]);

  const handleEditOrder = (order: IOrders) => {
    const orderId = order.order_id ?? order.id;
    if (!orderId) return;
    fetchOrderDetail({ id: orderId });
  };

  const handleUpdateOrder = (payload: IUpdateOrderPayload) => {
    submitUpdateOrder(payload);
  };

  const handleDeleteOrder = (order: IOrders) => {
    const orderId = order.order_id ?? order.id;
    if (!orderId) return;
    showDeleteDialog({ id: orderId, name: order.order_number }, async (id) => {
      await executeDeleteOrder({ id });
    });
  };

  const handleBulkDeleteOrders = (selected: IOrders[]) => {
    const orderIds = Array.from(
      new Set(selected.map((order) => String(order.order_id ?? order.id)).filter(Boolean))
    );
    if (orderIds.length === 0) return;
    showDeleteDialog(
      { id: orderIds.join(","), name: `${orderIds.length} order(s)` },
      async (ids) => {
        await executeBulkDeleteOrders({ ids });
      }
    );
  };
```

- [ ] **Step 5: Add Edit/Delete action buttons to the table columns**

Replace the `tableColumns` block:

```tsx
      {
        header: "Update Delivery",
        cell: ({ row }) => {
          const order = row.original;
          const orderId = String(order.order_id ?? order.id ?? "");
          const isThisRowUpdating =
            isUpdatingDeliveryStatus && updatingOrderId === orderId;

          return (
            <select
              className="border rounded px-2 py-1 text-xs capitalize disabled:opacity-50"
              value={order.delivery_status || "pending"}
              disabled={isThisRowUpdating}
              onChange={(event) =>
                handleDeliveryStatusChange(
                  order,
                  event.target.value as IOrders["delivery_status"]
                )
              }
            >
              {DELIVERY_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>
          );
        },
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdatingDeliveryStatus, updatingOrderId]);
```

with:

```tsx
      {
        header: "Update Delivery",
        cell: ({ row }) => {
          const order = row.original;
          const orderId = String(order.order_id ?? order.id ?? "");
          const isThisRowUpdating =
            isUpdatingDeliveryStatus && updatingOrderId === orderId;

          return (
            <select
              className="border rounded px-2 py-1 text-xs capitalize disabled:opacity-50"
              value={order.delivery_status || "pending"}
              disabled={isThisRowUpdating}
              onChange={(event) =>
                handleDeliveryStatusChange(
                  order,
                  event.target.value as IOrders["delivery_status"]
                )
              }
            >
              {DELIVERY_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button value="Edit" variant="secondary" onClick={() => handleEditOrder(row.original)} />
            <Button
              value="Delete"
              variant="secondary"
              onClick={() => handleDeleteOrder(row.original)}
            />
          </div>
        ),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdatingDeliveryStatus, updatingOrderId]);
```

- [ ] **Step 6: Render `Orders` with bulk-delete wired up, and mount `EditOrderModal`**

Replace:

```tsx
  return (
    <div className="mb-10">
      <Orders
        orders={data?.data || []}
        tableColumns={tableColumns}
        showExport
        enableOrderDateFilter
        headerAction={
          <Button
            value="Reconcile Payments"
            variant="secondary"
            loading={isReconciling}
            disabled={isReconciling}
            onClick={handleReconcilePendingPayments}
          />
        }
      />
    </div>
  );
}
```

with:

```tsx
  return (
    <div className="mb-10">
      <Orders
        orders={data?.data || []}
        tableColumns={tableColumns}
        showExport
        enableOrderDateFilter
        enableBulkDelete={canAdmin("Marketplace")}
        onBulkDelete={handleBulkDeleteOrders}
        headerAction={
          <Button
            value="Reconcile Payments"
            variant="secondary"
            loading={isReconciling}
            disabled={isReconciling}
            onClick={handleReconcilePendingPayments}
          />
        }
      />

      <Modal open={Boolean(editingOrder)} onClose={() => setEditingOrder(null)}>
        <EditOrderModal
          order={editingOrder}
          loading={isUpdatingOrder}
          onSubmit={handleUpdateOrder}
          onClose={() => setEditingOrder(null)}
        />
      </Modal>
    </div>
  );
}
```

- [ ] **Step 7: Verify it compiles and lints**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors, no warnings (`--max-warnings 0`).

- [ ] **Step 8: Manual click-through**

Run: `npm run dev`, log in as a user with `Marketplace: Can_Manage` (or `Super_Admin`), open a market's orders page.
- Click "Edit" on a row → modal opens prefilled with that order's billing/status/items. Change delivery status to "Shipped", submit → notification "Order updated successfully", row reflects new status.
- Click "Delete" on a row → confirm dialog → row disappears from the list, notification "Order deleted successfully".
- Check two rows' checkboxes, click "Delete selected" in the blue bulk-action bar → confirm dialog → both rows disappear, notification "Selected orders deleted successfully".
- Log in as a user with only `Marketplace: Can_View` → confirm the "Delete selected" bulk action no longer appears (gated by `canAdmin("Marketplace")`), and the per-row "Delete"/"Edit" buttons render disabled (`Button`'s built-in label-regex gating).

- [ ] **Step 9: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/MarketPlace/components/Orders/MarketOrders.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(orders): wire edit/delete/bulk-delete into MarketOrders

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 13: `CreateOrderForMemberModal`

**Files:**
- Create: `src/pages/HomePage/pages/MarketPlace/components/Orders/CreateOrderForMemberModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Field, Form, Formik } from "formik";
import { useMemo, useState } from "react";
import { object, string } from "yup";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelect from "@/components/FormikSelect";
import { Actions } from "@/components/ui/form/Actions";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import type {
  ICreateOrderForMemberPayload,
  IProductTypeResponse,
} from "@/utils/api/marketPlace/interface";

interface IProps {
  marketId: string | number;
  loading: boolean;
  checkoutUrl?: string | null;
  onSubmit: (payload: ICreateOrderForMemberPayload) => void;
  onClose: () => void;
}

interface ILine {
  product: IProductTypeResponse;
  color: string;
  size: string;
  quantity: number;
  availableStock: number;
}

interface IFormValues {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
  payment_mode: "manual" | "gateway";
  manual_status: "success" | "pending";
  payment_type: "paystack" | "hubtel";
}

const initialValues: IFormValues = {
  user_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  country: "",
  country_code: "",
  payment_mode: "manual",
  manual_status: "success",
  payment_type: "paystack",
};

const validationSchema = object().shape({
  user_id: string().required("Required"),
  first_name: string().trim().required("Required"),
  last_name: string().trim().required("Required"),
  email: string().trim().email("Invalid email").required("Required"),
  phone_number: string().trim().required("Required"),
  country: string().trim().required("Required"),
});

export function CreateOrderForMemberModal({
  marketId,
  loading,
  checkoutUrl,
  onSubmit,
  onClose,
}: IProps) {
  const membersOptions = useStore((state) => state.membersOptions);
  const { data: productsResponse } = useFetch(api.fetch.fetchProductsByMarket, {
    market_id: marketId,
  });
  const products = productsResponse?.data || [];

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<ILine[]>([]);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === selectedProductId),
    [products, selectedProductId]
  );
  const colorOptions = useMemo(
    () => (selectedProduct?.product_colours || []).map((c) => ({ label: c.colour, value: c.colour })),
    [selectedProduct]
  );
  const selectedColourRow = useMemo(
    () => selectedProduct?.product_colours.find((c) => c.colour === selectedColor),
    [selectedProduct, selectedColor]
  );
  const sizeOptions = useMemo(
    () =>
      (selectedColourRow?.stock || []).map((s) => ({
        label: `${s.size} (${s.stock} in stock)`,
        value: s.size,
      })),
    [selectedColourRow]
  );

  const handleAddLine = () => {
    const availableStock =
      selectedColourRow?.stock?.find((s) => s.size === selectedSize)?.stock;
    if (!selectedProduct || !selectedColor || !selectedSize || quantity <= 0) return;

    setLines((prev) => [
      ...prev,
      {
        product: selectedProduct,
        color: selectedColor,
        size: selectedSize,
        quantity,
        availableStock: Number(availableStock ?? Infinity),
      },
    ]);
    setSelectedProductId("");
    setSelectedColor("");
    setSelectedSize("");
    setQuantity(1);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
  };

  const handleFormSubmit = (values: IFormValues) => {
    if (lines.length === 0) return;

    onSubmit({
      user_id: values.user_id,
      billing: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone_number: values.phone_number,
        country: values.country,
        country_code: values.country_code,
      },
      items: lines.map((line) => ({
        market_id: marketId,
        id: line.product.id as number | string,
        name: line.product.name,
        price_amount: Number(line.product.price_amount),
        price_currency: line.product.price_currency,
        quantity: line.quantity,
        product_type: line.product.product_type?.name || "",
        product_category: line.product.product_category?.name || "",
        image_url:
          (line.product.product_colours.find((c) => c.colour === line.color)
            ?.image_url as string) || "",
        color: line.color,
        size: line.size,
      })),
      payment_mode: values.payment_mode,
      ...(values.payment_mode === "manual"
        ? { manual_status: values.manual_status }
        : {
            payment_type: values.payment_type,
            return_url: `${window.location.origin}/homepage/marketplace`,
            cancellation_url: `${window.location.origin}/homepage/marketplace`,
          }),
    });
  };

  return (
    <div className="bg-white rounded-lg md:w-[42rem] text-primary space-y-4 overflow-auto">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize
      >
        {({ values, handleSubmit: submitForm }) => (
          <Form>
            <div className="bg-primary -mt-3 w-full p-6 text-white">
              <p className="text-2xl font-bold">Place order for member</p>
            </div>

            <div className="space-y-4 px-6 py-4">
              <Field
                component={FormikSelect}
                options={membersOptions}
                name="user_id"
                label="Select a member *"
                placeholder="Select a member"
                searchable
                searchPlaceholder="Search members..."
              />

              <div className="grid grid-cols-2 gap-4">
                <Field component={FormikInputDiv} name="first_name" label="First name *" />
                <Field component={FormikInputDiv} name="last_name" label="Last name *" />
                <Field component={FormikInputDiv} name="email" type="email" label="Email *" />
                <Field component={FormikInputDiv} name="phone_number" label="Phone *" />
                <Field component={FormikInputDiv} name="country" label="Country *" />
                <Field component={FormikInputDiv} name="country_code" label="Country code" />
              </div>

              <div className="rounded border p-3">
                <p className="mb-2 font-semibold">Add product</p>
                <div className="grid grid-cols-4 gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSelectedColor("");
                      setSelectedSize("");
                    }}
                  >
                    <option value="">Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={String(product.id)}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedColor}
                    onChange={(e) => {
                      setSelectedColor(e.target.value);
                      setSelectedSize("");
                    }}
                    disabled={!selectedProduct}
                  >
                    <option value="">Color</option>
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={!selectedColor}
                  >
                    <option value="">Size</option>
                    {sizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="border rounded px-2 py-1 text-sm"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <Button
                  type="button"
                  value="Add line"
                  variant="secondary"
                  className="mt-2"
                  onClick={handleAddLine}
                  disabled={!selectedProduct || !selectedColor || !selectedSize}
                />

                {lines.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {lines.map((line, index) => (
                      <div
                        key={`${line.product.id}-${line.color}-${line.size}-${index}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {line.product.name} — {line.color}/{line.size} × {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="text-red-600"
                          onClick={() => handleRemoveLine(index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded border p-3">
                <p className="mb-2 font-semibold">Payment</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Field type="radio" name="payment_mode" value="manual" />
                    Mark as paid / COD
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Field type="radio" name="payment_mode" value="gateway" />
                    Send payment link
                  </label>
                </div>

                {values.payment_mode === "manual" ? (
                  <Field
                    component={FormikSelect}
                    name="manual_status"
                    label="Status"
                    options={[
                      { label: "Paid now", value: "success" },
                      { label: "Pending (cash on delivery)", value: "pending" },
                    ]}
                  />
                ) : (
                  <Field
                    component={FormikSelect}
                    name="payment_type"
                    label="Gateway"
                    options={[
                      { label: "Paystack", value: "paystack" },
                      { label: "Hubtel", value: "hubtel" },
                    ]}
                  />
                )}
              </div>

              {checkoutUrl && (
                <div className="rounded border border-green-300 bg-green-50 p-3 text-sm">
                  <p className="mb-1 font-semibold">Checkout link ready — share it with the member:</p>
                  <input
                    readOnly
                    className="w-full border rounded px-2 py-1"
                    value={checkoutUrl}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </div>
              )}

              <Actions onCancel={onClose} loading={loading} onSubmit={submitForm} />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/MarketPlace/components/Orders/CreateOrderForMemberModal.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(orders): add CreateOrderForMemberModal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 14: Wire "Place order for member" into `MarketOrders.tsx`

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/Orders/MarketOrders.tsx`

- [ ] **Step 1: Add imports and state**

Replace:

```tsx
import { EditOrderModal } from "./EditOrderModal";
import { useEffect, useMemo, useState } from "react";
```

with:

```tsx
import { EditOrderModal } from "./EditOrderModal";
import { CreateOrderForMemberModal } from "./CreateOrderForMemberModal";
import { usePost } from "@/CustomHooks/usePost";
import type { ICreateOrderForMemberPayload } from "@/utils/api/marketPlace/interface";
import { useEffect, useMemo, useState } from "react";
```

Replace:

```tsx
  const [editingOrder, setEditingOrder] = useState<IOrderDetail | null>(null);
  const { canAdmin } = useAccessControl();
```

with:

```tsx
  const [editingOrder, setEditingOrder] = useState<IOrderDetail | null>(null);
  const [showCreateForMember, setShowCreateForMember] = useState(false);
  const { canAdmin, canManage } = useAccessControl();

  const {
    data: createdOrderResponse,
    error: createOrderError,
    loading: isCreatingOrder,
    postData: submitCreateOrderForMember,
  } = usePost(api.post.createOrderForMember);
```

- [ ] **Step 2: Handle the create-for-member response**

Add, right after the `bulkDeleteSuccess` effect block from Task 12:

```tsx
  useEffect(() => {
    if (!createdOrderResponse) return;
    const hasCheckoutUrl = "checkoutUrl" in createdOrderResponse.data;
    if (!hasCheckoutUrl) {
      showNotification("Order placed successfully", "success");
      setShowCreateForMember(false);
    }
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrderResponse]);

  useEffect(() => {
    if (!createOrderError) return;
    showNotification(createOrderError.message || "Unable to place order", "error");
  }, [createOrderError]);

  const handleCreateOrderForMember = (payload: ICreateOrderForMemberPayload) => {
    submitCreateOrderForMember(payload);
  };
```

- [ ] **Step 3: Add the header button and mount the modal**

Replace:

```tsx
        headerAction={
          <Button
            value="Reconcile Payments"
            variant="secondary"
            loading={isReconciling}
            disabled={isReconciling}
            onClick={handleReconcilePendingPayments}
          />
        }
      />

      <Modal open={Boolean(editingOrder)} onClose={() => setEditingOrder(null)}>
        <EditOrderModal
          order={editingOrder}
          loading={isUpdatingOrder}
          onSubmit={handleUpdateOrder}
          onClose={() => setEditingOrder(null)}
        />
      </Modal>
    </div>
  );
}
```

with:

```tsx
        headerAction={
          <div className="flex gap-2">
            <Button
              value="Reconcile Payments"
              variant="secondary"
              loading={isReconciling}
              disabled={isReconciling}
              onClick={handleReconcilePendingPayments}
            />
            {canManage("Marketplace") && (
              <Button
                value="Place order for member"
                variant="primary"
                onClick={() => setShowCreateForMember(true)}
              />
            )}
          </div>
        }
      />

      <Modal open={Boolean(editingOrder)} onClose={() => setEditingOrder(null)}>
        <EditOrderModal
          order={editingOrder}
          loading={isUpdatingOrder}
          onSubmit={handleUpdateOrder}
          onClose={() => setEditingOrder(null)}
        />
      </Modal>

      <Modal open={showCreateForMember} onClose={() => setShowCreateForMember(false)}>
        <CreateOrderForMemberModal
          marketId={market_id}
          loading={isCreatingOrder}
          checkoutUrl={
            createdOrderResponse && "checkoutUrl" in createdOrderResponse.data
              ? createdOrderResponse.data.checkoutUrl
              : null
          }
          onSubmit={handleCreateOrderForMember}
          onClose={() => setShowCreateForMember(false)}
        />
      </Modal>
    </div>
  );
}
```

Note `canAdmin` is unused if you removed it — it isn't: it still gates `enableBulkDelete` from Task 12. Leave both destructured.

- [ ] **Step 4: Verify it compiles and lints**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no errors, no warnings.

- [ ] **Step 5: Manual click-through**

Run: `npm run dev`, open a market's orders page as a `Marketplace: Can_Manage` user.
- Click "Place order for member" → pick a member from the searchable select → fill billing fields → add one product line (product → color → size → qty → "Add line") → leave "Mark as paid / COD" selected with "Paid now" → submit.
- Expected: notification "Order placed successfully", modal closes, new order appears at the top of the table with `payment_status` "success".
- Repeat, this time selecting "Send payment link" / Paystack → submit.
- Expected: modal stays open, shows the returned checkout URL in a copyable field; table still refreshes with the new (pending) order in the background.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/MarketPlace/components/Orders/MarketOrders.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(orders): wire place-order-for-member into MarketOrders

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Push and open the PR**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend push -u origin feat/admin-order-management
gh -C /Users/akwaah/Documents/GitHub/Frontend pr create --base development --title "feat(orders): admin edit/delete/place-on-behalf" --body "Adds EditOrderModal, delete + bulk-delete (soft), CreateOrderForMemberModal to the admin MarketOrders page. Pairs with the Backend PR adding update-order/delete-order/bulk-delete-orders/create-for-member.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Self-review notes

- **Spec coverage:** §1 data model → Task 1. §2 endpoints/stock-diff/delete/create-for-member → Tasks 2–8. §3 permissions → confirmed no-op beyond the `canAdmin("Marketplace")` gate on the bulk-action array (Task 12 Step 6); documented correction already applied to the spec. §4 UI (selection, row actions, EditOrderModal, CreateOrderForMemberModal) → Tasks 11–14. §5 API layer → Task 10. §6 error handling (409 shortages, bulk partial failures, 404 on soft-deleted) → covered in Tasks 4/5/6 (service), 7 (controller status codes), and surfaced via existing `showNotification` wiring in Tasks 12/14.
- **Placeholder scan:** no TBD/TODO; the one intentionally-flagged "bug" in Task 11 Step 1 is fixed in Step 2 of that same task, not left dangling.
- **Type consistency:** `OrderItemEdit`/`UpdateOrderInput` (Backend service) ↔ `OrderItemEditPayload`/`IUpdateOrderPayload` (Frontend) carry matching field names (`id`, `quantity`, `color`, `size`, `price_amount`, `removed`). `CreateOrderForMemberInput` (Backend) ↔ `ICreateOrderForMemberPayload` (Frontend) match on `payment_mode`, `manual_status`, `payment_type`, `billing`, `items`. `deleteOrder`/`bulkDeleteOrders` query shapes (`id`, `ids` comma-string) match between `orderController.ts` and `apiDelete.ts`.
