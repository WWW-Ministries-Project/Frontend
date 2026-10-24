import { FieldArray, getIn, useFormikContext } from "formik";
import { useMemo } from "react";

import { PersonalDetails } from "@/components/subform/PersonalDetails";
import { useFetch } from "@/CustomHooks/useFetch";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import { normalizeFamilyRelation } from "@/utils/familyRelations";

import type { IMembersForm } from "../MembersForm";
import {
  CountrySelectField,
  FieldGrid,
  FormSelectField,
  FormTextField,
} from "./formFields";
import {
  FAMILY_RELATION_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  TITLE_OPTIONS,
} from "./memberFormOptions";

type FamilyMember = IMembersForm["family"][number];

const emptyFamilyMember = (): FamilyMember => ({
  ...PersonalDetails.initialValues,
  relation: "",
});

/**
 * Admin family editor. Same data contract as the shared ChildrenSubForm
 * (`family[]` with optional `user_id` linking to an existing member).
 */
export const FamilyMembersEditor = ({ disabled }: { disabled?: boolean }) => {
  const { values, errors, touched, setFieldValue } = useFormikContext<IMembersForm>();
  const family = useMemo(() => values.family ?? [], [values.family]);
  const membersOptions = useStore((state) => state.membersOptions);
  const { refetch: fetchAMember } = useFetch(api.fetch.fetchAMember, {}, true);

  const selectedUserIds = useMemo(
    () => family.map((member) => (member.user_id ? String(member.user_id) : "")).filter(Boolean),
    [family]
  );

  const listError =
    typeof errors.family === "string" && getIn(touched, "family") ? errors.family : undefined;

  const resetMember = (index: number) => {
    setFieldValue(`family.${index}`, {
      ...emptyFamilyMember(),
      relation: normalizeFamilyRelation(family[index]?.relation),
    });
  };

  const linkMember = async (index: number, userId: string | number | null) => {
    if (!userId) {
      resetMember(index);
      return;
    }

    const result = await fetchAMember({ user_id: String(userId) });
    const member = result?.data;
    if (!member) return;

    setFieldValue(`family.${index}`, {
      ...emptyFamilyMember(),
      relation: normalizeFamilyRelation(family[index]?.relation),
      user_id: String(member.id),
      title: member.title ?? "",
      first_name: member.first_name ?? "",
      last_name: member.last_name ?? "",
      other_name: member.other_name ?? "",
      email: member.email ?? "",
      date_of_birth: member.date_of_birth ?? "",
      gender: member.gender ?? "",
      marital_status: member.marital_status ?? "",
      nationality: member.nationality ?? "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold leading-7 text-gray-800">Family Information</h2>
        <p className="text-sm text-gray-600">
          Link family members who already belong to the church, or enter their details.
        </p>
      </div>
      {listError && (
        <p role="alert" className="text-xs text-red-700">
          {listError}
        </p>
      )}
      <FieldArray name="family">
        {({ push, remove }) => (
          <>
            {family.map((member, index) => {
              const prefix = `family.${index}`;
              const linked = Boolean(member.user_id);
              const availableMembers = membersOptions.filter(
                (option) =>
                  !selectedUserIds.includes(option.value) ||
                  option.value === String(member.user_id ?? "")
              );
              const onlyOne = family.length === 1;

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-primary">
                      Family member {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={disabled || onlyOne}
                      className="text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <SelectField
                      id={`${prefix}.user_id`}
                      label="Find existing member"
                      placeholder="Search for a member..."
                      helperText="Select them if this person is already in the system."
                      options={availableMembers}
                      value={member.user_id ?? ""}
                      onChange={(_name, value) => linkMember(index, value)}
                      disabled={disabled}
                      searchable
                      clearable
                    />
                    {linked && (
                      <UiButton
                        tone="ghost"
                        size="sm"
                        className="self-start"
                        onClick={() => resetMember(index)}
                      >
                        Unlink selected member
                      </UiButton>
                    )}
                  </div>

                  <FieldGrid min={200}>
                    <FormSelectField
                      name={`${prefix}.relation`}
                      label="Relation *"
                      placeholder="Select relation"
                      options={FAMILY_RELATION_OPTIONS}
                      disabled={disabled}
                    />
                    <FormSelectField
                      name={`${prefix}.title`}
                      label="Title"
                      placeholder="Select title"
                      options={TITLE_OPTIONS}
                      disabled={disabled || linked}
                    />
                    <FormTextField
                      name={`${prefix}.first_name`}
                      label="First name"
                      disabled={disabled || linked}
                    />
                    <FormTextField
                      name={`${prefix}.other_name`}
                      label="Other name"
                      disabled={disabled || linked}
                    />
                    <FormTextField
                      name={`${prefix}.last_name`}
                      label="Last name *"
                      disabled={disabled || linked}
                    />
                    <FormTextField
                      name={`${prefix}.date_of_birth`}
                      label="Date of birth *"
                      type="date"
                      disabled={disabled || linked}
                    />
                    <FormSelectField
                      name={`${prefix}.gender`}
                      label="Gender *"
                      placeholder="Select gender"
                      options={GENDER_OPTIONS}
                      disabled={disabled || linked}
                    />
                    <FormSelectField
                      name={`${prefix}.marital_status`}
                      label="Marital status"
                      placeholder="Select marital status"
                      options={MARITAL_OPTIONS}
                      disabled={disabled || linked}
                    />
                    <CountrySelectField
                      name={`${prefix}.nationality`}
                      label="Nationality *"
                      placeholder="Select nationality"
                      disabled={disabled || linked}
                    />
                  </FieldGrid>
                </div>
              );
            })}
            <UiButton
              tone="ghost"
              className="self-start text-primary hover:bg-primary/5"
              onClick={() => push(emptyFamilyMember())}
              disabled={disabled}
            >
              + Add another family member
            </UiButton>
          </>
        )}
      </FieldArray>
    </div>
  );
};
