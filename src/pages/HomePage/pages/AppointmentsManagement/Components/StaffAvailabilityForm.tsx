import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import  FormikSelectField  from "@/components/FormikSelect";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useStore } from "@/store/useStore";

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
  sessions: {
    start: string;
    end: string;
  }[];
}

export interface IStaffAvailabilityForm {
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
//   timeSlots: Yup.array()
//     .of(
//       Yup.object({
//         day: Yup.string().required(),
//         startTime: Yup.string().required(),
//         endTime: Yup.string().required(),
//         sessionDurationMinutes: Yup.number().min(1).required(),
//       })
//     )
//     .min(1, "At least one time slot is required"),
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

const hasOverlappingSessions = (
  newSlot: TimeSlot,
  existingSlots: TimeSlot[]
) => {
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
  membersOptions?: {
    label: string;
    value: string;
    meta?: {
      id: string;
      fullName: string;
      email: string;
      position: string;
    };
  }[];
  onClose?: () => void;
  loading?: boolean;
}

const StaffAvailabilityFormComponent = ({
  availability,
  onClose,
  loading,
}: StaffAvailabilityFormProps) => {
  const handleSubmitForm = (values: IStaffAvailabilityForm) => {
    console.log(values);
    
    const {
      staffId,
      maxBookingsPerSlot,
      timeSlots,
      currentSlot,
    } = values;

    const payload = {
      staffId,
      maxBookingsPerSlot,
      timeSlots,
      currentSlot,
    };

    if (availability) {
      console.log("Updating staff availability", payload);
    } else {
      console.log("Creating staff availability", payload);
    }
  };

  const {
        data,
        refetch: fetchAMembers,
        loading: memberLoading,
      } = useFetch(api.fetch.fetchAMember, {}, true);
      const memberData = data?.data || null;
      const membersOptions = useStore((state) => state.membersOptions);
      console.log("members", membersOptions);
      console.log("full member data", memberData);
      
      

  const addTimeSlot = (values: IStaffAvailabilityForm, setFieldValue: any) => {
    const { day, startTime, endTime, sessionDurationMinutes } =
      values.currentSlot;

    const duration = Number(sessionDurationMinutes);

    const sessions = generateSessions(
      startTime,
      endTime,
      duration
    );

    const slot: TimeSlot = {
      day,
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

  const removeTimeSlot = (index: number, values: IStaffAvailabilityForm, setFieldValue: any) => {
    setFieldValue(
      "timeSlots",
      values.timeSlots.filter((_, i) => i !== index)
    );
  };

  const removeSession = (
    slotIndex: number,
    sessionIndex: number,
    values: IStaffAvailabilityForm,
    setFieldValue: any
  ) => {
    const updatedSlots = values.timeSlots.map((slot, i) => {
      if (i !== slotIndex) return slot;

      return {
        ...slot,
        sessions: slot.sessions.filter((_, sIdx) => sIdx !== sessionIndex),
      };
    });

    setFieldValue("timeSlots", updatedSlots);
  };

  return (
    <Formik
      initialValues={availability ?? initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSubmitForm}
    >
      {({ handleSubmit, values, setFieldValue }) => (
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
              label="Staff *"
              id="staffId"
              name="staffId"
              searchable
              options={membersOptions}
            />

            <Field
              component={FormikInputDiv}
              label="Max Bookings Per Slot *"
              name="maxBookingsPerSlot"
              id="maxBookingsPerSlot"
              type="number"
              placeholder="3"
            />

            <hr />

            <p className="font-semibold mt-2">Add Time Slot</p>

            <div className="grid grid-cols-2 gap-4">
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
                label="Start Time"
                name="currentSlot.startTime"
                id="currentSlot.startTime"
                type="time"
              />

              <Field
                component={FormikInputDiv}
                label="End Time"
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
              <p className="text-sm text-red-600 mt-2">
                {values.timeSlotsError}
              </p>
            )}

            {values.timeSlots.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-semibold">Added Time Slots</p>
                {values.timeSlots.map((slot, index) => (
                  <div
                    key={index}
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
                onClick={handleSubmit}
              loading={loading}
              value={availability ? "Save Changes" : "Create Availability"}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export const StaffAvailabilityForm = Object.assign(
  StaffAvailabilityFormComponent,
  {
    initialValues,
    validationSchema,
  }
);

export default StaffAvailabilityForm;