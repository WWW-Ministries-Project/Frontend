# WWM Mobile: permission and access audit (read-only)

Repo: `../wwm-mobile`. All paths below are relative to `src/` unless they are absolute.

**Correction to the brief.** The app is no longer "a few big files" (`screens.tsx`, `api.ts`, ...). It was restructured feature-first: `src/features/<domain>/`, `src/shared/`, `src/navigation/`. The permission logic sits in one file, `shared/lib/permissions.ts`, which is 118 lines.

---

## 1. Permission and role primitives

### 1.1 `shared/lib/permissions.ts`

| Symbol | Line | Behaviour |
|---|---|---|
| `PermissionValue` | 4 | `No_Access \| Can_View \| Can_Manage \| Super_Admin`. The same 4 levels as the backend. |
| `MemberModule` | 6 | There are only 4 gated modules: `market`, `lifeCenter`, `school`, `appointments`. |
| `MODULE_ACCESS` | 15-20 | Maps each module to a domain and a legacy key: Marketplace/`view_marketplace`, `Life Center`/`view_life_center`, `School_of_ministry`/`view_school_of_ministry`, `Appointments`/`view_appointments`. |
| `TAB_MODULE` | 24 | Empty. No bottom tab is permission-gated. |
| `DOMAIN_ALIASES` | 26-31 | Has only 4 entries (table below). There are **no fallbacks** to other domains. |
| `parsePermissionValue` | 33-42 | Accepts booleans and loose strings (`view`, `true`, `1`, `manage`, `admin`, ...). |
| `accessRecords` | 44-47 | Reads `user.access_permissions`, then `user.permissions`. The first record that holds an alias key wins. |
| `canAccessMemberModule` | 76-91 | Order of checks: (1) `lifeCenter` returns true if `user.life_center_leader` (80). (2) `school` returns true if `user.instructor` (81). (3) The canonical domain value: allowed when it is not `No_Access`, so `Can_View` and above pass. (4) The legacy boolean key. (5) **Otherwise it returns `true` (90). The default is ALLOW when there is no entry.** |
| `isGuestUser` | 94 | `Boolean(user.is_guest)`. |
| `canAccessMemberTab` | 96-107 | `CommunityTab` is shown when the user is not a guest. Every other tab returns true. |
| `getVisibleMemberTabs` | 109-118 | Home, Sermons and Give are always shown. Community is shown for non-guests. More is always shown. |

Only *view* is ever asked. The mobile app has no `Can_Manage` or `Super_Admin` check anywhere. Manage-level abilities reach the app only as server-computed booleans (see §3).

### 1.2 Where the identity flags come from

- `shared/types/user.ts:12-17` defines `life_center_leader`, `instructor`, `permissions`, `access_permissions` and `is_guest`.
- `shared/lib/auth-token.ts:46-50, 92-96` merges these from the JWT claims and from `user/current-user`.
- The backend computes them in `../Backend/src/modules/user/userController.ts:1421-1440` (`checkIfLifeCenterLeader`, `courseService.checkIfInstructor`) and `:3582-3583`.
- A realtime `session.changed` event triggers `refreshCurrentUser()` (`shared/currentUser.ts:8`, `shared/realtime/session.ts:8`), so permission changes reach a live session.

### 1.3 Every other permission or role check

