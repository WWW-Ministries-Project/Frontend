import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Session {
    start: string;
    end: string;
}

interface TimeSlot {
    day: string;
    startTime: string;
    endTime: string;
    sessionDurationMinutes: number;
    sessions: Session[];
}

interface Availability {
    staffId: string;
    staffName: string;
    position: string;
    role: string;
    timeSlots: TimeSlot[];
    maxBookingsPerSlot: number;
}

interface StaffAvailabilityCardProps {
    availability: Availability;
    onEdit: () => void;
    onDelete: () => void;
}

const StaffAvailabilityCard = ({ availability, onEdit, onDelete }: StaffAvailabilityCardProps) => {
    return ( 
        <div className="border p-4 rounded  flex flex-col gap-3  mb-4 relative">

            <div className="absolute top-4 right-4 flex gap-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            aria-label="Edit annual theme"
          >
            <PencilSquareIcon className="w-4 h-4 text-gray-700" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 bg-white hover:bg-red-50"
            aria-label="Delete annual theme"
          >
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

            <div className=" space-y-2"
            >
                <h3 className="text-lg font-semibold">
                  {availability.staffName}
                </h3>
                <p className="text-sm text-gray-600">
                  {availability.position} · {availability.role}
                </p>
            </div>
            <div>
                <p className="font-medium">Max Bookings per Slot: {availability.maxBookingsPerSlot}</p>
            </div>
            <div className=" space-y-2">
                <h4 className="font-medium">Available Slots:</h4>
                <ul className="list-disc list-inside space-y-2">
                    {availability.timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="bg-primary/10 p-2 rounded text-sm space-y-1"
                      >
                        <p className="font-medium capitalize">
                          {slot.day}: {slot.startTime} – {slot.endTime} ({slot.sessionDurationMinutes} mins)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {slot.sessions.map((session, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 bg-white border rounded text-xs"
                            >
                              {session.start}–{session.end}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </ul>
                
            </div>
        </div>
     );
}
 
export default StaffAvailabilityCard;