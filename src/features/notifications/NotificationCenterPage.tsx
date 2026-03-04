import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { useInAppNotificationStore } from "@/store/useInAppNotificationStore";
import type { InAppNotification } from "@/utils/api/notifications/interfaces";
import {
  BellIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import {
  formatNotificationTime,
  humanizeNotificationType,
  resolveNotificationNavigationTarget,
} from "./utils";
import {
  enableDeviceNotifications,
  getDeviceNotificationPermissionState,
  isPushSubscriptionSupported,
} from "./deviceNotifications";

type NotificationTab = "unread" | "all";
type DeviceNotificationState = NotificationPermission | "unsupported";

const resolveDeviceNotificationState = (): DeviceNotificationState => {
  if (!isPushSubscriptionSupported()) return "unsupported";
  return getDeviceNotificationPermissionState();
};

const getPriorityChipClasses = (priority: string) => {
  const normalized = priority.toUpperCase();

  if (normalized === "CRITICAL") {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }

  if (normalized === "HIGH") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (normalized === "MEDIUM") {
    return "bg-sky-50 text-sky-700 border border-sky-200";
  }

  return "bg-gray-100 text-gray-700 border border-gray-200";
};

const openNotification = (
  notification: InAppNotification,
  currentPathname: string,
  navigate: ReturnType<typeof useNavigate>
) => {
  const target = resolveNotificationNavigationTarget(notification, currentPathname);

  if (target.external) {
    window.open(target.url, "_blank", "noopener,noreferrer");
    return;
  }

  navigate(target.url);
};

export const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<NotificationTab>("unread");
  const [deviceNotificationState, setDeviceNotificationState] =
    useState<DeviceNotificationState>(() => resolveDeviceNotificationState());
  const [enablingDeviceNotifications, setEnablingDeviceNotifications] =
    useState(false);

  const notifications = useInAppNotificationStore((state) => state.notifications);
  const unreadCount = useInAppNotificationStore((state) => state.unreadCount);
  const loading = useInAppNotificationStore((state) => state.loading);
  const loadingMore = useInAppNotificationStore((state) => state.loadingMore);
  const hasMore = useInAppNotificationStore((state) => state.hasMore);
  const connected = useInAppNotificationStore((state) => state.connected);
  const error = useInAppNotificationStore((state) => state.error);
  const fetchUnreadCount = useInAppNotificationStore(
    (state) => state.fetchUnreadCount
  );
  const fetchNotifications = useInAppNotificationStore(
    (state) => state.fetchNotifications
  );
  const loadMore = useInAppNotificationStore((state) => state.loadMore);
  const markAsRead = useInAppNotificationStore((state) => state.markAsRead);
  const markAsUnread = useInAppNotificationStore((state) => state.markAsUnread);
  const markAllAsRead = useInAppNotificationStore((state) => state.markAllAsRead);

  useEffect(() => {
    const tabQuery = activeTab === "unread" ? { unreadOnly: "true" } : {};
    void fetchNotifications({
      page: 1,
      limit: 20,
      append: false,
      query: tabQuery,
    });
  }, [activeTab, fetchNotifications]);

  useEffect(() => {
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const refreshState = () => {
      setDeviceNotificationState(resolveDeviceNotificationState());
    };

    refreshState();
    window.addEventListener("focus", refreshState);
    document.addEventListener("visibilitychange", refreshState);

    return () => {
      window.removeEventListener("focus", refreshState);
      document.removeEventListener("visibilitychange", refreshState);
    };
  }, []);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications]
  );

  const visibleNotifications = activeTab === "unread" ? unreadNotifications : notifications;

  const handleOpenNotification = async (notification: InAppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    openNotification(notification, location.pathname, navigate);
  };

  const handleEnableDeviceNotifications = async () => {
    if (enablingDeviceNotifications) return;

    setEnablingDeviceNotifications(true);

    try {
      const result = await enableDeviceNotifications();

      if (result === "enabled") {
        showNotification(
          "Device notifications are now enabled on this device.",
          "success",
          { title: "Notifications" }
        );
      } else if (result === "unsupported") {
        showNotification(
          "This browser does not support device push notifications.",
          "error",
          {
            title: "Notifications",
            durationMs: 9000,
          }
        );
      } else if (result === "denied") {
        showNotification(
          "Notifications are blocked. Allow notifications for this site in browser settings, then try again.",
          "error",
          {
            title: "Notifications",
            durationMs: 9000,
          }
        );
      } else {
        showNotification(
          "Unable to register this device for notifications. Please try again.",
          "error",
          { title: "Notifications" }
        );
      }
    } finally {
      setDeviceNotificationState(resolveDeviceNotificationState());
      setEnablingDeviceNotifications(false);
    }
  };

  const deviceStatusLabel = useMemo(() => {
    if (deviceNotificationState === "unsupported") {
      return "Device alerts unavailable";
    }

    if (deviceNotificationState === "granted") {
      return "Device alerts enabled";
    }

    if (deviceNotificationState === "denied") {
      return "Device alerts blocked";
    }

    return "Device alerts off";
  }, [deviceNotificationState]);

  const deviceButtonLabel = useMemo(() => {
    if (deviceNotificationState === "granted") {
      return "Re-sync device notifications";
    }

    return "Enable device notifications";
  }, [deviceNotificationState]);

  return (
    <div className="app-page-padding">
      <div className="app-card space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Notification Center</h1>
            <p className="text-sm text-gray-500">
              In-app notifications with real-time updates and deep links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              {connected ? "Connected" : "Reconnecting"}
            </span>

            <button
              type="button"
              onClick={() => {
                void handleEnableDeviceNotifications();
              }}
              disabled={
                deviceNotificationState === "unsupported" ||
                enablingDeviceNotifications
              }
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enablingDeviceNotifications
                ? "Enabling..."
                : deviceButtonLabel}
            </button>

            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
              {deviceStatusLabel}
            </span>

            <button
              type="button"
              onClick={() => {
                const tabQuery = activeTab === "unread" ? { unreadOnly: "true" } : {};
                void fetchNotifications({
                  page: 1,
                  limit: 20,
                  append: false,
                  query: tabQuery,
                });
                void fetchUnreadCount();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                void markAllAsRead();
              }}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
        </header>

        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "unread"
                ? "bg-primary text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-primary text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All ({notifications.length})
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading && visibleNotifications.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <BellIcon className="h-5 w-5 text-gray-500" />
            </div>
            {activeTab === "unread"
              ? "No unread notifications."
              : "No notifications available."}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleNotifications.map((notification) => {
              const priorityToken = (notification.priority || "LOW").toUpperCase();

              return (
                <article
                  key={notification.id}
                  className={`rounded-lg border px-4 py-3 transition hover:border-primary/30 ${
                    notification.isRead
                      ? "border-gray-200 bg-white"
                      : "border-sky-200 bg-sky-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <h2 className="truncate text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h2>
                      </div>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                        {notification.body || "No message body"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{humanizeNotificationType(notification.type)}</span>
                        <span className="text-gray-300">|</span>
                        <span>{formatNotificationTime(notification.createdAt)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${getPriorityChipClasses(
                            priorityToken
                          )}`}
                        >
                          {priorityToken}
                        </span>
                      </div>
                    </div>

                    {priorityToken === "HIGH" || priorityToken === "CRITICAL" ? (
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-amber-600" />
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void handleOpenNotification(notification);
                      }}
                      className="rounded-md border border-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void (notification.isRead
                          ? markAsUnread(notification.id)
                          : markAsRead(notification.id));
                      }}
                      className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {notification.isRead ? "Mark unread" : "Mark read"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                void loadMore();
              }}
              disabled={loadingMore}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
