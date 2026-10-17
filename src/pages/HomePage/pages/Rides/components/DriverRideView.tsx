import {
  ClockIcon,
  MapPinIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { DriverRide } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import {
  clockLabel,
  phoneUrl,
  seatsLeftLabel,
  serviceDayLabel,
} from "../utils/rideHelpers";
import { CarIcon } from "./RideIcons";
import { RideAvatar } from "./RideAvatar";
import { RideStatusPill } from "./RideStatusPill";
import { SectionLabel } from "./SectionLabel";
import { VerifiedMember } from "./VerifiedMember";
import { goldCta, quietButton, rideCard } from "./rideStyles";

interface DriverRideViewProps {
  offer: DriverRide;
  /** Request id currently being accepted. */
  acceptingId: number | null;
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number, firstName: string) => void;
}

/** The driver's side of My ride: the plan, requests to answer, passengers. */
export const DriverRideView = ({
  offer,
  acceptingId,
  onAccept,
  onDecline,
}: DriverRideViewProps) => {
  const hasPending = offer.pending_requests.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(rideCard, "overflow-hidden")}>
        <div className="flex flex-col gap-1 px-4 py-4">
          <p className="text-[10px] font-bold tracking-[0.13em] text-amber-700 dark:text-amber-300">
            {serviceDayLabel(offer.service_date)}
          </p>
          <p className="text-2xl font-semibold text-primary">
            Leaving {clockLabel(offer.depart_time)}
          </p>
          <p className="text-sm text-primaryGray">
            {offer.area.name} → Church · {seatsLeftLabel(offer.seats_left)}
          </p>
        </div>
        {offer.stops.length ? (
          <ol className="border-t border-lightGray px-4 py-3">
            {offer.stops.map((stop, index) => (
              <li key={stop.id} className="flex items-center gap-3 py-1.5">
                <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700 dark:bg-teal-400/15 dark:text-teal-300">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-primary">
                  {stop.name}
                </span>
                <span className="flex-none text-sm font-semibold tabular-nums text-primaryGray">
                  {clockLabel(stop.pickup_time)}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
        {offer.car_details ? (
          <p className="flex items-center gap-2.5 border-t border-lightGray px-4 py-3 text-sm text-primaryGray">
            <CarIcon className="h-4 w-4 flex-none" />
            {offer.car_details}
          </p>
        ) : null}
      </div>

      {offer.pending_requests.map((request) => (
        <div
          key={request.id}
          className="flex flex-col gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-400/30 dark:bg-amber-400/10"
        >
          <div className="flex items-center gap-3">
            <RideAvatar id={request.passenger.id} initials={request.passenger.initials} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {request.passenger.first_name} wants to join your ride
              </p>
              <VerifiedMember />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-primary">
            <span className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-primaryGray" aria-hidden="true" />
              {request.pickup_point.name}
            </span>
            <span className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-primaryGray" aria-hidden="true" />
              {clockLabel(request.pickup_time)}
            </span>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={acceptingId !== null}
              onClick={() => onDecline(request.id, request.passenger.first_name)}
              className={quietButton}
            >
              Decline
            </button>
            <button
              type="button"
              disabled={acceptingId !== null}
              onClick={() => onAccept(request.id)}
              className={cn(goldCta, "min-h-[48px] flex-1 text-sm shadow-none")}
            >
              {acceptingId === request.id ? "Accepting…" : "Accept"}
            </button>
          </div>
        </div>
      ))}

      {offer.passengers.length || !hasPending ? (
        <section className="flex flex-col gap-2.5" aria-labelledby="ride-passengers">
          <SectionLabel id="ride-passengers">Passengers</SectionLabel>
          <div className={cn(rideCard, "overflow-hidden")}>
            {offer.passengers.length ? (
              <ul className="divide-y divide-lightGray">
                {offer.passengers.map((passenger) => (
                  <li key={passenger.request_id} className="flex items-center gap-3 px-4 py-3.5">
                    <RideAvatar id={passenger.id} initials={passenger.initials} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary">{passenger.name}</p>
                      <p className="text-xs text-primaryGray">
                        {passenger.pickup_point.name} · {clockLabel(passenger.pickup_time)}
                        {passenger.phone ? (
                          <>
                            {" · "}
                            <a
                              href={phoneUrl("tel", passenger.phone)}
                              className="underline underline-offset-2 hover:text-primary"
                            >
                              {passenger.phone}
                            </a>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <RideStatusPill label="Confirmed" tone="teal" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-primaryGray">
                No passengers yet. We'll notify you when someone asks to join.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {offer.declined.map((request) => {
        const summary = [request.reason, request.message?.trim()]
          .filter(Boolean)
          .join(" · ");
        return (
          <p key={request.request_id} className="flex items-start gap-2 px-1 text-xs text-primaryGray">
            <XCircleIcon className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
            <span>
              You declined {request.first_name}
              {summary ? ` · ${summary}` : ""}
            </span>
          </p>
        );
      })}
    </div>
  );
};
