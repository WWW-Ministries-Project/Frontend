import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { attendanceContract } from "../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../Analytics/types";
import {
  buildSeries,
  createDefaultAnalyticsFilters,
  getEarliestIsoDate,
  isWithinRange,
  numberFormatter,
  resolveFiltersDateRange,
  toPercent,
} from "../Analytics/utils";

ensureAnalyticsChartsRegistered();

type AttendanceRecord = Record<string, unknown>;

const readCount = (record: AttendanceRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = Number(record[key] ?? 0);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const getTotals = (record: AttendanceRecord) => {
  const adultMale = readCount(record, "adultMale", "adult_male");
  const adultFemale = readCount(record, "adultFemale", "adult_female");
  const childrenMale = readCount(record, "childrenMale", "children_male");
  const childrenFemale = readCount(record, "childrenFemale", "children_female");
  const youthMale = readCount(record, "youthMale", "youth_male");
  const youthFemale = readCount(record, "youthFemale", "youth_female");

  return {
    adultMale,
    adultFemale,
    childrenMale,
    childrenFemale,
    youthMale,
    youthFemale,
    adults: adultMale + adultFemale,
    children: childrenMale + childrenFemale,
    youth: youthMale + youthFemale,
    male: adultMale + childrenMale + youthMale,
    female: adultFemale + childrenFemale + youthFemale,
    total: adultMale + adultFemale + childrenMale + childrenFemale + youthMale + youthFemale,
    visitingPastors: readCount(record, "visitingPastors", "visiting_pastors"),
  };
};

export const AttendanceAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );

  const [eventFilter, setEventFilter] = useState("all");

  const { data: attendanceResponse, loading, error } = useFetch(api.fetch.fetchChurchAttendance);

  const records = useMemo(() => {
    if (!Array.isArray(attendanceResponse?.data)) return [];
    return attendanceResponse.data as AttendanceRecord[];
  }, [attendanceResponse]);

  const eventOptions = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => String(record.event_name || record.eventName || record.eventId || record.event_id || ""))
          .filter(Boolean)
      )
    ).sort();
  }, [records]);

  const cumulativeFrom = useMemo(
    () => getEarliestIsoDate(records.map((record) => record.date)),
    [records]
  );

  const effectiveDateRange = useMemo(
    () => resolveFiltersDateRange(filters, cumulativeFrom),
    [cumulativeFrom, filters]
  );

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (!isWithinRange(record.date, effectiveDateRange)) return false;

      if (eventFilter !== "all") {
        const eventName = String(record.event_name || record.eventName || record.eventId || record.event_id || "");
        if (eventName !== eventFilter) return false;
      }

      return true;
    });
  }, [effectiveDateRange, eventFilter, records]);

  const attendanceTrend = useMemo(
    () =>
      buildSeries(
        filteredRecords,
        (record) => record.date,
        (record) => getTotals(record).total,
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredRecords, filters.groupBy]
  );

  const visitingPastorsTrend = useMemo(
    () =>
      buildSeries(
        filteredRecords,
        (record) => record.date,
        (record) => getTotals(record).visitingPastors,
        filters.groupBy,
        effectiveDateRange
      ),
    [effectiveDateRange, filteredRecords, filters.groupBy]
  );

  const demographicMix = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        const totals = getTotals(record);
        acc.adults += totals.adults;
        acc.children += totals.children;
        acc.youth += totals.youth;
        acc.male += totals.male;
        acc.female += totals.female;
        acc.total += totals.total;
        return acc;
      },
      {
        adults: 0,
        children: 0,
        youth: 0,
        male: 0,
        female: 0,
        total: 0,
      }
    );
  }, [filteredRecords]);

  const avgAttendancePerEvent = useMemo(() => {
    const eventSet = new Set(
      filteredRecords
        .map((record) => String(record.eventId || record.event_id || record.event_name || ""))
        .filter(Boolean)
    );

    return eventSet.size > 0 ? demographicMix.total / eventSet.size : 0;
  }, [demographicMix.total, filteredRecords]);

  const statItems = useMemo(
    () => [
      {
        label: "Attendance Total",
        value: numberFormatter.format(demographicMix.total),
      },
      {
        label: "Average per Event",
        value: numberFormatter.format(Number(avgAttendancePerEvent.toFixed(0))),
      },
      {
        label: "Male Ratio",
        value: `${toPercent(demographicMix.male, demographicMix.total || 1).toFixed(1)}%`,
      },
      {
        label: "Female Ratio",
        value: `${toPercent(demographicMix.female, demographicMix.total || 1).toFixed(1)}%`,
      },
    ],
    [avgAttendancePerEvent, demographicMix.female, demographicMix.male, demographicMix.total]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setEventFilter("all");
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Attendance Analytics"
          subtitle="Trend, demographic split, service performance, and pastoral presence"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          cumulativeFrom={cumulativeFrom}
          extra={
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
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Total Attendance Trend</h3>
            <div className="h-72 mt-3">
              <Line
                data={{
                  labels: attendanceTrend.labels,
                  datasets: [
                    {
                      label: "Attendance",
                      data: attendanceTrend.values,
                      borderColor: "#2563EB",
                      backgroundColor: "rgba(37, 99, 235, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Adults / Children / Youth</h3>
            <div className="h-72 mt-3">
              <Doughnut
                data={{
                  labels: ["Adults", "Children", "Youth"],
                  datasets: [
                    {
                      data: [demographicMix.adults, demographicMix.children, demographicMix.youth],
                      backgroundColor: ["#2563EB", "#16A34A", "#F97316"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Male vs Female</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: ["Male", "Female"],
                  datasets: [
                    {
                      label: "Attendance",
                      data: [demographicMix.male, demographicMix.female],
                      backgroundColor: ["#2563EB", "#EC4899"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Visiting Pastors Trend</h3>
            <div className="h-64 mt-3">
              <Line
                data={{
                  labels: visitingPastorsTrend.labels,
                  datasets: [
                    {
                      label: "Visiting pastors",
                      data: visitingPastorsTrend.values,
                      borderColor: "#F97316",
                      backgroundColor: "rgba(249, 115, 22, 0.2)",
                      tension: 0.3,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <AnalyticsContractsPanel contract={attendanceContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load attendance analytics data.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">Loading attendance analytics...</div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default AttendanceAnalytics;
