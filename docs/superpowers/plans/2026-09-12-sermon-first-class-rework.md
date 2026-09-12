# Sermon-as-a-Record Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a sermon a standalone record with its own name, description, thumbnail, optional series and deduplicated tags, and present sermons as a grid.

**Architecture:** The Backend Prisma model `sermon` gains the columns it was missing and its `series_id` becomes nullable; two new tables hold a globally unique tag vocabulary. A new set of `/sermons` endpoints operates on sermons rather than series, with `/sermons/series` and `/sermons/tags` as supporting lists. The Frontend Sermons page becomes two tabs — a sermon grid and the existing series list — and the sermon form creates a series inline through a stacked modal.

**Tech Stack:** Backend — Express, Prisma, MySQL, TypeScript. Frontend — Vite, React, TypeScript, Tailwind, Formik + Yup, `react-select/creatable`, Zustand.

**Spec:** `docs/superpowers/specs/2026-09-12-sermon-first-class-rework-design.md`

---

## Before you start

**Neither repository has a test runner.** `Frontend/CLAUDE.md` says explicitly: "No test runner is configured. Do not add test scripts unless asked." Do not add Jest, Vitest, or `npm test` to either repo. Verification in this plan is `tsc --noEmit`, `npm run lint`, and named manual checks. Every "verify" step below states the exact command and the exact expected output.

**Two repositories, two branches, two pull requests. Never stage files from both in one commit.** Always pass `-C <repo path>` to git rather than `cd`-ing, so the target repo is explicit.

| Repo | Path | Branch to cut | PR base |
|---|---|---|---|
| Backend | `/Users/akwaah/Documents/GitHub/Backend` | `feat/sermon-first-class` off `main` | `main` |
| Frontend | `/Users/akwaah/Documents/GitHub/Frontend` | `feat/sermon-first-class-rework` (already exists, holds the spec) | `development` |

**⚠️ Deployment decision, unresolved — resolve before Task 7.** Backend CI runs `prisma migrate deploy` on every push to `main`, against the shared dev database. Merging the Backend PR applies the migration immediately and changes the shape of `GET /sermons`, which breaks the currently deployed Frontend until the Frontend PR ships. The spec records two options; the default is to accept a short break and merge the Frontend PR right after. **Ask the user to confirm before merging the Backend PR.** Do not merge on your own judgement.

---

## File structure

### Backend

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | `sermon` columns and nullable `series_id`; new `sermon_tag` and `sermon_tag_assignment`; back-relations on `branch` and `user` |
| `prisma/migrations/20260912160000_sermon_first_class/migration.sql` | Create | Hand-written DDL plus backfill |
| `src/modules/sermons/sermonTagService.ts` | Create | Slug normalisation, tag upsert, tag listing. Isolated so the dedupe rule lives in exactly one place |
| `src/modules/sermons/sermonService.ts` | Modify | Sermon CRUD and publish; series create no longer requires sermons |
| `src/modules/sermons/sermonController.ts` | Modify | Request parsing and status codes for the new endpoints |
| `src/modules/sermons/sermonRoute.ts` | Modify | Route table and permission guards, with `/series` and `/tags` registered before `/:id` |

### Frontend

| File | Action | Responsibility |
|---|---|---|
| `src/utils/api/sermons/interfaces.ts` | Modify | Types for sermon, tag, series and the DTOs |
| `src/utils/api/apiFetch.ts` | Modify | `fetchSermons`, `fetchOneSermon`, `fetchSermonSeries`, `fetchSermonTags` |
| `src/utils/api/apiPost.ts` | Modify | `createSermon`, `createSermonSeries`, `publishSermon`, `unpublishSermon` |
| `src/utils/api/apiPut.ts` | Modify | `updateSermon`, `updateSermonSeries` |
| `src/utils/api/apiDelete.ts` | Modify | `deleteSermon`, `deleteSermonSeries` |
| `.../ChurchCommunication/utils/youtube.ts` | Create | Client-side video id + thumbnail derivation for the live preview |
| `.../ChurchCommunication/Components/TagSelect.tsx` | Create | Creatable tag input, client-side duplicate guard |
| `.../ChurchCommunication/Components/SeriesForm.tsx` | Create | Title + description form, used by both the Series tab and the stacked modal |
| `.../ChurchCommunication/Components/SermonForm.tsx` | Rewrite | The sermon form, owns the stacked series modal |
| `.../ChurchCommunication/Components/SermonCard.tsx` | Create | One grid tile |
| `.../ChurchCommunication/Components/SermonSeriesCard.tsx` | Modify | Drop the publish toggle |
| `.../ChurchCommunication/SermonManager.tsx` | Rewrite | Tabs, filters, grid, modal wiring |

`.../ChurchCommunication/` is `src/pages/HomePage/pages/ChurchCommunication/`.

---

# Phase A — Backend

### Task A1: Prisma schema

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/prisma/schema.prisma`

- [ ] **Step 1: Cut the Backend branch**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend fetch origin
git -C /Users/akwaah/Documents/GitHub/Backend checkout -b feat/sermon-first-class origin/main
```

- [ ] **Step 2: Replace the `sermon` model**

Find `model sermon {` (around line 2615) and replace the whole model with:

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
  @@index([created_by])
}
```

`sermon_status` is an existing enum — do not redeclare it.

- [ ] **Step 3: Add the two tag models**

Immediately after the `sermon` model, add:

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

- [ ] **Step 4: Add the back-relations**

Prisma will not validate without both sides of every relation.

In `model user`, next to the existing line 103 `sermon_series_created ... @relation("sermon_series_creator")`, add:

```prisma
  sermons_created                              sermon[]                                @relation("sermon_creator")
```

In `model branch`, next to the existing line 153 `sermon_series sermon_series[]`, add:

```prisma
  sermons                  sermon[]
```

- [ ] **Step 5: Verify the schema is valid**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Backend prisma validate --schema /Users/akwaah/Documents/GitHub/Backend/prisma/schema.prisma
```

Expected: `The schema at prisma/schema.prisma is valid 🚀`

If it reports a missing opposite relation field, Step 4 was not applied to both models.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add prisma/schema.prisma
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(sermons): make sermon a first-class model with tags

A sermon had no fields of its own beyond a URL and a scraped title, and
could not exist outside a series. It now carries a description, thumbnail,
status and branch, its series is optional, and a globally unique tag
vocabulary hangs off it."
```

---

### Task A2: Migration

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/prisma/migrations/20260912160000_sermon_first_class/migration.sql`

Migrations in this repo are hand-written SQL with an explanatory comment header — see `20260912120000_add_event_type_category_and_schedule/migration.sql` for the house style. Follow it.

**Do not reorder the statements below.** Two of the orderings are load-bearing and were found the hard way: `series_id` must be widened while no foreign key references it, and each referencing column must be indexed before its key is added. Both are explained in the file's header comment.

- [ ] **Step 1: Create the migration file**

```bash
mkdir -p /Users/akwaah/Documents/GitHub/Backend/prisma/migrations/20260912160000_sermon_first_class
```

- [ ] **Step 2: Write the migration**

Write this exact content to `prisma/migrations/20260912160000_sermon_first_class/migration.sql`:

