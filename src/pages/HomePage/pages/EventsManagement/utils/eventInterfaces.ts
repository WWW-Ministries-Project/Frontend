import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import {
  EventRegistrationAudience,
  EventRegistrationRecord,
} from "@/utils/api/events/interfaces";

export interface eventType {
  id: number | string;
  name?: string;
  start_date: string;
  end_date: string;
  recurrence_end_date?: string | null;
  location?: string;
  description?: string;
  event_status?: string | null;
  poster?: string;
  qr_code?: string | null;
  event_type?: "ACTIVITY" | "PROGRAM" | "SERVICE" | "other" | "OTHER";
  start_time: string; // Format: "HH:mm"
  end_time: string; // Format: "HH:mm"
  event_name?: string;
  event_name_id?: number | string;
  requires_registration?: boolean;
  registration_end_date?: string | null;
  registration_capacity?: number | null;
  registration_audience?: EventRegistrationAudience;
  public_registration_url?: string | null;
  registration_count?: number;
  event_registers?: EventRegistrationRecord[];
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

export const TAB_TO_EVENT_TYPE = {
  "All": null,
  "ACTIVITY": "ACTIVITY", 
  "PROGRAM": "PROGRAM",
  "SERVICE": "SERVICE", 
  "OTHER": "OTHER",
};
