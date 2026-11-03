import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import MultiSelect from "@/components/MultiSelect";
import { FormHeader, ProgressStepper } from "@/components/ui";
import { BranchSelectField } from "@/components/BranchSelectField";
import { useBranchStore, ALL_BRANCHES } from "@/store/useBranchStore";
import type {
  GradingMode,
  ProgramResponse,
} from "@/utils/api/ministrySchool/interfaces";
import { Field, Form, Formik } from "formik";
import { array, boolean, mixed, object, number, string } from "yup";
import { ChangeEvent, useMemo, useState } from "react";
import { isLmsFeatureEnabled } from "../utils/lmsGuardrails";

interface IProps {
  onClose: () => void;
  program?: ProgramResponse;
  prerequisitesDropdown: { label: string; value: string }[];
  handleSubmit: (value: IProgramForm) => void;
  loading: boolean;
}

type ProgramStep = "details" | "eligibility" | "review";

const PROGRAM_STEPS: { id: ProgramStep; label: string; description: string }[] = [
  {
    id: "details",
    label: "Details",
    description: "Title, overview, grading and branch",
  },
  {
    id: "eligibility",
    label: "Eligibility & enrollment",
    description: "Who can join and how they enroll",
  },
  {
    id: "review",
    label: "Review",
    description: "Confirm and save as a draft",
  },
];

const GRADING_OPTIONS: { value: GradingMode; label: string }[] = [
  { value: "PASS_FAIL", label: "Pass / fail per unit" },
  { value: "WEIGHTED", label: "Weighted scores" },
];

const gradingLabel = (mode: GradingMode) =>
  GRADING_OPTIONS.find((option) => option.value === mode)?.label ?? mode;

