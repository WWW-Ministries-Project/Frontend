# Life Center Meetings — Table View & Detail Layout

Status: approved, pending implementation plan.
Date: 2026-08-05.
Repo touched: Frontend only (web).
Related: `docs/superpowers/specs/2026-08-05-life-center-meetings-design.md` (original
feature spec — data model, API, forms). This spec only changes how the
already-shipped "My Meetings" list and its View modal are *presented*; no API,
form, or access-control change.

## Goal

Replace the current card-grid "My Meetings" overview with a table, matching
the table convention already used elsewhere in the app (and by the sibling
`LifeCenterRoles.tsx` in the same feature folder). Improve the View modal's
layout so attendees and first-timers read as distinct groups and the note is
visually set apart.

## Non-goals

- No change to create/edit/delete flows, Formik validation, or the
  create/update/delete API calls.
- No change to access gating (`canManageHere`, `accessMode` prop,
  `ActionButton`'s `requireManageAccess`/`requireAdminAccess`).
- No change to the `fetchMeetings` query shape or the backend contract.
- Does not touch `MeetingForm.tsx` (already reworked in the prior layout fix
  for Note/Currency/Offering).

## Current state (for reference)

`MeetingsList.tsx` renders one card per meeting in a
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` div, with `ActionButton`
absolutely positioned over each card (same technique as sibling
`SoulsWon.tsx`). Pagination is a hand-rolled "Previous / Page X of Y / Next"
row. The View modal (`viewing` state, same file) renders a single flat
`<ul>` of attendees with a `(first timer)` suffix per name, plus the raw
sanitized note HTML in a bare div.

## Design

### 1. Table

Swap the card grid for the codebase's existing `TableComponent`
(`src/pages/HomePage/Components/reusable/TableComponent.tsx`, a
`@tanstack/react-table` wrapper), used exactly as `LifeCenterRoles.tsx` uses
it in this same folder tree.

Column defs (`useMemo`, following `LifeCenterRoles.tsx`'s `columns` pattern):

| Header | Cell |
|---|---|
| Date | `format(new Date(meeting.date), "dd MMM yyyy")` |
| Offering | `{meeting.currency} {meeting.offeringAmount}` |
| Attendees | count of non-first-timer attendees, rendered via `Badge` |
| First timers | count of first-timer attendees, rendered via `Badge` |
| Actions | `ActionButton` — same `onView`/`onEdit`/`onDelete`/`requireManageAccess`/`requireAdminAccess` wiring as today, just moved from an absolutely-positioned card overlay into a normal table cell (no extra positioning wrapper needed — `ActionButton`'s own dropdown is self-positioning, confirmed from `LifeCenterRoles.tsx` usage) |

`TableComponent` props: `columns`, `data={meetings}`, `total={data?.meta?.total}`,
`take={10}`, `onPageChange={(newPage) => setPage(newPage)}`. This replaces the
current manual Previous/Next buttons — `TableComponent` renders
`PaginationComponent` internally once `total > take`.

Empty state: keep `EmptyState`, rendered as a sibling condition
(`meetings.length === 0`) above/instead of the table, matching
`LifeCenterRoles.tsx` rather than nesting inside table markup.

Header row (`HeaderControls` title + "Create Meeting" button) is unchanged.

### 2. View modal

Restructure the existing `viewing` modal body:

- Header stays plain text: meeting date as heading, offering as a line below
  (no change from today — user confirmed no header/meta redesign needed).
- **Attendees** — own labeled list, name only (drop the `(first timer)`
  suffix since first-timers move to their own section).
- **First timers** — separate labeled list section, rendered only when
  `viewing.attendees.some(a => a.isFirstTimer)` is true.
- **Note** — moved into a bordered/boxed section (`border rounded-md p-3`,
  consistent with the app's existing card/box language), sanitized HTML via
  the same `DOMPurify.sanitize` call already in place, rendered only when
  `viewing.note` is truthy (unchanged condition, just re-styled).

### 3. Unaffected

Create/edit/delete handlers (`handleSave`, `handleDelete`), the
`postResponse`/`updateResponse` refetch effects, `canManageHere` computation,
and the `MeetingForm` modal wiring are untouched — this is a render-layer-only
change inside `MeetingsList.tsx`.

## Testing / verification

No test runner in this repo (per `CLAUDE.md`). Verification is:
- `npx tsc --noEmit` — must stay clean.
- `npm run lint` — must stay at 0 warnings.
- Manual QA: confirm the table renders with correct counts, pagination
  advances/retreats correctly, View modal shows split attendee/first-timer
  lists and boxed note, on both admin (`ViewLifeCenter.tsx`) and member
  (`MyLifeCenter.tsx`) surfaces (same shared `MeetingsList` component, both
  `accessMode`s).

## Open assumptions

1. `Badge`'s default styling (blue pill) is acceptable for the Attendees/
   First-timers count cells — no new color convention requested.
2. Table row click does not need a global `onRowClick` — View/Edit/Delete
   stay solely in the Actions column, matching `LifeCenterRoles.tsx` (no
   row-click-to-view behavior was requested).
