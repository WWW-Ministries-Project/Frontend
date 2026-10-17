import { LockClosedIcon } from "@heroicons/react/24/outline";
import type { RideSearchResult } from "@/utils/api/rides/interfaces";
import { clockLabel } from "../utils/rideHelpers";
import { goldCta } from "./rideStyles";
import { RideSheet } from "./RideSheet";

type SearchRide = RideSearchResult["rides"][number];

interface RequestSeatSheetProps {
  ride: SearchRide | null;
  pickupName: string;
  submitting: boolean;
  onClose: () => void;
  onSend: () => void;
}

/** "Request a seat with {first}" — a one-tap confirm. */
export const RequestSeatSheet = ({
  ride,
  pickupName,
  submitting,
  onClose,
  onSend,
}: RequestSeatSheetProps) => {
  const first = ride?.driver.first_name ?? "";
  const rows: Array<[string, string, string]> = ride
    ? [
        ["Pickup point", pickupName, "text-primary"],
        [
          "Be there by",
          clockLabel(ride.pickup_time),
          "text-teal-700 dark:text-teal-300",
        ],
        ["Seats left", String(ride.seats_left), "text-primary"],
      ]
    : [];

  return (
    <RideSheet
      open={Boolean(ride)}
      onClose={onClose}
      title={`Request a seat with ${first}`}
      footer={
        <button
          type="button"
          onClick={onSend}
          disabled={submitting}
          className={goldCta}
        >
          {submitting ? "Sending…" : "Send request"}
        </button>
      }
    >
      <dl className="flex flex-col divide-y divide-lightGray">
        {rows.map(([label, value, tone]) => (
          <div key={label} className="flex justify-between gap-3 py-3">
            <dt className="text-sm text-primaryGray">{label}</dt>
            <dd className={`text-sm font-semibold ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex items-start gap-2 text-xs text-primaryGray">
        <LockClosedIcon className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
        <span>
          {first} sees your name and pickup point. Your number is shared only
          if the request is accepted.
        </span>
      </p>
    </RideSheet>
  );
};
