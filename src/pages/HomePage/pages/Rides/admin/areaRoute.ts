import type {
  AdminRideArea,
  RideAreaRouteStop,
} from "@/utils/api/rides/interfaces";

/** One stop being edited — both fields stay strings so they can be empty. */
export interface RouteRow {
  key: number;
  pickup_point_id: string;
  minutes: string;
}

let rowKey = 0;
const nextKey = () => ++rowKey;

/** A blank stop, `minutes` from setting off. */
export const newRouteRow = (minutes = "0"): RouteRow => ({
  key: nextKey(),
  pickup_point_id: "",
  minutes,
});

/** Whole minutes, 0 or more; null when the field isn't a valid value. */
export const parseMinutes = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return null;
  return Number(trimmed);
};

export const routeRowsOf = (area: AdminRideArea | null): RouteRow[] => {
  const rows = [...(area?.route ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((stop) => ({
      key: nextKey(),
      pickup_point_id: String(stop.pickup_point_id),
      minutes: String(stop.minutes_from_start),
    }));
  return rows.length ? rows : [newRouteRow()];
};

/** The route as the backend wants it, or why it can't be saved. Rows left
 *  completely empty are dropped. */
export const validateRoute = (
  route: RouteRow[]
): { stops: RideAreaRouteStop[] } | { error: string } => {
  const rows = route.filter(
    (row) => row.pickup_point_id || (row.minutes.trim() && row.minutes !== "0")
  );
  const stops: RideAreaRouteStop[] = [];
  for (const row of rows) {
    const minutes = parseMinutes(row.minutes);
    if (!row.pickup_point_id || minutes === null) {
      return { error: "Each stop needs a landmark and minutes from setting off." };
    }
    stops.push({ pickup_point_id: Number(row.pickup_point_id), minutes });
  }
  const ids = stops.map((stop) => stop.pickup_point_id);
  if (new Set(ids).size !== ids.length) {
    return { error: "Each landmark can be on the route once." };
  }
  return { stops };
};
