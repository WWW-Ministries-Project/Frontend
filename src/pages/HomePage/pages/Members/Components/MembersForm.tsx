import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { fetchCountries } from "@/pages/HomePage/utils";
import {
  ChildrenSubForm,
  ContactsSubForm,
  EmergencyContact,
  IChildrenSubForm,
  IContactsSubForm,
  IEmergencyContact,
  IPersonalDetails,
  IWorkInfoSubForm,
  PersonalDetails,
  WorkInfoSubForm,
} from "@components/subform";
import { Field, getIn, useFormikContext } from "formik";
import { useEffect, useMemo } from "react";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { RadioInput } from "./RadioInput";

interface IProps {
  disabled?: boolean;
}

const MembersFormComponent = ({ disabled = false }: IProps) => {
  const { departmentsOptions } = useSettingsStore();
  const { positionsOptions } = useSettingsStore();

  const { values } = useFormikContext<IMembersForm>();
  const { has_children } = useMemo(
    () => getIn(values, "personal_info") || false,
    [values]
  );

  const countryStore = useCountryStore();

  // Fetch countries on mount if not already in store
  useEffect(() => {
    if (!countryStore.countries.length) {
      fetchCountries().then((data) => {
        countryStore.setCountries(data);
      });
    }
  }, [countryStore]);

  return (
    <>
      <FormLayout>
        <FormHeader>Membership Status</FormHeader>
        <Field
          component={FormikSelectField}
          label="Membership Type"
          id="church_info.membership_type"
          name="church_info.membership_type"
          options={[
            { name: "Online e-church family", value: "MEMBER" },
            { name: "In-person church family", value: "VISITOR" },
            // { name: "Pending", value: "pending" },
          ]}
          disabled={disabled}
        />
        <HorizontalLine />

        <FormHeader>Personal Information</FormHeader>
        <PersonalDetails disabled={disabled} prefix="personal_info" />
        <HorizontalLine />

        <ContactsSubForm disabled={disabled} prefix="contact_info" />
        <HorizontalLine />

        <EmergencyContact disabled={disabled} prefix="emergency_contact" />
        <HorizontalLine />

        <FullWidth>
          <div className="flex flex-col">
            <p className="text-primary leading-5 mb-2">
              Is this member a ministry worker?
            </p>
            <RadioInput name="is_user" />
          </div>
        </FullWidth>
        {values.is_user && (
          <>
            {/* bug from backend */}
            <Field
              component={FormikSelectField}
              label="Ministry/Department"
              id="church_info.department_id"
              name="church_info.department_id"
              placeholder="Select department"
              options={departmentsOptions || []}
              disabled={disabled}
            />
            <Field
              component={FormikSelectField}
              label="Position"
              id="church_info.position_id"
              name="church_info.position_id"
              placeholder="Select position"
              options={positionsOptions || []}
              disabled={disabled}
              parse={(value: string) => parseInt(value, 10)}
            />
          </>
        )}
        <HorizontalLine />

        <WorkInfoSubForm disabled={disabled} prefix="work_info" />
        <HorizontalLine />
        <FullWidth>
          <div className="flex flex-col">
            <p className="text-primary leading-5 mb-2">
              Are your children members of the church?
            </p>
            <RadioInput name={`${"personal_info"}.has_children`} />
          </div>
        </FullWidth>
        {has_children && <ChildrenSubForm disabled={disabled} />}
      </FormLayout>
    </>
  );
};

export interface IMembersForm extends IChildrenSubForm {
  personal_info: IPersonalDetails;
  emergency_contact: IEmergencyContact;
  contact_info: IContactsSubForm;
  work_info: IWorkInfoSubForm;
  church_info: {
    membership_type: "ONLINE" | "IN-HOUSE";
    department_id?: number;
    position_id?: number;
  };
  is_user: boolean;
}

const initialValues: IMembersForm = {
  personal_info: PersonalDetails.initialValues,
  contact_info: ContactsSubForm.initialValues,
  work_info: WorkInfoSubForm.initialValues,
  emergency_contact: EmergencyContact.initialValues,
  is_user: false,
  church_info: {
    membership_type: "IN-HOUSE",
    department_id: undefined,
    position_id: undefined,
  },
  ...ChildrenSubForm.initialValues,
};

// export default MembersForm;
export const MembersForm = Object.assign(MembersFormComponent, {
  initialValues: initialValues,
  schema: {},
});
