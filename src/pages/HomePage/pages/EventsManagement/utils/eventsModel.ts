import {
  addDays,
  dayKey,
  isoDay,
  keyToDate,
  plural,
  t12,
  todayKey,
  weekdayOf,
} from "@/pages/HomePage/pages/Attendance/utils/attendanceModel";
import type { EventResponseType } from "@/utils/api/events/interfaces";

import type { eventType, ReminderOffsetMinutes } from "./eventInterfaces";
import { REMINDER_OFFSET_OPTIONS } from "./eventInterfaces";

/* -------------------------------------------------------------------------- */
/*                                   Labels                                   */
/* -------------------------------------------------------------------------- */

export const MONTHS = [
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
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type EventTypeKey = "SERVICE" | "PROGRAM" | "ACTIVITY" | "OTHER";

export const EVENT_TYPES: { key: EventTypeKey; label: string; color: string }[] = [
  { key: "SERVICE", label: "Service", color: "#080D2D" },
  { key: "PROGRAM", label: "Program", color: "#1D4ED8" },
  { key: "ACTIVITY", label: "Activity", color: "#15803D" },
  { key: "OTHER", label: "Other", color: "#B45309" },
];

export const normalizeType = (value: unknown): EventTypeKey => {
  const upper = String(value ?? "").toUpperCase();
  return (EVENT_TYPES.find((type) => type.key === upper)?.key ?? "OTHER") as EventTypeKey;
};

export const typeLabel = (value: unknown) =>
  EVENT_TYPES.find((type) => type.key === normalizeType(value))?.label ?? "Other";

export const typeColor = (value: unknown) =>
  EVENT_TYPES.find((type) => type.key === normalizeType(value))?.color ?? "#B45309";

export type TypeFilter = "all" | EventTypeKey;

export const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  ...EVENT_TYPES.map((type) => ({ key: type.key as TypeFilter, label: type.label })),
];

/* -------------------------------------------------------------------------- */
/*                                Date helpers                                */
/* -------------------------------------------------------------------------- */

export { addDays, dayKey, isoDay, keyToDate, plural, t12, todayKey, weekdayOf };

