# Event Online Links (Zoom / YouTube) — Design

**Date:** 2026-09-06
**Repos touched:** Backend, Frontend, Mobile
**Status:** Approved, ready for implementation planning

## Problem

Scheduled events have no way to carry a streaming link. Members who cannot attend
in person have nowhere to go when the event starts, and staff have nowhere to put
the Zoom room or YouTube stream they set up separately.

## Goal

1. Staff can attach optional Zoom and/or YouTube URLs to an event, from the event
   view page and from the create/edit form.
2. Members on mobile see a **Join** action once the event is live and a link exists,
   and a **"Waiting for online link"** state once it is live and no link exists.
3. When more than one platform is available, the member picks which one to open.

## Decisions

| Question | Decision |
|---|---|
| Where links are set (web) | Event view page (modal) **and** the create/edit schedule form |
| Recurring series | Link applies to **that occurrence only**; no series-scope prompt |
| Mobile trigger window | **Only while live** — `start ≤ now ≤ end`, the existing `isEventLive()` |
| Mobile placement | Hero card, event detail modal, **and** the Watch tab hero |
| Storage | Separate `event_online_link` table — more platforms are expected |
| Fields required? | No. Both optional, independently. |

## Data model (Backend)

New table. A row per platform per event, so adding Facebook Live / Teams later is
data plus one backend constant, not a schema migration and an app release.

```prisma
model event_online_link {
  id         Int       @id @default(autoincrement())
  event_id   Int
  platform   String    @db.VarChar(32)   // "zoom" | "youtube" | future
  url        String    @db.VarChar(2048)
  created_at DateTime  @default(now())
  updated_by Int?
  updated_at DateTime?
  event      event_mgt @relation(fields: [event_id], references: [id], onDelete: Cascade)

  @@unique([event_id, platform])
  @@index([event_id])
}
```

`event_mgt` gains the back-relation `online_links event_online_link[]`.

`platform` is a plain string rather than a Prisma enum on purpose: an enum needs a
migration for every new platform, which defeats the reason for choosing a table.
Validation lives in a backend constant instead:

```ts
export const ONLINE_PLATFORMS = {
  zoom:    { label: "Zoom",    join_label: "Join on Zoom" },
  youtube: { label: "YouTube", join_label: "Watch on YouTube" },
} as const;
```

A platform outside this map is rejected with 400.

## API (Backend)

### Read

`online_links` is added to `eventBaseSelect` and `eventMutationSelect` in
`src/modules/events/eventContoller.ts`, so it rides along on `get-event`,
`list-events`, `list-events-light` and `upcoming-events` with no extra request.

Serialized shape per link:

```json
{ "platform": "zoom", "label": "Zoom", "join_label": "Join on Zoom", "url": "https://zoom.us/j/123" }
```

`label` and `join_label` come from the server, not the client. That is what lets a
platform added server-side render correctly on an already-installed mobile build.

**Not** added to `publicEventSelect` — the unauthenticated public registration page
does not expose join links.

### Write

```
PUT /event/online-links?id=<event_id>
guards: [protect, permissions.can_manage_events]
body:   { "links": [ { "platform": "zoom", "url": "https://..." },
                     { "platform": "youtube", "url": "" } ] }
```

Per entry: a non-empty `url` upserts the `(event_id, platform)` row; an empty or
omitted `url` deletes it. Platforms absent from the array are left untouched.
Response returns the event's full `online_links` array after the write.

A dedicated route rather than folding the fields into `update-event`, because
`update-event`:

- sends an in-app notification **and an SMS** to every registrant on any change
  (`eventContoller.ts` ~line 1230) — pasting a Zoom URL must not blast registrants;
- merges with `value ? value : existing`, so an empty string can never clear a
  field.

`create-event` and `update-event` additionally accept an optional `links` array so
the schedule form can set links at creation time. There the same upsert-or-delete
logic runs, and the existing registrant notification fires as it already does for
any edit through that handler.

### URL validation

Shared between web and backend:

- must parse as an absolute `http`/`https` URL, else reject;
- per-platform host hints (`zoom.us`, `zoom.com`; `youtube.com`, `youtu.be`) produce
  a **warning only** in the web UI and never block the save — churches use vanity
  domains and shortened links.

## Web (Frontend)

`EventsScheduleForm.tsx` is the real create/edit form (1343 lines);
`EventForm.tsx` is only the event-name/type lookup. The schedule form is already
oversized, so the new fields land as an extracted component rather than another
inline block.

### New files

- `src/utils/api/events/onlineLinks.ts` — `updateEventOnlineLinks({ event_id, links })`
  against `PUT /event/online-links`.
