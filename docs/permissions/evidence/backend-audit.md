# WWM Backend: Authorization Audit

Repo: `../Backend`. This is a read-only audit; no repo files were changed. File paths are relative to the repo root, and `AUTH` means `src/middleWare/authorization.ts`.

It was written to feed the permissions redesign, which adds two things to today's per-domain levels:

- **(a) Action permissions:** specific capabilities beyond view, manage and admin.
- **(b) Visibility scopes:** own, department, life center, branch or all.

How this document is organised:

- **Part 1** covers the model mechanics.
- **Part 2** has one section per module, each with:
  - a routes table
  - implicit scoping
  - workflow decisions
  - candidate actions
  - gaps
- **Part 3** is cross-cutting: domain coverage, alias drift, implicit roles, the master action list, and security gaps ranked by severity.

Route tags used throughout:

| Tag | Meaning |
|---|---|
| `[NO-GUARD-MUTATION]` | Changes data with no permission guard |
| `[NO-GUARD-EXPOSES-DATA]` | Returns org data with no permission guard |
| `[BORROWED: X]` | Guarded by an unrelated domain X |
| `[IMPLICIT-SCOPE: …]` | The service filters by the requester |
| `[UNSCOPED-LIST]` | Returns everything, with no branch or ownership filter |
| `[WORKFLOW]` | An approval or state-transition step |

---

# Part 1: Model mechanics

> **Update 2026-10-25 (after this audit).** Backend branch `feat/access-level-actions-scopes`:
> - `Reports` and a new `Rides` key are stored (gap 33 fixed).
> - `Actions` (`{ Domain: { action: boolean } }`) and scopes `own`, `assigned`, `department`, `department_member`, `life_center` are accepted on any module. `department`/`department_member` are applied as the old `assigned_departments` rule.
> - A grant ceiling, a block on editing a role you hold, and a block on changing your own assignment now guard create, update, assign, bulk-assign, per-branch assign and delete (`src/modules/accessLevels/grantCeiling.ts`; gap 4 partly fixed).
> - Rides checks `Rides`, falling back to Membership_Management.
>
> Line numbers below are from before these changes.

## 1.1 Storage (prisma/schema.prisma)

**`access_level`** (schema.prisma:486-501) has these fields:

- `name` (unique)
- `permissions` (`String? @db.LongText`, holding a JSON blob)
- `workspaces Json?`, the Home workspace keys `prelate|admin|finance|hod|generic`
- soft delete (`deleted`, `deleted_at`)

Roles are **global**. They have no branch column, so one role is shared across every branch that grants it.

**`user_branch_access`** (schema.prisma:215-229) holds one role per user per branch, enforced by `@@unique([user_id, branch_id])`. This is the live source of admin rights.

**`user`** (schema.prisma:11-110) carries several fields that matter here:

- `access_level_id` with the relation `access` (:100). This is the **legacy single role**. It is kept in sync with the home-branch grant by `syncLegacyAccessLevel` (src/modules/accessLevels/branchAccessService.ts:68-97), and is still read directly by several services (see 3.3).
- `is_user`, the ministry-worker / login flag.
- `is_active`.
- `branch_id`, the home branch.
- `department_id`, the legacy single department.
- `position_id`.

**Department and life center links:**

- `department.department_head` (schema.prisma:382). This is the implicit "HOD" role.
- `department_positions` (schema.prisma:2101-2116) links a user, a department and an optional position.
- `user_departments` (schema.prisma:408-416), one row per user.
- `life_center_member` (schema.prisma:2021-2033) links a user, a life center and a role.

**Permission blob shape:**

```
{ "<Domain>": "No_Access|Can_View|Can_Manage|Super_Admin", ...,
  "Exclusions": { "Members": [userId...], "Appointments": [userId...] },
  "Scopes": { "Departments": "assigned_departments", "Church_Attendance": "assigned_departments" } }
```

The blob is validated by `normalizePermissionPayload` (src/modules/accessLevels/accessLevelController.ts:405-460):

- Required keys (:23-33): Members, Departments, Positions, Access_rights, Asset, Events, Requisition, Program, Life Center.
- Optional keys (:35-55): Visitors, Appointments, Church_Attendance, Theme, Financials, Giving, Pledges, Marketplace, School_of_ministry, Settings, Announcements, Community, Sermons, Promotions, Messaging, Membership_Management, AI.
- **`Reports` is missing from both lists.** Unknown keys are silently dropped (:445-447), so an explicit `Reports` value can never be stored. `Reports` therefore **always** falls back to Settings and then Access_rights (AUTH:73). The Frontend lists `Reports` as canonical (Frontend `src/utils/accessControl.ts:45`), so the editor shows a control the API discards.
- Scopes are accepted only for Departments and Church_Attendance, with only the value `assigned_departments` (accessLevelController.ts:57, 104-107, 335-361).
- Exclusions are accepted for any allowed key (:265-298), but only the Members and Appointments guards ever read them.

## 1.2 Levels and comparison (AUTH:13-15, 277-291, 309-314)

There are three action tiers:

- `view` passes for `Can_View`, `Can_Manage` or `Super_Admin`.
- `manage` passes for `Can_Manage` or `Super_Admin`.
- `admin` passes for `Super_Admin` only.

In almost every domain `admin` means "delete" (the `can_delete_*` guards). For Reports it means "sign-off" (`can_admin_reports`, AUTH:2415).

The model has no concept of an action. Every capability beyond CRUD is mapped onto one of the three tiers, hardcoded, or decided by an implicit role (see 3.3).

`PERMISSION_RANK` (AUTH:309) is used only to merge grants.

## 1.3 Domain key resolution: `PERMISSION_KEY_ALIASES` (AUTH:16-74)

`resolvePermissionValue` (AUTH:106-121) returns the **first alias key that holds a string**. An explicit `No_Access` on the primary key therefore wins over any fallback. Fallbacks only apply when the key is absent.

| Checked domain | Resolution order |
|---|---|
| Members | Members |
| Membership_Management | Membership_Management, "Membership Management", **Members** |
| Visitors | Visitors, **Members** |
| Appointments | Appointments, **Members** |
| Departments / Positions / Events / Asset / Program / "Life Center" / Sermons / Announcements / Messaging | the key itself |
| Access_rights | Access_rights, "Access rights" |
| Church_Attendance | Church_Attendance, "Church Attendance", **Events** |
| Theme | Theme, **Program** |
| Requisition | Requisition, Requisitions |
| School_of_ministry | School_of_ministry, "School of ministry", **Program** |
| Financials | Financials, **Access_rights**, "Access rights" |
| Giving | Giving, Giving_Options, "Giving Options", **Financials, Access_rights**, "Access rights" |
| Pledges | Pledges, Pledge |
| Settings | Settings, **Access_rights**, "Access rights" |
| AI | AI, **Settings, Access_rights**, "Access rights" |
| Marketplace | Marketplace, **Program** |
| Community | Community, Announcements |
| Promotions | Promotions, **Community, Announcements** |
| Reports | Reports, **Settings, Access_rights**, "Access rights" |

**There is a second, divergent alias table** in `src/utils/permissionResolver.ts:1-9`. It maps:

- `Financials` to `Financials, Finance, Finances` (no Access_rights)
- `Pledges` to `Pledges, Pledge`
- `Membership_Management` to `Membership_Management, "Membership Management", Members`

`userHasMinimumDomainAccess` uses this second table, and it is called from:

- rides (rideService.ts:1004, 1107)
- join requests (joinRequestController.ts:82)
- the Financials route guard and approver eligibility (finance/Financials/route.ts:5; service.ts:262)
- `ListUsersLight` (userController.ts:2469)

So the same user can pass `can_view_financials` through Access_rights and still fail the finance create/update guard.

## 1.4 The access-context snapshot (AUTH:528-651)

One raw SQL query (AUTH:542-567) joins:

- `user`
- `access_level` (the legacy level, used only for `currentUser.access`)
- `department_positions` (any membership)
- `department` (where the user is head)
- `life_center_member` (any role)

A second query loads `user_branch_access` with non-deleted levels (AUTH:575-583).

The snapshot then derives these fields:

- **`permissions`**: every branch grant merged at the highest level per domain (`mergePermissionsAtHighest`, AUTH:321-342). Non-level keys (Exclusions and Scopes) come from the **first** grant that sets them, ordered by `branch_id` (AUTH:332-336).
- **`isPrivilegedUser`**: `is_user && branchGrants.length > 0` (AUTH:631-633). **Anyone with no branch grant is a "member" and fails every `checkPermission`** (AUTH:393). The guards hold no member-level permissions at all. Everything a member can do is decided in a protect-only route's controller or service, or in a scoped guard's fallback branch.
- **`departmentIds`**: `user.department_id`, plus every `department_positions.department_id`, plus every department the user heads (AUTH:614-626). **Membership is enough. No leadership role is required.**
- **`lifeCenterIds`**: every life center the user belongs to in **any** role (AUTH:627-631).

The snapshot is cached per user for 30 seconds by default (AUTH:412-440). `invalidateAuthContext` (AUTH:824-828) clears it, and the realtime `sessionChanged` notifier calls it.

## 1.5 Branch access (AUTH:348-405; src/modules/branches/branchScope.ts; branchService.ts)

**Requested branch.** The requested branch ids come from the `X-Branch-Id` header, `query.branch_id` and `body.branch_id` (branchScope.ts:55-62).

**Members.** For a member (non-privileged), `allowedBranchIds = null`, which means unclamped (AUTH:352-355). A member can name any branch, and a list with no explicit branch spans every branch.

**Admins.** Admins are clamped to the branches they hold grants in. Naming any other branch returns 403 `BRANCH_FORBIDDEN` (AUTH:357-360). When no branch is named and the admin has exactly one grant, that branch becomes the active branch (AUTH:364).

**Effective permissions.** With an active branch, the effective permissions are **that branch's grant only**. With no active branch, they are the merged set (AUTH:369-380).

`hasScopedActionPermission` (AUTH:388-405) decides each check:

- With a branch active, or for a `view` action: the effective permissions decide.
- With no branch active and a `manage` or `admin` action: **every** grant must allow it.

**Lists** are clamped through AsyncLocalStorage (`setBranchScope`), using `getBranchScopedWhere`, `getRelationBranchScopedWhere` and `resolveBranchIdOrDefault` (branchService.ts:63-160).

**By-id operations** are only clamped if the service calls `assertBranchAccessible` (branchService.ts:162-167). Most by-id reads and writes do not (see Part 2 and 3.4).

**Probes and service-side helpers that ignore the active branch.** These use the merged permission set:

- `attach_community_management` (AUTH:2175-2201)
- `attach_sermon_management` (AUTH:2260-2280)
- `userHasDomainPermission` (AUTH:754-765)
- `getUserDepartmentAccess` (AUTH:771-785)
- `canUserManageAppointments` (AUTH:707-733)

`userHasBranchDomainPermission` (AUTH:738-752) is the branch-aware alternative, but only some callers use it.

## 1.6 `protect` vs `checkPermission`

**`protect`** (AUTH:937-978) works as follows:

1. It verifies the JWT.
2. It refuses the request if the account is inactive (via the snapshot).
3. It resolves and stores the branch scope.
4. It sets `req.user = { ...decoded, active_branch_id, allowed_branch_ids }`.

`req.user.permissions` is therefore **the permissions claim baked into the JWT at login**: the home-branch grant, valid for 12 hours (src/modules/user/userController.ts:1396-1408, 1456-1459). Any protect-only route whose service reads `req.user.permissions` uses stale, home-branch-only rights. Affected:

- requisitions: requisition-service.ts:450, 1997; requisition-redesign.ts:106; requsition-helpers.ts:58
- the Financials route guard: finance/Financials/route.ts:12-55

`protect` also accepts **any** JWT signed with `JWT_SECRET` that carries an `id`. That includes purpose-scoped tokens such as the SSE stream token (see F3 notes, notificationStreamAuth.ts:100). If `decoded.id` is missing, `protect` still calls `next()` (AUTH:956-977).

**`checkPermission(type, action, msg)`** (AUTH:981-1015) works as follows:

1. It builds the access context via `getAccessContext` (AUTH:845-916).
2. It overwrites `req.user` with live data: `permissions` set to the active-branch effective permissions, `user_category`, `active_branch_id` and `allowed_branch_ids`.
3. It calls `hasScopedActionPermission`.
4. **Special case:** for `Requisition` + `manage`, it falls back to `canUserManageRequisitionByApproverRole(userId)` (AUTH:1004-1012). This lets **any configured approver pass every `can_manage_requisitions` route** (see F1).

On failure it returns 401 (not 403) with the domain message.

## 1.7 Guard helpers (complete list)

**Plain `checkPermission` wrappers** (AUTH:2042-2523). Each is listed with its domain and action:

- `can_view_users` / `can_Manage_Members` / `can_delete_users`: Members view / manage / admin
- `can_view_department` / `can_manage_department` / `can_delete_department`: Departments
- `can_view_positions` / `can_manage_positions` / `can_delete_positions`: Positions
- `can_view_access` / `can_manage_access` / `can_delete_access`: Access_rights
- `can_view_asset` / `can_manage_asset` / `can_delete_asset`: Asset
- `can_view_events` / `can_manage_events` / `can_delete_events`: Events
- `can_view_community` / `can_manage_community`: Community
- `can_view_promotions` / `can_manage_promotions` / `can_delete_promotions`: Promotions
- `can_view_sermons` / `can_manage_sermons` / `can_delete_sermons`: Sermons
- `can_view_messaging` / `can_manage_messaging`: Messaging
- `can_view_giving` / `can_manage_giving` / `can_delete_giving`: Giving
- `can_view_church_attendance` / `can_manage_church_attendance` / `can_delete_church_attendance`: Church_Attendance
- `can_view_requisitions` / `can_manage_requisitions` (with the approver fallback) / `can_delete_requisitions`: Requisition
- `can_view_programs` / `can_manage_programs` / `can_delete_programs`: Program
- `can_manage_theme` / `can_delete_theme`: Theme. There is **no `can_view_theme`**.
- `can_view_financials` / `can_manage_financials` / `can_delete_financials`: Financials
- `can_view_pledges` / `can_manage_pledges` / `can_delete_pledges`: Pledges
- `can_view_reports` / `can_admin_reports`: Reports
- `can_view_settings` / `can_manage_settings` / `can_delete_settings`: Settings
- `can_manage_appointment_settings`: Appointments manage
- `can_view_marketplace` / `can_manage_marketplace` / `can_delete_marketplace`: Marketplace
- `can_view_school_of_ministry` / `can_manage_school_of_ministry` / `can_delete_school_of_ministry`: School_of_ministry
- `can_view_ai` / `can_manage_ai` / `can_delete_ai`: AI
- `can_view_life_center` / `can_manage_life_center` / `can_delete_life_center`: "Life Center"

**Defined but never used by any route** (grep across `src/`, excluding AUTH):

- `can_Manage_Members`
- `can_view_users`
- `can_view_department`
- `can_manage_department`
- `can_delete_department`
- `can_view_asset`
- `can_view_programs`
- `can_manage_programs`
- `can_view_school_of_ministry`
- `can_delete_school_of_ministry`
- `can_view_sermons`
- `can_delete_ai`
- `can_delete_requisitions`

Notable consequences:

- **Program and School_of_ministry `view` do nothing server-side.**
- **Requisition `admin` is never required.**

**Scoped and custom guards.** Each is listed with its location and what it does:

- **`can_view_member_details`** (AUTH:1017-1069)
  - Members view: `memberScope={mode:"all", exclusions}`. A single target id in the exclusion list is refused.
  - Otherwise own-only, and only on URLs containing `/get-user`, `/get-user-family` or `/get-user-email`. This is a substring match on `originalUrl` (AUTH:1027-1035).
  - The target id comes from `getTargetUserId`: `query.user_id`, `query.id`, `params.id`, `body.user_id`, then `body.id` (AUTH:927-935). **Array payloads such as bulk `user_ids`, `husband`/`wife` or `childrenIds` are never checked against exclusions.**
- **`can_manage_member_details`** (AUTH:1071-1097): Members manage, plus the single-target exclusion check.
- **`can_delete_member_details`** (AUTH:1099-1125): Members admin, plus the exclusion check.
- **`visitorScopedPermission`** (AUTH:1213-1267), the factory behind the `can_*_visitors|visits|followups|prayer_requests_scoped` guards:
  - Visitors view/manage gives mode `all`.
  - Otherwise, the user must be in `visitor.responsibleMembers` (a JSON id array).
  - On view lists with no visitor id it passes in `responsible` mode (`allowResponsibleList`), and **the controller must apply the filter**.
  - The target visitor id **prefers an explicit `visitorId`/`visitor_id` over the resource `id`** (AUTH:1185-1211). This is the bypass described in F5.
- **`can_delete_visitors_scoped`** (AUTH:1317): Visitors admin.
- **`can_view_appointments_scoped`** (AUTH:1323-1387):
  - Appointments view gives mode `all` with attendee exclusions.
  - Otherwise own: the user is the requester or the attendee.
  - **With no booking id it always passes in "own" mode** (AUTH:1381-1386).
- **`can_manage_appointments_scoped`** (AUTH:1389-1461): Appointments manage, plus the attendee exclusion. The attendee is resolved from the body or query, then from the booking, availability or time-off record.
- **`can_delete_appointments_scoped`** (AUTH:1463-1508): Appointments admin, plus the exclusion.
- **`can_view_assets_scoped`** (AUTH:1510-1565):
  - Asset view gives mode `all`.
  - **Otherwise any user with a `departmentIds` entry gets department mode, without any Asset permission.**
  - It sets `req.assetAccess {canViewAll, canManage, canAdmin, departmentIds}` for the services.
- **`departmentScopedPermission`** (AUTH:1567-1606), behind `can_view|manage|delete_department_scoped`:
  - Departments level is required.
  - If the scope is `assigned_departments`, the target department (`query.department_id`, `body.department_id`, then `id`) must be in `departmentIds`.
  - **Create has no target id, so a scoped user can create departments.**
- **`attendanceScopedPermission`** (AUTH:1623-1657), used only as `can_view_church_attendance_scoped`: Church_Attendance level is required, plus the `assigned_departments` scope.
- **`can_view_life_center_scoped`** (AUTH:1664-1691): Life Center view gives `all`; otherwise **membership in any role** gives member mode.
- **`can_manage_life_center_scoped`** (AUTH:1693-1737): Life Center manage gives `all`; otherwise membership, with the target checked from `body/query.lifeCenterId` **or** the soul's life center (the bypass is in F5).
- **`can_manage_programs_or_facilitator`** (AUTH:1739-1763): School_of_ministry **or** Program manage, **or `req.user.instructor`, a JWT claim set at login** (userController.ts:1424-1426, 1441).
- **`can_enroll_self_or_manage`** (AUTH:1766-1798): a member may enroll themselves. Enrolling others needs manage or facilitator status.
- **The order guards:**
  - `can_create_order_scoped` (AUTH:1800-1845): guest checkout without a token, own, or Marketplace manage for others.
  - `can_view_orders_scoped` (AUTH:1847-1909)
  - `can_retry_order_payment_scoped` (AUTH:1911-1962)
  - `can_confirm_transaction_scoped` (AUTH:1964-2003)
  - `can_cancel_order_scoped` (AUTH:2005-2040)
- **`attach_community_management` and `attach_sermon_management`:** non-rejecting probes based on merged permissions (AUTH:2175-2201, 2260-2280).

**Service-callable exports:**

- `hasActionPermission` (AUTH:277)
- `resolveDomainScope` (AUTH:231)
- `canUserManageAppointments` (AUTH:707)
- `userHasBranchDomainPermission` (AUTH:738)
- `userHasDomainPermission` (AUTH:754)
- `getUserDepartmentAccess` (AUTH:771)
- `listUserIdsWithDomainPermission` (AUTH:791-822), which looks across all grants and is used to address domain "admins"
- `invalidateAuthContext` (AUTH:824)

## 1.8 Exclusions and scopes as implemented

**Exclusions** (`resolveDomainExclusions`, AUTH:192-229):

- They are read from `<Key>` or `<Key>_exclusions` at the top level, or nested under `Exclusions` / `exclusions` / `exclusion_list` / `exclusionList`.
- They are enforced only by the Members guards (AUTH:1041-1046, 1088-1094, 1116-1122) and the Appointments guards (AUTH:1345-1347, 1452-1457, 1483-1501). `ListUsers`, `ListUsersLight` and `filterUsersInfo` also apply them (userController.ts:2175, 2421, 2613).
- The editor accepts them for every domain (accessLevelController.ts:265-298), but no other domain enforces them.

**Scopes** (`resolveDomainScope`, AUTH:231-275):

- The only scope value is `assigned_departments` (AUTH:163-170).
- It is enforced for Departments (AUTH:1584-1604), for one Church_Attendance route (see F4), and in services through `getUserDepartmentAccess` (department reports, workspaces).
- There is no "own", "life center" or "branch-only" scope value. Branch is handled by grants, not scopes.

---

# Part 2: Per-module findings

## Module: accessLevels (/access)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /access/create-access-level | Access_rights:manage | accessLevelRoute.ts:21. It can create a level with every domain at `Super_Admin` and assign it (accessLevelController.ts:500-570). **There is no privilege ceiling**: the caller can grant more than they hold. `created_by` comes from the body (:501). |
| PUT | /access/update-access-level | Access_rights:manage | :26. **The level is global.** Editing it changes the rights of holders in **every** branch, including branches where the caller has no role. The only branch check is on newly assigned users (accessLevelController.ts:668-711). This includes the caller's own level, so there is no self-escalation check. |
| PUT | /access/access-level-workspaces | Access_rights:manage | :31. Edits workspace keys on a global level (:729-760). |
| PUT | /access/assign_access_to_user | Access_rights:manage | :36. `assertCanGrantInBranches` clamps the branch (:895-897). **The caller can assign any level to themselves**, so there is no ceiling. |
| GET | /access/assignable-users | Access_rights:manage | :41 |
| PUT | /access/bulk-assign-access-level | Access_rights:manage | :46 (:1004-1090). Branch-clamped, no ceiling. |
| DELETE | /access/delete-access-level | Access_rights:admin | :51. Deletes a global level, optionally `reassign_to` another one (:1110-1165). There is no branch check, even though holders in other branches lose the role. |
| GET | /access/list-access-levels | Access_rights:view | :56. Grants are filtered to the caller's branches (:212-250). |
| GET | /access/get-access-level | Access_rights:view | :61 |
| GET | /access/user-branch-access | Access_rights:view | :66 (:1171) |
| PUT | /access/user-branch-access | Access_rights:manage | :71. Branch-clamped (:1219). No ceiling. |

Also in this domain: **POST /user/give-access** (userRoutes.ts:122) is Access_rights:manage. It turns on login (`is_user`, `is_active`), grants a role in one branch and emails a set-password link (userController.ts:3770-3830).

### Implicit scoping / visibility
- The grant listing is clamped to the active branch or the allowed branches (`attachBranchGrants`, accessLevelController.ts:212-250).
- Role definitions themselves are global and visible in full.

### Workflow / approval decisions
- None. Assigning a role is immediate, and it calls `sessionChanged` to invalidate the auth cache (accessLevelController.ts:568, 712, 899).

### Candidate action permissions
- `access.create_role` / `access.edit_role` (create :21, update :26)
- `access.assign_role` (:36, :46, :71; /user/give-access)
- `access.delete_role` (:51)
- `access.grant_login` (userController.ts:3770)
- `access.edit_workspaces` (:31)
- A ceiling rule: you may only grant up to your own level.

### Gaps
- **HIGH: privilege escalation inside Access_rights:manage.** There is no ceiling or self-assignment check anywhere (accessLevelController.ts:500-570, 606-727, 845-900, 1204-1260). A Can_Manage access admin can create an all-`Super_Admin` role and assign it to themselves.
- **HIGH: roles are global but permissions are per branch.** A branch-A access admin can edit, through update-access-level, a role held by branch-B admins (accessLevelController.ts:668). They can also delete it (delete-access-level, :1110).
- **MED: `Reports` cannot be stored** (accessLevelController.ts:23-55, 445-447), so Reports sign-off is always inherited from Settings or Access_rights.
- **LOW:** Exclusions are accepted for every domain (:265-298) but enforced for only two, so the UI could imply protection that doesn't exist.

## Module: branches (/branch)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /branch/list-branches | auth-only | branchRoute.ts:18. Returns every branch with member counts (branchController.ts:49-64). Low sensitivity. |
| POST | /branch/create-branch | [BORROWED: Settings]:manage | :19. **Settings manage in one branch can create org-wide branches.** The creator automatically gets the same role in the new branch (branchController.ts:155-174). |
| PUT | /branch/update-branch | [BORROWED: Settings]:manage | :24. Branch-clamped (branchController.ts:184). |
| PUT | /branch/set-default-branch | [BORROWED: Settings]:manage | :29. Clamped (:73), but the default branch is org-wide behaviour (new sign-ups land there). |
| GET | /branch/delete-impact | Settings:view | :34. Clamped (:334). |
| DELETE | /branch/delete-branch | Settings:admin | :39. Clamped (:368). |

### Implicit scoping
- The by-id operations call `isBranchAllowed` (branchController.ts:73, 184, 334, 368). This is good and should be the template for other modules.

### Candidate actions
- `branches.create`
- `branches.edit`
- `branches.set_default`
- `branches.delete`

These are org-level (not per-branch) capabilities, and they currently borrow Settings.

### Gaps
- **MED:** branch creation and the default-branch setting are org-wide powers gated by a per-branch Settings grant.

## Module: uploadFile (/upload)

| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /upload/ | auth-only | uploadRoute.ts:35. Any logged-in user can upload images or docs up to 5MB to S3 at `www-ministires/uploads` and gets a public URL back (uploads.ts:4-38). There is no domain, no per-user quota and no ownership record. |

**Gap (LOW):** an unmetered public S3 write for any member account. A candidate action is `files.upload`, or keep it as a protect-only capability with a rate limit.

