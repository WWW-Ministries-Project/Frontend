import { useEffect, useMemo } from "react";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { relativePath } from "@/utils/const";
import { api } from "@/utils";
import { Appointment } from "@/utils/api/appointment/interfaces";
import {
  normalizeAppointmentRecord,
  toStringValue,
} from "@/utils/api/appointment/bookingUtils";
import { useStore } from "@/store/useStore";

const formatAppointmentDate = (date: string) => {
  if (!date) return "Date not set";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const toSortTimestamp = (appointment: Appointment): number => {
  const dateValue = appointment.date;
  if (!dateValue) return Number.MAX_SAFE_INTEGER;

  const datePart = dateValue.split("T")[0];
  const timePart = appointment.session?.start ?? "00:00";
  const parsed = new Date(`${datePart}T${timePart}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsed.getTime();
};

const getStatusStyles = (status?: string) => {
  const normalizedStatus = (status || "").toUpperCase();

  if (normalizedStatus === "CONFIRMED") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (normalizedStatus === "PENDING") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  if (normalizedStatus === "CANCELLED") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-gray-100 text-gray-700 border-gray-200";
};

export const MyAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const membersOptions = useStore((state) => state.membersOptions);

  const membersLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  const requesterId = toStringValue(user?.id).trim();

  const {
    data: bookingsResponse,
    loading,
    refetch,
  } = useFetch(api.fetch.fetchAppointmentBookings, undefined, true);

  useEffect(() => {
    if (!requesterId) return;

    refetch({ requesterId });
  }, [refetch, requesterId]);

  const isPastAppointment = (date: string) => {
  if (!date) return false;

  const today = new Date();
  const appointmentDate = new Date(date);
  appointmentDate.setHours(23, 59, 59, 999);
  return appointmentDate < today;
};

  const appointments = useMemo(() => {
    if (!Array.isArray(bookingsResponse?.data)) return [];

    return bookingsResponse.data
      .map((item) => normalizeAppointmentRecord(item, membersLookup))
      .filter((item): item is Appointment => item !== null)
      .filter((appointment) => !isPastAppointment(appointment.date))
      .sort((a, b) => toSortTimestamp(a) - toSortTimestamp(b));
  }, [bookingsResponse, membersLookup]);

  const previewAppointments = useMemo(
    () => appointments.slice(0, 5),
    [appointments]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-xl font-semibold text-gray-800">My Appointments</h3>
        <button
          type="button"
          onClick={() => navigate(relativePath.member.appointments)}
          className="text-sm font-medium text-primary hover:underline"
        >
          View more
        </button>
      </div>

      {!requesterId ? (
        <div className="text-center py-8">
          <h4 className="font-medium text-gray-600 mb-2">No appointment yet</h4>
          <p className="text-gray-500 text-sm">
            Sign in again to load your appointments.
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">Loading appointments...</p>
        </div>
      ) : previewAppointments.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex justify-center">
            <ClockIcon className="text-gray-600" height={24} />
          </div>
          <h4 className="font-medium text-gray-600 mb-2">No appointment yet</h4>
          <p className="text-gray-500 text-sm">
            Check back soon - your upcoming appointments will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {previewAppointments.map((appointment, index) => {
            const attendeeName =
              appointment.staffName || appointment.attendeeName || "Unknown Staff";

            return (
              <div
                key={appointment.id || `${appointment.staffId}-${appointment.date}-${index}`}
                className="rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {appointment.purpose || "General appointment"}
                    </p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      With {attendeeName}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusStyles(
                      appointment.status
                    )}`}
                  >
                    {(appointment.status || "PENDING").replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <CalendarDaysIcon className="h-3.5 w-3.5" />
                  <span>
                    {formatAppointmentDate(appointment.date)}
                    {appointment.session
                      ? ` | ${appointment.session.start} - ${appointment.session.end}`
                      : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
