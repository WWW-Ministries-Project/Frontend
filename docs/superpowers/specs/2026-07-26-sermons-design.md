# Sermons — Design Spec & Backend Contract

**Date:** 2026-07-26
**Feature:** Sermons management under Communication nav (Frontend) + `/sermons` API (Backend).
**Branches:** `feat/sermons` in both Frontend (off `development`) and Backend (off `main`).

## Summary

A "Sermon Series" is a titled, described group of one or more sermons. Each sermon is a
YouTube link whose video title is captured server-side from the URL. A series has a
DRAFT/PUBLISHED status (publish unit = series). Admins manage series from a new **Sermons**
child page under **Communication**: list, add, edit, publish/unpublish, delete.

Mirrors the existing **Announcements** feature on both repos.

## Decisions

- Publish unit: **series-level** (`DRAFT` / `PUBLISHED`).
- List layout: **cards** (one card per series).
- Video title: **captured backend-side** via YouTube oEmbed on save. User never types the title.
- Permission domain: **new `Sermons` domain** (view/manage/admin) on both FE + BE.
- Scope: **branch-scoped**, like Announcements.
- Publish flow: **two-step** — save (create/update), then `POST /:id/publish` — matching Announcements.

## Out of scope (YAGNI)

Member-facing sermon browsing page, publish notifications, thumbnails/duration metadata,
playlists, list search/pagination.

---

## Data model (Prisma / MySQL)

```prisma
enum sermon_status { DRAFT PUBLISHED }

model sermon_series {
  id           Int           @id @default(autoincrement())
  title        String
  description  String?       @db.Text
  status       sermon_status @default(DRAFT)
  branch_id    Int?
  created_by   Int
  published_at DateTime?
  created_at   DateTime      @default(now())
  updated_at   DateTime      @updatedAt

  sermons sermon[]
  branch  branch? @relation(fields: [branch_id], references: [id])
  creator user    @relation("sermon_series_creator", fields: [created_by], references: [id])

  @@index([branch_id])
  @@index([created_by])
}

model sermon {
  id          Int           @id @default(autoincrement())
  series_id   Int
  youtube_url String
  title       String        // captured server-side from oEmbed
  video_id    String?       // parsed from URL
  position    Int           @default(0)
  created_at  DateTime      @default(now())

  series sermon_series @relation(fields: [series_id], references: [id], onDelete: Cascade)

  @@index([series_id])
}
```

Back-relations added on `user` (`sermon_series sermon_series[] @relation("sermon_series_creator")`)
and `branch` (`sermon_series sermon_series[]`).

A series always has ≥1 sermon. Deleting a series cascade-deletes its sermons.

---

## Backend contract (`/sermons`)

New module `src/modules/sermons/` — `sermonRoute.ts`, `sermonController.ts`, `sermonService.ts`
(mirror `src/modules/announcements/`). Mounted `appRouter.use("/sermons", sermonRouter)` in
`src/routes/appRouter.ts`.

Permissions in `src/middleWare/authorization.ts`: add `Sermons: ["Sermons"]` to
`PERMISSION_KEY_ALIASES`, add guards `can_view_sermons` (view), `can_manage_sermons` (manage),
`can_delete_sermons` (admin).

### Endpoints

| Verb + path              | Guard                  | Purpose |
|--------------------------|------------------------|---------|
| `GET /sermons`           | `can_view_sermons`     | List series (branch-scoped via `branch_id` query), each with its `sermons[]` |
| `GET /sermons/:id`       | `can_view_sermons`     | One series with `sermons[]` |
| `POST /sermons`          | `can_manage_sermons`   | Create series + sermons (resolves titles) |
| `PUT /sermons/:id`       | `can_manage_sermons`   | Update title/description + add/remove/reorder sermons |
| `POST /sermons/:id/publish`   | `can_manage_sermons` | `status=PUBLISHED`, set `published_at` |
| `POST /sermons/:id/unpublish` | `can_manage_sermons` | `status=DRAFT`, clear `published_at` |
| `DELETE /sermons/:id`    | `can_delete_sermons`   | Delete series (cascade) |

All responses use the repo envelope `{ message, data }`.

### DTOs

```ts
// create
{
  title: string;              // required, non-empty
  description?: string | null;
  sermons: { youtube_url: string }[];   // required, length >= 1
}

// update (fields optional = leave unchanged; sermons present = full replace of the set)
{
  title?: string;
  description?: string | null;
  sermons?: { id?: number; youtube_url: string }[];  // items with id kept (title reused if url unchanged), without id added, missing ids removed
}
```

### Series entity (response shape)

```ts
{
  id: number;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  branch_id: number | null;
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sermons: {
    id: number;
    youtube_url: string;
    title: string;
    video_id: string | null;
    position: number;
  }[];
}
```

### YouTube title resolution — `sermonService`

Helper `resolveYoutube(url): Promise<{ video_id: string; title: string }>`:

1. Parse video id from `url` (handle `youtu.be/ID`, `youtube.com/watch?v=ID`, `/embed/ID`,
   `/shorts/ID`, `/live/ID`). Port `extractYouTubeVideoId` from the frontend
   `MinistrySchool/Components/LearningUnit.tsx`.
