import { useMemo, useState } from "react";
import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type {
  AdminRideArea,
  AdminRidePickupPoint,
} from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import {
  LoadError,
  RideSkeleton,
  SearchField,
  Segmented,
  Switch,
} from "../components/rideUi";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
} from "../components/rideClasses";
import { plural } from "../utils/rideHelpers";
import { AreaModal, PickupPointModal } from "./AdminRideModals";
import { useAdminRideCatalog } from "./useAdminRideCatalog";

export type PlacesView = "areas" | "points";

interface RidePlacesPanelProps {
  view: PlacesView;
  onViewChange: (view: PlacesView) => void;
}

/** Areas drivers set off from (with their usual routes) and the public
 *  pickup points members choose from. */
export const RidePlacesPanel = ({ view, onViewChange }: RidePlacesPanelProps) => {
  const { catalog, setCatalog, loading, failed, reload } = useAdminRideCatalog();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingArea, setEditingArea] = useState<AdminRideArea | "new" | null>(
    null
  );
  const [editingPoint, setEditingPoint] = useState<
    AdminRidePickupPoint | "new" | null
  >(null);

  const pointsById = useMemo(
    () => new Map(catalog.pickup_points.map((point) => [point.id, point])),
    [catalog.pickup_points]
  );

  /** Area names whose route passes each point. */
  const routesByPoint = useMemo(() => {
    const map = new Map<number, string[]>();
    catalog.areas.forEach((area) =>
      area.route.forEach((stop) =>
        map.set(stop.pickup_point_id, [
          ...(map.get(stop.pickup_point_id) ?? []),
          area.name,
        ])
      )
    );
    return map;
  }, [catalog.areas]);

  const query = search.trim().toLowerCase();
  const points = catalog.pickup_points.filter(
    (point) =>
      !query ||
      point.name.toLowerCase().includes(query) ||
      point.area_label.toLowerCase().includes(query)
  );

  const setAreaActive = async (area: AdminRideArea, isActive: boolean) => {
    setBusyKey(`area-${area.id}`);
    try {
      await api.put.updateRideArea(area.id, { is_active: isActive });
      setCatalog((current) => ({
        ...current,
        areas: current.areas.map((row) =>
          row.id === area.id ? { ...row, is_active: isActive } : row
        ),
      }));
      notify.success({
        title: isActive ? "Area shown" : "Area hidden",
        message: isActive
          ? `Drivers can pick ${area.name} again.`
          : `Drivers can’t pick ${area.name} for new rides. Published rides keep it.`,
      });
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setBusyKey(null);
    }
  };

  const setPointActive = async (
    point: AdminRidePickupPoint,
    isActive: boolean
  ) => {
    setBusyKey(`point-${point.id}`);
    try {
      await api.put.updateRidePickupPoint(point.id, { is_active: isActive });
      setCatalog((current) => ({
        ...current,
        pickup_points: current.pickup_points.map((row) =>
          row.id === point.id ? { ...row, is_active: isActive } : row
        ),
      }));
      notify.success({
        title: isActive ? "Pickup point shown" : "Pickup point hidden",
        message: isActive
          ? `Members can choose ${point.name} again.`
          : `${point.name} is out of search. Published rides keep it.`,
      });
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setBusyKey(null);
    }
  };

  const renderAreas = () => (
    <>
      <p className="text-sm text-primaryGray">
        Areas are where drivers set off from. Each route lists the landmarks
        they usually pass, with minutes from setting off. Used to suggest stops
        and estimate pickup times.
      </p>
      {catalog.areas.length === 0 ? (
        <p className="py-8 text-center text-sm text-mainGray">
          No areas yet. Add the neighbourhoods drivers set off from.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {catalog.areas.map((area) => {
            const stops = [...area.route].sort((a, b) => a.position - b.position);
            return (
              <li
                key={area.id}
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-lightGray bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-base font-semibold text-primary">
                      {area.name}
                    </span>
                    <span className="text-xs text-mainGray">
                      {plural(stops.length, "stop")} ·{" "}
                      {area.is_active ? "Shown to drivers" : "Hidden"}
                    </span>
                  </div>
                  <Switch
                    checked={area.is_active}
                    disabled={busyKey === `area-${area.id}`}
                    label={`Show ${area.name} to drivers`}
                    onChange={(next) => setAreaActive(area, next)}
                  />
                </div>
                {stops.length ? (
                  <ol className="ml-1.5 flex flex-col border-l-2 border-gray-200">
                    {stops.map((stop) => {
                      const point = pointsById.get(stop.pickup_point_id);
                      const hidden = point?.is_active === false;
                      return (
                        <li
                          key={stop.pickup_point_id}
                          className="relative flex justify-between gap-2 pb-2 pl-4 last:pb-0"
                        >
                          <span
                            aria-hidden="true"
                            className="absolute -left-1.5 top-[5px] h-2.5 w-2.5 rounded-full border-2 border-white bg-primary"
                          />
                          <span
                            className={cn(
                              "min-w-0 text-sm text-primary",
                              hidden && "text-mainGray line-through"
                            )}
                            title={
                              hidden
                                ? "Hidden from members. Skipped in suggestions."
                                : undefined
                            }
                          >
                            {point?.name ?? "Unknown landmark"}
                          </span>
                          <span className="whitespace-nowrap text-xs text-mainGray">
                            +{stop.minutes_from_start} min
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-sm text-mainGray">No usual route yet.</p>
                )}
                <button
                  type="button"
                  onClick={() => setEditingArea(area)}
                  className={cn(btnSecondary, "self-start")}
                >
                  Edit route
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  const renderPoints = () => (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[640px] text-sm text-primaryGray">
          Public landmarks members are collected at. Hidden points disappear
          from search; published rides keep them.
        </p>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Landmark or area"
          label="Search pickup points"
          className="max-w-[340px] flex-[1_1_240px]"
        />
      </div>
      <ul className="overflow-hidden rounded-xl border border-lightGray bg-white">
        {points.map((point) => {
          const routes = routesByPoint.get(point.id) ?? [];
          return (
            <li
              key={point.id}
              className="flex min-h-[64px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-lightGray/20"
            >
              <div className="flex min-w-0 flex-[1_1_220px] flex-col">
                <span className="text-sm font-medium text-primary">
                  {point.name}
                </span>
                <span className="text-xs text-mainGray">
                  {point.area_label} ·{" "}
                  {routes.length
                    ? `On ${routes.join(", ")} ${routes.length === 1 ? "route" : "routes"}`
                    : "Not on any route"}
                </span>
              </div>
              <Switch
                checked={point.is_active}
                disabled={busyKey === `point-${point.id}`}
                label={`Show ${point.name} to members`}
                onChange={(next) => setPointActive(point, next)}
              />
              <button
                type="button"
                onClick={() => setEditingPoint(point)}
                className={cn(btnGhost, "px-3")}
                aria-label={`Edit ${point.name}`}
              >
                Edit
              </button>
            </li>
          );
        })}
        {points.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-mainGray">
            {catalog.pickup_points.length
              ? "No landmark or area matches your search."
              : "No pickup points yet. Add the public landmarks members can be picked up at."}
          </li>
        ) : null}
      </ul>
    </>
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Segmented
          label="Places"
          value={view}
          onChange={onViewChange}
          options={[
            { value: "areas", label: "Areas & routes" },
            { value: "points", label: "Pickup points" },
          ]}
        />
        <button
          type="button"
          onClick={() =>
            view === "areas" ? setEditingArea("new") : setEditingPoint("new")
          }
          disabled={loading && !catalog.areas.length && !catalog.pickup_points.length}
          className={btnPrimary}
        >
          {view === "areas" ? "New area" : "New pickup point"}
        </button>
      </div>

      {failed ? (
        <LoadError message="Couldn't load areas and pickup points." onRetry={reload} />
      ) : loading && !catalog.areas.length && !catalog.pickup_points.length ? (
        <RideSkeleton rows={3} className="h-24" />
      ) : view === "areas" ? (
        renderAreas()
      ) : (
        renderPoints()
      )}

      {editingArea ? (
        <AreaModal
          area={editingArea === "new" ? null : editingArea}
          pickupPoints={catalog.pickup_points}
          onClose={() => setEditingArea(null)}
          onSaved={() => {
            setEditingArea(null);
            reload();
          }}
        />
      ) : null}
      {editingPoint ? (
        <PickupPointModal
          point={editingPoint === "new" ? null : editingPoint}
          onClose={() => setEditingPoint(null)}
          onSaved={() => {
            setEditingPoint(null);
            reload();
          }}
        />
      ) : null}
    </section>
  );
};
