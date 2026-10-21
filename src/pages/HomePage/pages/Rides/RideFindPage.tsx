import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type { RideSearchResult } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { RequestSeatSheet } from "./components/RequestSeatSheet";
import { MembersOnlyNotice } from "./components/MembersOnlyNotice";
import {
  Avatar,
  DashedEmpty,
  LoadError,
  MemberTick,
  NoticeBanner,
  Pill,
  RideSkeleton,
  SearchField,
} from "./components/rideUi";
import {
  btnPrimary,
  btnSecondary,
  listCard,
  sectionTitle,
} from "./components/rideClasses";
import { useRidesContext } from "./hooks/useRidesContext";
import { RideColumns } from "./RidesLayout";
import {
  clockLabel,
  eventDayPhrase,
  isBusyForEvent,
  isMembersOnlyError,
  openRidesLabel,
  plural,
  ridePaths,
  riderPickupOptions,
  withEvent,
  seatsLeftLabel,
  shortName,
} from "./utils/rideHelpers";

const POINT_PARAM = "pickup_point_id";

type SearchRide = RideSearchResult["rides"][number];

const OWN_REQUEST_LABEL: Record<string, string> = {
  PENDING: "Requested",
  ACCEPTED: "You have a seat",
  DECLINED: "Declined",
};

/** /member/rides/find — pick a landmark, see the rides passing it with the
 *  time they get there, ask for a seat. `?pickup_point_id=` (ride alerts
 *  deep-link here) preselects the point; otherwise the member's recent one. */
const RideFindPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    event,
    myRide,
    applyMyRide,
    refreshMyRide,
    catalog,
    catalogLoading,
    refreshCatalog,
  } = useRidesContext();

  const paramValue = Number(searchParams.get(POINT_PARAM));
  const paramId =
    Number.isInteger(paramValue) && paramValue > 0 ? paramValue : null;
  const point =
    catalog?.pickup_points.find((item) => item.id === paramId) ?? null;

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RideSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [membersOnlySearch, setMembersOnlySearch] = useState(false);
  const [alertOn, setAlertOn] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [requestRide, setRequestRide] = useState<SearchRide | null>(null);
  const [sending, setSending] = useState(false);
  const searchRef = useRef(0);

  /** Set the pickup point, keeping the selected event in the URL. */
  const choosePoint = useCallback(
    (id: number, replace = false) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(POINT_PARAM, String(id));
          return next;
        },
        { replace }
      ),
    [setSearchParams]
  );

  // No point in the URL: fall back to the member's recent one.
  useEffect(() => {
    if (!catalog || paramId) return;
    const recent = catalog.recent_pickup_point_id;
    if (recent && catalog.pickup_points.some((item) => item.id === recent)) {
      choosePoint(recent, true);
    }
  }, [catalog, paramId, choosePoint]);

  const pointId = point?.id ?? null;
  const eventId = event?.id ?? null;

  const search = useCallback(async () => {
    if (!pointId) return;
    const request = ++searchRef.current;
    setSearching(true);
    setSearchFailed(false);
    try {
      const response = await api.fetch.searchRides(pointId, eventId);
      if (request !== searchRef.current) return;
      setResult(response.data ?? null);
      setAlertOn(Boolean(response.data?.alert_on));
    } catch (error) {
      // ApiErrorHandler has already shown the backend's message.
      if (request !== searchRef.current) return;
      setResult(null);
      setSearchFailed(true);
      setMembersOnlySearch(isMembersOnlyError(error));
    } finally {
      if (request === searchRef.current) setSearching(false);
    }
  }, [pointId, eventId]);

  useEffect(() => {
    search();
    return () => {
      searchRef.current += 1;
    };
  }, [search]);

  // A ride changed (realtime): the list may have new or fewer seats.
  useEffect(() => {
    const onRidesChanged = () => {
      void search();
    };
    window.addEventListener("app:rides-changed", onRidesChanged);
    return () => window.removeEventListener("app:rides-changed", onRidesChanged);
  }, [search]);

  const toggleAlert = async () => {
    if (!pointId || !point || alertSaving) return;
    const enabled = !alertOn;
    setAlertOn(enabled);
    setAlertSaving(true);
    try {
      const response = await api.post.setRideAlert({
        pickup_point_id: pointId,
        enabled,
        event_id: eventId ?? undefined,
      });
      const on = response.data?.alert_on ?? enabled;
      setAlertOn(on);
      if (on) {
        notify.success({
          title: "Alert on",
          message: `We'll tell you when a ride to ${event?.name ?? "church"} with a free seat passes ${point.name}.`,
        });
      }
    } catch {
      setAlertOn(!enabled);
    } finally {
      setAlertSaving(false);
    }
  };

  const sendRequest = async () => {
    if (!requestRide || !pointId) return;
    const first = requestRide.driver.first_name;
    setSending(true);
    try {
      const response = await api.post.requestRideSeat({
        ride_offer_id: requestRide.id,
        pickup_point_id: pointId,
      });
      if (response.data) applyMyRide(response.data);
      else void refreshMyRide();
      void refreshCatalog();
      notify.success({
        title: "Request sent",
        message: `${first} will reply before ${event?.name ?? "the event"}. We'll notify you.`,
      });
      navigate(withEvent(ridePaths.mine, eventId));
    } catch {
      // e.g. "This ride is now full" — show the fresh list.
      setSending(false);
      setRequestRide(null);
      search();
      void refreshCatalog();
    }
  };

  if (membersOnlySearch) return <MembersOnlyNotice />;

  if (catalogLoading && !catalog) {
    return (
      <RideColumns>
        <RideSkeleton rows={3} />
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

  const current = result && result.pickup_point.id === pointId ? result : null;
  const busy = isBusyForEvent(myRide) || Boolean(current?.busy);
  const eventName = event?.name ?? "this event";
  const points = riderPickupOptions(catalog, query);

  const renderResults = () => {
    if (!point) {
      return (
        <p className="text-sm text-mainGray">
          Choose a landmark above to see the rides to {eventName} passing it.
        </p>
      );
    }
    if (searchFailed && !current) {
      return (
        <LoadError
          message={`Couldn't load rides past ${point.name}.`}
          onRetry={search}
        />
      );
    }
    if (searching && !current) return <RideSkeleton rows={2} />;
    if (!current) return null;

    const count = current.rides.length;
    return (
      <section
        className="flex flex-col gap-3"
        aria-live="polite"
        aria-busy={searching}
        aria-labelledby="find-results"
      >
        <h2 id="find-results" className={sectionTitle}>
          {count
            ? `${plural(count, "ride")} ${count === 1 ? "passes" : "pass"} ${point.name}`
            : `No rides pass ${point.name} yet`}
        </h2>

        {current.rides.map((ride) => {
          const own = OWN_REQUEST_LABEL[ride.my_request_status ?? ""];
          const canAsk = !busy && !own;
          return (
            <article
              key={ride.id}
              className={cn(listCard, "flex animate-toast-in flex-col gap-3 p-4")}
            >
              <div className="flex items-center gap-3">
                <Avatar initials={ride.driver.initials} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-base font-semibold text-primary">
                      {shortName(ride.driver.first_name, ride.driver.initials)}
                    </span>
                    <MemberTick />
                  </span>
                  <span className="text-xs text-mainGray">
                    From {ride.area.name}
                  </span>
                </div>
                <Pill tone={ride.seats_left === 1 ? "warning" : "success"}>
                  {seatsLeftLabel(ride.seats_left)}
                </Pill>
              </div>

              <div className="flex flex-wrap items-end gap-x-6 gap-y-2 rounded-lg bg-inputBackground px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-xs text-mainGray">
                    Picks you up at {point.name}
                  </span>
                  <span className="text-2xl font-semibold leading-8 text-primary">
                    {clockLabel(ride.pickup_time)}
                  </span>
                </div>
                <span className="pb-1 text-sm text-primaryGray">
                  Leaves {clockLabel(ride.depart_time)}
                </span>
              </div>

              <p className="text-xs text-primaryGray">
                {ride.route.join(" → ")}
              </p>

              {canAsk ? (
                <button
                  type="button"
                  onClick={() => setRequestRide(ride)}
                  className={cn(btnPrimary, "min-h-[44px]")}
                >
                  Ask for a seat
                </button>
              ) : own ? (
                ride.my_request_status === "DECLINED" ? (
                  <p className="rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700">
                    {own}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(withEvent(ridePaths.mine, eventId))}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    {own} · view my ride
                  </button>
                )
              ) : null}
            </article>
          );
        })}

        {count === 0 ? (
          <DashedEmpty
            title={`No free seats past ${point.name} yet`}
            description={`Drivers publish ahead of ${eventName}. Turn on an alert and we'll tell you the moment one does.`}
          >
            <button
              type="button"
              aria-pressed={alertOn}
              disabled={alertSaving}
              onClick={toggleAlert}
              className={cn(
                btnSecondary,
                "min-h-[44px]",
                alertOn &&
                  "border-green-200 bg-green-50 text-green-700 hover:bg-green-50 dark:border-green-400/30 dark:bg-green-400/15 dark:text-green-300"
              )}
            >
              {alertOn ? "We'll notify you" : "Notify me when one does"}
            </button>
          </DashedEmpty>
        ) : null}

        {current.full_count > 0 ? (
          <p className="text-center text-xs text-mainGray">
            {plural(current.full_count, "full ride")} hidden
          </p>
        ) : null}
      </section>
    );
  };

  return (
    <RideColumns>
      {busy ? (
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
              onClick={() => navigate(withEvent(ridePaths.mine, eventId))}
              className={btnSecondary}
            >
              View my ride
            </button>
          }
        />
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="find-where">
        <div className="flex flex-col gap-0.5">
          <h2 id="find-where" className={sectionTitle}>
            Where can you get to?
          </h2>
          <p className="text-sm text-primaryGray">
            Pick a public landmark near you. We’ll show the rides that pass it.
          </p>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search landmarks or areas"
          label="Search pickup points"
          className="max-w-[420px]"
        />
        <div role="radiogroup" aria-label="Pickup point" className="flex flex-wrap gap-2">
          {points.map((item) => {
            const on = item.id === pointId;
            const hasRides = item.open_rides > 0;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() =>
                  choosePoint(item.id)
                }
                className={cn(
                  "flex min-h-[44px] flex-col items-start rounded-lg border px-3 py-1.5 text-left transition-colors",
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-lightGray bg-white text-primary hover:bg-lightGray/20"
                )}
              >
                <span className="text-sm font-medium">{item.name}</span>
                <span
                  className={cn(
                    "text-xs",
                    on
                      ? "text-white/80"
                      : hasRides
                        ? "text-green-700 dark:text-green-300"
                        : "text-mainGray"
                  )}
                >
                  {openRidesLabel(item.open_rides)}
                </span>
              </button>
            );
          })}
        </div>
        {points.length === 0 ? (
          <p className="text-sm text-mainGray">
            No landmarks match. Try the area name, like “East Legon”.
          </p>
        ) : null}
      </section>

      {renderResults()}

      <RequestSeatSheet
        ride={requestRide}
        pickupName={point?.name ?? ""}
        submitting={sending}
        onClose={() => setRequestRide(null)}
        onSend={sendRequest}
      />
    </RideColumns>
  );
};

export default RideFindPage;
