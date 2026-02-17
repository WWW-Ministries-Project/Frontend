import { Badge } from "@/components/Badge";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Appointment } from "@/utils/api/appointment/interfaces";

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

const getStatusColor = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-sm text-green-700 border border-green-300";
    case "cancelled":
      return "bg-red-100 text-sm text-red-700 border border-red-300";
    case "pending":
      return "bg-yellow-100 text-sm text-yellow-700 border border-yellow-300";
    case "completed":
      return "bg-blue-100 text-sm text-blue-700 border border-blue-300";
    case "rescheduled":
      return "bg-indigo-100 text-sm text-indigo-700 border border-indigo-300";
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
}: AppointmentCardProps) => {
  const requesterName = appointment.requesterName || appointment.fullName;
  const staffName = appointment.staffName || appointment.attendeeName || "Unknown Staff";

  return (
    <div className="border p-4 rounded-md relative bg-white">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => onEdit(appointment)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          aria-label="Edit appointment"
        >
          <PencilSquareIcon className="w-4 h-4 text-gray-700" />
        </button>

        <button
          onClick={() => onDelete(appointment)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 bg-white hover:bg-red-50"
          aria-label="Delete appointment"
        >
          <TrashIcon className="w-4 h-4 text-red-600" />
        </button>
      </div>

      <div className="pr-20">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-semibold text-base">{appointment.purpose}</h3>
          <Badge className={getStatusColor(appointment.status)}>
            {formatStatus(appointment.status)}
          </Badge>
        </div>

        <div className="mt-2 text-sm text-gray-700 space-y-1">
          <div>
            <span className="font-medium">Requester:</span> {requesterName}
            {appointment.requesterId ? ` (${appointment.requesterId})` : ""}
          </div>
          <div>
            <span className="font-medium">Attendee:</span> {staffName}
            {appointment.staffId ? ` (${appointment.staffId})` : ""}
            {appointment.position ? ` - ${appointment.position}` : ""}
          </div>
          <div>
            <span className="font-medium">Contact:</span> {appointment.email || "N/A"} | {appointment.phone || "N/A"}
          </div>
          <div>
            <span className="font-medium">Date:</span> {appointment.date || "N/A"}
            {appointment.session
              ? ` | ${appointment.session.start} - ${appointment.session.end}`
              : ""}
          </div>
          {appointment.note && (
            <div>
              <span className="font-medium">Note:</span> {appointment.note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
