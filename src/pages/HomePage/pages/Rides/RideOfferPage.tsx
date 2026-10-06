import {
  MapIcon,
  MinusIcon,
  PlusCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/utils/api/apiCalls";
import type { RideCatalog } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { AreaSheet } from "./components/AreaSheet";
import { OfferStopsSheet } from "./components/OfferStopsSheet";
import { RideLoadError, RidePage, RideSkeleton } from "./components/RidePage";
import { SectionLabel } from "./components/SectionLabel";
import {
  goldCta,
  rideCard,
  selectedRow,
  textInput,
  unselectedRow,
} from "./components/rideStyles";
import { useMyRide } from "./hooks/useMyRide";
import { useRideCatalog } from "./hooks/useRideCatalog";
import {
  clockLabel,
  defaultStopsFor,
  orderedStops,
  ridePaths,
} from "./utils/rideHelpers";

const CAR_DETAILS_MAX = 160;
const DEFAULT_SEATS = 3;

type Sheet = "area" | "stops" | null;

/** The form's starting values: the member's last offer, else the design's
 *  defaults (first area, its first two landmarks, the second time slot). */
const initialForm = (catalog: RideCatalog) => {
  const last = catalog.last_offer;
  const areaId =
    catalog.areas.find((area) => area.id === last?.area_id)?.id ??
    catalog.areas[0]?.id ??
    null;
  const times = catalog.depart_times;
  const departTime =
    last && times.includes(last.depart_time)
      ? last.depart_time
      : (times[Math.min(1, times.length - 1)] ?? "");
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

/** /member/rides/offer — area, landmarks, time and seats; never an address. */
const RideOfferPage = () => {
  const navigate = useNavigate();
  const {
    catalog,
    loading: catalogLoading,
    membersOnly: catalogMembersOnly,
    refresh: refreshCatalog,
  } = useRideCatalog();
  const { myRide, loading: rideLoading, membersOnly: rideMembersOnly } =
    useMyRide();

  const [areaId, setAreaId] = useState<number | null>(null);
  const [stopIds, setStopIds] = useState<number[]>([]);
  const [departTime, setDepartTime] = useState("");
  const [seats, setSeats] = useState(DEFAULT_SEATS);
  const [carDetails, setCarDetails] = useState("");
  const [sheet, setSheet] = useState<Sheet>(null);
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

  const membersOnly = catalogMembersOnly || rideMembersOnly;
  const loading = catalogLoading || rideLoading;

  const renderBody = () => {
    if (loading) return <RideSkeleton rows={4} />;
    if (!catalog) {
      return <RideLoadError onRetry={refreshCatalog} />;
    }
    if (myRide?.role) {
      return (
        <div className={cn(rideCard, "flex flex-col items-center gap-3 p-6 text-center")}>
          <p className="text-sm font-semibold text-primary">
            {myRide.role === "driver"
              ? "You're already driving this Sunday."
              : "You already have a ride this Sunday."}
          </p>
          <p className="text-sm text-primaryGray">
            Each member can drive or ride once per Sunday. Cancel your current
            ride first to offer one.
          </p>
          <Link
            to={ridePaths.mine}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-amber-50 px-4 text-sm font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-400/15 dark:text-amber-300"
          >
            View my ride
          </Link>
        </div>
      );
    }

    const area = catalog.areas.find((item) => item.id === areaId) ?? null;
    const stops = orderedStops(catalog, areaId, stopIds);
    const missingStops = attempted && stops.length === 0;

    const publish = async () => {
      setAttempted(true);
      if (!areaId || !departTime || stops.length === 0) return;
      setSubmitting(true);
      try {
        const trimmedCar = carDetails.trim();
        await api.post.publishRide({
          area_id: areaId,
          depart_time: departTime,
          seats,
          pickup_point_ids: stops.map((stop) => stop.id),
          car_details: trimmedCar || undefined,
        });
        navigate(ridePaths.mine);
      } catch {
        // ApiErrorHandler has shown the backend's message (e.g. 409 already
        // driving); refresh so a stale catalog doesn't keep failing.
        refreshCatalog();
        setSubmitting(false);
      }
    };

    return (
      <>
        <section className="flex flex-col gap-2.5" aria-labelledby="offer-area">
          <SectionLabel id="offer-area">Starting area</SectionLabel>
          <div className="flex min-h-[54px] items-center gap-3 rounded-2xl border border-lightGray bg-white pl-4 pr-2">
            <MapIcon
              className="h-5 w-5 flex-none text-amber-600 dark:text-amber-300"
              aria-hidden="true"
            />
            <span
              className={cn(
                "flex-1 text-base font-medium",
                area ? "text-primary" : "text-primaryGray"
              )}
            >
              {area?.name ?? "Choose your area"}
            </span>
            <button
              type="button"
              onClick={() => setSheet("area")}
              className="min-h-[44px] rounded-xl px-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-400/10"
            >
              Change
            </button>
          </div>
          <p className="px-1 text-xs text-primaryGray">
            An area, not your address. Riders only see this.
          </p>
        </section>

        <section className="flex flex-col gap-2.5" aria-labelledby="offer-stops">
          <SectionLabel id="offer-stops">Pickup points on your way</SectionLabel>
          <div
            className={cn(
              rideCard,
              "overflow-hidden",
              missingStops && "border-rose-300 dark:border-rose-400/50"
            )}
          >
            <ol>
              {stops.map((stop, index) => (
                <li
                  key={stop.id}
                  className="flex items-center gap-3 border-b border-lightGray py-2.5 pl-4 pr-2"
                >
                  <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700 dark:bg-teal-400/15 dark:text-teal-300">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-primary">
                      {stop.name}
                    </span>
                    <span className="block text-xs text-primaryGray">
                      {stop.area_label}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${stop.name}`}
                    onClick={() =>
                      setStopIds((ids) => ids.filter((id) => id !== stop.id))
                    }
                    className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl text-primaryGray hover:bg-lightGray/30"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setSheet("stops")}
              className="flex min-h-[54px] w-full items-center gap-3 px-4 text-left hover:bg-lightGray/20"
            >
              <PlusCircleIcon
                className="h-6 w-6 flex-none text-amber-600 dark:text-amber-300"
                aria-hidden="true"
              />
              <span className="flex-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                {stopIds.length ? "Add or edit points" : "Add pickup points"}
              </span>
              {stopIds.length ? (
                <span className="text-xs font-medium text-primaryGray">
                  {stopIds.length} selected
                </span>
              ) : null}
            </button>
          </div>
          <p
            className={cn(
              "px-1 text-xs",
              missingStops ? "font-medium text-rose-700 dark:text-rose-300" : "text-primaryGray"
            )}
            role={missingStops ? "alert" : undefined}
          >
            {missingStops
              ? "Add at least one pickup point so riders can find your ride."
              : "Public landmarks only. Riders search by these, so add the ones you pass."}
          </p>
        </section>

        <section className="flex flex-col gap-2.5" aria-labelledby="offer-time">
          <SectionLabel id="offer-time">Departure</SectionLabel>
          <div
            role="radiogroup"
            aria-labelledby="offer-time"
            className="flex flex-wrap gap-2"
          >
            {catalog.depart_times.map((time) => {
              const on = time === departTime;
              return (
                <button
                  key={time}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setDepartTime(time)}
                  className={cn(
                    "min-h-[40px] rounded-xl border px-3.5 text-sm transition-colors",
                    on
                      ? cn(selectedRow, "font-bold text-amber-700 dark:text-amber-300")
                      : cn(unselectedRow, "font-medium text-primary")
                  )}
                >
                  {clockLabel(time)}
                </button>
              );
            })}
          </div>
        </section>

        <div className={cn(rideCard, "flex items-center gap-3 py-3 pl-4 pr-3")}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">Available seats</p>
            <p className="text-xs text-primaryGray">Not counting you</p>
          </div>
          <button
            type="button"
            aria-label="Remove a seat"
            disabled={seats <= catalog.min_seats}
            onClick={() => setSeats((value) => Math.max(catalog.min_seats, value - 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lightGray/30 text-primary hover:bg-lightGray/50 disabled:opacity-40"
          >
            <MinusIcon className="h-5 w-5" />
          </button>
          <span
            aria-live="polite"
            className="w-8 text-center text-2xl font-semibold tabular-nums text-primary"
          >
            {seats}
          </span>
          <button
            type="button"
            aria-label="Add a seat"
            disabled={seats >= catalog.max_seats}
            onClick={() => setSeats((value) => Math.min(catalog.max_seats, value + 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-lightGray/30 text-primary hover:bg-lightGray/50 disabled:opacity-40"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        <section className="flex flex-col gap-2.5">
          <label htmlFor="offer-car" className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-primaryGray">
            Car and plate (optional)
          </label>
          <input
            id="offer-car"
            type="text"
            value={carDetails}
            maxLength={CAR_DETAILS_MAX}
            onChange={(event) => setCarDetails(event.target.value)}
            placeholder="e.g. Silver Toyota Corolla · GR 4521-22"
            className={textInput}
          />
          <p className="px-1 text-xs text-primaryGray">
            Shared with passengers only after you accept them.
          </p>
        </section>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={publish}
            disabled={submitting || !areaId}
            className={goldCta}
          >
            {submitting ? "Publishing…" : "Publish ride"}
          </button>
          <p className="text-center text-xs text-primaryGray">
            You choose who joins. Nobody gets your number until you accept.
          </p>
        </div>

        <AreaSheet
          open={sheet === "area"}
          onClose={() => setSheet(null)}
          areas={catalog.areas}
          selectedId={areaId}
          onSelect={(id) => {
            setAreaId(id);
            setStopIds(defaultStopsFor(catalog, id));
            setSheet(null);
          }}
        />
        <OfferStopsSheet
          open={sheet === "stops"}
          onClose={() => setSheet(null)}
          catalog={catalog}
          areaId={areaId}
          areaName={area?.name ?? ""}
          selectedIds={stopIds}
          onToggle={(id) =>
            setStopIds((ids) =>
              ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
            )
          }
        />
      </>
    );
  };

  return (
    <RidePage
      title="Offer a ride"
      intro={catalog?.service_label}
      backToHub
      membersOnly={membersOnly}
    >
      {renderBody()}
    </RidePage>
  );
};

export default RideOfferPage;
