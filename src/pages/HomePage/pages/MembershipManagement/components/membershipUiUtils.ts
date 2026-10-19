import type { PillTone } from "./membershipUi";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type MemberStage = "UNCONFIRMED" | "CONFIRMED" | "MEMBER";

export const MEMBER_STAGES: {
  value: MemberStage;
  label: string;
  description: string;
}[] = [
  {
    value: "UNCONFIRMED",
    label: "Unconfirmed",
    description: "Registered and awaiting confirmation",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
    description: "Completed the membership class",
  },
  {
    value: "MEMBER",
    label: "Functional member",
    description: "Serving and active in church life",
  },
];

export const memberStatusPill = (member: {
  is_active?: boolean | null;
  status?: string | null;
}): { label: string; tone: PillTone } => {
  if (member.is_active === false) return { label: "Inactive", tone: "neutral" };
  if (member.status === "MEMBER")
    return { label: "Functional member", tone: "success" };
  if (member.status === "CONFIRMED") return { label: "Confirmed", tone: "info" };
  return { label: "Unconfirmed", tone: "warning" };
};


export const formatDate = (value?: string | Date | null): string => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const daysSince = (value?: string | Date | null): number | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
};

export const daysAgoLabel = (value?: string | Date | null): string => {
  const days = daysSince(value);
  if (days === null) return "";
  if (days === 0) return "Today";
  return `${days} ${days === 1 ? "day" : "days"} ago`;
};

export const initialsOf = (name?: string | null): string =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;
