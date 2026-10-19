import type {
  ChannelCounts,
  MessageChannels,
  MessageDispatch,
  MessageTemplateKey,
} from "@/utils/api/messaging/interfaces";
import type { PillTone } from "../../MembershipManagement/components/membershipUi";

export type ChannelKey = keyof MessageChannels;

export const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "inApp", label: "In-app" },
];

export const channelList = (channels: MessageChannels) =>
  CHANNELS.filter((channel) => channels[channel.key]).map((channel) => channel.label);

export const NO_CHANNELS: MessageChannels = { sms: false, email: false, inApp: false };

export interface Totals {
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
}

const ZERO: ChannelCounts = { sent: 0, failed: 0, skipped: 0, pending: 0 };

export const channelCounts = (dispatch: MessageDispatch, key: ChannelKey): ChannelCounts =>
  dispatch.counts?.[key] ?? ZERO;

export const totalsOf = (dispatch: MessageDispatch): Totals | null => {
  if (!dispatch.counts) return null;
  return CHANNELS.filter((channel) => dispatch.channels[channel.key]).reduce<Totals>(
    (acc, channel) => {
      const counts = channelCounts(dispatch, channel.key);
      return {
        sent: acc.sent + (counts.sent ?? 0),
        failed: acc.failed + (counts.failed ?? 0),
        skipped: acc.skipped + (counts.skipped ?? 0),
        pending: acc.pending + (counts.pending ?? 0),
      };
    },
    { sent: 0, failed: 0, skipped: 0, pending: 0 }
  );
};

/** Status pill for a message in history and its detail dialog. */
export const dispatchPill = (dispatch: MessageDispatch): { label: string; tone: PillTone } => {
  const totals = totalsOf(dispatch);
  if (dispatch.status === "SCHEDULED") return { label: "Scheduled", tone: "info" };
  if (dispatch.status === "CANCELLED") return { label: "Cancelled", tone: "neutral" };
  if (dispatch.status === "QUEUED" || (totals && totals.pending > 0)) return { label: "Sending", tone: "info" };
  if (dispatch.status === "FAILED" && (!totals || totals.sent === 0)) return { label: "Failed", tone: "danger" };
  if (totals && totals.failed > 0) return { label: `${totals.failed.toLocaleString("en-US")} failed`, tone: "warning" };
  return { label: "Delivered", tone: "success" };
};

export const peopleOf = (dispatch: MessageDispatch) => dispatch.counts?.people ?? null;

export const TEMPLATE_META: Record<MessageTemplateKey, { title: string; description: string }> = {
  WELCOME_MEMBER: { title: "Member sign-up", description: "Sent when someone joins as a member in the mobile app." },
  WELCOME_GUEST: { title: "Guest sign-up", description: "Sent when someone joins as a guest in the mobile app." },
  WELCOME_VISITOR: { title: "Visitor added", description: "Sent when a visitor who agreed to be contacted is added." },
  BIRTHDAY: { title: "Birthday", description: "Sent on each member’s birthday." },
};

export const TEMPLATE_ORDER: MessageTemplateKey[] = ["WELCOME_MEMBER", "WELCOME_GUEST", "WELCOME_VISITOR", "BIRTHDAY"];

/** Placeholder chips offered in the editors. The server whitelist is larger;
 *  these are the ones admins reach for. */
export const GENERAL_CHIPS = [
  { token: "first_name", label: "first name" },
  { token: "last_name", label: "last name" },
  { token: "church_name", label: "church name" },
];
export const BIRTHDAY_CHIPS = [...GENERAL_CHIPS, { token: "age", label: "age" }];
