import { useEffect } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { useInAppNotificationStore } from "@/store/useInAppNotificationStore";
import { api } from "@/utils/api/apiCalls";
import { getToken } from "@/utils/helperFunctions";
import {
  parseNotificationStreamToken,
  resolveNotificationSseUrl,
} from "./utils";

const SSE_EVENTS = {
  connected: "connected",
  heartbeat: "heartbeat",
  notification: "notification",
  notificationUpdated: "notification_updated",
  notificationsReadAll: "notifications_read_all",
  unreadCount: "unread_count",
} as const;

const NOTIFICATION_LEADER_KEY = "churchproject.notifications.realtime.leader";
const NOTIFICATION_EVENT_KEY = "churchproject.notifications.realtime.event";
const NOTIFICATION_CHANNEL_NAME = "churchproject.notifications.realtime";

const LEADER_HEARTBEAT_MS = 4_000;
const LEADER_STALE_MS = 12_000;
const FOLLOWER_CHECK_MS = 4_000;
const RESYNC_THROTTLE_MS = 60_000;
const FALLBACK_POLL_MS = 60_000;
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 120_000;

type RealtimeLeaderLease = {
  tabId: string;
  heartbeatAt: number;
};

type CrossTabMessageType =
  | "connected"
  | "disconnected"
  | "notification"
  | "unread_count"
  | "read_all";

type CrossTabMessage = {
  type: CrossTabMessageType;
  from: string;
  timestamp: number;
  payload?: unknown;
};

const createTabId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `tab_${Math.random().toString(36).slice(2, 12)}`;
};

const parseLeaderLease = (value: string | null): RealtimeLeaderLease | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<RealtimeLeaderLease>;
    const tabId =
      typeof parsed.tabId === "string" ? parsed.tabId.trim() : "";
    const heartbeatAt =
      typeof parsed.heartbeatAt === "number" && Number.isFinite(parsed.heartbeatAt)
        ? Math.floor(parsed.heartbeatAt)
        : 0;

    if (!tabId || heartbeatAt <= 0) return null;
    return { tabId, heartbeatAt };
  } catch {
    return null;
  }
};

const parseCrossTabMessage = (value: unknown): CrossTabMessage | null => {
  if (!value || typeof value !== "object") return null;

  const input = value as Partial<CrossTabMessage>;
  const type =
    typeof input.type === "string" ? (input.type as CrossTabMessageType) : null;
  const from = typeof input.from === "string" ? input.from.trim() : "";
  const timestamp =
    typeof input.timestamp === "number" && Number.isFinite(input.timestamp)
      ? Math.floor(input.timestamp)
      : 0;

  if (!type || !from || timestamp <= 0) return null;

  if (
    type !== "connected" &&
    type !== "disconnected" &&
    type !== "notification" &&
    type !== "unread_count" &&
    type !== "read_all"
  ) {
    return null;
  }

  return {
    type,
    from,
    timestamp,
    payload: input.payload,
  };
};

const isLeaderLeaseStale = (lease: RealtimeLeaderLease): boolean =>
  Date.now() - lease.heartbeatAt > LEADER_STALE_MS;

