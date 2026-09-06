# Event Online Links — Backend Contract

Agreed 2026-09-06. Source of truth: `Backend/src/modules/events/onlineLinks.ts`,
`eventContoller.ts` (`mapEventResponse`, `createEvent`, `updateOnlineLinks`) and
`eventRoute.ts`.

Storage is `event_online_link` — one row per platform per event, with a unique
key on `(event_id, platform)` and a cascading FK to `event_mgt`.

## Read

`online_links` is present on every **authenticated** event response —
`GET /event/get-event`, `/event/list-events`, `/event/list-events-light`,
`/event/upcoming-events`, and the event arrays returned by create and update.

```json
"online_links": [
  { "platform": "zoom",    "label": "Zoom",    "join_label": "Join on Zoom",     "url": "https://zoom.us/j/999" },
  { "platform": "youtube", "label": "YouTube", "join_label": "Watch on YouTube", "url": "https://youtu.be/abc" }
]
```

Always an array; `[]` when no links are set.

**Order is not guaranteed here.** The relation is loaded without an `orderBy`,
so `get-event`, `list-events`, `list-events-light`, `upcoming-events` and the
create/update event arrays may return the platforms in any order. Only the
`PUT /event/online-links` response is sorted (by `platform` ascending). Sort
client-side if order matters.

`label` and `join_label` are server-supplied so a platform added later renders
correctly on already-installed mobile builds. Clients MUST use them rather than
hardcoding platform names, and MUST tolerate an unknown `platform` value.

A stored row whose platform is no longer in the server registry is dropped from
the response rather than returned without a label, so clients never see a link
with `label: undefined`.

**Not** returned by `GET /event/public-event` — the unauthenticated registration
page does not expose join links. That endpoint runs through the same response
mapper, but its select omits the relation, so it receives `online_links: []`.
The other public routes (`public-register`, `public-validate-member`) return a
different shape and carry no `online_links` key at all. This is a deliberate
boundary, not an oversight.

## Write

### On create

`POST /event/create-event` accepts an optional `links` array:

```json
{ "links": [ { "platform": "zoom", "url": "https://zoom.us/j/999" } ] }
```

Entries with an empty url are ignored here — there is nothing to clear on a new
event. Links are applied to **every occurrence that call creates**, since the
user entered them once for the series being created. Editing them afterwards is
per-occurrence.

### On update

```
PUT /event/online-links?id=<event_id>
guards: protect + manage_events
```

```json
{ "links": [ { "platform": "zoom",    "url": "https://zoom.us/j/999" },
             { "platform": "youtube", "url": "" } ] }
```

- Non-empty `url` → upsert that platform's link.
- Empty `url` → **delete** that platform's link.
- Platform absent from the array → untouched.

All entries are applied in a single transaction, so a partial payload never
leaves half-written state.

Success:

```json
{ "message": "Online links updated successfully",
  "data": { "event_id": 12, "online_links": [ ... ] } }
```

`data.online_links` is the authoritative post-write state, including platforms
the request did not mention.

An absent or empty `links` array is a valid no-op and returns 200 with the
current links unchanged.

`PUT /event/update-event` does **not** accept `links`, and must not be used to
set them. Two reasons: it notifies and SMSes every registrant on any change, and
its `value ? value : existing` merge can never clear a field. On the web client
there is a third — `getChangedValues` drops array-valued keys before the request
is built, so a `links` array would silently never arrive.

## Errors

| Status | `message` | When |
|---|---|---|
| 400 | `A valid event id is required` | `?id=` missing, non-integer, or ≤ 0 |
| 400 | `links must be an array` | `links` present but not an array |
| 400 | `Each online link needs a platform` | entry with a missing or blank platform |
| 400 | `Online platform name is too long` | platform over 32 characters |
| 400 | `Unsupported online platform: <name>` | platform not in the server registry |
| 400 | `Duplicate online link for platform: <name>` | same platform twice in one array |
| 400 | `The <label> link must be a valid http or https URL` | url does not parse as absolute http(s) |
| 400 | `The <label> link is too long` | url over 2048 characters |
| 401 | `Unauthorized` | no valid actor on the request (raised by the handler) |
| 401 | `Not authorized to edit events` | caller lacks `manage_events` (raised by the route guard) |
| 404 | `Event not found` | no event with that id |
| 500 | `Online links failed to update` | unexpected failure |

Note there are **two distinct 401s** with different messages: the route guard's
permission rejection and the handler's missing-actor check. This middleware never
returns 403 — a permission failure is a 401.

`data` is `null` on every 400/401/404. On a 500 it carries the underlying error
message string, so do not assume `data === null` on failure.

Validation order matters if you mirror it client-side: the http(s) check runs
before the length check, so a url that is both invalid and over-length reports
`must be a valid http or https URL`, never `is too long`.

Platform matching is case-insensitive and trimmed, so `"  ZOOM "` resolves to
`zoom`. The `<name>` echoed back in the unsupported- and duplicate-platform
messages is that **normalized** value, not the raw string sent.

Registry lookups test own properties only, so `constructor`, `toString` and
other `Object.prototype` member names are rejected as unsupported rather than
passing the allowlist.

Host validation is **not** enforced server-side — a Zoom link on a vanity domain
is accepted. The web client is planned to show a non-blocking hint when the host
does not look like the platform, but it will never block the save.

## Supported platforms

`zoom`, `youtube`.

Adding one is a single entry in `ONLINE_PLATFORMS` in
`Backend/src/modules/events/onlineLinks.ts` — no migration, no app release. The
web client will keep its own parallel list in
`src/pages/HomePage/pages/EventsManagement/utils/onlinePlatforms.ts` (it needs
field names and host hints the API does not serve), and mobile will keep a
`platform → icon` map with a generic fallback so an unrecognized platform still
renders. **Neither client is built yet** — as of this writing only the Backend
half of this feature exists.

A stored row whose platform is later removed from the registry is dropped from
reads but not deleted from the table, so a client cannot distinguish "no link was
ever set" from "a link exists but its platform was retired".

## Outstanding

These endpoints have **not** been exercised against a running database — the
implementation was verified by typecheck and code review only. Runtime
verification of the upsert/delete semantics, the transaction, and the response
shape is still required before shipping.

Neither `updateOnlineLinks` nor `update-event` scopes its write to a branch the
caller may manage; both check only that the event exists. That gap is
pre-existing across this module's mutate-by-id handlers and is not introduced by
this feature.

`.ics` files produced by `icalExport` do not carry join links — the export uses
its own select. Worth considering as a follow-up, since calendar invites are
where people look for a join URL.
