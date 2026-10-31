import type { RideSearchResult } from "@/utils/api/rides/interfaces";
import { clockLabel, shortName } from "../utils/rideHelpers";
import { RideSheet, SheetActions } from "./RideSheet";
import {
  LockIcon,
} from "./rideUi";

type SearchRide = RideSearchResult["rides"][number];

interface RequestSeatSheetProps {
  ride: SearchRide | null;
  pickupName: string;
  submitting: boolean;
  onClose: () => void;
  onSend: () => void;
}

/** "Ask {first} for a seat?" — the facts, then one tap. */
export const RequestSeatSheet = ({
  ride,
  pickupName,
  submitting,
  onClose,
  onSend,
}: RequestSeatSheetProps) => {
  const facts: Array<[string, string]> = ride
    ? [
        ["Pickup", pickupName],
        ["Pickup time", clockLabel(ride.pickup_time)],
        [
          "Driver",
          `${shortName(ride.driver.first_name, ride.driver.initials)} · from ${ride.area.name}`,
        ],
        ["Seats left", String(ride.seats_left)],
      ]
    : [];

  return (
    <RideSheet
      open={Boolean(ride)}
      onClose={onClose}
      locked={submitting}
      title={`Ask ${ride?.driver.first_name ?? ""} for a seat?`}
      onSubmit={onSend}
      footer={
        <SheetActions
          onCancel={onClose}
          submitLabel="Send request"
          submittingLabel="Sending…"
          submitting={submitting}
        />
      }
    >
      <dl className="grid grid-cols-2 gap-3">
        {facts.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs text-mainGray">{label}</dt>
            <dd className="break-words font-medium text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="flex gap-2 rounded-lg bg-inputBackground px-4 py-3 text-primaryGray">
        <LockIcon className="mt-0.5 h-4 w-4 flex-none" />
        Your phone number is shared only if the request is accepted.
      </p>
    </RideSheet>
  );
};
