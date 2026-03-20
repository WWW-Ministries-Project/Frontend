import { useEffect } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { getToken } from "@/utils/helperFunctions";
import {
  getDeviceNotificationPermissionState,
  isPushSubscriptionSupported,
  primeNotificationAudio,
  removeDevicePushSubscription,
  syncDevicePushSubscriptionIfGranted,
} from "./deviceNotifications";

const PUSH_RETRY_DELAY_MS = 60_000;

type ServiceWorkerMessagePayload = {
  type?: string;
};

export const NotificationDeviceConnector = () => {
  const {
    user: { id: userId },
  } = useAuth();

  useEffect(() => {
    primeNotificationAudio();
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      // No authenticated user context; avoid unauthorized backend unsubscribe calls.
      void removeDevicePushSubscription({ skipBackendUnsubscribe: true });
      return;
    }

    if (!userId) {
      return;
    }

    if (!isPushSubscriptionSupported()) {
      return;
    }

    let isDisposed = false;
    let syncInFlight = false;
    let retryTimer: number | null = null;

    const clearRetryTimer = () => {
      if (retryTimer === null) return;
      window.clearTimeout(retryTimer);
      retryTimer = null;
    };

    const syncDeviceSubscription = async () => {
      if (isDisposed || syncInFlight) {
        return;
      }

      if (getDeviceNotificationPermissionState() !== "granted") {
        clearRetryTimer();
        return;
      }

      syncInFlight = true;

      try {
        const syncResult = await syncDevicePushSubscriptionIfGranted();
        if (
          syncResult === "enabled" ||
          syncResult === "push-disabled" ||
          isDisposed
        ) {
          clearRetryTimer();
          return;
        }

        clearRetryTimer();
        retryTimer = window.setTimeout(() => {
          void syncDeviceSubscription();
        }, PUSH_RETRY_DELAY_MS);
      } finally {
        syncInFlight = false;
      }
    };

    const onServiceWorkerMessage = (event: MessageEvent<unknown>) => {
      const payload =
        event.data && typeof event.data === "object"
          ? (event.data as ServiceWorkerMessagePayload)
          : null;

      if (payload?.type !== "pushsubscriptionchange") return;
      void syncDeviceSubscription();
    };

    const onWindowFocus = () => {
      void syncDeviceSubscription();
    };

    const onWindowOnline = () => {
      void syncDeviceSubscription();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void syncDeviceSubscription();
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
    }
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("online", onWindowOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    void syncDeviceSubscription();

    return () => {
      isDisposed = true;
      clearRetryTimer();

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          onServiceWorkerMessage
        );
      }
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("online", onWindowOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId]);

  return null;
};
