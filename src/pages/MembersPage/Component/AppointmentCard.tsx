import { Badge } from "@/components/Badge";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Appointment } from "@/utils/api/appointment/interfaces";




interface AppointmentCardProps {
    appointment: Appointment;
    onEdit: (appointment: Appointment) => void;
    onDelete: (appointment: Appointment) => void;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-sm text-green-700 border border-green-300";
    case "cancelled":
      return "bg-red-100 text-sm text-red-700 border border-red-300";
    case "pending":
      return "bg-yellow-100 text-sm text-yellow-700 border border-yellow-300";
    default:
      return "bg-gray-100 text-sm text-gray-600 border border-gray-300";
  }
};

const AppointmentCard = ({ appointment, onEdit, onDelete }: AppointmentCardProps) => {
    return ( 
        <div className="border p-4 rounded-md relative">
            <div className="absolute top-4 right-4 flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(appointment)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            aria-label="Edit annual theme"
          >
            <PencilSquareIcon className="w-4 h-4 text-gray-700" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(appointment)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 bg-white hover:bg-red-50"
            aria-label="Delete annual theme"
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
                <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                        <div className="font-medium text-lg">
                          {appointment.purpose}
                        </div>
                       <Badge className={getStatusColor(appointment.status)}>
                         {appointment.status}
                       </Badge>
                    </div>
                </div>
                 <div className="text-sm text-gray-700">
                   Appointment with {appointment.staffName}
                 </div>
                {appointment.session && (
                  <div className="text-sm text-gray-600">
                    {appointment.date} | {appointment.session.start} – {appointment.session.end}
                  </div>
                )}
            </div>
     );
}
 
export default AppointmentCard;