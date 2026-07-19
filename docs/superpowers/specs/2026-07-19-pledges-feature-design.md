# Pledges Feature — Design Spec

**Date:** 2026-07-19
**Repos:** `WWW-Ministries-Project/Frontend` (this repo) + `WWW-Ministries-Project/Backend` (sibling at `../Backend`)
**Status:** Approved for planning

## Summary

Add a **Pledges** feature under the Finance section. A pledge is a fundraising campaign tied to a church event. During the event, one or more **amounts are called**; for each called amount a **group of people come forth** and pledge to give that amount. People are church members (linked by `user_id` for reuse across the app) or guests (name + phone). Pledges are **redeemed in bits** (partial payments) tracked per person. The feature spans both frontend (new route + pages under Finance) and backend (new Prisma models, module, endpoints, permission domain).

## Domain Model

- **Pledge** — the campaign. Tied to an event (required, main identifier; one event can have many pledges). Optional title, optional target amount, optional deadline. Has a **separate list of callers** (people who called for the pledge) and one or more **groups**.
- **PledgeGroup** — one called amount within a pledge (multiple amounts get called per event). Has `called_amount`, optional label, and its **pledgers**.
- **Pledger** — one person in a group. Member (`user_id`) or guest (`name` + `phone`). `pledged_amount` defaults to the group's `called_amount` but is an editable override (custom amounts possible but uncommon).
- **Caller** — separate list from pledgers (a caller is not automatically a pledger). Member or guest.
- **Redemption** — a partial payment against a pledger. Fields: amount, date, method, note/reference, optional image evidence. Many redemptions per pledger.

**Derived values (never stored):**
- Pledger remaining = `pledged_amount − Σ redemptions`
- Pledge total pledged = `Σ pledged_amount` across all pledgers
- Pledge total redeemed = `Σ redemptions` across all pledgers
- % covered = `total_redeemed / total_pledged`
- **Status** = `completed` when `total_redeemed ≥ total_pledged`, else `in_progress` — auto-derived, no manual close toggle.

## Storage Approach

**Normalized relational tables** (chosen over JSON blob or hybrid). Rationale: members must be linked by `user_id` for reuse elsewhere in the app (needs real FK joins), and the overview requires SQL-side aggregation (totals, % covered) and status filtering. A JSON payload blob (as `financials.payload` uses) would break member linkage and make filtering/aggregation slow.

---

## Backend (`../Backend`)

### Prisma models — `prisma/schema.prisma` (append after finance block ~line 1737)

Use **Int autoincrement PKs** (app-wide convention; note `financials` uses cuid but the rest of the app uses Int). `Decimal` for money. Add back-relations to `branch`, `event_mgt`, `user`.

- **`pledge`**: `id`, `branch_id Int?` + relation, `event_id Int` + relation → `event_mgt`, `title String?`, `target_amount Decimal?`, `deadline DateTime?`, `created_by_user_id Int?` + relation, `created_at`, `updated_at`. Children: `groups pledge_group[]`, `callers pledge_caller[]`.
- **`pledge_group`**: `id`, `pledge_id` + relation (`onDelete: Cascade`), `called_amount Decimal`, `label String?`. Child: `pledgers pledger[]`.
- **`pledge_caller`**: `id`, `pledge_id` + relation (Cascade), `user_id Int?` + relation (member) **or** `guest_name String?` + `guest_phone String?`.
- **`pledger`**: `id`, `group_id` + relation (Cascade), `user_id Int?` + relation (member, `@@index` for cross-app reuse) **or** `guest_name String?` + `guest_phone String?`, `pledged_amount Decimal`. Child: `redemptions pledge_redemption[]`.
- **`pledge_redemption`**: `id`, `pledger_id` + relation (Cascade), `amount Decimal`, `date DateTime`, `method String`, `note String?`, `image_url String?`, `recorded_by_user_id Int?`, `created_at`.

