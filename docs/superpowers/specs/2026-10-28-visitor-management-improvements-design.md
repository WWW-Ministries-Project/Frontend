
# Visitor Management Improvements — Design

Date: 2026-10-28
Repos: Frontend (`WWW-Ministries-Project/Frontend`), Backend (`WWW-Ministries-Project/Backend`), Mobile (`Akwaah/wwm-mobile`)
Packaging: single combined spec; one branch/PR **per repo** per the workspace boundary rule. Build order: 1 → 2 → 3 → 4.

## Background

Four items surfaced during testing of the visitor-management feature:

1. Visitor form title + phone-code inputs diverge from the member form.
2. Event-attended dropdown is clumsy (month/year selector) and not linked to visit date.
3. No way to configure a monthly follow-up target or auto-generate follow-ups.
4. Members assigned to visitors have no way to manage them without the admin portal.

### Current code map (verified)

**Frontend**
- Visitor form: `src/pages/HomePage/pages/VisitorManagement/Components/VisitorForm.tsx`. Title via shared `NameInfo` (`src/components/subform/NameInfo.tsx:18-27`, options `:56-77`); phone via `ContactsSubForm` → `ContactInput` (`src/components/ContactInput.tsx`). Event dropdown + month/year filter in `EventSelectionFields` (`VisitorForm.tsx:121-249`); visit date `:427-434`; `SyncEventDate` (event→date) `:101-118`.
- Member form (canonical): `MemberFormSections.tsx` — `TITLE_OPTIONS` (`memberFormOptions.ts:7-28`) + `PhoneField` (`formFields.tsx:231-250`).
- Dial codes are runtime-derived from the country store (`src/pages/HomePage/store/coutryStore.ts`) for BOTH forms — code list already identical; divergence is the component + title list + default.
- Visitor API: `src/utils/api/visitors/{visitorActions,interfaces}.ts`. Event options: `fetchEventOptions` → `GET event/list-events-light` (`apiFetch.ts:296-300`, params month/year/includeEventId).
- Settings pattern: section folder under `src/pages/HomePage/pages/Settings/` + lazy entry in `Settings/lazyPages.ts` + child route with `sideTab:true` in `src/routes/appRoutes.tsx` (settings parent `:1290-1353`).

**Backend**
- Module: `src/modules/visitorManagement/` (`visitorRoute.ts`, `visitorController.ts`, `visitService`, `followUpController/Service`, `prayerRequestController`, `visitorAccess.ts`). Member-facing precedent: `GET/POST /my-prayer-requests` (protect-only).
- Prisma: `visitor` (`schema.prisma:1909-1945`) — `visitDate`, `responsibleMembers` (LongText JSON id array; this is "assignment"), `branch_id`, relations to `visit`/`follow_up`. `visit` (`:1947-1960`) — `date`, `eventId` → `event_mgt` (the "event attended"). `follow_up` (`:1962-1980`) — `date` (due), `status` default "pending", `assignedTo` Int (notification recipient), composite index `(assignedTo,date,status)`.
- Events: `event_mgt` (`:656-704`), reached from visitor only through `visit.eventId`.
- Cron infra: one file per job in `src/cron-jobs/`, registered via `require()` in `index.ts:26-45` under `RUN_BACKGROUND_JOBS` gate. Canonical example `followUpNotificationCron.ts` (due/overdue notifications already exist; env-driven).
- Settings module: `src/modules/settings/` — singleton-config pattern (one row id=1), e.g. `attendance_timing_settings` (`schema.prisma:264-278`), `report_config` (`:4054-4064`). No visitor-config model today.
- Notifications: `notificationService.createInAppNotification` / `createManyInAppNotifications` (`notificationService.ts:730,990`), `CreateNotificationInput` (`:79-112`). No "notify everyone with permission X" helper — must resolve recipients, then fan out.
- Permissions: domain `Visitors` (alias → `Members`), actions view/manage/admin (`authorization.ts:16-19`, guards `:1410-1475`). Manage = `can_manage_visitors_scoped`.

**Mobile**
- Single-file modules in `src/` (`screens.tsx`, `api.ts`, `ui-components.tsx`, `navigation.tsx`, `store.ts`, `utils.ts`). "More" menu + `canAccessMemberModule`/`DOMAIN_ALIASES` in `utils.ts`. Responses go through `normalize*` + coercion helpers (`asArray`, `asRecord`, `toText`, `toNumber`).

---

## Item 1 — Title + phone consistency (Frontend only)

**Decision:** member form is canonical. One title source + one phone component app-wide.

- Extract member `TITLE_OPTIONS` to a shared constants module (e.g. `src/components/subform/titleOptions.ts` or `src/utils/`). Point `NameInfo`, member form, and any other title list at it. Delete the divergent `titleOptions` in `NameInfo.tsx`.
- Adopt member `PhoneField` as the shared phone input. Replace `ContactInput`'s divergent picker usage in the visitor form (and app-wide) so default (`+233`/GH), ordering, and dial source match. Keep the runtime country-store source (already shared).
- Grep the app for other title / phone-code usages and align them.
- Verify: `npm run lint` + `npx tsc --noEmit`.

**Boundary:** visitor and member forms keep their own field *layout*; only the title-options source and phone-input component are unified.

## Item 2 — Visit date ↔ event, date-driven + searchable (Backend + Frontend)

**Backend (additive, deploy first):** extend `event/list-events-light` to accept `from` + `to` (ISO date range, filters `start_date`) and `q` (case-insensitive name search). Keep existing `month`/`year`/`includeEventId` working for back-compat (mobile may still call them). Update the frontend contract doc if one exists for this endpoint.

