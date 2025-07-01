import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { Field, getIn, useFormikContext } from "formik";
import { useMemo } from "react";
import { string } from "yup";
import { FormHeader } from "../ui";
import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";

const WorkInfoSubFormComponent = ({
  disabled = false,
  prefix,
}: {
  disabled?: boolean;
  prefix: string;
}) => {
  const { values: entire } = useFormikContext<IWorkInfoSubForm>();
  const employmentStatus = useMemo(
    () => getIn(entire, `${prefix}.employment_status`) || "employed",
    [entire, prefix]
  );
  return (
    <>
      <FormHeader>Work Information</FormHeader>
      <Field
        component={FormikSelectField}
        label="Employment Status *"
        placeholder="Select employment status"
        id={`${prefix}.employment_status`}
        name={`${prefix}.employment_status`}
        options={employmentOptions}
        disabled={disabled}
      />
      {["employed", "self_employed", "retired"].includes(employmentStatus) && (
        <>
          <Field
            component={FormikInputDiv}
            label="Name of Institution *"
            placeholder="Enter name of institution"
            id={`${prefix}.work_name`}
            name={`${prefix}.work_name`}
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Industry *"
            placeholder="Enter industry"
            id={`${prefix}.work_industry`}
            name={`${prefix}.work_industry`}
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Position"
            placeholder="Enter position"
            id={`${prefix}.work_position`}
            name={`${prefix}.work_position`}
            disabled={disabled}
          />
        </>
      )}
      {employmentStatus === "student" && (
        <Field
          component={FormikInputDiv}
          label="Name of Institution *"
          placeholder="Enter name of institution"
          id={`${prefix}.school_name`}
          name={`${prefix}.school_name`}
          disabled={disabled}
        />
      )}
    </>
  );
};

const employmentOptions: ISelectOption[] = [
  { label: "Student", value: "student" },
  { label: "Employed", value: "employed" },
  { label: "Self employed", value: "self_employed" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Retired", value: "retired" },
];

export interface IWorkInfoSubForm {
  employment_status?: "student" | "employed" | "self_employed"| "unemployed"| "retired";
  work_name?: string;
  work_industry?: string;
  work_position?: string;
  school_name?: string;
}

const initialValues: IWorkInfoSubForm = {
  employment_status: "employed" ,
  work_name: "",
  work_industry: "",
  work_position: "",
  school_name: "",
};
const validationSchema = {
  employment_status: string().oneOf(["student", "employed", "self_employed", "unemployed", "retired"]),
  work_name: string().when("employment_status", {
    is: (val: string) => ["employed", "self_employed", "retired"].includes(val),
    then: () => string().required("Required"),
  }),
  work_industry: string(),
  work_position: string(),
  school_name: string().when("employment_status", {
    is: "student",
    then: () => string().required("Required"),
  }),
};
export const WorkInfoSubForm = Object.assign(WorkInfoSubFormComponent, {
  initialValues,
  validationSchema,
});
