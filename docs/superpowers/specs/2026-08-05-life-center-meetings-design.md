# Life Center Meetings — Tabs, Meeting Log, Attendance

Status: draft, pending user review.
Date: 2026-08-05.
Repos touched: Backend (new module), Frontend (admin + member web), wwm-mobile.

## Goal

Give life center leaders a way to log the meetings they run: who came, who came
for the first time, how much offering was gathered, and free-form notes. Every
life center page (admin dashboard, member self-service web, mobile) gets a
second tab, "My Meetings", alongside the existing "Souls Won" tab, showing only
the meetings the current user personally created, with create/edit/delete
gated by the same access rules already used for that surface.

## Non-goals

- No "all meetings across all leaders" admin rollup view — out of scope for
  this iteration; each user's list is their own creations only.
- No multi-currency payment processing — offering amount is a manually-entered
  number with a currency label, not a transaction (contrast with
  `docs/GIVING_OPTIONS_BACKEND_CONTRACT.md`, which is real money movement).
- No new permission domain — reuses the existing `"Life Center"` domain end to
  end.
- Does not touch the existing `meetingDays`/`meetingLocation` fields on
  `life_center` (the weekly recurring-schedule fields) — this is a new, separate
  concept: individual dated meeting *records*.

## Data model (Backend)

Two new tables, following the `event_registers`-style single-join-table-with-flag
pattern rather than two separate attendee tables:

```prisma
model life_center_meeting {
  id              Int      @id @default(autoincrement())
  lifeCenterId    Int
  date            DateTime
  offeringAmount  Decimal  @db.Decimal(10, 2)
  currency        String   @default("GHS")
  note            String?  @db.Text
  createdById     Int
  createdAt       DateTime @default(now())

  lifeCenter      life_center @relation(fields: [lifeCenterId], references: [id])
  createdBy       user        @relation(fields: [createdById], references: [id])
  attendees       life_center_meeting_attendee[]

  @@index([lifeCenterId], map: "life_center_meeting_lifeCenterId_idx")
  @@index([createdById], map: "life_center_meeting_createdById_idx")
}

model life_center_meeting_attendee {
  id            Int      @id @default(autoincrement())
  meetingId     Int
  soulWonId     Int
  isFirstTimer  Boolean  @default(false)

  meeting       life_center_meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  soulWon       soul_won            @relation(fields: [soulWonId], references: [id])

  @@unique([meetingId, soulWonId])
  @@index([meetingId], map: "life_center_meeting_attendee_meetingId_idx")
  @@index([soulWonId], map: "life_center_meeting_attendee_soulWonId_idx")
}
```

Notes:

- `createdById`/`createdBy` naming matches `soul_won.wonById`/`wonBy` — the
  locally-consistent convention in this module (see investigation report),
  not the older snake_case `created_by` used in `event_mgt`.
- `life_center_meeting` has no `branch_id` column, same as `soul_won` — branch
  is derived transitively through `lifeCenter.branch_id`.
- Deleting a `life_center_meeting` cascades its attendee rows. Deleting a
  `soul_won` that has recorded attendance is left at Prisma's default
  (`RESTRICT`) — the existing `deleteSoulWon` endpoint will fail with a FK
  error if that soul has meeting history. This is a deliberate choice (no
  silent loss of attendance history); revisit if it proves annoying in
  practice.
- `offeringAmount` is a plain `Decimal`, not minor units — unlike the Paystack
  contribution tables, this isn't a payment amount going through a gateway, so
  there's no reason to mirror that convention.
- A meeting must have at least one person recorded (attendee or first-timer,
  combined) — enforced in the service layer, not the schema. A meeting with
  zero people and just an offering amount is allowed to fail validation rather
  than silently accepted.

## Authorization (Backend)

Reuses the existing `"Life Center"` permission domain — no new domain, no new
permission strings.

| Action | Check |
|---|---|
| List ("My Meetings") | `can_view_life_center_scoped`, **and** server always filters `where: { createdById: currentUserId }` — this filter is what makes the list "mine", not a separate permission tier. |
| Create | `can_manage_life_center_scoped` (existing middleware: privileged users pass globally; everyone else must have a `life_center_member` row for the `lifeCenterId` in the request body). |
| Update / Delete | `can_manage_life_center_scoped` (update) / `can_delete_life_center` (delete) **and** `meeting.createdById === currentUserId`, unless the caller is a privileged/global-admin user (the existing `isPrivilegedUser` bypass already used elsewhere in `authorization.ts`). |

