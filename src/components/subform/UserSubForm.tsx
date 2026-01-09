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
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-col ">
            <p className="text-sm font-medium text-gray-700 leading-5 ">
            Do any of your family members belong to this church?          
          </p>
          <p className="text-sm font-light">
            (e.g., spouse, children, parents, siblings)
          </p>
          </div>
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
