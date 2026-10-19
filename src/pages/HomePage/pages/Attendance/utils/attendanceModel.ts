import type {
  BiometricEventAttendanceRecord,
  EventResponseType,
} from "@/utils/api/events/interfaces";
import type { AttendanceTimingSettingsConfig } from "@/utils/api/settings/attendanceTimingInterfaces";

import type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

/* -------------------------------------------------------------------------- */
/*                                   Dates                                    */
/* -------------------------------------------------------------------------- */

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
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const p2 = (value: number) => String(value).padStart(2, "0");

/** Local `YYYY-MM-DD` for a Date. */
export const isoDay = (date: Date) =>
  `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;

export const todayKey = () => isoDay(new Date());

/** `YYYY-MM-DD` from an API date (ISO string or date-only). Empty when unparseable. */
export const dayKey = (value: unknown): string => {
  if (typeof value !== "string" || !value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : isoDay(parsed);
};

export const keyToDate = (key: string) => new Date(`${key}T00:00:00`);

export const addDays = (key: string, days: number) => {
  const date = keyToDate(key);
  date.setDate(date.getDate() + days);
  return isoDay(date);
};

export const daysBetween = (a: string, b: string) =>
  Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / 864e5);

export const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export const weekdayOf = (key: string) => keyToDate(key).getDay();

/** "19 Oct 2026" */
export const fmtDate = (key: string) => {
  if (!key) return "—";
  const date = keyToDate(key);
  return `${date.getDate()} ${MON[date.getMonth()]} ${date.getFullYear()}`;
};

/** "Sun 18 Oct" */
export const fmtShort = (key: string) => {
  if (!key) return "—";
  const date = keyToDate(key);
  return `${DOW[date.getDay()]} ${date.getDate()} ${MON[date.getMonth()]}`;
};

export const monthLabel = (monthKey: string) =>
  `${MONF[Number(monthKey.slice(5, 7)) - 1]} ${monthKey.slice(0, 4)}`;

/** "HH:mm" → "9:30 AM". */
export const t12 = (time: string) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time || "");
  if (!match) return "";
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? "AM" : "PM"}`;
};

/** Local clock time of an ISO timestamp, "9:30 AM". */
export const clock = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return t12(`${p2(date.getHours())}:${p2(date.getMinutes())}`);
};

/* -------------------------------------------------------------------------- */
/*                                  Numbers                                   */
/* -------------------------------------------------------------------------- */

export const nf = (value: number) => Math.round(value || 0).toLocaleString("en-US");

export const nk = (value: number) =>
  value >= 10000 ? `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}k` : nf(value);

export const pc = (part: number, whole: number) => (whole ? Math.round((part * 100) / whole) : 0);

export const share = (part: number, whole: number) =>
  whole ? `${Math.round((part * 1000) / whole) / 10}%` : "0%";

export const plural = (count: number, word: string, many = `${word}s`) =>
  `${count} ${count === 1 ? word : many}`;

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toText = (value: unknown) =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (isRecord(value) && Array.isArray(value.data)) return value.data as T[];
  return [];
};

/* -------------------------------------------------------------------------- */
/*                            Headcount (summaries)                           */
/* -------------------------------------------------------------------------- */

export interface AttendanceRecord {
  id: string;
  eventId: string;
  eventName: string;
  date: string;
  adultMale: number;
  adultFemale: number;
  youthMale: number;
  youthFemale: number;
  childrenMale: number;
  childrenFemale: number;
  visitorsMale: number;
  visitorsFemale: number;
  clergyMale: number;
  clergyFemale: number;
  recordedByName: string;
  /** Day the record was first entered. */
  enteredOn: string;
}

export const normalizeRecord = (raw: Record<string, unknown>): AttendanceRecord => {
  const breakdown = isRecord(raw.visitorBreakdown) ? raw.visitorBreakdown : {};
  const visitors = isRecord(breakdown.visitors) ? breakdown.visitors : {};
  const clergy = isRecord(breakdown.visitorClergy) ? breakdown.visitorClergy : {};
  return {
    id: toText(raw.id ?? raw.attendance_id),
    eventId: toText(raw.eventId ?? raw.event_id ?? raw.event_mgt_id),
    eventName: toText(raw.event_name ?? raw.eventName),
    date: dayKey(raw.date),
    adultMale: toNumber(raw.adultMale ?? raw.adult_male),
    adultFemale: toNumber(raw.adultFemale ?? raw.adult_female),
    youthMale: toNumber(raw.youthMale ?? raw.youth_male),
    youthFemale: toNumber(raw.youthFemale ?? raw.youth_female),
    childrenMale: toNumber(raw.childrenMale ?? raw.children_male),
    childrenFemale: toNumber(raw.childrenFemale ?? raw.children_female),
    visitorsMale: toNumber(raw.visitorsMale ?? visitors.male),
    visitorsFemale: toNumber(raw.visitorsFemale ?? visitors.female),
    clergyMale: toNumber(raw.visitorClergyMale ?? clergy.male),
    clergyFemale: toNumber(raw.visitorClergyFemale ?? clergy.female),
    recordedByName: toText(raw.recordedByName ?? raw.recorded_by_name) || "Unknown",
    enteredOn: dayKey(raw.created_at) || dayKey(raw.date),
  };
};

export interface RecordTotals {
  mem: number;
  vis: number;
  cl: number;
  total: number;
  adults: number;
  youth: number;
  children: number;
  male: number;
  female: number;
}

