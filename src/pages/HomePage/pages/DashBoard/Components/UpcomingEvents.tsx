import { useStore } from "@/store/useStore";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";
import { EventCard } from "./EventCard";

export const UpcomingEvents = () => {
  const { events } = useStore((state) => ({
    events: state.events,
    setEvents: state.setEvents,
  }));

  // Filter for upcoming and ongoing events
  //   const upcomingAndOngoingEvents = events.filter((event) => {
  //     const now = new Date();
  //     const start = new Date(
  //       `${event.start_date.split("T")[0]}T${event.start_time || "00:00"}:00`
  //     );
  //     const end = new Date(
  //       `${event.end_date.split("T")[0]}T${event.end_time || "23:59"}:00`
  //     );

  //     return start > now || (start <= now && end >= now);
  //   });
  //TODO: This is a placeholder waiting for api from BE
  const upcomingAndOngoingEvents = useMemo(() => events.slice(0, 4), [events]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <CalendarIcon className="text-primary" height={24} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          Upcoming & Ongoing Events
        </h3>
      </div>

      {upcomingAndOngoingEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center">
            <CalendarIcon className="text-gray-600" height={24} />
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No Upcoming or Ongoing Events
          </h4>
          <p className="text-gray-500">
            Check back soon — any upcoming or ongoing event will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols- gap-6 max-h-[50vh] overflow-auto z-10">
          {upcomingAndOngoingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
