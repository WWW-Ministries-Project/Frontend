# Bulk User Activate/Deactivate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin select multiple users in User Management and
activate/deactivate them all in one confirmed action, via a new backend
bulk endpoint and frontend multi-select UI.

**Architecture:** Contract-first split into two independent tracks that can
run in parallel — Track A (Backend) adds `POST
user/update-user-status/bulk`, modeled directly on the existing
`bulkUpdateMemberStatus` endpoint. Track B (Frontend) wires the table's
already-built (but unused) bulk-selection UI into `UserManagement.tsx` and
calls the new endpoint. The two tracks share a fixed request/response
contract (defined in Task A1) so neither blocks on the other's completion.

**Tech Stack:** Backend: Express + Prisma (`Backend/src/modules/user/`).
Frontend: React + TanStack Table (`TableComponent.tsx`) + Zustand
(`useDialogStore`, `useNotificationStore`) + the `usePost` data hook.

**No test runner is configured in either repo** (per both repos'
conventions — Frontend `CLAUDE.md` explicitly says do not add test scripts
unless asked; Backend has no test files or test script either). Every task
below substitutes a manual verification step (curl / UI click-through) for
the automated test step the `writing-plans` template would otherwise use.

**Full design spec:** `docs/superpowers/specs/2026-08-15-bulk-user-activation-design.md`

---

## Track A — Backend (`/Users/akwaah/Documents/GitHub/Backend`)

Repo default branch is `main` (not `development`). Cut the feature branch
off `origin/main`.

### Task A0: Cut feature branch

- [ ] **Step 1:** From a clean state, branch off latest `main`:

```bash
cd /Users/akwaah/Documents/GitHub/Backend
git fetch origin main
git checkout -b feat/bulk-user-activation origin/main
```

Expected: new branch `feat/bulk-user-activation`, currently checked out,
identical to `origin/main`.

### Task A1: Types + service method

**Files:**
- Modify: `Backend/src/modules/user/userService.ts`

- [ ] **Step 1: Add the result/response types and the service method**

Add near the existing `BulkMemberStatusResult` type (search for that name
to find the right spot — keep new types next to it):

```ts
type BulkUserStatusResult = {
  user_id: string | number;
  success: boolean;
  noop?: boolean;
  code?: string;
  message?: string;
  previous?: boolean;
  current?: boolean;
};

type BulkUserStatusResponse = {
  results: BulkUserStatusResult[];
  summary: {
    total: number;
    succeeded: number;
    skipped: number;
    failed: number;
  };
};
```

Add the service method to the same class that hosts
`bulkUpdateMemberStatus` (find `async bulkUpdateMemberStatus(` and add this
alongside it):

```ts
async bulkUpdateUserStatus(
  userIds: (string | number)[],
  isActive: boolean,
): Promise<BulkUserStatusResponse> {
  const parsedIds = userIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: parsedIds } },
    select: { id: true, is_active: true },
  });
  const existingById = new Map(existingUsers.map((u) => [u.id, u]));

  const results: BulkUserStatusResult[] = [];

  for (const rawId of userIds) {
    const parsedId = Number(rawId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      results.push({
        user_id: rawId,
        success: false,
        code: "INVALID_USER_ID",
        message: "User ID must be a positive integer.",
      });
      continue;
    }

    const user = existingById.get(parsedId);

    if (!user) {
      results.push({
        user_id: rawId,
        success: false,
        code: "NOT_FOUND",
        message: "User not found.",
      });
      continue;
    }

    if (user.is_active === isActive) {
      results.push({
        user_id: rawId,
        success: true,
        noop: true,
        previous: user.is_active,
        current: user.is_active,
      });
      continue;
    }

    try {
      const updated = await prisma.user.update({
        where: { id: parsedId },
        data: { is_active: isActive },
        select: { is_active: true },
      });

      results.push({
        user_id: rawId,
        success: true,
        previous: user.is_active,
        current: updated.is_active,
      });
    } catch (error) {
      console.error("Failed to bulk update user status", {
        userId: rawId,
        isActive,
        error,
      });
      results.push({
        user_id: rawId,
        success: false,
        code: "INTERNAL_ERROR",
        message: "Failed to update user status.",
      });
    }
  }

  const summary = results.reduce(
    (acc, r) => {
      acc.total += 1;
      if (!r.success) acc.failed += 1;
      else if (r.noop) acc.skipped += 1;
      else acc.succeeded += 1;
      return acc;
    },
    { total: 0, succeeded: 0, skipped: 0, failed: 0 },
  );

  return { results, summary };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx tsc --noEmit
```

