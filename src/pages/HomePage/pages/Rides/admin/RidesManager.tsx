import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { api } from "@/utils/api/apiCalls";
import type { AdminRideOverview } from "@/utils/api/rides/interfaces";
import {
  btnSecondary,
  selectClass,
} from "../components/rideClasses";
import {
  clockLabel,
  downloadCsv,
  serviceDateLabel,
} from "../utils/rideHelpers";
import { RideBlocksPanel } from "./RideBlocksPanel";
import { RideOverviewPanel } from "./RideOverviewPanel";
import { type PlacesView, RidePlacesPanel } from "./RidePlacesPanel";
import { RideReportsPanel } from "./RideReportsPanel";

type RidesTab = "rides" | "reports" | "blocks" | "places";

/** Each tab and the Rides actions that open it (any of them). */
const TABS: { param: RidesTab; label: string; actions: string[] }[] = [
  { param: "rides", label: "Rides", actions: ["Rides.view_overview"] },
  { param: "reports", label: "Safety reports", actions: ["Rides.resolve_safety_reports"] },
  { param: "blocks", label: "Blocks", actions: ["Rides.lift_block", "Rides.resolve_safety_reports"] },
  { param: "places", label: "Places", actions: ["Rides.manage_pickup_points"] },
];

/** Same id scheme TabSelection uses for `tab-…` / `panel-…`. */
const tabDomId = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** `?tab=` values, including the old separate pickup-points / areas tabs. */
const readTab = (
  value: string | null,
  tabs: typeof TABS = TABS
): { tab: RidesTab; places: PlacesView } => {
  const fallback = tabs[0]?.param ?? "rides";
  const allowed = (tab: RidesTab) => tabs.some((entry) => entry.param === tab);
  if (value === "pickup-points" || value === "areas") {
    return {
      tab: allowed("places") ? "places" : fallback,
      places: value === "areas" ? "areas" : "points",
    };
  }
  const tab = tabs.find((entry) => entry.param === value)?.param ?? fallback;
  return { tab, places: "areas" };
};

/**
 * Ride to church for the safety team and church office: who's driving whom
 * to the church events on a date (services and programmes), safety reports,
 * blocks, and the areas and landmarks members choose from.
 */
