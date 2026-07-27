export const NOTIFICATION_LEADER_KEY =
  "churchproject.notifications.realtime.leader";
export const NOTIFICATION_EVENT_KEY =
  "churchproject.notifications.realtime.event";
export const NOTIFICATION_CHANNEL_NAME = "churchproject.notifications.realtime";
export const NOTIFICATION_SNAPSHOT_KEY =
  "churchproject.notifications.realtime.snapshot";
export const NOTIFICATION_LAST_EVENT_ID_KEY =
  "churchproject.notifications.realtime.last_event_id";

const REALTIME_STORAGE_KEYS = [
  NOTIFICATION_LEADER_KEY,
  NOTIFICATION_EVENT_KEY,
  NOTIFICATION_SNAPSHOT_KEY,
  NOTIFICATION_LAST_EVENT_ID_KEY,
];

/**
 * Drops every realtime artefact kept in localStorage so a signed-out session
 * cannot leak a previous user's notification snapshot into the next one, and so
 * a stale leader lease cannot keep tabs from re-electing a leader after login.
 */
export const clearNotificationRealtimeStorage = (): void => {
  if (typeof window === "undefined") return;

  REALTIME_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  });
};
