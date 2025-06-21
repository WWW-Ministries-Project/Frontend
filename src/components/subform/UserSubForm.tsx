import {
  IPersonalDetails,
  PersonalDetails,
} from "@/components/subform/PersonalDetails";
import { FullWidth } from "@/components/ui";
import { RadioInput } from "@/pages/HomePage/pages/Members/Components/RadioInput";
import { boolean } from "yup";

const UserSubFormComponent = ({ prefix }: { prefix: string }) => {
  return (
    <>
      <PersonalDetails prefix={prefix} />
      <FullWidth>
        <div className="flex flex-col">
          <p className="text-primary leading-5 mb-2">
            Are your children members of the church?
          </p>
          <RadioInput name={`${prefix}.has_children`} />
        </div>
      </FullWidth>
    </>
  );
};
export interface IUserSubForm extends IPersonalDetails {
  has_children: boolean;
}
const initialValues = {
  ...PersonalDetails.initialValues,
  has_children: true,
};
const validationSchema = {
  ...PersonalDetails.validationSchema,
  has_children: boolean(),
};
export const UserSubForm = Object.assign(UserSubFormComponent, {
  initialValues,
  validationSchema,
});
