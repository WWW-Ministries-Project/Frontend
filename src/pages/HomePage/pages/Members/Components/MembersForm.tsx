import { ProfilePicture } from "@/components";
import { BranchSelectField } from "@/components/BranchSelectField";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout, FullWidth, ProgressStepper } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
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
import { Field, useFormikContext } from "formik";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { array, boolean, date, mixed, object, string } from "yup";
import {
  DepartmentPositionSubForm,
  IDepartmentPositionSubForm,
} from "./DepartmentPosition";
import { RadioInput } from "./RadioInput";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";

type StepKey = "basic" | "contact" | "church" | "work" | "family";

const hasNestedError = (errorValue: unknown): boolean => {
  if (Array.isArray(errorValue)) {
    return errorValue.some((item) => hasNestedError(item));
  }

  if (errorValue && typeof errorValue === "object") {
    return Object.values(errorValue as Record<string, unknown>).some((item) =>
      hasNestedError(item)
    );
  }

  return Boolean(errorValue);
};

const getSteps = (hasChildren: boolean) => {
  const steps = [
    {
      key: "basic",
      title: "Basic Information",
      description: "Who the member is",
    },
    {
      key: "contact",
      title: "Contact Information",
      description: "How we can reach them",
    },
    {
      key: "church",
      title: "Church Information",
      description: "Membership & ministry details",
    },
    {
      key: "work",
      title: "Employment / Schooling",
      description: "What they currently do",
      skippable: true,
    },
  ] as {
    key: StepKey;
    title: string;
    description: string;
    skippable?: boolean;
  }[];

  if (hasChildren) {
    steps.push({
      key: "family",
      title: "Family Information",
      description: "Children details",
    });
  }

  return steps;
};

interface IProps {
  disabled?: boolean;
  onRegisterControls?: (controls: {
    goNext: () => void;
    goBack: () => void;
    isLastStep: boolean;
    focusFirstErrorStep: (errors: unknown) => void;
  }) => void;
}

