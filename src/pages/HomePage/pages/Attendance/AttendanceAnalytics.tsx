import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { AnalyticsFilters } from "@/pages/HomePage/pages/Analytics/types";
import {
  createDefaultAnalyticsFilters,
  getCurrentYear,
  resolveFiltersDateRange,
} from "@/pages/HomePage/pages/Analytics/utils";
import { AnalyticsPeriodFields } from "@/pages/HomePage/pages/MembershipManagement/components/analytics/AnalyticsFilterPanel";
import {
  Field,
  FilterPanel,
  FilterToggleButton,
  PageHeading,
  SelectInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { notify } from "@/components/feedback";

import {
  AnalyticsCard,
  BarRows,
  CountTabs,
  InsightList,
  LinkList,
  MiniTable,
  StackColumns,
  StatGrid,
  StatTile,
} from "./Components/attendanceUi";
import { ANALYTICS_SECTIONS, buildSection, Chart, comparisonFor } from "./utils/analyticsSections";
import {
  ATTENDANCE_PATHS,
  downloadCsv,
  fmtDate,
  groupKeyOf,
  todayKey,
} from "./utils/attendanceModel";
import {
  useAttendanceRecords,
  useCheckIns,
  useEventOccurrences,
  useTimingRules,
} from "./utils/useAttendanceData";

const createDefaultPeriod = (): AnalyticsFilters => ({
  ...createDefaultAnalyticsFilters(),
  analysisMode: "point_in_time",
});

const ChartBody = ({ chart }: { chart: Chart }) => {
  switch (chart.kind) {
    case "stack":
      return <StackColumns items={chart.items} />;
    case "bar":
      return <BarRows items={chart.items} />;
    case "table":
      return (
        <MiniTable head={chart.head} cols={chart.cols} rows={chart.rows} minWidth={chart.minWidth} emptyText={chart.emptyText} />
      );
    case "insight":
      return <InsightList items={chart.items} emptyText={chart.emptyText} />;
    case "list":
      return <LinkList items={chart.items} emptyText={chart.emptyText} />;
  }
};

export const AttendanceAnalytics = () => {
  const navigate = useNavigate();
  const canExport = useAccessControl().hasAction("Church_Attendance.export");
  const today = todayKey();
  const [showFilters, setShowFilters] = useState(false);
  const [period, setPeriod] = useState(createDefaultPeriod);
  const [service, setService] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState(0);

  const { records } = useAttendanceRecords();
  const earliest = useMemo(
    () => records.reduce((min, record) => (record.date < min ? record.date : min), `${getCurrentYear()}-01-01`),
    [records]
  );

  const periodType = period.periodType ?? "year";
  const isRange = periodType === "specific_date_range";
  const cumulative = !isRange && period.analysisMode === "cumulative";
  const range = useMemo(() => {
    const resolved = resolveFiltersDateRange(period, earliest);
    return resolved.from > resolved.to ? { from: resolved.to, to: resolved.from } : resolved;
  }, [period, earliest]);
  const rFrom = range.from;
  const rTo = range.to < today ? range.to : today;
  const future = rFrom > today;
  const compare = useMemo(
    () => (cumulative || future ? null : comparisonFor(periodType, rFrom, rTo, earliest)),
    [cumulative, future, periodType, rFrom, rTo, earliest]
  );

  const loadFrom = compare && compare.from < rFrom ? compare.from : rFrom;
  const years = useMemo(() => {
    const list: number[] = [];
    for (let year = Number(loadFrom.slice(0, 4)); year <= Number(rTo.slice(0, 4)); year += 1) list.push(year);
    return list;
  }, [loadFrom, rTo]);
  const { events, byId } = useEventOccurrences(years);
  const { checkIns } = useCheckIns({ fromDate: loadFrom, toDate: rTo }, future);
  const rules = useTimingRules();

  const serviceOptions = useMemo(() => {
    const names = new Map<string, string>();
    records.forEach((record) => {
      const name = byId.get(record.eventId)?.name || record.eventName;
      if (name) names.set(groupKeyOf(name), name);
    });
    events.forEach((occ) => {
      if (occ.type === "SERVICE") names.set(occ.groupKey, occ.name);
    });
    return [...names.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [records, events, byId]);
  const departments = useMemo(() => [...new Set(checkIns.map((c) => c.department))].sort(), [checkIns]);

  const result = useMemo(
    () =>
      buildSection({
        section,
        rFrom,
        rTo,
        compare,
        cumulative,
        future,
        today,
        service,
        department,
        records,
        events,
        byId,
        checkIns: future ? [] : checkIns,
        rules,
        onSection: setSection,
        onRecord: (occ) => navigate(`${ATTENDANCE_PATHS.church}?record=${occ.id}`),
        onWorker: (name) => navigate(`${ATTENDANCE_PATHS.event}?q=${encodeURIComponent(name)}`),
      }),
    [section, rFrom, rTo, compare, cumulative, future, today, service, department, records, events, byId, checkIns, rules, navigate]
  );

  const [title, description] = ANALYTICS_SECTIONS[section];
  const filterCount = [
    periodType !== "year",
    !isRange && period.analysisMode !== "point_in_time",
    !isRange && (period.selectedYear ?? String(getCurrentYear())) !== String(getCurrentYear()),
    service,
    department,
  ].filter(Boolean).length;

  const note = [
    future
      ? "This period has not started yet."
      : isRange
        ? "Specific date range uses only the selected From and To dates."
        : cumulative
          ? `Cumulative mode runs from the first record (${fmtDate(earliest)}) to ${fmtDate(rTo)}.`
          : `Point in time covers ${fmtDate(rFrom)} to ${fmtDate(rTo)}${rTo < range.to ? " (to date)" : ""}.`,
    compare ? `Compared with the ${compare.label}, ${fmtDate(compare.from)} to ${fmtDate(compare.to)}.` : "",
    section >= 4
      ? `Timing rules from Settings → Attendance: early is ${rules.earlyMinutes}+ min before the start, late is ${rules.lateMinutes}+ min after.`
      : "",
    department && section < 4 ? "Department filter applies to Punctuality and Worker participation only." : "",
  ]
    .filter(Boolean)
    .join(" ");

  const exportCsv = () => {
    const toast = notify.loading({ title: `Exporting ${title} analytics…` });
    try {
      const rows: (string | number)[][] = [
        ["Section", title],
        ["Period", `${fmtDate(rFrom)} to ${fmtDate(rTo)}`],
        [],
        ["Metric", "Value", "Note"],
        ...result.kpis.map((kpi) => [kpi.label, kpi.value, kpi.sub]),
      ];
      result.charts.forEach((chart) => {
        rows.push([], [chart.title]);
        if (chart.kind === "table") {
          rows.push(chart.head);
          chart.rows.forEach((row) => rows.push(row.map((cell) => ("pill" in cell ? cell.pill : cell.text))));
        } else if (chart.kind === "bar") chart.items.forEach((item) => rows.push([item.label, item.value]));
        else if (chart.kind === "stack") chart.items.forEach((item) => rows.push([item.label, item.tip]));
        else if (chart.kind === "insight") chart.items.forEach((item) => rows.push([item.title, item.text]));
        else chart.items.forEach((item) => rows.push([item.label, item.sub]));
      });
      const filename = `attendance-analytics-${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
      downloadCsv(filename, rows);
      toast.success({ title: "Export ready", message: filename });
    } catch {
      toast.error({ title: "Export didn't finish", message: "Nothing was downloaded. Try again.", retry: exportCsv });
    }
  };

  return (
    <PageOutline crumbs={[{ label: "Home", link: "/home" }, { label: "Attendance" }, { label: "Analytics" }]}>
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Attendance Analytics"
          subtitle="How many people come, when they arrive, and where the gaps are."
          actions={
            <>
              <FilterToggleButton open={showFilters} count={filterCount} onClick={() => setShowFilters((open) => !open)} />
              {canExport && <UiButton onClick={exportCsv}>Export CSV</UiButton>}
            </>
          }
        />

        {showFilters && (
          <FilterPanel
            title="Refine analytics"
            helper="Choose the period, service and department to analyse."
            onReset={() => {
              setPeriod(createDefaultPeriod());
              setService("");
              setDepartment("");
            }}
            resetDisabled={!filterCount}
          >
            <AnalyticsPeriodFields period={period} onChange={setPeriod} effectiveRange={{ from: rFrom, to: rTo }} />
            <Field label="Service">
              <SelectInput
                value={service}
                onChange={(event) => setService(event.target.value)}
                options={[
                  { value: "", label: "All services" },
                  ...serviceOptions.map(([value, label]) => ({ value, label })),
                  { value: "__special", label: "Programs and special events" },
                ]}
              />
            </Field>
            <Field label="Department">
              <SelectInput
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]}
              />
            </Field>
          </FilterPanel>
        )}

        <CountTabs
          ariaLabel="Analytics sections"
          value={String(section)}
          onChange={(key) => setSection(Number(key))}
          tabs={ANALYTICS_SECTIONS.map(([label], index) => ({
            key: String(index),
            label,
            count: index === 6 && result.unrecordedCount ? result.unrecordedCount : null,
          }))}
        />

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold leading-7 text-gray-800">{title}</h2>
          <p className="text-sm text-gray-600">
            {description} · {result.base}
          </p>
          <p className="text-xs text-gray-500">{note}</p>
        </div>

        <StatGrid>
          {result.kpis.map((kpi) => (
            <StatTile key={kpi.label} label={kpi.label} value={kpi.value} sub={kpi.sub} color={kpi.color} />
          ))}
        </StatGrid>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
          {result.charts.map((chart) => (
            <AnalyticsCard
              key={chart.title}
              title={chart.title}
              sub={chart.sub}
              legend={chart.legend}
              fullWidth={chart.full}
            >
              <ChartBody chart={chart} />
            </AnalyticsCard>
          ))}
        </div>
      </div>
    </PageOutline>
  );
};

export default AttendanceAnalytics;
