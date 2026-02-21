import { HeaderControls } from "@/components/HeaderControls";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import { Appointment, StaffAvailability } from "@/utils/api/appointment/interfaces";
import { normalizeAppointmentRecord, toStringValue } from "@/utils/api/appointment/bookingUtils";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useMemo, useState } from "react";
import { appointmentsContract } from "../../Analytics/contracts";
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
  toPercent,
} from "../../Analytics/utils";

ensureAnalyticsChartsRegistered();

const countAvailabilitySlots = (availability: StaffAvailability[]) => {
  return availability.reduce((acc, item) => {
    return (
      acc +
      item.timeSlots.reduce((slotAcc, slot) => {
        if (Array.isArray(slot.sessions) && slot.sessions.length > 0) {
          return slotAcc + slot.sessions.length;
        }

        return slotAcc;
      }, 0)
    );
  }, 0);
};

export const AppointmentsAnalytics = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>(
    createDefaultAnalyticsFilters()
  );

  const [staffFilter, setStaffFilter] = useState("all");

  const membersOptions = useStore((state) => state.membersOptions);

  const memberLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  const { data: bookingsResponse, loading, error } = useFetch(
    api.fetch.fetchAppointmentBookings
  );

  const { data: availabilityResponse } = useFetch(api.fetch.fetchStaffAvailability);

  const bookings = useMemo(() => {
    if (!Array.isArray(bookingsResponse?.data)) return [];

    return bookingsResponse.data
      .map((record) => normalizeAppointmentRecord(record, memberLookup))
      .filter((record): record is Appointment => record !== null);
  }, [bookingsResponse, memberLookup]);

  const availability = useMemo(() => {
    if (!Array.isArray(availabilityResponse?.data)) return [];
    return availabilityResponse.data as StaffAvailability[];
  }, [availabilityResponse]);

  const staffOptions = useMemo(() => {
    return Array.from(
      new Set(
        bookings
          .map((booking) => `${booking.staffId}|${booking.staffName || "Unknown"}`)
          .filter(Boolean)
      )
    ).map((row) => {
      const [id, name] = row.split("|");
      return { id, name };
    });
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (!isWithinRange(booking.date, filters.dateRange)) return false;
      if (staffFilter !== "all" && booking.staffId !== staffFilter) return false;
      return true;
    });
  }, [bookings, filters.dateRange, staffFilter]);

  const bookingsTrend = useMemo(
    () =>
      buildSeries(
        filteredBookings,
        (booking) => booking.date,
        () => 1,
        filters.groupBy,
        filters.dateRange
      ),
    [filteredBookings, filters.groupBy, filters.dateRange]
  );

  const statusMix = useMemo(() => {
    const map = new Map<string, number>();

    filteredBookings.forEach((booking) => {
      const status = toStringValue(booking.status || "PENDING").toUpperCase();
      map.set(status, (map.get(status) ?? 0) + 1);
    });

    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredBookings]);

  const confirmedCount = useMemo(
    () =>
      filteredBookings.filter(
        (booking) => toStringValue(booking.status).toUpperCase() === "CONFIRMED"
      ).length,
    [filteredBookings]
  );

  const cancelledCount = useMemo(
    () =>
      filteredBookings.filter(
        (booking) => toStringValue(booking.status).toUpperCase() === "CANCELLED"
      ).length,
    [filteredBookings]
  );

  const slotUtilizationRate = useMemo(() => {
    const availableSlots = countAvailabilitySlots(availability);
    const bookedSlots = filteredBookings.filter(
      (booking) => toStringValue(booking.status).toUpperCase() !== "CANCELLED"
    ).length;

    return {
      availableSlots,
      bookedSlots,
      rate: toPercent(bookedSlots, availableSlots || 1),
    };
  }, [availability, filteredBookings]);

  const statItems = useMemo(
    () => [
      {
        label: "Bookings",
        value: numberFormatter.format(filteredBookings.length),
      },
      {
        label: "Confirmation Rate",
        value: `${toPercent(confirmedCount, filteredBookings.length || 1).toFixed(1)}%`,
      },
      {
        label: "Cancellation Rate",
        value: `${toPercent(cancelledCount, filteredBookings.length || 1).toFixed(1)}%`,
      },
      {
        label: "Slot Utilization",
        value: `${slotUtilizationRate.rate.toFixed(1)}%`,
        hint: `${slotUtilizationRate.bookedSlots}/${slotUtilizationRate.availableSlots} sessions`,
      },
    ],
    [cancelledCount, confirmedCount, filteredBookings.length, slotUtilizationRate]
  );

  const resetFilters = () => {
    setFilters(createDefaultAnalyticsFilters());
    setStaffFilter("all");
  };

  return (
    <PageOutline>
      <div className="space-y-6">
        <HeaderControls
          title="Appointments Analytics"
          subtitle="Demand, status outcomes, and available-slot utilization"
        />

        <AnalyticsDateFilters
          value={filters}
          onChange={setFilters}
          onReset={resetFilters}
          extra={
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Staff</label>
              <select
                className="h-10 border rounded px-3 w-full"
                value={staffFilter}
                onChange={(event) => setStaffFilter(event.target.value)}
              >
                <option value="all">All staff</option>
                {staffOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        <AnalyticsStatCards stats={statItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold text-primary">Bookings Trend</h3>
            <div className="h-72 mt-3">
              <Line
                data={{
                  labels: bookingsTrend.labels,
                  datasets: [
                    {
                      label: "Bookings",
                      data: bookingsTrend.values,
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
            <h3 className="font-semibold text-primary">Status Mix</h3>
            <div className="h-72 mt-3">
              <Doughnut
                data={{
                  labels: statusMix.map((item) => item.label),
                  datasets: [
                    {
                      data: statusMix.map((item) => item.value),
                      backgroundColor: ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#6B7280"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <h3 className="font-semibold text-primary">Slot Capacity vs Booked Sessions</h3>
            <div className="h-64 mt-3">
              <Bar
                data={{
                  labels: ["Available sessions", "Booked sessions"],
                  datasets: [
                    {
                      label: "Sessions",
                      data: [slotUtilizationRate.availableSlots, slotUtilizationRate.bookedSlots],
                      backgroundColor: ["#CBD5E1", "#2563EB"],
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>

        <AnalyticsContractsPanel contract={appointmentsContract} />

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load appointment analytics data.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded border px-4 py-3 text-sm text-gray-600">Loading appointment analytics...</div>
        ) : null}
      </div>
    </PageOutline>
  );
};

export default AppointmentsAnalytics;
