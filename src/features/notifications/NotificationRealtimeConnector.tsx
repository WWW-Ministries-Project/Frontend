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
    if (!token) {
      setConnected(false);
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let fallbackPollTimer: number | null = null;
    let isDisposed = false;
    let reconnectAttempts = 0;
    let lastResyncAt = 0;

    const clearReconnectTimer = () => {
      if (reconnectTimer === null) return;
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    };

    const clearFallbackPoll = () => {
      if (fallbackPollTimer === null) return;
      window.clearInterval(fallbackPollTimer);
      fallbackPollTimer = null;
    };

    const syncFromApi = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastResyncAt < 30_000) {
        return;
      }

      lastResyncAt = now;

      await Promise.all([
        fetchNotifications({
          page: 1,
          limit: 20,
          append: false,
          query: {},
        }),
        fetchUnreadCount(),
      ]);
    };

    const startFallbackPoll = () => {
      if (fallbackPollTimer !== null) return;

      fallbackPollTimer = window.setInterval(() => {
        if (document.visibilityState === "hidden") return;
        void syncFromApi(false);
      }, 15_000);
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
    };

    const onUnreadCountEvent = (event: MessageEvent<string>) => {
      const payload = parseSsePayload(event.data);
      if (payload === null) return;

      applyUnreadCountPayload(payload);
    };

    const onReadAllEvent = (event: MessageEvent<string>) => {
      const payload = parseSsePayload(event.data);
      applyReadAllFromServer(payload ?? undefined);
    };

    const onConnectedEvent = (event: MessageEvent<string>) => {
      setConnected(true);
      clearFallbackPoll();

      const payload = parseSsePayload(event.data);
      if (payload === null) return;

      applyUnreadCountPayload(payload);
      ingestNotificationPayload(payload, "sse");
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

    const connect = async () => {
      if (isDisposed) return;

      try {
        const tokenResponse = await api.fetch.fetchNotificationsStreamToken();
        const streamToken = parseNotificationStreamToken(tokenResponse.data);

        const url = resolveNotificationSseUrl(streamToken || undefined);
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          reconnectAttempts = 0;
          setConnected(true);
          clearFallbackPoll();
          void syncFromApi(false);
        };

        // Fallback for servers that send default unnamed events.
        eventSource.onmessage = onNotificationEvent;

        attachListeners();

        eventSource.onerror = () => {
          setConnected(false);
          disconnect();
          startFallbackPoll();

          if (isDisposed) return;

          const waitMs = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
          reconnectAttempts += 1;

          clearReconnectTimer();
          reconnectTimer = window.setTimeout(() => {
            void connect();
          }, waitMs);
        };
      } catch {
        setConnected(false);
        startFallbackPoll();

        if (isDisposed) return;

        const waitMs = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
        reconnectAttempts += 1;

        clearReconnectTimer();
        reconnectTimer = window.setTimeout(() => {
          void connect();
        }, waitMs);
      }
    };

    // Bootstrap data once, then let SSE and server events keep it current.
    void syncFromApi(true);
    void connect();

    return () => {
      isDisposed = true;
      setConnected(false);
      clearReconnectTimer();
      clearFallbackPoll();
      disconnect();
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
