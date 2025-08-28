import { useStore } from "@/store/useStore";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { EventCard } from "./EventCard";
import { Modal } from "@/components/Modal";
import { eventType } from "../../EventsManagement/utils/eventInterfaces";

export const UpcomingEvents = () => {
  const { events } = useStore((state) => ({
    events: state.events,
    setEvents: state.setEvents,
  }));

  const [openModaal, setOpenModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<eventType | null>(null)
  const upcomingAndOngoingEvents = useMemo(() => events?.slice(0, 4), [events]);


  const handleEventDetails = (event: eventType): void => {
    setSelectedEvent(event);
    setOpenModal(true)
    console.log('selectedEvent', selectedEvent);
    
  };

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
            <div key={event.id} >
              <EventCard  event={event} handleEventClick = {() =>handleEventDetails (event)}/>
            </div>
            
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      <Modal persist open={openModaal} onClose={() => setOpenModal(false)}>
        <div className="">
          {selectedEvent && <EventCard event={selectedEvent} showInModal={true} onClose={() => setOpenModal(false)}/>}
        </div>
      </Modal>
    </div>
  );
};
