import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import { Actions } from "@/components/ui/form/Actions";
import { formatInputDate } from "@/utils";
import { Field, Formik } from "formik";
import { useEffect, useMemo } from "react";
import { date, object, ref, string } from "yup";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { api } from "@/utils";

interface IProps {
  onClose: () => void;
  cohort?: ICohortForm;
  programId: number;
  onSuccess?: () => void;
}

export const CohortForm = ({ onClose, cohort, programId, onSuccess }: IProps) => {
  const initial = useMemo(
    () => ({
      ...initialValues,
      ...cohort,
    }),
    [cohort]
  );

  const {
    postData: postCohort,
    loading: postLoading,
    data: postedData,
  } = usePost(api.post.createCohort);
  const {
    updateData: updateCohort,
    loading: updateLoading,
    data: updatedData,
  } = usePut(api.put.updateCohort);
  const loading = postLoading || updateLoading;
  
  const handleSubmit = (values: ICohortForm) => {
    if (!programId || Number.isNaN(programId)) return;
    if (cohort?.id) {
      updateCohort(
        {
          ...values,
          id: cohort.id,
          programId,
        },
        { id: String(cohort.id) }
      );
    } else {
      postCohort({ ...values, programId });
    }
  };
  
  useEffect(() => {
    if (updatedData || postedData) {
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [updatedData, postedData, onSuccess]);

  return (
    <div className="bg-white  rounded-lg md:w-[45rem] text-primary space-y-4">
      

      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, submitForm }) => (
          <div>
            <div className="sticky top-0 z-10">
                <FormHeader>
                  <p className="text-lg font-semibold">{cohort?.id ? "Edit Cohort" : "Create New Cohort"}</p>
                  <p className="text-sm text-white">
                    Create or edit a cohort for the program.
                  </p>
                </FormHeader>
                
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
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
              onSubmit={submitForm}
              loading={loading}
            />
          </FormLayout>
          </div>
          </div>
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
