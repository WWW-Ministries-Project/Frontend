export interface eventType {
    poster: string;
    event_type: "ACTIVITY"|"PROGRAM"| "SERVICE"| "other";
    name: string;
    value: string;
    id: number;
    start_date: Date;
    end_date: string;
    start_time: string;
    end_time: string;
    location: string;
    description: string;
}

export interface eventOptionsType {
    name: string;
    value: number;
}
export interface EventSlice {
    events: eventType[];
    eventsOptions: eventOptionsType[];
    upcomingEvents: eventType[];
    addEvent: (event: eventType) => void;
    removeEvent: (eventId: number) => void;
    updateEvent: (updatedEvent: eventType) => void;
    setEvents: (events: eventType[]) => void;
    setEventsOptions: () => void;
    setUpcomingEvents: () => void;
  }