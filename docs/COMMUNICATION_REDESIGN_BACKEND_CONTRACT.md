# Communication redesign — backend contract

Endpoints and fields added or changed for the redesigned Communication pages (annual themes, community, promotions, sermons, messaging). Everything here is additive: existing clients, including the mobile app, keep working.

## Annual themes

`PUT /theme/update-theme?id=` now writes only `year`, `title`, `verseReference`, `verse`, `message`, `imageUrl` and `isActive`. Other keys in the body are ignored. The page's "Make current" button sends `{ isActive: true }` on its own.

`verseReference`, `verse` and `message` are optional on create and update. They are stored as `""` when left out.

A year that already has a theme returns 400 with the message "There is already a theme for that year. Edit that one instead."

## Community

- **`isPinned`** is a new post field, set by a manager. Pinned posts sit at the top of the feed until a manager unpins them. Important posts no longer pin themselves for 7 days.
  - The migration pins important posts created in the last 7 days, so the feed looks the same after deploy.
  - On `POST /community/posts`, `isPinned` defaults to `isImportant`.
- **`isImportant`** now only controls the high-priority push and email to the audience.
- **`commentsEnabled`** is a new post field, set by a manager. It defaults to `true`. When it is `false`:
  - `POST /community/posts/:id/comments` returns 400.
  - The web post page shows "Comments are turned off".
- **`POST /community/admin/posts/:id/pin`** (manage). Body `{ pinned: boolean }`. Returns `{ id, isPinned }`. Writes a `PIN` or `UNPIN` audit row.
- **`GET /community/admin/stats`** (view). Returns `{ postsThisWeek, memberPostsThisWeek, prayerRequestsThisWeek, prayerRepliesThisWeek, pendingReview, oldestPendingAt, removedThisMonth }`.
  - Weeks and months are rolling 7 and 30 days.
  - `pendingReview` counts reported posts and comments, not individual reports.
- **`GET /community/admin/posts?q=`** now also matches the real author's name.
- **`GET /community/moderation/audit-log`**:
  - Each row adds `targetAuthorName` and `targetExcerpt`.
  - `action` can also be `PIN`, `UNPIN` or `POST_MESSAGE`. `POST_MESSAGE` is written whenever a church message is posted.

## Promotions

- **`POST /promotions/:id/unpublish`** (manage). Sets the status back to `DRAFT`. Archive is unchanged.
- **`POST /promotions/reorder`** (manage). Body `{ ids: number[] }`. Sets `sort_order` to 1, 2, 3 and so on, in the order given. The page sends every live promotion after each arrow press.

## Sermons

- **`preached_at`** is a new `DATE` column, sent and returned as `YYYY-MM-DD`.
  - It is accepted by `POST /sermons` and `PUT /sermons/:id`. Sending `null` clears it.
  - It can be a future date, for a planned sermon.
  - The migration fills it from `published_at`, or from `created_at` when there is no `published_at`.
  - `GET /sermons` sorts by `preached_at DESC`, then `created_at DESC`.

## Messaging

- **`GET /messaging/overview?days=30`** (view). Returns `{ days, messagesSent, delivered, failed, deliveryRate, smsSegmentsUsed }`.
  - Only one-off (`GENERAL`) messages are counted. Automatic messages report their numbers through `/messaging/stats`.
  - `deliveryRate` is a percentage with one decimal, or `null` when nothing was attempted.
- **`GET /messaging/dispatches`** changes:
  - It accepts `filter=all|scheduled|sent|failed`. `sent` includes messages still sending (`QUEUED`). `failed` means at least one recipient failed.
  - The count for each filter is returned in `facets` and in `meta.status_counts`.
  - Each row adds `audienceLabel`: "Whole church", a department name, "Departments (n)" or "n people".
