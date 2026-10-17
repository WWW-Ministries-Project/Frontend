import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useMyRide } from "../hooks/useMyRide";
import { isGuestViewer, ridePaths, rideSummary } from "../utils/rideHelpers";
import { CarIcon } from "./RideIcons";
import { RideStatusPill } from "./RideStatusPill";

const CARD =
  "flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm";

const ICON_TILE =
  "inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300";

/** Dashboard entry to Ride to church: one-tap Find / Offer, or the member's
 *  ride this Sunday. Hidden for guests, and hidden when the ride can't be
 *  loaded (e.g. a signed-in non-member). */
export const RideHomeCard = () => {
  const guest = isGuestViewer();
  const { myRide, loading, error } = useMyRide({ enabled: !guest });

  if (guest || loading || error || !myRide) return null;

  const summary = rideSummary(myRide);

  if (summary) {
    return (
      <Link to={ridePaths.mine} className={cn(CARD, "transition-colors hover:bg-gray-50")}>
        <span className={ICON_TILE}>
          <CarIcon className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-800">
            {summary.title}
          </span>
          <span className="block truncate text-xs text-gray-500">
            {summary.subtitle}
          </span>
        </span>
        <RideStatusPill label={summary.status.label} tone={summary.status.tone} />
      </Link>
    );
  }

  return (
    <div className={CARD}>
      <span className={ICON_TILE}>
        <CarIcon className="h-6 w-6" />
      </span>
      <Link to={ridePaths.hub} className="min-w-0 flex-1 hover:underline">
        <span className="block text-sm font-semibold text-gray-800">
          Ride to church
        </span>
        <span className="block text-xs text-gray-500">
          Share a ride with members near you
        </span>
      </Link>
      <Link
        to={ridePaths.find}
        className="inline-flex min-h-[40px] flex-none items-center rounded-xl bg-teal-50 px-3 text-sm font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-400/15 dark:text-teal-300"
      >
        Find
      </Link>
      <Link
        to={ridePaths.offer}
        className="inline-flex min-h-[40px] flex-none items-center rounded-xl bg-amber-50 px-3 text-sm font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-400/15 dark:text-amber-300"
      >
        Offer
      </Link>
    </div>
  );
};
