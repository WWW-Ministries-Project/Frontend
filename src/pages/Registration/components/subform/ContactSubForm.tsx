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
    <>
      <FormHeader>Contacts Information</FormHeader>
      <ContactsSubForm prefix="contact_info" />
      <FormHeader>Emergency Contact</FormHeader>
      <EmergencyContact prefix="emergency_contact" />
    </>
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
