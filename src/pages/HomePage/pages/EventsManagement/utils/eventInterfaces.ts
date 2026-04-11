import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import {
  EventRegistrationAudience,
  EventRegistrationRecord,
} from "@/utils/api/events/interfaces";

/** Minutes-before-event offsets supported for reminders */
export type ReminderOffsetMinutes =
  | 0
  | 5
  | 10
  | 15
  | 30
  | 60
  | 120
  | 1440
  | 2880
  | 10080;

export const REMINDER_OFFSET_OPTIONS: {
  label: string;
  value: ReminderOffsetMinutes;
}[] = [
  { label: "At time of event", value: 0 },
  { label: "5 minutes before", value: 5 },
  { label: "10 minutes before", value: 10 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "1 day before", value: 1440 },
  { label: "2 days before", value: 2880 },
  { label: "1 week before", value: 10080 },
];

export interface eventType {
  id: number | string;
  name?: string;
  start_date: string;
  end_date: string;
  recurrence_end_date?: string | null;
  /** IANA timezone string, e.g. "America/New_York". Defaults to "UTC". */
  timezone?: string | null;
  /** UUID linking all occurrences that belong to the same recurring series. */
  recurrence_series_id?: string | null;
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
  /** Reminder offsets in minutes before event start */
  reminders?: ReminderOffsetMinutes[];
  /** Who this event is intended for: all members, specific departments, or specific positions */
  audience_type?: "all" | "department" | "position";
  /** Department IDs when audience_type is "department" */
  target_departments?: string[];
  /** Position IDs when audience_type is "position" */
  target_positions?: string[];
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
