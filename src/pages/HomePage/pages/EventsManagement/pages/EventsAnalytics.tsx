import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import { EventResponseType } from "@/utils/api/events/interfaces";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { eventsContract } from "../../Analytics/contracts";
import { ensureAnalyticsChartsRegistered } from "../../Analytics/chartSetup";
import { AnalyticsContractsPanel } from "../../Analytics/components/AnalyticsContractsPanel";
import { AnalyticsDateFilters } from "../../Analytics/components/AnalyticsDateFilters";
import { AnalyticsStatCards } from "../../Analytics/components/AnalyticsStatCards";
import { AnalyticsFilters } from "../../Analytics/types";
import {
  buildSeries,
  createDefaultAnalyticsFilters,
  isWithinRange,
  numberFormatter,
  toDateTime,
  toPercent,
} from "../../Analytics/utils";

ensureAnalyticsChartsRegistered();

type AttendanceRecord = Record<string, unknown>;

const safeString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const attendanceTotal = (record: AttendanceRecord) => {
  return [
    Number(record.adultMale ?? record.adult_male ?? 0),
    Number(record.adultFemale ?? record.adult_female ?? 0),
    Number(record.childrenMale ?? record.children_male ?? 0),
    Number(record.childrenFemale ?? record.children_female ?? 0),
    Number(record.youthMale ?? record.youth_male ?? 0),
    Number(record.youthFemale ?? record.youth_female ?? 0),
  ].reduce((acc, item) => (Number.isFinite(item) ? acc + item : acc), 0);
};

export const EventsAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  const { data: eventsResponse, loading, error } = useFetch(api.fetch.fetchEvents, {
    page: 1,
    take: 5000,
  });

  const { data: attendanceResponse } = useFetch(api.fetch.fetchChurchAttendance);

  const events = useMemo(() => {
    if (!Array.isArray(eventsResponse?.data)) return [];
    return eventsResponse.data as EventResponseType[];
  }, [eventsResponse]);

  const attendance = useMemo(() => {
    if (!Array.isArray(attendanceResponse?.data)) return [];
    return attendanceResponse.data as AttendanceRecord[];
  }, [attendanceResponse]);

  const eventTypeOptions = useMemo(() => {
    return Array.from(new Set(events.map((event) => safeString(event.event_type)).filter(Boolean))).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (!isWithinRange(event.start_date, filters.dateRange)) return false;
      if (eventTypeFilter !== "all" && safeString(event.event_type) !== eventTypeFilter) {
        return false;
      }
      return true;
    });
  }, [events, eventTypeFilter, filters.dateRange]);

  const eventTrend = useMemo(
    () =>
      buildSeries(
        filteredEvents,
        (event) => event.start_date,
        () => 1,
        filters.groupBy,
        filters.dateRange
      ),
    [filteredEvents, filters.groupBy, filters.dateRange]
  );

  const eventTypeBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    filteredEvents.forEach((event) => {
      const type = safeString(event.event_type || "UNKNOWN");
      map.set(type, (map.get(type) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredEvents]);

  const statusSplit = useMemo(() => {
    const now = new Date();

    return filteredEvents.reduce(
      (acc, event) => {
        const start = toDateTime(event.start_date)?.toJSDate();
        const end = toDateTime(event.end_date || event.start_date)?.toJSDate();

        if (!start || !end) {
          acc.unknown += 1;
          return acc;
        }

        if (start > now) acc.upcoming += 1;
        else if (start <= now && end >= now) acc.active += 1;
        else acc.ended += 1;

        return acc;
      },
      { upcoming: 0, active: 0, ended: 0, unknown: 0 }
    );
  }, [filteredEvents]);

  const attendanceByEvent = useMemo(() => {
    const totals = new Map<string, number>();

    attendance.forEach((record) => {
      if (!isWithinRange(record.date, filters.dateRange)) return;
      const key = safeString(record.event_name || record.eventName || record.eventId || record.event_id);
      if (!key) return;

      totals.set(key, (totals.get(key) ?? 0) + attendanceTotal(record));
    });

    return Array.from(totals.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [attendance, filters.dateRange]);

  const totalAttendance = useMemo(
    () => attendanceByEvent.reduce((acc, item) => acc + item.value, 0),
    [attendanceByEvent]
  );

  const registrationAttendanceRate = useMemo(() => {
    const denominator = filteredEvents.length * 100;
    if (!denominator) return 0;
    return toPercent(totalAttendance, denominator);
  }, [filteredEvents.length, totalAttendance]);

  const statItems = useMemo(
    () => [
      {
        label: "Events in Range",
        value: numberFormatter.format(filteredEvents.length),
      },
      {
        label: "Upcoming Events",
        value: numberFormatter.format(statusSplit.upcoming),
      },
      {
        label: "Active Events",
        value: numberFormatter.format(statusSplit.active),
      },
      {
        label: "Registration→Attendance (proxy)",
        value: `${registrationAttendanceRate.toFixed(1)}%`,
        hint: "V1 proxy from church attendance totals",
      },
    ],
    [filteredEvents.length, registrationAttendanceRate, statusSplit.active, statusSplit.upcoming]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setEventTypeFilter("all");
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Events Analytics"
          subtitle="Portfolio health, type distribution, and attendance performance"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          extra={
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Event type</label>
              <select
                className="h-10 border rounded px-3 w-full"
                value={eventTypeFilter}
                onChange={(event) => setEventTypeFilter(event.target.value)}
              >
                <option value="all">All event types</option>
                {eventTypeOptions.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Events Trend</h3>
            <div className="h-72 mt-3">
              <Line
                data={{
                  labels: eventTrend.labels,
                  datasets: [
                    {
                      label: "Events",
                      data: eventTrend.values,
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
            <h3 className="font-semibold text-primary">Upcoming/Active/Ended</h3>
            <div className="h-72 mt-3">
              <Doughnut
                data={{
                  labels: ["Upcoming", "Active", "Ended", "Unknown"],
                  datasets: [
                    {
                      data: [
                        statusSplit.upcoming,
                        statusSplit.active,
                        statusSplit.ended,
                        statusSplit.unknown,
                      ],
                      backgroundColor: ["#0EA5E9", "#16A34A", "#64748B", "#CBD5E1"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Event Type Mix</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: eventTypeBreakdown.map((item) => item.label),
                  datasets: [
                    {
                      label: "Events",
                      data: eventTypeBreakdown.map((item) => item.value),
                      backgroundColor: "#7C3AED",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Top Attendance by Event (V1)</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: attendanceByEvent.map((item) => item.label),
                  datasets: [
                    {
                      label: "Attendance",
                      data: attendanceByEvent.map((item) => item.value),
                      backgroundColor: "#2563EB",
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <AnalyticsContractsPanel contract={eventsContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load event analytics datasets.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">Loading events analytics...</div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default EventsAnalytics;
