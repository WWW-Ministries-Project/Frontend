import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import MultiSelect from "@/components/MultiSelect";
import { FormHeader, ProgressStepper } from "@/components/ui";
import { ProgramResponse } from "@/utils/api/ministrySchool/interfaces";
import { Field, FieldArray, Form, Formik } from "formik";
import { array, boolean, object, string } from "yup";
import { ChangeEvent, useMemo, useState } from "react";
import { isLmsFeatureEnabled } from "../utils/lmsGuardrails";

interface IProps {
  onClose: () => void;
  program?: ProgramResponse;
  prerequisitesDropdown: { label: string; value: string }[];
  handleSubmit: (value: IProgramForm) => void;
  loading: boolean;
}

type ProgramStep = "basics" | "curriculum" | "prerequisites" | "publish";

const PROGRAM_STEPS: { id: ProgramStep; label: string; description: string }[] = [
  {
    id: "basics",
    label: "Program Basics",
    description: "Name, overview, and required audience",
  },
  {
    id: "curriculum",
    label: "Curriculum",
    description: "Add and review topics",
  },
  {
    id: "prerequisites",
    label: "Prerequisites",
    description: "Set dependent programs",
  },
  {
    id: "publish",
    label: "Publish",
    description: "Final review before save",
  },
];

const ProgramFormComponent = ({
  onClose,
  program,
  prerequisitesDropdown,
  loading,
  handleSubmit,
}: IProps) => {
  const [activeStep, setActiveStep] = useState<ProgramStep>("basics");
  const guidedFlowEnabled = isLmsFeatureEnabled("guided_forms");

  const initial: IProgramForm = useMemo(
    () =>
      program
        ? {
            title: program.title,
            description: program.description,
            member_required: program.member_required,
            leader_required: program.leader_required,
            ministry_required: program.ministry_required,
            topics: program.topics.map((topic) => topic.name),
            prerequisites: program.prerequisitePrograms.map((prerequisite) =>
              String(prerequisite.id)
            ),
            isPrerequisitesChecked: program.prerequisitePrograms.length > 0,
          }
        : initialValues,
    [program]
  );

  const activeIndex = PROGRAM_STEPS.findIndex((step) => step.id === activeStep);

  const markStepTouched = (
    step: ProgramStep,
    setTouched: (
      touched: Record<string, boolean | boolean[]>,
      shouldValidate?: boolean
    ) => void,
    topicsLength: number
  ) => {
    const touched: Record<string, boolean | boolean[]> = {};

    if (step === "basics") {
      touched.title = true;
      touched.description = true;
    }

    if (step === "curriculum") {
      touched.topics = Array.from({ length: Math.max(1, topicsLength) }).map(() => true);
    }

    if (step === "prerequisites") {
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
    if (step === "basics") {
      return Boolean(errors.title || errors.description);
    }

    if (step === "curriculum") {
      return Boolean(errors.topics);
    }

    if (step === "prerequisites") {
      return Boolean(values.isPrerequisitesChecked && errors.prerequisites);
    }

    return false;
  };

  return (
    <Formik
      initialValues={initial}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        const normalizedTopics = values.topics
          .map((topic) => topic.trim())
          .filter(Boolean);
        const normalizedPrerequisites = values.isPrerequisitesChecked
          ? values.prerequisites.filter(Boolean)
          : [];

        handleSubmit({
          ...values,
          topics: normalizedTopics,
          prerequisites: normalizedPrerequisites,
        });
      }}
      enableReinitialize
    >
      {({
        values,
        setFieldValue,
        submitForm,
        validateForm,
        setTouched,
        errors,
      }) => {
        const goToNextStep = async () => {
          markStepTouched(activeStep, setTouched, values.topics.length);
          const validationErrors = await validateForm();
          if (hasStepErrors(activeStep, validationErrors as Record<string, unknown>, values)) {
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

        const topicCount = values.topics.filter((topic) => topic.trim()).length;

        return (
          <Form className="bg-white rounded-lg md:w-[45rem] max-h-[90vh] text-primary space-y-4">
            <div className="sticky top-0 z-10">
              <FormHeader>
                <p className="text-lg font-semibold">
                  {program?.id ? "Edit Program" : "Create New Program"}
                </p>
                <p className="text-sm text-white">
                  Use the guided flow to configure your School of Ministry program.
                </p>
              </FormHeader>
            </div>

            {guidedFlowEnabled && (
              <div className="px-6">
                <ProgressStepper
                  steps={PROGRAM_STEPS}
                  activeStep={activeStep}
                  onStepChange={(step) => {
                    const targetIndex = PROGRAM_STEPS.findIndex((item) => item.id === step);
                    if (targetIndex <= activeIndex) {
                      setActiveStep(step);
                    }
                  }}
                  allowStepSelection
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
              {(!guidedFlowEnabled || activeStep === "basics") && (
                <div className="space-y-4">
                  <Field
                    component={FormikInputDiv}
                    type="text"
                    placeholder="Enter program title"
                    label="Program Name *"
                    name="title"
                    id="title"
                  />
                  <Field
                    component={FormikInputDiv}
                    type="textarea"
                    placeholder="Enter program description"
                    label="Program Overview *"
                    name="description"
                    id="description"
                  />

                  <div className="space-y-2 text-sm">
                    <label className="block font-semibold text-primary">
                      This program is required for:
                    </label>
                    <div className="flex flex-col gap-3">
                      <label>
                        <Field type="checkbox" name="member_required" className="mr-2" />
                        Church Member
                      </label>
                      <label>
                        <Field type="checkbox" name="leader_required" className="mr-2" />
                        Leaders (Department & Ministry Heads)
                      </label>
                      <label>
                        <Field type="checkbox" name="ministry_required" className="mr-2" />
                        Ministry Worker
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {(!guidedFlowEnabled || activeStep === "curriculum") && (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold text-primary">Program Topics</h3>
                    <p className="text-xs text-primaryGray">
                      Add the topics learners must complete in this program.
                    </p>
                  </div>

                  <FieldArray
                    name="topics"
                    render={({ push, remove }) => (
                      <div className="space-y-3">
                        {values.topics.map((_, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Field
                              component={FormikInputDiv}
                              name={`topics[${index}]`}
                              id={`topics[${index}]`}
                              className="flex-1"
                              placeholder={`Topic ${index + 1}`}
                            />
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                title="Remove topic"
                                className="mt-8 h-9 w-9 rounded-full border border-lightGray text-primary hover:bg-lightGray/20"
                              >
                                x
                              </button>
                            )}
                          </div>
                        ))}
                        <div className="w-full flex justify-end">
                          <Button
                            type="button"
                            onClick={() => push("")}
                            variant="primary"
                            value="Add Topic"
                          />
                        </div>
                        {errors.topics && typeof errors.topics === "string" && (
                          <p className="text-sm text-error">{errors.topics}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}

              {(!guidedFlowEnabled || activeStep === "prerequisites") && (
                <div className="space-y-3 text-sm">
                  <label className="block font-semibold text-primary">Prerequisites</label>
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
                    <span>This program has prerequisite(s)</span>
                  </div>

                  {values.isPrerequisitesChecked && (
                    <>
                      <MultiSelect
                        options={prerequisitesDropdown}
                        selectedValues={values.prerequisites}
                        onChange={(selected) => setFieldValue("prerequisites", selected)}
                        placeholder="Select prerequisite programs"
                      />
                      {errors.prerequisites && (
                        <div className="text-sm text-error">{String(errors.prerequisites)}</div>
                      )}
                    </>
                  )}
                </div>
              )}

              {guidedFlowEnabled && activeStep === "publish" && (
                <div className="space-y-4 rounded-lg border border-lightGray p-4">
                  <h3 className="text-base font-semibold text-primary">Review and Publish</h3>
                  <div className="grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-primaryGray">Program Name</p>
                      <p className="font-medium text-primary">{values.title || "-"}</p>
                    </div>
                    <div>
                      <p className="text-primaryGray">Topics</p>
                      <p className="font-medium text-primary">{topicCount}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-primaryGray">Overview</p>
                      <p className="font-medium text-primary">{values.description || "-"}</p>
                    </div>
                    <div>
                      <p className="text-primaryGray">Audience</p>
                      <p className="font-medium text-primary">
                        {[
                          values.member_required ? "Members" : null,
                          values.leader_required ? "Leaders" : null,
                          values.ministry_required ? "Workers" : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "No specific audience"}
                      </p>
                    </div>
                    <div>
                      <p className="text-primaryGray">Prerequisites</p>
                      <p className="font-medium text-primary">
                        {values.isPrerequisitesChecked
                          ? `${values.prerequisites.length} selected`
                          : "Not required"}
                      </p>
                    </div>
                  </div>
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
                      <Button type="button" variant="primary" onClick={goToNextStep} value="Next" />
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        onClick={submitForm}
                        value={program?.id ? "Update Program" : "Publish Program"}
                      />
                    )
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      loading={loading}
                      disabled={loading}
                      onClick={submitForm}
                      value={program?.id ? "Update Program" : "Save Program"}
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
  member_required: boolean;
  leader_required: boolean;
  ministry_required: boolean;
  topics: string[];
  prerequisites: string[];
  isPrerequisitesChecked: boolean;
}

const initialValues: IProgramForm = {
  title: "",
  description: "",
  member_required: false,
  leader_required: false,
  ministry_required: false,
  topics: [""],
  prerequisites: [],
  isPrerequisitesChecked: false,
};

const validationSchema = object().shape({
  title: string().trim().required("Program title is required"),
  description: string().trim().required("Program description is required"),
  topics: array()
    .of(string().trim().required("Topic is required"))
    .min(1, "At least one topic is required"),
  isPrerequisitesChecked: boolean(),
  prerequisites: array().of(string()).when("isPrerequisitesChecked", {
    is: true,
    then: (schema) => schema.min(1, "At least one prerequisite is required"),
    otherwise: (schema) => schema.max(0),
  }),
});

export const ProgramForm = Object.assign(ProgramFormComponent, {
  initialValues,
  validationSchema,
});
