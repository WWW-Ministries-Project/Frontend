import { useStore } from "@/store/useStore";
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

    const handleNavigation = (eventId) => {
        console.log("Navigate to event:", eventId);
    };

    const handleDeleteModal = (eventId) => {
        console.log("Delete event:", eventId);
    };

    const handleShowOptions = (eventId) => {
        setShowOptions(showOptions === eventId ? null : eventId);
    };

    // Filter for upcoming and ongoing events
    const upcomingAndOngoingEvents = events.filter(event => {
        const now = new Date();
        const eventDate = new Date(event.start_date);
        const eventStartTime = event.start_time ? new Date(`${event.start_date.split('T')[0]}T${event.start_time}:00`) : eventDate;
        const eventEndTime = event.end_time ? new Date(`${event.end_date.split('T')[0]}T${event.end_time}:00`) : new Date(event.end_date);
        
        return eventStartTime > now || (eventStartTime <= now && eventEndTime >= now);
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            day: 'numeric',
            month: 'long', 
            year: 'numeric' 
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const EventCard = ({ event }) => (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Event Image */}
            <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 relative overflow-hidden">
                {event.poster ? (
                    <img 
                        src={event.poster} 
                        alt={event.event_name || "Event"} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400"></div>
                        <div className="relative z-10 text-center">
                            <svg className="w-16 h-16 text-white mx-auto mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-white text-sm font-medium opacity-90">Event Image</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Event Details */}
            <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {event.event_name || "Brainstorming session"}
                </h3>

                {/* Date & Time */}
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                        {formatDate(event.start_date)}
                    </span>
                </div>

                {/* Time */}
                {(event.start_time || event.end_time) && (
                    <div className="flex items-center gap-2 mb-3">
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

                {/* Description */}
                {event.description && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                            {event.description}
                        </p>
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
                    
                    <div className="relative">
                        <button
                            onClick={() => handleShowOptions(event.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>

                        {showOptions === event.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                    onClick={() => handleNavigation(event.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Edit Event
                                </button>
                                <button
                                    onClick={() => handleDeleteModal(event.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    Delete Event
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
      
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800">Upcoming & Ongoing Events</h3>
            </div>
          
            {upcomingAndOngoingEvents.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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