import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Field } from "formik";

const ContactDetailsComponent = ({
  disabled = false,
}: {
  disabled?: boolean;
}) => {
  return (
    <>
      {/* <ContactInput label="Phone Number" disabled={disabled} /> */}
      <Field
        component={FormikInputDiv}
        label="Email *"
        id="email"
        name="email"
        type={"email"}
        disabled={disabled}
      />
      <Field
        component={FormikInputDiv}
        label="Address *"
        id="address"
        name="address"
        disabled={disabled}
      />
    </>
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
