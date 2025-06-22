import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { Field } from "formik";
import { object, string } from "yup";
import { ContactInput, IContactInput } from "../ContactInput";
import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";

const EmergencyContactComponent = ({
  disabled = false,
  prefix,
}: {
  disabled?: boolean;
  prefix: string;
}) => {
  return (
    <>
      <Field
        component={FormikInputDiv}
        label="Name of Contact *"
        disabled={disabled}
        placeholder="Enter name of contact"
        id={`${prefix}.name`}
        name={`${prefix}.name`}
      />
      <Field
        component={FormikSelectField}
        label="Relation *"
        disabled={disabled}
        placeholder="Select relation"
        id={`${prefix}.relation`}
        name={`${prefix}.relation`}
        options={relationOptions}
      />
      {/* <Field
        component={FormikInputDiv}
        label="Phone Number"
        disabled={disabled}
        id={`${prefix}.emergency_contact_phone_number`}
        name={`${prefix}.emergency_contact_phone_number`}
      /> */}
      <ContactInput prefix={prefix} />
    </>
  );
};

const relationOptions:ISelectOption[] = [
  { label: "Brother", value: "brother" },
  { label: "Sister", value: "sister" },
  { label: "Father", value: "father" },
  { label: "Mother", value: "mother" },
  { label: "Husband", value: "husband" },
  { label: "Wife", value: "wife" },
  { label: "Son", value: "son" },
  { label: "Daughter", value: "daughter" },
  { label: "Other", value: "other" },
];

export interface IEmergencyContact {
  name?: string;
  relation?: string;
  phone?: IContactInput;
}

const initialValues: IEmergencyContact = {
  name: "",
  relation: "",
  phone: ContactInput.initialValues,
};
const validationSchema = {
  name: string().required("Required"),
  relation: string().required("Required"),
  phone: object().shape(ContactInput.validationSchema),
};

export const EmergencyContact = Object.assign(EmergencyContactComponent, {
  initialValues,
  validationSchema,
});
