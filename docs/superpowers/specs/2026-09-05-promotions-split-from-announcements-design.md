# Splitting Promotions out of Announcements — Design

**Date:** 2026-09-05
**Repos:** `Backend` (API), `Frontend` (admin dashboard), `wwm-mobile` (Expo/RN client)
**Supersedes the banner half of:** `wwm-mobile/docs/superpowers/specs/2026-08-20-banner-carousel-design.md`

## Problem

The mobile Home carousel shipped by piggybacking on `announcement`: seven
banner columns (`image_url`, `cta_label`, `deep_link`, `sort_order`,
`is_promoted`, `start_date`, `end_date`) were bolted onto the model, a
"Promote on the mobile app's Home carousel" checkbox onto the admin form,
and `DashboardScreen` filtered `GET /announcements/mine` client-side.

Four problems fall out of that coupling:

1. **A banner cannot exist without an inbox item.** Publishing an
   announcement resolves recipients, writes an in-app notification per
   recipient and fires a push. An admin who wants a Home banner has no way
   to get one without also spamming every member's inbox.
2. **Form clutter.** The announcement form carries an audience picker, a
   rich-text editor, an image uploader, a CTA, a deep link, a date window
   and a sort order — two unrelated jobs in one modal.
3. **No lifecycle of its own.** A banner's useful states (draft, scheduled,
   live, expired, retired) do not map onto `DRAFT`/`PUBLISHED`.
4. **Wrong fetch on mobile.** `/announcements/mine` is audience-scoped and
   paginated at `take=20`; a promoted announcement that fell past the first
   page silently vanished from the carousel.

## Goals

1. Promotions are their own entity, end to end: own table, own endpoints,
   own admin page, own mobile query.
2. Publishing a promotion is silent — no recipient resolution, no inbox
   row, no push.
3. The active-banner contract (branch scope, date window, ordering, slide
   cap) lives on the server; the mobile client holds no filtering logic.
4. `announcement` returns to being purely a feed item.

## Non-Goals

- **No FK between `promotion` and `announcement`.** A banner that should
  open an announcement sets `deep_link` to that route. One code path, no
  null-handling on every read.
- **No audience targeting on promotions.** Branch scope only. Banners are a
  marketing surface; the `announcement_audience` machinery (department
  heads, positions, ministry workers) does not follow them.
- **No rich text.** `subtitle` is plain text — the carousel already
  flattened announcement HTML with `stripHtml`, so an editor only ever
  produced markup to throw away.
- **No backfill of existing promoted announcements.** Decided explicitly:
  the seven columns are dropped in the same migration that adds the table.
- **No change to `PromoCarousel` itself.** It already returns `null` on an
  empty slide list, so the rollout gap degrades to "no carousel".

## Data model

```prisma
enum promotion_status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model promotion {
  id           Int              @id @default(autoincrement())
  title        String
  subtitle     String?          @db.Text
  image_url    String?
  cta_label    String?
  deep_link    String?
  sort_order   Int?
  status       promotion_status @default(DRAFT)
  start_date   DateTime?
  end_date     DateTime?
  branch_id    Int?
  created_by   Int
  published_at DateTime?
  created_at   DateTime         @default(now())
  updated_at   DateTime         @updatedAt

  branch  branch? @relation(fields: [branch_id], references: [id])
  creator user    @relation("promotion_creator", fields: [created_by], references: [id])

  @@index([branch_id])
  @@index([status, start_date, end_date])
  @@index([created_by])
}
```

`branch_id = null` means "all branches", matching the announcement
convention. A promotion is live when `status = PUBLISHED` **and** today
falls inside `[start_date, end_date]` (either bound may be null).

Migration `20260905120000_split_promotions_from_announcements` creates the
table and drops the seven banner columns from `announcement`.

## API

Module `src/modules/promotions/` mirrors the announcements module layout
(`promotionRoute.ts` / `promotionController.ts` / `promotionService.ts`).

| Method | Path | Guard |
|---|---|---|
| `GET` | `/promotions` | `can_view_promotions` |
| `GET` | `/promotions/:id` | `can_view_promotions` |
| `POST` | `/promotions` | `can_manage_promotions` |
| `PUT` | `/promotions/:id` | `can_manage_promotions` |
| `POST` | `/promotions/:id/publish` | `can_manage_promotions` |
| `POST` | `/promotions/:id/archive` | `can_manage_promotions` |
| `DELETE` | `/promotions/:id` | `can_delete_promotions` |
| `GET` | `/promotions/active` | `protect` only |

