import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import BannerWrapper from "../layouts/BannerWrapper";
import booking from "@/assets/banner/booking.svg";
import { Modal } from "@/components/Modal";
import AppointmentBookingForm from "../Component/AppointmentBookingForm";
import {
  Appointment,
  AppointmentBookingsQuery,
  BookedSession,
} from "@/utils/api/appointment/interfaces";
import AllAppointmentsLayout from "@/pages/HomePage/pages/AppointmentsManagement/Layout/AllAppointmentsLayout";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import {
  normalizeAppointmentRecord,
  toBookedSession,
  toStringValue,
} from "@/utils/api/appointment/bookingUtils";
import { useStore } from "@/store/useStore";

const isPastAppointment = (date: string) => {
  if (!date) return false;

  const today = new Date();
  const appointmentDate = new Date(date);
  appointmentDate.setHours(23, 59, 59, 999);
  return appointmentDate < today;
};

const isAppointmentConfirmed = (appointment: Appointment): boolean => {
  const status = toStringValue(appointment.status).toUpperCase().trim();

  if (typeof appointment.isConfirmed === "boolean") {
    return appointment.isConfirmed || status === "CONFIRMED";
  }

  return status === "CONFIRMED";
};

const MyAppointments = () => {
  const { user } = useAuth();
  const membersOptions = useStore((state) => state.membersOptions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | undefined>(undefined);

  const [attendeeFilter, setAttendeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const membersLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  const requesterId = toStringValue(user?.id).trim();

  const memberQuery = useMemo<AppointmentBookingsQuery | null>(() => {
    if (!requesterId) return null;

    const query: AppointmentBookingsQuery = {
      requesterId,
    };

    if (attendeeFilter) {
      query.attendeeId = attendeeFilter;
    }

    if (statusFilter) {
      query.status = statusFilter;
    }

    if (dateFilter) {
      query.date = dateFilter;
    }

    return query;
  }, [attendeeFilter, dateFilter, requesterId, statusFilter]);

  const {
    data: bookingsResponse,
    loading,
    refetch,
  } = useFetch(api.fetch.fetchAppointmentBookings, undefined, true);

  const {
    executeDelete,
    success: deleteSuccess,
    error: deleteError,
  } = useDelete(api.delete.deleteAppointmentBooking);

  useEffect(() => {
    if (!memberQuery) return;
    refetch(memberQuery);
  }, [memberQuery, refetch]);

  const appointments = useMemo(() => {
    if (!Array.isArray(bookingsResponse?.data)) return [];

    return bookingsResponse.data
      .map((item) => normalizeAppointmentRecord(item, membersLookup))
      .filter((item): item is Appointment => item !== null);
  }, [bookingsResponse, membersLookup]);

  const groupedAppointments = useMemo<Record<string, Appointment[]>>(() => {
    const upcomingAndCurrent = appointments.filter(
      (appointment) => !isPastAppointment(appointment.date)
    );
    const past = appointments.filter((appointment) =>
      isPastAppointment(appointment.date)
    );

    const grouped: Record<string, Appointment[]> = {};

    if (upcomingAndCurrent.length > 0) {
      grouped["Upcoming & Current Appointments"] = upcomingAndCurrent;
    }

    if (past.length > 0) {
      grouped["Past Appointments"] = past;
    }

    return grouped;
  }, [appointments]);

  const bookedSessions = useMemo<BookedSession[]>(() => {
    return appointments
      .map((appointment) => toBookedSession(appointment))
      .filter((session): session is BookedSession => session !== null);
  }, [appointments]);

  const attendeeFilterOptions = useMemo(
    () =>
      appointments.reduce<{ value: string; label: string }[]>((acc, appointment) => {
        if (!appointment.staffId) return acc;

        const exists = acc.some((option) => option.value === appointment.staffId);
        if (exists) return acc;

        acc.push({
          value: appointment.staffId,
          label: appointment.staffName || "Unknown Staff",
        });

        return acc;
      }, []),
    [appointments]
  );

  const statusFilterOptions = useMemo(
    () =>
      appointments.reduce<string[]>((acc, appointment) => {
        const status = toStringValue(appointment.status).toUpperCase().trim();

        if (!status || acc.includes(status)) return acc;

        acc.push(status);
        return acc;
      }, []),
    [appointments]
  );

  useEffect(() => {
    if (!deleteSuccess) return;

    showNotification("Appointment deleted successfully", "success");
    if (memberQuery) {
      refetch(memberQuery);
    }
  }, [deleteSuccess, memberQuery, refetch]);

  useEffect(() => {
    if (!deleteError) return;
    showNotification(deleteError.message || "Unable to delete appointment", "error");
  }, [deleteError]);

  const handleBookAppointment = () => {
    setSelectedAppointment(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (appointment: Appointment) => {
    if (isAppointmentConfirmed(appointment)) {
      showNotification(
        "Confirmed appointments cannot be deleted.",
        "error"
      );
      return;
    }

    if (!appointment.id) {
      showNotification("Unable to delete appointment: missing booking id", "error");
      return;
    }

    showDeleteDialog(
      {
        id: appointment.id,
        name: appointment.purpose || "appointment",
      },
      (id) => executeDelete({ id: String(id) })
    );
  };

  const resetFilters = () => {
    setAttendeeFilter("");
    setStatusFilter("");
    setDateFilter("");
  };

  return (
    <div className="flex flex-col gap-y-6">
      <BannerWrapper imgSrc={booking}>
        <div className="space-y-4 w-full">
          <div className="font-bold text-3xl">My Appointments</div>
          <div>Overview of your appointments and schedules.</div>
        </div>
      </BannerWrapper>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Attendee</label>
              <select
                className="border rounded px-3 py-2 text-sm min-w-[180px]"
                value={attendeeFilter}
                onChange={(event) => setAttendeeFilter(event.target.value)}
              >
                <option value="">All Attendees</option>
                {attendeeFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                className="border rounded px-3 py-2 text-sm min-w-[160px]"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All Statuses</option>
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input
                type="date"
                className="border rounded px-3 py-2 text-sm"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                className="text-sm px-4 py-2 border rounded hover:bg-gray-50"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>

          <Button
            value="Book appointment"
            variant="primary"
            onClick={handleBookAppointment}
          />
        </div>

        {!requesterId ? (
          <div className="text-sm text-red-600">
            Unable to fetch appointments: requester id is missing.
          </div>
        ) : loading ? (
          <div className="text-sm text-gray-600">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-sm text-gray-600">No appointments found for the selected filters.</div>
        ) : (
          <AllAppointmentsLayout
            Appointments={groupedAppointments}
            onEdit={(appointment) => {
              if (isAppointmentConfirmed(appointment)) {
                showNotification(
                  "Confirmed appointments cannot be edited.",
                  "error"
                );
                return;
              }
              setSelectedAppointment(appointment);
              setIsModalOpen(true);
            }}
            onDelete={handleDelete}
            isEditDisabled={isAppointmentConfirmed}
            isDeleteDisabled={isAppointmentConfirmed}
          />
        )}
      </div>

      <Modal
        open={isModalOpen}
        className="max-w-4xl"
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(undefined);
        }}
      >
        <AppointmentBookingForm
          appointment={selectedAppointment}
          bookedSessions={bookedSessions}
          onSuccess={() => {
            if (memberQuery) {
              refetch(memberQuery);
            }
          }}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(undefined);
          }}
        />
      </Modal>
    </div>
  );
};

export default MyAppointments;
