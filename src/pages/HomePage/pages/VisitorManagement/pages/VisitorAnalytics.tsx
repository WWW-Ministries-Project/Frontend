import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";

import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { ensureAnalyticsChartsRegistered } from "@/pages/HomePage/pages/Analytics/chartSetup";
import {
  buildSeries,
  createDefaultAnalyticsFilters,
  getEarliestIsoDate,
  isWithinRange,
  resolveFiltersDateRange,
} from "@/pages/HomePage/pages/Analytics/utils";
import {
  ChartCard,
  HorizontalBarList,
} from "@/pages/HomePage/pages/MembershipManagement/components/analytics/AnalyticsCharts";
import { AnalyticsPeriodFields } from "@/pages/HomePage/pages/MembershipManagement/components/analytics/AnalyticsFilterPanel";
import {
  countActivePeriodFilters,
  describeAnalyticsRange,
} from "@/pages/HomePage/pages/MembershipManagement/components/analytics/analyticsFilterState";
import {
  BAR_PRIMARY,
  buildBars,
  buildFunnel,
} from "@/pages/HomePage/pages/MembershipManagement/components/analytics/chartBuilders";
import { pct } from "@/pages/HomePage/pages/MembershipManagement/components/analytics/memberAnalyticsData";
import {
  Field,
  FilterPanel,
  FilterToggleButton,
  KpiCard,
  PageHeading,
  SelectInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { isCompletedStatus } from "@/utils/api/visitors/visitorActions";
import { relativePath } from "@/utils/const";

import {
  HEARD_OPTIONS,
  heardLabel,
  useVisitorRecords,
  VisitorRecord,
  visitorsPath,
} from "../utils/visitorHelpers";

ensureAnalyticsChartsRegistered();

const countBy = (records: VisitorRecord[], key: (record: VisitorRecord) => string) => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const label = key(record) || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
};

const createDefaultFilters = () => ({
  period: createDefaultAnalyticsFilters(),
  event: "",
  referral: "",
});

