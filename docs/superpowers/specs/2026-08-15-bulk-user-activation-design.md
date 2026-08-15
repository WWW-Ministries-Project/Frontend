# User Management — Bulk Activate/Deactivate

Status: design approved, not yet implemented.
Date: 2026-08-15.
Frontend + Backend. New endpoint, no schema migration (`is_active` already
exists on `user`).

## Goal

`UserManagement.tsx` only supports toggling one user's `is_active` flag at a
time, via the `ViewUser.tsx` modal (`toggleAccountStatus` →
`activateMember` → `PUT user/update-user-status`). Add multi-select to the
Users table and a bulk Activate/Deactivate action, so an admin can flip many
accounts in one confirmed step instead of opening each profile.

## Explicitly out of scope

- Bulk delete, bulk role/access-level change — not requested.
- Bulk membership-progression status (`UNCONFIRMED`→`CONFIRMED`→`MEMBER`) —
  that's a separate existing feature (`MemberConfirmation.tsx` +
  `POST user/update-member-status/bulk`). This feature only touches the
  `is_active` boolean.
- Audit logging for `is_active` changes — none exists today for the
  single-user toggle either; not added here (explicit decision, tracked as
  a possible follow-up, not this feature's job).
- Branch-boundary enforcement on the mutation path — the existing
  single-user `update-user-status` endpoint applies no `branch_id` check;
  the new bulk endpoint matches that behavior rather than introducing new
  scoping logic (explicit decision — the read path is already
  branch-scoped, which is what bounds normal usage).
- "Select all N matching this filter across every page" — selection is
  bounded to loaded/rendered rows only (see Frontend changes).

## Backend changes

**New route**, `Backend/src/modules/user/userRoutes.ts`, added next to the
existing bulk-status route:

```ts
userRouter.post(
  "/update-user-status/bulk",
  [protect, permissions.can_manage_member_details],
  bulkUpdateUserStatus,
);
```

Same permission guard as the existing single-user route (`PUT
/update-user-status`) and the existing bulk-status route (`POST
/update-member-status/bulk`) — no new permission key.

**New controller** `bulkUpdateUserStatus` in `userController.ts`, modeled
directly on `bulkUpdateMemberStatus` (`userController.ts:2857-2902`):

- Body: `{ user_ids: (string|number)[], is_active: boolean }`.
- Validate `is_active` is a boolean and `user_ids` is a non-empty array —
  400 on failure, same error shape as `bulkUpdateMemberStatus`.
- Reject (`400`) if `req.user.id` (the acting admin, from the JWT attached
  by `protect`) appears in `user_ids` **and** `is_active === false` — a user
  can't bulk-deactivate their own account. This is the authoritative check;
  the frontend also excludes the row client-side (defense in depth, not a
  substitute).
- Delegates to a new `userService.bulkUpdateUserStatus(user_ids, is_active)`.

**New service method** in `userService.ts`, modeled on
`buildBulkMemberStatusResult`/`applyBulkMemberStatusTransition`
(`userService.ts:1007-1132`):

- Look up all requested users in one query (`prisma.user.findMany({ where:
  { id: { in: parsedIds } } })`), same batch-lookup pattern already used for
  the status-bulk path.
- Per id, build one of:
  - `NOT_FOUND` — id doesn't resolve to a user.
  - **No-op success** — user's current `is_active` already equals the
    target value. Returned as `success: true` with a `noop: true` flag, not
    an error (idempotent — see Functional requirements below).
  - **Applied success** — `prisma.user.update({ where: { id }, data: {
    is_active } })`, returns `success: true, previous: <bool>, current:
    <bool>`.
  - `INTERNAL_ERROR` — update threw; caught per-item so one failure doesn't
    abort the batch (same try/catch-per-item shape as
    `buildBulkMemberStatusResult`).
- Response shape: `{ results: BulkUserStatusResult[], summary: { total,
  succeeded, skipped, failed } }` — the array is the same per-item contract
  as the existing bulk endpoint (`user_id`, `success`, `code`, `message`),
  plus `noop`.
- Reuses the existing `updateUserSatus` field name/shape (`is_active` only
  — no `status` field is touched by this path, unlike the single endpoint
  which also carries `status`).

## Frontend changes

**`src/pages/HomePage/pages/Users/UserManagement.tsx`**

- Turn on the table's existing (already-built, currently unused) bulk
  machinery: `enableSelection`, `onBulkAction`, `bulkActions` props on
  `TableComponent` (`TableComponent.tsx:32-34`) — no changes needed inside
  `TableComponent` itself, it already renders the checkbox column and the
  "N selected" bar.
- `bulkActions={[{ label: "Activate", value: "activate" }, { label:
  "Deactivate", value: "deactivate", variant: "danger" }]}`.
- `onBulkAction={(selectedUsers, action) => handleBulkStatusChange(selectedUsers, action)}`.
- `handleBulkStatusChange`:
  1. If `action === "deactivate"`, filter out the current user's own row
     (`selectedUsers.filter(u => String(u.id) !== useUserStore.getState().id)`)
     and note if it was excluded, so the confirm copy/result can say so.
  2. Call the new `showConfirmDialog` helper (below) with a message stating
     the count and consequence, e.g. "Deactivate 12 users? They will lose
     login access until reactivated." / "Activate 5 users? They will regain
     login access."
  3. On confirm, call the new `bulkUpdateUserStatus` API function with
     `{ user_ids, is_active: action === "activate" }`.
  4. `showLoader` during the request; on response, `showNotification` with
     one combined summary — "`X` updated, `Y` already `<state>`, `Z`
     failed" — built from `summary` in the response. Skip a
     success/error split by response status; the endpoint returns 200 with
     per-item results even on partial failure, matching
     `bulkUpdateMemberStatus`'s existing contract.
  5. Refetch the table (`refetch` from the existing `useFetch`) so rows
     reflect new state.
- Table's built-in "Clear Selection" already resets `rowSelection` after
  `onBulkAction` fires (`TableComponent.tsx:141-148`) — no extra wiring
  needed for that.

**New: `src/pages/HomePage/utils/helperFunctions.ts` — `showConfirmDialog`**

`showDeleteDialog` (`helperFunctions.ts:21-35`) is delete-flavored: it's
typed to a single `{id, name}` value and a `handleDelete(id)` callback. Add
a small sibling that reuses the same `useDialogStore`, generalized to an
arbitrary message and a no-arg confirm callback:

```ts
export const showConfirmDialog = (
  message: string,
  onConfirm: () => void
) => {
  const dialogStore = useDialogStore.getState();
  dialogStore.setDialog({
    name: message,
    showModal: true,
    onConfirm: () => {
      onConfirm();
      dialogStore.dialogDataReset();
    },
    onCancel: dialogStore.dialogDataReset,
  });
};
```

No changes to the `Dialog` component or `globalComponentsStore` — `name` is
already rendered as the dialog's message text, this just stops requiring an
`id`/`name` pair shaped like a delete target.

**API layer**

- `src/utils/api/apiPost.ts` — new `bulkUpdateUserStatus` method, alongside
  the existing `bulkUpdateMemberStatus` (`apiPost.ts:204-208`):
  ```ts
  bulkUpdateUserStatus = (
    payload: BulkUpdateUserStatusPayload
  ): Promise<ApiResponse<BulkUpdateUserStatusResponse>> => {
    return this.postToApi("user/update-user-status/bulk", payload);
  };
  ```
- `src/utils/api/members/interfaces.ts` — new `BulkUpdateUserStatusPayload`
  (`{ user_ids: (string|number)[]; is_active: boolean }`) and
  `BulkUpdateUserStatusResponse` (`{ results: {...}[]; summary: {...} }`),
  next to the existing `activateMemberPayloadType`/`activateMemberType`.
- New mutation goes through `usePost`, matching the existing
  `usePut(api.put.activateMember)` pattern in `ViewUser.tsx` — POST because
  it's a batch operation on a collection, consistent with the existing
  `update-member-status/bulk` also being POST despite mutating existing
  rows.

**Permission gating**

- Add a button-level check in `UserManagement.tsx`: only render the bulk
  action bar / pass non-empty `bulkActions` when
  `useAccessControl().canManage("Members")` is true — `manage_users` maps
  to `{ domain: "Members", action: "manage" }` in
  `accessControl.ts:348`, so this is the same check
  `Members.tsx:71` already uses. This closes an existing gap
  (today neither `UserManagement.tsx` nor `ViewUser.tsx` does a
  component-level check; they rely solely on the route-level
  `permissionNeeded: "manage_users"` gate in `appRoutes.tsx`) rather than
  scoping it to only the new bulk UI — the single-user toggle should get
  the same check as a byproduct, since it's the same gap.

## Data flow

1. Admin checks rows in the Users table (existing `TableComponent`
   checkbox column, `enableSelection` now on). Selection persists across
   pagination until "Clear Selection" is clicked or a bulk action fires —
   default `TableComponent` behavior, unchanged.
2. Bulk action bar appears once ≥1 row selected, showing count + Activate
   / Deactivate buttons (`TableComponent.tsx:153-182`, already built).
3. Clicking either button calls `onBulkAction(selectedRows, action)` →
   `handleBulkStatusChange` in `UserManagement.tsx`.
4. Self-account is dropped from the batch if the action is Deactivate.
5. `showConfirmDialog` renders count + consequence copy; Cancel aborts with
   no request sent.
6. On Confirm: `showLoader(true)` → `POST user/update-user-status/bulk`
   `{ user_ids, is_active }` → backend resolves current state per user,
   applies only where it differs from the target, returns per-item
   results + summary → `showLoader(false)`, `showNotification` with the
   summary, table `refetch()`.

## Error handling / edge cases

- **Mixed-state selection (idempotent, no forced overwrite):** Bulk
  Activate only changes users currently `is_active: false`; already-active
  selected users are returned as `success: true, noop: true` and are not
  surfacing as errors. Bulk Deactivate is the mirror. Rationale: admin can
  select broadly without pre-checking every row's current state, and
  retries/double-submits stay safe.
- **Self-deactivation:** excluded client-side from the Deactivate batch
  before the request is sent; rejected server-side (400) as a backstop if
  it somehow still arrives (e.g. a stale selection sent via direct API
  call). Bulk Activate has no such restriction — activating your own
  account isn't a lockout risk.
- **Partial failure:** a single bad id (deleted user, non-numeric id) fails
  only that item (`NOT_FOUND`/`INVALID_USER_ID`) — same per-item try/catch
  isolation as the existing `bulkUpdateMemberStatus`, batch as a whole
  still returns 200 with mixed results.
- **Empty selection:** bulk action bar only renders when `selectedCount >
  0` (existing `TableComponent` guard) — no empty-batch requests possible
  from the UI. Backend still 400s an empty `user_ids` array defensively.
- **Permission:** a user without manage rights never sees the bulk bar
  (button-level check); the backend route carries the same
  `can_manage_member_details` guard as the existing single/bulk-status
  routes regardless of what the frontend renders.
- **Branch scoping:** unchanged from today's single-user endpoint — no
  `branch_id` check on the mutation path. The Users list is already
  branch-scoped on read, which is what bounds what an admin can select
  under a specific branch; under `ALL_BRANCHES` a bulk selection can span
  branches, same as it could today one user at a time.

## Testing

No test runner configured in this repo (per CLAUDE.md) — manual
verification only:

- Select 2+ users, bulk Deactivate, confirm dialog shows correct count/copy,
  confirm → table updates, summary notification shown.
- Repeat for Activate.
- Select a mix of active + inactive users, bulk Deactivate → only the
  active ones flip, summary reports the rest as already-inactive (not
  errors).
- Include own account in a Deactivate selection → excluded from the batch,
  own row untouched, noted in the result.
- Attempt the bulk action as a user without `manage_users` → bulk bar not
  rendered.
- Select users, navigate to page 2, select more → selection accumulates;
  Clear Selection resets it without any request.
