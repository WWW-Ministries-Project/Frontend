# WWM Frontend: permission usage audit

Read-only audit of `../Frontend` on branch `feat/side-nav-groups` (2026-10-25). No repo files were changed.

Goal: inventory today's permission model, ahead of adding (a) **action permissions** (named capabilities) and (b) a **visibility scope** (own / my department / my life center / branch / all).

Layout:
- Sections 0–5 cover the model, routes, role editor, approvals and cross-cutting findings.
- Parts A–E, after them, give the full per-module tables: every action, its gate and file:line, data visibility, and gaps.

---

## 0. How the model works today (mechanics)

### Levels
| Item | Detail |
|---|---|
| Levels | `No_Access < Can_View < Can_Manage < Super_Admin` (`src/utils/accessControl.ts:3-7`) |
| Actions | `view / manage / admin`, mapped at `accessControl.ts:414-420` and `canAccess` at `:616-627` |
| Canonical domains (27) | `accessControl.ts:15-46`. 26 are live; `Announcements` is retired but kept for fallback |
| Fallbacks | `DOMAIN_FALLBACKS` (`:121-137`): `Membership_Management→Members`, `Giving→Financials`, `Community→Announcements`, `Promotions→Community,Announcements`, `Reports→Settings,Access_rights`. They apply only when the key is missing; an explicit `No_Access` still wins |
| Exclusions | `Exclusions: {domain: userId[]}`. Supported for Members and Appointments only (`:50-53`) |
| Scopes | `Scopes: {domain: "assigned_departments"}`. This is the **only** scope value (`:12`, `:427`). Supported for Departments and Church_Attendance (`:55-58`) |
| Explicit-grant domains | Community and Messaging (`:802`). Presets and "Set all" never switch them on |
| Legacy flags | `view_x / manage_x / admin_x` strings, parsed by regex (`:656-670`). `manage_users` maps to **Members manage** (`:400-401`) |

### Per-branch permissions
- `branch_access[]` holds one role per branch (`src/utils/userPermissions.ts:155-176`).
- `resolveBranchPermissions` uses the active branch's grant. With "All branches" it merges every grant **at the highest level**; for non-level keys (Scopes, Exclusions) the **first grant wins** (`src/utils/branchAccess.ts:12-55`).
- Consequence: in "All branches" mode, a HOD scope from branch A can be dropped by a broader grant from branch B, or the reverse, depending on array order.

### Route enforcement
- `RenderRoutes.jsx:7-11` redirects to `/home/access-denied` **only when the route has an `element`**.
- Parent routes without an element (Membership, Finance, Communication, Settings, Requisition, Events…) therefore never enforce their own `permissionNeeded`. The children decide.
- `routeAccess.ts:26-49` keeps a parent in the sidebar when any child is visible.

### Implicit component gates (`src/context/RouteAccessContext.tsx`)
The current route's requirement is turned into `canManageCurrentRoute` / `canAdminCurrentRoute`.
- `toManageRequirement` / `toAdminRequirement` (`accessControl.ts:739-796`) apply the action to **every** entry of an array requirement.
  - So on Reports routes (requirement = view on any of 9 domains), manage on **any** of Financials, Asset, Events… counts as "manage this route". This is cross-domain escalation by construction.
- These flags are read by:
  - `src/components/Button.tsx:36-45`: label regex. `/delete/` needs admin and `/edit/` needs manage; **every other label is ungated**.
  - `src/components/Action.tsx:34-41` and `src/pages/HomePage/Components/reusable/ActionButton.tsx:17-27`: Edit/Duplicate need manage, Delete needs admin.
  - `src/components/HeaderControls.tsx:46-47`: the header CTA needs manage.
- **Finding:** almost no current admin page uses these components. Members, Membership, Visitors, Life Center, Finance, Requisitions, Assets, Events, Attendance, Rides, Appointments, Reports, Communication, Community and Settings all use `UiButton` / `ActionMenu` / `BulkBar` from `MembershipManagement/components/membershipUi.tsx`, which carry **no gating**.
  - Each action is therefore either an explicit `useAccessControl()` check or protected only by the route.
  - The implicit gates still matter for: Marketplace, part of School of Ministry (`AllTopics`, `GradingPanel` "Edit"), `ViewEvents.jsx` and `AppointmentCard`.
  - Routes with no `permissionNeeded` (requisitions, `/member/*`) make `canManageCurrentRoute` **always true** (`RouteAccessContext.tsx:20-26` defaults, `:46-47`).

### Explicit gates
- `useAccessControl()` (`src/CustomHooks/useAccessControl.ts`) exposes `can`, `canView`, `canManage`, `canAdmin`, `hasPermission`, `getScope`, `isExcluded`, `getAccessLevel`.
- In the whole app, `getScope` is called in 2 places and `isExcluded` in 2 places (details in section 3).

### Backend-flag gates (the de facto action-permission system today)
| Area | Flags |
|---|---|
| Requisitions | `viewer.is_manager`, `viewer.is_approver`, current-step approver id |
| Finance | `finance_approver_user_id` |
| Assets | `viewer.can_manage`, `can_delete`, `stock.viewer.is_admin`, `department_keys` |
| Department / event reports | `report.permissions.can_edit / can_submit / can_approve / can_return / can_comment / can_decide / can_remind`, `viewer.is_leadership`, `hod_of` |
| Community feed | `me.canManage`, `me.canModerate` |
| School of Ministry | per-program instructor ability flags (saved, never read) |
| Home workspaces | queue items; the server picks which ones appear |

These are hard-coded per module and are not configurable in the role editor.

### Branch scope
- Every request carries `X-Branch-Id` (`src/axiosInstance.js:162-168`).
- That is the only universal visibility filter. No module sends "own / my department / my life center" filters except:
  - MyAppointments (`requesterId`)
  - the instructor portal (instructor id)
  - member `/my*` endpoints

---

## 1. Admin routes under `/home` (appRoutes.tsx)

Legend: **NONE** = `isPrivate` but no `permissionNeeded` (any logged-in user). **(parent)** = no element, so not enforced (see §0).

### Overview, membership, people
| Path | Name | permissionNeeded (resolved) | line | Flag |
|---|---|---|---|---|
| `` / `dashboard` | Home | isPrivate:false | 237-249 | Workspaces + widgets; queue actions ungated client-side (Part E) |
| `notifications` | Notifications | **NONE** | 250-255 | No domain exists (fine for a personal inbox) |
| `ai` | AI Console | AI view | 256-262 | Not a sideTab; reached from the Header (`Header.tsx:139`). Credentials and chat share AI:manage |
| `members` | Members | Members view | 263-269 | Duplicate of membership index |
| `membership` | Membership | Members view **(parent)** | 270-276 | Not enforced |
| `membership/` | Church Directory | Members view | 277-284 | |
| `membership/<churchDirectory>` | redirect | Members view | 285-296 | |
| `membership/departments` | Departments and Ministries | Departments view | 297-304 | Different domain under the Membership tab |
| `membership/management/*` (6 incl. default) | Membership manager, Member Confirmation, Visitor/Soulwon/Guest-to-Membership, Join requests | **Membership_Management manage** | 305-365 | Whole module is manage-only; no view level is used. Join requests also open to scoped Departments users inside the page (Part A) |
| `membership/analytics` | Analytics | Members view | 367-374 | Also shows visitor and souls-won data without checking Visitors or Life Center (Part A) |
| `membership/departments/:id` | Department Details | Departments view | 375-381 | |
| `members/manage` | Manage Member | Members manage + `MemberExclusionGuard` | 384-394 | Convert-to-member from Visitors, Membership manager and Life Center all land here, so a Members manage requirement is hidden |
| `members/:id` (+ `fam-info`) | Profile Details | Members view + exclusion guard | 395-415 | Profile edits (dept assign/remove) are Members-gated, not Departments |

### Rides, visitors, events, reports, attendance
| Path | Name | permissionNeeded (resolved) | line | Flag |
|---|---|---|---|---|
| `rides` | Ride to church | **Membership_Management manage (borrowed)** | 416-427 | No Rides domain. Same rule picks who gets safety reports |
| `visitors` (+ `""`, `guests`, `analytics`) | Visitors, Guests, Analytics | Visitors view | 428-460 | |
| `visitors/visitor/:visitorId` | Visitor | Visitors view | 461-467 | |
| `events` | Events | Events view **(parent)** | 468-475 | |
| `events/events`, `events/`, `analytics`, `all-events`, `event-schedules` | Scheduled Events, Events, Analytics, legacy, schedules | Events view | 476-514 | |
| `reports` | Reports | **REPORTS_MENU_ACCESS** = view on ANY of Reports, Departments, Membership_Management, Visitors, Events, Church_Attendance, Asset, Financials, Life Center (`Reports/utils/reportAccess.ts:8-20`) **(parent)** | 516-522 | Nearly every staff role sees Reports. The server filters |
| `reports/` | Reports Default | NONE, `redirectOnly` | 523-529 | |
| `reports/executive-summary` | Executive summary | Reports view (`EXECUTIVE_SUMMARY_ACCESS`) | 530-537 | Decisions use backend `viewer.is_leadership`, not Reports admin |
| `reports/department`, `department/:key` | Department reports | `DEPARTMENT_REPORTS_ACCESS` (same 9-domain OR) | 538-552 | Array requirement, so manage on any of the 9 domains counts as route manage |
| `reports/event-reports`, `:id` | Event reports | **Events view** | 553-567 | Approve/return from backend flags. Generating needs Events manage |
| `manage-event` | Manage Event | Events manage | 570-576 | |
| `events/events/view-event` | View Event | Events view | 577-583 | |
| `church-attendance` (+ `""`, `event-attendance`, `analytics`) | Attendance | Church_Attendance view | 584-616 | Department scope only shows a banner in EventAttendance (Part B) |

### Communication, appointments, requisitions, assets, finance
| Path | Name | permissionNeeded (resolved) | line | Flag |
|---|---|---|---|---|
| `communication` | Communication | **Theme view (parent)** | 618-625 | Wrong domain for the parent. Harmless only because it isn't enforced; the index redirect picks the first allowed child |
| `communication/theme-manager` | Annual Theme Manager | Theme view | 635-642 | |
| `communication/community` (+ `announcements` redirect) | Community | Community view | 643-658 | View reveals anonymous authors |
| `communication/promotions` | Promotions | Promotions view | 659-666 | Falls back to Community |
| `communication/sermons` | Sermons | Sermons view | 667-674 | |
| `communication/messaging` | Messaging | Messaging view | 675-682 | Bulk SMS is all under Messaging manage |
| `appointments` (+ `""`, `analytics`, legacy, `manage-availability`) | Appointments | Appointments view | 686-723 | Manage Availability needs only view at route level; writes need manage, so staff can't set their own availability |
| `appointments/settings` | Settings | Appointments manage | 724-731 | |
| `requests` (+ `""`, `staff_requests`, `analytics`, `request`, `request/:id`, `:id`) | Requisition | **NONE on every route** | 735-785 | Visibility is decided by backend `is_manager` / `is_approver`. Non-managers are bounced from `staff_requests` only after load. Analytics is open to all |
| `assets` (+ `""`, `reconciliation`, `analytics`) | Assets | Asset view | 786-818 | Writes use backend `can_manage` |
| `assets/count` | Stock check | **NONE** | 819-827 | Renders the full reconciliation component, which also loads the register overview (Part C) |
| `assets/manage-asset` | redirect | NONE | 828-833 | |
| `finance` | Finance | Financials view **(parent)** | 834-840 | Not enforced, so Giving-only or Pledges-only users reach their child pages (intended?) |
| `finance/` | Finance Manager | Financials view | 841-848 | |
| `finance/create` | New weekly record | Financials manage | 849-855 | |
| `finance/configuration` | Configuration | Financials manage | 856-863 | Settlement bank accounts are not here; they sit under Giving manage on Giving Options (Part C) |
| `finance/giving-options` (+ `:id`), `giving-contributions` | Giving | Giving view | 864-887 | |
| `finance/pledges`, `pledges/:id` | Pledges | Pledges view | 888-910 | |
| `finance/pledges/create`, `pledges/:id/edit` | | Pledges manage | 896-917 | |
| `finance/:id` | Weekly record | Financials view | 918-924 | Approve/return gated only by `finance_approver_user_id` |

### Life centers, marketplace, School of Ministry, settings
| Path | Name | permissionNeeded (resolved) | line | Flag |
|---|---|---|---|---|
| `life-center` (+ `""`, `:id`, `life-center-analytics`) | Life Centers | Life Center view | 927-964 | |
| `life-center/roles` | redirect | Life Center manage | 949-956 | |
| `market-place` (+ overview, markets, products, orders, analytics) | Market Place | Marketplace view | 967-1035 | |
| `<orderDetails>`, `<details>` | | Marketplace view | 1036-1057 | |
| `<addProduct>`, `<editProduct>` | | Marketplace manage | 1058-1079 | |
| `ministry-school` (element `SomDataProvider`) and **all 20 children** | School of Ministry | School_of_ministry view | 1081-1258 | Every route is view-only; writes are gated inside components. `Program` domain unused anywhere |
| `ministry-school/.../certificate` | View Certificate | **no isPrivate, no permission** | 1259-1263 | Demo data |
| `settings` | Settings | Settings view **(parent)** | 1264-1270 | No index redirect: Members-manage-only users get the Settings icon, then access denied |
| `settings/` | General configuration | Settings view | 1271-1279 | Sections mix Positions, Requisition, Settings and Reports domains |
| `settings/access-rights`, `manage-access`, `:roleId` | Access Rights / Role | Access_rights view | 1280-1301 | Edit needs Access_rights manage; delete needs admin (in page) |
| `settings/users` | Users | `manage_users` = **Members manage** | 1302-1309 | Route needs Members manage. Role changes inside also need Access_rights manage (`UsersPage.tsx:43`), but there is no self guard and no ceiling: you can change your own role or grant a role above yours (`UserDrawer.tsx:211-233`). A Members manager without Settings view sees the page but not the Settings landing |
| `settings/approvals`, `approval` | Approvals | Settings view | 1310-1324 | Edit gated per workflow by Requisition, Events or Financials manage (§4) |
| `access-denied`, `*` | | none | 1327-1336 | |

### Member portal
- `/member/*` (`appRoutes.tsx:1455-1765`) is all `isPrivate:false`.
- Leader and instructor tools here have **no route guard**:
  - `/member/life-center` (leader actions open to any member of the center, Part A)
  - the instructor portal and grading (any member can grade any cohort by URL, Part D)
  - `/member/appointments` (`canManageCurrentRoute` is always true)

### Route-level red flags
1. **Requisition has no route permission at all.** The `Requisition` domain only matters through `canManage("Requisition")` as a fallback for backend flags (`useRequisitionsData.ts:55`).
2. **Rides borrows Membership_Management manage.**
3. **Users page route uses Members manage.** Role assignment inside is correctly gated by Access_rights manage (`UsersPage.tsx:43`), but invite, reset password and deactivate ride on Members manage.
4. **Event reports use Events view.** Department reports use a 9-domain OR.
5. **Communication parent uses Theme**, and Membership parent uses Members. Neither is enforced anyway.
6. **`assets/count` and the certificate route are unguarded.**
7. **Every School of Ministry route needs only view**; all writes are gated inside components.
8. **Membership manager pages need manage just to look.** There is no view-only level for pipelines.

---

## 2. Role editor: what an admin can configure today

> **Update 2026-10-25 (after this audit).** The role editor now follows the WWM App v2 design. Per module it has:
> - **"What they can do"**: action checkboxes from `src/utils/permissionCatalog.ts`, pre-ticked by the level, with *Custom*, *On purpose* and *New feature* badges and "Reset to defaults".
> - **"Whose records they see"**: own / assigned / departments they lead / departments they belong to / life centers they lead / whole branch, as each module allows.
>
> It also:
> - enforces a ceiling (options above your own access are locked) and locks roles you hold
> - adds a **Ride to church** module (`manage_rides` on the route, falling back to Membership management) and marks **Programs** as being retired
> - updates the presets
> - renames the group *Engagement* to *Ministry & engagement*
>
> The "What is absent" list below describes the editor before this change; action and scope **enforcement** is still absent.

Files:
- `src/pages/HomePage/pages/Settings/access/RoleDetail.tsx`
- `access/RoleDialogs.tsx`
- `access/AccessRightsList.tsx`
- `access/workspacesModel.ts`
- `utils/settingsModel.ts`

### What can be configured
| Capability | Where | Notes |
|---|---|---|
| A level per module (None/View/Manage/Full) | `RoleDetail.tsx:101-119`, `MODULES` in `settingsModel.ts:34-61` | 26 modules in 5 nav groups. Copy: "View see records · Manage create and edit · Full also delete and change module settings" (`:513-516`). Many modules don't honour "Full = delete" (deletes at manage in Members, Visitors, Events, Appointments, Finance, School of Ministry, Communication; see parts) |
| "Set all to…" per group | `RoleDetail.tsx:526-548` | Skips explicit modules |
| Department scope checkbox, "Only their own departments" | `RoleDetail.tsx:121-142` | Only for `extra:"scope"` = Departments and Church_Attendance. Saved as `Scopes[key]="assigned_departments"` (`settingsModel.ts:162-172`). Enforcement on the client is very weak (§3) |
| Hidden people (exclusions) | `RoleDetail.tsx:143-174` | Members ("Hide these people's profiles") and Appointments. Appointments exclusions are **never read** on the client |
| Explicit-grant badge | `RoleDetail.tsx:175-182` | Community and Messaging |
| Start presets | `settingsModel.ts:95-134` | Read-only, Team manager (admin areas view-only), Head of department (Members view, Departments manage + scope, Positions view, Church_Attendance view + scope), Platform admin, Blank, Copy |
| Home workspaces per role | `RoleDetail.tsx:191-258`, `workspacesModel.ts:20-94` | `prelate`, `admin`, `finance`, `hod`, `generic`. Defaults are derived from levels (`deriveWorkspaces` `:84-94`). Saved instantly via `updateAccessLevelWorkspaces` (`RoleDetail.tsx:454-477`), separately from the permission draft |
| People in role (one role per branch) | `RoleDetail.tsx:569-630`, `AddPeopleDialog` | Branch-scoped grants. Cannot remove yourself (`:609`) |
| Edit name/description, duplicate, delete | `RoleDetail.tsx:652-665` | Manage gates edit and duplicate; admin gates delete (`:286-288`) |
| Gates on the editor itself | `canEdit = canManage("Access_rights")`, `canDelete = canAdmin("Access_rights")` | No guard against editing **your own** role, or granting levels above your own (escalation). Save applies "in every branch" (`:706`) |

### What is absent
- **No action/capability permissions.** Every module is a single 4-step dial. Capabilities such as approve requisition, send bulk SMS, convert visitor, post or approve the weekly finance record, open a requisition from an asset, export data, reveal anonymous authors, issue a certificate, grade, enroll, reconcile payments, manage settlement accounts or assign roles cannot be split from the module level.
- **No visibility scope beyond one value.** `ScopeMode` is only `"assigned_departments"`, offered on 2 modules. There is no own / my life center / branch / all choice, no scope for Requisition, Assets, Visitors, Life Center, Appointments, Events, Reports or Messaging, and no per-module data-row filter in the API layer.
- **No per-branch difference in role content.** Roles are global; only membership is per branch.
- **No delegation ceiling.** Access_rights manage can create a Super_Admin-everything role and assign it, including to themselves (Users page role select, `UsersPage.tsx:43`, `UserDrawer.tsx:211-233`; the role editor also lets you edit your own role).
- **No audit trail or "who changed this role" view** in the editor (Logs exist in General configuration, see Part E).
- **Approver/HOD/leader/instructor powers** come from positions, department head, life-center leader, instructor assignment and approval-chain membership. None appear in the role editor.

### MODULES vs CANONICAL_PERMISSION_DOMAINS vs sidebar
- `MODULES` (26) equals `ACCESS_LEVEL_DOMAINS` (26) equals `CANONICAL_PERMISSION_DOMAINS` (27) minus retired `Announcements`. All three are aligned.
- Domains with **no route or UI use**:
  - `Program`: no route or component checks `view_program` / `manage_program` (Part D). Dead dial.
  - `Theme`: used, but also mis-used as the Communication parent.

Sidebar tabs (`src/routes/sideNavGroups.ts:14-28`) against their permission:

| Sidebar tab | Permission behind it | Own domain? |
|---|---|---|
| Home | none (workspaces) | n/a: workspaces only |
| Reports | 9-domain OR / Reports | Partial: Reports domain covers only the executive summary; event reports use Events |
| Membership | Members / Departments / Membership_Management | Yes (3) |
| Visitors | Visitors | Yes |
| Life Centers | Life Center | Yes |
| Attendance | Church_Attendance | Yes (event attendance also uses Church_Attendance, not Events) |
| **Ride to church** | Membership_Management manage | **No** |
| Events | Events | Yes |
| Communication | Theme / Community / Promotions / Sermons / Messaging | Yes (5) |
| Appointments | Appointments | Yes |
| School of Ministry | School_of_ministry (`Program` unused) | Yes |
| Finance | Financials / Giving / Pledges | Yes (3) |
| **Requisition** | none on routes; backend flags | **Domain exists but routes ignore it** |
| Assets | Asset (view) + backend `can_manage` | Partial |
| Market Place | Marketplace | Yes |
| Settings | Settings / Access_rights / Members (Users) / Positions | Mixed |

