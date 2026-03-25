import { Button } from "@/components";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/components/subform/PersonalDetails";
import { FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { useStore } from "@/store/useStore";
import { api } from "@/utils";
import {
  FAMILY_RELATION_VALUES,
  FamilyRelation,
  normalizeFamilyRelation,
  validateFamilyPayload,
} from "@/utils/familyRelations";
import { useFetch } from "@/CustomHooks/useFetch";
import { Field, FieldArray, getIn, useFormikContext } from "formik";
import { Fragment, useMemo } from "react";
import { array, object, string } from "yup";
import FormikSelectField from "../FormikSelect";

type IFamilyMember = IPersonalDetails & {
  user_id?: string;
  relation?: FamilyRelation | "";
  email?: string;
};

const familyRelationOptions = [
  { label: "Spouse", value: "spouse" },
  { label: "Parent", value: "parent" },
  { label: "Child", value: "child" },
  { label: "Sibling", value: "sibling" },
  { label: "Guardian", value: "guardian" },
  { label: "Dependent", value: "dependent" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Grandchild", value: "grandchild" },
  { label: "In-law", value: "in-law" },
];

const getEmptyFamilyMember = (): IFamilyMember => ({
  ...PersonalDetails.initialValues,
  relation: "",
});

const ChildrenSubFormComponent = ({
  disabled = false,
}: {
  disabled?: boolean;
}) => {
  const { values: entire, setFieldValue } =
    useFormikContext<IChildrenSubForm>();
  const family = useMemo<IFamilyMember[]>(
    () => (getIn(entire, "family") as IFamilyMember[]) || initialValues.family,
    [entire]
  );

  const { refetch: fetchAMember } = useFetch(api.fetch.fetchAMember, {}, true);
  const membersOptions = useStore((state) => state.membersOptions);

  const selectedUserIds = useMemo(
    () =>
      family
        .map((member: IFamilyMember) =>
          member.user_id ? String(member.user_id) : ""
        )
        .filter(Boolean),
    [family]
  );

  const handleResetMember = (index: number) => {
    setFieldValue(`family.${index}`, {
      ...getEmptyFamilyMember(),
      relation: normalizeFamilyRelation(family[index]?.relation),
    });
  };

  return (
    <>
      {/* <FormHeader className={"text-primary font-bold "}>Children</FormHeader> */}
      <FieldArray name="family">
        {({ unshift, remove }) => (
          <>
            
            {family.map((_: IFamilyMember, index: number) => {
              const availableMembers = membersOptions.filter(
                (opt) =>
                  !selectedUserIds.includes(opt.value) ||
                  opt.value === String(family[index]?.user_id ?? "")
              );
              return (
                <Fragment key={index}>
                  {index > 0 && <HorizontalLine />}
                  {index > 0 && (
                    <FullWidth $justify={"right"}>
                      <Button
                        value="Remove"
                        variant="secondary"
                        type="button"
                        onClick={() => remove(index)}
                      />
                    </FullWidth>
                  )}
                  <FullWidth>
                  <Field
                    className="w-full"
                    component={FormikSelectField}
                    options={availableMembers}
                    onChange={async (_: string, selectedOption: string | number | null) => {
                      if (!selectedOption) {
                        handleResetMember(index);
                        return;
                      }

                      const result = await fetchAMember({
                        user_id: String(selectedOption),
                      });
                      const member = result?.data;

                      if (!member) return;

                      setFieldValue(`family.${index}`, {
                        ...getEmptyFamilyMember(),
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
                    }}
                    name={`family.${index}.user_id`}
                    id={`family.${index}.user_id`}
                    label="Find family member"
                    placeholder="Select the member ..."
                    searchable
                    clearable
                    helperText="Search and select if the person already exists in the system."
                  />
                  </FullWidth>
                  {family[index]?.user_id && (
                    <FullWidth>
                      <Button
                        value="Reset selected member"
                        variant="ghost"
                        type="button"
                        onClick={() => handleResetMember(index)}
                      />
                    </FullWidth>
                  )}
                  <FullWidth>
                    <hr/>
                  </FullWidth>
                  

                  <FullWidth>
                  <Field
                  className='w-full md:w-1/2'
                    component={FormikSelectField}
                    label="Relation *"
                    disabled={disabled}
                    placeholder="Select relation"
                    id={`family.${index}.relation`}
                    name={`family.${index}.relation`}
                    options={familyRelationOptions}
                  />
                  </FullWidth>

                  
                  <PersonalDetails
                    key={index}
                    disabled={!!family[index]?.user_id}
                    prefix={`family.${index}`}
                    requireMaritalStatus={false}
                  />

                  
                </Fragment>
              )
            })}
            <FullWidth $justify={"right"}>
              <Button
                value="+ Add another family member"
                variant="ghost"
                type="button"
                onClick={() => unshift(getEmptyFamilyMember())}
              />
            </FullWidth>
          </>
        )}
      </FieldArray>
    </>
  );
};

export interface IChildrenSubForm {
  family: IFamilyMember[];
}

const initialValues = {
  family: [getEmptyFamilyMember()],
};

const familyMemberValidationSchema = object().shape({
  ...PersonalDetails.familyValidationSchema,
  relation: string()
    .transform((_value, originalValue) => normalizeFamilyRelation(originalValue))
    .oneOf([...FAMILY_RELATION_VALUES], "Unsupported relation")
    .required("Relation is required"),
});

const validationSchema = {
  family: array()
    .when("personal_info.has_children", {
      is: true,
      then: (schema) =>
        schema
          .of(familyMemberValidationSchema)
          .min(1, "Add at least one family member")
          .test(
            "family-payload-rules",
            "Invalid family payload",
            function (members) {
              const familyError = validateFamilyPayload(members);

              if (!familyError) return true;

              if (familyError === "Duplicate spouse") {
                return this.createError({
                  message: "Max one spouse in the family list.",
                });
              }

              if (familyError === "Duplicate relationship for same member") {
                return this.createError({
                  message: "No duplicate person in the same family payload.",
                });
              }

              if (familyError === "Unsupported relation") {
                return this.createError({
                  message: "Relation must be from the allowed list.",
                });
              }

              return true;
            }
          ),
      otherwise: (schema) => schema.default([]), 
    })
};
export const ChildrenSubForm = Object.assign(ChildrenSubFormComponent, {
  initialValues,
  validationSchema,
});
