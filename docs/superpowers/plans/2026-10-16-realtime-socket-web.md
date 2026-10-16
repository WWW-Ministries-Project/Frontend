# Realtime: Dashboard SSE → socket.io Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The dashboard receives notifications and session events over socket.io instead of the SSE stream, keeping its multi-tab leader election.

**Architecture:** A new transport module (`notificationSocket.ts`) owns one socket.io-client connection and knows nothing about stores. The existing `NotificationRealtimeConnector` keeps leader election, cross-tab relay, snapshots and the REST polling fallback, and swaps EventSource for the transport. A small `sessionRealtime.ts` turns session events into a current-user refetch or a logout.

**Tech Stack:** Vite 7, React 18, TypeScript (strict), Zustand, axios, socket.io-client 4.8.1.

**Spec:** `docs/superpowers/specs/2026-10-16-realtime-socket-web-design.md`

---

## Ground rules for the implementer

- Branch `feat/realtime-socket` (from `development`). PR target: `development`.
- **There is no test runner and none may be added** (repo policy, see `CLAUDE.md`). Every task ends with the gate:
  `npx tsc --noEmit && npm run lint && npm run build` — all must exit 0 (`lint` allows zero warnings).
- Hand-formatted code: no mass reformatting. Use the Edit tool for changes, not `sed`.
- Commit after every task; end each message with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `.husky/pre-commit` runs lint-staged once `npm ci` has installed husky; let it run.

## socket.io-client facts this plan relies on

- A handshake rejected by server middleware (`next(err)` → `connect_error` with `err.data`) leaves `socket.active === false`: **the client does not retry by itself**. Same after a server-initiated disconnect (reason `"io server disconnect"`). Network failures keep `socket.active === true` and retry automatically.
- `socket.recovered` is `true` when connection-state recovery restored the session (missed events replayed).
- Server rejection codes (`err.data.code`): `TOKEN_MISSING`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `ACCOUNT_INACTIVE` (sign out), `SERVER_ERROR` (retry).

## File map

| File | Change |
|---|---|
| `package.json`, `package-lock.json` | add `socket.io-client@4.8.1` |
| `src/utils/userPermissions.ts` | new — `mergeUserPermissionSources` moved out of LoginPage |
| `src/pages/Authentication/pages/LoginPage/LoginPage.tsx` | import the moved helper |
| `src/store/useInAppNotificationStore.ts` | `"sse"` → `"realtime"`; new `applyDeletedFromServer` |
| `src/features/notifications/utils.ts` | add `resolveRealtimeOrigin`; delete SSE helpers (Task 7) |
| `src/features/notifications/notificationSocket.ts` | new — transport |
| `src/features/notifications/sessionRealtime.ts` | new — session event handlers |
| `src/features/notifications/NotificationRealtimeConnector.tsx` | EventSource → transport |
| `src/features/notifications/realtimeStorageKeys.ts` | comment on the retired last-event-id key |
| `src/utils/api/apiFetch.ts` | delete `fetchNotificationsStreamToken` |
| `src/axiosInstance.js` | `"account inactive"` logs out |
| `docs/NOTIFICATION_ACTION_URLS_AND_TRIGGERS.md`, `docs/DEVICE_NOTIFICATION_BACKEND_CONTRACT.md` | SSE → socket.io |

---

