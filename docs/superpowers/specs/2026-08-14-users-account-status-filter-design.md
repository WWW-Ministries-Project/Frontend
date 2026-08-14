# Settings > Users — Account Status Filter

Status: design approved, not yet implemented.
Date: 2026-08-14.
Frontend only. No backend change.

## Goal

Settings > Users list (`UserManagement.tsx`) has a search box but no
dropdown filter — `HeaderControls` is called with `hasFilter={false}`. Add
an Account Status (Active/Inactive) filter, matching the pattern already
proven on the Members page.

## Why no backend work

The Users list and Members list hit the same endpoint
(`GET user/list-users`, wrapped by `api.fetch.fetchAllMembers`). The backend
handler (`Backend/src/modules/user/userController.ts`, `ListUsers`) already
filters on `is_active` (boolean) when the query param is present
(`userController.ts:1882-1891`). `Members.tsx` already sends this exact
param today (`activeStateFilter = searchParams.get("is_active")`). So the
Users page only needs to send the same param — no migration, no route
change, no new field. `is_active` is a plain boolean column; there is no
suspended/pending state to filter on.

## Frontend changes

**`src/pages/HomePage/pages/Users/UserManagement.tsx`**
- Add `showFilter` / `setShowFilter` state; flip `hasFilter={false}` →
  `hasFilter={true}` on `HeaderControls`, wired to the toggle (same as
  `Members.tsx`).
- Add `statusFilter` state (`useState<string>("")`) — local component
  state, not URL-synced. (This page's existing search box —
  `searchedUser`/`setSearchedUser` — isn't URL-synced either, so this stays
  consistent with the page's current convention rather than adopting
  Members' `useSearchParams` wiring.)
- Merge into the existing refetch call:
  `refetchMembers({ page: "1", limit: "12", name: searchedUser, is_active: statusFilter || undefined })`
- Render the new filter panel below/beside the search bar when
  `showFilter` is true.

**New: `src/pages/HomePage/pages/Users/Components/UsersFilter.tsx`**
- Small component, mirrors `MembersFilter.tsx` but with a single field:
  ```tsx
  const activeStateOptions: ISelectOption[] = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ];

  <Filter
    name="is_active"
    label="Account Status"
    placeholder="All statuses"
    options={activeStateOptions}
    value={statusFilter}
    onChange={(_, value) => setStatusFilter(value)}
  />
  ```
- Uses the shared `Filter` component
  (`src/pages/HomePage/Components/reusable/Filter.tsx`) — same one
  `MembersFilter.tsx` uses, so styling/behavior (incl. auto "All ..."
  blank option) matches the rest of the app.

## Data flow

1. User opens filter panel (`showFilter` toggle) → picks Active/Inactive
   (or clears back to All) in `UsersFilter`.
2. `onChange` sets `statusFilter` in `UserManagement.tsx`.
3. Query merge includes `is_active: statusFilter || undefined` — omitted
   entirely when unset, so the backend's existing "no filter" behavior
   (`is_active === undefined` → no `where` clause added) applies.
4. `useFetch`/`refetchMembers` re-runs against `list-users` with the new
   param; table re-renders with the filtered set. Branch-scoping
   (`activeBranchId`) is untouched — status filter composes with it, not
   replaces it.

## Error handling / edge cases

- Clearing the filter (selecting the auto-added blank "All ..." option)
  sends `undefined`, restoring the unfiltered list — no separate "clear"
  button needed, matches `Filter.tsx` convention.
- Combining status filter + search box: both params sent together in the
  same query object; backend `ListUsers` already ANDs whatever filters are
  present in `whereConditions`, so no special-casing needed.
- No loading/error states beyond what `useFetch` already provides for this
  hook — this change doesn't touch fetch/error plumbing, only the query
  shape.

## Testing

No test runner configured in this repo (per CLAUDE.md) — manual
verification only: toggle filter panel, pick Active/Inactive, confirm
table updates and combines correctly with search box and branch selector.
