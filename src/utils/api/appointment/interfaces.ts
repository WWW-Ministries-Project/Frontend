export interface Session {
  start: string;
  end: string;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  sessions: Session[];
}

export interface StaffAvailability {
  staffId: string;
  staffName: string;
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