# Permissions: audit and redesign proposal

**Status:** phases 0–4 implemented (§0); phase 5 (mobile) and the ✦ SMS-approval feature open · **Date:** 2026-10-25 · **Updated:** 2026-10-25 (see §0)
**Covers:** Backend (`WWW-Ministries-Project/Backend`), web dashboard (this repo), mobile app (`wwm-mobile`)
**Evidence:** every claim is backed by file:line references in [`evidence/`](./evidence). The items marked **(verified)** were re-read in the code while writing this document.

---

## 0. Implementation status

The role editor from the WWM App v2 design (Settings › Access rights) is built, and the Backend stores what it edits.

| Area | Status | Where |
|---|---|---|
| Role editor: per-module **"What they can do"** (action checkboxes, pre-ticked from the level) and **"Whose records they see"** (scope picker), *Custom* / *On purpose* / *New feature* badges, "Reset to defaults" | **Done** | Frontend `Settings/access/RoleDetail.tsx` |
| Action catalogue (§7, as designed) | **Done, in the Frontend** (`src/utils/permissionCatalog.ts`). §6.4 proposed serving it from the Backend; that is still the target for phase 2 | Frontend |
| Storing `Actions` and the generalised `Scopes` on a role | **Done.** Backend `normalizePermissionPayload` accepts `Actions: { Domain: { action: boolean } }` and `Scopes` of `own`, `assigned`, `department`, `department_member`, `life_center` on any module (`branch` is the default and isn't stored) | Backend `accessLevelController.ts` |
| **S10** `Reports` can't be stored | **Fixed.** `Reports` (and the new `Rides`) are allowed keys | Backend `accessLevelController.ts` |
| **S4** privilege escalation | **Partly fixed.** A *grant ceiling* (no level above your own; no on-purpose action you don't hold, unless you have Full on that module; on update only increases are checked), **no editing a role you hold**, **no assigning or removing yourself**. Enforced in the API (`grantCeiling.ts`, 403 `GRANT_CEILING`) and mirrored in the editor (locked options, "You can only give what you have yourself", "You have this role…" notices). Still open: a role is global, so editing it changes it in branches the editor doesn't administer | Backend + Frontend |
| **Rides** domain (§7.8, decision 7) | **Done.** New module *Ride to church*; the API and web route check `Rides`, falling back to Membership management for roles saved before it existed, so nobody loses access | Backend `authorization.ts`, `permissionResolver.ts`, `rideService.ts`; Frontend `accessControl.ts`, `appRoutes.tsx` |
| **Program** domain (decision 6) | **Marked "Being retired"** in the editor; presets and "Set all" leave it at None. Its Backend fallbacks (Theme, Marketplace, School of Ministry) remain until values are migrated | Frontend |
| Department scope = **led** (decision 2) | **Labelled "Departments they lead"** in the editor, with "Departments they belong to" offered for Assets stock counts. **The API still treats both as "any department they belong to"** (the old `assigned_departments` rule) until leadership is enforced | Backend `authorization.ts` `normalizeScopeValue` |
| Presets | Head of department now limits Members, Departments, Attendance, Requisition, Assets and Reports to *departments they lead* and adds *Prepare department reports* and *Record attendance*. Team manager leaves Finance and Administration at View. Platform admin leaves on-purpose actions off | Frontend `settingsModel.ts` |
| Groups | Overview · People · **Ministry & engagement** · Operations · Administration (same order as the icon rail) | Frontend `sideNavGroups.ts` |
| **Enforcement of actions and the new scopes** | **Done for every module in §7** (see §0.2), on the API and in the web UI | Backend + Frontend |

### 0.1 Security fixes (§3)

| # | Status | What changed |
|---|---|---|
| S1 | **Fixed** | `POST /user/register` (dashboard *Add member*) needs sign-in + Members manage (`can_manage_member_details`), and Members.create in the service. The public membership form posts to a new `POST /user/public-register` that keeps only the person's own details (status UNCONFIRMED, no sign-in, password, department, position, source visitor/soul or spouse link; branch only if it exists). |
| S2 | **Fixed** | `/event/sign-attendance` and `/event/search-user` need sign-in + Events manage (no client called them). |
| S3 | **Fixed** | Global Prisma `omit: { user: { password: true } }`; the hash is only read where a query names it (login, password change/reset, reset links). Pledge includes also select safe user fields. |
| S4 | **Fixed** | Grant ceiling, no editing a role you hold, no changing your own assignment, no editing/deleting a role used in a branch you have no role in (API 403 `GRANT_CEILING`; the editor locks and explains). |
| S5 | **Fixed** | Requisition and finance routes run `withAccess` (live, active-branch permissions) before services read `req.user.permissions`; instructor status is checked live (`isInstructor`), not from the token. |
| S6 | **Fixed** | `/user/guests` needs Visitors view on the branch; `/user/list-users-light` is staff-only, no longer returns emails, and its "who holds permission X" filter needs Access rights view or manage on X; `/user/stats-users` and `list-positions` are staff-only. |
| S7 | **Fixed** | Learner endpoints bind the learner to the caller (someone else's id needs School of Ministry manage or instructing); answer keys (`correctOptionId`) are stripped for learners. |
| S8 | **Fixed** | Visits, follow-ups and prayer requests take their visitor from the record; a different `visitorId` in the request is refused. |
| S9 | **Fixed** | Every AI data query needs view on the module it reads in the active branch (chat tool calls included). |
| S10 | **Fixed** | `Reports` and `Rides` are stored. |

Also fixed while there: the requisition approver fallback (any approver passed every *manage requisitions* route) is removed; the Marketplace payment return URL is limited to the church's own origins; GETs no longer change order state; `GET /event/get-event` no longer returns every registrant's contact details; uploads are rate-limited.

### 0.2 §5 implementation and what changed for existing roles

How the rollout stays lossless: **a role saved before actions existed (no `Actions` key) keeps what it had** — on-purpose actions follow its level, rights that moved to a new module keep the old rule (e.g. user management under Members, devices and timing under Settings, branch edits under Settings), and it keeps seeing the whole branch (narrower View defaults apply only to roles saved in the new editor). The editor shows these as ticked/"Whole branch" so saving keeps them.

Deliberate tightenings (bugs or doc rules, they apply to every role):
- **Delete needs Full** everywhere in the UI, matching the API (Members, Visitors, Events, Appointments, Finance, Pledges, Theme, Sermons, Promotions, Requisitions, Marketplace).
- **No self-approval:** finance records, requisitions, event and department reports can't be approved by the person who created/submitted them; a new finance record never auto-approves.
- **Approved finance records** need `edit_approved`; reversing a pledge redemption needs Full; personal-data exports need the module's `export` action (Manage) — e.g. Life center meeting exports and Assets exports are no longer open to View-only roles.
- **Branch checks** on by-id records in every module; contributions and admin order lists are branch-scoped.
- Requisitions can only be raised for your own departments without `raise_for_any_department`; delete is blocked once approved.
- Community: anonymous authors only with `view_anonymous_author`; moderation limited to the active branch.
- Department-scoped Attendance roles can't edit service headcounts (headcounts have no department).

Choices made where the doc left room (review these):
- **Approval with no chain configured:** the View default of `event_approve` / `dept_approve` does not let someone sign off when no chain is set; that needs Full on Reports or the action switched on on purpose.
- **AI cost:** chat and insights default to View for new roles; older roles still need AI manage.
- **Rides:** older roles with only Members View can now open the rides overview (Rides falls back to Membership management → Members); phone numbers stay hidden.
- **Community deletes:** installed mobile apps offer "delete others' posts" at Manage; older roles keep that, new roles need `delete_any` (Full) and get an error on mobile otherwise. A mobile update should read `community/me.actions.deleteAny`.

New features built: requisition **Mark as disbursed** (`DISBURSED` status, who/when; migration `20261031120000_requisition_disbursed_order_marked_paid`), and **who marked an order paid**. Not built: ✦ `Messaging.approve_sms`.

Still open: mobile (phase 5: `me/capabilities`, route guards, leader/instructor tools from relationships); member-list exports are gated in the UI only (the file is built in the browser from an already-masked, scoped list); adding department members goes through `user/update-user` (Members manage), so `Departments.manage_members` is UI-only; biometric devices have no branch column; settings for appointments are global.

---

## 1. Summary

The current model gives each role one dial per module: **None / View / Manage / Full**. That dial cannot express most of what the church actually needs to control:

- **Actions.** Approving a requisition, raising a requisition from an asset, sending a bulk SMS, posting the weekly finance record, converting a visitor or exporting a member list are all different powers. Today each is either folded into "Manage", decided by a hidden rule outside the role editor, or not checked at all.
- **Visibility.** Whether someone sees *only their own* records, *their department's*, *their life center's*, or *the whole branch* can't be configured. The only option today is "only their own departments", offered on 2 of 26 modules. Even there it is only partly enforced, and it counts *any* department membership rather than leadership.

The audit also found that permissions decide things in **five different places that disagree**:
- the role
- an old single-role column on the user
- the login token (stale for up to 12 hours)
- a second alias table in the backend
- relationships outside the role system, such as department head, approver position, instructor or life-center membership

Several endpoints skip permissions entirely.

This document:
1. lists what has to be fixed **before** any redesign, because those endpoints bypass any permission model (§3)
2. explains how permissions work today (§4)
3. lists **what is missing**: modules, pages, actions and scopes with no permission (§5)
4. proposes a model with **levels + actions + visibility scopes + relationship rules** (§6)
5. goes **module by module** with the proposed actions, scopes and today's gaps (§7)
6. gives a phased delivery plan (§8) and the decisions needed from the product owner (§9)

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **Domain / module** | A permission area, e.g. `Members`, `Requisition`, `Financials`. 26 are editable today. |
| **Level** | `No_Access` (None) < `Can_View` (View) < `Can_Manage` (Manage) < `Super_Admin` (Full). |
| **Role** | A named set of levels (`access_level`). Roles are **global**; a user holds one role **per branch** (`user_branch_access`). |
| **Action** | *(proposed)* A named capability inside a module, e.g. `Requisition.approve`, `Messaging.send_sms`. |
| **Scope** | Whose records the user can see or act on in a module: `own`, `assigned`, `department`, `department_member`, `life_center`, `branch`. Stored since §0; enforced only for the department scope today. |
| **Relationship rule** | A right that comes from who the person *is* in the data, not from their role: department head, approver in a chain, instructor of a cohort, life-center leader, visitor's responsible member, pledge caller. |
| **Exclusion** | Specific people a role cannot see (Members, Appointments only). |

---

## 3. Fix first: endpoints that bypass any permission model

These are backend issues. They let people do things no role could ever grant, so a new permission model would not close them. Recommended as a standalone security patch **before** any redesign work.

| # | Issue | Evidence | Fix |
|---|---|---|---|
| S1 | **`POST /user/register` needs no login** **(verified)**, yet it is the dashboard's *Add member* endpoint. It sets membership status, department and position, and converts visitors and souls won. | Backend `userRoutes.ts:90` (only a rate limiter); Frontend `apiPost.ts:302` | Split it: keep a public self-registration endpoint with a fixed, minimal payload. Move *Add member* behind `protect` + `Members.create`. |
| S2 | **`POST /event/sign-attendance` and `GET /event/search-user` need no login** **(verified)**. One creates users and attendance; the other maps a phone number to a member's name and id. | `eventRoute.ts:107-108` | Require a kiosk/device token or a short-lived event check-in token, and rate-limit. Return a minimal match (masked name) from search. |
| S3 | **Password hashes are returned to any signed-in user** **(verified)**. `include: { user: true }` has no field `select`, and Prisma has no global `omit`. | `enrolmentService.ts:215`, `courseService.ts:98-104`, `lifeCenterService.ts:437`; `Models/context.ts` (no `omit`) | Replace with an explicit safe `select`. Add a global Prisma `omit: { user: { password: true } }` as a backstop. |
| S4 | **Partly fixed (§0).** **Privilege escalation.** Access-rights managers can create an all-Full role and assign it to themselves. Roles are global, so they can also edit roles held in branches they don't administer. | `accessLevelController.ts:500-727, 845-900, 1110-1165`; Frontend `UserDrawer.tsx:211-233` | Add a **grant ceiling**: you cannot grant any level or action you don't hold yourself. Block editing your own role and changing your own assignment. Only allow editing a role if you administer every branch it is used in. |
| S5 | **Stale rights from the login token.** Requisitions and the finance create/update guard read `req.user.permissions`. That is the *home-branch* grant baked into the JWT at login and valid for 12 h. Revoked rights keep working and branch switching is ignored. | `authorization.ts:972-975`; `requisition-service.ts:450, 1997`; `Financials/route.ts:12-55` | Read live grants from the access context everywhere; stop trusting the JWT `permissions` and `instructor` claims for authorization. |
| S6 | **Personal data open to any signed-in member.** `/user/guests` lists every guest's phone and email. `/user/list-users-light` lists every user's email and lets anyone enumerate admins. | `selfServiceController.ts:355-397`; `userController.ts:2419-2600` | Require the relevant view permission and return only fields the caller may see. |
| S7 | **Learner impersonation and answer keys.** School of Ministry endpoints take the learner from a body `userId`. Multiple-choice answer keys are readable by any signed-in user. | `programController.ts:298, 433, 517`; `programService.ts:705-770, 1044-1065` | Take the learner from the token. Strip answer keys from learner-facing responses. |
| S8 | **Visitor guard bypass.** An explicit `visitorId` in the request beats the record's own visitor, so a responsible member can reach any visit, follow-up or prayer request. | `authorization.ts:1185-1211` | Resolve the visitor from the record being touched, never from the request. |
| S9 | **AI read-only queries cross every domain and branch** (users with emails, access levels, finances, visitors, orders) for anyone with AI view. AI falls back to Settings. | `aiRoute.ts:76`; `aiReadOnlyContracts.ts:218-410` | Bound each AI data query by the caller's view permission and branch for the target domain. |
| S10 | **Fixed (§0).** **`Reports` can never be saved on a role** **(verified)**. The backend drops unknown keys and `Reports` isn't in its allowed list. The role editor now shows a Reports row that silently reverts to the Settings level on save. | `accessLevelController.ts:23-55, 99-101, 275, 379` | Add `"Reports"` to `OPTIONAL_PERMISSION_KEYS`. One line; the authorization alias for Reports already exists. **Introduced into the UI by Frontend PR #492; needs this backend line to work.** |

Also high priority, but within the permission model:
- Requisition approvers pass every *manage requisitions* route, including rewriting the global approval chain (§7.15).
- Bulk SMS has no approval step, channel split or audience limit (§7.11).
- Community moderation is org-wide and reveals anonymous authors (§7.11).
- Ride administration is decided from the old single-role column (§7.8).

---

## 4. How permissions work today

### 4.1 Backend (the only place that actually protects data)

- **Storage.**
  - `access_level.permissions` is a JSON blob: `{ "<Domain>": "<Level>", "Exclusions": {...}, "Scopes": {...} }`.
  - `access_level.workspaces` picks the Home workspaces.
  - Roles are global; `user_branch_access` gives a user one role per branch.
- **Checks.**
  - `checkPermission(domain, view|manage|admin)` in `src/middleWare/authorization.ts`.
  - With a branch selected, that branch's role decides. With "all branches", *view* needs the right in any branch and *manage/admin* in every branch.
  - **`admin` almost always just means "delete".**
- **Members.** Anyone with no branch role fails every permission check. Everything a member can do is decided inside individual services.
- **Aliases and fallbacks.**
  - `PERMISSION_KEY_ALIASES` falls back to other domains when a key is missing, e.g. Visitors → Members, Theme → Program, Settings → Access_rights, AI → Settings.
  - **A second alias table** (`src/utils/permissionResolver.ts`) disagrees on Financials.
- **Scopes.** One value, `assigned_departments`, on Departments and one Church Attendance route. It counts **any** department membership, not leadership.
- **Exclusions.** Enforced only on single-record Members and Appointments requests. Bulk endpoints skip them.
- **Unused guards.** Many guards are defined but never used. In practice *view* on Program, School of Ministry, Sermons and Asset does nothing server-side, and Requisition *admin* is never required.

### 4.2 Rights decided **outside** the role (relationship rules)

These are already "action permissions" and "visibility scopes" in disguise. None appear in the role editor.

| Who | What they get | Evidence (backend) |
|---|---|---|
| Department head | Approve/decline join requests; head-of-department requisition step; prepares department reports; HOD workspace; asset counts | `joinRequestController.ts:36-82`; `requisition-approval-workflow.ts:1086`; `departmentReportService.ts:220-225` |
| **Any** department member | "My departments" scope; **view their department's assets and do stock counts with no Asset permission** | `authorization.ts:614-626, 1536-1565` |
| Approver in the requisition chain (position or named person) | **All** *manage requisitions* routes, including editing the chain itself | `authorization.ts:1004-1012` |
| The single finance approver | Approve/return finance records (the route needs only Financials *view*) | `Financials/route.ts:109, 141` |
| Event report approvers | Approve/return. The configured chain isn't enforced | `eventReportService.ts:2167-2173` |
| Any life-center member (the leader flag is never used) | Record souls, meetings and offerings; see member contacts | `authorization.ts:1664-1737` |
| Visitor's responsible members | Their visitor's visits, follow-ups and prayer requests | `authorization.ts:1213-1267` |
| Instructor (login-token claim) | **All** School of Ministry manage on older routes | `authorization.ts:1752-1763` |
| Appointment attendee | Accept, decline, complete and no-show with no permission | `appointment-actions.ts:170` |
| Pledge caller | **Nothing.** The record exists but grants nothing | `schema.prisma:3031` |

### 4.3 Web dashboard

- **Routes.** `permissionNeeded` on routes. Parent routes without a page **never enforce their own requirement** (`RenderRoutes.jsx:7-11`).
- **Buttons.**
  - Shared `Button`/`Action`/`HeaderControls` gate by **label text**: "delete" needs Full, "edit" needs Manage. Any other label (Approve, Send, Export) is ungated.
  - Most admin pages use the ungated `UiButton`/`ActionMenu` instead, so each action is either an explicit `useAccessControl` check or protected only by the route.
- **Approve/reject.** Decided by **backend flags** (`is_approver`, `finance_approver_user_id`, `report.permissions.can_*`), never by the role.
- **Scopes and exclusions on the client.**
  - Department scope only hides *Create department*.
  - Attendance scope only shows a banner.
  - Appointments exclusions are never read.
  - Members exclusions hide *View/Edit*, but excluded people still appear in lists, counts and exports.
- **Branch.** `X-Branch-Id` is the only universal data filter.

### 4.4 Mobile app

- Only 4 modules are permission-checked (Marketplace, Life Center, School of Ministry, Appointments), and only for *view*.
- **When a key is missing, mobile allows and the backend denies** (`shared/lib/permissions.ts:90` vs backend `authorization.ts:282-283`).
- Deep links reach gated screens without the check.
- Leader tools are decided by being listed in the life center's `members` array, not by a leader role.
- Instructor sub-screens check nothing.
- Good pattern to reuse: `community/me` returns server-computed `canModerate` / `canManage`.

### 4.5 Drift between the three clients

| Domain | Backend falls back to | Web falls back to | Mobile |
|---|---|---|---|
| Visitors | Members | — | not modelled |
| Appointments | Members | — | — (and default-allow) |
| Church_Attendance | Events | — | not modelled |
| Theme | Program | — | not modelled |
| Financials | Access_rights (and `Finance`/`Finances` in the second table) | — | not modelled |
| Giving | Giving_Options, Financials, Access_rights | Financials | not modelled |
| Settings | Access_rights | — | not modelled |
| AI | Settings, Access_rights | — | not modelled |
| Marketplace / School_of_ministry | Program | — | — (and default-allow) |
| Reports | Settings, Access_rights (and **can't be stored**) | Settings, Access_rights | not modelled |

**Result:** the same role shows modules the API refuses, or hides modules the API allows. The fix is one catalogue and one resolver on the backend, with clients consuming resolved capabilities (§6.5).

---

## 5. What is missing

### 5.1 Modules and pages with no permission of their own

| Area | Today | Should be |
|---|---|---|
| **Ride to church** | Borrows *Membership management – Manage*, read from the old single-role column; exposes rider phone numbers | New `Rides` domain |
| **Requisition** (all web routes) | **No route permission at all**; visibility from backend flags only. Analytics open to everyone | Use the `Requisition` domain on routes, plus actions and scopes |
| **Event reports** | Borrow *Events – View*; approve/return need only login at the route | `Reports` domain actions |
| **Reports** menu & department reports | View on **any of 9 domains**; manage on any one of them counts as manage here (cross-domain escalation) | `Reports` domain (and make it storable, S10) |
| **Stock check** (`assets/count`) | No permission; department members count without an Asset role | `Asset.count` with a department scope |
| **Users** page (invite, reset password, deactivate) | Borrows *Members – Manage* | `Access_rights` actions |
| **Branches** | Borrow Settings | `Settings.manage_branches` (org-wide) |
| **Biometric devices**, **finance configurations** (receipts, payment methods, bank accounts, tithe split) | Borrow Settings | Devices → `Church_Attendance.manage_devices`; finance configs → `Financials` |
| **Home workspaces** | A field on the role; queue actions (approve, publish, assign) have no client-side check | Each queue action uses the same action key as its module |
| **Every *Analytics* page** | Inherits module view; no export control | `<module>.view_analytics` (optional) + `<module>.export` |
| **Approvals** (Settings) | Route needs Settings view; editing each chain needs manage on Requisition, Events or Financials | `<module>.configure_approvals` |
| **Member-portal leader tools** (life-center leader, instructor grading) | No route guard; any member of the center gets leader tools; any member can grade by URL | Relationship rules + scoped actions |
| **Uploads**, **live stream** | Any signed-in user | Fine for members; rate-limit uploads |
| **Notifications** | Own only | Fine; no domain needed |

### 5.2 Domains that exist but don't work

| Domain | Problem |
|---|---|
| `Reports` | Can't be stored (S10). Always equals Settings. |
| `Program` | Editable in the role editor; nothing checks it except as a hidden *fallback* for Theme, Marketplace and School of Ministry. Remove it, or migrate its values, then drop the fallbacks. |
| `School_of_ministry` | *View* has no server effect; every web route needs only view and writes are gated inside components. |
| `Membership_Management` | No backend route uses it directly; only services read it, through the old single-role column. |
| `Theme` | No *view* guard on the backend. Mis-used as the Communication parent on the web. |
| `Requisition` | *Full* (admin) never required; web routes ignore the domain. |
| `Asset`, `Sermons` | *View* guard unused server-side. |
| *Full = delete* | The editor says "Full also deletes", but the web lets *Manage* delete in Members (incl. bulk), Visitors, Events, Appointments, Finance, School of Ministry, Communication and Marketplace types. Some are refused by the API at Full, some are not. |

### 5.3 Actions with no separate control (highlights)

The full catalogue is in §7. These are the ones the product owner called out or that carry money or personal-data risk:

| Action | Today |
|---|---|
| **Raise a requisition from an asset** | Assets *Manage* only; bypasses the requisition requester list (`asset-redesign.ts:703-790`, web `AssetManager.tsx:821-845`) |
| Approve / reject / **disburse** a requisition | Chain position only; *disbursed/paid* status doesn't exist |
| **Send bulk SMS** (costs money) | *Messaging – Manage*; no channel split, audience limit or approval |
| **Post / approve** the weekly finance record | Approve needs Financials *view* + being the single approver; the approver's own submissions auto-approve |
| **Export** personal data (members, visitors, donors, pledgers, orders, ride roster…) | Ungated or view-only in ~15 places |
| **Convert** visitor / soul won / guest to member | Always ends at *Members – Manage* |
| **Reveal anonymous community authors** | *Community – View* |
| **Mark an order paid** | A field edit, no actor recorded |
| **Reverse a pledge redemption** (ledger change) | *Pledges – Manage* |
| **Grade**, **issue certificates**, **enroll others** | Instructor claim or ungated in the UI |
| **Assign roles / reset passwords** | Members *Manage*, with no ceiling |

### 5.4 Visibility scopes that are missing

| Scope | Needed for | Today |
|---|---|---|
| **Own** | Requisitions, appointments, follow-ups, orders, giving, pledges | Hardcoded in a few services; client passes `user_id` in several mobile calls (IDOR risk unless the backend binds it to the token) |
| **Assigned to me** | Visitors (responsible member), pledges (pledge caller), cohorts (instructor), approvals (my step) | Visitors only; others missing or hardcoded |
| **Departments I lead** | Requisitions, assets, attendance, department reports, members, messaging audience, join requests | Exists as "any department I'm in", on 2 modules, partly enforced |
| **My life center** | Life center, souls won, members | Any membership; leader flag unused |
| **Whole branch** | Everything | Default (but by-id reads/writes skip the branch check in most modules) |

---

## 6. Proposed model

### 6.1 Principles

1. **The backend is the authority; one resolver decides everything.**
   - Retire the second alias table, the old single-role column and the JWT `permissions`/`instructor` claims as authorities.
   - Every route and service check calls one branch-aware function on live grants.
2. **Keep the level dial as the default.** Most roles stay simple: pick a level and get a sensible set of actions and a default scope. Actions and scopes are *overrides*.
3. **Actions are named and catalogued once.** The catalogue lives in the backend and is served to web and mobile. No more copying alias tables into three repos.
4. **Approvals stay chain-based.** *Who* approves step 2 stays a workflow setting (position, head of department, named person). The role gives the *action* (`approve`), and the chain decides *which records*. Overrides (approve anything, configure the chain) are separate actions.
5. **Relationship rules become explicit scopes.** Department head, approver, instructor, leader, responsible member and pledge caller become scope values, not hidden code.
6. **Lossless migration.** Every existing role keeps exactly what it can do today, via default action sets derived from its levels.

### 6.2 Shape of a role (backward compatible)

```jsonc
{
  // Levels: unchanged
  "Requisition": "Can_Manage",
  "Asset": "Can_Manage",
  "Messaging": "Can_Manage",

  // NEW: explicit action overrides. Absent = follow the level's default.
  "Actions": {
    "Requisition": { "configure_approvals": false, "mark_disbursed": true },
    "Asset": { "raise_requisition": true, "write_off": false },
    "Messaging": { "send_sms": false }          // can send email/in-app, not SMS
  },

  // GENERALISED: one scope per domain (was only "assigned_departments").
  "Scopes": {
    "Requisition": "department",               // departments they lead
    "Asset": "department"
  },

  // Unchanged
  "Exclusions": { "Members": [12, 40] }
}
```

**Resolution:**
- **Action allowed** = explicit override if present, else `level ≥ action.defaultLevel`.
- **Scope** = explicit value if present, else the domain's default for that level, normally `branch`.
- The **grant ceiling** (S4) is checked when saving a role or assigning one.

### 6.3 Scope values

| Value | Meaning | Resolved from |
|---|---|---|
| `own` | Records the person created or is the subject of | `created_by` / `requester_id` / `user_id` |
| `assigned` | Records assigned to the person | Visitor responsible member, pledge caller, cohort instructor, current approval step |
| `department` | Records of departments the person **leads** (head or a leadership position) | `department.department_head`, `department_positions` with a leadership position |
| `department_member` *(optional)* | Records of any department the person belongs to | Today's behaviour, kept only if a module needs it (e.g. asset stock counts) |
| `life_center` | Records of life centers the person **leads** | `life_center_member.role` (leader) |
| `branch` | Everything in the active branch | Today's default |

Each domain lists which values it supports (§7). Scopes narrow; they never widen past the branch the role is held in.

**As implemented:** `branch` is the default and isn't stored. A View-only role starts narrower on some modules (Requisition and Appointments: `own`; Visitors, School of Ministry and Pledges: `assigned`; Life centers: `life_center`). The stored value is an override of that default. Roles saved earlier with `assigned_departments` read as `department`.

### 6.4 Action catalogue format

Target: one backend file, e.g. `src/permissions/catalog.ts`, served at `GET /access/catalog`. **Today the catalogue lives in the Frontend (`src/utils/permissionCatalog.ts`)** and moves to the Backend with phase 2. Shape:

```ts
{
  domain: "Requisition",
  label: "Requisition",
  group: "Operations",              // matches the sidebar groups
  scopes: ["own", "department", "branch"],
  defaultScope: { Can_View: "own", Can_Manage: "branch", Super_Admin: "branch" },
  actions: [
    { key: "raise",               label: "Raise requisitions",            defaultLevel: "Can_View" },
    { key: "approve",             label: "Approve or reject (their step)", defaultLevel: "Can_View",   note: "chain decides which" },
    { key: "mark_disbursed",      label: "Mark as disbursed",             defaultLevel: "Can_Manage", new: true },
    { key: "configure_approvals", label: "Change the approval chain",     defaultLevel: "Super_Admin", explicit: true },
    { key: "export",              label: "Export",                        defaultLevel: "Can_Manage" },
    { key: "delete",              label: "Delete any requisition",        defaultLevel: "Super_Admin" },
  ],
}
```

- `explicit: true` means presets and "Set all" never switch it on, like Community and Messaging today.
- `new: true` means the feature doesn't exist yet and the action ships with it.

### 6.5 Resolved capabilities for clients

`GET /user/me/capabilities?branch_id=` returns, for the active branch:

```jsonc
{ "levels": { "Requisition": "Can_Manage" },
  "actions": ["Requisition.raise", "Requisition.approve", "Asset.raise_requisition"],
  "scopes": { "Requisition": "department" },
  "relationships": { "leads_department_ids": [3], "leads_life_center_ids": [], "instructs_cohort_ids": [] } }
```

- **Web** replaces label-based button gating with `can("Requisition.approve")`.
- **Mobile** replaces its alias table and default-allow with this, like `community/me` today.
- The payload is invalidated by the existing realtime `session.changed` event.

### 6.6 Role editor (web): implemented

Per module row: the level dial as today, plus an expandable panel (a summary button reads "5 of 9 actions · Whole branch"):
- **"What they can do"**: action checkboxes, pre-ticked from the level. Changing one shows "custom".
- **"Whose records they see"**: a scope select (only the values the module supports).
- **Hidden people**: as today.

Presets (Read-only, Team manager, Head of department, Platform admin) gain default scopes and actions.
- *Head of department* becomes: department scope on Members (view), Requisition, Asset, Attendance, Reports.
- The editor refuses anything above the editor's own grants (ceiling): level options and actions above your own access are locked with "Above your own access".
- A role you hold is read-only to you: "You have this role in Hill City. Nobody can change their own access, so another admin has to edit it."
- On-purpose actions carry an *On purpose* badge; actions for features that don't exist yet carry *New feature*; an action that needs another module's action warns "Also needs Requisition › Raise requisitions, which this role doesn't have."
- The role list shows each role's scopes and "N custom actions" as tags; the user drawer lists them as notes.

---

## 7. Module by module

Format for each module:
- **Today**: current gate and notable problems
- **Scopes**: supported values (default **bold**)
- **Actions**: proposed key and default level
- **Fix**: concrete gaps

Levels: V = View, M = Manage, F = Full. ✦ = new feature, not just a new control.

> **Implemented catalogue.** `src/utils/permissionCatalog.ts` is the source of truth; it follows the tables below with these refinements from the design:
> - **Groups:** Overview (Reports) · People (Members, Membership management, Visitors, Life centers, Attendance, Ride to church, Departments) · Ministry & engagement (Events, Appointments, School of Ministry, Theme, Community, Sermons, Promotions, Messaging, Programs *being retired*) · Operations (Financials, Giving, Pledges, Requisition, Assets, Marketplace) · Administration (Access rights and users, Positions, Settings, AI).
> - **Users** is folded into **Access rights and users**: `invite_users`, `reset_password`, `deactivate_users` sit beside the role actions.
> - **Community** is no longer an on-purpose *module*; instead its `view_anonymous_author` action is on purpose.
> - **Messaging** adds `include_visitors` as an action and ✦ `approve_sms` (on purpose).
> - **Reports** action keys are flat: `event_generate`, `event_approve`, `dept_prepare`, `exec_decide`, `configure`, ….
> - **Settings** adds `view_logs`; `manage_branches` is on purpose and "needs this role in every branch".
> - Every **`requires`** link is shown in the editor: conversions need `Members.create`; `Asset.raise_requisition` needs `Requisition.raise`.

### 7.1 Members (Church directory, profiles)
- **Today:** Members V/M/F; exclusions on single records only; web deletes at M; Add member goes through the public `/user/register` (S1).
- **Scopes:** `department`, `life_center`, **`branch`**
- **Actions:**

  | Action | Default level |
  |---|---|
  | `create` | M |
  | `edit` | M |
  | `change_status` (activate/deactivate, membership status) | M |
  | `link_family` | M |
  | `view_contact_details` (phone/email/address vs directory fields) | V |
  | `export` | M |
  | `grant_login` | F |
  | `send_password_link` | M |
  | `delete` | F |

- **Fix:**
  - Apply exclusions to lists, counts, exports and bulk endpoints.
  - Require type-to-confirm on bulk delete.
  - Add branch checks on by-id operations (`userController.ts:427, 1152, 1214, 1714, 2683`).

### 7.2 Membership management (pipelines, join requests)
- **Today:** Web routes need M just to look. No backend route uses the domain; services check it through the old single-role column. Department heads approve join requests through a hidden rule.
- **Scopes:** `department` (join requests for departments they lead), **`branch`**
- **Actions:**

  | Action | Default level |
  |---|---|
  | `view_pipelines` | V |
  | `confirm_member` | M |
  | `decide_guest_request` | M |
  | `decide_join_request` | M; also department heads via scope |
  | `convert_visitor` | M |
  | `convert_soul` | M |

- **Fix:**
  - Conversions must check both the source domain (Visitors / Life Center) and `Members.create`.
  - Membership analytics loads visitor and souls-won data without checking those domains.

### 7.3 Departments and ministries
- **Today:** Departments V/M/F; "only their own departments" counts any membership; scoped users can still create departments; join-request approval is granted by the scope on the web.
- **Scopes:** **`department`** (led) for HOD roles, `branch`
- **Actions:**

  | Action | Default level |
  |---|---|
  | `create` | M; not with department scope |
  | `edit` | M |
  | `assign_head` | F |
  | `manage_members` | M |
  | `assign_positions` | M |
  | `delete` | F |

- **Fix:** "department" must mean *led*.

### 7.4 Positions *(Administration)*
- **Actions:** `create` M · `edit` M · `delete` F
- **Fix:** Branch checks by id (`positionController.ts:82, 131, 240`).

### 7.5 Visitors
- **Today:** Visitors V/M/F; responsible members see their visitors; `visitorId` bypass (S8); guests' contacts open to all members (S6).
- **Scopes:** **`assigned`** (responsible member), `branch`
- **Actions:**

  | Action | Default level |
  |---|---|
  | `log_visit` | M |
  | `assign_responsible` | M |
  | `record_follow_up` | V; for assigned |
  | `manage_prayer_requests` | M |
  | `convert_to_member` | M + `Members.create` |
  | `export` | M |
  | `delete` | F |

### 7.6 Life centers
- **Today:** Any member of a center gets leader tools (record souls, meetings, offerings, contacts). The `life_center_leader` flag is never used. Souls can be moved between centers by naming your own center in the request.
- **Scopes:** **`life_center`** (led), `branch`
- **Actions:**

  | Action | Default level |
  |---|---|
  | `record_souls` | leader / M |
  | `record_meeting` | leader / M |
  | `export` | leader / M |
  | `assign_members` | M |
  | `assign_leader` | M |
  | `manage_roles` | F |
  | `remind_leader` | M |
  | `delete` | F |

- **Fix:**
  - Leader tools follow the member's role in the center, not membership.
  - Validate the soul's current center on update (`lifeCenterController.ts:516-538`).

### 7.7 Attendance (church and event)
- **Today:** Church_Attendance V/M/F; department scope enforced on 1 of 5 routes and only as a banner on the web.
- **Scopes:** `department`, **`branch`**
- **Actions:**

  | Action | Default level |
  |---|---|
  | `record` | M |
  | `record_official` | M |
  | `edit_past` | M |
  | `import_biometric` | M |
  | `manage_devices` (moved from Settings) | F |
  | `configure_timing` (moved from Settings) | F |
  | `export` | M |
  | `delete` | F |

### 7.8 Ride to church ✦ *(new domain `Rides`)*
- **Today:** Borrows *Membership management – Manage*, read from the old single-role column with no branch. The same right covers cancelling rides, resolving safety reports, lifting blocks and exporting phone numbers.
- **Scopes:** **`branch`**
- **Actions:**

  | Action | Default level |
  |---|---|
  | `view_overview` | V |
  | `cancel_any_offer` | M |
  | `resolve_safety_reports` | M; explicit |
  | `lift_block` | M; explicit |
  | `manage_pickup_points` | M |
  | `export_roster` (phone numbers) | M; explicit |

- Member side (offer/find/request) stays a member entitlement.

### 7.9 Events
- **Today:** Events V/M/F; public sign-attendance and member search (S2); web deletes at M.
- **Scopes:** **`branch`** (consider `department` for department-owned events later)
- **Actions:**

  | Action | Default level |
  |---|---|
  | `create` | M |
  | `edit` | M |
  | `manage_series` | M |
  | `manage_types` | F |
  | `manage_online_links` | M |
  | `send_reminders` | M |
  | `check_in` (kiosk; needs auth) | M |
  | `view_registrations` | V |
  | `export_registrants` | M |
  | `delete` | F |

### 7.10 Reports *(Overview)*
- **Today:** Can't be stored (S10). The menu opens on view of any of 9 domains, and manage on any one counts as manage here. Event reports borrow Events. Approve/return on event reports need only login at the route, and the configured chain isn't enforced. Executive-summary decisions use a backend `is_leadership` flag.
- **Scopes:** `department`, **`branch`**
- **Actions:**

  | Area | Action | Default level |
  |---|---|---|
  | Event reports | `event.generate` | M |
  | Event reports | `event.approve` (chain) | — |
  | Event reports | `event.return` | — |
  | Event reports | `event.comment` | V |
  | Event reports | `event.export` | V |
  | Event reports | `event.configure_approvals` | F; explicit |
  | Department reports | `dept.prepare` / `dept.submit` | HOD / M |
  | Department reports | `dept.approve` / `dept.return` | chain |
  | Department reports | `dept.remind` | M |
  | Department reports | `dept.decide_request` | F |
  | Department reports | `dept.view_member_names` | M |
  | Executive summary | `exec.view` | V |
  | Executive summary | `exec.decide` | F |
  | — | `configure` (moved from Settings › Reports) | F |

- **Fix:** Replace the 9-domain OR with the Reports domain and its scope.

### 7.11 Communication
- **Theme**
  - `edit` M · `publish` M
  - Fix: add a view guard.
- **Community**
  - Today: view reveals anonymous authors, and moderation is org-wide.
  - Actions: `post_church_wide` M · `post_any_department` M · `pin_important` M · `moderate` (remove/restore/warn) M · `view_anonymous_author` F, explicit · `view_audit_log` F · `delete_any` F
  - Scopes: `department`, **`branch`**
- **Sermons:** `create` M · `publish` M · `manage_series` M · `view_drafts` V · `delete` F
- **Promotions:** `create` M · `publish` M · `archive` M · `reorder` M · `delete` F
- **Messaging** (explicit domain)
  - Actions: `send_in_app` M · `send_email` M · `send_sms` M, explicit (costs money) · `schedule` M · `retry_paid` M, explicit · `edit_templates` F · `toggle_automatic` F · `view_recipient_contacts` M
  - **Audience scope:** `department` (their departments) · `branch` (church-wide) · plus an `include_visitors` action.
  - ✦ Optional *SMS approval*: SMS above N recipients needs a second person with `Messaging.approve_sms`.
  - Fix: fold `/user/send-emails-to-user` and School of Ministry cohort SMS/email into Messaging actions.

### 7.12 Appointments
- **Today:** Appointments V/M/F; attendee actions need no permission; exclusions never read on the web; *Manage availability* needs M, so staff can't set their own.
- **Scopes:** **`own`** (requester/attendee), `branch`
- **Actions:**

  | Action | Default level |
  |---|---|
  | `book_for_others` | M |
  | `respond` (confirm/decline/suggest time) | own or M |
  | `complete` / `no_show` | own or M |
  | `cancel_any` | M |
  | `reassign` | M |
  | `send_reminders` | M |
  | `manage_own_availability` | V |
  | `manage_others_availability` | M |
  | `configure` (settings, reasons) | F |
  | `export` | M |
  | `delete` | F |

### 7.13 School of Ministry
- **Today:** Every web route needs only view. Instructors get full manage on older backend routes via a login-token claim. Enroll and bulk status are behind a localStorage flag on the web. Grading is ungated in the UI. Per-program instructor abilities are saved but never read. The `Program` domain is dead.
- **Scopes:** **`assigned`** (cohorts they instruct), `branch`
- **Actions:**

  | Action | Default level |
  |---|---|
  | `design_curriculum` | M |
  | `manage_cohorts` | M |
  | `enroll_others` | M |
  | `decide_applications` | M |
  | `grade` | assigned / M |
  | `edit_progress` | M |
  | `manage_assignments` (activate, due dates, extensions) | assigned / M |
  | `take_attendance` | assigned / M |
  | `announce` (SMS via `Messaging.send_sms`) | assigned / M |
  | `issue_certificates` | F |
  | `manage_instructors` | F |
  | `view_reports` | V |

- **Fix:** Remove the `Program` domain (migrate values); S7.

### 7.14 Finance (Financials, Giving, Pledges)
- **Financials**
  - Today: approve/return need *view* + being the single global approver. The approver's own submissions auto-approve. Approved records stay editable. A Financials manager can make themselves the approver.
  - Actions: `create_draft` M · `submit` M · `approve` (chain; **never own record**) · `return` (chain) · `edit_approved` F, explicit · `configure_approvals` F, explicit, cannot name self · `configure_receipts_payments_banks_tithe` (moved from Settings) F · `export` M · `delete` F
  - Scopes: **`branch`**
- **Giving**
  - Today: contributions leak across branches when no branch is sent; the full settlement account number is exposed; option edits have no branch check.
  - Actions: `manage_options` M · `manage_settlement_account` F, explicit · `view_full_account_number` F · `view_donor_details` M · `reconcile_payment` M · `message_donor` M · `export` M · `archive` F
- **Pledges**
  - Today: reversing a redemption needs only M; no branch checks by id.
  - Actions: `create` M · `edit` M · `record_redemption` M · `reverse_redemption` F, explicit · `reconcile_online` M · `send_reminders` M · `manage_callers` M · `view_payer_details` M · `export` M · `delete` F
  - Scopes: **`assigned`** (pledge caller), `branch`

### 7.15 Requisition
- **Today:**
  - Web routes have no permission.
  - Approvers pass every *manage* route, including editing the global chain.
  - Rights are read from the stale login token.
  - Delete has no status check.
  - There is no *disbursed/paid* status.
  - A requisition can be raised for any department.
- **Scopes:** **`own`**, `department` (led), `branch`
- **Actions:**

  | Action | Default level |
  |---|---|
  | `raise` | V; plus the chain's requester list |
  | `raise_for_any_department` | M |
  | `approve` / `reject` (current step only) | chain |
  | `edit_as_approver` | chain |
  | `override_step` | F, explicit |
  | `comment` | V |
  | `send_reminders` | M |
  | ✦ `mark_disbursed` | M, explicit |
  | `configure_approvals` | F, explicit; **not** granted by being an approver |
  | `export` | M |
  | `delete_own_draft` | V |
  | `delete` (any; blocked once approved) | F |

### 7.16 Assets
- **Today:**
  - Asset V/M/F.
  - Department members view their department's assets and count stock with no Asset permission.
  - *Raise repair requisition* rides on M and bypasses the requisition requester list.
  - Old update/delete endpoints skip branch checks.
- **Scopes:** `department_member` (kept for stock counts) · `department` (led) · **`branch`**
- **Actions:**

  | Action | Default level |
  |---|---|
  | `create` | M |
  | `edit` | M |
  | `assign` | M |
  | `change_status` | M |
  | `write_off` | F, explicit |
  | **`raise_requisition`** | M; **also needs `Requisition.raise`** |
  | `clear_repair` | M |
  | `stock_check` (start/cancel/close) | M |
  | `count` | department_member |
  | `reconcile` | M |
  | `request_recount` | M |
  | `export` | M |
  | `delete` | F |

### 7.17 Marketplace
- **Today:**
  - Orders aren't branch-scoped for admins and carry billing data.
  - *Mark paid* is a plain field edit with no actor recorded.
  - *Reconcile payments* and *Export* are ungated in the UI.
  - Some GET requests change state.
  - The payment `callback_url` is an open redirect.
- **Scopes:** **`branch`** (consider per-market managers later)
- **Actions:**

  | Action | Default level |
  |---|---|
  | `manage_markets` | M |
  | `manage_catalog` | M |
  | `publish_product` | M |
  | `create_order_for_member` | M |
  | `mark_paid` | M, explicit; records actor |
  | `fulfil_order` | M |
  | `edit_order_items` | M |
  | `cancel_any_order` | M |
  | `reconcile_payments` | M |
  | `export_orders` | M |
  | `delete` | F |

### 7.18 Administration (Settings, Access rights, Users, Branches, AI)
- **Access_rights**
  - Actions: `create_role` M · `edit_role` M · `assign_roles` M · `edit_workspaces` M · `delete_role` F
  - All subject to the **grant ceiling** (S4): no self-edit, and only roles in branches you administer.
- **Users** (moves from Members): `invite` M · `reset_password` M · `deactivate` M
- **Settings**
  - Split **org-wide** from **branch** settings. Branches, default branch and org-wide configuration need the role in *every* branch (or a new `org_admin` action).
  - `manage_branches` F, explicit · `configure_general` M · `view_logs` V
- **AI:** `chat` V · `generate_insights` V · `query_data` (bounded by the target domain's view + branch, S9) · `manage_credentials` F, explicit · `view_usage` V

### 7.19 Home workspaces
Each queue item (approve requisition, approve finance record, publish sermon, approve join request, assign visitor) checks the **same action key** as its module, on both server and client. The `workspaces` field stays as layout only.

---

## 8. Delivery plan

| Phase | Scope | Repos | Notes |
|---|---|---|---|
| **0. Security patch** *(done, §0.1)* | S1–S10 | Backend (+ small Frontend for S1 endpoint split) | Independent of the redesign. S10 is one line and unblocks the Reports row already in the editor. |
| **1. One resolver** *(mostly done: live per-branch checks everywhere touched, second alias table no longer used for rides, join requests or finance; requisition requester auto-list still reads the old single-role column)* | Retire the second alias table, single-role column reads and JWT-claim authorization. Central `assertBranchAccessible` for by-id operations (a `loadScoped(model, id)` helper). Align fallbacks (or remove `Program` fallbacks after migrating values). Return **403** for forbidden vs 401 for expired. | Backend; Frontend + Mobile drop their alias tables | No user-visible change except fixed bugs |
| **2. Catalogue + capabilities API** *(done except the capabilities endpoint: the catalogue exists in both repos with identical keys — Backend `src/permissions/catalog.ts`, Frontend `src/utils/permissionCatalog.ts`)* | `catalog.ts`, `GET /access/catalog`, `GET /user/me/capabilities`, storage of `Actions` and generalised `Scopes`, grant ceiling, migration that writes nothing (defaults come from levels) | Backend | Lossless: every role keeps today's powers |
| **3. Enforce actions per module** *(done, §0.2)* | Highest risk first: **Requisition, Finance, Messaging, Members export, Access rights**, then Assets, Rides, School of Ministry, Community, Marketplace, the rest | Backend guards + Frontend `can()` gating | Swap label-based button gating for action keys as each module lands |
| **4. Role editor** *(done)* | Action checkboxes + scope select per module, presets with scopes, ceiling feedback, "custom" badge | Frontend | Ships when phase 3 covers the first modules |
| **5. Mobile** | Use `me/capabilities`; route guards on deep links; leader/instructor tools from relationships | Mobile | Additive only (installed apps) |
| **6. New features** *(Rides domain done)* | Rides domain, requisition *disbursed* status, SMS approval, per-market managers (if wanted) | All | ✦ items |

---

## 9. Decisions needed

1. **Member entitlements vs staff permissions.**
   - Mobile allows member features by default; the backend denies when a key is missing.
   - Which member features (marketplace, appointments, life center, school) are always on for members, and which need a role?
2. ~~**"Department" scope = led or member?**~~ **Decided: led** ("Departments they lead"); "Departments they belong to" kept for Assets stock counts. The API still applies *member* until enforced (§0).
3. **Who approves finance records?** Keep one global approver, or move finance to an approval chain like requisitions (and forbid self-approval either way)?
4. **SMS approval.** Offered in the editor as ✦ `Messaging.approve_sms` (*New feature*, on purpose). Still to decide: the threshold, and when to build it.
5. **Org-wide settings.** Who may create branches and change org-wide configuration: holders of Settings in every branch, or a separate org-admin action?
6. ~~**Program domain.**~~ **Decided: retire.** Marked "Being retired"; migrate stored values to Theme, Marketplace and School of Ministry, then drop the fallbacks.
7. ~~**Rides.**~~ **Decided: new `Rides` domain** (done, §0).
8. **Requisition "disbursed".** Add a disbursed/paid status (and who can set it)?
9. **Full = delete.** Confirm "Full" is the only level that deletes everywhere, and that exports need Manage by default.

---

## Appendix: evidence

| File | Contents |
|---|---|
| [`evidence/backend-audit.md`](./evidence/backend-audit.md) | Every backend route with its guard, implicit scoping, workflow decisions, candidate actions and 38 ranked gaps (file:line) |
| [`evidence/frontend-audit.md`](./evidence/frontend-audit.md) | Every web route's requirement, every page action and how it is gated, role editor capabilities, approval chains (file:line) |
| [`evidence/mobile-audit.md`](./evidence/mobile-audit.md) | Mobile permission checks, screens and actions, leader/instructor tools, drift (file:line) |

Line numbers refer to the code at the time of the audit (Backend `3b7f9ba`, Mobile `017ccc6`, Frontend `development` after #492). Some per-module line numbers in the evidence files are marked approximate.
