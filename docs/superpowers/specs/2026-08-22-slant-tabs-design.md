# SlantTabs component — design spec

Date: 2026-08-22
Status: Approved

## Problem

Member portal needs a new tab visual (angled/trapezoid tab shape, black active tab / white
inactive tabs, thick baseline rule — see reference mockup) for two places:

1. Marketplace — switching between **Products** and **Orders**
2. Life Center — switching between **Souls Won** and **My Meetings**

The existing tab component, `TabSelection` (`src/pages/HomePage/Components/reusable/TabSelection.tsx`),
renders a pill/segmented-control look and is also used by two admin pages
(`ViewLifeCenter.tsx`, `MarketPlace.tsx`) that are **out of scope** and must keep their current
look unchanged.

## Decision

Build a new, separate component rather than adding a variant to `TabSelection`. The visual is
categorically different (custom vector shape vs. rounded-rect pill), and a separate component
means zero risk of regressing the two admin pages still on the pill style.

## Component: `SlantTabs`

**File:** `src/pages/HomePage/Components/reusable/SlantTabs.tsx` (colocated with `TabSelection`,
same reusable folder).

### Props

Mirrors `TabSelection`'s core API for a drop-in swap:

```ts
interface SlantTabsProps<T extends string = string> {
  tabs: T[];
  selectedTab: T;
  onTabSelect: (tab: T) => void;
}
```

No `tabIcons` prop — the reference mockup has no icons, and neither target use case needs one.
Can be added later if a real need shows up (YAGNI).

### Visual shape

Each tab is an isosceles-trapezoid: wide at the bottom, narrower at the top, both side edges
slanted inward toward the top, top corners rounded.

Implementation: one inline `<svg>` per tab as the background layer, `preserveAspectRatio="none"`,
a single `<path>` filling the full 100%×100% box. This scales the shape to any label width
(non-uniform scaling may squash the corner radius slightly on very wide/narrow tabs — acceptable
for a small decorative radius). Chosen over `clip-path: polygon(... round Xpx)` because that syntax
lacks Safari support; SVG shapes are universally supported.

Text renders in a normal (unskewed, unscaled) DOM layer on top of the SVG, so labels stay crisp
and horizontal regardless of the tab's shape.

### Color / typography states

| State    | Fill    | Text                                   |
|----------|---------|-----------------------------------------|
| Active   | black   | white, uppercase, bold                  |
| Inactive | white   | `gray-400`, uppercase, medium weight    |
| Hover (inactive) | white | darkens toward `gray-600`        |

All colors come from existing Tailwind tokens (`black`, `white`, `gray-400`, `gray-600` from
`tailwind.config.js`) — no new hex values introduced.

### Layout / overlap

Tabs sit in a row. Each tab after the first overlaps the previous tab's right slanted edge via a
negative left margin. Stacking order (z-index) is **position-based**, descending left→right — the
leftmost tab is always frontmost. This matches the reference mockup exactly and is sufficient for
both real call sites, which only ever render 2 tabs. It does **not** attempt to solve the general
case of an active tab further right needing to pop above an earlier tab — not needed here, not
built.

A 3px solid black rule spans the full width beneath the row; every tab's bottom edge sits flush
against it (no gap, no radius on bottom corners).

### Responsive behavior

No overflow chevrons or mobile vertical-stack fallback (unlike `TabSelection`) — stacking would
break the slanted-shape look, and both use cases only ever have 2 short labels, so it isn't needed.
On narrow viewports the row simply allows horizontal scroll (`overflow-x-auto`) as a safety net.

### Accessibility

Same pattern as `TabSelection`, minus the overflow-specific pieces:
- Container: `role="tablist"`
- Each tab: `role="tab"`, `aria-selected`, `tabIndex` (0 for active, -1 otherwise)
- `ArrowLeft` / `ArrowRight` on the tablist cycle `onTabSelect` through `tabs`

## Integration points (2 files, swap only)

1. `src/pages/MembersPage/Pages/Market.tsx` — replace `TabSelection` import/usage with
   `SlantTabs` for the `["Products", "Orders"]` tab bar. No change to `handleSelectedTab` or
   route-driven selection logic.
2. `src/pages/MembersPage/Pages/MyLifeCenter.tsx` — replace `TabSelection` import/usage with
   `SlantTabs` for the `["Souls Won", "My Meetings"]` tab bar. No change to local `useState`
   selection logic.

## Explicitly out of scope

- `src/pages/HomePage/pages/LifeCenter/pages/ViewLifeCenter.tsx` (admin) — stays on `TabSelection`.
- `src/pages/HomePage/pages/MarketPlace/MarketPlace.tsx` (admin, Upcoming/Active/Ended tabs) —
  stays on `TabSelection`.
- `TabSelection.tsx` itself — not modified.
- Icon support, >2-tab active-reorder z-index, mobile vertical stacking — not built (YAGNI, no
  current use case needs them).
