# Membership redesign — backend contract

Backend branch: `feat/membership-redesign`. Migration:
`prisma/migrations/20261018150000_membership_status_timestamps_and_join_note`.

Every response change is **additive**. No field was renamed or removed, because the mobile app uses these endpoints too.

## 1. `PUT /user/update-user?user_id=` and `department_positions`

Request (unchanged shape):

```jsonc
"department_positions": [
  { "department_id": 3, "position_id": 9 | null | "" | 0, "start_date": "2026-02-01" | null, "end_date": null }
]
```

| Payload | Effect |
| --- | --- |
| field absent | Rows are left as they are (same as before). |
| `[]` | **Clears every row.** Before this change an empty array was ignored. |
| non-empty array | Replaces all rows. The delete and the creates run in a single `prisma.$transaction`, so if a create fails the delete is rolled back. |

- `position_id` set to `null`, `undefined`, `""`, `0` or any non-numeric value is stored as `null`. The column is `Int?`, so a member can belong to a department with no position. Before this change the value went to NaN and the save failed.
- `start_date` and `end_date` are kept when sent. A missing or invalid date is stored as `null`.
- A missing or invalid `department_id`, or the same department listed twice, returns **400** before anything is written.
- `is_user` changes only when the payload sends it explicitly. Department changes never change it.
- `POST /user/register` (`savedDepartments`) uses the same normalisation, and it validates before the user row is created.
- The response `data.department_positions` is the array of created rows. It is `[]` after a clear and `undefined` when the field was absent.

## 2. Membership status timestamps

New nullable columns on `user`: `confirmed_at DateTime?` and `functional_at DateTime?`. Existing rows are not backfilled, so they stay `null`. **Clients should fall back to `member_since` when these are null.**

These values are written on every path that writes `status`:
- `PUT update-member-status`
- `POST update-member-status/bulk`
- `PUT update-user` with `status`
- `POST /user/register` and visitor → member conversion (create)
- children created via `registerChildren`
- membership-request approve (guest → CONFIRMED)

| New status | `confirmed_at` | `functional_at` |
| --- | --- | --- |
| same as current | unchanged | unchanged |
| `UNCONFIRMED` / `null` | `null` | `null` |
| `CONFIRMED` | kept, or now if missing | `null` |
| `MEMBER` | kept, or now if missing | kept, or now if missing |

Both fields are exposed as ISO strings or `null`:
- `GET /user/list-users`: on each item, at the top level.
- `GET /user/get-user`: on `data`, at the top level. They come through automatically from the user row.

## 3. `GET /user/list-users`

New item fields. All existing fields are unchanged.

```ts
gender: string | null
city: string | null
state_region: string | null
nationality: string | null
has_emergency_contact: boolean        // emergency contact name is present (non-blank)
children_count: number                // distinct CHILD family links (either direction) + legacy parent_id children
confirmed_at: string | null
functional_at: string | null
```

