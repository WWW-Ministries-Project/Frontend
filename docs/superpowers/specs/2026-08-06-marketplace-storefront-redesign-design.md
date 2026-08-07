# Marketplace Storefront Redesign — Design Spec

**Date:** 2026-08-06
**Status:** Approved (pending spec review)
**Scope owner:** Member portal marketplace (customer-facing storefront) + light admin visual polish

## 1. Context

The member portal already has a working end-to-end marketplace flow: browse → product detail → cart → checkout → payment (Paystack/Hubtel) → payment verification → order history. It is functional but reads as admin CRUD leaking into a member view rather than a polished shop experience. This spec redesigns the **visual and interaction design** of that existing flow using **existing data and API only** — no new backend endpoints, no new data model fields, no new payment providers.

### Goals (from stakeholder input)

1. Look "e-commerce grade" — not admin-CRUD-styled.
2. Better discovery: browse/search/filter across products from multiple active markets.
3. Better cart/checkout: lower friction, reassuring, fewer separate pages.
4. Better post-purchase: clear order status/tracking, not just a bare list.

### Explicit non-goals (YAGNI)

- No wishlist / save-for-later.
- No reviews or ratings.
- No "reorder" shortcut.
- No new payment provider (Paystack/Hubtel only, unchanged).
- No new order/payment/delivery status values beyond the existing `PaymentStatus` (`pending|success|failed|delivered`) and delivery status (`pending|shipped|delivered|cancelled`).
- No changes to the RBAC/permission model (`view_marketplace`/`manage_marketplace`) or route privacy flags.
- No changes to guest ("out") checkout persistence mechanism or the `wwm-mobile://payment/verify` deep link contract.

## 2. Information Architecture & Navigation

**Model: unified storefront, markets as sections** (not a market-picker-first model). Members should not have to pick a "store" before shopping — all products from active markets are browsable together, with market identity surfaced contextually rather than as a hard boundary.

**Homepage** (rebuild of `src/pages/MembersPage/Pages/ProductsPage.tsx`, also reused by guest `/out/products`):

- Hero banner for the single most-relevant active market (nearest `end_date` among `status === "active"` markets), pulling `IMarket.name`/`description`/dates already returned by `fetchMarkets`.
- Row of market chips below the hero — one per active market — acting as a quick filter (clicking a chip filters the grid to that `market_id`; no navigation away from the page).
- Unified product grid beneath, sourced from `fetchAllProducts`, rendered via the existing `GridComponent`/`GridWrapper` pagination pattern.
- Horizontal filter bar above the grid: category (`product_category_id`), market (redundant with chips but useful once scrolled past them), price range — built from the existing `Filter` + `SearchBar` components, restyled, not restructured.

This satisfies "reuse existing data": no new grouping/tagging concept is introduced — `IMarket.status`, `end_date`, and `IProduct.product_category_id`/`market_id` already carry everything needed.

## 3. Product Card & Product Detail Page

**Product card** (`cards/ProductCard.tsx`) — **minimal style**, used identically across home grid, category-filtered grid, and PDP's related-products row:

