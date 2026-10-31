export type MessageTemplateKey =
  | "WELCOME_MEMBER"
  | "WELCOME_GUEST"
  | "WELCOME_VISITOR"
  | "BIRTHDAY";

export type PlaceholderKind = "WELCOME" | "BIRTHDAY" | "GENERAL";

export interface MessageChannels {
  sms: boolean;
  email: boolean;
  inApp: boolean;
}

export interface MessageTemplate {
  key: MessageTemplateKey;
  enabled: boolean;
  channels: MessageChannels;
  emailSubject: string | null;
  body: string;
  includeAppLink: boolean;
  updatedAt: string;
}

export interface UpdateMessageTemplateDto {
  enabled: boolean;
  channels: MessageChannels;
  emailSubject: string | null;
  body: string;
  includeAppLink: boolean;
}

export interface MessagingSettings {
  app_store_url: string | null;
  play_store_url: string | null;
  birthday_send_time: string;
  timezone: string;
  last_birthday_run_date: string | null;
}

export interface UpdateMessagingSettingsDto {
  appStoreUrl: string;
  playStoreUrl: string;
  birthdaySendTime: string;
}

export interface PlaceholderInfo {
  token: string;
  description: string;
  kinds: PlaceholderKind[];
}

export interface MessagePreviewRequest {
  body: string;
  subject?: string | null;
  kind: PlaceholderKind;
  includeAppLink?: boolean;
}

export interface MessagePreview {
  body: string;
  subject: string | null;
  sms: { length: number; segments: number; unicode: boolean };
  unknownPlaceholders: string[];
}

export type AudienceScope = "CHURCH" | "DEPARTMENTS" | "PEOPLE";

export interface MessageAudience {
  scope: AudienceScope;
  departmentIds: number[];
  userIds: number[];
  includeGuests: boolean;
  includeVisitors: boolean;
}

export interface AudienceCount {
  people: number;
  sms: number;
  email: number;
  inApp: number;
}

export interface ChannelCounts {
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
}

export type DispatchStatus = "SCHEDULED" | "QUEUED" | "SENT" | "CANCELLED" | "FAILED";
export type DispatchKind = "WELCOME" | "BIRTHDAY" | "GENERAL";

export interface MessageDispatch {
  id: number;
  kind: DispatchKind;
  templateKey: MessageTemplateKey | null;
  title: string;
  body: string;
  emailSubject: string | null;
  channels: MessageChannels;
  audience: MessageAudience | null;
  status: DispatchStatus;
  scheduledFor: string | null;
  error: string | null;
  counts: {
    sms: ChannelCounts;
    email: ChannelCounts;
    inApp: ChannelCounts;
    people?: number;
  } | null;
  createdBy: number | null;
  createdByName?: string | null;
  /** "Whole church", a department name, "Departments (3)" or "4 people". List only. */
  audienceLabel?: string | null;
  createdAt: string;
}

export type DispatchFilter = "all" | "scheduled" | "sent" | "failed";

export interface MessagingOverview {
  days: number;
  messagesSent: number;
  delivered: number;
  failed: number;
  /** Percent with one decimal, or null when nothing was attempted. */
  deliveryRate: number | null;
  smsSegmentsUsed: number;
}

export interface CreateGeneralMessageDto {
  title: string;
  body: string;
  emailSubject: string | null;
  channels: MessageChannels;
  audience: MessageAudience;
  scheduledFor?: string;
}

export type RecipientChannel = "SMS" | "EMAIL" | "IN_APP";
export type RecipientStatus = "PENDING" | "SENDING" | "SENT" | "FAILED" | "SKIPPED";

export interface MessageRecipient {
  id: number;
  channel: RecipientChannel;
  recipient_name: string;
  address: string | null;
  status: RecipientStatus;
  error: string | null;
  attempts: number;
  sent_at: string | null;
  user_id: number | null;
  visitor_id: number | null;
}

export type TemplateStats = Record<
  MessageTemplateKey,
  { sent: number; failed: number; skipped: number }
>;

export interface UpcomingBirthday {
  userId: number;
  name: string;
  date: string;
  age: number | null;
}