For items with `is_restricted: true` (members on the requester's exclusion list), the new personal fields are masked like the existing ones: `gender`, `city`, `state_region`, `nationality`, `has_emergency_contact` and `children_count` are all `null`.

New query params:

- `sort`:
  - `name` (default): `name asc`, as before.
  - `newest`: `user_info.member_since desc` with nulls last, then `created_at desc`, then `id desc`.
  - `oldest`: `user_info.member_since asc` with nulls last, then `created_at asc`, then `id asc`.
  - Unknown values fall back to `name`.
- `include_status_counts=true` adds a top-level `meta` object to the response:

```jsonc
{
  "message": "Operation Successful",
  "current_page": 1, "take": 12, "page_size": 12, "total": 120, "totalPages": 10,
  "meta": { "status_counts": { "all": 130, "UNCONFIRMED": 40, "CONFIRMED": 30, "MEMBER": 50, "inactive": 8 } },
  "data": [ ... ]
}
```

How the counts are computed:
- They use one `groupBy(status, is_active)` with the same filters as the request **except `status` and `is_active`**. The filters still applied are branch, guest exclusion, `is_user`/`ministry_worker`, `department_id`, `membership_type` and search.
- `UNCONFIRMED` counts status `UNCONFIRMED` or `null`. `UNCONFIRMED`, `CONFIRMED` and `MEMBER` count only `is_active = true`.
- `inactive` counts `is_active = false`.
- `all` is the total ignoring status and is_active. Rows with `is_active = null` are counted only in `all`.
- `meta` is absent when the flag is not `true`.

## 4. `GET /user/list-users-light`

Each item adds `is_active: boolean`. A null value in the database is reported as `true`.

## 5. `GET /user/stats-users`

Optional `active_only=true` counts only `is_active = true` users. The default behaviour and the response shape are unchanged.

## 6. Department join requests (`/department-join-request` router)

New column: `department_join_request.note TEXT NULL`.

- `POST /create` with body `{ department_id: number, note?: string }`:
  - `note` is trimmed, and a blank note is stored as `null`.
  - A note longer than **500 characters returns 400** with "Note must be 500 characters or fewer". It is rejected, not truncated.
- `GET /list` takes an optional `department_id` query. For heads of department this stays inside the departments they head: asking for any other department returns `data: []`. Each item adds:

```ts
note: string | null
position_id: number | null
position_name: string | null
start_date: string | null
instructions: string | null
```

- `GET /mine`: each item also adds `note: string | null`.

## 7. `GET /department/get-department`

No change was needed. Each member already includes `is_active`, plus `department_positions[]` with `department_id`, `department_name`, `position_id` and `position_name`.

## 8. Member source (where a member came from)

Migration `20261019120000_member_source_links` adds two nullable columns to `user`: `source_visitor_id INT NULL` (foreign key to `visitor.id`) and `source_soul_won_id INT NULL` (foreign key to `soul_won.id`). Both are indexed and use `ON DELETE SET NULL`.

These conversion paths set the columns:

- `POST /user/register` with `source_visitor_id` or `source_soul_won_id` stores the id on the new user. The existing `visitor.is_member` and `soul_won.memberId` updates are unchanged.
- `POST /visitor/convert-to-member` stores `source_visitor_id` on the created user. The response's `data.parent.source_visitor_id` is also set.

The migration backfills existing records on a best-effort basis. It only fills columns that are still null:

- **Soul won:** every `soul_won` row with a `memberId` sets that user's `source_soul_won_id`. `memberId` is unique, so this is a direct link.
- **Visitor:** a visitor with `is_member = 1` and a non-empty email is linked to the user with the same email. Emails are trimmed and compared case-insensitively. The link is made only when exactly one member visitor and exactly one user have that email. Ambiguous matches and visitors with no match stay null.

### `GET /user/get-user`

`data` adds:

```ts
member_source:
  | null
  | {
      type: "VISITOR";
      visitor: {
        id: number;
        first_visit_at: string | null; // ISO
        last_visit_at: string | null;  // ISO
        visit_count: number;
      };
    }
  | {
      type: "SOUL_WON";
      soul_won: {
        id: number;
        date_won: string | null;          // ISO
        life_center_name: string | null;
        won_by_name: string | null;
      };
    };
```

- If both links are set, `VISITOR` takes precedence.
- `visit_count` is the number of `visit` rows, which matches `visitCount` in the visitor list. When a legacy visitor has no visit rows, the count is 1 if `visitDate` is set and 0 otherwise.
- `first_visit_at` and `last_visit_at` are the earliest and latest dates across the visit rows and the visitor's `visitDate`.
- The raw scalars `source_visitor_id: number | null` and `source_soul_won_id: number | null` also appear on `data`, because get-user spreads the user row.

### `GET /user/list-users`

Each item adds two fields. The raw ids are not included in list items.

```ts
from_visitor: boolean   // source_visitor_id != null
from_soul_won: boolean  // source_soul_won_id != null
```

## 9. Program progress on `GET /user/get-user`

Each `enrolled_programs.items[]` entry adds:

```ts
progress_percent: number  // integer, 0–100
completed_topics: number
total_topics: number
```

- `total_topics` is the number of topics in the enrollment's program. It comes from one grouped `topic` count query covering all enrolled programs.
- `completed_topics` counts the enrollment's `progress` rows where `completed = true` or `status = "PASS"`. Only topics in that program count, and the value is capped at `total_topics`.
- `progress_percent` is `round(completed_topics / total_topics * 100)`. It is `0` when there are no topics.
- If `enrollment.completed` is true, `progress_percent` is `100`. `completed_topics` still reports the actual count.

## 10. Other phone number (`contact_info.other_number`)

`POST /user/register` and `PUT /user/update-user` accept an optional second phone number:

```ts
contact_info: {
  // ...existing fields (email, phone: { country_code, number }, resident_country, state_region, city)
  other_number?: string | null
}
```

- The rules match self-service (`selfServiceController`). The value is stored as digits only, with leading `0`s stripped. It must be 6–15 digits after normalising. Anything else returns `400 { message: "Enter a valid other phone number.", data: null }`.
- If the field is absent, the stored value stays as it is on update. On register it is stored as `null`.
- An empty string or `null` clears the stored value (`null`).
- There is no separate country code. The number shares the context of the member's primary `country_code`.
- `GET /user/get-user` returns it as a top-level `other_number: string | null`, spread from `user_info`.
