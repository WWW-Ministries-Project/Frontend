import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { formatInputDate, genderOptions } from "@/utils/helperFunctions";
import { Field, useFormikContext } from "formik";
import { string } from "yup";
import { maritalOptions } from "../../pages/HomePage/pages/Members/utils";
import { useCountryStore } from "../../pages/HomePage/store/coutryStore";

const PersonalDetailsComponent = ({
  disabled = false,
  prefix,
}: {
  disabled?: boolean;
  prefix: string;
}) => {
  const { countryOptions } = useCountryStore();
  const { values } = useFormikContext<IPersonalDetails>();
  return (
    <>
      <Field
        component={FormikSelectField}
        label="Title"
        disabled={disabled}
        placeholder="Select title"
        id={`${prefix}.title`}
        name={`${prefix}.title`}
        options={titleOptions}
      />
      <Field
        component={FormikInputDiv}
        label="First Name"
        disabled={disabled}
        placeholder="Enter first name"
        id={`${prefix}.first_name`}
        name={`${prefix}.first_name`}
      />
      <Field
        component={FormikInputDiv}
        label="Other Name"
        placeholder="Enter other name"
        disabled={disabled}
        id={`${prefix}.other_name`}
        name={`${prefix}.other_name`}
      />
      <Field
        component={FormikInputDiv}
        label="Last Name"
        placeholder="Enter last name"
        disabled={disabled}
        id={`${prefix}.last_name`}
        name={`${prefix}.last_name`}
      />
      <Field
        component={FormikInputDiv}
        label="Date of Birth"
        placeholder="Enter date of birth"
        value={formatInputDate(values.date_of_birth)}
        disabled={disabled}
        id={`${prefix}.date_of_birth`}
        name={`${prefix}.date_of_birth`}
        type="date"
      />
      <Field
        component={FormikSelectField}
        label="Gender"
        options={genderOptions}
        disabled={disabled}
        id={`${prefix}.gender`}
        name={`${prefix}.gender`}
        placeholder={"select gender"}
      />
      <Field
        component={FormikSelectField}
        label="Marital Status"
        options={maritalOptions}
        disabled={disabled}
        id={`${prefix}.marital_status`}
        name={`${prefix}.marital_status`}
        placeholder={"select marital status"}
      />
      <Field
        component={FormikSelectField}
        label="Country"
        placeholder="Select nationality"
        id={`${prefix}.nationality`}
        name={`${prefix}.nationality`}
        options={countryOptions || []}
        disabled={disabled}
      />
    </>
  );
};
const titleOptions = [
  { name: "Mr", value: "Mr" },
  { name: "Mrs", value: "Mrs" },
  { name: "Miss", value: "Miss" },
  { name: "Doc", value: "Doc" },
  { name: "Prof", value: "Prof" },
  { name: "Pastor", value: "Pastor" },
];
export interface IPersonalDetails {
  first_name: string;
  other_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  nationality: string;
  title: string;
}
const initialValues: IPersonalDetails = {
  title: "",
  first_name: "",
  other_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  marital_status: "",
  nationality: "",
};
const validationSchema = {
  title: string().required("Title is required"),
  first_name: string(),
  other_name: string(),
  last_name: string().required("Last name is required"),
  date_of_birth: string().required("Date of birth is required"),
  gender: string().required("Gender is required"),
  marital_status: string().required("Marital status is required"),
  nationality: string().required("Nationality is required"),
};
export const PersonalDetails = Object.assign(PersonalDetailsComponent, {
  initialValues,
  validationSchema,
});