const parseSsePayload = (value: string): unknown => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const NotificationRealtimeConnector = () => {
  const {
    user: { id: userId },
  } = useAuth();

  const fetchNotifications = useInAppNotificationStore(
    (state) => state.fetchNotifications
  );
  const fetchUnreadCount = useInAppNotificationStore(
    (state) => state.fetchUnreadCount
  );
  const setConnected = useInAppNotificationStore((state) => state.setConnected);
  const ingestNotificationPayload = useInAppNotificationStore(
    (state) => state.ingestNotificationPayload
  );
  const applyUnreadCountPayload = useInAppNotificationStore(
    (state) => state.applyUnreadCountPayload
  );
  const applyReadAllFromServer = useInAppNotificationStore(
    (state) => state.applyReadAllFromServer
  );

  useEffect(() => {
    const token = getToken();
    if (!token || !userId) {
      setConnected(false);
      return;
    }

    const tabId = createTabId();
    const storageAvailable = (() => {
      try {
        const probeKey = `${NOTIFICATION_LEADER_KEY}.probe`;
        localStorage.setItem(probeKey, tabId);
        localStorage.removeItem(probeKey);
        return true;
      } catch {
        return false;
      }
    })();

    let eventSource: EventSource | null = null;
    let broadcastChannel: BroadcastChannel | null = null;

    let reconnectTimer: number | null = null;
    let fallbackPollTimer: number | null = null;
    let followerCheckTimer: number | null = null;
    let leaderHeartbeatTimer: number | null = null;

    let isDisposed = false;
    let isLeader = false;
    let reconnectAttempts = 0;
    let lastResyncAt = 0;
    let syncInFlight: Promise<void> | null = null;

    const clearTimer = (timer: number | null) => {
      if (timer === null) return;
      window.clearTimeout(timer);
    };

    const clearIntervalTimer = (timer: number | null) => {
      if (timer === null) return;
      window.clearInterval(timer);
    };

    const readLeaderLease = (): RealtimeLeaderLease | null => {
      if (!storageAvailable) return null;

      try {
        return parseLeaderLease(localStorage.getItem(NOTIFICATION_LEADER_KEY));
      } catch {
        return null;
      }
    };

    const writeLeaderLease = () => {
      if (!storageAvailable) return;

      const lease: RealtimeLeaderLease = {
        tabId,
        heartbeatAt: Date.now(),
      };

      try {
        localStorage.setItem(NOTIFICATION_LEADER_KEY, JSON.stringify(lease));
      } catch {
        // Ignore storage write failures. This tab can still run standalone.
      }
    };

    const removeLeaderLease = () => {
      if (!storageAvailable) return;

      try {
        const lease = readLeaderLease();
        if (!lease || lease.tabId !== tabId) return;
        localStorage.removeItem(NOTIFICATION_LEADER_KEY);
      } catch {
        // Ignore storage failures.
      }
    };

    const clearReconnectTimer = () => {
      clearTimer(reconnectTimer);
      reconnectTimer = null;
    };

    const clearFallbackPoll = () => {
      clearIntervalTimer(fallbackPollTimer);
      fallbackPollTimer = null;
    };

    const clearFollowerCheck = () => {
      clearIntervalTimer(followerCheckTimer);
      followerCheckTimer = null;
    };

    const clearLeaderHeartbeat = () => {
      clearIntervalTimer(leaderHeartbeatTimer);
      leaderHeartbeatTimer = null;
    };

    const publishCrossTab = (
      type: CrossTabMessageType,
      payload?: unknown
    ) => {
      const message: CrossTabMessage = {
        type,
        from: tabId,
        timestamp: Date.now(),
        payload,
      };

      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }

      if (!storageAvailable) return;

      try {
        localStorage.setItem(NOTIFICATION_EVENT_KEY, JSON.stringify(message));
        localStorage.removeItem(NOTIFICATION_EVENT_KEY);
      } catch {
        // Ignore storage failures.
      }
    };

    const syncFromApi = async (force = false) => {
      if (isDisposed) return;

      const now = Date.now();
      if (!force && now - lastResyncAt < RESYNC_THROTTLE_MS) {
        return;
      }

      if (syncInFlight) {
        await syncInFlight;
        return;
      }

      lastResyncAt = now;

      const runSync = Promise.all([
        fetchNotifications({
          page: 1,
          limit: 20,
          append: false,
          query: {},
        }),
        fetchUnreadCount(),
      ]).finally(() => {
        if (syncInFlight === runSync) {
          syncInFlight = null;
        }
      });

      syncInFlight = runSync;
      await runSync;
    };

    const startFallbackPoll = () => {
      if (
        fallbackPollTimer !== null ||
        !isLeader ||
        document.visibilityState === "hidden"
      ) {
        return;
      }

      fallbackPollTimer = window.setInterval(() => {
        if (!isLeader || document.visibilityState === "hidden") return;
        void syncFromApi(false);
      }, FALLBACK_POLL_MS);
    };

    const disconnect = () => {
      if (!eventSource) return;
      eventSource.close();
      eventSource = null;
    };

    const onNotificationEvent = (event: MessageEvent<string>) => {
      const payload = parseSsePayload(event.data);
      if (payload === null) return;

      ingestNotificationPayload(payload, "sse");
      publishCrossTab("notification", payload);
    };

    const onUnreadCountEvent = (event: MessageEvent<string>) => {
      const payload = parseSsePayload(event.data);
      if (payload === null) return;

      applyUnreadCountPayload(payload);
      publishCrossTab("unread_count", payload);
    };

    const onReadAllEvent = (event: MessageEvent<string>) => {
      const payload = parseSsePayload(event.data);
      applyReadAllFromServer(payload ?? undefined);
      publishCrossTab("read_all", payload ?? undefined);
    };

    const onConnectedEvent = (event: MessageEvent<string>) => {
      setConnected(true);
      clearFallbackPoll();
      publishCrossTab("connected");

      const payload = parseSsePayload(event.data);
      if (payload === null) return;

      applyUnreadCountPayload(payload);
      ingestNotificationPayload(payload, "sse");
      publishCrossTab("unread_count", payload);
      publishCrossTab("notification", payload);
    };

    const attachListeners = () => {
      if (!eventSource) return;

      eventSource.addEventListener(
        SSE_EVENTS.connected,
        onConnectedEvent as EventListener
      );
      eventSource.addEventListener(SSE_EVENTS.heartbeat, () => {
        // Heartbeat intentionally ignored. Connection health is tracked by EventSource lifecycle.
      });
      eventSource.addEventListener(
        SSE_EVENTS.notification,
        onNotificationEvent as EventListener
      );
      eventSource.addEventListener(
        SSE_EVENTS.notificationUpdated,
        onNotificationEvent as EventListener
      );
      eventSource.addEventListener(
        SSE_EVENTS.notificationsReadAll,
        onReadAllEvent as EventListener
      );
      eventSource.addEventListener(
        SSE_EVENTS.unreadCount,
        onUnreadCountEvent as EventListener
      );
    };

    const scheduleReconnect = () => {
      if (isDisposed || !isLeader || document.visibilityState === "hidden") return;

      const jitterMs = Math.floor(Math.random() * 1_000);
      const waitMs =
        Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** reconnectAttempts) +
        jitterMs;
      reconnectAttempts += 1;

      clearReconnectTimer();
      reconnectTimer = window.setTimeout(() => {
        void connect();
      }, waitMs);
    };

    const connect = async () => {
      if (
        isDisposed ||
        !isLeader ||
        document.visibilityState === "hidden" ||
        !navigator.onLine
      ) {
        return;
      }

      disconnect();

      try {
        const tokenResponse = await api.fetch.fetchNotificationsStreamToken();
        if (
          isDisposed ||
          !isLeader ||
          document.visibilityState === "hidden" ||
          !navigator.onLine
        ) {
          return;
        }

        const streamToken = parseNotificationStreamToken(tokenResponse.data);

        const url = resolveNotificationSseUrl(streamToken || undefined);
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          if (isDisposed || !isLeader) return;

          reconnectAttempts = 0;
          setConnected(true);
          clearFallbackPoll();
          publishCrossTab("connected");
          void syncFromApi(false);
        };

        // Fallback for servers that send default unnamed events.
        eventSource.onmessage = onNotificationEvent;

        attachListeners();

        eventSource.onerror = () => {
          if (isDisposed) return;

          setConnected(false);
          publishCrossTab("disconnected");
          disconnect();
          startFallbackPoll();
          scheduleReconnect();
        };
      } catch {
        if (isDisposed) return;

        setConnected(false);
        publishCrossTab("disconnected");
        startFallbackPoll();
        scheduleReconnect();
      }
    };

    const becomeLeader = () => {
      if (isDisposed || isLeader || document.visibilityState === "hidden") return;

      isLeader = true;
      clearFollowerCheck();
      writeLeaderLease();
      clearLeaderHeartbeat();
      leaderHeartbeatTimer = window.setInterval(() => {
        if (!isLeader || isDisposed) return;
        writeLeaderLease();
      }, LEADER_HEARTBEAT_MS);

      clearReconnectTimer();
      clearFallbackPoll();
      void connect();
      void syncFromApi(true);
    };

    const stepDownLeader = (removeLease = false) => {
      if (!isLeader) return;

      isLeader = false;
      clearReconnectTimer();
      clearFallbackPoll();
      clearLeaderHeartbeat();
      disconnect();
      setConnected(false);
      publishCrossTab("disconnected");

      if (removeLease) {
        removeLeaderLease();
      }

      if (!isDisposed) {
        startFollowerCheck();
      }
    };

    const tryAcquireLeadership = () => {
      if (isDisposed || document.visibilityState === "hidden") return;

      if (!storageAvailable) {
        becomeLeader();
        return;
      }

      const currentLease = readLeaderLease();
      const canAcquire =
        !currentLease ||
        currentLease.tabId === tabId ||
        isLeaderLeaseStale(currentLease);

      if (!canAcquire) {
        if (isLeader && currentLease.tabId !== tabId) {
          stepDownLeader(false);
        }
        return;
      }

      writeLeaderLease();
      const confirmedLease = readLeaderLease();
      if (!confirmedLease || confirmedLease.tabId !== tabId) {
        return;
      }

      becomeLeader();
    };

    const startFollowerCheck = () => {
      if (!storageAvailable || followerCheckTimer !== null || isDisposed) return;

      followerCheckTimer = window.setInterval(() => {
        if (isDisposed || isLeader) return;
        tryAcquireLeadership();
      }, FOLLOWER_CHECK_MS);
    };

    const handleCrossTabMessage = (value: unknown) => {
      const message = parseCrossTabMessage(value);
      if (!message || message.from === tabId || isLeader) return;

      if (message.type === "connected") {
        setConnected(true);
        return;
      }

      if (message.type === "disconnected") {
        setConnected(false);
        return;
      }

      if (message.type === "notification") {
        ingestNotificationPayload(message.payload, "manual");
        return;
      }

      if (message.type === "unread_count") {
        applyUnreadCountPayload(message.payload);
        return;
      }

      if (message.type === "read_all") {
        applyReadAllFromServer(message.payload);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_LEADER_KEY) {
        const lease = parseLeaderLease(event.newValue);
        if (lease && lease.tabId !== tabId) {
          if (isLeader) {
            stepDownLeader(false);
          }
          return;
        }

        if (!lease || isLeaderLeaseStale(lease)) {
          if (!isLeader) {
            tryAcquireLeadership();
          }
        }
        return;
      }

      if (event.key === NOTIFICATION_EVENT_KEY && event.newValue) {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(event.newValue);
        } catch {
          parsed = null;
        }

        handleCrossTabMessage(parsed);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stepDownLeader(true);
        return;
      }

      tryAcquireLeadership();
      void syncFromApi(true);
    };

    const onOnline = () => {
      if (!isLeader) {
        tryAcquireLeadership();
        return;
      }

      clearFallbackPoll();
      reconnectAttempts = 0;
      void syncFromApi(true);
      void connect();
    };

    const onOffline = () => {
      if (!isLeader) return;

      clearReconnectTimer();
      clearFallbackPoll();
      disconnect();
      setConnected(false);
      publishCrossTab("disconnected");
    };

    if ("BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel(NOTIFICATION_CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        handleCrossTabMessage(event.data);
      };
    }

    if (storageAvailable) {
      window.addEventListener("storage", onStorage);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Load the latest state once, then keep followers in sync via cross-tab fanout.
    void syncFromApi(true);
    startFollowerCheck();
    tryAcquireLeadership();

    return () => {
      isDisposed = true;
      setConnected(false);
      if (isLeader) {
        publishCrossTab("disconnected");
      }
      clearReconnectTimer();
      clearFallbackPoll();
      clearFollowerCheck();
      clearLeaderHeartbeat();
      disconnect();
      removeLeaderLease();

      if (storageAvailable) {
        window.removeEventListener("storage", onStorage);
      }
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [
    applyReadAllFromServer,
    applyUnreadCountPayload,
    fetchNotifications,
    fetchUnreadCount,
    ingestNotificationPayload,
    setConnected,
    userId,
  ]);

  return null;
};
