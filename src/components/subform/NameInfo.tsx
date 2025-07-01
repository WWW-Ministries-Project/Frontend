import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import { Field } from "formik";
import { string } from "yup";
import { FormikInputDiv } from "../FormikInputDiv";
import FormikSelectField from "../FormikSelect";

const NameInfoComponent = ({
  disabled = false,
  prefix,
}: {
  disabled?: boolean;
  prefix?: string;
}) => {
  return (
    <>
      <Field
        component={FormikSelectField}
        label="Title"
        disabled={disabled}
        placeholder="Select title"
        id={prefix ? `${prefix}.title` : "title"}
        name={prefix ? `${prefix}.title` : "title"}
        options={titleOptions}
      />
      <Field
        component={FormikInputDiv}
        label="First Name"
        disabled={disabled}
        placeholder="Enter first name"
        id={prefix ? `${prefix}.first_name` : "first_name"}
        name={prefix ? `${prefix}.first_name` : "first_name"}
      />
      <Field
        component={FormikInputDiv}
        label="Other Name"
        placeholder="Enter other name"
        disabled={disabled}
        id={prefix ? `${prefix}.other_name` : "other_name"}
        name={prefix ? `${prefix}.other_name` : "other_name"}
      />
      <Field
        component={FormikInputDiv}
        label="Last Name *"
        placeholder="Enter last name"
        disabled={disabled}
        id={prefix ? `${prefix}.last_name` : "last_name"}
        name={prefix ? `${prefix}.last_name` : "last_name"}
      />
    </>
  );
};

const titleOptions: ISelectOption[] = [
  { label: "Mr", value: "Mr" },
  { label: "Mrs", value: "Mrs" },
  { label: "Miss", value: "Miss" },
  { label: "Ms", value: "Ms" },
  { label: "Dr", value: "Dr" },
  { label: "Prof", value: "Prof" },
  { label: "Pastor", value: "Pastor" },
  { label: "Apostle", value: "Apostle" },
  { label: "Prophet", value: "Prophet" },
  { label: "Evangelist", value: "Evangelist" },
  { label: "Teacher", value: "Teacher" },
  { label: "Bishop", value: "Bishop" },
  { label: "Rev", value: "Rev" },
  { label: "Elder", value: "Elder" },
  { label: "Deacon", value: "Deacon" },
  { label: "Deaconess", value: "Deaconess" },
  { label: "Minister", value: "Minister" },
  { label: "Hon", value: "Hon" },
  { label: "Sir", value: "Sir" },
  { label: "Lady", value: "Lady" },
];

export interface INameInfo {
  title: string;
  first_name: string;
  other_name?: string;
  last_name: string;
}

const initialValues: INameInfo = {
  title: "",
  first_name: "",
  other_name: "",
  last_name: "",
};
const validationSchema = {
  title: string(),
  first_name: string(),
  other_name: string(),
  last_name: string().required(" required"),
};
export const NameInfo = Object.assign(NameInfoComponent, {
  initialValues,
  validationSchema,
});