```sql
/*
  Promotes `sermon` from a child row of `sermon_series` to a record in its own
  right.

  New columns are added nullable, backfilled from the parent series, and only
  then tightened to NOT NULL, so the statement order below matters. `series_id`
  becomes nullable and its foreign key switches from ON DELETE CASCADE to
  ON DELETE SET NULL — deleting a series must no longer destroy its sermons.

  Two orderings here are load-bearing rather than stylistic. `series_id` is
  widened while no key references it, because InnoDB refuses a rebuilding ALTER
  on a live foreign key column. And every referencing column is indexed before
  its key is added, because MySQL otherwise auto-creates an index named after
  the constraint — an index in no Prisma schema, which a later migrate dev would
  try to drop and be refused (errno 1553).

  `thumbnail_url` is derived from the already-stored `video_id` rather than
  uploaded. It is a stored column, not a computed one, so a non-YouTube source
  or a manual override needs no further migration.

  `sermon_tag.slug` is the deduplication key: lowercased, trimmed, inner
  whitespace collapsed. The unique index makes duplicate tags impossible even
  under concurrent writes. `sermon_tag_assignment` is a plain join table with no
  timestamps of its own — a tag either applies to a sermon or it does not, and
  both sides cascade, so removing either end removes the link.

  Forward-only. No column is dropped and no row is deleted, so this is safe to
  apply ahead of the clients that use the new columns.
*/

-- AlterTable: add the new columns, nullable for now
ALTER TABLE `sermon`
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `thumbnail_url` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `branch_id` INTEGER NULL,
    ADD COLUMN `created_by` INTEGER NULL,
    ADD COLUMN `published_at` DATETIME(3) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NULL;

-- Backfill from the parent series before anything becomes NOT NULL
UPDATE `sermon` AS s
    JOIN `sermon_series` AS ss ON ss.`id` = s.`series_id`
SET s.`created_by`   = ss.`created_by`,
    s.`branch_id`    = ss.`branch_id`,
    s.`status`       = ss.`status`,
    s.`published_at` = ss.`published_at`,
    s.`updated_at`   = s.`created_at`,
    s.`thumbnail_url` = CASE
        WHEN s.`video_id` IS NOT NULL AND s.`video_id` <> ''
        THEN CONCAT('https://i.ytimg.com/vi/', s.`video_id`, '/hqdefault.jpg')
        ELSE NULL
    END;

-- Defensive only. The JOIN above reaches every row under the schema's own
-- constraints, since series_id is still NOT NULL and foreign-key enforced here.
-- This covers only rows some out-of-band write (an import run with
-- FOREIGN_KEY_CHECKS=0, say) could have orphaned.
UPDATE `sermon` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL;

-- Tighten the backfilled columns
ALTER TABLE `sermon`
    MODIFY `created_by` INTEGER NOT NULL,
    MODIFY `updated_at` DATETIME(3) NOT NULL;

-- Replace the cascading series foreign key with SET NULL. series_id is widened
-- to NULL while no foreign key references it: InnoDB refuses a rebuilding
-- ALTER on a column that is still the child side of a live key
-- (ER_FK_COLUMN_CANNOT_CHANGE, 1832). Re-adding the key revalidates every row,
-- which all pass because the old NOT NULL key already guaranteed a real parent.
ALTER TABLE `sermon` DROP FOREIGN KEY `sermon_series_id_fkey`;
ALTER TABLE `sermon` MODIFY `series_id` INTEGER NULL;
ALTER TABLE `sermon`
    ADD CONSTRAINT `sermon_series_id_fkey`
    FOREIGN KEY (`series_id`) REFERENCES `sermon_series`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes first: MySQL auto-creates an index named after the constraint if the
-- referencing column is unindexed when the foreign key is added, which would
-- drift from the Prisma schema. branch_id leads the composite, so the branch
-- foreign key is still covered; a standalone index on a two-value status enum
-- would earn little. `sermon_series_id_idx` already exists from 20260726130000.
CREATE INDEX `sermon_branch_id_status_idx` ON `sermon`(`branch_id`, `status`);
CREATE INDEX `sermon_created_by_idx` ON `sermon`(`created_by`);

-- New foreign keys
ALTER TABLE `sermon`
    ADD CONSTRAINT `sermon_branch_id_fkey`
    FOREIGN KEY (`branch_id`) REFERENCES `branch`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sermon`
    ADD CONSTRAINT `sermon_created_by_fkey`
    FOREIGN KEY (`created_by`) REFERENCES `user`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `sermon_tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sermon_tag_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sermon_tag_assignment` (
    `sermon_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,

    INDEX `sermon_tag_assignment_tag_id_idx`(`tag_id`),
    PRIMARY KEY (`sermon_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sermon_tag_assignment`
    ADD CONSTRAINT `sermon_tag_assignment_sermon_id_fkey`
    FOREIGN KEY (`sermon_id`) REFERENCES `sermon`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sermon_tag_assignment`
    ADD CONSTRAINT `sermon_tag_assignment_tag_id_fkey`
    FOREIGN KEY (`tag_id`) REFERENCES `sermon_tag`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Confirm the existing foreign key is actually named `sermon_series_id_fkey`**

The `DROP FOREIGN KEY` above fails the whole migration if the name is wrong.

```bash
grep -rn "sermon_series_id_fkey\|REFERENCES \`sermon_series\`" /Users/akwaah/Documents/GitHub/Backend/prisma/migrations/*/migration.sql
```

Expected: a line from the migration that originally created the `sermon` table, naming the constraint. If the name differs, correct both the `DROP FOREIGN KEY` and the `ADD CONSTRAINT` lines to match.

- [ ] **Step 4: Regenerate the Prisma client**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Backend prisma generate --schema /Users/akwaah/Documents/GitHub/Backend/prisma/schema.prisma
```

Expected: `Generated Prisma Client ... in <n>ms`. This is what makes `prisma.sermon_tag` exist for the next task.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add prisma/migrations/20260912160000_sermon_first_class/migration.sql
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(sermons): migrate sermon to a first-class row

Adds the new columns nullable, backfills them from the parent series, then
tightens them, so the migration is safe on existing data. The series foreign
key moves from CASCADE to SET NULL so deleting a series keeps its sermons."
```

---

### Task A3: Tag service

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/modules/sermons/sermonTagService.ts`

The slug rule lives here and nowhere else. Any other file that needs it imports `toTagSlug`.

- [ ] **Step 1: Write the file**

```ts
import { prisma } from "../../Models/context";

export type TagRow = { id: number; name: string; slug: string };

/**
 * The deduplication key. Trim, lowercase, collapse inner whitespace.
 * "Faith", " faith " and "FAITH  " all produce "faith", which the unique index
 * on sermon_tag.slug then collapses to a single row.
 */
export const toTagSlug = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Resolves tag names to rows, creating the ones that do not exist yet.
 * Uses upsert rather than findFirst-then-create so two concurrent requests
 * creating the same tag converge on one row instead of racing.
 */
export const resolveTagIds = async (names: unknown): Promise<number[]> => {
  if (!Array.isArray(names)) return [];

  const bySlug = new Map<string, string>();
  for (const raw of names) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const slug = toTagSlug(trimmed);
    // First spelling wins as the display name.
    if (!bySlug.has(slug)) bySlug.set(slug, trimmed);
  }

  const ids: number[] = [];
  for (const [slug, name] of bySlug) {
    const tag = await prisma.sermon_tag.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
      select: { id: true },
    });
    ids.push(tag.id);
  }

  return ids;
};

