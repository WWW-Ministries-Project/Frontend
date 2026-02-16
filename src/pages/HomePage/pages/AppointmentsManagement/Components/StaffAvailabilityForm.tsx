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

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
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
    const payload: CreateStaffAvailabilityPayload = {
      userId: values.staffId,
      maxBookingsPerSlot: Number(values.maxBookingsPerSlot),
      timeSlots: values.timeSlots,
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
    const duration = Number(sessionDurationMinutes);

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
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

    const sessions = generateSessions(startTime, endTime, duration);

    if (sessions.length === 0) {
      setFieldValue(
        "timeSlotsError",
        "Session duration is too long for the selected time range."
      );
      return;
    }

    const slot: TimeSlot = {
      day: day as DayOfWeek,
      startTime,
      endTime,
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
        <Form className="h-[calc(100vh-180px)] flex flex-col overflow-auto">
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
              label="Staff Member *"
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

              <Field
                component={FormikInputDiv}
                label="End Time *"
                name="currentSlot.endTime"
                id="currentSlot.endTime"
                type="time"
              />
            </div>

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
                        {slot.day} · {slot.startTime} – {slot.endTime} · {slot.sessionDurationMinutes} min
                      </p>
                      <div className="mt-1 text-xs text-gray-600">
                        {slot.sessions.map((s, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center mr-2 mb-1 px-2 py-1 border rounded text-xs"
                          >
                            {s.start}–{s.end}
                            <button
                              type="button"
                              className="ml-1 text-red-600 font-bold"
                              aria-label={`Remove session ${s.start} to ${s.end}`}
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