Expected: no new errors referencing `userService.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/user/userService.ts
git commit -m "feat: add bulkUpdateUserStatus service method"
```

### Task A2: Controller

**Files:**
- Modify: `Backend/src/modules/user/userController.ts`

- [ ] **Step 1: Add the controller**

Add next to `export const bulkUpdateMemberStatus` (search for that name):

```ts
export const bulkUpdateUserStatus = async (req: Request, res: Response) => {
  const { user_ids, is_active } = req.body ?? {};

  if (typeof is_active !== "boolean") {
    return res.status(400).json({
      message: "Operation failed",
      data: {
        message: "",
        error: "is_active must be a boolean.",
      },
    });
  }

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      message: "Operation failed",
      data: {
        message: "",
        error: "user_ids must be a non-empty array.",
      },
    });
  }

  const actingUserId = (req as any).user?.id;
  if (
    is_active === false &&
    actingUserId != null &&
    user_ids.some((id: string | number) => Number(id) === Number(actingUserId))
  ) {
    return res.status(400).json({
      message: "Operation failed",
      data: {
        message: "",
        error: "You cannot deactivate your own account.",
      },
    });
  }

  try {
    const result = await userService.bulkUpdateUserStatus(user_ids, is_active);
    return res.status(200).json({ data: result });
  } catch (error: any) {
    return res.status(500).json({
      message: "Operation failed",
      data: error,
    });
  }
};
```

Note: check how `req.user` is typed at the top of the other controllers in
this file (e.g. `updateUserSatus`) — if a typed `AuthenticatedRequest`
already exists and is imported in this file, use that instead of `(req as
any).user`. If nothing but `Request` is imported for these handlers today,
`(req as any).user?.id` matches the existing convention in this file.

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npx tsc --noEmit
```

Expected: no new errors referencing `userController.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/user/userController.ts
git commit -m "feat: add bulkUpdateUserStatus controller"
```

### Task A3: Route

**Files:**
- Modify: `Backend/src/modules/user/userRoutes.ts`

- [ ] **Step 1: Import and register the route**

Add `bulkUpdateUserStatus` to the existing import block from
`../user/userController` (same block that already imports
`bulkUpdateMemberStatus`), then add the route next to the existing
`/update-member-status/bulk` route:

```ts
userRouter.post(
  "/update-user-status/bulk",
  [protect, permissions.can_manage_member_details],
  bulkUpdateUserStatus,
);
```

- [ ] **Step 2: Start the dev server and verify manually**

```bash
cd /Users/akwaah/Documents/GitHub/Backend
npm run dev
```

In another shell, with a valid admin token (`$TOKEN`) and at least two real
user ids (`$ID1`, `$ID2`) from your local DB:

```bash
curl -s -X POST http://localhost:8080/user/update-user-status/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_ids\": [$ID1, $ID2], \"is_active\": false}" | jq
```

Expected: `200`, JSON body `{ data: { results: [...], summary: {...} } }`
with one entry per id, `summary.total === 2`.

Then verify idempotency (re-run the same request):

Expected: `results` now show `noop: true` for both ids, `summary.skipped
=== 2`, `summary.succeeded === 0`.

Then verify the self-deactivation guard using the acting admin's own id in
place of `$ID1` with `is_active: false`:

Expected: `400` with `error: "You cannot deactivate your own account."`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/user/userRoutes.ts
git commit -m "feat: register bulk user status route"
```

---

## Track B — Frontend (`/Users/akwaah/Documents/GitHub/Frontend`)

Already on branch `feat/bulk-user-activation` (cut off `development`, spec
doc already committed there — see conversation history). Do not create a
new branch for this track.

### Task B1: `showConfirmDialog` helper

**Files:**
- Modify: `Frontend/src/pages/HomePage/utils/helperFunctions.ts`

