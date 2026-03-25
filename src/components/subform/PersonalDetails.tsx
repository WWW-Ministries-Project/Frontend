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
  requireMaritalStatus = true,
}: {
  disabled?: boolean;
  prefix: string;
  requireMaritalStatus?: boolean;
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
        label={`Marital Status${requireMaritalStatus ? " *" : ""}`}
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

const createValidationSchema = ({
  requireMaritalStatus = true,
}: {
  requireMaritalStatus?: boolean;
} = {}) => ({
  ...NameInfo.validationSchema,
  date_of_birth: date().max(new Date()).required("required"),
  gender: string().required("Gender is required"),
  marital_status: requireMaritalStatus
    ? string().required("Marital status is required")
    : string(),
  nationality: string().required("Nationality is required"),
});

const validationSchema = createValidationSchema();
const familyValidationSchema = createValidationSchema({
  requireMaritalStatus: false,
});

export const PersonalDetails = Object.assign(PersonalDetailsComponent, {
  initialValues,
  validationSchema,
  familyValidationSchema,
  createValidationSchema,
});
