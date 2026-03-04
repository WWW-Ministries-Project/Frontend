export type NotificationPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | string;

export interface InAppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  recipientUserId?: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  priority?: NotificationPriority | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  dedupeKey?: string | null;
}

export interface NotificationListPayload {
  items: InAppNotification[];
  total?: number;
  page?: number;
  take?: number;
}

export interface NotificationUnreadCountPayload {
  unreadCount: number;
}

export interface NotificationStreamTokenPayload {
  streamToken: string;
  expiresAt?: string;
}

export interface NotificationPushPublicKeyPayload {
  publicKey?: string;
  public_key?: string;
  vapidPublicKey?: string;
  vapid_public_key?: string;
  key?: string;
}

export interface NotificationPushSubscriptionPayload {
  subscription: PushSubscriptionJSON;
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  userAgent?: string;
  platform?: string;
  language?: string;
  timezone?: string;
}