Pages and features with **no matching permission**:
- Ride to church
- Event reports (borrow Events)
- Requisition analytics (open to all)
- every "Analytics" child (inherits the module's view; there is no separate analytics or export permission)
- Notifications (no domain)
- the AI console (has AI)
- Stock check (`assets/count`)
- the Home workspaces queues (backend decides)
- Users (borrows Members)
- Approvals (route uses Settings; edits use the module domain)
- the member-portal leader and instructor tools (no frontend permission; relies on JWT claims for nav only)

---

## 3. Data visibility: user-filtered vs everything

| Mechanism | Where used | Effect |
|---|---|---|
| Branch (`X-Branch-Id`, `buildBranchQuery`) | Everywhere (`axiosInstance.js:162-168`); explicit `branch_id` in Reports | Branch scoping only. "All branches" merges permissions at the highest level |
| `getScope("Departments")` | `MembershipManagement/pages/DepartmentsAndMinistries.tsx:43`, `DepartmentDetails.tsx:76` | Hides "Create department". Also *grants* join-request approve/decline to scoped users (OR with `Membership_Management` manage). **Does not** restrict which departments are listed or opened; the backend must |
| `resolveScope("Church_Attendance")` | `Attendance/EventAttendance.tsx:77`, `:331` | Banner only. Recording, editing, importing and "Record as official" stay church-wide. ChurchAttendance and AttendanceAnalytics ignore the scope |
| `isExcluded("Members")` | `routes/MemberExclusionGuard.tsx:25`, `Members/Members.tsx:244` | Hides View/Edit and blocks profile routes. Excluded people **still appear** in lists, counts and Excel exports; status change, inactivate and delete still work on them |
| `isExcluded("Appointments")` | **nowhere** | Configurable but not enforced on the client |
| Own records | MyRequisitions (owner-only edit/delete/submit); MyAppointments (`requesterId`); member `/my*` giving and pledges; AppointmentDrawer `canAct = canManage \|\| myId===attendeeId` (`AppointmentDrawer.tsx:61`) | Only a handful of places |
| Approver-scoped | Requisitions (`is_approver`, current-step approver id, `requisitionModel.ts:110`); Finance (`finance_approver_user_id`, `useFinanceData.ts:197`, `FinanceRecord.tsx:626`); reports (`report.permissions.*`, `hod_of`) | Backend-computed |
| HOD scoped | Assets stock check (`stock.viewer.department_keys`); Home "My department" workspace; department reports (`hod_of`) | Backend-computed |
| Instructor scoped | `InstructorProg` sends the current user id; nothing else checks ownership (Part D) | Weak |
| Life-center leader | Member portal `MyLifeCenter` always passes `leaderView` (Part A) | **Not** scoped to leaders |

Shows everything (within the branch) to anyone holding the module's view level:
- members directory, visitors, life centers
- events and registrants
- church attendance
- all appointments
- all rides
- all marketplace orders
- all School of Ministry programs, cohorts and learners (client-filtered by branch only; "All branches" shows all)
- all finance records, giving and pledgers
- the asset register (unless the backend scopes it)
- community (including anonymous authors)
- message history

Membership manager and Membership Analytics also load all visitors and souls won without checking Visitors or Life Center (`useManagerData.ts:63-65`).

---

## 4. Approval flows in Settings and how they interact with permissions

Files:
- `Settings/approvals/ApprovalsPage.tsx`
- `WorkflowDrawer.tsx`
- `approvalsModel.ts`
- `useApprovals.ts`

### The three workflows
**REQ: Requisition** (`approvalsModel.ts:134-154`, `:198-206`)
- `requesters`: an explicit whitelist of who may raise requisitions. "The API adds everyone whose role can manage Requisition on its own" (`:142-146`).
- Ordered `approvers` steps. Each step is `HEAD_OF_DEPARTMENT`, `POSITION` (position_id) or `SPECIFIC_PERSON` (user_id) (`:20-24`, `:189-196`).
- Also: notify list, similar-item lookback days, reply SLA (1–30 days, with daily overdue reminders, `:264-269`), and `is_active`.

**REP: Event report** (`:156-170`, `:208-213`)
- Ordered approver steps, plus a separate `finance_approver` for the financial section, a notify list and `is_active`.

**FIN: Finance records** (`:173-185`, `:215-219`)
- A single `finance_approver_user_id`, a notify list (pool limited to people with Financials view, `useApprovals.ts:97`, `WorkflowDrawer.tsx:156`, `:257`) and `is_active`.

### Gating
- Route `settings/approvals` needs **Settings view** (`appRoutes.tsx:1310-1317`).
- Editing each workflow needs manage on a *different* domain: `EDIT_DOMAIN = { REQ: "Requisition", REP: "Events", FIN: "Financials" }` (`ApprovalsPage.tsx:15`, `:119`, `:223-241`).
  - A Requisition, Events or Financials manager without Settings view can't reach the page.
  - A Settings viewer sees all chains read-only.

### Interaction with permissions
1. **Approval rights live outside the role system.** Approvers are positions, department heads or named people. The frontend never checks a permission before approve/reject/return; it trusts backend flags (`is_approver`, current-step approver id, `finance_approver_user_id`, `report.permissions.can_approve`).
2. **Raising a requisition** is controlled by the REQ `requesters` whitelist plus "Requisition manage". The UI doesn't check either; routes are ungated and the department picker lists every department (`RequisitionDialogs.tsx:218`, Part C).
3. **Finance segregation-of-duties gap.** Anyone with Financials manage can make themselves the finance approver, then approve, edit approved records and "Save and approve" their own record (Part C: `useFinanceData.ts:197`, `FinanceRecord.tsx:626`).
4. **Same pattern for event reports.** An Events manager edits the REP chain and also generates reports.
5. **Department reports are not in Approvals.** Sign-off is defined in General configuration › Reports (Settings manage) and by backend `viewer.is_leadership` / `hod_of`. `can_decide` is unused; Executive Summary decisions use `is_leadership` (Part B).
6. **Home workspace queues** (`queueActions.ts`, Part E) let users approve or reject requisitions, approve or return finance records and department reports, publish sermons, approve join requests and assign visitors, with **no frontend permission check**. The server decides which items show.
7. **Asset → requisition** ("Raise repair requisition", `AssetManager.tsx:442`, `:821-845`) creates and submits a requisition using only the Assets `can_manage` flag. It bypasses the REQ requester whitelist on the client.

To plan action permissions: map "approve" capabilities to the chain (approver step) rather than the role. Use action permissions for *override / view-all / configure-chain*, and check them separately from module manage.

---

## 5. Cross-cutting gap list (prioritised)

### Privilege escalation and segregation of duties
- Access_rights manage can raise its own access: there is no self guard or ceiling on role assignment (`UserDrawer.tsx:211-233`), and the role editor lets you edit your own role.
- The Users route itself only needs Members manage, which covers invite, reset password and deactivate (Part E).
- Finance: approver self-assignment and self-approval.

### Delete level is inconsistent
"Full = delete" is what the editor promises, but deletes need only manage in:
- Members (single and bulk; bulk has no type-to-confirm)
- Visitors
- Life Center roles
- Events (occurrences, series, catalogue)
- Appointments reasons
- Finance drafts, config lines, pledges, pledgers
- School of Ministry (programs through instructors)
- Themes, Promotions, Sermons, Series
- Marketplace product types and categories

Admin is required in: Departments, Life Centers, Church attendance, Branches, Positions, Access rights, most of Marketplace.

### Exports are ungated or view-only
- Members Excel (includes excluded people)
- Visitors
- Life Center CSV ×4
- event registrants
- check-ins
- appointments
- ride roster
- analytics CSVs
- report PDF/DOCX
- marketplace orders (with contact info)
- giving contributions (with emails)
- pledgers (with phones)
- requisition CSV
- asset register

Candidate action: `export` per module.

### Sending messages or notifications is bundled into manage
- bulk SMS, email and push (Messaging manage, no audience scope)
- event reminders, appointment reminders, report reminders
- pledge reminders, donor retry messages
- ride cancellations

### Conversions cross domains
Visitor, soul won or guest to member always ends at Members manage (`ManageMember`). Only Life Center checks first (`LifeCenterDetail.tsx:130`).

### Borrowed domains
Rides, Users, the Communication parent, event reports, the Reports menu, and the Requisition routes (none).

### Scope is cosmetic on the client
Department scope only hides "Create department" and shows an attendance banner. Appointments exclusions are unused. Members exclusions leak through lists and exports.

### Member-portal privileged tools are unguarded
Instructor grading, life-center leader actions and appointment edit.

### School of Ministry
- Enroll, unenroll and bulk status are open to view-only users behind a localStorage-overridable LMS flag (`AllStudents.tsx:352`, `:373-384`).
- Grading is ungated (`GradingPanel.tsx:391-433`).
- Instructor ability flags are saved but never read.

### Marketplace
"Reconcile payments" (a Hubtel mutation) and Export are ungated (`OrdersPanel.tsx:344-353`). "Mark paid" is not separated from fulfilment.

### Community
View reveals anonymous authors (`CommunityManager.tsx:283` etc.). All moderation is at manage, and there is no ban.

### Requisition
- Approve and reject come only from backend flags.
- No withdraw, cancel, return or manager override.
- Analytics is open to all.
- The department is unrestricted.

### Rides
Membership_Management manage covers cancel rides, resolve safety reports, lift blocks and export phone numbers.

### "All branches" merge
Scopes and exclusions are taken from the first grant, while levels take the highest. This can silently widen or narrow scope.

### Candidate action-permission catalogue (from the parts)
| Module | Candidate actions |
|---|---|
| Members | export, delete, change status, assign department, convert to member |
| Membership manager | confirm member, approve join request, decide guest request |
| Visitors | convert, assign follow-up, export |
| Life Center | record meeting, change leader, export |
| Departments | change head, add/remove members |
| Events | publish, send reminders, export registrants, generate report |
| Attendance | record official, import, reclassify past |
| Appointments | manage own availability, view all bookings, export |
| Reports | submit, approve/return, decide (exec summary), remind |
| Rides | cancel ride, resolve safety report, lift block |
| Communication | send SMS / email / push, schedule, retry paid sends, edit auto-templates, reveal anonymous author, moderate, ban |
| Finance | post weekly record, approve record, edit approved, set approver, manage settlement accounts, message donors, export |
| Requisition | raise, approve, view all, override, remind |
| Assets | raise requisition from asset, assign, dispose, reconcile, stock-check |
| Marketplace | record payment, reconcile payments, fulfil order, export orders |
| School of Ministry | enroll, decide application, grade, publish assessment, take attendance, announce, issue certificate, edit curriculum, manage instructors |
| Settings | assign roles, reset password, invite, manage branches |
| AI | manage credentials |

### Candidate scopes
| Scope | Applies to |
|---|---|
| own | requisitions, appointments, follow-ups, instructor cohorts |
| my department | requisitions, assets, attendance, department reports, members directory, messaging audience |
| my life center | life centers, souls won, members |
| branch / all | everything |

---

# Per-module detail (Parts A–E)

Each part was produced by reading every file in its directories. Some line numbers are marked approximate (~). `DepartmentDetails.tsx` and `LifeCenterDetail.tsx` line numbers reflect the working tree.


---

# Part A — People modules (Members, Membership, Departments, Visitors, Life Center)

Paths below are relative to `src/pages/HomePage/pages/` unless they start with `src/`.

**Important shared fact:** none of these modules use `components/Button.tsx` label regex, `Action.tsx`, `ActionButton.tsx` or `HeaderControls`. They all use `UiButton` / `ActionMenu` / `BulkBar` / `DialogShell` from `MembershipManagement/components/membershipUi.tsx` (lines 128, 484, 534, 752). These are plain `<button>`s with **no route-derived gating at all**. So every gate in this part is either an **explicit `useAccessControl()` check**, or there is **NO gate** (only the route requirement applies). The one exception is `VisitorManagement/Components/VisitorForm.tsx:483-490`, which uses `<Button value="Submit"/"Cancel">`. That file is only used by the public `src/pages/Registration/VisitorRegistration.tsx`, so it is out of scope.

Branch scoping is global. `src/axiosInstance.js:162-169` adds an `X-Branch-Id` header from the active branch to every request, and `useFetch` refetches when the branch changes. Some calls also pass `buildBranchQuery` explicitly (noted below).

---

### Members (Directory, Profile, ManageMember)

#### Routes
- `/home/members` and `/home/membership` "" (Church Directory) → `Members` (`view_members`).
- `/home/members/manage` → `ManageMember` (`manage_members`), wrapped in `MemberExclusionGuard`.
- `/home/members/:id` → `ProfileDetails` → `AdminMemberProfile` (`view_members`), wrapped in `MemberExclusionGuard`.
- `/member/profile` → `ProfileDetails` → `MemberPortalProfile` + `MemberInformation` (isPrivate false, read-only own profile).

Mismatches:
- `ManageMember` (manage_members) is also the target of the "Convert to member" flows in Visitors, Membership manager and Life Center (see those sections). A user with manage_membership_management / manage_visitors but no manage_members is bounced to access-denied when converting.
- The parent `/home/membership` route has `permissionNeeded: view_members` but no element. `RenderRoutes.jsx:9-13` only checks routes that have an element, so the parent requirement is **not enforced** on its children. For example, Departments needs only `view_departments`.

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Export to Excel (whole filtered view, up to EXPORT_TAKE) | Members/Members.tsx:475-482 (fn 406-427) | **NOT GATED** (view_members) | Bulk PII export available to every viewer. |
| Add Member | Members/Members.tsx:483-490 | explicit `canManage("Members")` | |
| Row: View profile | Members/Members.tsx:283 | `isRestricted` (backend `member.is_restricted` flag OR `isExcluded("Members", id)`) | |
| Row: Edit details | Members/Members.tsx:284-291 | `canManage("Members")` + not restricted | |
| Row: Confirm membership | Members/Members.tsx:292-300 | `canManage("Members")` only | Not hidden for restricted/excluded members (only View/Edit check `restricted`). |
| Row: Mark as functional member | Members/Members.tsx:301-309 | `canManage("Members")` | Same: not blocked for excluded members. |
| Row: Change status… | Members/Members.tsx:310-314 | `canManage("Members")` | Not blocked for excluded members. |
| Row: Reactivate / Mark inactive | Members/Members.tsx:315-323 | `canManage("Members")` | Not blocked for excluded members. |
| Row: Delete member | Members/Members.tsx:324-329 | `canManage("Members")` (**manage, not admin**) | Irreversible ("can't be undone", DirectoryDialogs.tsx:231). Not blocked for excluded members. |
| Bulk bar (whole bar) | Members/Members.tsx:549-555 | `canManage("Members")` | Selection checkboxes also need `canManage` (587, 614; "Select this page" 561). |
| Bulk: Confirm membership | Members/Members.tsx:357-374 | `canManage("Members")` | |
| Bulk: Change status… | Members/Members.tsx:375-378 | `canManage("Members")` | |
| Bulk: Assign department | Members/Members.tsx:379-382 → DirectoryDialogs.tsx:169-185 | `canManage("Members")` | **Cross-domain**: changes department membership with the Members permission and marks members as ministry workers. |
| Bulk: Export selected | Members/Members.tsx:383-387 | `canManage("Members")` (only because the bar is gated) | |
| Bulk: Mark inactive | Members/Members.tsx:388-395 | `canManage("Members")` | |
| Bulk: Delete | Members/Members.tsx:396-400 → DirectoryDialogs.tsx:227-242 | `canManage("Members")` (**not admin**) | No `typeToConfirm` even for >10 records (CLAUDE.md convention); plain DialogShell. |
| Profile: Edit profile (banner) | Members/Components/profile/ProfileBanner.tsx:181-188, wired at AdminMemberProfile.tsx:265 | `canManage("Members")` | |
| Profile menu: Edit / Confirm / Functional / Change status / Reactivate-Inactivate / Delete | Members/Components/profile/AdminMemberProfile.tsx:215-247 | `canManage("Members")` (delete is manage, not admin) | |
| Profile: Advance stage (journey card) | ProfileAside.tsx:71, AdminMemberProfile.tsx:291 | `canManage("Members")` && active | |
| Profile: Assign department | ProfileSections.tsx:179-183 (AdminMemberProfile.tsx:279) | `canManage("Members")` | **Cross-domain** (Departments). |
| Profile: Remove from department (with undo) | ProfileSections.tsx:202-209; handler AdminMemberProfile.tsx:170-212 | `canManage("Members")` | **Cross-domain** (Departments). Label "Remove" is not gated by Departments permission. |
| Profile: Add child | ProfileSections.tsx:256-260 | `canManage("Members")` | Goes to ManageMember edit. |
| ManageMember: Save (create / update member) | Members/pages/ManageMember.tsx:50-55, submit 105-180; MembersForm.tsx:247-253 | route `manage_members` only | No explicit check inside the page. One page serves both create and edit, so create and edit cannot be separated. |
| ManageMember: "Is this member a ministry worker?" toggle + department/position rows | Members/Components/form/MemberFormSections.tsx:222-232; DepartmentPosition.tsx:106-157 | route `manage_members` | Grants worker/user status and department positions. **Cross-domain** (Departments) and privilege-relevant, with no separate gate. |
| ManageMember: branch select | MemberFormSections.tsx:164-199 | locked by `useBranchFieldState` (BranchSelectField) when a branch is active | |
| ManageMember: family add/remove/reset | Members/Components/form/FamilyMembersEditor.tsx:121, 143-150, 214-221 | route `manage_members` | Looks up other members via `fetchAMember` (line 41) with no exclusion check. |
| Photo upload | Members/Components/form/formFields.tsx:426-432 | route `manage_members` | |
| Member portal profile (`/member/profile`) | Members/pages/ProfileDetails.tsx:54-204, MemberInformation.tsx | own record only (`useUserStore.id` / token id, ProfileDetails.tsx:56-59) | Read-only. Only `mailto:` link (MemberInformation.tsx:155). |

`MemberExclusionGuard` (`src/routes/MemberExclusionGuard.tsx:16-25`): reads `id` param or `member_id` query. It blocks (redirects to `/home/access-denied`) when `isExcluded("Members", target)` is true and the target is not the current user.

#### Data visibility
- **`isExcluded` usages (complete list in these dirs):**
  - `src/routes/MemberExclusionGuard.tsx:25`: route-level block for `/home/members/manage?member_id=` and `/home/members/:id`.
  - `Members/Members.tsx:244`: `isRestricted` = `member.is_restricted` (backend flag) OR `isExcluded("Members", member.id)`. This hides only View/Edit and disables card click (283, 286, 617). Excluded members **still appear in the list, counts and Excel export**, and the status/inactivate/delete menu items still show.
  - No other file uses it. `MembersTable`/`MemberCard` only receive the `isRestricted` callback.
- The directory list (`fetchAllMembers`, Members.tsx:145-149) is filtered by status tab, search and filters only. There is no user/department/life-center filter. It is branch-scoped only through the `X-Branch-Id` header. Stats come from `fetchUserStats` with `active_only` (157-162).
- The profile (`fetchAMember { user_id }`, AdminMemberProfile.tsx:73-74) relies on the backend to refuse excluded members. Its "not found" copy (106) covers that case.
- No "my department members" or "my life center members" scope exists anywhere in the Members UI.

#### Gaps / observations
- **Delete member (single and bulk) needs only `manage`**, not admin (Members.tsx:327, bulk 396; AdminMemberProfile.tsx:244). That is inconsistent with Departments (admin to delete) and Life Center (admin to delete). Bulk delete has no type-to-confirm.
- **Export to Excel is ungated** (Members.tsx:475). It is a strong candidate for an `export_members` action permission, and it exports excluded members too.
- Exclusion is enforced only for open/edit. Status changes, inactivate and delete still target excluded members from the directory menu and bulk bar.
- Department assignment and removal are done under the Members permission in 3 places (bulk, profile assign, profile remove). Departments' own HOD scope does not apply here. This needs either an "assign department" action permission or a Departments check.
- Candidate action permissions: confirm membership / advance stage, change status, activate/deactivate, delete, export, assign department, toggle ministry worker.
- Visibility-scope candidates: directory limited to "my department(s)" (HOD) or "my life center" (leader). Today it is branch or all only.

---

### Membership manager (`/home/membership/management/*`, all `manage_membership_management`)

#### Routes
- MembershipManagement shell + member-confirmation, visitor-to-membership, soulwon-to-membership, guest-to-membership, join-requests.
- The shell (`MembershipManagement.tsx:27` → `components/manager/useManagerData.ts:60-78`) always fetches all members (`fetchAllMembers`), **all visitors (`fetchAllVisitors`)**, **all souls won (`fetchSoulsWon`)**, guest membership requests (with `buildBranchQuery`) and join requests (with `buildBranchQuery`, status ALL). This is a cross-domain read of Visitors and Life Center data under the Membership_Management permission.

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Confirm (row) | MembershipManagement/pages/MemberConfirmation.tsx:278-285 | route only, **no explicit check** | **Cross-domain**: Members-domain status change (`advanceMembers`, line 119). |
| Make functional (row) | MemberConfirmation.tsx:287-294 | route only | Cross-domain (Members). |
| Assign department (row) | MemberConfirmation.tsx:296-304 → manager/AssignDepartmentDialog.tsx:81-107 | route only | Cross-domain (Departments). |
| Bulk: Confirm selected / Make selected functional / Assign department | MemberConfirmation.tsx:239-253 | route only | |
| Open member profile | MemberConfirmation.tsx:270 | route + MemberExclusionGuard on target | |
| Convert to member (visitor) | pages/VisitorToMembership.tsx:124-126 (nav 56-61 → ManageMember with `sourceVisitorId`) | route only, but **target route needs `manage_members`** | Cross-domain. A membership manager without manage_members hits access-denied. |
| Convert to member (soul won) | pages/SoulwonToMembership.tsx:131-133 (nav 62-67, `sourceSoulWonId`) | same as above | Cross-domain (Life Center data → Members). |
| Approve guest membership request | pages/GuestToMembership.tsx:160-162, API 76 (`approveMembershipRequest`) | route only | Plain button; "Approve" is not regex-gated. |
| Decline guest request (reason) | GuestToMembership.tsx:163-165, API 90; DeclineReasonDialog | route only | |
| Approve join request (single / bulk with one position) | pages/JoinDepartmentRequests.tsx:322-324, bulk 294; API 171 / bulk 178 | route only | Cross-domain (Departments). HODs reach the same action through DepartmentDetails. |
| Decline join request (single / bulk) | JoinDepartmentRequests.tsx:325-327, bulk 296-298; API 205 / 211 | route only | |

#### Data visibility
- Every list is branch-scoped (header + explicit `buildBranchQuery` for guests/joins). Nothing is filtered by user or department. Join requests on this page are not limited to the departments the user heads.

#### Gaps / observations
- Every write in this module is gated only by `manage_membership_management`. Approve/Decline/Confirm/Convert/Assign have no individual action permissions. Natural candidates: `approve_join_request`, `approve_guest_membership`, `confirm_member`, `convert_visitor`, `convert_soul_won`.
- The convert flows depend on `manage_members` at the destination (inconsistent; see above).
- Reads Visitors and Life Center (souls won) data without checking those domains.

---

### Membership Analytics (`/home/membership/analytics`, `view_members`)

| Action | File:line | Gate | Notes |
|---|---|---|---|
| Filters toggle | MembershipManagement/pages/MembershipAnalytics.tsx:276 | n/a | |
| Follow-up list → open member profile | MembershipAnalytics.tsx:196; components/analytics/AnalyticsCharts.tsx:103 | route + exclusion guard on target | |

Data: `fetchAllMembers {take:5000}` (75), **`fetchAllVisitors`** (76), **`fetchSoulsWon`** (83) and `fetchJoinRequests` with `buildBranchQuery` (86-90). This is a cross-domain read of Visitors, Life Center and join requests with only `view_members`. Excluded members are aggregated with no filter. There is no export.

---

### Departments & Ministries (`/home/membership/departments`, details; both `view_departments`)

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Create department | MembershipManagement/pages/DepartmentsAndMinistries.tsx:170-181 | `canManage("Departments") && !isHodScopedAccess` | Only place where scope removes an action. |
| Edit department (card menu) | DepartmentsAndMinistries.tsx:128-135 → components/departments/DepartmentFormDialog.tsx:142-151 | `canManage("Departments")` | HODs with manage can edit, including changing the **department head** (`department_head`, FormDialog 132/146). The form sends `created_by: userId` (136); this is recorded, never checked. |
| Close / Reopen department | DepartmentsAndMinistries.tsx:136-141 (fn 113-125, `setDepartmentStatus`) | `canManage("Departments")` | Status change, open to HODs. |
| Delete department | DepartmentsAndMinistries.tsx:142-147 → DepartmentDeleteDialog.tsx:24 | `canManage && canAdmin("Departments")` | |
| Pending join-request counts on cards | DepartmentsAndMinistries.tsx:63-68, 201-203 | `canManage("Membership_Management") \|\| isHodScopedAccess` | **Cross-domain** check. |
| Details: Edit department | MembershipManagement/pages/DepartmentDetails.tsx:325-333 | `canManage("Departments")` | |
| Details: Add member | DepartmentDetails.tsx:334-340 → AddDepartmentMemberDialog.tsx:76-98 | `canManage("Departments")` | Marks the member as a ministry worker. |
| Details: Make head | components/departments/DepartmentDetailTabs.tsx:133-139 (handler DepartmentDetails.tsx:214-226) | `canManage("Departments")` | A HOD can hand headship to someone else. |
| Details: Remove member | DepartmentDetailTabs.tsx:141-143 (handler DepartmentDetails.tsx:228-253; also clears head) | `canManage("Departments")` | Not admin-gated. |
| Details: Join requests tab, Approve / Decline | DepartmentDetails.tsx:284-286, 378-388; DepartmentDetailTabs.tsx:316-323; JoinRequestDialogs.tsx:51 (approve), 131 (decline) | `canSeeJoinRequests` = `canManage("Membership_Management") \|\| getScope("Departments")==="assigned_departments"` | A **scope value is used as an action grant**: any HOD-scoped user can approve/decline, **even with only view on Departments**. |
| Positions tab | DepartmentDetailTabs.tsx (DepartmentPositionsTab) | read-only | |

#### Data visibility
- **`getScope` usages (complete list):**
  - `DepartmentsAndMinistries.tsx:43` → `isHodScopedAccess`. It is used for (a) hiding Create (170), (b) the subtitle "You can see the departments you lead." (165-167), and (c) `canSeeJoinRequests` (45).
  - `DepartmentDetails.tsx:76` → `isHodScopedAccess`. It is used only for `canSeeJoinRequests` (77).
  - No other file in these dirs calls `getScope`.
- **There is no client-side filtering by headed department.** The department list comes from the shell store (`HomePage.tsx:68-73`, `fetchDepartments` + `branchQuery`), so the "departments you lead" restriction relies entirely on the backend. DepartmentDetails never checks that `headId` (181) equals the current user, so a HOD with a URL to another department's id can open it if the backend returns it, and can then edit, make head, remove or approve.
- Join requests are fetched by `department_id` + branch (DepartmentDetails.tsx:150-158), then filtered client-side to that department (193-199).

#### Gaps / observations
- The HOD scope only removes "Create". Edit, close/reopen, change head, add/remove members and approve joins are all open to scoped users who have manage. Changing the head is a privilege-escalation-type action that should be distinct (`assign_department_head`).
- Join approve/decline is granted by scope OR a different domain (Membership_Management), not by a Departments action. It should become an explicit action such as `approve_join_request`, combined with scope.
- Remove member from department is manage-level everywhere (here, Members profile, Members bulk assign). There are 3 entry points with 2 different domain checks.

---

### Visitors (`/home/visitors*`: list, guests, analytics, detail — all `view_visitors`)

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Export to Excel | VisitorManagement/VisitorManagement.tsx:214-216 (fn 141-172) | **NOT GATED** | Contact PII export for every viewer. |
| Register visitor (header + empty state) | VisitorManagement.tsx:217-221, 313-317 → Components/VisitorDialogs.tsx:254-270 | `canManage("Visitors")` | |
| Card menu: Edit visitor | VisitorManagement.tsx:179 | `canManage("Visitors")` | |
| Card menu: Record follow-up | VisitorManagement.tsx:180-184 | `canManage("Visitors")` | |
| Card menu: Convert to member | VisitorManagement.tsx:185-189 → Components/useVisitorDialogs.tsx:82-90 (navigates to ManageMember) | `canManage("Visitors")`, destination needs **`manage_members`** | Cross-domain, inconsistent. |
| Card menu: Delete visitor | VisitorManagement.tsx:190-195 → useVisitorDialogs.tsx:93-103, 153-156 | `canManage("Visitors")` (**not admin**) | Irreversible (deletes visits and follow-ups). |
| Detail: Edit visitor / Record visit / Convert to member / Delete | VisitorManagement/pages/VisitorDetails.tsx:285-316 | `canManage("Visitors")` | Delete is manage-level. |
| Detail: Record visit / Record follow-up (section) | VisitorDetails.tsx:341-348 | `canManage("Visitors")` | |
| Detail: Remove visit | VisitorDetails.tsx:361-375 | `canManage("Visitors")` && >1 visit | |
| Detail: Mark follow-up completed / Edit follow-up | VisitorDetails.tsx:389-409 | `canManage("Visitors")` | **No ownership check**: any manager can complete or edit any responsible person's follow-up. |
| Detail: Assign responsible person | VisitorDetails.tsx:441-447 → VisitorDialogs.tsx:623-625 | `canManage("Visitors")` | |
| Detail: Remove responsible person | VisitorDetails.tsx:460-480 | `canManage("Visitors")` | |
| Guests: Review request | VisitorManagement/pages/Guests.tsx:161-163 | NOT GATED (navigation only) | Leads to guest-to-membership (`manage_membership_management`). A Visitors viewer without that permission gets access-denied. |
| Analytics | VisitorManagement/pages/VisitorAnalytics.tsx:162 (filters) | read-only | No export. |

#### Data visibility
- `useVisitorRecords` (VisitorManagement/utils/visitorHelpers.ts:169-176) fetches all visitors (take 5000), **all** visits and **all** follow-ups. The joining is done client-side. The only filter is branch (header) and month. The responsible person is displayed, but nothing filters to "visitors assigned to me".
- Guests: `fetchGuests` + `buildBranchQuery` (Guests.tsx:60-68).

#### Gaps / observations
- Delete visitor needs only manage. Export is ungated.
- "Visitors assigned to me" (responsible person) is the natural "own" scope for follow-up workers. It is not implemented, and follow-up edits have no ownership check.
- Convert to member needs a Visitors action permission (`convert_visitor`) and should not depend implicitly on `manage_members`.

---

### Life Center (`/home/life-centers*`: list / detail / analytics `view_life_center`; roles redirect `manage_life_center`; plus member portal `/member/life-center/:section?`)

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Manage roles (dialog) | LifeCenter/LifeCenterList.tsx:181 | `canManage("Life Center")` | |
| Roles: Add role / Delete role | LifeCenter/components/LifeCenterDialogs.tsx:845 (add, button 909), 858-864 (delete, button 893) | inherits `manage` (dialog only opened when manage) | Delete is **manage-level**, not admin (only locked roles excluded). |
| Export CSV (list) | LifeCenterList.tsx:182-184 (fn 153) | **NOT GATED** | |
| New life center | LifeCenterList.tsx:185-189, 279-282 → LifeCenterDialogs.tsx:126 | `canManage("Life Center")` | |
| Card menu: Edit details | LifeCenterList.tsx:314 → LifeCenterDialogs.tsx:122 | `canManage("Life Center")` | Includes setting the **leader** (`leaderUserId`, LifeCenterDialogs.tsx:118). |
| Card menu: **Record meeting** | LifeCenterList.tsx:315 → MeetingDialog (378-386, API LifeCenterDialogs.tsx:412) | **NOT GATED** | Any `view_life_center` user can record a meeting for any center in the list. |
| Card menu: Delete | LifeCenterList.tsx:316 (fn 136-151, typeToConfirm when >10 members) | `canAdmin("Life Center")` | |
| Detail: Record meeting (overview / meetings / header) | LifeCenter/LifeCenterDetail.tsx:234, 371-375, 703-707, 778-782 | `canRecord = canManage("Life Center") \|\| leaderView` (132) | |
| Detail: Export CSV (meetings) | LifeCenterDetail.tsx:368-370 | NOT GATED | |
| Detail: Export CSV (souls) | LifeCenterDetail.tsx:478-480 | NOT GATED | |
| Detail: Add soul won | LifeCenterDetail.tsx:481-485 → LifeCenterDialogs.tsx:640 | `canRecord` | |
| Detail: Mark as member (convert soul) | LifeCenterDetail.tsx:510-513, 542 (nav 453-460 → ManageMember) | explicit `canManage("Members")` (130) | Cross-domain, but correctly checked against the destination. |
| Detail: Change member role (select) | LifeCenterDetail.tsx:586-597 (API 560) | `canManage("Life Center")` | Making someone leader demotes the old leader (558-563). |
| Detail: Add member | LifeCenterDetail.tsx:602-605, dialog 863-875 (API LifeCenterDialogs.tsx:768) | `canManage("Life Center")` | |
| Detail: Remove member | LifeCenterDetail.tsx:620-623, 661-664 (fn 570-583) | `canRemove = canAdmin && !isLeader(m)` (598) | |
| Detail: Edit details | LifeCenterDetail.tsx:702, 773-776 | `canManage("Life Center")` | |
| Meeting drawer: Edit meeting | components/MeetingDrawer.tsx:35 (canEdit = canRecord, LifeCenterDetail.tsx:797) | `canRecord` | |
| Meeting drawer: Delete meeting | MeetingDrawer.tsx:34 (canDelete = admin, LifeCenterDetail.tsx:798; API 814) | `canAdmin("Life Center")` | |
| Analytics: Remind leader (sends notification) | LifeCenter/LifeCenterAnalytics.tsx:738-741 (API 412 `remindLifeCenterLeader`) | `canManage("Life Center") && !fixedCenterId` (182) | Send/notify action at manage level. |
| Analytics: Export CSV | LifeCenterAnalytics.tsx:553-555 | NOT GATED | |

#### Data visibility
- `useLifeCenterOverview` (LifeCenter/utils/useLifeCenterOverview.ts:48-57): its comment says it is "scoped to the active branch and, for leaders, to their own center". That scoping is **done by the backend**. The client sends only from/to/optional `lifeCenterId`.
- Writes attach `branch_id` from `useWriteBranchId` (utils/lcModel.ts:176-181).
- **Leader view (member portal)**: `src/pages/MembersPage/Pages/MyLifeCenter.tsx:19-26` loads the center via `fetchLifeCenterByUserId` (own user) and **always** passes `leaderView`. That sets `canRecord = true` (record/edit meetings, add souls won) for **any member of the center**, not only leaders. The route `/member/life-center/:section?` (appRoutes.tsx:1586-1590) is `isPrivate: false` with no `life_center_leader` check. The header only *hides the menu* using the `life_center_leader` token field (`src/pages/HomePage/Components/Header.tsx:126, 180`). The dashboard QuickAction "Join a Life Center" links to the same route (`DashBoard/Components/QuickActions.tsx:8`). This is a role/user-field gate in the menu only, so the actions themselves rely on the backend.
- Analytics with `fixedCenterId` (leader view) removes the center selector, remind and navigation (LifeCenterAnalytics.tsx:182, 544, 607, 743).

#### Gaps / observations
- **"Record meeting" in the list card menu is ungated** (LifeCenterList.tsx:315). The detail page gates the same action with `canRecord`, so the two are inconsistent.
- Member portal life center: leader-only actions are available to any center member who opens the URL. There is no client check of `life_center_leader` or the member's role.
- Role delete is manage-level, and setting the leader (via edit details or a role change) is manage-level. A distinct `assign_life_center_leader` would fit.
- Exports (3) are ungated. "Remind leader" is a notify action candidate.
- "My life center" scope exists only implicitly through the backend overview and the portal page. The admin list has no "centers I lead" filter.

---

### Cross-module summary of explicit checks used
- `canManage("Members")`: Members.tsx:77; AdminMemberProfile.tsx:68; LifeCenterDetail.tsx:130.
- `isExcluded("Members", …)`: MemberExclusionGuard.tsx:25; Members.tsx:244.
- `canManage/canAdmin("Departments")`: DepartmentsAndMinistries.tsx:41-42; DepartmentDetails.tsx:75.
- `getScope("Departments")`: DepartmentsAndMinistries.tsx:43; DepartmentDetails.tsx:76.
- `canManage("Membership_Management")`: DepartmentsAndMinistries.tsx:45; DepartmentDetails.tsx:77. The Membership manager pages themselves have **no** explicit checks.
- `canManage("Visitors")`: VisitorManagement.tsx:60; VisitorDetails.tsx:60.
- `canManage/canAdmin("Life Center")`: LifeCenterList.tsx:52-53; LifeCenterDetail.tsx:128-129; LifeCenterAnalytics.tsx:182.
- Backend flag: `member.is_restricted` (Members.tsx:244; profileHelpers.ts:22).
- User field: `useUserStore.id` (ProfileDetails.tsx:56, MemberExclusionGuard.tsx:17, DepartmentFormDialog.tsx:62 `created_by`, MyLifeCenter.tsx:19); `life_center_leader` (Header menu only).
- No ownership checks (created_by / requester / responsible person) gate any action in these modules.

Note: `DepartmentDetails.tsx` and `LifeCenterDetail.tsx` import `useBackNavigation` (uncommitted work on this branch). Line numbers reflect the working tree as of this audit.

---

# Part B — Events, Attendance, Rides, Appointments, Reports

Paths are relative to `src/pages/HomePage/pages/` unless they start with `src/`.

Cross-cutting facts that apply to every module below:
- **Every button in these modules is a local `UiButton`** (`EventsManagement/Components/eventsUi.tsx`, or `MembershipManagement/components/membershipUi.tsx:128`), a raw `<button>`, or a `CommDialogButton` descriptor. None of them reads `RouteAccessContext`, so **the `Button.tsx` label regex, `Action`, `ActionButton` and `HeaderControls` implicit gates almost never apply here**. The exceptions are `ViewEvents.jsx`, `OnlineLinkModal.tsx` and `src/pages/MembersPage/Pages/MyAppointments.tsx` (which use `@/components` `Button`), and `src/pages/MembersPage/Component/AppointmentCard.tsx` (which uses `useRouteAccess`). Any action listed below with no explicit check is effectively gated only by the route.
- **Branch scope:** `src/axiosInstance.js:162-169` sends an `X-Branch-Id` header on every request (the active branch, or nothing for "all branches"), and `useFetch` re-runs when the branch changes. So all lists here are branch-scoped by the server, even where the query has no `branch_id`. Reports also pass `branch_id` explicitly (`Reports/utils/reportAdapters.ts:116-121`).
- **`PermissionRequirement` arrays are ANY-OF:** `src/utils/accessControl.ts:691-692` uses `requirement.some(...)`.

---

## Events

### Routes
- Scheduled events, All events, analytics and event-schedules require `view_events`. `/home/manage-event` (`CreateEvent`) requires `manage_events`. `events/events/view-event` (`ViewEvents`) requires `view_events`. Public registration (`events/register-event` and `/out/events/register-event`, `EventRegister`) has `isPrivate: false` and no permission (`src/routes/appRoutes.tsx:1461-1474`).
- **Mismatch:** the Scheduled and All events pages (`view_events`) hold the full create/edit/delete UI, gated explicitly by `canManage("Events")`. That is consistent. `CreateEvent` is only a deep-link wrapper around the same editor.
- **Dead code** (not imported anywhere): `Components/EventsCard.tsx` (uses `Action`), `Components/EventsManagerHeader.tsx`, `Components/RegisterMember.tsx`, `Components/MemberConfirmed.jsx`, `Components/MemberConfirmation.jsx`, `Components/calenda/utils/CalendaHelpers.ts`. `SearchMember.jsx` is also unreferenced; `src/components/SearchMembersCard.jsx` only shares the name.

### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Schedule event (header) | EventsManagement/EventsManagement.tsx:282-285 | explicit `canManage("Events")` (l.69-70) | |
| Schedule event (empty state) | EventsManagement/EventsManagement.tsx:437-438 | explicit `canManage("Events")` | |
| + Add on this day | EventsManagement/EventsManagement.tsx:525 | explicit `canManage("Events")` | |
| Edit occurrence (drawer) | EventsManagement/Components/EventDetailDrawer.tsx:172-175 | explicit `canManage` prop = Events manage | |
| **Delete occurrence / series ("this", "following", "all")** | EventDetailDrawer.tsx:161-164 → EventsManagement.tsx:184-230 (`deleteEvent`, `deleteEventSeriesFrom`, `deleteEventSeries`), SeriesScopeModal | explicit `canManage("Events")` | **Needs only manage, not admin.** The global convention (`Action`, `Button` regex) puts delete at Super_Admin. Deleting a whole series also deletes its registrations. |
| Copy registration link | EventDetailDrawer.tsx:238 | NOT GATED | harmless |
| **Export registrants CSV** (name, email, phone, member ID, location) | EventDetailDrawer.tsx:122-136, 242-244 | NOT GATED (any `view_events`) | PII export |
| Save schedule (create/update event, series, "from" edits, online links, reminders) | EventsManagement/utils/scheduleForm.ts:370 (create, sends `created_by: user.id`), 386/388/394 (update series / from / single), 401 (links), 411 (save reminders), 413 (cancel reminders) | reached only through manage-gated openers; `/home/manage-event` requires `manage_events` | Audience targeting by department/position (ScheduleEventEditor.tsx:462-795) is open to any Events manager. Reminders send member notifications with no separate permission. |
| Create catalogue event inline ("add new event type") | EventsManagement/Components/ScheduleEventEditor.tsx:386-400, 529-536 | inherits the editor's gate | |
| New event (catalogue) | EventsManagement/pages/AllEvent.tsx:155-158 | explicit `canManage("Events")` (l.48-49) | |
| Schedule (from catalogue card) | AllEvent.tsx:206-219 | explicit `canManage("Events")` | |
| Edit catalogue event | AllEvent.tsx:229-233 → `updateUniqueEvent` (≈l.104) | explicit `canManage("Events")` | |
| **Delete catalogue event** | AllEvent.tsx:234-241 → `deleteUniqueEvent` (≈l.141) | explicit `canManage("Events")` | manage, not admin |
| See dates | AllEvent.tsx:220-228 | NOT GATED | navigation |
| **Edit Event** (ViewEvents hero) | EventsManagement/pages/ViewEvents.jsx:216-220 | route-derived manage (`Button` label "Edit Event" matches `/\bedit\b/`) on route `view_events`, which resolves to Events manage | Navigates to `/home/manage-event`, which requires `manage_events` |
| Open public registration / Copy registration URL | ViewEvents.jsx:224-239 | NOT GATED | |
| Edit links | ViewEvents.jsx:317-322 | explicit `canManage("Events")` plus route-derived manage (label) | |
| Add online link (empty state) | ViewEvents.jsx:359-367 | explicit `canManage("Events")` | |
| Save online links | EventsManagement/Components/OnlineLinkModal.tsx:47, 89-90 ("Save") | no own gate ("Save" does not match the regex) | opener is gated |
| Export CSV (events analytics) | EventsManagement/pages/EventsAnalytics.tsx:126-149 | NOT GATED | aggregate data |
| Public event registration / validate member | EventsManagement/pages/EventRegister.tsx:332, 392 | public, no auth | |

### Data visibility
- Calendar: `fetchEvents({month, year, page, take:500})` (EventsManagement.tsx:118-122). Other lists: `fetchAllUniqueEvents` / `fetchUpcomingEvents` (AllEvent.tsx:51-57) and `useEventsForYears` (utils/useEventsData.ts:33-70). Scope is branch only, through the header. There is **no per-user, department or audience filter**: an Events viewer sees every event, including department/position-targeted ones.
- The drawer loads full registrant PII (`fetchEventById`, EventDetailDrawer.tsx:57-62) for any viewer. `ViewEvents.jsx:84-93` (raw axios `/event/get-event`) shows registrations and attendance tables to any viewer.
- Headcounts come from `fetchChurchAttendance` (useEventsData.ts:15-16). This is a Church_Attendance endpoint called from an Events page (cross-domain read).

### Gaps / observations
- Delete (occurrence, series, catalogue entry) needs only `manage`, unlike the app-wide admin-for-delete convention.
- Registrant PII export and views are not separated from `view_events`. Candidates for actions: `events.export_registrants`, `events.view_registrants`.
- Sending reminders and targeting audiences are bundled into "manage events". A candidate action is `events.send_reminders`.
- `created_by` is stored (scheduleForm.ts:370), but there is no ownership-based edit/delete. A department leader cannot be limited to "events I created" or "my department's events" (a visibility-scope candidate).
- Several dead components remain (EventsCard uses `Action`). Remove them, or ignore them in the audit.

---

## Attendance (Church_Attendance)

### Routes
- `ChurchAttendance`, `EventAttendance` and `AttendanceAnalytics` all require `view_church_attendance`. Church_Attendance supports scope `assigned_departments`.
- **Scope usage:** `getScope()` is not used. The only consumer of the scope is `Attendance/EventAttendance.tsx:77`, through `resolveScope(user.access_permissions, "Church_Attendance") === "assigned_departments"`, and it **only shows an info banner** (l.331-336: "You only see check-ins for members of the departments you are assigned to or lead"). The server is expected to filter. `ChurchAttendance.tsx` and `AttendanceAnalytics.tsx` ignore the scope entirely.

### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Record attendance (header) | Attendance/ChurchAttendance.tsx:379-383 | explicit `canManage("Church_Attendance")` (l.63) | |
| Record now (unrecorded occurrence) | ChurchAttendance.tsx:514-522 | explicit `canManage("Church_Attendance")` | |
| Auto-open record dialog from `?record=` link | ChurchAttendance.tsx:141-146 | explicit `canRecord` | |
| Edit headcount record (row click and Edit) | ChurchAttendance.tsx:487, 494-497 | explicit `canManage("Church_Attendance")` | |
| Save record (create/update) | Attendance/Components/RecordAttendanceDialog.tsx:134 (`updateChurchAttendance`), 137-142 (`recordChurchAttendance`, sends `recordedBy: user.id`, `recordedByName`) | opener gated | |
| **Delete headcount record** | ChurchAttendance.tsx:499-502, 350-362 (`deleteChurchAttendance`) | explicit `canAdmin("Church_Attendance")` (l.64) | the only module here where delete requires admin |
| Export CSV (headcounts) | ChurchAttendance.tsx:332-347, 376-378 | NOT GATED | |
| Import check-ins (open dialog) | Attendance/EventAttendance.tsx:322-326 | explicit `canManage("Church_Attendance")` (l.75-76) | |
| Preview / Import selected (biometric import jobs) | Attendance/Components/ImportCheckInsDialog.tsx:118, 333-338 | `canManage` prop (disabled) | notice at l.141-145 |
| **Record as official** (bulk) | EventAttendance.tsx:229-252, 458-467 | explicit `canManage("Church_Attendance")` | bulk write to the official attendance record |
| **Export CSV / Export selected** (member check-ins with department and position) | EventAttendance.tsx:196-226, 316-321, 468-476 | NOT GATED | per-member PII export |
| Export CSV (analytics) | Attendance/AttendanceAnalytics.tsx:173-198, 210 | NOT GATED | |
| "Record" deep links from analytics | AttendanceAnalytics.tsx:141 → ChurchAttendance `?record=` | gated at the destination | |
| Attendance timing rules fetch | Attendance/utils/useAttendanceData.ts:110-117 | explicit `canView("Settings")` (cross-domain read) | falls back to 15-minute defaults |

### Data visibility
- `useAttendanceRecords` (`fetchChurchAttendance`), `useEventOccurrences` (`fetchEvents`, cross-domain Events read, useAttendanceData.ts:43-90) and `useCheckIns` (`fetchBiometricAttendance` with `eventId`, `fromDate` and `toDate` only, l.93-108). **No user or department ids are sent.** The department filter in EventAttendance (l.137, 174-176, 368) works on the client over whatever the server returned.
- The `assigned_departments` scope is enforced (if at all) by the server. The UI only displays the banner.

### Gaps / observations
- A department-scoped user (HOD) with `Church_Attendance: Can_Manage` can record, edit, import and bulk-mark official attendance **church-wide**. Nothing restricts writes to their departments in the UI, and ChurchAttendance headcounts (whole-service numbers) ignore the scope.
- Member-level check-in exports are ungated. Candidate action: `attendance.export`.
- Candidate actions: `attendance.import_checkins` and `attendance.mark_official`, separate from `attendance.record_headcount`.
- The scope check uses `resolveScope(user.access_permissions, …)` directly instead of `getScope()`. This is inconsistent with the Departments pages.

---

## Rides

### Routes
- `/home/rides` → `RidesManager` requires `manage_membership_management`. This is a **borrowed domain**: the route comment at `src/routes/appRoutes.tsx:421-425` says the backend checks Membership_Management "manage", which also selects who receives safety reports.
- Member hub `/member/rides/*` has no permission. The gate is `isGuestViewer()` (JWT `is_guest`, Rides/utils/rideHelpers.ts:337-343) plus the server's 401 "members only" response (`isMembersOnlyError`, rideHelpers.ts:346-349), which renders `MembersOnlyNotice` (Rides/RidesLayout.tsx:146-152, Rides/RideFindPage.tsx:199).

### Actions + gating (admin, RidesManager)
No component under `Rides/admin/` checks permissions. Every action is gated **only by the route** (`manage_membership_management`).
| Action | File:line | Gate | Notes |
|---|---|---|---|
| **Export CSV** (ride roster with driver and passenger phones) | Rides/admin/RidesManager.tsx:118-162, 194-198 | route only | PII |
| **Cancel ride** (notifies driver and passengers; cannot be undone) | Rides/admin/RideOverviewPanel.tsx:245-249 → Rides/admin/AdminRideModals.tsx:40-103 (`adminCancelRide` l.62) | route only | raw `<button>` |
| **Resolve safety report** | Rides/admin/RideReportsPanel.tsx:100-104 → AdminRideModals.tsx:130-176 (`resolveRideReport` l.148) | route only | safety-team-only content (l.197) |
| View safety reports (reporter and reported phones) | RideReportsPanel.tsx:78-85, 146 | route only | sensitive |
| **Lift ride block** | Rides/admin/RideBlocksPanel.tsx:43-58, 91-94 (`removeRideBlock`) | route only, plus `confirmAction` | safety action |
| New area / New pickup point | Rides/admin/RidePlacesPanel.tsx:284-293 → AdminRideModals.tsx:242-243, 366-367 | route only | |
| Edit route / Edit pickup point | RidePlacesPanel.tsx:195-201, 250-257 | route only | |
| Show/hide area or pickup point (toggle) | RidePlacesPanel.tsx:75, 101, 151-155, 243-248 (`Switch`) | route only | |
| Area route editor (reorder, remove stop) | Rides/admin/AreaRouteEditor.tsx:119-159 | route only | |

### Actions (member hub; ownership enforced by the server)
| Action | File:line | Gate |
|---|---|---|
| Request seat | Rides/RideFindPage.tsx:178 (`requestRideSeat`) | members-only (server) |
| Set ride alert | RideFindPage.tsx:153 | members-only |
| Offer / publish ride | Rides/RideOfferPage.tsx:271 (`publishRide`) | members-only |
| Accept / decline passenger | Rides/MyRidePage.tsx:155, 174 | ownership via `myRide.role === "driver"` (l.98), server-side |
| Cancel my offer / cancel my request / dismiss | MyRidePage.tsx:204, 236, 256 | own ride (server) |
| Report ride (+ block member) | MyRidePage.tsx:269-273, Rides/components/ReportSheet.tsx:46, 200-204 | own ride |
| Call/SMS passenger | Rides/components/DriverRideView.tsx:148-160 | driver only (server returns phones) |

### Data visibility
- Admin overview: `fetchRideAdminOverview({service_date})` (RidesManager.tsx:68) shows everything in the branch. Reports: `fetchRideReports({status})`. Blocks: `fetchRideBlocks`. There are no further filters.
- Member: `fetchMyRide(eventId)` and `fetchRideCatalog(eventId)` (Rides/hooks/useMyRide.ts:35, Rides/hooks/useRideCatalog.ts:19). Results are user-specific on the server.

### Gaps / observations
- Rides administration borrows `Membership_Management: manage`. Anyone who can manage members can cancel rides, read safety reports, lift blocks and export phone numbers, and **everyone with that level receives safety reports**. A dedicated `Rides` domain is needed, or at least actions: `rides.cancel`, `rides.resolve_reports`, `rides.lift_blocks`, `rides.manage_places`, `rides.export`.
- Safety reports and blocks are sensitive and should be limited to a small safety-team action permission.

---

## Appointments

### Routes
- Manager, analytics and manage-availability require `view_appointments` (`src/routes/appRoutes.tsx:697-731`). Settings requires `manage_appointments` (l.739). Appointments supports exclusions.
- Member `/member/appointments` (`MyAppointments`) has **no permission** (`isPrivate: false`, appRoutes.tsx:1719-1723).
- **Exclusions:** `isExcluded("Appointments", …)` is **never called** anywhere. The only callers are `Members.tsx:244` and `MemberExclusionGuard.tsx:25`, both for the Members domain. So Appointments exclusions are unused in the UI.

### Actions + gating
`isAdmin` in this module means `canManage("Appointments")`, not Super_Admin (`AppointmentsManagement/utils/useAppointmentsData.ts:31-32`).
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Book appointment (for someone) | AppointmentsManagement/AppointmentManager.tsx:266-269 → AppointmentsManagement/Components/AppointmentDialogs.tsx:226-295 (`createAppointmentBooking` l.257) | explicit `canManage("Appointments")` | |
| Remind / Remind again (nudge staff) | AppointmentManager.tsx:158, 178-182; AppointmentsManagement/Components/AppointmentDrawer.tsx:176-179 | explicit manage | sends a notification |
| Reassign | AppointmentManager.tsx:181, 194; AppointmentDrawer.tsx:152, 169-179, 188 | explicit manage | |
| Reply for them | AppointmentManager.tsx:182 | explicit manage | |
| **Accept / Decline / Suggest time** (PENDING) | AppointmentDrawer.tsx:174-185 (`act` accept l.119, with undo "reopen" l.124); dialogs AppointmentDialogs.tsx:39-148 | **manage OR ownership**: `canAct = isAdmin \|\| myId === booking.attendeeId` (AppointmentDrawer.tsx:49, 61) | the only ownership check in these modules |
| Cancel / Confirm proposal (RESCHEDULED) | AppointmentDrawer.tsx:186-191 (`confirm_proposal` l.163) | explicit manage only | |
| Mark No-show / Completed | AppointmentDrawer.tsx:192-196 (`outcome` l.131) | manage OR attendee ownership | |
| Cancel appointment / Move to another time (CONFIRMED) | AppointmentDrawer.tsx:197-201; CancelDialog AppointmentDialogs.tsx:170-206 | manage OR attendee ownership | |
| Export CSV (all appointments, requester names and phones) | AppointmentManager.tsx:215-231, 263-265 | NOT GATED | any `view_appointments` |
| Add person (staff) | AppointmentsManagement/pages/ManageAvailability.tsx:120-123 → AppointmentDialogs.tsx:648-675 | explicit manage | |
| Edit schedule | ManageAvailability.tsx:247-249 → AppointmentDialogs.tsx:369-458 (`createStaffAvailability` l.428) | explicit manage | |
| Add time off / Remove time off | ManageAvailability.tsx:250-252, 230-238 (`deleteStaffTimeOff` l.84); AppointmentDialogs.tsx:591 | explicit manage | Staff **cannot** manage their own availability or time off without manage (no ownership path) |
| Pause / Resume bookings | ManageAvailability.tsx:253-260, 56-75 | explicit manage | |
| Add / edit / reorder / show-hide / **delete booking reason** | AppointmentsManagement/pages/AppointmentSettings.tsx:322-332, 341-352, 365-384 (API l.160, 169, 178, 199-206, 225-226) | explicit manage, on a route that already requires `manage_appointments` | delete needs manage, not admin |
| Save booking rules | AppointmentSettings.tsx:411 (selects disabled), 430 (`updateAppointmentSettings` l.244) | explicit manage (selects only; the Save button shows when the form is dirty) | |
| Notification channel toggles | AppointmentSettings.tsx:465-466 (`updateAppointmentSettings` l.275) | explicit manage | |
| **Member: Book appointment** | src/pages/MembersPage/Pages/MyAppointments.tsx:328-332 | NOT GATED (no route permission; label not matched by the regex) | self-service |
| **Member: Edit / Delete own booking** | src/pages/MembersPage/Component/AppointmentCard.tsx:56-59, 106-140 via `AppointmentsManagement/Layout/AllAppointmentsLayout.tsx`; MyAppointments.tsx:346-359, 234+ (`deleteAppointmentBooking` l.109) | `useRouteAccess().canManageCurrentRoute`. **This is always true on `/member/appointments` because the route has no `permissionNeeded`.** It is effectively an ownership-by-query model (the list is filtered by `requesterId`); confirmed bookings are blocked client-side | Edit/delete safety relies on the server checking the requester. |
| Toggle confirmation (AppointmentCard) | AppointmentCard.tsx:87-92 | `canManageCurrentRoute` | MyAppointments never passes it |

### Data visibility
- The admin side loads **all** bookings (`fetchAppointmentBookings` with no query, useAppointmentsData.ts:35), all staff availability and settings. Branch scope applies through the header. A `view_appointments` user sees every booking (requester, reason, phone), not only the ones where they are the attendee. The "attendee" filter (AppointmentManager.tsx:105) is client-side and optional.
- Analytics: the "Everyone" or per-staff filter (AppointmentsAnalytics.tsx:214) is client-side over all bookings.
- Member: `fetchAppointmentBookings({requesterId: user.id, attendeeId?, status?, …})` (MyAppointments.tsx:36-60). This is the one explicit per-user filter, and it is **client-supplied**.

### Gaps / observations
- Staff who are attendees (pastors, counsellors) need `view_appointments` to reach the manager, but that shows them **every** booking. This needs an "own" visibility scope (attendee = me), which the drawer's `canAct` ownership check already half-assumes.
- Appointments exclusions are configured in Settings but never enforced in the UI.
- Export is ungated. Remind, reassign, book-on-behalf and confirm-proposal are bundled into manage (candidate actions).
- Staff cannot edit their own availability without full manage. This is a candidate for an "own" scope on `appointments.availability`.
- `AppointmentCard` relies on route-derived manage, which silently grants edit/delete on an ungated member route. This is fragile.

---

## Reports

### Routes and access constants (`Reports/utils/reportAccess.ts`)
- `DEPARTMENT_REPORTS_ACCESS` (l.8-18) is an **ANY-OF** list (`accessControl.ts:691-692`). Any one of these at `view` grants it: `Reports`, `Departments`, `Membership_Management`, `Visitors`, `Events`, `Church_Attendance`, `Asset`, `Financials`, `Life Center`. The comment says the server filters the list to what the viewer may read, and that Departments view covers department attendance reports (`dept_att:<id>`).
- `REPORTS_MENU_ACCESS = DEPARTMENT_REPORTS_ACCESS` (l.20).
- `EXECUTIVE_SUMMARY_ACCESS = { domain: "Reports", action: "view" }` (l.21).
- Routes (`src/routes/appRoutes.tsx`): the menu requires `REPORTS_MENU_ACCESS` (l.527). executive-summary requires `EXECUTIVE_SUMMARY_ACCESS` (l.542). department and department/:key require `DEPARTMENT_REPORTS_ACCESS` (l.550, 559). event-reports and event-reports/:id require `view_events`.
- `Reports/pages/ReportsHome.tsx:9-15` redirects to executive-summary if `canView("Reports")`, else department if `hasPermission(DEPARTMENT_REPORTS_ACCESS)`, else event-reports. The last branch is unreachable from the menu, because the menu requirement equals the department requirement.
- **Observation:** anyone with view on any of the nine domains (for example `Events: view` only) gets the Reports menu and the department reports pages. The server must filter.

### Department report workflow: who submits, who approves
Everything is decided by **server-provided flags**, `report.permissions: DeptReportPermissions` = `{can_edit, can_submit, can_approve, can_return, can_comment, can_decide, can_remind}` (`src/utils/api/reports/interfaces.ts:171-179`). The list response also has `viewer: {is_leadership, hod_of: DeptReportKey[]}` (l.224), and the summary has `viewer.is_leadership` (l.236). The client has no role logic. The UI copy implies **HOD (head of department) prepares/edits/submits** and **leadership approves/returns/decides/reminds** (`meta.hod_role`, "Return to HOD", "Submitted to leadership"). Each report can have an `owner` department with a `head` (interfaces.ts:207-211, configured in Settings › Reports).
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Open/Complete/Review CTA in list | Reports/pages/DepartmentReports.tsx:87-93 | backend flags `permissions.can_approve` / `can_edit` (label only) | tab label "Awaiting my review" when `viewer.is_leadership` (l.51, 175) |
| Edit commentary (wins/challenges/plans/testimonies), autosave | Reports/pages/DepartmentReportDetail.tsx:144 (`saveDepartmentReportCommentary`), 286 (`editable = can.can_edit && !print`) | backend flag `can_edit` | HOD |
| Add / remove leadership request, toggle "Needs decision" | DepartmentReportDetail.tsx:520-552, 582 | `can_edit` | |
| Save draft | DepartmentReportDetail.tsx:587-591 | `can_edit` | |
| **Submit to leadership** | DepartmentReportDetail.tsx:381-384 (band), 592-595; handler 195-203 (`submitDepartmentReport`) | backend flag `can_submit` | HOD; locks the report |
| **Approve** | DepartmentReportDetail.tsx:376-379, 617-620; handler 205-210 (`approveDepartmentReport`) | backend flag `can_approve` | leadership; locks the report |
| **Return to HOD (with note)** | DepartmentReportDetail.tsx:375, 614-615; handler 211-222 (`returnDepartmentReport`, note required) | backend flag `can_return` | leadership |
| Send reminder (to HOD) | DepartmentReportDetail.tsx:317, 223-235 (`remindDepartmentReport`) | backend flag `can_remind` | notification |
| Comment | DepartmentReportDetail.tsx:627, 236-245 (`commentOnDepartmentReport`) | backend flag `can_comment` | |
| `can_decide` | interfaces.ts:176 | **unused in the UI** | Decisions are made on the Executive Summary, gated by `is_leadership` |
| Download PDF / Download DOCX / Print view | DepartmentReportDetail.tsx:362-371 | NOT GATED (anyone who can open it) | |
| PII-restricted sections | DepartmentReportDetail.tsx:338-339 | backend `body.restricted` | shows counts but not names |
| **Exec summary: Approve leadership request / Respond** | Reports/pages/ExecutiveSummary.tsx:64-80 (`decideLeadershipRequest`), 285-292, 381 | backend flag `viewer.is_leadership` (l.99) | `can_decide` exists but is ignored |
| Exec summary: Remind HOD | ExecutiveSummary.tsx:82-97, 258-266 | `viewer.is_leadership`, and only when status is DRAFT/RETURNED | |
| Exec summary: Print | ExecutiveSummary.tsx:137-139 | NOT GATED | |

### Event reports
| Action | File:line | Gate | Notes |
|---|---|---|---|
| **Generate report** | Reports/pages/EventReports.tsx:47-48, 157-160, 321; `generateEventReport` l.123 | explicit `canManage("Events")` | creates the report in status "Pending approval" (`generated_by_name`) |
| **Approve** | Reports/pages/EventReportDetails.tsx:404-413, 538-547 (`approveEventReport`) | backend flag `report.permissions.can_approve` (l.174) | |
| **Return (with note)** | EventReportDetails.tsx:403, 537, 578-585 (`returnEventReport`) | backend flag `can_return` | |
| **Resubmit** | EventReportDetails.tsx:413-422 (`resubmitEventReport`) | backend flag `can_resubmit` | presumably the generator |
| Comment | EventReportDetails.tsx:553-560 (`commentOnEventReport`) | backend flag `can_comment` | |
| Download PDF / DOCX (service summary) | EventReportDetails.tsx:329-340, 382-384 (`downloadEventReportServiceSummary`) | NOT GATED | |
- Event report permission flags: `src/utils/api/eventReports/interfaces.ts:124-129`. If `permissions` is missing, all flags default to false (EventReportDetails.tsx:174).

### Data visibility
- `fetchDepartmentReports`, `fetchDepartmentReport`, `fetchExecutiveSummary`, `fetchEventReportsOverview` and `fetchEligibleEventReports` send `{period_type, period_key, branch_id?}` only (reportAdapters.ts:116-121). There are **no user or department params**. Filtering to "reports I may read", `hod_of`, and PII restriction (`body.restricted`) are all done by the server.
- The `?branch_id=` URL parameter switches the app-wide active branch (reportAdapters.ts:106-113). The branch picker is limited to the user's accessible branches (Reports/components/ReportControls.tsx:28-32).

### Gaps / observations
- Approval rights for department and event reports are fully backend-decided (`can_*`, `is_leadership`). There is no frontend permission such as `reports.approve`, so admins cannot configure "who approves" in the permission UI. Leadership and HOD status come from somewhere server-side (positions or department heads). This is the natural place for explicit action permissions: `reports.submit` (HOD, scoped to own department), `reports.approve`, `reports.return`, `reports.decide_requests`, `reports.remind`, `event_reports.generate`, `event_reports.approve`.
- `can_decide` is returned but unused; the summary uses `is_leadership` instead. This is inconsistent.
- Generating event reports uses `canManage("Events")`, while approval is server-flagged. These are two different authorities for one workflow.
- The ANY-OF `DEPARTMENT_REPORTS_ACCESS` makes the Reports menu visible to almost every staff role. The real visibility scope lives in the backend.
- Exports and prints (PDF/DOCX) are ungated for all report viewers.

---

# Part C: Finance, Requisitions, Assets (+ member Giving/Pledges)

Paths below are relative to `src/pages/HomePage/pages/` unless they start with `src/`.

**Applies to all three modules: the implicit route gates do nothing here.** Every page in Finance, Requisitions and Assets uses `UiButton` / `ActionMenu` / `CommDialog` buttons from `MembershipManagement/components/membershipUi.tsx:128` (a plain `<button>`), never `src/components/Button.tsx`, `Action.tsx`, `ActionButton.tsx` or `HeaderControls.tsx`. So the label regex (Edit/Delete) never applies. Every gate in these modules is written out by hand: `useRouteAccess().canManageCurrentRoute`, flags the backend returns, or user-id comparisons. **`canAdminCurrentRoute` is never used in any of these modules**, so no delete needs Super_Admin.

---

## Finance (FinanceManagement)

### Routes (and mismatches)
- `finance` parent: `view_financials`, **no element**. `src/routes/routeAccess.ts:39` keeps the parent in the side nav when any child is visible. `src/routes/RenderRoutes.jsx:10-13` only redirects routes that have an element, so the parent is never enforced.
  - **A user with Giving or Pledges access but no Financials CAN reach** `/home/finance/giving-options`, `/giving-contributions`, `/pledges`, `/pledges/:id` (each child checks its own `view_giving`/`view_pledges`). The `finance` index (`""`, FinanceManager), `create`, `configuration` and `:id` still send them to `/home/access-denied`. If the parent nav item links to `/home/finance`, it lands on access-denied for that user (I didn't check this; `useSideNavTabs.ts:25`).
- `create` → FinanceRecord (`manage_financials`). `:id` → FinanceRecord (`view_financials`). It is the same component, and the in-page `canManage` comes from whichever route matched.
- `pledges/:id/edit` (`manage_pledges`) renders the same `PledgeDetail` as `pledges/:id`, with no edit mode. Nothing in the code links to it (it exists for old links only). Inside it, `canManage` = manage Pledges.
- `configuration` already needs `manage_financials`, so every `canManage` check in FinanceConfiguration.tsx is redundant (always true).

### Actions and gating

| Action | File:line | Gate | Notes |
|---|---|---|---|
| Export CSV (records list) | FinanceManager.tsx:215 | NOT GATED (view) | Anyone with view_financials |
| New weekly record | FinanceManager.tsx:218-221 | route-derived manage (`canManageCurrentRoute`, Financials) | Also the route `create` = manage_financials |
| "+ Create record" for a missing week | FinanceManager.tsx:98, 331-343 | route-derived manage (the missing list is empty when `!canManage`) | |
| Attention: Create record / Continue / Fix and resubmit / Open configuration | FinanceManager.tsx:122-169 | route-derived manage | |
| Attention: "Review" a pending record | FinanceManager.tsx:111-121 | user-field: `isApprover` (viewer id == `finance_approver_user_id` from finance approval config, utils/useFinanceData.ts:197-209) | Not a permission |
| Edit record (icon) | FinanceManager.tsx:55, 286 | route-derived manage AND (`DRAFT` or `isApprover`) AND backend `isEditable` | |
| Delete draft (icon) | FinanceManager.tsx:59-70, 296 | route-derived manage + status DRAFT | **manage, not admin** |
| Export CSV / Download PDF / Word / spreadsheet (one record) | FinanceRecord.tsx:607-614 | NOT GATED (view) | |
| Delete (record page) | FinanceRecord.tsx:373-385, 616 | route-derived manage + DRAFT | manage, not admin |
| Edit (record page, also via `?edit=1`) | FinanceRecord.tsx:171-172, 206, 621 | route-derived manage + `isEditable` + (DRAFT or isApprover) | An approved record can be edited by the approver only |
| Save draft / Submit for approval | FinanceRecord.tsx:274-327, 926-935 | Reachable only in edit mode (see Edit); new records need route `manage_financials` | Sends `action: SAVE_DRAFT / SAVE_AND_APPROVE` |
| **Save and approve** (approver who is also a manager) | FinanceRecord.tsx:935 | `isApprover` decides the label; the backend decides the result | The approver can create **and** approve their own record in one step (no maker-checker split) |
| **Approve** record | FinanceRecord.tsx:330-347, 626-633 | user-field `isApprover` only (no permission check) | Approve is not tied to any permission level. Whoever is set as approver in config can approve, even with only view_financials |
| **Return with a note** | FinanceRecord.tsx:350-370, 628 | user-field `isApprover` | |
| Branch picker for a new record ("All branches") | FinanceRecord.tsx:255, 300 | NOT GATED | Any branch the user picks |
| Configuration: add/rename/remove receipt, payment, tithe and allocation lines | FinanceConfiguration.tsx:182-230, utils/useFinanceData.ts:157-179 | route-derived manage (the route is already manage) | Removing a line calls `delete*Config`. manage, not admin |
| **Set finance approver / notify list** | FinanceConfiguration.tsx:~267-310, utils/useFinanceData.ts:181-191 | route-derived manage | Decides who can approve money records. Should be admin or its own permission |
| Tithe rate | FinanceConfiguration.tsx:~318-330 | route-derived manage | |
| Save / Discard config | FinanceConfiguration.tsx:~346-355 | route-derived manage | |
| New giving option | GivingOptions.tsx:180-183 | route-derived manage (Giving) | |
| **Edit giving option (Paystack settlement bank account)** | GivingOptions.tsx:98-131, 270; Components/SettlementAccountFields.tsx:38 | route-derived manage (Giving) | Changes where the money is paid out to. High risk, but only needs manage |
| Pause (archive) / Resume giving option | GivingOptions.tsx:133-158, 280-283 | route-derived manage (Giving) | |
| Copy link / Contributions | GivingOptions.tsx:264-278 | NOT GATED | |
| Export CSV (contributions, includes donor email) | GivingContributions.tsx:170-189, 238 | NOT GATED (view_giving) | Exports personal data (PII) at view level |
| Check status with Paystack (recheck) | GivingContributions.tsx:110, 156-157, 440-441 | route-derived manage (Giving) | |
| **Send "try again" message** to a donor | GivingContributions.tsx:130, 442-443 | route-derived manage (Giving) + `user_id` present | Sends a message to a member |
| Create pledge | Pledges.tsx:66-69; Components/PledgeDialogs.tsx:118-119 | route-derived manage (Pledges) | |
| **Remind pledgers** (bulk) | Pledges.tsx:45; utils/pledgeModel.ts:27-37 | route-derived manage (Pledges) | Bulk SMS/email |
| Export CSV (pledgers, includes phone) | PledgeDetail.tsx:172-180, 213 | NOT GATED (view_pledges) | Personal data |
| Remind all with a balance | PledgeDetail.tsx:214-216 | route-derived manage (Pledges) | Bulk message |
| Add pledgers | PledgeDetail.tsx:217-221; PledgeDialogs.tsx:355 | route-derived manage | |
| Edit details | PledgeDetail.tsx:222-229; PledgeDialogs.tsx:118 | route-derived manage | |
| **Delete pledge** | PledgeDetail.tsx:155-170, 227 | route-derived **manage** (not admin) | Asks for typed confirmation when there are more than 10 pledgers |
| Record payment (redemption, photo upload) | PledgeDetail.tsx:325-333; PledgeDialogs.tsx:488-506 | route-derived manage | Money entry. The upload uses `uploadAssetPhoto` (code from the Assets module) |
| Remind one pledger | PledgeDetail.tsx:114, 335 | route-derived manage | |
| Remove pledger | PledgeDetail.tsx:139-153, 344 | route-derived manage | |
| Credit now (link an online payment to a pledger) | PledgeDetail.tsx:129, 389 | route-derived manage | Money reconciliation |

### Data visibility
- Weekly records: `fetchFinancials {page:1,take:500}` (utils/useFinanceData.ts:61-64). It is scoped by branch only, through useFetch. There is no per-user or per-department filter; anyone with view_financials sees every record in the branch.
- Config, approval config and giving options are not filtered by user. Contributions (`useContributions`, utils/useFinanceData.ts:229-283) are filtered by branch, option and date only. Pledges: `fetchPledges` gets `branch_id` (utils/useFinanceData.ts:287-293).
- FinanceRecord auto-fill (`fetchFinanceAutoAmounts`, FinanceRecord.tsx:178) pulls pledge and online-giving totals (Pledges/Giving data) into a Financials page. It reads data across domains.

### Gaps / observations
- **Approve and Return are gated by a config field (who the finance approver is), not by a permission.** The approver also edits approved records (FinanceRecord.tsx:172) and can "Save and approve" their own record. Candidates for permissions: `approve_financial_record`, `edit_approved_record`.
- Who can change the approver: anyone with manage_financials (config). This should be admin or its own permission.
- Deletes (draft records, config lines, pledges, pledgers) all need **manage**, never admin. That is inconsistent with the admin-for-delete rule in shared components.
- Sending messages (remind pledgers in bulk, remind one pledger, "try again" message to donors) only needs manage. Candidate `send_pledge_reminders` / `message_donors`.
- Changing the settlement bank account only needs manage_giving. Candidate `manage_settlement_accounts` (admin).
- CSV and document exports are never gated, and some contain donor email or pledger phone. Candidate `export_financials` / `export_giving`.
- The `finance` parent lets Giving/Pledges-only users into finance children (by design?). Their sidebar group says "Finance" but the root page denies them.

---

## Requisitions

### Routes
`/home/requests` and **all** its children (My Requisition, `staff_requests`, `analytics`, `request` redirect, `request/:id`, `:id` deep link) have **no `permissionNeeded`** (`src/routes/appRoutes.tsx:745-795`). So `canManageCurrentRoute` and `canAdminCurrentRoute` are true everywhere, but no page in this module reads them.

### How "who sees what" is decided
- `useRequisitionsData(scope)` (Requisitions/utils/useRequisitionsData.ts:43-58) calls `fetchRequisitionOverview({scope:"mine"|"all"})`. **The backend decides the rows.** It also returns `viewer.is_manager` and `viewer.is_approver`.
  - `isManager = data.viewer.is_manager ?? canManage("Requisition")` (line 55). The explicit `useAccessControl().canManage("Requisition")` is only a fallback for older servers. `isApprover = data.viewer.is_approver ?? false`.
- RequisitionManager.tsx:103: role = `requester` (section mine), `admin` (isManager), otherwise `approver`.
- RequisitionManager.tsx:512-514: on `staff_requests` and the `:id` deep link, a user who is neither manager nor approver is sent to `/home/requests` (and `?open=id`). This is a client-side redirect after load. The sidebar still shows the "Requisitions" and "Analytics" tabs to everyone.
- Analytics (pages/RequisitionsAnalytics.tsx:71, 154, 218-222): `fetchRequisitionAnalytics`. The server scopes the results (non-managers see only "requisitions that pass through your steps", line 227). If the API errors, the page shows "for managers and approvers". There is no client-side gate.
- Approver queue: `canAct(row, me)` = PENDING and `pendingStep.approver.id === me` (utils/requisitionModel.ts:110). Coming to you / You acted on use the same step approver-id checks (lines 113-119). Approver identity comes from the workflow steps the backend returns (Settings → approvals workflow), not from a permission.

### Actions and gating

| Action | File:line | Gate | Notes |
|---|---|---|---|
| New requisition | RequisitionManager.tsx:564, 630, 129-135 (`?new=1`) | NOT GATED | Anyone signed in |
| Department picker on the form | components/RequisitionDialogs.tsx:213-219; hooks/useRequisitionFormOptions.ts:56-99 | NOT GATED | **Every department** from `fetchDepartments` is listed, not just the user's own. A requester can raise a requisition for any department |
| Attach quote/photo (upload) | RequisitionDialogs.tsx:169; utils/useRequisitionsData.ts:28-37 | NOT GATED (inside the requester's form) | `pictureInstance /upload` |
| Save draft / Continue to sign / Save changes | RequisitionDialogs.tsx:202-208; RequisitionManager.tsx:159-181; useRequisitionsData.ts:67-77 | ownership (only reachable from own drafts / `requesterCanEdit`) | The backend enforces ownership on `updateRequisition` (I didn't verify this) |
| Sign and submit | RequisitionDrawer.tsx:165-170; RequisitionManager.tsx:183-197, 387 | ownership (`row.requester.id === me` and DRAFT) | |
| Edit (draft or submitted without a decision) | RequisitionDrawer.tsx:168, 171-173; requisitionModel.ts:130-132 | ownership: `requesterCanEdit` (requester and (DRAFT or PENDING with no step acted on)) | |
| Delete draft | RequisitionDrawer.tsx:167; RequisitionManager.tsx:243-256; useRequisitionsData.ts:103-105 | ownership + DRAFT | |
| Revise as new draft | RequisitionDrawer.tsx:174-176; RequisitionManager.tsx:259-262, 399 | ownership + REJECTED + not already revised | |
| **Approve** (card and drawer) | RequisitionManager.tsx:762-764 (cards shown only for `myQueue` = canAct); RequisitionDrawer.tsx:177-182; RequisitionDialogs.tsx:459-517; useRequisitionsData.ts:85-92 | approver check: `canAct` (current pending step's approver id == me) | Typed-name signature. Not tied to any permission |
| **Reject** (with reason) | RequisitionDrawer.tsx:179; RequisitionDialogs.tsx:545-592; useRequisitionsData.ts:94-96 | approver check: `canAct` | |
| Return / Cancel / Withdraw | — | **Doesn't exist.** A requester cannot withdraw a submitted requisition. There is no "return for changes", only reject → revise | |
| Send reminder to the approver | RequisitionDrawer.tsx:183-185; RequisitionManager.tsx:229-241, 455-457 (admin attention list) | backend flag `viewer.is_manager` (fallback canManage Requisition) | Push + email |
| Post comment | RequisitionDrawer.tsx:196-209, 324-336; useRequisitionsData.ts:107-109 | NOT GATED (anyone who can open the drawer, which the backend controls) | |
| View attachments | RequisitionDrawer.tsx:290-311 | NOT GATED (http(s) links only) | |
| Similar-items pre-approval check | RequisitionDrawer.tsx:89-96 | `canAct` or `isManager` | Calls `fetchRequisitionPreApprovalSimilarItems` |
| Export CSV (list) | RequisitionManager.tsx:486-508, 561-563 | NOT GATED | Exports whatever the server returned for the section |
| Export CSV (analytics) | RequisitionsAnalytics.tsx:134-149, 212 | NOT GATED (server-scoped) | |
| Admin pipeline / Awaiting / Over-SLA views | RequisitionManager.tsx:328-338, 429-462, 467-482, 664-706 | backend flag `is_manager` | |
| Override / approve on behalf / reassign approver | — | Doesn't exist | Managers can only remind |

### Data visibility
- Mine: `scope=mine`. All: `scope=all`, which the server limits to everything for managers and to rows on the user's steps for approvers (comment at `src/routes/appRoutes.tsx:759-761`). Branch: useFetch re-runs on branch change, and new requisitions get `branch_id` (useRequisitionsData.ts:63-69).
- Filters (department, event, step, dates) are client-side only, over the server rows (RequisitionManager.tsx:282-302).
- Analytics sends an optional `department_id` that the user picks. The picker lists every department (RequisitionsAnalytics.tsx:47, 67).
- Dead code: `requisitionStore/useRequisitionStore.ts` and `editableTableSlice.ts` are not imported anywhere outside themselves.

### Gaps / observations
- **Everything depends on the backend.** The routes have no permission, and every "manager" or "approver" UI choice comes from `viewer.is_manager` / `is_approver` plus the step approver ids. The frontend fallback is `canManage("Requisition")`. A separate `approve_requisition` action permission would replace or complement workflow-step membership. `remind_approver` and `view_all_requisitions` (manager) are also candidates.
- Department scope for creation is missing: requesters can choose any department (RequisitionDialogs.tsx:218). The visibility scope "my department" is needed here.
- The Requisitions and Analytics tabs are shown to everyone. Non-approvers are redirected, or see the empty "denied" state, only after the data loads.
- Comments are open to anyone who can open the record. Export is ungated.
- There is no withdraw or cancel for submitted requisitions, and no manager override.

---

## Assets (AssetsManagement)

### Routes
- `assets`, `assets/reconciliation`, `assets/analytics`: `view_asset`.
- `assets/count` (**Stock check**, `AssetCountPage`): no permission (`src/routes/appRoutes.tsx:830-839`). `AssetCountPage` is the **whole `AssetReconciliation` component** (AssetReconciliation.tsx:1325). It also mounts `useAssetsData()` → `fetchAssetOverview` (AssetReconciliation.tsx:118), so any signed-in user who opens `/home/assets/count` asks for the register overview. What they get back depends entirely on the server.
- **No `canManageCurrentRoute` and no `useAccessControl` anywhere in Assets.** Every gate is a flag the backend returns:
  - Register: `viewer.can_manage`, `viewer.can_delete`, `can_view_all`, `department_ids` (utils/useAssetsData.ts:151; AssetManager.tsx:103).
  - Stock checks: `viewer.is_admin`, `department_keys`, `user_id` (utils/useAssetsData.ts:257; AssetReconciliation.tsx:120-121).

### Actions and gating

| Action | File:line | Gate | Notes |
|---|---|---|---|
| Export CSV (register) | AssetManager.tsx:239-258, 467 | NOT GATED (view) | |
| Add asset | AssetManager.tsx:470-473, 766-790; useAssetsData.ts:79-87 | backend flag `viewer.can_manage` | |
| Edit asset | AssetManager.tsx:439 | backend flag `can_manage` (the whole drawer button list returns [] when `!canManage`, line 436) | |
| **Delete asset** | AssetManager.tsx:212-227, 438; useAssetsData.ts:133-136 | backend flag `viewer.can_delete` (and can_manage) | The only admin-style delete flag in these modules |
| Assign / Reassign / Change status (incl. lost/stolen, not fixable, back in use, return to store) | AssetManager.tsx:169, 440, 446-449, 791-819; useAssetsData.ts:89-96; Components/AssetDialogs.tsx:285-356 | backend flag `can_manage` | One status endpoint covers assign, unassign and dispose |
| Undo status change (restore snapshot) | AssetManager.tsx:812-815; useAssetsData.ts:98-104 | `can_manage` (only reachable from the toast) | |
| Confirm as lost | AssetManager.tsx:187-210, 337, 445; useAssetsData.ts:106-113 | `can_manage` | |
| **Raise repair requisition** (one per department, typed signature) | AssetManager.tsx:171-185, 294, 442, 608, 821-845; AssetDialogs.tsx:388-528; useAssetsData.ts:115-122 (`raiseRepairRequisition`) | backend flag **`can_manage` on Assets** | **Crosses domains:** it creates and **submits** Requisitions (to the department head) using Asset rights only. It does not check any Requisition permission or department membership. The fallback department picker lists every department (AssetDialogs.tsx:515) |
| Raise again (clear the rejected repair requisition, then raise) | AssetManager.tsx:229-237, 320; useAssetsData.ts:124-131 | `can_manage` | |
| Open requisition (from an asset) | AssetManager.tsx:443 | `can_manage` (inside the drawer buttons) | Goes to `/home/requests/{base64 id}`. RequisitionManager then redirects users who aren't managers or approvers to `/home/requests?open=` |
| "Open in Requisition" toast action | AssetManager.tsx:842 | NOT GATED | Navigation only |
| Mark under repair (after approval) | AssetManager.tsx:307, 444 | `can_manage` | |
| Bulk: raise repair / assign / change status / export selected | AssetManager.tsx:604-612, 636 (`selectable={canManage}`) | `can_manage` | Bulk export is also behind can_manage, but the normal Export is ungated |
| Attention list (all actions) | AssetManager.tsx:262-376 | `can_manage` (returns [] otherwise) | |
| Analytics Export CSV | AssetAnalytics.tsx:259-264, 323 | NOT GATED (view_asset) | Data from `useAssetsData` (server-scoped) |
| **Start stock check** (notifies counters) | AssetReconciliation.tsx:206-209, 1134, 1202-1203; useAssetsData.ts:215-222 | backend flag `stock.viewer.is_admin` | |
| Cancel stock check | AssetReconciliation.tsx:354, 445-456; useAssetsData.ts:243-246 | `is_admin` (only rendered in the admin `renderActive`) | |
| Remind counters (one or all) | AssetReconciliation.tsx:416, 431-442, 1064 | `is_admin` (admin views only) | Push + email |
| Mark item found / elsewhere / damaged / not found / clear | AssetReconciliation.tsx:479, 684-722 | `canEdit = admin \|\| !submitted` (line 465), plus department keys: non-admins are limited to `myKeys` (line 462, 587) | Department heads count only their own departments (server `department_keys`) |
| Mark all the rest found (bulk) | AssetReconciliation.tsx:480-492, 624 | same as mark | |
| Submit count | AssetReconciliation.tsx:497-515 | department key (non-admin = own departments); admin can submit for anyone (616) | |
| Reopen own count | AssetReconciliation.tsx:517-520, 603-606 | non-admin only, own department, before close | |
| Found something not listed (add extra) | AssetReconciliation.tsx:548, 796-804, 1247-1271 | `canEdit`; non-admins limited to their own departments (`allowedKeys`) | |
| Remove extra | AssetReconciliation.tsx:756-758 | `canEdit && (admin \|\| x.recorded_by === me)` | ownership check |
| Review differences: set fix (move / repair / lost / add to register) | AssetReconciliation.tsx:820, 874, 944 | `is_admin` (non-admins can't reach view=review, line 155) | Choices are applied to the register on close |
| Request recount | AssetReconciliation.tsx:821-829 | `is_admin` | |
| Record the rest as not found | AssetReconciliation.tsx:958-970, 1050 | `is_admin` | |
| **Close check and update register** | AssetReconciliation.tsx:972-994, 1098 | `is_admin` | Changes the register in bulk |
| Export report CSV | AssetReconciliation.tsx:996-1014, 1026 | `is_admin` (reports and past checks only show in admin views, line 276) | |

### Data visibility
- Register: `fetchAssetOverview` with no user params. The server returns `can_view_all` and `department_ids`, which suggests the server already supports a "my departments" scope. The frontend doesn't filter.
- Stock checks: `fetchStockChecks`. Non-admins see only their own departments' sections (`myKeys`), and the server scopes the count list (`src/routes/appRoutes.tsx:830-833`).
- Writes take the branch from `useWriteBranchId` (save, raiseRepair, start).

### Gaps / observations
- The frontend never reads any Asset permission. It relies on `can_manage`, `can_delete` and `is_admin` from the server. The `view_asset` route gate is the only frontend permission check, and **`assets/count` skips even that** while still loading the register overview.
- **Raising a repair requisition crosses domains** (creates and submits Requisitions under Asset manage rights). Candidate action permission: `raise_requisition_from_asset`. Today the only "open requisition from an asset" link is just navigation, and Requisitions then gates it by manager or approver status.
- Status changes, assign, dispose (not fixable, lost) and confirm-lost all fall under the single `can_manage`. Candidates: separate `assign_asset`, `dispose_asset` and `reconcile_assets` (start, close, set-fix) permissions. Stock-check admin is its own flag (`is_admin`), and this file doesn't show how the server works it out.
- The main register Export CSV is ungated while "Export selected" needs can_manage, which is inconsistent.

---

## Member side: Giving / Pledges (src/pages/MembersPage/Pages)
- Routes `relativePath.member.giving` and `member.pledges` (and their `*Complete` routes) are `isPrivate: false`, with no permission (`src/routes/appRoutes.tsx:1588-1613`).
- MemberGiving.tsx: Give (276, `initializeGiving` 154), Try again (343, `retryGivingPayment` 187), Delete a failed attempt (351, `deleteMyContribution` 218). These are own-data endpoints (`fetchMyContributions` 71, `fetchAvailableGivingOptions` 65). The "Delete" is a plain `<button>`, so no regex gate applies (none is needed, since it's the member's own data).
- MemberPledges.tsx: Pay (324, `initializePledgePayment` 160), Try again (396, `retryPledgePayment` 191), Delete attempt (404, `deleteMyPledgePayment` 222). Own data via `fetchMyPledges` (70) and `fetchMyPledgePayments` (75).
- Visibility: "own" only, scoped by the server through `/my*` endpoints. No gaps beyond relying on the backend.

---

# Part D — Marketplace + School of Ministry (incl. instructor/grading pages)

Paths below are relative to `src/`. MP = `pages/HomePage/pages/MarketPlace/`, SOM = `pages/HomePage/pages/MinistrySchool/`, MPg = `pages/MembersPage/Pages/`.

Global context worth knowing for this area:
- Branch scope is sent on every request as an `X-Branch-Id` header (`axiosInstance.js:164-166`); `useFetch` re-runs on branch change. Neither module passes `buildBranchQuery` itself, except SOM Reports (`SOM/lms/reports/ReportsPage.tsx:230`).
- SOM `Btn` (`SOM/lms/ui.tsx:151`) is a custom button and does **not** apply the `Button.tsx` label regex. Marketplace mostly uses raw `<button>` elements, which the regex doesn't touch either. In both modules, gating is explicit (`useRouteAccess()` / `useAccessControl()`) or absent.

---

### Marketplace

#### Routes
All admin routes need `view_marketplace` (overview `""`, `markets`, `products`, `orders`, `analytics`, order details, market details). Add/edit product need `manage_marketplace` (`routes/appRoutes.tsx:985-1098`).
- Mismatch: the order details and market details pages run manage/admin mutations, but their route only needs `view`. The mutations are gated in-component, so this is fine.
- Mismatch: `AdminOrderDetail` and `OrdersPanel` gate with **`useAccessControl().canManage("Marketplace")`** (domain-explicit), while the other marketplace files use `useRouteAccess().canManageCurrentRoute`. Both currently give the same answer.
- Storefront/cart/`components/ProductDetails.tsx` are only used by member pages (`MPg/Market.tsx`, `ProductsPage`, `CheckOutPage`, `ProductDetailsPage`, `HomePage/Components/Header.tsx`). They're out of admin scope and not audited here.

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Create market (header + empty state) | MP/MarketPlace.tsx:87-95, 114-122 | route-derived manage (explicit `canManageCurrentRoute`) | Raw `<button>` |
| Market card ⋯ → Edit | MP/components/cards/MarketCard.tsx:95-105 | route-derived manage (prop `canManage`) | |
| Market card ⋯ → Duplicate | MP/components/cards/MarketCard.tsx:108-118 | route-derived manage | Calls `api.post.duplicateMarket` (MarketFormModal.tsx:32) |
| Market card ⋯ → Delete | MP/components/cards/MarketCard.tsx:121-132; handler MarketPlace.tsx:75-78 | route-derived admin (`canAdminCurrentRoute`) | `showDeleteDialog` → `api.delete.deleteMarket` |
| Manage store / open market | MarketCard.tsx:158-160 | NOT GATED (navigation) | |
| Edit market / Add product (market detail) | MP/pages/MarketDetail.tsx:107-119 | route-derived manage | The route is view-only, but "Add product" navigates to a manage route anyway |
| Create market (from Products "no markets" alert) | MP/components/Products/ProductsPanel.tsx:246-248 | route-derived manage | |
| Product settings cog (types & categories drawer) | ProductsPanel.tsx:303-313 | route-derived manage | |
| Edit product (row click / "Edit") | ProductsPanel.tsx:356-369, 404 | route-derived manage | |
| Add product | ProductsPanel.tsx:422-426, 458-468 | route-derived manage | |
| Product type/category Add / Update | MP/components/ConfigurationsDrawer.tsx:349-356 (`isReadOnly={!canManageCurrentRoute}` at 242) | route-derived manage (disabled) | `Button` value "Add"/"Update" is not matched by the regex. The gate is the explicit `disabled` |
| Product type/category Edit / **Delete** | ConfigurationsDrawer.tsx:286-300, handler 106-107 | route-derived **manage** only | **Inconsistent: delete is gated at manage, not admin** |
| Save product (create/update) | MP/components/forms/ProductForm.tsx:192 (submit); MP/pages/AddProduct.tsx:54-55 | route gate `manage_marketplace` | Publish/Draft status is a plain field (ProductForm.tsx:246-252), so publishing has no separate gate |
| Delete product | ProductForm.tsx:174-182; AddProduct.tsx:226-228 | route-derived admin (`isEdit && canAdminCurrentRoute`) | |
| Export orders to Excel | MP/components/Orders/OrdersPanel.tsx:344-346 (handler 206) | **NOT GATED** | Any view user can export all order PII (names, emails, phone) |
| **Reconcile payments** (Hubtel) | OrdersPanel.tsx:347-353 (handler 223-228 `api.post.reconcileHubtelPendingPayments`) | **NOT GATED** | View-only users can trigger a payment-reconciliation mutation |
| Place order for member | OrdersPanel.tsx:354-358 | explicit `can(Marketplace, manage)` | Cross-domain: reads members (`useStore.membersOptions`, `api.fetch.fetchAMember`, CreateOrderForMemberModal.tsx:111, 200). Can record an order as **already paid** (`manual_status: "success"`, :295) or send a Hubtel link (:297-301) |
| Bulk Mark paid / Mark out for delivery / Mark completed | OrdersPanel.tsx:459-487 (`api.put.bulkUpdateOrderStatus` :259) | explicit `can(Marketplace, manage)` | "Mark paid" is effectively a finance action |
| Bulk Delete orders | OrdersPanel.tsx:489-498 (`api.delete.bulkDeleteOrders` :299) | explicit `can(Marketplace, admin)` | |
| Order detail Edit (EditOrderModal: items, payment_status, delivery) | MP/pages/AdminOrderDetail.tsx:208-216; EditOrderModal.tsx:166-167 | explicit `can(Marketplace, manage)` | Payment status can be changed by hand in the modal |
| Order detail Delete | AdminOrderDetail.tsx:218-229 | explicit `can(Marketplace, admin)` + backend-state check (disabled when `payment === "success"`) | |
| Cancel order | AdminOrderDetail.tsx:231-234 (`canCancel` :107-108) | explicit `can(Marketplace, manage)` | Notifies the member and releases stock |
| Next action: Mark as paid / Mark ready for pickup / Mark out for delivery / Mark as delivered/collected | AdminOrderDetail.tsx:236-245; labels utils/marketplaceModel.ts:470-494 | explicit `can(Marketplace, manage)` | "Mark as paid" sits under manage alongside fulfilment actions |
| Check payment status (verify gateway) | AdminOrderDetail.tsx:366-374 (`api.fetch.verifyPayment` :152) | **NOT GATED** (only state-gated: pending, non-manual, has reference) | Read-ish, but it may update the payment state server-side |
| Overview quick links | MP/pages/MarketplaceOverview.tsx:171-185, 281-343 | NOT GATED (navigation) | |
| Analytics page | MP/pages/MarketplaceAnalytics.tsx:206-209 | HeaderControls with no `btnName`, so there's no primary action | Fetches up to 5000 orders client-side (:50-53) |

#### Data visibility
- No per-user filtering anywhere in the admin marketplace. Every view user sees all markets, all orders (`fetchAllOrders`, OrdersPanel.tsx:83-85; Overview :116; Analytics :50), and every customer's name/email/phone/address. The only scoping is the `X-Branch-Id` header.
- Market create/edit requires choosing a branch when the active branch is ALL (MarketFormModal.tsx:28, 68; AddMarketForm.tsx:198).
- The market is tied to an event (AddMarketForm.tsx:116-118), but nothing scopes by event owner or department.

#### Gaps / observations
- **Export to Excel** and **Reconcile payments** have no gate at all (OrdersPanel.tsx:344-353). Both should be distinct action permissions (e.g. `marketplace.export_orders`, `marketplace.reconcile_payments`).
- "Mark paid" (bulk and single) and "Place order for member → already paid" record payments under plain `manage`. A finance-style action permission (`marketplace.record_payment`) is a natural split from fulfilment (`marketplace.fulfil_order`).
- Cancelling an order (it notifies the member and releases stock) is under the same manage gate as editing.
- Deleting product types/categories is gated at manage while every other delete in the module is admin (ConfigurationsDrawer.tsx:286-300).
- Two gating styles are mixed (`useAccessControl` vs `useRouteAccess`). Pick one when adding action permissions.
- Order PII is visible to every `view_marketplace` user. Consider a visibility scope (e.g. own markets / own event department) or masking for view-only users.

---

### School of Ministry (admin LMS)

#### Routes
Every route under `ministry-school` needs `view_school_of_ministry` (`routes/appRoutes.tsx:1101-1276`). That covers the dashboard, programs, programs/:id, cohorts, cohorts/:id, learners, instructors, assessment-library, content-library, reports, grading portal + 3 children, analytics, ViewClass, ViewStudent, and 3 legacy redirects.
- No SOM route requires `manage_school_of_ministry`. All write gating is in-component via `canManageCurrentRoute` (which resolves to `School_of_ministry` manage).
- **`View Certificate`** (`ministry-school/programs/cohort/class/student/certificate`, appRoutes.tsx:1279-1282) has **no `permissionNeeded` and no `isPrivate`**. It sits under the authenticated home shell only. The page (`SOM/pages/ViewCertificate.tsx:13-43`) renders **hard-coded mock data** and has no API calls, so it's dead or demo code with Print/Download icons (:163, :166).
- **`Program` domain** (`accessControl.ts:24, 97, 223-225, 378-379`; also listed in Settings `settingsModel.ts:49` as "Program setup and enrolment administration") is **not used by any route or component**. `view_program`/`manage_program` are only referenced in accessControl.ts, so admins can grant it but it does nothing.
- The grading portal `<Instructor isAdmin />` (appRoutes.tsx:1189) only needs view. Its HeaderControls sets `requireManageAccess={false}` (MPg/Instructor.tsx:70), but it has no button anyway.

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| New program | SOM/lms/ProgramsPage.tsx:116-120, 137-141; `?new=1` auto-open :20 | route-derived manage | |
| Edit program (list) | ProgramsPage.tsx:90 | route-derived manage | |
| **Delete program** | ProgramsPage.tsx:93-100 → useProgramEditor.tsx:104-116 (`api.delete.deleteProgram`) | route-derived **manage** | **Not admin. Destructive** |
| Edit program / New cohort (workspace header) | SOM/lms/ProgramWorkspace.tsx:118-126, 140, 200-203 | route-derived manage | |
| Cohort card: + Class / Edit / **Delete cohort** | ProgramWorkspace.tsx:288-293 → useCohortEditors.tsx:47-55 (`api.delete.deleteCohort`) | route-derived **manage** | Delete not admin |
| Curriculum: modules create/edit/delete, reorder, move units, delete unit, due rules, add from library, new unit (TopicBasicInfoForm with file upload) | SOM/lms/curriculum/ModuleBoard.tsx:188, 235, 280, 305, 314, 327; mutations :79, 104, 126, 145-146, 154-156 (delete module), 163-164 (delete unit), 170; modals :402-427 | route-derived **manage** | Deletes not admin. Instructor `can_edit_curriculum` ability not consulted |
| Grading model / completion rules save | SOM/lms/curriculum/GradingModelPanel.tsx:71-182 (`api.put.updateProgramGrading` :47) | route-derived manage | |
| Attach rubric / add bank questions to unit | SOM/lms/assessment/ProgramAssessments.tsx:130-147 (:50, :64) | route-derived manage | |
| Program instructors: + Add, toggle abilities, Remove | SOM/lms/people/ProgramInstructorsPanel.tsx:98 (add), 144-156 (abilities), 83-89 (remove `api.delete.removeProgramInstructor`) | route-derived manage (whole panel returns early at :48) | Sets **backend instructor abilities** `can_grade`, `can_attendance`, `can_message`, `can_edit_curriculum` (:18-23). Cross-domain read of members (`useStore.membersOptions`) |
| **Issue certificates** (Issue all / per learner) | SOM/lms/assessment/ProgramCertificates.tsx:138-143, 160-164 (`api.post.issueCertificates` :83) | route-derived manage (`canIssue`) | Copy says "managed by instructors…" but instructors without manage can't issue |
| View / Download certificate PDF | ProgramCertificates.tsx:126-128, 182 | route-derived manage (panel hidden at :100) | |
| Edit cohort / Add class | SOM/lms/CohortWorkspace.tsx:105-112, 133-136 | route-derived manage | |
| Edit class / **Delete class** | CohortWorkspace.tsx:183-188 → useCohortEditors.tsx:61-69 (`api.delete.deleteCourse`) | route-derived **manage** | Delete not admin |
| Open class (→ ViewClass) | CohortWorkspace.tsx:191 | NOT GATED (navigation) | Opens a page where enroll/unenroll is **ungated** (see below) |
| Assessment Open (activate, set due) / Close (deactivate) | CohortWorkspace.tsx:420-433, 467 (`activateCohortAssignment` / `deactivateCohortAssignment` :360-361) | route-derived manage | Publish/unpublish of assessments |
| **Grade** (→ grading portal) | CohortWorkspace.tsx:435-441 | **NOT GATED** | Navigates to GradingPanel, where grading is ungated |
| Schedule: set/clear cohort due date, grant/remove extension | SOM/lms/CohortSchedule.tsx:137, 146-151, 175-182 (`removeAssignmentExtension`), 194-203; mutations :56, :69 | route-derived manage | |
| Gradebook: Export CSV, override/excuse/zero, bulk update, "zero missing" | SOM/lms/assessment/CohortGradebook.tsx:236-238 (export), 185, 242-266, 308-309 (zero missing), 128 (`setGradeOverrides`) | route-derived manage (whole gradebook returns early at :188) | Copy says "available to instructors…", but instructors are not recognised |
| Grade submission (rubric / numeric) via modal | SOM/lms/assessment/GradingModal.tsx:53-54, 185 | route-derived manage (only reachable from gradebook) | |
| Sessions: create, edit, cancel/restore, delete, take attendance, mark all present | SOM/lms/teaching/CohortSessions.tsx:268, 290, 393, 396, ~400; 203, 212, 220 (`deleteLmsSession`), 662 (`saveSessionAttendance`), 698 | route-derived manage (panel returns early at :226) | `can_attendance` ability not consulted |
| **Send / schedule cohort announcement** | SOM/lms/teaching/CohortAnnouncements.tsx:325-328, 348 (`api.post.sendCohortAnnouncement` :164) | route-derived manage (panel returns early at :175) | Notification/send action. `can_message` ability not consulted |
| Enrollment applications Approve / Decline | SOM/lms/people/ReviewQueue.tsx:54-72, 100 (`decideLmsApplication`) on LearnersPage.tsx:72 | route-derived manage (component returns null at :82) | Approve/reject: candidate for its own action permission |
| Question bank create/edit/delete | SOM/lms/assessment/QuestionBank.tsx:145, 160, 179; delete :105-106 | route-derived manage (page gated at AssessmentLibraryPage.tsx:41) | Delete at manage |
| Rubrics create/edit/delete | SOM/lms/assessment/Rubrics.tsx:66, 92; delete :56-57 | route-derived manage | Delete at manage |
| Content library create/edit/delete | SOM/lms/library/ContentLibraryPage.tsx:418 (create), 233-236, 403-404 (delete) | route-derived manage (page shows empty block at :426) | Delete at manage |
| Use library item in unit | SOM/lms/library/LibraryPickerModal.tsx:60 | route-derived manage (opened from ModuleBoard) | |
| Reports: Export CSV | SOM/lms/reports/ReportsPage.tsx:308-310 (handler ~247) | route-derived manage (page empty at :278 for view users) | Sends `buildBranchQuery` (:230) |
| Dashboard manage widgets (pending applications, next sessions, learners link) | SOM/lms/SomDashboard.tsx:47-48, 114, 187 | route-derived manage | |
| Instructors overview | SOM/lms/InstructorsPage.tsx:45, 74, 94 | route-derived manage (view users get the derived list) | No actions |
| **Enroll student** (ViewClass) | SOM/Components/AllStudents.tsx:352-357 → StudentForm.tsx:89-93 (Actions submit "Submit") → ViewClass.tsx:70 (`api.post.enrollUser`) | **NOT GATED** | Raw `<button>`, and "Submit" doesn't match the regex |
| **Bulk Set Active / Completed / Pending, Unenroll** (ViewClass) | AllStudents.tsx:373-384; handler ViewClass.tsx:179-193 (`api.post.unenrollUser`), 214 (`api.put.updateEnrollment`) | **NOT GATED** (only the LMS feature flag `server_student_operations`, default `true`, overridable via localStorage `lms.flag.*`; SOM/utils/lmsGuardrails.ts:19-58) | View-only users can unenroll or complete learners |
| Topic assessment Edit → Apply Score / Apply Status / Submit (ViewStudent) | SOM/Components/TopicAssessment.tsx:355 (Edit), 393-396, 413-416, 447-453; SOM/pages/ViewStudent.tsx:30 (`updateStudentProgress`) | route-derived manage (Button "Edit" regex). Apply/Submit only render in edit mode | Implicit gate only |
| Analytics | SOM/pages/MinistrySchoolAnalytics.tsx:259-262 | HeaderControls, no btn | Fetches all programs/cohorts/courses (:76-87) with no branch filter beyond the header |
| ViewCertificate Print / Download | SOM/pages/ViewCertificate.tsx:163, 166 | NOT GATED (no route permission) | Mock data only |
| Public program pages / apply | SOM/pages/ProgramDetails.tsx, ProgramInformation.tsx (`/out/programs/:name[/apply]`, `/programs/:name[/apply]`, `isPrivate: false`, appRoutes.tsx:1365-1376, 1444-1454); ProgramApply.tsx:84 (`applyToProgram`, needs `user.id` :74) | public / self | Member self-service; out of admin scope |
| Unused legacy components | SOM/Components/AllTopics.tsx (has its own `canManageCurrentRoute` gating, :207, 273-286), CertificatePreview.tsx, DownloadCertificate.tsx | n/a | No importers found |

#### Data visibility
- `SomDataProvider` fetches **all** programs with full details (`fetchProgramsFullDetails`, which is not branch-scoped server-side per the comment at `utils/api/apiFetch.ts:560`). It filters them **client-side** by `activeBranchId` (SOM/lms/SomDataProvider.tsx:100-110). With ALL_BRANCHES, everything shows. All cohorts, learners, enrollments and instructor lists derive from this, so every view user sees every learner's progress, health and contact details.
- No instructor-vs-admin scoping in the admin LMS. Nothing reads `user.instructor`, the instructor roster, or `InstructorAbilities` to limit cohorts, classes or actions. `can_grade` / `can_attendance` / `can_message` / `can_edit_curriculum` are **written** (ProgramInstructorsPanel) but **never read** anywhere in the frontend (grep shows only API types + this panel). UI copy repeatedly claims "instructors and School of Ministry managers" (CohortGradebook.tsx:188, CohortSessions.tsx:227, CohortAnnouncements.tsx:176, ProgramCertificates.tsx:101, AssessmentLibraryPage.tsx:42), but only `School_of_ministry` manage is checked.
- LearnersPage filters by program/attention only (SOM/lms/LearnersPage.tsx:45-61). ReviewQueue scopes by `programId` filter only (ReviewQueue.tsx:39).
- ReportsPage is the only SOM page that sends an explicit branch query (ReportsPage.tsx:230).

#### Gaps / observations
- **Enroll, unenroll and bulk status changes on ViewClass are completely ungated.** Any `view_school_of_ministry` user can reach them via CohortWorkspace "Open class".
- **Grading is reachable ungated** via CohortWorkspace "Grade" → GradingPanel (see the next section).
- Deletes (program, cohort, class, module, unit, question, rubric, library item, session, instructor removal) are all gated at **manage**, not admin. This is inconsistent with the platform convention (Action/ActionButton/Button delete = admin).
- Clear candidates for distinct action permissions:
  - `som.enroll` (enroll/unenroll/status)
  - `som.decide_application` (approve/decline)
  - `som.grade` (grade/override)
  - `som.publish_assessment` (open/close)
  - `som.attendance`
  - `som.announce` (send)
  - `som.issue_certificate`
  - `som.export` (gradebook/report CSV)
  - `som.manage_curriculum`
  - `som.manage_instructors`

  The backend already has per-program instructor abilities that map onto several of these.
- Visibility scope needed: "instructor's own programs/cohorts/classes" vs "branch" vs "all". Today it's branch (client-side filtered) or all.
- The `Program` permission domain is dead. Either wire it up (e.g. enrolment administration) or remove it from Settings.
- The `ViewCertificate` route has no permission and shows mock data. Remove it or gate it.

---

### Instructor portal / grading (shared admin + member routes)

#### Routes
- Admin: `ministry-school/<instructorPortal>` → `<Instructor isAdmin />` + children `InstructorProg`, `InstructorCohort`, `InstructorAssMan`, `GradingPanel`, all `view_school_of_ministry` (appRoutes.tsx:1187-1222).
- Member: `relativePath.member.schoolOfMinistries.instructorPortal` → `<Instructor />` + the same 4 children, **`isPrivate: false`, no `permissionNeeded`** (appRoutes.tsx:1669-1699). The only "instructor" check is cosmetic: the member nav link appears only when the JWT has `instructor` (HomePage/Components/Header.tsx:127, 161; MPg/school/learnerPaths.ts:29). Any logged-in member who types the URL gets the portal, and with no permissionNeeded, `canManageCurrentRoute` is true there.

#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| View program / View details (nav) | MPg/InstructorProg.tsx:141-145; MPg/InstructorCohort.tsx:124-128 | NOT GATED (nav) | |
| **Activate assignment** (with due date) | MPg/../Component/AssignmentManager.tsx:140-146, 189-195 (`api.put.activateCohortAssignment` :41-43) | **NOT GATED** | Plain `Button` "Activate" (no regex match). This is publish |
| **Deactivate assignment** | AssignmentManager.tsx:125-131, 226-233 (`deactivateCohortAssignment` :46-48) | **NOT GATED** | |
| Grade (nav to panel) | AssignmentManager.tsx:133-136 | NOT GATED | |
| **Quick grade buttons** (e.g. 100/90/80/70) | MPg/GradingPanel.tsx:419-427 → `api.put.gradeAssignmentSubmission` :247 | **NOT GATED** | Button label is a number |
| Custom grade / ✓ save | GradingPanel.tsx:430-433, 391-396 | **NOT GATED** | |
| Edit existing grade | GradingPanel.tsx:406-411 | route-derived manage (Button "Edit" regex) | Admin route: needs SOM manage. Member route: always allowed. Inconsistent with the ungated first-time grade |
| **Bulk grade** (table bulk action N%) | GradingPanel.tsx:559-567 → `api.put.gradeAssignmentSubmissions` :277 | **NOT GATED** | |
| Instructor header | MPg/Instructor.tsx:63-71 | `requireManageAccess={false}` | No button |

#### Data visibility
- `InstructorProg` sends `{ instructorId: <current user id> }` (MPg/InstructorProg.tsx:56-58). This is the **only** instructor scoping, and it's a client-supplied filter. On the admin route, a SOM admin also only sees programs **they** instruct, not all programs.
- `InstructorCohort` fetches **all cohorts of `:programId`** from the URL (InstructorCohort.tsx:40-42). `InstructorAssMan` fetches assignments by `:cohortId` (InstructorAssMan.tsx:25-28). `GradingPanel` fetches results by program/cohort/topic from the URL (GradingPanel.tsx:193-201). None of these check ownership on the frontend, so changing the URL reaches any cohort. Enforcement depends entirely on the backend.

#### Gaps / observations
- Grading, bulk grading and assignment activate/deactivate are ungated on both routes. A view-only SOM user (admin route) or any member (member route) can grade and publish assessments unless the backend refuses.
- "Edit grade" is gated (by regex) while "first grade" isn't. That's an accidental, inconsistent gate.
- The member instructor route needs a real guard: JWT `instructor` claim and/or roster membership, plus backend `can_grade` ability checks.
- Admin "Grading" portal lists programs by the *current user's* instructor id, so SOM managers who don't instruct see an empty portal even though the dashboard/InstructorsPage link them to it (SomDashboard.tsx:~162, InstructorsPage.tsx:82).

---

# Part E: Communication, Community, Home/Workspaces, Analytics, AI, Notifications, Shell/Sidebar, Settings (General + Users)

All paths are relative to `src/`. Line numbers are from the working tree on `feat/history-back-navigation`.

## Cross-cutting facts (scope E)

- **None of these modules uses the implicit `Button`/`Action`/`ActionButton`/`HeaderControls` regex gates.** Communication, Settings, Users and Workspaces all use their own local `UiButton`/`<button>` components (`pages/HomePage/pages/ChurchCommunication/ui/commUi.tsx`, `Settings/Components/settingsUi.tsx`). Every gate in this part is either an **explicit** `useAccessControl()` check, a **backend flag**, or nothing at all. There are **no route-derived gates** here.
- **Branch scope is sent on every request.** `axiosInstance.js:162-168` adds an `X-Branch-Id` header with the active branch (it is omitted for ALL_BRANCHES). So Community, Messaging, Sermons, Promotions and Themes are branch-scoped **on the server** even though their pages never call `buildBranchQuery` (`grep branch` returns nothing in `ChurchCommunication/`). `useFetch` re-runs when the branch changes (`CustomHooks/useFetch.tsx:62-102`).
- **Permissions are per branch.** `utils/branchAccess.ts:43-57` `resolveBranchPermissions` picks the grant for the active branch. With ALL_BRANCHES it merges grants and keeps the **highest** level per module (`mergePermissionsAtHighest`, :17-37). Exclusions and scopes come from the **first** grant that sets them, so in "all branches" mode a scope like `assigned_departments` can be lost or wrongly applied.
- **Explicit-grant domains.** `utils/accessControl.ts:802` `EXPLICIT_GRANT_DOMAINS = ["Community","Messaging"]`: presets and defaults create these as `No_Access` (:808-815).
- **Domain fallbacks** (`accessControl.ts:121-136`): `Community → Announcements`; `Promotions → Community, Announcements`; `Reports → Settings, Access_rights`. A role that has never set Promotions therefore manages Promotions if it manages Community.
- **Legacy key quirk:** `manage_users` maps to `{Members, manage}` and `view_users` to `{Members, view}` (`accessControl.ts:400-401`). There is no Users domain.

---

## Routing & sidebar mechanics

### Routes (appRoutes.tsx)
| Route | Line | permissionNeeded | element? |
|---|---|---|---|
| `home` "" and `dashboard` (Home) | 241-251 | none, `isPrivate:false` | yes |
| `notifications` | 254-257 | none (isPrivate true) | yes |
| `ai` AI Console | 260-264 | `{domain:AI, action:view}` | yes |
| `communication` (parent) | 630-634 | `view_theme` | **no element** |
| ↳ "" Communication Default | 639-643 | none, `redirectOnly:true` | `CommunicationIndexRedirect` |
| ↳ `theme-manager` | 646-651 | `view_theme` | yes |
| ↳ `community` | 654-659 | `view_community` | yes |
| ↳ `announcements` → redirect | 663-667 | `view_community` | Navigate |
| ↳ `promotions` | 670-675 | `view_promotions` | yes |
| ↳ `sermons` | 678-683 | `view_sermons` | yes |
| ↳ `messaging` | 686-691 | `view_messaging` | yes |
| `settings` (parent) | 1284-1288 | `view_settings` | **no element** |
| ↳ "" (alias `departments`) General configuration | 1290-1297 | `view_settings` | yes |
| ↳ `access-rights` (+ `:roleId`, `manage-access`) | 1299-1320 | `view_access_rights` | yes |
| ↳ `users` | 1322-1328 | `manage_users` (= **Members manage**) | yes |
| ↳ `approvals` / `approval` | 1330-1344 | `view_settings` | yes |
| `/member/notifications` | ~1708 | isPrivate false | yes |
| `/member/community` (+ `posts/:id`) | 1714-1731 | isPrivate false | `CommunityLayout` |

### How access to a route is enforced
- `routes/RenderRoutes.jsx:9-13`: a route is forbidden **only if it is private and has an element**. Parents with no element (`communication`, `settings`) are never forbidden, so their `view_theme` / `view_settings` requirement applies **only to sidebar visibility** and does nothing at render time.
- `RouteAccessProvider` wraps each element with that route's own requirement (`RenderRoutes.jsx:15-19`). Children such as `communication/messaging` therefore get `canManageCurrentRoute` from `view_messaging` → `Messaging:manage`. This is unused here because no implicit-gate components are used.
- `CommunicationIndexRedirect.tsx:6-23` sends `/home/communication` to the first child the user can open (theme → community → promotions → sermons → messaging), or to `/home/access-denied`.

**Can a user with Messaging but no Theme reach Messaging? Yes.**
1. `routeAccess.ts:26-47` `filterRoutesByAccess` keeps a parent that fails its own check when it has a visible child. `messaging` is visible, so the Communication rail icon shows. `redirectOnly` children are dropped at :27, so the index redirect does not keep the parent alive on its own.
2. The rail links to the parent path (`SideBar.tsx:187` `to={resolveHomePath(item.path)}`) → `/home/communication`. The parent has no element, so it is not forbidden. The index redirect sends the user to `messaging`, and `view_messaging` lets them in.
3. SubNav lists only the filtered children (`SubNav.tsx:16-19`, which reads `activeTab.children` from the filtered tree).

**Settings has the same pattern but a broken landing.** A user with Members:manage (passes `manage_users`) but no Settings:view:
- sees the Settings rail icon (the Users child is visible),
- clicks it and lands on `/home/settings`, whose index child is General configuration (`view_settings`). That child is forbidden, so the user goes to `/home/access-denied`. Settings has **no index redirect** like Communication's. The user must click "Users" in the SubNav.
- The reverse case: Settings:view alone does **not** grant Users (it needs Members:manage).

### Sidebar visibility
- `routes/appRoutes.tsx:1824-1826` `sideTabs` = home children with `sideTab:true`.
- `pages/HomePage/Components/useSideNavTabs.ts:22-28`: `groupSideTabs(filterRoutesByAccess(sideTabs, access_permissions, permissions))`.
- `routes/sideNavGroups.ts:14-29` groups the tabs: Overview[Home, Reports], People[Membership, Visitors, Life Centers, Attendance, Ride to church], Engagement[Events, Communication, Appointments, School of Ministry], Operations[Finance, Requisition, Assets, Market Place], Administration[Settings]. Unlisted tabs go into a trailing section (:49). The access-level editor uses the same groups (`ACCESS_LEVEL_DOMAINS[].group`).
- `SideBar.tsx:81-95` drops any tab without an icon in `sidebarIcons` (`pages/HomePage/utils/sideBarIcons.ts`; Home :22, Communication :30, Settings :35). A route added without an icon is silently hidden from the rail.
- Mobile: `MobileSideBar.tsx:13` → `SidebarNavList` → `SidebarItem` → `SidebarSubmenu.tsx:79-83`, which filters children again with `child.sideTab && hasPermission(child.permissionNeeded)`. This is redundant with `filterRoutesByAccess` but consistent.
- Home is `isPrivate:false`, so it always shows. Notifications and AI are not `sideTab`.
- Header AI entry: `Header.tsx:139` `showAdminAiEntry = !isMemberRoute && canView("AI")` (button at :515).
- Header "Go to admin/member portal": `Header.tsx:559-568`, gated by the JWT `ministry_worker` claim (`:125`). This is a **role/user-field check**.
- `isInstructor` (`Header.tsx:127`) comes from the token and controls the member-portal school menu.

### Branch switcher (`pages/HomePage/Components/BranchSwitcher.tsx`)
- Options are `selectAccessibleBranches` (:41). Each option is labelled with the role held in that branch, from `branch_access` (:53-55).
- "All my branches" is offered when the user has 2 or more branches (:63-73).
- The allowed list comes from `utils/branchAccess.ts:64-74` `resolveAllowedBranchIds`: admins get the branches they hold grants in; members get their home `branch_id` (a **user_category check**).
- Not permission-gated otherwise. Hidden on member routes (`Header.tsx:529`).

---

## Communication → Annual Theme Manager
#### Routes
`communication/theme-manager` requires `view_theme`. The page gates actions with `hasPermission("manage_theme")`. No mismatch.
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| New theme (header) | ChurchCommunication/AnnualThemeManager.tsx:210-211 | explicit `manage_theme` (Theme:manage) | |
| "Create {next} theme" gap banner | AnnualThemeManager.tsx:94, 218-222 | explicit Theme:manage (`showGap` includes canManage) | |
| Edit theme (hero) | :245-249 | explicit Theme:manage | |
| New theme (empty state) | :284-285 | explicit Theme:manage | |
| Edit (card) | :302-304 | explicit Theme:manage | |
| Make current (publishes to app home) | :309, :164-177 | explicit Theme:manage | Has a publish-like effect but only needs manage |
| Delete theme | :316, :179-191 | explicit **Theme:manage** (not admin) | Inconsistent with the platform rule that delete needs admin |
| Artwork upload | :127-136 | inside the gated dialog | `usePictureUpload` |
#### Data visibility
Lists all themes (`useFetch(api.fetch.fetchAnnualTheme)` :76). No user filter; server branch scope comes from `X-Branch-Id`.
#### Gaps
- Delete is gated at Manage, not Super_Admin.
- "Make current" publishes straight to every member's home screen. It is a candidate for a distinct `publish_theme` action.

## Communication → Community admin (CommunityManager)
#### Routes
`communication/community` requires `view_community`. Actions use `hasPermission("manage_community")` (CommunityManager.tsx:106-107). Community is an explicit-grant domain.
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| New church message (post as church, whole church or one department) | ChurchCommunication/CommunityManager.tsx:296-298, 206-250 | explicit Community:manage | Any department can be targeted (all from `fetchDepartments` :211-215), not only the user's own |
| "Send a push notification" toggle on church message | :651-653 (in dialog) | inside the Community:manage dialog | Mass push. No separate permission |
| Pin / Unpin post | :269-270, 176-181 | explicit Community:manage (`postActions` returns null when `!canManage`, :259) | |
| Remove post | :274, 147-174 | explicit Community:manage | Has confirm and undo |
| Restore post | :264 | explicit Community:manage | |
| Reports: Keep it (dismiss) | :545 | explicit Community:manage | |
| Reports: Warn author | :548 | explicit Community:manage | |
| Reports: Remove post/comment | :551-556, :562 | explicit Community:manage | |
| Reports: Restore | :560 | explicit Community:manage | |
| **View real author of anonymous posts** | :282-283 (`authorOf`), 413, 447, ~518 (reports) | **only route `view_community`** | Every Community:view holder sees `realAuthor.name` for every anonymous post and report. There is no per-reveal action, and the audit log records `VIEW_ANON_AUTHOR` (:81) on the server |
| Read audit log | :129, audit tab | route `view_community` | |
| Ban / suspend member | — | **not present** | No ban action exists in the web admin. Only "Warn author" |
#### Data visibility
All posts, reports and audit entries (:126-129) with no user or department filter. Branch scope comes from the header.
#### Gaps
- Revealing anonymous authors is bundled into **view**. It should be its own action permission (e.g. `reveal_anonymous_author`), separate from moderating.
- Warn, remove and restore all sit at Manage. There is no admin tier and no ban.
- `MemberCommunityPage.tsx:35` links moderators to `/home/communication/community?tab=reported`, but CommunityManager never reads `?tab` (no `useSearchParams`; tab state defaults to "posts" at :109). This is a broken deep link.
- The member portal decides "is moderator" from the backend (`me.canModerate`), while the admin route uses frontend `view_community`. They can disagree.

## Communication → Promotions
#### Routes
`communication/promotions` requires `view_promotions`. Actions use `hasPermission("manage_promotions")` (PromotionManager.tsx:127-128). Promotions falls back to the Community level, then Announcements (`accessControl.ts:132`).
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| New promotion | PromotionManager.tsx:297-298 | explicit Promotions:manage | |
| Reorder (up/down arrows) | :352-365, 162 | explicit Promotions:manage | |
| Edit | :445 | explicit Promotions:manage | |
| Publish / Unpublish | :449, :453, 171-186 | explicit Promotions:manage | Publish happens straight to the mobile app home |
| Save and publish | :256-260 | in the gated dialog | |
| Delete | :457, 198-210 | explicit **Promotions:manage** (not admin) | |
#### Data visibility
`fetchPromotions {take:100}` (:129). Everything, branch-scoped by the header.
#### Gaps
- Delete at Manage.
- Publish is not a distinct action.
- The Community→Promotions fallback silently grants banner control to community managers.

## Communication → Sermons
#### Routes
`communication/sermons` requires `view_sermons`. Actions use `hasPermission("manage_sermons")` (SermonManager.tsx:77-78).
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| New series / New sermon | SermonManager.tsx:306-309 | explicit Sermons:manage | |
| Publish / Unpublish toggle | :438-444, 120-137 | explicit Sermons:manage | |
| Edit sermon | :448 | explicit Sermons:manage | |
| Delete sermon | :451, 141-152 | explicit **Sermons:manage** | |
| Edit series / Delete series | :501, :504, 280-290 | explicit Sermons:manage | Deleting a series affects its sermons |
| **Publish sermon from Home workspace queue** | DashBoard/workspaces/queueActions.ts:230-240 | **NOT GATED in frontend** | See Workspaces |
#### Data visibility
`fetchSermons` / `fetchSermonSeries` take 100 (:80-81). No user filter.

## Communication → Messaging (Messaging/)
#### Routes
`communication/messaging` requires `view_messaging`. Actions use `hasPermission("manage_messaging")` (MessagingManager.tsx:56-57). Messaging is an **explicit-grant** domain because SMS costs money (`accessControl.ts:799-802`).
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Settings (app store links, birthday send time) | Messaging/MessagingManager.tsx:158, save :105-128 (`api.put.updateMessagingSettings` :115) | explicit Messaging:manage | |
| New message (opens composer) | :161 | explicit Messaging:manage | Only entry point to `MessageCompose` |
| **Send now / Schedule bulk SMS, email, in-app** | Messaging/MessageCompose.tsx:200-240 (`confirmAction` :205, `api.post.createGeneralMessage` :218) | indirect: composer reachable only via Messaging:manage button | `MessageCompose` has no permission check of its own. The confirm shows the people count and SMS segments (:204-214) |
| Audience = whole church (+guests, +visitors) | MessageCompose.tsx:107-117, 289-300 | Messaging:manage (indirect) | **No department or own-scope restriction** |
| Audience = departments | :315-325, list from `fetchDepartments` :103-105 | Messaging:manage (indirect) | Any department, not only those the sender leads |
| Audience = specific people (member search) | :169 `searchCommunityMembers` | Messaging:manage (indirect) | |
| Channel choice SMS / Email / In-app | :391-415 | Messaging:manage (indirect) | **SMS (paid) is not separated from in-app (free)** |
| Audience counting | :115-117, 153-154 `api.post.countMessageAudience` | fires on compose mount | |
| Preview | Messaging/useMessagePreview.ts:30 | — | |
| Duplicate dispatch | MessagingManager.tsx:524 | explicit Messaging:manage | |
| Cancel scheduled message | :525, 490-503 | explicit Messaging:manage | Not tied to the sender (no ownership check) |
| Retry failed recipients (resends SMS) | :526-528, 476-488 | explicit Messaging:manage | Costs money. No ownership check |
| Automatic templates: enable toggle, channels, subject, body, app link, Save/Discard | Messaging/AutomaticMessages.tsx:208, 219-221, 236, 244, 249, 253, 268-273 (`api.put.updateMessageTemplate` :173) | explicit Messaging:manage (passed as prop, MessagingManager.tsx:329) | Turns on automatic SMS for every new member, guest or visitor and every birthday |
| View history, KPIs, SMS used | MessagingManager.tsx:71-73, 180-190 | route `view_messaging` | |
#### Data visibility
`fetchMessageDispatches {kind:"GENERAL", filter, page, limit}` (:70-72). This is **every** sender's dispatches, with no "mine" filter, branch-scoped by the header.
#### Gaps
- One Manage level covers sending SMS, editing auto-templates, retrying (spending) and cancelling other people's messages. Candidates for separate actions: `send_sms`, `send_email`, `send_inapp`, `schedule_message`, `edit_auto_templates`, `retry_failed`.
- No audience scope. A department head granted Messaging can text the whole church. It needs an `assigned_departments`-style scope on the audience picker.
- Cancel and retry have no ownership check.

---

## Community (member portal: `pages/HomePage/pages/Community/`)
#### Routes
`/member/community` and `/member/community/posts/:id`, `isPrivate:false`. No frontend permission. All authority comes from the **backend `GET /community/me`** (`hooks/useCommunityMe.ts:15-33`), which returns `canManage`, `canModerate`, `departments` and `pendingReports`. The defaults are false (:5-11).
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Whole page for guests | CommunityLayout.tsx:10-16 → `MembersOnlyNotice` | role/user-field check: JWT `is_guest` (`utils/communityHelpers.ts:13-19`) | |
| Create post (prayer, testimony, discussion) | components/CreatePostModal.tsx:251 | NOT GATED (any member) | |
| Post as "MESSAGE" type | CreatePostModal.tsx:136-138 | backend flag `me.canManage` | |
| "Mark as important" (pin 7 days + send to audience) | CreatePostModal.tsx:245, 557 | backend flag `me.canManage` | |
| Post anonymously | CreatePostModal.tsx:204-205, 244 | NOT GATED | Any member, any audience except Only me |
| Post to a department | CreatePostModal.tsx:239, 385-387; MemberCommunityPage.tsx:46-56 | backend list `me.departments` (own departments only) | Real scope filter |
| Reply / reply anonymously | CommunityPostPage.tsx:194-205 | ownership: anonymous reply only if `post.isMine && post.isAnonymous` | |
| React to post / comment | PostCard.tsx:113; CommentItem.tsx:94 | NOT GATED | |
| Delete own post / comment | components/ContentOptionsMenu.tsx:74-75 (`isMine`) | ownership check (`isMine` from API) | |
| Delete someone else's post / comment | ContentOptionsMenu.tsx:99; PostCard.tsx:171; CommentItem.tsx:175 (`canDelete={canManage}`); CommunityInteractions.tsx:170-180 | backend flag `me.canManage` | Moderator delete from the feed. **Not logged as moderation in the UI** |
| Report | ContentOptionsMenu.tsx:78-84; CommunityInteractions.tsx:90 | NOT GATED | |
| Hide / Undo hide (self only) | :86-91; CommunityInteractions.tsx:139-151 | NOT GATED | Per-viewer |
| Block / unblock member (self only) | :93-98; CommunityInteractions.tsx:119; BlockedMembersPanel.tsx:34 | NOT GATED | Per-viewer |
| "Reported content" link to admin | MemberCommunityPage.tsx:236-259 | backend flag `me.canModerate` | Target route still needs frontend `view_community`; the `?tab=` is ignored (see above) |
| Notifications mark read / mark all read | CommunityNotificationsPanel.tsx:89, 106 | own | |
#### Data visibility
- The feed is server-filtered (`filter` / `departmentId`, MemberCommunityPage.tsx:78-81).
- `?department=` is honoured only for the user's own departments (:46-56).
- Anonymous posts show "Anonymous" here (`communityHelpers.ts:161-163`). Only the admin page reveals the author.

---

## Home / Dashboard & Workspaces (`pages/HomePage/pages/DashBoard/`)
#### Routes
`/home` and `/home/dashboard` are `isPrivate:false`, so the `RouteAccessProvider` requirement is undefined and `canManageCurrentRoute = canAdminCurrentRoute = true`.
#### How workspaces are granted
- Tabs come from `store/userStore.ts:210-217` `useActiveWorkspaces` → `utils/branchAccess.ts:81-95` `resolveBranchWorkspaces(branch_access, activeBranchId)`. The server supplies `branch_access[].workspaces` per branch. ALL_BRANCHES gives the **union**.
- Tabs are hidden on member routes (DashboardPage.tsx:60-67). `?ws=` is honoured only if granted (:66-67).
- Role editor defaults are in `Settings/access/workspacesModel.ts:84-94` `deriveWorkspaces`: Reports ≥ Super_Admin → prelate; Settings ≥ Manage **or Members ≥ Manage** → admin; Financials ≥ Manage → finance; Departments ≥ Manage with scope `assigned_departments` → hod; otherwise generic. Workspaces are saved per role (`workspacesOf` :97-98), and the note says "change them on the role, not per person" (:105-110).
- Fetch: `utils/api/workspaces/workspaceApi.ts:13-19` `GET workspaces/:ws?range&branch_id&department_id&att_event`. WorkspaceView.tsx:89-101 sends `buildBranchQuery(activeBranchId)` plus `department_id` for hod.
#### Actions + gating (all inside the workspace the role grants; **no per-action frontend permission checks**)
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Queue inline buttons | workspaces/WidgetRows.tsx:122-136 | workspace grant + **server decides which items appear** | No `useAccessControl` |
| Queue modal buttons | workspaces/QueueModal.tsx:286-297 | same | |
| Approve requisition | workspaces/queueActions.ts:104-111 | NOT GATED client-side (cross-domain Requisition) | |
| Reject requisition (note) | queueActions.ts:113-122 | NOT GATED client-side | |
| Approve / Return department report | queueActions.ts:134-151 | NOT GATED client-side (cross-domain Reports) | Only when `item.selector` is present |
| Confirm appointment / Reschedule (navigates) | :153-171 | NOT GATED client-side (Appointments) | |
| Approve / Decline join request | :172-191 | NOT GATED client-side (Departments / membership) | |
| Assign visitor (adds responsible member) | :192-209 | NOT GATED client-side (Visitors) | Fetches the visitor, then calls `setResponsibleMembers` |
| Approve / Return weekly finance record | :210-229 | NOT GATED client-side (Financials) | |
| Publish sermon | :230-240 | NOT GATED client-side (Sermons) | |
| Record visitor follow-up | :241-258 | NOT GATED client-side (Visitors) | |
| Export (finance workspace; exportable widgets) | workspaces/WorkspaceView.tsx:286-296, 379-400 | finance workspace grant only | Financial data export with no separate permission |
| New weekly record (finance) / New requisition (hod) / Give (generic) | WorkspaceView.tsx:299, 305, 310 | workspace grant; target route enforces its own permission | |
| Register for event (Home, workspace) | Components/NextUpHero.tsx:40; Components/EventCard.tsx:277; workspaces/widgets/GenericParts.tsx:30 | self-service | |
| Quick actions (member links) | Components/QuickActions.tsx:6-12 | none | |
#### Data visibility
- Home overview events are filtered to the user's departments and positions (`DashboardPage.tsx:119-122`, `utils/homeUtils.ts:134-172` `userAudienceIds` / `upcomingEventsFor`). This is a **user-field filter** (`user.department`, `user.department_positions`).
- Appointments are filtered by `requesterId = user.id` (DashboardPage.tsx:125-133).
- The HOD workspace uses the departments the server says the user leads (`WorkspaceView.tsx:115-117`, dept picker :270-276; "You don't lead a department yet" :361).
- The admin and prelate widgets vary by `allBranches` (WorkspaceView.tsx:46, 193).
#### Gaps
- The Home queue is a **second approval surface** that never checks Requisition, Financials, Reports, Sermons or Visitors permissions in the UI. It relies entirely on the server returning only actionable items and on the endpoints enforcing access. If action permissions are added, both the queue builder (server) and `actionsFor()` need them.
- The `admin` workspace defaults on for Members:manage. Anyone who can edit members gets the admin approval queue by default.
- Finance workspace Export has no export permission.

## Analytics (`pages/HomePage/pages/Analytics/`)
There are **no routes and no pages**. It is a shared library: `contracts.ts`, `utils.ts`, `chartSetup.ts`, `types.ts`, and the components `AnalyticsDateFilters`, `AnalyticsStatCards`, `AnalyticsContractsPanel`. It is imported by `Attendance/AttendanceAnalytics.tsx`, `VisitorManagement/pages/VisitorAnalytics.tsx`, `MembershipManagement/pages/MembershipAnalytics.tsx` (+ components/analytics/*), `MinistrySchool/pages/MinistrySchoolAnalytics.tsx` and `MarketPlace/pages/MarketplaceAnalytics.tsx`. It contains no actions and no permission checks. Gating comes from each consuming route.

## AI (`pages/HomePage/pages/AI/AIConsole.tsx`, `Components/AiChatbotWidget.tsx`)
#### Routes
`ai` requires `{AI, view}`. The page uses `canManage("AI")` (AIConsole.tsx:291-292).
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Send AI chat message | AIConsole.tsx:552, 562, 615, 1007-1015 | explicit AI:manage | View-only users see usage only (:862 notice) |
| Generate module insights | :658-692, 1039-1065 | explicit AI:manage | Insights over other modules' data, with no check on those modules |
| Create AI credential (provider API key) | :728-749, 1210-1279 | explicit AI:manage | |
| Update / activate credential | :769-799, 1299-1334 | explicit AI:manage | |
| View usage / history | :354-400 | route AI:view | |
| Floating chatbot: load | Components/AiChatbotWidget.tsx:182, 310 | explicit AI:view | Mounted in the HomePage shell |
| Floating chatbot: send | AiChatbotWidget.tsx:183, 392, 416 | explicit AI:manage | |
#### Gaps
- Managing provider credentials (secrets, billing) uses the same level as chatting. Make `manage_ai_credentials` a separate admin-level action.
- Insights can expose cross-module data. The server should check source-module permissions.

## Notifications (`features/notifications/`)
#### Routes
`/home/notifications` is isPrivate with no permissionNeeded, so any signed-in admin can open it. `/member/notifications` is public within the member portal.
#### Actions
| Action | File:line | Gate | Notes |
|---|---|---|---|
| Enable device notifications | NotificationCenterPage.tsx:310-312 | NOT GATED (own device) | |
| Refresh / Mark all read / Clear all | :330-361, 113-114, 277 | NOT GATED (own inbox) | `useInAppNotificationStore` |
| Mark read / unread, open (navigates to actionUrl) | :466-480, 71-80 | NOT GATED (own) | The target route enforces its permission |
| Header bell: open, mark, clear all | HeaderNotificationMenu.tsx:147-273 | NOT GATED (own) | |
#### Data visibility
The user's own notifications only (server-side). `actionRegistry.ts` maps types to URLs, including admin targets.

---

## Settings → General configuration (`Settings/general/`)
#### Routes
`settings` "" requires `view_settings`. Edit flags are explicit (GeneralConfiguration.tsx:30-33) and mix domains per section.
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| "Read-only" banner | GeneralConfiguration.tsx:121-125 | explicit !Settings:manage | |
| Save all sections (UnsavedBar) | :182-189, 55-88 → useRulesDraft.ts:186-259 | inputs are disabled unless allowed, so parts only become dirty where editable | |
| Add branch | sections/BranchesSection.tsx:131-132 → dialogs/BranchDialog.tsx:72-73 | explicit Settings:manage | |
| Edit branch | BranchesSection.tsx:160 | explicit Settings:manage + **branch ownership** `mine()` = in `allowedBranchIds` (:45, 158) | |
| Make default branch | :161-162, 66 | explicit Settings:manage + `mine()` | |
| Delete branch | :164-165, 75-123 | explicit **Settings:admin** + `mine()`; impact check; `typeToConfirm` | Good pattern |
| Add / Edit position | sections/PositionsSection.tsx:72-73, 101-104 → dialogs/PositionDialog.tsx:69-70 | explicit **Positions:manage** (cross-domain) | PositionDialog sends the current `userId` (:32) |
| Delete position | PositionsSection.tsx:110-113, 53-60 | explicit **Positions:admin** | |
| Attendance timing rules (+ apply to existing / reclassify) | sections/AttendanceSection.tsx:44, 59; dialogs/ApplyAttendanceDialog.tsx; useRulesDraft.ts:195 | explicit Settings:manage | Reclassifying past attendance is a heavy action with no separate permission |
| Requisition timing + "Set up workflow" | sections/RequisitionSection.tsx:38-63, 85; useRulesDraft.ts:212 | section **visible** with Requisition:view, **editable** with **Requisition:manage** (cross-domain, GeneralConfiguration.tsx:33, 99) | |
| Eligibility rules (programs ↔ positions) | sections/EligibilitySection.tsx:136-216; useRulesDraft.ts:220 | explicit Settings:manage | Cross-domain effect on School of Ministry |
| Reports config (responsible dept, dept attendance reports) + event-report exclusions | sections/ReportsSection.tsx:65, 101, 138, 192; useRulesDraft.ts:224, 230 | explicit **Settings:manage** | Cross-domain (Reports) but gated by Settings |
| Notification preferences (own) | sections/NotificationsSection.tsx:53-90 | NOT GATED (the user's own prefs) | |
| Logs: failure alert recipient | sections/LogsSection.tsx:26; useRulesDraft.ts:235 | explicit Settings:manage | Recipient list is admins only |
#### Data visibility
- Branches are limited to `allowedBranchIds` for edits. Pickers use `utils/usePickableBranches.ts:9-15`.

## Settings → Users (`Settings/users/`)
#### Routes
`settings/users` requires `manage_users` = **Members:manage**. The page also uses `canRoles = canManage("Access_rights")` and `canStatus = canManage("Members")` (UsersPage.tsx:42-45). `canStatus` is always true on this route, so `canSelect` is always true.
#### Actions + gating
| Action | File:line | Gate | Notes |
|---|---|---|---|
| **Give access** (pick member + branch + role, optional email invite) | UsersPage.tsx:229-230 → users/UserDialogs.tsx:33-100 (`api.post.giveAccess` :87, `send_invite` :91, invite checkbox :161) | explicit Access_rights:manage | Invite is part of give access, with no separate permission |
| Row role select (active branch) | UsersPage.tsx:189-191, 108-117 | explicit Access_rights:manage | Every role is listed (`roles.map`). **No ceiling** stopping someone from granting a role above their own |
| Bulk role change | UsersPage.tsx:274-277, 119-136; BulkBranchDialog UserDialogs.tsx:175-213 (`api.put.bulkAssignAccessLevel` useUsersData.ts:124) | explicit Access_rights:manage | |
| Bulk Activate | UsersPage.tsx:289-295 | explicit Members:manage | |
| Bulk / single Deactivate | UsersPage.tsx:296-300, 137-150 (`bulkUpdateUserStatus` useUsersData.ts:153) | explicit Members:manage; **self excluded** (`meId`, :138) | |
| Drawer: change role per branch | users/UserDrawer.tsx:211-218, 105-113 | explicit Access_rights:manage | **No `isMe` guard**: a user can change their own role or escalate |
| Drawer: remove branch access (×) | UserDrawer.tsx:228-233, 115-122 | explicit Access_rights:manage | No self guard |
| Drawer: + Add branch grant | UserDrawer.tsx:241-283, 124-136 | explicit Access_rights:manage; branches limited by `usePickableBranches` (:44, 103) | Branch ownership enforced |
| Drawer: Can sign in toggle | UserDrawer.tsx:335, 138 | explicit Members:manage + **not self** (`isMe`) | |
| Drawer: **Send password reset link** | UserDrawer.tsx:143-155, 344-348 (`api.post.sendResetLink`) | explicit `canStatus || canRoles`, so in practice **any Members:manage** | Sensitive. No distinct permission |
| Drawer: open role ("In {branch} as {role}") | UserDrawer.tsx:294 | navigates to `access-rights/:id`, which is route-gated by `view_access_rights` | |
| Workspaces | UserDialogs.tsx:14-18, 157, 255; UserDrawer.tsx:283 (`roleWorkspaceNote`) | info only | Workspaces are set on the role, not per user |
#### Data visibility
- `fetchAssignableUsers({include_inactive})` + `fetchAccessLevels` (useUsersData.ts:43-44). Every user is loaded.
- The client then filters to the active branch: home branch or a grant there (UsersPage.tsx:61-67).
- No department or life-center scope.
#### Gaps
- `manage_users` is really Members:manage, so every member editor can open Users, deactivate admins and send password resets. Users or admin-account management should be its own domain or action.
- No self-escalation guard on role changes. No "role ≤ my role" ceiling.
- Invite and reset password have no distinct permissions.
- Settings rail landing breaks for Users-only admins (no index redirect; see above).

---

## Summary of gaps (Part E)
1. **Messaging**: one Manage level covers bulk SMS, email and push to the whole church, scheduling, retrying (spend), cancelling others' messages and auto-template edits. There is no audience scope; any department or the whole church can be messaged.
2. **Community**: anonymous-author reveal is implicit in **view_community**. Moderation is all Manage with no admin tier. There is no ban. The member feed relies on the backend flags `me.canManage` / `me.canModerate`, which can diverge from frontend `view_community`. The `?tab=reported` deep link is ignored.
3. **Home workspace queues** approve requisitions, finance records and department reports, publish sermons, approve join requests and assign visitors with **zero frontend permission checks** (cross-domain). The finance workspace Export is ungated.
4. **Delete at Manage** for Themes, Promotions, Sermons and Series. This is inconsistent with Branches and Positions, which require admin to delete.
5. **Users page** sits behind Members:manage. Role changes have no self guard or ceiling. Reset password and invite are not separate actions.
6. **AI** credential management is at the same level as chat (AI:manage).
7. **Parent routes without elements** (`communication`, `settings`) are never enforced at render. Settings has no index redirect, so Users-only admins land on access-denied.
8. **The Promotions→Community fallback** silently grants banner control. ALL_BRANCHES merges permissions at the highest level and takes scopes from the first grant.
