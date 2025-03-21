import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { formatInputDate, genderOptions } from "@/utils/helperFunctions";
import SubFormWrapper from "@/Wrappers/SubFormWrapper";
import { Field, useFormikContext } from "formik";
import { maritalOptions } from "../../pages/Members/utils";

const PersonalDetailsComponent = ({ disabled }: { disabled: boolean }) => {
  const { values } = useFormikContext<IPersonalDetails>();
  return (
    <SubFormWrapper>
      <Field
        component={FormikInputDiv}
        label="First Name"
        disabled={disabled}
        id="first_name"
        name="first_name"
      />
      <Field
        component={FormikInputDiv}
        label="Other Name"
        disabled={disabled}
        id="other_name"
        name="other_name"
      />
      <Field
        component={FormikInputDiv}
        label="Last Name"
        disabled={disabled}
        id="last_name"
        name="last_name"
      />
      <Field
        component={FormikInputDiv}
        label="Date of Birth"
        value={formatInputDate(values.date_of_birth)}
        disabled={disabled}
        id="date_of_birth"
        name="date_of_birth"
        type="date"
      />
      <Field
        component={FormikSelectField}
        label="Gender"
        options={genderOptions}
        disabled={disabled}
        id="gender"
        name="gender"
        placeholder={"select gender"}
      />
      <Field
        component={FormikSelectField}
        label="Marital Status"
        options={maritalOptions}
        disabled={disabled}
        id="marital_status"
        name="marital_status"
        placeholder={"select marital status"}
      />
    </SubFormWrapper>
  );
};
export interface IPersonalDetails {
  first_name: string;
  other_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
}
const initialValues:IPersonalDetails = {
  first_name: "",
  other_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  marital_status: "",
};
export const PersonalDetails = Object.assign(PersonalDetailsComponent, {
  initialValues,
});
