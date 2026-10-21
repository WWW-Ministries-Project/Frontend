import type { PassengerRide, RideEvent } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import {
  clockLabel,
  eventDayPhrase,
  eventStartsLabel,
  phoneUrl,
  plural,
  shortName,
} from "../utils/rideHelpers";
import {
  Avatar,
  LockIcon,
  type PillTone,
  RouteTimeline,
  type TimelineStop,
} from "./rideUi";
import {
  btnDangerOutline,
  btnGhost,
  btnPrimary,
  btnSecondary,
  pillTone,
  sectionTitle,
  toneText,
} from "./rideClasses";

interface PassengerRideViewProps {
  request: PassengerRide;
  event: RideEvent | null;
  serviceLabel: string;
  dismissing: boolean;
  onFindAnother: () => void;
  onWithdraw: () => void;
  onReport: () => void;
}

/** Landmarks between the area (first) and "Church" (last) in a route. */
const stopsOf = (route: string[]) => {
  const end = route[route.length - 1] === "Church" ? -1 : undefined;
  return route.slice(1, end);
};

/** The passenger's side of My ride: where things stand, the pickup, the
 *  driver (contact once accepted) and the route. */
export const PassengerRideView = ({
  request,
  event,
  serviceLabel,
  dismissing,
  onFindAnother,
  onWithdraw,
  onReport,
}: PassengerRideViewProps) => {
  const { ride } = request;
  const driver = ride.driver;
  const first = driver.first_name;
  const status = request.cancelled_by_driver ? "CANCELLED" : request.status;
  const accepted = status === "ACCEPTED";
  const live = status === "PENDING" || status === "ACCEPTED";
  const pickupTime = clockLabel(request.pickup_time);

  const declineNote = [
    request.decline_reason ? `Reason: ${request.decline_reason}` : null,
    request.decline_message ? `“${request.decline_message}”` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const banner: { tone: PillTone; title: string; body: string } =
    status === "ACCEPTED"
      ? {
          tone: "success",
          title: `${first} accepted. You’re riding to ${event?.name ?? serviceLabel} ${eventDayPhrase(event)}.`,
          body: `Be at ${request.pickup_point.name} by ${pickupTime}.${
            request.reminder_time
              ? ` We’ll remind you ${eventDayPhrase(event)} at ${clockLabel(request.reminder_time)}.`
              : ""
          }`,
        }
      : status === "PENDING"
        ? {
            tone: "warning",
            title: `Waiting for ${first} to reply`,
            body: "You’ll get a notification as soon as they do.",
          }
        : status === "CANCELLED"
          ? {
              tone: "danger",
              title: `${first} cancelled this ride`,
              body: `Find another ride to ${event?.name ?? serviceLabel}.`,
            }
          : {
              tone: "danger",
              title: `${first} can’t take you this time`,
              body: declineNote || "No reason given.",
            };

  const routeStops: TimelineStop[] = [
    ...stopsOf(ride.route).map((name, index) => {
      const here = name === request.pickup_point.name;
      return {
        key: `${index}-${name}`,
        time: here ? pickupTime : "",
        label: name,
        sub: here ? "You get on here" : undefined,
        subTone: "success" as const,
        dot: here ? ("here" as const) : ("muted" as const),
        weight: here ? ("semibold" as const) : ("normal" as const),
      };
    }),
    {
      key: "church",
      time: "",
      label: "Church",
      sub: eventStartsLabel(event, serviceLabel),
      dot: "church",
      weight: "normal",
    },
  ];

  return (
    <>
      <div
        role="status"
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
          pillTone[banner.tone]
        )}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className={cn("text-base font-semibold", toneText[banner.tone])}>
            {banner.title}
          </p>
          <p className="text-sm text-gray-700">{banner.body}</p>
        </div>
        {!live ? (
          <button
            type="button"
            onClick={onFindAnother}
            disabled={dismissing}
            className={btnPrimary}
          >
            Find another ride
          </button>
        ) : null}
      </div>

      {live ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl border border-lightGray p-4">
              <span className="text-xs font-semibold uppercase text-mainGray">
                Your pickup
              </span>
              <span className="text-2xl font-semibold leading-8 text-primary">
                {pickupTime}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-primary">
                  {request.pickup_point.name}
                </span>
                <span className="text-xs text-mainGray">
                  {request.pickup_point.area_label} ·{" "}
                  {ride.other_passengers
                    ? plural(ride.other_passengers, "other passenger")
                    : "No other passengers yet"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-lightGray p-4">
              <div className="flex items-center gap-3">
                <Avatar initials={driver.initials} />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-primary">
                    {accepted ? driver.name : shortName(first, driver.initials)}
                  </span>
                  <span className="text-xs text-mainGray">
                    From {ride.area.name} · leaves {clockLabel(ride.depart_time)}
                  </span>
                </div>
              </div>
              {accepted ? (
                <>
                  <p className="text-sm text-gray-700">
                    {driver.car_details || "No car details given"}
                  </p>
                  {driver.phone ? (
                    <div className="flex gap-2">
                      <a
                        href={phoneUrl("sms", driver.phone)}
                        className={cn(btnSecondary, "min-h-[44px] flex-1")}
                      >
                        Text
                      </a>
                      <a
                        href={phoneUrl("tel", driver.phone)}
                        className={cn(btnPrimary, "min-h-[44px] flex-1")}
                      >
                        Call {driver.phone}
                      </a>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="flex items-center gap-2 rounded-lg bg-inputBackground px-3 py-2 text-xs text-primaryGray">
                  <LockIcon className="h-3.5 w-3.5 flex-none" />
                  Phone and car details appear when {first} accepts.
                </p>
              )}
            </div>
          </div>

          <section className="flex flex-col gap-2" aria-labelledby="ride-route">
            <h2 id="ride-route" className={sectionTitle}>
              The route
            </h2>
            <RouteTimeline stops={routeStops} />
          </section>

          <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onWithdraw}
              className={btnDangerOutline}
            >
              {accepted ? "Give up my seat" : "Withdraw request"}
            </button>
            <button type="button" onClick={onReport} className={btnGhost}>
              Report a safety concern
            </button>
          </div>
        </>
      ) : null}
    </>
  );
};