## Module: user (/user)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /user/get-user | can_view_member_details (Members:view, or own) | userRoutes.ts:54. Own mode works only by URL substring (AUTH:1027-1035). **The by-id read has no branch check**: `getUser` loads any id (userController.ts:2683-2720) and returns `access` (the legacy role blob). The password is deleted (:2780). |
| GET | /user/list-users | can_view_member_details (Members:view) | :56. Applies exclusions and the branch filter (userController.ts:2175-2190). |
| GET | /user/list-users-light | **auth-only** | :62. [NO-GUARD-EXPOSES-DATA] Returns **every user's id, name, email, ministry_worker flag, is_active, department and position** (userController.ts:2419-2600). Members are not branch-clamped, so a member sees every branch. `?permission_domain=X&minimum_access=admin` filters by the legacy `user.access` (:2465-2473), which lets **any member enumerate who holds admin rights in each domain**. |
| GET | /user/directory | auth-only | :69. Name, department and position only, by design (memberDirectoryController.ts:8-10, 38-130). Not branch-clamped for members. |
| GET | /user/directory/departments | auth-only | :70 (memberDirectoryController.ts:138) |
| GET | /user/search-users | can_view_member_details | :72. Exclusions applied (userController.ts:2613). |
| GET | /user/stats-users | auth-only | :78. Org-wide member counts for any member (userController.ts:3094-3148). LOW. |
| POST | /user/seed-user | Members:admin | :80. Blocked in production (userController.ts:1757-1763). |
| POST | /user/reset-password | public + rate limit | :82 |
| POST | /user/forgot-password | public + rate limit | :84 |
| POST | /user/change-password | auth + rate limit | :86. Self only (userController.ts:1547). |
| POST | /user/login | public + rate limit | :88. Refuses inactive users (userController.ts:1514). |
| POST | /user/register | **public + rate limit only** | :90. [NO-GUARD-MUTATION] **This is the dashboard's "Add member" endpoint** (Frontend `src/utils/api/apiPost.ts:302`; ManageMember.tsx:90). Anyone can create member records with any `status`, `membership_type`, `department_id`, `position_id` and `department_positions` (userService.ts:123-420; department rows are saved at :414-419). Supplying `source_visitor_id` flips a visitor to `is_member` (:402-407), and supplying `source_soul_won_id` links a soul (:395-400). It can create `is_user` accounts with a known default password `123456` (:294), though these start inactive (:381). |
| POST | /user/self-register | public + rate limit | :94. Mobile guest sign-up (selfServiceController.ts:109). |
| PUT | /user/me/profile | auth-only (self) | :95 (selfServiceController.ts:564). [IMPLICIT-SCOPE: own] |
| POST | /user/membership-request | auth-only (self) | :96 (selfServiceController.ts:244) |
| GET | /user/membership-request/mine | auth-only (self) | :97 (selfServiceController.ts:286) |
| GET | /user/guests | can_view_visitors_scoped | :100. [NO-GUARD-EXPOSES-DATA] With no visitor id, the guard lets **every logged-in user** through in "responsible" mode (AUTH:1236-1243). `listGuests` ignores `visitorScope` and returns every guest's name, email, phone, gender and city (selfServiceController.ts:307-330, 355-397). It is not clamped for members. |
| GET | /user/membership-requests | can_manage_member_details (Members:manage) | :101. [WORKFLOW] |
| PATCH | /user/membership-requests/approve | Members:manage | :106. [WORKFLOW] Guest becomes a member (selfServiceController.ts:457-497). It uses Members, not Membership_Management. There is no branch check on the request id (`loadPendingRequest`, :440-455). |
| PATCH | /user/membership-requests/decline | Members:manage | :111 (selfServiceController.ts:499). Same notes as approve. |
| PUT | /user/update-user | Members:manage + exclusion | :116. **No branch check** on `query.user_id` (userController.ts:427-800). It can toggle `is_user` (:511-519) and move `branch_id` within the caller's allowed set (:769-770). |
| POST | /user/give-access | Access_rights:manage | :122. See accessLevels. |
| POST | /user/send-reset-link | Members:manage | :127. Emails a 15-minute reset link to any user (userController.ts:3736-3768). The exclusion is enforced, because `getTargetUserId` reads `body.user_id`. There is no branch check. |
| PUT | /user/update-user-status | Members:manage | :132. Sets `is_active` from `body.{id,is_active}` (`updateUserSatus`, userController.ts:1152-1212). This disables the account. The exclusion check reads `body.id`. There is no branch check. |
| DELETE | /user/delete-user | Members:admin + exclusion | :137. Hard delete by `query.id` (userController.ts:1214-1240). No branch check. |
| DELETE | /user/delete-account | auth-only (self) | :143 (userController.ts:1246) |
| PUT | /user/activate-account | Members:manage | :145. Toggles `is_active` for `query.user_id` (userController.ts:1714-1750). No branch check. |
| GET | /user/get-user-email | can_view_member_details (own or all) | :150 (userController.ts:3150-3233) |
| GET | /user/ | public | :156. Landing page. |
| PUT | /user/update-member-status | Members:manage | :158. Converts to confirmed member (userController.ts:3235). |
| POST | /user/update-member-status/bulk | Members:manage | :164. **The `user_ids` array bypasses exclusions** (userController.ts:3282). No branch check. |
| POST | /user/update-user-status/bulk | Members:manage | :170. Bulk activate or deactivate; the **array bypasses exclusions** (userController.ts:3329). |
| PUT | /user/link-spouses | Members:manage | :176. The `husband`/`wife` body fields bypass exclusions (userController.ts:3386). |
| GET | /user/get-user-family | can_view_member_details (own or all) | :182 (userController.ts:3408) |
| PUT | /user/link-children | Members:manage | :188. The `childrenIds`/`parentId` fields bypass exclusions (userController.ts:3447). |
| GET | /user/current-user | auth-only (self) | :194 (userController.ts:3473) |
| GET | /user/profile-stats | auth-only (self) | :196 (userController.ts:3616) |
| GET | /user/set-default-passwords | Members:admin | :198. **A GET that resets passwords.** It is blocked in production by `canRunSensitiveUserOps` (userController.ts:3656-3675). |
| POST | /user/send-emails-to-user | Members:manage | :204. Sends a bulk email to the given addresses (userController.ts:3682-3700). **This is a bulk-messaging capability outside the Messaging domain.** |

### Implicit scoping / visibility
- **Own-record mode** for `get-user`, `get-user-family` and `get-user-email` when the caller lacks Members:view (AUTH:1055-1068).
- **Exclusions** (a per-role hidden-member list) on the list, light and search endpoints (userController.ts:2175, 2421, 2613).
- **Branch:** lists use `getBranchScopedWhere`, which members bypass (branchService.ts:63-82, AUTH:352-355).
- **Should be scoped but isn't:**
  - by-id get, update, delete, status and activation (no `assertBranchAccessible` anywhere in userController.ts)
  - `list-users-light` for members
  - `/user/guests`
  - `/user/directory` for members (low; by design it carries no contact data)

### Workflow / approval decisions
- **Guest to member** (membership requests): approve or decline needs Members:manage (userRoutes.ts:106-115). The guard does not use the Membership_Management domain, which exists for exactly this (AUTH:18).
- **Ministry-worker login:** `give-access` needs Access_rights:manage, and role eligibility is checked by `roleEligibilityService.assertEligible("ministry_worker")` (userController.ts:3811-3813).

### Candidate action permissions
- `members.create` (/register; this needs a guard)
- `members.edit`
- `members.delete`
- `members.activate_deactivate` (:132, :145, :170)
- `members.change_membership_status` / `convert_to_confirmed` (:158, :164)
- `members.link_family` (:176, :188)
- `members.send_password_link` (:127)
- `members.bulk_email` (:204), which belongs under Messaging
- `membership.approve_request` / `membership.decline_request` (:106, :111)
- `members.view_contact_details`, to split name-only from PII (/directory vs /list-users-light)
- `access.grant_login` (:122)
- `members.export`: none exists server-side; the frontend builds exports

### Gaps
- **CRITICAL/HIGH: `POST /user/register` is unauthenticated** (userRoutes.ts:90) yet does an admin-grade member create, including department and position placement, membership status and visitor/soul conversion (userService.ts:123-420).
- **HIGH: `GET /user/list-users-light` exposes the whole org's names and emails to any member, and lets them enumerate privileged users by domain and level** (userRoutes.ts:62; userController.ts:2465-2473, 2582-2595).
- **HIGH: `GET /user/guests` exposes guest PII to any logged-in user** (userRoutes.ts:100; AUTH:1236-1243; selfServiceController.ts:355-397).
- **MED: no branch check on any by-id member read or write** (userController.ts:427, 1152, 1214, 1714, 2683, 3235). A branch-A admin can edit or delete a branch-B member by id.
- **MED: exclusions are bypassed by every array or alternate-field endpoint** (bulk status :164/:170, link-spouses :176, link-children :188).
- **MED: membership-request decisions borrow Members** instead of Membership_Management.
- **LOW:**
  - `send-emails-to-user` is bulk outbound email outside Messaging.
  - `stats-users` is org-wide.
  - Own-mode detection is a URL substring match (AUTH:1027-1035).

## Module: departments (/department)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /department/create-department | can_manage_department_scoped (Departments:manage) | departmentRoute.ts:168. **Under the `assigned_departments` scope there is no target id, so a scoped user can create departments** (AUTH:1594-1600). Branch is set via `resolveBranchIdOrDefault` (departmentController.ts:232). Setting `department_head` hands that user scoped department access in auth, assets and reports (AUTH:557-561). |
| PUT | /department/update-department | can_manage_department_scoped | :199. The existing branch is checked only if the body omits `branch_id` (departmentController.ts:339-341). The caller can reassign `department_head`, which grants implicit HOD powers. |
| DELETE | /department/delete-department | can_delete_department_scoped (Departments:admin) | :222. Uses `isDepartmentInScope` (departmentController.ts:393). **No branch check** on the id (:401). |
| GET | /department/list-departments | can_view_department_scoped | :271. [IMPLICIT-SCOPE: dept + branch] (departmentController.ts:436-441) |
| GET | /department/get-department | can_view_department_scoped | :328. Scope is checked on `query.id`, plus a branch filter on the members sub-list (departmentController.ts:555-620). |
| GET | /department/list-departments-light | can_view_department_scoped | :334 (departmentController.ts:504-508) |

### Implicit scoping
- `assigned_departments`: `departmentIds` is any department the user is a **member** of, or heads (AUTH:614-626). A choir member with a scoped Departments:manage role can edit the choir.

### Candidate actions
- `departments.create`
- `departments.edit`
- `departments.delete`
- `departments.assign_head`, which grants implicit HOD powers and should be separate
- `departments.manage_members`
- Join requests (see F4)

### Gaps
- **MED:** setting `department_head` is an implicit privilege grant (HOD powers in join requests, department reports, the hod workspace, requisition HOD approval and asset counts) gated only by Departments:manage.
- **MED:** scoped users can create departments, and delete has no branch check.
- **LOW:** the scope is based on membership, not leadership.

## Module: positions (/position)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /position/create-position | Positions:manage | positionRoute.ts:123. Branch via `resolveBranchIdOrDefault` (positionController.ts:32). |
| PUT | /position/update-position | Positions:manage | :157. **No branch check** on the id. The branch is resolved only if the body supplies one (positionController.ts:82-100). |
| DELETE | /position/delete-position | Positions:admin | :182. **No branch check**: deletes by id (positionController.ts:131-139). |
| GET | /position/list-positions | **auth-only** | :212. Branch-filtered for admins, all branches for members (positionController.ts:168-171). LOW. |
| GET | /position/get-position | Positions:view | :247. No branch check (positionController.ts:240-250). |
| GET | /position/get-positions-light | Positions:view | :253 |

### Notes
- Positions drive the requisition approval chain, where a position holder can be an approver (see F1, requisition-approval-workflow.ts). So creating or assigning positions is an indirect approval-rights grant.
- The Departments `assigned_departments` scope does not apply to positions.

### Candidate actions
- `positions.create`, `positions.edit` and `positions.delete`
- `positions.assign`: today this happens through member update (`department_positions`)

### Gaps
- **MED:** by-id update and delete have no branch check (positionController.ts:82, 131).
- **LOW:** list-positions is protect-only.


---

<!-- slice F1 -->

## Module: requisitions (/requisitions)

Files: `src/modules/requisitions/requisitionRoute.ts`, `requisitionsController.ts`, `requisition-service.ts`, `requisition-redesign.ts`, `requisition-approval-workflow.ts`. Schema: `request` (prisma/schema.prisma:896), `requisition_approval_configs` (:1174, `module` is `@unique` so there is ONE global config per module, with no branch or department dimension), `..._config_requesters` (:1209), `..._config_steps` (:1220), `..._instances` (:1235), enum `RequestApprovalStatus` (:2818: Draft, Awaiting_HOD_Approval, Awaiting_Executive_Pastor_Approval, APPROVED, REJECTED; there is **no disbursed/paid/fulfilled state**).

Background that every row below depends on:
- Behind `protect` only, `req.user` is the **decoded JWT** (authorization.ts:972-975). The JWT `permissions` claim is the home-branch role frozen at login, valid for 12h (userController.ts:1400-1408, 1435, 1456-1459).
- Behind `checkPermission`, `req.user.permissions` is replaced with the live permissions of the active branch (authorization.ts:893-903).
- The services decide "manager" with their own `hasRequisitionManagePermission(user)`, which reads `Requisition`/`Requisitions` from `req.user.permissions` (requisition-service.ts:449-457; requisition-redesign.ts:106 → workflow.ts:180-198). So the same service code checks the stale JWT on protect-only routes and the live permissions on guarded routes.
- `checkPermission("Requisition","manage")` falls back to `canUserManageRequisitionByApproverRole` (authorization.ts:1004-1012 → workflow.ts:2574-2667), covered under Gaps.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /requisitions/upsert-approval-config | `can_manage_requisitions` → Requisition:manage, **plus approver-role fallback** | requisitionRoute.ts:58. Handler has no further check (requisitionsController.ts:57-69 → service:1704-1725 → workflow.ts:1282). [WORKFLOW] Rewrites the global approval chain, requesters and notification list. Any approver-role user can reach it (see Gaps H1). |
| GET | /requisitions/get-approval-config | `can_view_requisitions` → Requisition:view | :63. No approver fallback (only `manage` has one, authorization.ts:1004). Returns the global config (service:1727). |
| POST | /requisitions/create-requisition | auth-only | :68. Any authenticated user. Branch comes from `resolveBranchIdOrDefault` (service:1106). `department_id` is chosen by the client with no membership check (service:1107). If `submit_for_approval`, the requester allowlist is enforced in the workflow (workflow.ts:1462-1470). [IMPLICIT-SCOPE: own] |
| POST | /requisitions/submit-requisition | auth-only | :73. Owner only (service:1920-1921). The allowlist is enforced at submit (workflow.ts:1462). [WORKFLOW] |
| POST | /requisitions/approval-action | `can_manage_requisitions` (+approver fallback) | :78. The service requires the actor to be the current pending step's `approver_user_id` (workflow.ts:2341-2344). Holding the permission alone cannot approve. Legacy fallback when the workflow tables are missing: Can_Manage = HOD and Super_Admin = Executive Pastor, hardcoded from the **JWT/live** `permissions.Requisition` (service:959-1060, 1991-1998). [WORKFLOW] |
| GET | /requisitions/pre-approval-similar-items | `can_manage_requisitions` (+approver fallback) | :83. Looks up any requisition by id, with no ownership, branch or participation check (service:1768-1790+). An approver-role user can read item history for any requisition. |
| GET | /requisitions/list-requisition | auth-only | :88. The service branches on the JWT manage flag: managers get every requisition in the branch scope, everyone else only their own (service:1684-1694). [IMPLICIT-SCOPE: own] Uses the stale JWT permissions. |
| GET | /requisitions/my-requisitions | auth-only | :93. Own requisitions, branch-scoped (service:1696-1702). [IMPLICIT-SCOPE: own] |
| GET | /requisitions/get-requisition | auth-only | :98. Allowed for the owner, a JWT manager, or an approval participant (approver or acted_by) (service:2116-2127). Has **no branch check** on the record. [IMPLICIT-SCOPE: own/participant] |
| PUT | /requisitions/update-requisition | auth-only | :103. Signed update by a non-requester means approve/reject. Only the current pending approver may do it (service:1316-1336), so this is a **second approval entry point** that skips the `can_manage_requisitions` guard (the service check still holds). Edit is allowed for: the requester until any step is approved; the current pending approver (who can edit content); or, without a workflow, a JWT manager (service:1373-1397). [WORKFLOW][IMPLICIT-SCOPE: own] |
| DELETE | /requisitions/delete-requisition | auth-only | :108. Allowed for the owner or a JWT Requisition manager (service:1661 → 459-469). **There is no status check**, so an APPROVED or in-flight requisition can be deleted along with its items and attachments (service:1663-1680). `can_delete_requisitions` (admin) is defined but used by no route. [NO-GUARD-MUTATION (service-only check)] |
| GET | /requisitions/staff-requisition | `can_manage_requisitions` (+approver fallback) | :113. Returns **every non-draft requisition** in the branch scope, with no user filter (service:2020-2027). [UNSCOPED-LIST] Approver-role users see all of them. |
| GET | /requisitions/overview | auth-only | :122. `scope=mine` returns own. `scope=all` returns everything for a JWT manager, otherwise requisitions where the user is a step approver (redesign.ts:346-362). [IMPLICIT-SCOPE: own/participant] |
| GET | /requisitions/overview-detail | auth-only | :127. Gated through `getRequisition` (redesign.ts:494). |
| POST | /requisitions/send-reminder | `can_manage_requisitions` (+approver fallback) | :132. The service additionally requires `isManager` on the live permissions (redesign.ts:621-625), so the approver fallback is cut off here. |
| GET | /requisitions/analytics | auth-only | :137. JWT managers get everything. Non-managers need at least one approval instance and then see only requisitions they are an approver on (redesign.ts:863-896). [IMPLICIT-SCOPE: participant] |
| POST | /requisitions/add-comment | auth-only | :142. Gated through `getRequisition` (redesign.ts:1127). |

### Implicit scoping / visibility
- **Own:** list for non-managers (service:1690-1693), my-requisitions (:1696-1702), overview `mine` (redesign.ts:356-357), delete/edit by the owner (service:1292, 1661).
- **Approval participant:** get-requisition (service:2111-2127), overview `all` for non-managers (redesign.ts:361), analytics (redesign.ts:870-871, 895).
- **"Manager sees all":** decided by the stale JWT on protect-only routes (service:1686, redesign.ts:351/868) and by live permissions on guarded routes. Not branch-aware: a manager in their home branch passes the role test on records in other branches (get-requisition has no branch filter, service:2029-2127). Lists are still clamped by `getBranchScopedWhere`, because `protect` sets the branch scope (authorization.ts:961-969).
- **Missing department scope:** there is no "my department's requisitions" visibility. A department head sees a department requisition only when they are the resolved approver for it. The HOD step resolves from the **request's** `department_id` (user-supplied) before the requester's own department (workflow.ts:1086). So a requester can raise a requisition against any department and route it to that department's head; nothing checks that the requester belongs to it (service:1107).
- **Missing branch dimension on approval config:** the config is global (`module @unique`, schema:1176). Every branch shares one approval chain and requester list.

### Workflow / approval decisions
- **Chain definition:** steps are HEAD_OF_DEPARTMENT, POSITION or SPECIFIC_PERSON (workflow.ts:300, 613-650). They resolve to a single user when the requisition is submitted: HOD via `department.department_head` (:1072-1125), POSITION via the one active user holding `position_id` (errors if 0 or more than 1, :1164-1192), SPECIFIC_PERSON via the user id (:1195-1215). The resolved user is snapshotted into `requisition_approval_instances.approver_user_id` (:1487).
- **Who may approve:** only the snapshotted `approver_user_id` of the lowest pending step (workflow.ts:2326-2344). This is position/person-based and does **not** consult any permission level.
- **Who may request:** configured requesters, plus every active user whose legacy `user.access` level has Requisition Can_Manage/Super_Admin (workflow.ts:221-244, 1042-1068). This reads `user.access_level_id`, **not** `user_branch_access` (drift from the per-branch model in authorization.ts:578-591).
- **Separation of duties:** a requester cannot be a configured approver (workflow.ts:93, 1128-1162, 1474-1480).
- **finance_approver:** only parsed for the EVENT_REPORT module (workflow.ts:676-690, 1287-1294). Requisitions have **no finance, disbursement or payment step**, and the status enum stops at APPROVED.
- **Legacy path** (tables missing): permission-level hardcoding, where Can_Manage approves the HOD stage and Super_Admin approves the Pastor stage (service:966-1055).
- **Reminders:** Requisition manager only (redesign.ts:623). Auto reminders run on cron (redesign.ts:694).

### Candidate action permissions
- `requisition.configure_approval_chain`: POST /upsert-approval-config (requisitionRoute.ts:58; workflow.ts:1282)
- `requisition.create` / `requisition.submit`: create-requisition / submit-requisition (:68, :73; service:1088, 1889). Today this is the config requester allowlist.
- `requisition.approve`, `requisition.reject`: approval-action and signed update-requisition (:78, :103; workflow.ts:2283; service:1316)
- `requisition.edit_as_approver` (an approver edits content): service:1385-1389
- `requisition.delete_any` vs `delete_own_draft`: service:1634-1682
- `requisition.view_all` (staff list / overview all / analytics): service:2020, redesign.ts:346, 863
- `requisition.send_reminder`: :132; redesign.ts:621
- `requisition.comment`: :142; redesign.ts:1112
- `requisition.view_similar_items` (pre-approval check): :83; service:1768
- `requisition.disburse` / `mark_paid` / `fulfil`: **does not exist**. It would need a new status (enum at schema:2818).
- `requisition.raise_from_asset` (repair requisition): see the assets module, asset-redesign.ts:703

### Gaps
- **H1. The approver-role fallback grants all of Requisition:manage.** `checkPermission` passes any `Requisition` manage check when `canUserManageRequisitionByApproverRole` is true (authorization.ts:1004-1012). That function returns true for (a) anyone with *any* pending instance anywhere, (b) a SPECIFIC_PERSON in the config, (c) the holder of a configured POSITION, and (d) **any department head in the org** when the chain contains a HEAD_OF_DEPARTMENT step (workflow.ts:2617-2659). Every route guarded by `can_manage_requisitions` opens up to them:
  - `upsert-approval-config` (route :58), with no further service check, so a department head can rewrite the global chain, make themselves the only approver and add requesters
  - `staff-requisition` (:113), listing every non-draft requisition org-wide
  - `pre-approval-similar-items` (:83), with no record-level check
  - The fallback also ignores branch: a non-privileged department head has `allowedBranchIds = null` (authorization.ts:353-355).
- **H2. Stale JWT permissions decide authorization on protect-only routes.** list, get, update, delete, overview and analytics read `req.user.permissions` from the 12h login token (authorization.ts:972-975; userController.ts:1403-1408). Revoked Requisition manage keeps working for up to 12h. The value is the home-branch role, not the active branch's.
- **H3. delete-requisition has no status guard** (service:1634-1682). The owner, or any JWT manager (manage, not admin), can hard-delete APPROVED or in-approval requisitions together with their approval history (cascade, schema:1251). `can_delete_requisitions` (authorization.ts:2332) is unused.
- **M1. Approval config is global.** It has no branch or department dimension (schema:1176), so a branch-scoped admin edits every branch's chain.
- **M2. The requester can pick any `department_id`** (service:1107). The HOD resolution follows that choice (workflow.ts:1086), with no department membership check.
- **M3. Auto-requesters use legacy `user.access`** instead of per-branch grants (workflow.ts:221-244). This drifts from the model used everywhere else.
- **M4. get-requisition has no branch check** for managers (service:2116-2127).
- **M5. pre-approval-similar-items** has no participation or branch check (service:1768+).
- **L1. Pending approvers can edit requisition content** (service:1385-1389). There is no separate edit right.
- **L2. Legacy approval path** hardcodes Can_Manage as HOD and Super_Admin as Pastor (service:966-967).
- **L3. Service reads only the `Requisition`/`Requisitions` keys** (workflow.ts:111; service:452), bypassing `PERMISSION_KEY_ALIASES`. It matches today, but it is a second source of truth.

---

## Module: settings (/settings)

Files: `src/modules/settings/route.ts` and five service/controller pairs. Schema: `system_notification_settings` (schema:231, singleton), `attendance_timing_settings` / `attendance_timing_rule_version` (:264, :285), `event_report_exclusion` (:303), `role_eligibility_rules` / `position_eligibility_rules` (:1476), `report_config` (:4018, singleton `id`). This module holds **no approval-chain config**: requisition and event-report chains live in their own modules (see requisitions above and eventReports).

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /settings/attendance-timing-config | `can_view_settings` → Settings:view | route.ts:13. Global config. |
| POST | /settings/upsert-attendance-timing-config | `can_manage_settings` → Settings:manage | :19. Global and versioned (attendanceTimingSettingsService.ts:249-345). Writes affect attendance classification for every branch. [BORROWED: attendance rules sit under Settings, not Church_Attendance] |
| GET | /settings/event-report-exclusions | `can_view_settings` | :25 |
| POST | /settings/upsert-event-report-exclusions | `can_manage_settings` | :31. Replaces the whole list of user ids excluded from event reports. Users can come from any branch (eventReportExclusionService.ts:80-112). [BORROWED: event-report data under Settings] |
| GET | /settings/report-config | `can_view_settings` | :37. Department list is branch-scoped (reportConfigService.ts:78-96). |
| POST | /settings/upsert-report-config | `can_manage_settings` | :43. Report owners and department attendance due day / disabled departments. Only newly chosen department ids are checked against the caller's branches (reportConfigService.ts:101-112, 143-144). The singleton is global. [BORROWED: Reports domain exists but is not used] |
| GET | /settings/get-role-eligibility-config | `can_view_settings` | :49 |
| POST | /settings/upsert-role-eligibility-config | `can_manage_settings` | :55. Sets which roles and positions are eligible for which programs (roleEligibilityService.ts:231-300). [BORROWED: School_of_ministry/Program] |
| GET | /settings/system-notification-config | `can_view_settings` | :61 |
| GET | /settings/system-notification-admins | `can_view_settings` | :67. Lists `is_user` staff candidates from every branch (systemNotificationSettingsService.ts:105-110). |
| POST | /settings/upsert-system-notification-config | `can_manage_settings` | :73. Sets the global system-failure alert recipient (systemNotificationSettingsService.ts:150-165). |

Settings guards are also borrowed elsewhere (counts from grep): branches/branchRoute.ts (5: create, update and set-default branch, delete-impact, delete), devices/devicesRoute.ts (5), and finance ReceiptConfig/PaymentConfig/BankAccountConfig/TitheBreakdownConfig (4 each). Those are covered by other parts of the audit.

### Implicit scoping / visibility
- Only report-config narrows by branch, in the department list and new-id validation (reportConfigService.ts:78-112). Every other config is an org-wide singleton or list.
- **Missing:** with a branch active, `checkPermission` judges Settings by that branch's role alone (authorization.ts:388-400). A user who is Settings Can_Manage in just one branch can therefore change org-wide singletons by selecting that branch. A manage action in "all branches" mode needs the right in every branch (authorization.ts:402-404); selecting a single branch avoids that.

### Workflow / approval decisions
- None in this module. Every write is a plain Settings:manage permission-level check. No sign-off.

### Candidate action permissions
- `settings.attendance_timing.manage` (route.ts:19)
- `settings.event_report_exclusions.manage` (:31)
- `reports.configure` (report owners/due day) (:43). This is a natural fit for the existing `Reports` domain.
- `programs.eligibility.manage` (:55)
- `system.alert_recipient.manage` (:73)

### Gaps
- **M1. Global singletons sit behind a branch-scoped check.** A single-branch Settings manager rewrites org-wide config (authorization.ts:388-400; all upsert routes :19-77).
- **M2. Domain borrowing.** Settings stands in for Church_Attendance (timing), Reports (report-config, exclusions) and School_of_ministry (role eligibility). A user cannot be granted one of these without all of them. The Reports alias falls back to Settings (authorization.ts:73), but the reverse does not happen.
- **L1. The system-notification-admins list** exposes staff in every branch (systemNotificationSettingsService.ts:105-110).
- **L2. `can_delete_settings` is not used here.** There is no delete. It is used for branch deletion (branchRoute.ts:39-42).

---

## Module: assets (/assets)

Files: `assetRouter.ts`, `assetController.ts` (legacy CRUD), `asset-redesign.ts`, `asset-stock-check.ts`, `assetRedesignController.ts`. Schema: `assets` (schema:503: `department_assigned`, `branch_id`, `created_by`, `repair_request_id`), `asset_stock_check*` (:559-640).

Guard `can_view_assets_scoped` (authorization.ts:1510-1565):
- If the user is privileged with Asset:view → mode `all`.
- Otherwise, **anyone who belongs to a department**, privileged or not, gets mode `department` over `departmentIds`. `departmentIds` is the user's `department_id`, plus department_positions, plus the departments they head (authorization.ts:539-555, 607-617).
- It also attaches `assetAccess.{canViewAll, canManage, canAdmin}`, which the redesign services read.

