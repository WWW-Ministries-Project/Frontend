import { ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import type {
  RideCatalog,
  RidePickupPoint,
} from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { openRidesLabel, plural, riderPickupOptions } from "../utils/rideHelpers";
import { RideSheet } from "./RideSheet";
import { SectionLabel } from "./SectionLabel";
import { SheetSearch } from "./SheetSearch";
import { useSheetQuery } from "./useSheetQuery";

interface PickupPointSheetProps {
  open: boolean;
  onClose: () => void;
  catalog: RideCatalog;
  selectedId: number | null;
  onSelect: (pointId: number) => void;
}

/** "Pickup point" — where a rider can get to; points with rides first. */
export const PickupPointSheet = ({
  open,
  onClose,
  catalog,
  selectedId,
  onSelect,
}: PickupPointSheetProps) => {
  const [query, setQuery] = useSheetQuery(open);
  const searching = Boolean(query.trim());
  const points = riderPickupOptions(catalog, query);
  const recent = searching
    ? undefined
    : catalog.pickup_points.find(
        (point) => point.id === catalog.recent_pickup_point_id
      );

  const row = (point: RidePickupPoint, isRecent = false) => {
    const on = point.id === selectedId;
    const hasRides = point.open_rides > 0;
    const Icon = on ? CheckCircleIcon : isRecent ? ClockIcon : MapPinIcon;
    return (
      <li key={`${isRecent ? "recent" : "all"}-${point.id}`}>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => onSelect(point.id)}
          className={cn(
            "flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
            on ? "bg-amber-50 dark:bg-amber-400/10" : "hover:bg-lightGray/30",
            !hasRides && !on && !isRecent && "opacity-60"
          )}
        >
          <Icon
            aria-hidden="true"
            className={cn(
              "h-5 w-5 flex-none",
              on
                ? "text-amber-600 dark:text-amber-300"
                : hasRides && !isRecent
                  ? "text-teal-600 dark:text-teal-300"
                  : "text-primaryGray"
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-primary">
              {point.name}
            </span>
            <span className="block text-xs text-primaryGray">
              {point.area_label}
            </span>
          </span>
          <span
            className={cn(
              "flex-none text-xs font-semibold",
              hasRides
                ? "text-teal-700 dark:text-teal-300"
                : "text-primaryGray"
            )}
          >
            {openRidesLabel(point.open_rides)}
          </span>
        </button>
      </li>
    );
  };

  return (
    <RideSheet
      open={open}
      onClose={onClose}
      title="Pickup point"
      toolbar={
        <SheetSearch
          value={query}
          onChange={setQuery}
          placeholder="Search landmark or area"
        />
      }
    >
      <div className="flex flex-col gap-4">
        {recent ? (
          <section className="flex flex-col gap-1.5">
            <SectionLabel>Recent</SectionLabel>
            <ul className="flex flex-col gap-1.5">{row(recent, true)}</ul>
          </section>
        ) : null}
        <section className="flex flex-col gap-1.5">
          <SectionLabel>
            {searching ? plural(points.length, "result") : "All pickup points"}
          </SectionLabel>
          <ul className="flex flex-col gap-1.5">
            {points.map((point) => row(point))}
          </ul>
          {points.length === 0 ? (
            <p className="px-2 py-5 text-center text-sm text-primaryGray">
              No pickup points match “{query.trim()}”. Try an area name like
              Spintex or Madina.
            </p>
          ) : null}
        </section>
      </div>
    </RideSheet>
  );
};