export const totalsOf = (r: AttendanceRecord): RecordTotals => {
  const adults = r.adultMale + r.adultFemale;
  const youth = r.youthMale + r.youthFemale;
  const children = r.childrenMale + r.childrenFemale;
  const vis = r.visitorsMale + r.visitorsFemale;
  const cl = r.clergyMale + r.clergyFemale;
  const mem = adults + youth + children;
  return {
    mem,
    vis,
    cl,
    total: mem + vis + cl,
    adults,
    youth,
    children,
    male: r.adultMale + r.youthMale + r.childrenMale + r.visitorsMale + r.clergyMale,
    female: r.adultFemale + r.youthFemale + r.childrenFemale + r.visitorsFemale + r.clergyFemale,
  };
};

/* -------------------------------------------------------------------------- */
/*                             Event occurrences                              */
/* -------------------------------------------------------------------------- */

export interface Occurrence {
  id: string;
  name: string;
  /** Lower-cased name: occurrences of the same service share it. */
  groupKey: string;
  date: string;
  time: string;
  type: EventResponseType["event_type"];
  typeLabel: string;
  registrations: number;
  requiresRegistration: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  SERVICE: "Service",
  PROGRAM: "Program",
  ACTIVITY: "Activity",
  other: "Event",
};

export const groupKeyOf = (name: string) => name.trim().toLowerCase() || "unnamed";

export const normalizeEvent = (event: EventResponseType): Occurrence => {
  const name = toText(event.name).trim() || `Event ${event.id}`;
  return {
    id: String(event.id),
    name,
    groupKey: groupKeyOf(name),
    date: dayKey(event.start_date),
    time: toText(event.start_time),
    type: event.event_type,
    typeLabel: TYPE_LABEL[event.event_type] || "Event",
    registrations: toNumber(event.registration_count ?? event.event_registers?.length ?? 0),
    requiresRegistration: Boolean(event.requires_registration),
  };
};

/** Event types that take a headcount. Activities (rehearsals, meetings) do not. */
export const takesHeadcount = (occ: Occurrence) => occ.type === "SERVICE" || occ.type === "PROGRAM";

export const occurrenceLabel = (occ: Occurrence) =>
  `${occ.name} · ${fmtShort(occ.date)} ${occ.date.slice(0, 4)}`;

/* -------------------------------------------------------------------------- */
/*                            Biometric check-ins                             */
/* -------------------------------------------------------------------------- */

export interface CheckIn {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
  name: string;
  memberId: string;
  department: string;
  position: string;
  date: string;
  firstAt: string;
  lastAt: string;
  punches: number;
  devices: string[];
  official: boolean;
}

export const normalizeCheckIn = (row: BiometricEventAttendanceRecord): CheckIn => {
  const primary =
    row.department_positions.find((entry) => entry.department_name) || row.department_positions[0];
  return {
    id: `${row.event_id}:${row.user_id}:${row.attendance_date}`,
    eventId: String(row.event_id),
    eventName: row.event_name || "Unknown event",
    userId: String(row.user_id),
    name: row.user_name || "Unknown member",
    memberId: row.member_id || "",
    department: primary?.department_name || "No department",
    position: primary?.position_name || "",
    date: dayKey(row.attendance_date),
    firstAt: row.first_punch_at,
    lastAt: row.last_punch_at,
    punches: row.punch_count,
    devices: row.device_ips || [],
    official: Boolean(row.attendance_recorded),
  };
};

export interface TimingRules {
  earlyMinutes: number;
  lateMinutes: number;
}

export const DEFAULT_TIMING: TimingRules = { earlyMinutes: 15, lateMinutes: 15 };

export const timingFromConfig = (config?: AttendanceTimingSettingsConfig | null): TimingRules => ({
  earlyMinutes: config?.early?.minutes || DEFAULT_TIMING.earlyMinutes,
  lateMinutes: config?.late?.minutes || DEFAULT_TIMING.lateMinutes,
});

/** Minutes between the first punch and the event start; null without a start time. */
export const minutesFromStart = (checkIn: CheckIn, occ?: Occurrence): number | null => {
  if (!occ || !occ.time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(occ.time);
  const first = new Date(checkIn.firstAt);
  if (!match || Number.isNaN(first.getTime())) return null;
  const start = keyToDate(occ.date || checkIn.date);
  start.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return Math.round((first.getTime() - start.getTime()) / 60000);
};

export type ArrivalKey = "early" | "ontime" | "late" | "unknown";

export const arrivalOf = (
  offset: number | null,
  rules: TimingRules
): { key: ArrivalKey; label: string; tone: PillTone } => {
  if (offset === null) return { key: "unknown", label: "No start time", tone: "neutral" };
  if (offset <= -rules.earlyMinutes) return { key: "early", label: `Early · ${-offset} min`, tone: "info" };
  if (offset < rules.lateMinutes) return { key: "ontime", label: "On time", tone: "success" };
  return { key: "late", label: `Late · ${offset} min`, tone: "warning" };
};

/* -------------------------------------------------------------------------- */
/*                                    CSV                                     */
/* -------------------------------------------------------------------------- */

export const downloadCsv = (filename: string, rows: (string | number | null | undefined)[][]) => {
  const esc = (cell: string | number | null | undefined) => {
    const text = String(cell ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const body = "﻿" + rows.map((row) => row.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/* -------------------------------------------------------------------------- */
/*                                  Routing                                   */
/* -------------------------------------------------------------------------- */

export const ATTENDANCE_PATHS = {
  church: "/home/church-attendance",
  event: "/home/church-attendance/event-attendance",
  analytics: "/home/church-attendance/analytics",
};
