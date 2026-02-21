import { Badge } from "@/components/Badge";
import { useRouteAccess } from "@/context/RouteAccessContext";
import {
  CalendarDaysIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Appointment } from "@/utils/api/appointment/interfaces";

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  onToggleConfirmation?: (appointment: Appointment, isConfirmed: boolean) => void;
  statusUpdating?: boolean;
  showConfirmationActions?: boolean;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
}

const getStatusColor = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
      return "bg-emerald-100 text-sm text-emerald-700 border border-emerald-200";
    case "cancelled":
      return "bg-red-100 text-sm text-red-700 border border-red-200";
    case "pending":
      return "bg-amber-100 text-sm text-amber-700 border border-amber-200";
    case "completed":
      return "bg-blue-100 text-sm text-blue-700 border border-blue-200";
    case "rescheduled":
      return "bg-indigo-100 text-sm text-indigo-700 border border-indigo-200";
    default:
      return "bg-gray-100 text-sm text-gray-600 border border-gray-300";
  }
};

const formatStatus = (status?: string) => {
  if (!status) return "UNKNOWN";
  return status.replaceAll("_", " ").toUpperCase();
};

const AppointmentCard = ({
  appointment,
  onEdit,
  onDelete,
  onToggleConfirmation,
  statusUpdating = false,
  showConfirmationActions = false,
  editDisabled = false,
  deleteDisabled = false,
}: AppointmentCardProps) => {
  const { canManageCurrentRoute } = useRouteAccess();
  const requesterName = appointment.requesterName || appointment.fullName;
  const staffName = appointment.staffName || appointment.attendeeName || "Unknown Staff";
  const canRunManageActions = canManageCurrentRoute;

  const normalizedStatus = (appointment.status || "").toUpperCase().trim();
  const isConfirmed =
    typeof appointment.isConfirmed === "boolean"
      ? appointment.isConfirmed
      : normalizedStatus === "CONFIRMED";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 break-words">
              {appointment.purpose || "General appointment"}
            </h3>
            <Badge className={getStatusColor(appointment.status)}>
              {formatStatus(appointment.status)}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 break-words">
            Requested by <span className="font-medium text-gray-800">{requesterName}</span>
            {appointment.requesterId ? ` (${appointment.requesterId})` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {showConfirmationActions && onToggleConfirmation && canRunManageActions && (
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => onToggleConfirmation(appointment, !isConfirmed)}
              className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium transition ${
                isConfirmed
                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              } ${statusUpdating ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {statusUpdating
                ? "Updating..."
                : isConfirmed
                ? "Mark Unconfirmed"
                : "Confirm Appointment"}
            </button>
          )}

          {onEdit && canRunManageActions && (
            <button
              type="button"
              disabled={editDisabled}
              onClick={() => {
                if (editDisabled) return;
                onEdit(appointment);
              }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 ${
                editDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-gray-50"
              }`}
              aria-label="Edit appointment"
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>
          )}

          {onDelete && canRunManageActions && (
            <button
              type="button"
              disabled={deleteDisabled}
              onClick={() => {
                if (deleteDisabled) return;
                onDelete(appointment);
              }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 ${
                deleteDisabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-red-50"
              }`}
              aria-label="Delete appointment"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserCircleIcon className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="truncate">
            <span className="font-medium">Attendee:</span> {staffName}
            {appointment.staffId ? ` (${appointment.staffId})` : ""}
            {appointment.position ? ` - ${appointment.position}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <CalendarDaysIcon className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="truncate">
            <span className="font-medium">Schedule:</span> {appointment.date || "N/A"}
            {appointment.session
              ? ` | ${appointment.session.start} - ${appointment.session.end}`
              : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <EnvelopeIcon className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="truncate">
            <span className="font-medium">Email:</span> {appointment.email || "N/A"}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <PhoneIcon className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="truncate">
            <span className="font-medium">Phone:</span> {appointment.phone || "N/A"}
          </span>
        </div>
      </div>

      {appointment.note && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span className="font-medium">Note:</span> {appointment.note}
        </div>
      )}
    </article>
  );
};

export default AppointmentCard;
