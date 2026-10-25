import { useCallback, useEffect, useMemo, useState } from "react";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { useUserStore } from "@/store/userStore";
import { normalizePermissionPayload, type PermissionMap } from "@/utils/accessControl";
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

/** Appointments actions a role can switch (permissions redesign §7.12). */
export type ApptAction =
  | "respond"
  | "complete"
  | "manage_own_availability"
  | "book_for_others"
  | "cancel_any"
  | "reassign"
  | "send_reminders"
  | "manage_others_availability"
  | "export"
  | "configure"
  | "delete";

/**
 * What the signed-in person may do in Appointments, mirroring the API's
 * appointment-access.ts: the person booked always acts on their own
 * booking; anyone else's needs the action at Manage (or switched on), a
 * whole-branch scope, and the attendee not hidden from their role.
 */
export const useAppointmentAccess = () => {
  const { canManage, hasAction, isExcluded, getScope, scopeFor, accessPermissions } = useAccessControl();
  const myId = useUserStore((state) => state.id);

  return useMemo(() => {
    const stored = normalizePermissionPayload(accessPermissions as PermissionMap);
    const actions = stored.Actions as Record<string, Record<string, boolean>> | undefined;
    // Roles saved before actions existed keep their whole-branch view.
    const scope = actions === undefined && !getScope("Appointments") ? "branch" : scopeFor("Appointments");
    const manager = canManage("Appointments");

    const isMine = (attendeeId?: string | number | null) => !!myId && String(myId) === String(attendeeId ?? "");
    const hidden = (attendeeId?: string | number | null) =>
      !!attendeeId && isExcluded("Appointments", Number(attendeeId));
    const can = (action: ApptAction) => hasAction(`Appointments.${action}`);
    const forOthers = (action: ApptAction, attendeeId?: string | number | null) =>
      can(action) && (manager || actions?.Appointments?.[action] === true) && scope !== "own" && !hidden(attendeeId);

    return {
      myId,
      scope,
      can,
      isMine,
      hidden,
      forOthers,
      /** Own booking, or someone else's with the action. */
      onBooking: (action: ApptAction, attendeeId?: string | number | null) =>
        isMine(attendeeId) || forOthers(action, attendeeId),
      /** Settings and booking reasons: Full, or Manage on a role saved before actions. */
      canConfigure: can("configure") || (actions === undefined && manager),
      canExport: can("export"),
    };
  }, [accessPermissions, canManage, getScope, hasAction, isExcluded, myId, scopeFor]);
};

/**
 * Everything the Appointments pages read: bookings, people and their
 * schedules, and the booking rules. All branch-scoped through useFetch.
 */
export const useAppointmentsData = ({ withBookings = true }: { withBookings?: boolean } = {}) => {
  const access = useAppointmentAccess();
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
    access,
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