**Migration:** `prisma/migrations/<YYYYMMDDHHMMSS>_add_pledge_tables/migration.sql` (hand-authored, following existing manual pattern; e.g. `20260419183000_add_finance_approval_workflow`).

### Module — `src/modules/pledges/` (mirror `src/modules/finance/`)

- `common.ts` — hand-rolled validators (`validatePledgeMutationPayload`, `validateRedemptionPayload`), `PledgeHttpError` class, Prisma-error→HTTP mapping (`resolvePledgeError`), `sendPledgeError(res, error)`. Mirror `finance/common.ts`.
- Sub-folders, each `route.ts` + `controller.ts` + `service.ts` (Prisma access). Controllers wrap in try/catch → `sendPledgeError`, pass `(req as any).user?.id` as actor, return `res.status(2xx).json({ message, data })`.

### Route registration — `src/routes/appRouter.ts`
Import `pledgesRouter`, add `appRouter.use("/pledges", pledgesRouter)`.

### Endpoints (frontend calls `pledges/*`, no global prefix)

| Method | Path | Purpose | Permission |
|---|---|---|---|
| GET | `pledges/get-pledges` | List + computed total/redeemed/%/status; branch-scoped; `?status=completed\|in_progress` filter; `?branch_id=` | view |
| GET | `pledges/get-pledge?id=` | Full detail: groups, pledgers (w/ redeemed + remaining), callers, redemptions | view |
| POST | `pledges/create-pledge` | Create pledge + groups + pledgers + callers in one payload | manage |
| PUT | `pledges/update-pledge` | Edit pledge meta (title/target/deadline/event), groups, callers | manage |
| POST | `pledges/add-pledgers` | Add pledgers to existing group(s) | manage |
| PUT | `pledges/update-pledger` | Edit a pledger (amount, identity) | manage |
| DELETE | `pledges/delete-pledger?id=` | Remove a pledger | manage |
| POST | `pledges/create-redemption` | Record a partial payment; **multipart** `upload.single("file")` → `uploadLocalFileToS3` → `image_url` (optional, guard on `req.file`) | manage |
| DELETE | `pledges/delete-redemption?id=` | Remove a redemption entry | manage |
| DELETE | `pledges/delete-pledge?id=` | Delete a whole pledge | admin (delete) |

### Branch scoping
Accept `branch_id` in payload/query. Use `resolveBranchIdOrDefault(branch_id)` on create, `getBranchScopedWhere(branchId)` on list/count (from `src/modules/branches/branchService.ts`).

### Permissions — new `Pledges` domain (view / manage / admin)
- `src/modules/accessLevels/accessLevelController.ts`: add `"Pledges"` to `OPTIONAL_PERMISSION_KEYS` and `PERMISSION_KEY_NORMALIZER`.
- Alias entry in `src/middleWare/authorization.ts` (`PERMISSION_KEY_ALIASES`) and `src/utils/permissionResolver.ts`.
- Add `can_view_pledges` / `can_manage_pledges` / `can_delete_pledges` instances near `authorization.ts:1653` via `this.checkPermission("Pledges", "view"|"manage"|"admin", msg)`.
- Routes declare `[protect, permissions.can_view_pledges]` etc.

### Image upload
Redemption evidence: `upload.single("file")` (multer, `uploads/` dest) in route chain → service calls `uploadLocalFileToS3({ filePath, folder })` → store returned `link` as `image_url` → `fs.unlink`. Optional: guard on `req.file`.

---

## Frontend (this repo)

### Routes — `src/routes/appRoutes.tsx` (Finance children, ~lines 636–667)
Import new page components near lines 92–95. Add children:

| Path | Component | sideTab | permissionNeeded |
|---|---|---|---|
| `pledges` | `PledgesOverview` | true | `view_pledges` |
| `pledges/create` | `PledgeForm` (create) | — | `manage_pledges` |
| `pledges/:id` | `PledgeDetail` | — | `view_pledges` |
| `pledges/:id/edit` | `PledgeForm` (edit) | — | `manage_pledges` |

