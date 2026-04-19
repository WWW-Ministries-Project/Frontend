import { baseUrl } from "@/pages/Authentication/utils/helpers";
import type {
  InAppNotification,
  NotificationPriority,
} from "@/utils/api/notifications/interfaces";
import { relativePath } from "@/utils/const";

type UnknownRecord = Record<string, unknown>;

const HIGH_PRIORITY = new Set(["HIGH", "CRITICAL"]);
const DEFAULT_SSE_PATH = "notifications/stream";

const toRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return fallback;
};

const toInteger = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const normalizePriority = (
  priority: NotificationPriority | null | undefined
): string => {
  const normalized = toNonEmptyString(priority)?.toUpperCase();
  return normalized || "LOW";
};

export const isHighPriorityNotification = (
  priority: NotificationPriority | null | undefined
): boolean => HIGH_PRIORITY.has(normalizePriority(priority));

const safeTimestamp = (value: unknown): string => {
  const direct = toNonEmptyString(value);
  if (!direct) return new Date().toISOString();

  const parsed = Date.parse(direct);
  if (Number.isNaN(parsed)) return new Date().toISOString();

  return new Date(parsed).toISOString();
};

const getObjectValue = (
  record: UnknownRecord,
  keys: string[]
): unknown | undefined => {
  for (const key of keys) {
    if (record[key] !== undefined) {
      return record[key];
    }
  }

  return undefined;
};

const hasNotificationHint = (record: UnknownRecord): boolean => {
  const hasIdentity =
    getObjectValue(record, ["id", "notification_id", "notificationId"]) !==
      undefined ||
    getObjectValue(record, ["dedupeKey", "dedupe_key"]) !== undefined;

  if (hasIdentity) return true;

  const hasMessageContent =
    getObjectValue(record, ["title", "heading"]) !== undefined ||
    getObjectValue(record, ["body", "message", "content"]) !== undefined;

  if (hasMessageContent) return true;

  const hasType =
    toNonEmptyString(getObjectValue(record, ["type", "event_type"])) !== undefined;

  const hasMetadataHint =
    getObjectValue(record, ["entityType", "entity_type"]) !== undefined ||
    getObjectValue(record, ["entityId", "entity_id"]) !== undefined ||
    getObjectValue(record, ["actionUrl", "action_url", "url", "link"]) !==
      undefined ||
    getObjectValue(record, ["priority", "importance", "level"]) !== undefined ||
    getObjectValue(record, ["isRead", "is_read"]) !== undefined ||
    getObjectValue(record, ["readAt", "read_at"]) !== undefined ||
    getObjectValue(record, ["createdAt", "created_at", "timestamp"]) !== undefined;

  return hasType && hasMetadataHint;
};

export const normalizeInAppNotification = (
  payload: unknown
): InAppNotification | null => {
  const record = toRecord(payload);
  if (!record) return null;
  if (!hasNotificationHint(record)) return null;

  const rawType =
    toNonEmptyString(getObjectValue(record, ["type", "event_type"])) ||
    "system.notification";

  const title =
    toNonEmptyString(getObjectValue(record, ["title", "heading"])) ||
    "Notification";

  const body =
    toNonEmptyString(getObjectValue(record, ["body", "message", "content"])) ||
    "";

  const createdAt = safeTimestamp(
    getObjectValue(record, ["createdAt", "created_at", "timestamp"])
  );

  const entityType = toNonEmptyString(
    getObjectValue(record, ["entityType", "entity_type"])
  );

  const entityId = toNonEmptyString(
    getObjectValue(record, ["entityId", "entity_id"])
  );

  const dedupeKey = toNonEmptyString(
    getObjectValue(record, ["dedupeKey", "dedupe_key"])
  );

  const actionUrl = toNonEmptyString(
    getObjectValue(record, ["actionUrl", "action_url", "url", "link"])
  );

  const rawId =
    toNonEmptyString(
      getObjectValue(record, ["id", "notification_id", "notificationId"])
    ) ||
    dedupeKey ||
    `${rawType}:${entityType || "na"}:${entityId || "na"}:${createdAt}`;

  return {
    id: rawId,
    type: rawType,
    title,
    body,
    recipientUserId: toNonEmptyString(
      getObjectValue(record, ["recipientUserId", "recipient_user_id"])
    ),
    actorUserId: toNonEmptyString(
      getObjectValue(record, ["actorUserId", "actor_user_id"])
    ),
    entityType,
    entityId,
    actionUrl,
    priority: toNonEmptyString(
      getObjectValue(record, ["priority", "importance", "level"])
    ),
    isRead: toBoolean(getObjectValue(record, ["isRead", "is_read"]), false),
    createdAt,
    readAt: toNonEmptyString(getObjectValue(record, ["readAt", "read_at"])),
    dedupeKey,
  };
};

