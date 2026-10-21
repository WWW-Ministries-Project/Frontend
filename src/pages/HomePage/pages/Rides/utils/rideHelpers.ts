import { ApiError } from "@/utils/api/errors/ApiError";
import { relativePath } from "@/utils/const";
import { decodeToken } from "@/utils/helperFunctions";
import type {
  MyRide,
  RideCatalog,
  RideEvent,
  RidePickupPoint,
  RidePoint,
} from "@/utils/api/rides/interfaces";

/** "07:15" -> "7:15 AM". Anything that isn't a 24h clock is returned as-is. */
export const clockLabel = (clock: string | null | undefined): string => {
  const value = String(clock ?? "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${match[2]} ${hours < 12 ? "AM" : "PM"}`;
};

export const plural = (count: number, word: string, many = `${word}s`) =>
  `${count} ${count === 1 ? word : many}`;

/** "07:00" + 14 -> "07:14". Anything that isn't a 24h clock is returned as-is. */
export const addMinutes = (clock: string, minutes: number): string => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(clock ?? "").trim());
  if (!match) return clock;
  const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

/** "Kwame A." from a first name and initials ("KA"). */
export const shortName = (firstName: string, initials?: string | null) => {
  const last = String(initials ?? "").trim().slice(1, 2);
  return last ? `${firstName} ${last.toUpperCase()}.` : firstName;
};

/** Initials for a full name: "Ama Serwaa" -> "AS". */
export const initialsOf = (name: string | null | undefined) => {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};

/* ------------------------------------------------------------------ */
/* Church events                                                       */
/* ------------------------------------------------------------------ */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "YYYY-MM-DD" for a local date. */
export const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** A "YYYY-MM-DD" as a local date (`new Date("2026-10-11")` is UTC midnight). */
const localDate = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : null;
};

type EventDay = Pick<RideEvent, "date" | "weekday">;

/** "today", "tomorrow" or the weekday ("Wednesday"). */
const eventDayWord = (event: EventDay | null | undefined): string => {
  if (!event) return "";
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (event.date === isoDay(now)) return "today";
  if (event.date === isoDay(tomorrow)) return "tomorrow";
  const date = localDate(event.date);
  return event.weekday || (date ? WEEKDAYS[date.getDay()] : "");
};

/** "TODAY", "TOMORROW", else the weekday — "WEDNESDAY". */
export const eventDayLabel = (event: EventDay | null | undefined) =>
  (eventDayWord(event) || "upcoming").toUpperCase();

/** "today", "tomorrow" or "on Wednesday". */
export const eventDayPhrase = (event: EventDay | null | undefined) => {
  const day = eventDayWord(event);
  return !day
    ? "on the day"
    : day === "today" || day === "tomorrow"
      ? day
      : `on ${day}`;
};

