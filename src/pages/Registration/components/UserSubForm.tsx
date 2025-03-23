import ProfilePicture from "@/components/ProfilePicture";
import {
  IPersonalDetails,
  PersonalDetails,
} from "@/pages/HomePage/Components/subforms/PersonalDetails";
import { RadioInput } from "@/pages/HomePage/pages/Members/Components/RadioInput";
import FullWidthWrapper from "@/Wrappers/FullWidthWrapper";
import SubFormWrapper from "@/Wrappers/SubFormWrapper";
import { useFormikContext } from "formik";

const UserSubFormComponent = () => {
  const { values, setFieldValue } = useFormikContext<IUserSubForm>();
  return (
    <section>
      <ProfilePicture
        className="h-[10rem] w-[10rem] outline-lightGray mt-3 profilePic transition-all outline outline-1 duration-1000 mb-4"
        id="profile_picture"
        name="profile_picture"
        src={values.picture.src}
        alt="Profile Picture"
        editable={true}
        onChange={(obj) => {
          setFieldValue("picture", obj);
        }}
        textClass={"text-3xl text-dark900"}
      />
      <SubFormWrapper>
        <PersonalDetails />
        <FullWidthWrapper>
          <p className="text-dark900 leading-5 mb-2">
            Are your children members of the church?
          </p>
          <RadioInput name="has_children" />
        </FullWidthWrapper>
      </SubFormWrapper>
    </section>
  );
};
interface IUserSubForm extends IPersonalDetails {
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
  has_children: false,
};

export const UserSubForm = Object.assign(UserSubFormComponent, {
  initialValues,
});
