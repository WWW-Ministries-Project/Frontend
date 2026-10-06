import {
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";
import type { AdminRidePickupPoint } from "@/utils/api/rides/interfaces";
import { plural } from "../utils/rideHelpers";
import {
  ActiveSwitch,
  PanelError,
  PanelSkeleton,
  inputClass,
  outlineButtonClass,
} from "./AdminRideShared";
import { PickupPointModal } from "./AdminRideModals";
import { useAdminRideCatalog } from "./useAdminRideCatalog";

/** Public landmarks members are picked up at. */
export const RidePickupPointsPanel = () => {
  const { catalog, setCatalog, loading, failed, reload } =
    useAdminRideCatalog();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  /** `null` = closed, `"new"` = add, otherwise the point being edited. */
  const [editing, setEditing] = useState<AdminRidePickupPoint | "new" | null>(
    null
  );

  const routeCounts = useMemo(() => {
    const counts = new Map<number, number>();
    catalog.areas.forEach((area) =>
      area.route.forEach((stop) =>
        counts.set(stop.pickup_point_id, (counts.get(stop.pickup_point_id) ?? 0) + 1)
      )
    );
    return counts;
  }, [catalog.areas]);

  const query = search.trim().toLowerCase();
  const points = useMemo(
    () =>
      catalog.pickup_points.filter(
        (point) =>
          !query ||
          point.name.toLowerCase().includes(query) ||
          point.area_label.toLowerCase().includes(query)
      ),
    [catalog.pickup_points, query]
  );

  const setActive = useCallback(
    async (point: AdminRidePickupPoint, isActive: boolean) => {
      setBusyId(point.id);
      try {
        await api.put.updateRidePickupPoint(point.id, { is_active: isActive });
        setCatalog((current) => ({
          ...current,
          pickup_points: current.pickup_points.map((row) =>
            row.id === point.id ? { ...row, is_active: isActive } : row
          ),
        }));
        showNotification(
          isActive
            ? `${point.name} is available to members again`
            : `${point.name} is hidden from members`,
          "success"
        );
      } catch {
        // ApiErrorHandler has already shown the error.
      } finally {
        setBusyId(null);
      }
    },
    [setCatalog]
  );

  const columns = useMemo<ColumnDef<AdminRidePickupPoint>[]>(
    () => [
      {
        id: "name",
        header: "Landmark",
        cell: ({ row }) => {
          const point = row.original;
          const onRoutes = routeCounts.get(point.id) ?? 0;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-primary">{point.name}</span>
              <span className="text-xs text-primaryGray">
                {onRoutes
                  ? `On ${plural(onRoutes, "area route")}`
                  : "Not on any area route"}
              </span>
            </div>
          );
        },
      },
      {
        id: "area_label",
        header: "Area",
        cell: ({ row }) => (
          <span className="text-primary">{row.original.area_label}</span>
        ),
      },
      {
        id: "sort_order",
        header: "Sort order",
        cell: ({ row }) => (
          <span className="tabular-nums text-primaryGray">
            {row.original.sort_order}
          </span>
        ),
      },
      {
        id: "is_active",
        header: "Shown to members",
        cell: ({ row }) => (
          <ActiveSwitch
            checked={row.original.is_active}
            disabled={busyId === row.original.id}
            label={`Show ${row.original.name} to members`}
            onChange={(next) => setActive(row.original, next)}
          />
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              type="button"
              className={outlineButtonClass}
              aria-label={`Edit ${row.original.name}`}
              onClick={(event) => {
                event.stopPropagation();
                setEditing(row.original);
              }}
            >
              <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
              Edit
            </button>
          </div>
        ),
      },
    ],
    [busyId, routeCounts, setActive]
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-xl bg-lightGray/30 p-3 text-sm text-primary">
        <InformationCircleIcon
          className="mt-0.5 h-5 w-5 flex-none text-primaryGray"
          aria-hidden="true"
        />
        <p>
          <strong>Public landmarks only — never a home address.</strong>{" "}
          Members pick one of these to be collected at. Hidden pickup points
          can&apos;t be chosen for new rides or seat requests.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex min-w-[220px] max-w-md flex-1 flex-col gap-1 text-xs font-medium text-primaryGray">
          Search
          <span className="relative">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primaryGray"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Landmark or area"
              className={cn(inputClass, "pl-9")}
            />
          </span>
        </label>
        <Button
          value="Add pickup point"
          onClick={() => setEditing("new")}
          disabled={loading && !catalog.pickup_points.length}
        />
      </div>

      {failed ? (
        <PanelError
          message="Failed to load pickup points. Please try again."
          onRetry={reload}
        />
      ) : loading && !catalog.pickup_points.length ? (
        <PanelSkeleton rows={4} rowClassName="h-14" />
      ) : catalog.pickup_points.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No pickup points yet"
          description="Add the public landmarks members can be picked up at — a mall entrance, a fuel station, a junction."
        />
      ) : points.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No matching pickup points"
          description="No landmark or area matches your search."
        />
      ) : (
        <TableComponent
          columns={columns}
          data={points}
          displayedCount={Math.max(points.length, 1)}
          showNumberColumn={false}
          headClass="text-xs uppercase tracking-wide"
          onRowClick={(point: AdminRidePickupPoint) => setEditing(point)}
        />
      )}

      {editing ? (
        <PickupPointModal
          point={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </section>
  );
};
