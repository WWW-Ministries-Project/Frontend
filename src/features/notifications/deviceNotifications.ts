import { api } from "@/utils/api/apiCalls";
import { ApiError } from "@/utils/api/errors/ApiError";
import type {
  InAppNotification,
  NotificationPushSubscriptionPayload,
} from "@/utils/api/notifications/interfaces";

import { resolveNotificationNavigationTarget } from "./utils";

type UnknownRecord = Record<string, unknown>;

const DEFAULT_FALLBACK_URL = "/home/notifications";
const DEFAULT_NOTIFICATION_ICON = "/pwa/icon-192.png";
const DEFAULT_NOTIFICATION_BADGE = "/pwa/icon-maskable-192.png";

let audioContextInstance: AudioContext | null = null;
let hasBoundAudioUnlockListeners = false;

const PUSH_PUBLIC_KEY_PATH = "/notifications/push/public-key";

export type EnsureDevicePushSubscriptionResult =
  | "enabled"
  | "push-disabled"
  | "failed";

const toRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
};

const extractPushPublicKey = (payload: unknown): string | null => {
  const direct = toNonEmptyString(payload);
  if (direct) return direct;

  const record = toRecord(payload);
  if (!record) return null;

  const nestedRecord = toRecord(record.data);
  const candidates = [
    record.publicKey,
    record.public_key,
    record.vapidPublicKey,
    record.vapid_public_key,
    record.key,
    nestedRecord?.publicKey,
    nestedRecord?.public_key,
    nestedRecord?.vapidPublicKey,
    nestedRecord?.vapid_public_key,
    nestedRecord?.key,
  ];

  for (const candidate of candidates) {
    const parsed = toNonEmptyString(candidate);
    if (parsed) return parsed;
  }

  return null;
};

const parsePushEnabledFlag = (payload: unknown): boolean | null => {
  const record = toRecord(payload);
  if (!record) return null;

  const nestedRecord = toRecord(record.data);
  const candidates = [record.pushEnabled, record.push_enabled, nestedRecord?.pushEnabled, nestedRecord?.push_enabled];

  for (const candidate of candidates) {
    if (typeof candidate === "boolean") {
      return candidate;
    }
  }

  return null;
};

const normalizeErrorMessage = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (value instanceof Error) return value.message.toLowerCase();
  return "";
};

const isPushDisabledError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    if (
      error.statusCode === 503 &&
      typeof error.requestPath === "string" &&
      error.requestPath.includes(PUSH_PUBLIC_KEY_PATH)
    ) {
      return true;
    }

    if (error.statusCode === 503) {
      const detailFlag = parsePushEnabledFlag(error.details);
      if (detailFlag === false) return true;
      return normalizeErrorMessage(error.message).includes("push is not configured");
    }
  }

  return false;
};

const urlBase64ToUint8Array = (value: string): Uint8Array => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
};

const getAudioContextCtor = (): typeof AudioContext | null => {
  if (typeof window === "undefined") return null;

  const extendedWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };

  return extendedWindow.AudioContext || extendedWindow.webkitAudioContext || null;
};

const getOrCreateAudioContext = (): AudioContext | null => {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;

  if (!audioContextInstance) {
    audioContextInstance = new Ctor();
  }

  return audioContextInstance;
};

const resumeAudioContext = async (): Promise<void> => {
  const context = getOrCreateAudioContext();
  if (!context || context.state !== "suspended") return;

  try {
    await context.resume();
  } catch {
    // Browsers may still block until user interaction.
  }
};

