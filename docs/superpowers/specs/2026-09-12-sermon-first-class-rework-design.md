# Sermons: sermon as a first-class record

Date: 2026-09-12
Supersedes parts of `2026-07-26-sermons-design.md`.

## Problem

The shipped model treats `sermon_series` as the only real record. A `sermon` is a
bare YouTube URL plus a title scraped from oEmbed — it has no description, no
tags, no thumbnail, and cannot exist without a parent series. The Sermons page
reflects this: the primary action is "Add sermon series", and the listing is a
vertical list of series cards.

Staff need to publish individual messages. A message needs its own name and
description, belongs to a series only sometimes, and needs tags so members can
find related teaching. The page should present sermons as a browsable grid.

## Scope

Two repositories, two pull requests, in this order:

1. **Backend** (`WWW-Ministries-Project/Backend`, base `main`) — schema migration,
   service, controller, routes.
2. **Frontend** (`WWW-Ministries-Project/Frontend`, base `development`) — API
   layer, page, forms.

The Backend must be deployed before the Frontend ships, because `GET /sermons`
changes its response shape.

No mobile work: a search of `wwm-mobile` found no sermon code.

## Decisions

| Question | Decision |
|---|---|
| Does a sermon need a series? | No. `series_id` is nullable. A series is a grouping, not a container. |
| Where does DRAFT/PUBLISHED live? | On the sermon. The series keeps a status column but it is only a label for the series itself. |
| Tag scope | Global, not branch-scoped. One shared vocabulary across the church. |
| Tag dedupe | Enforced by a unique `slug` column in the database, not by application logic. |
| Thumbnail | Derived server-side from the YouTube video id. No upload, no S3. |
| Series management UI | A second tab on the Sermons page. |
| Inline "create new series" | A stacked modal over the sermon form. |

## Data model

### `sermon` (modified)

```prisma
model sermon {
  id            Int           @id @default(autoincrement())
  series_id     Int?
  title         String
  description   String?       @db.Text
  youtube_url   String
  video_id      String?
  thumbnail_url String?
  status        sermon_status @default(DRAFT)
  branch_id     Int?
  created_by    Int
  published_at  DateTime?
  position      Int           @default(0)
  created_at    DateTime      @default(now())
  updated_at    DateTime      @updatedAt

  series  sermon_series? @relation(fields: [series_id], references: [id], onDelete: SetNull)
  branch  branch?        @relation(fields: [branch_id], references: [id])
  creator user           @relation("sermon_creator", fields: [created_by], references: [id])
  tags    sermon_tag_assignment[]

  @@index([series_id])
  @@index([branch_id, status])
}
```

New columns: `description`, `thumbnail_url`, `status`, `branch_id`, `created_by`,
`published_at`, `updated_at`. `series_id` becomes nullable.

Prisma requires both sides of a relation, so the migration also adds
`sermons sermon[]` to `model branch` and `sermons sermon[] @relation("sermon_creator")`
to `model user`.

`onDelete` on the series relation changes from `Cascade` to `SetNull`. Deleting a
series must not destroy its sermons — the sermon is now the record worth keeping.

### `sermon_tag` and `sermon_tag_assignment` (new)

```prisma
model sermon_tag {
  id         Int      @id @default(autoincrement())
  name       String
  slug       String   @unique
  created_at DateTime @default(now())

  sermons sermon_tag_assignment[]
}

model sermon_tag_assignment {
  sermon_id Int
  tag_id    Int

  sermon sermon     @relation(fields: [sermon_id], references: [id], onDelete: Cascade)
  tag    sermon_tag @relation(fields: [tag_id], references: [id], onDelete: Cascade)

  @@id([sermon_id, tag_id])
  @@index([tag_id])
}
```

`name` holds the display form as first typed ("Faith"). `slug` is the dedupe key:
`name.trim().toLowerCase().replace(/\s+/g, " ")`.

Deduplication is a database constraint, not a code path. The service upserts on
`slug`, so two people creating "revival" at the same moment converge on one row
rather than racing.

### `sermon_series` (unchanged shape, relaxed rules)

