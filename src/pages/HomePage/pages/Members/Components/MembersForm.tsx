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
import { boolean, date, number, object, string } from "yup";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { RadioInput } from "./RadioInput";
import FormikInputDiv from "@/components/FormikInput";

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
      
      <FormHeader>Contacts Information</FormHeader>
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
          { name: "Online e-church family", value: "ONLINE" },
          { name: "In-person church family", value: "IN_HOUSE" },
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

      {values.is_user && <Field
        component={FormikSelectField}
        label="Ministry/Department"
        id="church_info.department_id"
        name="church_info.department_id"
        placeholder="Select department"
        options={departmentsOptions || []}
        disabled={disabled}
      />}
      
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
      <HorizontalLine />

      <WorkInfoSubForm disabled={disabled} prefix="work_info" />
      <HorizontalLine />
      {has_children && <ChildrenSubForm disabled={disabled} />}
    </FormLayout>
  );
};

export type membersType = "ONLINE" | "IN_HOUSE";
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
    membership_type: "IN_HOUSE",
    department_id: undefined,
    position_id: undefined,
  },
  ...ChildrenSubForm.initialValues,
};
const validationSchema = {
  personal_info: object(UserSubForm.validationSchema),
  contact_info: object(ContactsSubForm.validationSchema),
  work_info: object(WorkInfoSubForm.validationSchema),
  emergency_contact: object(EmergencyContact.validationSchema),
  is_user: boolean().required("Required"),
  church_info: object().shape({
    member_since: date().max(new Date()),
    membership_type: string().required("Required"),
    department_id: number().when("is_user", {
      is: true,
      then: () => number().required("Required"),
    }),
    position_id: number().when("is_user", {
      is: true,
      then: () => number().required("Required"),
    }),
  }),
  ...ChildrenSubForm.validationSchema,
};

// export default MembersForm;
export const MembersForm = Object.assign(MembersFormComponent, {
  initialValues: initialValues,
  validationSchema,
});