export type NotificationCollection = {
  items: InAppNotification[];
  total?: number;
  page?: number;
  take?: number;
  limit?: number;
};

const extractArrayPayload = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload;

  const record = toRecord(payload);
  if (!record) return null;

  const directArray = getObjectValue(record, [
    "items",
    "notifications",
    "rows",
    "results",
  ]);

  if (Array.isArray(directArray)) return directArray;

  const dataPayload = record.data;
  if (Array.isArray(dataPayload)) return dataPayload;

  const nestedRecord = toRecord(dataPayload);
  if (!nestedRecord) return null;

  const nestedArray = getObjectValue(nestedRecord, [
    "items",
    "notifications",
    "rows",
    "results",
  ]);

  return Array.isArray(nestedArray) ? nestedArray : null;
};

export const normalizeNotificationCollection = (
  payload: unknown
): NotificationCollection => {
  const itemsPayload = extractArrayPayload(payload) || [];
  const items = itemsPayload
    .map((item) => normalizeInAppNotification(item))
    .filter((item): item is InAppNotification => Boolean(item));

  const record = toRecord(payload);
  const nestedRecord = toRecord(record?.data);

  return {
    items,
    total:
      toInteger(record?.total) ??
      toInteger(record?.count) ??
      toInteger(nestedRecord?.total) ??
      toInteger(nestedRecord?.count),
    page:
      toInteger(record?.page) ??
      toInteger(record?.current_page) ??
      toInteger(nestedRecord?.page) ??
      toInteger(nestedRecord?.current_page),
    take:
      toInteger(record?.take) ??
      toInteger(record?.limit) ??
      toInteger(record?.page_size) ??
      toInteger(nestedRecord?.take) ??
      toInteger(nestedRecord?.limit) ??
      toInteger(nestedRecord?.page_size),
    limit:
      toInteger(record?.limit) ??
      toInteger(record?.take) ??
      toInteger(record?.page_size) ??
      toInteger(nestedRecord?.limit) ??
      toInteger(nestedRecord?.take) ??
      toInteger(nestedRecord?.page_size),
  };
};

const extractEmbeddedNotificationPayload = (payload: unknown): unknown[] => {
  const record = toRecord(payload);
  if (!record) return [];

  const extractFromRecord = (source: UnknownRecord): unknown[] => {
    const direct = getObjectValue(source, ["notification", "payload"]);
    if (Array.isArray(direct)) return direct;
    if (direct) return [direct];
    return [];
  };

  const directPayload = extractFromRecord(record);
  if (directPayload.length > 0) return directPayload;

  const nestedRecord = toRecord(record.data);
  if (!nestedRecord) return [];

  const nestedPayload = extractFromRecord(nestedRecord);
  if (nestedPayload.length > 0) return nestedPayload;

  if (hasNotificationHint(nestedRecord)) {
    return [nestedRecord];
  }

  return [];
};

export const extractNotificationsFromPayload = (
  payload: unknown
): InAppNotification[] => {
  const collection = normalizeNotificationCollection(payload);
  if (collection.items.length > 0) {
    return collection.items;
  }

  const embeddedPayload = extractEmbeddedNotificationPayload(payload);
  if (embeddedPayload.length > 0) {
    return embeddedPayload
      .map((item) => normalizeInAppNotification(item))
      .filter((item): item is InAppNotification => Boolean(item));
  }

  const directNotification = normalizeInAppNotification(payload);
  if (directNotification) {
    return [directNotification];
  }

  return [];
};

export const parseUnreadCount = (payload: unknown): number | null => {
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return Math.max(0, Math.floor(payload));
  }

  const record = toRecord(payload);
  if (!record) return null;

  const direct =
    toInteger(record.unreadCount) ??
    toInteger(record.unread_count) ??
    toInteger(record.count) ??
    toInteger(record.total_unread);

  if (direct !== undefined) {
    return Math.max(0, direct);
  }

  const nestedRecord = toRecord(record.data);
  if (!nestedRecord) return null;

  const nested =
    toInteger(nestedRecord.unreadCount) ??
    toInteger(nestedRecord.unread_count) ??
    toInteger(nestedRecord.count) ??
    toInteger(nestedRecord.total_unread);

  return nested !== undefined ? Math.max(0, nested) : null;
};

