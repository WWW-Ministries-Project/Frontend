export interface Session {
  id?: string | number;
  availabilityId?: string | number;
  start: string;
  end: string;
  status?: string;
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
  bookedSessions?: BookedSession[];
  timeSlots: TimeSlot[];
  currentSlot?: TimeSlot;
}

export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE" | "FULL" | string;

export interface StaffAvailabilityStatusSession extends Session {
  id?: string | number;
  availabilityId?: string | number;
  status?: AvailabilityStatus;
}

export interface StaffAvailabilityStatusSlot {
  availabilityId?: string | number;
  day: DayOfWeek | string;
  startTime: string;
  endTime: string;
  maxBookingsPerSlot?: number;
  sessionDurationMinutes?: number;
  status?: AvailabilityStatus;
  sessions: StaffAvailabilityStatusSession[];
}

export interface StaffAvailabilityStatusUser {
  userId: string | number;
  fullName?: string;
  staffName: string;
  maxBookingsPerSlot?: number;
  bookedSessions?: Array<{
    id?: string | number;
    bookingId?: string | number;
    booking_id?: string | number;
    date: string;
    start: string;
    end: string;
  }>;
  position?: string | null;
  timeSlots: StaffAvailabilityStatusSlot[];
}

export interface StaffAvailabilityStatusResponse {
  users: StaffAvailabilityStatusUser[];
}

export interface CreateStaffAvailabilityPayload {
  userId: string;
  maxBookingsPerSlot: number;
  timeSlots: TimeSlot[];
}

export type UpdateStaffAvailabilityPayload = CreateStaffAvailabilityPayload;

export type AppointmentBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "RESCHEDULED"
  | string;

export type AppointmentBookingsQuery = Partial<
  Record<
    "attendeeId" | "requesterId" | "status" | "date" | "staffId" | "userId",
    string | number
  >
>;

export interface CreateAppointmentBookingPayload {
  requesterId: number;
  attendeeId: number;
  userId?: number;
  staffId?: number;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  note?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  availabilityId?: string;
  sessionId?: string;
  status?: AppointmentBookingStatus;
}

export type UpdateAppointmentBookingPayload =
  Partial<CreateAppointmentBookingPayload>;

export interface UpdateAppointmentStatusPayload {
  isConfirmed: boolean;
}

export interface BookedSession {
  bookingId?: string;
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
  attendeeId?: string;
  attendeeName?: string;
  requesterId?: string;
  requesterName?: string;
  position?: string;
  date: string;
  session?: Session;
  isConfirmed?: boolean;
  status?: AppointmentBookingStatus;
  createdAt?: string;
  updatedAt?: string;
}
