import { useEffect } from "react";

import { getToken } from "@/utils/helperFunctions";
import { resolveNotificationSseUrl } from "./utils";
import { useInAppNotificationStore } from "@/store/useInAppNotificationStore";

const LISTENED_NOTIFICATION_EVENTS = [
  "notification",
  "notification.created",
  "notifications",
  "in_app_notification.created",
] as const;

const parseSsePayload = (value: string): unknown => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const NotificationRealtimeConnector = () => {
  const refresh = useInAppNotificationStore((state) => state.refresh);
  const setConnected = useInAppNotificationStore((state) => state.setConnected);
  const ingestNotificationPayload = useInAppNotificationStore(
    (state) => state.ingestNotificationPayload
  );

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    void refresh();

    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let isDisposed = false;
    let reconnectAttempts = 0;

    const clearReconnectTimer = () => {
      if (reconnectTimer === null) return;
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
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

    const connect = () => {
      if (isDisposed) return;

      const url = resolveNotificationSseUrl();
      eventSource = new EventSource(url, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        reconnectAttempts = 0;
        setConnected(true);
      };

      eventSource.onmessage = onNotificationEvent;

      LISTENED_NOTIFICATION_EVENTS.forEach((eventName) => {
        eventSource?.addEventListener(eventName, onNotificationEvent as EventListener);
      });

      eventSource.onerror = () => {
        setConnected(false);
        disconnect();

        if (isDisposed) return;

        const waitMs = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
        reconnectAttempts += 1;

        clearReconnectTimer();
        reconnectTimer = window.setTimeout(() => {
          connect();
        }, waitMs);
      };
    };

    connect();

    return () => {
      isDisposed = true;
      setConnected(false);
      clearReconnectTimer();
      disconnect();
    };
  }, [ingestNotificationPayload, refresh, setConnected]);

  return null;
};
