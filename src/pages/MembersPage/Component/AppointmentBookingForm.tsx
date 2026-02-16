import { Button } from "@/components";
import { Formik, Form, Field, getIn } from "formik";
import * as Yup from "yup";
import { useMemo } from "react";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import {
  Appointment,
  BookedSession,
  BookingFormValues,
  DayOfWeek,
  Session,
  StaffAvailability,
  TimeSlot,
} from "@/utils/api/appointment/interfaces";
import { showNotification } from "@/pages/HomePage/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useStore } from "@/store/useStore";

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

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

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
  const parsed = toStringValue(value).toLowerCase();

  if (dayOptions.includes(parsed as DayOfWeek)) {
    return parsed as DayOfWeek;
  }

  return "monday";
};

const normalizeSession = (session: unknown): Session | null => {
  if (!isRecord(session)) return null;

  const start = toStringValue(session.start ?? session.start_time);
  const end = toStringValue(session.end ?? session.end_time);

  if (!start || !end) return null;

  return {
    start,
    end,
  };
};

const inferDuration = (
  slot: Record<string, unknown>,
  sessions: Session[]
): number => {
  const fromPayload = toNumberValue(
    slot.sessionDurationMinutes ?? slot.session_duration_minutes,
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

  const startTime = toStringValue(slot.startTime ?? slot.start_time);
  const endTime = toStringValue(slot.endTime ?? slot.end_time);

  if (!startTime || !endTime) return null;

  const normalizedSessions = Array.isArray(slot.sessions)
    ? slot.sessions
        .map(normalizeSession)
        .filter((session): session is Session => session !== null)
    : [];

  const sessionDurationMinutes = inferDuration(slot, normalizedSessions);

  return {
    day: normalizeDay(slot.day),
    startTime,
    endTime,
    sessionDurationMinutes,
    sessions:
      normalizedSessions.length > 0
        ? normalizedSessions
        : generateSessions(startTime, endTime, sessionDurationMinutes),
  };
};

const normalizeAvailability = (
  rawAvailability: unknown,
  memberLookup: Record<string, string>
): StaffAvailability | null => {
  if (!isRecord(rawAvailability)) return null;

  const staffRecord = isRecord(rawAvailability.staff) ? rawAvailability.staff : null;

  const staffId = toStringValue(
    rawAvailability.staffId ??
      rawAvailability.staff_id ??
      (staffRecord ? staffRecord.id : undefined)
  );

  if (!staffId) return null;

  const timeSlotsRaw = rawAvailability.timeSlots ?? rawAvailability.time_slots;
  const timeSlots = Array.isArray(timeSlotsRaw)
    ? timeSlotsRaw
        .map(normalizeTimeSlot)
        .filter((slot): slot is TimeSlot => slot !== null)
    : [];

  const staffName =
    toStringValue(
      rawAvailability.staffName ??
        rawAvailability.staff_name ??
        (staffRecord
          ? staffRecord.name ?? staffRecord.fullName ?? staffRecord.full_name
          : undefined)
    ) || memberLookup[staffId] || "Unknown Staff";

  const position = toStringValue(
    rawAvailability.position ??
      (staffRecord ? staffRecord.position ?? staffRecord.title : undefined)
  );

  const role = toStringValue(
    rawAvailability.role ?? (staffRecord ? staffRecord.role : undefined)
  );

  return {
    id: toStringValue(rawAvailability.id) || undefined,
    staffId,
    staffName,
    position,
    role,
    maxBookingsPerSlot: Math.max(
      1,
      toNumberValue(
        rawAvailability.maxBookingsPerSlot ?? rawAvailability.max_bookings_per_slot,
        1
      )
    ),
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
}: {
  onClose: () => void;
  bookedSessions?: BookedSession[];
  appointment?: Appointment;
}) => {
  const membersOptions = useStore((state) => state.membersOptions);

  const membersLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  const { data: availabilityResponse, loading: availabilityLoading } = useFetch(
    api.fetch.fetchStaffAvailability
  );

  const staffAvailability = useMemo(() => {
    if (!Array.isArray(availabilityResponse?.data)) {
      return [];
    }

    return availabilityResponse.data
      .map((availability) => normalizeAvailability(availability, membersLookup))
      .filter((availability): availability is StaffAvailability => availability !== null);
  }, [availabilityResponse, membersLookup]);

  const initialValues: BookingFormValues = {
    fullName: appointment?.fullName ?? "",
    email: appointment?.email ?? "",
    phone: appointment?.phone ?? "",
    purpose: appointment?.purpose ?? "",
    note: appointment?.note ?? "",
    staffId: appointment?.staffId ?? "",
    date: toInputDate(appointment?.date),
    session: appointment?.session ?? undefined,
  };

  const handleSubmitForm = (_values: BookingFormValues) => {
    showNotification(
      appointment
        ? "Appointment updated successfully."
        : "Appointment booked successfully.",
      "success",
      "Appointment"
    );
    onClose();
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
        setFieldTouched,
        handleSubmit,
      }) => {
        const selectedStaff = staffAvailability.find(
          (staff) => staff.staffId === values.staffId
        );

        const selectedDay = values.date ? getDayFromDate(values.date) : null;

        const slotsForDay =
          selectedStaff && selectedDay
            ? selectedStaff.timeSlots.filter((slot) => slot.day === selectedDay)
            : [];

        const sessionError = getIn(errors, "session");
        const sessionTouched = Boolean(getIn(touched, "session"));

        return (
          <Form className="h-[calc(100vh-180px)] flex flex-col overflow-auto">
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
                label="Staff Member *"
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
                  setFieldValue(name, value);
                  setFieldValue("session", undefined);
                  setFieldTouched("session", false, false);
                }}
              />

              {values.staffId && values.date && slotsForDay.length > 0 && (
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
                        const isBooked = bookedSessions.some(
                          (booked) =>
                            booked.staffId === values.staffId &&
                            toInputDate(booked.date) === toInputDate(values.date) &&
                            booked.start === session.start &&
                            booked.end === session.end
                        );

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

              {values.staffId && values.date && !availabilityLoading && slotsForDay.length === 0 && (
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
                onClick={handleSubmit}
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
