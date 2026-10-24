import {
  ChildrenSubForm,
  ContactsSubForm,
  EmergencyContact,
  IChildrenSubForm,
  IContactsSubForm,
  IEmergencyContact,
  IUserSubForm,
  IWorkInfoSubForm,
  UserSubForm,
  WorkInfoSubForm,
} from "@components/subform";
import { FormikTouched, useFormikContext } from "formik";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { array, boolean, date, mixed, object, string } from "yup";

import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { FormErrorSummary, FormErrorItem } from "@/components/feedback";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";

import {
  DepartmentPositionSubForm,
  IDepartmentPositionSubForm,
} from "./DepartmentPosition";
import { FamilyMembersEditor } from "./form/FamilyMembersEditor";
import {
  BasicInfoSection,
  ChurchInfoSection,
  ContactInfoSection,
  WorkInfoSection,
} from "./form/MemberFormSections";
import { MemberFormStepper } from "./form/MemberFormStepper";
import {
  StepKey,
  errorsToTouched,
  getMemberFormSteps,
  hasNestedError,
  stepFields,
  stepHasError,
} from "./form/memberFormSteps";

/** Flattens Formik's nested errors into `{ field, message }` pairs (dot paths). */
const flattenErrors = (errors: unknown, prefix = ""): FormErrorItem[] => {
  if (!errors) return [];
  if (typeof errors === "string") return [{ field: prefix, message: errors }];
  if (Array.isArray(errors)) {
    return errors.flatMap((entry, index) => flattenErrors(entry, `${prefix}.${index}`));
  }
  if (typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>).flatMap(([key, value]) =>
      flattenErrors(value, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [];
};

interface IProps {
  isEditMode: boolean;
  submitting?: boolean;
  disabled?: boolean;
}

/**
 * Multi-step admin member form. Must be rendered inside a Formik provider whose
 * initial values / schema come from `MembersForm.initialValues` / `validationSchema`.
 */
const MembersFormComponent = ({ isEditMode, submitting = false, disabled = false }: IProps) => {
  const formik = useFormikContext<IMembersForm>();
  const { values, setFieldValue, validateForm, setTouched, submitForm } = formik;
  const hasFamily = values.personal_info?.has_children ?? false;
  const isUser = Boolean(values.is_user);

  const steps = useMemo(() => getMemberFormSteps(hasFamily), [hasFamily]);
  const [currentStep, setCurrentStep] = useState<StepKey>("basic");
  const topRef = useRef<HTMLDivElement>(null);
  // Bumped on each blocked Next/Save so the error summary shows and takes focus.
  const [failedAttempts, setFailedAttempts] = useState(0);
  const previousIsUserRef = useRef(values.is_user);
  // Rows cleared by switching "ministry worker" off, so switching it back on
  // restores them instead of losing the member's departments.
  const clearedDepartmentsRef = useRef<IMembersForm["department_positions"] | null>(null);
  const previousHasFamilyRef = useRef(hasFamily);

  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === currentStep)
  );
  const step = steps[currentIndex];
  const isLastStep = currentIndex === steps.length - 1;

  const goTo = useCallback((key: StepKey) => {
    setCurrentStep(key);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  /** Validates the current step; marks its fields touched so inline errors show. */
  const validateCurrentStep = useCallback(async () => {
    const errors = await validateForm();
    if (!stepHasError(step.key, errors, isUser)) return true;
    setFailedAttempts((count) => count + 1);

    const errorRecord = errors as Record<string, unknown>;
    const stepTouched = stepFields(step.key, isUser).reduce<Record<string, unknown>>(
      (acc, key) => {
        if (errorRecord[key] !== undefined) acc[key] = errorsToTouched(errorRecord[key]);
        return acc;
      },
      {}
    );
    setTouched({ ...formik.touched, ...stepTouched } as FormikTouched<IMembersForm>, false);
    return false;
  }, [formik.touched, isUser, setTouched, step.key, validateForm]);

  const handleStepSelect = async (key: StepKey) => {
    const targetIndex = steps.findIndex((item) => item.key === key);
    if (targetIndex > currentIndex && !(await validateCurrentStep())) return;
    goTo(key);
  };

  const handleSave = async () => {
    const errors = await validateForm();

    if (hasNestedError(errors)) {
      setTouched(errorsToTouched(errors) as FormikTouched<IMembersForm>, false);
      const firstInvalid = steps.find((item) => stepHasError(item.key, errors, isUser));
      if (firstInvalid) goTo(firstInvalid.key);
      setFailedAttempts((count) => count + 1);
      return;
    }

    await submitForm();
  };

  const handleNext = async () => {
    if (!(await validateCurrentStep())) return;
    if (isLastStep) {
      await handleSave();
      return;
    }
    goTo(steps[currentIndex + 1].key);
  };

  const handleSkip = async () => {
    // Skipping the work step leaves it unanswered so its conditional rules don't block saving.
    const errors = await validateForm();
    if (stepHasError("work", errors, isUser)) {
      await setFieldValue("work_info.employment_status", undefined);
    }
    if (isLastStep) {
      await handleSave();
      return;
    }
    goTo(steps[currentIndex + 1].key);
  };

  useEffect(() => {
    if (previousIsUserRef.current === values.is_user) return;
    previousIsUserRef.current = values.is_user;

    if (!values.is_user) {
      const current = values.department_positions;
      if (Array.isArray(current) && current.some((item) => Boolean(item?.department_id))) {
        clearedDepartmentsRef.current = current;
      }
      setFieldValue("department_positions", []);
      return;
    }

    if (clearedDepartmentsRef.current) {
      setFieldValue("department_positions", clearedDepartmentsRef.current);
      clearedDepartmentsRef.current = null;
      return;
    }

    const hasDepartmentValues =
      Array.isArray(values.department_positions) &&
      values.department_positions.some(
        (item) => Boolean(item?.department_id) || Boolean(item?.position_id)
      );

    if (!hasDepartmentValues) {
      setFieldValue("department_positions", initialValues.department_positions);
    }
  }, [setFieldValue, values.department_positions, values.is_user]);

  useEffect(() => {
    if (previousHasFamilyRef.current === hasFamily) return;
    previousHasFamilyRef.current = hasFamily;

    if (!hasFamily) {
      setFieldValue("family", []);
      return;
    }

    if (!Array.isArray(values.family) || values.family.length === 0) {
      setFieldValue("family", initialValues.family);
    }
  }, [hasFamily, setFieldValue, values.family]);

  useEffect(() => {
    if (!hasFamily && currentStep === "family") setCurrentStep("work");
  }, [hasFamily, currentStep]);

  const stepErrors = useMemo(() => {
    if (!failedAttempts) return [];
    const fields = stepFields(step.key, isUser);
    return flattenErrors(formik.errors).filter((item) =>
      fields.some((field) => item.field === field || item.field.startsWith(`${field}.`))
    );
  }, [failedAttempts, formik.errors, isUser, step.key]);

  const saveLabel = isEditMode ? "Save changes" : "Add member";
  const busy = submitting || formik.isSubmitting;

  return (
    <div ref={topRef} className="flex scroll-mt-6 flex-col gap-6">
      <MemberFormStepper steps={steps} current={step.key} onSelect={handleStepSelect} />

      <section className="flex flex-col gap-6 rounded-xl border border-lightGray bg-white p-4 sm:p-6">
        <FormErrorSummary errors={stepErrors} focusKey={failedAttempts} />
        {step.key === "basic" && <BasicInfoSection disabled={disabled} />}
        {step.key === "contact" && <ContactInfoSection disabled={disabled} />}
        {step.key === "church" && <ChurchInfoSection disabled={disabled} />}
        {step.key === "work" && <WorkInfoSection disabled={disabled} />}
        {step.key === "family" && <FamilyMembersEditor disabled={disabled} />}

        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 pt-4">
          <UiButton
            onClick={() => goTo(steps[currentIndex - 1].key)}
            disabled={currentIndex === 0 || busy}
            className="px-5"
          >
            Back
          </UiButton>
          <div className="flex flex-wrap gap-2">
            {step.skippable && (
              <UiButton
                tone="ghost"
                className="text-primary hover:bg-primary/5"
                onClick={handleSkip}
                disabled={busy}
              >
                Skip for now
              </UiButton>
            )}
            {isEditMode && !isLastStep && (
              <UiButton onClick={handleSave} disabled={busy}>
                {busy ? "Saving..." : saveLabel}
              </UiButton>
            )}
            <UiButton tone="primary" onClick={handleNext} disabled={busy}>
              {isLastStep ? (busy ? "Saving..." : saveLabel) : "Next"}
            </UiButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export type membersType = "ONLINE" | "IN_HOUSE";
export interface IMembersForm extends IChildrenSubForm {
  branch_id: number | "";
  personal_info: IUserSubForm;
  picture: {
    src: string;
    picture: File | null;
  };
  emergency_contact: IEmergencyContact;
  contact_info: IContactsSubForm & {
    /** Optional second phone number (digits; backend normalises/validates). */
    other_number?: string;
  };
  work_info: IWorkInfoSubForm;
  church_info: {
    member_since?: string;
    membership_type: membersType;
  };
  is_user: boolean;
  department_positions: IDepartmentPositionSubForm[];
}

const initialValues: IMembersForm = {
  branch_id: "",
  personal_info: UserSubForm.initialValues,
  picture: {
    src: "",
    picture: null,
  },
  contact_info: { ...ContactsSubForm.initialValues, other_number: "" },
  work_info: WorkInfoSubForm.initialValues,
  emergency_contact: EmergencyContact.initialValues,
  is_user: false,
  church_info: {
    member_since: undefined,
    membership_type: "IN_HOUSE",
  },
  department_positions: DepartmentPositionSubForm.initialValues,
  ...ChildrenSubForm.initialValues,
};

const validationSchema = {
  branch_id: mixed().when([], {
    is: () => useBranchStore.getState().activeBranchId === ALL_BRANCHES,
    then: (schema) => schema.required("Branch is required"),
    otherwise: (schema) => schema.optional(),
  }),
  personal_info: object(UserSubForm.validationSchema),
  contact_info: object({
    ...ContactsSubForm.validationSchema,
    other_number: string().optional(),
  }),
  work_info: object(WorkInfoSubForm.validationSchema),
  emergency_contact: object(EmergencyContact.validationSchema),
  is_user: boolean().required("Required"),
  church_info: object().shape({
    member_since: date().max(new Date()),
    membership_type: string().required("Required"),
  }),
  department_positions: array().when("is_user", {
    is: true,
    then: () => DepartmentPositionSubForm.validationSchema,
    otherwise: () => array(),
  }),
  ...ChildrenSubForm.validationSchema,
};

export const MembersForm = Object.assign(MembersFormComponent, {
  initialValues: initialValues,
  validationSchema,
});
