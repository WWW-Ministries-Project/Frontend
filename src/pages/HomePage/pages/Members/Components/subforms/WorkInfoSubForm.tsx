import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout } from "@/components/ui";
import { Field, getIn, useFormikContext } from "formik";
import { useMemo } from "react";
import { OptionsType } from "../../utils/membersInterfaces";

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
      <Field
        component={FormikSelectField}
        label="Employment Status"
        placeholder="Select employment status"
        id={`${prefix}.employment_status`}
        name={`${prefix}.employment_status`}
        options={employmentOptions}
        disabled={disabled}
      />
      {employmentStatus === "employed" && (
        <>
          <Field
            component={FormikInputDiv}
            label="Name of Institution"
            placeholder="Enter name of institution"
            id={`${prefix}.work_name`}
            name={`${prefix}.work_name`}
            disabled={disabled}
          />
          <Field
            component={FormikInputDiv}
            label="Industry"
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
          label="Name of Institution"
          placeholder="Enter name of institution"
          id={`${prefix}.school_name`}
          name={`${prefix}.school_name`}
          disabled={disabled}
        />
      )}
    </>
  );
};

const employmentOptions: OptionsType[] = [
  { name: "Student", value: "student" },
  { name: "Employed", value: "employed" },
  { name: "Unemployed", value: "unemployed" },
];

export interface IWorkInfoSubForm {
  employment_status?: "student" | "employed" | "unemployed";
  work_name?: string;
  work_industry?: string;
  work_position?: string;
  school_name?: string;
}

const initialValues: IWorkInfoSubForm = {
  employment_status: "employed",
  work_name: "",
  work_industry: "",
  work_position: "",
  school_name: "",
};
const validationSchema = {};
export const WorkInfoSubForm = Object.assign(WorkInfoSubFormComponent, {
  initialValues,
  validationSchema,
});
