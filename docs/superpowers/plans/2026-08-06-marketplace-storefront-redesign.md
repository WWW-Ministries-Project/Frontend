# Marketplace Storefront Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Parallelism note:** Tasks are grouped into two phases. Within a phase, tasks touch disjoint files and have no dependencies on each other — they can be dispatched to multiple subagents concurrently. Phase 2 tasks depend on specific Phase 1 tasks (noted per task) and must not start until those land. See "Execution Plan" at the end of this document.

**Goal:** Redesign the member/guest marketplace storefront (browse home, product detail, cart, checkout, order history, payment verification) into a cohesive, polished e-commerce experience, plus a light visual pass on the equivalent admin screens — using only existing data/API, no backend changes.

**Architecture:** Two new small shared primitives (`Skeleton`, `OrderStatusTimeline`) land first alongside independent visual restyles (product card, cart drawer, verify-payment screen, admin cards/badges) and the checkout consolidation. A second phase then rebuilds the browse homepage and product detail page (which consume the restyled product card + skeleton), redesigns "My Orders" (which consumes the new status timeline), and retires the now-redundant standalone cart page/route (which depends on the checkout page already supporting inline cart editing, and on the cart drawer no longer linking to it).

**Tech Stack:** React, TypeScript, Formik + Yup, Zustand (`cartSlice`), TanStack Table (via `GridComponent`/`TableComponent`), Tailwind, Heroicons.

**No test runner exists in this repo** (per `CLAUDE.md`) — verification per task is `npx tsc --noEmit` + `npm run lint -- --max-warnings 0` (or targeted `npx eslint <files> --max-warnings 0`), plus a manual-QA note, not automated tests.

**Spec:** `docs/superpowers/specs/2026-08-06-marketplace-storefront-redesign-design.md`

---

## Phase 1 (7 tasks — dispatch concurrently, no interdependencies)

### Task 1: `Skeleton` shared loading primitive

**Files:**
- Create: `src/components/Skeleton.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create the component**

```tsx
import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * Generic pulsing placeholder block. Compose multiple instances to build
 * loading states for cards, lists, and detail pages instead of hand-rolling
 * `animate-pulse` divs inline in each screen.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 2: Export it from the components barrel**

Find (`src/components/index.ts`):

```ts
export * from "./ProfilePicture";
export * from "./Button";
```

Replace with:

```ts
export * from "./ProfilePicture";
export * from "./Button";
export * from "./Skeleton";
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/components/Skeleton.tsx src/components/index.ts --max-warnings 0`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/Skeleton.tsx src/components/index.ts
git commit -m "feat: add shared Skeleton loading primitive"
```

---

### Task 2: `OrderStatusTimeline` shared component

**Files:**
- Create: `src/pages/HomePage/pages/MarketPlace/components/Orders/OrderStatusTimeline.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { CheckCircleIcon } from "@heroicons/react/24/solid";

import { cn } from "@/utils/cn";
import type { IOrders, PaymentStatus } from "@/utils";

const STEPS = ["Ordered", "Paid", "Preparing", "Shipped", "Delivered"] as const;

interface IProps {
  paymentStatus: PaymentStatus;
  deliveryStatus?: IOrders["delivery_status"];
}

/**
 * Maps the existing payment_status/delivery_status enums onto a 5-step
 * visual timeline. Introduces no new statuses — purely a presentation of
 * data that already exists on IOrders.
 */
