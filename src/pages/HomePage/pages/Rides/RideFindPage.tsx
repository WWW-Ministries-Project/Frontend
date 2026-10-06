import { BellIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/utils/api/apiCalls";
import type { RideSearchResult } from "@/utils/api/rides/interfaces";
import { cn } from "@/utils/cn";
import { FindRideCard } from "./components/FindRideCard";
import { PickupPointSheet } from "./components/PickupPointSheet";
import { RequestSeatSheet } from "./components/RequestSeatSheet";
import { CarIcon } from "./components/RideIcons";
import { RideLoadError, RidePage, RideSkeleton } from "./components/RidePage";
import { SectionLabel } from "./components/SectionLabel";
import { rideCard } from "./components/rideStyles";
import { useRideCatalog } from "./hooks/useRideCatalog";
import { isMembersOnlyError, plural, ridePaths } from "./utils/rideHelpers";

const POINT_PARAM = "pickup_point_id";

type SearchRide = RideSearchResult["rides"][number];

/** /member/rides/find — rides passing one pickup point, with the time they
 *  get there. `?pickup_point_id=` (ride alerts deep-link here) preselects
 *  the point; otherwise the member's most recent one. */
const RideFindPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    catalog,
    loading: catalogLoading,
    membersOnly: catalogMembersOnly,
    refresh: refreshCatalog,
  } = useRideCatalog();

  const paramValue = Number(searchParams.get(POINT_PARAM));
  const paramId =
    Number.isInteger(paramValue) && paramValue > 0 ? paramValue : null;
  const point =
    catalog?.pickup_points.find((item) => item.id === paramId) ?? null;

  const [result, setResult] = useState<RideSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [membersOnlySearch, setMembersOnlySearch] = useState(false);
  const [alertOn, setAlertOn] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [requestRide, setRequestRide] = useState<SearchRide | null>(null);
  const [sending, setSending] = useState(false);
  const searchRef = useRef(0);

  // No point in the URL: fall back to the member's recent one.
  useEffect(() => {
    if (!catalog || paramId) return;
    const recent = catalog.recent_pickup_point_id;
    if (recent && catalog.pickup_points.some((item) => item.id === recent)) {
      setSearchParams({ [POINT_PARAM]: String(recent) }, { replace: true });
    }
  }, [catalog, paramId, setSearchParams]);

  const pointId = point?.id ?? null;

  const search = useCallback(async () => {
    if (!pointId) return;
    const request = ++searchRef.current;
    setSearching(true);
    setSearchFailed(false);
    try {
      const response = await api.fetch.searchRides(pointId);
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
  }, [pointId]);

  useEffect(() => {
    search();
    return () => {
      searchRef.current += 1;
    };
  }, [search]);

  const choosePoint = (id: number) => {
    setPickOpen(false);
    setSearchParams({ [POINT_PARAM]: String(id) });
  };

  const toggleAlert = async () => {
    if (!pointId || alertSaving) return;
    const enabled = !alertOn;
    setAlertOn(enabled);
    setAlertSaving(true);
    try {
      const response = await api.post.setRideAlert({
        pickup_point_id: pointId,
        enabled,
      });
      setAlertOn(response.data?.alert_on ?? enabled);
    } catch {
      setAlertOn(!enabled);
    } finally {
      setAlertSaving(false);
    }
  };

  const sendRequest = async () => {
    if (!requestRide || !pointId) return;
    setSending(true);
    try {
      await api.post.requestRideSeat({
        ride_offer_id: requestRide.id,
        pickup_point_id: pointId,
      });
      navigate(ridePaths.mine);
    } catch {
      // e.g. "This ride is now full" — show the fresh list.
      setSending(false);
      setRequestRide(null);
      search();
      refreshCatalog();
    }
  };

  const current =
    result && result.pickup_point.id === pointId ? result : null;

  const renderResults = () => {
    if (!point) {
      return (
        <div className={cn(rideCard, "flex flex-col items-center gap-3 px-5 py-7 text-center")}>
          <MapPinIcon className="h-8 w-8 text-primaryGray/60" aria-hidden="true" />
          <p className="max-w-xs text-sm text-primaryGray">
            Choose the pickup point you can get to, and we'll show the rides
            passing it this Sunday.
          </p>
        </div>
      );
    }
    if (searchFailed && !current) return <RideLoadError onRetry={search} />;
    if (searching && !current) return <RideSkeleton rows={2} />;
    if (!current) return null;

    const count = current.rides.length;
    return (
      <section className="flex flex-col gap-3" aria-labelledby="find-results" aria-busy={searching}>
        <SectionLabel id="find-results">
          {count
            ? `${plural(count, "ride")} past ${point.name}`
            : `Rides past ${point.name}`}
        </SectionLabel>
        {current.rides.map((ride) => (
          <FindRideCard
            key={ride.id}
            ride={ride}
            pickupName={point.name}
            busy={current.busy}
            onRequest={() => setRequestRide(ride)}
            onViewRequest={() => navigate(ridePaths.mine)}
          />
        ))}
        {count === 0 ? (
          <div className={cn(rideCard, "flex flex-col items-center gap-3.5 px-5 py-7 text-center")}>
            <CarIcon className="h-8 w-8 text-primaryGray/60" />
            <p className="max-w-[270px] text-sm text-primaryGray">
              No rides with free seats pass {point.name} yet.
            </p>
            <button
              type="button"
              aria-pressed={alertOn}
              disabled={alertSaving}
              onClick={toggleAlert}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors disabled:opacity-60",
                alertOn
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-400/15 dark:text-amber-300"
              )}
            >
              {alertOn ? (
                <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <BellIcon className="h-5 w-5" aria-hidden="true" />
              )}
              {alertOn ? "We'll notify you" : "Notify me when one does"}
            </button>
          </div>
        ) : null}
        {current.full_count > 0 ? (
          <p className="flex items-center justify-center gap-1.5 text-xs text-primaryGray">
            <EyeSlashIcon className="h-4 w-4" aria-hidden="true" />
            {plural(current.full_count, "full ride")} hidden
          </p>
        ) : null}
      </section>
    );
  };

  return (
    <RidePage
      title="Find a ride"
      intro={catalog?.service_label}
      backToHub
      membersOnly={catalogMembersOnly || membersOnlySearch}
    >
      {catalogLoading ? (
        <RideSkeleton rows={3} />
      ) : !catalog ? (
        <RideLoadError onRetry={refreshCatalog} />
      ) : (
        <>
          <section className="flex flex-col gap-2.5" aria-labelledby="find-point">
            <SectionLabel id="find-point">Your pickup point</SectionLabel>
            <button
              type="button"
              onClick={() => setPickOpen(true)}
              className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border border-lightGray bg-white px-4 text-left transition-colors hover:bg-lightGray/20"
            >
              <MapPinIcon
                className="h-5 w-5 flex-none text-teal-600 dark:text-teal-300"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-primary">
                  {point?.name ?? "Choose a pickup point"}
                </span>
                <span className="block text-xs text-primaryGray">
                  {point
                    ? `${point.area_label} · tap to change`
                    : "A public landmark near you"}
                </span>
              </span>
              <span className="flex-none text-sm font-semibold text-amber-700 dark:text-amber-300">
                {point ? "Change" : "Choose"}
              </span>
            </button>
          </section>

          {renderResults()}

          <PickupPointSheet
            open={pickOpen}
            onClose={() => setPickOpen(false)}
            catalog={catalog}
            selectedId={pointId}
            onSelect={choosePoint}
          />
          <RequestSeatSheet
            ride={requestRide}
            pickupName={point?.name ?? ""}
            submitting={sending}
            onClose={() => setRequestRide(null)}
            onSend={sendRequest}
          />
        </>
      )}
    </RidePage>
  );
};

export default RideFindPage;
