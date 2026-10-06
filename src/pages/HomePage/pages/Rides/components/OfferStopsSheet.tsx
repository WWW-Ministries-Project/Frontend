import { CheckIcon } from "@heroicons/react/24/outline";
import type { RideCatalog, RidePoint } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { offerStopOptions, plural } from "../utils/rideHelpers";
import { goldCta } from "./rideStyles";
import { RideSheet } from "./RideSheet";
import { SectionLabel } from "./SectionLabel";
import { SheetSearch } from "./SheetSearch";
import { useSheetQuery } from "./useSheetQuery";

interface OfferStopsSheetProps {
  open: boolean;
  onClose: () => void;
  catalog: RideCatalog;
  areaId: number | null;
  areaName: string;
  selectedIds: number[];
  onToggle: (pointId: number) => void;
}

/** "Pickup points" — the landmarks a driver passes; on-route ones first. */
export const OfferStopsSheet = ({
  open,
  onClose,
  catalog,
  areaId,
  areaName,
  selectedIds,
  onToggle,
}: OfferStopsSheetProps) => {
  const [query, setQuery] = useSheetQuery(open);
  const options = offerStopOptions(catalog, areaId, query);
  const count = selectedIds.length;

  const row = (point: RidePoint) => {
    const on = selectedIds.includes(point.id);
    // "On route" marks suggestions only while searching mixes them in.
    const note = options.searching && options.onRoute(point.id) ? "On route" : "";
    return (
      <li key={point.id}>
        <button
          type="button"
          role="checkbox"
          aria-checked={on}
          onClick={() => onToggle(point.id)}
          className={cn(
            "flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
            on ? "bg-amber-50 dark:bg-amber-400/10" : "hover:bg-lightGray/30"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-6 w-6 flex-none items-center justify-center rounded-md border-[1.5px]",
              on
                ? "border-amber-500 bg-amber-500 dark:border-amber-300 dark:bg-amber-300"
                : "border-primaryGray/60"
            )}
          >
            {on ? <CheckIcon className="h-4 w-4 text-[#0E1330]" /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-primary">
              {point.name}
            </span>
            <span className="block text-xs text-primaryGray">
              {point.area_label}
            </span>
          </span>
          {note ? (
            <span className="flex-none text-xs font-semibold text-teal-700 dark:text-teal-300">
              {note}
            </span>
          ) : null}
        </button>
      </li>
    );
  };

  return (
    <RideSheet
      open={open}
      onClose={onClose}
      title="Pickup points"
      subtitle={`Select the landmarks you'll pass from ${areaName || "your area"}.`}
      toolbar={
        <SheetSearch
          value={query}
          onChange={setQuery}
          placeholder="Search landmark or area"
        />
      }
      footer={
        <button type="button" onClick={onClose} className={goldCta}>
          {count ? `Done · ${plural(count, "point")}` : "Done"}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {options.suggested.length ? (
          <section className="flex flex-col gap-1.5">
            <SectionLabel>Suggested on your route</SectionLabel>
            <ul className="flex flex-col gap-1.5">
              {options.suggested.map(row)}
            </ul>
          </section>
        ) : null}
        <section className="flex flex-col gap-1.5">
          <SectionLabel>
            {options.searching
              ? plural(options.matchCount, "result")
              : "Other landmarks"}
          </SectionLabel>
          <ul className="flex flex-col gap-1.5">{options.others.map(row)}</ul>
          {options.matchCount === 0 ? (
            <p className="px-2 py-5 text-center text-sm text-primaryGray">
              No landmarks match “{query.trim()}”.
            </p>
          ) : null}
        </section>
      </div>
    </RideSheet>
  );
};
