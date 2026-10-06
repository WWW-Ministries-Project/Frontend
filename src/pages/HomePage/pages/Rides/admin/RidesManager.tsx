import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import TabSelection from "@/pages/HomePage/Components/reusable/TabSelection";
import { api } from "@/utils/api/apiCalls";
import { RideAreasPanel } from "./RideAreasPanel";
import { RideBlocksPanel } from "./RideBlocksPanel";
import { RideOverviewPanel } from "./RideOverviewPanel";
import { RidePickupPointsPanel } from "./RidePickupPointsPanel";
import { RideReportsPanel } from "./RideReportsPanel";

type RidesTab = "rides" | "reports" | "blocks" | "pickup-points" | "areas";

const TABS: { param: RidesTab; label: string }[] = [
  { param: "rides", label: "Sunday rides" },
  { param: "reports", label: "Safety reports" },
  { param: "blocks", label: "Blocks" },
  { param: "pickup-points", label: "Pickup points" },
  { param: "areas", label: "Areas & routes" },
];

/** Same id scheme TabSelection uses for `tab-…` / `panel-…`. */
const tabDomId = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Admin side of Ride to church, for the safety team and church office:
 * Sunday's rides with everyone on them, safety reports and blocks, and the
 * areas and public pickup points members choose from.
 */
const RidesManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openReports, setOpenReports] = useState<number | null>(null);

  const requested = TABS.find((tab) => tab.param === searchParams.get("tab"));
  const activeTab: RidesTab = requested?.param ?? "rides";

  // The rides and reports panels report the open count themselves; on the
  // other tabs, look it up once so the tab badge is right on arrival.
  useEffect(() => {
    if (activeTab === "rides" || activeTab === "reports") return;
    if (openReports !== null) return;
    let cancelled = false;
    api.fetch
      .fetchRideAdminOverview()
      .then((response) => {
        const count = response.data?.stats?.open_reports;
        if (!cancelled && typeof count === "number") setOpenReports(count);
      })
      .catch(() => {
        // The badge is a nicety; the panels show their own errors.
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, openReports]);

  const labelFor = (param: RidesTab) => {
    const tab = TABS.find((entry) => entry.param === param) ?? TABS[0];
    return param === "reports" && openReports
      ? `${tab.label} (${openReports})`
      : tab.label;
  };
  const labels = TABS.map((tab) => labelFor(tab.param));
  const activeLabel = labelFor(activeTab);

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

  return (
    <PageOutline>
      <HeaderControls
        title="Ride to church"
        subtitle="Sunday rides members share, safety reports, and the areas and pickup points members choose from"
        screenWidth={window.innerWidth}
      />

      <div className="mb-6">
        <TabSelection
          tabs={labels}
          selectedTab={activeLabel}
          onTabSelect={(label) => {
            const index = labels.indexOf(label);
            if (index >= 0) selectTab(TABS[index].param);
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
            onOpenReports={handleOpenReports}
            onShowReports={() => selectTab("reports")}
          />
        ) : activeTab === "reports" ? (
          <RideReportsPanel onOpenReports={handleOpenReports} />
        ) : activeTab === "blocks" ? (
          <RideBlocksPanel />
        ) : activeTab === "pickup-points" ? (
          <RidePickupPointsPanel />
        ) : (
          <RideAreasPanel />
        )}
      </div>
    </PageOutline>
  );
};

export default RidesManager;
