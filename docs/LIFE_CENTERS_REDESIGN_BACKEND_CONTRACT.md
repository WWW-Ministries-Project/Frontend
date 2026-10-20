# Life Centers redesign — backend contract

What the redesigned Life Centers pages (list, detail, analytics, member-portal
leader view) need from `lifecenter/*`. Everything is additive unless marked
**changed**. Dates are `YYYY-MM-DD` strings unless noted. Branch-scoped reads
take the usual `branch_id` query (omitted = all branches).

## Data model

- `life_center.createdAt DateTime @default(now())`. Scheduled meetings are
  counted from this day, so the migration backfills existing rows to the
  earliest of their first meeting date and first soul-won date (else the
  migration time).
- `life_center.lastRemindedAt DateTime?` for the reminder cooldown.
- New `life_center_meeting_member (id, meetingId, userId, @@unique([meetingId, userId]))`
  — members who came to a meeting. Cascade-deletes with the meeting. Keyed by
  user, so removing someone from a center keeps their past attendance.
- Built-in roles `Leader`, `Assistant leader` and `Member` exist (matched
  case-insensitively; the migration inserts any that are missing).
  `Leader` and `Member` can't be deleted.
- One leader per center: anything that makes someone `Leader` moves the
  current leader to `Assistant leader`.

## Reads

### `GET lifecenter/overview?from&to[&lifeCenterId]` — new
Scope: `can_view_life_center_scoped` (leaders get only their centers).
Feeds the list page and analytics. `from`/`to` bound `meetings` and `souls`.

```ts
{
  roles: { id: number; name: string; member_count: number }[];
  centers: {
    id: number; name: string; description: string; location: string;
    meeting_days: string[];            // "Wednesday", …
    created_at: string;
    leader: { user_id: number; name: string } | null;
    member_count: number;
    souls_total: number;               // all time
    souls_to_follow_up: number;        // all time, not yet members
    last_meeting_date: string | null;  // all time
    recent_meetings: { date: string; members: number; first_timers: number }[]; // last 8, newest first
  }[];
  meetings: {
    id: number; life_center_id: number; date: string;
    member_user_ids: number[]; first_timer_ids: number[];
    offering: number; currency: string;
  }[];
  souls: { id: number; life_center_id: number; date_won: string; converted: boolean }[];
}
```

### `GET lifecenter/get-lifecenter?id` — additive
Leaders may only read their own center.
- `created_at`, `leader: { user_id, name } | null`
- `members[]`: `phone` (user's primary number or null), `attended` and `of`
  (meetings attended out of the center's last 10).
- `soulsWon[]`: `gender`, `first_meeting_date` (first meeting they came to as a
  first-timer, or null).

### `GET lifecenter/meetings?lifeCenterId&page&take` — **changed**
No longer limited to meetings the caller created; scoped like the other reads.
`take` up to 500. Each meeting adds `day` (`YYYY-MM-DD`),
`members: { user_id, name, role }[]` and `created_by: { id, name } | null`.
`attendees` (souls) is unchanged. `GET lifecenter/meeting` returns the same
shape and uses the same scope instead of creator-only.

### `GET lifecenter/get-roles` — additive
Each role adds `member_count` (people holding it across all centers).

## Writes

### `POST/PUT lifecenter/meeting` — additive
- `memberUserIds: number[]` — members who came.
- `newFirstTimers[]` only needs `first_name`, `last_name`, `contact_number`;
  `country` defaults to `""`, `city` to the center's location (first part),
  `date_won` to the meeting date, `wonById` to the leader (else the caller).
- A meeting needs at least one member or first-timer (400
  `"A meeting needs at least one member or first-timer."`).
- `memberUserIds` must be current members of the center, or already on that
  meeting (so people who left keep their past attendance).
- One meeting per center per day: duplicate → 409
  `"A meeting is already recorded for this date."`
- Update/delete are allowed for anyone whose scope covers the center (not only
  the creator). Delete keeps its admin permission.

### `POST lifecenter/create-lifecenter` — additive
`leaderUserId?: number` adds that member as `Leader`. Response includes `id`.

### `PUT lifecenter/update-lifecenter` — additive
`leaderUserId?: number` makes that person leader (adding them if needed); the
previous leader becomes `Assistant leader`.

### `DELETE lifecenter/delete-lifecenter` — **changed**
Removes the center with its members, meetings and souls-won records in one
transaction (users converted from those souls keep their membership; the link
is cleared).

### `POST add-lifecenter-member` / `PUT update-member-role` — **changed**
Giving someone `Leader` moves the current leader to `Assistant leader`.

### `DELETE lifecenter/delete-role` — **changed**
400 for `Leader`/`Member`. People holding the role become `Member` first.

### `POST lifecenter/remind-leader` — new
Body `{ lifeCenterId: number, reason: "overdue" | "irregular" | "attendance" }`.
Permission `can_manage_life_center`. Sends the leader an in-app/push
notification asking them to record or check on meetings
(action URL `/member/life-center`). One reminder per center per 24h → 429
`"A reminder was already sent to this leader today."`; no leader → 400
`"This life center has no leader to remind."`. Returns
`{ sent_to: string }`.
