import {
  Appointment,
  AppointmentReason,
  AvailabilityStatus,
  BookedSession,
  DayOfWeek,
  Session,
  StaffAvailability,
  TimeSlot,
} from "./interfaces";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const toStringValue = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const toBooleanValue = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "confirmed"].includes(normalized)) return true;
    if (["false", "0", "no", "pending", "unconfirmed"].includes(normalized))
      return false;
  }

  return undefined;
};

const normalizeClockTime = (value: unknown): string => {
  const raw = toStringValue(value).trim();
  if (!raw.includes(":")) return "";

  const [hourPart, minutePart] = raw.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const firstRecord = (...values: unknown[]): Record<string, unknown> | null => {
  for (const value of values) {
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
};

export const toInputDate = (value?: string): string => {
  if (!value) return "";
  return value.split("T")[0];
};

const normalizeSession = (value: unknown): Session | undefined => {
  if (!isRecord(value)) return undefined;

  const start = normalizeClockTime(
    value.start ?? value.startTime ?? value.start_time ?? value.from
  );
  const end = normalizeClockTime(
    value.end ?? value.endTime ?? value.end_time ?? value.to
  );

  if (!start || !end) return undefined;

  return {
    id: toStringValue(value.id ?? value.sessionId ?? value.session_id) || undefined,
    availabilityId:
      toStringValue(
        value.availabilityId ??
          value.availability_id ??
          value.slotId ??
          value.slot_id
      ) || undefined,
    start,
    end,
    status: toStringValue(value.status) || undefined,
  };
};

export const normalizeAppointmentRecord = (
  raw: unknown,
  memberLookup: Record<string, string> = {}
): Appointment | null => {
  if (!isRecord(raw)) return null;

  const attendeeRecord = firstRecord(raw.attendee, raw.staff, raw.user, raw.attendeeUser);
  const requesterRecord = firstRecord(
    raw.requester,
    raw.requestedBy,
    raw.requested_by,
    raw.member
  );

  const attendeeId = toStringValue(
    raw.attendeeId ??
      raw.attendee_id ??
      raw.staffId ??
      raw.staff_id ??
      raw.userId ??
      raw.user_id ??
      (attendeeRecord ? attendeeRecord.id : undefined)
  );

  if (!attendeeId) return null;

  const requesterId = toStringValue(
    raw.requesterId ??
      raw.requester_id ??
      raw.requestedById ??
      raw.requested_by_id ??
      raw.memberId ??
      raw.member_id ??
      (requesterRecord ? requesterRecord.id : undefined)
  );

  const requesterName =
    toStringValue(
      raw.requesterName ??
        raw.requester_name ??
        raw.requestedByName ??
        raw.requested_by_name ??
        (requesterRecord
          ? requesterRecord.name ??
            requesterRecord.fullName ??
            requesterRecord.full_name
          : undefined)
    ) || undefined;

  const staffName =
    toStringValue(
      raw.staffName ??
        raw.staff_name ??
        raw.attendeeName ??
        raw.attendee_name ??
        (attendeeRecord
          ? attendeeRecord.name ?? attendeeRecord.fullName ?? attendeeRecord.full_name
          : undefined)
    ) ||
    memberLookup[attendeeId] ||
    "Unknown Staff";

  const purpose =
    toStringValue(raw.purpose ?? raw.reason ?? raw.title).trim() ||
    "General appointment";

  const dateValue = toInputDate(
    toStringValue(
      raw.date ??
        raw.bookingDate ??
        raw.booking_date ??
        raw.appointmentDate ??
        raw.appointment_date
    )
  );

  const sessionSource =
    raw.session ??
    raw.timeSlot ??
    raw.slot ??
    (Array.isArray(raw.sessions) && raw.sessions.length > 0 ? raw.sessions[0] : undefined);

  const normalizedSession = normalizeSession(sessionSource);
  const start = normalizeClockTime(
    raw.startTime ?? raw.start_time ?? raw.start ?? normalizedSession?.start
  );
  const end = normalizeClockTime(
    raw.endTime ?? raw.end_time ?? raw.end ?? normalizedSession?.end
  );

  const session: Session | undefined =
    start && end
      ? {
          ...normalizedSession,
          start,
          end,
        }
      : normalizedSession;

  const fullName =
    toStringValue(raw.fullName ?? raw.full_name ?? raw.name).trim() ||
    requesterName ||
    "Unknown requester";

  const isConfirmed = toBooleanValue(
    raw.isConfirmed ?? raw.is_confirmed ?? raw.confirmed
  );

  const rawStatus = toStringValue(
    raw.status ?? raw.bookingStatus ?? raw.booking_status
  )
    .toUpperCase()
    .trim();

  const derivedStatus = rawStatus
    ? rawStatus
    : isConfirmed === undefined
    ? ""
    : isConfirmed
    ? "CONFIRMED"
    : "PENDING";

  return {
    id:
      toStringValue(raw.id ?? raw.bookingId ?? raw.booking_id).trim() || undefined,
    fullName,
    email: toStringValue(raw.email).trim(),
    phone: toStringValue(raw.phone).trim(),
    purpose,
    note: toStringValue(raw.note ?? raw.notes ?? raw.description).trim(),
    staffId: attendeeId,
    staffName,
    attendeeId,
    attendeeName: staffName,
    requesterId: requesterId || undefined,
    requesterName,
    position: toStringValue(
      raw.position ??
        raw.role ??
        (attendeeRecord
          ? attendeeRecord.position ??
            attendeeRecord.title ??
            attendeeRecord.role
          : undefined)
    ),
    date: dateValue,
    session,
    isConfirmed,
    status: derivedStatus || undefined,
    createdAt: toStringValue(raw.createdAt ?? raw.created_at) || undefined,
    updatedAt: toStringValue(raw.updatedAt ?? raw.updated_at) || undefined,
  };
};

export const toBookedSession = (appointment: Appointment): BookedSession | null => {
  const status = toStringValue(appointment.status).toUpperCase().trim();
  if (status === "CANCELLED") {
    return null;
  }

  if (!appointment.session || !appointment.date || !appointment.staffId) {
    return null;
  }

  return {
    bookingId: appointment.id,
    staffId: appointment.staffId,
    date: appointment.date,
    start: appointment.session.start,
    end: appointment.session.end,
  };
};

/* -------------------------------------------------------------------------- */
/*  Booking-options normalisation (member booking form)                        */
/*  Moved out of AppointmentBookingForm so the form stays about the flow.      */
/* -------------------------------------------------------------------------- */

const DAY_OPTIONS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const toIntegerId = (value: unknown): number | null => {
  const raw = toStringValue(value).trim();
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;

  return parsed;
};

const normalizeAvailabilityStatus = (value: unknown): AvailabilityStatus =>
  toStringValue(value).toUpperCase();

const isAvailableStatus = (value: unknown): boolean => {
  const status = normalizeAvailabilityStatus(value);
  return !status || status === "AVAILABLE";
};

const timeToMinutes = (time: string): number => {
  const normalized = normalizeClockTime(time);
  if (!normalized) return 0;

  const [hours, minutes] = normalized.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;

  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const normalized = Math.max(0, minutes);
  const h = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const m = (normalized % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const generateSessions = (
  startTime: string,
  endTime: string,
  duration: number
): Session[] => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const sessions: Session[] = [];
  let cursor = start;

  while (duration > 0 && cursor + duration <= end) {
    sessions.push({
      start: minutesToTime(cursor),
      end: minutesToTime(cursor + duration),
    });
    cursor += duration;
  }

  return sessions;
};

const normalizeDay = (value: unknown): DayOfWeek => {
  const parsed = toStringValue(value).toLowerCase().trim();

  const dayMap: Record<string, DayOfWeek> = {
    monday: "monday",
    mon: "monday",
    tuesday: "tuesday",
    tue: "tuesday",
    tues: "tuesday",
    wednesday: "wednesday",
    wed: "wednesday",
    thursday: "thursday",
    thu: "thursday",
    thur: "thursday",
    thurs: "thursday",
    friday: "friday",
    fri: "friday",
    saturday: "saturday",
    sat: "saturday",
    sunday: "sunday",
    sun: "sunday",
  };

  if (dayMap[parsed]) return dayMap[parsed];
  if (DAY_OPTIONS.includes(parsed as DayOfWeek)) return parsed as DayOfWeek;

  return "monday";
};

// Unlike `normalizeSession` above, this drops sessions whose status is not
// AVAILABLE — they can't be offered to a member.
const normalizeAvailableSession = (session: unknown): Session | null => {
  if (!isRecord(session)) return null;
  if (!isAvailableStatus(session.status)) return null;

  const start = normalizeClockTime(
    session.start ?? session.start_time ?? session.startTime ?? session.from
  );
  const end = normalizeClockTime(
    session.end ?? session.end_time ?? session.endTime ?? session.to
  );

  if (!start || !end) return null;

  return {
    id:
      toStringValue(session.id ?? session.sessionId ?? session.session_id) ||
      undefined,
    availabilityId:
      toStringValue(
        session.availabilityId ??
          session.availability_id ??
          session.slotId ??
          session.slot_id
      ) || undefined,
    start,
    end,
    status: toStringValue(session.status) || undefined,
  };
};

const inferDuration = (
  slot: Record<string, unknown>,
  sessions: Session[]
): number => {
  const fromPayload = toNumberValue(
    slot.sessionDurationMinutes ??
      slot.session_duration_minutes ??
      slot.sessionDuration ??
      slot.duration,
    0
  );

  if (fromPayload > 0) return fromPayload;

  if (sessions.length > 0) {
    const inferred =
      timeToMinutes(sessions[0].end) - timeToMinutes(sessions[0].start);
    if (inferred > 0) return inferred;
  }

  return 30;
};

const normalizeTimeSlot = (slot: unknown): TimeSlot | null => {
  if (!isRecord(slot)) return null;
  if (!isAvailableStatus(slot.status)) return null;

  const startTime = normalizeClockTime(
    slot.startTime ?? slot.start_time ?? slot.start ?? slot.from
  );
  const endTime = normalizeClockTime(
    slot.endTime ?? slot.end_time ?? slot.end ?? slot.to
  );

  if (!startTime || !endTime) return null;

  const sessionsRaw =
    slot.sessions ??
    slot.session ??
    slot.availableSessions ??
    slot.available_sessions;
  const hasSessionsPayload = Array.isArray(sessionsRaw);

  const normalizedSessions = hasSessionsPayload
    ? sessionsRaw
        .map(normalizeAvailableSession)
        .filter((session): session is Session => session !== null)
    : [];

  const sessionDurationMinutes = inferDuration(slot, normalizedSessions);

  const finalSessions =
    normalizedSessions.length > 0
      ? normalizedSessions
      : hasSessionsPayload
      ? []
      : generateSessions(startTime, endTime, sessionDurationMinutes);

  if (finalSessions.length === 0) return null;

  return {
    day: normalizeDay(
      slot.day ?? slot.dayOfWeek ?? slot.day_of_week ?? slot.weekday
    ),
    startTime,
    endTime,
    sessionDurationMinutes,
    sessions: finalSessions,
  };
};

const normalizeBookedSession = (
  bookedSession: unknown,
  staffId: string
): BookedSession | null => {
  if (!isRecord(bookedSession)) return null;

  const date = toInputDate(
    toStringValue(
      bookedSession.date ??
        bookedSession.bookingDate ??
        bookedSession.booking_date
    )
  );
  const start = normalizeClockTime(
    bookedSession.start ??
      bookedSession.startTime ??
      bookedSession.start_time ??
      bookedSession.from
  );
  const end = normalizeClockTime(
    bookedSession.end ??
      bookedSession.endTime ??
      bookedSession.end_time ??
      bookedSession.to
  );

  if (!date || !start || !end) return null;

  return {
    bookingId:
      toStringValue(
        bookedSession.id ?? bookedSession.bookingId ?? bookedSession.booking_id
      ) || undefined,
    staffId,
    date,
    start,
    end,
  };
};

const normalizeStaffAvailability = (
  rawAvailability: unknown,
  memberLookup: Record<string, string>
): StaffAvailability | null => {
  if (!isRecord(rawAvailability)) return null;

  const staffRecord = firstRecord(rawAvailability.staff, rawAvailability.user);

  const staffId = toStringValue(
    rawAvailability.staffId ??
      rawAvailability.staff_id ??
      rawAvailability.userId ??
      rawAvailability.user_id ??
      (staffRecord ? staffRecord.id : undefined)
  );

  if (!staffId) return null;

  const timeSlotsRaw = rawAvailability.timeSlots ?? rawAvailability.time_slots;
  const bookedSessionsRaw =
    rawAvailability.bookedSessions ?? rawAvailability.booked_sessions;

  const nestedTimeSlots = Array.isArray(timeSlotsRaw)
    ? timeSlotsRaw
        .map(normalizeTimeSlot)
        .filter((slot): slot is TimeSlot => slot !== null)
    : [];
  const flatTimeSlot = Array.isArray(timeSlotsRaw)
    ? null
    : normalizeTimeSlot(rawAvailability);
  const timeSlots =
    nestedTimeSlots.length > 0
      ? nestedTimeSlots
      : flatTimeSlot
      ? [flatTimeSlot]
      : [];

  const positionRaw = rawAvailability.position ??
    (staffRecord ? staffRecord.position ?? staffRecord.title : undefined);
  const position = isRecord(positionRaw)
    ? toStringValue(positionRaw.name ?? positionRaw.title)
    : toStringValue(positionRaw);

  const staffName =
    toStringValue(
      rawAvailability.staffName ??
        rawAvailability.staff_name ??
        rawAvailability.fullName ??
        rawAvailability.full_name ??
        (staffRecord
          ? staffRecord.name ?? staffRecord.fullName ?? staffRecord.full_name
          : undefined)
    ) ||
    memberLookup[staffId] ||
    "Unknown Staff";

  const role = toStringValue(
    rawAvailability.role ??
      rawAvailability.designation ??
      (staffRecord ? staffRecord.role ?? staffRecord.designation : undefined)
  );

  const bookedSessions = Array.isArray(bookedSessionsRaw)
    ? bookedSessionsRaw
        .map((session) => normalizeBookedSession(session, staffId))
        .filter((session): session is BookedSession => session !== null)
    : [];

  return {
    id:
      toStringValue(
        rawAvailability.id ??
          rawAvailability.availabilityId ??
          rawAvailability.availability_id
      ) || undefined,
    staffId,
    staffName,
    position,
    role,
    maxBookingsPerSlot: Math.max(
      1,
      toNumberValue(
        rawAvailability.maxBookingsPerSlot ??
          rawAvailability.max_bookings_per_slot ??
          rawAvailability.maxBookings ??
          rawAvailability.max_bookings ??
          (Array.isArray(timeSlotsRaw) &&
          timeSlotsRaw.length > 0 &&
          isRecord(timeSlotsRaw[0])
            ? timeSlotsRaw[0].maxBookingsPerSlot ??
              timeSlotsRaw[0].max_bookings_per_slot
            : undefined),
        1
      )
    ),
    bookedSessions,
    timeSlots,
  };
};

const isSameBookedSession = (a: BookedSession, b: BookedSession) =>
  a.staffId === b.staffId &&
  toInputDate(a.date) === toInputDate(b.date) &&
  a.start === b.start &&
  a.end === b.end;

export const dedupeBookedSessions = (
  sessions: BookedSession[]
): BookedSession[] =>
  sessions.reduce<BookedSession[]>((acc, session) => {
    if (!acc.some((existing) => isSameBookedSession(existing, session))) {
      acc.push(session);
    }
    return acc;
  }, []);

/**
 * Normalises `appointment/availability/booking-options` into one entry per
 * staff member. Staff without any open slot are KEPT (with empty
 * `timeSlots`) so the booking form can list them as "No open times".
 */
export const normalizeBookingOptions = (
  responseData: unknown,
  memberLookup: Record<string, string> = {}
): StaffAvailability[] => {
  const source = Array.isArray(responseData)
    ? responseData
    : isRecord(responseData)
    ? Array.isArray(responseData.users)
      ? responseData.users
      : Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData.items)
      ? responseData.items
      : []
    : [];

  const order: string[] = [];
  const grouped = source
    .map((availability) =>
      normalizeStaffAvailability(availability, memberLookup)
    )
    .filter(
      (availability): availability is StaffAvailability =>
        availability !== null
    )
    .reduce<Record<string, StaffAvailability>>((acc, availability) => {
      const existing = acc[availability.staffId];

      if (!existing) {
        order.push(availability.staffId);
        acc[availability.staffId] = {
          ...availability,
          bookedSessions: [...(availability.bookedSessions ?? [])],
          timeSlots: [...availability.timeSlots],
        };
        return acc;
      }

      const mergedSlots = [...existing.timeSlots];
      availability.timeSlots.forEach((slot) => {
        const exists = mergedSlots.some(
          (existingSlot) =>
            existingSlot.day === slot.day &&
            existingSlot.startTime === slot.startTime &&
            existingSlot.endTime === slot.endTime
        );
        if (!exists) mergedSlots.push(slot);
      });

      acc[availability.staffId] = {
        ...existing,
        staffName: availability.staffName || existing.staffName,
        position: availability.position || existing.position,
        role: availability.role || existing.role,
        maxBookingsPerSlot:
          availability.maxBookingsPerSlot || existing.maxBookingsPerSlot,
        bookedSessions: dedupeBookedSessions([
          ...(existing.bookedSessions ?? []),
          ...(availability.bookedSessions ?? []),
        ]),
        timeSlots: mergedSlots,
      };
      return acc;
    }, {});

  return order.map((staffId) => grouped[staffId]);
};

/* -------------------------------------------------------------------------- */
/*  Open dates for the next N days                                             */
/* -------------------------------------------------------------------------- */

export const BOOKING_WINDOW_DAYS = 28;

export const toLocalInputDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseInputDate = (value: string): Date | null => {
  const [year, month, day] = toInputDate(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const dayOfWeekFor = (date: Date): DayOfWeek =>
  DAY_OPTIONS[(date.getDay() + 6) % 7];

export interface BookableSession {
  session: Session;
  booked: boolean;
}

export interface BookableDay {
  date: string;
  sessions: BookableSession[];
  openCount: number;
}

export interface CurrentAppointmentSlot {
  staffId?: string;
  date?: string;
  start?: string;
  end?: string;
}

/**
 * Every date in the next `windowDays` (today included) on which `staff` has
 * at least one session that is not booked. A session counts as booked when a
 * booked session for that staff matches its date + start + end — except the
 * appointment being edited, whose own slot stays selectable. Sessions that
 * already started today are skipped.
 */
export const buildBookableDays = (
  staff: StaffAvailability | undefined,
  {
    extraBookedSessions = [],
    currentAppointment,
    windowDays = BOOKING_WINDOW_DAYS,
    now = new Date(),
  }: {
    extraBookedSessions?: BookedSession[];
    currentAppointment?: CurrentAppointmentSlot;
    windowDays?: number;
    now?: Date;
  } = {}
): BookableDay[] => {
  if (!staff || staff.timeSlots.length === 0) return [];

  const booked = dedupeBookedSessions([
    ...(staff.bookedSessions ?? []),
    ...extraBookedSessions.filter(
      (session) => session.staffId === staff.staffId
    ),
  ]);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const days: BookableDay[] = [];

  for (let offset = 0; offset < windowDays; offset += 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + offset
    );
    const dateValue = toLocalInputDate(date);
    const weekday = dayOfWeekFor(date);

    const seen = new Set<string>();
    const sessions: BookableSession[] = [];

    staff.timeSlots
      .filter((slot) => slot.day === weekday)
      .forEach((slot) => {
        slot.sessions.forEach((session) => {
          const key = `${session.start}-${session.end}`;
          if (seen.has(key)) return;
          if (offset === 0 && timeToMinutes(session.start) <= nowMinutes) {
            return;
          }
          seen.add(key);

          const isCurrentAppointmentSlot =
            Boolean(currentAppointment) &&
            currentAppointment?.staffId === staff.staffId &&
            toInputDate(currentAppointment?.date) === dateValue &&
            currentAppointment?.start === session.start &&
            currentAppointment?.end === session.end;

          const isBooked =
            !isCurrentAppointmentSlot &&
            booked.some(
              (bookedSession) =>
                toInputDate(bookedSession.date) === dateValue &&
                bookedSession.start === session.start &&
                bookedSession.end === session.end
            );

          sessions.push({ session, booked: isBooked });
        });
      });

    sessions.sort(
      (a, b) => timeToMinutes(a.session.start) - timeToMinutes(b.session.start)
    );

    const openCount = sessions.filter((entry) => !entry.booked).length;
    if (openCount > 0) {
      days.push({ date: dateValue, sessions, openCount });
    }
  }

  return days;
};

/* -------------------------------------------------------------------------- */
/*  Booking reasons                                                            */
/* -------------------------------------------------------------------------- */

const normalizeAppointmentReason = (
  raw: unknown,
  index: number
): AppointmentReason | null => {
  if (!isRecord(raw)) return null;

  const id = toNumberValue(raw.id ?? raw.reasonId ?? raw.reason_id, NaN);
  const label = toStringValue(raw.label ?? raw.name ?? raw.title).trim();

  if (!Number.isFinite(id) || !label) return null;

  const description =
    toStringValue(raw.description ?? raw.details).trim() || null;
  const isActive = toBooleanValue(raw.is_active ?? raw.isActive ?? raw.active);

  return {
    id,
    label,
    description,
    sort_order: toNumberValue(raw.sort_order ?? raw.sortOrder ?? raw.order, index),
    is_active: isActive ?? true,
    created_at: toStringValue(raw.created_at ?? raw.createdAt) || undefined,
    updated_at: toStringValue(raw.updated_at ?? raw.updatedAt) || undefined,
  };
};

/** Unwraps `[...]`, `{ data: [...] }`, `{ items: [...] }` or `{ reasons: [...] }`. */
export const normalizeAppointmentReasons = (
  responseData: unknown
): AppointmentReason[] => {
  const source = Array.isArray(responseData)
    ? responseData
    : isRecord(responseData)
    ? Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData.items)
      ? responseData.items
      : Array.isArray(responseData.reasons)
      ? responseData.reasons
      : isRecord(responseData.data) && Array.isArray(responseData.data.items)
      ? responseData.data.items
      : []
    : [];

  return source
    .map(normalizeAppointmentReason)
    .filter((reason): reason is AppointmentReason => reason !== null)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
};
