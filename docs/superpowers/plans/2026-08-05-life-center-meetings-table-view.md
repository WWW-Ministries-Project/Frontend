# Life Center Meetings Table View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "My Meetings" card grid with a table (matching the app's `TableComponent` convention) and restructure the meeting View modal into distinct Attendees/First-timers sections with a boxed Notes area.

**Architecture:** Single-file change to `MeetingsList.tsx`. The card grid becomes a `ColumnDef<MeetingType>[]` fed into the existing `TableComponent`/`PaginationComponent` pair (the same pattern already used by sibling `LifeCenterRoles.tsx` and by `EventsManagement.tsx` for real server-paginated lists). Because `PaginationComponent` reads/writes its current page via the URL's `?page=`/`?take=` query params internally (`usePaginate` → `usePaginationQueryParams`), the component must adopt `usePaginationQueryParams` itself as the single source of truth for `page`/`take`, replacing the local `useState` — otherwise the fetched page and the pagination widget's highlighted page would desync. No other component on the `ViewLifeCenter.tsx`/`MyLifeCenter.tsx` routes touches those query params (confirmed: `SoulsWon.tsx` fetches unpaginated), so there's no collision risk. The View modal split is a pure JSX restructure of the same `viewing` state, no data changes.

**Tech Stack:** React, TypeScript, `@tanstack/react-table` (via the existing `TableComponent` wrapper), Tailwind, `date-fns`, `dompurify`.

**No test runner exists in this repo** (per `CLAUDE.md`) — verification per task is `npx tsc --noEmit` + `npm run lint` (fails on any warning), plus a manual-QA note, not automated tests.

---

### Task 1: Restructure the View modal (split Attendees/First-timers, boxed Notes)

