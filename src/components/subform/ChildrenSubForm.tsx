import { Button } from "@/components";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/components/subform/PersonalDetails";
import { FormHeader, FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { Field, FieldArray, getIn, useFormikContext } from "formik";
import { Fragment, useMemo } from "react";
import { array, object } from "yup";
import FormikSelectField from "../FormikSelect";
import { relationOptions } from "./EmergencyContact";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useStore } from "@/store/useStore";

type IFamilyMember = IPersonalDetails & {
  user_id?: string;
  relation?: string;
  email?: string;
};

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

   const {
      data,
      refetch: fetchAMembers,
      loading: memberLoading,
    } = useFetch(api.fetch.fetchAMember, {}, true);
    const memberData = data?.data || null;
    const membersOptions = useStore((state) => state.membersOptions);

    const selectedUserIds = useMemo(
      () => family.map((f: IFamilyMember) => f.user_id).filter(Boolean),
      [family]
    );

    const handleResetMember = (index: number) => {
      setFieldValue(`family.${index}`, {
        ...PersonalDetails.initialValues,
        relation: family[index]?.relation ?? "",
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
                  opt.value === family[index]?.user_id
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
                    onChange={async (_: string, selectedOption: string | null) => {
                      if (!selectedOption) {
                        setFieldValue(`family.${index}.user_id`, "");
                        return;
                      }

                      const result = await fetchAMembers({ user_id: selectedOption });
                      const member = result?.data;

                      if (!member) return;

                      setFieldValue(`family.${index}`, {
                        ...PersonalDetails.initialValues,
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
                    options={relationOptions}
                  />
                  </FullWidth>

                  
                  <PersonalDetails
                    key={index}
                    disabled={!!family[index]?.user_id}
                    prefix={`family.${index}`}
                  />

                  
                </Fragment>
              )
            })}
            <FullWidth $justify={"right"}>
              <Button
                value="+ Add another family member"
                variant="ghost"
                type="button"
                onClick={() => unshift(PersonalDetails.initialValues)}
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
  family: [PersonalDetails.initialValues],
};

const validationSchema = {
  family: array()
    .when("personal_info.has_children", {
      is: true,
      then: (schema) => schema.of(object().shape(PersonalDetails.validationSchema)).min(1),
      otherwise: (schema) => schema.default([]), 
    })
};
export const ChildrenSubForm = Object.assign(ChildrenSubFormComponent, {
  initialValues,
  validationSchema,
});