export const listTags = async (search?: unknown): Promise<TagRow[]> => {
  const term = typeof search === "string" ? search.trim() : "";

  return prisma.sermon_tag.findMany({
    where: term ? { slug: { contains: toTagSlug(term) } } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
    take: 200,
  });
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Backend tsc --noEmit
```

Expected: no output, exit code 0. If `prisma.sermon_tag` is reported as not existing, Task A2 Step 4 (`prisma generate`) was skipped.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/sermons/sermonTagService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(sermons): add tag resolution with a single slug rule

Keeping normalisation in one exported function stops the dedupe rule drifting
between the create path, the update path and the suggestions endpoint."
```

---

### Task A4: Sermon service

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/sermons/sermonService.ts`

Keep everything already in the file. `resolveYoutube`, `extractYouTubeVideoId`, `httpError` and the series functions are reused as-is.

- [ ] **Step 1: Add the import and the thumbnail helper**

At the top, after the existing `branchService` import, add:

```ts
import { resolveTagIds } from "./sermonTagService";
```

After the `resolveYoutube` function, add:

```ts
const thumbnailForVideoId = (videoId: string | null): string | null =>
  videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;

const sermonInclude = {
  series: { select: { id: true, title: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.sermonInclude;

// Flattens the join rows so clients receive tags: [{id, name, slug}] rather
// than tags: [{tag: {...}}].
const shapeSermon = <T extends { tags: { tag: TagShape }[] }>(sermon: T) => ({
  ...sermon,
  tags: sermon.tags.map((row) => row.tag),
});

type TagShape = { id: number; name: string; slug: string };
```

- [ ] **Step 2: Add the sermon input types**

Next to the existing `CreateSermonSeriesInput`, add:

```ts
export type CreateSermonInput = {
  title: string;
  description?: string | null;
  youtube_url: string;
  series_id?: number | null;
  tags?: string[];
  branch_id?: number | null;
  created_by: number;
};

export type UpdateSermonInput = {
  title?: string;
  description?: string | null;
  youtube_url?: string;
  series_id?: number | null;
  tags?: string[];
};
```

- [ ] **Step 3: Add the sermon functions**

Add before the final `export const sermonService = {` block:

```ts
const createSermon = async (input: CreateSermonInput) => {
  const title = input.title?.trim();
  if (!title) throw httpError("A sermon title is required", 400);

  const url = input.youtube_url?.trim();
  if (!url) throw httpError("A YouTube link is required", 400);

  const video = await resolveYoutube(url);
  const branchId = await resolveBranchIdOrDefault(input.branch_id);
  const tagIds = await resolveTagIds(input.tags);

  if (input.series_id) {
    const series = await prisma.sermon_series.findUnique({
      where: { id: input.series_id },
      select: { id: true },
    });
    if (!series) throw httpError("Sermon series not found", 404);
  }

  const sermon = await prisma.sermon.create({
    data: {
      title,
      description: input.description?.trim() || null,
      youtube_url: url,
      video_id: video.video_id,
      thumbnail_url: thumbnailForVideoId(video.video_id),
      series_id: input.series_id ?? null,
      branch_id: branchId,
      created_by: input.created_by,
      status: "DRAFT",
      tags: { create: tagIds.map((tag_id) => ({ tag_id })) },
    },
    include: sermonInclude,
  });

  return shapeSermon(sermon);
};

const listSermons = async (params: {
  branchId?: unknown;
  seriesId?: number | null;
  tag?: string | null;
  status?: "DRAFT" | "PUBLISHED";
  search?: string | null;
  skip?: number;
  take?: number;
}) => {
  const where: Prisma.sermonWhereInput = {
    ...(getBranchScopedWhere(params.branchId) ?? {}),
    ...(params.seriesId ? { series_id: params.seriesId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.tag ? { tags: { some: { tag: { slug: params.tag } } } } : {}),
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search } },
            { description: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.sermon.findMany({
      where,
      include: sermonInclude,
      orderBy: { created_at: "desc" },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
    }),
    prisma.sermon.count({ where }),
  ]);

  return { data: rows.map(shapeSermon), total };
};

const getSermon = async (id: number, publishedOnly = false) => {
  const sermon = await prisma.sermon.findUnique({
    where: { id },
    include: sermonInclude,
  });
  if (!sermon) return null;
  if (publishedOnly && sermon.status !== "PUBLISHED") return null;
  return shapeSermon(sermon);
};

const updateSermon = async (id: number, input: UpdateSermonInput) => {
  const existing = await prisma.sermon.findUnique({ where: { id } });
  if (!existing) throw httpError("Sermon not found", 404);

  const data: Prisma.sermonUpdateInput = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw httpError("A sermon title is required", 400);
    data.title = title;
  }

  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  // Only re-hit YouTube when the URL actually changed.
  if (input.youtube_url !== undefined) {
    const url = input.youtube_url.trim();
    if (!url) throw httpError("A YouTube link is required", 400);
    if (url !== existing.youtube_url) {
      const video = await resolveYoutube(url);
      data.youtube_url = url;
      data.video_id = video.video_id;
      data.thumbnail_url = thumbnailForVideoId(video.video_id);
    }
  }

  if (input.series_id !== undefined) {
    data.series = input.series_id
      ? { connect: { id: input.series_id } }
      : { disconnect: true };
  }

  if (input.tags !== undefined) {
    const tagIds = await resolveTagIds(input.tags);
    data.tags = {
      deleteMany: {},
      create: tagIds.map((tag_id) => ({ tag_id })),
    };
  }

  const sermon = await prisma.sermon.update({
    where: { id },
    data,
    include: sermonInclude,
  });

  return shapeSermon(sermon);
};

const deleteSermon = async (id: number) =>
  prisma.sermon.delete({ where: { id } });

const setSermonStatus = async (id: number, publish: boolean) => {
  const existing = await prisma.sermon.findUnique({ where: { id } });
  if (!existing) throw httpError("Sermon not found", 404);
  if (publish && existing.status === "PUBLISHED") {
    throw httpError("Sermon is already published", 409);
  }

  const sermon = await prisma.sermon.update({
    where: { id },
    data: publish
      ? { status: "PUBLISHED", published_at: new Date() }
      : { status: "DRAFT", published_at: null },
    include: sermonInclude,
  });

  return shapeSermon(sermon);
};
```

- [ ] **Step 4: Remove nested sermon writes from the series functions**

A series no longer contains sermons — a sermon references a series. Both series functions still write sermons as nested rows, and after Task A1 both fail to compile, because a nested `sermon` create now requires `created_by` which neither supplies:

```
sermonService.ts(136,18): error TS2322: Property 'creator' is missing in type
sermonService.ts(224,7):  error TS2322: Property 'creator' is missing in type
```

Do not patch these by threading `created_by` through. Delete the nested-sermon paths outright — they are dead once the DTOs carry only `title` and `description`, and one of them is actively destructive: `updateSermonSeries` replaces the sermon set with `deleteMany: {}` followed by recreate, which under the new model would destroy each sermon's id, tags, description and publish status.

Replace `CreateSermonSeriesInput` and `UpdateSermonSeriesInput` with:

```ts
export type CreateSermonSeriesInput = {
  title: string;
  description?: string | null;
  branch_id?: number | null;
  created_by: number;
};

export type UpdateSermonSeriesInput = {
  title?: string;
  description?: string | null;
};
```

In `createSermonSeries`, delete the `const sermons = validateSermons(input.sermons);` line and the `const rows = await resolveSermonRows(sermons);` line, and remove `sermons: { create: rows },` from the `data` object. A series is now created empty — the sermon form creates one inline, before any sermon exists.

In `updateSermonSeries`, delete the entire `let sermonsWrite ...` block (everything from the `// When sermons are supplied` comment down to the closing of the `if (input.sermons !== undefined) { ... }` block) and remove `...(sermonsWrite ? { sermons: sermonsWrite } : {}),` from the `data` object. Its `include: sermonSeriesInclude` may stay — reading a series with its sermons is still useful.

Then delete what is now unreachable: `resolveSermonRows`, `validateSermons`, and the `SermonInput` type. Keep `resolveYoutube` and `extractYouTubeVideoId` — `createSermon` uses both.

Verify nothing else referenced them:

```bash
grep -rn "resolveSermonRows\|validateSermons\|SermonInput" /Users/akwaah/Documents/GitHub/Backend/src
```

Expected after the edit: only `CreateSermonInput` and `UpdateSermonInput` match (they contain the substring `SermonInput`). Any other hit means something still depends on the deleted code — stop and report rather than deleting it.

- [ ] **Step 5: Export the new functions**

Replace the closing export block with:

```ts
export const sermonService = {
  createSermonSeries,
  listSermonSeries,
  getSermonSeries,
  updateSermonSeries,
  deleteSermonSeries,
  publishSermonSeries,
  unpublishSermonSeries,
  createSermon,
  listSermons,
  getSermon,
  updateSermon,
  deleteSermon,
  setSermonStatus,
};
```

- [ ] **Step 6: Verify it compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Backend tsc --noEmit
```

Expected: the two `creator` errors are GONE, replaced by exactly these two:

```
src/modules/sermons/sermonController.ts(51,9): error TS2353: 'sermons' does not exist in type 'CreateSermonSeriesInput'.
src/modules/sermons/sermonController.ts(130,9): error TS2353: 'sermons' does not exist in type 'UpdateSermonSeriesInput'.
```

That is the correct state to finish this task in. Removing `sermons` from the series DTOs in Step 4 is what turns those two call sites into excess-property errors, and Task A5 rewrites both. **Do not fix them by editing the controller here** — and do not restore `sermons` to the DTOs to silence them.

If either `creator` error survives, Step 4 is incomplete. `tsc` first goes fully clean at the end of Task A6.

- [ ] **Step 7: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/sermons/sermonService.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(sermons): add sermon CRUD, filtering and publishing

The thumbnail is derived from the resolved video id rather than uploaded, and
the update path only re-queries YouTube when the URL actually changed."
```

---

### Task A5: Controller

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/sermons/sermonController.ts`

Keep the existing helpers (`toPositiveInt`, `getActorUserId`, `getStatusCode`, `isNotFoundError`) and every existing series method. The existing `create`, `list`, `getOne`, `update`, `remove`, `publish`, `unpublish` methods are series methods — rename them so the new sermon methods can take the plain names.

- [ ] **Step 1: Rename the existing series methods**

Inside `export class sermonController`, rename in place:

| Old | New |
|---|---|
| `create` | `createSeries` |
| `list` | `listSeries` |
| `getOne` | `getOneSeries` |
| `update` | `updateSeries` |
| `remove` | `removeSeries` |
| `publish` | `publishSeries` |
| `unpublish` | `unpublishSeries` |

Also relax the validation in `createSeries` — a series no longer needs sermons. Replace:

```ts
      if (!body.title || !Array.isArray(body.sermons) || body.sermons.length === 0) {
        return res.status(400).json({
          message: "title and at least one sermon link are required",
          data: null,
        });
      }
```

with:

```ts
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return res.status(400).json({
          message: "title is required",
          data: null,
        });
      }
```

- [ ] **Step 2: Add the sermon methods**

Add these inside the same class:

```ts
  create = async (req: Request, res: Response) => {
    try {
      const actorUserId = getActorUserId(req);
      if (!actorUserId) {
        return res.status(401).json({
          message: "A valid authenticated user is required",
          data: null,
        });
      }

      const body = req.body ?? {};
      const sermon = await sermonService.createSermon({
        title: body.title,
        description: body.description ?? null,
        youtube_url: body.youtube_url,
        series_id: toPositiveInt(body.series_id),
        tags: Array.isArray(body.tags) ? body.tags : [],
        branch_id: body.branch_id ?? req.query?.branch_id ?? null,
        created_by: actorUserId,
      });

      return res.status(201).json({ message: "Sermon created", data: sermon });
    } catch (error) {
      const statusCode = getStatusCode(error) ?? 500;
      return res.status(statusCode).json({
        message: (error as Error).message || "Failed to create sermon",
        data: null,
      });
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const statusParam = String(req.query?.status ?? "").toUpperCase();
      const status =
        statusParam === "PUBLISHED" || statusParam === "DRAFT"
          ? (statusParam as "PUBLISHED" | "DRAFT")
          : undefined;

      const search = String(req.query?.q ?? "").trim();
      const tag = String(req.query?.tag ?? "").trim();

      const result = await sermonService.listSermons({
        branchId: req.query?.branch_id ?? null,
        seriesId: toPositiveInt(req.query?.series_id),
        tag: tag || null,
        status,
        search: search || null,
        skip: toPositiveInt(req.query?.skip) ?? 0,
        take: toPositiveInt(req.query?.take) ?? 50,
      });

      return res.status(200).json({ message: "Sermons", ...result });
    } catch (error) {
      return res.status(500).json({
        message: (error as Error).message || "Failed to list sermons",
        data: null,
      });
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const id = toPositiveInt(req.params?.id);
      if (!id) return res.status(400).json({ message: "Invalid id", data: null });

      const publishedOnly = String(req.query?.published_only ?? "") === "true";
      const sermon = await sermonService.getSermon(id, publishedOnly);
      if (!sermon) {
        return res.status(404).json({ message: "Sermon not found", data: null });
      }

      return res.status(200).json({ message: "Sermon", data: sermon });
    } catch (error) {
      return res.status(500).json({
        message: (error as Error).message || "Failed to fetch sermon",
        data: null,
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = toPositiveInt(req.params?.id);
      if (!id) return res.status(400).json({ message: "Invalid id", data: null });

      const body = req.body ?? {};
      const sermon = await sermonService.updateSermon(id, {
        title: body.title,
        description: body.description,
        youtube_url: body.youtube_url,
        // Explicit null clears the series; an absent key leaves it untouched.
        series_id:
          body.series_id === undefined
            ? undefined
            : toPositiveInt(body.series_id),
        tags: Array.isArray(body.tags) ? body.tags : undefined,
      });

      return res.status(200).json({ message: "Sermon updated", data: sermon });
    } catch (error) {
      const statusCode = getStatusCode(error) ?? 500;
      return res.status(statusCode).json({
        message: (error as Error).message || "Failed to update sermon",
        data: null,
      });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const id = toPositiveInt(req.params?.id);
      if (!id) return res.status(400).json({ message: "Invalid id", data: null });

      await sermonService.deleteSermon(id);
      return res.status(200).json({ message: "Sermon deleted", data: null });
    } catch (error) {
      if (isNotFoundError(error)) {
        return res.status(404).json({ message: "Sermon not found", data: null });
      }
      return res.status(500).json({
        message: (error as Error).message || "Failed to delete sermon",
        data: null,
      });
    }
  };

  publish = async (req: Request, res: Response) => {
    try {
      const id = toPositiveInt(req.params?.id);
      if (!id) return res.status(400).json({ message: "Invalid id", data: null });

      const sermon = await sermonService.setSermonStatus(id, true);
      return res.status(200).json({ message: "Sermon published", data: sermon });
    } catch (error) {
      const statusCode = getStatusCode(error) ?? 500;
      return res.status(statusCode).json({
        message: (error as Error).message || "Failed to publish sermon",
        data: null,
      });
    }
  };

  unpublish = async (req: Request, res: Response) => {
    try {
      const id = toPositiveInt(req.params?.id);
      if (!id) return res.status(400).json({ message: "Invalid id", data: null });

      const sermon = await sermonService.setSermonStatus(id, false);
      return res
        .status(200)
        .json({ message: "Sermon unpublished", data: sermon });
    } catch (error) {
      const statusCode = getStatusCode(error) ?? 500;
      return res.status(statusCode).json({
        message: (error as Error).message || "Failed to unpublish sermon",
        data: null,
      });
    }
  };

  listTags = async (req: Request, res: Response) => {
    try {
      const data = await listTags(req.query?.q);
      return res.status(200).json({ message: "Sermon tags", data });
    } catch (error) {
      return res.status(500).json({
        message: (error as Error).message || "Failed to list sermon tags",
        data: null,
      });
    }
  };
```

- [ ] **Step 3: Add the tag service import**

At the top of the file, next to the existing `sermonService` import:

```ts
import { listTags } from "./sermonTagService";
```

- [ ] **Step 4: Verify it compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Backend tsc --noEmit
```

Expected: no output. Errors naming `controller.create` or similar come from `sermonRoute.ts`, which still points at the old method names — that is Task A6.

If the only errors are in `sermonRoute.ts`, continue to Task A6 and re-run there.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/sermons/sermonController.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(sermons): add sermon and tag controller methods

The series handlers keep their behaviour under *Series names so the plain
names can belong to the sermon endpoints, which are now the primary resource."
```

---

### Task A6: Routes

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/sermons/sermonRoute.ts`

**Route order is load-bearing.** `/series` and `/tags` must be registered before `/:id`, or Express matches `GET /sermons/series` as `getOne` with `id = "series"`.

- [ ] **Step 1: Replace the route table**

Replace everything from the first `router.get` to just before `export default router;` with:

```ts
// Static paths first: /:id would otherwise swallow "series" and "tags".
router.get("/tags", [protect], controller.listTags);

router.get("/series", [protect], controller.listSeries);
router.get("/series/:id", [protect], controller.getOneSeries);
router.post(
  "/series",
  [protect, permissions.can_manage_sermons],
  controller.createSeries,
);
router.put(
  "/series/:id",
  [protect, permissions.can_manage_sermons],
  controller.updateSeries,
);
router.delete(
  "/series/:id",
  [protect, permissions.can_delete_sermons],
  controller.removeSeries,
);
router.post(
  "/series/:id/publish",
  [protect, permissions.can_manage_sermons],
  controller.publishSeries,
);
router.post(
  "/series/:id/unpublish",
  [protect, permissions.can_manage_sermons],
  controller.unpublishSeries,
);

// Sermons. Open to any authenticated member for reads; writes stay gated.
router.get("/", [protect], controller.list);
router.get("/:id", [protect], controller.getOne);

router.post("/", [protect, permissions.can_manage_sermons], controller.create);
router.put("/:id", [protect, permissions.can_manage_sermons], controller.update);
router.post(
  "/:id/publish",
  [protect, permissions.can_manage_sermons],
  controller.publish,
);
router.post(
  "/:id/unpublish",
  [protect, permissions.can_manage_sermons],
  controller.unpublish,
);
router.delete(
  "/:id",
  [protect, permissions.can_delete_sermons],
  controller.remove,
);
```

- [ ] **Step 2: Verify the whole Backend compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Backend tsc --noEmit
```

Expected: no output, exit code 0. This is the first point where the Backend is fully consistent.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/sermons/sermonRoute.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(sermons): route sermons as the primary resource

Series move under /sermons/series. The static /series and /tags paths are
registered ahead of /:id so Express does not match them as an id."
```

---

### Task A7: Verify against a real database, then open the PR

- [ ] **Step 1: Apply the migration locally**

Confirm `DATABASE_URL` in `/Users/akwaah/Documents/GitHub/Backend/.env` points where you expect **before running this** — it applies schema changes.

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Backend prisma migrate deploy --schema /Users/akwaah/Documents/GitHub/Backend/prisma/schema.prisma
```

Expected: `Applying migration '20260912160000_sermon_first_class'` then `All migrations have been successfully applied.`

If it fails on `DROP FOREIGN KEY`, the constraint name is wrong — go back to Task A2 Step 3.

- [ ] **Step 2: Start the server**

```bash
npm --prefix /Users/akwaah/Documents/GitHub/Backend run dev
```

- [ ] **Step 3: Exercise the endpoints**

Replace `<TOKEN>` with a JWT for a user holding `manage_sermons`, and `<PORT>` with the `PORT` from `.env`.

```bash
# Create a series
curl -s -X POST http://localhost:<PORT>/sermons/series \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"title":"Faith Foundations","description":"A three part series"}'

# Create a sermon in it, with tags in inconsistent spellings
curl -s -X POST http://localhost:<PORT>/sermons \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"title":"Walking In Faith","description":"Part one","youtube_url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","series_id":1,"tags":["Faith"," faith ","Prayer"]}'

# Suggestions
curl -s http://localhost:<PORT>/sermons/tags -H "Authorization: Bearer <TOKEN>"

# Listing
curl -s http://localhost:<PORT>/sermons -H "Authorization: Bearer <TOKEN>"
```

Expected, and each is a real check — do not skip one:
1. The series is created with no `sermons` array in the request.
2. The sermon response carries `video_id: "dQw4w9WgXcQ"` and `thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"`.
3. **`tags` has exactly two entries, not three** — `"Faith"` and `" faith "` collapsed to one row. This is the dedupe working.
4. `GET /sermons/tags` returns those two tags and does **not** 404 (proves the route ordering from Task A6).
5. `GET /sermons` returns sermons with a nested `series` object, not series with nested sermons.

- [ ] **Step 4: Check the series-delete behaviour**

```bash
curl -s -X DELETE http://localhost:<PORT>/sermons/series/1 -H "Authorization: Bearer <TOKEN>"
curl -s http://localhost:<PORT>/sermons -H "Authorization: Bearer <TOKEN>"
```

Expected: the sermon still exists, with `series: null`. If it vanished, the foreign key is still `ON DELETE CASCADE` — revisit Task A2.

- [ ] **Step 5: Push and open the PR**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend push -u origin feat/sermon-first-class
```

Open the PR against `main`. The description must state that merging applies a migration to the shared dev database on push, and that `GET /sermons` changes shape so the Frontend PR should follow immediately. End the description with:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 6: Stop. Ask before merging.**

Do not merge. Confirm the deployment-window choice from the "Before you start" section with the user first.

---

# Phase B — Frontend

Phase B assumes the Backend is deployed. Work on the existing `feat/sermon-first-class-rework` branch, which already holds the spec and this plan.

### Task B1: Types

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/utils/api/sermons/interfaces.ts`

- [ ] **Step 1: Replace the file**

```ts
export type SermonStatus = "DRAFT" | "PUBLISHED";

export interface SermonTag {
  id: number;
  name: string;
  slug: string;
}

export interface SermonSeriesRef {
  id: number;
  title: string;
}

export interface Sermon {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  video_id: string | null;
  thumbnail_url: string | null;
  status: SermonStatus;
  series_id: number | null;
  branch_id: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  series: SermonSeriesRef | null;
  tags: SermonTag[];
}

export interface SermonSeries {
  id: number;
  title: string;
  description: string | null;
  status: SermonStatus;
  branch_id: number | null;
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sermons: Sermon[];
}

export interface CreateSermonDto {
  title: string;
  description?: string | null;
  youtube_url: string;
  series_id?: number | null;
  tags?: string[];
}

export interface UpdateSermonDto {
  title?: string;
  description?: string | null;
  youtube_url?: string;
  series_id?: number | null;
  tags?: string[];
}

export interface CreateSermonSeriesDto {
  title: string;
  description?: string | null;
}

export interface UpdateSermonSeriesDto {
  title?: string;
  description?: string | null;
}
```

`SermonLinkDto` is deleted — nothing sends nested sermon links any more.

- [ ] **Step 2: Find what broke**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend tsc --noEmit 2>&1 | grep -i sermon
```

Expected: exactly two errors, both in `SermonForm.tsx`, for the `sermons:` key in the two series payload literals. That file is rewritten in Task B6. Note them; do not fix them here.

**`SermonManager.tsx`, `apiPost.ts` and `apiPut.ts` will NOT error, and that is the important thing to understand about this codebase.** `apiPost`/`apiPut` forward their payload straight into a generic `postToApi(path, payload)` / `updateData(path, payload)` without ever constructing a literal against the DTO, so the compiler has nothing to check. `SermonManager.tsx` only treats `SermonSeries` as an opaque type.

The consequence for every remaining Frontend task: **a wrong endpoint path, a wrong payload shape, or a wrong response-unwrapping depth will not produce a type error.** `tsc` passing means almost nothing at the API boundary here. Verify those by reading the code against the endpoint table in this plan, and by the manual walkthrough in Task B10 — not by the typecheck.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/utils/api/sermons/interfaces.ts
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): type the sermon as a standalone record"
```

---

### Task B2: API functions

**Files:**
- Modify: `src/utils/api/apiFetch.ts:796-808`
- Modify: `src/utils/api/apiPost.ts:618-635`
- Modify: `src/utils/api/apiPut.ts:554-560`
- Modify: `src/utils/api/apiDelete.ts:198-203`
- Modify: `src/utils/api/branchScope.ts:53`

Paths are relative to `/Users/akwaah/Documents/GitHub/Frontend`.

- [ ] **Step 1: `apiFetch.ts` — replace the `// Sermons` block**

```ts
  // Sermons
  fetchSermons = (query?: QueryType): Promise<ApiResponse<Sermon[]>> => {
    return this.fetchFromApi("sermons", query);
  };

  fetchOneSermon = (id: number): Promise<ApiResponse<Sermon>> => {
    return this.fetchFromApi(`sermons/${id}`);
  };

  fetchSermonSeries = (
    query?: QueryType
  ): Promise<ApiResponse<SermonSeries[]>> => {
    return this.fetchFromApi("sermons/series", query);
  };

  fetchOneSermonSeries = (id: number): Promise<ApiResponse<SermonSeries>> => {
    return this.fetchFromApi(`sermons/series/${id}`);
  };

  fetchSermonTags = (query?: QueryType): Promise<ApiResponse<SermonTag[]>> => {
    return this.fetchFromApi("sermons/tags", query);
  };
```

Update the import at the top of the file (currently line 10):

```ts
import type { Sermon, SermonSeries, SermonTag } from "./sermons/interfaces";
```

- [ ] **Step 2: `apiPost.ts` — replace the `// Sermons` block**

```ts
  // Sermons
  createSermon = (payload: CreateSermonDto): Promise<ApiResponse<Sermon>> => {
    return this.postToApi("sermons", payload);
  };

  publishSermon = (id: number): Promise<ApiResponse<Sermon>> => {
    return this.postToApi(`sermons/${id}/publish`, {});
  };

  unpublishSermon = (id: number): Promise<ApiResponse<Sermon>> => {
    return this.postToApi(`sermons/${id}/unpublish`, {});
  };

  createSermonSeries = (
    payload: CreateSermonSeriesDto
  ): Promise<ApiResponse<SermonSeries>> => {
    return this.postToApi("sermons/series", payload);
  };
```

Update the import (currently line 9):

```ts
import type {
  Sermon,
  SermonSeries,
  CreateSermonDto,
  CreateSermonSeriesDto,
} from "./sermons/interfaces";
```

`publishSermonSeries` and `unpublishSermonSeries` are removed — status is per sermon now.

- [ ] **Step 3: `apiPut.ts` — replace the sermon block**

```ts
  // Sermons
  updateSermon = (
    id: number,
    payload: UpdateSermonDto
  ): Promise<ApiResponse<Sermon>> => {
    return this.apiExecution.updateData(`sermons/${id}`, payload);
  };

  updateSermonSeries = (
    id: number,
    payload: UpdateSermonSeriesDto
  ): Promise<ApiResponse<SermonSeries>> => {
    return this.apiExecution.updateData(`sermons/series/${id}`, payload);
  };
```

Update the import (currently line 9):

```ts
import type {
  Sermon,
  SermonSeries,
  UpdateSermonDto,
  UpdateSermonSeriesDto,
} from "./sermons/interfaces";
```

- [ ] **Step 4: `apiDelete.ts` — replace the sermon block**

```ts
  // Sermons
  deleteSermon = (id: number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`sermons/${id}`, {});
  };

  deleteSermonSeries = (id: number): Promise<ApiResponse<void>> => {
    return this.deleteFromApi<void>(`sermons/series/${id}`, {});
  };
```

Match the existing `deleteFromApi` signature in that file — if the current `deleteSermonSeries` passes extra arguments, keep the same shape.

- [ ] **Step 5: Register the sermon paths as branch-scoped**

`src/utils/api/branchScope.ts` injects `branch_id` automatically, but only for paths listed in `BRANCH_SCOPED_ENDPOINTS`. `sermons` is not in that list, so without this step the grid shows every branch's sermons regardless of the active branch.

Note the matcher at `branchScope.ts:56`: an entry ending in `/` matches by prefix, anything else must match the path exactly. Both forms are needed — `"sermons"` for the list, `"sermons/"` for `sermons/series` and `sermons/tags`.

In `BRANCH_SCOPED_ENDPOINTS`, next to the existing `"promotions",` entry, add:

```ts
  "sermons",
  "sermons/",
```

- [ ] **Step 6: Verify the API layer compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend tsc --noEmit 2>&1 | grep "utils/api"
```

Expected: no output. Errors in `SermonForm.tsx` and `SermonManager.tsx` remain and are expected.

- [ ] **Step 7: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/utils/api
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): point the API layer at the sermon endpoints

Series move to /sermons/series, and publish/unpublish now target a sermon."
```

---

### Task B3: YouTube helper

**Files:**
- Create: `src/pages/HomePage/pages/ChurchCommunication/utils/youtube.ts`

The form shows the thumbnail before saving, so the video id has to be derivable client-side. This mirrors the Backend's `extractYouTubeVideoId` — keep the two in step if either changes.

- [ ] **Step 1: Write the file**

```ts
/**
 * Client-side mirror of the Backend's extractYouTubeVideoId, used only to
 * preview the thumbnail before saving. The stored thumbnail_url always comes
 * from the Backend.
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    return parsed.pathname.split("/").filter(Boolean)[0] || null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v");

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (
      segments.length >= 2 &&
      ["embed", "shorts", "live", "v"].includes(segments[0])
    ) {
      return segments[1];
    }
  }

  return null;
};

export const youtubeThumbnail = (videoId: string | null): string | null =>
  videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/ChurchCommunication/utils/youtube.ts
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): derive the thumbnail preview client-side"
```

---

### Task B4: Tag input

**Files:**
- Create: `src/pages/HomePage/pages/ChurchCommunication/Components/TagSelect.tsx`

`react-select` is already a dependency (`^5.10.1`) and `react-select/creatable` is present in `node_modules`. Do not install anything.

- [ ] **Step 1: Write the component**

```tsx
import CreatableSelect from "react-select/creatable";
import { useMemo } from "react";
import type { SermonTag } from "@/utils/api/sermons/interfaces";

/** Must match toTagSlug in the Backend's sermonTagService.ts. */
const toSlug = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

interface TagOption {
  label: string;
  value: string;
}

interface TagSelectProps {
  label?: string;
  suggestions: SermonTag[];
  value: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
}

export const TagSelect = ({
  label = "Tags",
  suggestions,
  value,
  onChange,
  disabled,
}: TagSelectProps) => {
  const options = useMemo<TagOption[]>(
    () => suggestions.map((tag) => ({ label: tag.name, value: tag.name })),
    [suggestions]
  );

  const selected = useMemo<TagOption[]>(
    () => value.map((name) => ({ label: name, value: name })),
    [value]
  );

  const knownSlugs = useMemo(
    () => new Set(suggestions.map((tag) => tag.slug)),
    [suggestions]
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="block text-sm font-medium" htmlFor="sermon-tags">
        {label}
      </label>

      <CreatableSelect
        inputId="sermon-tags"
        isMulti
        isDisabled={disabled}
        options={options}
        value={selected}
        placeholder="Type to search or create a tag"
        onChange={(next) =>
          onChange((next ?? []).map((option) => option.value.trim()))
        }
        // Suppress "Create ..." when the typed text already resolves to an
        // existing tag or to one already selected. The Backend dedupes anyway,
        // but offering the option invites the user to think they are distinct.
        isValidNewOption={(input) => {
          const slug = toSlug(input);
          if (!slug) return false;
          if (knownSlugs.has(slug)) return false;
          return !value.some((name) => toSlug(name) === slug);
        }}
        formatCreateLabel={(input) => `Create "${input.trim()}"`}
        classNamePrefix="tag-select"
        styles={{
          control: (base) => ({ ...base, borderRadius: "0.5rem" }),
          menu: (base) => ({ ...base, zIndex: 200 }),
        }}
      />

      <p className="text-xs text-gray-400">
        Existing tags are suggested as you type. Tags are shared across the
        church, so reuse one rather than creating a near-duplicate.
      </p>
    </div>
  );
};

export default TagSelect;
```

The `menu` z-index matters: the select renders inside a Radix modal, and the default stacking puts the dropdown behind the dialog content.

- [ ] **Step 2: Verify it compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend tsc --noEmit 2>&1 | grep TagSelect
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/ChurchCommunication/Components/TagSelect.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): add a creatable tag input with a duplicate guard

The Backend enforces uniqueness, but suppressing the Create option for a name
that already resolves to an existing tag stops the user believing two spellings
are two different tags."
```

---

### Task B5: Series form

**Files:**
- Create: `src/pages/HomePage/pages/ChurchCommunication/Components/SeriesForm.tsx`

Used in two places: the Series tab, and the stacked modal inside the sermon form. `compact` controls whether it renders the full-height modal chrome.

- [ ] **Step 1: Write the component**

```tsx
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import type { SermonSeries } from "@/utils/api/sermons/interfaces";

interface SeriesFormValues {
  title: string;
  description: string;
}

const validationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  description: Yup.string().nullable(),
});

interface SeriesFormProps {
  series?: SermonSeries | null;
  /** Renders without the full-height modal chrome, for the stacked modal. */
  compact?: boolean;
  onClose: () => void;
  onSaved: (series: SermonSeries) => void;
}

export const SeriesForm = ({
  series,
  compact = false,
  onClose,
  onSaved,
}: SeriesFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(series);

  const initialValues: SeriesFormValues = {
    title: series?.title ?? "",
    description: series?.description ?? "",
  };

  const handleSave = async (values: SeriesFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || null,
      };

      const response = series
        ? await api.put.updateSermonSeries(series.id, payload)
        : await api.post.createSermonSeries(payload);

      showNotification(
        series ? "Series updated" : "Series created",
        "success"
      );
      onSaved(response.data);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Sermon series submit failed", error);
      showNotification(
        "The series could not be saved. Please try again.",
        "error",
        "Sermons"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSave}
    >
      {({ handleSubmit }) => (
        <Form
          className={
            compact ? "flex flex-col" : "flex h-[calc(100vh-260px)] flex-col"
          }
        >
          {compact ? (
            <div className="px-6 pt-6">
              <p className="text-lg font-semibold">New series</p>
              <p className="text-sm text-gray-500">
                Give the series a title. You can add sermons to it afterwards.
              </p>
            </div>
          ) : (
            <FormHeader>
              <p className="text-lg font-semibold">
                {isEdit ? "Edit series" : "Create series"}
              </p>
              <p className="text-sm text-white">
                A series groups related sermons together
              </p>
            </FormHeader>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <Field
              component={FormikInputDiv}
              label="Title *"
              name="title"
              id="series-title"
              placeholder="Faith Foundations"
            />

            <Field
              component={FormikInputDiv}
              label="Description"
              name="description"
              id="series-description"
              type="textarea"
              placeholder="What is this series about?"
            />
          </div>

          <div className="flex justify-end gap-3 border-t bg-white px-6 py-4">
            <Button
              variant="secondary"
              type="button"
              value="Cancel"
              onClick={onClose}
            />
            <Button
              type="button"
              value={isEdit ? "Save changes" : "Create series"}
              loading={submitting}
              onClick={() => handleSubmit()}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SeriesForm;
```

`response.data` is the series itself, not an envelope. `ApiResponse<T>` is built in `src/utils/api/apiFunctions.ts:87`, which already does `data: response.data.data` — the double unwrapping happens there, so callers read `.data` once. Never write `.data.data` in a component after a direct `await`.

- [ ] **Step 2: Verify it compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend tsc --noEmit 2>&1 | grep SeriesForm
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/ChurchCommunication/Components/SeriesForm.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): split the series form out of the sermon form

The same form now serves the Series tab and the stacked modal the sermon form
opens, so the two cannot drift apart."
```

---

### Task B6: Sermon form

**Files:**
- Rewrite: `src/pages/HomePage/pages/ChurchCommunication/Components/SermonForm.tsx`

- [ ] **Step 1: Replace the file entirely**

```tsx
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { FormikSelect } from "@/components/FormikSelect";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import {
  extractYouTubeVideoId,
  youtubeThumbnail,
} from "../utils/youtube";
import SeriesForm from "./SeriesForm";
import TagSelect from "./TagSelect";
import type {
  Sermon,
  SermonSeries,
  SermonTag,
} from "@/utils/api/sermons/interfaces";

interface SermonFormValues {
  title: string;
  description: string;
  youtube_url: string;
  series_id: number | "";
  tags: string[];
}

// Validate with the same parser that produces the preview, rather than a
// looser regex. A regex accepts /channel/... and /playlist?... links, which
// yield no video id — the field goes green while the preview stays blank and
// the save then fails server-side.
const validationSchema = Yup.object({
  title: Yup.string().trim().required("Name is required"),
  description: Yup.string().nullable(),
  youtube_url: Yup.string()
    .trim()
    .required("A YouTube link is required")
    .test(
      "is-youtube-video",
      "Enter a link to a YouTube video",
      (value) => !!extractYouTubeVideoId(value ?? "")
    ),
});

interface SermonFormProps {
  sermon?: Sermon | null;
  onClose: () => void;
  onSaved: () => void;
}

export const SermonForm = ({ sermon, onClose, onSaved }: SermonFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [seriesOptions, setSeriesOptions] = useState<SermonSeries[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<SermonTag[]>([]);
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const publishRef = useRef(false);

  const isEdit = Boolean(sermon);
  const isPublished = sermon?.status === "PUBLISHED";

  // Loaded once when the form mounts. The series list is mutated locally when
  // the user creates one inline, so it is not re-fetched on every render.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [seriesRes, tagsRes] = await Promise.all([
          api.fetch.fetchSermonSeries(),
          api.fetch.fetchSermonTags(),
        ]);
        if (cancelled) return;
        setSeriesOptions(seriesRes.data ?? []);
        setTagSuggestions(tagsRes.data ?? []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load sermon form options", error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const initialValues: SermonFormValues = {
    title: sermon?.title ?? "",
    description: sermon?.description ?? "",
    youtube_url: sermon?.youtube_url ?? "",
    series_id: sermon?.series_id ?? "",
    tags: sermon?.tags?.map((tag) => tag.name) ?? [],
  };

  const seriesSelectOptions = useMemo(
    () => seriesOptions.map((item) => ({ value: item.id, label: item.title })),
    [seriesOptions]
  );

  const handleSave = async (values: SermonFormValues) => {
    const shouldPublish = publishRef.current;
    setSubmitting(true);

    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        youtube_url: values.youtube_url.trim(),
        series_id: values.series_id === "" ? null : Number(values.series_id),
        tags: values.tags,
      };

      const saved = sermon
        ? await api.put.updateSermon(sermon.id, payload)
        : await api.post.createSermon(payload);

      const savedId = sermon?.id ?? saved.data?.id;
      if (shouldPublish && savedId && !isPublished) {
        await api.post.publishSermon(savedId);
      }

      showNotification(
        shouldPublish ? "Sermon published" : "Sermon saved",
        "success"
      );
      onSaved();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Sermon submit failed", error);
      showNotification(
        "The sermon could not be saved. Please try again.",
        "error",
        "Sermons"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSave}
    >
      {({ handleSubmit, values, setFieldValue }) => {
        const previewUrl = youtubeThumbnail(
          extractYouTubeVideoId(values.youtube_url)
        );

        return (
          <Form className="flex h-[calc(100vh-180px)] flex-col overflow-auto">
            <div className="sticky top-0 z-10">
              <FormHeader>
                <p className="text-lg font-semibold">
                  {isEdit ? "Edit sermon" : "Add sermon"}
                </p>
                <p className="text-sm text-white">
                  {isEdit
                    ? "Make changes to this sermon"
                    : "The thumbnail is generated from the YouTube link"}
                </p>
              </FormHeader>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <Field
                component={FormikInputDiv}
                label="Name *"
                name="title"
                id="sermon-title"
                placeholder="Walking In Faith"
              />

              <Field
                component={FormikInputDiv}
                label="Description"
                name="description"
                id="sermon-description"
                type="textarea"
                placeholder="What is this message about?"
              />

              <Field
                component={FormikInputDiv}
                label="YouTube link *"
                name="youtube_url"
                id="sermon-url"
                placeholder="https://www.youtube.com/watch?v=..."
              />

              <div className="flex flex-col gap-1">
                <span className="block text-sm font-medium">Thumbnail</span>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Video thumbnail"
                    className="aspect-video w-full max-w-xs rounded-lg border object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full max-w-xs items-center justify-center rounded-lg border border-dashed text-xs text-gray-400">
                    Paste a YouTube link to preview the thumbnail
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Generated from the link. Nothing to upload.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <Field
                  component={FormikSelect}
                  label="Series"
                  name="series_id"
                  id="sermon-series"
                  options={seriesSelectOptions}
                  placeholder="No series"
                  searchable
                  clearable
                />
                <button
                  type="button"
                  className="self-start text-sm text-primary"
                  onClick={() => setSeriesModalOpen(true)}
                >
                  + Create new series
                </button>
              </div>

              <TagSelect
                suggestions={tagSuggestions}
                value={values.tags}
                onChange={(names) => setFieldValue("tags", names)}
              />
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-6 py-4">
              <Button
                variant="secondary"
                type="button"
                value="Cancel"
                onClick={onClose}
              />

              {!isPublished && (
                <Button
                  variant="secondary"
                  type="button"
                  value="Save as draft"
                  loading={submitting}
                  onClick={() => {
                    publishRef.current = false;
                    handleSubmit();
                  }}
                />
              )}

              <Button
                type="button"
                value={isPublished ? "Save" : "Save & publish"}
                loading={submitting}
                onClick={() => {
                  publishRef.current = !isPublished;
                  handleSubmit();
                }}
              />
            </div>

            {/* Stacked over this form. The sermon form is never unmounted, so
                anything already typed survives creating a series. */}
            <Modal
              open={seriesModalOpen}
              onClose={() => setSeriesModalOpen(false)}
              title="Create series"
              className="max-w-lg"
            >
              <SeriesForm
                compact
                onClose={() => setSeriesModalOpen(false)}
                onSaved={(created) => {
                  setSeriesOptions((prev) => [created, ...prev]);
                  setFieldValue("series_id", created.id);
                }}
              />
            </Modal>
          </Form>
        );
      }}
    </Formik>
  );
};

export default SermonForm;
```

- [ ] **Step 2: Verify it compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend tsc --noEmit 2>&1 | grep SermonForm
```

Expected: no output. If `FormikSelect` is not a named export, check `src/components/FormikSelect.tsx` and import it as declared there.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/ChurchCommunication/Components/SermonForm.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): rewrite the sermon form around a single sermon

Name, description and link replace the old list of bare URLs. The thumbnail
previews from the link rather than being uploaded, and a series can be created
in a stacked modal without losing what has already been typed."
```

---

### Task B7: Sermon card

**Files:**
- Create: `src/pages/HomePage/pages/ChurchCommunication/Components/SermonCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import type { Sermon } from "@/utils/api/sermons/interfaces";

interface SermonCardProps {
  item: Sermon;
  toggling?: boolean;
  onEdit?: () => void;
  onTogglePublish?: () => void;
  onDelete?: () => void;
}

const MAX_VISIBLE_TAGS = 3;

export const SermonCard = ({
  item,
  toggling,
  onEdit,
  onTogglePublish,
  onDelete,
}: SermonCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const isPublished = item.status === "PUBLISHED";
  const tags = item.tags ?? [];
  const hiddenTagCount = Math.max(0, tags.length - MAX_VISIBLE_TAGS);

  return (
    <div className="app-card flex flex-col overflow-hidden rounded-xl">
      <a
        href={item.youtube_url}
        target="_blank"
        rel="noreferrer"
        className="group relative block aspect-video w-full bg-gray-100"
      >
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No thumbnail
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
          <PlayCircleIcon className="h-10 w-10 text-white opacity-0 transition group-hover:opacity-100" />
        </span>
      </a>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
            {item.title}
          </h3>
          <Badge
            className={
              isPublished
                ? "border-green-200 bg-green-50 text-xs text-green-700"
                : "border-gray-200 bg-gray-100 text-xs text-gray-600"
            }
          >
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>

        {item.series && (
          <p className="truncate text-xs text-gray-500">{item.series.title}</p>
        )}

        {item.description && (
          <p className="line-clamp-2 text-xs text-gray-500">
            {item.description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
              >
                {tag.name}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                +{hiddenTagCount}
              </span>
            )}
          </div>
        )}

        {canManageCurrentRoute && (
          <div className="mt-auto flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onEdit}
              className="text-gray-500 hover:text-primary"
              aria-label={`Edit ${item.title}`}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onTogglePublish}
              disabled={toggling}
              className="text-gray-500 hover:text-primary disabled:opacity-40"
              aria-label={
                isPublished ? `Unpublish ${item.title}` : `Publish ${item.title}`
              }
            >
              {isPublished ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="text-gray-500 hover:text-red-500"
              aria-label={`Delete ${item.title}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SermonCard;
```

`line-clamp-*` needs Tailwind's line-clamp support. Tailwind 3.3+ ships it in core. Verify:

```bash
grep -rn "line-clamp" /Users/akwaah/Documents/GitHub/Frontend/src --include=*.tsx | head -3
```

If it is already used elsewhere in the app, nothing more is needed. If not, check the Tailwind version in `package.json` and add the plugin only if the version predates 3.3.

- [ ] **Step 2: Verify it compiles**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend tsc --noEmit 2>&1 | grep SermonCard
```

Expected: no output. If `canManageCurrentRoute` is not exported from `RouteAccessContext`, copy the exact usage from `SermonSeriesCard.tsx:26`.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/ChurchCommunication/Components/SermonCard.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): add the sermon grid tile"
```

---

### Task B8: Series card

**Files:**
- Modify: `src/pages/HomePage/pages/ChurchCommunication/Components/SermonSeriesCard.tsx`

Status is per sermon now, so the series publish toggle has no meaning.

- [ ] **Step 1: Remove the publish control**

- Delete the `toggling` and `onTogglePublish` props from `SermonSeriesCardProps` and the destructure.
- Delete the `EyeIcon` / `EyeSlashIcon` button and the `isPublished` const.
- Remove `EyeIcon` and `EyeSlashIcon` from the heroicons import.
- Replace the Draft/Published `Badge` with a sermon count:

```tsx
            <span className="text-xs text-gray-400">
              {sermons.length} {sermons.length === 1 ? "sermon" : "sermons"}
            </span>
```

- Delete the now-duplicated video-count `span` immediately below it.

- [ ] **Step 2: Verify no unused imports remain**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend run lint 2>&1 | grep SermonSeriesCard
```

Expected: no output. `lint` runs with `--max-warnings 0`, so an unused `EyeIcon` import fails the build.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/ChurchCommunication/Components/SermonSeriesCard.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "refactor(sermons): drop the series publish toggle

Publishing is a property of a sermon now, so a series-level toggle would
silently do nothing."
```

---

### Task B9: The page

**Files:**
- Rewrite: `src/pages/HomePage/pages/ChurchCommunication/SermonManager.tsx`

- [ ] **Step 1: Replace the file entirely**

```tsx
import { useEffect, useMemo, useState } from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import SermonCard from "./Components/SermonCard";
import SermonSeriesCard from "./Components/SermonSeriesCard";
import SermonForm from "./Components/SermonForm";
import SeriesForm from "./Components/SeriesForm";
import { Modal } from "@/components/Modal";
import { SelectField } from "../../Components/reusable/SelectField";
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { showDeleteDialog, showNotification } from "../../utils";
import EmptyState from "@/components/EmptyState";
import type {
  Sermon,
  SermonSeries,
  SermonTag,
} from "@/utils/api/sermons/interfaces";

type Tab = "sermons" | "series";

const SermonManager = () => {
  const [activeTab, setActiveTab] = useState<Tab>("sermons");

  const [sermonFormOpen, setSermonFormOpen] = useState(false);
  const [seriesFormOpen, setSeriesFormOpen] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SermonSeries | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [seriesFilter, setSeriesFilter] = useState<number | "">("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // branch_id is injected by branchScope.ts (Task B2 Step 5), and useFetch
  // re-runs whenever the active branch changes, so no query is passed here.
  const {
    data: sermonsData,
    loading: sermonsLoading,
    refetch: refetchSermons,
  } = useFetch(api.fetch.fetchSermons);

  const { data: seriesData, refetch: refetchSeries } = useFetch(
    api.fetch.fetchSermonSeries
  );

  const { data: tagsData } = useFetch(api.fetch.fetchSermonTags);

  const sermons: Sermon[] = useMemo(
    () => (Array.isArray(sermonsData?.data) ? sermonsData.data : []),
    [sermonsData]
  );

  const series: SermonSeries[] = useMemo(
    () => (Array.isArray(seriesData?.data) ? seriesData.data : []),
    [seriesData]
  );

  const tags: SermonTag[] = useMemo(
    () => (Array.isArray(tagsData?.data) ? tagsData.data : []),
    [tagsData]
  );

  // Filtering is client-side: the endpoint supports the same filters, but the
  // list is small and filtering locally keeps the grid responsive without a
  // round trip per keystroke.
  const visibleSermons = useMemo(
    () =>
      sermons.filter((sermon) => {
        if (seriesFilter !== "" && sermon.series_id !== seriesFilter) {
          return false;
        }
        if (statusFilter && sermon.status !== statusFilter) return false;
        if (tagFilter && !sermon.tags?.some((tag) => tag.slug === tagFilter)) {
          return false;
        }
        return true;
      }),
    [sermons, seriesFilter, statusFilter, tagFilter]
  );

  const deleteSermon = async (id: string | number) => {
    try {
      await api.delete.deleteSermon(Number(id));
      showNotification("Sermon deleted", "success");
      refetchSermons();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Delete sermon failed", error);
      showNotification("The sermon could not be deleted.", "error", "Sermons");
    }
  };

  const deleteSeries = async (id: string | number) => {
    try {
      await api.delete.deleteSermonSeries(Number(id));
      showNotification("Series deleted", "success");
      refetchSeries();
      refetchSermons();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Delete series failed", error);
      showNotification("The series could not be deleted.", "error", "Sermons");
    }
  };

  const togglePublish = async (item: Sermon) => {
    setTogglingId(item.id);
    try {
      if (item.status === "PUBLISHED") {
        await api.post.unpublishSermon(item.id);
        showNotification("Sermon unpublished", "success");
      } else {
        await api.post.publishSermon(item.id);
        showNotification("Sermon published", "success");
      }
      refetchSermons();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Toggle publish failed", error);
      showNotification(
        "The sermon status could not be updated. Please try again.",
        "error",
        "Sermons"
      );
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    // A series the user just deleted must not stay selected as a filter.
    if (seriesFilter !== "" && !series.some((s) => s.id === seriesFilter)) {
      setSeriesFilter("");
    }
  }, [series, seriesFilter]);

  const isSermonsTab = activeTab === "sermons";

  return (
    <PageOutline>
      <HeaderControls
        title="Sermons"
        subtitle="Create and manage sermons for members"
        btnName={isSermonsTab ? "Add sermon" : "Add series"}
        hasSearch={false}
        screenWidth={window.innerWidth}
        handleClick={() => {
          if (isSermonsTab) {
            setSelectedSermon(null);
            setSermonFormOpen(true);
          } else {
            setSelectedSeries(null);
            setSeriesFormOpen(true);
          }
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("sermons")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            isSermonsTab
              ? "bg-primary text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Sermons ({sermons.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("series")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            !isSermonsTab
              ? "bg-primary text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Series ({series.length})
        </button>
      </div>

      {isSermonsTab ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              id="filter-series"
              placeholder="All series"
              value={seriesFilter}
              clearable
              searchable
              options={series.map((item) => ({
                value: item.id,
                label: item.title,
              }))}
              onChange={(_name, value) =>
                setSeriesFilter(value === null ? "" : Number(value))
              }
            />

            <SelectField
              id="filter-tag"
              placeholder="All tags"
              value={tagFilter}
              clearable
              searchable
              options={tags.map((tag) => ({
                value: tag.slug,
                label: tag.name,
              }))}
              onChange={(_name, value) => setTagFilter(String(value ?? ""))}
            />

            <SelectField
              id="filter-status"
              placeholder="All statuses"
              value={statusFilter}
              clearable
              options={[
                { value: "PUBLISHED", label: "Published" },
                { value: "DRAFT", label: "Draft" },
              ]}
              onChange={(_name, value) => setStatusFilter(String(value ?? ""))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleSermons.map((item) => (
              <SermonCard
                key={item.id}
                item={item}
                toggling={togglingId === item.id}
                onEdit={() => {
                  setSelectedSermon(item);
                  setSermonFormOpen(true);
                }}
                onTogglePublish={() => togglePublish(item)}
                onDelete={() =>
                  showDeleteDialog(
                    { name: item.title ?? "Sermon", id: item.id },
                    deleteSermon
                  )
                }
              />
            ))}
          </div>

          {!sermonsLoading && visibleSermons.length === 0 && (
            <EmptyState
              scope="page"
              msg={
                sermons.length === 0
                  ? "No sermons yet"
                  : "No sermons match these filters"
              }
              description={
                sermons.length === 0
                  ? "Add your first sermon to share it with members."
                  : "Clear a filter to see more sermons."
              }
            />
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {series.map((item) => (
            <SermonSeriesCard
              key={item.id}
              item={item}
              onEdit={() => {
                setSelectedSeries(item);
                setSeriesFormOpen(true);
              }}
              onDelete={() =>
                showDeleteDialog(
                  { name: item.title ?? "Series", id: item.id },
                  deleteSeries
                )
              }
            />
          ))}

          {series.length === 0 && (
            <EmptyState
              scope="page"
              msg="No series yet"
              description="A series groups related sermons together."
            />
          )}
        </div>
      )}

      <Modal
        open={sermonFormOpen}
        onClose={() => {
          setSermonFormOpen(false);
          setSelectedSermon(null);
        }}
        title="Sermon"
      >
        <SermonForm
          sermon={selectedSermon}
          onClose={() => {
            setSermonFormOpen(false);
            setSelectedSermon(null);
          }}
          onSaved={() => {
            refetchSermons();
            refetchSeries();
          }}
        />
      </Modal>

      <Modal
        open={seriesFormOpen}
        onClose={() => {
          setSeriesFormOpen(false);
          setSelectedSeries(null);
        }}
        title="Series"
      >
        <SeriesForm
          series={selectedSeries}
          onClose={() => {
            setSeriesFormOpen(false);
            setSelectedSeries(null);
          }}
          onSaved={() => refetchSeries()}
        />
      </Modal>
    </PageOutline>
  );
};

export default SermonManager;
```

`hasFilter` is dropped from `HeaderControls` because the page renders its own filter row.

- [ ] **Step 2: Verify the whole Frontend compiles and lints**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/Frontend tsc --noEmit
npm --prefix /Users/akwaah/Documents/GitHub/Frontend run lint
```

Expected: both silent, exit code 0. `lint` uses `--max-warnings 0`, so any unused import is a failure.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/ChurchCommunication/SermonManager.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(sermons): show sermons as a grid with a series tab

The page leads with sermons and keeps series management on a second tab, so
neither surface is lost."
```

---

### Task B10: Manual verification, then the PR

- [ ] **Step 1: Run the app**

```bash
npm --prefix /Users/akwaah/Documents/GitHub/Frontend run dev
```

Point `REACT_APP_API_URL` in `.env` at the Backend running from Phase A.

- [ ] **Step 2: Walk the flows**

Navigate to the Sermons page and confirm each, one at a time:

1. The primary button reads **Add sermon**, not "Add sermon series".
2. Opening it shows Name, Description, YouTube link, Thumbnail, Series, Tags.
3. Pasting `https://www.youtube.com/watch?v=dQw4w9WgXcQ` renders the thumbnail preview immediately, before saving.
4. Typing an existing tag's name shows it as a suggestion and does **not** offer `Create "..."`.
5. Typing a new tag offers `Create "..."`.
6. **+ Create new series** opens a second modal over the form. Saving it selects the new series in the dropdown **and everything already typed in the sermon form is still there**. This is the whole point of the stacked-modal choice — if fields reset, the form is being unmounted and that is a bug.
7. Saving creates the sermon and it appears in the grid with its thumbnail.
8. The grid reflows to one column at phone width.
9. The Series tab lists series, and editing one works.
10. Switching the active branch re-fetches the grid.

- [ ] **Step 3: Confirm the tag dedupe end to end**

Create a second sermon and tag it `faith` (lowercase) where an earlier sermon used `Faith`. Then reopen any sermon form.

Expected: the tag suggestion list shows **one** faith tag, not two. If two appear, `toTagSlug` in the Backend and `toSlug` in `TagSelect.tsx` have diverged.

- [ ] **Step 4: Push and open the PR**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend push -u origin feat/sermon-first-class-rework
```

Open the PR against `development` — **not** `main`. Note in the description that it depends on the Backend PR being deployed first. End with:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 5: Report honestly**

State which verification commands were actually run and what they output. If any step in Step 2 failed, say which one and why, rather than reporting the feature as complete.

---

## Notes for the implementer

**Deviation from the spec, deliberate.** The spec described the Series field as a select with a `footerAction` slot. `SelectField` (`src/pages/HomePage/Components/reusable/SelectField.tsx`) has no such prop — only `MultiSelect` does, and that component is multi-select only. Rather than add a prop to a component used across the app, Task B6 renders a plain "+ Create new series" button beneath the select. Same behaviour, no shared-component change.

**Response unwrapping — read once, never twice.** `ApiResponse<T>` is constructed in `src/utils/api/apiFunctions.ts` (line 87: `data: response.data.data`), so the Backend's `{ message, data }` envelope is already stripped before a component sees it.

- Direct call: `const res = await api.post.createSermon(payload)` → `res.data` is the `Sermon`.
- Via `useFetch`: `const { data } = useFetch(api.fetch.fetchSermons)` → `data` is the whole `ApiResponse`, so `data.data` is the `Sermon[]`.

That asymmetry is why the old `SermonManager.tsx` used `data.data` while the old `SermonForm.tsx` used `response.data?.id`. Both were right. `.data.data` inside a component after a direct `await` is always wrong.

**Do not add a test runner.** Both repos deliberately have none.

**Deliberately left alone.** Two pre-existing issues surfaced during review.
Neither is this feature's business, but both deserve a ticket:

- `can_view_sermons` is defined in the Backend's `authorization.ts` and
  referenced nowhere, while `Sermons` is a live domain in the access-level
  catalog — so admins see a Sermons "view" toggle that grants nothing. Fixing
  it means touching the permissions UI.
- The Frontend has a second YouTube parser in `LearningUnit.tsx`, differing in
  subdomain matching and `/v/` handling. Consolidating means editing another
  feature's code.