export const VisitorAnalytics = () => {
  const [filters, setFilters] = useState(createDefaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const { records, loading, error } = useVisitorRecords();

  const earliest = useMemo(
    () => getEarliestIsoDate(records.map((record) => record.firstVisit)),
    [records]
  );
  const range = useMemo(() => {
    const resolved = resolveFiltersDateRange(filters.period, earliest);
    return resolved.from > resolved.to ? { from: resolved.to, to: resolved.from } : resolved;
  }, [earliest, filters.period]);

  const eventOptions = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.eventName).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [records]
  );

  const inView = useMemo(
    () =>
      records.filter(
        (record) =>
          isWithinRange(record.firstVisit, range) &&
          (!filters.event || record.eventName === filters.event) &&
          (!filters.referral || record.howHeard === filters.referral)
      ),
    [filters.event, filters.referral, range, records]
  );

  const total = inView.length;
  const repeat = inView.filter((record) => record.visitCount > 1).length;
  const converted = inView.filter((record) => record.stage === "member").length;
  const followUps = inView.flatMap((record) => record.followUps);
  const pendingFollowUps = followUps.filter((row) => !isCompletedStatus(row.status)).length;

  // Kept as before the redesign: line chart bucketed by the period's group-by.
  const trend = useMemo(
    () =>
      buildSeries(
        inView,
        (record) => record.visitor.visitDate,
        () => 1,
        filters.period.groupBy,
        range
      ),
    [filters.period.groupBy, inView, range]
  );

  const notMember = inView.filter((record) => record.stage !== "member");
  const statusMix = buildBars(
    [
      ["Followed up", notMember.filter((record) => record.stage === "done").length],
      [
        "Follow-up pending",
        notMember.filter((record) => record.stage === "need" && record.followUps.length > 0)
          .length,
      ],
      ["Not contacted yet", notMember.filter((record) => record.followUps.length === 0).length],
      ["Became members", converted],
    ],
    total,
    BAR_PRIMARY
  );
  const sources = buildBars(countBy(inView, (record) => heardLabel(record.howHeard)).slice(0, 8), total);
  const byEvent = buildBars(countBy(inView, (record) => record.eventName || "No event"), total);
  const funnel = buildFunnel([
    ["Visitors", total],
    [
      "Interested in membership",
      inView.filter((record) => record.visitor.membershipWish || record.stage === "member").length,
    ],
    ["Converted to members", converted],
  ]);

  const filterCount =
    countActivePeriodFilters(filters.period) +
    [filters.event, filters.referral].filter(Boolean).length;

  return (
    <PageOutline
      crumbs={[
        { label: "Home", link: relativePath.home.main },
        { label: "Visitors", link: visitorsPath },
        { label: "Analytics" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Visitor Analytics"
          subtitle="Track acquisition, engagement, follow-up and conversion."
          actions={
            <FilterToggleButton
              open={showFilters}
              count={filterCount}
              onClick={() => setShowFilters((open) => !open)}
            />
          }
        />

        {showFilters && (
          <FilterPanel
            title="Refine analytics"
            helper="Choose the period and which visitors to include."
            onReset={() => setFilters(createDefaultFilters())}
          >
            <AnalyticsPeriodFields
              period={filters.period}
              onChange={(period) => setFilters({ ...filters, period })}
              effectiveRange={range}
            />
            <Field label="Event">
              <SelectInput
                options={[
                  { value: "", label: "All events" },
                  ...eventOptions.map((name) => ({ value: name, label: name })),
                ]}
                value={filters.event}
                onChange={(event) => setFilters({ ...filters, event: event.target.value })}
              />
            </Field>
            <Field label="Referral source">
              <SelectInput
                options={[{ value: "", label: "All referrals" }, ...HEARD_OPTIONS]}
                value={filters.referral}
                onChange={(event) => setFilters({ ...filters, referral: event.target.value })}
              />
            </Field>
          </FilterPanel>
        )}

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold leading-7 text-gray-800">Visitor overview</h2>
          <p className="text-sm text-gray-600">
            New visitors, follow-up and conversion · {total}{" "}
            {total === 1 ? "visitor" : "visitors"} in this view
          </p>
          <p className="text-xs text-gray-500">{describeAnalyticsRange(filters.period, range)}</p>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Failed to load visitors. The figures below may be incomplete.
          </div>
        ) : null}
        {loading ? (
          <p role="status" className="text-sm text-gray-500">
            Loading visitor analytics…
          </p>
        ) : null}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
          <KpiCard label="Total visitors" value={total} sub="First visited in this period" />
          <KpiCard
            label="Repeat visitor rate"
            value={pct(repeat, total)}
            sub={`${repeat} repeat ${repeat === 1 ? "visitor" : "visitors"}`}
          />
          <KpiCard
            label="Visitor → member conversion"
            value={pct(converted, total)}
            sub={`${converted} converted ${converted === 1 ? "visitor" : "visitors"}`}
          />
          <KpiCard
            label="Follow-up records"
            value={followUps.length}
            sub={`${pendingFollowUps} still pending`}
          />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-4">
          <ChartCard fullWidth title="New visitors trend" sub="New visitor volume over time.">
            <div className="h-72">
              <Line
                data={{
                  labels: trend.labels,
                  datasets: [
                    {
                      label: "New visitors",
                      data: trend.values,
                      borderColor: "#0EA5E9",
                      backgroundColor: "rgba(14, 165, 233, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </ChartCard>
          <ChartCard title="Follow-up status mix" sub="Where each visitor stands">
            <HorizontalBarList items={total ? statusMix : []} />
          </ChartCard>
          <ChartCard title="Top visitor sources" sub="How visitors heard about us">
            <HorizontalBarList items={sources} />
          </ChartCard>
          <ChartCard title="Visitors by first event" sub="The event they first attended">
            <HorizontalBarList items={byEvent} />
          </ChartCard>
          <ChartCard
            title="Visitor to member"
            sub={
              total
                ? `Visitor-to-member conversion is ${pct(converted, total)} for this period`
                : "No visitors first seen in this period"
            }
          >
            <HorizontalBarList items={total ? funnel : []} />
          </ChartCard>
        </div>
      </div>
    </PageOutline>
  );
};

export default VisitorAnalytics;