| Check | File:line | What it gates |
|---|---|---|
| `canAccessMemberTab` in `GuardedTabScreen` | navigation/index.tsx:209-232 | Redirects the Community tab to Dashboard for guests. This is the **only route-level guard**. |
| `getVisibleMemberTabs` | navigation/index.tsx:271 | Which bottom-bar buttons render. |
| `canAccessMemberModule(market)` | shared/ui/layout/AppHeader.tsx:38 | The cart shortcut in the header. |
| | more/screens/MoreScreen.tsx:92 | The Orders and Church store rows; the orders and products queries (125-139). |
| | search/hooks.ts:41 | The market search scope. |
| `canAccessMemberModule(appointments)` | MoreScreen.tsx:93 | The Appointments row. |
| | more/hooks.ts:38 | The bookings query in `useMemberRequests`. |
| | more/screens/RequestsScreen.tsx:90 | The "book" CTA. |
| | home/screens/DashboardScreen.tsx:281, 336, 493 | The "Book" quick action and the copy. |
| | search/hooks.ts:43, 110 | Search. |
| `canAccessMemberModule(school)` | MoreScreen.tsx:94 | The My Learning and School of Ministry rows. |
| | DashboardScreen.tsx:116-120 | The enrolled-programs query. |
| | search/hooks.ts:42, 64, 119, 219, 276 | Search. |
| `canAccessMemberModule(lifeCenter)` | MoreScreen.tsx:95, 112-117 | The Life Center row and its query. |
| `isGuestUser` | MoreScreen.tsx:99 | Hides Grow (Learning, Life Center, Serve), Directory, Ride to church, Blocked members and Serving. Shows the membership-request card. |
| | DashboardScreen.tsx:205, 326, 391, 454 | The Serve quick action, the guest card and the member sections. |
| | more/screens/ProfileScreen.tsx:65 | `canEdit` for the profile. |
| | community/hooks.ts:26 (`useCanUseCommunity`) | Every Community screen and query. |
| | rides/hooks.ts:15 (`useCanUseRides`) | Every Rides screen. Screens show a `MembersOnly` state: RidesScreen 102, RideOfferScreen 291, RideFindScreen 159, MyRideScreen 284. |
| | more/hooks.ts:177; auth/hooks.ts:74 | Profile completion; membership-request refresh. |
| `user.instructor` | MoreScreen.tsx:167, 371-394 | The "Serving > Grading queue" row and the fan-out query. |
| | instructor/screens/InstructorProgramsScreen.tsx:49 | The "Instructor access required" empty state. |
| `communityMe.canModerate` (server flag) | MoreScreen.tsx:107, 396 | The "Reported content" row. |
| | community/screens/CommunityReportsScreen.tsx:125-132, 179-183 | The moderation queue query and its view. |
| `communityMe.canManage` (server flag) | CommunityReportsScreen.tsx:126, 254-277 | The Remove, Restore and Warn buttons. Otherwise the screen shows read-only text. |
| | community/screens/CommunityCreateScreen.tsx:239, 247, 307, 479 | The `MESSAGE` post type and the "Important" (pin and notify) toggle. |
| | community/components/PostSheets.tsx:92 | `canDelete = isMine \|\| canManage`. |
| `post.isMine` / `comment.isMine` (server flag) | PostSheets.tsx:91-92, 228-236 | Edit and delete for own content. Report is hidden on your own content. |
| Life Center membership | lifecenter/screens/LifeCenterScreen.tsx:60, 173, 200 | `isLeadershipMember`, which controls Log Meeting and meeting Edit/Delete. |
| `myRide.role` (driver/passenger) | rides/api.ts:208-221; rides/helpers.ts:132-149; MyRideScreen.tsx:299-309 | Which ride UI renders. The role is per event and self-assigned. |

### 1.4 Alias and fallback drift (mobile vs web vs backend)

Sources:
- Web: `../Frontend/src/utils/accessControl.ts` — `DOMAIN_ALIASES` 73-114 and `DOMAIN_FALLBACKS` 121-137.
- Backend: `../Backend/src/middleWare/authorization.ts` — `PERMISSION_KEY_ALIASES` 16-74. This file is identical to the copy in `../Backend`.

