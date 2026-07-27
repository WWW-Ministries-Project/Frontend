import { useEffect } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { AUTH_SESSION_CLEARED_EVENT } from "@/utils/authSession";
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

    const stopForSignedOutSession = () => {
      if (isDisposed) return;

      isDisposed = true;
      clearRetryTimer();
      // Drop the local subscription only; the backend call would 401 anyway.
      void removeDevicePushSubscription({ skipBackendUnsubscribe: true });
    };

    const syncDeviceSubscription = async () => {
      if (isDisposed || syncInFlight) {
        return;
      }

      // Re-check on every run: the cookie can disappear (logout in this or
      // another tab, JWT expiry) long after this effect started.
      if (!getToken()) {
        stopForSignedOutSession();
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

    const onSessionCleared = () => {
      stopForSignedOutSession();
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
    }
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("online", onWindowOnline);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);
    window.addEventListener("app:session-expired", onSessionCleared);
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
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, onSessionCleared);
      window.removeEventListener("app:session-expired", onSessionCleared);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId]);

  return null;
};
