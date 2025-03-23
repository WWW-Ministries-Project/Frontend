import { ContactInput } from "@/components/ContactInput";
import FormikInputDiv from "@/components/FormikInput";
import { FormLayout } from "@/components/ui";
import { FormHeader } from "@/components/ui";
import {
  EmergencyContact,
  IEmergencyContact,
} from "@/pages/HomePage/Components/subforms/EmergencyContact";
import { Field } from "formik";

const ContactsSubFormComponent = () => {
  return (
    <section>
      <FormLayout>
        <FormHeader>Personal Information</FormHeader>
        <ContactInput disabled={false} label={"Enter phone number"} />
        <Field
          component={FormikInputDiv}
          label="Email"
          placeholder="Enter email"
          id="email"
          name="email"
          type={"text"}
        />
        <Field
          component={FormikInputDiv}
          label="Country"
          placeholder="Enter country of residence"
          id="resident_country"
          name="resident_country"
          type={"text"}
        />
        <Field
          component={FormikInputDiv}
          label="State/Region"
          placeholder="Enter state/region of residence"
          id="state_region"
          name="state_region"
          type={"text"}
        />
        <Field
          component={FormikInputDiv}
          label="City"
          placeholder="Enter city of residence"
          id="city"
          name="city"
          type={"text"}
        />
        <FormHeader>Emergency Contact</FormHeader>
        <EmergencyContact />
      </FormLayout>
    </section>
  );
};

export interface IContactsSubForm extends IEmergencyContact {
  primary_number: string;
  country_code: string;
  email: string;
}

const initialValues: IContactsSubForm = {
  ...EmergencyContact.initialValues,
  primary_number: "",
  country_code: "",
  email: "",
};
const validationSchema = { ...EmergencyContact.validationSchema };
export const ContactsSubForm = Object.assign(ContactsSubFormComponent, {
  initialValues,
  validationSchema,
});
