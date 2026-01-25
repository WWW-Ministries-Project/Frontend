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
    <div>
      <div className="flex flex-col gap-6">
        {Object.entries(Appointments).map(([group, items]) => (
          <div key={group} className="space-y-3">
            <div className="flex flex-col gap-4">
              {items.map((appointment: Appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onDelete={(appt) => onDelete(appt)}
                  onEdit={(appt) => onEdit(appt)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
export default AllAppointmentsLayout;