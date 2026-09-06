# Event Online Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff attach optional Zoom and/or YouTube URLs to a scheduled event, and let mobile members join the stream once the event is live.

**Architecture:** A new `event_online_link` table on Backend holds one row per platform per event, serialized onto every event response through the single existing `mapEventResponse` mapper. Writes go through a dedicated `PUT /event/online-links` route so link edits never trigger `update-event`'s registrant SMS blast. The web dashboard gets an Online Access section in the schedule form and an Online Access block plus modal on the event view page. Mobile reads `online_links` off the event payload it already fetches and renders Join / "Waiting for online link" states while the event is live.

**Tech Stack:** Backend — Express, Prisma, MySQL. Frontend — Vite, React, TypeScript, Formik, Tailwind, Radix Dialog. Mobile — Expo, React Native, TanStack Query.

**Spec:** `docs/superpowers/specs/2026-09-06-event-online-links-design.md`

**No test runner exists in any of the three repos** (per each repo's CLAUDE.md — do not add one). Verification is typecheck + lint + explicit manual checks.

---

## Repo and branch map

| Phase | Repo | Path | Branch | PR target |
|---|---|---|---|---|
| 1 | Backend | `/Users/akwaah/Documents/GitHub/Backend` | `feat/event-online-links` off `main` | `main` |
| 2 | Frontend | `/Users/akwaah/Documents/GitHub/Frontend` | `feat/event-online-links` (already cut off `development`) | `development` |
| 3 | Mobile | `/Users/akwaah/Documents/GitHub/wwm-mobile` | `codex/event-online-links` off `dev` | `dev` |

One branch, one commit series, one PR **per repo**. Never stage files from two repos together. Always pass `git -C <repo path>` rather than `cd`.

Backend must be merged and deployed before either client ships.

---

## File structure

**Backend**
- Create: `prisma/migrations/20260906120000_add_event_online_links/migration.sql`
- Modify: `prisma/schema.prisma` — new model + back-relation on `event_mgt`
- Create: `src/modules/events/onlineLinks.ts` — platform registry, validation, serialization, write helper. All online-link logic lives here; the controller only wires it up.
- Modify: `src/modules/events/eventContoller.ts` — selects, `mapEventResponse`, create-event pass-through, new `updateOnlineLinks` handler
- Modify: `src/modules/events/eventRoute.ts` — one route

**Frontend**
- Modify: `src/utils/api/events/interfaces.ts` — `EventOnlineLink` type
- Create: `src/pages/HomePage/pages/EventsManagement/utils/onlinePlatforms.ts` — client platform registry (labels, field names, host hints, validation)
- Modify: `src/utils/api/apiPut.ts` — `updateEventOnlineLinks`
- Create: `src/pages/HomePage/pages/EventsManagement/Components/OnlineLinksFields.tsx` — the shared Formik fields
- Create: `src/pages/HomePage/pages/EventsManagement/Components/OnlineLinkModal.tsx` — modal around those fields
- Modify: `src/pages/HomePage/pages/EventsManagement/Components/EventsScheduleForm.tsx` — Online Access section
- Modify: `src/pages/HomePage/pages/EventsManagement/pages/CreateEvent.tsx` — route `links` to the right endpoint
- Modify: `src/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx` — Online Access block

`EventsScheduleForm.tsx` is 1343 lines already, so the fields are an extracted component rather than another inline block.

**Mobile**
- Modify: `src/features/events/types.ts` — `EventOnlineLink`
- Modify: `src/features/events/helpers.ts` — `eventOnlineLinks`, `onlineLinkIcon`
- Create: `src/features/events/components/JoinOnlineModal.tsx`
- Modify: `src/features/events/index.ts` — exports
- Modify: `src/features/events/components/UpcomingEventCard.tsx` — hero + detail modal states, drop `onWatchLive`
- Modify: `src/features/watch/components/WatchLiveHero.tsx` — same states
- Modify: `src/features/home/screens/DashboardScreen.tsx` — drop the `onWatchLive` prop

---

## Deviation from the spec (read before starting)

The spec said `update-event` would also accept a `links` array. While planning, `getChangedValues` in `src/utils/helperFunctions.ts:117-129` turned out to **skip every object/array-valued key** (`if (typeof currentValues[key] == "object") continue;`), so an array named `links` would be silently dropped from the update payload. Rather than special-case the diff:

- **create-event** accepts `links` and applies them to every occurrence it creates in that call (the user typed them once for the series they are creating).
- **updates always go through `PUT /event/online-links`**, both from the view-page modal and from the schedule form's update path.

This also means `update-event` never carries links, so the registrant SMS blast is never triggered by a link change from any surface. Everything else matches the spec.

---

# Phase 1 — Backend

### Task 1: Branch and schema

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/prisma/schema.prisma`
- Create: `/Users/akwaah/Documents/GitHub/Backend/prisma/migrations/20260906120000_add_event_online_links/migration.sql`

- [ ] **Step 1: Cut the branch**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend fetch origin main --quiet
git -C /Users/akwaah/Documents/GitHub/Backend checkout -b feat/event-online-links origin/main
```

- [ ] **Step 2: Add the model to `prisma/schema.prisma`**

Insert directly after the `event_reminder` model (currently ends around line 455):

```prisma
model event_online_link {
  id         Int       @id @default(autoincrement())
  event_id   Int
  platform   String    @db.VarChar(32)
  url        String    @db.VarChar(2048)
  created_at DateTime  @default(now())
  updated_by Int?
  updated_at DateTime?
  event      event_mgt @relation(fields: [event_id], references: [id], onDelete: Cascade)

  @@unique([event_id, platform], map: "event_online_link_event_id_platform_key")
}
```

- [ ] **Step 3: Add the back-relation on `event_mgt`**

In `model event_mgt` (starts line 396), add one line alongside the other relation fields — put it directly after `event_reminders  event_reminder[]`:

```prisma
  online_links              event_online_link[]
```

- [ ] **Step 4: Write the migration SQL**

Create `prisma/migrations/20260906120000_add_event_online_links/migration.sql`:

```sql
/*
  Adds `event_online_link` — one row per streaming platform per event, holding
  the Zoom / YouTube URL members join through. A table rather than two columns
  on `event_mgt` because more platforms are expected; `platform` is a plain
  string validated in application code (see src/modules/events/onlineLinks.ts)
  so a new platform needs no migration.
*/

-- CreateTable
CREATE TABLE `event_online_link` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `platform` VARCHAR(32) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `event_online_link_event_id_platform_key`(`event_id`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_online_link` ADD CONSTRAINT `event_online_link_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `event_mgt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 5: Regenerate the Prisma client and confirm the schema parses**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx prisma generate
```

Expected: `✔ Generated Prisma Client`. If it reports a validation error on `event_online_link`, the back-relation on `event_mgt` is missing or misnamed — fix before continuing.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add prisma/schema.prisma prisma/migrations/20260906120000_add_event_online_links/migration.sql
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(events): add event_online_link table"
```

---

### Task 2: Online-link module

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Backend/src/modules/events/onlineLinks.ts`

- [ ] **Step 1: Write the module**

```ts
import { prisma } from "../../Models/context";

/**
 * The streaming platforms an event can carry a link for. Adding one here is
 * the whole change — `platform` is a VARCHAR, not a DB enum, precisely so a
 * new platform needs no migration and no mobile release. `label` and
 * `join_label` ship in the API response so already-installed clients render a
 * platform they have never heard of correctly.
 */
export const ONLINE_PLATFORMS: Record<
  string,
  { label: string; join_label: string }
> = {
  zoom: { label: "Zoom", join_label: "Join on Zoom" },
  youtube: { label: "YouTube", join_label: "Watch on YouTube" },
};

/** Must match `event_online_link.url @db.VarChar(2048)` in prisma/schema.prisma. */
const MAX_URL_LENGTH = 2048;
/** Must match `event_online_link.platform @db.VarChar(32)`. */
const MAX_PLATFORM_LENGTH = 32;

/**
 * Registry lookup that ignores inherited properties. A plain
 * `ONLINE_PLATFORMS[platform]` truthiness test accepts "constructor",
 * "toString" and every other Object.prototype member, which would let an
 * unsupported platform through the allowlist and into the table.
 */
const platformMeta = (platform: string) =>
  Object.prototype.hasOwnProperty.call(ONLINE_PLATFORMS, platform)
    ? ONLINE_PLATFORMS[platform]
    : undefined;

export type OnlineLinkInput = { platform: string; url: string };

const normalizePlatform = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/** Prisma select for the relation — kept next to the serializer that reads it. */
export const onlineLinkSelect = {
  platform: true,
  url: true,
} as const;

/**
 * Turns stored rows into the client-facing shape. Rows for a platform no
 * longer in the registry are dropped rather than returned label-less.
 */
export const serializeOnlineLinks = (rows: unknown) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row: any) => {
      const platform = normalizePlatform(row?.platform);
      const meta = platformMeta(platform);
      const url = String(row?.url ?? "").trim();
      if (!meta || !url) return null;
      return {
        platform,
        label: meta.label,
        join_label: meta.join_label,
        url,
      };
    })
    .filter(Boolean);
};

