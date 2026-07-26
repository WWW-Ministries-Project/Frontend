# Announcements Feature — Design

Date: 2026-07-26
Status: Approved (design), pending implementation plan
Repos: Frontend (`WWW-Ministries-Project/Frontend`) + Backend (`WWW-Ministries-Project/Backend`, sibling clone at `../Backend`)

## Summary

Add an **Announcement** feature under the **Communication** sidenav. Admins create announcements
(title + rich-text content) targeted at an audience, save as draft or publish. On publish,
recipients are resolved and notified via the existing in-app notification pipeline. Members see
announcements targeting them in a dashboard widget and a dedicated member page; clicking one opens
a modal showing title + content.

Greenfield: no announcement model, route, API, or UI exists on either side today.

## Decisions (locked with user)

- **Permission**: new first-class `Announcements` permission domain (frontend + backend), not a reuse of `Theme`.
- **Member surface**: both a dashboard widget and a dedicated member page.
- **Editor**: existing `react-quill` wrapper `src/components/TextEditor.tsx`.
- **Recipients**: resolved at publish time and fanned into the existing `in_app_notification` table.
  No separate announcement-recipient table. Member read state rides on the notification's read flag.

## Audience types

| audience_type | Recipient resolution (branch-scoped) |
|---|---|
| `ALL_MEMBERS` | all `user` in branch scope |
| `MINISTRY_WORKERS` | `user.is_user = true` |
| `HEADS_OF_DEPARTMENT` | user ids in `department.department_head` for branch departments |
| `SPECIFIC_DEPARTMENT` | distinct user ids from `department_positions` + `user_departments` where `department_id = X` |
| `SPECIFIC_POSITION` | user ids where `user.position_id = X` (plus `department_positions.position_id = X`) |

`SPECIFIC_DEPARTMENT` requires `department_id`; `SPECIFIC_POSITION` requires `position_id`; others require neither.

---

## Backend (`/Users/akwaah/Documents/GitHub/Backend`)

Stack: Express 4 + TypeScript + Prisma 6 (MySQL). Modules live under `src/modules/<feature>/`.

### Data model — `prisma/schema.prisma`

```prisma
model announcement {
  id            Int                    @id @default(autoincrement())
  title         String
  content       String                 @db.LongText   // sanitized HTML from editor
  audience_type announcement_audience
  department_id Int?
  position_id   Int?
  status        announcement_status    @default(DRAFT)
  branch_id     Int?
  created_by    Int
  published_at  DateTime?
  created_at    DateTime               @default(now())
  updated_at    DateTime               @updatedAt

  branch     branch?     @relation(fields: [branch_id], references: [id])
  department department? @relation(fields: [department_id], references: [id])
  position   position?   @relation(fields: [position_id], references: [id])
  creator    user        @relation(fields: [created_by], references: [id])
}

enum announcement_audience {
  ALL_MEMBERS
  MINISTRY_WORKERS
  HEADS_OF_DEPARTMENT
  SPECIFIC_DEPARTMENT
  SPECIFIC_POSITION
}

enum announcement_status {
  DRAFT
  PUBLISHED
}
```

Add matching back-relations on `branch`, `department`, `position`, `user` models. Create + run a Prisma migration.

### Module — `src/modules/announcements/`

Files: `announcementRoute.ts`, `announcementController.ts`, `announcementService.ts`.
Export from `src/modules/index.ts`. Mount in `src/routes/appRouter.ts` as `/announcements`.

Branch scoping: `getBranchScopedWhere` (list) + `resolveBranchIdOrDefault` (create) from
`src/modules/branches/branchService.ts`.

### Endpoints

| Method + path | Guard | Behavior |
|---|---|---|
| `POST /announcements` | `can_manage_announcements` | Create as DRAFT only. Publishing goes through `/publish` so side-effects live in one place. |
| `GET /announcements` | `can_view_announcements` | Admin list, branch-scoped, paginated. |
| `GET /announcements/:id` | `can_view_announcements` | Single. |
| `PUT /announcements/:id` | `can_manage_announcements` | Edit. DRAFT: all fields. PUBLISHED: title/content only (audience frozen). |
| `DELETE /announcements/:id` | `can_delete_announcements` | Delete. |
| `POST /announcements/:id/publish` | `can_manage_announcements` | DRAFT→PUBLISHED. Set `published_at`, resolve recipients, fan-out notifications. Blocked (409) if already PUBLISHED. |
| `GET /announcements/mine` | `protect` only | Member's published announcements: resolve caller's memberships against each announcement's audience. Paginated. |

### Publish side-effects

