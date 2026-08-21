# Cart Auto-Open/Auto-Close Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-open `CartDrawer` when an item is added to the marketplace cart, then auto-close it after 5s of no interaction — but only for that auto-opened case, never for a manual cart-icon open.

**Architecture:** Two new fields (`cartAutoCloseArmed`, `cartAddPulse`) and two new actions (`openCartManually`, `disarmAutoClose`) on the existing `cartSlice` zustand store; a new `useCartAutoClose` hook owns the timer/hover/touch/focus logic and is wired into `CartDrawer.tsx`; `CartIcon.tsx` swaps its manual-open call.

**Tech Stack:** React, TypeScript, Zustand (`persist` middleware), Tailwind.

**No test runner is configured in this repo** (per `CLAUDE.md` — do not add one). Each task's verification step is `npx tsc --noEmit` (type safety) plus a manual check via `npm run dev`, matching this repo's existing convention (see `docs/superpowers/specs/2026-08-14-users-account-status-filter-design.md`'s Testing section).

**Branch:** Already on `docs/cart-auto-close-drawer-spec` (holds the approved spec commit). Continue committing here; branch naming/PR base gets sorted at `finishing-a-development-branch` time, not a blocker for implementation.

Full design context: `docs/superpowers/specs/2026-08-21-cart-auto-close-drawer-design.md`.

---

### Task 1: Extend `ICartSlice` with the new store fields/actions

**Files:**
- Modify: `src/utils/api/marketPlace/interface.ts:77-101`

- [ ] **Step 1: Add the new fields to `ICartSlice`**

Current (`interface.ts:85-86`):
```ts
  cartOpen: boolean;
  toggleCart: (value: boolean) => void;
```

Replace with:
```ts
  cartOpen: boolean;
  toggleCart: (value: boolean) => void;
  /** True only when the drawer was opened by addToCart (not the cart icon). */
  cartAutoCloseArmed: boolean;
  /** Bumped on every addToCart call so an effect keyed on it can restart a
   * 5s auto-close countdown even when cartOpen/cartAutoCloseArmed didn't
   * themselves change value (e.g. adding a 2nd item while already open). */
  cartAddPulse: number;
  /** Opens the drawer as a deliberate user action — never auto-closes. */
  openCartManually: () => void;
  /** Cancels the auto-close countdown for the current open session. */
  disarmAutoClose: () => void;
```

- [ ] **Step 2: Typecheck (expected to fail — `cartSlice.ts` doesn't implement the new fields yet)**

Run: `npx tsc --noEmit`
Expected: errors in `src/pages/HomePage/pages/MarketPlace/utils/cartSlice.ts` — `Property 'cartAutoCloseArmed' is missing`, `'cartAddPulse' is missing`, etc. This confirms the type change took effect; Task 2 implements the store to satisfy it.

- [ ] **Step 3: Commit**

```bash
git add src/utils/api/marketPlace/interface.ts
git commit -m "feat(cart): add auto-close fields to ICartSlice"
```

---

### Task 2: Implement the new store state/actions in `cartSlice.ts`

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/utils/cartSlice.ts`

- [ ] **Step 1: Add initial state fields**

Current (`cartSlice.ts:10-11`):
```ts
      cartItems: [],
      cartOpen: false,
```

Replace with:
```ts
      cartItems: [],
      cartOpen: false,
      cartAutoCloseArmed: false,
      cartAddPulse: 0,
```

- [ ] **Step 2: Make `addToCart` open + arm the drawer, and drop its toasts**

Current (`cartSlice.ts:12-53`):
```ts
      addToCart: (item) => {
        set((state) => {
          const normalizedQuantity = Math.max(1, Number(item.quantity) || 1);
          const normalizedPrice = Math.max(0, Number(item.price_amount) || 0);
          const normalizedItem = {
            ...item,
            quantity: normalizedQuantity,
            price_amount: normalizedPrice,
          };

          const existingItemIndex = state.cartItems.findIndex(
            (cartItem) =>
              cartItem.product_id === normalizedItem.product_id &&
              cartItem.market_id === normalizedItem.market_id &&
              cartItem.color === normalizedItem.color &&
              cartItem.size === normalizedItem.size
          );

          if (existingItemIndex >= 0) {
            const updatedCartItems = [...state.cartItems];
            const existingItem = updatedCartItems[existingItemIndex];
            const stockCap = normalizedItem.stock ?? Infinity;

            updatedCartItems[existingItemIndex] = {
              ...existingItem,
              ...normalizedItem,
              quantity: Math.min(existingItem.quantity + normalizedQuantity, stockCap),
            };

            showNotification("Product quantity updated in cart", "success");
            return { cartItems: updatedCartItems };
          }

          showNotification("Product added to cart", "success");
          return {
            cartItems: [
              ...state.cartItems,
              { ...normalizedItem, item_uuid: crypto.randomUUID() },
            ],
          };
        });
      },
```

Replace with:
```ts
      addToCart: (item) => {
        set((state) => {
          const normalizedQuantity = Math.max(1, Number(item.quantity) || 1);
          const normalizedPrice = Math.max(0, Number(item.price_amount) || 0);
          const normalizedItem = {
            ...item,
            quantity: normalizedQuantity,
            price_amount: normalizedPrice,
          };

          const existingItemIndex = state.cartItems.findIndex(
            (cartItem) =>
              cartItem.product_id === normalizedItem.product_id &&
              cartItem.market_id === normalizedItem.market_id &&
              cartItem.color === normalizedItem.color &&
              cartItem.size === normalizedItem.size
          );

          const openDrawerState = {
            cartOpen: true,
            cartAutoCloseArmed: true,
            cartAddPulse: state.cartAddPulse + 1,
          };

          if (existingItemIndex >= 0) {
            const updatedCartItems = [...state.cartItems];
            const existingItem = updatedCartItems[existingItemIndex];
            const stockCap = normalizedItem.stock ?? Infinity;

            updatedCartItems[existingItemIndex] = {
              ...existingItem,
              ...normalizedItem,
              quantity: Math.min(existingItem.quantity + normalizedQuantity, stockCap),
            };

            return { cartItems: updatedCartItems, ...openDrawerState };
          }

          return {
            cartItems: [
              ...state.cartItems,
              { ...normalizedItem, item_uuid: crypto.randomUUID() },
            ],
            ...openDrawerState,
          };
        });
      },
```

Note: the `showNotification` import at the top of the file (`cartSlice.ts:5`) is still used by `removeFromCart` (`cartSlice.ts:58`), so leave that import in place — only the two calls inside `addToCart` are removed.

- [ ] **Step 3: Add `openCartManually` and `disarmAutoClose`, update `toggleCart`**

Current (`cartSlice.ts:78-80`):
```ts
      toggleCart: (value) => {
        set({ cartOpen: value });
      },
```

Replace with:
```ts
      toggleCart: (value) => {
        set((state) => ({
          cartOpen: value,
          // Closing always disarms, so state doesn't leak into the next open.
          cartAutoCloseArmed: value ? state.cartAutoCloseArmed : false,
        }));
      },
      openCartManually: () => {
        set({ cartOpen: true, cartAutoCloseArmed: false });
      },
      disarmAutoClose: () => {
        set({ cartAutoCloseArmed: false });
      },
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors) — `cartSlice.ts` now implements every field/action `ICartSlice` declares.

- [ ] **Step 5: Manual check**

Run: `npm run dev`, open the member marketplace, add a product to the cart.
Expected: cart drawer slides open automatically; no "Product added to cart" toast appears.

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/utils/cartSlice.ts
git commit -m "feat(cart): open+arm drawer on addToCart, drop add/update toasts"
```

---

### Task 3: Create the `useCartAutoClose` hook

**Files:**
- Create: `src/pages/HomePage/pages/MarketPlace/components/cart/useCartAutoClose.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useEffect, useState } from "react";
import type { FocusEvent, RefObject } from "react";

