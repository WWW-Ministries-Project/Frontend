import { isArray } from "@/pages/HomePage/utils";
import { EventSlice, eventType } from "./eventInterfaces";
import { formatDate } from "@/utils";
const createEventSlice = (set: any, get: any): EventSlice => ({
  events: [],
  eventsOptions: [],
  upcomingEvents: [],
  addEvent: (event) => {
    set((state: any) => ({
      events: [...state.events, event],
    }));
    get().setEventsOptions();
    get().setUpcomingEvents();
  },
  removeEvent: (eventId) => {
    set((state: any) => ({
      events: state.events.filter((event: eventType) => event.id !== eventId),
    }));
    get().setEventsOptions();
    get().setUpcomingEvents();
  },
  updateEvent: (updatedEvent) => {
    set((state: any) => ({
      events: state.events.map((event: eventType) =>
        event.id === updatedEvent.id ? updatedEvent : event
      ),
    }));
    get().setEventsOptions();
    get().setUpcomingEvents();
  },
  setEvents: (events) => {
    set({ events });
    get().setEventsOptions();
    get().setUpcomingEvents();
  },
  setEventsOptions: () => {
    set((state: any) => ({
      eventsOptions: isArray(state.events)
        ? state.events.map((event: eventType) => ({
            label: event.name + " - " + formatDate(event.start_date),
            value: event.id,
          }))
        : [],
    }));
  },
  setUpcomingEvents: () => {
    set((state: any) => ({
      upcomingEvents: isArray(state.events)
        ? state.events.filter(
            (event: eventType) => new Date(event.start_date) > new Date()
          )
        : [],
    }));
  },
});

export default createEventSlice;