**Frontend (`EventSelectionFields`, `VisitorForm.tsx`):**
- Remove month/year selects.
- Visit date is primary: choosing a date queries events within that date's **week** (`from`/`to` = week bounds). Changing the date re-queries.
- Add a debounced type-to-search box (passes `q`) to find any event by name regardless of date.
- Keep `includeEventId` so an already-selected event stays visible even if outside the current window.
- Keep `SyncEventDate` (event → date autofill) AND add date → event-list filtering, so the two stay in sync both ways. If a user picks an event whose date differs from the typed visit date, event wins (autofills date), matching existing behavior.
- Verify: lint + tsc.

## Item 3 — Monthly follow-up config + auto-generation (Backend + Frontend)

**Model:** N = follow-ups **per assigned visitor per month**.

**Backend:**
- New singleton model `visitor_follow_up_settings` (`id Int @id @default(1)`, `follow_ups_per_month Int @default(2)`, `enabled Boolean @default(false)`, timestamps). Prisma migration.
- Settings module: `GET /visitor-follow-up-config`, `POST /upsert-visitor-follow-up-config` (service + controller + route), gated by the Settings permission (match existing settings routes).
- New cron `src/cron-jobs/visitorFollowUpGenerationCron.ts`, registered in `index.ts`, monthly (e.g. `0 1 1 * *`), re-entrancy guard + `RUN_BACKGROUND_JOBS` gate, following `followUpNotificationCron.ts` conventions. Skips entirely when `enabled=false`. Per month, cursor-paginated over visitors:
  - Visitor **with** `responsibleMembers` → create N `follow_up` rows (`status:"pending"`, `date` spread across the month), dedupe key `follow-up-gen:<visitorId>:<yyyy-mm>:<n>` to stay idempotent on re-run. `assignedTo` = the visitor's responsible member; if the visitor has multiple responsible members, round-robin the N rows across them. Notify each assignee via `createManyInAppNotifications`.
  - Visitor **without** `responsibleMembers` → collect into an "unassigned" set; after the pass, notify all users with manage-visitors access that N unassigned visitors need assignment. Requires a new helper to resolve `Visitors:manage` → user ids (none exists; add to notificationService or an access util). One digest notification per manager, dedupe `follow-up-unassigned:<yyyy-mm>:<uid>`.
  - On failure → `notificationService.notifyAdminsJobFailed`.
- Due/overdue reminders already handled by `followUpNotificationCron` — no change.
- Verify: `npx tsc --noEmit`.

**Frontend:** new Settings section "Visitor Follow-ups": folder + default-exported page under `Settings/`, lazy entry in `lazyPages.ts`, child route with `sideTab:true` + `permissionNeeded` for settings in `appRoutes.tsx`. Form: number input (`follow_ups_per_month`) + enable toggle, saved via new API fn + `usePut`/`usePost` hook. Verify: lint + tsc.

## Item 4 — Mobile: member manages assigned visitors (Backend + Mobile)

**Backend (member-facing, `protect`-only, self-scoped — mirrors `/my-prayer-requests`):**
- `GET /my-visitors` — visitors whose `responsibleMembers` contains `req.user` id.
- `GET /my-follow-ups` — `follow_up` where `assignedTo = req.user` (optional `?visitorId=`).
- `PUT /my-follow-up` — update `status` / `notes`; service MUST enforce `assignedTo === req.user` (403 otherwise).
- `POST /my-visit-note` — add a note to an assigned visitor; enforce the visitor is in the caller's `responsibleMembers`.
- No admin/manage permission required; authorization is ownership-based in the service, not `checkPermission`. Additive routes only (installed mobile apps unaffected). Verify: `npx tsc --noEmit`.

**Mobile (`wwm-mobile`, branch `codex/<task>` off `dev`):**
- "More" menu entry **"My Visitors"** — shown when the signed-in user has assignments (cheap: show entry, screen shows empty state if none; or gate on a flag from `/my-visitors`). Decide at build time; default = always show with empty state.
- New screen in `screens.tsx`: list assigned visitors → visitor detail with their follow-ups → mark follow-up complete, add a note. Styling inline with existing member-portal screens.
- `api.ts`: add the four endpoints + `normalizeAssignedVisitor` / `normalizeFollowUp` using the coercion helpers. Wire navigation in `navigation.tsx`.
- Verify: `npx tsc --noEmit`.

---

## Cross-repo order & deploy notes

1. **Backend first** for items 2, 3, 4 (schema/migration, endpoints). Backend CI runs `prisma migrate deploy` on merge to `main` → hits dev DB immediately.
2. Record the shipped request/response shapes (copy from controllers) before touching clients.
3. Frontend: items 1, 2, 3.
4. Mobile: item 4 — additive endpoints only; must not require fields old apps don't send.
5. One branch/commit/PR per repo. Frontend PRs → `development` (cut fresh off `development`; no branch reuse). Backend → `main`. Mobile → `dev`.

## Out of scope / YAGNI

- No multi-org/tenant config (system is single-org singleton today).
- No new permission domain for members managing their own visitors — ownership check in service is enough.
- No redesign of the member/visitor form layouts beyond the title/phone unification.
- No change to existing due/overdue follow-up notifications.

## Open risks

- `responsibleMembers` is a JSON string, not an FK — querying "contains user id" needs a `LIKE`/JSON filter or in-app parse; cron and `/my-visitors` must handle this consistently (and large tables → cursor pagination).
- Resolving `Visitors:manage` → user ids has no existing helper; must be built and tested against the access-level tables.
- `list-events-light` is consumed by mobile too — keep month/year params working.