The ownership check on update/delete exists because `can_manage_life_center_scoped`
only proves "you're on this center's leadership roster somewhere" — it does not
prove the meeting is yours. Without the extra `createdById` check, one leader
could edit or delete another leader's logged meeting on the same life center
purely by guessing/knowing its id, even though they'd never see it in their own
"My Meetings" list. The ownership check closes that gap.

Member-facing surfaces (member web `MyLifeCenter.tsx`, which has no permission
tiers today, and mobile) use the *same* `can_manage_life_center_scoped` check —
i.e., any user with a `life_center_member` row for that specific life center
(any role) can create/edit/delete their own meetings there. This intentionally
does **not** introduce a stricter "designated leader only" concept: there is no
reliable `isLeader` flag in the current schema (role names are free text; the
existing `members[0]` heuristic and the mobile `life_center_leader` boolean are
both acknowledged as imprecise), and building one is out of scope for this
feature. "Any leadership-roster member of this specific center" is the
existing bar for managing Souls Won on the member side, and Meetings follows
the same bar for consistency.

## API contract (Backend, under `/lifecenter`)

| Method & path | Purpose | Auth |
|---|---|---|
| `POST /lifecenter/meeting` | Create a meeting. | `can_manage_life_center_scoped` |
| `PUT /lifecenter/meeting` | Update a meeting (body includes `id`). | `can_manage_life_center_scoped` + ownership |
| `DELETE /lifecenter/meeting?id=` | Delete a meeting. | `can_delete_life_center` + ownership |
| `GET /lifecenter/meetings?lifeCenterId=&page=&take=` | Paginated list, always filtered to `createdById = self`. | `can_view_life_center_scoped` |
| `GET /lifecenter/meeting/:id` | Single meeting with attendees expanded. | `can_view_life_center_scoped` + ownership |
| `GET /lifecenter/soulswon-eligible-first-timers?lifeCenterId=` | Souls won for that center with **zero** prior `life_center_meeting_attendee` rows. Backs the "First timers" dropdown. | `can_view_life_center_scoped` |

The existing `GET /lifecenter/soulswon?lifeCenterId=` (unfiltered) backs the
"Attendees" dropdown — no change needed there.

List envelope matches the assets convention (`{ message, current_page,
page_size, total, totalPages, data }`), not the unpaginated style `soulswon`
currently uses — a personal meeting log can grow indefinitely over years, so
it's worth paginating from day one.

Create/update request body:

```json
{
  "lifeCenterId": 3,
  "date": "2026-08-02",
  "offeringAmount": "150.00",
  "currency": "GHS",
  "note": "<p>Good turnout, two new families.</p>",
  "attendeeSoulWonIds": [12, 14],
  "firstTimerSoulWonIds": [21],
  "newFirstTimers": [
    { "first_name": "Ama", "last_name": "Owusu", "contact_number": "...", "country": "Ghana", "city": "Accra", "date_won": "2026-08-02", "wonById": 7 }
  ]
}
```

Service creates any `newFirstTimers` as real `soul_won` rows first (via the
same path `createSoulWon` uses), then writes the `life_center_meeting` plus one
`life_center_meeting_attendee` row per id in `attendeeSoulWonIds` (`isFirstTimer:
false`) and per id in `firstTimerSoulWonIds` plus the newly-created ids
(`isFirstTimer: true`). `attendeeSoulWonIds` and `firstTimerSoulWonIds` are
disjoint by construction on the client (see Frontend section) but the service
also de-dupes defensively (a soul id in both lists is treated as first-timer).

Response shape (flat, matches the existing `soul_won` style):

```json
{
  "id": 1, "lifeCenterId": 3, "date": "2026-08-02",
  "offeringAmount": "150.00", "currency": "GHS",
  "note": "<p>Good turnout</p>", "createdById": 7, "createdAt": "...",
  "attendees": [
    { "soulWonId": 12, "name": "Jane Doe", "isFirstTimer": false },
    { "soulWonId": 21, "name": "Ama Owusu", "isFirstTimer": true }
  ]
}
```

