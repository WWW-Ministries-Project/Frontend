import type { DriverRide, RideEvent } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import {
  clockLabel,
  eventDayLabel,
  eventStartsLabel,
  phoneUrl,
  plural,
  shortName,
} from "../utils/rideHelpers";
import {
  Avatar,
  Pill,
  RouteTimeline,
  SeatBar,
} from "./rideUi";
import {
  btnDangerOutline,
  btnGhost,
  btnPrimary,
  btnSecondary,
  listCard,
  sectionTitle,
} from "./rideClasses";

interface DriverRideViewProps {
  offer: DriverRide;
  event: RideEvent | null;
  serviceLabel: string;
  /** Request id currently being accepted. */
  acceptingId: number | null;
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number, firstName: string) => void;
  onCancel: () => void;
  onReport: () => void;
}

/** The driver's side of My ride: the plan, requests to answer, passengers
 *  with Text / Call, and the route with who gets on where. */
export const DriverRideView = ({
  offer,
  event,
  serviceLabel,
  acceptingId,
  onAccept,
  onDecline,
  onCancel,
  onReport,
}: DriverRideViewProps) => {
  const pending = offer.pending_requests;
  const taken = Math.max(0, offer.seats_total - offer.seats_left);

  return (
    <>
      <div className={cn(listCard, "flex flex-col gap-3 p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase text-mainGray">
              You’re driving · {eventDayLabel(event)}
            </span>
            <h2 className="text-xl font-semibold leading-7 text-primary">
              {offer.area.name} → {event?.name ?? "Church"}
            </h2>
            <p className="text-sm text-primaryGray">
              Leaves {clockLabel(offer.depart_time)} ·{" "}
              {offer.car_details || "No car details added"}
            </p>
          </div>
          {pending.length ? (
            <Pill tone="warning">{plural(pending.length, "request")}</Pill>
          ) : (
            <Pill tone="success">Published</Pill>
          )}
        </div>
        <SeatBar
          taken={taken}
          total={offer.seats_total}
          label={`${taken} of ${offer.seats_total} seats taken`}
        />
      </div>

      {pending.length ? (
        <section className="flex flex-col gap-2" aria-labelledby="ride-pending">
          <h2 id="ride-pending" className={sectionTitle}>
            {plural(pending.length, "person", "people")} asked to join
          </h2>
          {pending.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
            >
              <Avatar initials={request.passenger.initials} className="bg-white" />
              <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                <span className="text-sm font-semibold text-primary">
                  {shortName(
                    request.passenger.first_name,
                    request.passenger.initials
                  )}
                </span>
                <span className="text-xs text-primaryGray">
                  {request.pickup_point.name} · {clockLabel(request.pickup_time)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={acceptingId !== null}
                  onClick={() =>
                    onDecline(request.id, request.passenger.first_name)
                  }
                  className={btnSecondary}
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={acceptingId !== null}
                  onClick={() => onAccept(request.id)}
                  className={btnPrimary}
                >
                  {acceptingId === request.id ? "Accepting…" : "Accept"}
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-2" aria-labelledby="ride-passengers">
        <h2 id="ride-passengers" className={sectionTitle}>
          Passengers
        </h2>
        {offer.passengers.length ? (
          <ul className="overflow-hidden rounded-xl border border-lightGray">
            {offer.passengers.map((passenger) => (
              <li
                key={passenger.request_id}
                className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0"
              >
                <Avatar initials={passenger.initials} />
                <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                  <span className="text-sm font-semibold text-primary">
                    {passenger.name}
                  </span>
                  <span className="text-xs text-primaryGray">
                    {passenger.pickup_point.name} ·{" "}
                    {clockLabel(passenger.pickup_time)}
                    {passenger.phone ? ` · ${passenger.phone}` : ""}
                  </span>
                </div>
                {passenger.phone ? (
                  <div className="flex gap-2">
                    <a
                      href={phoneUrl("sms", passenger.phone)}
                      className={btnSecondary}
                    >
                      Text
                    </a>
                    <a
                      href={phoneUrl("tel", passenger.phone)}
                      className={btnPrimary}
                    >
                      Call
                    </a>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mainGray">
            No passengers yet. We’ll notify you when someone asks to join.
          </p>
        )}
        {offer.declined.map((request) => {
          const summary = [request.reason, request.message?.trim()]
            .filter(Boolean)
            .join(" · ");
          return (
            <p key={request.request_id} className="text-xs text-mainGray">
              You declined {request.first_name}
              {summary ? ` · ${summary}` : ""}
            </p>
          );
        })}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="ride-route">
        <h2 id="ride-route" className={sectionTitle}>
          Your route
        </h2>
        <RouteTimeline
          stops={[
            ...offer.stops.map((stop) => {
              const riders = offer.passengers
                .filter((passenger) => passenger.pickup_point.id === stop.id)
                .map((passenger) => passenger.first_name);
              return {
                key: stop.id,
                time: clockLabel(stop.pickup_time),
                label: stop.name,
                sub: riders.length ? riders.join(", ") : "No one yet",
                dot: "primary" as const,
              };
            }),
            {
              key: "church",
              time: "",
              label: "Church",
              sub: eventStartsLabel(event, serviceLabel),
              dot: "church" as const,
            },
          ]}
        />
      </section>

      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
        <button type="button" onClick={onCancel} className={btnDangerOutline}>
          Cancel ride
        </button>
        <button type="button" onClick={onReport} className={btnGhost}>
          Report a safety concern
        </button>
      </div>
    </>
  );
};