const getNotificationSortValue = (notification: InAppNotification): number => {
  const parsed = Date.parse(notification.createdAt);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getNotificationIdentity = (notification: InAppNotification): string => {
  if (notification.id) return `id:${notification.id}`;
  if (notification.dedupeKey) return `key:${notification.dedupeKey}`;

  return [
    notification.type,
    notification.entityType || "na",
    notification.entityId || "na",
    notification.createdAt,
  ].join(":");
};

export type MergeNotificationsResult = {
  notifications: InAppNotification[];
  unreadDelta: number;
  added: InAppNotification[];
};

export const mergeNotifications = (
  existing: InAppNotification[],
  incoming: InAppNotification[]
): MergeNotificationsResult => {
  if (!incoming.length) {
    return {
      notifications: [...existing],
      unreadDelta: 0,
      added: [],
    };
  }

  const next = [...existing];
  const byIdentity = new Map<string, number>();
  let unreadDelta = 0;
  const added: InAppNotification[] = [];

  next.forEach((notification, index) => {
    byIdentity.set(getNotificationIdentity(notification), index);
  });

  incoming.forEach((notification) => {
    const identity = getNotificationIdentity(notification);
    const index = byIdentity.get(identity);

    if (index === undefined) {
      next.push(notification);
      byIdentity.set(identity, next.length - 1);
      if (!notification.isRead) unreadDelta += 1;
      added.push(notification);
      return;
    }

    const previous = next[index];
    const merged = {
      ...previous,
      ...notification,
    };

    next[index] = merged;

    if (previous.isRead && !merged.isRead) unreadDelta += 1;
    if (!previous.isRead && merged.isRead) unreadDelta -= 1;
  });

  next.sort(
    (left, right) => getNotificationSortValue(right) - getNotificationSortValue(left)
  );

  return {
    notifications: next,
    unreadDelta,
    added,
  };
};

export const formatNotificationTime = (createdAt: string): string => {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return "";

  const diff = timestamp - Date.now();
  const absMs = Math.abs(diff);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absMs < 60_000) {
    return rtf.format(Math.round(diff / 1000), "second");
  }

  if (absMs < 3_600_000) {
    return rtf.format(Math.round(diff / 60_000), "minute");
  }

  if (absMs < 86_400_000) {
    return rtf.format(Math.round(diff / 3_600_000), "hour");
  }

  if (absMs < 2_592_000_000) {
    return rtf.format(Math.round(diff / 86_400_000), "day");
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
};

export const humanizeNotificationType = (value: string): string => {
  const token = value.trim();
  if (!token) return "Notification";

  return token
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const normalizeInternalPath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;

  return `/${trimmed}`;
};

export type NotificationNavigationTarget = {
  url: string;
  external: boolean;
};

const encodeRequisitionId = (value: string): string => {
  try {
    return window.btoa(String(value));
  } catch {
    return value;
  }
};

const getPortalDefaults = (currentPathname?: string) => {
  const pathname = currentPathname || window.location.pathname;
  const isMemberPortal = pathname.startsWith("/member");

  return {
    isMemberPortal,
    dashboard: isMemberPortal
      ? relativePath.member.dashboard
      : `${relativePath.home.main}/${relativePath.home.dashboard}`,
    appointments: isMemberPortal
      ? relativePath.member.appointments
      : `${relativePath.home.main}/appointments`,
    notifications: isMemberPortal
      ? relativePath.member.notifications
      : `${relativePath.home.main}/${relativePath.home.notifications}`,
  };
};

const buildFallbackActionUrl = (
  notification: InAppNotification,
  currentPathname?: string
): string => {
  const { dashboard, appointments } = getPortalDefaults(currentPathname);

  const entityType = (notification.entityType || "").trim().toLowerCase();
  const typeToken = notification.type.trim().toLowerCase();

  if (entityType.includes("requisition") || typeToken.includes("requisition")) {
    const baseRoute = `${relativePath.home.main}/requests`;
    if (notification.entityId) {
      return `${baseRoute}/${encodeRequisitionId(notification.entityId)}`;
    }
    return baseRoute;
  }

  if (entityType.includes("appointment") || typeToken.includes("appointment")) {
    return appointments;
  }

  if (entityType.includes("financial") || typeToken.includes("financial")) {
    if (notification.entityId) {
      return `${relativePath.home.main}/finance/${notification.entityId}`;
    }

    return `${relativePath.home.main}/finance`;
  }

  if (
    entityType.includes("order") ||
    entityType.includes("payment") ||
    entityType.includes("delivery") ||
    typeToken.includes("order") ||
    typeToken.includes("payment") ||
    typeToken.includes("delivery")
  ) {
    return relativePath.member.orders;
  }

  if (
    entityType.includes("follow") ||
    entityType.includes("visitor") ||
    typeToken.includes("follow") ||
    typeToken.includes("visitor")
  ) {
    if (notification.entityId) {
      return `${relativePath.home.main}/visitors/visitor/${notification.entityId}`;
    }

    return `${relativePath.home.main}/visitors`;
  }

  if (entityType.includes("event") || typeToken.includes("event")) {
    return `${relativePath.home.main}/events`;
  }

  if (typeToken.includes("system") || typeToken.includes("job")) {
    return `${relativePath.home.main}/${relativePath.home.dashboard}`;
  }

  return dashboard;
};

export const resolveNotificationNavigationTarget = (
  notification: InAppNotification,
  currentPathname?: string
): NotificationNavigationTarget => {
  const rawActionUrl = toNonEmptyString(notification.actionUrl);
  if (!rawActionUrl) {
    return {
      url: buildFallbackActionUrl(notification, currentPathname),
      external: false,
    };
  }

  if (isAbsoluteUrl(rawActionUrl)) {
    try {
      const parsedUrl = new URL(rawActionUrl);
      const currentOrigin = window.location.origin;

      if (parsedUrl.origin !== currentOrigin) {
        return { url: parsedUrl.toString(), external: true };
      }

      return {
        url: `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`,
        external: false,
      };
    } catch {
      return {
        url: rawActionUrl,
        external: true,
      };
    }
  }

  return {
    url: normalizeInternalPath(rawActionUrl),
    external: false,
  };
};

export const parseNotificationStreamToken = (payload: unknown): string | null => {
  const direct = toNonEmptyString(payload);
  if (direct) return direct;

  const record = toRecord(payload);
  if (!record) return null;

  const token =
    toNonEmptyString(record.streamToken) ??
    toNonEmptyString(record.stream_token) ??
    toNonEmptyString(record.token);

  if (token) return token;

  const nestedRecord = toRecord(record.data);
  if (!nestedRecord) return null;

  return (
    toNonEmptyString(nestedRecord.streamToken) ??
    toNonEmptyString(nestedRecord.stream_token) ??
    toNonEmptyString(nestedRecord.token) ??
    null
  );
};

export const resolveNotificationSseUrl = (
  streamToken?: string,
  lastEventId?: string
): string => {
  const normalizedPath = DEFAULT_SSE_PATH.startsWith("/")
    ? DEFAULT_SSE_PATH.slice(1)
    : DEFAULT_SSE_PATH;

  const origin =
    toNonEmptyString(baseUrl) ||
    toNonEmptyString(window.location.origin) ||
    "";

  try {
    const url = new URL(normalizedPath, origin);
    const normalizedToken = toNonEmptyString(streamToken);
    const normalizedLastEventId = toNonEmptyString(lastEventId);

    if (normalizedToken) {
      url.searchParams.set("stream_token", normalizedToken);
    }
    if (normalizedLastEventId) {
      url.searchParams.set("lastEventId", normalizedLastEventId);
      url.searchParams.set("last_event_id", normalizedLastEventId);
    }

    return url.toString();
  } catch {
    const baseUrlValue = `${window.location.origin}/${normalizedPath}`;
    const normalizedToken = toNonEmptyString(streamToken);
    const normalizedLastEventId = toNonEmptyString(lastEventId);
    const query = new URLSearchParams();

    if (normalizedToken) {
      query.set("stream_token", normalizedToken);
    }

    if (normalizedLastEventId) {
      query.set("lastEventId", normalizedLastEventId);
      query.set("last_event_id", normalizedLastEventId);
    }

    if ([...query.keys()].length === 0) return baseUrlValue;

    const separator = baseUrlValue.includes("?") ? "&" : "?";
    return `${baseUrlValue}${separator}${query.toString()}`;
  }
};

export const isRecentNotification = (
  createdAt: string,
  thresholdMs = 300_000
): boolean => {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return false;

  return Math.abs(Date.now() - timestamp) <= thresholdMs;
};