/**
 * Validates a request body's `links` array. Returns `{ links }` on success or
 * `{ error }` with a message safe to hand straight back as a 400.
 * An entry with an empty url is kept — it means "delete this platform's link".
 */
export const parseOnlineLinksInput = (
  value: unknown,
): { links: OnlineLinkInput[] } | { error: string } => {
  if (value === undefined || value === null) {
    return { links: [] };
  }

  if (!Array.isArray(value)) {
    return { error: "links must be an array" };
  }

  const links: OnlineLinkInput[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    const platform = normalizePlatform((entry as any)?.platform);

    if (!platform) {
      return { error: "Each online link needs a platform" };
    }

    if (platform.length > MAX_PLATFORM_LENGTH) {
      return { error: "Online platform name is too long" };
    }

    const meta = platformMeta(platform);

    if (!meta) {
      return { error: `Unsupported online platform: ${platform}` };
    }

    if (seen.has(platform)) {
      return { error: `Duplicate online link for platform: ${platform}` };
    }
    seen.add(platform);

    const url = String((entry as any)?.url ?? "").trim();

    if (url && !isValidHttpUrl(url)) {
      return {
        error: `The ${meta.label} link must be a valid http or https URL`,
      };
    }

    if (url.length > MAX_URL_LENGTH) {
      return {
        error: `The ${meta.label} link is too long`,
      };
    }

    links.push({ platform, url });
  }

  return { links };
};

/**
 * Upserts every entry with a url and deletes every entry without one.
 * Platforms absent from `links` are left untouched, so a caller can update a
 * single platform without resending the others.
 */
export const applyOnlineLinks = async (
  eventId: number,
  links: OnlineLinkInput[],
  actorUserId: number | null,
) => {
  if (links.length === 0) return;

  // Every link targets a distinct (event_id, platform) row — duplicates are
  // rejected upstream — and no write depends on another's result, so the
  // non-interactive array form applies them atomically in one round trip.
  const operations = links.map((link) =>
      link.url
        ? prisma.event_online_link.upsert({
            where: {
              event_id_platform: { event_id: eventId, platform: link.platform },
            },
            create: {
              event_id: eventId,
              platform: link.platform,
              url: link.url,
              updated_by: actorUserId,
              updated_at: new Date(),
            },
            update: {
              url: link.url,
              updated_by: actorUserId,
              updated_at: new Date(),
            },
          })
        : prisma.event_online_link.deleteMany({
            where: { event_id: eventId, platform: link.platform },
          }),
  );

  await prisma.$transaction(operations);
};

/** Reads back an event's links in the serialized client shape. */
export const readOnlineLinks = async (eventId: number) => {
  const rows = await prisma.event_online_link.findMany({
    where: { event_id: eventId },
    select: onlineLinkSelect,
    orderBy: { platform: "asc" },
  });
  return serializeOnlineLinks(rows);
};
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no errors. If `event_id_platform` is reported as unknown on the upsert `where`, the `@@unique` in Task 1 did not generate — re-run `npx prisma generate`.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/events/onlineLinks.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(events): add online link registry, validation and write helper"
```

---

### Task 3: Serialize links onto every event response

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/events/eventContoller.ts`

Every event response already funnels through one mapper (`mapEventResponse`, line 645), so this is a single place.

- [ ] **Step 1: Import the module**

Add after the `attendanceVisitorCounts` import block (around line 25):

```ts
import { onlineLinkSelect, serializeOnlineLinks } from "./onlineLinks";
```

Tasks 4 and 5 extend this import as they need more from the module — do not
import `applyOnlineLinks`, `parseOnlineLinksInput` or `readOnlineLinks` yet.

- [ ] **Step 2: Add the relation to `eventBaseSelect`**

In `eventBaseSelect` (line 134), add directly after the `event: { select: {...} }` block:

```ts
  online_links: {
    select: onlineLinkSelect,
  },
```

- [ ] **Step 3: Add the relation to `eventMutationSelect`**

In `eventMutationSelect` (line 181), add directly after its `event: { select: { event_name: true } }` block:

```ts
  online_links: {
    select: onlineLinkSelect,
  },
```

Do **not** add it to `publicEventSelect` — the unauthenticated public registration page must not expose join links.

- [ ] **Step 4: Serialize in `mapEventResponse`**

In `mapEventResponse` (line 645), inside the `flattenedEvent` object literal, add one line directly before `event: null,`:

```ts
      online_links: serializeOnlineLinks(event?.online_links),
```

- [ ] **Step 5: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Verify manually**

Start the API (`npm run dev`), then with a valid token:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:$PORT/event/get-event?id=<any existing event id>" | grep -o '"online_links":[^,]*'
```

Expected: `"online_links":[]` — the key is present and empty. If the key is missing, the select was added to the wrong object.

- [ ] **Step 7: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/events/eventContoller.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(events): return online_links on event responses"
```

---

### Task 4: Accept `links` on create-event

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/events/eventContoller.ts`

- [ ] **Step 1: Validate the input before the occurrence loop**

In `createEvent`, directly after the `const branch_id = await resolveBranchIdOrDefault(data?.branch_id);` line (around line 970), insert:

```ts
      const parsedLinks = parseOnlineLinksInput(data?.links);
      if ("error" in parsedLinks) {
        return res.status(400).json({
          message: parsedLinks.error,
          data: null,
        });
      }
      const onlineLinks = parsedLinks.links.filter((link) => link.url);
