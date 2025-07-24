import { useStore } from "@/store/useStore";
import { formatDate, formatDatefull, formatTime } from "@/utils";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export const UpcomingEvents = () => {
    const { events, setEvents } = useStore((state) => ({
        events: state.events,
        setEvents: state.setEvents,
    }));

    const [showOptions, setShowOptions] = useState(null);

    useEffect(() => {
        console.log("Event", events);
    }, [events]);


    // Filter for upcoming and ongoing events
    const upcomingAndOngoingEvents = events.filter(event => {
        const now = new Date();
        const eventDate = new Date(event.start_date);
        const eventStartTime = event.start_time ? new Date(`${event.start_date.split('T')[0]}T${event.start_time}:00`) : eventDate;
        const eventEndTime = event.end_time ? new Date(`${event.end_date.split('T')[0]}T${event.end_time}:00`) : new Date(event.end_date);
        
        return eventStartTime > now || (eventStartTime <= now && eventEndTime >= now);
    });



    const EventCard = ({ event }) => (
        <div className="bg-gray-50 rounded-lg border border-gray-200  overflow-hidden hover:shadow-md transition-shadow duration-200 p-4 space-y-4">
            {/* Event Image */}
            {event.poster&&<div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative overflow-hidden rounded-lg">
                {event.poster && (
                    <img 
                        src={event.poster} 
                        alt={event.event_name || "Event"} 
                        className="w-full h-full object-cover"
                    />
                )}
                
            </div>}

            {/* Event Details */}
            <div className=" space-y-2">
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-gray-900 ">
                    {event.event_name || "Brainstorming session"}
                </h3>
                {/* Description */}
                {event.description && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {event.description}
                        </p>
                    </div>
                )}
                </div>

                {/* Date & Time */}
                <div className="flex gap-4 ">
                    <div className="flex items-center gap-2 ">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                        {formatDatefull(event.start_date)}
                    </span>
                </div>
                <div className=" text-gray-600">|</div>

                {/* Time */}
                {(event.start_time || event.end_time) && (
                    <div className="flex items-center gap-2 ">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                            {formatTime(event.start_time)} 
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                            {" (GMT)"}
                        </span>
                    </div>
                )}
                </div>

                {/* Location */}
                {event.location && (
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                            {event.location}
                        </span>
                    </div>
                )}

                

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => handleNavigation(event.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                    >
                        View Details
                    </button>
                    
                    
                </div>
            </div>
        </div>
    );
      
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div>
                    <CalendarIcon className="text-primary" height={24}/>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Upcoming & Ongoing Events</h3>
            </div>
          
            {upcomingAndOngoingEvents.length === 0 ? (
                <div className="text-center py-12">
                    <div className="flex justify-center">
            <CalendarIcon className="text-gray-600" height={24}/>
        </div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Upcoming or Ongoing Events</h4>
                    <p className="text-gray-500">Check back soon — any upcoming or ongoing event will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols- gap-6 max-h-[50vh] overflow-auto ">
                    {upcomingAndOngoingEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
};
