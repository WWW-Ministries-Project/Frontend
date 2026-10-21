import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "@/components/feedback";
import { useUserStore } from "@/store/userStore";
import { api } from "@/utils/api/apiCalls";
import type { RideCatalog } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import {
  Avatar,
  ChoiceChip,
  LoadError,
  NoticeBanner,
  Pill,
  RideSkeleton,
} from "./components/rideUi";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  listCard,
  sectionTitle,
  selectClass,
} from "./components/rideClasses";
import { useRidesContext } from "./hooks/useRidesContext";
import { RideColumns } from "./RidesLayout";
import {
  addMinutes,
  clockLabel,
  defaultStopsFor,
  initialsOf,
  DEPART_STEP_MINUTES,
  defaultDepartTime,
  departTimeProblem,
  eventDayPhrase,
  isBusyForEvent,
  joinNames,
  orderedStops,
  ridePaths,
  withEvent,
  seatsLeftLabel,
} from "./utils/rideHelpers";

const CAR_DETAILS_MAX = 160;
const DEFAULT_SEATS = 3;

/** The form's starting values: the member's last offer, else the first
 *  area, its first two landmarks, and a departure that suits the event. */
const initialForm = (catalog: RideCatalog) => {
  const last = catalog.last_offer;
  const areaId =
    catalog.areas.find((area) => area.id === last?.area_id)?.id ??
    catalog.areas[0]?.id ??
    null;
  const departTime = defaultDepartTime(catalog, last?.depart_time);
  const seats = Math.min(
    catalog.max_seats,
    Math.max(catalog.min_seats, last?.seats_total ?? DEFAULT_SEATS)
  );
  return {
    areaId,
    stopIds: areaId ? defaultStopsFor(catalog, areaId) : [],
    departTime,
    seats,
    carDetails: last?.car_details ?? "",
  };
};

interface PreviewProps {
  name: string;
  initials: string;
  areaName: string;
  seats: number;
  pointName: string | null;
  pickupTime: string;
  departTime: string;
  route: string;
}

/** "What riders will see" — the card Find a ride shows for this offer. */
const RiderPreview = ({
  name,
  initials,
  areaName,
  seats,
  pointName,
  pickupTime,
  departTime,
  route,
}: PreviewProps) => (
  <div className={cn(listCard, "flex flex-col gap-3 p-4")}>
    <div className="flex items-center gap-3">
      <Avatar initials={initials} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold text-primary">{name}</span>
        <span className="text-xs text-mainGray">From {areaName}</span>
      </div>
      <Pill tone="success">{seatsLeftLabel(seats)}</Pill>
    </div>
    {pointName ? (
      <>
        <div className="flex flex-col rounded-lg bg-inputBackground px-4 py-3">
          <span className="text-xs text-mainGray">Picks up at {pointName}</span>
          <span className="text-xl font-semibold leading-7 text-primary">
            {clockLabel(pickupTime)}
          </span>
          <span className="text-xs text-primaryGray">
            Leaves {clockLabel(departTime)}
          </span>
        </div>
        <p className="text-xs text-primaryGray">{route}</p>
      </>
    ) : null}
    <p className="text-xs text-mainGray">
      Your phone and car stay hidden until you accept someone.
    </p>
  </div>
);