```

- [ ] **Step 2: Apply them to each created occurrence**

Inside the `for (const occurrenceStartDate of schedulePayload.occurrenceDates)` loop, directly after the existing `createdEventIds.push(eventId);` line, insert:

```ts
        if (onlineLinks.length) {
          // Links entered once while creating a series apply to every
          // occurrence that call creates. Editing them later is per-occurrence.
          await applyOnlineLinks(eventId, onlineLinks, actorUserId);
        }
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify manually**

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"event_name_id":<id>,"start_date":"2026-10-01","start_time":"10:00","end_time":"12:00","links":[{"platform":"zoom","url":"https://zoom.us/j/123"}]}' \
  "http://localhost:$PORT/event/create-event"
```

Then `GET /event/get-event?id=<new id>` and confirm:

```json
"online_links":[{"platform":"zoom","label":"Zoom","join_label":"Join on Zoom","url":"https://zoom.us/j/123"}]
```

Also send `"links":[{"platform":"skype","url":"https://x.com"}]` and expect `400` with `Unsupported online platform: skype`.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/events/eventContoller.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(events): accept online links on create-event"
```

---

### Task 5: The `PUT /event/online-links` route

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/events/eventContoller.ts`
- Modify: `/Users/akwaah/Documents/GitHub/Backend/src/modules/events/eventRoute.ts`

- [ ] **Step 1: Add the handler**

In `eventContoller.ts`, add this method directly after the `updateEvent` method's closing `};`:

```ts
  /**
   * Sets an event's online join links.
   *
   * Deliberately separate from `updateEvent`: that handler notifies and SMSes
   * every registrant on any change, and its `value ? value : existing` merge
   * cannot clear a field. Pasting a Zoom URL must do neither.
   */
  updateOnlineLinks = async (req: Request, res: Response) => {
    try {
      const eventId = Number(req.query?.id);

      if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({
          message: "A valid event id is required",
          data: null,
        });
      }

      const actorUserId = this.getActorUserId(req);

      if (!actorUserId) {
        return res.status(401).json({
          message: "Unauthorized",
          data: null,
        });
      }

      const existing = await prisma.event_mgt.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({
          message: "Event not found",
          data: null,
        });
      }

      const parsedLinks = parseOnlineLinksInput(req.body?.links);

      if ("error" in parsedLinks) {
        return res.status(400).json({
          message: parsedLinks.error,
          data: null,
        });
      }

      await applyOnlineLinks(eventId, parsedLinks.links, actorUserId);

      return res.status(200).json({
        message: "Online links updated successfully",
        data: {
          event_id: eventId,
          online_links: await readOnlineLinks(eventId),
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Online links failed to update",
        data: error.message,
      });
    }
  };
```

- [ ] **Step 2: Register the route**

In `eventRoute.ts`, add directly after the `eventRouter.put("/update-event", ...)` block:

```ts
// PUT /event/online-links?id=<event_id>
// body: { links: [ { platform: "zoom", url: "https://..." }, ... ] }
// An entry with an empty url removes that platform's link.
eventRouter.put(
  "/online-links",
  [protect, permissions.can_manage_events],
  eventContoller.updateOnlineLinks,
);
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify manually**

Set both links:

```bash
curl -s -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"links":[{"platform":"zoom","url":"https://zoom.us/j/999"},{"platform":"youtube","url":"https://youtu.be/abc"}]}' \
  "http://localhost:$PORT/event/online-links?id=<event id>"
```

Expected: 200, `online_links` with two entries.

Clear one:

```bash
curl -s -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"links":[{"platform":"zoom","url":""}]}' \
  "http://localhost:$PORT/event/online-links?id=<event id>"
```

Expected: 200, `online_links` now has only the YouTube entry — proving an empty url deletes and an absent platform is untouched.

Reject a bad URL:

```bash
curl -s -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"links":[{"platform":"zoom","url":"not-a-url"}]}' \
  "http://localhost:$PORT/event/online-links?id=<event id>"
```

Expected: 400 `The Zoom link must be a valid http or https URL`.

Confirm the permission guard by calling it with a token lacking `manage_events` — expect 401/403, not 200.

- [ ] **Step 5: Confirm no registrant notification fired**

Register a test user for the event, then run the set-links call from Step 4 again and check `notification` rows for that user. Expected: no new `event.updated` row. This is the whole reason the route exists.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend add src/modules/events/eventContoller.ts src/modules/events/eventRoute.ts
git -C /Users/akwaah/Documents/GitHub/Backend commit -m "feat(events): add PUT /event/online-links"
```

---

### Task 6: Record the shipped contract

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Frontend/docs/EVENT_ONLINE_LINKS_BACKEND_CONTRACT.md`

Written into the Frontend repo because that is where `docs/*_BACKEND_CONTRACT.md` already lives. Copy the shapes from the controller you just wrote — do not paraphrase from this plan.

- [ ] **Step 1: Write the contract doc**

```markdown
# Event Online Links — Backend Contract

Agreed 2026-09-06. Source of truth: `Backend/src/modules/events/onlineLinks.ts`
and `eventContoller.ts`.

## Read

`online_links` is present on every authenticated event response —
`GET /event/get-event`, `/event/list-events`, `/event/list-events-light`,
`/event/upcoming-events`, and the event arrays returned by create/update.

    "online_links": [
      { "platform": "zoom",    "label": "Zoom",    "join_label": "Join on Zoom",     "url": "https://zoom.us/j/999" },
      { "platform": "youtube", "label": "YouTube", "join_label": "Watch on YouTube", "url": "https://youtu.be/abc" }
    ]

Always an array; `[]` when no links are set. Order is by `platform` ascending.

`label` and `join_label` are server-supplied so a platform added later renders
on already-installed mobile builds. Clients MUST use them rather than
hardcoding platform names, and MUST tolerate an unknown `platform` value.

**Not** returned by `GET /event/public-event` — the unauthenticated
registration page does not expose join links.

## Write

### On create

`POST /event/create-event` accepts an optional `links` array:

    { "links": [ { "platform": "zoom", "url": "https://zoom.us/j/999" } ] }

Applied to every occurrence created by that call.

### On update

`PUT /event/online-links?id=<event_id>` — guard: `manage_events`.

    { "links": [ { "platform": "zoom", "url": "https://zoom.us/j/999" },
                 { "platform": "youtube", "url": "" } ] }

- Non-empty `url` → upsert that platform's link.
- Empty `url` → delete that platform's link.
- Platform absent from the array → untouched.

Response:

    { "message": "Online links updated successfully",
      "data": { "event_id": 12, "online_links": [ ... ] } }

`PUT /event/update-event` does NOT accept `links`. Link edits deliberately
avoid that handler, which notifies and SMSes every registrant on any change.

## Errors

| Status | When |
|---|---|
| 400 | `links` not an array; missing/unsupported/duplicate platform; url not http(s); url over 2048 chars |
| 401 | no valid actor |
| 403 | caller lacks `manage_events` |
| 404 | no event with that id |

## Supported platforms

`zoom`, `youtube`. Adding one is an entry in `ONLINE_PLATFORMS` in
`Backend/src/modules/events/onlineLinks.ts` — no migration, no app release.
```

- [ ] **Step 2: Commit (Frontend repo)**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add docs/EVENT_ONLINE_LINKS_BACKEND_CONTRACT.md
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "docs: record event online links backend contract"
```

---

### Task 7: Open the Backend PR

- [ ] **Step 1: Push and open**

```bash
git -C /Users/akwaah/Documents/GitHub/Backend push -u origin feat/event-online-links
gh pr create --repo WWW-Ministries-Project/Backend --base main \
  --title "feat(events): online join links (Zoom / YouTube)" \
  --body "Adds \`event_online_link\` and \`PUT /event/online-links\` so events can carry optional Zoom/YouTube URLs for online members. Contract: Frontend \`docs/EVENT_ONLINE_LINKS_BACKEND_CONTRACT.md\`.

