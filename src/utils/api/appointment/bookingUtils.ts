import { Appointment, BookedSession, Session } from "./interfaces";

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