const RidesManager = () => {
  const { hasAction } = useAccessControl();
  // Tabs and controls follow the same Rides actions the API checks.
  const tabs = useMemo(
    () => TABS.filter((tab) => tab.actions.some((action) => hasAction(action))),
    [hasAction]
  );
  const canViewOverview = hasAction("Rides.view_overview");
  const canExportRoster = hasAction("Rides.export_roster");
  const canCancelRides = hasAction("Rides.cancel_any_offer");
  const canLiftBlocks = hasAction("Rides.lift_block");
  const canSeeReports = hasAction("Rides.resolve_safety_reports");
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = readTab(searchParams.get("tab"), tabs);
  const activeTab = readTab(searchParams.get("tab"), tabs).tab;
  const [placesView, setPlacesView] = useState<PlacesView>(initial.places);

  const [serviceDate, setServiceDate] = useState("");
  const [overview, setOverview] = useState<AdminRideOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openReports, setOpenReports] = useState<number | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!canViewOverview) {
      setLoading(false);
      return;
    }
    const requestId = ++requestRef.current;
    setLoading(true);
    setFailed(false);
    try {
      const response = await api.fetch.fetchRideAdminOverview(
        serviceDate ? { service_date: serviceDate } : undefined
      );
      if (requestId !== requestRef.current) return;
      const data = response.data ?? null;
      setOverview(data);
      if (typeof data?.stats?.open_reports === "number") {
        setOpenReports(data.stats.open_reports);
      }
    } catch {
      if (requestId === requestRef.current) setFailed(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [serviceDate, canViewOverview]);

  useEffect(() => {
    load();
  }, [load]);

  const selectTab = useCallback(
    (param: RidesTab) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", param);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleOpenReports = useCallback(
    (count: number) => setOpenReports(count),
    []
  );

  const labelFor = (param: RidesTab) => {
    const tab = TABS.find((entry) => entry.param === param) ?? TABS[0];
    return param === "reports" && openReports
      ? `${tab.label} (${openReports})`
      : tab.label;
  };
  const labels = tabs.map((tab) => labelFor(tab.param));
  const activeLabel = labelFor(activeTab);

  const dates = overview?.service_dates?.length
    ? overview.service_dates
    : overview
      ? [overview.service_date]
      : [];
  const selectedDate = serviceDate || overview?.service_date || "";

  const exportCsv = () => {
    if (!overview) return;
    const rows: Array<Array<string | number | null>> = [
      [
        "Event",
        "Event starts",
        "Driver",
        "Phone",
        "Area",
        "Leaves",
        "Status",
        "Seats",
        "Car",
        "Passenger",
        "Passenger phone",
        "Pickup",
        "Pickup time",
        "Request status",
      ],
    ];
    overview.offers.forEach((offer) => {
      const base = [
        offer.event?.name ?? "",
        offer.event?.start_time ? clockLabel(offer.event.start_time) : "",
        offer.driver.name,
        offer.driver.phone,
        offer.area.name,
        clockLabel(offer.depart_time),
        offer.status,
        offer.seats_total,
        offer.car_details,
      ];
      if (!offer.requests.length) rows.push([...base, "", "", "", "", ""]);
      offer.requests.forEach((request) =>
        rows.push([
          ...base,
          request.passenger.name,
          request.passenger.phone,
          request.pickup_point.name,
          clockLabel(request.pickup_time),
          request.status,
        ])
      );
    });
    downloadCsv(`rides-${overview.service_date}.csv`, rows);
  };

  return (
    <PageOutline>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold leading-8 text-primary tablet:text-2xl">
            Ride to church
          </h1>
          <p className="text-base text-primaryGray">
            Who’s driving whom to each service and programme, safety reports,
            and the places members choose from.
          </p>
        </div>
        {canViewOverview ? (
        <div className="flex w-full flex-wrap gap-2 tablet:w-auto">
          <select
            aria-label="Service date"
            className={`${selectClass} min-w-0 flex-1 tablet:w-auto tablet:flex-none`}
            value={selectedDate}
            disabled={!overview}
            onChange={(event) => setServiceDate(event.target.value)}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {serviceDateLabel(date)}
                {date === overview?.current_service_date ? " (next event)" : ""}
              </option>
            ))}
          </select>
          {canExportRoster ? (
            <button
              type="button"
              onClick={exportCsv}
              disabled={!overview || !overview.offers.length}
              className={btnSecondary}
            >
              Export CSV
            </button>
          ) : null}
        </div>
        ) : null}
      </div>

      <div className="mb-4">
        <TabSelection
          tabs={labels}
          selectedTab={activeLabel}
          onTabSelect={(label) => {
            const index = labels.indexOf(label);
            if (index >= 0) selectTab(tabs[index].param);
          }}
        />
      </div>

      <div
        role="tabpanel"
        id={`panel-${tabDomId(activeLabel)}`}
        aria-labelledby={`tab-${tabDomId(activeLabel)}`}
      >
        {activeTab === "rides" ? (
          <RideOverviewPanel
            overview={overview}
            loading={loading}
            failed={failed}
            onRetry={load}
            onShowReports={canSeeReports ? () => selectTab("reports") : undefined}
            canCancel={canCancelRides}
          />
        ) : activeTab === "reports" ? (
          <RideReportsPanel
            openCount={openReports}
            onOpenReports={handleOpenReports}
          />
        ) : activeTab === "blocks" ? (
          <RideBlocksPanel canLift={canLiftBlocks} />
        ) : (
          <RidePlacesPanel view={placesView} onViewChange={setPlacesView} />
        )}
      </div>
    </PageOutline>
  );
};

export default RidesManager;