2. If no id parses → throw `httpError("Invalid YouTube URL", 400)`.
3. Fetch `https://www.youtube.com/oembed?url=<encoded url>&format=json`; use returned `title`.
4. On oEmbed failure (network/404) → fallback `title = video_id` (do not hard-fail the save; the
   URL parsed, so it is a plausible link). Log the failure.

Resolution runs for each sermon on create. On update, only newly-added URLs (or changed URLs)
are re-resolved; unchanged URLs keep their stored `title`/`video_id`.

Validation (controller-level, announcements style): `title` required, `sermons` a non-empty array,
each element has a non-empty `youtube_url`.

### Migration

`prisma/migrations/<timestamp>_add_sermons/migration.sql` creating `sermon_series` + `sermon`
tables, the `sermon_status` enum, indexes, and FKs (`branch_id` SET NULL, `created_by` RESTRICT,
`series_id` CASCADE). Author with `npx prisma migrate dev --name add_sermons` (or hand-write SQL
matching the repo convention if the DB is unavailable) and run `npx prisma generate`.

---

## Frontend

### API layer

- `src/utils/api/sermons/interfaces.ts` — `SermonStatus`, `Sermon`, `SermonSeries`,
  `CreateSermonSeriesDto`, `UpdateSermonSeriesDto` (shapes above).
- Methods on the four shared api classes (mirror announcements):
  - `apiFetch.ts`: `fetchSermonSeries(query?)` → `sermons`; `fetchOneSermonSeries(id)` → `sermons/:id`.
  - `apiPost.ts`: `createSermonSeries(dto)` → `POST sermons`; `publishSermonSeries(id)` →
    `POST sermons/:id/publish`; `unpublishSermonSeries(id)` → `POST sermons/:id/unpublish`.
  - `apiPut.ts`: `updateSermonSeries(id, dto)` → `PUT sermons/:id`.
  - `apiDelete.ts`: `deleteSermonSeries(id)` → `DELETE sermons/:id`.

### Route / nav / permissions

- `src/routes/appRoutes.tsx`: import `SermonManager`; add child route under Communication
  `children` after Announcement:
  ```tsx
  { path: "sermons", name: "Sermons", element: <SermonManager />, isPrivate: true,
    permissionNeeded: "view_sermons", sideTab: true },
  ```
- `src/utils/accessControl.ts`: add `"Sermons"` to `CANONICAL_PERMISSION_DOMAINS`; add domain
  metadata object (`label: "Sermons"`, `group: "Engagement"`, `required: false`); add key map
  entries `view_sermons`/`manage_sermons` → `{ domain: "Sermons", action }`.

### Pages (`src/pages/HomePage/pages/ChurchCommunication/`)

- **`SermonManager.tsx`** — mirror `AnnouncementManager.tsx`. `useFetch(api.fetch.fetchSermonSeries)`,
  local copy of `data.data`, `HeaderControls` with `btnName="Add sermon series"` opening the modal
  in create mode, grid of `SermonSeriesCard`, `EmptyState` when empty, `useDelete` +
  `showDeleteDialog` for delete, `usePost` for publish/unpublish (refetch + `showNotification` on
  success), `<Modal>` wrapping `SermonForm`.
- **`Components/SermonSeriesCard.tsx`** — title, description, status badge (DRAFT/PUBLISHED),
  list of the series' video titles as external links, actions: **Edit**, **Publish** or
  **Unpublish** (toggle by status), **Delete**.
- **`Components/SermonForm.tsx`** — Formik + Yup, `enableReinitialize`. Fields:
  - `title` (`FormikInputDiv`, required),
  - `description` (`FormikInputDiv`/textarea, optional),
  - `sermons` — a **FieldArray** (mirror `FinanceManagement/Pledges/components/PledgerFieldArray.tsx`):
    each row = one YouTube URL input + Remove button; "+ Add link" pushes a blank row; ≥1 enforced
    by Yup. In edit mode, render each existing sermon's captured `title` read-only beside its URL
    input. User never types the title.
  - Footer: **Save as draft** / **Save & publish** split (mirror `AnnouncementForm` `publishRef`
    pattern). "Save & publish" = create/update then call publish endpoint. Button labels adapt when
    editing an already-PUBLISHED series.
  - On success: `onSaved()` (refetch) + `onClose()`.

### Data flow

Form → `{ title, description, sermons: [{ youtube_url }] }` → backend resolves titles → persists →
returns series with titles → list refetches. Publish is the two-step follow-up call.

---

## Files touched

**Backend:**
- `prisma/schema.prisma` (+ migration folder)
- `src/modules/sermons/{sermonRoute,sermonController,sermonService}.ts` (new)
- `src/routes/appRouter.ts`
- `src/middleWare/authorization.ts`

**Frontend:**
- `src/utils/api/sermons/interfaces.ts` (new)
- `src/utils/api/{apiFetch,apiPost,apiPut,apiDelete}.ts`
- `src/routes/appRoutes.tsx`
- `src/utils/accessControl.ts`
- `src/pages/HomePage/pages/ChurchCommunication/SermonManager.tsx` (new)
- `src/pages/HomePage/pages/ChurchCommunication/Components/{SermonSeriesCard,SermonForm}.tsx` (new)
