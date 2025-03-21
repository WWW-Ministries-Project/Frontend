import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import {
  ContactDetails,
  IContactDetails,
} from "@/pages/HomePage/Components/subforms/ContactDetails";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/pages/HomePage/Components/subforms/PersonalDetails";
import { Field, useFormikContext } from "formik";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { titleOptions } from "../utils";
import { RadioInput } from "./RadioInput";
import { IWorkInfoSubForm, WorkInfoSubForm } from "./subforms/WorkInfoSubForm";

interface IProps {
  disabled?: boolean;
}

const MembersFormComponent = ({ disabled = false }: IProps) => {
  // function handleChange(name: string, value: string | boolean) {
  //   props.onChange(name, value);
  // }
  const { departmentsOptions } = useSettingsStore();
  const { positionsOptions } = useSettingsStore();

  const { values } = useFormikContext<IMembersForm>();

  return (
    <>
      <div className="h-full   space-y-6">
        <section className="">
          <div className=" text-dark900 H600 font-extrabold my-5">
            Membership Status
          </div>
          <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
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
          </div>
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Personal Information
          </div>
          <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
            <Field
              component={FormikSelectField}
              label="Title"
              disabled={disabled}
              id="title"
              name="title"
              options={titleOptions}
            />
          </div>
          <PersonalDetails disabled={disabled} />
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Contact Information
          </div>
          <ContactDetails disabled={disabled} />
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Church Information
          </div>
          <div className="mb-5">
            <p className="text-dark900 leading-5 mb-2">
              Is this member a ministry worker?
            </p>
            <RadioInput name="is_user" />
          </div>
          {values.is_user && (
            <div className="w-full  grid tablet:grid-cols-2 gap-4">
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
            </div>
          )}
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Work Information
          </div>
          <WorkInfoSubForm disabled={disabled} />
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Emergency Contact
          </div>
          <div className="w-full  grid tablet:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Name of Contact"
              disabled={disabled}
              id="emergency_contact_name"
              name="emergency_contact_name"
            />
            <Field
              component={FormikSelectField}
              label="Relation"
              disabled={disabled}
              id="emergency_contact_relation"
              name="emergency_contact_relation"
              options={relationOptions}
            />
            <Field
              component={FormikInputDiv}
              label="Phone Number"
              disabled={disabled}
              id="emergency_contact_phone_number"
              name="emergency_contact_phone_number"
            />
          </div>
        </section>
        <hr className="border-t border-neutralGray " />
      </div>
    </>
  );
};

const relationOptions = [
  { name: "Brother", value: "brother" },
  { name: "Sister", value: "sister" },
  { name: "Father", value: "father" },
  { name: "Mother", value: "mother" },
  { name: "Husband", value: "husband" },
  { name: "Wife", value: "wife" },
  { name: "Son", value: "son" },
  { name: "Daughter", value: "daughter" },
  { name: "Other", value: "other" },
];

export interface IMembersForm
  extends IPersonalDetails,
    IContactDetails,
    IWorkInfoSubForm {
  membership_type: "MEMBER" | "VISITOR";
  title: string;
  is_user: boolean;
  department_id?: number;
  position_id?: number;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone_number?: string;
  link: string;
}

const initialValues: IMembersForm = {
  membership_type: "MEMBER",
  title: "",
  ...PersonalDetails.initialValues,
  ...ContactDetails.initialValues,
  is_user: false,
  department_id: undefined,
  position_id: undefined,
  ...WorkInfoSubForm.initialValues,
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone_number: "",
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
