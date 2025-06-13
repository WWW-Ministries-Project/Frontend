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
        label="Title *"
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

const titleOptions = [
  { name: "Mr", value: "Mr" },
  { name: "Mrs", value: "Mrs" },
  { name: "Miss", value: "Miss" },
  { name: "Doc", value: "Doc" },
  { name: "Prof", value: "Prof" },
  { name: "Pastor", value: "Pastor" },
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
  title: string().required("required"),
  first_name: string(),
  other_name: string(),
  last_name: string().required(" required"),
};
export const NameInfo = Object.assign(NameInfoComponent, {
  initialValues,
  validationSchema,
});
