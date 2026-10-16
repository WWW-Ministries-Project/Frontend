# Realtime: web dashboard moves from SSE to socket.io

Date: 2026-10-16
Repos: Frontend (this spec), Backend (SSE removal, last phase)
Depends on: Backend realtime core — Backend `docs/superpowers/specs/2026-10-16-realtime-sockets-core-design.md`,
client contract Backend `docs/REALTIME_EVENTS.md` (Backend PR #483).

## Goal

The dashboard gets its live notifications over the new socket.io server instead of the
`GET /notifications/stream` SSE stream, and reacts to the new session events: permission
changes apply without a reload, and a deactivated or revoked account is signed out of every
tab. Once the dashboard runs on sockets in production, the SSE stream is deleted from the
backend.

This is sub-project 2 of 4 of the realtime work (1 backend core, 2 web, 3 mobile, 4 feature
events).

## Decisions

| Topic | Decision |
|---|---|
| Multi-tab | Keep the existing leader election. The leader tab owns one socket; followers get updates through the existing BroadcastChannel / localStorage relay and snapshot. One socket per browser, so the server's 10-sockets-per-user cap is never approached. |
| Transport | `socket.io-client@4.8.1`, `transports: ["websocket"]`, `path: "/socket.io"`, session JWT (the `token` cookie) in `auth.token`. No long-polling transport — the existing 60 s REST polling fallback covers networks that block websockets. |
| Missed events | socket.io connection-state recovery (2 min). A connect with `socket.recovered === false` runs the forced REST sync after a random 0–3 s delay. The last-event-id bookkeeping is removed. |
| Session events | In scope. `session.changed` refetches the current user and permissions; `session.revoked` and `ACCOUNT_INACTIVE` sign out. |
| SSE removal | Separate Backend PR, shipped only after this dashboard change is live in production. |

## Components

All under `src/features/notifications/` unless noted.

### `notificationSocket.ts` (new)

The transport, nothing else — no store access.

```ts
type RealtimeStatus = "connected" | "disconnected";
type RealtimeEvent = { name: string; body: Record<string, unknown> };

openNotificationSocket(options: {
  origin: string;                 // API origin, e.g. https://dashboard.worldwidewordministries.org
  token: string;                  // session JWT from the cookie
  onEvent: (event: RealtimeEvent) => void;
  onStatus: (status: RealtimeStatus, info: { recovered: boolean }) => void;
  onFatal: (code: string) => void; // auth rejection: stop and sign out
}): { close: () => void };
```

- `io(origin, { path: "/socket.io", transports: ["websocket"], auth: { token } })`, socket.io's
  default reconnect backoff.
- `socket.onAny` forwards every server event as `{ name, body }`.
- `connect` → `onStatus("connected", { recovered: socket.recovered })`;
  `disconnect` → `onStatus("disconnected", …)`.
- `connect_error` with `err.data.code`:

| Code | Action |
|---|---|
| `TOKEN_MISSING`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `ACCOUNT_INACTIVE` | `socket.disconnect()` (stops reconnecting), then `onFatal(code)` |
| `SERVER_ERROR`, or no code (network, server without sockets yet) | nothing — socket.io keeps retrying |

### `NotificationRealtimeConnector.tsx` (changed)

Keeps: leader election and lease, cross-tab relay, snapshot, visibility / online / offline
handling, session teardown, the 60 s REST polling fallback.

Changes inside `connect()` and the event wiring:

- `connect()` calls `openNotificationSocket` with the cookie token and the realtime origin,
  replacing the stream-token fetch and the `EventSource`.
- `onStatus("connected")`: `setConnected(true)`, stop the polling fallback; if not recovered,
  forced `syncFromApi` after a random 0–3 s delay.
- `onStatus("disconnected")`: `setConnected(false)`, start the polling fallback.
- `onFatal`: dispatch `app:session-expired` (the existing logout path in `AuthWrapper`).
- `onEvent` dispatch table — same store actions and relay as today:

| Event | Handling |
|---|---|
| `notification`, `notification_updated` | `ingestNotificationPayload(body, "realtime")` + `applyUnreadCountPayload` |
| `notifications_read_all` | `applyReadAllFromServer` |
| `notifications_cleared` | `applyClearAllFromServer` |
| `notifications_deleted` (new) | `applyDeletedFromServer` |
| `unread_count` | `applyUnreadCountPayload` |
| `session.changed` | `handleSessionChanged` (see below) |
| `session.revoked` | `handleSessionRevoked` |
| anything else | ignored |

Every handled event is relayed to follower tabs and folded into the snapshot exactly as SSE
events are today; followers run the same handlers.

Removed: stream-token fetch, `EventSource` setup, `onmessage` fallback, last-event-id storage
(`NOTIFICATION_LAST_EVENT_ID_KEY`), hand-written reconnect backoff, `connected` / `heartbeat`
SSE handlers.

### `sessionRealtime.ts` (new)

- `handleSessionChanged()`: debounced 500 ms; fetches `user/current-user`
  (`api.fetch.fetchCurrentUser`), merges with the current user via
  `mergeUserPermissionSources`, `useUserStore.getState().setUser(...)`. A failed fetch is
  ignored — the next 401/403 handles it.
- `handleSessionRevoked()`: dispatches `app:session-expired`, which runs `logout()` →
  `clearAuthSession()` (all tabs) → `/login`.

`mergeUserPermissionSources` is moved out of `LoginPage.tsx` into
`src/utils/userPermissions.ts` (exported, unchanged) so both places use it.

### Store — `src/store/useInAppNotificationStore.ts`

- Ingest source literal `"sse"` → `"realtime"`; toast / sound / browser-notification behaviour
  unchanged.
- New `applyDeletedFromServer(payload)`: removes the notifications whose ids are in
  `payload.ids` (string ids compared as strings), applies `payload.unreadCount`, decrements
  `totalCount` by `payload.deleted`.

### `src/axiosInstance.js`

Add `"account inactive"` to the session-expired message list, so the backend's
401 `Account inactive` signs the user out instead of routing to access-denied.

### `utils.ts`

- Delete `parseNotificationStreamToken`, `resolveNotificationSseUrl`, `DEFAULT_SSE_PATH`.
- Add `resolveRealtimeOrigin(baseUrl)`: `new URL(baseUrl).origin`; `null` when unparsable
  (the connector then stays on polling).

### `src/utils/api/apiFetch.ts`

Delete `fetchNotificationsStreamToken`.

### Docs

`docs/NOTIFICATION_ACTION_URLS_AND_TRIGGERS.md` and `docs/DEVICE_NOTIFICATION_BACKEND_CONTRACT.md`:
replace the SSE sections with socket.io, pointing at Backend `docs/REALTIME_EVENTS.md`.

## Data flow

1. A tab wins the lease → `openNotificationSocket(token)`.
2. Server events → `onEvent` → store action → cross-tab relay → snapshot.
3. Disconnect → polling fallback until the next `connect`.
4. Hidden or offline leader → socket closed, lease released (unchanged behaviour); the next
   visible tab takes the lease and connects.
5. `userId` / token change → the effect re-runs: old socket closed, new one opened. Sign-out
   closes it through the existing teardown.

Two leaders can overlap for up to the 12 s lease staleness — two sockets briefly; store
updates are idempotent, so this is harmless.

## Compatibility and rollout

- New dashboard against a backend without sockets: handshake fails with no code → retries,
  polling fallback serves notifications. Same as SSE outages today.
- Old dashboard against a backend without SSE: broken. Hence SSE removal ships last.

Order:

1. Backend PR #483 merged → deploys to dev (`dev.worldwidewordministries.org`); Nginx
   `/socket.io/` block added on the dev host.
2. This Frontend change: branch `feat/realtime-socket` from `development`, PR into
   `development`, verified on dev.
3. Production release of both (Backend `production` branch + Nginx on the dashboard host;
   Frontend's normal release).
4. Backend PR `feat/remove-notification-sse` (below).

## Phase 2 — Backend SSE removal

After step 3 is live and prod logs show no `notifications/stream-token` requests for a week:

- Delete `GET /notifications/stream`, `GET /notifications/stream-token`, `streamAuth`,
  `notificationStreamAuth.ts`, the SSE client registry, heartbeat, replay buffer and
  `NOTIFICATIONS_SSE_TOKEN_TTL_SECONDS` handling.
- `broadcastToUser` keeps only the socket emit (rename to `publishToUser`).
- Remove the "During migration" note from `docs/REALTIME_EVENTS.md`.
- `realtimeAuth`'s `purpose`-claim refusal stays (harmless, defensive).

## Verification

There is no test runner in this repo (by policy). Every change passes `npx tsc --noEmit`,
`npm run lint` (zero warnings) and `npm run build`.

Browser checks on dev:

1. Log in: one `websocket` connection to `/socket.io`; badge shows the unread count.
2. New notification for the user: toast and sound once, in one tab; other tabs' badges update.
3. Mark one read, read all, clear all, delete one: every tab updates.
4. Change the user's access level from a second admin: permissions update without reload.
5. Deactivate a test admin: every tab lands on `/login`.
6. Go offline, come back: polling covers the gap, then the socket reconnects and syncs.
7. Hide the leader tab: another tab takes the lease and connects.

## Done when

- tsc, lint and build pass.
- The seven browser checks pass on dev.
- No `EventSource`, `stream-token` or `notifications/stream` left in Frontend `src`.
- Both notification docs updated.
- Phase 2 shipped after the production soak.

## Out of scope

- Feature events (community, rides, appointments, live) — sub-project 4.
- Mobile client — sub-project 3.
- Token versioning / "sign out other devices".
