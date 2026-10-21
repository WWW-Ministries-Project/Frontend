import { useEffect, useState } from "react";

import { encodeQuery } from "@/pages/HomePage/utils/helperFunctions";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import type { LifeCenterOverviewMeeting } from "@/utils/api/lifeCenter/interfaces";
import { relativePath } from "@/utils/const";

import type { PillTone } from "../../MembershipManagement/components/membershipUi";
import { addDaysKey, downloadCsv, todayKey } from "../../Requisitions/utils/requisitionModel";

/** Pure helpers shared by the Life Center pages. Days are `YYYY-MM-DD` keys. */

export { addDaysKey, downloadCsv, todayKey };

export const LC_BASE = `${relativePath.home.main}/${relativePath.home.lifeCenter.main}`;
export const lcDetailPath = (id: string | number) => `${LC_BASE}/life-center/${encodeQuery(String(id))}`;
export const LC_ANALYTICS_PATH = `${LC_BASE}/life-center-analytics`;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];
export const DAYF: Record<Day, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONF = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const CURRENCIES = [
  { value: "GHS", label: "Ghana Cedi (GHS)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "GBP", label: "British Pound (GBP)" },
];
/**
 * Built-in roles and the names they already go by in the data ("CENTER LEADER"
 * predates the redesign and is the leader role). Matches the backend.
 */
const ROLE_ALIASES = {
  leader: ["leader", "center leader", "life center leader", "lifecenter leader", "centre leader", "life centre leader"],
  assistant: ["assistant leader", "assistant center leader", "assistant life center leader", "assistant centre leader"],
  member: ["member", "center member", "life center member", "centre member"],
} as const;
export type RoleKind = keyof typeof ROLE_ALIASES;
const normalizeRole = (name?: string | null) =>
  String(name ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
export const roleKind = (name?: string | null): RoleKind | null => {
  const n = normalizeRole(name);
  return (Object.keys(ROLE_ALIASES) as RoleKind[]).find((k) => (ROLE_ALIASES[k] as readonly string[]).includes(n)) ?? null;
};
export const isLeaderRole = (name?: string | null) => roleKind(name) === "leader";
export const isMemberRole = (name?: string | null) => roleKind(name) === "member";
/** Leader and Member always exist and can't be deleted. */
export const isLockedRole = (name?: string | null) => isLeaderRole(name) || isMemberRole(name);
export const DEFAULT_COUNTRY_CODE = "+233";

/** Server day names ("Wednesday", "wed") → short keys, in week order. */
export const toDays = (names: string[] | null | undefined): Day[] => {
  const set = new Set(
    (names ?? [])
      .map((name) => name.trim().slice(0, 3).toLowerCase())
      .map((short) => DAYS.find((d) => d.toLowerCase() === short))
      .filter(Boolean) as Day[]
  );
  return DAYS.filter((d) => set.has(d));
};
export const dayNames = (days: Day[]) => days.map((d) => DAYF[d]);
export const joinAnd = (list: string[]) =>
  list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;

/** First 10 chars of a server date: meeting dates are stored at UTC midnight. */
export const dayKey = (value?: string | null) => (value ? String(value).slice(0, 10) : "");

const asDate = (day: string) => new Date(`${day}T00:00:00`);
export const dow = (day: string): Day => DAYS[(asDate(day).getDay() + 6) % 7];
export const daysBetween = (a: string, b: string) => Math.round((asDate(b).getTime() - asDate(a).getTime()) / 864e5);
export const fmtS = (day: string) => {
  const d = asDate(day);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
};
export const fmtD = (day: string) => `${dow(day)} ${fmtS(day)}`;
export const fmtL = (day: string) => `${fmtS(day)} ${asDate(day).getFullYear()}`;
export const fmtDL = (day: string) => `${fmtD(day)} ${asDate(day).getFullYear()}`;
export const mondayOf = (day: string) => addDaysKey(day, -((asDate(day).getDay() + 6) % 7));

export const n0 = (n: number) => Math.round(n).toLocaleString("en-GB");
export const n1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
export const pctN = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
export const firstWord = (name: string) => name.trim().split(/\s+/)[0] || name;
export const initials = (name: string) => {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0] || "?")[0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};
export const ago = (day: string, today: string) => {
  const n = daysBetween(day, today);
  return n <= 0 ? "today" : n === 1 ? "yesterday" : `${n} days ago`;
};
export const slug = (name: string) => name.replace(/\W+/g, "-").replace(/^-|-$/g, "").toLowerCase();

type Money = Pick<LifeCenterOverviewMeeting, "offering" | "currency">;
/** "GHS 1,200 + USD 40" — cedis first. */
export const moneyMix = (list: Money[]) => {
  const by: Record<string, number> = {};
  list.forEach((g) => {
    by[g.currency] = (by[g.currency] || 0) + (Number(g.offering) || 0);
  });
  const keys = Object.keys(by).sort((a, b) => (a === "GHS" ? -1 : b === "GHS" ? 1 : a.localeCompare(b)));
  return keys.length ? keys.map((k) => `${k} ${n0(by[k])}`).join(" + ") : "GHS 0";
};
export const ghsOf = (list: Money[]) =>
  list.filter((g) => g.currency === "GHS").reduce((total, g) => total + (Number(g.offering) || 0), 0);

export const rateTone = (rate: number): PillTone => (rate >= 85 ? "success" : rate >= 60 ? "warning" : "danger");
export const TONE_TEXT: Record<string, string> = {
  success: "#15803D",
  warning: "#B45309",
  danger: "#B91C1C",
  info: "#1D4ED8",
  neutral: "#6B7280",
};
export const rateColor = (rate: number) => TONE_TEXT[rateTone(rate)];

/** Scheduled meetings between `from` and `to` (inclusive), counted up to yesterday and from when the center started. */
export const expectedMeetings = (
  center: { days: Day[]; created: string },
  from: string,
  to: string,
  today: string
) => {
  const start = from > center.created ? from : center.created;
  const yesterday = addDaysKey(today, -1);
  const end = to < yesterday ? to : yesterday;
  if (!center.days.length || start > end) return 0;
  let count = 0;
  for (let d = start; d <= end; d = addDaysKey(d, 1)) if (center.days.includes(dow(d))) count++;
  return count;
};

export const nextMeetingDay = (days: Day[], from: string) => {
  for (let i = 0; i < 14; i++) {
    const d = addDaysKey(from, i);
    if (days.includes(dow(d))) return d;
  }
  return null;
};

export const lastMetPill = (last: string | null, today: string): { label: string; tone: PillTone } => {
  if (!last) return { label: "No meetings yet", tone: "neutral" };
  const n = daysBetween(last, today);
  if (n <= 8) return { label: `Met ${ago(last, today)}`, tone: "success" };
  if (n <= 14) return { label: `Last met ${n} days ago`, tone: "warning" };
  return { label: `No meeting in ${n} days`, tone: "danger" };
};

/** Overdue once a center has gone more than this many days without a meeting. */
export const OVERDUE_DAYS = 14;
export const gapOf = (last: string | null, today: string) => (last ? daysBetween(last, today) : 999);

/** Active branch id for writes, or undefined for "All branches". */
export const useWriteBranchId = () => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  return activeBranchId && activeBranchId !== ALL_BRANCHES && Number(activeBranchId) > 0
    ? Number(activeBranchId)
    : undefined;
};

/** Today's calendar day; rolls over at midnight. */
export const useToday = () => {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayKey()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return today;
};

/** Pulls the server's message out of an axios-style error. */
export const errorText = (error: unknown, fallback: string) => {
  const e = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};
