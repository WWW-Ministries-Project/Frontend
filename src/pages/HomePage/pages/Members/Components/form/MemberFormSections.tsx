import { useFormikContext } from "formik";
import { useEffect } from "react";

import {
  Field,
  SelectInput,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { LockedBranchField } from "@/components/BranchSelectField";
import { useBranchFieldState } from "@/CustomHooks/useBranchFieldState";

import type { IMembersForm } from "../MembersForm";
import { DepartmentPositionSubForm } from "../DepartmentPosition";
import {
  ChoiceCards,
  CountrySelectField,
  FormGroup,
  FormSelectField,
  FormTextField,
  OtherNumberField,
  PhoneField,
  PhotoField,
} from "./formFields";
import { YES_NO, useFieldError } from "./formUtils";
import {
  EMERGENCY_RELATION_OPTIONS,
  EMPLOYMENT_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  TITLE_OPTIONS,
  WORK_DETAILS_REQUIRED,
  WORK_DETAILS_SHOWN,
} from "./memberFormOptions";

interface SectionProps {
  disabled?: boolean;
}

export const BasicInfoSection = ({ disabled }: SectionProps) => {
  const { values } = useFormikContext<IMembersForm>();
  const name = `${values.personal_info?.first_name ?? ""} ${values.personal_info?.last_name ?? ""}`;

  return (
    <>
      <PhotoField name="picture" initialsFrom={name} disabled={disabled} />
      <FormGroup title="Personal Information">
        <FormSelectField
          name="personal_info.title"
          label="Title"
          placeholder="Select title"
          options={TITLE_OPTIONS}
          disabled={disabled}
        />
        <FormTextField
          name="personal_info.first_name"
          label="First name"
          placeholder="Enter first name"
          disabled={disabled}
        />
        <FormTextField
          name="personal_info.other_name"
          label="Other name"
          placeholder="Enter other name"
          disabled={disabled}
        />
        <FormTextField
          name="personal_info.last_name"
          label="Last name *"
          placeholder="Enter last name"
          disabled={disabled}
        />
        <FormTextField
          name="personal_info.date_of_birth"
          label="Date of birth *"
          type="date"
          disabled={disabled}
        />
        <FormSelectField
          name="personal_info.gender"
          label="Gender *"
          placeholder="Select gender"
          options={GENDER_OPTIONS}
          disabled={disabled}
        />
        <FormSelectField
          name="personal_info.marital_status"
          label="Marital status *"
          placeholder="Select marital status"
          options={MARITAL_OPTIONS}
          disabled={disabled}
        />
        <CountrySelectField
          name="personal_info.nationality"
          label="Nationality *"
          placeholder="Select nationality"
          disabled={disabled}
        />
        <ChoiceCards
          name="personal_info.has_children"
          label="Does this member have family in this church?"
          hint="e.g. spouse, children, parents, siblings"
          options={YES_NO}
          disabled={disabled}
        />
      </FormGroup>
    </>
  );
};

export const ContactInfoSection = ({ disabled }: SectionProps) => (
  <>
    <FormGroup title="Contact Information">
      <FormTextField
        name="contact_info.email"
        label="Email *"
        type="email"
        placeholder="name@example.com"
        disabled={disabled}
      />
      <PhoneField prefix="contact_info" label="Phone number *" disabled={disabled} />
      <OtherNumberField
        name="contact_info.other_number"
        codeName="contact_info.phone.country_code"
        label="Other number"
        disabled={disabled}
      />
      <CountrySelectField
        name="contact_info.resident_country"
        label="Country of residence *"
        placeholder="Select country"
        disabled={disabled}
      />
      <FormTextField
        name="contact_info.state_region"
        label="Region / state *"
        placeholder="Enter state or region"
        disabled={disabled}
      />
      <FormTextField
        name="contact_info.city"
        label="City / town *"
        placeholder="Enter city"
        disabled={disabled}
      />
    </FormGroup>
    <FormGroup title="Emergency Contact">
      <FormTextField
        name="emergency_contact.name"
        label="Full name *"
        placeholder="Enter name of contact"
        disabled={disabled}
      />
      <FormSelectField
        name="emergency_contact.relation"
        label="Relationship *"
        placeholder="Select relationship"
        options={EMERGENCY_RELATION_OPTIONS}
        disabled={disabled}
      />
      <PhoneField prefix="emergency_contact" label="Phone number *" disabled={disabled} />
    </FormGroup>
  </>
);

const BranchField = () => {
  const { values, setFieldValue } = useFormikContext<IMembersForm>();
  const { options, lockedBranch, lockedReason } = useBranchFieldState();
  const error = useFieldError("branch_id");
  const lockedId = lockedBranch?.id;

  // A fixed branch is still submitted with the member.
  useEffect(() => {
    if (lockedId && values.branch_id !== lockedId) setFieldValue("branch_id", lockedId);
  }, [lockedId, values.branch_id, setFieldValue]);

  if (lockedBranch && lockedReason) {
    return (
      <LockedBranchField id="branch_id" branch={lockedBranch} reason={lockedReason} />
    );
  }

  return (
    <Field label="Branch *" error={error}>
      <SelectInput
        id="branch_id"
        name="branch_id"
        value={values.branch_id === "" ? "" : String(values.branch_id)}
        hasError={Boolean(error)}
        aria-invalid={Boolean(error)}
        onChange={(event) =>
          setFieldValue("branch_id", event.target.value === "" ? "" : Number(event.target.value))
        }
        options={[
          { value: "", label: "Select branch" },
          ...options.map((branch) => ({ value: String(branch.id), label: branch.name })),
        ]}
      />
    </Field>
  );
};

export const ChurchInfoSection = ({ disabled }: SectionProps) => {
  const { values } = useFormikContext<IMembersForm>();

  return (
    <>
      <FormGroup title="Church Information">
        <ChoiceCards
          name="church_info.membership_type"
          label="Membership type *"
          options={[
            { value: "IN_HOUSE", label: "In-person church family" },
            { value: "ONLINE", label: "Online e-church family" },
          ]}
          disabled={disabled}
        />
        <FormTextField
          name="church_info.member_since"
          label="Date joined"
          type="date"
          disabled={disabled}
        />
        <BranchField />
        <ChoiceCards
          name="is_user"
          label="Is this member a ministry worker?"
          options={YES_NO}
          disabled={disabled}
        />
      </FormGroup>
      {values.is_user && (
        <DepartmentPositionSubForm disabled={disabled} prefix="department_positions" />
      )}
    </>
  );
};

export const WorkInfoSection = ({ disabled }: SectionProps) => {
  const { values } = useFormikContext<IMembersForm>();
  const status = values.work_info?.employment_status;
  // Legacy behaviour: an unset status still shows the work fields (as "employed").
  const shownStatus = status || "employed";
  const marker = status && WORK_DETAILS_REQUIRED.includes(status) ? " *" : "";
  const isStudent = shownStatus === "student";

  return (
    <FormGroup title="Employment / Schooling Information">
      <FormSelectField
        name="work_info.employment_status"
        label="Current status"
        placeholder="Select status"
        options={EMPLOYMENT_OPTIONS}
        disabled={disabled}
      />
      {WORK_DETAILS_SHOWN.includes(shownStatus) && (
        <>
          <FormTextField
            name="work_info.work_name"
            label={`Organisation${marker}`}
            placeholder="Enter name of institution"
            disabled={disabled}
          />
          <FormTextField
            name="work_info.work_industry"
            label={`Industry${marker}`}
            placeholder="Enter industry"
            disabled={disabled}
          />
          <FormTextField
            name="work_info.work_position"
            label={`Position / role${marker}`}
            placeholder="Enter position"
            disabled={disabled}
          />
        </>
      )}
      {isStudent && (
        <FormTextField
          name="work_info.school_name"
          label="School"
          placeholder="Enter name of institution"
          disabled={disabled}
        />
      )}
    </FormGroup>
  );
};
