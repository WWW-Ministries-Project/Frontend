import { eventType } from "../../EventsManagement/utils/eventInterfaces";

/* ---------------------------------- Dates --------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "09:00" from a Date. */
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "OCT" */
export const monthShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

/** "Saturday, 17 October" */
export const longDay = (d: Date) =>
  `${d.toLocaleDateString("en-US", { weekday: "long" })}, ${d.getDate()} ${d.toLocaleDateString("en-US", { month: "long" })}`;

/** "Sat 24 Oct" */
export const shortDay = (d: Date) =>
  `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;

/** "Today" / "Tomorrow" / "Wednesday", followed by "21 October". */
export const relativeLongDay = (d: Date, now = new Date()) => {
  const today = startOfDay(now);
  const label = sameDay(d, today)
    ? "Today"
    : sameDay(d, addDays(today, 1))
      ? "Tomorrow"
      : d.toLocaleDateString("en-US", { weekday: "long" });
  return `${label}, ${d.getDate()} ${d.toLocaleDateString("en-US", { month: "long" })}`;
};

export const greeting = (now = new Date()) => {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const initials = (name?: string | null) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

/** "in 19h", "in 25m", "in 3 days". */
export const countdown = (target: Date, now = new Date()) => {
  const minutes = Math.round((target.getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return "now";
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)} days`;
};

/* --------------------------------- Events --------------------------------- */

const dateOnly = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const dateTime = (dateValue: unknown, timeValue: unknown, fallback: string) => {
  const day = dateOnly(dateValue);
  if (!day) return null;
  const time =
    typeof timeValue === "string" && /^\d{2}:\d{2}$/.test(timeValue.trim())
      ? timeValue.trim()
      : fallback;
  const d = new Date(`${day}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const eventStart = (e: eventType) => dateTime(e.start_date, e.start_time, "00:00");
export const eventEnd = (e: eventType) =>
  dateTime(e.end_date || e.start_date, e.end_time, "23:59");

export const eventName = (e: eventType) => e.event_name || e.name || "Event";

/** "Service" from "SERVICE". */
export const eventTypeLabel = (e: eventType) => {
  const t = (e.event_type || "").toLowerCase();
  return t ? t[0].toUpperCase() + t.slice(1) : "";
};

/** "09:00 – 11:30" */
export const eventTimeRange = (e: eventType) =>
  [e.start_time, e.end_time].filter(Boolean).join(" – ");

/** "Accra" from "Africa/Accra". */
export const eventZone = (e: eventType) =>
  e.timezone ? (e.timezone.split("/").pop() || "").replace(/_/g, " ") : "";

const isUpcomingOrOngoing = (e: eventType, now: number) => {
  const end = eventEnd(e);
  if (end) return end.getTime() >= now;
  const start = eventStart(e);
  return !!start && start.getTime() >= now;
};

const byStart = (a: eventType, b: eventType) => {
  const at = eventStart(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bt = eventStart(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return at !== bt ? at - bt : eventName(a).localeCompare(eventName(b));
};

/* Audience: show only events the signed-in user is expected at. */

const toId = (value: unknown): string | null => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  return value.trim() || null;
};

const nestedId = (value: unknown): string | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? toId((value as Record<string, unknown>).id)
    : null;

export const userAudienceIds = (
  departments: string[] | undefined,
  positions: Array<string | Record<string, unknown>> | undefined
) => {
  const departmentIds = new Set<string>();
  const positionIds = new Set<string>();

  (departments || []).forEach((value) => {
    const id = toId(value);
    if (id) departmentIds.add(id);
  });

  (positions || []).forEach((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      const id = toId(entry);
      if (id) departmentIds.add(id);
      return;
    }
    const departmentId = toId(entry.department_id ?? nestedId(entry.department));
    const positionId = toId(entry.position_id ?? nestedId(entry.position));
    if (departmentId) departmentIds.add(departmentId);
    if (positionId) positionIds.add(positionId);
  });

  return { departmentIds, positionIds };
};

type AudienceIds = ReturnType<typeof userAudienceIds>;

const matches = (selected: unknown, ids: Set<string>) =>
  Array.isArray(selected) &&
  ids.size > 0 &&
  selected.some((value) => {
    const id = toId(value);
    return id ? ids.has(id) : false;
  });

const isExpectedAttendee = (e: eventType, ids: AudienceIds) => {
  if (e.audience_type === "department") return matches(e.target_departments, ids.departmentIds);
  if (e.audience_type === "position") return matches(e.target_positions, ids.positionIds);
  return true;
};

/** Upcoming and ongoing events for this user, soonest first. */
export const upcomingEventsFor = (events: eventType[], ids: AudienceIds, now = Date.now()) =>
  (events || [])
    .filter((e) => isUpcomingOrOngoing(e, now))
    .filter((e) => isExpectedAttendee(e, ids))
    .sort(byStart);

export const canRegister = (e: eventType, now = new Date()) => {
  if (!e.requires_registration) return false;
  if (!e.registration_end_date) return true;
  const end = new Date(e.registration_end_date);
  return Number.isNaN(end.getTime()) || end.getTime() >= now.getTime();
};

/** Google Calendar "add event" link. Event times are wall-clock in the event's
 *  timezone, so they are passed as floating times with `ctz`. */
export const googleCalendarUrl = (e: eventType) => {
  const start = eventStart(e);
  if (!start) return null;
  const end = eventEnd(e) ?? new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventName(e),
    dates: `${fmt(start)}/${fmt(end)}`,
    details: e.description || "",
    location: e.location || "",
    ctz: e.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
