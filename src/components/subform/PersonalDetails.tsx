import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { formatInputDate, genderOptions } from "@/utils/helperFunctions";
import { Field, useFormikContext } from "formik";
import { date, string } from "yup";
import { maritalOptions } from "../../pages/HomePage/pages/Members/utils";
import { CountryField } from "../fields/CountryField";
import { INameInfo, NameInfo } from "./NameInfo";

const PersonalDetailsComponent = ({
  disabled = false,
  prefix,
}: {
  disabled?: boolean;
  prefix: string;
}) => {
  const { values } = useFormikContext<IPersonalDetails>();
  return (
    <>
      <NameInfo disabled={disabled} prefix={prefix} />
      <Field
        component={FormikInputDiv}
        label="Date of Birth *"
        placeholder="Enter date of birth"
        value={formatInputDate(values.date_of_birth)}
        disabled={disabled}
        id={`${prefix}.date_of_birth`}
        name={`${prefix}.date_of_birth`}
        type="date"
      />
      <Field
        component={FormikSelectField}
        label="Gender *"
        options={genderOptions}
        disabled={disabled}
        id={`${prefix}.gender`}
        name={`${prefix}.gender`}
        placeholder={"select gender"}
      />
      <Field
        component={FormikSelectField}
        label="Marital Status *"
        options={maritalOptions}
        disabled={disabled}
        id={`${prefix}.marital_status`}
        name={`${prefix}.marital_status`}
        placeholder={"select marital status"}
      />
      <CountryField disabled={disabled} prefix={prefix} />
    </>
  );
};

export interface IPersonalDetails extends INameInfo {
  date_of_birth: string;
  gender: string;
  marital_status: string;
  nationality: string;
}
const initialValues: IPersonalDetails = {
  ...NameInfo.initialValues,
  date_of_birth: "",
  gender: "",
  marital_status: "",
  nationality: "",
};
const validationSchema = {
  ...NameInfo.validationSchema,
  date_of_birth: date().max(new Date()),
  gender: string().required("Gender is required"),
  marital_status: string().required("Marital status is required"),
  nationality: string().required("Nationality is required"),
};
export const PersonalDetails = Object.assign(PersonalDetailsComponent, {
  initialValues,
  validationSchema,
});
