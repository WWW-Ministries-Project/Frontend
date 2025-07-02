import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import { formatInputDate } from "@/utils/helperFunctions";
import { Field, getIn, useFormikContext } from "formik";
import { useMemo } from "react";
import { date, string } from "yup";
import { CountryField } from "../fields/CountryField";
import { INameInfo, NameInfo } from "./NameInfo";

const PersonalDetailsComponent = ({
  disabled = false,
  prefix,
}: {
  disabled?: boolean;
  prefix: string;
}) => {
  const { values: entire } = useFormikContext<IPersonalDetails>();
  const values: IPersonalDetails = useMemo(
    () => getIn(entire, prefix) || initialValues,
    [entire, prefix]
  );

  return (
    <>
      <NameInfo disabled={disabled} prefix={prefix} />
      <Field
        component={FormikInputDiv}
        label="Date of Birth *"
        placeholder="Enter date of birth"
        value={formatInputDate(values.date_of_birth)}
        disabled={disabled}
        max={new Date().toISOString().split("T")[0]}
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

const genderOptions: ISelectOption[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];
const maritalOptions: ISelectOption[] = [
  { label: "Single", value: "SINGLE" },
  { label: "Married", value: "MARRIED" },
  { label: "Divorced", value: "DIVORCED" },
  { label: "Widow", value: "WIDOW" },
  { label: "Widower", value: "WIDOWER" },
];

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
  date_of_birth: date().max(new Date()).required("required"),
  gender: string().required("Gender is required"),
  marital_status: string().required("Marital status is required"),
  nationality: string().required("Nationality is required"),
};
export const PersonalDetails = Object.assign(PersonalDetailsComponent, {
  initialValues,
  validationSchema,
});