Kept off \`update-event\` deliberately — that handler SMSes every registrant on any change and its merge cannot clear a field.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 2: Note the deploy gate**

CI runs `prisma migrate deploy` on push to `main`, so merging applies the migration to the dev database immediately. Do not merge the Frontend or Mobile PRs before this one is merged and deployed.

---

# Phase 2 — Frontend

Branch `feat/event-online-links` is already cut off `development` and holds the spec commit.

### Task 8: Types and client platform registry

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/utils/api/events/interfaces.ts`
- Create: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/HomePage/pages/EventsManagement/utils/onlinePlatforms.ts`

- [ ] **Step 1: Add the response type**

In `src/utils/api/events/interfaces.ts`, add above `export type EventResponseType`:

```ts
export type EventOnlineLink = {
  platform: string;
  label: string;
  join_label: string;
  url: string;
};
```

And add one field inside `EventResponseType`, after `event_registers?: EventRegistrationRecord[];`:

```ts
  online_links?: EventOnlineLink[];
```

- [ ] **Step 2: Add the same field to the events store type**

In `src/pages/HomePage/pages/EventsManagement/utils/eventInterfaces.ts`, import the type and add the field to `eventType`. Add to the existing import from `@/utils/api/events/interfaces`:

```ts
import {
  EventOnlineLink,
  EventRegistrationAudience,
  EventRegistrationRecord,
} from "@/utils/api/events/interfaces";
```

and inside `interface eventType`, after `event_registers?: EventRegistrationRecord[];`:

```ts
  /** Zoom / YouTube links members join through. Always present, may be empty. */
  online_links?: EventOnlineLink[];
```

- [ ] **Step 3: Write the client platform registry**

Create `src/pages/HomePage/pages/EventsManagement/utils/onlinePlatforms.ts`:

```ts
import type { EventOnlineLink } from "@/utils/api/events/interfaces";

/**
 * Mirrors ONLINE_PLATFORMS in Backend/src/modules/events/onlineLinks.ts.
 * The form renders one field per entry here, so adding a platform is one
 * object on each side — see docs/EVENT_ONLINE_LINKS_BACKEND_CONTRACT.md.
 */
export const ONLINE_PLATFORMS = [
  {
    key: "zoom",
    label: "Zoom",
    field: "zoom_url",
    placeholder: "https://zoom.us/j/1234567890",
    hostHints: ["zoom.us", "zoom.com"],
  },
  {
    key: "youtube",
    label: "YouTube",
    field: "youtube_url",
    placeholder: "https://youtube.com/watch?v=...",
    hostHints: ["youtube.com", "youtu.be"],
  },
] as const;

export type OnlinePlatform = (typeof ONLINE_PLATFORMS)[number];

/**
 * What the producers below return: one string per platform, keyed by `field`.
 * The consumers take `Record<string, unknown>` instead, because the schedule
 * form's own value type carries an `unknown` index signature — accepting that
 * directly avoids a cast at every call site, and the helpers coerce with
 * `String()` anyway.
 */
export type OnlineLinkFormValues = Record<string, string>;

export const emptyOnlineLinkValues = (): OnlineLinkFormValues =>
  ONLINE_PLATFORMS.reduce<OnlineLinkFormValues>((acc, platform) => {
    acc[platform.field] = "";
    return acc;
  }, {});

/** API array → flat form values. */
export const onlineLinksToFormValues = (
  links: EventOnlineLink[] | undefined | null
): OnlineLinkFormValues => {
  const values = emptyOnlineLinkValues();
  (links || []).forEach((link) => {
    const platform = ONLINE_PLATFORMS.find((p) => p.key === link.platform);
    if (platform) values[platform.field] = link.url || "";
  });
  return values;
};

/**
 * Flat form values → API array. Every platform is included, empty url and
 * all: an empty url is how the API is told to delete that link.
 */
export const formValuesToOnlineLinks = (
  values: Record<string, unknown>
): { platform: string; url: string }[] =>
  ONLINE_PLATFORMS.map((platform) => ({
    platform: platform.key,
    url: String(values[platform.field] ?? "").trim(),
  }));

/** Blocking error, or "" when the value is acceptable (empty counts as acceptable). */
export const onlineLinkError = (value: unknown): string => {
  const url = String(value ?? "").trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Enter a link starting with http:// or https://";
    }
    return "";
  } catch {
    return "Enter a valid link, e.g. https://zoom.us/j/1234567890";
  }
};

/**
 * Non-blocking hint when the host does not look like the platform. Churches
 * use vanity domains and shorteners, so this never blocks a save.
 */
export const onlineLinkWarning = (
  platform: OnlinePlatform,
  value: unknown
): string => {
  const url = String(value ?? "").trim();
  if (!url || onlineLinkError(url)) return "";
  try {
    const host = new URL(url).hostname.toLowerCase();
    const matches = platform.hostHints.some(
      (hint) => host === hint || host.endsWith(`.${hint}`)
    );
    return matches
      ? ""
      : `This does not look like a ${platform.label} link. It will still be saved.`;
  } catch {
    return "";
  }
};

export const hasOnlineLinkErrors = (values: Record<string, unknown>): boolean =>
  ONLINE_PLATFORMS.some((platform) =>
    Boolean(onlineLinkError(values[platform.field] ?? ""))
  );
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/utils/api/events/interfaces.ts src/pages/HomePage/pages/EventsManagement/utils/eventInterfaces.ts src/pages/HomePage/pages/EventsManagement/utils/onlinePlatforms.ts
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(events): add online link types and platform registry"
```

---

### Task 9: API function

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/utils/api/apiPut.ts`

- [ ] **Step 1: Add the method**

In `class ApiUpdateCalls`, directly after `updateEventSeriesFrom`:

```ts
  /**
   * Set an event's Zoom / YouTube links. Separate from `updateEvent` because
   * that endpoint notifies and SMSes every registrant on any change.
   * An entry with an empty url deletes that platform's link.
   */
  updateEventOnlineLinks = (
    payload: { links: { platform: string; url: string }[] },
    query?: QueryType
  ): Promise<ApiResponse<unknown>> => {
    return this.apiExecution.updateData("event/online-links", payload, query);
  };
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/utils/api/apiPut.ts
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(events): add updateEventOnlineLinks api call"
```

---

### Task 10: Shared Formik fields

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/HomePage/pages/EventsManagement/Components/OnlineLinksFields.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Field, useFormikContext } from "formik";
import { ONLINE_PLATFORMS, onlineLinkWarning } from "../utils/onlinePlatforms";

/**
 * One optional URL field per streaming platform, shared by the schedule form
 * and the view page's Online Access modal so both validate identically.
 * Neither field is required — an event can have one link, both, or none.
 */
