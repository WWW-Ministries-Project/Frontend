import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import type { AdminRidePickupPoint } from "@/utils/api/rides/interfaces";
import { inputClass, outlineButtonClass } from "./AdminRideShared";
import { RidePill } from "./RideStatusBadge";

/** One stop being edited — minutes stay a string so the field can be cleared. */
export interface RouteRow {
  pickup_point_id: number;
  minutes: string;
}

/** Whole minutes, 0 or more; null when the field isn't a valid value. */
export const parseMinutes = (value: string): number | null => {
  const trimmed = value.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return null;
  return Number(trimmed);
};

interface AreaRouteEditorProps {
  route: RouteRow[];
  onChange: (route: RouteRow[]) => void;
  pickupPoints: AdminRidePickupPoint[];
  disabled?: boolean;
}

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-lightGray bg-white text-primary hover:bg-lightGray/40 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Ordered list of the landmarks drivers from an area usually pass, each with
 * typical minutes from setting off. Order is the position sent to the backend.
 */
export const AreaRouteEditor = ({
  route,
  onChange,
  pickupPoints,
  disabled,
}: AreaRouteEditorProps) => {
  const [newPointId, setNewPointId] = useState("");
  const [newMinutes, setNewMinutes] = useState("");

  const pointsById = useMemo(
    () => new Map(pickupPoints.map((point) => [point.id, point])),
    [pickupPoints]
  );
  const available = pickupPoints.filter(
    (point) =>
      point.is_active &&
      !route.some((stop) => stop.pickup_point_id === point.id)
  );

  const minutesValues = route.map((stop) => parseMinutes(stop.minutes));
  const outOfOrder = minutesValues.some(
    (value, index) =>
      index > 0 &&
      value !== null &&
      minutesValues[index - 1] !== null &&
      value < (minutesValues[index - 1] as number)
  );

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= route.length) return;
    const next = [...route];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const update = (index: number, minutes: string) =>
    onChange(
      route.map((stop, position) =>
        position === index ? { ...stop, minutes } : stop
      )
    );

  const remove = (index: number) =>
    onChange(route.filter((_, position) => position !== index));

  const newMinutesValue = parseMinutes(newMinutes);
  const canAdd = Boolean(newPointId) && newMinutesValue !== null && !disabled;

  const add = () => {
    if (!canAdd) return;
    onChange([
      ...route,
      { pickup_point_id: Number(newPointId), minutes: String(newMinutesValue) },
    ]);
    setNewPointId("");
    setNewMinutes("");
  };

  return (
    <div className="flex flex-col gap-3">
      {route.length === 0 ? (
        <p className="rounded-lg border border-dashed border-lightGray px-4 py-3 text-sm text-primaryGray">
          No suggested stops yet. Add the landmarks drivers from this area
          usually pass, in the order they pass them.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {route.map((stop, index) => {
            const point = pointsById.get(stop.pickup_point_id);
            const name = point?.name ?? "Unknown pickup point";
            const invalid = parseMinutes(stop.minutes) === null;
            const minutesId = `route-stop-minutes-${stop.pickup_point_id}`;
            return (
              <li
                key={stop.pickup_point_id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-lightGray bg-white px-3 py-2"
              >
                <span
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-[140px] flex-1">
                  <p className="text-sm font-medium text-primary">{name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {point?.area_label ? (
                      <span className="text-xs text-primaryGray">
                        {point.area_label}
                      </span>
                    ) : null}
                    {point && !point.is_active ? (
                      <RidePill tone="gray">Hidden from members</RidePill>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <label htmlFor={minutesId} className="sr-only">
                    Minutes from setting off to {name}
                  </label>
                  <input
                    id={minutesId}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={stop.minutes}
                    disabled={disabled}
                    aria-invalid={invalid}
                    onChange={(event) => update(index, event.target.value)}
                    className={`${inputClass} w-20 ${invalid ? "border-error" : ""}`}
                  />
                  <span className="text-xs text-primaryGray">min</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={iconButtonClass}
                    disabled={disabled || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Move ${name} up`}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButtonClass}
                    disabled={disabled || index === route.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Move ${name} down`}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={iconButtonClass}
                    disabled={disabled}
                    onClick={() => remove(index)}
                    aria-label={`Remove ${name} from the route`}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {outOfOrder ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Minutes usually increase along the route — check the order of the
          stops.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-lightGray/30 p-3">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs font-medium text-primaryGray">
          Add a stop
          <select
            className={inputClass}
            value={newPointId}
            disabled={disabled || available.length === 0}
            onChange={(event) => setNewPointId(event.target.value)}
          >
            <option value="">
              {available.length
                ? "Choose a pickup point"
                : "Every active pickup point is on this route"}
            </option>
            {available.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name} · {point.area_label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-32 flex-col gap-1 text-xs font-medium text-primaryGray">
          Minutes from setting off
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={newMinutes}
            disabled={disabled}
            placeholder="e.g. 10"
            onChange={(event) => setNewMinutes(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
            className={inputClass}
          />
        </label>
        <button
          type="button"
          className={`${outlineButtonClass} h-10`}
          disabled={!canAdd}
          onClick={add}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add stop
        </button>
      </div>
    </div>
  );
};