| Domain | Mobile keys | Web aliases (+ fallbacks) | Backend keys, in order | Drift |
|---|---|---|---|---|
| Marketplace | Marketplace, Market Place, Market | Same, no fallback | `Marketplace`, **`Program`** | The backend falls back to Program; mobile and web do not. Mobile accepts `Market Place` and `Market`; the backend does not. |
| School_of_ministry | School_of_ministry, School of ministry, School of Ministry | Same, no fallback | School_of_ministry, School of ministry, **`Program`** | The backend falls back to Program. The `School of Ministry` (capital M) key is not accepted by the backend. |
| Appointments | Appointments, Appointment | Same, no fallback | Appointments, **`Members`** | The backend falls back to Members; mobile and web do not. `Appointment` (singular) is mobile and web only. |
| Life Center | Life Center, Life_Center, Life center, LifeCenter | Same, no fallback | `Life Center` only | Mobile and web accept 3 spellings the backend ignores. |
| Community | Not a module. Gated by guest status plus the server's `canModerate`/`canManage` | Fallback to Announcements | Community, Announcements | Mobile never reads the Community permission itself, so there is no drift risk on the client. |
| All other domains (Members, Events, Requisition, Asset, Departments, Church_Attendance, Giving, Pledges, Sermons, Promotions, Messaging, Reports, ...) | Absent | Present | Present | Mobile does not model them. |

**Semantic drift (the most important one).**
- When the key is missing, the backend **denies**: `resolvePermissionValue` returns null, then `if (!permission) return false`, at authorization.ts:282-283.
- Mobile **allows** in the same case (permissions.ts:90). Mobile also allows when `permissions` is empty or null.
- Result: a user whose level lacks `Marketplace` but has `Program: Can_View` gets correct access on mobile only by accident, through default-allow. A user with no level at all sees modules that the API then refuses.
- Backend member-facing endpoints may not use these permission keys at all, so default-allow is partly deliberate: member features are for everyone. This needs a decision in the new model.

---

## 2. Screens and actions, and how each is gated

There are no route-level guards except Community. Every More-stack screen is reachable by deep link: `navigation/linking.ts:41-62` registers market, appointments, rides and life-center. These links bypass the menu-level `canAccessMemberModule` hiding, because the Market, Appointments, LifeCenter and Programs screens do not re-check permission.

