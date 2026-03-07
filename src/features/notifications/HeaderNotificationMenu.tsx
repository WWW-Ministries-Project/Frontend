import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useInAppNotificationStore } from "@/store/useInAppNotificationStore";
import { relativePath } from "@/utils";
import {
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import type { InAppNotification } from "@/utils/api/notifications/interfaces";
import {
  formatNotificationTime,
  humanizeNotificationType,
  resolveNotificationNavigationTarget,
} from "./utils";

interface HeaderNotificationMenuProps {
  isMemberRoute: boolean;
}

const getPriorityTagClasses = (priority: string) => {
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

const openNotificationTarget = (
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

export const HeaderNotificationMenu = ({
  isMemberRoute,
}: HeaderNotificationMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useInAppNotificationStore((state) => state.notifications);
  const unreadCount = useInAppNotificationStore((state) => state.unreadCount);
  const connected = useInAppNotificationStore((state) => state.connected);
  const markAsRead = useInAppNotificationStore((state) => state.markAsRead);
  const markAsUnread = useInAppNotificationStore((state) => state.markAsUnread);
  const markAllAsRead = useInAppNotificationStore((state) => state.markAllAsRead);

  const notificationCenterPath = isMemberRoute
    ? relativePath.member.notifications
    : `${relativePath.home.main}/${relativePath.home.notifications}`;

  const previewNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => !notification.isRead)
        .slice(0, 6),
    [notifications]
  );

  useEffect(() => {
    if (!isOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;

      setIsOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const handleNotificationOpen = async (notification: InAppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    openNotificationTarget(notification, location.pathname, navigate);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="relative rounded-md p-2 text-primary hover:bg-gray-100"
        aria-label="Open notifications"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-rose-600 px-1 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {unreadLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <section className="absolute right-0 top-full z-[80] mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">
                {connected ? "Live updates connected" : "Reconnecting..."}
              </p>
            </div>
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500" : "bg-amber-400"
              }`}
              aria-hidden="true"
            />
          </header>

          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <button
              type="button"
              onClick={() => {
                void markAllAsRead();
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={unreadCount === 0}
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Mark all read
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(notificationCenterPath);
              }}
              className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
            >
              View all
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {previewNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
              previewNotifications.map((notification) => {
                const priorityToken = (notification.priority || "LOW").toUpperCase();

                return (
                  <article
                    key={notification.id}
                    className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition hover:bg-gray-50 ${
                      notification.isRead ? "" : "bg-sky-50/40"
                    }`}
                    onClick={() => {
                      void handleNotificationOpen(notification);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                          )}
                          <h4 className="truncate text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                          {notification.body || "No message body"}
                        </p>
                      </div>

                      {priorityToken === "HIGH" || priorityToken === "CRITICAL" ? (
                        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-amber-600" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate">{humanizeNotificationType(notification.type)}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-semibold ${getPriorityTagClasses(
                            priorityToken
                          )}`}
                        >
                          {priorityToken}
                        </span>
                      </div>

                      <span>{formatNotificationTime(notification.createdAt)}</span>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void (notification.isRead
                            ? markAsUnread(notification.id)
                            : markAsRead(notification.id));
                        }}
                        className="rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
                      >
                        {notification.isRead ? "Mark unread" : "Mark read"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
};
