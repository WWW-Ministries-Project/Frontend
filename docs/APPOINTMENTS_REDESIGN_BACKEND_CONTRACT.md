# Appointments redesign — backend contract

Endpoints and fields added or changed for the redesigned Appointments pages (manager, availability, analytics, settings). Everything here is additive. Existing clients, including the mobile app, keep working.

Permissions: "manage" means `can_manage_appointments_scoped`, "view" means `can_view_appointments_scoped`, as on the existing routes.

## Booking statuses

`appointment_status` gains `RESCHEDULED`, `DECLINED`, `COMPLETED` and `NO_SHOW`. The full set is:

| Status | Meaning |
|---|---|
| `PENDING` | Waiting for the person booked to reply |
| `CONFIRMED` | Accepted |
| `RESCHEDULED` | The person booked suggested another time. Waiting on the member |
| `DECLINED` | The person booked said no |
| `CANCELLED` | Either side cancelled |
| `COMPLETED` | Happened |
| `NO_SHOW` | The member didn't come |

`PUT /appointment/bookings/:id` and `PUT /appointment/status` keep accepting only `PENDING`, `CONFIRMED` and `CANCELLED`.

## Booking fields

Every booking returned by `GET /appointment/bookings`, `GET /appointment/bookings/:id` and the action endpoint adds:

| Field | Type | Notes |
|---|---|---|
| `reasonId` | `number \| null` | The `appointment_reason` picked. `purpose` stays the label |
| `respondedAt` | ISO string `\| null` | Time of the first accept, suggest or decline |
| `proposedDate` | `YYYY-MM-DD \| null` | Set while `RESCHEDULED` |
| `proposedStartTime` | `HH:MM \| null` | |
| `proposedEndTime` | `HH:MM \| null` | |
| `declineReason` | `string \| null` | One of the decline reasons below |
| `responseMessage` | `string \| null` | Optional note from the person booked, shown to the member |
| `remindedAt` | ISO string `\| null` | Last time an admin reminded the person booked |
| `history` | `{ at, text, tone }[]` | Oldest first. `tone` is `neutral`, `info`, `success`, `warning` or `danger` |

The server writes `history`. Examples of `text`:

- "Requested by Yaw Boateng in the app"
- "Accepted by Pastor Samuel Addo"
- "Kwame Mensah for Pastor Samuel Addo suggested Thu 22 Oct, 10:00 AM"
- "Reminder sent to Pastor Daniel Osei (12 h without a reply)"
- "Overdue: admins alerted"

When an admin acts for the person booked, the text names both ("Kwame Mensah for Pastor Samuel Addo").

