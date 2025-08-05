import { formatDate, formatTime } from "@/utils";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { eventType } from "../../EventsManagement/utils/eventInterfaces";

interface IProps {
  event: eventType;
}

export const EventCard = ({ event }: IProps) => {
  return (
    <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 p-4 space-y-4">
      {event.poster && (
        <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative overflow-hidden rounded-lg">
          <img
            src={event.poster}
            alt={event.event_name || "Event"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-gray-900">
            {event.event_name || "Brainstorming session"}
          </h3>
          {event.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {formatDate(event.start_date, "numeric")}
            </span>
          </div>
          <div className="text-gray-600">|</div>
          {(event.start_time || event.end_time) && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
                {" (GMT)"}
              </span>
            </div>
          )}
        </div>

        {event.location && (
          <div className="flex items-center gap-2 mb-4">
            <MapPinIcon className="h-4 text-gray-600" />
            <span className="text-sm text-gray-600">{event.location}</span>
          </div>
        )}
      </div>
    </div>
  );
};
