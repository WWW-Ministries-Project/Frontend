import type { AdminRidePickupPoint } from "@/utils/api/rides/interfaces";
import { type RouteRow, newRouteRow, parseMinutes } from "./areaRoute";
import {
  btnSecondary,
  selectClass,
  inputClass,
} from "../components/rideClasses";
import { cn } from "@/utils/cn";

interface AreaRouteEditorProps {
  route: RouteRow[];
  onChange: (route: RouteRow[]) => void;
  pickupPoints: AdminRidePickupPoint[];
  disabled?: boolean;
}

const iconButton =
  "inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-lightGray bg-white text-primary hover:bg-lightGray/20 disabled:cursor-not-allowed disabled:opacity-40";

/** "Usual route": ordered landmarks with minutes from setting off. Order is
 *  the position sent to the backend. */
export const AreaRouteEditor = ({
  route,
  onChange,
  pickupPoints,
  disabled,
}: AreaRouteEditorProps) => {
  const update = (index: number, patch: Partial<RouteRow>) =>
    onChange(
      route.map((row, position) =>
        position === index ? { ...row, ...patch } : row
      )
    );

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= route.length) return;
    const next = [...route];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const addStop = () => {
    const lastMinutes = parseMinutes(route[route.length - 1]?.minutes ?? "") ?? 0;
    onChange([
      ...route,
      newRouteRow(String(lastMinutes + 5)),
    ]);
  };

  const minutes = route.map((row) => parseMinutes(row.minutes));
  const outOfOrder = minutes.some(
    (value, index) =>
      index > 0 &&
      value !== null &&
      minutes[index - 1] !== null &&
      value < (minutes[index - 1] as number)
  );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-medium">Usual route</legend>
      {route.map((row, index) => {
        const selected = pickupPoints.find(
          (point) => String(point.id) === row.pickup_point_id
        );
        // Hidden points stay listed only when they're already on the route.
        const options = pickupPoints.filter(
          (point) => point.is_active || String(point.id) === row.pickup_point_id
        );
        const label = selected?.name ?? `stop ${index + 1}`;
        return (
          <div
            key={row.key}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-2"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
            >
              {index + 1}
            </span>
            <select
              value={row.pickup_point_id}
              disabled={disabled}
              aria-label={`Landmark for stop ${index + 1}`}
              onChange={(event) =>
                update(index, { pickup_point_id: event.target.value })
              }
              className={cn(selectClass, "min-w-0 flex-[1_1_180px]")}
            >
              <option value="">Choose a landmark…</option>
              {options.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name} · {point.area_label}
                  {point.is_active ? "" : " (hidden)"}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-primaryGray">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={row.minutes}
                disabled={disabled}
                aria-label={`Minutes from setting off to ${label}`}
                aria-invalid={parseMinutes(row.minutes) === null}
                onChange={(event) => update(index, { minutes: event.target.value })}
                className={cn(inputClass, "w-16 px-2")}
              />
              min
            </label>
            <button
              type="button"
              className={iconButton}
              disabled={disabled || index === 0}
              onClick={() => move(index, -1)}
              aria-label={`Move ${label} up`}
            >
              ↑
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={disabled || index === route.length - 1}
              onClick={() => move(index, 1)}
              aria-label={`Move ${label} down`}
            >
              ↓
            </button>
            {route.length > 1 ? (
              <button
                type="button"
                className={cn(
                  iconButton,
                  "border-red-200 text-red-700 hover:bg-red-50"
                )}
                disabled={disabled}
                onClick={() =>
                  onChange(route.filter((_, position) => position !== index))
                }
                aria-label={`Remove ${label}`}
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
      {outOfOrder ? (
        <p className="text-xs text-amber-700">
          Minutes usually go up along the route. Check the order of the stops.
        </p>
      ) : null}
      <button
        type="button"
        onClick={addStop}
        disabled={disabled}
        className={cn(btnSecondary, "self-start")}
      >
        + Add stop
      </button>
    </fieldset>
  );
};