const ProgramFormComponent = ({
  onClose,
  program,
  prerequisitesDropdown,
  loading,
  handleSubmit,
}: IProps) => {
  const [activeStep, setActiveStep] = useState<ProgramStep>("details");
  const guidedFlowEnabled = isLmsFeatureEnabled("guided_forms");

  const initial: IProgramForm = useMemo(
    () =>
      program
        ? {
            title: program.title,
            description: program.description,
            grading_mode: program.grading_mode ?? "PASS_FAIL",
            member_required: program.member_required,
            leader_required: program.leader_required,
            ministry_required: program.ministry_required,
            auto_enroll: program.auto_enroll ?? true,
            prerequisites: program.prerequisitePrograms.map((prerequisite) =>
              String(prerequisite.id)
            ),
            isPrerequisitesChecked: program.prerequisitePrograms.length > 0,
            branch_id: "",
          }
        : initialValues,
    [program]
  );

  const activeIndex = PROGRAM_STEPS.findIndex((step) => step.id === activeStep);

  const markStepTouched = (
    step: ProgramStep,
    setTouched: (
      touched: Record<string, boolean>,
      shouldValidate?: boolean
    ) => void
  ) => {
    const touched: Record<string, boolean> = {};

    if (step === "details") {
      touched.title = true;
      touched.description = true;
    }

    if (step === "eligibility") {
      touched.isPrerequisitesChecked = true;
      touched.prerequisites = true;
    }

    setTouched(touched, true);
  };

  const hasStepErrors = (
    step: ProgramStep,
    errors: Record<string, unknown>,
    values: IProgramForm
  ) => {
    if (step === "details") {
      return Boolean(errors.title || errors.description || errors.branch_id);
    }

    if (step === "eligibility") {
      return Boolean(values.isPrerequisitesChecked && errors.prerequisites);
    }

    return false;
  };

  return (
    <Formik
      initialValues={initial}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        const normalizedPrerequisites = values.isPrerequisitesChecked
          ? values.prerequisites.filter(Boolean)
          : [];

        handleSubmit({
          ...values,
          prerequisites: normalizedPrerequisites,
        });
      }}
      enableReinitialize
    >
      {({ values, setFieldValue, submitForm, validateForm, setTouched, errors }) => {
        const goToNextStep = async () => {
          markStepTouched(activeStep, setTouched);
          const validationErrors = await validateForm();
          if (
            hasStepErrors(activeStep, validationErrors as Record<string, unknown>, values)
          ) {
            return;
          }

          const nextStep = PROGRAM_STEPS[activeIndex + 1];
          if (nextStep) {
            setActiveStep(nextStep.id);
          }
        };

        const goToPreviousStep = () => {
          const previousStep = PROGRAM_STEPS[activeIndex - 1];
          if (previousStep) {
            setActiveStep(previousStep.id);
          }
        };

        const audienceLabel =
          [
            values.member_required ? "Members" : null,
            values.leader_required ? "Leaders" : null,
            values.ministry_required ? "Ministry workers" : null,
          ]
            .filter(Boolean)
            .join(", ") || "No specific audience";

        return (
          <Form className="bg-white rounded-lg md:w-[45rem] max-h-[90vh] text-primary space-y-4">
            <div className="sticky top-0 z-10">
              <FormHeader>
                <p className="text-lg font-semibold">
                  {program?.id ? "Edit Program" : "Create New Program"}
                </p>
                <p className="text-sm text-white">
                  Set up the program here, then build the curriculum once it is saved.
                </p>
              </FormHeader>
            </div>

            {guidedFlowEnabled && (
              <div className="px-6">
                <ProgressStepper
                  steps={PROGRAM_STEPS}
                  activeStep={activeStep}
                  onStepChange={(step) => {
                    const targetIndex = PROGRAM_STEPS.findIndex(
                      (item) => item.id === step
                    );
                    if (targetIndex <= activeIndex) {
                      setActiveStep(step);
                    }
                  }}
                  allowStepSelection
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
              {(!guidedFlowEnabled || activeStep === "details") && (
                <div className="space-y-4">
                  <Field
                    component={FormikInputDiv}
                    type="text"
                    placeholder="Enter program title"
                    label="Program title *"
                    name="title"
                    id="title"
                  />
                  <Field
                    component={FormikInputDiv}
                    type="textarea"
                    placeholder="Enter program description"
                    label="Description *"
                    name="description"
                    id="description"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1 text-sm">
                      <label
                        htmlFor="grading_mode"
                        className="block font-semibold text-primary"
                      >
                        Grading model
                      </label>
                      <Field
                        as="select"
                        id="grading_mode"
                        name="grading_mode"
                        className="w-full h-10 rounded-lg border border-lightGray bg-white px-3 text-primary"
                      >
                        {GRADING_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Field>
                    </div>

                    <BranchSelectField
                      value={values.branch_id}
                      onChange={(v) => setFieldValue("branch_id", v)}
                      required
                      error={
                        typeof errors.branch_id === "string"
                          ? errors.branch_id
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              {(!guidedFlowEnabled || activeStep === "eligibility") && (
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <label className="block font-semibold text-primary">
                      Who can join
                    </label>
                    <div className="flex flex-col gap-3">
                      <label>
                        <Field type="checkbox" name="member_required" className="mr-2" />
                        Members
                      </label>
                      <label>
                        <Field type="checkbox" name="leader_required" className="mr-2" />
                        Leaders (Department &amp; Ministry Heads)
                      </label>
                      <label>
                        <Field type="checkbox" name="ministry_required" className="mr-2" />
                        Ministry workers
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Field
                        type="checkbox"
                        name="isPrerequisitesChecked"
                        className="mr-2"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          const checked = event.target.checked;
                          setFieldValue("isPrerequisitesChecked", checked);
                          if (!checked) {
                            setFieldValue("prerequisites", []);
                          }
                        }}
                      />
                      <span>This program has prerequisite program(s)</span>
                    </div>

                    {values.isPrerequisitesChecked && (
                      <>
                        <MultiSelect
                          options={prerequisitesDropdown}
                          selectedValues={values.prerequisites}
                          onChange={(selected) =>
                            setFieldValue("prerequisites", selected)
                          }
                          placeholder="Select prerequisite programs"
                        />
                        {errors.prerequisites && (
                          <div className="text-sm text-error">
                            {String(errors.prerequisites)}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-lightGray p-3">
                    <Field
                      type="checkbox"
                      name="auto_enroll"
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold text-primary">
                        Auto-enroll eligible applicants
                      </span>
                      <span className="block text-xs text-primaryGray">
                        Applicants who pass every rule are enrolled right away. Anyone
                        who fails a rule — or everyone, when this is off — goes to the
                        review queue for an admin to enroll.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {(!guidedFlowEnabled || activeStep === "review") && (
                <div className="space-y-4 rounded-lg border border-lightGray p-4">
                  <h3 className="text-base font-semibold text-primary">
                    Review and save
                  </h3>
                  <div className="grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-primaryGray">Title</p>
                      <p className="font-medium text-primary">{values.title || "-"}</p>
                    </div>
                    <div>
                      <p className="text-primaryGray">Grading</p>
                      <p className="font-medium text-primary">
                        {gradingLabel(values.grading_mode)}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-primaryGray">Overview</p>
                      <p className="font-medium text-primary">
                        {values.description || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-primaryGray">Open to</p>
                      <p className="font-medium text-primary">{audienceLabel}</p>
                    </div>
                    <div>
                      <p className="text-primaryGray">Prerequisite</p>
                      <p className="font-medium text-primary">
                        {values.isPrerequisitesChecked
                          ? `${values.prerequisites.length} selected`
                          : "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-primaryGray">Enrollment</p>
                      <p className="font-medium text-primary">
                        {values.auto_enroll ? "Auto-enroll" : "Manual review"}
                      </p>
                    </div>
                  </div>
                  {!program?.id && (
                    <p className="text-xs text-primaryGray">
                      Saved as a draft. Add modules and units in Curriculum, then
                      publish.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 bg-white border-t border-lightGray px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="secondary" onClick={onClose} value="Cancel" />

                <div className="flex items-center gap-3">
                  {guidedFlowEnabled && activeIndex > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={goToPreviousStep}
                      value="Back"
                    />
                  )}
                  {guidedFlowEnabled ? (
                    activeIndex < PROGRAM_STEPS.length - 1 ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={goToNextStep}
                        value="Continue"
                      />
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        onClick={submitForm}
                        value={program?.id ? "Update Program" : "Save draft"}
                      />
                    )
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      loading={loading}
                      disabled={loading}
                      onClick={submitForm}
                      value={program?.id ? "Update Program" : "Save draft"}
                    />
                  )}
                </div>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export interface IProgramForm {
  title: string;
  description: string;
  grading_mode: GradingMode;
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
  auto_enroll: boolean;
  prerequisites: string[];
  isPrerequisitesChecked: boolean;
  branch_id: number | "";
}

const initialValues: IProgramForm = {
  title: "",
  description: "",
  grading_mode: "PASS_FAIL",
  member_required: false,
  leader_required: false,
  ministry_required: false,
  auto_enroll: true,
  prerequisites: [],
  isPrerequisitesChecked: false,
  branch_id: "",
};

const validationSchema = object().shape({
  title: string().trim().required("Program title is required"),
  description: string().trim().required("Program description is required"),
  grading_mode: mixed<GradingMode>()
    .oneOf(["PASS_FAIL", "WEIGHTED"])
    .required(),
  auto_enroll: boolean(),
  isPrerequisitesChecked: boolean(),
  prerequisites: array().of(string()).when("isPrerequisitesChecked", {
    is: true,
    then: (schema) => schema.min(1, "At least one prerequisite is required"),
    otherwise: (schema) => schema.max(0),
  }),
  branch_id: number().when([], {
    is: () => useBranchStore.getState().activeBranchId === ALL_BRANCHES,
    then: (schema) => schema.required("Branch is required"),
    otherwise: (schema) => schema.optional(),
  }),
});

export const ProgramForm = Object.assign(ProgramFormComponent, {
  initialValues,
  validationSchema,
});
