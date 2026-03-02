import {
  extractNotificationsFromPayload,
  getNotificationIdentity,
  isHighPriorityNotification,
  isRecentNotification,
  mergeNotifications,
  normalizeNotificationCollection,
  parseUnreadCount,
} from "@/features/notifications/utils";
import { showNotification } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { InAppNotification } from "@/utils/api/notifications/interfaces";
import type { QueryType } from "@/utils/interfaces";
import { create } from "zustand";

const DEFAULT_PAGE_SIZE = 20;
const MAX_TOAST_KEYS = 120;

type NotificationIngestSource = "sse" | "fetch" | "manual";

interface FetchNotificationsOptions {
  page?: number;
  take?: number;
  append?: boolean;
  query?: QueryType;
}

interface InAppNotificationStore {
  notifications: InAppNotification[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  connected: boolean;
  initialLoaded: boolean;
  error: string | null;
  recentlyToastedKeys: string[];
  refresh: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: (options?: FetchNotificationsOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  ingestNotificationPayload: (
    payload: unknown,
    source?: NotificationIngestSource
  ) => void;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAsUnread: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

const deriveHasMore = (
  page: number,
  take: number,
  listLength: number,
  meta?: {
    current_page?: number;
    totalPages?: number;
  },
  payloadMeta?: {
    total?: number;
    page?: number;
    take?: number;
  }
): boolean => {
  if (
    typeof meta?.current_page === "number" &&
    typeof meta?.totalPages === "number"
  ) {
    return meta.current_page < meta.totalPages;
  }

  const payloadTake = payloadMeta?.take || take;
  const payloadPage = payloadMeta?.page || page;

  if (typeof payloadMeta?.total === "number" && payloadTake > 0) {
    return payloadPage * payloadTake < payloadMeta.total;
  }

  return listLength >= payloadTake;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error";
};

const shouldToastHighPriority = (
  notification: InAppNotification,
  recentlyToastedKeys: string[]
): boolean => {
  if (notification.isRead) return false;
  if (!isHighPriorityNotification(notification.priority)) return false;
  if (!isRecentNotification(notification.createdAt)) return false;

  const key = getNotificationIdentity(notification);
  return !recentlyToastedKeys.includes(key);
};

const createInitialState = () => ({
  notifications: [] as InAppNotification[],
  unreadCount: 0,
  loading: false,
  loadingMore: false,
  hasMore: true,
  currentPage: 1,
  connected: false,
  initialLoaded: false,
  error: null as string | null,
  recentlyToastedKeys: [] as string[],
});

export const useInAppNotificationStore = create<InAppNotificationStore>(
  (set, get) => ({
    ...createInitialState(),

    fetchNotifications: async (options = {}) => {
      const { page = 1, take = DEFAULT_PAGE_SIZE, append = false, query } = options;

      set({
        loading: !append,
        loadingMore: append,
        error: null,
      });

      try {
        const response = await api.fetch.fetchNotifications({
          page,
          take,
          ...(query || {}),
        });

        const collection = normalizeNotificationCollection(response.data);
        const current = append ? get().notifications : [];
        const merged = mergeNotifications(current, collection.items);
        const hasMore = deriveHasMore(
          page,
          take,
          collection.items.length,
          response.meta,
          {
            total: collection.total,
            page: collection.page,
            take: collection.take,
          }
        );

        const unreadCountFromList = merged.notifications.filter(
          (notification) => !notification.isRead
        ).length;

        set((state) => ({
          notifications: merged.notifications,
          hasMore,
          currentPage: page,
          unreadCount:
            append || state.unreadCount > unreadCountFromList
              ? state.unreadCount
              : unreadCountFromList,
          loading: false,
          loadingMore: false,
          initialLoaded: true,
        }));
      } catch (error) {
        set({
          loading: false,
          loadingMore: false,
          error: toErrorMessage(error),
        });
      }
    },

    fetchUnreadCount: async () => {
      try {
        const response = await api.fetch.fetchNotificationsUnreadCount();
        const unreadCount = parseUnreadCount(response.data);

        if (unreadCount === null) return;

        set({ unreadCount: unreadCount < 0 ? 0 : unreadCount });
      } catch {
        const fallbackUnreadCount = get().notifications.filter(
          (notification) => !notification.isRead
        ).length;

        set({ unreadCount: fallbackUnreadCount });
      }
    },

    refresh: async () => {
      await Promise.all([
        get().fetchNotifications({ page: 1, append: false }),
        get().fetchUnreadCount(),
      ]);
    },

    loadMore: async () => {
      const { hasMore, loadingMore, loading, currentPage } = get();

      if (!hasMore || loadingMore || loading) return;

      await get().fetchNotifications({
        page: currentPage + 1,
        append: true,
      });
    },

    ingestNotificationPayload: (payload, source = "sse") => {
      const notifications = extractNotificationsFromPayload(payload);
      if (!notifications.length) return;

      const state = get();
      const merged = mergeNotifications(state.notifications, notifications);
      let unreadCount = Math.max(0, state.unreadCount + merged.unreadDelta);

      const toastKeys = [...state.recentlyToastedKeys];

      if (source === "sse") {
        merged.added.forEach((notification) => {
          if (!shouldToastHighPriority(notification, toastKeys)) return;

          showNotification(
            notification.body || "You have a new high-priority notification.",
            notification.priority?.toUpperCase() === "CRITICAL" ? "error" : "success",
            {
              title: notification.title || "High-priority update",
            }
          );

          toastKeys.push(getNotificationIdentity(notification));
        });
      }

      if (unreadCount === 0) {
        unreadCount = merged.notifications.filter(
          (notification) => !notification.isRead
        ).length;
      }

      set({
        notifications: merged.notifications,
        unreadCount,
        recentlyToastedKeys: toastKeys.slice(-MAX_TOAST_KEYS),
      });
    },

    markAsRead: async (notificationId) => {
      if (!notificationId) return false;

      const state = get();
      const target = state.notifications.find(
        (notification) => notification.id === notificationId
      );

      if (!target || target.isRead) return true;

      const previous = state.notifications;
      const previousUnreadCount = state.unreadCount;

      const nextNotifications = previous.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
              readAt: notification.readAt || new Date().toISOString(),
            }
          : notification
      );

      set({
        notifications: nextNotifications,
        unreadCount: Math.max(0, previousUnreadCount - 1),
      });

      try {
        await api.put.markNotificationRead(notificationId);
        return true;
      } catch {
        set({
          notifications: previous,
          unreadCount: previousUnreadCount,
        });
        showNotification("Unable to mark notification as read.", "error");
        return false;
      }
    },

    markAsUnread: async (notificationId) => {
      if (!notificationId) return false;

      const state = get();
      const target = state.notifications.find(
        (notification) => notification.id === notificationId
      );

      if (!target || !target.isRead) return true;

      const previous = state.notifications;
      const previousUnreadCount = state.unreadCount;

      const nextNotifications = previous.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: false,
              readAt: null,
            }
          : notification
      );

      set({
        notifications: nextNotifications,
        unreadCount: previousUnreadCount + 1,
      });

      try {
        await api.put.markNotificationUnread(notificationId);
        return true;
      } catch {
        set({
          notifications: previous,
          unreadCount: previousUnreadCount,
        });
        showNotification("Unable to mark notification as unread.", "error");
        return false;
      }
    },

    markAllAsRead: async () => {
      const state = get();
      if (state.unreadCount <= 0) return true;

      const previous = state.notifications;
      const previousUnreadCount = state.unreadCount;

      const now = new Date().toISOString();
      const nextNotifications = previous.map((notification) =>
        notification.isRead
          ? notification
          : {
              ...notification,
              isRead: true,
              readAt: notification.readAt || now,
            }
      );

      set({
        notifications: nextNotifications,
        unreadCount: 0,
      });

      try {
        await api.put.markAllNotificationsRead();
        return true;
      } catch {
        set({
          notifications: previous,
          unreadCount: previousUnreadCount,
        });
        showNotification("Unable to mark all notifications as read.", "error");
        return false;
      }
    },

    setConnected: (connected) => {
      set({ connected });
    },

    reset: () => {
      set({ ...createInitialState() });
    },
  })
);
