import { Button } from "@/components";
import { Formik, Form, Field, getIn } from "formik";
import * as Yup from "yup";
import { useEffect, useMemo } from "react";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import {
  AvailabilityStatus,
  Appointment,
  BookedSession,
  BookingFormValues,
  CreateAppointmentBookingPayload,
  DayOfWeek,
  Session,
  StaffAvailability,
  TimeSlot,
  UpdateAppointmentBookingPayload,
} from "@/utils/api/appointment/interfaces";
import { showNotification } from "@/pages/HomePage/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useStore } from "@/store/useStore";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useAuth } from "@/context/AuthWrapper";

const dayOptions: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const validationSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .required("Full name is required"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),
  phone: Yup.string()
    .trim()
    .min(7, "Phone number must be at least 7 characters")
    .required("Phone number is required"),
  purpose: Yup.string()
    .trim()
    .min(3, "Purpose must be at least 3 characters")
    .max(200, "Purpose cannot exceed 200 characters")
    .required("Purpose is required"),
  note: Yup.string().trim().max(500, "Notes cannot exceed 500 characters"),
  staffId: Yup.string().required("Please select a staff member"),
  date: Yup.string().required("Please select an appointment date"),
  session: Yup.object({
    start: Yup.string().required(),
    end: Yup.string().required(),
  })
    .nullable()
    .required("Please select a time slot"),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toStringValue = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toIntegerId = (value: unknown): number | null => {
  const raw = toStringValue(value).trim();
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;

  return parsed;
};

const normalizeStatus = (value: unknown): AvailabilityStatus =>
  toStringValue(value).toUpperCase();

const isAvailableStatus = (value: unknown): boolean => {
  const status = normalizeStatus(value);
  return !status || status === "AVAILABLE";
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

const timeToMinutes = (time: string): number => {
  const normalized = normalizeClockTime(time);

  if (!normalized) {
    return 0;
  }

  const [hours, minutes] = normalized.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }

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

  while (cursor + duration <= end) {
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

  if (dayMap[parsed]) {
    return dayMap[parsed];
  }

  if (dayOptions.includes(parsed as DayOfWeek)) {
    return parsed as DayOfWeek;
  }

  return "monday";
};

const normalizeSession = (session: unknown): Session | null => {
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
    id: toStringValue(session.id ?? session.sessionId ?? session.session_id) || undefined,
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
    slot.sessions ?? slot.session ?? slot.availableSessions ?? slot.available_sessions;
  const hasSessionsPayload = Array.isArray(sessionsRaw);

  const normalizedSessions = hasSessionsPayload
    ? sessionsRaw
        .map(normalizeSession)
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
    day: normalizeDay(slot.day ?? slot.dayOfWeek ?? slot.day_of_week ?? slot.weekday),
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
        bookedSession.id ??
          bookedSession.bookingId ??
          bookedSession.booking_id
      ) || undefined,
    staffId,
    date,
    start,
    end,
  };
};

