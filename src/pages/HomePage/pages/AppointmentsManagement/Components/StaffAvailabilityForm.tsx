import { useEffect } from "react";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import {
  CreateStaffAvailabilityPayload,
  DayOfWeek,
  TimeSlot,
} from "@/utils/api/appointment/interfaces";

export interface IStaffAvailabilityForm {
  id?: string;
  staffId: string;
  maxBookingsPerSlot: number;
  timeSlots: TimeSlot[];
  currentSlot: TimeSlot;
  timeSlotsError?: string;
}

const initialValues: IStaffAvailabilityForm = {
  staffId: "",
  maxBookingsPerSlot: 3,
  timeSlots: [],
  currentSlot: {
    day: "monday",
    startTime: "09:00",
    endTime: "12:00",
    sessionDurationMinutes: 30,
    sessions: [],
  },
  timeSlotsError: undefined,
};

const validationSchema = Yup.object({
  staffId: Yup.string().required("Staff is required"),
  maxBookingsPerSlot: Yup.number()
    .typeError("Max bookings per slot must be a number")
    .integer("Max bookings per slot must be a whole number")
    .min(1, "Max bookings per slot must be at least 1")
    .required("Max bookings per slot is required"),
  timeSlots: Yup.array()
    .of(
      Yup.object({
        day: Yup.string().required(),
        startTime: Yup.string().required(),
        endTime: Yup.string().required(),
        sessionDurationMinutes: Yup.number().min(1).required(),
      })
    )
    .min(1, "At least one time slot is required"),
});

