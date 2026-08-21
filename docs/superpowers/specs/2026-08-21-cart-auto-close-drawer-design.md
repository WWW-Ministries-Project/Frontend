# Marketplace Cart — Auto-Open + Auto-Close Drawer

Status: design approved, not yet implemented.
Date: 2026-08-21.
Frontend only. No backend change.

## Goal

Adding an item to the marketplace cart currently only fires a toast
(`cartSlice.ts:41,45` — "Product added to cart" / "Product quantity updated
in cart"); the `CartDrawer` itself stays closed until the user manually
clicks the cart icon. There's no visual confirmation of *where the cart is*
or *what's in it* right after adding.

Fix: auto-open `CartDrawer` on add-to-cart, then auto-close it after 5s of
no interaction — but only for that auto-opened case. A user who deliberately
clicks the cart icon to browse it should never have it vanish out from under
them.

## Interaction rules (decided during brainstorming)

- **Hover/touch/focus inside the drawer pauses the countdown.** Leaving
  resumes a fresh 5s (not a resume-from-leftover-time — simpler, and more
  forgiving than resuming a near-zero countdown after a brief glance).
- **Clicking a control inside the drawer** (qty +/-, remove item, proceed to
  checkout) **permanently disarms auto-close** for that open session — drawer
  then behaves exactly like a manually-opened one (closes only via X /
  click-outside / checkout nav).
- **Manually opening via the cart icon never arms auto-close at all** — same
  end state as "clicked a control inside," just reached differently.
- Rapid adds (different products) while the drawer's already open each
  restart the 5s window — never stacks multiple timers.
- Toast on add-to-cart is **dropped** — the drawer opening + showing the new
  line item is the confirmation now.

## Frontend changes

**`src/utils/api/marketPlace/interface.ts`** (`ICartSlice`)
- Add `cartAutoCloseArmed: boolean`.
- Add `cartAddPulse: number` — bumped on every `addToCart` call. A plain
  boolean re-open wouldn't retrigger a `useEffect` keyed on it (`true → true`
  is not a change), so a counter is what actually restarts the countdown
  when a 2nd item is added while the drawer's already open.
- Add `openCartManually: () => void`.
- Add `disarmAutoClose: () => void`.

**`src/pages/HomePage/pages/MarketPlace/utils/cartSlice.ts`**
- `addToCart` (existing action): in addition to its current mutation, set
  `cartOpen: true, cartAutoCloseArmed: true, cartAddPulse: state.cartAddPulse + 1`.
  Remove the two `showNotification(...)` calls at lines 41 and 45.
- `openCartManually` (new): `set({ cartOpen: true, cartAutoCloseArmed: false })`.
- `disarmAutoClose` (new): `set({ cartAutoCloseArmed: false })`.
- `toggleCart(false)` (existing, used by X / click-outside / checkout nav):
  also reset `cartAutoCloseArmed: false` so state doesn't leak into the next
  open.

**New: `src/pages/HomePage/pages/MarketPlace/components/cart/useCartAutoClose.ts`**
- Keeps timer/hover/touch/focus concerns out of `CartDrawer.tsx`.
- Reads `cartOpen, cartAutoCloseArmed, cartAddPulse, toggleCart` from
  `cartSlice`.
- Local state: `interacting: boolean`.
- Returns handlers to spread onto the drawer's root element:
  `onPointerEnter` / `onPointerLeave` (mouse), `onTouchStart` / `onTouchEnd`
  (touch), `onFocus` / `onBlur` (keyboard/screen-reader — blur checked
  against the container ref, same pattern as `CartDrawer.tsx`'s existing
  click-outside listener) — all just flip `interacting`.
- One `useEffect`, deps `[cartOpen, cartAutoCloseArmed, interacting, cartAddPulse]`:
  if `cartOpen && cartAutoCloseArmed && !interacting`, start
  `setTimeout(() => toggleCart(false), AUTO_CLOSE_DELAY_MS)`; cleanup clears
  it. Because the effect reruns whenever `cartAddPulse` changes, a re-add
  while open restarts the countdown even though `cartOpen`/`armed`/
  `interacting` didn't change value.
