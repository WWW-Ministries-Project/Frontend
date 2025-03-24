import FormikSelectField from "@/components/FormikSelect";
import {
  EmergencyContact,
  IEmergencyContact,
} from "@/components/subform/EmergencyContact";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/pages/HomePage/Components/subforms/PersonalDetails";
import { ContactsSubForm, IContactsSubForm } from "@components/subform";
import { Field, useFormikContext } from "formik";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { RadioInput } from "./RadioInput";
import { IWorkInfoSubForm, WorkInfoSubForm } from "./subforms/WorkInfoSubForm";

interface IProps {
  disabled?: boolean;
}

const MembersFormComponent = ({ disabled = false }: IProps) => {
  const { departmentsOptions } = useSettingsStore();
  const { positionsOptions } = useSettingsStore();

  const { values } = useFormikContext<IMembersForm>();

  return (
    <>
      <FormLayout>
        <FormHeader>Membership Status</FormHeader>
          <Field
            component={FormikSelectField}
            label="Membership Type"
            disabled={disabled}
            id="membership_type"
            name="membership_type"
            options={[
              { name: "Member", value: "MEMBER" },
              { name: "Visitor", value: "VISITOR" },
            ]}
          />
        <HorizontalLine />

        <FormHeader>Personal Information</FormHeader>
        <PersonalDetails disabled={disabled} prefix="personal_info" />
        <HorizontalLine />

        <ContactsSubForm disabled={disabled} prefix="contact_info" />
        <HorizontalLine />

        <FormHeader>Church Information</FormHeader>
        <FullWidth>
          <div className="flex flex-col">
            <p className="text-dark900 leading-5 mb-2">
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
              id="department_id"
              name="department_id"
              options={departmentsOptions || []}
              disabled={disabled}
            />
            <Field
              component={FormikSelectField}
              label="Position"
              id="position_id"
              name="position_id"
              options={positionsOptions || []}
              disabled={disabled}
              parse={(value: string) => parseInt(value, 10)}
            />
          </>
        )}
        <HorizontalLine />

        <FormHeader>Work Information</FormHeader>
        <WorkInfoSubForm disabled={disabled} prefix="work_info" />
        <HorizontalLine />
        
        <FormHeader>Emergency Contact</FormHeader>
        <EmergencyContact prefix="emergency_contacts" disabled={disabled} />
        <HorizontalLine />
      </FormLayout>
    </>
  );
};

export interface IMembersForm
  extends IPersonalDetails,
    IContactsSubForm,
    IWorkInfoSubForm,
    IEmergencyContact {
  membership_type: "MEMBER" | "VISITOR";
  title: string;
  is_user: boolean;
  department_id?: number;
  position_id?: number;
  link: string;
}

const initialValues: IMembersForm = {
  membership_type: "MEMBER",
  ...PersonalDetails.initialValues,
  ...ContactsSubForm.initialValues,
  is_user: false,
  department_id: undefined,
  position_id: undefined,
  ...WorkInfoSubForm.initialValues,
  ...EmergencyContact.initialValues,
  link: "",
};

// export default MembersForm;
export const MembersForm = Object.assign(MembersFormComponent, {
  initialValues: initialValues,
  schema: {},
});

// export interface IMembersForm {
//   membership_type: "MEMBER" | "VISITOR";
//   title: string;
//   first_name: string;
//   other_name?: string;
//   last_name: string;
//   date_of_birth: string;
//   gender: string;
//   marital_status: string;
//   primary_number: string;
//   country_code: string;
//   email: string;
//   address: string;
//   nationality: string;
//   is_user: boolean;
//   department_id?: number;
//   position_id?: number;
//   work_name?: string;
//   work_industry?: string;
//   work_position?: string;
//   emergency_contact_name?: string;
//   emergency_contact_relation?: string;
//   emergency_contact_phone_number?: string;
//   link: string;
// }
