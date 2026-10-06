import {
  InformationCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  AdminRideArea,
  AdminRidePickupPoint,
} from "@/utils/api/rides/interfaces";
import {
  ActiveSwitch,
  PanelError,
  PanelSkeleton,
  outlineButtonClass,
} from "./AdminRideShared";
import { AreaModal } from "./AdminRideModals";
import { useAdminRideCatalog } from "./useAdminRideCatalog";

/** "Spintex (0 min) → Accra Mall (10 min)" style summary of an area's route. */
const RouteSummary = ({
  area,
  pointsById,
}: {
  area: AdminRideArea;
  pointsById: Map<number, AdminRidePickupPoint>;
}) => {
  const stops = [...area.route].sort((a, b) => a.position - b.position);
  if (!stops.length) {
    return <span className="text-sm text-primaryGray">No suggested route</span>;
  }
  return (
    <ol
      className="flex max-w-xl flex-wrap items-center gap-x-1.5 gap-y-1 text-sm"
      aria-label={`Suggested route for ${area.name}`}
    >
      {stops.map((stop, index) => {
        const point = pointsById.get(stop.pickup_point_id);
        return (
          <li key={stop.pickup_point_id} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span className="text-primaryGray" aria-hidden="true">
                →
              </span>
            ) : null}
            <span
              className={
                point?.is_active === false
                  ? "text-primaryGray line-through"
                  : "text-primary"
              }
              title={
                point?.is_active === false
                  ? "Hidden from members — skipped in suggestions"
                  : undefined
              }
            >
              {point?.name ?? "Unknown point"}
            </span>
            <span className="text-xs tabular-nums text-primaryGray">
              {stop.minutes_from_start} min
            </span>
          </li>
        );
      })}
    </ol>
  );
};

/** Neighbourhoods drivers set off from, and the landmarks they usually pass. */
export const RideAreasPanel = () => {
  const { catalog, setCatalog, loading, failed, reload } =
    useAdminRideCatalog();
  const [busyId, setBusyId] = useState<number | null>(null);
  /** `null` = closed, `"new"` = add, otherwise the area being edited. */
  const [editing, setEditing] = useState<AdminRideArea | "new" | null>(null);

  const pointsById = useMemo(
    () => new Map(catalog.pickup_points.map((point) => [point.id, point])),
    [catalog.pickup_points]
  );

  const setActive = useCallback(
    async (area: AdminRideArea, isActive: boolean) => {
      setBusyId(area.id);
      try {
        await api.put.updateRideArea(area.id, { is_active: isActive });
        setCatalog((current) => ({
          ...current,
          areas: current.areas.map((row) =>
            row.id === area.id ? { ...row, is_active: isActive } : row
          ),
        }));
        showNotification(
          isActive
            ? `${area.name} is available to drivers again`
            : `${area.name} is hidden from drivers`,
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

  const columns = useMemo<ColumnDef<AdminRideArea>[]>(
    () => [
      {
        id: "name",
        header: "Area",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium text-primary">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "route",
        header: "Suggested route",
        cell: ({ row }) => (
          <RouteSummary area={row.original} pointsById={pointsById} />
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
        header: "Shown to drivers",
        cell: ({ row }) => (
          <ActiveSwitch
            checked={row.original.is_active}
            disabled={busyId === row.original.id}
            label={`Show ${row.original.name} to drivers`}
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
    [busyId, pointsById, setActive]
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-3xl items-start gap-2 rounded-xl bg-lightGray/30 p-3 text-sm text-primary">
          <InformationCircleIcon
            className="mt-0.5 h-5 w-5 flex-none text-primaryGray"
            aria-hidden="true"
          />
          <p>
            Drivers choose the area they set off from. Each area&apos;s route
            lists the landmarks drivers from there usually pass, with typical
            minutes from setting off — used to suggest pickup points and
            estimate pickup times.
          </p>
        </div>
        <Button
          value="Add area"
          onClick={() => setEditing("new")}
          disabled={loading && !catalog.areas.length}
        />
      </div>

      {failed ? (
        <PanelError
          message="Failed to load areas. Please try again."
          onRetry={reload}
        />
      ) : loading && !catalog.areas.length ? (
        <PanelSkeleton rows={4} rowClassName="h-14" />
      ) : catalog.areas.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No areas yet"
          description="Add the neighbourhoods drivers set off from, then the landmarks each one usually passes."
        />
      ) : (
        <TableComponent
          columns={columns}
          data={catalog.areas}
          displayedCount={Math.max(catalog.areas.length, 1)}
          showNumberColumn={false}
          headClass="text-xs uppercase tracking-wide"
          onRowClick={(area: AdminRideArea) => setEditing(area)}
        />
      )}

      {editing ? (
        <AreaModal
          area={editing === "new" ? null : editing}
          pickupPoints={catalog.pickup_points}
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