- Product image (first colour's `image_url`), category label, product name, price (`price_amount`/`price_currency`), and small colour swatches derived from `product_colours[].colour`.
- No stock-urgency badges, no inline "quick add to cart" button, no per-card market label — market context is established by the section/chip the card appears under, not repeated on every card. Keeps the card quiet and consistent with "don't overdo it for a church marketplace."

**PDP** (`src/pages/MembersPage/Pages/ProductDetailsPage.tsx`):

- Restyled gallery keyed by `product_colours` (selecting a colour swatch swaps the shown image and, where `stock_managed === "yes"`, the available sizes from that colour's `stock[]`).
- Size/colour selector + quantity stepper, sticky "Add to cart" action.
- Description (`IProduct.description`), rendered through `dompurify` before insertion (project convention per CLAUDE.md for any server-supplied HTML/rich text) — apply this in the PDP if the current implementation does not already sanitize it.
- Context line: "Part of `{market.name}`" using the market data already joined via `IProductTypeResponse.market` or a lookup against the fetched markets list.
- Related products: same-market and/or same-`product_type_id` items, filtered client-side from the already-fetched product list — no new endpoint required.

## 4. Cart & Checkout

**Cart**: keep the existing slide-over `CartDrawer` (opened from `CartIcon`) as the only cart surface during browsing — visual refresh only, `cartSlice.ts` logic (add/remove/update variant/quantity/stock caps) is unchanged. The standalone full-page cart (`ViewCart.tsx`/`CartTable.tsx`) is retired; "View cart" / continuing from the drawer leads straight into checkout.

**Checkout** (`CheckOutPage.tsx` / `CheckOutForm.tsx`): single consolidated page combining:

1. Editable order summary (quantity change / remove line item inline, backed by `cartSlice`).
2. Billing form (unchanged fields, Formik + Yup, shared field components `FormikInputDiv`/`FormikSelect`).
3. Payment method picker (`PaymentOptionsSubForm` — Paystack/Hubtel, unchanged).
4. Single "Pay now" action, preceded by the existing order-confirmation modal (acknowledgement checkbox), restyled.

This replaces the current cart-page → checkout-page two-step with one page, matching the "drawer cart + single checkout page" decision.

**Guest ("out") flow**: `ProductsPage`/`ProductDetailsPage`/`CheckOutPage` already branch on route (`/out/...` vs `/member/...`); the single-item `localStorage` (`my_cart`) guest-checkout mechanism (`getGuestCheckoutItem`) is preserved exactly — it simply inherits the new styling, no logic change.

## 5. Orders / Post-Purchase

**`MyOrders.tsx`** — compact list: order number, date, total, payment-status badge, delivery-status badge per row. Clicking a row opens a **detail drawer** (not a new page) showing:

- Line items (from the order's cart-item-shaped fields on `IOrders`).
- Billing snapshot (`IUserDetails` fields already on `IOrders`).
- A status timeline/stepper (`Ordered → Paid → Preparing → Shipped → Delivered`) derived purely from existing `payment_status`/`delivery_status` values — no new states, just a visual mapping of the current enum values onto stepper positions (e.g. `payment_status !== "success"` → timeline stalls at "Ordered"; `delivery_status` progresses the remaining steps).
- "Pay now" retry action for `payment_status === "pending"` orders, calling the existing `retryOrderPayment`, unchanged.

**`VerifyPayment.tsx`**: restyle the waiting/countdown UI only. The `wwm-mobile://payment/verify?...` deep link redirect for the mobile app return is preserved byte-for-byte in behavior.

## 6. Admin Polish (in scope, visual-only)

To keep member and admin views feeling like one product, apply the new visual language (spacing, colour tokens, chip styles) to:

- `MarketCard.tsx`, `ProductDetailsCard.tsx` (admin grid cards)
- `MarketOrders.tsx` / shared `Orders.tsx` table

No functional changes to admin CRUD: `MarketPlace.tsx` create/update/duplicate/delete, `AddMarketForm.tsx`, `ProductForm.tsx`, `ConfigurationsDrawer.tsx`, and delivery-status update logic in `MarketOrders.tsx` are untouched.

## 7. New/Generalized Shared Components

Kept intentionally small — only what's reused across ≥2 call sites:

- **`Skeleton`** — a proper shared loading-skeleton component, replacing the ad hoc inline pulse skeletons currently duplicated in `ProductsPage.tsx` and `ProductDetailsPage.tsx`. Reused by both member and admin grids.
- **Status timeline/stepper** — one small component used by both the member order-detail drawer and (optionally, visually) the admin `MarketOrders` delivery-status display.

Everything else reuses existing primitives as-is: `PageOutline`, `HeaderControls`, `GridComponent`/`GridWrapper`, `TabSelection`, `Modal`, `Button`, `EmptyState`, `SearchBar`, `Filter`, `Action`/`ActionButton`. No parallel/competing component system is introduced.

## 8. Non-Functional

- **Data/API**: zero backend changes. All screens continue to call the existing `fetchMarkets`, `fetchAllProducts`, `fetchProductsByMarket`, `fetchProductById`, `createOrder`, `fetchOrdersByUser`, `retryOrderPayment`, `verifyPayment` functions in `apiFetch.ts`/`apiPost.ts`.
- **Permissions/routing**: unchanged. Member/guest marketplace routes remain `isPrivate: false` with no `permissionNeeded`; admin marketplace routes keep `view_marketplace`/`manage_marketplace` gating exactly as today.
- **Payments**: Paystack/Hubtel only, no new gateway, no changes to `reconcileHubtelPendingPayments` admin utility.
- **Verification** (no test runner in repo): `npm run lint` (0 warnings, per `--max-warnings 0`), `npx tsc --noEmit`, and manual walkthrough of:
  - Member: home → filter/search → PDP → add to cart (drawer) → checkout → payment redirect → verify → order history → order detail drawer → retry-pay on a pending order.
  - Guest: `/out/products` → PDP → guest checkout → payment redirect → verify.
  - Admin: market/product grids and orders table visual spot-check, confirm CRUD still functions.
- **Rollout**: single feature branch cut from `development` (never reopening a merged branch, per CI guard), PR targeted at `development`. No `.env`/`REACT_APP_API_URL` changes, no coordination needed with the sibling Backend repo.

## 9. Out of Scope / Explicitly Deferred

- Wishlist, reviews/ratings, reorder shortcut (see §1 non-goals).
- Any new payment provider or checkout financing option.
- Any change to the underlying `IMarket`/`IProduct`/`IOrders` data shapes — if a future iteration needs a real Vendor/Seller entity or richer order states, that is a separate spec requiring backend coordination.
