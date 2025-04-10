import { ContactInput, IContactInput } from "@/components/ContactInput";
import FormikInputDiv from "@/components/FormikInput";
import { FormHeader } from "@/components/ui";
import { Field } from "formik";
import { object, string } from "yup";
import { CountryField } from "../fields/CountryField";

const ContactsSubFormComponent = ({
  prefix,
  disabled = false,
}: {
  prefix: string;
  disabled?: boolean;
}) => {
  return (
    <>
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
      <CountryField
        prefix={prefix}
        disabled={disabled}
        label="Country"
        placeholder="Enter country of residence"
        name={`${prefix}.resident_country`}
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
      {/* <FormHeader>Emergency Contact</FormHeader> */}
      {/* <EmergencyContact prefix={prefix} /> */}
    </>
  );
};

export interface IContactsSubForm {
  email: string;
  resident_country: string;
  state_region: string;
  city: string;
  phone: IContactInput;
}

const initialValues: IContactsSubForm = {
  email: "",
  resident_country: "",
  state_region: "",
  city: "",
  phone: ContactInput.initialValues,
  // ...EmergencyContact.initialValues,
};
const validationSchema = {
  email: string().email("Invalid email format").required("Email is required"),
  resident_country: string().required("Resident country is required"),
  state_region: string().required("State/Region is required"),
  city: string().required("City is required"),
  phone: object().shape(ContactInput.validationSchema),
  // ...EmergencyContact.validationSchema,
};
export const ContactsSubForm = Object.assign(ContactsSubFormComponent, {
  initialValues,
  validationSchema,
});