/** "Tue 20 Oct" */
export const fmtShortDay = (key: string) => {
  if (!key) return "—";
  const date = keyToDate(key);
  return `${WEEKDAYS[date.getDay()].slice(0, 3)} ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;
};

/** "Tuesday 20 October" */
export const fmtLongDay = (key: string) => {
  if (!key) return "—";
  const date = keyToDate(key);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

export const monthKeyOf = (key: string) => key.slice(0, 7);

export const monthTitle = (monthKey: string) =>
  `${MONTHS[Number(monthKey.slice(5, 7)) - 1]} ${monthKey.slice(0, 4)}`;

export const shiftMonth = (monthKey: string, delta: number) => {
  const date = new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)) - 1 + delta, 1);
  return isoDay(date).slice(0, 7);
};

export const lastDayOfMonth = (monthKey: string) => {
  const date = new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)), 0);
  return isoDay(date);
};

/** "9 AM" / "6:30 PM" */
export const clockLabel = (time?: string | null) => {
  const label = t12(String(time ?? ""));
  return label.replace(":00 ", " ");
};

/** Minutes since midnight for "HH:mm", or null. */
const minutesOf = (time?: string | null) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time ?? ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const nowMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/* -------------------------------------------------------------------------- */
/*                               Occurrence model                             */
/* -------------------------------------------------------------------------- */

export type EventRecord = eventType & Partial<Pick<EventResponseType, "registration_open">> & {
  event_attendance?: unknown[];
};

export type OccurrenceStatus = "live" | "ended" | "upcoming";

export interface ScheduledEvent {
  id: string;
  raw: EventRecord;
  name: string;
  eventNameId: string;
  type: EventTypeKey;
  date: string;
  endDate: string;
  multiDay: boolean;
  start: string;
  end: string;
  location: string;
  seriesId: string | null;
  onlinePlatforms: string[];
  requiresRegistration: boolean;
  registrations: number;
  capacity: number | null;
}

export const toScheduled = (raw: EventRecord): ScheduledEvent => {
  const date = dayKey(raw.start_date);
  const end = dayKey(raw.end_date) || date;
  const capacity = Number(raw.registration_capacity);
  return {
    id: String(raw.id),
    raw,
    name: String(raw.event_name || raw.name || "Event").trim() || "Event",
    eventNameId: String(raw.event_name_id ?? ""),
    type: normalizeType(raw.event_type),
    date,
    endDate: end > date ? end : date,
    multiDay: end > date,
    start: String(raw.start_time ?? "").slice(0, 5),
    end: String(raw.end_time ?? "").slice(0, 5),
    location: String(raw.location ?? "").trim(),
    seriesId: raw.recurrence_series_id ? String(raw.recurrence_series_id) : null,
    onlinePlatforms: (raw.online_links ?? []).filter((link) => link.url).map((link) => link.label || link.platform),
    requiresRegistration: Boolean(raw.requires_registration),
    registrations: Number(raw.registration_count ?? raw.event_registers?.length ?? 0) || 0,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
  };
};

export const statusOf = (event: ScheduledEvent, today = todayKey(), now = nowMinutes()): OccurrenceStatus => {
  if (event.endDate < today) return "ended";
  if (event.date > today) return "upcoming";
  // Today falls between the first and last day.
  const startMin = minutesOf(event.start);
  const endMin = minutesOf(event.end);
  if (event.endDate === today && endMin !== null && now >= endMin) return "ended";
  if (event.date === today && startMin !== null && now < startMin) return "upcoming";
  return "live";
};

export const sortBySchedule = (a: ScheduledEvent, b: ScheduledEvent) =>
  `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`) || a.name.localeCompare(b.name);

/** Covers a day, counting every day of a multi-day event. */
export const coversDay = (event: ScheduledEvent, key: string) => event.date <= key && event.endDate >= key;

/** "Every Sunday" / "Every other Wednesday" / "Monthly" from the occurrences that share the series. */
export const repeatLabel = (event: ScheduledEvent, siblings: ScheduledEvent[]) => {
  if (!event.seriesId) return "";
  const dates = siblings
    .filter((item) => item.seriesId === event.seriesId)
    .map((item) => item.date)
    .sort();
  const unique = Array.from(new Set(dates));
  const weekday = WEEKDAYS[weekdayOf(event.date)];
  if (unique.length > 1) {
    const gap = Math.round((keyToDate(unique[1]).getTime() - keyToDate(unique[0]).getTime()) / 864e5);
    if (gap === 1) return "Daily";
    if (gap === 7) return `Every ${weekday}`;
    if (gap === 14) return `Every other ${weekday}`;
    if (gap >= 28 && gap <= 31) return "Monthly";
    if (gap >= 365) return "Yearly";
  }
  return "Repeats";
};

/* -------------------------------------------------------------------------- */
/*                                  Audience                                  */
/* -------------------------------------------------------------------------- */

/**
 * The API does not return audience fields yet. When it does, show them;
 * until then return "" so callers hide the label.
 */
export const audienceLabel = (
  raw: EventRecord,
  departments: { id: number | string; name: string }[],
  positions: { id: number | string; name: string }[]
) => {
  if (!raw.audience_type) return "";
  if (raw.audience_type === "all") return "All members";
  const ids = raw.audience_type === "department" ? raw.target_departments ?? [] : raw.target_positions ?? [];
  const source = raw.audience_type === "department" ? departments : positions;
  const names = ids
    .map((id) => source.find((item) => String(item.id) === String(id))?.name)
    .filter(Boolean);
  return names.join(", ");
};

/* -------------------------------------------------------------------------- */
/*                                  Reminders                                 */
/* -------------------------------------------------------------------------- */

export const reminderLabel = (minutes: number) =>
  REMINDER_OFFSET_OPTIONS.find((option) => option.value === minutes)?.label ?? `${minutes} minutes before`;

export const sortReminders = (values: ReminderOffsetMinutes[]) =>
  [...values].sort((a, b) => b - a);

/* -------------------------------------------------------------------------- */
/*                                 Attendance                                 */
/* -------------------------------------------------------------------------- */

/** Headcount for one occurrence: recorded summary first, then sign-ins. */
export const attendanceFor = (event: ScheduledEvent, headcounts: Map<string, number>) => {
  const recorded = headcounts.get(event.id);
  if (recorded !== undefined) return recorded;
  const signIns = Array.isArray(event.raw.event_attendance) ? event.raw.event_attendance.length : 0;
  return signIns > 0 ? signIns : null;
};

/* -------------------------------------------------------------------------- */
/*                                 Recurrence                                 */
/* -------------------------------------------------------------------------- */

export type RepeatFrequency = "daily" | "weekly" | "monthly" | "yearly";

/**
 * Mirrors `generateRecurringDates` in the backend (utils/dateCalculator.ts) so
 * the form can say how many dates it will create before saving.
 */
export const countOccurrences = (params: {
  start: string;
  until: string;
  frequency: RepeatFrequency;
  interval: number;
  daysOfWeek: number[];
}) => {
  const { start, until, frequency } = params;
  if (!start || !until || until < start) return 0;
  const interval = Math.max(1, Math.floor(params.interval) || 1);
  let count = 0;
  if (frequency === "daily") {
    for (let day = start; day <= until && count < 1000; day = addDays(day, interval)) count += 1;
    return count;
  }
  if (frequency === "weekly") {
    const targets = params.daysOfWeek.length ? params.daysOfWeek : [weekdayOf(start)];
    // Weeks start on Monday, as in the backend.
    const weekStart = (key: string) => addDays(key, -((weekdayOf(key) + 6) % 7));
    const firstWeek = weekStart(start);
    for (let day = start; day <= until && count < 1000; day = addDays(day, 1)) {
      const weeks = Math.round(
        (keyToDate(weekStart(day)).getTime() - keyToDate(firstWeek).getTime()) / (7 * 864e5)
      );
      if (weeks % interval === 0 && targets.includes(weekdayOf(day))) count += 1;
    }
    return count;
  }
  if (frequency === "monthly") {
    const startDate = keyToDate(start);
    const dayOfMonth = startDate.getDate();
    for (
      let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      isoDay(cursor) <= until && count < 1000;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + interval, 1)
    ) {
      const candidate = new Date(cursor.getFullYear(), cursor.getMonth(), dayOfMonth);
      const key = isoDay(candidate);
      if (candidate.getMonth() === cursor.getMonth() && key >= start && key <= until) count += 1;
    }
    return count;
  }
  const startDate = keyToDate(start);
  for (
    let year = startDate.getFullYear();
    isoDay(new Date(year, startDate.getMonth(), startDate.getDate())) <= until && count < 1000;
    year += interval
  ) {
    count += 1;
  }
  return count;
};

export const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

/** Weekday a catalogue event next falls on, after today (or a week out). */
export const nextWeekday = (day: number | null | undefined, from = todayKey()) => {
  if (day === null || day === undefined || Number.isNaN(Number(day))) return addDays(from, 7);
  const diff = (Number(day) - weekdayOf(from) + 7) % 7 || 7;
  return addDays(from, diff);
};

/* -------------------------------------------------------------------------- */
/*                                   Paths                                    */
/* -------------------------------------------------------------------------- */

export const EVENTS_PATHS = {
  scheduled: "/home/events/events",
  catalogue: "/home/events",
  analytics: "/home/events/analytics",
  view: (id: string | number) => `/home/events/events/view-event?event_id=${id}`,
};

export const pluralEvents = (n: number) => plural(n, "event");
