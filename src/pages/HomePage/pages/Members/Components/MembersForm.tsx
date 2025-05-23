import { ProfilePicture } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout, FullWidth } from "@/components/ui";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import {
  ChildrenSubForm,
  ContactsSubForm,
  EmergencyContact,
  IChildrenSubForm,
  IContactsSubForm,
  IEmergencyContact,
  IUserSubForm,
  IWorkInfoSubForm,
  UserSubForm,
  WorkInfoSubForm,
} from "@components/subform";
import { Field, useFormikContext } from "formik";
import { useEffect } from "react";
import { boolean, date, object, string } from "yup";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { RadioInput } from "./RadioInput";

interface IProps {
  disabled?: boolean;
}

const MembersFormComponent = ({ disabled = false }: IProps) => {
  const { departmentsOptions, positionsOptions } = useSettingsStore();

  const { values, setFieldValue } = useFormikContext<IMembersForm>();
  const has_children = values.personal_info?.has_children ?? false;

  useEffect(() => {
    if (!values.is_user) {
      setFieldValue("church_info.position_id", "");
      setFieldValue("church_info.department_id", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.is_user]);
  useEffect(() => {
    if (has_children) {
      setFieldValue("children", initialValues.children);
    } else {
      setFieldValue("children", []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [has_children]);

  return (
    <FormLayout>
      <FormHeader>Personal Information</FormHeader>
      <FullWidth>
        <div className="flex flex-col items-center justify-center w-full">
          <ProfilePicture
            className="h-[8rem] w-[8rem] outline-lightGray mt-3 profilePic transition-all outline outline-1 duration-1000 mb-2"
            id="profile_picture"
            name="profile_picture"
            src={values.picture.src}
            alt="Profile Picture"
            editable={!disabled}
            onChange={(obj) => {
              setFieldValue(`picture`, obj);
            }}
            textClass={"text-3xl text-primary"}
          />
          <p className="text-sm ">
            Click on the <strong>pen icon</strong> to upload your profile image{" "}
          </p>
        </div>
      </FullWidth>
      <UserSubForm prefix="personal_info" />
      <HorizontalLine />

      <FormHeader>Contacts Information</FormHeader>
      <ContactsSubForm disabled={disabled} prefix="contact_info" />
      <HorizontalLine />

      <FormHeader>Emergency Contact</FormHeader>
      <EmergencyContact disabled={disabled} prefix="emergency_contact" />
      <HorizontalLine />

      <FormHeader>Membership Status</FormHeader>
      <Field
        component={FormikSelectField}
        label="Membership Type"
        placeholder="Select membership type"
        id="church_info.membership_type"
        name="church_info.membership_type"
        options={[
          { name: "Online e-church family", value: "ONLINE" },
          { name: "In-person church family", value: "IN_HOUSE" },
        ]}
        disabled={disabled}
      />
      <FullWidth>
        <div className="flex flex-col">
          <p className="text-dark900 leading-5 mb-2">
            Is this member a ministry worker?
          </p>
          <RadioInput name="is_user" />
        </div>
      </FullWidth>

      {values.is_user && (
        <Field
          component={FormikSelectField}
          label="Ministry/Department"
          id="church_info.department_id"
          name="church_info.department_id"
          placeholder="Select department"
          options={departmentsOptions || []}
          disabled={disabled}
        />
      )}

      {values.is_user && (
        <Field
          component={FormikSelectField}
          label="Position"
          id="church_info.position_id"
          name="church_info.position_id"
          placeholder="Select position"
          options={positionsOptions || []}
          disabled={disabled}
          parse={(value: string) => parseInt(value, 10)}
        />
      )}
      <Field
        component={FormikInputDiv}
        label="Date joined"
        id="church_info.member_since"
        name="church_info.member_since"
        placeholder="Select date joined"
        type="date"
        max={new Date().toISOString().split("T")[0]}
        disabled={disabled}
      />
      <HorizontalLine />

      <WorkInfoSubForm disabled={disabled} prefix="work_info" />
      <HorizontalLine />
      {has_children && <ChildrenSubForm disabled={disabled} />}
    </FormLayout>
  );
};

export type membersType = "ONLINE" | "IN_HOUSE";
export interface IMembersForm extends IChildrenSubForm {
  personal_info: IUserSubForm;
  picture: {
    src: string;
    picture: File | null;
  };
  emergency_contact: IEmergencyContact;
  contact_info: IContactsSubForm;
  work_info: IWorkInfoSubForm;
  church_info: {
    member_since?: string;
    membership_type: membersType;
    department_id?: number | string;
    position_id?: number | string;
  };
  is_user: boolean;
}

const initialValues: IMembersForm = {
  personal_info: UserSubForm.initialValues,
  picture: {
    src: "",
    picture: null,
  },
  contact_info: ContactsSubForm.initialValues,
  work_info: WorkInfoSubForm.initialValues,
  emergency_contact: EmergencyContact.initialValues,
  is_user: false,
  church_info: {
    member_since: undefined,
    membership_type: "IN_HOUSE",
    department_id: undefined,
    position_id: undefined,
  },
  ...ChildrenSubForm.initialValues,
};
const validationSchema = {
  personal_info: object(UserSubForm.validationSchema),
  contact_info: object(ContactsSubForm.validationSchema),
  work_info: object(WorkInfoSubForm.validationSchema),
  emergency_contact: object(EmergencyContact.validationSchema),
  is_user: boolean().required("Required"),
  church_info: object().shape({
    member_since: date().max(new Date()),
    membership_type: string().required("Required"),
    department_id: string().when("is_user", {
      is: true,
      then: () => string().required("Required"),
    }),
    position_id: string().when("is_user", {
      is: true,
      then: () => string().required("Required"),
    }),
  }),
  ...ChildrenSubForm.validationSchema,
};

// export default MembersForm;
export const MembersForm = Object.assign(MembersFormComponent, {
  initialValues: initialValues,
  validationSchema,
});
