import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Appointment,
  AppointmentBookingsQuery,
  BookedSession,
} from "@/utils/api/appointment/interfaces";
import AllAppointmentsLayout from "./Layout/AllAppointmentsLayout";
import { Modal } from "@/components/Modal";
import AppointmentBookingForm from "@/pages/MembersPage/Component/AppointmentBookingForm";
import { useFetch } from "@/CustomHooks/useFetch";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePut } from "@/CustomHooks/usePut";
import { api } from "@/utils";
import {
  normalizeAppointmentRecord,
  toBookedSession,
  toStringValue,
} from "@/utils/api/appointment/bookingUtils";
import { useStore } from "@/store/useStore";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";

const AppointmentManager = () => {
  const membersOptions = useStore((state) => state.membersOptions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | undefined>(undefined);

  const [attendeeFilter, setAttendeeFilter] = useState("");
  const [requesterFilter, setRequesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusUpdatingAppointmentId, setStatusUpdatingAppointmentId] =
    useState<string | null>(null);
  const [statusUpdatingTarget, setStatusUpdatingTarget] = useState<
    boolean | null
  >(null);

  const membersLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  const adminQuery = useMemo<AppointmentBookingsQuery>(() => {
    const query: AppointmentBookingsQuery = {};

    if (attendeeFilter) {
      query.attendeeId = attendeeFilter;
    }

    if (requesterFilter) {
      query.requesterId = requesterFilter;
    }

    if (statusFilter) {
      query.status = statusFilter;
    }

    if (dateFilter) {
      query.date = dateFilter;
    }

    return query;
  }, [attendeeFilter, dateFilter, requesterFilter, statusFilter]);
  const latestQueryRef = useRef<AppointmentBookingsQuery>(adminQuery);

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

  const {
    data: statusUpdateResponse,
    error: statusUpdateError,
    updateData: updateAppointmentStatus,
  } = usePut(api.put.updateAppointmentStatus);

  useEffect(() => {
    latestQueryRef.current = adminQuery;
  }, [adminQuery]);

  useEffect(() => {
    refetch(adminQuery);
  }, [adminQuery, refetch]);

  const appointments = useMemo(() => {
    if (!Array.isArray(bookingsResponse?.data)) return [];

    return bookingsResponse.data
      .map((item) => normalizeAppointmentRecord(item, membersLookup))
      .filter((item): item is Appointment => item !== null);
  }, [bookingsResponse, membersLookup]);

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

  const requesterFilterOptions = useMemo(
    () =>
      appointments.reduce<{ value: string; label: string }[]>((acc, appointment) => {
        const requesterId = toStringValue(appointment.requesterId).trim();
        if (!requesterId) return acc;

        const exists = acc.some((option) => option.value === requesterId);
        if (exists) return acc;

        acc.push({
          value: requesterId,
          label: appointment.requesterName || appointment.fullName || "Unknown Requester",
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

  const bookedSessions = useMemo<BookedSession[]>(() => {
    return appointments
      .map((appointment) => toBookedSession(appointment))
      .filter((session): session is BookedSession => session !== null);
  }, [appointments]);

  useEffect(() => {
    if (!deleteSuccess) return;

    showNotification("Appointment deleted successfully", "success");
    refetch(latestQueryRef.current);
  }, [deleteSuccess, refetch]);

  useEffect(() => {
    if (!deleteError) return;

    showNotification(deleteError.message || "Unable to delete appointment", "error");
  }, [deleteError]);

  useEffect(() => {
    if (!statusUpdateResponse) return;

    showNotification(
      statusUpdatingTarget ? "Appointment confirmed successfully" : "Appointment marked as unconfirmed",
      "success"
    );
    setStatusUpdatingAppointmentId(null);
    setStatusUpdatingTarget(null);
    refetch(latestQueryRef.current);
  }, [refetch, statusUpdateResponse, statusUpdatingTarget]);

  useEffect(() => {
    if (!statusUpdateError) return;

    showNotification(
      statusUpdateError.message || "Unable to update appointment status",
      "error"
    );
    setStatusUpdatingAppointmentId(null);
    setStatusUpdatingTarget(null);
  }, [statusUpdateError]);

  const handleBookAppointment = () => {
    setSelectedAppointment(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (appointment: Appointment) => {
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

  const handleToggleConfirmation = (
    appointment: Appointment,
    isConfirmed: boolean
  ) => {
    if (!appointment.id) {
      showNotification("Unable to update appointment: missing booking id", "error");
      return;
    }

    const appointmentId = String(appointment.id);
    setStatusUpdatingAppointmentId(appointmentId);
    setStatusUpdatingTarget(isConfirmed);
    updateAppointmentStatus({ isConfirmed }, { id: appointmentId });
  };

  const resetFilters = () => {
    setAttendeeFilter("");
    setRequesterFilter("");
    setStatusFilter("");
    setDateFilter("");
  };

  return (
    <PageOutline>
      <HeaderControls
        title="Appointment Manager"
        subtitle="Manage all appointments scheduled within the system"
        btnName="Add Appointment"
        screenWidth={typeof window !== "undefined" ? window.innerWidth : 0}
        handleClick={handleBookAppointment}
      />

      <div className="flex flex-wrap gap-4 my-4">
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
          <label className="text-xs font-medium text-gray-600">Requester</label>
          <select
            className="border rounded px-3 py-2 text-sm min-w-[180px]"
            value={requesterFilter}
            onChange={(event) => setRequesterFilter(event.target.value)}
          >
            <option value="">All Requesters</option>
            {requesterFilterOptions.map((option) => (
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

      {loading ? (
        <div className="text-sm text-gray-600 py-4">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="text-sm text-gray-600 py-4">No appointments found for the selected filters.</div>
      ) : (
        <AllAppointmentsLayout
          Appointments={{ all: appointments }}
          onEdit={(appointment) => {
            setSelectedAppointment(appointment);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          onToggleConfirmation={handleToggleConfirmation}
          showConfirmationActions
          isStatusUpdating={(appointmentId) =>
            Boolean(appointmentId) &&
            statusUpdatingAppointmentId === String(appointmentId)
          }
        />
      )}

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
            refetch(adminQuery);
          }}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(undefined);
          }}
        />
      </Modal>
    </PageOutline>
  );
};

export default AppointmentManager;