/** /member/rides/offer — area, departure, landmarks, seats; never an address. */
const RideOfferPage = () => {
  const navigate = useNavigate();
  const userName = useUserStore((state) => state.name);
  const {
    event,
    myRide,
    myRideLoading,
    refreshMyRide,
    catalog,
    catalogLoading,
    refreshCatalog,
  } = useRidesContext();

  const [areaId, setAreaId] = useState<number | null>(null);
  const [stopIds, setStopIds] = useState<number[]>([]);
  const [departTime, setDepartTime] = useState("");
  const [seats, setSeats] = useState(DEFAULT_SEATS);
  const [carDetails, setCarDetails] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const prefilled = useRef(false);

  useEffect(() => {
    if (!catalog || prefilled.current) return;
    prefilled.current = true;
    const form = initialForm(catalog);
    setAreaId(form.areaId);
    setStopIds(form.stopIds);
    setDepartTime(form.departTime);
    setSeats(form.seats);
    setCarDetails(form.carDetails);
  }, [catalog]);

  if ((catalogLoading && !catalog) || (myRideLoading && !myRide)) {
    return (
      <RideColumns>
        <RideSkeleton rows={4} />
      </RideColumns>
    );
  }

  if (!catalog) {
    return (
      <RideColumns>
        <LoadError
          message="Couldn't load Ride to church. Check your connection and try again."
          onRetry={refreshCatalog}
        />
      </RideColumns>
    );
  }

  const eventName = event?.name ?? "this event";

  if (isBusyForEvent(myRide)) {
    return (
      <RideColumns>
        <NoticeBanner
          title={
            myRide?.role === "driver"
              ? `You're driving to ${eventName} ${eventDayPhrase(event)}.`
              : `You already have a seat for ${eventName} ${eventDayPhrase(event)}.`
          }
          description="Each member can drive or ride once per event. Cancel your current ride first."
          action={
            <button
              type="button"
              onClick={() => navigate(withEvent(ridePaths.mine, event?.id))}
              className={btnSecondary}
            >
              View my ride
            </button>
          }
        />
      </RideColumns>
    );
  }

  const area = catalog.areas.find((item) => item.id === areaId) ?? null;
  const pointsById = new Map(
    catalog.pickup_points.map((point) => [point.id, point])
  );
  const routeStops = (area?.route ?? []).flatMap((stop) => {
    const point = pointsById.get(stop.pickup_point_id);
    return point ? [{ point, minutes: stop.minutes }] : [];
  });
  const onRoute = new Set(routeStops.map((stop) => stop.point.id));
  const minutesOf = new Map(
    routeStops.map((stop) => [stop.point.id, stop.minutes])
  );
  const extraStops = stopIds
    .filter((id) => !onRoute.has(id))
    .flatMap((id) => {
      const point = pointsById.get(id);
      return point ? [point] : [];
    });
  const addOptions = catalog.pickup_points.filter(
    (point) => !onRoute.has(point.id) && !stopIds.includes(point.id)
  );
  const stops = orderedStops(catalog, areaId, stopIds);
  const missingStops = attempted && stops.length === 0;
  const timeAt = (pointId: number) =>
    addMinutes(departTime, minutesOf.get(pointId) ?? 0);

  const toggleStop = (id: number) =>
    setStopIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  const firstStop = stops[0] ?? null;
  const previewProps: PreviewProps = {
    name: userName
      ? (() => {
          const parts = userName.trim().split(/\s+/);
          return parts.length > 1
            ? `${parts[0]} ${parts[parts.length - 1][0]}.`
            : parts[0];
        })()
      : "You",
    initials: initialsOf(userName),
    areaName: area?.name ?? "your area",
    seats,
    pointName: firstStop?.name ?? null,
    pickupTime: firstStop ? timeAt(firstStop.id) : departTime,
    departTime,
    route: [
      ...(area ? [area.name] : []),
      ...stops.map((stop) => stop.name),
      "Church",
    ].join(" → "),
  };

  const timeProblem = departTime ? departTimeProblem(departTime, event) : null;
  const quickTimes = catalog.depart_times.filter(
    (time) => !departTimeProblem(time, event)
  );

  const publish = async () => {
    setAttempted(true);
    if (
      !areaId ||
      !departTime ||
      timeProblem ||
      stops.length === 0 ||
      submitting
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const trimmedCar = carDetails.trim();
      await api.post.publishRide({
        area_id: areaId,
        depart_time: departTime,
        seats,
        pickup_point_ids: stops.map((stop) => stop.id),
        car_details: trimmedCar || undefined,
        event_id: event?.id,
      });
      notify.success({
        title: "Ride published",
        message: `Members at ${joinNames(stops.slice(0, 2).map((stop) => stop.name))} can now ask for a seat to ${eventName}.`,
      });
      void refreshCatalog();
      await refreshMyRide();
      navigate(withEvent(ridePaths.mine, event?.id));
    } catch {
      // ApiErrorHandler has shown the backend's message (e.g. 409 already
      // driving); refresh so a stale catalog doesn't keep failing.
      void refreshCatalog();
      void refreshMyRide();
      setSubmitting(false);
    }
  };

  return (
    <RideColumns
      aside={
        <section
          aria-labelledby="offer-preview"
          className="hidden flex-col gap-2 tablet:flex"
        >
          <h2 id="offer-preview" className={sectionTitle}>
            What riders will see
          </h2>
          <RiderPreview {...previewProps} />
        </section>
      }
    >
      <label className="flex max-w-[420px] flex-col gap-1 text-sm font-medium text-primary">
        Where do you set off from?
        <select
          value={areaId ?? ""}
          onChange={(event) => {
            const id = Number(event.target.value);
            setAreaId(id);
            setStopIds(defaultStopsFor(catalog, id));
          }}
          className={selectClass}
        >
          {catalog.areas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-mainGray">
          An area, never your address. Riders only see this.
        </span>
      </label>

      <section className="flex flex-col gap-2" aria-labelledby="offer-time">
        <div className="flex flex-col gap-0.5">
          <h2 id="offer-time" className={sectionTitle}>
            When do you leave?
          </h2>
          {event?.start_time ? (
            <p className="text-sm text-primaryGray">
              {eventName} starts at {clockLabel(event.start_time)}.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quickTimes.length ? (
            <div
              role="radiogroup"
              aria-labelledby="offer-time"
              className="flex flex-wrap gap-2"
            >
              {quickTimes.map((time) => (
                <ChoiceChip
                  key={time}
                  on={time === departTime}
                  onClick={() => setDepartTime(time)}
                >
                  {clockLabel(time)}
                </ChoiceChip>
              ))}
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-primaryGray">
            {quickTimes.length ? "or" : "Leaving at"}
            <input
              type="time"
              step={60 * DEPART_STEP_MINUTES}
              value={departTime}
              onChange={(changeEvent) => setDepartTime(changeEvent.target.value)}
              aria-label="Departure time"
              aria-invalid={Boolean(attempted && timeProblem)}
              className={cn(
                inputClass,
                "w-auto",
                attempted && timeProblem && "border-red-700"
              )}
            />
          </label>
        </div>
        {attempted && timeProblem ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {timeProblem}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="offer-stops">
        <div className="flex flex-col gap-0.5">
          <h2 id="offer-stops" className={sectionTitle}>
            Pickup points on your way
          </h2>
          <p className="text-sm text-primaryGray">
            Riders search by these. Times are estimated from your area’s usual
            route.
          </p>
        </div>
        <div
          className={cn(
            "overflow-hidden rounded-xl border",
            missingStops ? "border-red-700" : "border-lightGray"
          )}
        >
          {routeStops.map(({ point, minutes }) => {
            const on = stopIds.includes(point.id);
            return (
              <label
                key={point.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b border-gray-200 px-4 py-3 transition-colors hover:bg-lightGray/20",
                  on ? "bg-inputBackground" : "bg-white"
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleStop(point.id)}
                  className="h-[18px] w-[18px] flex-none accent-primary"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-primary">
                    {point.name}
                  </span>
                  <span className="text-xs text-mainGray">
                    {point.area_label}
                  </span>
                </span>
                <span className="whitespace-nowrap text-sm font-semibold text-primary">
                  {clockLabel(addMinutes(departTime, minutes))}
                </span>
              </label>
            );
          })}
          <div className="flex flex-wrap items-center gap-2 bg-inputBackground px-4 py-3">
            {extraStops.map((point) => (
              <span
                key={point.id}
                className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-lightGray bg-white py-0.5 pl-2.5 pr-1 text-xs font-medium text-primary"
              >
                <span className="truncate">{point.name}</span>
                <button
                  type="button"
                  onClick={() => toggleStop(point.id)}
                  aria-label={`Remove ${point.name}`}
                  className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-sm leading-none text-mainGray hover:bg-gray-100"
                >
                  ×
                </button>
              </span>
            ))}
            {addOptions.length ? (
              <select
                value=""
                onChange={(event) => {
                  const id = Number(event.target.value);
                  if (id) setStopIds((ids) => [...ids, id]);
                }}
                aria-label="Add another landmark"
                className={cn(selectClass, "w-auto max-w-full")}
              >
                <option value="">Add another landmark…</option>
                {addOptions.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name} · {point.area_label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
        {missingStops ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            Add at least one pickup point so riders can find your ride.
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 tablet:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span id="offer-seats" className="text-sm font-medium text-primary">
            Free seats
          </span>
          <div
            role="group"
            aria-labelledby="offer-seats"
            className="flex h-12 items-center gap-3 rounded-lg border border-lightGray px-1"
          >
            <button
              type="button"
              aria-label="One seat fewer"
              disabled={seats <= catalog.min_seats}
              onClick={() =>
                setSeats((value) => Math.max(catalog.min_seats, value - 1))
              }
              className="h-10 w-10 rounded-lg bg-lightGray/30 text-xl text-primary hover:bg-lightGray/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="flex-1 text-center text-xl font-semibold text-primary"
            >
              {seats}
            </span>
            <button
              type="button"
              aria-label="One more seat"
              disabled={seats >= catalog.max_seats}
              onClick={() =>
                setSeats((value) => Math.min(catalog.max_seats, value + 1))
              }
              className="h-10 w-10 rounded-lg bg-lightGray/30 text-xl text-primary hover:bg-lightGray/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
          <span className="text-xs text-mainGray">Not counting you.</span>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-primary">
          <span>
            Car and plate{" "}
            <span className="font-normal text-mainGray">(optional)</span>
          </span>
          <input
            type="text"
            value={carDetails}
            maxLength={CAR_DETAILS_MAX}
            onChange={(event) => setCarDetails(event.target.value)}
            placeholder="e.g. Silver Toyota Corolla · GR 4521-22"
            className={cn(inputClass, "h-12")}
          />
          <span className="text-xs font-normal text-mainGray">
            Shown only to people you accept.
          </span>
        </label>
      </div>

      <section
        aria-labelledby="offer-preview-inline"
        className="flex flex-col gap-2 tablet:hidden"
      >
        <h2 id="offer-preview-inline" className={sectionTitle}>
          What riders will see
        </h2>
        <RiderPreview {...previewProps} />
      </section>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t border-gray-200 bg-white py-3">
        <button
          type="button"
          onClick={publish}
          disabled={submitting || !areaId}
          className={cn(btnPrimary, "min-h-[48px] text-base")}
        >
          {submitting ? "Publishing…" : "Publish ride"}
        </button>
        <p className="text-center text-xs text-mainGray">
          You choose who joins. Nobody gets your number until you accept.
        </p>
      </div>
    </RideColumns>
  );
};

export default RideOfferPage;
