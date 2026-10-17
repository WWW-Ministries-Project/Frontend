import { ClockIcon } from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";
import type { RideSearchResult } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { clockLabel, seatsLeftLabel } from "../utils/rideHelpers";
import { CarIcon } from "./RideIcons";
import { RideAvatar } from "./RideAvatar";
import { RideStatusPill } from "./RideStatusPill";
import { VerifiedMember } from "./VerifiedMember";
import { goldCta, rideCard } from "./rideStyles";

type SearchRide = RideSearchResult["rides"][number];

interface FindRideCardProps {
  ride: SearchRide;
  pickupName: string;
  /** The member already drives or holds a seat this Sunday. */
  busy: boolean;
  onRequest: () => void;
  onViewRequest: () => void;
}

const OWN_REQUEST_STATUSES = ["PENDING", "ACCEPTED"];

/** One ride passing the rider's pickup point, with the time it gets there. */
export const FindRideCard = ({
  ride,
  pickupName,
  busy,
  onRequest,
  onViewRequest,
}: FindRideCardProps) => {
  const mine = OWN_REQUEST_STATUSES.includes(ride.my_request_status ?? "");
  const blocked = busy && !mine;
  const outlined =
    "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-lightGray bg-transparent px-5 text-sm font-bold text-primary";

  return (
    <article className={cn(rideCard, "flex flex-col gap-3.5 p-4")}>
      <div className="flex items-center gap-3">
        <RideAvatar id={ride.driver.id} initials={ride.driver.initials} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-primary">
            {ride.driver.first_name}'s ride
          </h3>
          <VerifiedMember />
        </div>
        <RideStatusPill label={seatsLeftLabel(ride.seats_left)} tone="neutral" />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/70 px-3.5 py-3 dark:border-teal-400/25 dark:bg-teal-400/10">
        <MapPinIcon
          className="h-5 w-5 flex-none text-teal-600 dark:text-teal-300"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 text-sm text-primaryGray">
          Picks up at{" "}
          <span className="font-bold text-primary">{pickupName}</span>
        </p>
        <span className="flex-none text-sm font-bold tabular-nums text-teal-700 dark:text-teal-300">
          {clockLabel(ride.pickup_time)}
        </span>
      </div>

      <div className="flex flex-col gap-2 text-sm text-primaryGray">
        <p className="flex items-start gap-2.5">
          <CarIcon className="mt-0.5 h-4 w-4 flex-none" />
          <span>{ride.route.join(" → ")}</span>
        </p>
        <p className="flex items-center gap-2.5">
          <ClockIcon className="h-4 w-4 flex-none" aria-hidden="true" />
          Leaves {ride.area.name} at {clockLabel(ride.depart_time)}
        </p>
      </div>

      {mine ? (
        <button type="button" onClick={onViewRequest} className={outlined}>
          View your request
        </button>
      ) : blocked ? (
        <button type="button" disabled className={cn(outlined, "cursor-not-allowed opacity-50")}>
          You already have a ride
        </button>
      ) : (
        <button type="button" onClick={onRequest} className={cn(goldCta, "min-h-[48px] text-sm shadow-none")}>
          Request ride
        </button>
      )}
    </article>
  );
};