const buildSubscriptionPayload = (
  subscription: PushSubscription
): NotificationPushSubscriptionPayload => {
  const serialized = subscription.toJSON();

  return {
    subscription: serialized,
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: serialized.keys,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

const shouldShowForegroundDeviceNotification = (): boolean => {
  if (typeof document === "undefined") return false;

  return document.visibilityState === "hidden" || !document.hasFocus();
};

const resolveNotificationUrl = (notification: InAppNotification): {
  url: string;
  external: boolean;
} => {
  if (typeof window === "undefined") {
    return { url: DEFAULT_FALLBACK_URL, external: false };
  }

  const resolved = resolveNotificationNavigationTarget(
    notification,
    window.location.pathname
  );

  return {
    url: resolved.url || DEFAULT_FALLBACK_URL,
    external: resolved.external,
  };
};

const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
};

export const isDeviceNotificationSupported = (): boolean =>
  typeof window !== "undefined" && "Notification" in window;

export const isPushSubscriptionSupported = (): boolean =>
  isDeviceNotificationSupported() &&
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

export const requestNotificationPermissionIfNeeded = async (): Promise<
  NotificationPermission | null
> => {
  if (!isDeviceNotificationSupported()) return null;

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

export type DeviceNotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export const getDeviceNotificationPermissionState =
  (): DeviceNotificationPermissionState => {
    if (!isDeviceNotificationSupported()) return "unsupported";
    return Notification.permission;
  };

export const ensureDevicePushSubscription =
  async (): Promise<EnsureDevicePushSubscriptionResult> => {
    if (!isPushSubscriptionSupported()) return "failed";
    if (Notification.permission !== "granted") return "failed";

    const registration = await getServiceWorkerRegistration();
    if (!registration) return "failed";

    try {
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        let publicKey: string | null = null;
        try {
          const publicKeyResponse = await api.fetch.fetchNotificationsPushPublicKey();
          publicKey = extractPushPublicKey(publicKeyResponse.data);

          const pushEnabledFlag = parsePushEnabledFlag(publicKeyResponse.data);
          if (pushEnabledFlag === false || !publicKey) {
            return "push-disabled";
          }
        } catch (error) {
          if (isPushDisabledError(error)) {
            return "push-disabled";
          }
          return "failed";
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          appServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await api.post.subscribeToNotificationPush(buildSubscriptionPayload(subscription));
      return "enabled";
    } catch {
      return "failed";
    }
  };

export const syncDevicePushSubscriptionIfGranted = async (): Promise<EnsureDevicePushSubscriptionResult> => {
  if (!isPushSubscriptionSupported()) return "failed";
  if (Notification.permission !== "granted") return "failed";

  return ensureDevicePushSubscription();
};

export type EnableDeviceNotificationsResult =
  | "enabled"
  | "unsupported"
  | "denied"
  | "push-disabled"
  | "failed";

export const enableDeviceNotifications =
  async (): Promise<EnableDeviceNotificationsResult> => {
    if (!isPushSubscriptionSupported()) return "unsupported";

    const permission = await requestNotificationPermissionIfNeeded();
    if (permission !== "granted") {
      return "denied";
    }

    const synced = await ensureDevicePushSubscription();
    return synced === "enabled" ? "enabled" : synced;
  };

export const removeDevicePushSubscription = async (
  options?: {
    skipBackendUnsubscribe?: boolean;
  }
): Promise<void> => {
  if (!isPushSubscriptionSupported()) return;

  const registration = await getServiceWorkerRegistration();
  if (!registration) return;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const payload = buildSubscriptionPayload(subscription);

    if (!options?.skipBackendUnsubscribe) {
      try {
        await api.post.unsubscribeFromNotificationPush(payload);
      } catch {
        // Ignore backend unsubscribe errors.
      }
    }

    try {
      await subscription.unsubscribe();
    } catch {
      // Ignore local unsubscribe errors.
    }
  } catch {
    // Ignore device unsubscribe errors.
  }
};

export const primeNotificationAudio = (): void => {
  if (typeof window === "undefined" || hasBoundAudioUnlockListeners) return;
  if (!getAudioContextCtor()) return;

  hasBoundAudioUnlockListeners = true;

  const unlock = () => {
    void resumeAudioContext();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
    hasBoundAudioUnlockListeners = false;
  };

  window.addEventListener("pointerdown", unlock, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("touchstart", unlock, {
    once: true,
    passive: true,
  });
};

export const playIncomingNotificationSound = (): void => {
  if (typeof window === "undefined") return;

  try {
    const context = getOrCreateAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(960, now);
    oscillator.frequency.exponentialRampToValueAtTime(720, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.25);
  } catch {
    // Ignore unsupported audio playback.
  }
};

export const showForegroundDeviceNotification = (
  notification: InAppNotification
): void => {
  if (!isDeviceNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  if (!shouldShowForegroundDeviceNotification()) return;

  const target = resolveNotificationUrl(notification);

  const browserNotification = new Notification(notification.title || "Notification", {
    body: notification.body || "You have a new notification.",
    icon: DEFAULT_NOTIFICATION_ICON,
    badge: DEFAULT_NOTIFICATION_BADGE,
    tag: notification.dedupeKey || notification.id,
    renotify: true,
    silent: false,
    data: {
      url: target.url,
      external: target.external,
    },
  });

  browserNotification.onclick = () => {
    browserNotification.close();
    window.focus();

    if (target.external) {
      window.open(target.url, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.assign(target.url || DEFAULT_FALLBACK_URL);
  };
};
