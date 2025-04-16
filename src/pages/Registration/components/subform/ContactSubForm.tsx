import {
  ContactsSubForm,
  EmergencyContact,
  IContactsSubForm,
  IEmergencyContact,
} from "@/components/subform";
import { FormHeader } from "@/components/ui";
import { object } from "yup";

const RegistrationContactSubFormComponent = () => {
  return (
    <div className="w-full flex flex-col gap-4  md:grid md:grid-cols-2">
      <FormHeader>Contacts Information</FormHeader>
      <ContactsSubForm prefix="contact_info" />
      <FormHeader>Emergency Contact</FormHeader>
      <EmergencyContact prefix="emergency_contact" />
    </div>
  );
};
export interface IRegistrationContactSubForm {
  contact_info: IContactsSubForm;
  emergency_contact: IEmergencyContact;
}

const initialValues: IRegistrationContactSubForm = {
  contact_info: ContactsSubForm.initialValues,
  emergency_contact: EmergencyContact.initialValues,
};

// const validationSchema = {
//   contact_info: object().shape({}),
//   emergency_contact: object().shape({}),
// };
const validationSchema = {
  contact_info: object().shape(ContactsSubForm.validationSchema),
  emergency_contact: object().shape(EmergencyContact.validationSchema),
};
export const RegistrationContactSubForm = Object.assign(
  RegistrationContactSubFormComponent,
  {
    initialValues,
    validationSchema,
  }
);
