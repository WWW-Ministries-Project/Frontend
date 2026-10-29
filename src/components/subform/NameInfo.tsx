import { Field } from "formik";
import { string } from "yup";
import { FormikInputDiv } from "../FormikInputDiv";
import FormikSelectField from "../FormikSelect";
import { TITLE_OPTIONS } from "./titleOptions";

const NameInfoComponent = ({
  disabled = false,
  prefix,
  showRequiredMarkers = true,
}: {
  disabled?: boolean;
  prefix?: string;
  showRequiredMarkers?: boolean;
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
        options={TITLE_OPTIONS}
        clearable
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
        label={`Last Name${showRequiredMarkers ? " *" : ""}`}
        placeholder="Enter last name"
        disabled={disabled}
        id={prefix ? `${prefix}.last_name` : "last_name"}
        name={prefix ? `${prefix}.last_name` : "last_name"}
      />
    </>
  );
};

export interface INameInfo {
  title?: string;
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
  other_name: string()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === null ? "" : value
    ),
  last_name: string().required(" required"),
};
export const NameInfo = Object.assign(NameInfoComponent, {
  initialValues,
  validationSchema,
});
