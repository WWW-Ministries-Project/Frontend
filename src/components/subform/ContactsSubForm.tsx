import { ContactInput } from "@/components/ContactInput";
import FormikInputDiv from "@/components/FormikInput";
import {
  EmergencyContact,
  IEmergencyContact,
} from "@/components/subform/EmergencyContact";
import { FormHeader, FormLayout } from "@/components/ui";
import { Field } from "formik";

const ContactsSubFormComponent = ({
  prefix,
  disabled = false,
}: {
  prefix: string;
  disabled?: boolean;
}) => {
  return (
    <section>
      <FormLayout>
        <FormHeader>Personal Information</FormHeader>
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
      </FormLayout>
    </section>
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
const validationSchema = { ...EmergencyContact.validationSchema };
export const ContactsSubForm = Object.assign(ContactsSubFormComponent, {
  initialValues,
  validationSchema,
});
