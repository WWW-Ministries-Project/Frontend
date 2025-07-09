import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout, FullWidth } from "@/components/ui";
import { Actions } from "@/components/ui/form/Actions";
import { formatInputDate } from "@/utils";
import { Field, Formik } from "formik";
import { useMemo } from "react";
import { date, object, ref, string } from "yup";

interface IProps {
  onClose: () => void;
  onSubmit: (values: ICohortForm) => void;
  loading: boolean;
  cohort?: ICohortForm;
}

export const CohortForm = ({ onClose, cohort, onSubmit, loading }: IProps) => {
  const initial = useMemo(
    () => ({
      ...initialValues,
      ...cohort,
    }),
    [cohort]
  );

  return (
    <div className="bg-white p-6 rounded-lg md:w-[45rem] text-primary space-y-4">
      <div>
        <div className="text-lg font-bold">
          {cohort?.id ? "Edit Cohort" : "Create New Cohort"}
        </div>
        <div className="text-sm mb-4">
          Create or edit a cohort for the program.
        </div>
      </div>

      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values }) => (
          <FormLayout>
            {/* Cohort Name */}
            <FullWidth>
              <Field
                component={FormikInputDiv}
                label="Cohort Name *"
                id="name"
                name="name"
                className="flex-1"
                placeholder="e.g., Spring 2023, Cohort #5"
              />
            </FullWidth>

            {/* Description */}
            <FullWidth>
              <Field
                component={FormikInputDiv}
                label="Description *"
                type="textarea"
                id="description"
                name="description"
                className="flex-1"
                placeholder="Enter cohort description"
              />
            </FullWidth>
            <Field
              component={FormikInputDiv}
              label="Start Date *"
              type="date"
              value={formatInputDate(values?.startDate)}
              placeholderText="Pick a date"
              id="startDate"
              name="startDate"
            />
            <Field
              component={FormikInputDiv}
              label="Duration *"
              id="duration"
              name="duration"
              placeholder="e.g., 8 weeks, 3 months"
            />

            <Field
              component={FormikInputDiv}
              label="Application Deadline *"
              type="date"
              value={formatInputDate(values?.applicationDeadline)}
              placeholderText="Pick a date"
              id="applicationDeadline"
              name="applicationDeadline"
            />

            <Field
              component={FormikSelectField}
              label="Status *"
              options={[
                { value: "Upcoming", label: "Upcoming" },
                { value: "Ongoing", label: "Ongoing" },
                { value: "Completed", label: "Completed" },
              ]}
              id="status"
              name="status"
              placeholder="e.g., Upcoming, Ongoing, Completed"
            />
            <Actions
              onCancel={onClose}
              onSubmit={() => {
                onSubmit(values);
              }}
              loading={loading}
            />
          </FormLayout>
        )}
      </Formik>
    </div>
  );
};
export interface ICohortForm {
  id?: number;
  name: string;
  duration: string;
  description: string;
  startDate: string;
  applicationDeadline: string;
  status: string;
}
const initialValues: ICohortForm = {
  name: "",
  duration: "",
  description: "",
  startDate: "",
  applicationDeadline: "",
  status: "Upcoming",
};
const validationSchema = object({
  name: string().required("Cohort name is required"),
  duration: string().required("Duration is required"),
  description: string().required("Description is required"),
  startDate: date().required("Start date is required"),
  applicationDeadline: date()
    .required("Application deadline is required")
    .max(
      ref("startDate"),
      "Application deadline must be before the cohort start date"
    ),
  status: string().required("Status is required"),
});