- [ ] **Step 1: Add the helper next to `showDeleteDialog`**

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

(`useDialogStore` is already imported at the top of this file for
`showDeleteDialog` — no new import needed.)

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no new errors referencing `helperFunctions.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage/utils/helperFunctions.ts
git commit -m "feat: add showConfirmDialog helper for non-delete confirmations"
```

### Task B2: API types + client method

**Files:**
- Modify: `Frontend/src/utils/api/members/interfaces.ts`
- Modify: `Frontend/src/utils/api/apiPost.ts`

- [ ] **Step 1: Add the payload/response types**

In `interfaces.ts`, next to `activateMemberPayloadType`/`activateMemberType`:

```ts
export type BulkUpdateUserStatusPayload = {
  user_ids: (string | number)[];
  is_active: boolean;
};

export type BulkUpdateUserStatusResult = {
  user_id: string | number;
  success: boolean;
  noop?: boolean;
  code?: string;
  message?: string;
  previous?: boolean;
  current?: boolean;
};

export type BulkUpdateUserStatusResponse = {
  results: BulkUpdateUserStatusResult[];
  summary: {
    total: number;
    succeeded: number;
    skipped: number;
    failed: number;
  };
};
```

- [ ] **Step 2: Add the client method**

In `apiPost.ts`, import the three new types from
`./members/interfaces` (add to whatever existing import from that path is
already there — if none exists yet in this file, add
`import { BulkUpdateUserStatusPayload, BulkUpdateUserStatusResponse } from "./members/interfaces";`
near the top). Then add the method next to `bulkUpdateMemberStatus`:

```ts
bulkUpdateUserStatus = (
  payload: BulkUpdateUserStatusPayload
): Promise<ApiResponse<BulkUpdateUserStatusResponse>> => {
  return this.postToApi("user/update-user-status/bulk", payload);
};
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no new errors referencing `apiPost.ts` or `interfaces.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/utils/api/members/interfaces.ts src/utils/api/apiPost.ts
git commit -m "feat: add bulkUpdateUserStatus API client method"
```

### Task B3: Wire bulk UI into `UserManagement.tsx`

**Files:**
- Modify: `Frontend/src/pages/HomePage/pages/Users/UserManagement.tsx`

- [ ] **Step 1: Add imports**

Add to the existing import block:

```ts
import { usePost } from "@/CustomHooks/usePost";
import { useUserStore } from "@/store/userStore";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { showConfirmDialog, showLoader, showNotification } from "../../utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
```

(`api` is already imported — merge rather than duplicate. Check the
existing `showLoader`/`showNotification` import path used elsewhere in this
file's sibling `ViewUser.tsx`, which imports from
`@/pages/HomePage/utils` — use that same barrel import path here for
consistency instead of a relative path, i.e.:
`import { showConfirmDialog, showLoader, showNotification } from "@/pages/HomePage/utils";`
— confirm `showConfirmDialog` is re-exported from that barrel once Task B1
lands; if the barrel file re-exports everything from `helperFunctions.ts`
via `export *`, no barrel change is needed.)

- [ ] **Step 2: Add the bulk mutation hook and permission check inside the component**

```ts
const { canManage } = useAccessControl();
const canBulkManage = canManage("Members");

