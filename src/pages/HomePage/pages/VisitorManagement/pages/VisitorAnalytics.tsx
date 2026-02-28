import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { VisitorType } from "@/utils/api/visitors/interfaces";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { visitorsContract } from "../../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../../Analytics/types";
import {
  buildSeries,
  createDefaultAnalyticsFilters,
  getEarliestIsoDate,
  isWithinRange,
  numberFormatter,
  resolveFiltersDateRange,
  toPercent,
} from "../../Analytics/utils";

ensureAnalyticsChartsRegistered();

type FollowUpRecord = {
  status?: string;
  assignedTo?: string;
} & Record<string, unknown>;

export const VisitorAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );
  const [eventFilter, setEventFilter] = useState("all");
  const [referralFilter, setReferralFilter] = useState("all");

  const { data: visitorsResponse, loading, error } = useFetch(api.fetch.fetchAllVisitors, {
   
    limit: 5000,
  });
  const { data: followUpsResponse } = useFetch(api.fetch.fetchAllFollowUps);

  const visitors = useMemo(() => {
    if (!Array.isArray(visitorsResponse?.data)) return [];
    return visitorsResponse.data as VisitorType[];
  }, [visitorsResponse]);

  const followUps = useMemo(() => {
    if (!Array.isArray(followUpsResponse?.data)) return [];
    return followUpsResponse.data as FollowUpRecord[];
  }, [followUpsResponse]);

  const eventOptions = useMemo(() => {
    return Array.from(new Set(visitors.map((visitor) => visitor.eventName).filter(Boolean))).sort();
  }, [visitors]);

  const referralOptions = useMemo(() => {
    return Array.from(new Set(visitors.map((visitor) => visitor.howHeard).filter(Boolean))).sort();
  }, [visitors]);

  const cumulativeFrom = useMemo(
    () =>
      getEarliestIsoDate(
        visitors.map((visitor) => (visitor as Record<string, unknown>).createdAt)
      ),
    [visitors]
  );

  const effectiveDateRange = useMemo(
    () => resolveFiltersDateRange(filters, cumulativeFrom),
    [cumulativeFrom, filters]
  );

  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      if (
        !isWithinRange(
          (visitor as Record<string, unknown>).createdAt,
          effectiveDateRange
        )
      ) {
        return false;
      }

      if (eventFilter !== "all" && visitor.eventName !== eventFilter) return false;
      if (referralFilter !== "all" && visitor.howHeard !== referralFilter) return false;

      return true;
    });
  }, [effectiveDateRange, eventFilter, referralFilter, visitors]);

  const newVisitorsSeries = useMemo(
    () =>
      buildSeries(
        filteredVisitors,
        (visitor) => (visitor as Record<string, unknown>).createdAt,
        () => 1,
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredVisitors, filters.groupBy]
  );

  const repeatVisitorCount = useMemo(
    () => filteredVisitors.filter((visitor) => Number(visitor.visitCount || 0) > 1).length,
    [filteredVisitors]
  );

  const conversionCount = useMemo(
    () => filteredVisitors.filter((visitor) => Boolean(visitor.is_member)).length,
    [filteredVisitors]
  );

  const sourceBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    filteredVisitors.forEach((visitor) => {
      const source = visitor.howHeard || "Unknown";
      map.set(source, (map.get(source) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredVisitors]);

  const followUpBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    followUps.forEach((followUp) => {
      const status = String(followUp.status || "unknown").toLowerCase();
      map.set(status, (map.get(status) ?? 0) + 1);
    });

    if (!map.size) {
      filteredVisitors.forEach((visitor) => {
        const status = String(visitor.followUp || "unknown").toLowerCase();
        map.set(status, (map.get(status) ?? 0) + 1);
      });
    }

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredVisitors, followUps]);

  const statItems = useMemo(
    () => [
      {
        label: "Total Visitors",
        value: numberFormatter.format(filteredVisitors.length),
      },
      {
        label: "Repeat Visitor Rate",
        value: `${toPercent(repeatVisitorCount, filteredVisitors.length || 1).toFixed(1)}%`,
        hint: `${numberFormatter.format(repeatVisitorCount)} repeat visitors`,
      },
      {
        label: "Visitor→Member Conversion",
        value: `${toPercent(conversionCount, filteredVisitors.length || 1).toFixed(1)}%`,
        hint: `${numberFormatter.format(conversionCount)} converted visitors`,
      },
      {
        label: "Follow-up Records",
        value: numberFormatter.format(followUps.length || filteredVisitors.length),
      },
    ],
    [conversionCount, filteredVisitors.length, followUps.length, repeatVisitorCount]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setEventFilter("all");
    setReferralFilter("all");
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Visitor Analytics"
          subtitle="Track acquisition, engagement, follow-up, and conversion quality"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          cumulativeFrom={cumulativeFrom}
          extra={
            <>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Event</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={eventFilter}
                  onChange={(event) => setEventFilter(event.target.value)}
                >
                  <option value="all">All events</option>
                  {eventOptions.map((eventName) => (
                    <option key={eventName} value={eventName}>
                      {eventName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-600">Referral source</label>
                <select
                  className="h-10 border rounded px-3 w-full"
                  value={referralFilter}
                  onChange={(event) => setReferralFilter(event.target.value)}
                >
                  <option value="all">All referrals</option>
                  {referralOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">New Visitors Trend</h3>
            <p className="text-xs text-gray-600 mb-3">New visitor volume over time.</p>
            <div className="h-72">
              <Line
                data={{
                  labels: newVisitorsSeries.labels,
                  datasets: [
                    {
                      label: "New visitors",
                      data: newVisitorsSeries.values,
                      borderColor: "#0EA5E9",
                      backgroundColor: "rgba(14, 165, 233, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Follow-up Status Mix</h3>
            <p className="text-xs text-gray-600 mb-3">Actionability and pastoral follow-through.</p>
            <div className="h-72">
              <Doughnut
                data={{
                  labels: followUpBreakdown.map((item) => item.label),
                  datasets: [
                    {
                      data: followUpBreakdown.map((item) => item.value),
                      backgroundColor: ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#6B7280"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Top Visitor Sources</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: sourceBreakdown.map((item) => item.label),
                  datasets: [
                    {
                      label: "Visitors",
                      data: sourceBreakdown.map((item) => item.value),
                      backgroundColor: "#2563EB",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <AnalyticsContractsPanel contract={visitorsContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load visitor analytics datasets.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">Loading visitor analytics...</div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default VisitorAnalytics;