- `src/pages/HomePage/pages/EventsManagement/Components/OnlineLinksFields.tsx` —
  labelled `FormikInputDiv` URL inputs, rendered by iterating the platform list so a
  third platform renders itself. Neither field required in the Yup schema.
- `src/pages/HomePage/pages/EventsManagement/Components/OnlineLinkModal.tsx` —
  modal wrapper around the same fields plus Save, used from the view page.

### EventsScheduleForm

One new `<section>` after the Location/Timezone section (~line 1119), titled
**Online Access**, body `<OnlineLinksFields />`. Values initialize from the loaded
event's `online_links` and post as `links` on create and update.

Sharing `OnlineLinksFields` between the form and the modal means one validation
rule, not two.

### ViewEvents — Details tab

New **Online Access** block above Attendance Records, three states:

| State | Renders |
|---|---|
| Links exist | One row per platform: label, truncated URL, **Open** and **Copy** buttons, plus **Edit links** |
| No links, user has `manage_events` | `EmptyState scope="section"` — "No online link added yet. Click here to add" as the action |
| No links, view-only user | Same empty state, no action, text reads "No online link added yet" |

Gated with `useAccessControl` against `manage_events` — the same permission the
backend route enforces, so the UI never offers a button the API will reject.

### Modal behaviour

Prefilled with current values. Both fields optional. Save posts through the usual
mutation hook, then `showNotification("Online links updated", "success")` and
refetches the event. Clearing a field and saving removes that link.

## Mobile

### Normalizer

In `src/features/events/helpers.ts`:

```ts
export type EventOnlineLink = { platform: string; label: string; joinLabel: string; url: string };
export const eventOnlineLinks = (event: DashboardEvent): EventOnlineLink[] => …
```

Built with the repo's coercion helpers (`asArray`, `asRecord`, `toText`), dropping
entries with an empty `url`. Icon resolves through a local `platform → IconName`
map with `"videocam-outline"` as the fallback, so an unrecognized platform still
renders. `label` / `joinLabel` are read from the payload, never hardcoded.

### New component

`src/features/events/components/JoinOnlineModal.tsx` — React Native `Modal` plus
`ActionList`, one `ActionRow` per link (icon, `joinLabel`, host as subtitle); tap
calls `Linking.openURL(url)`.

### Call sites

All three key off `isEventLive(event)` and `links.length`:

| Surface | Not live | Live, links | Live, no links |
|---|---|---|---|
| `UpcomingEventCard` hero | unchanged (Register / View details) | **Join** → picker | **"Waiting for online link"**, disabled |
| That card's detail modal | link rows hidden | Join rows in the Details card | muted "Waiting for online link" row |
| `WatchLiveHero` | unchanged | **"Join the stream"** → picker | **"Waiting for online link"**, disabled |

### One link vs many

With exactly one link, skip the picker and open it directly; the button label
becomes that link's `joinLabel` ("Watch on YouTube"). A picker with a single row is
friction. Two or more links → picker.

### Knock-on cleanup

`UpcomingEventCard`'s `onWatchLive` prop existed as the fallback for the
live-but-nowhere-to-send-them case. That case now renders the waiting state, so the
prop and its `navigation.navigate("WatchTab")` wiring in
`src/features/home/screens/DashboardScreen.tsx` (~line 315) are removed. Called out
explicitly because it is a deletion outside the strict "add links" scope.

### Old-build safety

Every change is additive. `online_links` missing from the payload yields
`links.length === 0`, which is today's behaviour plus a waiting label. No field is
renamed or removed, per the mobile additive-only rule.

## Work order

1. **Backend** — migration → `ONLINE_PLATFORMS` constant + validation → selects →
   `PUT /event/online-links` route and controller → `links` handling in
   `create-event` / `update-event`.
2. Record the shipped request/response shape verbatim from the controller.
3. **Frontend** — API function → `OnlineLinksFields` → schedule-form section →
   ViewEvents block → `OnlineLinkModal`.
4. **Mobile** — `eventOnlineLinks` normalizer → `JoinOnlineModal` → three call
   sites → remove `onWatchLive`.

Backend must be deployed before either client ships.

## Verification

- Frontend — `npm run lint` and `npx tsc --noEmit`
- Backend — `npx tsc --noEmit`
- Mobile — `npx tsc --noEmit`

## Out of scope

- Series-wide link editing (this occurrence only, per decision above).
- Exposing links on the public unauthenticated registration page.
- Any join window before the event start time.
- Attendance or analytics for online joins.