The model keeps its columns. What changes is that `POST /sermons/series` no longer
requires a `sermons[]` array — a series can be created empty from the sermon form.

## Migration

One forward-only Prisma migration containing both the DDL and the backfill.

Backfill, applied before the new columns are made non-nullable where relevant:

- `created_by` ← parent series' `created_by`
- `branch_id` ← parent series' `branch_id`
- `status`, `published_at` ← parent series' values
- `thumbnail_url` ← `CONCAT('https://i.ytimg.com/vi/', video_id, '/hqdefault.jpg')`
  where `video_id IS NOT NULL`, otherwise `NULL`
- `description` ← `NULL`
- `title` is already populated by the existing oEmbed resolution, so it becomes
  the sermon Name with no transformation.

No column is dropped and no row is deleted, so the *migration* is safe against a
client running older code. It is not reversible once new writes land in the new
columns.

The *endpoint* is not backward compatible. `GET /sermons` stops returning series,
so the deployed Frontend breaks between the Backend merge and the Frontend merge.
Two ways to close that window, pick one at implementation time:

- Ship the Frontend PR immediately after the Backend deploy and accept a short
  break on the Sermons page. Acceptable if the dev environment is the only target.
- Serve the new listing at `GET /sermons/list` and leave `GET /sermons` returning
  series until the Frontend has shipped, then collapse the two. Costs one extra
  Backend PR but has no broken window.

The first option is the default. Confirm before merging the Backend PR.

**Deployment note:** Backend CI runs `prisma migrate deploy` on every push to
`main`, against the shared dev database. Merging the Backend PR applies this
migration immediately. Call this out in the PR description.

## API

All paths are relative to the existing `/sermons` router.

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/sermons` | `protect` | **Response shape changes.** Returns sermons. Query: `series_id`, `tag`, `status`, `branch_id`, `q`. |
| GET | `/sermons/:id` | `protect` | Single sermon with series and tags. |
| POST | `/sermons` | `can_manage_sermons` | Create one sermon. |
| PUT | `/sermons/:id` | `can_manage_sermons` | |
| DELETE | `/sermons/:id` | `can_delete_sermons` | |
| POST | `/sermons/:id/publish` | `can_manage_sermons` | Moved from the series. |
| POST | `/sermons/:id/unpublish` | `can_manage_sermons` | Moved from the series. |
| GET | `/sermons/series` | `protect` | List for the dropdown. |
| POST | `/sermons/series` | `can_manage_sermons` | `{ title, description? }`. No sermons required. |
| PUT | `/sermons/series/:id` | `can_manage_sermons` | |
| DELETE | `/sermons/series/:id` | `can_delete_sermons` | Sermons survive with `series_id = NULL`. |
| GET | `/sermons/tags` | `protect` | `?q=` prefix/substring match for suggestions. |

Route ordering matters: register `/series` and `/tags` **before** `/:id`, or Express
will match `series` as an id.

### Create payload

```jsonc
POST /sermons
{
  "title": "Walking In Faith",
  "description": "Part one of the Faith series",
  "youtube_url": "https://youtu.be/abc123",
  "series_id": 4,                 // nullable
  "tags": ["Faith", "prayer"]     // names, not ids
}
```

The client never sends `video_id` or `thumbnail_url`. The service resolves both
from `youtube_url` using the existing `extractYouTubeVideoId` and `resolveYoutube`
helpers, then sets
`thumbnail_url = https://i.ytimg.com/vi/<video_id>/hqdefault.jpg`.

`thumbnail_url` is a stored column rather than a computed field so a non-YouTube
source or a manual override can be supported later without another migration.

### Response

```jsonc
{
  "id": 12,
  "title": "Walking In Faith",
  "description": "Part one of the Faith series",
  "youtube_url": "https://youtu.be/abc123",
  "video_id": "abc123",
  "thumbnail_url": "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
  "status": "PUBLISHED",
  "published_at": "2026-09-12T10:00:00.000Z",
  "series": { "id": 4, "title": "Faith" },
  "tags": [{ "id": 1, "name": "Faith", "slug": "faith" }]
}
```

