import { ContactInput } from "@/components/ContactInput";
import FormikInputDiv from "@/components/FormikInput";
import {
  EmergencyContact,
  IEmergencyContact,
} from "@/components/subform/EmergencyContact";
import { FormHeader } from "@/components/ui";
import { Field } from "formik";
import { string } from "yup";

const ContactsSubFormComponent = ({
  prefix,
  disabled = false,
}: {
  prefix: string;
  disabled?: boolean;
}) => {
  return (
    <>
      <FormHeader>Contacts Information</FormHeader>
      <ContactInput
        disabled={disabled}
        label={"Enter phone number"}
        prefix={prefix}
      />
      <Field
        component={FormikInputDiv}
        label="Email"
        placeholder="Enter email"
        id={`${prefix}.email`}
        name={`${prefix}.email`}
        disabled={disabled}
        type={"text"}
      />
      <Field
        component={FormikInputDiv}
        label="Country"
        placeholder="Enter country of residence"
        id={`${prefix}.resident_country`}
        name={`${prefix}.resident_country`}
        disabled={disabled}
        type={"text"}
      />
      <Field
        component={FormikInputDiv}
        label="State/Region"
        placeholder="Enter state/region of residence"
        id={`${prefix}.state_region`}
        name={`${prefix}.state_region`}
        disabled={disabled}
        type={"text"}
      />
      <Field
        component={FormikInputDiv}
        label="City"
        placeholder="Enter city of residence"
        id={`${prefix}.city`}
        name={`${prefix}.city`}
        disabled={disabled}
        type={"text"}
      />
      <FormHeader>Emergency Contact</FormHeader>
      <EmergencyContact prefix={prefix} />
    </>
  );
};

export interface IContactsSubForm extends IEmergencyContact {
  primary_number: string;
  country_code: string;
  email: string;
  resident_country: string;
  state_region: string;
  city: string;
}

const initialValues: IContactsSubForm = {
  ...EmergencyContact.initialValues,
  primary_number: "",
  country_code: "",
  email: "",
  resident_country: "",
  state_region: "",
  city: "",
};
const validationSchema = {
  primary_number: string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone number is required"),
  country_code: string().required("required"),
  email: string().email("Invalid email format").required("Email is required"),
  resident_country: string().required("Resident country is required"),
  state_region: string().required("State/Region is required"),
  city: string().required("City is required"),
  ...EmergencyContact.validationSchema,
};
export const ContactsSubForm = Object.assign(ContactsSubFormComponent, {
  initialValues,
  validationSchema,
});