export const OnlineLinksFields = () => {
  const { values } = useFormikContext<Record<string, unknown>>();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ONLINE_PLATFORMS.map((platform) => {
        const value = String(values[platform.field] ?? "");
        const warning = onlineLinkWarning(platform, value);

        return (
          <div key={platform.key} className="space-y-1">
            <Field
              component={FormikInputDiv}
              label={`${platform.label} link`}
              type="text"
              id={platform.field}
              name={platform.field}
              placeholder={platform.placeholder}
              value={value}
            />
            {warning ? (
              <p className="text-sma text-primaryGray">{warning}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default OnlineLinksFields;
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/EventsManagement/Components/OnlineLinksFields.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(events): add shared online link form fields"
```

---

### Task 11: Online Access section in the schedule form

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/HomePage/pages/EventsManagement/Components/EventsScheduleForm.tsx`

- [ ] **Step 1: Import**

Add to the existing imports:

```tsx
import { OnlineLinksFields } from "./OnlineLinksFields";
import {
  emptyOnlineLinkValues,
  formValuesToOnlineLinks,
  hasOnlineLinkErrors,
  onlineLinkError,
  ONLINE_PLATFORMS,
  onlineLinksToFormValues,
} from "../utils/onlinePlatforms";
```

- [ ] **Step 2: Extend `EventsFormValues`**

Add inside `interface EventsFormValues`, after `branch_id?: number | "";`:

```ts
  /** One flat string per platform — see utils/onlinePlatforms.ts */
  zoom_url?: string;
  youtube_url?: string;
  links?: { platform: string; url: string }[];
```

- [ ] **Step 3: Seed the values in `normalizedInitialValues`**

Inside the `useMemo` object literal, add after the `branch_id:` entry:

```ts
      ...emptyOnlineLinkValues(),
      ...onlineLinksToFormValues(
        props.inputValue.online_links as
          | { platform: string; label: string; join_label: string; url: string }[]
          | undefined
      ),
```

- [ ] **Step 4: Validate the URLs**

In the `validate={(values) => {...}}` prop, add before `return errors;`:

```ts
        ONLINE_PLATFORMS.forEach((platform) => {
          const message = onlineLinkError(String(values[platform.field] ?? ""));
          if (message) errors[platform.field] = message;
        });
```

- [ ] **Step 5: Attach `links` to the submitted payload**

In `onSubmit`, replace the final two statements:

```ts
        const changedValues = props.updating
          ? getChangedValues(normalizedInitialValues, preparedValues)
          : preparedValues;
        props.onSubmit(changedValues);
```

with:

```ts
        const changedValues = props.updating
          ? getChangedValues(normalizedInitialValues, preparedValues)
          : preparedValues;

        // `getChangedValues` drops every object/array-valued key, so `links`
        // is re-attached after the diff. CreateEvent routes it to the
        // dedicated online-links endpoint on update, and inlines it on create.
        props.onSubmit({
          ...changedValues,
          links: formValuesToOnlineLinks(val),
        });
```

- [ ] **Step 6: Add the section**

Insert a new `<section>` directly after the "Other Information" section (the one holding Location and Timezone, closing around line 1144):

```tsx
          <section className="rounded-xl border border-lightGray bg-white p-5 md:p-6">
            <div className="mb-4 space-y-1">
              <h2 className="H400 text-primary">Online Access</h2>
              <p className="text-sma text-primaryGray">
                Optional. Add a Zoom and/or YouTube link so members can join
                online. Links apply to this occurrence only.
              </p>
            </div>
            <OnlineLinksFields />
          </section>
```

- [ ] **Step 7: Guard the submit button**

In the sticky footer at the end of the file (~line 1327), change the submit button's `disabled` prop from:

```tsx
                disabled={Boolean(props.loading) || form.isSubmitting}
```

to:

```tsx
                disabled={
                  Boolean(props.loading) ||
                  form.isSubmitting ||
                  hasOnlineLinkErrors(form.values)
                }
```

- [ ] **Step 8: Lint and typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
```

Expected: both clean. `npm run lint` fails on any warning.

- [ ] **Step 9: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/EventsManagement/Components/EventsScheduleForm.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(events): add Online Access section to the schedule form"
```

---

### Task 12: Route `links` from CreateEvent

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/HomePage/pages/EventsManagement/pages/CreateEvent.tsx`

On create the array is inlined in the create payload. On every update path it goes to the dedicated endpoint instead, so no update ever SMSes registrants over a link change.

- [ ] **Step 1: Import the api module**

`api` is already imported. No new import needed.

- [ ] **Step 2: Split `links` off the payload**

In `handleSubmit`, directly after `setIsSubmitting(true);`, insert:

```tsx
    const { links, ...eventValues } = val as {
      links?: { platform: string; url: string }[];
    } & Record<string, unknown>;
```

- [ ] **Step 3: Use `eventValues` in every branch**

Replace each of the four `...val,` spreads in the create/series/update branches with `...eventValues,`.

- [ ] **Step 4: Save the links on the update paths**

Directly after the `if (!id) { ... }` create branch and the three update branches — that is, immediately before `isSuccessful = true;` — insert:

```tsx
      // On create the links rode along in the create payload. Every update
      // path sends them separately so `update-event` (which SMSes registrants)
      // never carries them. Links are per-occurrence, series edits included.
      if (id && links) {
        await api.put.updateEventOnlineLinks({ links }, { id });
      }
```

- [ ] **Step 5: Inline the links on create**

In the `if (!id)` branch, change the `eventData` object to:

```tsx
        const eventData = {
          ...eventValues,
          ...(posterLink ? { poster: posterLink } : {}),
          ...(links ? { links } : {}),
          created_by: user?.id,
        };
```

- [ ] **Step 6: Lint and typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
```

Expected: both clean.

- [ ] **Step 7: Verify manually**

With the Backend running and `npm run dev` on the Frontend:

1. Schedule a new event, fill in a Zoom link only, save. Reopen it for edit — the Zoom field is prefilled, YouTube is empty.
2. Add a YouTube link, save. Reopen — both are prefilled.
3. Clear the Zoom field, save. Reopen — Zoom is empty, YouTube still set.
4. Type `not-a-url` in Zoom — the field shows the error and the submit button is disabled.
5. Type `https://example.com/live` in YouTube — a grey hint appears below the field and the save still works.

- [ ] **Step 8: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/EventsManagement/pages/CreateEvent.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(events): save online links from the schedule form"
```

---

### Task 13: Online Access modal

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/HomePage/pages/EventsManagement/Components/OnlineLinkModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type { EventOnlineLink } from "@/utils/api/events/interfaces";
import { Form, Formik } from "formik";
import { OnlineLinksFields } from "./OnlineLinksFields";
import {
  formValuesToOnlineLinks,
  ONLINE_PLATFORMS,
  onlineLinkError,
  onlineLinksToFormValues,
  type OnlineLinkFormValues,
} from "../utils/onlinePlatforms";

interface OnlineLinkModalProps {
  open: boolean;
  eventId: string | number;
  links: EventOnlineLink[];
  onClose: () => void;
  /** Called after a successful save so the caller can refetch the event. */
  onSaved: () => void;
}

export const OnlineLinkModal = ({
  open,
  eventId,
  links,
  onClose,
  onSaved,
}: OnlineLinkModalProps) => {
  const { updateData, loading } = usePut(api.put.updateEventOnlineLinks);

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <Formik<OnlineLinkFormValues>
        initialValues={onlineLinksToFormValues(links)}
        enableReinitialize
        validate={(values) => {
          const errors: Record<string, string> = {};
          ONLINE_PLATFORMS.forEach((platform) => {
            const message = onlineLinkError(String(values[platform.field] ?? ""));
            if (message) errors[platform.field] = message;
          });
          return errors;
        }}
        onSubmit={async (values) => {
          try {
            await updateData(
              { links: formValuesToOnlineLinks(values) },
              { id: eventId }
            );
            showNotification("Online links updated", "success");
            onSaved();
            onClose();
          } catch {
            showNotification("Unable to update the online links", "error");
          }
        }}
      >
        {(form) => (
          <Form className="flex flex-col gap-5 p-5 md:p-6">
            <div className="space-y-1">
              <h2 className="H500 text-primary">Online Access</h2>
              <p className="text-sma text-primaryGray">
                Add a Zoom and/or YouTube link so members can join this event
                online. Both are optional — clear a field to remove its link.
              </p>
            </div>

            <OnlineLinksFields />

            <div className="flex justify-end gap-3">
              <Button
                value="Cancel"
                type="button"
                className="border border-lightGray bg-white px-6 py-2 text-primary"
                onClick={onClose}
              />
              <Button
                value={loading ? "Saving..." : "Save links"}
                type="submit"
                disabled={loading || !form.isValid}
                className="bg-primary px-6 py-2 text-white"
              />
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default OnlineLinkModal;
```

- [ ] **Step 2: Lint and typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
```

Expected: both clean. If `Button` rejects `type` or `disabled`, check its prop names in `src/components` and adjust — do not change `Button` itself.

- [ ] **Step 3: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/EventsManagement/Components/OnlineLinkModal.tsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(events): add online link modal"
```

---

### Task 14: Online Access block on the event view page

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/Frontend/src/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx`

- [ ] **Step 1: Imports**

Add:

```jsx
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { OnlineLinkModal } from "../Components/OnlineLinkModal";
```

- [ ] **Step 2: State, permission and a refetch helper**

`ViewEvents` currently fetches inside a `useEffect` with no reusable loader. Replace the existing effect:

```jsx
  useEffect(() => {
    if (!id) return;

    setQueryLoading(true);
    axios
      .get(`/event/get-event?id=${id}`)
      .then((res) => {
        setEventdetails(res.data.data);
      })
      .finally(() => {
        setQueryLoading(false);
      });
  }, [id]);
```

with:

```jsx
  const fetchEvent = useCallback(() => {
    if (!id) return;

    setQueryLoading(true);
    axios
      .get(`/event/get-event?id=${id}`)
      .then((res) => {
        setEventdetails(res.data.data);
      })
      .finally(() => {
        setQueryLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);
```

Add `useCallback` to the existing `react` import. Then add alongside the other `useState` calls:

```jsx
  const [onlineLinkModal, setOnlineLinkModal] = useState(false);
  const { canManage } = useAccessControl();
  const canManageEvents = canManage("Events");
  const onlineLinks = eventdetails?.online_links || [];
```

- [ ] **Step 3: Render the modal**

Directly after the existing `{seriesModal && (<SeriesScopeModal ... />)}` block:

```jsx
      {onlineLinkModal && (
        <OnlineLinkModal
          open={onlineLinkModal}
          eventId={id}
          links={onlineLinks}
          onClose={() => setOnlineLinkModal(false)}
          onSaved={fetchEvent}
        />
      )}
```

- [ ] **Step 4: Add the Online Access block**

Inside `{selectedTab === "Details" && (...)}`, directly above the existing `<section>` holding "Attendance Records":

```jsx
              <section className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="H400 text-primary">Online Access</h2>
                    <p className="text-sma text-primaryGray">
                      Links members use to join this event online.
                    </p>
                  </div>
                  {onlineLinks.length > 0 && canManageEvents && (
                    <Button
                      value="Edit links"
                      className="border border-lightGray bg-white px-5 py-2 text-primary"
                      onClick={() => setOnlineLinkModal(true)}
                    />
                  )}
                </div>

                {onlineLinks.length === 0 ? (
                  <EmptyState
                    scope="section"
                    className="mx-auto w-full"
                    msg="No online link added yet"
                    description={
                      canManageEvents
                        ? "Add a Zoom or YouTube link so members can join this event online."
                        : "An administrator has not added a Zoom or YouTube link for this event."
                    }
                    actionLabel={canManageEvents ? "Click here to add" : undefined}
                    onAction={
                      canManageEvents ? () => setOnlineLinkModal(true) : undefined
                    }
                  />
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {onlineLinks.map((link) => (
                      <div
                        key={link.platform}
                        className="rounded-2xl border border-lightGray bg-gray-50 p-4"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                          {link.label}
                        </p>
                        <p className="mt-2 truncate text-sm text-primary" title={link.url}>
                          {link.url}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            value="Open"
                            className="bg-primary px-4 py-1.5 text-white"
                            onClick={() =>
                              window.open(link.url, "_blank", "noopener,noreferrer")
                            }
                          />
                          <Button
                            value="Copy"
                            className="border border-lightGray bg-white px-4 py-1.5 text-primary"
                            onClick={() => handleCopyOnlineLink(link)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
```

- [ ] **Step 5: Add the copy handler**

Next to the existing `handleCopyRegistrationUrl`:

```jsx
  const handleCopyOnlineLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      showNotification(`${link.label} link copied`, "success");
    } catch {
      showNotification("Unable to copy the link", "error");
    }
  };
```

- [ ] **Step 6: Lint and typecheck**

```bash
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
```

Expected: both clean.

- [ ] **Step 7: Verify manually**

1. Open an event with no links as a user with `manage_events`. The Details tab shows "No online link added yet" with a "Click here to add" action.
2. Click it — the modal opens with two empty fields.
3. Enter a Zoom URL only, save. Notification appears, the modal closes, and the block now shows one Zoom card with Open and Copy, plus an "Edit links" button.
4. Click Open — a new tab goes to the Zoom URL. Click Copy — the clipboard holds it.
5. Click "Edit links", clear the Zoom field, save — the block returns to the empty state.
6. Log in as a user with `view_events` but not `manage_events`. The empty state has no action button and no "Edit links" button appears when links exist.

- [ ] **Step 8: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend add src/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx
git -C /Users/akwaah/Documents/GitHub/Frontend commit -m "feat(events): show and edit online links on the event view page"
```

---

### Task 15: Open the Frontend PR

- [ ] **Step 1: Push and open**

```bash
git -C /Users/akwaah/Documents/GitHub/Frontend push -u origin feat/event-online-links
gh pr create --repo WWW-Ministries-Project/Frontend --base development \
  --title "feat(events): online join links (Zoom / YouTube)" \
  --body "Adds an Online Access section to the event schedule form and an Online Access block plus modal on the event view page, so staff can attach optional Zoom/YouTube links members join through.

Requires the Backend PR to be merged and deployed first. Contract: \`docs/EVENT_ONLINE_LINKS_BACKEND_CONTRACT.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

CI blocks reopening a previously merged branch, so if the push is rejected, cut a fresh branch off `development` and cherry-pick.

---

# Phase 3 — Mobile

### Task 16: Branch, types and normalizer

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/features/events/types.ts`
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/features/events/helpers.ts`

- [ ] **Step 1: Cut the branch off `dev` (never `main`)**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile fetch origin dev --quiet
git -C /Users/akwaah/Documents/GitHub/wwm-mobile checkout -b codex/event-online-links origin/dev
```

- [ ] **Step 2: Add the type**

In `src/features/events/types.ts`:

```ts
export type DashboardEvent = Record<string, unknown>;

/** One streaming platform an event can be joined on. `label` and `joinLabel`
 *  come from the server so a platform added after this build shipped still
 *  renders with the right wording. */
export type EventOnlineLink = {
  platform: string;
  label: string;
  joinLabel: string;
  url: string;
};
```

- [ ] **Step 3: Add the normalizer**

In `src/features/events/helpers.ts`, extend the existing import and add the functions. Change the import line to:

```ts
import { asArray, asRecord, formatDate, stripHtml, toNumber, toText } from "@/shared/lib";
import type { DashboardEvent, EventOnlineLink } from "./types";
```

Then add at the end of the file:

```ts
/** Icons for the platforms this build knows. An unknown platform still
 *  renders — with the generic video icon — because the backend can add one
 *  without an app release. */
const ONLINE_LINK_ICONS: Record<string, IconName> = {
  zoom: "videocam-outline",
  youtube: "logo-youtube",
};

export const onlineLinkIcon = (platform: string): IconName =>
  ONLINE_LINK_ICONS[platform] ?? "videocam-outline";

/** `online_links` off the event payload. Entries without a url are dropped —
 *  an empty array is the "no link yet" signal every join surface keys off. */
export const eventOnlineLinks = (event: DashboardEvent): EventOnlineLink[] =>
  asArray<unknown>(event.online_links)
    .map((raw) => {
      const record = asRecord(raw);
      const platform = toText(record.platform);
      const url = toText(record.url);
      if (!platform || !url) return null;
      return {
        platform,
        label: toText(record.label, platform),
        joinLabel: toText(record.join_label, `Join on ${toText(record.label, platform)}`),
        url,
      };
    })
    .filter((link): link is EventOnlineLink => link !== null);

/** The host, for the picker's subtitle — "zoom.us", "youtu.be". */
export const onlineLinkHost = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
```

Add `IconName` to the file's type imports:

```ts
import type { IconName } from "@/shared/ui";
```

- [ ] **Step 4: Export from the feature barrel**

In `src/features/events/index.ts`, change the type export line to:

```ts
export type { DashboardEvent, EventOnlineLink } from "./types";
```

- [ ] **Step 5: Typecheck**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/wwm-mobile tsc --noEmit
```

Expected: no errors. If `helpers.ts` importing from `@/shared/ui` creates a cycle warning, move `ONLINE_LINK_ICONS` and `onlineLinkIcon` into `JoinOnlineModal.tsx` instead — `api.ts` and `queryKeys.ts` are the modules that must stay UI-free, but keep `helpers.ts` clean if the import proves awkward.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/features/events/types.ts src/features/events/helpers.ts src/features/events/index.ts
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "feat(events): normalize online links off the event payload"
```

---

### Task 17: The platform picker

**Files:**
- Create: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/features/events/components/JoinOnlineModal.tsx`
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/features/events/index.ts`

- [ ] **Step 1: Write the component**

```tsx
import * as Linking from "expo-linking";
import { Alert, Modal } from "react-native";
import {
  ActionList,
  ActionRow,
  PageHero,
  Screen,
  Section,
  useTheme,
} from "@/shared/ui";
import { onlineLinkHost, onlineLinkIcon } from "../helpers";
import type { EventOnlineLink } from "../types";

/**
 * Asks which platform to join on. Only rendered for two or more links — with
 * exactly one, callers open it directly rather than showing a one-row picker.
 */
export function JoinOnlineModal({
  open,
  title,
  links,
  onClose,
}: {
  open: boolean;
  title: string;
  links: EventOnlineLink[];
  onClose: () => void;
}) {
  useTheme();

  const openLink = async (link: EventOnlineLink) => {
    onClose();
    try {
      await Linking.openURL(link.url);
    } catch {
      Alert.alert("Unable to open", `${link.label} could not be opened right now.`);
    }
  };

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen title="Join Online" variant="modal">
        <PageHero kicker="Join online" title={title} subtitle="Choose where to watch" onBack={onClose} />
        <Section title="Available now">
          <ActionList>
            {links.map((link) => (
              <ActionRow
                key={link.platform}
                title={link.joinLabel}
                subtitle={onlineLinkHost(link.url)}
                icon={onlineLinkIcon(link.platform)}
                onPress={() => openLink(link)}
              />
            ))}
          </ActionList>
        </Section>
      </Screen>
    </Modal>
  );
}
```

- [ ] **Step 2: Export it**

In `src/features/events/index.ts`, add:

```ts
export { JoinOnlineModal } from "./components/JoinOnlineModal";
```

- [ ] **Step 3: Typecheck**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/wwm-mobile tsc --noEmit
```

Expected: no errors. If `Screen` rejects `variant="modal"` or `PageHero` rejects a prop, copy the exact usage from `src/features/departments/components/JoinDepartmentModal.tsx`, which is the established modal pattern in this app.

- [ ] **Step 4: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/features/events/components/JoinOnlineModal.tsx src/features/events/index.ts
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "feat(events): add online platform picker"
```

---

### Task 18: Join states on the event card

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/features/events/components/UpcomingEventCard.tsx`

- [ ] **Step 1: Imports and shared join logic**

Add `eventOnlineLinks` and `onlineLinkIcon` to the existing `../helpers` import block. Add `import { JoinOnlineModal } from "./JoinOnlineModal";` and `import type { EventOnlineLink } from "../types";`. (`onlineLinkHost` is used by the picker, not here — do not import it.)

Inside the component, after `const live = isEventLive(event);`:

```tsx
  const [joinOpen, setJoinOpen] = useState(false);
  const onlineLinks = eventOnlineLinks(event);
  const canJoin = live && onlineLinks.length > 0;
  const awaitingLink = live && onlineLinks.length === 0;

  /** One link goes straight there; two or more get the picker. */
  const openJoin = () => {
    if (onlineLinks.length === 1) {
      Linking.openURL(onlineLinks[0].url).catch(() =>
        Alert.alert("Unable to open", `${onlineLinks[0].label} could not be opened right now.`)
      );
      return;
    }
    setJoinOpen(true);
  };

  const joinLabel = onlineLinks.length === 1 ? onlineLinks[0].joinLabel : "Join";
```

- [ ] **Step 2: Rewrite the hero's primary action**

Replace the three `primaryLabel` / `primaryIcon` / `primaryPress` lines inside `if (variant === "hero")` with:

```tsx
    const primaryLabel = canJoin
      ? joinLabel
      : awaitingLink
        ? "Waiting for online link"
        : requiresRegistration
          ? "Register"
          : "View details";
    const primaryIcon: IconName = canJoin
      ? "videocam-outline"
      : awaitingLink
        ? "hourglass-outline"
        : requiresRegistration
          ? "ticket-outline"
          : "open-outline";
    const primaryPress = canJoin
      ? openJoin
      : requiresRegistration && !live
        ? () => onRegister(event)
        : () => setOpen(true);
```

- [ ] **Step 3: Disable the button while awaiting a link**

On the hero's primary `<Button>`, add:

```tsx
              disabled={awaitingLink}
```

- [ ] **Step 4: Add the join rows to the detail modal**

Inside `detailModal`, directly after the `{capacityText ? <InfoRow .../> : null}` line:

```tsx
            {canJoin
              ? onlineLinks.map((link: EventOnlineLink) => (
                  <Button
                    key={link.platform}
                    label={link.joinLabel}
                    icon={onlineLinkIcon(link.platform)}
                    onPress={() => Linking.openURL(link.url)}
                  />
                ))
              : null}
            {awaitingLink ? (
              <InfoRow
                icon="hourglass-outline"
                label="Online"
                value="Waiting for online link"
              />
            ) : null}
            {!live && onlineLinks.length > 0 ? (
              <InfoRow
                icon="videocam-outline"
                label="Online"
                value={onlineLinks.map((link) => link.label).join(" · ")}
              />
            ) : null}
```

The last block is informational only — before the event is live there is no Join action, per the spec's "only while live" decision.

- [ ] **Step 5: Render the picker**

Directly before the closing `</>` of the **hero** return only, add:

```tsx
        <JoinOnlineModal
          open={joinOpen}
          title={title}
          links={onlineLinks}
          onClose={() => setJoinOpen(false)}
        />
```

The compact variant has no Join button — its only join affordance is the shared detail modal, whose buttons open a URL directly — so it needs no picker.

- [ ] **Step 6: Remove the now-dead `onWatchLive` prop**

Delete `onWatchLive` from the component's props destructuring and from its prop type, along with its doc comment.

- [ ] **Step 7: Typecheck**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/wwm-mobile tsc --noEmit
```

Expected: one error in `DashboardScreen.tsx` for the removed prop. That is fixed in Task 20 — leave it for now, or do Task 20 first and re-run.

- [ ] **Step 8: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/features/events/components/UpcomingEventCard.tsx
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "feat(events): join and waiting states on the event card"
```

---

### Task 19: Join states on the Watch hero

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/features/watch/components/WatchLiveHero.tsx`

- [ ] **Step 1: Imports**

Add `eventOnlineLinks` and `JoinOnlineModal` to the existing `@/features/events` import, and `Alert` and `Linking` are already imported.

- [ ] **Step 2: Join state**

After `const live = isEventLive(event);`:

```tsx
  const [joinOpen, setJoinOpen] = useState(false);
  const onlineLinks = eventOnlineLinks(event);
  const canJoin = live && onlineLinks.length > 0;
  const awaitingLink = live && onlineLinks.length === 0;

  const openJoin = () => {
    if (onlineLinks.length === 1) {
      Linking.openURL(onlineLinks[0].url).catch(() =>
        Alert.alert("Unable to open", `${onlineLinks[0].label} could not be opened right now.`)
      );
      return;
    }
    setJoinOpen(true);
  };
```

- [ ] **Step 3: Rewrite the primary action**

Replace the existing three lines:

```tsx
  const primaryLabel = live ? "Join the stream" : requiresRegistration ? "Register" : "View details";
  const primaryIcon: IconName = live ? "play" : requiresRegistration ? "ticket-outline" : "open-outline";
  const primaryPress = live ? () => setOpen(true) : requiresRegistration ? () => onRegister(event) : () => setOpen(true);
```

with:

```tsx
  const primaryLabel = canJoin
    ? (onlineLinks.length === 1 ? onlineLinks[0].joinLabel : "Join the stream")
    : awaitingLink
      ? "Waiting for online link"
      : requiresRegistration
        ? "Register"
        : "View details";
  const primaryIcon: IconName = canJoin
    ? "play"
    : awaitingLink
      ? "hourglass-outline"
      : requiresRegistration
        ? "ticket-outline"
        : "open-outline";
  const primaryPress = canJoin
    ? openJoin
    : requiresRegistration && !live
      ? () => onRegister(event)
      : () => setOpen(true);
```

- [ ] **Step 4: Disable while awaiting and render the picker**

Add `disabled={awaitingLink}` to the hero's primary `<Button>`, and directly before the component's closing `</>`:

```tsx
      <JoinOnlineModal
        open={joinOpen}
        title={title}
        links={onlineLinks}
        onClose={() => setJoinOpen(false)}
      />
```

- [ ] **Step 5: Typecheck**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/wwm-mobile tsc --noEmit
```

Expected: only the `DashboardScreen.tsx` error from Task 18, fixed next.

- [ ] **Step 6: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/features/watch/components/WatchLiveHero.tsx
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "feat(watch): join and waiting states on the live hero"
```

---

### Task 20: Drop the dead WatchTab hop

**Files:**
- Modify: `/Users/akwaah/Documents/GitHub/wwm-mobile/src/features/home/screens/DashboardScreen.tsx`

The hero's `onWatchLive` existed only as the fallback for "live, but nowhere to send them". That case now renders the waiting state, so the prop has no caller.

- [ ] **Step 1: Remove the prop**

Delete this line from the `<UpcomingEventCard>` at line ~315:

```tsx
            onWatchLive={() => navigation.navigate("WatchTab")}
```

- [ ] **Step 2: Check `navigation` is still used**

```bash
grep -n "navigation\." /Users/akwaah/Documents/GitHub/wwm-mobile/src/features/home/screens/DashboardScreen.tsx
```

If no matches remain, remove the now-unused `navigation` binding and its import. If matches remain, leave them alone.

- [ ] **Step 3: Typecheck**

```bash
npx --prefix /Users/akwaah/Documents/GitHub/wwm-mobile tsc --noEmit
```

Expected: clean, no errors anywhere.

- [ ] **Step 4: Verify manually in the simulator**

```bash
npm --prefix /Users/akwaah/Documents/GitHub/wwm-mobile start
```

Against a backend where you can edit event times:

1. **Not live, links set** — Home hero shows the countdown and Register/View details as before. Opening details shows an "Online: Zoom · YouTube" info row and no Join button.
2. **Live, no links** — hero badge reads LIVE NOW, the primary button reads "Waiting for online link" and does not respond to taps. The detail modal shows the same waiting row. Watch tab hero matches.
3. **Live, one link** — the button reads that link's join label ("Watch on YouTube") and tapping opens the URL directly with no picker.
4. **Live, two links** — the button reads "Join"; tapping opens the picker with two rows, each showing the host; tapping a row opens that URL and closes the sheet.
5. **Old payload** — point the app at a backend without the field (or stub `online_links` out). Behaviour is case 2's waiting state, no crash.

- [ ] **Step 5: Commit**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile add src/features/home/screens/DashboardScreen.tsx
git -C /Users/akwaah/Documents/GitHub/wwm-mobile commit -m "refactor(home): drop the dead WatchTab hop from the event hero"
```

---

### Task 21: Open the Mobile PR

- [ ] **Step 1: Push and open against `dev`**

```bash
git -C /Users/akwaah/Documents/GitHub/wwm-mobile push -u origin codex/event-online-links
gh pr create --repo Akwaah/wwm-mobile --base dev \
  --title "feat(events): join a live event on Zoom or YouTube" \
  --body "Reads \`online_links\` off the event payload. While an event is live: Join (picker when there are two links, direct open when there is one) if a link exists, \"Waiting for online link\" if not. Applies to the Home hero, the event detail sheet and the Watch tab hero.

Additive only — an event payload without \`online_links\` behaves as it does today plus the waiting label. Requires the Backend PR deployed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Final verification

Run each in its own repo and report the command with its output:

```bash
cd /Users/akwaah/Documents/GitHub/Backend && npx tsc --noEmit
cd /Users/akwaah/Documents/GitHub/Frontend && npx tsc --noEmit && npm run lint
npx --prefix /Users/akwaah/Documents/GitHub/wwm-mobile tsc --noEmit
```

End-to-end, with all three running:

1. Web: create an event starting in two minutes with a Zoom link and a YouTube link.
2. Mobile before the start time: hero shows a countdown, no Join.
3. Mobile after the start time: hero shows "Join"; tapping gives a two-row picker; each row opens the right app.
4. Web: clear the YouTube link. Pull to refresh on mobile — the button now reads "Join on Zoom" and opens Zoom directly.
5. Web: clear the Zoom link too. Refresh — "Waiting for online link", disabled.
6. Confirm no registrant received an SMS during steps 4 and 5.