## Frontend (web)

### API layer

`src/utils/api/lifeCenter/`:

- `interfaces.ts` — add `MeetingType`, `MeetingAttendeeType`, and the Formik
  values type `IMeetingForm`.
- `apiFetch.ts` — add `fetchMeetings`, `fetchMeetingById`,
  `fetchEligibleFirstTimers`.
- `apiPost.ts` — add `createMeeting`.
- `apiPut.ts` — add `updateMeeting`.
- `apiDelete.ts` — add `deleteMeeting`.

### Components

New folder `src/pages/HomePage/pages/LifeCenter/components/Meetings/`:

- `MeetingsList.tsx` — `useFetch(fetchMeetings, { lifeCenterId })`, a "Create
  Meeting" button (opens `MeetingForm` in a `Modal`, same pattern as
  `LifeCenterForm`), and one row per meeting (date, offering, attendee/first-
  timer counts, note preview) with the existing `ActionButton` (View/Edit/
  Delete). Takes an `accessMode: "route" | "membership"` prop (see Access
  below) plus a `canManage: boolean` computed by the parent, so this component
  doesn't need to know which page it's rendered on.
- `MeetingForm.tsx` — Formik form:
  - `date` — native date input, `max` = today, required.
  - `attendees` — `Multiselect` sourced from `fetchSoulsWon` for this life
    center, options filtered to exclude ids currently selected as first-
    timers.
  - `firstTimers` — `Multiselect` sourced from `fetchEligibleFirstTimers`,
    options filtered to exclude ids currently selected as attendees (mutual
    exclusion enforced in both directions, so nobody can be double-counted),
    plus an "Add new first timer" button that opens the existing
    `SoulsWonForm` in a nested `Modal`. On save it calls the existing
    `createSoul`, then appends the new soul to both the local souls-won cache
    and the `firstTimers` selection — no separate light-weight person record
    type, first-timers are always real `soul_won` rows.
  - `currency` — `FormikSelectField`, options `[{label: "Ghana Cedi (GHS)",
    value: "GHS"}, {label: "US Dollar (USD)", value: "USD"}, {label: "British
    Pound (GBP)", value: "GBP"}]`, modeled on
    `Requisitions/components/RequisitionEditorFields.tsx`. Defaults to `"GHS"`.
  - `offeringAmount` — plain `<input type="number" min="0" step="0.01">`,
    required.
  - `note` — `TextEditor` (react-quill-new), wired like `AnnouncementForm.tsx`
    (`setFieldValue` + `setFieldTouched` in `onChange`), but
    `Yup.string().optional()` (not required, per the spec) and sanitized with
    `dompurify.sanitize(values.note)` immediately before the API call, since
    the existing `AnnouncementForm` reference does *not* sanitize on submit
    and this form should not repeat that gap.
  - Submit validation: at least one id across `attendees` + `firstTimers`
    combined (custom Yup `.test`), matching the backend's "must have someone"
    rule.

### Tabs

`TabSelection` (existing component, no new library) added to both:

- `ViewLifeCenter.tsx` — wrap the current two-pane div (Souls Won + Members)
  as the "Souls Won" tab's content; add "My Meetings" as the second tab,
  rendering `<MeetingsList lifeCenterId={id} accessMode="route" />`.
- `MyLifeCenter.tsx` — same two tabs; "Souls Won" tab keeps today's single
  `SoulsWon` panel (no Members pane here, unchanged), "My Meetings" renders
  `<MeetingsList lifeCenterId={...} accessMode="membership" members={lifeCenterData.members} />`.

Selected tab is local `useState` in the parent page, same pattern as
`ViewProgram.tsx`/`MarketDetail.tsx`.

### Access control

| Surface | Create | Edit | Delete |
|---|---|---|---|
| Admin `ViewLifeCenter.tsx` | `canManageCurrentRoute` (`manage_life_center`) | same | `canAdminCurrentRoute` (`admin`) |
| Member `MyLifeCenter.tsx` | `lifeCenterData.members.some(m => m.userId === currentUserId)` | same | same |

The member-side check is new, explicit logic — it does **not** copy
`SoulsWon.tsx`'s existing route-name-matching hack
(`matchRoutes(...).route.name === "member"`), which is a pre-existing wart in
that component and out of scope to fix here.

