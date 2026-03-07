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
    let retryTimer: number | null = null;

    const clearRetryTimer = () => {
      if (retryTimer === null) return;
      window.clearTimeout(retryTimer);
      retryTimer = null;
    };

    const syncDeviceSubscription = async () => {
      if (getDeviceNotificationPermissionState() !== "granted") {
        return;
      }

      const synced = await syncDevicePushSubscriptionIfGranted();
      if (synced || isDisposed) return;

      clearRetryTimer();
      retryTimer = window.setTimeout(() => {
        void syncDeviceSubscription();
      }, PUSH_RETRY_DELAY_MS);
    };

    const onServiceWorkerMessage = (event: MessageEvent<unknown>) => {
      const payload =
        event.data && typeof event.data === "object"
          ? (event.data as ServiceWorkerMessagePayload)
          : null;

      if (payload?.type !== "pushsubscriptionchange") return;
      void syncDeviceSubscription();
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
    }

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
    };
  }, [userId]);

  return null;
};
