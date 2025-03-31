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
  IUserSubForm,
  IWorkInfoSubForm,
  UserSubForm,
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
      <FormLayout>
        <FormHeader>Personal Information</FormHeader>
        <UserSubForm disabled={disabled} prefix="personal_info" />
        <HorizontalLine />

        <ContactsSubForm disabled={disabled} prefix="contact_info" />
        <HorizontalLine />

        <FormHeader>Emergency Contact</FormHeader>
        <EmergencyContact disabled={disabled} prefix="emergency_contact" />
        <HorizontalLine />

        <FormHeader>Membership Status</FormHeader>
        <Field
          component={FormikSelectField}
          label="Membership Type"
          placeholder="Select membership type"
          id="church_info.membership_type"
          name="church_info.membership_type"
          options={[
            { name: "Online e-church family", value: "MEMBER" },
            { name: "In-person church family", value: "VISITOR" },
            // { name: "Pending", value: "pending" },
          ]}
          disabled={disabled}
        />
        <FullWidth>
          <div className="flex flex-col">
            <p className="text-dark900 leading-5 mb-2">
              Is this member a ministry worker?
            </p>
            <RadioInput name="is_user" />
          </div>
        </FullWidth>

        <Field
          component={FormikSelectField}
          label="Ministry/Department"
          id="church_info.department_id"
          name="church_info.department_id"
          placeholder="Select department"
          options={departmentsOptions || []}
          disabled={disabled}
        />
        {values.is_user && (
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
        )}
        <HorizontalLine />

        <WorkInfoSubForm disabled={disabled} prefix="work_info" />
        <HorizontalLine />
        {has_children && <ChildrenSubForm disabled={disabled} />}
      </FormLayout>
  );
};

export type membersType = "ONLINE" | "IN-HOUSE";
export interface IMembersForm extends IChildrenSubForm {
  personal_info: IUserSubForm;
  emergency_contact: IEmergencyContact;
  contact_info: IContactsSubForm;
  work_info: IWorkInfoSubForm;
  church_info: {
    membership_type: membersType;
    department_id?: number;
    position_id?: number;
  };
  is_user: boolean;
}

const initialValues: IMembersForm = {
  personal_info: UserSubForm.initialValues,
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