const normalizeAvailability = (
  rawAvailability: unknown,
  memberLookup: Record<string, string>
): StaffAvailability | null => {
  if (!isRecord(rawAvailability)) return null;

  const staffRecord = isRecord(rawAvailability.staff)
    ? rawAvailability.staff
    : isRecord(rawAvailability.user)
    ? rawAvailability.user
    : null;

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
  const flatTimeSlot = normalizeTimeSlot(rawAvailability);
  const timeSlots =
    nestedTimeSlots.length > 0
      ? nestedTimeSlots
      : flatTimeSlot
      ? [flatTimeSlot]
      : [];

  if (timeSlots.length === 0) return null;

  const staffName =
    toStringValue(
      rawAvailability.staffName ??
        rawAvailability.staff_name ??
        rawAvailability.fullName ??
        rawAvailability.full_name ??
        (staffRecord
          ? staffRecord.name ??
            staffRecord.fullName ??
            staffRecord.full_name
          : undefined)
    ) || memberLookup[staffId] || "Unknown Staff";

  const position = toStringValue(
    rawAvailability.position ??
      (staffRecord ? staffRecord.position ?? staffRecord.title : undefined)
  );

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

const getDayFromDate = (date: string): DayOfWeek | null => {
  const [year, month, day] = date.split("T")[0].split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const localDate = new Date(year, month - 1, day);
  const dayOfWeek = localDate
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  if (dayOptions.includes(dayOfWeek as DayOfWeek)) {
    return dayOfWeek as DayOfWeek;
  }

  return null;
};

const formatDayLabel = (day: DayOfWeek): string =>
  day.charAt(0).toUpperCase() + day.slice(1);

const isDateAllowedForDays = (date: string, allowedDays: DayOfWeek[]): boolean => {
  const dayFromDate = getDayFromDate(date);
  if (!dayFromDate) return false;
  return allowedDays.includes(dayFromDate);
};

const toInputDate = (value?: string): string => {
  if (!value) return "";
  return value.split("T")[0];
};

const getTodayInputDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const AppointmentBookingForm = ({
  onClose,
  bookedSessions = [],
  appointment,
  onSuccess,
}: {
  onClose: () => void;
  bookedSessions?: BookedSession[];
  appointment?: Appointment;
  onSuccess?: () => void;
}) => {
  const membersOptions = useStore((state) => state.membersOptions);
  const { user } = useAuth();

  const membersLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  const { data: availabilityResponse, loading: availabilityLoading } = useFetch(
    api.fetch.fetchStaffAvailabilityStatus
  );

  const {
    data: postResponse,
    error: postError,
    loading: postLoading,
    postData,
  } = usePost(api.post.createAppointmentBooking);
  const {
    data: putResponse,
    error: putError,
    loading: putLoading,
    updateData,
  } = usePut(api.put.updateAppointmentBooking);

  const staffAvailability = useMemo(() => {
    const responseData = availabilityResponse?.data;
    const sourceAvailability = Array.isArray(responseData)
      ? responseData
      : isRecord(responseData)
      ? Array.isArray(responseData.users)
        ? responseData.users
        : Array.isArray(responseData.data)
        ? responseData.data
        : []
      : [];

    if (!Array.isArray(sourceAvailability)) {
      return [];
    }

    const normalizedAvailability = sourceAvailability
      .map((availability) => normalizeAvailability(availability, membersLookup))
      .filter((availability): availability is StaffAvailability => availability !== null);

    const groupedByStaff = normalizedAvailability.reduce<Record<string, StaffAvailability>>(
      (acc, availability) => {
        const existing = acc[availability.staffId];

        if (!existing) {
          acc[availability.staffId] = {
            ...availability,
            bookedSessions: [...(availability.bookedSessions ?? [])],
            timeSlots: [...availability.timeSlots],
          };
          return acc;
        }

        const mergedBookedSessions = [
          ...(existing.bookedSessions ?? []),
          ...(availability.bookedSessions ?? []),
        ].reduce<BookedSession[]>((sessions, session) => {
          const exists = sessions.some(
            (existingSession) =>
              toInputDate(existingSession.date) === toInputDate(session.date) &&
              existingSession.start === session.start &&
              existingSession.end === session.end &&
              existingSession.staffId === session.staffId
          );

          if (!exists) {
            sessions.push(session);
          }

          return sessions;
        }, []);

        const mergedSlots = [...existing.timeSlots];
        availability.timeSlots.forEach((slot) => {
          const exists = mergedSlots.some(
            (existingSlot) =>
              existingSlot.day === slot.day &&
              existingSlot.startTime === slot.startTime &&
              existingSlot.endTime === slot.endTime
          );

          if (!exists) {
            mergedSlots.push(slot);
          }
        });

        acc[availability.staffId] = {
          ...existing,
          staffName: availability.staffName || existing.staffName,
          position: availability.position || existing.position,
          role: availability.role || existing.role,
          maxBookingsPerSlot:
            availability.maxBookingsPerSlot || existing.maxBookingsPerSlot,
          bookedSessions: mergedBookedSessions,
          timeSlots: mergedSlots,
        };
        return acc;
      },
      {}
    );

    return Object.values(groupedByStaff).filter(
      (availability) => availability.timeSlots.length > 0
    );
  }, [availabilityResponse, membersLookup]);

  const initialValues: BookingFormValues = {
    fullName: appointment?.fullName ?? user?.name ?? "",
    email: appointment?.email ?? user?.email ?? "",
    phone: appointment?.phone ?? user?.phone ?? "",
    purpose: appointment?.purpose ?? "",
    note: appointment?.note ?? "",
    staffId: (appointment?.staffId || appointment?.attendeeId) ?? "",
    date: toInputDate(appointment?.date),
    session: appointment?.session ?? undefined,
  };

  useEffect(() => {
    if (!postResponse) return;

    showNotification("Appointment booked successfully.", "success", "Appointment");
    onSuccess?.();
    onClose();
  }, [onClose, onSuccess, postResponse]);

  useEffect(() => {
    if (!putResponse) return;

    showNotification("Appointment updated successfully.", "success", "Appointment");
    onSuccess?.();
    onClose();
  }, [onClose, onSuccess, putResponse]);

  useEffect(() => {
    if (!postError) return;
    showNotification(postError.message || "Unable to book appointment.", "error");
  }, [postError]);

  useEffect(() => {
    if (!putError) return;
    showNotification(putError.message || "Unable to update appointment.", "error");
  }, [putError]);

  const handleSubmitForm = (values: BookingFormValues) => {
    if (!values.session) {
      showNotification("Please select a time slot.", "error", "Appointment");
      return;
    }

    const loggedInRequesterId = toIntegerId(user?.id);
    const requesterId = appointment?.id
      ? toIntegerId(appointment?.requesterId ?? user?.id)
      : loggedInRequesterId;
    const attendeeId = toIntegerId(values.staffId);
    const bookingDate = toInputDate(values.date);

    if (loggedInRequesterId === null) {
      showNotification("You must be logged in to book an appointment.", "error");
      return;
    }

    if (requesterId === null) {
      showNotification("Unable to identify requester for this booking.", "error");
      return;
    }

    if (attendeeId === null) {
      showNotification(
        "Selected staff member has an invalid id. Please choose another staff member.",
        "error"
      );
      return;
    }

    if (!bookingDate) {
      showNotification("Please select a valid appointment date.", "error");
      return;
    }

    const basePayload: CreateAppointmentBookingPayload = {
      requesterId,
      attendeeId,
      userId: attendeeId,
      staffId: attendeeId,
      date: bookingDate,
      startTime: values.session.start,
      endTime: values.session.end,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      purpose: values.purpose.trim(),
      note: values.note?.trim() || "",
      availabilityId:
        toStringValue(values.session.availabilityId).trim() || undefined,
      sessionId: toStringValue(values.session.id).trim() || undefined,
    };

    if (appointment?.id) {
      const appointmentId = toStringValue(appointment.id).trim();

      if (!appointmentId) {
        showNotification("Unable to identify appointment to update.", "error");
        return;
      }

      const updatePayload: UpdateAppointmentBookingPayload = basePayload;
      updateData(updatePayload, { id: appointmentId });
      return;
    }

    postData(basePayload);
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      validationSchema={validationSchema}
      onSubmit={handleSubmitForm}
    >
      {({
        values,
        errors,
        touched,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        handleSubmit,
      }) => {
        const selectedStaff = staffAvailability.find(
          (staff) => staff.staffId === values.staffId
        );
        const availableDaysForStaff = selectedStaff
          ? Array.from(new Set(selectedStaff.timeSlots.map((slot) => slot.day)))
          : [];

        const selectedDay = values.date ? getDayFromDate(values.date) : null;
        const isSelectedDateAllowed =
          !values.date ||
          availableDaysForStaff.length === 0 ||
          (selectedDay !== null && availableDaysForStaff.includes(selectedDay));

        const slotsForDay =
          selectedStaff &&
          selectedDay &&
          availableDaysForStaff.includes(selectedDay)
            ? selectedStaff.timeSlots.filter((slot) => slot.day === selectedDay)
            : [];

        const staffBookedSessions = [
          ...(selectedStaff?.bookedSessions ?? []),
          ...bookedSessions.filter(
            (bookedSession) => bookedSession.staffId === values.staffId
          ),
        ].reduce<BookedSession[]>((sessions, bookedSession) => {
          const exists = sessions.some(
            (existingSession) =>
              toInputDate(existingSession.date) ===
                toInputDate(bookedSession.date) &&
              existingSession.start === bookedSession.start &&
              existingSession.end === bookedSession.end &&
              existingSession.staffId === bookedSession.staffId
          );

          if (!exists) {
            sessions.push(bookedSession);
          }

          return sessions;
        }, []);

        const sessionError = getIn(errors, "session");
        const sessionTouched = Boolean(getIn(touched, "session"));

        return (
          <Form className="flex h-[80vh] flex-col overflow-hidden">
            <div className="sticky top-0 z-10">
              <FormHeader>
                <p className="text-lg font-semibold">
                  {appointment ? "Edit Appointment" : "Create Appointment"}
                </p>
                <p className="text-sm text-white">
                  {appointment
                    ? "Update appointment details and save your changes"
                    : "Book a new appointment with an available staff member"}
                </p>
              </FormHeader>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
              <Field
                component={FormikInputDiv}
                label="Full Name *"
                name="fullName"
                id="fullName"
                className="w-full"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field
                  component={FormikInputDiv}
                  label="Email Address *"
                  name="email"
                  id="email"
                  className="w-full"
                />

                <Field
                  component={FormikInputDiv}
                  label="Phone Number *"
                  name="phone"
                  id="phone"
                  className="w-full"
                />
              </div>

              <Field
                component={FormikInputDiv}
                label="Appointment Purpose *"
                name="purpose"
                id="purpose"
                className="w-full"
              />

              <Field
                component={FormikInputDiv}
                type="textarea"
                label="Additional Notes"
                name="note"
                id="note"
                className="w-full"
              />

              <Field
                component={FormikSelectField}
                label="Appointment With *"
                name="staffId"
                id="staffId"
                className="w-full"
                options={staffAvailability.map((staff) => ({
                  label: staff.staffName,
                  value: staff.staffId,
                }))}
                onChange={(name: string, value: string | number) => {
                  setFieldValue(name, String(value));
                  setFieldValue("date", "");
                  setFieldValue("session", undefined);
                  setFieldTouched("session", false, false);
                }}
              />

              {availabilityLoading && (
                <div className="text-sm text-muted-foreground">
                  Loading staff availability...
                </div>
              )}

              {selectedStaff && (
                <div className="text-sm bg-muted p-3 rounded break-words">
                  <strong>Availability</strong>
                  {selectedStaff.timeSlots.length === 0 && (
                    <p className="mt-1 text-muted-foreground">
                      No configured availability for this staff member.
                    </p>
                  )}
                  {selectedStaff.timeSlots.map((slot, index) => (
                    <div
                      key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`}
                      className="capitalize"
                    >
                      {slot.day}: {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                </div>
              )}

              <Field
                component={FormikInputDiv}
                type="date"
                label="Appointment Date *"
                name="date"
                id="date"
                min={getTodayInputDate()}
                disabled={!values.staffId}
                className="w-full"
                onChange={(name: string, value: string | number) => {
                  const nextDateValue = String(value);

                  if (
                    selectedStaff &&
                    availableDaysForStaff.length > 0 &&
                    !isDateAllowedForDays(nextDateValue, availableDaysForStaff)
                  ) {
                    setFieldValue(name, "");
                    setFieldError(
                      "date",
                      `Selected staff is only available on ${availableDaysForStaff
                        .map(formatDayLabel)
                        .join(", ")}.`
                    );
                    setFieldTouched("date", true, false);
                    setFieldValue("session", undefined);
                    setFieldTouched("session", false, false);
                    return;
                  }

                  setFieldValue(name, nextDateValue);
                  setFieldError("date", undefined);
                  setFieldValue("session", undefined);
                  setFieldTouched("session", false, false);
                }}
              />
              {selectedStaff && availableDaysForStaff.length > 0 && (
                <p className="text-xs text-gray-600 -mt-2">
                  Available on: {availableDaysForStaff.map(formatDayLabel).join(", ")}
                </p>
              )}
              {!isSelectedDateAllowed && (
                <p className="text-sm text-red-600">
                  Please choose one of the available days for this staff member.
                </p>
              )}

              {values.staffId &&
                values.date &&
                isSelectedDateAllowed &&
                slotsForDay.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="session-options" className="text-sm font-medium">
                    Time Slot *
                  </label>
                  <div
                    id="session-options"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {slotsForDay.flatMap((slot, slotIndex) =>
                      slot.sessions.map((session, sessionIndex) => {
                        const isBookedBySession = staffBookedSessions.some(
                          (booked) =>
                            booked.staffId === values.staffId &&
                            toInputDate(booked.date) === toInputDate(values.date) &&
                            booked.start === session.start &&
                            booked.end === session.end
                        );

                        const isCurrentAppointmentSession =
                          Boolean(appointment?.id) &&
                          toStringValue(
                            appointment?.staffId ?? appointment?.attendeeId
                          ) === values.staffId &&
                          toInputDate(appointment?.date) ===
                            toInputDate(values.date) &&
                          appointment?.session?.start === session.start &&
                          appointment?.session?.end === session.end;

                        const isBooked =
                          isBookedBySession && !isCurrentAppointmentSession;

                        const isSelected =
                          values.session?.start === session.start &&
                          values.session?.end === session.end;

                        return (
                          <button
                            key={`${slot.day}-${slotIndex}-${session.start}-${session.end}-${sessionIndex}`}
                            type="button"
                            disabled={isBooked}
                            className={`border rounded px-3 py-2 text-sm ${
                              isBooked
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isSelected
                                ? "bg-primary text-white"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              if (isBooked) return;
                              setFieldValue("session", session);
                              setFieldTouched("session", true, false);
                            }}
                          >
                            {session.start} - {session.end}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {sessionTouched && typeof sessionError === "string" && (
                    <p className="text-sm text-red-600">{sessionError}</p>
                  )}
                </div>
              )}

              {values.staffId &&
                values.date &&
                !availabilityLoading &&
                isSelectedDateAllowed &&
                slotsForDay.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No available time slots for the selected date.
                  </div>
                )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <Button
                value="Cancel"
                type="button"
                variant="secondary"
                onClick={onClose}
              />
              <Button
                type="submit"
                onClick={()=>handleSubmit}
                loading={postLoading || putLoading}
                value={appointment ? "Update Appointment" : "Book Appointment"}
              />
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default AppointmentBookingForm;