const {
  postData: bulkUpdateStatus,
  loading: bulkUpdateLoading,
} = usePost(api.post.bulkUpdateUserStatus);
```

- [ ] **Step 3: Add the bulk action handler**

```ts
const handleBulkStatusChange = (
  selectedUsers: User[],
  action: string
) => {
  const isActivating = action === "activate";
  const currentUserId = useUserStore.getState().id;

  let targets = selectedUsers;
  let selfExcluded = false;

  if (!isActivating) {
    targets = selectedUsers.filter((u) => String(u.id) !== currentUserId);
    selfExcluded = targets.length !== selectedUsers.length;
  }

  if (targets.length === 0) {
    showNotification(
      "You can't deactivate only your own account.",
      "error"
    );
    return;
  }

  const verb = isActivating ? "Activate" : "Deactivate";
  const consequence = isActivating
    ? "They will regain login access."
    : "They will lose login access until reactivated.";
  const selfNote = selfExcluded
    ? " Your own account was excluded from this action."
    : "";

  showConfirmDialog(
    `${verb} ${targets.length} user${targets.length !== 1 ? "s" : ""}? ${consequence}${selfNote}`,
    () => {
      showLoader(true);
      bulkUpdateStatus({
        user_ids: targets.map((u) => u.id),
        is_active: isActivating,
      })
        .then((response) => {
          const summary = response?.data?.summary;
          if (summary) {
            showNotification(
              `${summary.succeeded} updated, ${summary.skipped} already ${isActivating ? "active" : "inactive"}, ${summary.failed} failed`,
              summary.failed > 0 ? "error" : "success"
            );
          }
          refetch();
        })
        .catch(() => {
          showNotification("Bulk update failed. Try again.", "error");
        })
        .finally(() => showLoader(false));
    }
  );
};
```

This references `refetch` — the current `useFetch(api.fetch.fetchAllMembers,
usersQuery)` call in this file only destructures `data: registeredMembers`.
Update that destructure to also pull `refetch`:

```ts
const { data: registeredMembers, refetch } = useFetch(api.fetch.fetchAllMembers, usersQuery);
```

- [ ] **Step 4: Wire the props into `TableComponent`**

Change the existing `<TableComponent ... />` call (inside the `{users.length
=== 0 ? ... : (...)}` block) to:

```tsx
<TableComponent
  columns={usersColumns}
  data={users}
  columnFilters={[]}
  setColumnFilters={() => {}}
  displayedCount={limit}
  total={total}
  onPageChange={() => {}}
  enableSelection={canBulkManage}
  bulkActions={
    canBulkManage
      ? [
          { label: "Activate", value: "activate" },
          { label: "Deactivate", value: "deactivate", variant: "danger" },
        ]
      : []
  }
  onBulkAction={handleBulkStatusChange}
/>
```

- [ ] **Step 5: Verify it compiles**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npx tsc --noEmit
```

Expected: no new errors referencing `UserManagement.tsx`. If `User` (the
local interface at the bottom of the file) doesn't already have `id` typed
as `string | number`, check `MembersType` in `@/utils` — it should already
carry `id`; no change needed unless `tsc` flags it.

- [ ] **Step 6: Manual verification**

```bash
npm run dev
```

- Log in as a user with `manage_users`, open Users page.
- Confirm checkbox column + "N selected" bar appear once you select rows.
- Select 2+ inactive users → Activate → confirm dialog shows correct count
  → confirm → rows flip to Active, summary notification shown.
- Select 2+ active users → Deactivate → same flow.
- Include your own row in a Deactivate selection → confirm dialog notes
  the exclusion, your row stays Active.
- Select a mix of active/inactive → Deactivate → only active ones flip;
  notification reports the rest as "already inactive", not failed.
- Log in as a user without `manage_users` → confirm no checkboxes/bulk bar
  render at all.

- [ ] **Step 7: Commit**

```bash
git add src/pages/HomePage/pages/Users/UserManagement.tsx
git commit -m "feat: wire bulk activate/deactivate into UserManagement"
```

### Task B4: Lint

- [ ] **Step 1: Run lint across the changed files**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend
npm run lint
```

Expected: 0 warnings/errors (`--max-warnings 0` is enforced repo-wide).
Fix anything flagged before moving on — most likely candidates: unused
imports if the barrel-import path in Task B3 Step 1 didn't need a change,
or a missing return type on `handleBulkStatusChange`.

- [ ] **Step 2: Commit any lint fixes**

```bash
git add -A
git commit -m "fix: lint cleanup for bulk user activation"
```

(Skip this commit if lint was already clean.)

---

## Final Integration Check

- [ ] With the Backend dev server running on the feature branch and the
      Frontend dev server pointed at it (`REACT_APP_API_URL=http://localhost:8080/`),
      re-run the full manual verification list from Task B3 Step 6
      end-to-end against the real new endpoint (not just compiled types).
- [ ] Confirm `git log --oneline` on both repos shows a clean, readable
      commit sequence on each feature branch, ready for PR (Backend →
      `main`, Frontend → `development`, per each repo's convention).