### Task 1: Install and baseline

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1:** `npm ci`
- [ ] **Step 2:** `npm install socket.io-client@4.8.1`
- [ ] **Step 3: Gate** — `npx tsc --noEmit && npm run lint && npm run build`. Expected: all exit 0. If the baseline already fails on `development`, STOP and report the errors (do not fix unrelated code).
- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(realtime): add socket.io-client"
```

---

### Task 2: Move `mergeUserPermissionSources` to a shared module

The live permission refresh (Task 6) needs the same merge the login page uses. Pure move — behaviour unchanged.

**Files:**
- Create: `src/utils/userPermissions.ts`
- Modify: `src/pages/Authentication/pages/LoginPage/LoginPage.tsx`

- [ ] **Step 1: Create `src/utils/userPermissions.ts`** and move these declarations **verbatim** out of `LoginPage.tsx` (current line numbers in brackets):
  - `type PermissionCandidate` [39]
  - `const USER_PROFILE_FIELDS` [46–62]
  - `const asRecord` [70–74]
  - `const collectCandidateRecords` [75–101]
  - `const extractPermissionsFromRecord` [111–137]
  - `const extractPermissionSources` [138–171]
  - `const extractUserProfileFromSources` [172–200]
  - `const mergeUserPermissionSources` [201–228]

  Add `import type { userTypeWithToken } from "@/utils/interfaces";` (and any other type the moved code references — check `USER_PROFILE_FIELDS`' type annotation). Export `mergeUserPermissionSources`. If `extractTokenFromPayload` [102–110], which stays in `LoginPage.tsx`, uses `asRecord` or `collectCandidateRecords`, export those too and import them back. Top-of-file comment:

```ts
/**
 * Merges the user profile and permissions from the decoded session token and
 * any API payloads (login response, `user/current-user`). Shared by login and
 * the realtime `session.changed` refresh so both build the user the same way.
 */
