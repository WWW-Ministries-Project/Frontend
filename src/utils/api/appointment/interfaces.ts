export interface Session {
  start: string;
  end: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TimeSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  sessionDurationMinutes: number;
  sessions: Session[];
}

export interface StaffAvailability {
  id?: string;
  staffId: string;
  staffName: string;
  position?: string;
  role?: string;
  maxBookingsPerSlot: number;
  timeSlots: TimeSlot[];
  currentSlot?: TimeSlot;
}

export interface CreateStaffAvailabilityPayload {
  userId: string;
  maxBookingsPerSlot: number;
  timeSlots: TimeSlot[];
}

export interface BookedSession {
  staffId: string;
  date: string;
  start: string;
  end: string;
}

export interface BookingFormValues {
  fullName: string;
  email: string;
  phone: string;
  purpose: string;
  note: string;
  staffId: string;
  date: string;
  session?: Session;
}

export interface Appointment {
    id?: string;
    fullName: string;
  email: string;
  phone: string;
  purpose: string;
  note: string;
  staffId: string;
    staffName?: string;
    position?: string;
  date: string;
  session?: Session;
    status?: string;
    createdAt?: string;
}
