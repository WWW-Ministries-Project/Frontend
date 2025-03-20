import FormikInputDiv from "@/components/FormikInput";
import SubFormWrapper from "@/Wrappers/SubFormWrapper";
import { Field } from "formik";

const WorkInfoSubFormComponent = ({ disabled }: { disabled: boolean }) => {
  return (
    <SubFormWrapper>
      <Field
        component={FormikInputDiv}
        label="Name of Institution"
        id="work_name"
        name="work_name"
        disabled={disabled}
      />
      <Field
        component={FormikInputDiv}
        label="Industry"
        id="work_industry"
        name="work_industry"
        disabled={disabled}
      />
      <Field
        component={FormikInputDiv}
        label="Position"
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
