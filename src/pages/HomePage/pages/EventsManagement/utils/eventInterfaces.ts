import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";

export interface eventType {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
  event_status: string | null;
  poster: string;
  qr_code: string;
  event_type: "ACTIVITY" | "PROGRAM" | "SERVICE" | "other";
  start_time: string; // Format: "HH:mm"
  end_time: string; // Format: "HH:mm"
  //   event_attendance: [];
}
export interface EventSlice {
  events: eventType[];
  eventsOptions: ISelectOption[];
  upcomingEvents: eventType[];
  addEvent: (event: eventType) => void;
  removeEvent: (eventId: number) => void;
  updateEvent: (updatedEvent: eventType) => void;
  setEvents: (events: eventType[]) => void;
  setEventsOptions: () => void;
  setUpcomingEvents: () => void;
}
