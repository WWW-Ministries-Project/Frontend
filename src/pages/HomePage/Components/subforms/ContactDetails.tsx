import { ContactInput } from "@/components/ContactInput";
import FormikInputDiv from "@/components/FormikInput";
import SubFormWrapper from "@/Wrappers/SubFormWrapper";
import { Field } from "formik";

const ContactDetailsComponent = ({ disabled=false }: { disabled?: boolean }) => {
  return (
    <SubFormWrapper>
      <ContactInput label="Phone Number" disabled={disabled} />
      <Field
        component={FormikInputDiv}
        label="Email"
        id="email"
        name="email"
        type={"email"}
        disabled={disabled}
      />
      <Field
        component={FormikInputDiv}
        label="Address"
        id="address"
        name="address"
        disabled={disabled}
      />
    </SubFormWrapper>
  );
};

export interface IContactDetails {
  primary_number: string;
  country_code: string;
  email: string;
  address: string;
}
const initialValues: IContactDetails = {
  primary_number: "",
  country_code: "",
  email: "",
  address: "",
};
export const ContactDetails = Object.assign(ContactDetailsComponent, {
  initialValues,
});