/** "Sun 11 Oct". */
export const eventDateLabel = (event: EventDay): string => {
  const date = localDate(event.date);
  if (!date) return event.weekday.slice(0, 3);
  return `${(event.weekday || WEEKDAYS[date.getDay()]).slice(0, 3)} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

/** "Sun 11 Oct · Sunday Service" — an event chip. */
export const eventChipLabel = (event: RideEvent) =>
  `${eventDateLabel(event)} · ${event.name}`;

/** "Midweek Service · Wed 14 Oct · 6:30 PM" — one line naming the event. */
export const eventLine = (event: RideEvent) =>
  [
    event.name,
    eventDateLabel(event),
    event.start_time ? clockLabel(event.start_time) : "",
  ]
    .filter(Boolean)
    .join(" · ");

/** "Starts 9:00 AM" / the event's name, for the Church row of a route. */
export const eventStartsLabel = (
  event: RideEvent | null | undefined,
  fallback: string
) =>
  event?.start_time
    ? `${event.name} starts ${clockLabel(event.start_time)}`
    : (event?.name ?? fallback);

export const DEPART_STEP_MINUTES = 5;

const clockMinutes = (clock: string | null | undefined): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(clock ?? "").trim());
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes < 24 * 60 ? minutes : null;
};

const minutesClock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Earliest departure on the event's day: any time, except times already
 *  past when the event is today. Mirrors the server's check. */
const earliestDeparture = (event: RideEvent | null | undefined) => {
  const now = new Date();
  if (event?.date !== isoDay(now)) return 0;
  const next =
    Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / DEPART_STEP_MINUTES) *
    DEPART_STEP_MINUTES;
  return Math.min(next, 23 * 60 + 55);
};

/** Why a departure time can't be used for the event, or null when it can. */
export const departTimeProblem = (
  time: string,
  event: RideEvent | null | undefined
): string | null => {
  const minutes = clockMinutes(time);
  if (minutes === null) return "Choose a departure time.";
  if (minutes < earliestDeparture(event)) {
    return "That time has already passed. Choose a later departure.";
  }
  return null;
};

/** A starting departure: the member's usual one if it still fits, else a
 *  middle suggestion, else 45 minutes before the event starts. */
export const defaultDepartTime = (
  catalog: RideCatalog,
  preferred?: string | null
): string => {
  const event = catalog.event ?? null;
  if (preferred && !departTimeProblem(preferred, event)) return preferred;
  const suggested = catalog.depart_times.filter(
    (time) => !departTimeProblem(time, event)
  );
  if (suggested.length) return suggested[Math.min(1, suggested.length - 1)];
  const start = clockMinutes(event?.start_time);
  const target = start === null ? 7 * 60 + 15 : start - 45;
  return minutesClock(
    Math.min(23 * 60 + 55, Math.max(earliestDeparture(event), target))
  );
};

/** The event a My ride answer is about. */
export const rideEventOf = (myRide: MyRide | null | undefined) =>
  myRide?.event ??
  myRide?.offer?.event ??
  myRide?.request?.ride.event ??
  null;

/** The member already drives, or holds or waits on a seat, for this
 *  event — each member can drive or ride once per event. */
export const isBusyForEvent = (myRide: MyRide | null | undefined) => {
  if (myRide?.role === "driver") return Boolean(myRide.offer);
  const request = myRide?.role === "passenger" ? myRide.request : null;
  return Boolean(
    request &&
      !request.cancelled_by_driver &&
      (request.status === "PENDING" || request.status === "ACCEPTED")
  );
};

/** Download rows as a CSV file. */
export const downloadCsv = (
  filename: string,
  rows: Array<Array<string | number | null | undefined>>
) => {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const seatsLeftLabel = (count: number) => `${plural(count, "seat")} left`;

/** "Sunday, 12 October" for a "YYYY-MM-DD" service date. */
export const serviceDateLabel = (serviceDate: string): string => {
  const date = new Date(`${serviceDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return serviceDate;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
};

const normalizeQuery = (query: string) => query.trim().toLowerCase();

export const pointMatches = (point: RidePoint, query: string) => {
  const q = normalizeQuery(query);
  return (
    !q ||
    point.name.toLowerCase().includes(q) ||
    point.area_label.toLowerCase().includes(q)
  );
};

const routeOf = (catalog: RideCatalog, areaId: number | null) =>
  new Map(
    (catalog.areas.find((area) => area.id === areaId)?.route ?? []).map(
      (stop, index) => [stop.pickup_point_id, index]
    )
  );

/**
 * The driver's chosen pickup points in the order they'll pass them: points on
 * the area's usual route first, in route order, then any others in catalog
 * order — the same order the backend plans pickup times in.
 */
export const orderedStops = (
  catalog: RideCatalog,
  areaId: number | null,
  selectedIds: number[]
): RidePoint[] => {
  const route = routeOf(catalog, areaId);
  const order = new Map(
    catalog.pickup_points.map((point, index) => [point.id, index])
  );
  return catalog.pickup_points
    .filter((point) => selectedIds.includes(point.id))
    .sort((a, b) => {
      const ra = route.get(a.id);
      const rb = route.get(b.id);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
    });
};

/** The first two landmarks on an area's route — a starting selection for a new offer. */
export const defaultStopsFor = (catalog: RideCatalog, areaId: number) =>
  (catalog.areas.find((area) => area.id === areaId)?.route ?? [])
    .slice(0, 2)
    .map((stop) => stop.pickup_point_id);

/** Pickup points for riders: ones with open rides first, then alphabetical. */
export const riderPickupOptions = (
  catalog: RideCatalog,
  query: string
): RidePickupPoint[] =>
  catalog.pickup_points
    .filter((point) => pointMatches(point, query))
    .sort(
      (a, b) =>
        Number(b.open_rides > 0) - Number(a.open_rides > 0) ||
        a.name.localeCompare(b.name)
    );

export const openRidesLabel = (count: number) =>
  count ? plural(count, "ride") : "No rides";

/** sms: / tel: link for a number the backend has unlocked. */
export const phoneUrl = (scheme: "sms" | "tel", phone: string) =>
  `${scheme}:${phone.replace(/[^\d+]/g, "")}`;

/** The backend's message from a failed call, or a fallback. */
export const rideErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "error"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return fallback;
};

/** Guests (visitors with a guest token) never see Ride to church. */
export const isGuestViewer = (): boolean => {
  try {
    return decodeToken()?.is_guest === true;
  } catch {
    return false;
  }
};

/** The backend's 401 for signed-in non-members ("…for church members only."). */
export const isMembersOnlyError = (error: unknown): boolean =>
  error instanceof ApiError &&
  error.statusCode === 401 &&
  /members only/i.test(error.message);

/** "Efua", "Efua and Ama", "Efua, Ama and Kofi". */
export const joinNames = (names: string[]): string => {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

/** A pending decision either side is waiting on — worth polling for. */
export const isAwaitingDecision = (myRide: MyRide | null | undefined) =>
  (myRide?.role === "passenger" && myRide.request?.status === "PENDING") ||
  (myRide?.role === "driver" && Boolean(myRide.offer?.pending_requests.length));

/** Member-portal paths for the ride pages. */
export const ridePaths = {
  hub: relativePath.member.rides,
  offer: `${relativePath.member.rides}/${relativePath.member.rideOffer}`,
  find: `${relativePath.member.rides}/${relativePath.member.rideFind}`,
  mine: `${relativePath.member.rides}/${relativePath.member.myRide}`,
  findAt: (pickupPointId: number, eventId?: number | null) =>
    `${relativePath.member.rides}/${relativePath.member.rideFind}?pickup_point_id=${pickupPointId}${eventId ? `&${EVENT_PARAM}=${eventId}` : ""}`,
};

/** `?event_id=` — the event the ride tabs are about (ride notifications
 *  deep-link with it too). */
export const EVENT_PARAM = "event_id";

/** A ride path for one event. */
export const withEvent = (path: string, eventId?: number | null) =>
  eventId ? `${path}?${EVENT_PARAM}=${eventId}` : path;
