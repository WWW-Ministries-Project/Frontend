import type {
  AppointmentChannel,
  AppointmentHistoryEntry,
  AppointmentHistoryTone,
  AppointmentLifecycleStatus,
  AppointmentNotificationAudience,
  AppointmentNotificationEvent,
  AppointmentNotificationMatrix,
  AppointmentSettings,
} from "@/utils/api/appointment/interfaces";

import type { PillTone } from "../../MembershipManagement/components/membershipUi";

/**
 * Pure helpers shared by the four Appointments pages: normalising API records,
 * dates and times, free-slot search, status wording and CSV export. Nothing in
 * here talks to the API or React.
 */

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type ApptStatus = AppointmentLifecycleStatus;

export interface ApptSlot {
  date: string;
  start: string;
  end: string;
}

export interface ApptBooking {
  id: string;
  requesterId: string;
  requester: string;
  phone: string;
  email: string;
  attendeeId: string;
  attendeeName: string;
  attendeeRole: string;
  reason: string;
  date: string;
  start: string;
  end: string;
  note: string;
  status: ApptStatus;
  createdAt: string;
  respondedAt: string | null;
  proposal: ApptSlot | null;
  declineReason: string;
  remindedAt: string | null;
  history: AppointmentHistoryEntry[];
}

export interface ApptWindow {
  from: string;
  to: string;
}

export interface ApptTimeOff {
  id: string;
  from: string;
  to: string;
  note: string;
}

export interface ApptStaff {
  id: string;
  name: string;
  role: string;
  /** Opening hours per weekday (0 = Sunday). */
  windows: Record<number, ApptWindow[]>;
  /** Bookable session start/end per weekday, as stored on the server. */
  sessions: Record<number, { start: string; end: string }[]>;
  duration: number;
  buffer: number;
  max: number;
  paused: boolean;
  timeOff: ApptTimeOff[];
}

/* -------------------------------------------------------------------------- */
/*                                 Date & time                                */
/* -------------------------------------------------------------------------- */