const normalizeClockTime = (value: string): string => {
  const raw = value.trim().toUpperCase();
  if (!raw) return "";

  const match = raw.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return "";

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes > 59) {
    return "";
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return "";
    if (meridiem === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours > 23) {
    return "";
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatTimeWithMeridiem = (value: string): string => {
  const normalized = normalizeClockTime(value);
  if (!normalized) return value;

  const [hourText, minuteText] = normalized.split(":");
  const hour = Number(hourText);
  const meridiem = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText} ${meridiem}`;
};

const timeToMinutes = (time: string) => {
  const normalized = normalizeClockTime(time);
  if (!normalized) return 0;

  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const generateSessions = (
  startTime: string,
  endTime: string,
  duration: number
) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  const sessions: { start: string; end: string }[] = [];
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

const hasOverlappingSessions = (newSlot: TimeSlot, existingSlots: TimeSlot[]) => {
  const newSessions = newSlot.sessions;

  return existingSlots.some((slot) => {
    if (slot.day !== newSlot.day) return false;

    return slot.sessions.some((existing) =>
      newSessions.some(
        (current) =>
          timeToMinutes(current.start) < timeToMinutes(existing.end) &&
          timeToMinutes(current.end) > timeToMinutes(existing.start)
      )
    );
  });
};

interface StaffAvailabilityFormProps {
  availability?: IStaffAvailabilityForm;
  onClose?: () => void;
  onSuccess?: () => void;
  loading?: boolean;
}

const StaffAvailabilityFormComponent = ({
  availability,
  onClose,
  onSuccess,
  loading,
}: StaffAvailabilityFormProps) => {
  const membersOptions = useStore((state) => state.membersOptions);

  const {
    data: postResponse,
    error: postError,
    loading: postLoading,
    postData,
  } = usePost(api.post.createStaffAvailability);
  const {
    data: putResponse,
    error: putError,
    loading: putLoading,
    updateData,
  } = usePut(api.put.updateStaffAvailability);

  useEffect(() => {
    if (!postResponse) return;

    showNotification("Availability created successfully", "success");
    onSuccess?.();
    onClose?.();
  }, [onClose, onSuccess, postResponse]);

  useEffect(() => {
    if (!putResponse) return;

    showNotification("Availability updated successfully", "success");
    onSuccess?.();
    onClose?.();
  }, [onClose, onSuccess, putResponse]);

  useEffect(() => {
    if (!postError) return;
    showNotification(postError.message || "Unable to save availability", "error");
  }, [postError]);

  useEffect(() => {
    if (!putError) return;
    showNotification(putError.message || "Unable to update availability", "error");
  }, [putError]);

  const handleSubmitForm = (values: IStaffAvailabilityForm) => {
    const normalizedTimeSlots = values.timeSlots
      .map((slot) => {
        const startTime = normalizeClockTime(slot.startTime);
        const endTime = normalizeClockTime(slot.endTime);

        if (!startTime || !endTime) {
          return null;
        }

        const normalizedSessions = slot.sessions
          .map((session) => {
            const start = normalizeClockTime(session.start);
            const end = normalizeClockTime(session.end);

            if (!start || !end) return null;

            return {
              start,
              end,
            };
          })
          .filter(
            (
              session
            ): session is {
              start: string;
              end: string;
            } => session !== null
          );

        return {
          ...slot,
          startTime,
          endTime,
          sessions: normalizedSessions,
        };
      })
      .filter((slot): slot is TimeSlot => slot !== null);

    const payload: CreateStaffAvailabilityPayload = {
      userId: values.staffId,
      maxBookingsPerSlot: Number(values.maxBookingsPerSlot),
      timeSlots: normalizedTimeSlots,
    };

    if (values.id) {
      updateData(payload, { id: values.id });
      return;
    }

    postData(payload);
  };

  const addTimeSlot = (
    values: IStaffAvailabilityForm,
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const { day, startTime, endTime, sessionDurationMinutes } = values.currentSlot;
    const normalizedStartTime = normalizeClockTime(startTime);
    const normalizedEndTime = normalizeClockTime(endTime);
    const duration = Number(sessionDurationMinutes);

    if (!normalizedStartTime || !normalizedEndTime) {
      setFieldValue(
        "timeSlotsError",
        "Please enter valid start and end time values."
      );
      return;
    }

    if (timeToMinutes(normalizedStartTime) >= timeToMinutes(normalizedEndTime)) {
      setFieldValue(
        "timeSlotsError",
        "End time must be later than start time."
      );
      return;
    }

    if (!duration || duration <= 0) {
      setFieldValue("timeSlotsError", "Session duration must be greater than zero.");
      return;
    }

    const sessions = generateSessions(normalizedStartTime, normalizedEndTime, duration);

    if (sessions.length === 0) {
      setFieldValue(
        "timeSlotsError",
        "Session duration is too long for the selected time range."
      );
      return;
    }

    const slot: TimeSlot = {
      day: day as DayOfWeek,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      sessionDurationMinutes: duration,
      sessions,
    };

    if (hasOverlappingSessions(slot, values.timeSlots)) {
      setFieldValue(
        "timeSlotsError",
        "This time slot overlaps with an existing slot for the same day. Please adjust the time range."
      );
      return;
    }

    setFieldValue("timeSlots", [...values.timeSlots, slot]);
    setFieldValue("timeSlotsError", undefined);

    setFieldValue("currentSlot", {
      day: "monday",
      startTime: "09:00",
      endTime: "12:00",
      sessionDurationMinutes: 30,
      sessions: [],
    });
  };

  const removeTimeSlot = (
    index: number,
    values: IStaffAvailabilityForm,
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    setFieldValue(
      "timeSlots",
      values.timeSlots.filter((_, i) => i !== index)
    );
    setFieldValue("timeSlotsError", undefined);
  };

  const removeSession = (
    slotIndex: number,
    sessionIndex: number,
    values: IStaffAvailabilityForm,
    setFieldValue: (field: string, value: unknown) => void
  ) => {
    const updatedSlots = values.timeSlots
      .map((slot, i) => {
        if (i !== slotIndex) return slot;

        const updatedSessions = slot.sessions.filter((_, sIdx) => sIdx !== sessionIndex);

        if (updatedSessions.length === 0) {
          return null;
        }

        return {
          ...slot,
          sessions: updatedSessions,
        };
      })
      .filter((slot): slot is TimeSlot => slot !== null);

    setFieldValue("timeSlots", updatedSlots);
    setFieldValue("timeSlotsError", undefined);
  };

  return (
    <Formik
      initialValues={availability ?? initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSubmitForm}
    >
      {({ handleSubmit, values, setFieldValue, errors, submitCount }) => (
        <Form className="flex h-[80vh] flex-col overflow-hidden">
          <div className="sticky top-0 z-10">
            <FormHeader>
              <p className="text-lg font-semibold">
                {availability ? "Edit Staff Availability" : "Create Staff Availability"}
              </p>
              <p className="text-sm text-white">
                {availability
                  ? "Update staff availability details"
                  : "Fill in the details to create staff availability"}
              </p>
            </FormHeader>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
            <Field
              component={FormikSelectField}
              label="Attendee *"
              id="staffId"
              name="staffId"
              searchable
              options={membersOptions}
            />

            <Field
              component={FormikInputDiv}
              label="Maximum Bookings per Slot *"
              name="maxBookingsPerSlot"
              id="maxBookingsPerSlot"
              type="number"
              min="1"
              placeholder="3"
            />

            <hr />

            <p className="font-semibold mt-2">Add Time Slot</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                component={FormikSelectField}
                label="Day *"
                id="currentSlot.day"
                name="currentSlot.day"
                options={[
                  { label: "Monday", value: "monday" },
                  { label: "Tuesday", value: "tuesday" },
                  { label: "Wednesday", value: "wednesday" },
                  { label: "Thursday", value: "thursday" },
                  { label: "Friday", value: "friday" },
                  { label: "Saturday", value: "saturday" },
                  { label: "Sunday", value: "sunday" },
                ]}
              />

              <Field
                component={FormikSelectField}
                label="Session Duration (minutes) *"
                id="currentSlot.sessionDurationMinutes"
                name="currentSlot.sessionDurationMinutes"
                options={[
                  { label: "15 min", value: 15 },
                  { label: "20 min", value: 20 },
                  { label: "30 min", value: 30 },
                  { label: "45 min", value: 45 },
                  { label: "60 min", value: 60 },
                ]}
              />

              <Field
                component={FormikInputDiv}
                label="Start Time *"
                name="currentSlot.startTime"
                id="currentSlot.startTime"
                type="time"
              />
              {values.currentSlot.startTime && (
                <p className="-mt-2 text-xs text-gray-500">
                  Selected: {formatTimeWithMeridiem(values.currentSlot.startTime)}
                </p>
              )}

              <Field
                component={FormikInputDiv}
                label="End Time *"
                name="currentSlot.endTime"
                id="currentSlot.endTime"
                type="time"
              />
              {values.currentSlot.endTime && (
                <p className="-mt-2 text-xs text-gray-500">
                  Selected: {formatTimeWithMeridiem(values.currentSlot.endTime)}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Displayed in 12-hour format (AM/PM). Backend payload is submitted as
              24-hour format (`HH:mm`).
            </p>

            <Button
              type="button"
              value="Add Time Slot"
              onClick={() => addTimeSlot(values, setFieldValue)}
            />

            {values.timeSlotsError && (
              <p className="text-sm text-red-600 mt-2">{values.timeSlotsError}</p>
            )}
            {!values.timeSlotsError &&
              submitCount > 0 &&
              typeof errors.timeSlots === "string" && (
                <p className="text-sm text-red-600 mt-2">{errors.timeSlots}</p>
              )}

            {values.timeSlots.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-semibold">Configured Time Slots</p>
                {values.timeSlots.map((slot, index) => (
                  <div
                    key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`}
                    className="flex justify-between items-center border rounded px-3 py-2"
                  >
                    <div className="text-sm capitalize">
                      <p>
                        {slot.day} · {formatTimeWithMeridiem(slot.startTime)} –{" "}
                        {formatTimeWithMeridiem(slot.endTime)} ·{" "}
                        {slot.sessionDurationMinutes} min
                      </p>
                      <div className="mt-1 text-xs text-gray-600">
                        {slot.sessions.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center mr-2 mb-1 px-2 py-1 border rounded text-xs"
                          >
                            {formatTimeWithMeridiem(s.start)}–
                            {formatTimeWithMeridiem(s.end)}
                            <button
                              type="button"
                              className="ml-1 text-red-600 font-bold"
                              aria-label={`Remove session ${formatTimeWithMeridiem(
                                s.start
                              )} to ${formatTimeWithMeridiem(s.end)}`}
                              onClick={() =>
                                removeSession(index, sIdx, values, setFieldValue)
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      value="Remove"
                      onClick={() => removeTimeSlot(index, values, setFieldValue)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
            {onClose && (
              <Button
                variant="secondary"
                type="button"
                value="Cancel"
                onClick={onClose}
              />
            )}

            <Button
              variant="primary"
              type="submit"
              onClick={handleSubmit}
              loading={loading || postLoading || putLoading}
              value={availability ? "Save Changes" : "Create Availability"}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export const StaffAvailabilityForm = Object.assign(StaffAvailabilityFormComponent, {
  initialValues,
  validationSchema,
});

export default StaffAvailabilityForm;
