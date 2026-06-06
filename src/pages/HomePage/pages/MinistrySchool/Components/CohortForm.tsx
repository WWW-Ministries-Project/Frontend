import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import { Actions } from "@/components/ui/form/Actions";
import { BranchSelectField } from "@/components/BranchSelectField";
import { useBranchStore, ALL_BRANCHES } from "@/store/useBranchStore";
import { COHORT_STATUS, COHORT_STATUS_VALUES, CohortStatus, formatInputDate } from "@/utils";
import { Field, Formik } from "formik";
import { useEffect, useMemo } from "react";
import { date, number, object, ref, string } from "yup";
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
  const { activeBranchId } = useBranchStore();
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
    if (activeBranchId === ALL_BRANCHES && !values.branch_id) return;
    const branchPayload = values.branch_id !== "" ? { branch_id: values.branch_id } : {};
    if (cohort?.id) {
      updateCohort(
        {
          ...values,
          ...branchPayload,
          id: cohort.id,
          programId,
        },
        { id: String(cohort.id) }
      );
    } else {
      postCohort({ ...values, ...branchPayload, programId });
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
        {({ values, submitForm, setFieldValue, errors }) => (
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
            <FullWidth>
              <BranchSelectField
                value={values.branch_id}
                onChange={(v) => setFieldValue("branch_id", v)}
                required
                error={typeof errors.branch_id === "string" ? errors.branch_id : undefined}
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
              options={COHORT_STATUS_VALUES.map((status) => ({
                value: status,
                label: status,
              }))}
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
  status: CohortStatus;
  branch_id: number | "";
}
const initialValues: ICohortForm = {
  name: "",
  duration: "",
  description: "",
  startDate: "",
  applicationDeadline: "",
  status: COHORT_STATUS.UPCOMING,
  branch_id: "",
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
  branch_id: number().when([], {
    is: () => useBranchStore.getState().activeBranchId === ALL_BRANCHES,
    then: (schema) => schema.required("Branch is required"),
    otherwise: (schema) => schema.optional(),
  }),
});