### Tag resolution

For each incoming name the service computes the slug, skips empties, dedupes
within the request, then:

```ts
prisma.sermon_tag.upsert({
  where: { slug },
  create: { name: trimmedName, slug },
  update: {},
});
```

On update, the join rows are reconciled: delete rows whose tag is no longer
present, create rows for newly added tags.

## Frontend

### Page — `src/pages/HomePage/pages/ChurchCommunication/SermonManager.tsx`

Two tabs.

**Sermons (default)**
- `HeaderControls` with `btnName="Add sermon"`.
- Filter row: series select, tag select, status select.
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`.
- `EmptyState` when the filtered list is empty.

**Series**
- The existing `SermonSeriesCard` list, for renaming and deleting series.
- The per-series publish toggle is removed; status is now per sermon.

### New components

`Components/SermonCard.tsx`
- 16:9 thumbnail with a play overlay; falls back to a neutral placeholder when
  `thumbnail_url` is null.
- Title, clamped to two lines.
- Series name as a `Badge` when present.
- Tag chips, overflow collapsed to "+N".
- `StatusPill` for DRAFT/PUBLISHED.
- Kebab menu: Edit, Publish/Unpublish, Delete. Delete goes through
  `showDeleteDialog`.

`Components/SermonForm.tsx` (rewrite)
- Formik + Yup. Fields in order: Name (required), Description (textarea),
  YouTube link (required, existing `YOUTUBE_URL_REGEX`), thumbnail preview,
  Series, Tags.
- The thumbnail preview renders client-side from the parsed video id as soon as
  the URL is valid, so the user sees what will be saved before submitting.
- Series field: single select with a `footerAction` of "+ Create new series".
- Buttons: Cancel, Save as draft, Save & publish.

`Components/SeriesForm.tsx`
- Title and Description only. Used both by the Series tab and by the stacked
  modal.

`Components/TagSelect.tsx`
- Wraps `CreatableSelect` from `react-select/creatable`, already a dependency.
- Options loaded once per form open from `GET /sermons/tags`.
- Before offering "Create ...", the input is normalized with the same slug rule
  and compared against the loaded options. A match selects the existing tag
  instead of offering to create a duplicate.
- Emits an array of names.

### Inline series creation

The sermon form holds `seriesOptions` in state and renders a second `Modal` over
itself. On save:

1. `POST /sermons/series` with `{ title, description }`.
2. Append the returned series to `seriesOptions`.
3. `setFieldValue("series_id", newSeries.id)`.
4. Close the inner modal.

The sermon form is never unmounted, so anything already typed survives.

### API layer

- `src/utils/api/sermons/interfaces.ts` — add `Sermon` fields, `SermonTag`,
  `CreateSermonDto`, `UpdateSermonDto`, `CreateSermonSeriesDto` without the
  required `sermons[]`.
- `apiFetch.ts` — `fetchSermons`, `fetchOneSermon`, `fetchSermonSeries`,
  `fetchSermonTags`.
- `apiPost.ts` — `createSermon`, `createSermonSeries`, `publishSermon`,
  `unpublishSermon`.
- `apiPut.ts` — `updateSermon`, `updateSermonSeries`.
- `apiDelete.ts` — `deleteSermon`, `deleteSermonSeries`.

Branch scoping follows the repo convention: pass `buildBranchQuery(activeBranchId)`
into the `useFetch` calls so the list re-fetches when the active branch changes.

### Other consumers

None. `src/pages/HomePage/pages/DashBoard/Components/RecentSermons.tsx` renders a
hardcoded "No sermons posted yet" empty state and never calls the API, so the
response shape change does not reach it. Wiring it to real data is a separate
piece of work and is out of scope here.

## Out of scope

- Reordering sermons within a series
- View-count or engagement analytics
- Non-YouTube video sources
- A tag management screen in Settings
- Mobile app changes

## Verification

- Backend: `npx tsc --noEmit` in `/Users/akwaah/Documents/GitHub/Backend`
- Frontend: `npm run lint` and `npx tsc --noEmit`

Neither repository has a test runner configured.