const MembersFormComponent = ({ disabled = false, onRegisterControls }: IProps) => {
  const { values, errors, setFieldValue } = useFormikContext<IMembersForm>();
  const { activeBranchId } = useBranchStore();
  const has_children = values.personal_info?.has_children ?? false;

  const steps = useMemo(() => getSteps(has_children), [has_children]);
  const progressSteps = useMemo(
    (): { id: StepKey; label: string; description: string; ariaLabel: string }[] =>
      steps.map((step) => ({
        id: step.key,
        label: step.title,
        description: step.description,
        ariaLabel: `${step.title}. ${step.description}`,
      })),
    [steps]
  );

  const [currentStep, setCurrentStep] = useState<StepKey>("basic");
  const previousIsUserRef = useRef(values.is_user);
  const previousHasChildrenRef = useRef(has_children);

  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  const stepHasError = useCallback(
    (step: StepKey, formErrors: unknown): boolean => {
      const errorsRecord =
        formErrors && typeof formErrors === "object"
          ? (formErrors as Record<string, unknown>)
          : {};

      switch (step) {
        case "basic":
          return (
            hasNestedError(errorsRecord.personal_info) ||
            hasNestedError(errorsRecord.branch_id)
          );
        case "contact":
          return (
            hasNestedError(errorsRecord.contact_info) ||
            hasNestedError(errorsRecord.emergency_contact)
          );
        case "church":
          return (
            hasNestedError(errorsRecord.church_info) ||
            (values.is_user && hasNestedError(errorsRecord.department_positions))
          );
        case "work":
          return hasNestedError(errorsRecord.work_info);
        case "family":
          return has_children && hasNestedError(errorsRecord.family);
        default:
          return false;
      }
    },
    [has_children, values.is_user]
  );

  const isStepValid = (step: StepKey) => {
    return !stepHasError(step, errors);
  };

  const focusFirstErrorStep = useCallback(
    (formErrors: unknown) => {
      const firstInvalidStep = steps.find((step) =>
        stepHasError(step.key, formErrors)
      );
      if (firstInvalidStep) {
        setCurrentStep(firstInvalidStep.key);
      }
    },
    [stepHasError, steps]
  );

  const goNext = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  }, [currentIndex, steps]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  }, [currentIndex, steps]);

  useEffect(() => {
    onRegisterControls?.({
      goNext,
      goBack,
      isLastStep: currentIndex === steps.length - 1,
      focusFirstErrorStep,
    });
  }, [goNext, goBack, currentIndex, steps.length, focusFirstErrorStep, onRegisterControls]);

  useEffect(() => {
    if (previousIsUserRef.current === values.is_user) return;

    previousIsUserRef.current = values.is_user;

    if (!values.is_user) {
      setFieldValue("department_positions", []);
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
    if (previousHasChildrenRef.current === has_children) return;
    previousHasChildrenRef.current = has_children;

    if (!has_children) {
      setFieldValue("family", []);
      return;
    }

    if (!Array.isArray(values.family) || values.family.length === 0) {
      setFieldValue("family", initialValues.family);
    }
  }, [has_children, setFieldValue, values.family]);

  useEffect(() => {
    if (!has_children && currentStep === "family") {
      setCurrentStep("work");
    }
  }, [has_children, currentStep]);

  return (
    <div>
      <div className="mb-8">
        <ProgressStepper
          steps={progressSteps}
          activeStep={currentStep}
          onStepChange={(step) => setCurrentStep(step)}
          ariaLabel="Member registration progress"
          className="rounded-xl border border-lightGray bg-white p-3"
          isStepCompleted={(step) => isStepValid(step.id)}
        />
      </div>

      <FormLayout>
      {currentStep === "basic" && (
        <>
          <FormHeader className="text-primary font-bold">Personal Information</FormHeader>
          {activeBranchId === ALL_BRANCHES && (
            <FullWidth>
              <BranchSelectField
                value={values.branch_id}
                onChange={(v) => setFieldValue("branch_id", v)}
                required
                error={errors.branch_id as string | undefined}
              />
            </FullWidth>
          )}
          <FullWidth>
            <div className="flex flex-col  w-full">
              <ProfilePicture
                className="h-[8rem] w-[8rem] outline-lightGray  profilePic transition-all outline outline-1 duration-1000 mb-2"
                id="profile_picture"
                name="profile_picture"
                src={values.picture.src}
                alt="Profile Picture"
                editable={!disabled}
                onChange={(obj) => {
                  setFieldValue(`picture`, obj);
                }}
                textClass={"text-3xl text-primary"}
              />
              <p className="text-sm ">
                Click on the <strong>pen icon</strong> to upload your profile image{" "}
              </p>
            </div>
          </FullWidth>
          <UserSubForm prefix="personal_info" />
        </>
      )}

      {currentStep === "contact" && (
        <>
          <FormHeader className="text-primary font-bold">Contact Information</FormHeader>
          <ContactsSubForm disabled={disabled} prefix="contact_info" />
          <HorizontalLine />
          <FormHeader className="text-primary font-bold">Emergency Contact</FormHeader>
          <EmergencyContact disabled={disabled} prefix="emergency_contact" />
        </>
      )}

      {currentStep === "church" && (
        <>
          <FormHeader className="text-primary font-bold">Church Information</FormHeader>

          <Field
            component={FormikSelectField}
            label="Membership Type"
            placeholder="Select membership type"
            id="church_info.membership_type"
            name="church_info.membership_type"
            options={[
              { label: "Online e-church family", value: "ONLINE" },
              { label: "In-person church family", value: "IN_HOUSE" },
            ]}
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Date joined"
            id="church_info.member_since"
            name="church_info.member_since"
            placeholder="Select date joined"
            type="date"
            max={new Date().toISOString().split("T")[0]}
            disabled={disabled}
          />

          <FullWidth>
            <div className="flex flex-col">
              <p className="text-dark900 mb-2">Is this member a ministry worker?</p>
              <RadioInput name="is_user" />
            </div>
          </FullWidth>

          {values.is_user && (
            <DepartmentPositionSubForm disabled={disabled} prefix="department_positions" />
          )}
        </>
      )}

      {currentStep === "work" && (
        <>
          <FormHeader className="text-primary font-bold">
            Employment / Schooling Information
          </FormHeader>
          <WorkInfoSubForm disabled={disabled} prefix="work_info" />
        </>
      )}

      {currentStep === "family" && (
        <>
          <FormHeader className="text-primary font-bold">
            Family Information
          </FormHeader>
          <ChildrenSubForm disabled={disabled} />
        </>
      )}
      
      </FormLayout>
      
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
  contact_info: IContactsSubForm;
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
  contact_info: ContactsSubForm.initialValues,
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
  contact_info: object(ContactsSubForm.validationSchema),
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