export function OrderStatusTimeline({ paymentStatus, deliveryStatus }: IProps) {
  const isPaid = paymentStatus === "success" || paymentStatus === "delivered";
  const isFailed = paymentStatus === "failed";
  const isCancelled = deliveryStatus === "cancelled";

  const completedSteps = (() => {
    if (!isPaid) return 0; // only "Ordered" is complete
    if (isCancelled) return 1; // "Ordered" + "Paid" complete, then cancelled
    switch (deliveryStatus) {
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      case "pending":
      default:
        return 1; // paid; "Preparing" is the current/active step
    }
  })();

  if (isFailed) {
    return (
      <p className="text-sm font-medium text-red-600">
        Payment failed — this order was not completed.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const isComplete = index <= completedSteps;
          const isCurrent = index === completedSteps + 1 && !isCancelled;
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
                    isComplete || isCurrent
                      ? "font-medium text-primary"
                      : "text-primaryGray"
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
      {isCancelled && (
        <p className="text-sm font-medium text-red-600">
          This order was cancelled after payment.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/HomePage/pages/MarketPlace/components/Orders/OrderStatusTimeline.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/Orders/OrderStatusTimeline.tsx
git commit -m "feat: add OrderStatusTimeline component"
```

---

### Task 3: Restyle `ProductCard` (minimal style)

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cards/ProductCard.tsx`

- [ ] **Step 1: Replace the whole file**

Approved direction: minimal card — image, category label, name, price, colour swatches. No stock-urgency badge, no per-card market label, no CTA button — the whole card is clickable (approved mockup had no button; out-of-stock still needs a visible signal, kept as a small overlay label).

Find the entire current file content:

```tsx
import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";
import { ProductChip } from "../chips/ProductChip";
import { Button } from "@/components";

interface IProps {
  product: IProductTypeResponse;
  handleViewProduct: (id: string) => void;
}

const isOutOfStock = (product: IProductTypeResponse) => {
  if (product.stock_managed !== "yes") return false;
  const colours = product.product_colours ?? [];
  if (!colours.length) return false;
  return colours.every((colour) => {
    const stock = colour.stock ?? [];
    return stock.length > 0 && stock.every((s) => Number(s.stock) <= 0);
  });
};

export const ProductCard = ({ product, handleViewProduct }: IProps) => {
  const outOfStock = isOutOfStock(product);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className=" bg-[#D9D9D9] relative">
        <img
          src={`${product?.product_colours?.[0]?.image_url}`}
          alt={`${product.name} product image`}
          className="w-full object-cover h-56 p-4"
        />
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            Out of stock
          </span>
        )}
        <div className="flex justify-between px-4 pt-2 pb-4">
          <ProductChip section="type" text={product.product_type?.name} />
          <ProductChip
            section="category"
            text={product.product_category?.name}
          />
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex flex-col gap-2 text-[#404040]">
          <h2 className="font-semibold text-sm line-clamp-1">{product.name}</h2>
          <p className="text-lg font-bold ">
            {product.price_currency || "GHC"}{" "}
            {Number(product.price_amount).toFixed(2)}
          </p>
        </div>
        <div className="w-full">
          <Button
            value="View Product"
            className="w-full"
            onClick={() => handleViewProduct(`${product.id}`)}
          />
        </div>
      </div>
    </div>
  );
};
```

Replace with:

```tsx
import type { IProductTypeResponse } from "@/utils/api/marketPlace/interface";

interface IProps {
  product: IProductTypeResponse;
  handleViewProduct: (id: string) => void;
}

const isOutOfStock = (product: IProductTypeResponse) => {
  if (product.stock_managed !== "yes") return false;
  const colours = product.product_colours ?? [];
  if (!colours.length) return false;
  return colours.every((colour) => {
    const stock = colour.stock ?? [];
    return stock.length > 0 && stock.every((s) => Number(s.stock) <= 0);
  });
};

export const ProductCard = ({ product, handleViewProduct }: IProps) => {
  const outOfStock = isOutOfStock(product);
  const swatches = Array.from(
    new Set((product.product_colours ?? []).map((colour) => colour.colour))
  ).filter(Boolean);
  const visibleSwatches = swatches.slice(0, 4);
  const extraSwatchCount = swatches.length - visibleSwatches.length;

  return (
    <button
      type="button"
      onClick={() => handleViewProduct(`${product.id}`)}
      className="group w-full rounded-xl bg-white text-left shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div className="relative overflow-hidden rounded-t-xl bg-[#F5F5F5]">
        <img
          src={`${product?.product_colours?.[0]?.image_url}`}
          alt={`${product.name} product image`}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {outOfStock && (
          <span className="absolute top-2 left-2 rounded-md bg-primary/90 px-2 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-3">
        {product.product_category?.name && (
          <p className="text-xs font-medium uppercase tracking-wide text-primaryGray">
            {product.product_category.name}
          </p>
        )}
        <h2 className="line-clamp-1 text-sm font-semibold text-[#404040]">
          {product.name}
        </h2>
        <p className="text-base font-bold text-[#404040]">
          {product.price_currency || "GHC"} {Number(product.price_amount).toFixed(2)}
        </p>
        {visibleSwatches.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            {visibleSwatches.map((colour, index) => (
              <span
                key={`${colour}-${index}`}
                className="h-4 w-4 rounded-full border border-lightGray"
                style={{ backgroundColor: colour }}
              />
            ))}
            {extraSwatchCount > 0 && (
              <span className="text-[11px] text-primaryGray">+{extraSwatchCount}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. `ProductChip` and `Button` imports were removed because they're no longer used in this file — confirm no leftover unused-import errors.

- [ ] **Step 3: Lint**

Run: `npx eslint src/pages/HomePage/pages/MarketPlace/components/cards/ProductCard.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 4: Manual QA note**

Open the member marketplace home and a category with multiple colours: confirm the whole card navigates to the PDP on click, the out-of-stock label still appears for fully out-of-stock products, and colour swatches render (capped at 4 with a "+N" overflow indicator).

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/cards/ProductCard.tsx
git commit -m "feat: redesign ProductCard with minimal style"
```

---

### Task 4: Restyle cart drawer (`CartDrawer`, `CartIcon`, `EmptyCartComponent`)

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cart/CartDrawer.tsx`
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cart/CartIcon.tsx`
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cart/EmptyCartComponent.tsx`

Per spec: the drawer becomes the *only* cart surface during browsing — drop the secondary "View cart" button (the standalone cart page is retired in Task 11), keep "Checkout" as the single action.

- [ ] **Step 1: Replace `CartDrawer.tsx`**

Replace the entire file with:

```tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { relativePath } from "@/utils";
import { useCart } from "../../utils/cartSlice";
import { useCartDetails } from "../../utils/useCartDetails";
import { ProductChip } from "../chips/ProductChip";
import EmptyCartComponent from "./EmptyCartComponent";

export default function CartDrawer() {
  const { cartOpen, toggleCart, removeFromCart } = useCart();
  const { items: cartWithDetails, totalPrice } = useCartDetails();

  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        cartOpen
      ) {
        toggleCart(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cartOpen, toggleCart]);

  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(itemId);
  };

  return (
    <div
      className={`fixed top-[65px] right-0 z-50 flex h-fit w-96 max-w-full flex-col rounded-tl-2xl border border-lightGray bg-white text-primary shadow-2xl transition-transform duration-300 ${
        cartOpen ? "translate-x-0" : "translate-x-full"
      }`}
      ref={drawerRef}
    >
      <div className="flex items-center justify-between border-b border-lightGray px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="size-6" />
          <h2 className="text-lg font-bold">Your cart</h2>
        </div>
        <button
          onClick={() => toggleCart(!cartOpen)}
          className="rounded-full p-1 hover:bg-lightGray/40"
          aria-label="Close cart"
        >
          <XMarkIcon className="size-5" />
        </button>
      </div>

      <div className="max-h-[60vh] divide-y divide-lightGray overflow-y-auto px-5">
        {cartWithDetails.length === 0 ? (
          <div className="py-6">
            <EmptyCartComponent />
          </div>
        ) : (
          cartWithDetails.map((item) => (
            <CartCard
              key={item.item_uuid}
              cartItem={item}
              onDelete={handleRemoveFromCart}
            />
          ))
        )}
      </div>

      {cartWithDetails.length > 0 && (
        <div className="space-y-3 border-t border-lightGray px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primaryGray">Subtotal</p>
            <p className="text-lg font-bold">GHC {totalPrice.toFixed(2)}</p>
          </div>
          <Button
            value="Proceed to checkout"
            className="w-full"
            onClick={() => {
              toggleCart(false);
              navigate(relativePath.member.checkOut);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface CartCardProps {
  cartItem: {
    image_url: string;
    name: string;
    price_amount?: number;
    quantity: number;
    product_id: string;
    product_type: string;
    product_category: string;
    item_uuid?: string | undefined;
  };
  onDelete: (itemId: string) => void;
}
const CartCard = ({ cartItem, onDelete }: CartCardProps) => {
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-lightGray bg-lightGray/30">
        <img
          src={cartItem.image_url}
          alt={cartItem.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-semibold">{cartItem.name}</p>
        <div className="flex flex-wrap items-center gap-1">
          <ProductChip section="type" text={cartItem.product_type} />
          <ProductChip section="category" text={cartItem.product_category} />
        </div>
        <p className="text-sm text-primaryGray">
          Qty {cartItem.quantity} · GHC {cartItem.price_amount?.toFixed(2)}
        </p>
      </div>
      <button
        onClick={() => onDelete(cartItem.item_uuid!)}
        className="rounded-full p-1 text-primaryGray hover:bg-lightGray/40 hover:text-red-600"
        aria-label={`Remove ${cartItem.name} from cart`}
      >
        <XMarkIcon className="size-4" />
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Replace `CartIcon.tsx`**

Replace the entire file with:

```tsx
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

import { useCart } from "../../utils/cartSlice";

export function CartIcon() {
  const { toggleCart, getTotalItems } = useCart();

  const cartCount = getTotalItems();

  return (
    <button
      type="button"
      className="relative"
      onClick={() => toggleCart(true)}
      aria-label={cartCount > 0 ? `Open cart, ${cartCount} items` : "Open cart"}
    >
      <ShoppingCartIcon className="size-7" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
          {cartCount}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 3: Replace `EmptyCartComponent.tsx`**

Replace the entire file with:

```tsx
import { useNavigate } from "react-router-dom";

import emptyCartSvg from "@/assets/empty-cart.svg";
import { Button } from "@/components";
import { useCart } from "../../utils/cartSlice";

export default function EmptyCartComponent() {
  const navigate = useNavigate();

  const { toggleCart } = useCart();
  const handleExploreItems = () => {
    toggleCart(false);
    navigate("/member/market");
  };
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-primary">
      <img src={emptyCartSvg} alt="" className="h-24 w-24" />
      <h3 className="font-semibold">Your cart is empty</h3>
      <p className="text-sm text-primaryGray">Continue shopping to explore more</p>
      <Button
        value="Explore items"
        variant="secondary"
        className="mt-2 w-full"
        onClick={handleExploreItems}
      />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/HomePage/pages/MarketPlace/components/cart/CartDrawer.tsx src/pages/HomePage/pages/MarketPlace/components/cart/CartIcon.tsx src/pages/HomePage/pages/MarketPlace/components/cart/EmptyCartComponent.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 5: Manual QA note**

Add an item to cart, open the drawer via the header cart icon: confirm items render, remove works, subtotal is correct, "Proceed to checkout" navigates to `/member/market/check-out` and closes the drawer, and there is no "View cart" button anymore. Confirm empty-cart state renders correctly when the cart has zero items.

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/cart/CartDrawer.tsx src/pages/HomePage/pages/MarketPlace/components/cart/CartIcon.tsx src/pages/HomePage/pages/MarketPlace/components/cart/EmptyCartComponent.tsx
git commit -m "feat: restyle cart drawer and drop standalone view-cart link"
```

---

### Task 5: Restyle `VerifyPayment`

**Files:**
- Modify: `src/pages/MembersPage/Pages/VerifyPayment.tsx`

Visual polish only — replace ad hoc `blue-500`/`green-500` colours with the app's `primary`/token colours; logic (deep link, countdown, redirect) is untouched.

- [ ] **Step 1: Replace the whole file**

Replace the entire file with:

```tsx
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, relativePath } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { Button } from "@/components";

export default function VerifyPayment() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { type } = useParams();

  const reference = searchParams.get("order_reference") ?? "";
  const hasReference = Boolean(reference.trim());
  const isMobileReturn = type === "mobile";

  const {
    data: verificationResult,
    loading,
    error,
    refetch,
  } = useFetch(api.fetch.verifyPayment, { reference }, !hasReference);

  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  const { clearCart } = useCart();
  const isPaymentVerified =
    Boolean(verificationResult) && !loading && !error && hasReference;
  const redirectPath =
    type === "out" ? "/out/products" : relativePath.member.market;

  useEffect(() => {
    if (!isPaymentVerified) return;

    setCountdown(5);
    clearCart();
    localStorage.removeItem("my_cart");

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [clearCart, isPaymentVerified]);

  useEffect(() => {
    if (!isPaymentVerified || countdown > 0) return;
    if (isMobileReturn) {
      const encodedReference = encodeURIComponent(reference);
      window.location.replace(
        `wwm-mobile://payment/verify?reference=${encodedReference}&order_reference=${encodedReference}`
      );
      return;
    }
    navigate(redirectPath, { replace: true });
  }, [countdown, isMobileReturn, isPaymentVerified, navigate, redirectPath, reference]);

  return (
    <div className="flex items-center justify-center w-full h-[80vh] px-4">
      <div className="bg-white shadow-lg rounded-2xl border border-lightGray p-8 w-full max-w-md text-center">
        {!hasReference && (
          <div className="flex flex-col items-center gap-4">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <p className="text-red-600 font-medium">Missing payment reference.</p>
            <p className="text-primaryGray text-sm">
              We could not verify your payment because the reference is missing.
            </p>
            <Button
              value="Back to Marketplace"
              onClick={() =>
                navigate(type === "out" ? "/out/products" : relativePath.member.market)
              }
            />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4">
            <ArrowPathIcon className="w-12 h-12 animate-spin text-primary" />
            <p className="text-primary text-lg">Verifying your payment...</p>
          </div>
        )}

        {error && !loading && hasReference && (
          <div className="flex flex-col items-center gap-4">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <p className="text-red-600 font-medium">Payment verification failed.</p>
            <p className="text-primaryGray text-sm">
              Please try again or contact support.
            </p>
            <Button value="Retry" onClick={() => refetch({ reference })} />
          </div>
        )}

        {verificationResult && !loading && !error && hasReference && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
            <p className="text-green-700 font-medium">Payment verified successfully!</p>
            <p className="text-primaryGray text-sm">
              Order Reference: <span className="font-mono">{reference}</span>
            </p>

            <p className="text-primaryGray text-sm mt-2">
              {isMobileReturn
                ? "You will be returned to the mobile app in "
                : "You will be redirected in "}
              <span className="font-semibold text-primary">{countdown}</span> seconds...
            </p>
            {isMobileReturn ? (
              <Button
                value="Open mobile app"
                onClick={() => {
                  const encodedReference = encodeURIComponent(reference);
                  window.location.href = `wwm-mobile://payment/verify?reference=${encodedReference}&order_reference=${encodedReference}`;
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/MembersPage/Pages/VerifyPayment.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 3: Manual QA note**

Hit `/member/market/verify_payment/member?order_reference=<ref>` (and the `/out/verify-payment/out?...` and `.../verify-payment/mobile?...` variants) with a valid and an invalid reference: confirm loading/success/error states render with the new colours, the countdown still redirects, and the `wwm-mobile://payment/verify` deep link still fires unchanged for the mobile-return case.

- [ ] **Step 4: Commit**

```bash
git add src/pages/MembersPage/Pages/VerifyPayment.tsx
git commit -m "style: restyle VerifyPayment with app colour tokens"
```

---

### Task 6: Admin visual polish (`MarketCard`, `ProductDetailsCard`, order status badges)

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cards/MarketCard.tsx`
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cards/ProductDetailsCard.tsx`
- Modify: `src/pages/HomePage/pages/MarketPlace/components/Orders/OrdersTableColumns.tsx`
- Modify: `src/pages/HomePage/pages/MarketPlace/components/Orders/Orders.tsx`

Visual-only: no props, handlers, or CRUD logic change. Goal is consistent pill/badge/card styling between admin and the redesigned member views.

- [ ] **Step 1: `MarketCard.tsx` — add hover elevation, consistent with new product card**

Find:

```tsx
    <div className="w-full flex flex-col justify-between rounded-2xl text-[#474D66] border border-lightGray p-4 bg-white relative">
```

Replace with:

```tsx
    <div className="w-full flex flex-col justify-between rounded-2xl text-[#474D66] border border-lightGray p-4 bg-white shadow-sm transition-shadow hover:shadow-md relative">
```

- [ ] **Step 2: `ProductDetailsCard.tsx` — consistent shadow + pill status badge**

Find:

```tsx
      <div className="relative w-full rounded-xl border bg-white p-2 shadow-sm">
```

Replace with:

```tsx
      <div className="relative w-full rounded-xl border border-lightGray bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
```

Find:

```tsx
export const statusColors: Record<string, string> = {
  published: "bg-[#34C759] text-white",
  draft: "bg-gray-400 text-white",
};
```

Replace with:

```tsx
export const statusColors: Record<string, string> = {
  published: "bg-[#34C759] text-white rounded-full",
  draft: "bg-gray-400 text-white rounded-full",
};
```

Find:

```tsx
                  <p
                    className={`text-xs px-2 py-0.5 h-fit rounded-full  capitalize ${statusColors[status]}`}
                  >
```

Replace with:

```tsx
                  <p
                    className={`text-xs px-2.5 py-1 h-fit capitalize ${statusColors[status]}`}
                  >
```

(`rounded-full` moved into `statusColors` itself so the class isn't duplicated between the two spots.)

- [ ] **Step 3: `OrdersTableColumns.tsx` — pill-shaped payment/delivery badges**

Find:

```tsx
export const getStatusBadge = (status: string) => {
  const color = getStatusColor(status);
  return (
    <span className={`inline-block px-2 py-1 rounded ${color}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};
```

Replace with:

```tsx
export const getStatusBadge = (status: string) => {
  const color = getStatusColor(status);
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};
```

Find:

```tsx
export const getDeliveryStatusBadge = (status?: string) => {
  const label = status || "pending";
  const color = getDeliveryStatusColor(status);
  return (
    <span className={`inline-block px-2 py-1 rounded capitalize ${color}`}>
      {label}
    </span>
  );
};
```

Replace with:

```tsx
export const getDeliveryStatusBadge = (status?: string) => {
  const label = status || "pending";
  const color = getDeliveryStatusColor(status);
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${color}`}
    >
      {label}
    </span>
  );
};
```

- [ ] **Step 4: `Orders.tsx` — match the mobile card's own (duplicate) status badge to the same pill shape**

Find (the local `getStatusBadge` defined in this file — distinct from the one in `OrdersTableColumns.tsx`, kept as-is functionally, just restyled for consistency):

```tsx
const getStatusBadge = (status: PaymentStatus) => {
  const base =
    "px-2 py-1 rounded-full text-xs font-medium capitalize inline-flex items-center";
```

This one is already a pill (`rounded-full`) — no change needed here; leave it as-is. (Confirms the two badge helpers already agree on shape after Step 3; nothing further to edit in this file for this task.)

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/HomePage/pages/MarketPlace/components/cards/MarketCard.tsx src/pages/HomePage/pages/MarketPlace/components/cards/ProductDetailsCard.tsx src/pages/HomePage/pages/MarketPlace/components/Orders/OrdersTableColumns.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 6: Manual QA note**

Open the admin Marketplace Management list and a market's Products/Orders tabs: confirm market and product cards have a hover elevation, product status pill is fully rounded, and payment/delivery badges in the orders table are fully rounded pills. No functional change (CRUD, delivery-status dropdown, exports) should be observed.

- [ ] **Step 7: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/cards/MarketCard.tsx src/pages/HomePage/pages/MarketPlace/components/cards/ProductDetailsCard.tsx src/pages/HomePage/pages/MarketPlace/components/Orders/OrdersTableColumns.tsx
git commit -m "style: unify admin marketplace card and status-badge styling"
```

---

### Task 7: Checkout consolidation (editable order summary + payment picker)

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm.tsx`

Per spec: single page combining editable order summary (member cart only — guest single-item checkout stays read-only, preserving existing guest logic untouched), billing form, and payment method picker. This also fixes an existing gap: `PaymentOptionsForm` was imported and its validation schema wired in, but the component was never rendered — payment method was silently locked to `"paystack"` with no way to pick Hubtel.

- [ ] **Step 1: Replace the whole file**

Replace the entire file with:

```tsx
import { Form, Formik } from "formik";
import { useCallback, useMemo, useState } from "react";
import { object } from "yup";

import { MinusIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import {
  ContactsSubForm,
  IContactsSubForm,
  INameInfo,
  NameInfo,
} from "@/components/subform";
import { FormLayout } from "@/components/ui";
import { decodeToken, ICartItem } from "@/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../utils/cartSlice";
import { PaymentOptionsForm } from "./PaymentOptionsSubForm";
import { useCartDetails } from "../../utils/useCartDetails";

interface IProps {
  handleCheckout: (data: ICheckoutForm) => void;
  loading: boolean;
}

const getGuestCheckoutItem = (): ICartItem | null => {
  try {
    const myCartString = localStorage.getItem("my_cart");
    if (!myCartString) return null;
    return JSON.parse(myCartString) as ICartItem;
  } catch {
    return null;
  }
};

export function CheckoutForm(props: IProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const is_member = location.pathname.includes("member");
  const user = decodeToken();
  const name = user?.name || "";
  const phone = user?.phone || "";
  const email = user?.email || "";
  const [first_name, other_name, last_name] = name.split(" ");

  const { billinDetails, updateSection, removeFromCart } = useCart();
  const { items: cartWithDetails, totalPrice } = useCartDetails();
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] =
    useState<ICheckoutForm | null>(null);
  const [orderAcknowledged, setOrderAcknowledged] = useState(false);

  const closeOrderConfirmation = useCallback(() => {
    setPendingCheckoutData(null);
    setShowOrderConfirmation(false);
    setOrderAcknowledged(false);
  }, []);

  const my_cart = getGuestCheckoutItem();

  const checkoutItems = useMemo<ICartItem[]>(() => {
    if (is_member) {
      return cartWithDetails;
    }

    return my_cart ? [my_cart] : [];
  }, [cartWithDetails, is_member, my_cart]);

  const totalQuantity = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  }, [checkoutItems]);

  const checkoutTotalPrice = useMemo(() => {
    if (is_member) return Number(totalPrice || 0);
    return checkoutItems.reduce(
      (acc, item) => acc + Number(item.price_amount || 0) * Number(item.quantity || 0),
      0
    );
  }, [checkoutItems, is_member, totalPrice]);

  const initialValues: ICheckoutForm = billinDetails || {
    personal_info: {
      first_name: first_name || "",
      other_name: other_name || "",
      last_name: last_name || "",
    },
    contact_info: {
      ...ContactsSubForm.initialValues,
      email: email || "",
      phone: {
        ...ContactsSubForm.initialValues.phone,
        number: phone || "",
      },
    },
    payment_method: "paystack",
  };

  return (
    <div className="text-[#474D66] bg-white rounded-lg ">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          setPendingCheckoutData(values);
          setOrderAcknowledged(false);
          setShowOrderConfirmation(true);
        }}
      >
        {({ handleSubmit }) => (
          <Form className="w-full mx-auto rounded-lg flex items-start gap-5 flex-col lg:flex-row p-3">
            <div className="border rounded-lg p-5 w-full">
              <p className="font-bold mb-5 text-xl">Billing Details</p>
              <FormLayout>
                <NameInfo prefix="personal_info" />
                <ContactsSubForm prefix="contact_info" />
              </FormLayout>
            </div>
            <div className="w-full lg:w-1/2 space-y-5">
              <OrderSummary
                items={checkoutItems}
                totalAmount={checkoutTotalPrice}
                editable={is_member}
                onQuantityChange={(item, quantity) =>
                  updateSection(item.item_uuid!, "quantity", quantity)
                }
                onRemove={(item) => removeFromCart(item.item_uuid!)}
              />
              <PaymentOptionsForm />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  value="Cancel"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                />
                <Button
                  value="Place Order"
                  onClick={handleSubmit}
                  loading={props.loading}
                  disabled={props.loading || checkoutItems.length === 0}
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>
      <Modal
        open={showOrderConfirmation}
        persist={false}
        onClose={closeOrderConfirmation}
        className="max-w-2xl"
      >
        <div className="p-6 space-y-5 text-[#474D66]">
          <h3 className="text-xl font-bold">Confirm Order</h3>

          <div className="max-h-[45vh] overflow-y-auto space-y-3">
            {checkoutItems.map((item, index) => (
              <div
                key={`${item.item_uuid || item.product_id || index}`}
                className="rounded-lg border p-3 flex items-start gap-3"
              >
                <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 border">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-base">{item.name}</p>
                  <p>
                    <span className="font-medium">Color:</span>{" "}
                    {item.color ? (
                      <span className="inline-flex items-center gap-2 align-middle">
                        <span
                          className="inline-block h-4 w-6 rounded border border-gray-300"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.color}</span>
                      </span>
                    ) : (
                      "-"
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Size:</span> {item.size || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Quantity:</span> {item.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Price:</span> GHC{" "}
                    {Number(item.price_amount || 0).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Subtotal:</span> GHC{" "}
                    {(Number(item.price_amount || 0) * Number(item.quantity || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4 space-y-1 text-sm">
            <p className="flex items-center justify-between">
              <span className="font-medium">Total Quantity</span>
              <span>{totalQuantity}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="font-medium">Total Price</span>
              <span>GHC {checkoutTotalPrice.toFixed(2)}</span>
            </p>
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
            <p className="font-bold">⚠️ Please Review Your Order Carefully</p>
            <label
              htmlFor="order-acknowledgement"
              className="flex items-start gap-3 text-sm cursor-pointer"
            >
              <input
                id="order-acknowledgement"
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer"
                checked={orderAcknowledged}
                onChange={(e) => setOrderAcknowledged(e.target.checked)}
              />
              <span>
                I have carefully reviewed my order and confirm that all items,
                colours, sizes, and quantities are correct. I understand that my
                order will be processed exactly as submitted, and the PA Apparel
                Team will not be held responsible for any incorrect selections
                made by me.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              value="Cancel"
              variant="secondary"
              onClick={closeOrderConfirmation}
            />
            <Button
              value="Confirm"
              loading={props.loading}
              disabled={
                props.loading ||
                checkoutItems.length === 0 ||
                !orderAcknowledged
              }
              onClick={() => {
                if (!pendingCheckoutData || !orderAcknowledged) return;
                props.handleCheckout(pendingCheckoutData);
                closeOrderConfirmation();
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export interface ICheckoutForm {
  contact_info: IContactsSubForm;
  personal_info: INameInfo;
  payment_method: "hubtel" | "paystack";
}

const validationSchema = object({
  personal_info: object().shape({
    ...NameInfo.validationSchema,
  }),
  contact_info: object().shape({
    ...ContactsSubForm.validationSchema,
  }),
  ...PaymentOptionsForm.validationSchema,
});

const OrderSummary = ({
  items,
  totalAmount,
  editable = false,
  onQuantityChange,
  onRemove,
}: {
  items: ICartItem[];
  totalAmount: number;
  editable?: boolean;
  onQuantityChange?: (item: ICartItem, quantity: number) => void;
  onRemove?: (item: ICartItem) => void;
}) => {
  const amount = Number(totalAmount || 0).toFixed(2);

  return (
    <div className="w-full h-fit border rounded-lg p-4 space-y-2">
      <p className="font-bold text-xl">Order</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="flex justify-between">
            <p className="font-bold">Product</p>
            <p className="font-bold">Subtotal</p>
          </div>
          <div className="w-full space-y-2">
            {items.map((item, index) => (
              <ItemCard
                key={`${item.item_uuid || item.product_id || "item"}-${index}`}
                item={item}
                editable={editable}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex justify-between">
        <p className="font-bold">Total</p>
        <p className="font-bold">GHC {amount}</p>
      </div>
    </div>
  );
};

interface ICardProp {
  item: ICartItem;
  editable?: boolean;
  onQuantityChange?: (item: ICartItem, quantity: number) => void;
  onRemove?: (item: ICartItem) => void;
}
const ItemCard = ({ item, editable, onQuantityChange, onRemove }: ICardProp) => {
  const getProductTotalAmount = useCallback(() => {
    return (item.price_amount * item.quantity).toFixed(2);
  }, [item]);

  const stockCap = item.stock ?? Infinity;

  return (
    <div className="w-full flex justify-between items-center gap-2 font-medium">
      <div className="flex items-center gap-2">
        <p>{item.name}</p>
        {editable ? (
          <div className="flex items-center gap-1 rounded border border-gray-300 bg-gray-50">
            <button
              type="button"
              className="p-1 disabled:opacity-40"
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange?.(item, Math.max(1, item.quantity - 1))}
            >
              <MinusIcon className="size-3" />
            </button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="p-1 disabled:opacity-40"
              disabled={item.quantity >= stockCap}
              onClick={() =>
                onQuantityChange?.(item, Math.min(stockCap, item.quantity + 1))
              }
            >
              <PlusIcon className="size-3" />
            </button>
          </div>
        ) : (
          <>
            <span>x</span>
            <span>{item.quantity}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p>GHC {getProductTotalAmount()}</p>
        {editable && (
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove?.(item)}
            className="text-gray-400 hover:text-red-600"
          >
            <XMarkIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npx eslint src/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 4: Manual QA note**

As a member with 2+ items in cart, open checkout: confirm quantity +/- and remove work inline in the order summary and the total updates live; confirm the Paystack/Hubtel payment picker now renders and is selectable (previously invisible); submit through to the confirmation modal and confirm the reviewed order matches. As a guest (`/out/products/check-out` with a `my_cart` localStorage item), confirm the single item still shows read-only quantity (no +/- or remove controls) and checkout still completes.

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm.tsx
git commit -m "feat: consolidate checkout into a single editable page with payment picker"
```

---

## Phase 2 (4 tasks — dispatch concurrently once Phase 1 lands; per-task deps noted)

### Task 8: Rebuild browse homepage (`ProductsPage`)

**Depends on:** Task 1 (`Skeleton`), Task 3 (restyled `ProductCard`).

**Files:**
- Modify: `src/pages/MembersPage/Pages/ProductsPage.tsx`

- [ ] **Step 1: Replace the whole file**

Replace the entire file with:

```tsx
import { useMemo, useState } from "react";
import { matchRoutes, useLocation, useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { api, formatDate } from "@/utils";
import { ProductCard } from "@/pages/HomePage/pages/MarketPlace/components/cards/ProductCard";
import { getMarketStatus } from "@/pages/HomePage/pages/MarketPlace/MarketPlace";
import GridComponent from "@/pages/HomePage/Components/reusable/GridComponent";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { SearchBar } from "@/components/SearchBar";
import Filter from "@/pages/HomePage/Components/reusable/Filter";
import { encodeQuery } from "@/pages/HomePage/utils";
import { routes } from "@/routes/appRoutes";

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => m.route?.name)?.route?.name;

  const {
    data: products,
    loading,
    error,
  } = useFetch(api.fetch.fetchAllProducts);

  const { data: markets } = useFetch(api.fetch.fetchMarkets);
  const { data: productCategories } = useFetch(api.fetch.fetchProductCategories);

  const [search, setSearch] = useState("");
  const [selectedMarketId, setSelectedMarketId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const activeMarkets = useMemo(() => {
    return (markets?.data || []).filter(
      (market) =>
        getMarketStatus({
          start_date: market.start_date,
          end_date: market.end_date,
        }) === "active"
    );
  }, [markets?.data]);

  const featuredMarket = useMemo(() => {
    if (activeMarkets.length === 0) return null;
    return [...activeMarkets].sort(
      (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    )[0];
  }, [activeMarkets]);

  const categoryOptions = useMemo(
    () =>
      (productCategories?.data || []).map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    [productCategories?.data]
  );

  const marketOptions = useMemo(
    () => activeMarkets.map((market) => ({ label: market.name, value: String(market.id) })),
    [activeMarkets]
  );

  const filteredProducts = useMemo(() => {
    const list = products?.data || [];
    const term = search.trim().toLowerCase();

    return list.filter((product) => {
      if (term && !product.name.toLowerCase().includes(term)) return false;
      if (selectedMarketId && String(product.market_id) !== selectedMarketId) return false;
      if (
        selectedCategoryId &&
        String(product.product_category_id) !== selectedCategoryId
      )
        return false;
      if (maxPrice && Number(product.price_amount) > Number(maxPrice)) return false;
      return true;
    });
  }, [products?.data, search, selectedMarketId, selectedCategoryId, maxPrice]);

  const handleViewProduct = (productId: string) => {
    if (routeName === "out")
      return navigate(`/out/products/${encodeQuery(productId)}`);
    return navigate(`/member/market/product/${encodeQuery(productId)}`);
  };

  return (
    <div className="p-6 space-y-6">
      {routeName === "out" && (
        <div className="text-2xl font-semibold text-white mb-4">
          10th Anniversary Apparel
        </div>
      )}

      {featuredMarket && (
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            Featured market
          </p>
          <h2 className="text-2xl font-bold mt-1">{featuredMarket.name}</h2>
          {featuredMarket.description && (
            <p className="mt-1 text-sm opacity-90 max-w-2xl">
              {featuredMarket.description}
            </p>
          )}
          <p className="mt-2 text-sm opacity-90">
            Open until {formatDate(featuredMarket.end_date)}
          </p>
        </div>
      )}

      {activeMarkets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedMarketId("")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedMarketId === ""
                ? "bg-primary text-white"
                : "bg-lightGray/40 text-primary hover:bg-lightGray/60"
            }`}
          >
            All markets
          </button>
          {activeMarkets.map((market) => (
            <button
              key={market.id}
              type="button"
              onClick={() =>
                setSelectedMarketId((prev) => (prev === String(market.id) ? "" : String(market.id)))
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedMarketId === String(market.id)
                  ? "bg-primary text-white"
                  : "bg-lightGray/40 text-primary hover:bg-lightGray/60"
              }`}
            >
              {market.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchBar
          className="h-10 sm:max-w-xs"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Filter
          name="category"
          className="sm:w-48"
          label="Category"
          placeholder="All categories"
          options={[{ label: "All categories", value: "" }, ...categoryOptions]}
          value={selectedCategoryId}
          onChange={(_, value) => setSelectedCategoryId(value)}
        />
        {marketOptions.length > 0 && (
          <Filter
            name="market"
            className="sm:w-48"
            label="Market"
            placeholder="All markets"
            options={[{ label: "All markets", value: "" }, ...marketOptions]}
            value={selectedMarketId}
            onChange={(_, value) => setSelectedMarketId(value)}
          />
        )}
        <div className="sm:w-40">
          <label className="mb-1 block text-sm" htmlFor="max-price">
            Max price
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#dcdcdc] bg-white px-3 text-sm text-primary"
          />
        </div>
      </div>

      {loading && <ProductsGridSkeleton count={8} />}

      {!loading && filteredProducts.length > 0 && (
        <GridComponent
          columns={[]}
          data={filteredProducts}
          displayedCount={12}
          filter={""}
          setFilter={() => {}}
          renderRow={(row) => (
            <ProductCard
              product={row.original}
              handleViewProduct={handleViewProduct}
              key={row.original.id}
            />
          )}
        />
      )}

      {!loading && filteredProducts.length === 0 && (
        <EmptyState
          scope="page"
          msg={error ? "Failed to load products" : "No products found"}
        />
      )}
    </div>
  );
}

function ProductsGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. In particular, confirm `getMarketStatus` is importable from `@/pages/HomePage/pages/MarketPlace/MarketPlace` (it's already imported the same way by `src/pages/HomePage/pages/MarketPlace/components/chips/MarketStatusChip.tsx`) and `formatDate` is exported from `@/utils`.

- [ ] **Step 3: Lint**

Run: `npx eslint src/pages/MembersPage/Pages/ProductsPage.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 4: Manual QA note**

With at least one active market and one upcoming/ended market: confirm the hero banner shows only the active market with the nearest end date, market chips list only active markets and toggle the grid filter, category/market/price filters narrow the grid correctly and combine with search, and the loading skeleton renders while `fetchAllProducts`/`fetchMarkets`/`fetchProductCategories` are in flight. With zero active markets, confirm the hero and chip row are simply omitted (no crash) and the unfiltered grid still renders. Repeat on `/out/products` (guest) and confirm the "10th Anniversary Apparel" banner still shows there.

- [ ] **Step 5: Commit**

```bash
git add src/pages/MembersPage/Pages/ProductsPage.tsx
git commit -m "feat: rebuild storefront homepage with hero, market chips, and filters"
```

---

### Task 9: Restyle PDP + add market context and related products

**Depends on:** Task 1 (`Skeleton`).

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/ProductDetails.tsx`
- Modify: `src/pages/MembersPage/Pages/ProductDetailsPage.tsx`

- [ ] **Step 1: `ProductDetails.tsx` — add imports**

Find:

```tsx
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { ICartItem, IProductTypeResponse, relativePath } from "@/utils";
import { ProductChip } from "./chips/ProductChip";
import { cn } from "@/utils/cn";
import { useCart } from "../utils/cartSlice";
import { matchRoutes, useLocation, useNavigate } from "react-router-dom";
import { routes } from "@/routes/appRoutes";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
```

Replace with:

```tsx
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { ICartItem, IProductTypeResponse, relativePath } from "@/utils";
import { ProductChip } from "./chips/ProductChip";
import { cn } from "@/utils/cn";
import { useCart } from "../utils/cartSlice";
import { matchRoutes, useLocation, useNavigate } from "react-router-dom";
import { routes } from "@/routes/appRoutes";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import { ProductCard } from "./cards/ProductCard";
import { encodeQuery } from "@/pages/HomePage/utils";
```

- [ ] **Step 2: Accept `relatedProducts` prop**

Find:

```tsx
interface IProps {
  readonly product: IProductTypeResponse;
  readonly addToCart: (item: ICartItem) => void;
}

export function ProductDetails({ product, addToCart }: IProps) {
```

Replace with:

```tsx
interface IProps {
  readonly product: IProductTypeResponse;
  readonly addToCart: (item: ICartItem) => void;
  readonly relatedProducts?: IProductTypeResponse[];
}

export function ProductDetails({ product, addToCart, relatedProducts = [] }: IProps) {
```

- [ ] **Step 3: Add the "Part of {market}" context line**

Find:

```tsx
            <p className="text-2xl font-semibold">
              <span>{product.price_currency || "GHC"}</span>{" "}
              {Number(product.price_amount).toFixed(2)}
            </p>
          </div>

          <Section title="Colors">
```

Replace with:

```tsx
            <p className="text-2xl font-semibold">
              <span>{product.price_currency || "GHC"}</span>{" "}
              {Number(product.price_amount).toFixed(2)}
            </p>
            {product.market?.name && (
              <p className="text-sm text-gray-500">
                Part of{" "}
                <span className="font-medium text-gray-700">{product.market.name}</span>
              </p>
            )}
          </div>

          <Section title="Colors">
```

- [ ] **Step 4: Add the "You may also like" section**

Find the closing of the two-column grid, right before the confirmation `Modal`:

```tsx
          </div>
        </div>
      </div>
      <Modal
        open={Boolean(pendingPurchase)}
```

Replace with:

```tsx
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <h3 className="text-lg font-bold text-[#404040] mb-4">You may also like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                product={related}
                handleViewProduct={(id) =>
                  navigate(
                    routeName === "out"
                      ? `/out/products/${encodeQuery(id)}`
                      : `/member/market/product/${encodeQuery(id)}`
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      <Modal
        open={Boolean(pendingPurchase)}
```

(This is a text match on indentation — the grid div in this file closes with three `</div>` lines followed directly by `<Modal open={Boolean(pendingPurchase)}`; double-check against the current file before replacing if the surrounding whitespace differs slightly.)

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/HomePage/pages/MarketPlace/components/ProductDetails.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 6: Replace `ProductDetailsPage.tsx` — fetch related products, use `Skeleton`**

Replace the entire file with:

```tsx
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { ProductDetails } from "@/pages/HomePage/pages/MarketPlace/components/ProductDetails";
import { api, ICartItem, IProductTypeResponse } from "@/utils";
import { decodeQuery } from "@/pages/HomePage/utils";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";

export function ProductDetailsPage() {
  const { id } = useParams();
  const productId = decodeQuery(id || "");

  const {
    data: product,
    loading,
    error,
  } = useFetch(api.fetch.fetchProductById, { id: productId });

  const { data: allProducts } = useFetch(api.fetch.fetchAllProducts);

  const { addToCart } = useCart();

  const handleAddToCart = (item: ICartItem) => {
    addToCart(item);
  };

  const relatedProducts = useMemo<IProductTypeResponse[]>(() => {
    if (!product?.data) return [];
    const current = product.data;
    return (allProducts?.data || [])
      .filter((candidate) => String(candidate.id) !== String(current.id))
      .filter(
        (candidate) =>
          String(candidate.market_id) === String(current.market_id) ||
          String(candidate.product_type_id) === String(current.product_type_id)
      )
      .slice(0, 4);
  }, [allProducts?.data, product?.data]);

  return (
    <div className="mx-auto bg-white rounded-xl">
      {loading && <ProductDetailsSkeleton />}

      {!loading && (!product || !product?.data) && (
        <EmptyState
          scope="page"
          msg={error ? "Failed to load product details" : "Product not found"}
        />
      )}

      {!loading && product?.data && (
        <ProductDetails
          product={product.data}
          addToCart={handleAddToCart}
          relatedProducts={relatedProducts}
        />
      )}
    </div>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div
      className="w-full max-w-6xl mx-auto p-6 md:p-8"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading product details"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full rounded-2xl" />

        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-40" />

          <div className="flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>

          <div className="space-y-2 pt-6">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading product details…</span>
    </div>
  );
}
```

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/MembersPage/Pages/ProductDetailsPage.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 8: Manual QA note**

Open a product's PDP: confirm the "Part of {market name}" line renders under the price, "You may also like" shows up to 4 other products sharing the same market or product type (and is omitted entirely when there are none), and clicking a related product's card navigates to that product's own PDP (both on `/member/market/product/:id` and `/out/products/:id`). Confirm the loading skeleton still renders correctly while fetching.

- [ ] **Step 9: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/ProductDetails.tsx src/pages/MembersPage/Pages/ProductDetailsPage.tsx
git commit -m "feat: add market context and related products to PDP"
```

---

### Task 10: Redesign "My Orders" (detail view + status timeline)

**Depends on:** Task 2 (`OrderStatusTimeline`).

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/Orders/Orders.tsx` (add optional `onRowClick`, additive only — admin's `MarketOrders.tsx` does not pass it and is unaffected)
- Modify: `src/pages/MembersPage/Pages/MyOrders.tsx`

- [ ] **Step 1: `Orders.tsx` — thread an optional `onRowClick` through to the table and mobile cards**

Find:

```tsx
const OrderCard = ({
  order,
  renderOrderAction,
}: {
  order: IOrders;
  renderOrderAction?: (order: IOrders) => ReactNode;
}) => {
  const total = (order.price_amount * order.quantity).toFixed(2);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
```

Replace with:

```tsx
const OrderCard = ({
  order,
  renderOrderAction,
  onClick,
}: {
  order: IOrders;
  renderOrderAction?: (order: IOrders) => ReactNode;
  onClick?: () => void;
}) => {
  const total = (order.price_amount * order.quantity).toFixed(2);

  return (
    <div
      className={`border rounded-lg p-4 bg-white shadow-sm space-y-3 ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
      onClick={onClick}
    >
```

Find:

```tsx
      {renderOrderAction && (
        <div className="pt-2 border-t">{renderOrderAction(order)}</div>
      )}
    </div>
  );
};
```

Replace with:

```tsx
      {renderOrderAction && (
        <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
          {renderOrderAction(order)}
        </div>
      )}
    </div>
  );
};
```

Find:

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
}: IProps) => {
```

Replace with:

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

Find:

```tsx
      {isMobile ? (
        <div className=" grid sm:grid-cols-2 gap-4">
          {allOrders.map((order) => (
            <OrderCard
              key={String(order.id)}
              order={order}
              renderOrderAction={renderOrderAction}
            />
          ))}
        </div>
      ) : (
        <TableComponent
          columns={tableColumns}
          data={allOrders || []}
          displayedCount={10}
          className="relative"
        />
      )}
```

Replace with:

```tsx
      {isMobile ? (
        <div className=" grid sm:grid-cols-2 gap-4">
          {allOrders.map((order) => (
            <OrderCard
              key={String(order.id)}
              order={order}
              renderOrderAction={renderOrderAction}
              onClick={onRowClick ? () => onRowClick(order) : undefined}
            />
          ))}
        </div>
      ) : (
        <TableComponent
          columns={tableColumns}
          data={allOrders || []}
          displayedCount={10}
          className="relative"
          onRowClick={onRowClick}
        />
      )}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/HomePage/pages/MarketPlace/components/Orders/Orders.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 3: Replace `MyOrders.tsx` — add the order detail view**

Replace the entire file with:

```tsx
import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { useFetch } from "@/CustomHooks/useFetch";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { Orders } from "@/pages/HomePage/pages/MarketPlace/components/Orders/Orders";
import { getBaseOrderColumns } from "@/pages/HomePage/pages/MarketPlace/components/Orders/OrdersTableColumns";
import { OrderStatusTimeline } from "@/pages/HomePage/pages/MarketPlace/components/Orders/OrderStatusTimeline";
import { showNotification } from "@/pages/HomePage/utils";
import {
  api,
  decodeToken,
  IOrders,
  relativePath,
} from "@/utils";

export const MyOrders = () => {
  const user = decodeToken();
  const userId = user?.id ? String(user.id) : "";
  const { data } = useFetch(
    api.fetch.fetchOrdersByUser,
    userId ? { user_id: userId } : undefined,
    !userId
  );
  const [processingOrderKey, setProcessingOrderKey] = useState<string | null>(
    null
  );
  const [viewingOrder, setViewingOrder] = useState<IOrders | null>(null);

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

  const tableColumns = useMemo(() => {
    const actionColumn: ColumnDef<IOrders> = {
      header: "Action",
      cell: ({ row }) => {
        const order = row.original;
        const orderKey = getOrderKey(order);
        const isPending = (order.payment_status || "").toLowerCase() === "pending";

        if (!isPending) {
          return <span className="text-xs text-gray-400">Paid</span>;
        }

        return (
          <Button
            value="Pay now"
            className="min-h-8 px-3 py-1 text-xs"
            loading={processingOrderKey === orderKey}
            disabled={processingOrderKey !== null}
            onClick={(e) => {
              e?.stopPropagation?.();
              handleRetryPayment(order);
            }}
          />
        );
      },
    };

    return getBaseOrderColumns([actionColumn]);
  }, [getOrderKey, handleRetryPayment, processingOrderKey]);

  return (
    <>
      <Orders
        orders={memberOrders}
        tableColumns={tableColumns}
        searchCustomer={false}
        defaultMarketStatus="active"
        onRowClick={(order) => setViewingOrder(order)}
        renderOrderAction={(order) => {
          const orderKey = getOrderKey(order);
          const isPending = (order.payment_status || "").toLowerCase() === "pending";

          if (!isPending) {
            return <p className="text-xs text-gray-500">Payment completed</p>;
          }

          return (
            <Button
              value="Pay now"
              className="w-full"
              loading={processingOrderKey === orderKey}
              disabled={processingOrderKey !== null}
              onClick={() => handleRetryPayment(order)}
            />
          );
        }}
      />

      <Modal
        open={Boolean(viewingOrder)}
        persist={false}
        onClose={() => setViewingOrder(null)}
        className="max-w-lg"
      >
        {viewingOrder && (
          <div className="space-y-5 p-6 text-[#474D66]">
            <div>
              <h3 className="text-lg font-bold">{viewingOrder.order_number}</h3>
              <p className="text-sm text-primaryGray">
                {viewingOrder.name} · Qty {viewingOrder.quantity}
              </p>
            </div>

            <OrderStatusTimeline
              paymentStatus={viewingOrder.payment_status}
              deliveryStatus={viewingOrder.delivery_status}
            />

            <div className="rounded-lg border border-lightGray p-4 space-y-1 text-sm">
              <p className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span>
                  GHC{" "}
                  {(
                    Number(viewingOrder.price_amount || 0) *
                    Number(viewingOrder.quantity || 0)
                  ).toFixed(2)}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-medium">Billed to</span>
                <span>
                  {viewingOrder.first_name} {viewingOrder.last_name}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="font-medium">Email</span>
                <span>{viewingOrder.email}</span>
              </p>
            </div>

            {(viewingOrder.payment_status || "").toLowerCase() === "pending" && (
              <Button
                value="Pay now"
                className="w-full"
                loading={processingOrderKey === getOrderKey(viewingOrder)}
                disabled={processingOrderKey !== null}
                onClick={() => handleRetryPayment(viewingOrder)}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
```

(This uses the app's standard `Modal` dialog for the order-detail view rather than a custom slide-over, matching the existing convention used for `ProductOverview` and the checkout order-confirmation view — no new UI paradigm introduced.)

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/MembersPage/Pages/MyOrders.tsx --max-warnings 0`
Expected: no output.

- [ ] **Step 5: Manual QA note**

On `/member/market/orders` with at least one pending, one shipped, and one delivered order: click a row (desktop table) and confirm a detail dialog opens showing the status timeline in the correct stage, total, and billing info; on a pending order, confirm "Pay now" works both from the table's Action column and from inside the detail dialog, and that clicking "Pay now" in the table does NOT also open the dialog (stopPropagation). Resize below the mobile breakpoint and confirm clicking a mobile order card also opens the dialog, and tapping its own "Pay now" button doesn't. Confirm the admin `MarketOrders` screen (`market-place/:id` → Orders tab) is visually and functionally unchanged (no row-click behavior there, since it doesn't pass `onRowClick`).

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/Orders/Orders.tsx src/pages/MembersPage/Pages/MyOrders.tsx
git commit -m "feat: add order detail view with status timeline to My Orders"
```

---

### Task 11: Retire the standalone cart page

**Depends on:** Task 4 (cart drawer no longer links to `relativePath.member.cart`), Task 7 (checkout page now supports inline cart editing, so no functionality is lost by removing the cart page/table).

**Files:**
- Delete: `src/pages/MembersPage/Pages/ViewCart.tsx`
- Delete: `src/pages/HomePage/pages/MarketPlace/components/cart/CartTable.tsx`
- Modify: `src/pages/MembersPage/Pages/Market.tsx`
- Modify: `src/routes/appRoutes.tsx`
- Modify: `src/utils/const.ts`

- [ ] **Step 1: Delete the two files**

```bash
git rm src/pages/MembersPage/Pages/ViewCart.tsx
git rm src/pages/HomePage/pages/MarketPlace/components/cart/CartTable.tsx
```

- [ ] **Step 2: Drop the "Carts" tab in `Market.tsx`**

Find:

```tsx
          <TabSelection
            tabs={["Products", "Carts", "Orders"]}
            onTabSelect={handleSelectedTab}
            selectedTab={routeName || "Products"}
          />
```

Replace with:

```tsx
          <TabSelection
            tabs={["Products", "Orders"]}
            onTabSelect={handleSelectedTab}
            selectedTab={routeName || "Products"}
          />
```

- [ ] **Step 3: Remove the `ViewCart` route and import from `appRoutes.tsx`**

Find:

```tsx
import { ViewCart } from "@/pages/MembersPage/Pages/ViewCart";
```

Delete this line entirely.

Find:

```tsx
          {
            path: relativePath.member.cart,
            name: "Carts",
            element: <ViewCart />,
            isPrivate: false,
          },
```

Delete this block entirely.

- [ ] **Step 4: Remove the now-unused `cart` path constant from `const.ts`**

Find:

```ts
    market: "/member/market/",
    productDetails: "/member/market/product/:id",
    cart: "/member/market/carts",
    checkOut: "/member/market/check-out",
```

Replace with:

```ts
    market: "/member/market/",
    productDetails: "/member/market/product/:id",
    checkOut: "/member/market/check-out",
```

- [ ] **Step 5: Confirm no remaining references**

Run: `grep -rn "ViewCart\|CartTable\|relativePath.member.cart\b" src`
Expected: no matches.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/pages/MembersPage/Pages/Market.tsx src/routes/appRoutes.tsx src/utils/const.ts --max-warnings 0`
Expected: no output.

- [ ] **Step 7: Manual QA note**

Confirm `/member/market` shows only "Products" and "Orders" tabs, navigating to `/member/market/carts` directly now 404s/falls through to the catch-all route (no longer resolves to a cart page), and the full add-to-cart → drawer → checkout → pay flow still works end to end without ever needing the old cart page.

- [ ] **Step 8: Commit**

```bash
git add -A src/pages/MembersPage/Pages/Market.tsx src/routes/appRoutes.tsx src/utils/const.ts
git commit -m "chore: retire standalone cart page in favor of drawer + checkout"
```

---

## Execution Plan

- **Phase 1** (Tasks 1–7): all seven tasks touch disjoint files and have no dependencies on each other. Dispatch one implementer subagent per task concurrently; each goes through its own spec-compliance + code-quality review independently.
- **Phase 2** (Tasks 8–11): start only after every Phase 1 task has landed and been reviewed. All four tasks touch disjoint files — dispatch concurrently, respecting the per-task "Depends on" notes (each depends on specific Phase 1 tasks, not on each other).
- After both phases are done, dispatch a final code reviewer subagent across the whole diff, then use `superpowers:finishing-a-development-branch`.

## Self-Review Notes

- **Spec coverage:** Homepage/browse (spec §2) → Task 8. Product card (spec §3) → Task 3. PDP market context + related products (spec §3) → Task 9. Cart drawer as sole cart surface (spec §4) → Task 4. Single-page checkout with editable summary + payment picker (spec §4) → Task 7. Order list + detail + status timeline + retry-pay preserved (spec §5) → Task 10, using Task 2's timeline. Guest flow and mobile deep link preserved untouched (spec §4, §5) → confirmed no task modifies `CheckOutPage.tsx`'s guest branching, `getGuestCheckoutItem`, or `VerifyPayment.tsx`'s deep-link logic (Task 5 only restyles classNames). Admin polish (spec §6) → Task 6. Shared `Skeleton` and status-timeline components (spec §7) → Tasks 1–2. No new data/API, no new payment provider, no new statuses, no wishlist/reviews/reorder → confirmed no task adds any of these.
- **Placeholders:** none — every step shows complete, pasteable code or exact find/replace text.
- **Type consistency:** `IProductTypeResponse`, `IMarket`, `IProduct`, `ICartItem`, `IOrders`, `PaymentStatus` used throughout match `src/utils/api/marketPlace/interface.ts` (re-exported via `@/utils`). `getMarketStatus`'s signature (`{ start_date, end_date }` → `"upcoming" | "active" | "ended"`) matches its definition in `src/pages/HomePage/pages/MarketPlace/MarketPlace.tsx`. `useCart()`'s `updateSection`/`removeFromCart`/`billinDetails` and `useCartDetails()`'s `items`/`totalPrice` match `src/pages/HomePage/pages/MarketPlace/utils/cartSlice.ts` and `useCartDetails.ts`. `TableComponent`'s `onRowClick` prop (Task 10) matches its existing signature in `src/pages/HomePage/Components/reusable/TableComponent.tsx` — no change needed there, only `Orders.tsx` needed to start passing it through.