export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOWF = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Monday-first week order used on every grid. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const p2 = (value: number) => String(value).padStart(2, "0");
export const D = (day: string) => new Date(`${day}T00:00:00`);
export const iso = (date: Date) => `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;
export const isoT = (date: Date) => `${iso(date)}T${p2(date.getHours())}:${p2(date.getMinutes())}:00`;
export const addDays = (day: string, n: number) => {
  const date = D(day);
  date.setDate(date.getDate() + n);
  return iso(date);
};
export const dayIndex = (day: string) => D(day).getDay();
export const dayNameOf = (index: number) => DAY_NAMES[index];

export const toMin = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const fromMin = (minutes: number) => `${p2(Math.floor(minutes / 60))}:${p2(minutes % 60)}`;
export const t12 = (time: string) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${p2(m || 0)} ${h < 12 ? "AM" : "PM"}`;
};
/** "Wed 21 Oct" */
export const fmtD = (day: string) => {
  const date = D(day);
  return `${DOW[date.getDay()]} ${date.getDate()} ${MON[date.getMonth()]}`;
};
/** "Wednesday 21 Oct" */
export const fmtDL = (day: string) => {
  const date = D(day);
  return `${DOWF[date.getDay()]} ${date.getDate()} ${MON[date.getMonth()]}`;
};
/** "21 Oct, 4:30 PM" */
export const fmtT = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MON[date.getMonth()]}, ${t12(`${p2(date.getHours())}:${p2(date.getMinutes())}`)}`;
};
/** Hours from a to b. */
export const hrs = (a: string | Date, b: string | Date) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
/** "40 min", "5 h", "3 days" */
export const dur = (hours: number) =>
  hours < 1 ? `${Math.round(hours * 60)} min` : hours < 48 ? `${Math.round(hours)} h` : `${Math.round(hours / 24)} days`;
export const ago = (value: string, now: Date) => {
  const h = hrs(value, now);
  if (h < 0) return `in ${dur(-h)}`;
  if (h < 1 / 60) return "just now";
  return `${dur(h)} ago`;
};

export const pc = (part: number, whole: number) => (whole ? Math.round((part * 100) / whole) : 0);
export const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

const TITLE_RE = /^(Pastor|Rev\.?|Reverend|Elder|Deacon|Deaconess|Bishop|Apostle|Prophet|Evangelist|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Miss)\s+/i;
/** Name without honorifics: "Rev. Mrs Comfort Osei" → "Comfort Osei". */
export const bareName = (name: string) => {
  let out = name.trim();
  while (TITLE_RE.test(out)) out = out.replace(TITLE_RE, "");
  return out;
};
export const firstName = (name: string) => bareName(name).split(/\s+/)[0] || name;
export const initials = (name: string) =>
  bareName(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* -------------------------------------------------------------------------- */
/*                                  Settings                                  */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_EVENTS: { key: AppointmentNotificationEvent; label: string; when: string }[] = [
  { key: "new", label: "New request", when: "When a member books" },
  { key: "nudge", label: "No reply yet", when: "Halfway to the reply deadline" },
  { key: "overdue", label: "Reply overdue", when: "When the reply deadline passes" },
  { key: "accepted", label: "Accepted", when: "When the person accepts" },
  { key: "suggested", label: "New time suggested", when: "When the person suggests another time" },
  { key: "declined", label: "Declined", when: "When the person declines" },
  { key: "cancelled", label: "Cancelled", when: "When either side cancels" },
  { key: "reminder", label: "Reminder", when: "Before the appointment" },
  { key: "outcome", label: "Record the outcome", when: "2 hours after the appointment ends" },
];

export const NOTIFICATION_AUDIENCES: { key: AppointmentNotificationAudience; label: string; short: string }[] = [
  { key: "attendee", label: "Person booked", short: "person booked" },
  { key: "requester", label: "Member who booked", short: "member" },
  { key: "admins", label: "Admins", short: "admins" },
];

export const CHANNELS: { key: AppointmentChannel; label: string }[] = [
  { key: "push", label: "Push" },
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
];

const N = (
  attendee: AppointmentChannel[],
  requester: AppointmentChannel[],
  admins: AppointmentChannel[]
) => ({ attendee, requester, admins });

export const DEFAULT_SETTINGS: AppointmentSettings = {
  replyDeadlineHours: 24,
  unansweredAfterHours: 72,
  minNoticeHours: 12,
  bookAheadDays: 60,
  reminderHours: 24,
  cancelCutoffHours: 12,
  notifications: {
    new: N(["push", "sms"], ["push"], []),
    nudge: N(["push", "sms"], [], []),
    overdue: N(["push"], ["push"], ["push", "email"]),
    accepted: N([], ["push", "sms"], []),
    suggested: N([], ["push", "sms"], []),
    declined: N([], ["push", "sms"], ["email"]),
    cancelled: N(["push", "sms"], ["push", "sms"], []),
    reminder: N(["push"], ["push", "sms"], []),
    outcome: N(["push"], [], []),
  },
};

const num = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const normalizeSettings = (raw: unknown): AppointmentSettings => {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<AppointmentSettings>;
  const notifications = { ...DEFAULT_SETTINGS.notifications };
  const rawN = (r.notifications ?? {}) as Partial<AppointmentNotificationMatrix>;
  NOTIFICATION_EVENTS.forEach(({ key }) => {
    const row = rawN[key];
    if (!row) return;
    notifications[key] = {
      attendee: Array.isArray(row.attendee) ? row.attendee : notifications[key].attendee,
      requester: Array.isArray(row.requester) ? row.requester : notifications[key].requester,
      admins: Array.isArray(row.admins) ? row.admins : notifications[key].admins,
    };
  });
  return {
    replyDeadlineHours: num(r.replyDeadlineHours, DEFAULT_SETTINGS.replyDeadlineHours) || DEFAULT_SETTINGS.replyDeadlineHours,
    unansweredAfterHours: num(r.unansweredAfterHours, DEFAULT_SETTINGS.unansweredAfterHours),
    minNoticeHours: num(r.minNoticeHours, DEFAULT_SETTINGS.minNoticeHours),
    bookAheadDays: num(r.bookAheadDays, DEFAULT_SETTINGS.bookAheadDays) || DEFAULT_SETTINGS.bookAheadDays,
    reminderHours: num(r.reminderHours, DEFAULT_SETTINGS.reminderHours),
    cancelCutoffHours: num(r.cancelCutoffHours, DEFAULT_SETTINGS.cancelCutoffHours),
    notifications,
  };
};

/* -------------------------------------------------------------------------- */
/*                                Normalisers                                 */
/* -------------------------------------------------------------------------- */

type Raw = Record<string, unknown>;
const isRaw = (value: unknown): value is Raw => typeof value === "object" && value !== null;
const str = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};
const clock = (value: unknown) => {
  const raw = str(value);
  if (!raw.includes(":")) return "";
  const [h, m] = raw.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? `${p2(h)}:${p2(m)}` : "";
};
const STATUSES: ApptStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULED", "DECLINED", "CANCELLED", "COMPLETED", "NO_SHOW"];
const TONES: AppointmentHistoryTone[] = ["neutral", "info", "success", "warning", "danger"];

export const normalizeBooking = (raw: unknown): ApptBooking | null => {
  if (!isRaw(raw)) return null;
  const id = str(raw.id);
  const attendee = isRaw(raw.attendee) ? raw.attendee : isRaw(raw.user) ? raw.user : {};
  const requester = isRaw(raw.requester) ? raw.requester : {};
  const session = isRaw(raw.session) ? raw.session : {};
  const attendeeId = str(raw.staffId, raw.attendeeId, raw.userId, attendee.id);
  if (!id || !attendeeId) return null;
  const statusRaw = str(raw.status).toUpperCase() as ApptStatus;
  const status = STATUSES.includes(statusRaw) ? statusRaw : "PENDING";
  const start = clock(session.start ?? raw.startTime);
  const end = clock(session.end ?? raw.endTime) || start;
  const proposedDate = str(raw.proposedDate).slice(0, 10);
  const proposedStart = clock(raw.proposedStartTime);
  const history = Array.isArray(raw.history)
    ? raw.history
        .filter(isRaw)
        .map((entry) => ({
          at: str(entry.at, entry.createdAt),
          text: str(entry.text, entry.message),
          tone: TONES.includes(entry.tone as AppointmentHistoryTone) ? (entry.tone as AppointmentHistoryTone) : "neutral",
        }))
        .filter((entry) => entry.at && entry.text)
    : [];
  return {
    id,
    requesterId: str(raw.requesterId, requester.id),
    requester: str(requester.name, requester.fullName, raw.requesterName, raw.fullName) || "Unknown member",
    phone: str(raw.phone, requester.phone),
    email: str(raw.email, requester.email),
    attendeeId,
    attendeeName: str(raw.attendeeName, raw.staffName, attendee.name),
    attendeeRole: str(raw.position, raw.attendeePosition),
    reason: str(raw.purpose, raw.reason) || "Other",
    date: str(raw.date).slice(0, 10),
    start,
    end,
    note: str(raw.note),
    status,
    createdAt: str(raw.createdAt, raw.created_at),
    respondedAt: str(raw.respondedAt, raw.responded_at) || null,
    proposal:
      proposedDate && proposedStart
        ? { date: proposedDate, start: proposedStart, end: clock(raw.proposedEndTime) || proposedStart }
        : null,
    declineReason: str(raw.declineReason),
    remindedAt: str(raw.remindedAt) || null,
    history,
  };
};

export const normalizeStaff = (raw: unknown): ApptStaff | null => {
  if (!isRaw(raw)) return null;
  const id = str(raw.userId, raw.staffId, raw.user_id);
  if (!id) return null;
  const windows: ApptStaff["windows"] = {};
  const sessions: ApptStaff["sessions"] = {};
  let duration = 0;
  let gap: number | null = null;
  const slots = Array.isArray(raw.timeSlots) ? raw.timeSlots.filter(isRaw) : [];
  slots.forEach((slot) => {
    const index = DAY_NAMES.indexOf(str(slot.day).toLowerCase());
    const from = clock(slot.startTime);
    const to = clock(slot.endTime);
    if (index < 0 || !from || !to) return;
    (windows[index] = windows[index] || []).push({ from, to });
    const list = (Array.isArray(slot.sessions) ? slot.sessions.filter(isRaw) : [])
      .map((s) => ({ start: clock(s.start), end: clock(s.end) }))
      .filter((s) => s.start && s.end)
      .sort((a, b) => a.start.localeCompare(b.start));
    sessions[index] = [...(sessions[index] || []), ...list].sort((a, b) => a.start.localeCompare(b.start));
    if (!duration) duration = Number(slot.sessionDurationMinutes) || 0;
    if (gap === null && list.length > 1) gap = Math.max(0, toMin(list[1].start) - toMin(list[0].end));
  });
  Object.values(windows).forEach((list) => list.sort((a, b) => a.from.localeCompare(b.from)));
  const timeOff = (Array.isArray(raw.timeOff) ? raw.timeOff.filter(isRaw) : [])
    .map((entry) => ({
      id: str(entry.id),
      from: str(entry.from).slice(0, 10),
      to: str(entry.to).slice(0, 10),
      note: str(entry.note) || "Time off",
    }))
    .filter((entry) => entry.id && entry.from && entry.to);
  return {
    id,
    name: str(raw.fullName, raw.staffName, raw.name) || "Unknown person",
    role: str(raw.position, raw.role),
    windows,
    sessions,
    duration: duration || 30,
    buffer: raw.bufferMinutes !== undefined ? num(raw.bufferMinutes, 0) : gap ?? 0,
    max: Math.max(1, num(raw.maxBookingsPerSlot, 1)),
    paused: raw.paused === true,
    timeOff,
  };
};

/* -------------------------------------------------------------------------- */
/*                               Booking logic                                */
/* -------------------------------------------------------------------------- */

export const OPEN_STATUSES: ApptStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULED"];
export const CLOSED_STATUSES: ApptStatus[] = ["COMPLETED", "NO_SHOW", "DECLINED", "CANCELLED"];

export const STATUS_META: Record<ApptStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "Awaiting reply", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  RESCHEDULED: { label: "New time suggested", tone: "info" },
  DECLINED: { label: "Declined", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  NO_SHOW: { label: "No-show", tone: "danger" },
};

export const DECLINE_REASONS = [
  "Not available then",
  "Better suited to someone else",
  "Outside my ministry area",
  "Other",
];

/** The slot the booking is currently about: the suggested one while it waits on the requester. */
export const slotOf = (booking: ApptBooking): ApptSlot =>
  booking.status === "RESCHEDULED" && booking.proposal
    ? booking.proposal
    : { date: booking.date, start: booking.start, end: booking.end };

export const awayOn = (staff: ApptStaff | undefined, day: string) =>
  staff?.timeOff.find((entry) => day >= entry.from && day <= entry.to);

export const isOverdue = (booking: ApptBooking, sla: number, now: Date) =>
  booking.status === "PENDING" && !!booking.createdAt && hrs(booking.createdAt, now) > sla;

export const needsOutcome = (booking: ApptBooking, now: Date) =>
  booking.status === "CONFIRMED" &&
  !!booking.date &&
  new Date(`${booking.date}T${booking.end || booking.start || "23:59"}:00`) < now;

/** Number of bookable places a person offers on a day. */
export const sessionsOn = (staff: ApptStaff, day: string) => {
  if (staff.paused || awayOn(staff, day)) return 0;
  return (staff.sessions[dayIndex(day)] || []).length * staff.max;
};

/** Sessions per day for the schedule grid (ignores pause and time off). */
export const sessionCount = (staff: ApptStaff, weekday: number) => (staff.sessions[weekday] || []).length;

/** Session start/end pairs inside a window, honouring the break between sessions. */
export const buildSessions = (from: string, to: string, duration: number, buffer: number) => {
  const out: { start: string; end: string }[] = [];
  if (duration <= 0) return out;
  for (let m = toMin(from); m + duration <= toMin(to); m += duration + buffer) {
    out.push({ start: fromMin(m), end: fromMin(m + duration) });
  }
  return out;
};

/** Next free sessions for one person, using their schedule, time off and booking rules. */
export const freeSlots = ({
  staff,
  bookings,
  settings,
  now,
  limit = 8,
  skipId,
  days = 21,
}: {
  staff: ApptStaff | undefined;
  bookings: ApptBooking[];
  settings: AppointmentSettings;
  now: Date;
  limit?: number;
  skipId?: string;
  days?: number;
}): ApptSlot[] => {
  if (!staff || staff.paused) return [];
  const out: ApptSlot[] = [];
  const minTime = new Date(now.getTime() + settings.minNoticeHours * 36e5);
  const taken: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.id === skipId || b.attendeeId !== staff.id || !OPEN_STATUSES.includes(b.status)) return;
    const slot = slotOf(b);
    const key = slot.date + slot.start;
    taken[key] = (taken[key] || 0) + 1;
  });
  const today = iso(now);
  const horizon = Math.min(days, settings.bookAheadDays || days);
  for (let i = 0; i < horizon && out.length < limit; i += 1) {
    const day = addDays(today, i);
    if (awayOn(staff, day)) continue;
    for (const session of staff.sessions[dayIndex(day)] || []) {
      if (out.length >= limit) break;
      if (new Date(`${day}T${session.start}:00`) < minTime) continue;
      if ((taken[day + session.start] || 0) >= staff.max) continue;
      out.push({ date: day, start: session.start, end: session.end });
    }
  }
  return out;
};

/** Second line under the status pill. */
export const statusSub = (
  booking: ApptBooking,
  staff: ApptStaff | undefined,
  sla: number,
  now: Date
): { text: string; tone: "muted" | "warning" | "danger" } => {
  if (booking.status === "PENDING") {
    const away = awayOn(staff, booking.date);
    if (away) return { text: `On leave until ${fmtD(away.to)} · needs reassigning`, tone: "danger" };
    if (!booking.createdAt) return { text: "Waiting for a reply", tone: "muted" };
    const waited = hrs(booking.createdAt, now);
    return waited > sla
      ? { text: `Waiting ${dur(waited)} · overdue`, tone: "danger" }
      : { text: `Waiting ${dur(waited)} · reply due in ${dur(sla - waited)}`, tone: waited > sla / 2 ? "warning" : "muted" };
  }
  if (booking.status === "RESCHEDULED" && booking.proposal) {
    const since = booking.respondedAt ? hrs(booking.respondedAt, now) : 0;
    return {
      text: `Suggested ${fmtD(booking.proposal.date)}, ${t12(booking.proposal.start)} · ${firstName(booking.requester)} hasn’t replied${booking.respondedAt ? ` (${dur(since)})` : ""}`,
      tone: since > 48 ? "warning" : "muted",
    };
  }
  if (booking.status === "CONFIRMED") {
    if (needsOutcome(booking, now)) return { text: "Outcome not recorded", tone: "warning" };
    return booking.respondedAt && booking.createdAt
      ? { text: `Accepted in ${dur(hrs(booking.createdAt, booking.respondedAt))}`, tone: "muted" }
      : { text: "Confirmed", tone: "muted" };
  }
  if (booking.status === "DECLINED") return { text: booking.declineReason || "Declined", tone: "muted" };
  return { text: booking.date ? fmtD(booking.date) : "", tone: "muted" };
};

export const SUB_TONE_CLASS = { muted: "text-gray-500", warning: "text-amber-700", danger: "text-red-700" };

export const pillOf = (booking: ApptBooking, sla: number, now: Date): { label: string; tone: PillTone } => {
  if (isOverdue(booking, sla, now)) return { label: "Reply overdue", tone: "danger" };
  if (needsOutcome(booking, now)) return { label: "Needs outcome", tone: "warning" };
  return STATUS_META[booking.status];
};

/** Server history, or a short reconstruction for bookings made before history existed. */
export const historyOf = (booking: ApptBooking): AppointmentHistoryEntry[] => {
  if (booking.history.length) return booking.history;
  const out: AppointmentHistoryEntry[] = [];
  if (booking.createdAt) out.push({ at: booking.createdAt, text: `Requested by ${booking.requester}`, tone: "neutral" });
  if (booking.respondedAt) {
    out.push({
      at: booking.respondedAt,
      text: booking.status === "DECLINED" ? `Declined${booking.declineReason ? `: ${booking.declineReason.toLowerCase()}` : ""}` : "Accepted",
      tone: booking.status === "DECLINED" ? "danger" : "success",
    });
  }
  return out;
};

export const HISTORY_DOT: Record<AppointmentHistoryTone, string> = {
  neutral: "bg-[#374151]",
  info: "bg-blue-600",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
};

/** "Today", "Tomorrow", "Yesterday" or "Wednesday 21 Oct". */
export const dayLabel = (day: string, now: Date) => {
  const n = Math.round((D(day).getTime() - D(iso(now)).getTime()) / 864e5);
  return n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : fmtDL(day);
};

export const groupByDay = (list: ApptBooking[], desc: boolean) => {
  const groups: Record<string, ApptBooking[]> = {};
  list.forEach((booking) => {
    const day = slotOf(booking).date;
    (groups[day] = groups[day] || []).push(booking);
  });
  return Object.keys(groups)
    .sort((a, b) => (desc ? b.localeCompare(a) : a.localeCompare(b)))
    .map((day) => ({
      day,
      items: groups[day].sort((a, b) => slotOf(a).start.localeCompare(slotOf(b).start)),
    }));
};

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

export const downloadCsv = (name: string, rows: (string | number | null | undefined)[][]) => {
  const body = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? "");
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + body], { type: "text/csv" }));
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};
