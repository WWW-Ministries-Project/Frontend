# Device Notifications Backend Contract (Web Push + SSE)

## Scope
- This contract defines what the backend must implement for cross-device notifications (mobile/laptop across OS) used by the frontend.
- Date: March 4, 2026.
- Frontend expects:
  - In-app realtime notifications via SSE (already in use).
  - Device push notifications via Web Push.
  - Explicit user opt-in from Notification Center (`Enable device notifications` button).

## End-to-End Delivery Responsibilities
When a business event creates a notification, backend must:
1. Persist notification in DB.
2. Deliver realtime SSE event to currently connected sessions.
3. Deliver Web Push to all active subscriptions for each recipient user.
4. Maintain unread counters consistent with stored notification rows.

If step 3 fails for one device, backend must still continue delivery to other devices.

## Required APIs
All endpoints require bearer auth.

### 1) `GET /notifications/push/public-key`
Purpose:
- Return VAPID public key used by browser `PushManager.subscribe`.

Success response:
```json
{
  "data": {
    "publicKey": "BElw...base64url..."
  }
}
```

Accepted aliases (frontend supports all):
- `publicKey`
- `public_key`
- `vapidPublicKey`
- `vapid_public_key`
- `key`

Rules:
- Must return base64url VAPID public key.
- Must not return private key.

### 2) `POST /notifications/push/subscribe`
Purpose:
- Register or refresh one browser/device push subscription for the authenticated user.

Request body (exact shape frontend sends):
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "expirationTime": null,
    "keys": {
      "p256dh": "....",
      "auth": "...."
    }
  },
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "expirationTime": null,
  "keys": {
    "p256dh": "....",
    "auth": "...."
  },
  "userAgent": "Mozilla/5.0 ...",
  "platform": "MacIntel",
  "language": "en-US",
  "timezone": "Africa/Accra"
}
```

Success response:
```json
{
  "data": {
    "ok": true
  }
}
```

Rules:
- Upsert by unique `endpoint`.
- Bind subscription to authenticated user.
- If endpoint already exists for another user, reassign only if request is authenticated for that endpoint owner policy; safest default is deactivate old row and create new row for current user.
- Store `keys.p256dh` and `keys.auth`.
- Mark subscription active.
- Update `last_seen_at` and metadata (`userAgent`, `platform`, `language`, `timezone`).

### 3) `POST /notifications/push/unsubscribe`
Purpose:
- Deactivate an existing subscription when user logs out or device unsubscribes.

Request body:
- Same as `subscribe` payload.

Success response:
```json
{
  "data": {
    "ok": true
  }
}
```

Rules:
- Find by `endpoint` and authenticated user.
- Soft-delete/deactivate row (`is_active = false`) to preserve audit trail.
- Return success even if row does not exist (idempotent).

## Push Payload Contract (sent by backend to Web Push service)
Canonical payload backend should send:
```json
{
  "notification": {
    "id": "notif_123",
    "title": "Requisition approved",
    "body": "REQ-104 has been fully approved.",
    "actionUrl": "/home/requests/UkVRLTEwNA==",
    "icon": "/pwa/icon-192.png",
    "badge": "/pwa/icon-maskable-192.png"
  },
  "data": {
    "type": "requisition.final_approved",
    "entityType": "requisition",
    "entityId": "REQ-104",
    "priority": "HIGH",
    "createdAt": "2026-03-04T14:23:10.000Z"
  }
}
```

Notes:
- Frontend service worker can parse either top-level fields or `notification`/`data`.
- `actionUrl` should be app route or absolute URL.
- If omitted, frontend falls back to default notification route.

## Push Send Semantics
For each recipient user:
1. Load all active subscriptions.
2. Send push payload to each subscription independently.
3. Continue even if one subscription fails.

Recommended Web Push options:
- `TTL`: `86400` (24h default).
- `urgency` by priority:
  - `CRITICAL`/`HIGH` -> `high`
  - `MEDIUM` -> `normal`
  - `LOW` -> `low`
- `topic`/collapse key: notification id or dedupe key.

## Error Handling and Subscription Hygiene
When Web Push provider returns:
- `404` or `410`: mark subscription inactive immediately.
- `429`, `500`, `502`, `503`, `504`: enqueue retry with exponential backoff.
- Any crypto/format validation error: mark failed and log payload summary.

Retry requirements:
- At least 3 retries for transient failures.
- Jittered exponential backoff (for example: 30s, 2m, 10m).
- Dead-letter after final failure with error reason.

## Data Model Requirements
Suggested table: `notification_push_subscriptions`

Required columns:
- `id` (uuid)
- `user_id` (fk users)
- `endpoint` (unique)
- `p256dh`
- `auth`
- `expiration_time` (nullable)
- `is_active` (bool, default true)
- `user_agent` (nullable)
- `platform` (nullable)
- `language` (nullable)
- `timezone` (nullable)
- `last_seen_at`
- `last_error_code` (nullable)
- `last_error_message` (nullable)
- `last_error_at` (nullable)
- `created_at`
- `updated_at`

Indexes:
- unique index on `endpoint`
- index on `(user_id, is_active)`

## Security Requirements
- Require auth on all push subscription endpoints.
- Validate endpoint is HTTPS.
- Validate `keys.p256dh` and `keys.auth` are present and non-empty.
- Apply rate limiting per user/IP on subscribe/unsubscribe endpoints.
- Never expose VAPID private key in logs or responses.
- Sanitize log output: store endpoint hash or truncated value for diagnostics.

## SSE + Push Consistency
Backend must keep these synchronized:
- Stored notification row.
- SSE event payload (`notification`, `notification_updated`, `unread_count`).
- Push payload content/title/body/actionUrl.

Unread count source of truth:
- DB notification table (`is_read = false`) per user.

## Frontend Integration Expectations
Frontend currently does this:
- Explicit button in Notification Center requests permission and calls subscribe flow.
- Background connector auto-syncs only if permission already granted.
- Service worker handles:
  - `push` -> `showNotification(...)`
  - `notificationclick` -> open/focus target URL
  - `pushsubscriptionchange` -> asks client to resubscribe

## QA Checklist for Backend
1. Subscribe endpoint stores device and returns success.
2. Unsubscribe endpoint deactivates endpoint idempotently.
3. New notification sends push to all active subscriptions for user.
4. Invalid endpoints (`410/404`) are deactivated automatically.
5. Transient failures are retried and eventually dead-lettered.
6. SSE and push payloads contain matching title/body/actionUrl.
7. Multiple devices for one user all receive notification.
