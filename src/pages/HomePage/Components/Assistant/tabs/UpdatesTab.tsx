import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useInAppNotificationStore } from "@/store/useInAppNotificationStore";
import { cn } from "@/utils/cn";
import type { InAppNotification } from "@/utils/api/notifications/interfaces";

type UpdateFilter = "all" | "auto" | "news";

const FILTERS: { key: UpdateFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "auto", label: "Done for you" },
  { key: "news", label: "Announcements" },
];

const isAuto = (type: string) => type.startsWith("assistant.") || type.endsWith(".done_for_you");
const isNews = (type: string) =>
  type.startsWith("announcement") || type.startsWith("system") || type.startsWith("community");

const formatWhen = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const UpdatesTab = () => {
  const navigate = useNavigate();
  const notifications = useInAppNotificationStore((state) => state.notifications);
  const unreadCount = useInAppNotificationStore((state) => state.unreadCount);
  const hasMore = useInAppNotificationStore((state) => state.hasMore);
  const loadingMore = useInAppNotificationStore((state) => state.loadingMore);
  const initialLoaded = useInAppNotificationStore((state) => state.initialLoaded);
  const fetchNotifications = useInAppNotificationStore((state) => state.fetchNotifications);
  const loadMore = useInAppNotificationStore((state) => state.loadMore);
  const markAsRead = useInAppNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useInAppNotificationStore((state) => state.markAllAsRead);

  const [filter, setFilter] = useState<UpdateFilter>("all");

  useEffect(() => {
    if (!initialLoaded) {
      void fetchNotifications({ page: 1 });
    }
  }, [initialLoaded, fetchNotifications]);

  const visible = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "auto") return notifications.filter((item) => isAuto(item.type));
    return notifications.filter((item) => isNews(item.type));
  }, [notifications, filter]);

  const openUpdate = (item: InAppNotification) => {
    if (!item.isRead) void markAsRead(item.id);
    if (item.actionUrl) navigate(item.actionUrl);
  };

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <div
        role="tablist"
        aria-label="Filter updates"
        className="flex gap-1 rounded-lg border border-[#D8DAE5] bg-[#D8DAE5]/30 p-1"
      >
        {FILTERS.map((entry) => {
          const on = filter === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(entry.key)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm text-[#080D2D]",
                on ? "bg-white font-semibold shadow-sm" : "font-normal hover:bg-white/70"
              )}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {unreadCount > 0 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-600">{unreadCount} unread</p>
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="rounded-lg px-2 py-1 text-sm font-medium text-[#080D2D] hover:bg-[#080D2D]/5"
          >
            Mark all read
          </button>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-base font-semibold text-[#080D2D]">No updates yet</p>
          <p className="text-sm text-gray-600">I’ll post here when something happens for you.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {visible.map((item) => {
            const unread = !item.isRead;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openUpdate(item)}
                className={cn(
                  "-mx-3 flex gap-3 rounded-lg border-b border-gray-200 px-3 py-4 text-left last:border-b-0",
                  unread ? "bg-[#F8F9FC]" : "bg-transparent hover:bg-[#D8DAE5]/20"
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className={cn("text-sm text-[#080D2D]", unread ? "font-semibold" : "font-medium")}>
                    {item.title}
                  </p>
                  {item.body ? <p className="text-sm text-gray-600">{item.body}</p> : null}
                  <span className="mt-1 text-xs text-gray-500">{formatWhen(item.createdAt)}</span>
                </div>
                {unread ? (
                  <span aria-label="Unread" className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#080D2D]" />
                ) : null}
              </button>
            );
          })}

          {hasMore ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="mt-3 self-center rounded-lg px-3 py-2 text-sm font-medium text-[#080D2D] hover:bg-[#080D2D]/5 disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
