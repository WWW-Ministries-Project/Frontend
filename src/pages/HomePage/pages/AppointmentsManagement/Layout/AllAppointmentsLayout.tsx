import AppointmentCard from "@/pages/MembersPage/Component/AppointmentCard";
import { Appointment } from "@/utils/api/appointment/interfaces";

const AllAppointmentsLayout = ({
  Appointments,
  onEdit,
  onDelete,
}: {
  Appointments: Record<string, Appointment[]>;
  onEdit: (appt: Appointment) => void;
  onDelete: (appt: Appointment) => void;
}) => {
  return (
    <div className="flex flex-col gap-6">
      {Object.entries(Appointments).map(([group, items]) => {
        if (!Array.isArray(items) || items.length === 0) {
          return null;
        }

        return (
          <div key={group} className="space-y-3">
            {Object.keys(Appointments).length > 1 && (
              <div className="font-semibold text-base">
                {group} ({items.length})
              </div>
            )}
            <div className="flex flex-col gap-4">
              {items.map((appointment: Appointment, index) => (
                <AppointmentCard
                  key={appointment.id || `${appointment.staffId}-${appointment.date}-${index}`}
                  appointment={appointment}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AllAppointmentsLayout;
