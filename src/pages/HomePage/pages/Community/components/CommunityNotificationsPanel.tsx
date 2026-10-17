import { BellIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import type { CommunityNotification } from "@/utils/api/community/interfaces";
import { communityBodyToPlainText } from "../utils/communityBody";
import { NOTIFICATION_EMOJI } from "../utils/communityConstants";
import {
  communityPostPath,
  isToday,
  timeAgo,
} from "../utils/communityHelpers";

interface CommunityNotificationsPanelProps {
  unreadCount: number;
  onUnreadChange: (count: number) => void;
  /** Re-reads /community/me so the badge matches the server. */
  onRefresh: () => void;
}

const PAGE_SIZE = 30;

/** Splits "Sarah Mensah commented on your testimony" into the bold actor
 *  and the rest, when the backend supplied the actor separately. */
const splitTitle = (notification: CommunityNotification) => {
  const actor = notification.actorName;
  if (actor && notification.title.startsWith(actor)) {
    return { lead: actor, rest: notification.title.slice(actor.length) };
  }
  return { lead: "", rest: notification.title };
};

export const CommunityNotificationsPanel = ({
  unreadCount,
  onUnreadChange,
  onRefresh,
}: CommunityNotificationsPanelProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchCommunityNotifications({
        skip: 0,
        take: PAGE_SIZE,
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
    onRefresh();
  }, [open, load, onRefresh]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = async () => {
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    onUnreadChange(0);
    try {
      await api.post.markAllCommunityNotificationsRead();
    } catch {
      setItems(previous);
      onUnreadChange(unreadCount);
    } finally {
      onRefresh();
    }
  };

  const openNotification = (notification: CommunityNotification) => {
    if (!notification.isRead) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
      onUnreadChange(Math.max(0, unreadCount - 1));
      api.put
        .markCommunityNotificationRead(notification.id)
        .catch(() => {
          // ApiErrorHandler has already shown the error.
        })
        .finally(onRefresh);
    }
    setOpen(false);
    if (notification.postId) {
      navigate(communityPostPath(notification.postId, notification.commentId));
    }
  };

  const groups = [
    { label: "Today", items: items.filter((item) => isToday(item.createdAt)) },
    { label: "Earlier", items: items.filter((item) => !isToday(item.createdAt)) },
  ].filter((group) => group.items.length);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount
            ? `Community notifications, ${unreadCount} unread`
            : "Community notifications"
        }
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-lightGray bg-white text-primary hover:bg-lightGray/40"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Community notifications"
          className="absolute right-0 z-40 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-lightGray bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-lightGray px-4 py-3">
            <h2 className="text-sm font-semibold text-primary">Notifications</h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!items.some((item) => !item.isRead)}
              className="text-xs font-semibold text-amber-700 hover:underline disabled:cursor-default disabled:text-primaryGray disabled:no-underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && !items.length ? (
              <p className="px-4 py-8 text-center text-sm text-primaryGray">
                Loading…
              </p>
            ) : failed ? (
              <p className="px-4 py-8 text-center text-sm text-error">
                Could not load notifications.
              </p>
            ) : !groups.length ? (
              <p className="px-4 py-8 text-center text-sm text-primaryGray">
                You&apos;re all caught up.
              </p>
            ) : (
              groups.map((group) => (
                <section key={group.label}>
                  <h3 className="bg-lightGray/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primaryGray">
                    {group.label}
                  </h3>
                  <ul>
                    {group.items.map((notification) => {
                      const { lead, rest } = splitTitle(notification);
                      return (
                        <li key={notification.id}>
                          <button
                            type="button"
                            onClick={() => openNotification(notification)}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-lightGray/30",
                              !notification.isRead && "bg-amber-50/60"
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl text-base",
                                notification.isRead ? "bg-lightGray/50" : "bg-amber-100"
                              )}
                            >
                              {NOTIFICATION_EMOJI[notification.type] ?? "🔔"}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm text-primary">
                                {lead ? <strong>{lead}</strong> : null}
                                {rest}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-primaryGray">
                                {[
                                  communityBodyToPlainText(notification.body),
                                  timeAgo(notification.createdAt),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>
                            {!notification.isRead ? (
                              <span
                                aria-label="Unread"
                                className="mt-1.5 h-2 w-2 flex-none rounded-full bg-amber-500"
                              />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
