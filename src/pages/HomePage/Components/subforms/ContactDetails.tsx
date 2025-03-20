import { ContactInput } from "@/components/ContactInput";
import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import SubFormWrapper from "@/Wrappers/SubFormWrapper";
import { Field } from "formik";
import { useCountryStore } from "../../store/coutryStore";

const ContactDetailsComponent = ({ disabled }: { disabled: boolean }) => {
  const { countryOptions } = useCountryStore();
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
      <Field
        component={FormikSelectField}
        label="Country"
        id="nationality"
        name="nationality"
        options={countryOptions || []}
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
  nationality: string;
}
const initialValues: IContactDetails = {
  primary_number: "",
  country_code: "",
  email: "",
  address: "",
  nationality: "",
};
export const ContactDetails = Object.assign(ContactDetailsComponent, {
  initialValues,
});
