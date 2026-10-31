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
  /** Break between sessions; the sessions sent are already spaced by it. */
  bufferMinutes?: number;
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
  reasonId?: number;
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

// Reasons members choose from on step 1 of the booking flow. Managed by
// admins under Appointments → Settings. Staff are NOT linked to reasons.
export interface AppointmentReason {
  id: number;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAppointmentReasonPayload {
  label: string;
  description?: string | null;
  is_active?: boolean;
}

export type UpdateAppointmentReasonPayload =
  Partial<CreateAppointmentReasonPayload>;

export interface ReorderAppointmentReasonsPayload {
  ids: number[];
}

/* -------------------------------------------------------------------------- */
/*                      Appointments redesign (Oct 2026)                      */
/* -------------------------------------------------------------------------- */
// See docs/APPOINTMENTS_REDESIGN_BACKEND_CONTRACT.md.

export type AppointmentLifecycleStatus =
  | "PENDING"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "DECLINED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type AppointmentHistoryTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

/** One line of a booking's server-written history. */
export interface AppointmentHistoryEntry {
  at: string;
  text: string;
  tone?: AppointmentHistoryTone;
}

/** Body of `POST /appointment/bookings/:id/actions`. */
export type AppointmentActionPayload =
  | { action: "accept" }
  | { action: "reopen" }
  | {
      action: "suggest";
      date: string;
      startTime: string;
      endTime: string;
      message?: string;
    }
  | { action: "decline"; reason: string; message?: string }
  | { action: "cancel"; message?: string }
  | { action: "complete" }
  | { action: "no_show" }
  | { action: "remind" }
  | { action: "reassign"; attendeeId: number }
  | { action: "confirm_proposal" };

export interface StaffTimeOff {
  id: number | string;
  from: string;
  to: string;
  note?: string | null;
}

export interface CreateStaffTimeOffPayload {
  from: string;
  to: string;
  note?: string;
}

export type AppointmentChannel = "push" | "sms" | "email";

export type AppointmentNotificationEvent =
  | "new"
  | "nudge"
  | "overdue"
  | "accepted"
  | "suggested"
  | "declined"
  | "cancelled"
  | "reminder"
  | "outcome";

export type AppointmentNotificationAudience = "attendee" | "requester" | "admins";

export type AppointmentNotificationMatrix = Record<
  AppointmentNotificationEvent,
  Record<AppointmentNotificationAudience, AppointmentChannel[]>
>;

/** `GET/PUT /appointment/settings`. PUT accepts any subset. */
export interface AppointmentSettings {
  replyDeadlineHours: number;
  /** 0 keeps waiting; otherwise offer the member other people after this. */
  unansweredAfterHours: number;
  minNoticeHours: number;
  bookAheadDays: number;
  reminderHours: number;
  cancelCutoffHours: number;
  notifications: AppointmentNotificationMatrix;
}