`POST /appointment/book` accepts `reasonId`. A caller with manage permission may also send `requesterId` (the member it's booked for) and `status: "CONFIRMED"`. That booking is confirmed straight away, `respondedAt` is set to now, and both sides are notified.

## Booking actions

**`POST /appointment/bookings/:id/actions`**. Allowed for manage, or for the person booked acting on their own booking. Returns the updated booking. Body is one of:

| `action` | Extra fields | Allowed from | Result |
|---|---|---|---|
| `accept` | | `PENDING` | `CONFIRMED`, sets `respondedAt` if empty |
| `reopen` | | `CONFIRMED` within 10 minutes of accepting | `PENDING`. Used by the Undo on the accept toast |
| `suggest` | `date`, `startTime`, `endTime`, `message?` | `PENDING`, `CONFIRMED` | `RESCHEDULED` with the proposed slot. The slot must be free |
| `decline` | `reason`, `message?` | `PENDING` | `DECLINED`. `reason` is one of "Not available then", "Better suited to someone else", "Outside my ministry area", "Other" |
| `cancel` | `message?` | `PENDING`, `CONFIRMED`, `RESCHEDULED` | `CANCELLED` |
| `complete` | | `CONFIRMED`, after the end time | `COMPLETED` |
| `no_show` | | `CONFIRMED`, after the end time | `NO_SHOW` |
| `remind` | | `PENDING`. Manage only | Sets `remindedAt`, sends push and SMS to the person booked |
| `reassign` | `attendeeId` | `PENDING`, `RESCHEDULED`. Manage only | Moves the booking to `attendeeId`, back to `PENDING`, resets `createdAt` for the reply clock. The slot must be free for the new person, otherwise 400 |
| `confirm_proposal` | | `RESCHEDULED`. Manage only | Copies the proposed slot onto the booking, `CONFIRMED` |

Each action appends to `history` and sends the notifications set for its event (see Settings). A wrong state returns 400 with a message that reads well in a toast, for example "This request has already been answered."

## Availability

`GET /appointment/availability` adds per person:

| Field | Type | Notes |
|---|---|---|
| `position` | `string \| null` | The user's position name |
| `bufferMinutes` | `number` | Break between sessions, 0 by default |
| `paused` | `boolean` | No new bookings while true. Existing ones stay |
| `timeOff` | `{ id, from, to, note }[]` | `from` and `to` are `YYYY-MM-DD`, inclusive |

`POST /appointment/availability` accepts `bufferMinutes` at the top level and stores it. Sessions are still sent by the client, already spaced by the break.

- **`PUT /appointment/availability/staff/:userId/pause`** (manage). Body `{ paused: boolean }`. Returns `{ userId, paused }`.
- **`POST /appointment/availability/staff/:userId/time-off`** (manage). Body `{ from, to, note? }`. `to` must be on or after `from`. Returns the entry. Bookings already in that period stay as they are.
- **`DELETE /appointment/availability/time-off/:id`** (manage).

Booking (`POST /appointment/book`), `suggest` and `reassign` reject a slot when the person is paused, on time off that day, inside the minimum notice, or beyond the "book up to" limit. `booking-options` and `availability/status` leave out paused people and days on time off.

## Settings

**`GET /appointment/settings`** (view) and **`PUT /appointment/settings`** (manage). PUT takes any subset and returns the full object.

```json
{
  "replyDeadlineHours": 24,
  "unansweredAfterHours": 72,
  "minNoticeHours": 12,
  "bookAheadDays": 60,
  "reminderHours": 24,
  "cancelCutoffHours": 12,
  "notifications": {
    "new":       { "attendee": ["push", "sms"], "requester": ["push"], "admins": [] },
    "nudge":     { "attendee": ["push", "sms"], "requester": [], "admins": [] },
    "overdue":   { "attendee": ["push"], "requester": ["push"], "admins": ["push", "email"] },
    "accepted":  { "attendee": [], "requester": ["push", "sms"], "admins": [] },
    "suggested": { "attendee": [], "requester": ["push", "sms"], "admins": [] },
    "declined":  { "attendee": [], "requester": ["push", "sms"], "admins": ["email"] },
    "cancelled": { "attendee": ["push", "sms"], "requester": ["push", "sms"], "admins": [] },
    "reminder":  { "attendee": ["push"], "requester": ["push", "sms"], "admins": [] },
    "outcome":   { "attendee": ["push"], "requester": [], "admins": [] }
  }
}
```

Allowed values:

| Field | Values |
|---|---|
| `replyDeadlineHours` | 4, 12, 24, 48 |
| `unansweredAfterHours` | 0 (keep waiting), 48, 72 |
| `minNoticeHours` | 2, 12, 24, 48 |
| `bookAheadDays` | 14, 30, 60, 90 |
| `reminderHours` | 2, 24, 48 |
| `cancelCutoffHours` | 2, 12, 24 |
| channels | `push`, `sms`, `email` |

The values above are the defaults until an admin saves. "Admins" means users with manage permission on Appointments.

## Scheduled jobs

A job runs every 15 minutes:

- **Nudge**: a `PENDING` booking past half the reply deadline gets one `nudge` notification.
- **Overdue**: a `PENDING` booking past the reply deadline gets one `overdue` notification and the history line "Overdue: admins alerted".
- **Unanswered**: when `unansweredAfterHours` is not 0 and a `PENDING` booking is older than that, the member is told and offered other people. The booking stays `PENDING`.
- **Reminder**: a `CONFIRMED` booking `reminderHours` before its start gets one `reminder`.
- **Outcome**: a `CONFIRMED` booking 2 hours after its end gets one `outcome` prompt.

Each notification is sent once per booking. The job records that it was sent.

Members can cancel their own booking (`PUT /appointment/bookings/:id/cancel`) until `cancelCutoffHours` before the start. After that it returns 400: "It's too close to the appointment to cancel here. Call the church office instead."

## Mobile

The mobile app reads `status` from bookings. It should treat the new statuses as follows until it's updated:

- `RESCHEDULED` as pending.
- `DECLINED` as cancelled.
- `COMPLETED` and `NO_SHOW` as past.
