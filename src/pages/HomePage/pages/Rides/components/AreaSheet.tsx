import { MapIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import type { RideArea } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { RideSheet } from "./RideSheet";
import { SheetSearch } from "./SheetSearch";
import { useSheetQuery } from "./useSheetQuery";

interface AreaSheetProps {
  open: boolean;
  onClose: () => void;
  areas: RideArea[];
  selectedId: number | null;
  onSelect: (areaId: number) => void;
}

/** "Starting area" — the neighbourhood a driver sets off from. */
export const AreaSheet = ({
  open,
  onClose,
  areas,
  selectedId,
  onSelect,
}: AreaSheetProps) => {
  const [query, setQuery] = useSheetQuery(open);
  const q = query.trim().toLowerCase();
  const matches = areas.filter(
    (area) => !q || area.name.toLowerCase().includes(q)
  );

  return (
    <RideSheet
      open={open}
      onClose={onClose}
      title="Starting area"
      subtitle="Your neighbourhood, not your address."
      toolbar={
        <SheetSearch
          value={query}
          onChange={setQuery}
          placeholder="Search area"
        />
      }
    >
      <ul className="flex flex-col gap-1.5">
        {matches.map((area) => {
          const on = area.id === selectedId;
          return (
            <li key={area.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(area.id)}
                className={cn(
                  "flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                  on
                    ? "bg-amber-50 dark:bg-amber-400/10"
                    : "hover:bg-lightGray/30"
                )}
              >
                {on ? (
                  <CheckCircleIcon
                    className="h-5 w-5 flex-none text-amber-600 dark:text-amber-300"
                    aria-hidden="true"
                  />
                ) : (
                  <MapIcon
                    className="h-5 w-5 flex-none text-primaryGray"
                    aria-hidden="true"
                  />
                )}
                <span className="flex-1 text-sm font-semibold text-primary">
                  {area.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {matches.length === 0 ? (
        <p className="px-2 py-5 text-center text-sm text-primaryGray">
          No areas match “{query.trim()}”.
        </p>
      ) : null}
    </RideSheet>
  );
};