The bundle `manage = [protect, can_view_assets_scoped, can_manage_asset]` (assetRouter.ts:258).

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /assets/create-asset | `can_manage_asset` → Asset:manage | assetRouter.ts:143. Any department; `created_by` is the caller (assetController.ts:24-55). |
| GET | /assets/list-assets | `can_view_assets_scoped` | :172. Branch filter, plus `department_assigned IN departmentIds` in department mode (assetController.ts:141-153). [IMPLICIT-SCOPE: dept] |
| GET | /assets/get-asset | `can_view_assets_scoped` | :196. The guard checks the department of `?id` (authorization.ts:1545-1557). The controller also applies the scope (assetController.ts:189-203). [IMPLICIT-SCOPE: dept] |
| PUT | /assets/update-asset | `can_manage_asset` | :220. Updates by id with no branch or department check beyond the role (assetController.ts:93-125). |
| DELETE | /assets/delete-asset | `can_delete_asset` → Asset:admin | :244. Hard delete by id with no branch check (assetController.ts:223-234). |
| GET | /assets/overview | view bundle | :260. `assetScopeWhere` applies branch + department (asset-redesign.ts:145-148, 266-290). [IMPLICIT-SCOPE: dept] |
| GET | /assets/history | view bundle | :261. Scoped (asset-redesign.ts:304-310). |
| POST | /assets/save-asset | manage bundle | :262. `requireManage` (asset-redesign.ts:374-376). |
| POST | /assets/update-status | manage bundle | :263. Single/bulk status change (asset-redesign.ts:542-560). |
| POST | /assets/restore | manage bundle | :264. Undo (asset-redesign.ts:612-620). |
| POST | /assets/confirm-lost | manage bundle | :265. Writes off an asset as lost (asset-redesign.ts:661-668). It is irreversible in practice, yet only needs manage, not admin. |
| POST | /assets/repair-requisition | manage bundle | :266. **Opens requisitions from assets**: one per department, auto-submitted into the requisition chain with the asset manager as requester (asset-redesign.ts:703-790 → `createRequisitionTx` service:1088). It does **not** check the Requisition domain. The requisition requester allowlist still applies (workflow.ts:1462). `fallback_department_id` is arbitrary (asset-redesign.ts:725, 738). [WORKFLOW][BORROWED: creates Requisition records under Asset:manage] |
| POST | /assets/clear-repair-requisition | manage bundle | :267. Only after REJECTED (asset-redesign.ts:822-853). |
| GET | /assets/stock-checks | view bundle | :269. Department users see only checks with items in their departments (asset-stock-check.ts:326-370). [IMPLICIT-SCOPE: dept] |
| GET | /assets/stock-checks/detail | view bundle | :270. Non-managers see OPEN checks only, with their department's items (asset-stock-check.ts:377-385). |
| POST | /assets/stock-checks/start | manage bundle | :271. `requireAdmin`, which actually checks `canManage` (asset-stock-check.ts:244-246, 391-393). |
| POST | /assets/stock-checks/cancel | manage bundle | :272 (asset-stock-check.ts:490-492) |
| POST | /assets/stock-checks/mark | **view bundle** | :273. Record counts. `canCount` = manager or own department (asset-stock-check.ts:247-248, 540-560). **A non-privileged department member can write here.** [IMPLICIT-SCOPE: dept] |
| POST | /assets/stock-checks/set-fix | manage bundle | :274. Decides reconciliation per item (asset-stock-check.ts:594-613). |
| POST | /assets/stock-checks/add-extra | **view bundle** | :275. Department-scoped write (asset-stock-check.ts:615-640). |
| POST | /assets/stock-checks/remove-extra | **view bundle** | :276. Own recorded extras only, unless manager (asset-stock-check.ts:641-660). [IMPLICIT-SCOPE: own] |
| POST | /assets/stock-checks/submit | **view bundle** | :277. Submits own department's count (asset-stock-check.ts:664-694). |
| POST | /assets/stock-checks/reopen | **view bundle** | :278. Reopens own department's count (asset-stock-check.ts:696-735). |
| POST | /assets/stock-checks/remind | manage bundle | :279 (asset-stock-check.ts:736-748) |
| POST | /assets/stock-checks/recount | manage bundle | :280 (asset-stock-check.ts:750-783) |
| POST | /assets/stock-checks/mark-rest-missing | manage bundle | :281 (asset-stock-check.ts:785-811) |
| POST | /assets/stock-checks/close | manage bundle | :282. Closes the check and applies the fixes to assets (asset-stock-check.ts:813-950). |

### Implicit scoping / visibility
- **Department scope without a permission:** any member with a department gets read access to their department's assets and can do stock-check counting writes (authorization.ts:1536-1565; asset-stock-check.ts:247-248). This is the only place in the slice where a "department" visibility tier exists, and it is **implicit**: it is not configurable on the access level and not tied to Asset view.
- **Legacy update/delete** (assetController.ts:93-125, 223-234) do not apply branch or department scope. The redesign writes do (`assetScopeWhere(access, writeBranch(req))`, asset-redesign.ts:457, 560, 620, 668, 711, 829).
- `canAdmin` (Asset:admin) is computed (authorization.ts:1530-1532) but only reported to the client (asset-redesign.ts:287). No redesign action requires it.

### Workflow / approval decisions
- **Stock check:** an asset manager starts it; department members count, submit and reopen their department's portion; the manager decides fixes and closes. Who counts is decided by **department membership**, not by permission (asset-stock-check.ts:166, 247-248).
- **Repair requisition:** Asset:manage raises it, then the normal requisition chain approves. Clearing is allowed only after rejection (asset-redesign.ts:840-845).