- `AUTO_CLOSE_DELAY_MS = 5000`, exported as a named constant so it's a
  one-line tweak later.

**`src/pages/HomePage/pages/MarketPlace/components/cart/CartDrawer.tsx`**
- Call `useCartAutoClose()`, spread its handlers onto the drawer's root div
  (alongside the existing `drawerRef`).
- Add `disarmAutoClose()` calls in the existing qty +/-, remove-item, and
  "Proceed to checkout" click handlers.
- X-button and click-outside close paths (`CartDrawer.tsx:20-36,54-60`)
  unchanged — they already call `toggleCart(false)`, which now also resets
  `cartAutoCloseArmed`.

**`src/pages/HomePage/pages/MarketPlace/components/cart/CartIcon.tsx`**
- Swap the existing `toggleCart(true)` call (`CartIcon.tsx:14`) for
  `openCartManually()`.

## Data flow

1. User confirms "Add to cart" on a product (`ProductDetails.tsx` →
   `addToCart`). `cartSlice.addToCart` mutates `cartItems`, sets
   `cartOpen: true`, `cartAutoCloseArmed: true`, bumps `cartAddPulse`.
2. `CartDrawer` re-renders open (`translate-x-0`). `useCartAutoClose`'s
   effect sees `cartOpen && armed && !interacting` → starts a 5s timer.
3a. No interaction → timer fires → `toggleCart(false)` → drawer closes,
    `cartAutoCloseArmed` resets to `false`.
3b. Pointer/touch/focus enters the drawer → `interacting: true` → effect
    cleanup clears the pending timeout. Leaving → `interacting: false` →
    effect reruns, starts a fresh 5s.
3c. User clicks qty/remove/checkout inside → handler calls
    `disarmAutoClose()` → `cartAutoCloseArmed: false` → effect's guard
    (`cartAutoCloseArmed`) fails on next run → no more timers scheduled;
    drawer now only closes via X/click-outside/checkout-nav.
4. Separately, clicking the cart icon calls `openCartManually()` directly
   → `cartOpen: true, cartAutoCloseArmed: false` → auto-close never arms for
   that open, regardless of whether a countdown was already running (icon
   click mid-countdown effectively disarms it too — falls out of the
   design for free, no special-casing needed).

## Edge cases

- **Icon-click while an auto-close countdown is running:** treated as
  `openCartManually()`, which disarms — feels right, that's a deliberate
  look at the cart.
- **Multiple rapid adds from different products:** each bump of
  `cartAddPulse` restarts the single timer via the effect's cleanup/rerun;
  never accumulates parallel timeouts.
- **Keyboard/screen-reader users:** tabbing into the drawer's contents after
  an auto-open pauses via `onFocus`/`onBlur`, same rule as hover — avoids
  the auto-dismissing-UI timing trap (WCAG 2.2.1-style concern) that a
  naive "always closes after 5s no matter what" implementation would hit.
- **Drawer-internal qty/remove edits** (`updateVariant`, `removeFromCart`)
  don't themselves touch `cartAutoCloseArmed` in the store — disarming is
  driven by the UI's click handlers in `CartDrawer.tsx` calling
  `disarmAutoClose()` explicitly, so the store actions stay context-free.
- **Background/throttled tabs:** `setTimeout` may fire late if the tab is
  backgrounded; acceptable, not specially handled — same as any other timer
  in the app (`NotificationCard.tsx`, `GivingComplete.tsx`, etc.).

## Testing

No test runner configured in this repo (per `CLAUDE.md`) — manual
verification via `npm run dev`:

1. Add item from a product page → drawer opens, no toast fires.
2. Leave it untouched 5s → drawer closes.
3. Add item, hover inside before 5s elapses, then move away → drawer closes
   5s *after* leaving, not before.
4. Add item, click a qty +/- or remove control inside → drawer stays open
   indefinitely (only X/click-outside/checkout-nav closes it).
5. Click the cart icon with nothing pending → opens, never auto-closes even
   after 5s idle.
6. Emulate a touch/mobile viewport → tap inside pauses the countdown same as
   hover; lifting the touch resumes it.
7. Tab (keyboard) into the drawer's contents after an auto-open → countdown
   pauses while focus is inside; tabbing back out resumes it.