**Files:**
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx`

- [ ] **Step 1: Replace the `viewing` modal body**

Find this block (the `<Modal open={Boolean(viewing)} ...>` near the end of the file, right before the closing `</div>` of the component):

```tsx
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="p-6 max-w-lg mx-auto bg-white rounded-lg space-y-3">
            <h3 className="text-lg font-semibold">
              Meeting — {format(new Date(viewing.date), "dd MMM yyyy")}
            </h3>
            <p className="text-sm text-gray-600">
              Offering: {viewing.currency} {viewing.offeringAmount}
            </p>
            <div>
              <p className="font-medium text-sm">Attendees</p>
              <ul className="text-sm text-gray-700 list-disc pl-5">
                {viewing.attendees.map((a) => (
                  <li key={a.soulWonId}>
                    {a.name}
                    {a.isFirstTimer ? " (first timer)" : ""}
                  </li>
                ))}
              </ul>
            </div>
            {viewing.note && (
              <div
                className="text-sm text-gray-700 prose"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(viewing.note),
                }}
              />
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
```

Replace it with:

```tsx
      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="p-6 max-w-lg mx-auto bg-white rounded-lg space-y-3">
            <h3 className="text-lg font-semibold">
              Meeting — {format(new Date(viewing.date), "dd MMM yyyy")}
            </h3>
            <p className="text-sm text-gray-600">
              Offering: {viewing.currency} {viewing.offeringAmount}
            </p>
            <div>
              <p className="font-medium text-sm">Attendees</p>
              {viewing.attendees.filter((a) => !a.isFirstTimer).length > 0 ? (
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {viewing.attendees
                    .filter((a) => !a.isFirstTimer)
                    .map((a) => (
                      <li key={a.soulWonId}>{a.name}</li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">None recorded</p>
              )}
            </div>
            {viewing.attendees.some((a) => a.isFirstTimer) && (
              <div>
                <p className="font-medium text-sm">First timers</p>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {viewing.attendees
                    .filter((a) => a.isFirstTimer)
                    .map((a) => (
                      <li key={a.soulWonId}>{a.name}</li>
                    ))}
                </ul>
              </div>
            )}
            {viewing.note && (
              <div className="rounded-md border border-gray-200 p-3">
                <p className="font-medium text-sm mb-1">Notes</p>
                <div
                  className="text-sm text-gray-700 prose"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(viewing.note),
                  }}
                />
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md"
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
```

(The "None recorded" fallback is needed because splitting into two sections means the Attendees list alone can now be empty — e.g. a meeting where every person recorded was a first-timer. The old flat list never hit this case because it always had ≥1 combined entry.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npx eslint src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx --max-warnings 0`
Expected: no output (clean).

- [ ] **Step 4: Manual QA note**

Open a life center with at least one logged meeting that has both attendees and first-timers, one with only first-timers, and one with a note. Confirm: two separate lists render (no more `(first timer)` suffix), the "None recorded" fallback shows when there are zero plain attendees, and the note renders inside a bordered box.

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx
git commit -m "feat: split attendees/first-timers and box notes in meeting view modal"
```

---

### Task 2: Replace the card grid with `TableComponent` + URL-synced pagination

**Files:**
- Modify: `src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx`

- [ ] **Step 1: Update imports**

Find:

```tsx
import { useEffect, useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";

import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";

import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { LifeCenterMemberType } from "@/utils";
import { MeetingType } from "@/utils/api/lifeCenter/interfaces";

import { MeetingForm } from "./MeetingForm";
```

Replace with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { ColumnDef } from "@tanstack/react-table";

import { HeaderControls } from "@/components/HeaderControls";
import { Modal } from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import ActionButton from "@/pages/HomePage/Components/reusable/ActionButton";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";

import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { usePaginationQueryParams } from "@/CustomHooks/usePaginationQueryParams";

import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { LifeCenterMemberType } from "@/utils";
import { MeetingType } from "@/utils/api/lifeCenter/interfaces";

import { MeetingForm } from "./MeetingForm";
```

- [ ] **Step 2: Remove the now-dead `stripHtml` helper**

Find (near the top, right before `export const MeetingsList`):

```tsx
const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

```

Delete it entirely. It was only used for the card's note preview, which the table view drops (note is only shown in the View modal, per the approved design). Leaving it in place would fail `npm run lint` (`--max-warnings 0`) as an unused variable.

- [ ] **Step 3: Switch pagination state from local `useState` to the URL-synced hook**

Find:

```tsx
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | number>("");
```

Replace with:

```tsx
  const { page, take, setPage } = usePaginationQueryParams(10);
  const [selectedId, setSelectedId] = useState<string | number>("");
```

- [ ] **Step 4: Update the `useFetch` query and derived list/total**

Find:

```tsx
  const { data, refetch } = useFetch(api.fetch.fetchMeetings, {
    lifeCenterId,
    page,
    take: 10,
  });
```

Replace with:

```tsx
  const { data, refetch } = useFetch(api.fetch.fetchMeetings, {
    lifeCenterId,
    page,
    take,
  });
```

Find:

```tsx
  const meetings = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
```

Replace with:

```tsx
  const meetings = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
```

- [ ] **Step 5: Add the column definitions**

Add this `useMemo` block right after the `canManageHere` computation (after the line `const canManageHere = accessMode === "route" || isLeadershipMember;` and before `const closeFormModal = ...`):

```tsx
  const columns = useMemo<ColumnDef<MeetingType>[]>(
    () => [
      {
        header: "Date",
        cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
      },
      {
        header: "Offering",
        cell: ({ row }) =>
          `${row.original.currency} ${row.original.offeringAmount}`,
      },
      {
        header: "Attendees",
        cell: ({ row }) => {
          const count = row.original.attendees.filter(
            (a) => !a.isFirstTimer
          ).length;
          return <Badge>{count}</Badge>;
        },
      },
      {
        header: "First timers",
        cell: ({ row }) => {
          const count = row.original.attendees.filter(
            (a) => a.isFirstTimer
          ).length;
          return <Badge>{count}</Badge>;
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const meeting = row.original;
          return (
            <div
              onClick={() =>
                setSelectedId((prev) => (prev === meeting.id ? "" : meeting.id))
              }
            >
              <ActionButton
                showOptions={meeting.id === selectedId}
                onView={() => setViewing(meeting)}
                onEdit={
                  canManageHere
                    ? () => {
                        setEditing(meeting);
                        setOpenModal(true);
                      }
                    : undefined
                }
                onDelete={
                  canManageHere ? () => handleDelete(meeting) : undefined
                }
                requireManageAccess={accessMode === "route"}
                requireAdminAccess={accessMode === "route"}
              />
            </div>
          );
        },
      },
    ],
    [selectedId, canManageHere, accessMode, handleDelete]
  );
```

This mirrors sibling `LifeCenterRoles.tsx`'s `columns` pattern exactly (`ColumnDef` array, `ActionButton` inside the Actions cell's `onClick` toggle wrapper) — no extra `relative`/`absolute` positioning classes are needed on the wrapper div; `ActionButton`'s own dropdown is self-positioning, same as the working reference.

Note: this `useMemo` references `handleDelete`, which is defined further down in the current file (after `closeFormModal`). Since `columns` is now placed before `handleDelete`'s declaration, either move the `columns` block to after `handleDelete` is defined, or note that `const` function declarations are not hoisted — **place the `columns` `useMemo` immediately after `handleDelete`'s definition instead of before it**, i.e. after this existing block:

```tsx
  const handleDelete = (meeting: MeetingType) => {
    showDeleteDialog(
      { id: String(meeting.id), name: format(new Date(meeting.date), "dd MMM yyyy") },
      async () => {
        await executeDelete({ id: meeting.id });
        refetch();
        showNotification("Meeting deleted successfully", "success");
      }
    );
  };
```

(Confirm this ordering when applying the step — the `useMemo` from this step goes directly after `handleDelete`, not after `canManageHere`.)

- [ ] **Step 6: Replace the card grid + manual pagination with `TableComponent`**

Find:

```tsx
      {meetings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting) => {
            const firstTimerCount = meeting.attendees.filter(
              (a) => a.isFirstTimer
            ).length;
            const attendeeCount = meeting.attendees.length - firstTimerCount;
            return (
              <div
                key={meeting.id}
                className="relative border rounded-lg p-4 shadow-sm bg-white space-y-2"
              >
                <div className="font-medium">
                  {format(new Date(meeting.date), "dd MMM yyyy")}
                </div>
                <div className="text-sm text-gray-600">
                  {meeting.currency} {meeting.offeringAmount}
                </div>
                <div className="text-sm text-gray-600">
                  {attendeeCount} attendee{attendeeCount === 1 ? "" : "s"},{" "}
                  {firstTimerCount} first-timer{firstTimerCount === 1 ? "" : "s"}
                </div>
                {meeting.note && (
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {stripHtml(meeting.note).slice(0, 80)}
                  </div>
                )}
                <div
                  className="pt-2 absolute right-2 top-1"
                  onClick={() =>
                    setSelectedId((prev) => (prev === meeting.id ? "" : meeting.id))
                  }
                >
                  <ActionButton
                    showOptions={meeting.id === selectedId}
                    onView={() => setViewing(meeting)}
                    onEdit={
                      canManageHere
                        ? () => {
                            setEditing(meeting);
                            setOpenModal(true);
                          }
                        : undefined
                    }
                    onDelete={
                      canManageHere ? () => handleDelete(meeting) : undefined
                    }
                    requireManageAccess={accessMode === "route"}
                    requireAdminAccess={accessMode === "route"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          scope="section"
          msg="No meetings recorded yet"
          description="Meetings you create for this life center will appear here."
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={page <= 1}
            className="text-sm font-medium text-primary disabled:text-gray-400"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="text-sm font-medium text-primary disabled:text-gray-400"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
```

Replace with:

```tsx
      {meetings.length > 0 ? (
        <TableComponent
          columns={columns}
          data={meetings}
          total={total}
          displayedCount={take}
          onPageChange={(newPage) => setPage(newPage)}
        />
      ) : (
        <EmptyState
          scope="section"
          msg="No meetings recorded yet"
          description="Meetings you create for this life center will appear here."
        />
      )}
```

(`displayedCount={take}` matters: `TableComponent` only shows its pagination widget when `total > displayedCount`, and it uses `displayedCount` — not a `take` prop — as the page size for that check and for the widget's own `usePaginate` call. Passing `take` here keeps it at the real page size of 10, matching the backend's `take`.)

- [ ] **Step 7: Update the header count**

Find (in the `HeaderControls` near the top of the returned JSX):

```tsx
        title={`My Meetings (${meetings.length})`}
```

Replace with:

```tsx
        title={`My Meetings (${total})`}
```

(`meetings.length` was only ever the current page's row count, which happened to equal the total while there was no working pagination — now that pagination actually works, the header should show the true total, not just the current page's count.)

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. In particular, confirm no "used before declaration" error for `handleDelete` inside `columns` — if one appears, it confirms the ordering note in Step 5 wasn't applied; move the `columns` block below `handleDelete`.

- [ ] **Step 9: Lint**

Run: `npx eslint src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx --max-warnings 0`
Expected: no output. Pay attention to `react-hooks/exhaustive-deps` on the `columns` useMemo (deps listed in Step 5 are `[selectedId, canManageHere, accessMode, handleDelete]` — state setters like `setSelectedId`/`setViewing`/`setEditing`/`setOpenModal` are stable and excluded per the rule's own convention, matching how the rest of this file already treats them).

- [ ] **Step 10: Manual QA note**

With a life center that has more than 10 logged meetings (or temporarily treat any count — check with fewer by confirming the widget stays hidden under 10): confirm the table renders one row per meeting with correct Date/Offering/Attendee-count/First-timer-count badges, the Actions dropdown opens/closes and View/Edit/Delete all still work exactly as before, the pagination widget appears once total > 10 and advancing/retreating pages refetches the correct page (check the URL's `?page=` updates too), and creating a new meeting while on page 2+ jumps back to page 1 showing the new entry (exercises the existing `setPage(1)` in the `postResponse` effect against the new URL-backed `setPage`).

- [ ] **Step 11: Commit**

```bash
git add src/pages/HomePage/pages/LifeCenter/components/Meetings/MeetingsList.tsx
git commit -m "feat: render My Meetings as a table with URL-synced pagination"
```

---

## Self-Review Notes

- **Spec coverage:** Table columns (Date/Offering/Attendees/First-timers/Actions) → Task 2 Step 5. `TableComponent` adoption + pagination → Task 2 Steps 3-7. `EmptyState` kept as sibling condition → Task 2 Step 6 (unchanged branch). View modal split + boxed note → Task 1. Everything else (forms, access gating, refetch-after-mutation) explicitly untouched by both tasks — confirmed no step modifies `handleSave`, `MeetingForm`, or the `postResponse`/`updateResponse` effects beyond what already existed.
- **Placeholders:** none — every step shows complete, pasteable code.
- **Type consistency:** `MeetingType` fields used in `columns` (`date`, `offeringAmount`, `currency`, `attendees[].soulWonId/name/isFirstTimer`, `id`) match `src/utils/api/lifeCenter/interfaces.ts`. `usePaginationQueryParams(10)` return shape (`{page, take, setPage, setTake}`) matches `src/CustomHooks/usePaginationQueryParams.ts`. `TableComponent` props (`columns`, `data`, `total`, `displayedCount`, `onPageChange`) match `src/pages/HomePage/Components/reusable/TableComponent.tsx`.