### Candidate action permissions
- `asset.create/edit` (create-asset, save-asset, update-asset: :143, :262, :220)
- `asset.delete` (:244)
- `asset.change_status` / `asset.undo_status` (:263, :264)
- `asset.write_off_lost` (confirm-lost :265)
- `asset.raise_repair_requisition` (the PO's "open a requisition from an asset") (:266; asset-redesign.ts:703)
- `asset.clear_repair_requisition` (:267)
- `asset.stock_check.start/cancel/close` (:271, :272, :282)
- `asset.stock_check.count` (mark/add-extra/remove-extra/submit/reopen: :273-278)
- `asset.stock_check.reconcile` (set-fix, mark-rest-missing: :274, :281)
- `asset.stock_check.remind/request_recount` (:279, :280)

### Gaps
- **M1. Non-privileged department members read their department's assets and write stock-check counts** with no Asset permission at all (authorization.ts:1536-1565; assetRouter.ts:273-278). This may be intended, but it is invisible in the permission model.
- **M2. Legacy update-asset and delete-asset ignore branch and department.** A manage/admin user in one branch can edit or delete any asset id in another branch while that branch is active (assetController.ts:93-125, 223-234).
- **M3. repair-requisition creates Requisition records under Asset:manage**, for any department via `fallback_department_id`, with no Requisition domain check (asset-redesign.ts:703-790).
- **L1. confirm-lost** (a write-off) needs only manage (asset-redesign.ts:661-663). `canAdmin` is unused for writes.
- **L2. `requireAdmin` in the stock-check service actually checks `canManage`** (asset-stock-check.ts:244-246). The naming is misleading.

---

<!-- slice F2 -->

# Part F2: finance, pledges, integrationUtils, payment webhooks

All paths are relative to `../Backend`. Guard semantics (from `src/middleWare/authorization.ts`):
- `checkPermission(domain, level)` (`authorization.ts:981`) loads live permissions per branch (not from the JWT). With an active branch, that branch's grant decides. With no branch active, **view** passes if any branch grants it, and **manage/admin** pass only if **every** branch grants it (`authorization.ts:388-405`).
- `protect` (`authorization.ts:937`) checks only the JWT and that the account is active. It sets `req.user = {...decodedJWT, active_branch_id, allowed_branch_ids}`, so `req.user.permissions` holds the **JWT's home-branch permissions as they were at login** (`userController.ts:1400-1408,1435`). They stay stale for up to 12h (`userController.ts:1457-1459`).
- Alias fallbacks that apply here (`authorization.ts:16-74`):
  - `Financials -> [Financials, Access_rights, "Access rights"]`
  - `Giving -> [Giving, Giving_Options, "Giving Options", Financials, Access_rights, "Access rights"]`
  - `Pledges -> [Pledges, Pledge]`
  - `Settings -> [Settings, Access_rights, "Access rights"]`
- Branch helpers (`src/modules/branches/branchService.ts`):
  - `getBranchScopedWhere(value)` (`:81`) filters by the requested or active branch, clamped to the allowed branches. With no branch requested, it returns `{in: allowed}` for branch-limited admins and **no filter** for everyone else (`:63-79`).
  - `resolveBranchIdOrDefault` (`:119-145`) clamps writes to the caller's branches.
  - None of the by-id reads or writes in this slice call a by-id branch assertion.

---

## Module: finance/Financials (`/financials`)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /financials/upsert-approval-config | `can_manage_financials` -> Financials:manage | Sets the **single global** finance approver and the notify list. [WORKFLOW] `route.ts:57-61`, `service.ts:365-424` |
| GET | /financials/get-approval-config | `can_view_financials` -> Financials:view | Global config, not branch-scoped. `route.ts:62-66`, `service.ts:354` |
| POST | /financials/create-financial | custom `canManageFinancialsOrActAsApprover` -> Financials:manage **read from the JWT claims**, OR the caller is `finance_approver_user_id` | [WORKFLOW] If the approver submits, the record is auto-APPROVED. `route.ts:12-55,67-71`, `service.ts:451-460` |
| GET | /financials/get-financials | `can_view_financials` | [IMPLICIT-SCOPE: branch] via `getBranchScopedWhere`. `route.ts:72-76`, `service.ts:538-544` |
| GET | /financials/get-financial | `can_view_financials` | Branch check runs only when the `branch_id` **query** is passed (`service.ts:576-579`). With only the header, there is no check, so another branch's record is readable by id. |
| PUT | /financials/update-financial | custom `canManageFinancialsOrActAsApprover` | Non-draft records can be edited only by the approver (`service.ts:295-316,606-610`). There is no branch check on the existing record (`service.ts:597-604`). [WORKFLOW] `route.ts:82-86` |
| POST | /financials/approve-financial | `can_view_financials` (view only) | The real check is hardcoded in the service: actor === the global `finance_approver_user_id` (`service.ts:715-739,742`). [WORKFLOW] `route.ts:109-113` |
| POST | /financials/return-financial | `can_view_financials` | Same approver-only check (`service.ts:789-832`). [WORKFLOW] `route.ts:141-145` |
| GET | /financials/auto-amounts | `can_view_financials` | Totals giving contributions and pledge payments for a period, branch-scoped (`service.ts:841-876`). `route.ts:175-179` |
| DELETE | /financials/delete-financial | `can_delete_financials` -> Financials:admin | Drafts only (`service.ts:889-892`). No branch check. `route.ts:180-184` |

### Implicit scoping / visibility
- The list is branch-filtered (`service.ts:538-544`). There is no own, department or preparer scoping: anyone with Financials:view sees every weekly record in their branch(es), drafts included.
- `findOne` checks the branch only when a `branch_id` query param is passed (`service.ts:576-579`). By-id `update`, `approve`, `returnRecord` and `delete` never check the record's branch (`service.ts:597,723,880`).
- `isEditable` in each response is computed per actor: `DRAFT`, or the actor is the approver (`service.ts:163-177,344-348`).

### Workflow / approval decisions
- There is **one global approver user**: `finance_approval_config.config_key @unique default "FINANCE"` (`prisma/schema.prisma:2483-2501`, `service.ts:192-207`). The schema has a `branch_id` column but the service never reads or writes it (`service.ts:374-406`). As a result, there is no per-branch approver, no position-based approver and no approver chain.
- The approver's right comes from the stored user id, not a permission (`service.ts:730-732`). The route only asks for Financials:view.
- **No separation of duties:**
  - When the approver creates or updates a record with SAVE_AND_APPROVE, it goes straight to APPROVED (`service.ts:451-460,632-641`).
  - The approver can edit records that are already APPROVED (`service.ts:305-309`).
- To be eligible as approver or notifier, a user needs Financials:view on the **legacy `user.access`** relation (`service.ts:222-266`) through `utils/permissionResolver.ts`. That relation is not the per-branch `user_branch_access` grants that `authorization.ts` uses (`authorization.ts:572-585`), so a valid branch-granted finance user can be rejected, and a user with a stale legacy level can be accepted.
- Notifications go to the approver when approval is requested, and to the notify list plus the preparer when a record is approved or returned (`service.ts:481-515,762-775,816-823`).

### Candidate action permissions
- `financials.submit_for_approval`: create/update with action≠SAVE_DRAFT (`service.ts:455-460`)
- `financials.approve`: POST /financials/approve-financial (`route.ts:109`, `service.ts:742`)
- `financials.return`: POST /financials/return-financial (`route.ts:141`, `service.ts:789`)
- `financials.edit_approved`: today implicit for the approver (`service.ts:305`)
- `financials.configure_approval`: POST /financials/upsert-approval-config (`route.ts:57`)
- `financials.delete_draft`: DELETE /financials/delete-financial (`route.ts:180`)

### Gaps
- **HIGH:** `canManageFinancialsOrActAsApprover` reads `req.user.permissions`, which `protect` copies from the JWT (`route.ts:18-26`, `authorization.ts:974-978`, `userController.ts:1403-1408,1435`). This causes three problems:
  - Revoked Financials:manage keeps working for up to 12h.
  - The JWT holds **home-branch** permissions, so a user with manage in their home branch can create and edit records in any branch they can name. `resolveBranchIdOrDefault` only clamps to *allowed* branches, not to branches where they hold manage.
  - It uses `permissionResolver`'s alias table (`utils/permissionResolver.ts:1-9`). That table drifts from `authorization.ts`: `Financials -> [Financials, Finance, Finances]` with no Access_rights fallback.
- **HIGH:** approve and return are gated only by Financials:view plus a single hardcoded user id. A global approver also approves other branches' records, with no branch check (`service.ts:715-739`).
- **MED:** by-id reads and writes have no branch boundary (`service.ts:576-579,597-604,723,880`).
- **MED:** the approver can self-approve their own submission (`service.ts:451-460`).
- **LOW:** the approver-eligibility check uses the legacy `user.access` (`service.ts:231-266`).

---

## Module: finance/GivingOption + contributions (`/givingoption`)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /givingoption/banks | `can_manage_giving` -> Giving:manage | Proxies the Paystack bank list. `route.ts:44-48`, `service.ts:427-436` |
| GET | /givingoption/resolve-account | `can_manage_giving` | Paystack account-name lookup. `route.ts:76-80`, `service.ts:438-447` |
| POST | /givingoption/create-giving-option | `can_manage_giving` | Creates a Paystack subaccount in the clamped branch. `route.ts:133-137`, `service.ts:147-204` |
| GET | /givingoption/get-giving-options | `can_view_giving` | [IMPLICIT-SCOPE: branch]. Returns the **full `account_number`** alongside the masked one (`service.ts:32-51,98-104`). `route.ts:171-175` |
| PUT | /givingoption/update-giving-option | `can_manage_giving` | No check on the existing record's branch (`service.ts:242`). Changes the settlement account, which moves where money lands. `route.ts:199-203` |
| PUT | /givingoption/restore-giving-option | `can_manage_giving` | No branch check (`service.ts:389-425`). `route.ts:224-228` |
| DELETE | /givingoption/delete-giving-option | `can_delete_giving` -> Giving:admin | Archives (soft delete), no branch check (`service.ts:352-382`). `route.ts:252-256` |
| POST | /givingoption/paystack-webhook | **public**, HMAC-SHA512 signature | Single Paystack receiver for giving and pledges. Raw body is kept only for this path (`index.ts:66-67`). Verified in `libs/paystack/paystackWebhook.ts:46-86`, then dispatched by reference prefix (`libs/paystack/paystackSettlement.ts:21-38`). `route.ts:279-282`, `contributionController.ts:189-232` |
| GET | /givingoption/available | auth-only | [IMPLICIT-SCOPE: own branch] Options in the donor's home branch plus org-wide ones (`contributionService.ts:200-206,503-540`). `route.ts:299-303` |
| GET | /givingoption/fee-preview | auth-only | Pure calculation. `route.ts:361-365` |
| POST | /givingoption/initialize | auth-only | [IMPLICIT-SCOPE: own] The donor is always the caller, and the option must be in the donor's branch or org-wide (`contributionService.ts:571-590,737-780`). `route.ts:367-371` |
| GET | /givingoption/my-contributions | auth-only | [IMPLICIT-SCOPE: own] `where {user_id}` (`contributionService.ts:932-951`). `route.ts:396-400` |
| DELETE | /givingoption/my-contributions | auth-only | [IMPLICIT-SCOPE: own] Non-success rows only (`contributionService.ts:629-660`). `route.ts:430-434` |
| POST | /givingoption/retry-payment | auth-only | [IMPLICIT-SCOPE: own] (`contributionService.ts:593-627,667-686`). `route.ts:472-476` |
| GET | /givingoption/contributions | `can_view_giving` | [UNSCOPED-LIST] Filters only by an explicit `branch_id` (`contributionValidation.ts:157-180`, `contributionService.ts:954-983`). It does **not** use `getBranchScopedWhere`, so with no branch requested a branch-limited admin sees every branch's donor names, emails and amounts. `route.ts:524-528` |
| POST | /givingoption/contributions/recheck | `can_manage_giving` | Re-verifies with Paystack and settles. No branch check on references (`contributionService.ts:990-1021`). `route.ts:552-556` |
| POST | /givingoption/contributions/nudge | `can_manage_giving` | Sends an in-app notification and email to the donor. No branch check (`contributionService.ts:1027-1060`). `route.ts:580-584` |
| GET | /givingoption/verify/:reference | auth-only | [IMPLICIT-SCOPE: own] Returns 404 unless `user_id===caller` (`contributionService.ts:873-890`). `route.ts:610-614` |
| GET | /givingoption/:id | `can_view_giving` | Full `account_number`. No branch check (`service.ts:233-236`). `route.ts:636-640` |

### Implicit scoping / visibility
- **Member side** is own-scoped by `user_id` (`contributionService.ts:653,683,888,937`). Option visibility follows the donor's **home** `branch_id`, not the active branch (`contributionService.ts:505-526`).
- **Admin side:**
  - The options list is branch-clamped (`service.ts:211-214`).
  - The contributions list is **not clamped** (`contributionService.ts:957-958`).
  - By-id option endpoints, recheck and nudge have no branch check.
- No module-level gating separates who may see donor PII from who may manage options. Both sit under one domain.

### Workflow / approval decisions
- Payment settlement is not a human approval:
  - Paystack webhook: signed HMAC (`paystackWebhook.ts:46-86`).
  - Member verify: own-scoped (`contributionService.ts:873-921`).
  - Admin recheck: Giving:manage (`route.ts:552`).
  - Cron reconciliation: `cron-jobs/givingPaymentReconciliationCron.ts`.
- All four paths go through the same conditional update `status:{not:"success"}` (`contributionService.ts:336-400,450-467`), and it checks `amount_paid` against `amount_charged` (`contributionService.ts:394-400`).

### Candidate action permissions
- `giving.manage_settlement_account`: create, update and restore of an option. These change bank or momo routing (`route.ts:133,199,224`).
- `giving.archive_option`: `route.ts:252`
- `giving.view_contributions` / `giving.view_donor_pii`: GET /givingoption/contributions (`route.ts:524`)
- `giving.export_contributions`: none today; the frontend probably exports from the list
- `giving.recheck_payment` / reconcile: `route.ts:552`
- `giving.nudge_donor` (send): `route.ts:580`
- `giving.view_full_account_number`: `service.ts:32-51`

### Gaps
- **MED:** GET /givingoption/contributions ignores the branch scope when `branch_id` is omitted (`contributionService.ts:957-958`).
- **MED:** update, restore and archive of an option by id have no branch check. A manager in branch A can re-point branch B's settlement account (`service.ts:238-344,352-425`).
- **MED:** the full settlement `account_number` goes to every Giving:view holder (`service.ts:32-51`). Pledges deliberately mask the same field (`pledges/pledges/service.ts:241-244`).
- **LOW:** recheck and nudge have no branch check (`contributionService.ts:990,1027`).
- **LOW:** `Giving` silently inherits from Financials and Access_rights (`authorization.ts:33-40`). An Access_rights admin can therefore move settlement accounts.

---

## Module: finance/ReceiptConfig (`/receiptconfig`)
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /receiptconfig/create-receipt-config | `can_manage_settings` -> Settings:manage | [BORROWED: Settings] Branch from `resolveBranchIdOrDefault` (`service.ts:44`). `route.ts:10-14` |
| GET | /receiptconfig/get-receipt-configs | `can_view_settings` | [BORROWED: Settings] [IMPLICIT-SCOPE: branch] (`service.ts:57-66`). `route.ts:15-19` |
| PUT | /receiptconfig/update-receipt-config | `can_manage_settings` | No by-id branch check (`service.ts:87,108`). `route.ts:20-24` |
| DELETE | /receiptconfig/delete-receipt-config | `can_delete_settings` -> Settings:admin | Hard delete, no branch check (`service.ts:131-139`). `route.ts:25-29` |

## Module: finance/PaymentConfig (`/paymentconfig`)
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /paymentconfig/create-payment-config | `can_manage_settings` | [BORROWED: Settings] (`service.ts:44`). `route.ts:10-14` |
| GET | /paymentconfig/get-payment-configs | `can_view_settings` | [BORROWED: Settings] [IMPLICIT-SCOPE: branch] (`service.ts:57-66`). `route.ts:15-19` |
| PUT | /paymentconfig/update-payment-config | `can_manage_settings` | No by-id branch check (`service.ts:87,108`). `route.ts:20-24` |
| DELETE | /paymentconfig/delete-payment-config | `can_delete_settings` | Hard delete (`service.ts:131-139`). `route.ts:25-29` |

## Module: finance/BankAccountConfig (`/bankaccountconfig`)
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /bankaccountconfig/create-bank-account-config | `can_manage_settings` | [BORROWED: Settings] (`service.ts:78`). `route.ts:10-14` |
| GET | /bankaccountconfig/get-bank-account-configs | `can_view_settings` | [BORROWED: Settings] [IMPLICIT-SCOPE: branch] (`service.ts:92-101`). `route.ts:15-19` |
| PUT | /bankaccountconfig/update-bank-account-config | `can_manage_settings` | No by-id branch check (`service.ts:126,151`). `route.ts:20-24` |
| DELETE | /bankaccountconfig/delete-bank-account-config | `can_delete_settings` | Hard delete (`service.ts:176-184`). `route.ts:25-29` |

## Module: finance/TitheBreakdownConfig (`/tithebreakdownconfig`)
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /tithebreakdownconfig/create-tithe-breakdown-config | `can_manage_settings` | [BORROWED: Settings] (`service.ts:81`). `route.ts:10-14` |
| GET | /tithebreakdownconfig/get-tithe-breakdown-configs | `can_view_settings` | [BORROWED: Settings] [IMPLICIT-SCOPE: branch] (`service.ts:95-104`). `route.ts:15-19` |
| PUT | /tithebreakdownconfig/update-tithe-breakdown-config | `can_manage_settings` | No by-id branch check (`service.ts:129,157`). `route.ts:20-24` |
| DELETE | /tithebreakdownconfig/delete-tithe-breakdown-config | `can_delete_settings` | Hard delete (`service.ts:182-190`). `route.ts:25-29` |

### Notes for the four config modules
- **Implicit scoping:** lists are branch-filtered and by-id writes are not.
- **Workflow:** none.
- **Candidate action:** `finance.configure_receipts_payments_banks` as a Financials sub-action, not Settings.
- **Gap (MED):**
  - All four finance configs are guarded by **Settings**, not Financials. A finance officer with Financials:manage cannot maintain the bank accounts or tithe breakdown that feed their own records.
  - Any Settings manager can rewrite the bank account and tithe split without holding Financials.
  - Name uniqueness is global, not per branch (`*Config/service.ts:32/61`). This is a correctness issue, not a security one.

---

## Module: pledges/pledges (`/pledges`)
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /pledges/get-pledges | `can_view_pledges` -> Pledges:view | [IMPLICIT-SCOPE: branch] (`pledges/service.ts:170-175`). Includes callers. `pledges/route.ts:16` |
| GET | /pledges/get-pledge | `can_view_pledges` | No branch check (`pledges/service.ts:217-221`). Returns pledgers with guest phones and redemptions; `account_number` masked (`:241-244`). `pledges/route.ts:17` |
| POST | /pledges/create-pledge | `can_manage_pledges` -> Pledges:manage | Creates a Paystack subaccount and sets `created_by_user_id` (`pledges/service.ts:88-118`). `pledges/route.ts:18` |
| PUT | /pledges/update-pledge | `can_manage_pledges` | No branch check on the existing record. Can change the settlement account, and replaces groups and callers (`pledges/service.ts:256-362`). `pledges/route.ts:19` |
| DELETE | /pledges/delete-pledge | `can_delete_pledges` -> Pledges:admin | Blocked when successful payments exist (`pledges/service.ts:366-401`). `pledges/route.ts:20` |
| POST | /pledges/remind-pledgers | `can_manage_pledges` | Bulk in-app, email and push to pledgers with a balance (`pledges/service.ts:409-474`). [WORKFLOW-ish: send] `pledges/route.ts:21` |

## Module: pledges/payments (`/pledges`)
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /pledges/my-pledges | auth-only | [IMPLICIT-SCOPE: own] `pledger.user_id = caller` (`payments/service.ts:510-514`). `payments/route.ts:43` |
| GET | /pledges/payment-fee-preview | auth-only | Calculation only. `payments/route.ts:71` |
| POST | /pledges/initialize-payment | auth-only | [IMPLICIT-SCOPE: own] Returns 404 unless the pledger belongs to the caller (`payments/service.ts:773-790`). `payments/route.ts:113` |
| GET | /pledges/my-pledge-payments | auth-only | [IMPLICIT-SCOPE: own] (`payments/service.ts:966-976`). `payments/route.ts:138` |
| DELETE | /pledges/my-pledge-payments | auth-only | [IMPLICIT-SCOPE: own] Non-success only (`payments/service.ts:662-700`). `payments/route.ts:168-172` |
| POST | /pledges/retry-payment | auth-only | [IMPLICIT-SCOPE: own] (`payments/service.ts:616-660,705-722`). `payments/route.ts:212` |
| GET | /pledges/pledge-payments | `can_view_pledges` | `where {pledge_id}` only, no branch check (`payments/service.ts:993-1013`). Exposes payer name and email. `payments/route.ts:242-246` |
| GET | /pledges/verify-payment/:reference | auth-only | [IMPLICIT-SCOPE: own] (`payments/service.ts:931-940`). `payments/route.ts:273-277` |
| POST | /pledges/credit-payment | `can_manage_pledges` | Books a settled online payment as a redemption (`payments/service.ts:467-488`, `payments/controller.ts:152-161`). [WORKFLOW] `payments/route.ts:299-303` |

## Module: pledges/redemptions (`/pledges`)
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /pledges/create-redemption | `can_manage_pledges` | Manual cash or bank redemption. The pledger id is not validated against branch or pledge (`redemptions/service.ts:5-17`). `redemptions/route.ts:14-18` |
| DELETE | /pledges/delete-redemption | `can_manage_pledges` (manage, **not admin**) | Hard-deletes any redemption, including ones auto-created from a credited Paystack payment (`redemptions/service.ts:19-21`; the link is `pledge_redemption.payment` at `schema.prisma:3072`). `redemptions/route.ts:19-23` |
| POST | /pledges/add-pledgers | `can_manage_pledges` | No branch check (`redemptions/service.ts:23-34`). `redemptions/route.ts:24-28` |
| DELETE | /pledges/delete-pledger | `can_manage_pledges` | Cascades the pledger's redemptions (`schema.prisma:3071`); payments are set to null (`:3100`). No branch check (`redemptions/service.ts:36-38`). `redemptions/route.ts:29-33` |

### Implicit scoping / visibility (pledges)
- The member side is own-scoped through `pledger.user_id` and `pledge_payment.user_id` (`payments/service.ts:514,721,789,939,976`).
- On the admin side, only the list is branch-clamped (`pledges/service.ts:172`). Detail, update, remind, pledge-payments, credit, redemption and pledger endpoints are not.
- **Should-be scope:** `pledge_caller` (`schema.prisma:3031-3042`) assigns members as callers who follow up pledgers. It is stored and returned, but callers get **no** access to the pledges they are assigned. They need Pledges:view, which shows them every pledge. This is a natural "assigned records" visibility scope that does not exist yet.

### Workflow / approval decisions (pledges)
- Online payment settlement uses the same signed Paystack webhook, dispatched by the `PLEDGE_REFERENCE_PREFIX` (`libs/paystack/paystackSettlement.ts:30-33`). The amount is checked against `amount_charged` (`payments/service.ts:322-323`).
- Crediting a payment to the ledger is a manual step for Pledges:manage. A successful payment with `redemption_id` null is listed as "uncredited" (`pledges/service.ts:176-189`, `payments/service.ts:467-488`).
- There is no pledge-approval step. Creating, editing, crediting and deleting are all plain level checks.

### Candidate action permissions (pledges)
- `pledges.record_redemption`: `redemptions/route.ts:14`
- `pledges.delete_redemption` (reversal): `redemptions/route.ts:19`
- `pledges.credit_online_payment` (reconcile): `payments/route.ts:299`
- `pledges.remind_pledgers` (send): `pledges/route.ts:21`
- `pledges.manage_pledgers`: add and delete pledger (`redemptions/route.ts:24,29`)
- `pledges.manage_settlement_account`: create and update pledge account (`pledges/service.ts:88,256-299`)
- `pledges.view_payments` / payer PII: `payments/route.ts:242`

### Gaps (pledges)
- **MED:** delete-redemption needs only manage and can erase a Paystack-backed ledger entry. Nothing checks whether the redemption has a `payment` (`redemptions/service.ts:19-21`).
- **MED:** none of the by-id pledge, redemption, pledger or payment endpoints check the branch (`pledges/service.ts:217,256,366,409`, `payments/service.ts:993`, `redemptions/service.ts:5-38`).
- **MED:** create-redemption and add-pledgers accept raw bodies without validating amount or method beyond `validateRedemptionPayload`. The `pledger_id` and `group_id` are not checked to belong to a pledge the caller may manage (`redemptions/controller.ts:7-35`).
- **LOW:** pledge callers have no scoped access (`schema.prisma:3031`).

---

## Module: integrationUtils (no routes)
- `src/modules/integrationUtils/userIntegration.ts` (ZKTeco biometric devices, IPs from `ZK_DEVICES` at `:25`) and `ztecoServiceClient.ts` (`ZTECO_SERVICE` URL and `ZTECO_SERVICE_TOKEN` header at `:5-30`) are libraries, not routers. They are imported by `src/modules/user/userService.ts` and `src/modules/events/biometricAttendanceService.ts` and are not mounted in `routes/appRouter.ts`. They have no authorization surface of their own; the calling routes' guards apply (users and events slices). There is `console.log` at `userIntegration.ts:132`.

## Payment webhooks (all mount points)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /givingoption/paystack-webhook | HMAC-SHA512 of the raw body against the Paystack secret, timing-safe comparison, 1 MB cap | The **only** Paystack receiver. It handles giving and pledges by reference prefix (`libs/paystack/paystackWebhook.ts:18-20,46-86`, `paystackSettlement.ts:21-38`, `index.ts:66-67`). It returns 500 when the secret is missing, so Paystack retries (`contributionController.ts:199-209`). It is sound. |
| POST | /orders/hubtel-payment-webhook | **public, unsigned** | Does not trust the payload. It re-queries Hubtel by `ClientReference` (`orders/orderController.ts:125-146`, `orders/orderRoutes.ts:244`). **LOW:** it is an unauthenticated trigger for outbound Hubtel calls and echoes the `result` back to the caller (`orderController.ts:142`), which may leak order payment status to anyone who guesses a reference. This belongs to the orders slice. |
| POST | /orders/reconcile-hubtel-pending-payments | `can_manage_marketplace` | Manual reconcile (`orders/orderRoutes.ts:669-673`). It belongs to the orders slice. |
| cron | hubtel / giving reconciliation | n/a | `index.ts:27`, `src/cron-jobs/hubtelPaymentReconciliationCron.ts`, `src/cron-jobs/givingPaymentReconciliationCron.ts` |

## Domain and alias drift in this slice
- There are **two alias tables**:
  - `authorization.ts:16-74` maps `Financials -> [Financials, Access_rights, "Access rights"]`.
  - `utils/permissionResolver.ts:1-9` maps `Financials -> [Financials, Finance, Finances]`.
  - The financials custom guard and approver eligibility use the second one (`Financials/route.ts:5,23`, `Financials/service.ts:261`). A user whose Financials right comes only from Access_rights passes `can_view_financials` but fails `canManageFinancialsOrActAsApprover` and approver eligibility. The reverse holds for a stored `"Finance"` key.
- Domains checked in this slice: Financials, Giving (falls back to Financials and Access_rights), Pledges, and Settings (borrowed for the four finance configs). No `Finance_config`, `Reconciliation` or `Donor` domains exist.

---

<!-- slice F3 -->

## Module: marketplace (/market)

Mount: `src/routes/appRouter.ts` `appRouter.use("/market", marketRouter)`. Route file `src/modules/marketplace/marketRouter.ts`. Guards are `checkPermission("Marketplace", …)` (`authorization.ts:2450-2466`); Marketplace aliases to `["Marketplace","Program"]` (`authorization.ts:46`). So anyone with **Program** manage can manage markets unless the Marketplace key is set explicitly.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /market/create-market | protect + can_manage_marketplace -> Marketplace:manage | marketRouter.ts:10. The branch comes from `resolveBranchIdOrDefault` (marketService.ts:31), which is clamped to the caller's branches. No `created_by_id` is written (marketController.ts:9-17) |
| POST | /market/duplicate-market | protect + Marketplace:manage | marketRouter.ts:15. The source market is fetched by id with no branch check (marketService.ts:55), so a market can be cloned from another branch |
| PUT | /market/update-market | protect + Marketplace:manage | marketRouter.ts:20. By-id update with no `assertBranchAccessible` (marketService.ts:220-245). [BRANCH-BYPASS] |
| DELETE | /market/delete-market | protect + can_delete_marketplace -> Marketplace:admin | marketRouter.ts:25. No branch check. The actor is never passed (marketController.ts:89, `deleteMarket(Number(id))`), so `updated_at_id` stays undefined and there is no audit trail |
| PUT | /market/restore-market | protect + Marketplace:manage | marketRouter.ts:30. No branch check and no actor (marketController.ts:103) |
| GET | /market/list-markets | **none (public)** | marketRouter.ts:38. [NO-GUARD-EXPOSES-DATA] Branch filter via `getBranchScopedWhere` (marketService.ts:179); unauthenticated callers have no scope, so the list is unfiltered. `filters.deleted` comes from the request body (marketService.ts:171), so the public can list soft-deleted markets |
| GET | /market/list-markets-by-event | protect (auth-only) | marketRouter.ts:39. Reads `event_id` from the **body** of a GET (marketController.ts:131). [UNSCOPED-LIST]: no branch filter (marketService.ts:310-318) |
| GET | /market/get-market-count | protect (auth-only) | marketRouter.ts:44. [UNSCOPED-LIST]: count ignores branch (marketService.ts:350-362); body `filters.deleted` can count deleted markets |
| GET | /market/list-active-markets | protect (auth-only) | marketRouter.ts:45. [UNSCOPED-LIST]: active markets across every branch (marketService.ts:326-345) |
| GET | /market/get-market-by-id | protect (auth-only) | marketRouter.ts:46. No branch check (marketService.ts:204-214) |

### Implicit scoping / visibility
- Only `getAllMarkets` applies a branch filter (marketService.ts:179). It uses `resolveListBranchFilter` (branchService.ts:63-79), which clamps admins to `allowedBranchIds`. Members, and unauthenticated callers on the public route, get no filter.
- By-id reads and writes (get, update, delete, restore, duplicate) never call `assertBranchAccessible` (branchService.ts:151). marketService.ts imports only `getBranchScopedWhere` and `resolveBranchIdOrDefault` (marketService.ts:6-7).
- Markets are never filtered by visibility or publish state. Members see every non-deleted market in every branch.

### Workflow / approval decisions
- None. Market lifecycle (create, duplicate, restore) is a plain Marketplace:manage check. Delete needs Marketplace:admin.

### Candidate action permissions
- `marketplace.duplicate_market`: POST /market/duplicate-market (marketRouter.ts:15)
- `marketplace.restore_market`: PUT /market/restore-market (marketRouter.ts:30)

### Gaps
- **MED**: Cross-branch by-id mutation. An admin scoped to branch A can update, delete or restore branch B's markets by id (marketService.ts:220, 259, 284).
- **MED**: Public `list-markets` honours `filters.deleted` from the body, which exposes soft-deleted markets (marketService.ts:171, marketRouter.ts:38).
- **LOW**: Marketplace inherits from Program via the alias (authorization.ts:46).
- **LOW**: `list-active-markets`, `get-market-count` and `list-markets-by-event` ignore branch (marketService.ts:310, 326, 350).
- **LOW**: Delete and restore record no actor (marketController.ts:89, 103).

---

## Module: products (/product)

Mount: `appRouter.use("/product", productRouter)`. Route file `src/modules/products/productRouter.ts`. Products have no `branch_id`; they hang off `market_id` (schema.prisma `model products`, ~line 2154).

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /product/create-size | protect + Marketplace:manage | productRouter.ts:360 |
| PUT | /product/update-size | protect + Marketplace:manage | productRouter.ts:365 |
| GET | /product/list-sizes | protect (auth-only) | productRouter.ts:370. Reference data |
| POST | /product/create-product | protect + Marketplace:manage | productRouter.ts:372. No check that the target market is in the caller's branch (productService.ts:68) |
| PUT | /product/update-product | protect + Marketplace:manage | productRouter.ts:548. No branch check (productService.ts:85) |
| PUT | /product/update-product-colour-stock | protect + Marketplace:manage | productRouter.ts:779. Dead endpoint: always throws "Method not implemented" (productController.ts:34-37) |
| DELETE | /product/delete-product | protect + can_delete_marketplace -> Marketplace:admin | productRouter.ts:999 |
| PUT | /product/restore-product | protect + Marketplace:manage | productRouter.ts:1004 |
| GET | /product/list-products | **none (public)** | productRouter.ts:1010. [NO-GUARD-EXPOSES-DATA] Takes `filters` from the body (productController.ts:105). `deleted: filters?.deleted` (productService.ts:395) lets the public list soft-deleted products. Drafts are excluded (productService.ts:396-399) |
| GET | /product/list-products-by-market | **none (public)** | productRouter.ts:1011. [NO-GUARD-EXPOSES-DATA] **Draft products are included**: no status filter (productService.ts:449-452). Markets that are deleted or expired are not excluded |
| GET | /product/get-product-by-id | **none (public)** | productRouter.ts:1015. [NO-GUARD-EXPOSES-DATA] Returns draft products and stock counts (productService.ts:348-371) |
| POST | /product/create-product-type | protect + Marketplace:manage | productRouter.ts:1017 |
| PUT | /product/update-product-type | protect + Marketplace:manage | productRouter.ts:1022 |
| DELETE | /product/delete-product-type | protect + Marketplace:admin | productRouter.ts:1027 |
| PUT | /product/restore-product-type | protect + Marketplace:manage | productRouter.ts:1032 |
| GET | /product/list-product-type | protect (auth-only) | productRouter.ts:1037 |
| POST | /product/create-product-category | protect + Marketplace:manage | productRouter.ts:1039 |
| PUT | /product/update-product-category | protect + Marketplace:manage | productRouter.ts:1044 |
| DELETE | /product/delete-product-category | protect + Marketplace:admin | productRouter.ts:1049 |
| PUT | /product/restore-product-category | protect + Marketplace:manage | productRouter.ts:1054 |
| GET | /product/list-product-category | **none (public)** | productRouter.ts:1059. Reference data |

### Implicit scoping / visibility
- There is no branch scoping anywhere in productService. `listProducts` filters only on market not deleted or expired (productService.ts:402-405), so a storefront sees every branch's products.
- Draft visibility is inconsistent. `listProducts` hides drafts (productService.ts:396), but `listProductsByMarketId` (productService.ts:449) and `getProductById` (productService.ts:348) do not, and both are public.

### Workflow / approval decisions
- Product `status` (draft or published) is set freely by anyone with Marketplace:manage on create or update (productService.ts:48, 119). There is no separate publish step.

### Candidate action permissions
- `marketplace.publish_product`: the status change inside update-product (productRouter.ts:548, productService.ts:119)
- `marketplace.adjust_stock`: stock edits through update-product (update-product-colour-stock is dead, productRouter.ts:779)
- `marketplace.manage_catalog_taxonomy`: product types, categories and sizes (productRouter.ts:360-370, 1017-1059)

### Gaps
- **MED**: Public endpoints leak draft products (`list-products-by-market`, `get-product-by-id`) and, through body filters, soft-deleted products (productService.ts:395, 348, 449).
- **LOW**: There is no branch boundary on product writes, so an admin in branch A can edit products in branch B's markets.
- **LOW**: A dead route stays exposed (productController.ts:34-37).

---

## Module: orders (/orders)

Mount: `appRouter.use("/orders", orderRouter)`. Route file `src/modules/orders/orderRoutes.ts`. Orders have `user_id` but **no branch_id** (schema `model orders`, ~line 2222); the branch is reachable only through `items.market.branch_id`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /orders/create-order | can_create_order_scoped (authorization.ts:1800). No `protect` | orderRoutes.ts:89. **Guest checkout:** with no token the request passes as a guest and `user_id` is forced to null (authorization.ts:1809-1817). With a token, a member can only order for themselves; Marketplace:manage can order for anyone (authorization.ts:1822-1838). [IMPLICIT-SCOPE: own] Public mutation by design. For Paystack, `return_url` from the client becomes `callback_url` unvalidated (orderService.ts:1973); only Hubtel URLs are validated (orderService.ts:202-204). This is an open-redirect risk |
| GET | /orders/get-all-orders | protect + can_view_marketplace -> Marketplace:view | orderRoutes.ts:105. [UNSCOPED-LIST] `findAll()` has no branch filter (orderService.ts:594-616). A branch-limited admin sees every branch's orders, including billing PII (`billing_details`) |
| GET | /orders/get-order-by-id | protect + can_view_orders_scoped | orderRoutes.ts:130. Marketplace:view sees all; otherwise owner-only via `query.id` (authorization.ts:1863-1872). [IMPLICIT-SCOPE: own] No branch check for admins |
| GET | /orders/get-orders-by-user | protect + can_view_orders_scoped | orderRoutes.ts:155. A non-admin is forced to their own `user_id` (authorization.ts:1890-1900). An admin can pass any user_id. [IMPLICIT-SCOPE: own] |
| GET | /orders/get-orders-by-market | protect + Marketplace:view | orderRoutes.ts:180. Also mutates: it runs `reconcilePendingHubtelPaymentsByMarket` first (orderService.ts:987-990), so a GET under a **view** guard can change payment state. No branch check on `market_id` |
| GET | /orders/verify-payment | protect + can_view_orders_scoped | orderRoutes.ts:228. [WORKFLOW] Mutates under a view guard: `verifyPaymentStatus` writes payment_status success/failed and restocks (orderService.ts:1060-1090). A Marketplace:view admin can trigger this on any order. Owner check uses `query.order_number` (authorization.ts:1875-1887) |
| POST | /orders/hubtel-payment-webhook | **none (public)** | orderRoutes.ts:244. Does not trust the payload: it re-queries Hubtel by ClientReference (orderController.ts:125-141). Acceptable |
| GET | /orders/confirm-transaction-status | protect + can_confirm_transaction_scoped | orderRoutes.ts:389. Owner or Marketplace:manage, matched by `query.reference` (authorization.ts:1964-2003). Writes order status (orderService.ts:1981) |
| GET | /orders/confirm-transaction-status-by-id | protect + Marketplace:manage | orderRoutes.ts:537 |
| POST | /orders/retry-payment | protect + can_retry_order_payment_scoped | orderRoutes.ts:658. Owner or Marketplace:manage (authorization.ts:1911-1962). [IMPLICIT-SCOPE: own] |
| POST | /orders/reinitiate-payment | protect + Marketplace:manage | orderRoutes.ts:664 |
| POST | /orders/reconcile-hubtel-pending-payments | protect + Marketplace:manage | orderRoutes.ts:669. [WORKFLOW] Reconciliation across every branch (orderService.ts:2034) |
| PUT | /orders/cancel-order | protect + can_cancel_order_scoped | orderRoutes.ts:698. Owner or Marketplace:manage (authorization.ts:2005-2040). Only orders still awaiting payment can be cancelled (orderService.ts:1761-1776) |
| PUT | /orders/update-delivery-status | protect + Marketplace:manage | orderRoutes.ts:704. [WORKFLOW] fulfilment: pending, shipped, delivered or cancelled (orderService.ts:1311) |
| PUT | /orders/update-order | protect + Marketplace:manage | orderRoutes.ts:710. [WORKFLOW] Can set `payment_status` to "success", which is a **manual mark-paid** (orderController.ts:316-321, orderService.ts:632+). It can also edit items and billing |
| DELETE | /orders/delete-order | protect + Marketplace:admin | orderRoutes.ts:716. The actor is accepted but discarded (`void actorUserId`, orderService.ts:1838) |
| DELETE | /orders/bulk-delete-orders | protect + Marketplace:admin | orderRoutes.ts:722 |
| POST | /orders/create-for-member | protect + Marketplace:manage | orderRoutes.ts:728. Manual order for a member (orderService.ts:397), reference `MANUAL-` |
| GET | /orders/delivery-config | **none (public)** | orderRoutes.ts:757. Config only; fine |
| PUT | /orders/bulk-update-status | protect + Marketplace:manage | orderRoutes.ts:816. [WORKFLOW] Bulk mark-paid and bulk fulfilment (orderService.ts:1449) |
| GET | /orders/marketplace-overview | protect + Marketplace:view | orderRoutes.ts:848. `branch_id` comes from the query (orderController.ts:539). With no branch given, the overview is **all branches**, not the caller's `allowedBranchIds` (orderService.ts:1534-1550) |

### Implicit scoping / visibility
- Own-only paths for members: `can_view_orders_scoped` (authorization.ts:1847-1909), `can_retry_order_payment_scoped` (:1911), `can_confirm_transaction_scoped` (:1964) and `can_cancel_order_scoped` (:2005). Each compares `orders.user_id` to the requester.
- Guest orders (`user_id` null) cannot be reached through the scoped guards by a member. That is correct.
- No admin-side branch scoping exists anywhere in orderService. `findAll` (orderService.ts:594), `findOneByMarketplaceId` (:987) and `getMarketplaceOverview` with no branch (:1534) all return every branch. Should filter by `items.market.branch_id` within `allowedBranchIds`.

### Workflow / approval decisions
- Payment confirmation: the source of truth is the gateway (Hubtel re-query at orderController.ts:136, Paystack `verifyTransaction` at orderService.ts:1077). Manual override goes through update-order or bulk-update-status with Marketplace:manage, with no extra right and no audit of who marked an order paid.
- Fulfilment (shipped or delivered): Marketplace:manage (orderRoutes.ts:704, 816). Not position-based.
- Cancellation: the owner or Marketplace:manage, only while payment is pending (orderService.ts:1752-1776).
- Refund: **no refund action exists.** Paid orders cannot be cancelled (orderService.ts:1776), and update-order blocks moving a failed order back (orderService.ts:661-667).
- Delete: Marketplace:admin.

### Candidate action permissions
- `marketplace.mark_order_paid`: update-order `payment_status` (orderRoutes.ts:710, orderController.ts:316) and bulk-update-status (orderRoutes.ts:816)
- `marketplace.fulfil_order` (ship or deliver): update-delivery-status (orderRoutes.ts:704)
- `marketplace.cancel_any_order`: cancel-order on behalf of others (orderRoutes.ts:698, authorization.ts:2018)
- `marketplace.create_order_for_member`: create-for-member (orderRoutes.ts:728)
- `marketplace.reconcile_payments`: reconcile-hubtel-pending-payments (orderRoutes.ts:669), reinitiate-payment (:664), confirm-transaction-status-by-id (:537)
- `marketplace.edit_order_items`: update-order items and billing (orderRoutes.ts:710)
- `marketplace.delete_order` / `bulk_delete`: (orderRoutes.ts:716, 722)
- `marketplace.view_overview` (revenue analytics): (orderRoutes.ts:848)
- `marketplace.refund`: does not exist yet. Needed if refunds are added

### Gaps
- **HIGH**: Orders, including billing PII (name, email, phone), are not branch-scoped for admins (orderService.ts:594, 987, 1534). Any Marketplace:view admin in any branch sees every order.
- **MED**: Mark-paid is a field on a generic manage endpoint with no dedicated right and no audit (orderController.ts:316; `void actorUserId` at orderService.ts:1838).
- **MED**: GET endpoints under view guards mutate payment and stock state (get-orders-by-market at orderService.ts:987; verify-payment at orderService.ts:1060).
- **MED**: The Paystack `callback_url` is taken unvalidated from the client (orderService.ts:1973), unlike giving and pledges, which resolve it server-side.
- **LOW**: Marketplace inherits from Program (authorization.ts:46).

---

## Module: rides (/rides)

Mount: `appRouter.use("/rides", rideRouter)`. Route file `src/modules/rides/rideRoute.ts`. **Every route is `protect` only.** All authorization lives in rideService:
- `assertMember`: active, non-guest user (rideService.ts:56-65).
- Owner checks on offers and requests (rideService.ts:732, 848, 883, 898, 938, 1047).
- `assertSafetyTeam` for `/admin/*` (rideService.ts:1102-1110). It requires **`Membership_Management` manage** (`RIDE_SAFETY_DOMAIN`, rideService.ts:40), resolved by `userHasMinimumDomainAccess` in `src/utils/permissionResolver.ts`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /rides/catalog | protect; service `assertMember` | rideRoute.ts:34; rideService.ts:474-475 |
| GET | /rides/mine | protect; assertMember | rideRoute.ts:35; rideService.ts:429. [IMPLICIT-SCOPE: own] |
| GET | /rides/search | protect; assertMember | rideRoute.ts:36; rideService.ts:566. Hides blocked peers (rideService.ts:691, blockedPeerIds :68) |
| POST | /rides/offers | protect; assertMember | rideRoute.ts:37; rideService.ts:630. Self-service publish |
| POST | /rides/offers/:id/cancel | protect; owner (driver) | rideRoute.ts:38; rideService.ts:732-736. [IMPLICIT-SCOPE: own] |
| POST | /rides/requests | protect; assertMember | rideRoute.ts:39; rideService.ts:775 |
| POST | /rides/requests/:id/accept | protect; driver of the offer | rideRoute.ts:40; rideService.ts:896-898. [WORKFLOW] Driver approves the passenger |
| POST | /rides/requests/:id/decline | protect; driver of the offer | rideRoute.ts:41; rideService.ts:936-938. [WORKFLOW] |
| POST | /rides/requests/:id/cancel | protect; passenger | rideRoute.ts:42; rideService.ts:846-848 |
| POST | /rides/requests/:id/dismiss | protect; passenger | rideRoute.ts:43; rideService.ts:881-883 |
| POST | /rides/alerts | protect; assertMember | rideRoute.ts:44; rideService.ts:971 |
| POST | /rides/reports | protect; assertMember plus being part of the ride | rideRoute.ts:45; rideService.ts:1008-1047. Can auto-block the reported user |
| GET | /rides/admin/overview | protect; assertSafetyTeam -> **[BORROWED: Membership_Management:manage]** | rideRoute.ts:49; rideService.ts:1262-1263. Returns every driver's and passenger's **name and phone** (rideService.ts:1313, 1319) for the date, all branches |
| POST | /rides/admin/offers/:id/cancel | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:50; rideService.ts:1335. [WORKFLOW] Office cancels a ride |
| GET | /rides/admin/blocks | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:51; rideService.ts:1387 |
| DELETE | /rides/admin/blocks/:id | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:52; rideService.ts:1402. Lifts a safety block |
| GET | /rides/admin/reports | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:53; rideService.ts:1112. Reporter and reported-user phones (rideService.ts:1127-1137) |
| PATCH | /rides/admin/reports/:id/resolve | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:54; rideService.ts:1145 |
| GET | /rides/admin/catalog | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:55; rideService.ts:1163 |
| POST | /rides/admin/pickup-points | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:56; rideService.ts:1187 |
| PUT | /rides/admin/pickup-points/:id | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:57 |
| POST | /rides/admin/areas | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:58; rideService.ts:1205 |
| PUT | /rides/admin/areas/:id | protect; assertSafetyTeam [BORROWED] | rideRoute.ts:59 |

### Implicit scoping / visibility
- The driver's phone is shown to a passenger only once their request is accepted (rideService.ts:416). Passenger phones are shown to the driver (rideService.ts:366).
- Block lists hide both sides from each other (rideService.ts:66-74, 460, 691).
- **No branch dimension.** `ride_offer`, `ride_pickup_point`, `ride_area` and `ride_report` have no `branch_id` (schema.prisma ~3355-3530). The admin overview, reports, catalog and pickup points are global (rideService.ts:1262-1275).
- Safety-team notification recipients (`safetyTeamIds`, rideService.ts:999-1006) are selected the same legacy way: every active user whose `user.access` has Membership_Management manage, across all branches.

### Workflow / approval decisions
- Accepting or declining a seat is hardcoded to the **offer's driver** (rideService.ts:898, 938). This is ownership-based, not permission-based.
- Admin cancellation, report resolution, unblocking and pickup-point management use `assertSafetyTeam` (rideService.ts:1102-1110). It reads **`user.access.permissions`, the legacy single `access_level_id`** (schema `user.access`, schema.prisma:108), **not** the per-branch `user_branch_access` grants used by `checkPermission` (authorization.ts:578-590). It also does not require `is_user`/`isPrivilegedUser` and ignores the active branch. Note the schema comment at schema.prisma:213: `user.access_level_id` "mirrors one grant" only.
- It also uses a **second alias table**, `src/utils/permissionResolver.ts` (Membership_Management -> ["Membership_Management","Membership Management","Members"]). That table can drift from authorization.ts:16-74.

### Candidate action permissions
- `rides.view_overview` (phones of every rider): GET /rides/admin/overview (rideRoute.ts:49)
- `rides.cancel_any_offer`: POST /rides/admin/offers/:id/cancel (rideRoute.ts:50)
- `rides.resolve_report`: PATCH /rides/admin/reports/:id/resolve (rideRoute.ts:54)
- `rides.view_reports`: GET /rides/admin/reports (rideRoute.ts:53)
- `rides.lift_block`: DELETE /rides/admin/blocks/:id (rideRoute.ts:52)
- `rides.manage_pickup_points_areas`: rideRoute.ts:56-59
- A new **Rides** domain would replace the borrowed Membership_Management

### Gaps
- **HIGH**: Ride admin authorization bypasses the branch-grant model. It reads legacy `user.access` (rideService.ts:1103-1107), not `user_branch_access`. A user whose branch grants were revoked but whose `access_level_id` mirror still holds Membership_Management manage keeps safety-team powers. The reverse also happens: a grant-only admin whose mirror is a different level is refused. There is no `isPrivilegedUser`/`is_user` check either.
- **MED**: The domain is borrowed from Membership_Management (rideService.ts:40), so anyone who can manage membership sees every rider's phone number (rideService.ts:1313-1319) and can lift safety blocks.
- **MED**: There is no route-level guard. Every `/rides/admin/*` route is `[protect]` only (rideRoute.ts:49-59), so the check depends on each service function remembering `assertSafetyTeam`. It currently does, on all 10 (rideService.ts:1113, 1146, 1164, 1188, 1206, 1263, 1336, 1388, 1403).
- **LOW**: No branch scoping of rides or of the admin overview.
- **LOW**: There is a duplicate alias table in permissionResolver.ts. Its `Financials` aliases, `["Financials","Finance","Finances"]`, differ from authorization.ts:30, `["Financials","Access_rights","Access rights"]`.

---

## Module: liveStream (/live-stream)

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /live-stream/status | protect (auth-only) | liveStreamRoute.ts:10; liveStreamController.ts:4. Read-only status; no org data |

### Implicit scoping / visibility
- None. The same status is returned to everyone.

### Workflow / approval decisions
- None. There is no write route; status changes are not managed through this module.

### Candidate action permissions
- None today. If going live or ending a stream is ever exposed: `livestream.go_live`.

### Gaps
- None. No domain is needed for a public read.

---

## Module: devices (/device), biometric attendance devices

Model `devices` {device_name, ip_address, port, location}. It has **no branch_id** (schema.prisma:2093-2099).

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /device/create-devices | protect + can_manage_settings -> **[BORROWED: Settings:manage]** | devicesRoute.ts:13 |
| GET | /device/get-devices | protect + can_view_settings -> [BORROWED: Settings:view] | devicesRoute.ts:18. [UNSCOPED-LIST] `prisma.devices.findMany()` (devicesService.ts:35); exposes internal IPs and ports |
| GET | /device/get-device | protect + Settings:view | devicesRoute.ts:23 |
| PUT | /device/update-device | protect + Settings:manage | devicesRoute.ts:28. The handler is misnamed `updateLifeCenter` (devicesRoute.ts:31) |
| DELETE | /device/delete-device | protect + can_delete_settings -> Settings:admin | devicesRoute.ts:33 |

### Implicit scoping / visibility
- None. All devices are visible to every Settings viewer (devicesService.ts:34-42). There is no branch field to scope by.

### Workflow / approval decisions
- None. Device registration and updates are plain Settings checks.

### Candidate action permissions
- `attendance.manage_devices` (belongs with Church_Attendance, not Settings): devicesRoute.ts:13-36

### Gaps
- **LOW**: The domain is borrowed from Settings. Settings in turn falls back to Access_rights (authorization.ts:43).
- **LOW**: Devices have no branch, so a branch-limited admin manages every branch's biometric devices.

---

## Module: notifications (/notifications)

All routes act only on the caller's own data. `getAuthenticatedUserId(req)` is used everywhere (notificationController.ts:110-370), and every service query is constrained by `recipient_user_id: userId` (notificationService.ts:1252-1254, 1313-1315, 1443-1451). No route sends a notification; they are generated internally by other modules and crons.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /notifications/stream-token | protect | notificationRoute.ts:41. Issues a JWT `{id, purpose:"notifications_stream"}` signed with the **same JWT_SECRET**, TTL 60-180s (notificationStreamAuth.ts:4-7, 92-115) |
| GET | /notifications/push/public-key | protect | notificationRoute.ts:47 |
| POST | /notifications/push/subscribe | protect + rate limit | notificationRoute.ts:53. [IMPLICIT-SCOPE: own] |
| POST | /notifications/push/unsubscribe | protect + rate limit | notificationRoute.ts:59. [IMPLICIT-SCOPE: own] |
| POST | /notifications/device/register | protect + rate limit | notificationRoute.ts:65. Upsert keyed on `token` reassigns the token to the caller (notificationDeviceService.ts:120-130). This is the expected device hand-off |
| POST | /notifications/device/unregister | protect + rate limit | notificationRoute.ts:71. Scoped to `user_id` (notificationDeviceService.ts:161-163) |
| GET | /notifications/ | protect | notificationRoute.ts:77. [IMPLICIT-SCOPE: own] |
| DELETE | /notifications/ | protect | notificationRoute.ts:83. Clears own notifications |
| POST | /notifications/delete | protect | notificationRoute.ts:92. Own ids only (notificationService.ts:1438-1451) |
| GET | /notifications/preferences | protect | notificationRoute.ts:98. Own preferences |
| GET | /notifications/preferences/:type | protect | notificationRoute.ts:104 |
| PATCH | /notifications/preferences/:type | protect | notificationRoute.ts:110 |
| GET | /notifications/unread-count | protect | notificationRoute.ts:116 |
| PATCH | /notifications/:id/read | protect | notificationRoute.ts:122. Own only (notificationService.ts:1252) |
| PATCH | /notifications/:id/unread | protect | notificationRoute.ts:128. Own only |
| PATCH | /notifications/read-all | protect | notificationRoute.ts:134. **Route-order bug:** `/:id/read` and `/:id/unread` are registered first, but `/read-all` is a different shape (no second segment), so it still matches. OK |
| GET | /notifications/stream | streamAuth: Bearer -> protect, else `?stream_token` | notificationRoute.ts:14-39, 140. The stream-token path skips the `is_active` check that protect does (authorization.ts:957-963) |

### Implicit scoping / visibility
- Everything is scoped to the recipient. Who *receives* a notification is decided by the producer modules, often through `listUserIdsWithDomainPermission` (authorization.ts:791-818), which uses branch grants. Rides instead use legacy `user.access` (rideService.ts:999-1006).

### Workflow / approval decisions
- Users cannot send notifications through this module. Admin bulk sends live in `/messaging` (not this slice).

### Candidate action permissions
- None; everything here is self-service.

### Gaps
- **MED**: `protect` does not reject purpose-scoped tokens. The stream token `{id, purpose}` is signed with JWT_SECRET (notificationStreamAuth.ts:100-108), and `protect` only verifies the signature and `id` (authorization.ts:937-978). A stream token that leaks from a URL or access log is therefore a full API bearer token for its 60-180s life. The realtime handshake rejects purpose tokens (realtimeAuth.ts:72); HTTP should do the same.
- **LOW**: The stream-token path does not re-check that the account is active (notificationRoute.ts:27-38), but the TTL is short.

---

## Module: realtime (socket.io, no HTTP routes)

### Routes
None over HTTP. The socket handshake is in `realtimeServer.ts`; events are `subscribe` and `unsubscribe` (realtimeServer.ts:103, 122).

### Implicit scoping / visibility
- **Handshake:** the JWT arrives in `handshake.auth.token` (realtimeAuth.ts:47-53), verified HS256 (:62). **Purpose tokens are rejected** (:72). The user must exist and be active (:77-78). The socket is dropped when the token expires (:103-114).
- **Auto rooms** (`roomsFor`, realtimeRooms.ts:23-31): `user:<id>`, `branch:<home branch_id>`, `dept:<id>` for each department membership (`departmentIdsOf`, realtimeServer.ts:69-70), and `all`. Guests get only `user:` and `all`. The branch room is the **home branch** (`user.branch_id`, realtimeServer.ts:64-67), not the admin's granted branches.
- **Topic rooms:** clients can subscribe only to registered prefixes, each with an authorizer. Reserved prefixes are blocked (realtimeTopics.ts:13, 43). Rate and count are capped (realtimeTopics.ts:10-11). The only registered topic is `ride-event:<eventId>`: active non-guest member and an upcoming event (rideTopics.ts:16-24, 37-39).
- Rooms are refreshed on permission or department changes through `sessionChanged` and `sessionRevoked` (realtimeSession.ts:14-19), which also invalidates the auth cache.

### Workflow / approval decisions
- None. Topic access is decided per prefix by an authorizer function, not by permission domains.

### Candidate action permissions
- None.

### Gaps
- **LOW**: The branch room uses the home branch only. An admin granted extra branches gets no branch-feed events for them. This is a visibility consistency issue, not a leak.
- No security gaps found. This is the reference pattern: rejecting purpose tokens and checking the account is active are what HTTP `protect` lacks.

---

<!-- slice F4 -->

## Module: events (/event)

All paths are relative to `src/modules/events/`. EC = `eventContoller.ts`, ER = `eventRoute.ts`. Guard helpers are in `src/middleWare/authorization.ts` (AZ).

### Routes
| Method | Path | Guard | Notes (file:line) |
|---|---|---|---|
| GET | /event/get-event | auth-only | ER:12. Branch-filtered via `getBranchScopedWhere` EC:2224. Members are not clamped to a branch (AZ:353-355). |
| GET | /event/list-events | auth-only | ER:18. [IMPLICIT-SCOPE: branch] EC:1899 |
| GET | /event/list-events-light | auth-only | ER:19. [IMPLICIT-SCOPE: branch] EC:2034 |
| GET | /event/events-stats | auth-only | ER:24. Returns `event_attendance {id,user_id}` per event to any logged-in user EC:2155-2172. [NO-GUARD-EXPOSES-DATA] (attendee ids) |
| GET | /event/list-event-years | auth-only | ER:25. EC:2078 |
| GET | /event/upcoming-events | auth-only | ER:31. EC:2112 |
| GET | /event/public-event | public | ER:37. EC:3007 (public event registration page) |
| POST | /event/public-validate-member | public | ER:42. EC:3038. No rate limiter on the route. |
| POST | /event/public-register | public | ER:47. EC:3163. No rate limiter on the route. |
| POST | /event/create-event | can_manage_events → Events:manage | ER:52. Branch resolved with `resolveBranchIdOrDefault` EC:1059 |
| PUT | /event/update-event | can_manage_events → Events:manage | ER:58. Loads the event by id with no branch filter (EC:1201); only a new `branch_id` is checked (EC:1298-1299) |
| PUT | /event/online-links | can_manage_events → Events:manage | ER:67. EC:1382 |
| DELETE | /event/delete-event | can_delete_events → Events:admin | ER:73. `prisma.event_mgt.delete({where:{id}})` with no branch check, EC:1459-1463 |
| DELETE | /event/delete-series | can_delete_events → Events:admin | ER:82. EC:1550 |
| DELETE | /event/delete-series-from | can_delete_events → Events:admin | ER:87. EC:1607 |
| PUT | /event/update-series | can_manage_events → Events:manage | ER:96. EC:1678 |
| PUT | /event/update-series-from | can_manage_events → Events:manage | ER:101. EC:1746 |
| POST | /event/sign-attendance | **public (no protect)** | ER:107. [NO-GUARD-MUTATION] Creates a `user` and `user_info` row (EC:2283-2303) and writes attendance for any `event_id` in the query (EC:2268, 2305). Also kiosk check-in. |
| GET | /event/search-user | **public (no protect)** | ER:108. [NO-GUARD-EXPOSES-DATA] Looks up a member by phone and returns name, phone, user_id and country code (EC:2328-2345, `searchUser` EC:2772-2797). Phone-number enumeration. |
| POST | /event/create-event-type | can_manage_events → Events:manage | ER:110. Event types are global (no branch). |
| PUT | /event/update-event-type | can_manage_events → Events:manage | ER:115 |
| GET | /event/get-event-type | auth-only | ER:120 |
| GET | /event/get-event-types | auth-only | ER:121 |
| DELETE | /event/delete-event-type | can_delete_events → Events:admin | ER:122 |
| POST | /event/register | auth-only | ER:128. [IMPLICIT-SCOPE: own] Always registers `req.user.id`, ignoring body `user_id` when authenticated (EC:3291-3295) |
| GET | /event/get-registered-event-members | can_view_events → Events:view | ER:129. No branch check on `event_id` (EC:3403-3408) |
| GET | /event/all-registered-event-member | can_view_events → Events:view | ER:134. EC:3429 |
| POST | /event/stage-biometric-attendance | can_manage_church_attendance → Church_Attendance:manage | ER:140. [BORROWED: Church_Attendance] |
| POST | /event/biometric-attendance-upload-intent | can_manage_church_attendance | ER:146 |
| POST | /event/stage-biometric-attendance-from-upload | can_manage_church_attendance | ER:152 |
| POST | /event/import-biometric-attendance | can_manage_church_attendance | ER:158 |
| GET | /event/import-biometric-attendance-job | can_view_church_attendance | ER:164. Any job id. No owner or branch check (EC:3660-3676; `biometricAttendanceService.getImportJob` biometricAttendanceService.ts:604-605) |
| POST | /event/church-attendance | can_manage_church_attendance | ER:173. Event is branch-checked (EC:3742-3749) |
| GET | /event/church-attendance | can_view_church_attendance (NOT the scoped variant) | ER:183. [IMPLICIT-SCOPE: branch] EC:3875. The `assigned_departments` scope is not applied here. |
| GET | /event/biometric-attendance | can_view_church_attendance_scoped | ER:189. [IMPLICIT-SCOPE: dept] Reads `attendanceScope.departmentIds`, EC:3991-4010 |
| GET | /event/church-attendance/by-id | can_view_church_attendance | ER:199. `findUnique` by id with no branch check, EC:4286 |
| PUT | /event/church-attendance | can_manage_church_attendance | ER:209. Updates by id with no branch check, EC:4338-4339 |
| DELETE | /event/church-attendance | can_delete_church_attendance → Church_Attendance:admin | ER:219. Deletes by id with no branch check, EC:4387-4388 |
| GET | /event/ical-export | auth-only | ER:228. EC:2472 |
| GET | /event/reminders | auth-only | ER:234. Any event's reminders (EC:2579-2590) |
| POST | /event/reminders | can_manage_events | ER:235. Event loaded by id with no branch filter (EC:2627) |
| DELETE | /event/reminders | can_manage_events | ER:240. By reminder id (EC:2665) |

### Implicit scoping / visibility
- **Branch.** Lists use `getBranchScopedWhere` (EC:1899, 1950, 2034, 2053, 2082, 2115, 2162, 2224; attendance list EC:3875). This clamps admins to their granted branches (`branchService.ts:61-79`). Members get no clamp (`allowedBranchIds: null`, AZ:353-355), so they see events in every branch unless the client sends `X-Branch-Id`.
- **Own.** Registration targets the caller (EC:3291-3295).
- **Department.** Only `GET /biometric-attendance` applies the Church_Attendance `assigned_departments` scope (EC:3991-4010). `GET /church-attendance`, `/church-attendance/by-id`, PUT and DELETE use unscoped guards (ER:183, 199, 209, 219). A department-scoped attendance officer can therefore read and edit every summary.
- **Where scoping is missing.** These by-id mutations skip the branch check, so an admin of branch A can change records in branch B by id: update-event (EC:1201), delete-event (EC:1459), attendance by-id/update/delete (EC:4286, 4338, 4387), reminders (EC:2627, 2665), registrations list (EC:3403).

### Workflow / approval decisions
- No approval flow on events. Check-in is either public kiosk (`sign-attendance`, no auth) or biometric import (Church_Attendance manage).
- The biometric import actor is recorded as `created_by` (biometricAttendanceService.ts:360, 543), but job reads are not owner-checked.

### Candidate action permissions
- `events.check_in` / kiosk attendance: POST /event/sign-attendance (EC:2240)
- `events.register_self`: POST /event/register (EC:3288). Public registration: EC:3163
- `events.view_registrations` and export: GET /get-registered-event-members (EC:3393)
- `events.manage_series` (bulk edit/delete series): ER:82-105
- `events.manage_types`: ER:110-126
- `events.manage_reminders` (send notifications): ER:235-244
- `events.manage_online_links` (livestream links): ER:67
- `attendance.import_biometric`: ER:140-162
- `attendance.record_summary` / edit / delete: ER:173-223
- `events.export_ical`: ER:228 (low value)

### Gaps
- **HIGH.** `POST /event/sign-attendance` is unauthenticated. It creates `user` rows and attendance for any event (ER:107, EC:2283-2305). The un-awaited `this.signAttendance` at EC:2276 also hides failures.
- **HIGH.** `GET /event/search-user` is unauthenticated phone→member lookup that returns name and user_id (ER:108, EC:2772-2797). The `findFirst` ignores the country code (commented out, EC:2778), so it matches any member with that number.
- **MED.** By-id mutations are not branch-checked: EC:1201, 1459, 4338, 4387, 2627.
- **MED.** The Church_Attendance `assigned_departments` scope is applied on only 1 of 5 attendance read/write routes (ER:183-223 vs ER:189).
- **MED.** `events-stats` returns attendee user_ids to any logged-in member (EC:2162-2172).
- **LOW.** Public registration endpoints have no `authRateLimiter` (ER:42, 47). Biometric job read has no owner check (EC:3671).

## Module: eventReports (/event-reports)

ERR = `eventReports/eventReportRoute.ts`, ERC = `eventReportController.ts`, ERS = `eventReportService.ts`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /event-reports/eligible-events | can_view_events → Events:view | ERR:21. [IMPLICIT-SCOPE: branch] ERS:1591-1593 |
| POST | /event-reports/generate | can_manage_events → Events:manage | ERR:27. The event is loaded by id with no branch check (`loadEventByIdTx`, ERS:514-536, 1713) |
| GET | /event-reports/overview | can_view_events | ERR:33. ERS:1815 |
| GET | /event-reports/get-report | can_view_events | ERR:39. Branch-gated; legacy null-branch rows visible to all (ERS:1779-1787) |
| POST | /event-reports/generate-service-summary | can_view_events → Events:**view** | ERR:45. Export (DOCX/PDF) behind view, a POST (ERC:92-101, ERS:1975) |
| GET | /event-reports/get-approval-config | can_view_events | ERR:51. ERC:23 reads `getApprovalConfigByModule("EVENT_REPORT")` from the requisitions module |
| POST | /event-reports/upsert-approval-config | can_manage_events → Events:manage | ERR:57. [WORKFLOW] [BORROWED: shares requisition approval-config storage] ERC:30-43 |
| POST | /event-reports/approve | **auth-only**; the service checks Reports:admin OR Events:admin | ERR:64. [WORKFLOW] ERS:2505-2510, `canSignOffEventReports` ERS:2167-2173 |
| POST | /event-reports/return | **auth-only**; same service check | ERR:66. [WORKFLOW] ERS:2534-2545 |
| POST | /event-reports/resubmit | can_manage_events | ERR:68. [WORKFLOW] No service-level check (ERS:2575-2600) |
| POST | /event-reports/comment | can_view_events | ERR:74. ERS:2603 |

### Implicit scoping / visibility
- Branch filtering uses `findEventReportWorkflowRowTx` with `enforceBranch` (ERS: findEventReportWorkflowRowTx). Rows with `branch_id: null` are reachable from every branch ("Legacy rows … stay reachable").
- `generateEventReport` does not branch-check the event (ERS:1713, `loadEventByIdTx` ERS:514).

### Workflow / approval decisions
- Sign-off is hardcoded to a permission level: `Reports:admin || Events:admin` via `userHasDomainPermission` (ERS:2167-2173). That helper reads permissions **merged across all branches** (AZ:754-764), not the active branch. Events or Reports admin in any one branch is enough to approve any report reachable in the caller's allowed branches.
- An `EVENT_REPORT` approval config can be saved (ERC:30-43), with an "EVENT_REPORT only: who signs off the financial section" field (`requisitions/requisition-approval-workflow.ts:41`). The approve and return code paths never read it: `EVENT_REPORT` appears only in the controller and the requisition workflow, not in ERS. **Configured approvers are ignored.**
- Resubmit needs Events:manage (route only). Comment needs Events:view. UI flags come from ERS:2175-2203.

### Candidate action permissions
- `event_reports.generate` (ERS:1692)
- `event_reports.export` (ERS:1975)
- `event_reports.approve` (ERS:2505)
- `event_reports.return` (ERS:2534)
- `event_reports.resubmit` (ERS:2575)
- `event_reports.comment` (ERS:2603)
- `event_reports.configure_approval` (ERC:30)

### Gaps
- **MED.** Approve and return are guarded only by `protect` at the route (ERR:64-66). The service check uses merged-branch permissions (ERS:2167-2173 → AZ:754-764).
- **MED.** The saved approval chain is not enforced (ERC:30-43 vs ERS:2481-2485).
- **LOW.** Generate does not branch-check the event (ERS:1713). Export is gated by view (ERR:45). Legacy null-branch rows are visible from every branch.

## Module: departmentReports (/department-reports)

DRR = `departmentReports/departmentReportRoute.ts`, DRS = `departmentReportService.ts`, REG = `registry.ts`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /department-reports/list | auth-only, service filters | DRR:27. [IMPLICIT-SCOPE: dept/head] `canView` DRS:213-217, list DRS:602-606 |
| GET | /department-reports/report | auth-only, service checks | DRR:28. DRS:546-548 |
| GET | /department-reports/executive-summary | can_view_reports → Reports:view | DRR:29. DRS:988 |
| PUT | /department-reports/commentary | auth-only, `canPrepare` | DRR:31. [WORKFLOW] DRS:755-757 |
| POST | /department-reports/submit | auth-only, `canPrepare` | DRR:32. [WORKFLOW] DRS:801-805 |
| POST | /department-reports/approve | can_admin_reports → Reports:admin, plus service `viewer.reportsAdmin` | DRR:33. [WORKFLOW] DRS:829-830 |
| POST | /department-reports/return | can_admin_reports, plus service | DRR:34. [WORKFLOW] DRS:853-854 |
| POST | /department-reports/comment | auth-only; `loadForWrite` → `canView` | DRR:35. DRS:882-886, 722 |
| POST | /department-reports/remind | can_admin_reports, plus service | DRR:36. Sends notifications to the HOD (DRS:901-902) |
| POST | /department-reports/requests/decide | can_admin_reports, plus service | DRR:37. [WORKFLOW] DRS:921-944 |

### Implicit scoping / visibility
- `loadViewer` (DRS:63-86) computes Reports view/admin, Members view (to see names), Departments access, and view/manage for each report's domain. All use **merged-branch** `userHasDomainPermission`.
- `canView` (DRS:213-217) allows a report when the caller:
  - is the department head (`department.department_head === userId`, DRS:201);
  - for a church report, holds Reports:view or the report's domain view;
  - for a department report, holds Reports:view in branch scope, or Departments view (respecting `assigned_departments`, DRS:206-211).
- `canPrepare` (DRS:220-225): the department head, OR **manage on the report's domain** (REG:27-35). For example, Financials:manage makes the caller the "Treasurer" for the finance report; Life Center:manage makes them the Evangelism HOD.
- Member names are visible only with Members:view, or as the department's head or Departments viewer (DRS:340-341).
- Branch handling:
  - `readSelection` asserts the branch is accessible (DRS:245-246).
  - Branch-limited callers cannot write the church-wide report (DRS:724-727).
  - `decideRequest` re-checks the branch (DRS:939-944).

### Workflow / approval decisions
- Prepare and submit: department head (position-like, via `department.department_head`) or domain manage. The ownership mapping is hardcoded in REG:27-35.
- Approve, return, remind and decide: `Reports:admin` (DRS:830, 854, 902, 922). The route guard is branch-aware; the service check is merged-branch.
- Comment: anyone who can view. Notifications go to all Reports:admin holders, or to HODs (DRS:887).

### Candidate action permissions
- `dept_reports.prepare` (edit commentary): DRS:755
- `dept_reports.submit`: DRS:801
- `dept_reports.approve`: DRS:829
- `dept_reports.return`: DRS:853
- `dept_reports.remind`: DRS:901
- `dept_reports.decide_request`: DRS:921
- `dept_reports.comment`: DRS:882
- `reports.view_executive_summary`: DRR:29
- `reports.see_member_names`: DRS:340

### Gaps
- **MED.** Domain manage implicitly grants "HOD/preparer" for church-level reports (REG:23-24, DRS:222). There is no separate action. Anyone who can manage Asset can write the Logistics report commentary.
- **LOW.** Service checks use merged-branch permissions (DRS:65-71, AZ:754), while route guards use active-branch permissions (AZ:388-405), so the two can disagree.
- **LOW.** The list, report, commentary, submit and comment routes are protect-only, with authorization done in the service. This is correct but invisible at the route layer.

## Module: workspaces (/workspaces)

WR = `workspaces/workspaceRoute.ts`, WS = `workspaceService.ts`, WK = `workspaceKeys.ts`, builders under `workspaces/builders/`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /workspaces/:ws (prelate, admin, finance, hod, generic) | auth-only, service checks | WR:14. [IMPLICIT-SCOPE: branch/dept/own] WS:38-60 |

### Implicit scoping / visibility
- Allowed workspaces come from `access_level.workspaces` (schema `access_level.workspaces Json?`, prisma/schema.prisma:486-492) on the caller's `user_branch_access` grants. When unset, they are derived from permissions (WK:22-37):
  - Reports:admin → prelate
  - Settings or Members manage → admin
  - Financials:manage → finance
  - Departments:manage + `assigned_departments` → hod
- Users with no grants get only `generic` (WS:27-35). The branch is asserted (WS:41-42).
- Widgets are gated by `ctx.can(domain, action)` → `userHasBranchDomainPermission` (WS:58-60, widgetKit.ts:80-91).
- **Ungated (null permission) widgets:**
  - admin `a-q`: requisitions, join requests and the visitor queue (builders/admin.ts:56-62)
  - admin `a-log`: logistics (admin.ts:72)
  - finance `f-q` (finance.ts:333-337)
  - prelate `p-hero`, `p-sign`, `p-kpi`, `p-today` (prelate.ts:86, 154, 164, 299)
  - hod `h-kpi`, `h-join` (hod.ts:148, 218)

  The sub-queries inside some of these check flags themselves (e.g. `canAtt`, `canVisitorsManage`, admin.ts:50-52).
- **HOD workspace.** Scoped to departments where `department.department_head = userId` (hod.ts:77-88). It shows that department's requisitions (non-draft, or own drafts: hod.ts:115-123) and pending join requests (hod.ts:218-222). This is visibility by department headship, not by permission.
- **Generic workspace.** Own records: orders, registrations, appointments, rides as driver or passenger (generic.ts:55-317).

### Workflow / approval decisions
- Read-only. The `p-sign` and `f-q` queues list items the caller can approve. Approver status comes from the finance approval config / requisition steps (finance.ts:333-340).

### Candidate action permissions
- `workspace.<key>.access` is already modeled as `access_level.workspaces` (a data field, not a permission level). The redesign could fold it in.

### Gaps
- **LOW.** Null-gated widgets rely on internal checks. Visibility is "department head sees department requisitions / join requests" without any Departments or Requisition permission (hod.ts:115-123, 218-222). Probably intended, but implicit.

## Module: departmentJoinRequests (/department-join-request)

JR = `departmentJoinRequests/joinRequestRoute.ts`, JC = `joinRequestController.ts`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /department-join-request/open-departments | auth-only | JR:19. [IMPLICIT-SCOPE: branch] JC:108-116 |
| POST | /department-join-request/create | auth-only | JR:20. [IMPLICIT-SCOPE: own] JC:232-330 |
| GET | /department-join-request/mine | auth-only | JR:21. [IMPLICIT-SCOPE: own] JC:181-188 |
| GET | /department-join-request/list | auth-only, service checks | JR:25. [IMPLICIT-SCOPE: dept-head] JC:372-430 |
| PATCH | /department-join-request/approve | auth-only, service checks | JR:26. [WORKFLOW] JC:633 → approveOne JC:500-560 |
| PATCH | /department-join-request/decline | auth-only, service checks | JR:27. [WORKFLOW] JC:672, JC:585-610 |
| POST | /department-join-request/bulk | auth-only, service checks | JR:28. [WORKFLOW] JC:713 |

### Implicit scoping / visibility
- List: callers with `Membership_Management:manage` see all requests (branch-filtered, JC:402, 424). Others see only departments they head (`getHeadedDepartmentIds`, JC:95-101, 388-395); with none, they get 403.

### Workflow / approval decisions
- `canActOnDepartment` (JC:45-54) allows the action when the caller has `Membership_Management:manage` (falling back to Members) OR is `department.department_head`. Approval writes `department_positions` (assigns the position and adds the member to the department, JC:528-545).
- **Permission source drift.** `getUserPermissions` reads the legacy single `user.access.permissions` (JC:36-42). It does not use per-branch `user_branch_access` grants (AZ:568-576) or the deleted flag, and it does not check is_user or is_active. `user.access_level_id` is only kept pointing at the home-branch grant (`accessLevels/branchAccessService.ts:64-90`). An admin whose Membership_Management:manage comes from a non-home branch grant is refused; a revoked or soft-deleted level may still grant access.
- Resolution goes through the second alias table in `src/utils/permissionResolver.ts:1-9`, not `PERMISSION_KEY_ALIASES` in AZ:16.
- Approve and decline by id are not branch-checked (JC:506, 585). Approver notification fan-out filters by `user.branch_id` rather than grants (JC:66-72).

### Candidate action permissions
- `departments.approve_join_request` / `decline_join_request` / `bulk_decide` (JC:633, 672, 713)
- `departments.assign_position` (implicit in approve, JC:528)

### Gaps
- **MED.** Authorization bypasses the central model: legacy `user.access` plus a separate alias map (JC:36-54, utils/permissionResolver.ts:1-9). No is_active or deleted-level check.
- **MED.** Approve and decline are not branch-scoped. Membership managers act across every branch (JC:500-525).
- **LOW.** All routes are protect-only (JR:19-28). Department headship is a hardcoded approver role.

## Module: theme (/theme)

TR = `theme/route.ts`, TS = `theme/service.ts`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /theme/create-theme | can_manage_theme → Theme:manage (alias falls back to Program, AZ:26) | TR:10. Branch via `resolveBranchIdOrDefault` TS:75 |
| GET | /theme/get-themes | auth-only | TR:15. [IMPLICIT-SCOPE: branch] TS:80-82 |
| GET | /theme/get-active-theme | auth-only | TR:16. [IMPLICIT-SCOPE: branch] TS:87-91 |
| GET | /theme/get-theme | auth-only | TR:17. By id, no branch filter (TS:96-98) |
| PUT | /theme/update-theme | can_manage_theme | TR:18. TS:102-130 (branch filter applies only when the body has branch_id) |
| DELETE | /theme/delete-theme | can_delete_theme → Theme:admin | TR:23. By id, no branch check (TS:133-135) |

### Implicit scoping / visibility
- Branch scoping on lists only.

### Workflow / approval decisions
- None.

### Candidate action permissions
- `theme.activate` / publish (`isActive` toggled through update).

### Gaps
- **LOW.** No `can_view_theme` exists (theme content is effectively public to members). Delete by id is not branch-checked (TS:133). The Theme alias falls back to Program (AZ:26). The frontend's canonical domain list should mirror that.

## Module: ai (/ai, /api/ai, /api/v1/ai)

AR = `ai/aiRoute.ts`, AC = `aiController.ts`, ARO = `aiReadOnlyDataService.ts`. The AI alias falls back AI → Settings → Access_rights (AZ:44).

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /ai/credentials | can_view_ai → AI:view | AR:10 |
| POST | /ai/credentials | can_manage_ai → AI:manage | AR:16. Stores a provider API key (AC:66-81) |
| PUT | /ai/credentials/:id | can_manage_ai | AR:22. AC:109 |
| GET | /ai/chatbot/config | can_view_ai | AR:28 |
| POST | /ai/chatbot | can_manage_ai | AR:34. Spends money / quota |
| POST | /ai/chat | can_manage_ai | AR:40. AC:203-315 |
| GET | /ai/usage-summary | can_view_ai | AR:46 |
| GET | /ai/usage/summary | can_view_ai | AR:52 (duplicate alias) |
| GET | /ai/usage-history | can_view_ai | AR:58 |
| GET | /ai/usage/history | can_view_ai | AR:64 (duplicate alias) |
| GET | /ai/query-contracts | can_view_ai | AR:70 |
| POST | /ai/query-read-only | can_view_ai → AI:view | AR:76. [BORROWED: AI grants cross-domain read] [UNSCOPED-LIST] AC:585-630 → ARO |
| POST | /ai/insights/:module | can_manage_ai | AR:82. AC:654-707; "operations" answers across all modules (AC:684) |

Each route is mounted three times (appRouter.ts: `/ai`, `/api/ai`, `/api/v1/ai`).

### Implicit scoping / visibility
- None.
- `AiReadOnlyDataService` queries modules user, department, position, access, upload, assets, event, requisitions, program, visitor, lifecenter, device, market, product, orders, theme, appointment, the finance configs, financials and ai (aiReadOnlyContracts.ts:218-410). There is no per-domain permission check (no `userHas*` / `hasActionPermission` anywhere in `src/modules/ai/`). There is no branch filter (no `branch` reference in ARO or aiBusinessContextService.ts). `queryUser` returns emails (ARO:612-700).
- Chat and insights build business context from `prisma.user_info` and other tables (aiBusinessContextService.ts:487, 1008-1148).

### Workflow / approval decisions
- None. Usage quota and idempotency are tracked per actor (AC:265-315).

### Candidate action permissions
- `ai.manage_credentials` (AC:66, 109)
- `ai.chat` (AC:203)
- `ai.generate_insights` (AC:654)
- `ai.query_data` (AC:585)
- `ai.view_usage` (AR:46-68)

### Gaps
- **HIGH.** AI:view (inherited from Settings or Access_rights:view) lets a caller read members, access levels, financials, visitors, orders and more across **all branches**, bypassing each domain's own permission, exclusions and scopes (AR:76, aiReadOnlyContracts.ts:218-410, ARO). AI:manage chat and insights have the same reach (AC:684).
- **MED.** AI falls back to Settings → Access_rights (AZ:44). Anyone who can view settings gets the AI data reach unless AI is set explicitly.
- **LOW.** Duplicate route aliases (AR:46-68) and three mounts widen the surface.

---

<!-- slice F5 -->

## Module: programs — School of Ministry / LMS (`/program`)

Route file: `src/modules/programs/programRoute.ts`. Two guard families:
- `can_manage_programs_or_facilitator` (authorization.ts:1739-1763): passes if privileged user has `School_of_ministry:manage` OR `Program:manage` in the active branch, OR if `req.user.instructor` is truthy. Sets `req.somScope = { manageAll }`.
- `design` = `[protect, can_manage_school_of_ministry]` (programRoute.ts:231) → `School_of_ministry:manage` (alias chain `School_of_ministry` → `School of ministry` → `Program`, authorization.ts:30). `manage` = facilitator-or-manage (programRoute.ts:232).
- Deletes use `can_delete_programs` → `Program:admin` (authorization.ts:2351) — a different domain key than the `design` routes.

**How `instructor` is set:** it is a JWT claim, not a DB lookup. `buildSessionClaims` calls `courseService.checkIfInstructor(user.id)` (userController.ts:1424-1426, emitted at :1441), which is `course.count where instructorId = user` (courseService.ts:195-200). `getAccessContext` spreads the decoded token into `req.user` (authorization.ts:900-909), so `req.user.instructor` is whatever the token said at login (12h lifetime, userController.ts:1457-1460). Consequences: (a) someone removed as a course instructor keeps facilitator rights until token expiry; (b) people on the `program_instructor` roster who teach no `course` never get the claim, so they can never pass the guard even though `lmsAccess.ts` gives them per-program abilities.

**Facilitator narrowing** only exists in the newer LMS controllers via `assertProgramAbility` / `assertCohortAbility` / `facilitatorCohortIds` (lms/lmsAccess.ts:14-31, 70-83). Rostered abilities: `can_grade`, `can_attendance`, `can_message` (lmsAccess.ts:5). The legacy controllers (`programController`, `cohortController`, `courseController`, `enrolmentController`) never call these and never read `somScope`. Grep confirms the only callers are in `lms/curriculumController.ts`, `lms/assessmentController.ts` and `lms/operationsController.ts`.

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /program/program | facilitator-or-manage → SoM/Program:manage OR instructor claim | programRoute.ts:20. A facilitator can create any program; no ability check (programController.ts:86). [WORKFLOW] |
| GET | /program/programs | auth-only | :25. Branch filter only from `branch_id` query (programService.ts:327-347). |
| GET | /program/programs-full-details | auth-only | :26. [NO-GUARD-EXPOSES-DATA][UNSCOPED-LIST] Every program, cohort and course with enrolled users' email, phone, location, plus instructor email/phone (programService.ts:382-440). No branch filter. |
| GET | /program/program | auth-only | :31. Returns topics with full LearningUnit data, including MCQ `correctOptionId` (programService.ts:724-770). [NO-GUARD-EXPOSES-DATA] |
| PUT | /program/program | facilitator-or-manage | :32. Any facilitator can edit any program (programController.ts:166). |
| DELETE | /program/program | can_delete_programs → Program:admin | :37 |
| GET | /program/get-member-programs | auth-only | :42. Takes optional `userId` from the query (programController.ts:243-262). |
| GET | /program/get-instructor-programs | auth-only | :47. Accepts any `instructorId` from the query (programController.ts:343; programService.ts:1268). |
| GET | /program/get-cohorts-by-program | auth-only | :52 |
| POST | /program/cohort | facilitator-or-manage | :59. No ability check (cohortController.ts:7). |
| GET | /program/cohorts | auth-only | :64. [UNSCOPED-LIST] No branch filter (cohortService.ts:28). |
| GET | /program/program-cohort | auth-only | :65 |
| GET | /program/cohort | auth-only | :70 |
| PUT | /program/cohort | facilitator-or-manage | :71. No ability check. |
| DELETE | /program/cohort | Program:admin | :76 |
| POST | /program/course | facilitator-or-manage | :83. A facilitator can create a class and name any eligible instructor (courseService.ts:42-47). |
| GET | /program/cohort-courses | auth-only | :88 |
| GET | /program/courses | auth-only | :89. Filters by cohortId only, with no branch (courseService.ts:63-74). |
| GET | /program/course | auth-only | :90. [NO-GUARD-EXPOSES-DATA] `enrollments.user include user_info` returns the full `user` row, including the `password` hash and all of `user_info` (courseService.ts:88-110; schema.prisma:18). |
| PUT | /program/course | facilitator-or-manage | :91. Any facilitator can edit any course, including reassigning the instructor. |
| DELETE | /program/course | Program:admin | :96 |
| GET | /program/users | auth-only | :101. Lists every user (id, name, names). The PII was trimmed (courseService.ts:24-39). [UNSCOPED-LIST] |
| GET | /program/certificate/verify/:certificateNumber | **public** | :104. Public verification by design (enrolmentController.ts:255). |
| GET | /program/certificate | auth-only | :108. Uses own `req.user.id` (enrolmentController.ts:214-217). [IMPLICIT-SCOPE: own] |
| GET | /program/certificate/pdf | auth-only | :109. Anyone who has a certificate number gets the PDF. There is no ownership check: userId is read but unused (enrolmentController.ts:311-326). |
| POST | /program/enroll | can_enroll_self_or_manage | :110. Self-enroll is allowed. Enrolling others needs manage or the instructor claim (authorization.ts:1766-1798). A facilitator can enroll anyone in any course. Self-enroll bypasses the application/approval flow (`/apply`). [WORKFLOW] |
| POST | /program/unenroll | can_enroll_self_or_manage | :115. Same rules. Hard-deletes the enrollment (enrolmentService.ts:273-289). |
| GET | /program/course-enrollment/:id | auth-only | :120. [NO-GUARD-EXPOSES-DATA] `include: { user: true }` is the full user row with the **password hash** (enrolmentService.ts:212-217). |
| GET | /program/user-enrollment/:id | auth-only | :125. IDOR: any user's enrollments (enrolmentController.ts:114-131). |
| GET | /program/user-enrollment | auth-only | :130. Same, via `?userId`. |
| GET | /program/progress | auth-only | :135. IDOR: any enrollment's progress plus the learner's email/phone (enrolmentService.ts:291-310). |
| PUT | /program/progress-update | facilitator-or-manage | :136. Any facilitator can change any learner's score (enrolmentController.ts:171). |
| PUT | /program/progress-updates | facilitator-or-manage | :141. Bulk; same issue. |
| GET | /program/my-enrollment | auth-only | :147. IDOR: `user_id` is taken from the query, not the token (enrolmentController.ts:15-27). |
| GET | /program/program-completion-status | auth-only | :149. IDOR: any `userId` from the query (programController.ts:314-330). |
| PUT | /program/activate-cohort-assignment | facilitator-or-manage | :156. No ability check (programController.ts:375). [WORKFLOW] |
| PUT | /program/deactivate-cohort-assignment | facilitator-or-manage | :161. Same. |
| GET | /program/is-assignment-active | auth-only | :166 |
| POST | /program/submit-mcq-assignment | auth-only | :171. **IDOR / impersonation**: `userId` comes from the body (programController.ts:431-450), so a caller can submit, and burn attempts, for anyone enrolled (programService.ts:1408-1430). |
| POST | /program/submit-essay-assignment | auth-only | :176. Same issue: body `userId` (programController.ts:515-530). |
| GET | /program/assignment-results | auth-only | :181. [NO-GUARD-EXPOSES-DATA] All learners' results for any topic/cohort (programController.ts:601-616; programService.ts:1556). |
| PUT | /program/grade-assignment | facilitator-or-manage | :186. A facilitator can grade any submission in any program; no `assertProgramAbility` (programController.ts:623-660; programService.ts:1765). [WORKFLOW] |
| PUT | /program/grade-assignments | facilitator-or-manage | :191. Bulk; same issue. |
| GET | /program/get-cohort-assigments | auth-only | :197 |
| POST | /program/topic | facilitator-or-manage | :204. No ability check. |
| PUT | /program/topic | facilitator-or-manage | :209. Same. |
| DELETE | /program/topic | Program:admin | :214 |
| GET | /program/topic | auth-only | :219. Returns LearningUnit data including `correctOptionId` (programService.ts:1044-1065, used for grading at :1433). |
| GET | /program/topics | auth-only | :220. All topics of all programs, with answer keys (programService.ts:705-722). [UNSCOPED-LIST] |
| PUT | /program/complete-topic | auth-only | :222. **IDOR**: body `userId`, so a caller can mark topics complete for anyone (programController.ts:296-305; programService.ts:1067). |
| PUT | /program/reorder-topics | facilitator-or-manage | :223. No ability check. |
| GET | /program/modules | auth-only | :233 |
| POST | /program/module | design → SoM:manage | :234 |
| PUT | /program/module | design | :235 |
| DELETE | /program/module | design | :236. Delete uses SoM:manage here, but program/cohort/course/topic deletes use Program:admin. |
| PUT | /program/reorder-modules | design | :237 |
| PUT | /program/topic-module | design | :238 |
| GET | /program/grading | auth-only | :239 |
| PUT | /program/grading | design | :240 |
| PUT | /program/unit-settings | design | :241 |
| GET | /program/cohort-schedule | auth-only | :242 |
| PUT | /program/cohort-due-date | manage | :243. `assertCohortAbility(can_grade)` (curriculumController.ts:87-89). |
| POST | /program/assignment-extension | manage | :244. `can_grade` (curriculumController.ts:97-101). [WORKFLOW] |
| DELETE | /program/assignment-extension | manage | :245. `can_grade` (curriculumController.ts:112-114). |
| GET | /program/question-bank | manage | :248. No program scoping: the whole bank (assessmentController.ts:15-21). |
| POST | /program/question-bank | design | :249 |
| PUT | /program/question-bank | design | :250 |
| DELETE | /program/question-bank | design | :251 |
| POST | /program/question-bank/add-to-unit | design | :252 |
| GET | /program/rubrics | manage | :253. Unscoped (assessmentController.ts:39). |
| POST | /program/rubric | design | :254 |
| PUT | /program/rubric | design | :255 |
| DELETE | /program/rubric | design | :256 |
| PUT | /program/unit-rubric | design | :257 |
| GET | /program/submission | manage | :258. `can_grade` (assessmentController.ts:55-58) |
| PUT | /program/grade-with-rubric | manage | :259. `can_grade` (assessmentController.ts:60-73) [WORKFLOW] |
| GET | /program/gradebook | manage | :260. `can_grade` (assessmentController.ts:76-80) |
| PUT | /program/grade-overrides | manage | :261. `can_grade` (assessmentController.ts:81-98). Overrides and excusals. |
| GET | /program/certificates | manage | :262. `can_grade` (assessmentController.ts:100-104) |
| POST | /program/certificates/issue | design | :263. Only SoM managers can issue (assessmentController.ts:105-110). [WORKFLOW] |
| GET | /program/sessions | manage | :266. `can_attendance` or `facilitatorCohortIds` (operationsController.ts:50-63) |
| POST | /program/session | manage | :267. `can_attendance` (:64-71) |
| PUT | /program/session | manage | :268. `can_attendance` (:72-77) |
| DELETE | /program/session | manage | :269. `can_attendance` (:78-83) |
| GET | /program/session-attendance | manage | :270. `can_attendance` (:84-89) |
| PUT | /program/session-attendance | manage | :271. `can_attendance` (:90-105). Check-in. |
| GET | /program/announcements | manage | :272. `can_message` (:108-112) |
| POST | /program/announcement | manage | :273. `can_message` (:113-131). Sends in-app, email and SMS (channels are in the body), so a facilitator can trigger SMS. |
| POST | /program/apply | auth-only | :276. Self, from the token (operationsController.ts:134-138). [IMPLICIT-SCOPE: own] |
| GET | /program/apply/eligibility | auth-only | :277. Self. |
| GET | /program/applications | design | :278. Branch-scoped via `getBranchScopedWhere` (applicationService.ts:119-125). |
| PUT | /program/application/decide | design | :279. APPROVE/DECLINE; approving enrolls the applicant (applicationService.ts:152-196). [WORKFLOW] |
| GET | /program/program-instructors | manage | :282. `can_grade` (operationsController.ts:164-168) |
| POST | /program/program-instructors | design | :283. Assigns roster abilities (operationsController.ts:169-176). |
| PUT | /program/program-instructor | design | :284 |
| DELETE | /program/program-instructor | design | :285 |
| GET | /program/instructors-overview | design | :286. Branch via query. |
| GET | /program/library | manage | :287. Unscoped. |
| POST | /program/library-item | design | :288 |
| PUT | /program/library-item | design | :289 |
| DELETE | /program/library-item | design | :290 |
| POST | /program/library/use | design | :291 |
| GET | /program/lms-reports | design | :292. Branch via query (reportsService). |
| GET | /program/learner/overview | auth-only | :295. Own, via `me(req)` (learnerController.ts:5-21). [IMPLICIT-SCOPE: own] |
| GET | /program/learner/sessions | auth-only | :296. Own. |
| GET | /program/learner/announcements | auth-only | :297. Own. |
| GET | /program/learner/submission | auth-only | :298. Own. |

### Implicit scoping / visibility
- Own-only, done correctly: `/certificate` (enrolmentController.ts:217), `/apply`, `/apply/eligibility` (operationsController.ts:134-142), `/learner/*` (learnerController.ts:5-21).
- Own-only intended but taken from client input (IDOR): `/my-enrollment` (enrolmentController.ts:17), `/user-enrollment[/:id]` (:117), `/program-completion-status` (programController.ts:317), `/complete-topic` (programController.ts:298), `/submit-mcq-assignment` (:433), `/submit-essay-assignment` (:517), `/get-member-programs` (:245), `/progress` (enrolmentController.ts:158).
- Facilitator scope (rostered or teaching a program) is enforced only in LMS controllers (lmsAccess.ts:14-31, 70-83). The legacy create/update/grade/progress routes are not narrowed.
- Branch: `getAllPrograms`, `getAllProgramForMember`, applications, sessions, instructors overview and reports use `getBranchScopedWhere` (programService.ts:138, 337; applicationService.ts:120). These are unscoped by branch: `programs-full-details` (programService.ts:382), `cohorts` (cohortService.ts:28), `courses` (courseService.ts:63-74), `topics` (programService.ts:705), question bank, rubrics and library.
- No read in this module uses `can_view_programs` or `can_view_school_of_ministry`. Every GET is auth-only or manage-gated, so View-level permission on Program/SoM is meaningless server-side.

### Workflow / approval decisions
- Facilitator right: the stale JWT `instructor` claim (userController.ts:1424, 1441; courseService.ts:195) plus, for LMS routes only, the roster ability flags `can_grade`, `can_attendance`, `can_message` (lmsAccess.ts:14-31). Roster entries are managed by SoM managers (`design`, programRoute.ts:283-285).
- Grading: legacy `/grade-assignment(s)` = any facilitator (programController.ts:623). Rubric grading and overrides = `can_grade` on that program (assessmentController.ts:57-82).
- Application approval: `School_of_ministry:manage` (programRoute.ts:278-279). Approving enrolls the applicant even if the class is full (applicationService.ts:152-196). This can be bypassed by direct self-enroll `/enroll` (authorization.ts:1784-1787), subject only to capacity and prerequisites (enrolmentService.ts:46-110).
- Certificates: issued by SoM managers (programRoute.ts:263) or auto-issued on completion (enrolmentService.ts:533, 627). Verification is public (programRoute.ts:104).
- Assignment activation and due dates: legacy activate = any facilitator (programController.ts:375). Due date and extensions = `can_grade` (curriculumController.ts:87-114).

### Candidate action permissions
- `som.program.design` (create/edit curriculum: module, topic, grading, rubric, question bank, library). programRoute.ts:234-257, 288-291
- `som.cohort.manage` / `som.class.manage` (create/edit cohorts and classes). programRoute.ts:59-100
- `som.enroll_others` / `som.unenroll`. programRoute.ts:110-119
- `som.application.decide` (approve/decline). programRoute.ts:279; applicationService.ts:152
- `som.grade` (grade, grade-with-rubric, overrides). programRoute.ts:186-195, 259-261
- `som.progress.edit`. programRoute.ts:136-145
- `som.assignment.activate` / `som.due_date.set` / `som.extension.grant`. programRoute.ts:156-165, 243-245
- `som.attendance.take` (session check-in). programRoute.ts:267-271
- `som.announce` (cohort message incl. SMS/email). programRoute.ts:273; operationsController.ts:113
- `som.certificate.issue`. programRoute.ts:263
- `som.instructor_roster.manage`. programRoute.ts:283-285
- `som.reports.view`. programRoute.ts:292

### Gaps
- **HIGH**: Password hash and full user rows go to any authenticated user via `GET /program/course-enrollment/:id` (enrolmentService.ts:212-217) and `GET /program/course?id=` (courseService.ts:98-104).
- **HIGH**: Impersonated submissions and completions, because `userId` is taken from the body on `submit-mcq-assignment`, `submit-essay-assignment` and `complete-topic` (programController.ts:298, 433, 517).
- **HIGH**: Facilitator escalation. Anyone who teaches one class (JWT `instructor`) can create, edit or activate any program, cohort, course or topic, grade any submission, edit anyone's progress, and enroll or unenroll anyone. Legacy controllers never call `assertProgramAbility` (programRoute.ts:20-226; authorization.ts:1752-1758, 1784-1787).
- **HIGH**: MCQ answer keys (`correctOptionId`) go to any authenticated user via `/program/program`, `/topic` and `/topics` (programService.ts:705-770, 1044-1065, 1433).
- **MED**: Learner PII and results IDOR on `/programs-full-details`, `/progress`, `/my-enrollment`, `/user-enrollment`, `/program-completion-status` and `/assignment-results` (programService.ts:382-440; enrolmentService.ts:291-310; programController.ts:314, 601).
- **MED**: The `instructor` claim is stale for up to 12h and ignores roster-only instructors (userController.ts:1424; lmsAccess.ts:20-27).
- **MED**: The application/approval workflow can be bypassed by self-enroll (authorization.ts:1784-1787).
- **MED**: A facilitator with `can_message` can send email/SMS (operationsController.ts:113-131). Messaging is not gated by the `Messaging` domain.
- **LOW**: Domain inconsistency. Deletes use `Program:admin` (programRoute.ts:39, 78, 98, 216), design uses `School_of_ministry:manage` (:231), and the facilitator guard ORs both (authorization.ts:1750-1752). `School_of_ministry` already falls back to `Program` (authorization.ts:30), so the OR is redundant and a Program-only grant implies SoM.
- **LOW**: The certificate PDF has no owner check (enrolmentController.ts:311-326). It is mitigated by the public verify endpoint.
- **LOW**: Lists are unscoped by branch (cohortService.ts:28; courseService.ts:63; programService.ts:382, 705).

---

## Module: lifeCenterMangement (`/lifecenter`)

Guards:
- `can_view_life_center_scoped` (authorization.ts:1664-1691): `Life Center:view` → mode `all`. Otherwise **any** `life_center_member` row (any role) → mode `member` limited to those centers.
- `can_manage_life_center_scoped` (authorization.ts:1693-1736): `Life Center:manage` → `all`. Otherwise any member of the center. It checks `body.lifeCenterId`/`query.lifeCenterId` first, and only when those are absent does it check the soul at `query/params.id`.
- `lifeCenterIds` come from `life_center_member.lifeCenterId` with no role filter (authorization.ts:554-560, 600-606).
- The leader role is never used for authorization. `life_center_leader` exists only as a JWT/UI claim (userController.ts:1421, 1440, 3676) and as role eligibility on assignment (lifeCenterRoleAssignment.ts:51).

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /lifecenter/create-role | can_manage_life_center → Life Center:manage | lifeCenterRoute.ts:17 |
| GET | /lifecenter/get-roles | can_view_life_center → view | :22 |
| GET | /lifecenter/get-role | view | :27 |
| PUT | /lifecenter/update-role | manage | :32 |
| DELETE | /lifecenter/delete-role | can_delete_life_center → admin | :37 |
| POST | /lifecenter/create-lifecenter | manage | :44. Can set the leader (lifeCenterService.ts:46-67). [WORKFLOW] |
| GET | /lifecenter/get-lifecenter | view_scoped | :49. Member mode: own centers only (lifeCenterController.ts:155-165). [IMPLICIT-SCOPE: lifecenter] |
| GET | /lifecenter/overview | view_scoped | :54. Scope passed to the service (lifeCenterController.ts:619-626). [IMPLICIT-SCOPE: lifecenter] |
| POST | /lifecenter/remind-leader | manage | :59. Sends a notification with a 24h cooldown (lifeCenterController.ts:640-660; lifeCenterService.ts:12-16). |
| GET | /lifecenter/get-lifecenters | view_scoped | :64. Branch from the query; member mode filtered in memory (lifeCenterController.ts:132-146). [IMPLICIT-SCOPE: lifecenter] |
| PUT | /lifecenter/update-lifecenter | manage | :69. Can change the leader (lifeCenterService.ts:307-328). |
| DELETE | /lifecenter/delete-lifecenter | admin | :74 |
| POST | /lifecenter/add-lifecenter-member | manage | :81. Assigns a role (lifeCenterController.ts:244-252). |
| PUT | /lifecenter/update-member-role | manage | :87 |
| DELETE | /lifecenter/remove-lifecenter-member | admin | :93 |
| GET | /lifecenter/get-lifecenter-members | view_scoped | :100. Member mode: own center only (lifeCenterController.ts:315-328). **Returns `user: true`, the full user row incl. password hash** (lifeCenterService.ts:431-442). [NO-GUARD-EXPOSES-DATA] |
| POST | /lifecenter/soulwon | manage_scoped | :107. Any center member, not just the leader, can create (lifeCenterController.ts:423-450). |
| DELETE | /lifecenter/soulwon | admin | :113. No scope check in the controller (lifeCenterController.ts:410-420). |
| PUT | /lifecenter/soulwon | manage_scoped | :119. **IDOR**: if `body.lifeCenterId` is one of the caller's centers, the existing soul's center is never checked, so another center's soul can be edited or moved (authorization.ts:1714-1721; lifeCenterController.ts:516-538). |
| GET | /lifecenter/soulswon | view_scoped | :125. All souls fetched, then filtered in memory (lifeCenterController.ts:338-375). |
| GET | /lifecenter/soulwon | view_scoped | :131. Scope check (lifeCenterController.ts:384-396). |
| GET | /lifecenter/stats | can_view_life_center → view | :138. [UNSCOPED-LIST] `getLifeCenterStats()` takes no branch and returns all souls and centers (lifeCenterController.ts:588; lifeCenterService.ts:556-570). |
| GET | /lifecenter/my-lifecenter | auth-only | :145. Own center from the token; query `user_id` only as a fallback when the token has no id (lifeCenterController.ts:62-72). [IMPLICIT-SCOPE: own] |
| POST | /lifecenter/meeting | manage_scoped | :148. `scopeAllows` (lifeCenterMeetingController.ts:123-140). Any member can record a meeting, offering amount and first-timers. [WORKFLOW] |
| PUT | /lifecenter/meeting | manage_scoped | :153. Checks both the existing and the target center (lifeCenterMeetingController.ts:189-199). |
| DELETE | /lifecenter/meeting | admin | :158. The controller's scope check (lifeCenterMeetingController.ts:244) is dead code for members. |
| GET | /lifecenter/meeting | view_scoped | :163. (lifeCenterMeetingController.ts:269) |
| GET | /lifecenter/meetings | view_scoped | :168. (lifeCenterMeetingController.ts:283-295) |
| GET | /lifecenter/meetings/export | view_scoped | :173. Export (lifeCenterMeetingController.ts:317-335). |
| GET | /lifecenter/soulswon-eligible-first-timers | view_scoped | :178. (lifeCenterMeetingController.ts:359-375) |

### Implicit scoping / visibility
- Member mode = the centers the caller belongs to in any role (authorization.ts:1679-1690, 1710-1735). Controllers filter by `lifeCenterScope.lifeCenterIds`: lifeCenterController.ts:134-146, 159-165, 319-328, 341-375, 387-396, 424-445, 496-538; lifeCenterMeetingController.ts:135, 191-199, 244, 269, 288, 324-331, 366-373.
- Gaps where scoping should exist and does not: `/stats` (lifeCenterService.ts:556, no branch or center filter); `getSouls` loads every soul before filtering in memory (lifeCenterService.ts:452-460; controller :367-373).
- The "leader-only" vs "member" distinction does not exist. An ordinary member can create and update souls won (with phone/email) and meetings (with offering amounts).

### Workflow / approval decisions
- Leader assignment: Life Center:manage via create/update-lifecenter with `leaderUserId`, with eligibility from settings role-eligibility (lifeCenterService.ts:46-67, 307-328; lifeCenterRoleAssignment.ts:51).
- Meeting/offering recording: any member of the center (manage_scoped). `wonById` for new first-timers defaults to the center leader (lifeCenterMeetingService.ts:205-214).
- Remind leader: Life Center:manage (lifeCenterRoute.ts:59).

### Candidate action permissions
- `lifecenter.soul.record` (POST/PUT soulwon). lifeCenterRoute.ts:107, 119
- `lifecenter.meeting.record` (incl. offering). :148, :153
- `lifecenter.meeting.export`. :173
- `lifecenter.remind_leader`. :59
- `lifecenter.member.assign` / `lifecenter.leader.assign`. :81, :87, :44/:69
- `lifecenter.roles.manage`. :17-41

### Gaps
- **HIGH**: Full user rows (password hash, all columns) on `/get-lifecenter-members`, reachable by any center member (lifeCenterService.ts:437).
- **HIGH**: Cross-center soul edit/move IDOR via `body.lifeCenterId` (authorization.ts:1714-1721; lifeCenterController.ts:516-538).
- **MED**: Data visibility and record rights are tied to membership, not leadership. Every member sees all members' and souls' contact details for their center and can write meetings and offerings (authorization.ts:1679-1735).
- **MED**: `/stats` has no branch scoping (lifeCenterService.ts:556).
- **LOW**: Domain key `"Life Center"` contains a space and has no underscore alias (authorization.ts:46). Scope/exclusion lookup normalises `Life_Center`, but `resolvePermissionValue` only tries `"Life Center"`.
- **LOW**: Meeting delete requires admin while create/update are member-level, and the controller has dead scope code (lifeCenterRoute.ts:158; lifeCenterMeetingController.ts:244).

---

## Module: visitorManagement (`/visitor`, plus aliases `/followup` and `/followups` at the root)

Guard `visitorScopedPermission` (authorization.ts:1213-1266):
- `Visitors:view/manage` (alias `Visitors` → `Members`, authorization.ts:19) → mode `all`.
- Otherwise the caller must appear in `visitor.responsibleMembers` (JSON) → mode `responsible`.
- List endpoints without a visitor id fall through to `responsible` for view (`allowResponsibleList`).
- Visitor id resolution precedence (authorization.ts:1185-1210): explicit `body/query/params.visitorId|visitor_id` **first**, then the resource id (`id`) mapped to its visitor.
- Deletes use `can_delete_visitors_scoped` = `checkPermission("Visitors","admin")` (authorization.ts:1317).

### Routes
| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /visitor/visitors | manage_scoped | visitorRoute.ts:18. With no visitor id, non-privileged callers are rejected (authorization.ts:1237-1246). |
| GET | /visitor/visitors | view_scoped | :23. Responsible list mode; branch via `getBranchScopedWhere` (visitorService.ts:547-592). [IMPLICIT-SCOPE: own(responsible)] |
| GET | /visitor/visitor | view_scoped | :28. **IDOR**: `?id=OTHER&visitorId=MINE` passes the guard; the controller reads `query.id` (visitorController.ts:74-80). |
| PUT | /visitor/visitor | manage_scoped | :33. **IDOR**, same pattern: body `visitorId` = mine, `query.id` = other (visitorController.ts:90-100). |
| DELETE | /visitor/visitor | Visitors:admin | :38 |
| POST | /visitor/convert-to-member | can_manage_member_details → Members:manage | :43. [BORROWED: Members] (not Visitors). Creates a user from the visitor (visitorController.ts:141-160; visitorService.ts:890). [WORKFLOW] |
| POST | /visitor/visit | manage_scoped | :50. A responsible member can log visits (visitController.ts:7-20). |
| GET | /visitor/visits | view_scoped | :55. Responsible filter done in memory; **no branch filter** (visitService.ts:37-66). |
| GET | /visitor/visit | view_scoped | :60. IDOR via explicit `visitorId` precedence (visitController.ts:42-50). |
| PUT | /visitor/visit | manage_scoped | :65. **IDOR**: body `visitorId` = mine passes, and the visit at `query.id` is updated and re-parented to my visitor (visitController.ts:73-90). |
| DELETE | /visitor/visit | Visitors:admin | :70 |
| GET | /visitor/visit/visitor | view_scoped | :75. `query.id` = visitor id (visitController.ts:57-65). |
| POST | /visitor/followup | manage_scoped (follow_up) | :82. `assignedTo` is free (followUpController.ts:7-20). [WORKFLOW] |
| GET | /visitor/followups | view_scoped | :87. Responsible filter; no branch filter (followUpService.ts:59-91). |
| GET | /visitor/followup | view_scoped | :92. IDOR via `visitorId` precedence (followUpController.ts:47-55). |
| PUT | /visitor/followup | manage_scoped | :97. IDOR via `visitorId` precedence (followUpController.ts:63-75). |
| DELETE | /visitor/followup | Visitors:admin | :102 |
| GET | /visitor/my-prayer-requests | auth-only | :110. Own, from the token (prayerRequestController.ts:95-101; prayerRequestService.ts:71-77). [IMPLICIT-SCOPE: own] |
| POST | /visitor/my-prayer-requests | auth-only | :115. Own (prayerRequestController.ts:107-115). |
| POST | /visitor/prayerrequest | manage_scoped (prayer_request) | :120 |
| GET | /visitor/prayerrequests | view_scoped | :125. Responsible filter; no branch filter (prayerRequestService.ts:28-60). |
| GET | /visitor/prayerrequest | view_scoped | :130. IDOR via `visitorId` precedence (prayerRequestController.ts:44-55). |
| PUT | /visitor/prayerrequest | manage_scoped | :135. IDOR, same (prayerRequestController.ts:63-75). |
| DELETE | /visitor/prayerrequest | Visitors:admin | :140 |
| GET | /followup | view_scoped (follow_up) | src/routes/appRouter.ts:94-105. Alias; dispatches to getById or getAll. |
| GET | /followups | view_scoped (follow_up) | appRouter.ts:107-111. Alias. |
| GET | /user/guests (cross-module) | can_view_visitors_scoped | userRoutes.ts:100. Uses the visitor guard for user guests. [BORROWED: Visitors] |

### Implicit scoping / visibility
- Responsible-member scope: authorization.ts:1252-1265. List services filter by `responsibleMembers` JSON in memory: visitService.ts:37-60, followUpService.ts:59-85, prayerRequestService.ts:28-55, visitorService.ts:547-560.
- Branch: only `getAllVisitors` applies `getBranchScopedWhere` (visitorService.ts:591). Visits, follow-ups and prayer requests have no branch scoping, so a branch-limited admin sees every branch's data.
- No department or life-center scope for visitors, though it would be the natural model for follow-up teams.

### Workflow / approval decisions
- Convert visitor → member: `Members:manage` (visitorRoute.ts:43-47). There is no Visitors-specific right and no exclusion check against the new member.
- Follow-up assignment: any caller with manage on the visitor (including a responsible member) can set `assignedTo` to anyone (followUpController.ts:9).
- Responsible members are set on visitor create/update, with validation (visitorService.ts:366-395, 401). A responsible member who can PUT the visitor can rewrite `responsibleMembers` and remove other members.

### Candidate action permissions
- `visitors.convert_to_member`. visitorRoute.ts:43
- `visitors.assign_responsible`. visitorService.ts:401
- `visitors.followup.assign`. visitorRoute.ts:82
- `visitors.visit.log` (check-in). visitorRoute.ts:50
- `visitors.prayer_request.manage`. visitorRoute.ts:120-143

### Gaps
- **HIGH**: The visitor-scoped guard trusts an explicit `visitorId` over the resource `id`, giving IDOR on GET/PUT of visitor, visit, follow-up and prayer request for any responsible member (authorization.ts:1189-1192 vs controllers: visitorController.ts:76, 92; visitController.ts:44, 75; followUpController.ts:49, 65; prayerRequestController.ts:46, 65).
- **MED**: Visits, follow-ups and prayer requests are unscoped by branch (visitService.ts:37; followUpService.ts:59; prayerRequestService.ts:28).
- **MED**: Domain drift. `Visitors` silently falls back to `Members` (authorization.ts:19), and convert-to-member is gated on `Members` rather than a Visitors action (visitorRoute.ts:45).
- **LOW**: Delete is admin-level only, with no responsible-member path. That is consistent, but the update/delete split is coarse.

---

<!-- slice F6 -->

<!-- Fork F6: appointment, community, messaging, sermons, promotions. Paths relative to ../Backend. AUTH = src/middleWare/authorization.ts -->

## Module: appointment (/appointment)

### Routes
Route file: `src/modules/appointment/appointment-route.ts`. Controller: `appointment-controller.ts` (AC). Service: `appointment-service.ts` (AS).

| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | /appointment/book | auth-only | Self-booking. Booking for someone else (`requesterId` ≠ caller) or with `status: CONFIRMED` checks `canUserManageAppointments` (Appointments:manage + attendee exclusion) inside the controller (AC:226-240, AS:793-807). [WORKFLOW] |
| GET | /appointment/bookings | can_view_appointments_scoped -> Appointments:view, else own | Without view: `mode: own` (requester OR attendee) (AUTH:1376-1386, AS:1555-1558). With view: all minus excluded attendees (AS:1559-1568). Branch filter via `getBranchScopedWhere` (AS:1524). [IMPLICIT-SCOPE: own/branch] |
| GET | /appointment/bookings/:id | can_view_appointments_scoped | The guard checks owner or view + exclusion (AUTH:1338-1372). The service `getBookingById` applies **no branch check** (AS:1583). [IMPLICIT-SCOPE: own] |
| PUT | /appointment/bookings/:id | can_manage_appointments_scoped -> Appointments:manage + exclusion | Free-form edit incl. `status`, attendee, requester and branch (AS:1597-1716). Bypasses the action state machine. |
| PUT | /appointment/bookings/:id/cancel | auth-only | The requester cancels their own booking. Ownership and cutoff are checked in the service (AS:1782-1793). [WORKFLOW][IMPLICIT-SCOPE: own] |
| POST | /appointment/bookings/:id/actions | auth-only | State machine: accept/reopen/suggest/decline/cancel/complete/no_show by the **attendee** or a manager; remind/reassign/confirm_proposal are manager-only (appointment-actions.ts:150-187, appointment-rules.ts:169-182). [WORKFLOW] |
| DELETE | /appointment/bookings/:id | can_delete_appointments_scoped -> Appointments:admin + exclusion | AUTH:1463-1508, AS:1719-1731. Hard delete. |
| GET | /appointment/client?email= | can_view_appointments_scoped | Bookings by email. Own-scope ANDed (AS:1739-1741). [IMPLICIT-SCOPE: own] |
| POST | /appointment/availability | can_manage_appointments_scoped | Sets the schedule for `body.userId`. Exclusion is checked against that user (AUTH:1400-1409). An attendee cannot set their own availability without Appointments:manage. |
| GET | /appointment/availability | can_view_appointments_scoped | Own mode returns only the caller's availability (AS:1052-1070). [IMPLICIT-SCOPE: own/branch] |
| GET | /appointment/availability/status | can_view_appointments_scoped | AS:1229-1242. [IMPLICIT-SCOPE: own/branch] |
| GET | /appointment/availability/booking-options | auth-only | Passes `{mode:"all"}`, so every staff member's slots are visible (AC:188-199). Intended for booking. |
| PUT | /appointment/availability/staff/:userId/pause | can_manage_appointments_scoped | Exclusion resolved from `params.userId` (AUTH:1408). AS:1839-1851. |
| POST | /appointment/availability/staff/:userId/time-off | can_manage_appointments_scoped | AS:1853-1884. |
| DELETE | /appointment/availability/time-off/:id | can_manage_appointments_scoped | The guard resolves the time-off owner for the exclusion check (AUTH:1418-1423). AS:1886-1893. |
| PUT | /appointment/availability/:id | can_manage_appointments_scoped | Availability owner resolved for the exclusion check (AUTH:1424-1429). |
| DELETE | /appointment/availability/:id | can_delete_appointments_scoped -> Appointments:admin | AUTH:1478-1489. |
| GET | /appointment/staff?userId= | can_view_appointments_scoped | AS:1734-1736. Own scope is ANDed, so a member sees only bookings where they are the requester or attendee. [IMPLICIT-SCOPE: own] |
| PUT | /appointment/status?id= | can_manage_appointments_scoped | Legacy confirm/unconfirm toggle. Exclusion via `query.id` (AUTH:1431-1437). Sends in-app, email and SMS (AC:493-561). [WORKFLOW] |
| GET | /appointment/reasons | auth-only | Active booking reasons (appointment-reason-controller.ts:17). |
| GET | /appointment/reasons/manage | can_manage_appointment_settings -> Appointments:manage | AUTH:2443-2447. |
| POST | /appointment/reasons | can_manage_appointment_settings | Global list with no branch. |
| PUT | /appointment/reasons/reorder | can_manage_appointment_settings | |
| PUT | /appointment/reasons/:id | can_manage_appointment_settings | |
| DELETE | /appointment/reasons/:id | can_manage_appointment_settings | |
| GET | /appointment/settings | can_view_appointments_scoped | This guard never rejects an authenticated user (it falls back to `own`, AUTH:1381-1386), so in effect it is auth-only. Returns the global settings (AC:623). |
| PUT | /appointment/settings | can_manage_appointment_settings | appointment-settings.ts:234. Global, not per-branch. |

### Implicit scoping / visibility
- **Own scope** (requester OR attendee) for anyone without Appointments:view. The guard sets it at AUTH:1381-1386 and the service applies it at AS:1555-1558, AS:1061-1066 and AS:1239-1240. This is the only "own records" model in the slice. It is decided by the guard, not by a permission setting.
- **Exclusions** (Appointments): view hides the attendee IDs listed in `Appointments_exclusions` (AS:1559-1568). Manage and delete refuse when the target attendee is excluded (AUTH:1440-1445, AUTH:1478-1504).
- **Branch**: lists use `getBranchScopedWhere(branch_id)` (AS:1059, 1237, 1524). Single-record reads and mutations (`getBookingById` AS:1583, `updateBooking` AS:1597, `deleteBooking` AS:1719, `updateStatus` AS:1744, availability update and delete) never compare the record's `branch_id` with the caller's branch scope. An admin in branch A can open or change a branch-B booking by ID.
- `canUserManageAppointments` (AUTH:707-733), used by `/book` and `/bookings/:id/actions`, checks `snapshot.permissions`. That is the merge of all branches at their highest level, not the active branch's grant. A user who manages appointments in one branch counts as a manager everywhere through these two endpoints.
- `appointment_reason` and `appointment_settings` have no `branch_id` (schema.prisma:2595, 2635), so they are org-wide.

### Workflow / approval decisions
- **The attendee's right to accept, decline, suggest, complete or mark no-show is identity-based.** `initial.userId === callerId` (appointment-actions.ts:170) needs no permission at all. Anyone with an availability record can be booked and then act on those bookings.
- **Manager actions:** remind, reassign and confirm_proposal (`manageOnly`, appointment-rules.ts:180-182) need `canUserManageAppointments` (appointment-actions.ts:166-169). For reassign, the caller must also not be excluded from the new attendee (appointment-actions.ts:183).
- **Requester cancel** is identity-based, `booking.requesterId === callerId` (AS:1790), with the `cancelCutoffHours` setting.
- **Booking on behalf of someone, or creating a booking already confirmed**, needs a manager (AC:226-240, AS:793-807).
- **Legacy confirm** (`PUT /status`) and free-form edit (`PUT /bookings/:id`) need Appointments:manage and skip the state-machine checks (`actionStateViolation` is only used in appointment-actions.ts:206).

### Candidate action permissions
- `appointments.book_on_behalf`: POST /book with a different requesterId (AC:226-229, AS:793)
- `appointments.confirm` / accept: POST /bookings/:id/actions `accept`, PUT /status (appointment-actions.ts:228; AC:493)
- `appointments.decline` / `suggest_time` / `complete` / `no_show`: appointment-actions.ts:252-325
- `appointments.cancel_any`: actions `cancel` (appointment-actions.ts:305) vs requester self-cancel (AS:1782)
- `appointments.reassign`: appointment-actions.ts:334
- `appointments.remind`: appointment-actions.ts:326
- `appointments.confirm_proposal`: appointment-actions.ts:381
- `appointments.manage_availability` (own vs others): POST/PUT /availability, pause, time-off (route lines 81-146)
- `appointments.manage_settings` (reasons, settings): route 184-240
- `appointments.delete`: DELETE /bookings/:id (route 65)

### Gaps
- **Medium: By-ID reads and mutations are not branch-checked.** `getBookingById` AS:1583, `updateBooking` AS:1597, `deleteBooking` AS:1719 and `updateStatus` AS:1744 all lack the check.
- **Medium: Manager checks use merged permissions instead of the active branch.** `canUserManageAppointments` reads merged `snapshot.permissions` (AUTH:715-716) in /book and /actions. A user who manages one branch acts as a manager on any booking.
- **Medium: The attendee role has no permission behind it.** Any user booked as an attendee can accept, decline or complete (appointment-actions.ts:170). Who can be an attendee depends only on having `availability` rows, which only Appointments:manage can create (route 81-85). This is acceptable, but it is implicit.
- **Medium: The exclusion can be sidestepped when reassigning through PUT /bookings/:id.** The guard checks only the attendee in the request body when one is present (AUTH:1395-1405, attendeeFromRequest wins over the booking lookup at 1414). The existing booking's excluded attendee is never checked, so a manager can move an excluded attendee's booking to someone else.
- **Low: PUT /bookings/:id can set any `status`,** bypassing the action state machine and its history and notification rules (AS:1645-1648).
- **Low: GET /appointment/settings is effectively open to any authenticated user** (the view-scoped guard falls back to own mode, AUTH:1381-1386).
- **Low: Settings and reasons are global.** There is no per-branch appointment configuration (schema.prisma:2595, 2635).

## Module: community (/community)

### Routes
Route file: `src/modules/community/communityRoute.ts`. Guard bundles (lines 13-15): `member = [protect, attach_community_management]` is auth-only plus a non-rejecting probe. `moderator = member + can_view_community` (Community:view). `manager = member + can_manage_community` (Community:manage). The probe (AUTH:2175-2201) reads merged `snapshot.permissions`, not the active branch. `loadViewer` rejects guests and inactive users with 403 (communityQueries.ts:61-62). Service: `communityService.ts` (CS). Moderation: `communityModerationService.ts` (CMS).

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /community/me | member | Returns canManage/canModerate and the pending report count (CS:139-157). |
| GET | /community/feed | member | `visiblePostWhere`: own posts, CHURCH posts in the home branch or with null branch, SELECTED recipient, DEPARTMENT membership (communityQueries.ts:127-153). `departmentId` filter limited to the viewer's departments (CS:183-189). [IMPLICIT-SCOPE: own/dept/branch] |
| GET | /community/departments | member | Only the viewer's departments (CS:94-98). [IMPLICIT-SCOPE: dept] |
| GET | /community/members | member | Member search limited to the viewer's home branch (CS:721-732). [IMPLICIT-SCOPE: branch] |
| POST | /community/posts | member | MESSAGE type, important, pinned or comments-off posts need canManage (CS:276-277). DEPARTMENT audience needs membership unless the caller is a manager (CS:286). SELECTED recipients come from the home branch (CS:302-307). `branch_id` = home branch (CS:332). |
| GET | /community/posts/:id | member | Visible-post check (CS:61-70, 237). |
| PUT | /community/posts/:id | member | Author or canManage. A manager can edit any post, even outside their audience (CS:354-366). |
| DELETE | /community/posts/:id | member | Author or canManage (CS:382). |
| POST | /community/posts/:id/reactions | member | Visible post (CS:418). |
| GET | /community/posts/:id/reactions | member | CS:448. |
| POST | /community/posts/:id/comments | member | CS:462. |
| POST | /community/posts/:id/hide | member | Personal hide (CS:539). |
| DELETE | /community/posts/:id/hide | member | CS:549. |
| DELETE | /community/comments/:id | member | Author or canManage (CS:518-528). |
| POST | /community/comments/:id/reactions | member | CS:428. |
| GET | /community/comments/:id/reactions | member | CS:453. |
| POST | /community/comments/:id/hide | member | CS:556. |
| DELETE | /community/comments/:id/hide | member | CS:566. |
| POST | /community/reports | member | Report content (CS:591). |
| POST | /community/blocks | member | CS:635. |
| GET | /community/blocks | member | Own blocks (CS:700). [IMPLICIT-SCOPE: own] |
| DELETE | /community/blocks/:blockId | member | CS:709. |
| GET | /community/notifications | member | Own notifications (CS:751). [IMPLICIT-SCOPE: own] |
| POST | /community/notifications/read-all | member | CS:794. |
| PATCH | /community/notifications/:id/read | member | CS:802. |
| GET | /community/moderation/reports | moderator (Community:view) | **All branches**, unfiltered (CMS:52-53). Shows real authors of anonymous content. [UNSCOPED-LIST][WORKFLOW] |
| GET | /community/moderation/audit-log | manager (Community:manage) | All branches (CMS:359). [UNSCOPED-LIST] |
| POST | /community/moderation/:kind/:id/remove | manager | CMS:154-210. No branch check on the target. [WORKFLOW] |
| POST | /community/moderation/:kind/:id/restore | manager | CMS:154. [WORKFLOW] |
| POST | /community/moderation/:kind/:id/warn | manager | Warns the author and notifies (CMS:187-196). [WORKFLOW] |
| GET | /community/admin/posts | moderator | Every post in every branch except unreported ONLY_ME posts. Shows the real author and is searchable by author name (CMS:248-275). [UNSCOPED-LIST] |
| GET | /community/admin/stats | moderator | Org-wide counts (CMS:300-330). |
| POST | /community/admin/posts/:id/pin | manager | CMS:224-236. |

### Implicit scoping / visibility
- Member visibility is audience-based: author, CHURCH plus home branch, SELECTED recipient, or DEPARTMENT membership (communityQueries.ts:127-140). Department membership = `department_positions` ∪ `user_departments` (communityQueries.ts:35-50). Note that this differs from the auth snapshot's `departmentIds`, which use `department_id`, `department_positions` and the department head (AUTH:604-614).
- The branch is the **home branch** (`user.branch_id`, communityQueries.ts:76), not the `X-Branch-Id` active branch.
- **Moderation is org-wide.** No moderator list or action filters by branch (CMS:52-53, 248-266, 300-330, 359). A Community:view grant in any one branch lets the holder read reports, all posts and anonymous authors across every branch, because the probe uses merged permissions (AUTH:2186-2193). The route guard `can_view_community` would apply the active branch, but the data itself is not filtered by branch.
- Managers can edit or delete any post or comment, bypassing audience (CS:358, 522-528).

### Workflow / approval decisions
- Moderation (remove, restore, warn, pin) requires Community:manage on the route (communityRoute.ts:50-56). Viewing reports requires Community:view. There is no approval step, and no "own department" moderators such as a department head for DEPARTMENT posts.
- Posting a church-wide MESSAGE or an important/pinned post, or switching comments off, requires canManage (CS:276-277) and is logged as POST_MESSAGE (CS:342-344).
- Posting to any department as a non-member requires canManage (CS:286).

### Candidate action permissions
- `community.post_church_message` / `post_important`: CS:276
- `community.post_to_any_department`: CS:286
- `community.pin`: POST /admin/posts/:id/pin (CMS:224)
- `community.moderate_remove_restore`: CMS:154
- `community.warn_author`: CMS:187
- `community.view_reports` / `view_anonymous_author`: CMS:46-75, 262-264
- `community.edit_delete_any`: CS:358-362, 522-528
- `community.view_audit_log`: CMS:359

### Gaps
- **High: Moderation has no branch scope, and Community:view reveals the real authors of anonymous posts and comments org-wide.** See CMS:52-75 and CMS:262-264. The probe uses merged permissions (AUTH:2186-2193).
- **Medium: The probe ignores the active branch.** `attach_community_management` uses `snapshot.permissions` (merged) rather than `resolveEffectivePermissions` (AUTH:2186-2193). Member-route widening (edit or delete any post, post a MESSAGE) applies even when the active branch's role lacks Community:manage.
- **Medium: The department definition is inconsistent between community and the auth layer.** Compare communityQueries.ts:35-50 with AUTH:599-614 (department head vs `user_departments`).
- **Low: The admin stats and audit log are org-wide,** with no branch filter (CMS:300, 359).

## Module: messaging (/messaging)

### Routes
Route file: `src/modules/messaging/messagingRoute.ts`. `view = can_view_messaging` (Messaging:view), `manage = can_manage_messaging` (Messaging:manage). The alias table has **no fallback** for Messaging (AUTH:63-66). Service: `messagingService.ts` (MS).

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /messaging/templates | Messaging:view | MS:125. |
| PUT | /messaging/templates/:key | Messaging:manage | Edits welcome and birthday templates (MS:134). |
| GET | /messaging/settings | Messaging:view | MS:40. |
| PUT | /messaging/settings | Messaging:manage | Enables or disables the automatic welcome and birthday sends (MS:60). |
| GET | /messaging/placeholders | Messaging:view | |
| POST | /messaging/preview | Messaging:view | Always renders a sample person (MS:689-694). |
| POST | /messaging/audience/count | Messaging:manage | Resolves the audience org-wide (MS:712). |
| GET | /messaging/birthdays/upcoming | Messaging:view | Returns member names, dates and ages org-wide (MS:341-359). [UNSCOPED-LIST] |
| GET | /messaging/stats | Messaging:view | MS:729. |
| GET | /messaging/overview | Messaging:view | MS:585. |
| POST | /messaging/dispatches | Messaging:manage | **Sends SMS, email and in-app to CHURCH, DEPARTMENTS or PEOPLE** immediately or on a schedule (MS:398-435). No approval step and no channel-level permission. [WORKFLOW] |
| GET | /messaging/dispatches | Messaging:view | All dispatches from all creators (MS:526-543). [UNSCOPED-LIST] |
| GET | /messaging/dispatches/:id | Messaging:view | MS:624. |
| GET | /messaging/dispatches/:id/recipients | Messaging:view | **Exposes recipient `address` (phone or email) and name** (MS:647-649). [UNSCOPED-LIST] |
| POST | /messaging/dispatches/:id/cancel | Messaging:manage | Any manager can cancel anyone's scheduled dispatch (MS:657-665). |
| POST | /messaging/dispatches/:id/retry-failed | Messaging:manage | Resends the failed recipients, which costs money for SMS (MS:668-679). |

### Implicit scoping / visibility
- **None.** `message_dispatch` has no `branch_id` (schema.prisma:3847-3868). Audience CHURCH = every active user in every branch, optionally with guests and consenting visitors (audience.ts:134-152). DEPARTMENTS accepts any department IDs; the sender does not have to belong to them (audience.ts:128-131). PEOPLE accepts any user IDs (audience.ts:124-125).
- Lists show every creator's dispatches. `created_by` is stored (MS:422) but never used for filtering.

### Workflow / approval decisions
- Sending is decided purely by Messaging:manage (messagingRoute.ts:22). There is no draft→approve→send step, no per-channel right (SMS costs money, email and in-app are free), no audience restriction (own department only vs church-wide), and no spend cap. Scheduling is the same right (MS:410, 420).
- Automatic sends (welcome on member creation, birthdays) are system jobs (MS:252, 295). Toggling them is Messaging:manage (MS:60).

### Candidate action permissions
- `messaging.send_sms` / `send_email` / `send_in_app` (per channel): POST /dispatches (MS:401)
- `messaging.send_church_wide` vs `send_to_own_departments` vs `send_to_people`: audience.ts:36
- `messaging.include_visitors_guests`: audience.ts:52-53
- `messaging.schedule` / `cancel_scheduled`: MS:410, 657
- `messaging.retry_failed`: MS:668
- `messaging.edit_templates` / `toggle_automations`: MS:134, 60
- `messaging.view_recipient_contacts`: MS:631-655
- `messaging.view_birthdays`: MS:341

### Gaps
- **High: Bulk SMS has no audience, branch or channel restriction and no approval.** Any Messaging:manage holder (even one granted in a single branch, when an active branch is selected) can SMS the whole organisation across branches (audience.ts:134-152; messagingRoute.ts:22).
- **Medium: View-only users see recipient phone numbers and emails** (MS:647-649), plus birthdays and ages org-wide (MS:341-359).
- **Medium: There is no branch dimension in the data model** (schema.prisma:3847). Multi-branch admins cannot be limited to their branch.
- **Low: Cancel and retry are not limited to the creator** (MS:657, 668).

## Module: sermons (/sermons)

### Routes
Route file: `src/modules/sermons/sermonRoute.ts`. Controller: `sermonController.ts` (SC). Service: `sermonService.ts` (SS). `attach_sermon_management` is a non-rejecting probe on merged permissions (AUTH:2260-2280). Members get published sermons only (SC:21-23).

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /sermons/tags | auth-only | sermonTagService.ts:66. |
| GET | /sermons/series | auth + probe | Published only unless the caller is a Sermons manager. Branch via `getBranchScopedWhere` (SS:205-214). [IMPLICIT-SCOPE: branch] |
| GET | /sermons/series/:id | auth + probe | SS:231. No branch check. |
| POST | /sermons/series | Sermons:manage | `branch_id` from body or query (SC:57-63). |
| PUT | /sermons/series/:id | Sermons:manage | SS:244. No branch check. |
| DELETE | /sermons/series/:id | Sermons:admin | SS:241. No branch check. |
| GET | /sermons/ | auth + probe | SS:308-327. [IMPLICIT-SCOPE: branch] |
| GET | /sermons/:id | auth + probe | Drafts are hidden from non-managers (SS:359-365). |
| POST | /sermons/ | Sermons:manage | SS:269. |
| PUT | /sermons/:id | Sermons:manage | SS:369. |
| POST | /sermons/:id/publish | Sermons:manage | SS:434-444. [WORKFLOW] |
| POST | /sermons/:id/unpublish | Sermons:manage | SS:434. [WORKFLOW] |
| DELETE | /sermons/:id | Sermons:admin | SS:431. |

### Implicit scoping / visibility
- Draft vs published depends on the probe (SC:21-23; SS:53, 320, 365). Branch filter on lists only (SS:214, 327). `created_by` is stored (SS:199, 297) but never used, so there is no own-records editing.

### Workflow / approval decisions
- Publishing needs Sermons:manage, the same right as editing (sermonRoute.ts:52-61). There is no separate publish or approve step.

### Candidate action permissions
- `sermons.publish` / `unpublish`: SS:434
- `sermons.manage_series`: route 26-40
- `sermons.view_drafts`: SC:21

### Gaps
- **Medium: Mutations by ID are not branch-checked** (SS:241, 244, 369, 431, 434). A manager working in branch A can change branch-B sermons.
- **Low: The probe uses merged permissions,** so a manager in any branch sees drafts in every branch (AUTH:2271-2274).
- **Low: Publish cannot be separated from edit.**

## Module: promotions (/promotions)

### Routes
Route file: `src/modules/promotions/promotionRoute.ts`. Controller: `promotionController.ts` (PC). Service: `promotionService.ts` (PS). Alias chain: Promotions → Community → Announcements (AUTH:62).

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | /promotions/active | auth-only | Published promotions within their date window, in the user's **home** branch or with null branch (PS:223-244). [IMPLICIT-SCOPE: branch] |
| GET | /promotions/ | Promotions:view | Branch via `getBranchScopedWhere` (PS:81-89). |
| POST | /promotions/reorder | Promotions:manage | Reorders **any** IDs across branches; global `sort_order` (PS:200-212). |
| GET | /promotions/:id | Promotions:view | PS:109. No branch check. |
| POST | /promotions/ | Promotions:manage | Created as DRAFT (PS:59-75). |
| PUT | /promotions/:id | Promotions:manage | PS:115. |
| POST | /promotions/:id/publish | Promotions:manage | PS:151-160. [WORKFLOW] |
| POST | /promotions/:id/unpublish | Promotions:manage | PS:184. [WORKFLOW] |
| POST | /promotions/:id/archive | Promotions:manage | PS:169. [WORKFLOW] |
| DELETE | /promotions/:id | Promotions:admin | PS:112. |

### Implicit scoping / visibility
- The member carousel uses the home branch (PS:241). The admin list uses the request branch (PS:88). By-ID routes are unscoped.

### Workflow / approval decisions
- Publish, unpublish and archive all use Promotions:manage (promotionRoute.ts:39-53). There is no approval. Promotions inherit from Community or Announcements when not set explicitly (AUTH:62), so a Community manager can publish home-screen promotions by default.

### Candidate action permissions
- `promotions.publish` / `unpublish` / `archive`: PS:151, 184, 169
- `promotions.reorder`: PS:200

### Gaps
- **Medium: Promotions:manage is inherited from Community or Announcements** (AUTH:62). Community moderators gain the right to publish home-screen promotions unless Promotions is explicitly set to No_Access.
- **Medium: By-ID mutations and reorder have no branch check** (PS:112-200).
- **Low: Publish cannot be separated from edit.**

## Domains checked in this slice
Appointments (aliases Appointments → Members, AUTH:20), Community (→ Announcements, AUTH:55), Promotions (→ Community → Announcements, AUTH:62), Sermons (no fallback, AUTH:56), Messaging (no fallback, AUTH:66). None of these modules uses a borrowed permission. Appointments falling back to **Members** is the notable alias: a Members:Can_Manage role with no explicit Appointments key can manage and delete appointments.

---

# Part 3: Cross-cutting

## 3.1 Domain coverage (backend checks vs the Frontend canonical list)

The Frontend's `CANONICAL_PERMISSION_DOMAINS` is in Frontend `src/utils/accessControl.ts:15-46`. It lists 27 domains, including the retired `Announcements`. **Every domain the backend checks appears in it.** The problems are in persistence, fallbacks and usage:

| Domain | Backend guard usage | Storable via the access-level API? | Backend fallback | Frontend fallback (accessControl.ts:121-137) | Note |
|---|---|---|---|---|---|
| Members | user, appointments/visitors fallback, convert-visitor | yes (required) | — | — | |
| Membership_Management | **No route guard uses it.** It is read only by services (rides, join requests, workspaces, department reports) through `permissionResolver` | yes | Members | Members | The guest-to-member decision uses Members instead (userRoutes.ts:106) |
| Departments | department routes, department reports | yes (required) | — | — | |
| Positions | position routes | yes (required) | — | — | |
| Access_rights | access routes, give-access | yes (required) | — | — | Also the last-resort fallback for Financials, Giving, Settings, AI and Reports |
| Asset | asset routes | yes (required) | — | — | `can_view_asset` is unused; the scoped guard is used instead |
| Events | event routes | yes (required) | — | — | |
| Requisition | requisition routes | yes (required) | Requisitions | — | Services bypass the alias map (F1). `admin` is unused |
| Program | program routes | yes (required) | — | — | Program view is unused |
| Life Center | lifecenter routes | yes (required) | — | — | The key contains a space |
| Visitors | visitor routes, /user/guests | yes | **Members** | none | **Drift**: the Frontend hides Visitors from a Members-only role that the API allows |
| Appointments | appointment routes | yes | **Members** | none | **Drift** |
| Church_Attendance | attendance routes | yes | **Events** | none | **Drift** |
| Theme | theme routes | yes | **Program** | none | **Drift**. There is no view guard |
| Financials | financials | yes | **Access_rights** (and `permissionResolver` uses Finance/Finances instead) | none | **Drift**, plus two backend tables that disagree |
| Giving | givingoption | yes | Giving_Options, Financials, Access_rights | Financials | Partial drift |
| Pledges | pledges | yes | Pledge | — | |
| Marketplace | market, product, orders | yes | **Program** | none | **Drift** |
| School_of_ministry | program (manage) | yes | **Program** | none | **Drift**. View is unused |
| Settings | settings, branches, devices, finance configs | yes | **Access_rights** | none | **Drift**. Borrowed widely |
| AI | ai | yes | **Settings, Access_rights** | none | **Drift**. Settings:view gives AI:view, which gives cross-domain data reads (F4) |
| Community | community | yes | Announcements | Announcements | |
| Announcements | (alias only) | yes | — | — | Retired |
| Sermons | sermons | yes | — | — | `can_view_sermons` is unused |
| Promotions | promotions | yes | Community, Announcements | Community, Announcements | |
| Messaging | messaging | yes | — | — | `/user/send-emails-to-user` bypasses it |
| Reports | event and department reports | **NO** (accessLevelController.ts:23-55, 445-447). *Fixed 2026-10-25: now stored* | Settings, Access_rights | Settings, Access_rights | **It cannot be set explicitly, so it always equals Settings** |

### Modules or capabilities with no domain of their own

| Module | Current gate | Evidence |
|---|---|---|
| rides | protect only, with a service check on the **legacy** `user.access` against Membership_Management:manage. *2026-10-25: now its own `Rides` domain (falls back to Membership_Management); the check still reads the legacy `user.access`* | rideRoute.ts:49-59; rideService.ts:40, 1102-1110 |
| liveStream | protect only (read-only status) | liveStreamRoute.ts |
| devices (biometric) | borrows Settings | devicesRoute.ts:13-36 |
| notifications | self-scoped, protect only. Admin/system recipients come from the legacy `user.access` | notificationService.ts:1511-1530 |
| uploadFile | protect only | uploadRoute.ts:35 |
| orders / products | Marketplace, plus public storefront routes | F3 |
| eventReports | Events/Reports through the service; approve and return are **protect-only at the route** | eventReportRoute.ts:64-66; eventReportService.ts:2167-2173 |
| branches | borrows Settings | branchRoute.ts:19-42 |
| workspaces | a data field `access_level.workspaces`, not a permission domain | schema.prisma:492; F4 |
| departmentJoinRequests | Membership_Management, or the hardcoded department head, read from the legacy `user.access` | joinRequestController.ts:36-54, 82 |
| finance configs (receipt, payment, bank account, tithe split) | borrow Settings | F2 |
| realtime | socket auth plus per-topic authorizers | F3 |

## 3.2 Alias drift summary

**1. Two backend alias tables.** `AUTH:16-74` and `src/utils/permissionResolver.ts:1-9` disagree on Financials:

- AUTH maps it to `[Financials, Access_rights]`.
- The resolver maps it to `[Financials, Finance, Finances]`.

The resolver also lacks every other alias. It is used by rides, join requests, the Financials create/update guard, finance approver eligibility and `ListUsersLight`.

**2. Backend and Frontend fallback tables disagree** for Visitors, Appointments, Church_Attendance, Theme, Financials, Giving, Settings, AI, School_of_ministry and Marketplace. AUTH:20-46 has backend fallbacks for these that Frontend accessControl.ts:121-137 lacks. The comments in AUTH (:58-61, :69-72) say the tables "must agree", but only Promotions, Community, Reports and Membership_Management do.

**3. Requisition services** read `Requisition`/`Requisitions` keys directly, not through the alias map (requisition-approval-workflow.ts:111; F1).

**4. `Reports` cannot be persisted,** as described in 3.1.

**5. The legacy single-role column** `user.access_level_id` / `user.access` is still the authority in several places:

- rides (rideService.ts:1004, 1107)
- join requests (joinRequestController.ts:36-54)
- requisition auto-requesters (requisition-approval-workflow.ts:221-244)
- finance approver eligibility (Financials/service.ts:222-266)
- notification admin recipients (notificationService.ts:1511-1530)
- `ListUsersLight` permission filtering (userController.ts:2465-2473)

`syncLegacyAccessLevel` mirrors only the **home-branch** grant (branchAccessService.ts:68-97). So a user's rights in other branches are invisible to these checks, and these checks ignore the active branch.

**6. The JWT `permissions` claim** holds the home-branch grant as of login, for 12 hours (userController.ts:1396-1408, 1456-1459). It is the authority wherever a protect-only route reads `req.user.permissions`: requisitions (F1) and the finance guard (F2).

The redesign should end with **one resolver**, fed by **live per-branch grants**, used everywhere.

## 3.3 Implicit roles that decide rights outside the permission model

These are the de-facto "action permissions" and "visibility scopes" that already exist. The redesign must absorb them or make them explicit.

| Implicit role | Decides | Evidence |
|---|---|---|
| Department head (`department.department_head`) | Join-request approve and decline; HOD requisition approval step; department report preparer; hod workspace data; department scope; asset counts | AUTH:557-561; joinRequestController.ts:36-82; requisition-approval-workflow.ts:1086; departmentReportService.ts:220-225; workspaces/builders/hod.ts:115-123 |
| Department member (any `department_positions` row, or `user.department_id`) | `assigned_departments` scope; viewing assets and writing stock counts **without any Asset permission** | AUTH:614-626, 1536-1565; assetRouter.ts:273-278 |
| Position holder / named person in the requisition chain | Full `can_manage_requisitions` route access through the fallback | AUTH:1004-1012; requisition-approval-workflow.ts:2574-2667 |
| Single finance approver (`finance_approver_user_id`) | Approve and return finance records (the route needs only Financials:view) | Financials/route.ts:109, 141; Financials/service.ts:715-739 |
| Event report approvers | Approve and return (Reports:admin or Events:admin, merged across branches). The configured chain is not enforced | eventReportService.ts:2167-2173 |
| Life center member (any role) | Recording souls, meetings and offerings; seeing member contacts. `life_center_leader` is never used for authorization | AUTH:1664-1737 |
| Visitor `responsibleMembers` | View and manage of that visitor's visits, follow-ups and prayer requests | AUTH:1213-1267 |
| Instructor (JWT claim `instructor`) | All of School of Ministry manage on legacy routes; roster-scoped only on the new LMS routes | AUTH:1752-1763; lmsAccess.ts:14-31 |
| Appointment attendee / requester | Own bookings; attendee accept, decline, complete and no-show with no permission | AUTH:1323-1387; appointment-actions.ts:170 |
| Order owner | Own orders: view, retry, confirm and cancel | AUTH:1800-2040 |
| Community author / department | Edit own posts; see branch/department posts (home branch) | F6 |
| Pledge caller (`pledge_caller`) | **Nothing.** A natural "assigned records" scope that is unused | schema.prisma:3031; F2 |

## 3.4 Visibility: where data depends on the requester

**Own records (implemented):**

- members get-user, family and email (AUTH:1055-1068)
- appointments (AUTH:1381-1386; appointment-service.ts:1555)
- orders (AUTH:1847-1909)
- giving and pledges on the member side (F2: by `user_id`)
- notifications (F3)
- membership request (selfServiceController.ts:286)
- self-enroll (AUTH:1766)
- community own posts (F6)

**Department (implemented):**

- the Departments and one Church_Attendance route via `assigned_departments` (AUTH:1567-1657)
- assets for department members (AUTH:1510-1565)
- department reports and the hod workspace (F4)

**Life center:** the lifecenter routes via membership (AUTH:1664-1737).

**Responsible member:** visitors (AUTH:1213-1267). Note that `/user/guests` ignores it.

**Branch:** every list that uses `getBranchScopedWhere`. Members are never clamped (AUTH:352-355).

**Should be scoped but is not.** These are the by-id operations without `assertBranchAccessible`:

- members (userController.ts:427, 1152, 1214, 1714, 2683)
- positions (positionController.ts:82, 131, 240)
- department delete (departmentController.ts:401)
- events and attendance by id (F4: eventContoller.ts:1201, 1459, 4286, 4338, 4387)
- finance records, giving options, pledges, redemptions and config modules (F2)
- markets (F3: marketService.ts:55, 220, 259, 284)
- appointments by id (F6: appointment-service.ts:1583, 1597, 1719, 1744)
- sermons and promotions (F6)
- theme (F4)
- legacy asset update and delete (F1: assetController.ts:93-125, 223-234)
- requisition approval config (global, F1)
- visits, follow-ups, prayer requests and life center stats (F5)

**Org-wide by design but leaky:**

- orders lists (F3: orderService.ts:594, 987, 1534)
- contributions with no `branch_id` (F2: contributionService.ts:957-958)
- community moderation (F6)
- messaging audiences and birthdays (F6)
- AI read-only queries (F4)
- `ListUsersLight` (userController.ts:2419)
- `/user/guests` (selfServiceController.ts:355)

## 3.5 Master list of candidate ACTION permissions

Grouped by proposed domain. Module sections have the file:line evidence.

- **Members**
  - create (/user/register)
  - edit
  - delete
  - activate/deactivate (bulk too)
  - change membership status / confirm
  - link family
  - send password link
  - view contact details (PII vs directory)
  - grant login (give-access)
- **Membership_Management**
  - approve or decline guest membership requests
  - approve or decline department join requests (and bulk)
  - convert visitor to member (visitorRoute.ts:43)
  - convert soul won to member
- **Access_rights**
  - create, edit or delete roles
  - assign roles
  - edit workspaces
  - a grant ceiling
- **Branches** (new; borrows Settings today): create, edit, set default, delete
- **Departments**
  - create, edit, delete
  - assign head
  - manage members
  - assign positions
- **Requisition**
  - create/submit
  - approve
  - reject
  - edit as approver
  - delete own draft vs delete any
  - view all
  - configure the approval chain
  - send reminder
  - comment
  - **disburse / mark paid** (no status for this exists yet; schema enum stops at APPROVED, F1)
- **Asset**
  - create/edit
  - delete
  - change/undo status
  - write off as lost
  - **raise a repair requisition ("open a requisition from an asset")**
  - clear a repair requisition
  - start, cancel or close a stock check
  - count
  - reconcile (set-fix, mark-rest-missing)
  - request a recount / remind
- **Events**
  - create/edit/delete
  - manage series, types, reminders and online links
  - check in (kiosk); this needs auth (F4)
  - view registrations
  - export iCal
- **Church_Attendance**
  - record summary
  - edit/delete
  - import biometric
  - manage devices
  - attendance timing settings
- **Reports**
  - event reports: generate, export, approve, return, resubmit, comment, configure approval
  - department reports: prepare, submit, approve, return, remind, decide request, view executive summary, see member names
- **Financials**
  - create draft
  - **post / submit for approval**
  - approve
  - return
  - edit approved
  - delete
  - configure the approver
  - configure receipts, payment methods, bank accounts and tithe split (today under Settings)
- **Giving**
  - manage options and the settlement account
  - archive
  - view contributions and donor details
  - view the full account number
  - recheck payment (reconcile)
  - nudge donor
- **Pledges**
  - create/edit
  - record redemption
  - **delete redemption (reversal)**
  - credit online payment (reconcile)
  - remind pledgers
  - manage callers
  - view payer details
- **Marketplace**
  - manage markets (duplicate, restore)
  - manage catalog and taxonomy
  - publish product
  - view overview
  - create order for a member
  - **mark order paid**
  - fulfil order
  - cancel any order
  - edit order items
  - delete order
  - reconcile payments
  - refund (does not exist)
- **Rides** (new domain; borrows Membership_Management today)
  - view overview
  - cancel any offer
  - view and resolve reports
  - lift a block
  - manage pickup points and areas
- **School_of_ministry**
  - design curriculum
  - manage cohorts and classes
  - enroll others
  - decide applications
  - grade (rubric, overrides)
  - edit progress
  - activate assignments, set due dates, grant extensions
  - take session attendance
  - send announcements (including SMS)
  - issue certificates
  - manage the instructor roster
  - view reports
- **Life Center**
  - record souls won
  - record meetings and offerings
  - export meetings
  - remind the leader
  - assign members and leaders
  - manage roles
- **Visitors**
  - log visits
  - assign responsible members
  - assign and record follow-ups
  - manage prayer requests
  - convert to member
- **Appointments**
  - book on someone's behalf
  - confirm/accept
  - decline
  - suggest a time
  - complete
  - mark no-show
  - cancel own vs cancel any
  - reassign
  - remind
  - manage own vs others' availability
  - manage settings and reasons
  - delete
- **Community**
  - post church-wide or important posts
  - post to any department
  - pin
  - remove/restore
  - warn the author
  - view reports and anonymous authors
  - edit/delete any post
  - view the audit log
- **Messaging**
  - **send** per channel (SMS, email, in-app)
  - audience reach (own departments / chosen people / church-wide / include visitors)
  - schedule/cancel
  - retry
  - edit templates
  - toggle automatic messages
  - view recipient contacts
  - view birthdays
  - absorb `/user/send-emails-to-user` and the cohort announcements
- **Sermons:** create/edit, publish/unpublish, manage series, view drafts
- **Promotions:** create/edit, publish/unpublish, archive, reorder
- **Theme:** edit, activate/publish
- **AI**
  - manage credentials
  - chat
  - generate insights
  - **query data**, which must be bounded by the target domain's view and branch
  - view usage
- **Settings:** attendance timing, event-report exclusions, report config (should move to Reports), program eligibility, the system alert recipient

## 3.6 Security gaps ranked by severity

Module sections have the full evidence. "F1" to "F6" refer to the module sections in Part 2.

### Critical / High

1. **Unauthenticated member creation.** `POST /user/register` is public and is the dashboard's Add Member endpoint (userRoutes.ts:90; userService.ts:123-420; Frontend apiPost.ts:302). It accepts status, department and position placement, and converts visitors and souls.
2. **Unauthenticated attendance writes and member lookup.**
   - `POST /event/sign-attendance` creates users and attendance (eventRoute.ts:107; eventContoller.ts:2283-2305).
   - `GET /event/search-user` maps a phone number to a name and id (eventRoute.ts:108; eventContoller.ts:2772-2797).
3. **Password hashes returned to any signed-in user** via full user includes (F5):
   - enrolmentService.ts:212-217 (`include: { user: true }`)
   - courseService.ts:98-104
   - lifeCenterService.ts:437
4. **Privilege escalation in Access_rights:manage.** *(2026-10-25: ceiling, own-role lock and self-assignment block added; cross-branch editing of global roles still open.)* There is no grant ceiling and no self-assignment check, and roles are global, so they can be edited across branches (accessLevelController.ts:500-727, 845-900, 1110-1165, 1204-1260).
5. **Stale JWT permissions used for authorization.** On protect-only routes, `req.user.permissions` is the login-time, home-branch claim, valid for 12 hours (AUTH:972-975; userController.ts:1396-1408, 1459). Affected: requisitions (requisition-service.ts:450, 1997; requisition-redesign.ts:106) and the finance create/update guard (Financials/route.ts:12-55). Revoked rights keep working, and branch switching is ignored. The LMS `instructor` claim has the same issue (AUTH:1752).
6. **Requisition approver fallback grants all `can_manage_requisitions` routes,** including rewriting the global approval chain (`upsert-approval-config`) and listing every requisition (AUTH:1004-1012; requisition-approval-workflow.ts:2574-2667; requisitionRoute.ts:58, 83, 113). Any department head qualifies when the chain has an HOD step.
7. **AI:view gives cross-domain, cross-branch data reads** (users with emails, access levels, financials, visitors, orders) through `/ai/query-read-only`, and AI falls back to Settings (aiRoute.ts:76; aiReadOnlyContracts.ts:218-410; AUTH:44).
8. **LMS facilitator equals full School of Ministry manage on legacy routes.** On top of that:
   - learner impersonation through a body `userId` (programController.ts:298, 433, 517)
   - MCQ answer keys readable by any user (programService.ts:705-770, 1044-1065, 1433)
   - any user's learner data readable by id (F5)
9. **Visitor guard bypass.** An explicit `visitorId` beats the resource id, so a responsible member can read or modify any visit, follow-up or prayer request (AUTH:1185-1211; F5).
10. **Guest and member PII exposed to any logged-in member:**
    - `/user/guests` (AUTH:1236-1243; selfServiceController.ts:355-397)
    - `/user/list-users-light`, which also enables admin enumeration (userController.ts:2419-2600)
11. **Ride admin authorized from the legacy single role.** It has no privileged-user check and no branch, and the borrowed Membership_Management exposes rider phone numbers (rideService.ts:40, 1102-1110, 1313-1319).
12. **Community moderation is org-wide,** including the real authors of anonymous posts, for Community:view (communityModerationService.ts:52-75, 248-266; AUTH:2186-2193).
13. **Bulk messaging (SMS costs money) has no approval step, no channel split and no audience or branch limit** for Messaging:manage (messagingRoute.ts:22; audience.ts:124-152; schema.prisma:3847).
14. **Orders are not branch-scoped for admins** and carry billing PII (orderService.ts:594, 987, 1534).
15. **Requisition delete has no status check.** The owner or a manager can delete approved or in-progress requisitions with their history (requisition-service.ts:1634-1682).
16. **Souls won can be moved between life centers** by naming one's own life center in the body (AUTH:1714-1721; lifeCenterController.ts:516-538).

### Medium

17. **By-id operations skip branch checks across most modules** (3.4). A branch-limited admin can read and change other branches' records by id.
18. **Settings is per-branch, but most of what it controls is org-wide:**
    - attendance timing, report config, exclusions, eligibility and the alert recipient (F1)
    - branch creation and the default branch (branchRoute.ts:19-33)
    - finance configs (F2)
    - devices (F3)
19. **Single global finance approver.** Approve and return need only Financials:view at the route, the approver's own submissions are auto-approved, and approved records stay editable (Financials/route.ts:109, 141; service.ts:305, 451-460, 632-641, 715-739; schema.prisma:2483-2501).
20. **Giving:**
    - Contributions leak across branches when no `branch_id` is sent (contributionService.ts:957-958).
    - Giving options expose the full settlement `account_number` (GivingOption/service.ts:32-51).
    - Option edits have no branch check, which lets a branch-A manager re-point branch B's payouts (GivingOption/service.ts:238-425).
21. **Pledge redemption delete (a ledger reversal) needs only manage,** and pledges, payments and redemptions have no branch checks by id (redemptions/service.ts:19-21; F2).
22. **Event report approve and return are protect-only at the route,** and the configured approval chain is never enforced (eventReportRoute.ts:64-66; eventReportService.ts:2167-2173).
23. **The Church_Attendance `assigned_departments` scope covers 1 of 5 routes** (eventRoute.ts:183-223).
24. **Appointments:**
    - Manager checks use merged permissions (AUTH:707-733).
    - An excluded attendee's booking can be moved (AUTH:1395-1414).
    - The attendee role needs no permission (appointment-actions.ts:170).
    - Single-booking operations have no branch check.
25. **Department head is an implicit, ungoverned role** reachable through Departments:manage. A scoped Departments user can also create departments (AUTH:1594-1600).
26. **Asset reads and stock-count writes are open to any department member without the Asset domain** (AUTH:1536-1565; assetRouter.ts:273-278). Repair requisitions are created under Asset:manage alone (asset-redesign.ts:703-790).
27. **Marketplace:**
    - `mark paid` is a field edit with no actor recorded (orderController.ts:316; orderService.ts:1838).
    - GETs mutate state (orderService.ts:987, 1060).
    - The Paystack `callback_url` is an open redirect (orderService.ts:1973).
    - Public routes leak draft or deleted catalogue items (marketService.ts:171; productService.ts:348, 395, 449).
28. **`protect` accepts purpose-scoped JWTs** (the SSE stream token) as full bearer tokens (AUTH:937-978; notificationStreamAuth.ts:100).
29. **Join requests** use the legacy role and the second alias table, with no branch check by id (joinRequestController.ts:36-82).
30. **Exclusions are bypassed** by bulk and array member endpoints (userController.ts:3282, 3329, 3386, 3447).
31. **Facilitators can send cohort email and SMS without Messaging** (operationsController.ts:113-131).
32. **`/user/send-emails-to-user` is bulk email under Members:manage** (userController.ts:3682).

### Low

33. *(Fixed 2026-10-25.)* The `Reports` key cannot be stored (accessLevelController.ts:23-55), and backend and Frontend fallbacks drift (3.2).
34. Many guards are defined but unused, so Program, School_of_ministry, Sermons and Asset **view** have no server effect (1.7).
35. Upload is open to any member (uploadRoute.ts:35). `stats-users` and `list-positions` are protect-only.
36. `GET /user/set-default-passwords` is a state-changing GET (it is disabled in production, userController.ts:3656-3675).
37. Guard failures return 401, not 403. This conflates "session expired" with "forbidden" for clients (AUTH:1014). The Frontend relies on body markers to tell them apart.
38. Non-rejecting probes and service helpers use merged-branch permissions (AUTH:707, 754, 771, 2175, 2260).

## 3.7 Implications for the redesign

The evidence above suggests the following, in brief:

- **One resolver.** Retire `permissionResolver.ts`, `user.access` reads and the JWT `permissions` claim as authorities. Every check, including service-level checks, should go through a branch-aware function on live grants.
- **Separate action keys** from `view/manage/admin`, on top of the existing level as a default. For example `Requisition.approve`, `Financials.post`, `Messaging.send_sms`, `Membership_Management.convert_visitor` and `Asset.raise_requisition`. Map today's levels to default action sets so the migration is lossless.
- **Generalise `Scopes`** from `assigned_departments` to `own | department | life_center | branch | all` per domain. Make "department" mean **led** departments (head or a leadership position), not membership, unless that is configured.
- **Make the implicit roles explicit** as relationship-based grants: department head, approver positions, finance approver, instructor, life center leader, responsible member and pledge caller.
- **Enforce branch on by-id operations centrally,** for example a `loadScoped(model, id)` helper, rather than per service.
- **Make roles branch-aware, or at least ceiling-checked.** Forbid granting above one's own level, and forbid editing roles held in branches the caller has no role in.
- **Fix the unauthenticated and over-exposed endpoints before shipping any new model,** since they bypass any permission design: `/user/register`, `/event/sign-attendance`, `/event/search-user`, the password-hash includes, `/user/guests` and `/user/list-users-light`.