```

- [ ] **Step 2: LoginPage** — delete the moved declarations and add
  `import { mergeUserPermissionSources } from "@/utils/userPermissions";` (plus any helper exported in Step 1 that it still uses). Remove imports that become unused.

- [ ] **Step 3: Gate.** Expected: exit 0.
- [ ] **Step 4: Commit**

```bash
git add src/utils/userPermissions.ts src/pages/Authentication/pages/LoginPage/LoginPage.tsx
git commit -m "refactor(auth): share mergeUserPermissionSources"
```

---

### Task 3: Store — realtime source name and deleted notifications

**Files:** Modify `src/store/useInAppNotificationStore.ts`

- [ ] **Step 1: Rename the ingest source** (line ~31):

```ts
type NotificationIngestSource = "realtime" | "broadcast" | "fetch" | "manual";
```

and in `ingestNotificationPayload` change the default and the toast condition:

```ts
    ingestNotificationPayload: (payload, source = "realtime") => {
```

```ts
      if (source === "realtime" || source === "broadcast") {
```

The connector passes `"sse"` twice (`ingestNotificationPayload(payload, "sse")` in `onNotificationEvent` and `onConnectedEvent`); change both to `"realtime"` in this task so it keeps compiling. `grep -rn '"sse"' src` must then print nothing.

- [ ] **Step 2: Interface** — add next to `applyClearAllFromServer`:

```ts
  applyDeletedFromServer: (payload?: unknown) => void;
```

- [ ] **Step 3: Implementation** — add after `applyClearAllFromServer`:

```ts
    applyDeletedFromServer: (payload) => {
      const record =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : {};
      const ids = new Set(
        (Array.isArray(record.ids) ? record.ids : []).map((id) => String(id))
      );
      if (!ids.size) return;

      const parsedUnreadCount = parseUnreadCount(payload);
      const parsedDeleted = parseOptionalNonNegativeInteger(record.deleted);

      set((state) => {
        const removed = state.notifications.filter((notification) =>
          ids.has(String(notification.id))
        );
        const removedUnread = removed.filter((notification) => !notification.isRead).length;

        return {
          notifications: state.notifications.filter(
            (notification) => !ids.has(String(notification.id))
          ),
          unreadCount:
            parsedUnreadCount === null
              ? Math.max(0, state.unreadCount - removedUnread)
              : parsedUnreadCount,
          totalCount: Math.max(0, state.totalCount - (parsedDeleted ?? removed.length)),
        };
      });
    },
```

(`parseUnreadCount` and `parseOptionalNonNegativeInteger` already exist in this file.)

- [ ] **Step 4: Gate.** Expected: exit 0.
- [ ] **Step 5: Commit**

```bash
git add src/store/useInAppNotificationStore.ts src/features/notifications/NotificationRealtimeConnector.tsx
git commit -m "feat(notifications): realtime ingest source and server-side deletes"
```

---

### Task 4: `resolveRealtimeOrigin`

**Files:** Modify `src/features/notifications/utils.ts`

- [ ] **Step 1:** Add after `resolveNotificationSseUrl` (it is deleted in Task 7):

```ts
/**
 * Origin of the API host. socket.io connects to `<origin>/socket.io`, so any
 * path on REACT_APP_API_URL is dropped. Null when nothing usable is configured;
 * the connector then stays on REST polling.
 */
export const resolveRealtimeOrigin = (): string | null => {
  const candidate =
    toNonEmptyString(baseUrl) || toNonEmptyString(window.location.origin);
  if (!candidate) return null;

  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
};
```

- [ ] **Step 2: Gate.**
- [ ] **Step 3: Commit**

```bash
git add src/features/notifications/utils.ts
git commit -m "feat(notifications): resolve the realtime origin from the API URL"
```

---

### Task 5: Transport — `notificationSocket.ts`

**Files:** Create `src/features/notifications/notificationSocket.ts`

- [ ] **Step 1: Write the module**

```ts
import { io, type Socket } from "socket.io-client";

/**
 * One socket.io connection to the backend realtime server. Transport only: it
 * reports status, forwards every server event and flags auth rejections; the
 * connector decides what they mean. Contract: Backend docs/REALTIME_EVENTS.md.
 */

export type RealtimeStatus = "connected" | "disconnected";
export type RealtimeEvent = { name: string; body: Record<string, unknown> };

type OpenNotificationSocketOptions = {
  origin: string;
  token: string;
  onEvent: (event: RealtimeEvent) => void;
  onStatus: (status: RealtimeStatus, info: { recovered: boolean }) => void;
  onFatal: (code: string) => void;
};

/** The server rejected the session itself; reconnecting cannot help. */
const FATAL_CODES = new Set([
  "TOKEN_MISSING",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "ACCOUNT_INACTIVE",
]);

const MANUAL_RETRY_BASE_MS = 2_000;
const MANUAL_RETRY_MAX_MS = 60_000;

const toBody = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readErrorCode = (error: unknown): string => {
  const code = (error as { data?: { code?: unknown } } | null)?.data?.code;
  return typeof code === "string" ? code : "";
};

export const openNotificationSocket = ({
  origin,
  token,
  onEvent,
  onStatus,
  onFatal,
}: OpenNotificationSocketOptions): { close: () => void } => {
  let closed = false;
  let manualRetryTimer: number | null = null;
  let manualRetryAttempts = 0;

  const socket: Socket = io(origin, {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
  });

  const clearManualRetry = () => {
    if (manualRetryTimer === null) return;
    window.clearTimeout(manualRetryTimer);
    manualRetryTimer = null;
  };

  // socket.io-client does not retry after the server refused the handshake
  // (SERVER_ERROR) or closed the socket itself; schedule it here.
  const scheduleManualRetry = () => {
    if (closed || manualRetryTimer !== null) return;
    const delay =
      Math.min(MANUAL_RETRY_MAX_MS, MANUAL_RETRY_BASE_MS * 2 ** manualRetryAttempts) +
      Math.floor(Math.random() * 1_000);
    manualRetryAttempts += 1;
    manualRetryTimer = window.setTimeout(() => {
      manualRetryTimer = null;
      if (!closed) socket.connect();
    }, delay);
  };

  socket.on("connect", () => {
    if (closed) return;
    manualRetryAttempts = 0;
    clearManualRetry();
    onStatus("connected", { recovered: socket.recovered });
  });

  socket.on("disconnect", (reason) => {
    if (closed) return;
    onStatus("disconnected", { recovered: false });
    if (reason === "io server disconnect") scheduleManualRetry();
  });

  socket.on("connect_error", (error) => {
    if (closed) return;
    const code = readErrorCode(error);
    if (FATAL_CODES.has(code)) {
      closed = true;
      clearManualRetry();
      socket.disconnect();
      onFatal(code);
      return;
    }
    onStatus("disconnected", { recovered: false });
    if (!socket.active) scheduleManualRetry();
  });

  socket.onAny((name: string, body: unknown) => {
    if (closed) return;
    onEvent({ name, body: toBody(body) });
  });

  return {
    close: () => {
      closed = true;
      clearManualRetry();
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
```

- [ ] **Step 2: Gate.** (Unused until Task 7 — lint must still pass; if `noUnusedLocals`-style lint flags an unused export, it won't: exports are not flagged.)
- [ ] **Step 3: Commit**

```bash
git add src/features/notifications/notificationSocket.ts
git commit -m "feat(notifications): socket.io transport for realtime events"
```

---

### Task 6: Session handlers — `sessionRealtime.ts`

**Files:** Create `src/features/notifications/sessionRealtime.ts`

- [ ] **Step 1: Write the module**

```ts
import axios from "@/axiosInstance";
import { useUserStore } from "@/store/userStore";
import { getToken } from "@/utils/helperFunctions";
import type { userTypeWithToken } from "@/utils/interfaces";
import { mergeUserPermissionSources } from "@/utils/userPermissions";

/**
 * Reactions to the backend's session events. `session.changed` means the
 * signed-in user's permissions, departments or profile changed: refetch and
 * merge exactly as login does. `session.revoked` means sign out everywhere.
 */

const SESSION_REFRESH_DEBOUNCE_MS = 500;

let refreshTimer: number | null = null;

const refreshCurrentUser = async () => {
  if (!getToken()) return;

  try {
    const response = await axios.get("user/current-user");
    if (!getToken()) return;

    const state = useUserStore.getState();
    const merged = mergeUserPermissionSources(
      state as unknown as userTypeWithToken,
      response.data
    );
    state.setUser(merged);
  } catch {
    // The next 401/403 from the API handles a session that really changed.
  }
};

export const handleSessionChanged = () => {
  if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    void refreshCurrentUser();
  }, SESSION_REFRESH_DEBOUNCE_MS);
};

/** Same path as an expired session: AuthWrapper logs out (all tabs) and goes to /login. */
export const handleSessionRevoked = () => {
  window.dispatchEvent(
    new CustomEvent("app:session-expired", { detail: { message: "session revoked" } })
  );
};
```

Check: how `axiosInstance` is default-exported and imported elsewhere (LoginPage imports `axios, { pictureInstance } from "../../../../axiosInstance"`); use the same default import via the `@/axiosInstance` alias if the alias resolves `.js` (it does if other `@/` imports of JS files exist — otherwise use a relative path). Check `setUser`'s parameter type accepts the merged `userTypeWithToken` the same way `login()` in `AuthWrapper.tsx` passes it; if tsc objects, cast exactly as `AuthWrapper.login` effectively does (it passes `userType | userTypeWithToken`).

- [ ] **Step 2: Gate.**
- [ ] **Step 3: Commit**

```bash
git add src/features/notifications/sessionRealtime.ts
git commit -m "feat(auth): react to realtime session events"
```

---

### Task 7: Connector — EventSource → socket

**Files:**
- Modify: `src/features/notifications/NotificationRealtimeConnector.tsx`
- Modify: `src/features/notifications/utils.ts` (delete SSE helpers)
- Modify: `src/features/notifications/realtimeStorageKeys.ts` (comment)
- Modify: `src/utils/api/apiFetch.ts` (delete stream-token call)

Keep everything not named below exactly as it is (leader lease, snapshot, relay, visibility/online/offline, teardown, polling fallback).

- [ ] **Step 1: Imports and constants.** Replace lines 1–38 header pieces as follows:
  - Remove `import { api } from "@/utils/api/apiCalls";`, `NOTIFICATION_LAST_EVENT_ID_KEY` from the storage-keys import, and the `parseNotificationStreamToken` / `resolveNotificationSseUrl` import.
  - Add:

```ts
import { openNotificationSocket, type RealtimeEvent } from "./notificationSocket";
import { handleSessionChanged, handleSessionRevoked } from "./sessionRealtime";
import { resolveRealtimeOrigin } from "./utils";
```

  - Delete the `SSE_EVENTS` constant, `RECONNECT_BASE_MS`, `RECONNECT_MAX_MS`. Add:

```ts
/** Spread the post-reconnect REST sync so a deploy doesn't stampede the API. */
const RECOVERY_SYNC_JITTER_MS = 3_000;
```

- [ ] **Step 2: Cross-tab message types.** Extend `CrossTabMessageType` with `| "deleted" | "session_changed"` and add both to the allow-list in `parseCrossTabMessage`.

- [ ] **Step 3: Delete** `parseSsePayload` and `parseLastEventId`.

- [ ] **Step 4: Store selector.** Next to `applyClearAllFromServer`:

```ts
  const applyDeletedFromServer = useInAppNotificationStore(
    (state) => state.applyDeletedFromServer
  );
```

and add `applyDeletedFromServer` to the effect's dependency array.

- [ ] **Step 5: Effect state.** Replace `let eventSource: EventSource | null = null;` with
  `let socketHandle: { close: () => void } | null = null;`.
  Replace `let reconnectTimer` with `let recoverySyncTimer: number | null = null;` and rename `clearReconnectTimer` → `clearRecoverySyncTimer` (body: clear `recoverySyncTimer`) at its definition and **every** call site.
  Delete `reconnectAttempts`, `lastEventId`, `readStoredLastEventId`, `writeStoredLastEventId`, the `lastEventId = readStoredLastEventId();` line, `rememberLastEventId`, `onNotificationEvent`, `onUnreadCountEvent`, `onReadAllEvent`, `onClearAllEvent`, `onConnectedEvent`, `attachListeners`, `scheduleReconnect`. In `onOnline` delete `reconnectAttempts = 0;`.

- [ ] **Step 6: `disconnect`:**

```ts
    const disconnect = () => {
      if (!socketHandle) return;
      socketHandle.close();
      socketHandle = null;
    };
```

- [ ] **Step 7: Event dispatch** — add before `connect`:

```ts
    const handleRealtimeEvent = ({ name, body }: RealtimeEvent) => {
      if (isDisposed || !isLeader) return;

      switch (name) {
        case "notification":
        case "notification_updated":
          ingestNotificationPayload(body, "realtime");
          applyUnreadCountPayload(body);
          publishCrossTab("notification", body);
          publishCrossTab("unread_count", body);
          return;
        case "unread_count":
          applyUnreadCountPayload(body);
          publishCrossTab("unread_count", body);
          return;
        case "notifications_read_all":
          applyReadAllFromServer(body);
          publishCrossTab("read_all", body);
          publishSnapshot();
          return;
        case "notifications_cleared":
          applyClearAllFromServer(body);
          publishCrossTab("cleared", body);
          publishSnapshot();
          return;
        case "notifications_deleted":
          applyDeletedFromServer(body);
          publishCrossTab("deleted", body);
          publishSnapshot();
          return;
        case "session.changed":
          handleSessionChanged();
          publishCrossTab("session_changed");
          return;
        case "session.revoked":
          // Logout clears the session in every tab; nothing to relay.
          handleSessionRevoked();
          return;
        default:
          return;
      }
    };
```

- [ ] **Step 8: `connect`** — replace the whole function:

```ts
    const connect = () => {
      if (
        isDisposed ||
        !isLeader ||
        document.visibilityState === "hidden" ||
        !navigator.onLine
      ) {
        return;
      }

      const sessionToken = getToken();
      if (!sessionToken) {
        teardownForSignedOutSession();
        return;
      }

      const origin = resolveRealtimeOrigin();
      if (!origin) {
        startFallbackPoll();
        return;
      }

      disconnect();
      socketHandle = openNotificationSocket({
        origin,
        token: sessionToken,
        onEvent: handleRealtimeEvent,
        onStatus: (status, { recovered }) => {
          if (isDisposed || !isLeader) return;

          if (status === "connected") {
            setConnected(true);
            clearFallbackPoll();
            publishCrossTab("connected");
            if (!recovered) {
              // Events sent while we were away were not replayed: resync.
              clearRecoverySyncTimer();
              recoverySyncTimer = window.setTimeout(() => {
                recoverySyncTimer = null;
                void syncFromApi(true);
              }, Math.floor(Math.random() * RECOVERY_SYNC_JITTER_MS));
            }
            return;
          }

          setConnected(false);
          publishCrossTab("disconnected");
          startFallbackPoll();
        },
        onFatal: (code) => {
          if (isDisposed) return;
          window.dispatchEvent(
            new CustomEvent("app:session-expired", { detail: { message: code } })
          );
        },
      });
    };
```

  Existing callers use `void connect();` — leave them (harmless on a non-promise) or drop the `void`; lint decides.

- [ ] **Step 9: Followers.** In `handleCrossTabMessage`, before the `snapshot` branch, add:

```ts
      if (message.type === "deleted") {
        applyDeletedFromServer(message.payload);
        return;
      }

      if (message.type === "session_changed") {
        handleSessionChanged();
        return;
      }
```

- [ ] **Step 10: Delete the SSE helpers** in `src/features/notifications/utils.ts`: `DEFAULT_SSE_PATH`, `parseNotificationStreamToken`, `resolveNotificationSseUrl`. Keep `baseUrl` import (used by `resolveRealtimeOrigin`).

- [ ] **Step 11: Delete** `fetchNotificationsStreamToken` from `src/utils/api/apiFetch.ts`. If `NotificationStreamTokenPayload` is then unused anywhere (`grep -rn NotificationStreamTokenPayload src`), delete that type too.

- [ ] **Step 12: Storage key comment** — in `realtimeStorageKeys.ts`, above `NOTIFICATION_LAST_EVENT_ID_KEY`:

```ts
// No longer written (socket.io recovery replaced SSE last-event-id); still
// cleared on sign-out so browsers upgraded from the SSE build drop it.
```

- [ ] **Step 13: Gate** and the leftovers check:

```bash
npx tsc --noEmit && npm run lint && npm run build
grep -rn "EventSource\|stream-token\|notifications/stream\|StreamToken\|\"sse\"" src
```

Expected: gate exits 0; grep prints nothing.

- [ ] **Step 14: Commit**

```bash
git add src/features/notifications src/utils/api/apiFetch.ts
git commit -m "feat(notifications): receive realtime events over socket.io"
```

---

### Task 8: `Account inactive` signs out

**Files:** Modify `src/axiosInstance.js`

- [ ] **Step 1:** Add to `SESSION_EXPIRY_MARKERS`:

```js
  "account inactive",
```

Read `isSessionExpiredMessage` and confirm it lower-cases the message and matches by `includes`; if it matches exactly instead, the marker must equal the lower-cased backend message `"account inactive"` — which it does.

- [ ] **Step 2: Gate.**
- [ ] **Step 3: Commit**

```bash
git add src/axiosInstance.js
git commit -m "fix(auth): sign out when the API reports an inactive account"
```

---

### Task 9: Docs

**Files:** `docs/NOTIFICATION_ACTION_URLS_AND_TRIGGERS.md`, `docs/DEVICE_NOTIFICATION_BACKEND_CONTRACT.md`

- [ ] **Step 1:** In both files, replace every SSE description (real-time strategy line, `GET /notifications/stream` and `/stream-token` endpoints, SSE auth, event list, reconnect backoff) with:
  - Realtime strategy: socket.io at `<API origin>/socket.io`, session JWT in the handshake `auth.token`; contract in Backend `docs/REALTIME_EVENTS.md`.
  - Events consumed by the dashboard: `notification`, `notification_updated`, `notifications_read_all`, `notifications_cleared`, `notifications_deleted`, `unread_count`, `session.changed`, `session.revoked`.
  - One socket per browser (leader tab), cross-tab relay, REST polling every 60 s while disconnected, resync after a non-recovered reconnect.
  Keep each doc's existing structure and tone; change only the realtime parts.
- [ ] **Step 2:** `grep -n "SSE\|EventSource\|stream-token\|notifications/stream" docs/NOTIFICATION_ACTION_URLS_AND_TRIGGERS.md docs/DEVICE_NOTIFICATION_BACKEND_CONTRACT.md` → nothing, or only a sentence saying SSE was replaced.
- [ ] **Step 3: Commit**

```bash
git add docs/NOTIFICATION_ACTION_URLS_AND_TRIGGERS.md docs/DEVICE_NOTIFICATION_BACKEND_CONTRACT.md
git commit -m "docs(notifications): realtime moved from SSE to socket.io"
```

---

### Task 10: Final gate

- [ ] `npx tsc --noEmit && npm run lint && npm run build` → exit 0.
- [ ] `grep -rn "EventSource\|stream-token\|notifications/stream\|\"sse\"" src` → nothing.
- [ ] `git status` clean.

## After the plan (a person with dev access)

1. Backend PR #483 merged and deployed to dev; Nginx `/socket.io/` block on the dev host.
2. Run the dashboard against dev and walk the seven browser checks in the spec's Verification section.
3. Open the PR `feat/realtime-socket` → `development`.
4. Phase 2 (Backend SSE removal) gets its own plan after the production soak.
