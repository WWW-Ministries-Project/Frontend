import { LockClosedIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import type { PassengerRide } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import {
  clockLabel,
  phoneUrl,
  plural,
  type RideTone,
  seatsLeftLabel,
  serviceDayLabel,
} from "../utils/rideHelpers";
import { RideAvatar } from "./RideAvatar";
import { goldCta, rideCard, toneBorder, toneTint } from "./rideStyles";

interface PassengerRideViewProps {
  request: PassengerRide;
  dismissing: boolean;
  onFindAnother: () => void;
}

const STATUS_TONE: Record<PassengerRide["status"], RideTone> = {
  PENDING: "gold",
  ACCEPTED: "teal",
  DECLINED: "coral",
};

/** "You + 2 others · 1 seat left" once confirmed; "3 seats available" before. */
const passengerCountLabel = (request: PassengerRide) => {
  const { seats_left: seatsLeft, other_passengers: others } = request.ride;
  if (request.status !== "ACCEPTED") return `${plural(seatsLeft, "seat")} available`;
  const company = others > 0 ? plural(others, "other") : "the driver";
  return `You + ${company} · ${seatsLeft > 0 ? seatsLeftLabel(seatsLeft) : "car now full"}`;
};

/** The passenger's side of My ride: status, then the pickup or the decline. */
export const PassengerRideView = ({
  request,
  dismissing,
  onFindAnother,
}: PassengerRideViewProps) => {
  const driver = request.ride.driver;
  const first = driver.first_name;
  const tone = STATUS_TONE[request.status];
  const pending = request.status === "PENDING";
  const accepted = request.status === "ACCEPTED";
  const declined = request.status === "DECLINED";

  const headline = accepted
    ? "Ride confirmed"
    : declined
      ? `${first} can't take you this time`
      : `Waiting for ${first} to accept`;
  const sub = accepted
    ? `${first} + you · we'll remind you Sunday at ${clockLabel(request.reminder_time)}`
    : declined
      ? request.cancelled_by_driver
        ? `${first} cancelled this ride`
        : "Your seat request was declined"
      : "Usually within a few hours. We'll notify you.";

  const driverDetail = accepted
    ? driver.car_details || "Contact details unlocked"
    : "Car and contact details unlock once accepted";

  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3.5",
          toneTint[tone],
          toneBorder[tone]
        )}
      >
        {pending ? (
          <span
            aria-hidden="true"
            className="h-5 w-5 flex-none animate-spin rounded-full border-2 border-amber-600/30 border-t-amber-600 dark:border-amber-300/30 dark:border-t-amber-300"
          />
        ) : accepted ? (
          <CheckCircleIcon className="h-6 w-6 flex-none text-teal-600 dark:text-teal-300" aria-hidden="true" />
        ) : (
          <XCircleIcon className="h-6 w-6 flex-none text-rose-600 dark:text-rose-300" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">{headline}</p>
          <p className="text-xs text-primaryGray">{sub}</p>
        </div>
      </div>

      {declined ? (
        <div className="flex flex-col gap-3">
          {request.decline_reason || request.decline_message ? (
            <div className={cn(rideCard, "flex flex-col gap-2.5 p-4")}>
              <div className="flex items-center gap-2.5">
                <RideAvatar id={driver.id} initials={driver.initials} size="sm" />
                <p className="flex-1 text-sm font-semibold text-primary">
                  {first}'s reason
                </p>
              </div>
              {request.decline_reason ? (
                <p className="text-base font-semibold text-primary">
                  {request.decline_reason}
                </p>
              ) : null}
              {request.decline_message ? (
                <p className="text-sm text-primaryGray">
                  “{request.decline_message}”
                </p>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onFindAnother}
            disabled={dismissing}
            className={goldCta}
          >
            Find another ride
          </button>
        </div>
      ) : (
        <div className={cn(rideCard, "overflow-hidden")}>
          <div className="flex flex-col gap-1 px-4 py-4">
            <p className="text-[10px] font-bold tracking-[0.13em] text-amber-700 dark:text-amber-300">
              {serviceDayLabel(request.ride.service_date)}
            </p>
            <p className="text-2xl font-semibold text-primary">
              Pickup {clockLabel(request.pickup_time)}
            </p>
            <p className="text-sm text-primaryGray">
              {request.pickup_point.name} · {first} → Church
            </p>
          </div>
          <div className="flex items-center gap-3 border-t border-lightGray px-4 py-3.5">
            <RideAvatar id={driver.id} initials={driver.initials} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {driver.name} · driver
              </p>
              <p className="text-xs text-primaryGray">
                {accepted && driver.phone ? (
                  <>
                    {driver.car_details ? `${driver.car_details} · ` : null}
                    <a href={phoneUrl("tel", driver.phone)} className="underline underline-offset-2 hover:text-primary">
                      {driver.phone}
                    </a>
                  </>
                ) : (
                  driverDetail
                )}
              </p>
            </div>
            {pending ? (
              <LockClosedIcon
                className="h-5 w-5 flex-none text-primaryGray/70"
                aria-label="Locked until accepted"
              />
            ) : null}
          </div>
          <div className="flex items-center gap-3 border-t border-lightGray px-4 py-3.5">
            <UserGroupIcon className="h-5 w-5 flex-none text-primaryGray" aria-hidden="true" />
            <span className="text-sm text-primaryGray">
              {passengerCountLabel(request)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
