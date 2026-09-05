# Life Center Meeting Export — Design

**Date:** 2026-09-05
**Repos touched:** Backend, Frontend, wwm-mobile

## Problem

The Life Center meeting view lists meetings (date, offering, attendee counts, notes) and,
on opening a meeting, its attendee roster. There is no way to take that data out of the
app. Leaders and admins need it as a document — PDF for circulation, DOCX for editing,
a spreadsheet for analysis.

## Requirements

- A Download action in the meeting view of all three clients: admin portal, member
  portal, and the mobile app.
- Triggering it opens a modal to choose the date range to export.
- Choosing a format from that modal downloads PDF, DOCX, or a spreadsheet.
- All document generation happens on the backend. Clients only pick a range and a
  format, then save the bytes they get back.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Spreadsheet format | Real `.xlsx` via `exceljs` | Typed cells, styled header, separate Meetings/Attendees sheets. CSV would flatten both sheets into one and stringify dates and amounts. |
| Duration UI | Presets + custom range | Presets cover the common case in one tap; the From/To pair keeps arbitrary windows reachable. |
| Export contents | Summary + attendee rosters | Matches everything the view already exposes, including the roster behind each meeting. |
| Data scope | Current life center, same visibility as the list | The export must not widen what a caller can read. |

## Architecture

### Backend — the sole document generator

**Endpoint**

```
GET /lifecenter/meetings/export
    ?lifeCenterId=<int>      required, positive integer
    &from=<YYYY-MM-DD>       optional, inclusive
    &to=<YYYY-MM-DD>         optional, inclusive
    &format=pdf|docx|xlsx    required

guard: permissions.can_view_life_center_scoped   (same as GET /lifecenter/meetings)

200 → binary body
     Content-Type per format
     Content-Disposition: attachment; filename="<name>.<ext>"
400 → { message } on invalid lifeCenterId, format, or date range
```

Omitting both `from` and `to` exports all time. Supplying one bounds only that end.
`from > to` is a 400. Dates parse as calendar days: `from` becomes start-of-day,
`to` becomes end-of-day, so a same-day range returns that day's meetings.

**Data scope.** The `where` clause is the list endpoint's clause plus the date range:

```ts
{ lifeCenterId, createdById: <caller id>, date: { gte?, lte? } }
```

No new data becomes reachable through this endpoint.

**Shared extraction.** `generatePdfBufferFromHtml`, `resolveChromiumExecutablePath`, and
the logo-buffer loading are private to `eventReportService.ts` (~2000 lines). They move to
`src/utils/documentRenderer.ts`; `eventReportService` imports them from there, and so does
the new service. The alternative — copying a 60-line Puppeteer launch block carrying
container-specific flags into a second file — leaves two copies to keep in sync.

**New module** `src/modules/lifeCenterMangement/lifeCenterMeetingExportService.ts`:

- `buildMeetingExportPayload({ lifeCenterId, createdById, from, to })` — one query,
  returning life center name, a human range label, meeting rows, per-meeting attendee
  rows, and totals (meetings, attendees, first-timers, offering summed per currency).
- `renderXlsx(payload)` — exceljs workbook, sheets *Meetings* and *Attendees*.
- `renderDocx(payload)` — `docx` package.
- `renderHtml(payload)` → `generatePdfBufferFromHtml` for PDF.
- `exportMeetings(params)` — validates, builds the payload once, dispatches on format,
  returns `{ buffer, contentType, fileName }`.

`LifeCenterMeetingController.exportMeetings` sets the headers and sends the buffer.

**Filename:** `<life-center-slug>-meetings-<from>-to-<to>.<ext>`, `all-time` when unbounded.

**Document contents** — the same in every format:

1. Header: life center name, range, generated-on timestamp.
2. Summary table: Date, Offering, Currency, Attendees, First timers, Note.
3. Attendee rosters, grouped per meeting: Name, Phone, Gender, Type.
4. Totals.

**New dependency:** `exceljs`.

### Frontend — one component, both portals

`MeetingsList.tsx` is rendered by both `ViewLifeCenter` (admin) and `MyLifeCenter`
(member portal), so the change lands once.

- `apiFetch.ts` — `downloadLifeCenterMeetings(query)`, a blob GET reusing the existing
  `extractFileNameFromDisposition` and `downloadBlobFile` helpers.
- `components/Meetings/MeetingExportModal.tsx` — preset chips (This month, Last 3 months,
  This year, All time) that fill the From/To inputs, which stay editable; then three
  format buttons. In-flight state disables the buttons; failures surface through
  `showNotification`.
- `MeetingsList.tsx` — a Download control beside Create Meeting. `HeaderControls` has no
  secondary-action slot; the button sits in a row next to it rather than growing that
  shared component's prop surface for a single caller.

The control is visible to anyone who can see the list — it exports only what they can
already read.

### Mobile

- `features/lifecenter/api.ts` — `exportMeetings(...)` via the axios client with
  `responseType: "arraybuffer"`, written with `expo-file-system`, then passed to
  `expo-sharing.shareAsync`. The OS share sheet is how a file reaches the user on iOS and
  Android; there is no download folder to write into.
- `features/lifecenter/components/MeetingExportSheet.tsx` — same presets and formats,
  native modal, `DateTimePicker` for the custom range.
- `LifeCenterScreen.tsx` — Download action in the *My Meetings* tab header.

Additive only. No existing endpoint shape changes, so installed binaries are unaffected.

## Error handling

- Invalid `lifeCenterId`, `format`, or range → 400 with a message the clients display.
- Empty range → still a valid document, rendered with a "No meetings in this period" note,
  rather than an error. Downloading an empty period is a legitimate answer.
- Puppeteer launch failure → `InternalServerError` carrying the real cause, as the event
  report path already does.
- Clients show the backend's message through their normal notification path and leave the
  modal open so the range can be adjusted.

## Verification

No test runner exists in any of the three repos.

- Backend — `npx tsc --noEmit`
- Frontend — `npm run lint` (fails on any warning) and `npx tsc --noEmit`
- Mobile — `npx tsc --noEmit`

Plus a manual pass per client: export each of the three formats over a preset range and a
custom range, and confirm the file opens.

## Out of scope

`getMeetings` filters by `createdById: <caller>`, so the meeting list shows only meetings
the caller personally created — an admin opening a life center does not see meetings
logged by its leader. The export matches that scoping deliberately, so the document agrees
with the screen. The scoping itself looks like a pre-existing bug rather than intent, but
changing it would alter what the existing list returns and belongs in its own ticket.

## Delivery

One branch, one commit, one PR per repo. Backend lands and deploys before either client
ships, since both depend on the new endpoint.

| Repo | Branch | PR target |
|---|---|---|
| Backend | `feat/life-center-meeting-export` | `main` |
| Frontend | `feat/life-center-meeting-export` | `development` |
| Mobile | `codex/life-center-meeting-export` | `dev` |
