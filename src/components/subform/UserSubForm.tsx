import { ProfilePicture } from "@/components";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/components/subform/PersonalDetails";
import { FullWidth } from "@/components/ui";
import { RadioInput } from "@/pages/HomePage/pages/Members/Components/RadioInput";
import { getIn, useFormikContext } from "formik";
import { useMemo } from "react";
import { boolean } from "yup";

const UserSubFormComponent = ({
  prefix,
  disabled,
}: {
  prefix: string;
  disabled?: boolean;
}) => {
  const { values: entire, setFieldValue } = useFormikContext<object>();
  const values: IUserSubForm = useMemo(
    () => getIn(entire, prefix) || initialValues,
    [entire, prefix]
  );
  return (
    <>
      <FullWidth>
        <div className="flex flex-col items-center justify-center w-full">
        <ProfilePicture
          className="h-[8rem] w-[8rem] outline-lightGray mt-3 profilePic transition-all outline outline-1 duration-1000 mb-2"
          id="profile_picture"
          name="profile_picture"
          src={values.picture.src}
          alt="Profile Picture"
          editable={true}
          onChange={(obj) => {
            setFieldValue(`${prefix}.picture`, obj);
          }}
          textClass={"text-3xl text-primary"}
        />
        <p className="text-sm ">Click on the <strong>pen icon</strong> to upload your profile image </p>
        </div>
      </FullWidth>
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
  picture: {
    src: string;
    picture: File | null;
  };
  has_children: boolean;
}
const initialValues = {
  ...PersonalDetails.initialValues,
  picture: {
    src: "",
    picture: null,
  },
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