`/promotions/active` is registered before `/:id` so it is not captured as
an id — the same trap the announcement router already documents. It
resolves the caller's `branch_id`, keeps `PUBLISHED` rows inside their
window, orders by `sort_order` ascending (nulls last) then `published_at`
descending, and caps at 3 slides (`?limit=` overrides, max 10).

MySQL sorts nulls first on `ASC` and Prisma's `nulls: "last"` is
Postgres-only, so the ordering runs in JS over at most
`ACTIVE_SCAN_LIMIT = 100` rows rather than in SQL.

Unlike an announcement, whose audience freezes on publish, every field of a
promotion stays editable in every status — it is display-only, so there is
nothing for a frozen audience to protect.

## Permissions

New canonical domain `Promotions` (`view` / `manage` / `admin`), registered
in the backend `Permissions` middleware and `accessLevelController`'s
`OPTIONAL_PERMISSION_KEYS` + normalizer, and in the frontend's
`CANONICAL_PERMISSION_DOMAINS`, aliases, domain metadata and legacy flags
(`view_promotions`, `manage_promotions`).

Access levels saved before this change carry no `Promotions` key, which
would lock every existing admin out of the new page. `DOMAIN_FALLBACKS`
already exists for exactly this case, so `Promotions: ["Announcements"]`
lets whoever administers announcements keep managing banners until the
access level is re-saved with an explicit value.

## Admin UI (`Frontend`)

New route `promotions` under Church Communication, alongside
`announcements` and `sermons`, gated on `view_promotions`:

- `PromotionManager` — list, create, archive, delete. Mirrors
  `AnnouncementManager`.
- `PromotionCard` — thumbnail, title, derived live-state badge, display
  order, window summary. The badge reports **Draft / Scheduled / Live /
  Expired / Archived** rather than the raw status, because "Published" is
  misleading for a banner scheduled next month or already expired.
- `PromotionForm` — title, subtitle, image upload (`usePictureUpload`), CTA
  label, deep link, start/end date, display order, with Save-as-draft and
  Save-&-publish.

`promotions` joins `BRANCH_SCOPED_ENDPOINTS` so the list and create calls
pick up the active branch. The path matches exactly, so `promotions/:id`
updates do not silently rewrite a promotion's branch.

`AnnouncementForm` loses the banner block, the image uploader, the date
helper and the `sort_order` validation; `AnnouncementCard` loses the
"Promoted" badge; `announcements/interfaces.ts` loses the seven fields.

## Mobile (`wwm-mobile`)

- `features/home/types.ts` — `Promotion`.
- `features/home/api.ts` — `normalizePromotion` + `homeApi.activePromotions()`.
- `features/home/queryKeys.ts` — `homeKeys.activePromotions()`.
- `DashboardScreen` — drops `inboxApi`/`inboxKeys`/`normalizeAnnouncement`
  and the whole client-side filter/sort/slice chain; maps the endpoint's
  rows straight to `PromoSlide`. Slide body is `subtitle` rather than
  `stripHtml(content)`. `promotionsQuery` replaces `announcementsQuery` in
  the focus-refetch list and in the section's error branch.
- `features/inbox` — `Announcement` and `normalizeAnnouncement` lose the
  seven banner fields.

A promotion tap passes `entityType: "promotion"`, which no branch of
`notificationToRoute` claims, so the target resolves purely from
`deep_link` via `actionUrlToRoute` — correct, since a promotion has no
detail screen of its own.

## Rollout

Backend → Frontend → Mobile. Between the backend deploy and the mobile
release, installed builds read `is_promoted` off a column that no longer
exists, the filter yields an empty list, and `PromoCarousel` renders
nothing. No crash, no broken layout — just no banner until the client
ships.

After the backend deploy, an admin should re-save each access level that
needs explicit promotion rights; until then the `Announcements` fallback
covers existing announcement admins.

## Verify

- `npx tsc --noEmit` clean in all three repos.
- `npx eslint` clean on every touched file.
- No test runner is configured in any of the three repos.
