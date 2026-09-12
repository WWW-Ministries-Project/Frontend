import { Button } from "@/components";
import { BranchSelectField } from "@/components/BranchSelectField";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import { EventType } from "@/utils";
import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { mixed, number, object, string } from "yup";

interface IProps {
  closeModal: () => void;
  handleMutate: (value: EventType) => Promise<void>;
  loading: boolean;
  editData: EventType | null;
}

const EventTypeOptions: ISelectOption[] = [
  { label: "Activity", value: "ACTIVITY" },
  { label: "Program", value: "PROGRAM" },
  { label: "Service", value: "SERVICE" },
  { label: "Other", value: "OTHER" },
];

const EVENT_CATEGORIES = ["WEEKLY", "SPECIAL"] as const;

const eventTypeLabel = (eventType: string) =>
  EventTypeOptions.find((option) => option.value === eventType)?.label ?? "";

/**
 * Category labels read against the chosen event type — WEEKLY + SERVICE shows
 * as "Weekly Service". Only the enum value is sent to the API, so the label
 * stays correct if the event type is later changed.
 */
const buildCategoryOptions = (eventType: string): ISelectOption[] => {
  const typeLabel = eventTypeLabel(eventType);

  return EVENT_CATEGORIES.map((category) => {
    const prefix = category === "WEEKLY" ? "Weekly" : "Special";

    return {
      label: typeLabel ? `${prefix} ${typeLabel}` : prefix,
      value: category,
    };
  });
};

/** 0-6 matching Date.getDay(), the convention the events recurrence picker uses. */
const WeekdayOptions: ISelectOption<number>[] = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

/** True when the end time is earlier than the start time (runs past midnight). */
const crossesMidnight = (
  startTime?: string | null,
  endTime?: string | null
): boolean => {
  if (!startTime || !endTime) return false;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return false;
  return eh * 60 + em < sh * 60 + sm;
};

const initialValues: EventType = {
  event_name: "",
  event_type: "",
  event_description: "",
  event_category: "",
  schedule_day: "",
  schedule_start_time: "",
  schedule_end_time: "",
  id: "",
  branch_id: "",
};

const buildValidationSchema = (activeBranchId: string | number) =>
  object().shape({
    event_name: string()
      .required("Event name is required")
      .min(3, "Name must be at least 3 characters"),
    event_type: string().required("Event type is required"),
    event_category: string()
      .oneOf([...EVENT_CATEGORIES, ""], "Select a valid category")
      .required("Event category is required"),
    schedule_day: number()
      .typeError("Select a day of the week")
      .min(0)
      .max(6)
      .required("Day of the week is required"),
    schedule_start_time: string().required("Start time is required"),
    schedule_end_time: string().required("End time is required"),
    event_description: string().required("Event description is required"),
    branch_id:
      activeBranchId === ALL_BRANCHES
        ? mixed()
            .required("Branch is required")
            .test("branch-selected", "Branch is required", (v) => v !== "" && v !== undefined && v !== null)
        : mixed().nullable(),
  });

const EventForm = ({ closeModal, handleMutate, loading, editData }: IProps) => {
  const { activeBranchId } = useBranchStore();
  const initial: EventType = useMemo(
    () =>
      editData
        ? {
            ...editData,
            branch_id: editData.branch_id ?? "",
            event_category: editData.event_category ?? "",
            schedule_day: editData.schedule_day ?? "",
            schedule_start_time: editData.schedule_start_time ?? "",
            schedule_end_time: editData.schedule_end_time ?? "",
          }
        : initialValues,
    [editData]
  );
  const formTitle = editData?.id ? "Update Event" : "Create Event";
  const formSubtitle = editData?.id
    ? "Review and update this event record."
    : "Add a new event to your system";

  return (
    <div className="text-primary">
      <div className="sticky top-0 w-full bg-primary p-4 px-6">
        <div className="text-white text-xl font-bold">
          {formTitle}
          <p className="text-sm font-normal text-white/80">{formSubtitle}</p>
        </div>
      </div>

      <div className="p-4 px-6 overflow-auto">
        <Formik
          initialValues={initial}
          validationSchema={buildValidationSchema(activeBranchId)}
          onSubmit={async (values) => {
            await handleMutate(values);
          }}
          enableReinitialize
        >
          {(form) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                <Field
                  component={FormikInputDiv}
                  name="event_name"
                  label="Event name *"
                  id="event_name"
                  placeholder="Enter the name of the event"
                  className="w-full"
                />

                <Field
                  component={FormikSelectField}
                  label="Event type *"
                  options={EventTypeOptions}
                  id="event_type"
                  name="event_type"
                  placeholder="Select event type"
                />

                <Field
                  component={FormikSelectField}
                  label="Category *"
                  options={buildCategoryOptions(form.values.event_type)}
                  id="event_category"
                  name="event_category"
                  placeholder={
                    form.values.event_type
                      ? "Select category"
                      : "Select an event type first"
                  }
                  disabled={!form.values.event_type}
                />

                <BranchSelectField
                  value={form.values.branch_id ?? ""}
                  onChange={(v) => form.setFieldValue("branch_id", v)}
                  required
                  error={
                    form.touched.branch_id || form.submitCount > 0
                      ? (form.errors.branch_id as string | undefined)
                      : undefined
                  }
                />
              </div>

              <div>
                <p className="text-sm font-medium text-primary">
                  Event schedule *
                </p>
                <p className="text-xs text-primaryGray">
                  The day and time this event normally runs.
                </p>
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field
                    component={FormikSelectField}
                    label="Day of the week"
                    options={WeekdayOptions}
                    id="schedule_day"
                    name="schedule_day"
                    placeholder="Select day"
                  />
                  <Field
                    component={FormikInputDiv}
                    label="Start time"
                    type="time"
                    id="schedule_start_time"
                    name="schedule_start_time"
                    value={form.values.schedule_start_time ?? ""}
                  />
                  <Field
                    component={FormikInputDiv}
                    label="End time"
                    type="time"
                    id="schedule_end_time"
                    name="schedule_end_time"
                    value={form.values.schedule_end_time ?? ""}
                  />
                </div>
                {crossesMidnight(
                  form.values.schedule_start_time,
                  form.values.schedule_end_time
                ) && (
                  <p className="mt-2 text-xs text-primaryGray">
                    End time is before the start time — this event is treated as
                    running past midnight.
                  </p>
                )}
              </div>

              <Field
                component={FormikInputDiv}
                name="event_description"
                label="Event description *"
                id="event_description"
                placeholder="Enter a short description about the event"
                className="w-full"
                type="textarea"
                col={50}
              />

              <div className="sticky bottom-0 border-t border-lightGray">
                <div className="flex justify-end gap-2 border-lightGray bg-white/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                  <Button
                    value={editData?.id ? "Update" : "Save"}
                    variant="primary"
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  />
                  <Button
                    value="Cancel"
                    variant="secondary"
                    onClick={closeModal}
                  />
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EventForm;