| Screen / action | Gate | Evidence |
|---|---|---|
| Home (Dashboard) | Ungated. Sections hidden by guest status, school or appointments permission. | DashboardScreen.tsx:116, 205, 281 |
| Home: appointments query | **Ungated.** It runs with `enabled: Boolean(user?.id)` even without Appointments permission. | DashboardScreen.tsx:105-109 |
| Home: pledges query | Ungated | DashboardScreen.tsx:111 |
| Sermons (Watch), live, YouTube | Ungated | watch/api.ts:179-222 |
| Give: give, pledge payments, my contributions | Ungated. Guests can give. Ownership is implicit through `/my-*` endpoints. | giving/api.ts:143-187 |
| Community tab: feed, post, create, react, comment, report, block, hide | Guest status (tab guard plus `useCanUseCommunity`) | community/hooks.ts:26; navigation/index.tsx:232 |
| Community: edit or delete own post | Ownership (`isMine`) | PostSheets.tsx:91, 228 |
| Community: delete other people's post | Server `canManage` | PostSheets.tsx:92 |
| Community: MESSAGE post type, Important pin | Server `canManage` | CommunityCreateScreen.tsx:239, 479 |
| Community: post to department audience | Server-supplied `me.departments` (only your own departments are offered) | CommunityCreateScreen.tsx:208, 224-229 |
| CommunityDepartment screen | Your own departments from `me.departments` | community/screens/CommunityDepartmentScreen.tsx:22 |
| CommunityReports: view queue | Server `canModerate` | CommunityReportsScreen.tsx:125-132 |
| CommunityReports: remove, restore, warn | Server `canManage` | CommunityReportsScreen.tsx:254 |
| Admin posts and audit log | API is defined but **no UI uses it** | community/api.ts:385-407 |
| More: Inbox, notifications | Ungated (own) | inbox/api.ts:77-93 |
| More: My requests (appointments, department joins, cancel own appointment) | Partly gated by appointments permission. Join requests are ungated. | RequestsScreen.tsx:90, 103; more/hooks.ts:38-47 |
| More: Orders and Church store (Market stack) | Menu gated by Marketplace. **The screens are not gated.** | MoreScreen.tsx:92, 210, 343 |
| More: Appointments list, book, edit, delete | Menu gated by Appointments. **The screens are not gated.** Uses `appointment/bookings/:id` PUT/DELETE, the same endpoints staff use, scoped only by `requesterId=user.id` in the client query. | appointments/api.ts:60-65; AppointmentsScreen.tsx:69, 94; AppointmentFormScreen.tsx:242 |
| More: My Learning, Programs, enrol, classroom, submit assignment, certificate | Menu gated by school permission or the instructor flag. Screens not gated. Client passes `user_id`/`userId`. | school/api.ts:71-98 |
| More: Life Center | Menu gated by lifeCenter permission (or the `life_center_leader` flag) plus non-guest. Screen not gated. | MoreScreen.tsx:112-117, 296 |
| More: Serve (join department) | Non-guest only | MoreScreen.tsx:310-318; departments/api.ts:10-12 |
| More: Directory | Non-guest only. The server limits fields to names, departments and roles. | MoreScreen.tsx:327; DirectoryScreen.tsx:202 |
| More: Ride to church (offer, find, request, accept, decline, cancel, report concern) | Non-guest only. Driver or passenger is decided by the server per event. | rides/hooks.ts:13-16 |
| More: Instructor portal (Programs, Cohorts, Assignments, Grading) | Only `InstructorProgramsScreen` checks `user.instructor` (49). **Cohorts, Assignments and GradingPanel do not check anything** and rely on the API. | instructor/screens/* |
| Profile edit, prayer requests, account settings, delete account, change password | Own. Profile editing is blocked for guests. | ProfileScreen.tsx:65; more/api.ts:205-212; auth/api.ts:40-65 |
| Search overlay | Scopes filtered by market, school, appointments and community access | search/hooks.ts:41-43, 276 |

---

## 3. Staff and leader actions in mobile, and how authority is decided

| Capability | Present? | How authority is decided |
|---|---|---|
| Requisition approval, open requisition from asset | **Absent.** No requisition, asset or approval code exists in the app. | — |
| Event attendance taking, Church_Attendance | **Absent.** Events only list and self-register (`event/register`). | events/api.ts:8-10 |
| Department head tools (approving join requests) | **Absent.** Members only request to join. The approver ("Head of Department") is mentioned in copy only. | MoreScreen.tsx:311; DashboardScreen.tsx:322 |
| Life Center leader tools: log meeting (offering, attendees, first-timers), edit or delete meeting, record souls won | Present | See the note below this table. |
| Life Center: export meetings (PDF, DOCX, XLSX) | Present | Available to every member of the center: "Exporting only ever returns what this list already shows" (LifeCenterScreen.tsx:163-171). |
| Instructor: list programs, cohorts and assignments; activate or deactivate assignments; grade one or many submissions; grading-queue count | Present | `user.instructor` boolean, a server claim from `checkIfInstructor`. The programs list is fetched with a client-supplied `instructorId=user.id` (instructor/api.ts:53). There is no per-program or per-cohort ownership check on the client. |
| Community moderation: view queue | Present | Server flag `canModerate` (described in community/types.ts:99 as "Community view permission"). |
| Community moderation: remove, restore, warn, delete any post, MESSAGE type, pin | Present | Server flag `canManage` (Community manage). |
| Ride driver | Present | Self-service. Any non-guest member publishes an offer per event and becomes "driver" for that event. Accept and decline are on their own offer's requests. The server's `role` is trusted only when the matching record exists (rides/api.ts:208-212). |
| Ride coordinator or admin | **Absent** | — |
| Appointment staff side (availability, managing others' bookings) | **Absent as UI.** `staffAvailability` and `staffAvailabilityStatus` are read-only lookups for booking. | appointments/api.ts:53-54 |

**Note on how Life Center authority is decided.** It is inconsistent:
- `canAccessMemberModule` is short-circuited by `user.life_center_leader` (permissions.ts:80). That only affects whether the menu row shows.
- The real leader-tool gate is `isLeadershipMember`: whether the user's id is in `lifeCenter.members` (LifeCenterScreen.tsx:60). The type has `role?: {name}` (lifecenter/types.ts:16), but that role is **not inspected**.
- So any person listed in the center's `members` array gets Log Meeting, Edit and Delete. The variable name assumes the server returns only leadership in `members`. If ordinary members ever appear in that array, they gain the leader UI, and the backend becomes the only guard.

---

## 4. Client-side data visibility rules

- **"Own" scoping is done by passing the user id from the client**, which leaves enforcement to the backend:
  - `lifecenter/my-lifecenter?user_id=` (lifecenter/api.ts:56)
  - `orders/get-orders-by-user?user_id=` (market/api.ts:21)
  - `program/user-enrollment?user_id=` and `program-completion-status?userId=` (school/api.ts:72-75)
  - `program/get-instructor-programs?instructorId=` (instructor/api.ts:53)
  - `appointment/bookings?requesterId=` (DashboardScreen.tsx:107; AppointmentsScreen.tsx:69; more/hooks.ts:41)
- Each of these is an IDOR surface unless the backend binds the id to the token.
- **Own scoping through `/mine`-style endpoints** (good): `rides/mine`, `department-join-request/mine`, `givingoption/my-contributions`, `pledges/my-pledges`, `pledges/my-pledge-payments`, `visitor/my-prayer-requests`, `user/membership-request/mine`, `notifications`, `user/get-user`.
- **Department scope**: Community audience and department screens use only the server's `me.departments` (CommunityCreateScreen.tsx:208). Mobile has no "my department" data views otherwise.
- **Life Center scope**: the user sees their own center only. Members, souls won and meetings come from that center's id.
- **Church-wide**: sermons, events, products, programs, giving options, the community feed and the directory. The directory restricts fields on the server side; the UI states "Only names, departments and roles" (DirectoryScreen.tsx:202).
- **Rides**: contact details unlock only after acceptance. This is server-enforced and reflected in the UI (MyRideScreen.tsx:75-76, 305-309).
- **Anonymous community posts**: the real author is visible only through the admin endpoint (community/api.ts:385-392), which no mobile UI calls.
- There is **no client-side filtering by branch** (no `branch_id` anywhere), and no own / department / branch / all scope selector.

---

## 5. Implications for the extended ACTION + VISIBILITY model

1. Mobile resolves only "view of 4 domains" plus two role booleans plus two server-computed community booleans (`canModerate`, `canManage`). The `community/me` pattern, where the server computes capability flags, is the cleanest model to extend, for example to `/me/capabilities` returning action keys and scopes. It avoids copying the alias tables a third time.
2. Default-allow (permissions.ts:90) contradicts the backend's default-deny. Decide explicitly which mobile modules are "member entitlements" (always allowed) and which are staff permissions.
3. Add the backend's Program and Members fallbacks to mobile, or remove them from the backend. Today a level with only `Program` set behaves differently on web than on the API.
4. Deep links and screens beyond the More menu need route-level guards (as with `GuardedTabScreen`) once real staff actions exist on mobile, for example requisition approval or attendance.
5. Life Center leadership should come from an explicit server flag or scope (for example `lifeCenter.myRole` or an action key such as `lifecenter.meeting.manage`), not from membership of the `members` array.
6. Instructor sub-screens and grading rely entirely on the backend. Instructor actions would map to scoped action keys, for example `program.grade` scoped to own cohorts.
7. Ride roles are self-service per event. A future "ride coordinator" action would be new.
