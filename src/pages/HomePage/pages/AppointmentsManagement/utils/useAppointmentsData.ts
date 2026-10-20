import { useCallback, useEffect, useMemo, useState } from "react";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import type { AppointmentActionPayload } from "@/utils/api/appointment/interfaces";

import {
  type ApptBooking,
  type ApptStaff,
  normalizeBooking,
  normalizeSettings,
  normalizeStaff,
} from "./appointmentModel";

/** Re-renders every minute so waiting times and deadlines stay current. */
export const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};

/**
 * Everything the Appointments pages read: bookings, people and their
 * schedules, and the booking rules. All branch-scoped through useFetch.
 */
export const useAppointmentsData = ({ withBookings = true }: { withBookings?: boolean } = {}) => {
  const { canManage } = useAccessControl();
  const isAdmin = canManage("Appointments");
  const now = useNow();

  const bookingsQuery = useFetch(api.fetch.fetchAppointmentBookings, undefined, !withBookings);
  const staffQuery = useFetch(api.fetch.fetchStaffAvailability, undefined, false, { silent: true });
  const settingsQuery = useFetch(api.fetch.fetchAppointmentSettings, undefined, false, { silent: true });

  const bookings = useMemo<ApptBooking[]>(() => {
    const raw = bookingsQuery.data?.data;
    return Array.isArray(raw)
      ? raw.map(normalizeBooking).filter((b): b is ApptBooking => b !== null)
      : [];
  }, [bookingsQuery.data]);

  const staffFromSchedules = useMemo<ApptStaff[]>(() => {
    const raw = staffQuery.data?.data;
    return Array.isArray(raw)
      ? raw.map(normalizeStaff).filter((s): s is ApptStaff => s !== null)
      : [];
  }, [staffQuery.data]);

  // Fill in roles from bookings when the availability payload has none.
  const staff = useMemo(
    () =>
      staffFromSchedules
        .map((person) => {
          if (person.role) return person;
          const role = bookings.find((b) => b.attendeeId === person.id && b.attendeeRole)?.attendeeRole;
          return role ? { ...person, role } : person;
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [staffFromSchedules, bookings]
  );

  const settings = useMemo(() => normalizeSettings(settingsQuery.data?.data), [settingsQuery.data]);

  const staffById = useMemo(() => {
    const map: Record<string, ApptStaff> = {};
    staff.forEach((person) => {
      map[person.id] = person;
    });
    return map;
  }, [staff]);

  /** Person record for a booking, falling back to what the booking itself knows. */
  const personOf = useCallback(
    (booking: ApptBooking) =>
      staffById[booking.attendeeId] ?? {
        id: booking.attendeeId,
        name: booking.attendeeName || "Unassigned",
        role: booking.attendeeRole,
        windows: {},
        sessions: {},
        duration: 30,
        buffer: 0,
        max: 1,
        paused: false,
        timeOff: [],
      },
    [staffById]
  );

  const { refetch: refetchBookings } = bookingsQuery;
  const { refetch: refetchStaff } = staffQuery;
  const { refetch: refetchSettings } = settingsQuery;

  const act = useCallback(
    async (booking: ApptBooking, payload: AppointmentActionPayload) => {
      await api.post.appointmentBookingAction(booking.id, payload);
      await refetchBookings();
    },
    [refetchBookings]
  );

  return {
    isAdmin,
    now,
    bookings,
    staff,
    staffById,
    personOf,
    settings,
    loading: bookingsQuery.loading || staffQuery.loading,
    bookingsLoaded: bookingsQuery.data !== null,
    staffLoaded: staffQuery.data !== null,
    settingsMissing: !!settingsQuery.error,
    act,
    refetchBookings,
    refetchStaff,
    refetchSettings,
  };
};

export type AppointmentsData = ReturnType<typeof useAppointmentsData>;
