import { Field } from "formik";
import { string } from "yup";
import FormikInputDiv from "../FormikInput";
import FormikSelectField from "../FormikSelect";

const NameInfoComponent = ({
  disabled = false,
  prefix,
}: {
  disabled?: boolean;
  prefix: string;
}) => {
  return (
    <>
      <Field
        component={FormikSelectField}
        label="Title *"
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
        label="Last Name *"
        placeholder="Enter last name"
        disabled={disabled}
        id={`${prefix}.last_name`}
        name={`${prefix}.last_name`}
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
  title: string().required("Title is required"),
  first_name: string(),
  other_name: string(),
  last_name: string().required("Last name is required"),
};
export const NameInfo = Object.assign(NameInfoComponent, {
  initialValues,
  validationSchema,
});