1. Set `status = PUBLISHED`, `published_at = now()`.
2. `announcementService.resolveRecipients(announcement)` → distinct user id list (branch-scoped).
3. `notificationService.createManyInAppNotifications(inputs)` — one input per recipient:
   `type: ANNOUNCEMENT`, `title`, `body` (announcement title / snippet), `entityType: "announcement"`,
   `entityId: id`, `actionUrl` deep-linking the member announcements page, `actorUserId: created_by`.
   Push/SSE/SMS/email delivery already handled inside that service.

Publish is idempotent: a PUBLISHED announcement cannot be republished.

### Permissions — `src/middleWare/authorization.ts`

- Add `Announcements` to `PERMISSION_KEY_ALIASES` (`:10-31`).
- Add guards near `:1604`: `can_view_announcements`, `can_manage_announcements`, `can_delete_announcements`
  via `this.checkPermission("Announcements", "view" | "manage" | "admin", msg)`.

---

## Frontend (`/Users/akwaah/Documents/GitHub/Frontend`)

Template to mirror: `src/pages/HomePage/pages/ChurchCommunication/` (AnnualTheme* — list + Create + Modal + Formik + hooks).

### Permission domain — `src/utils/accessControl.ts`

Add `Announcements` to `CANONICAL_PERMISSION_DOMAINS` (`:13-34`). Yields legacy flags
`view_announcements` / `manage_announcements`.

### Routing — `src/routes/appRoutes.tsx`

- Admin: add a child in the Communication `children` array (`:500-524`): `path: "announcements"`,
  `sideTab: true`, `permissionNeeded: "view_announcements"`, `element: <AnnouncementManager />`.
- Member: add a member-side route `announcements` → `<MemberAnnouncementsPage />` (mirror the
  member notification-center route registration).

### API layer

- New folder `src/utils/api/announcements/interfaces.ts` (types: Announcement, AudienceType, Status, DTOs).
- Methods:
  - `apiFetch.ts`: `fetchAnnouncements` (admin list, branch query), `fetchAnnouncement`, `fetchMyAnnouncements` (`/mine`).
  - `apiPost.ts`: `createAnnouncement`, `publishAnnouncement`.
  - `apiPut.ts`: `updateAnnouncement`.
  - `apiDelete.ts`: `deleteAnnouncement`.

### Admin page — `AnnouncementManager.tsx`

Mirror `AnnualThemeManager`. `useFetch(api.fetch.fetchAnnouncements)` list with status badge
(Draft/Published), Create button, `Modal`, edit + delete (`useDelete`, `showDeleteDialog`).
EmptyState when none.

### Admin form — `AnnouncementForm.tsx`

Formik + Yup inside `Modal`:
- `title` — `FormikInputDiv`.
- `content` — `TextEditor` (react-quill).
- `audience_type` — `FormikSelectField` (5 options).
- Conditional `department_id` select (options via `useFetch` departments) when `SPECIFIC_DEPARTMENT`.
- Conditional `position_id` select (options via `useFetch` positions) when `SPECIFIC_POSITION`.
- Buttons: **Save as draft** (`createAnnouncement`) and **Save & publish**
  (`createAnnouncement` then `publishAnnouncement` on the returned id). On edit of a published
  announcement, audience/department/position fields are disabled.

Validation: title required; content required (non-empty stripped of HTML); department_id required iff
SPECIFIC_DEPARTMENT; position_id required iff SPECIFIC_POSITION.

### Member widget — `src/pages/HomePage/pages/DashBoard/Components/ChurchAnnouncements.tsx`

Replace the static placeholder with real data: `useFetch(api.fetch.fetchMyAnnouncements)`, show recent
few, row click → `Modal` (title + `dompurify`-sanitized content). "See all" links to member page.

### Member page — `MemberAnnouncementsPage.tsx`

Full list of `/mine`, same row-click→modal. Reachable from widget and (optionally) notification actionUrl.

### Notifications

Bell dropdown, notification center, and realtime connector already exist and require no changes —
publish creates in-app notifications the member's existing UI picks up. `actionUrl` deep-links the
member announcements page.

---

## Out of scope (YAGNI)

- Scheduled/future-dated publishing.
- Per-recipient announcement read receipts beyond the notification read flag.
- Editing an announcement's audience after publish.
- Announcement categories/tags, attachments, comments.
- Unpublish / recall.

## Testing

No test runner configured in Frontend (per CLAUDE.md). Verify manually: lint clean
(`npm run lint`), `npx tsc --noEmit` types clean. Backend: verify Prisma migration applies and each
audience type resolves the expected recipient set against seed data.
