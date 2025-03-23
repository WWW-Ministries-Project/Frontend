import FormikInputDiv from "@/components/FormikInput";
import SubFormWrapper from "@/Wrappers/SubFormWrapper";
import { Field } from "formik";

const WorkInfoSubFormComponent = ({ disabled=false }: { disabled?: boolean }) => {
  return (
    <SubFormWrapper>
      <Field
        component={FormikInputDiv}
        label="Name of Institution"
        placeholder="Enter name of institution"
        id="work_name"
        name="work_name"
        disabled={disabled}
      />
      <Field
        component={FormikInputDiv}
        label="Industry"
        placeholder="Enter industry"
        id="work_industry"
        name="work_industry"
        disabled={disabled}
      />
      <Field
        component={FormikInputDiv}
        label="Position"
        placeholder="Enter position"
        id="work_position"
        name="work_position"
        disabled={disabled}
      />
    </SubFormWrapper>
  );
};

export interface IWorkInfoSubForm {
  work_name?: string;
  work_industry?: string;
  work_position?: string;
}

const initialValues = {
  work_name: "",
  work_industry: "",
  work_position: "",
};
export const WorkInfoSubForm = Object.assign(WorkInfoSubFormComponent, {
  initialValues,
});