import { useCart } from "../../utils/cartSlice";

/** How long the drawer stays open with no interaction before auto-closing. */
export const AUTO_CLOSE_DELAY_MS = 5000;

interface UseCartAutoCloseResult {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onFocus: () => void;
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
}

/**
 * Owns the 5s auto-close countdown for CartDrawer. Pauses while the pointer,
 * a touch, or focus is inside the drawer; resumes a fresh countdown when it
 * leaves. Only ever runs while `cartAutoCloseArmed` is true (i.e. the drawer
 * was opened by addToCart, not by a manual cart-icon click).
 */
export function useCartAutoClose(
  containerRef: RefObject<HTMLDivElement>
): UseCartAutoCloseResult {
  const { cartOpen, cartAutoCloseArmed, cartAddPulse, toggleCart } = useCart();
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    if (!cartOpen || !cartAutoCloseArmed || interacting) return;

    const timer = window.setTimeout(() => {
      toggleCart(false);
    }, AUTO_CLOSE_DELAY_MS);

    return () => window.clearTimeout(timer);
    // cartAddPulse isn't read here, but including it means a re-add while
    // the drawer's already open restarts the countdown even though
    // cartOpen/cartAutoCloseArmed/interacting didn't themselves change.
  }, [cartOpen, cartAutoCloseArmed, interacting, cartAddPulse, toggleCart]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusTarget = event.relatedTarget;
    if (
      containerRef.current &&
      nextFocusTarget instanceof Node &&
      containerRef.current.contains(nextFocusTarget)
    ) {
      // Focus moved to another element still inside the drawer — stay paused.
      return;
    }
    setInteracting(false);
  };

  return {
    onPointerEnter: () => setInteracting(true),
    onPointerLeave: () => setInteracting(false),
    onTouchStart: () => setInteracting(true),
    onTouchEnd: () => setInteracting(false),
    onFocus: () => setInteracting(true),
    onBlur: handleBlur,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. (Nothing imports this hook yet, but it must type-check standalone — `useCart()` already satisfies the fields used here per Task 1/2.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/cart/useCartAutoClose.ts
git commit -m "feat(cart): add useCartAutoClose hook"
```

---

### Task 4: Wire the hook + disarm calls into `CartDrawer.tsx`

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cart/CartDrawer.tsx`

- [ ] **Step 1: Import the hook and pull `disarmAutoClose` from the store**

Current (`CartDrawer.tsx:1-14`):
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
```

Replace with:
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
import { useCartAutoClose } from "./useCartAutoClose";

export default function CartDrawer() {
  const { cartOpen, toggleCart, removeFromCart, disarmAutoClose } = useCart();
```

- [ ] **Step 2: Call the hook and spread its handlers onto the drawer root, disarm on remove**

Current (`CartDrawer.tsx:17-47`):
```tsx
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
```

Replace with:
```tsx
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const autoCloseHandlers = useCartAutoClose(drawerRef);

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
    disarmAutoClose();
    removeFromCart(itemId);
  };

  return (
    <div
      className={`fixed top-[65px] right-0 z-50 flex h-fit w-96 max-w-full flex-col rounded-tl-2xl border border-lightGray bg-white text-primary shadow-2xl transition-transform duration-300 ${
        cartOpen ? "translate-x-0" : "translate-x-full"
      }`}
      ref={drawerRef}
      {...autoCloseHandlers}
    >
```

- [ ] **Step 3: Disarm on "Proceed to checkout"**

Current (`CartDrawer.tsx:85-92`):
```tsx
          <Button
            value="Proceed to checkout"
            className="w-full"
            onClick={() => {
              toggleCart(false);
              navigate(relativePath.member.checkOut);
            }}
          />
```

Replace with:
```tsx
          <Button
            value="Proceed to checkout"
            className="w-full"
            onClick={() => {
              disarmAutoClose();
              toggleCart(false);
              navigate(relativePath.member.checkOut);
            }}
          />
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Manual checks**

Run: `npm run dev`.
1. Add an item → drawer opens; wait 5s untouched → drawer closes.
2. Add an item, move the mouse into the drawer before 5s, then move it out → drawer closes 5s *after* the mouse leaves, not before.
3. Add an item, click a product's remove (X) button, or click "Proceed to checkout" → drawer no longer auto-closes (stays open, or closes because you navigated/clicked X — not because of the timer).
4. Tab (keyboard) into the drawer after an auto-open → countdown pauses while focus is inside; Tab back out → resumes.

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/cart/CartDrawer.tsx
git commit -m "feat(cart): wire useCartAutoClose + disarm-on-interact into CartDrawer"
```

---

### Task 5: Make the cart icon a manual (non-arming) open

**Files:**
- Modify: `src/pages/HomePage/pages/MarketPlace/components/cart/CartIcon.tsx`

- [ ] **Step 1: Swap `toggleCart(true)` for `openCartManually()`**

Current (`CartIcon.tsx:1-15`):
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
```

Replace with:
```tsx
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

import { useCart } from "../../utils/cartSlice";

export function CartIcon() {
  const { openCartManually, getTotalItems } = useCart();

  const cartCount = getTotalItems();

  return (
    <button
      type="button"
      className="relative"
      onClick={() => openCartManually()}
      aria-label={cartCount > 0 ? `Open cart, ${cartCount} items` : "Open cart"}
    >
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Manual check**

Run: `npm run dev`. With nothing pending, click the header cart icon → drawer opens and does **not** auto-close after 5s idle, even with no hover/touch/focus inside it. Click the icon again while an add-to-cart auto-close countdown happens to be running → countdown is cancelled (drawer now behaves as manually opened).

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage/pages/MarketPlace/components/cart/CartIcon.tsx
git commit -m "feat(cart): cart icon opens manually, never auto-closes"
```

---

### Task 6: Full regression pass against the spec's test checklist

**Files:** none (verification only)

- [ ] **Step 1: Run the complete manual QA checklist from the spec**

Run: `npm run dev`, then walk through all 7 items in `docs/superpowers/specs/2026-08-21-cart-auto-close-drawer-design.md`'s Testing section end-to-end in one sitting (add+idle-close, add+hover-then-close, add+interact-stays-open, icon-open-never-closes, touch-emulated mobile, keyboard tab-in/out). Confirm every one still holds with all 5 tasks' changes combined (catches any interaction between tasks that step-by-step checks might've missed, e.g. a rapid double-add across two different products).

- [ ] **Step 2: Run `npm run lint`**

Run: `npm run lint`
Expected: PASS with 0 warnings (`--max-warnings 0` per `CLAUDE.md`).

- [ ] **Step 3: Final typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

No commit for this task — it's a verification pass over Tasks 1-5's already-committed changes.
