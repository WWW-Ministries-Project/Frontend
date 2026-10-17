import { ApiError } from "@/utils/api/errors/ApiError";
import { relativePath } from "@/utils/const";
import { decodeToken } from "@/utils/helperFunctions";
import type {
  MyRide,
  RideCatalog,
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

/** "TODAY" on the Sunday itself, "THIS SUNDAY" before it. */
export const serviceDayLabel = (serviceDate: string): string => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return serviceDate === today ? "TODAY" : "THIS SUNDAY";
};

export type RideTone = "gold" | "teal" | "coral";

export interface RideSummary {
  title: string;
  subtitle: string;
  status: { label: string; tone: RideTone };
}

/** What the dashboard card, the More menu and the hub say about the member's ride. */
export const rideSummary = (
  myRide: MyRide | null | undefined
): RideSummary | null => {
  if (myRide?.role === "passenger" && myRide.request) {
    const request = myRide.request;
    const status =
      request.status === "ACCEPTED"
        ? { label: "Confirmed", tone: "teal" as const }
        : request.status === "DECLINED"
          ? { label: "Declined", tone: "coral" as const }
          : { label: "Pending", tone: "gold" as const };
    return {
      title: `Your ride with ${request.ride.driver.first_name}`,
      subtitle:
        request.status === "DECLINED"
          ? "Request declined · find another ride"
          : `Pickup ${request.pickup_point.name} · ${clockLabel(request.pickup_time)}`,
      status,
    };
  }
  if (myRide?.role === "driver" && myRide.offer) {
    const offer = myRide.offer;
    const waiting = offer.pending_requests.length;
    return {
      title: "You're driving Sunday",
      subtitle: `${offer.area.name} → Church · ${clockLabel(offer.depart_time)} · ${seatsLeftLabel(offer.seats_left)}`,
      status: waiting
        ? { label: plural(waiting, "request"), tone: "gold" }
        : { label: "Published", tone: "teal" },
    };
  }
  return null;
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

/** Landmarks for the driver's pickup sheet: on-route suggestions, then the rest. */
export const offerStopOptions = (
  catalog: RideCatalog,
  areaId: number | null,
  query: string
) => {
  const route = routeOf(catalog, areaId);
  const matches = catalog.pickup_points.filter((point) =>
    pointMatches(point, query)
  );
  const searching = Boolean(normalizeQuery(query));
  const suggested = searching
    ? []
    : matches
        .filter((point) => route.has(point.id))
        .sort((a, b) => route.get(a.id)! - route.get(b.id)!);
  return {
    suggested,
    others: searching ? matches : matches.filter((point) => !route.has(point.id)),
    onRoute: (id: number) => route.has(id),
    matchCount: matches.length,
    searching,
  };
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
  findAt: (pickupPointId: number) =>
    `${relativePath.member.rides}/${relativePath.member.rideFind}?pickup_point_id=${pickupPointId}`,
};