Sidebar submenu shows the `pledges` child automatically (has `sideTab: true` + permission gate in `SidebarSubmenu.tsx:78-84`).

### Permission — `src/utils/accessControl.ts`
Add `Pledges` to `CANONICAL_PERMISSION_DOMAINS` and `DOMAIN_ALIASES`. Add legacy map entries: `view_pledges → { domain: "Pledges", action: "view" }`, `manage_pledges → { domain: "Pledges", action: "manage" }` (and `delete_pledges`/admin if needed for delete).

### Pages — `src/pages/HomePage/pages/FinanceManagement/Pledges/`

- **`PledgesOverview.tsx`** — `PageOutline` + `HeaderControls` (title, "Create Pledge" → `/home/finance/pledges/create`). Status filter tabs: **Completed** / **In progress**. `TableComponent` columns: event, caller(s), % covered (progress bar), redeemed / total, remaining. `onRowClick` → `/home/finance/pledges/:id`. Data via `useFetch(fetchPledges, { ...buildBranchQuery(activeBranchId), status })` — re-fetches on branch change.
- **`PledgeForm.tsx`** — Formik + Yup, create + edit modes.
  - Fields: `BranchSelectField` (renders only when `activeBranchId === ALL_BRANCHES`, required then), event `FormikSelectField` (options from `useStore().eventsOptions`), optional `title`, `target_amount`, `deadline`.
  - **Callers**: repeatable list (Formik `FieldArray`). Each: toggle member (select from members-options) vs guest (name + phone).
  - **Groups**: repeatable. Each group: `called_amount`, optional `label`, and **Pledgers** (repeatable): toggle member (select → `user_id`) vs guest (name + phone); per-pledger `pledged_amount` pre-filled with the group's `called_amount`, editable.
  - Submit → `usePost`/`usePut` to `create-pledge`/`update-pledge`; `showNotification`; navigate to detail/overview.
- **`PledgeDetail.tsx`** — header cards: event, caller(s), total pledged, total redeemed, % covered, remaining. Per-pledger `TableComponent`: name, pledged, redeemed, remaining, "Record redemption" action per row. Buttons: **Edit pledge** (→ `/edit`), **Add members** (→ AddPledgersModal). `useFetch(fetchPledge, { id })`.
- **`RedemptionModal.tsx`** — `Modal` + Formik form: amount, date, method (select), note/reference, optional image. Image via `usePictureUpload`/`useFileUpload` (`pictureInstance`, multipart). Submit → `create-redemption`; refetch detail.
- **`AddPledgersModal.tsx`** — pick a target group, add pledgers (member or guest). Submit → `add-pledgers`; refetch detail.

### API + hooks
Add methods to `src/utils/api/apiFetch.ts`, `apiPost.ts`, `apiPut.ts`, `apiDelete.ts` under a `pledges/*` group. Organize domain functions under `src/utils/api/pledges/` with an `interface.ts` for types. Components use `useFetch` / `usePost` / `usePut` / `useDelete`; redemption image goes through `pictureInstance`. User feedback via `showNotification` / `showLoader`.

### Types — `src/utils/api/pledges/interface.ts`
`Pledge`, `PledgeGroup`, `Pledger`, `PledgeCaller`, `Redemption`, list-row DTO (with computed totals/%/status), create/update payload shapes.

---

## Defaults (confirmed)
- **Member picker** source: existing members-options from `useStore()` (same source as other forms).
- **Callers editable after create**: yes, via edit pledge.
- **Guest identity**: name + phone required for guests (members linked by `user_id`).

## Out of Scope (YAGNI)
- Manual status close/reopen (status is auto-derived).
- Pledge-level reporting/export (can follow later, mirroring finance export if requested).
- Notifications on redemption (not requested).

## Build Order (high level)
1. Backend: Prisma models + migration → permission domain → module (service/controller/route) → mount router.
2. Frontend: accessControl domain + routes → API methods + types → Overview → Form → Detail → Redemption/AddPledgers modals.
3. Verify end-to-end against dev backend.