## Frontend (mobile)

Adds a `Segment` pill switcher ("Souls Won" / "My Meetings") inside the
existing `LifeCenterScreen` rather than a new stack screen — two tabs on one
screen, no new navigation entry, no linking-config change needed.

- `types.ts` — add `Meeting`, `MeetingAttendee`.
- `api.ts` — add `listMeetings`, `getMeeting`, `createMeeting`, `updateMeeting`,
  `deleteMeeting`, `listEligibleFirstTimers`, plus `normalizeMeeting` following
  `normalizeAppointment`'s defensive-coercion shape (`asRecord`/`toText`/
  `toNumber`/snake-and-camel fallbacks) — Life Center's existing raw-passthrough
  style is not extended further.
- `MeetingRecordForm` — new modal screen (`presentationStyle="pageSheet"`),
  mirroring `SoulWonRecordForm`'s structure:
  - Date via the existing `recentDateOptions`/`isIsoDate` chip + manual
    `YYYY-MM-DD` fallback field pattern (no native date picker library exists
    in this app; not introducing one here).
  - Attendees / first-timers: no multi-select component exists on mobile
    today — build one scoped to this form, composed from the existing `Chip`
    component with local `selected: number[]` state and a toggle callback,
    mirroring the "Won By" radio-chip row's structure but allowing multiple.
    "Add new first timer" opens a second nested modal reusing
    `SoulWonRecordForm`'s fields.
  - Currency: 3-option `Segment` (GHS/USD/GBP), defaulting to GHS.
  - Offering amount: numeric `Field`.
  - Note: plain optional multiline `Field` (no rich text exists on mobile;
    not introducing one for this single field).
- Access: `lifeCenter.members.some(m => toText(m.userId) === toText(user.id))`
  gates the "Add"/edit/delete affordances, same rule as member web.

## Validation summary

| Field | Web (Yup) | Backend |
|---|---|---|
| `date` | required, not in the future | required, not in the future |
| `attendees` + `firstTimers` (combined) | at least 1 id total | at least 1 attendee row total |
| `offeringAmount` | required, `>= 0` | required, `>= 0` |
| `currency` | required, one of `GHS`/`USD`/`GBP` | required, one of `GHS`/`USD`/`GBP` |
| `note` | optional | optional |

## Testing / verification

No test runner in any of the three repos — verification is typecheck +
manual QA, per each repo's own conventions:

- **Backend** — `npx tsc --noEmit` (or `npm run build`); manual smoke test of
  the new endpoints (create/list/update/delete, plus the eligible-first-timers
  filter) against a local dev database; verify the new migration applies
  cleanly with `prisma migrate dev`.
- **Frontend (web)** — `npm run lint` (fails on any warning) and `npx tsc
  --noEmit`; manual QA of both tabs on admin `ViewLifeCenter` and member
  `MyLifeCenter`, checking create/edit/delete visibility under a
  manage/admin-permission user, a view-only user, and a plain life-center
  member.
- **Mobile** — `npx tsc --noEmit`; manual QA in Expo (iOS + Android
  simulator) of the new tab switcher, the chip-based attendee/first-timer
  picker, and the leadership-roster gating.

## Rollout order

Per the cross-repo working rules: **Backend first** (migration + module +
routes), then **Frontend web**, then **Mobile**. Backend must be deployed
before either client ships code depending on the new shape. This is additive
(new tables, new routes) — no existing endpoint's response shape changes, so
there's no mobile-breaking risk from the ordering itself, but the new
endpoints simply won't exist yet if a client ships first.

## Open assumptions (flag if any of these are wrong)

1. A life-center member can belong to (and log meetings for) exactly one life
   center at a time — consistent with `fetchLifeCenterByUserId`'s single-record
   response shape.
2. "First timer" eligibility (no prior `life_center_meeting_attendee` row) is
   effectively scoped to one life center anyway, since a `soul_won` row
   belongs to exactly one `lifeCenterId` and can only ever be picked from that
   center's own meetings.
3. Editing a meeting to change its attendee/first-timer lists fully replaces
   the prior attendee rows for that meeting (delete-and-reinsert), rather than
   diffing — simpler, and meeting attendee lists are small.
