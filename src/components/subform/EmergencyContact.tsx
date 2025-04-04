import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { Field } from "formik";
import { object, string } from "yup";
import { ContactInput, IContactInput } from "../ContactInput";

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
        label="Name of Contact"
        disabled={disabled}
        placeholder="Enter name of contact"
        id={`${prefix}.name`}
        name={`${prefix}.name`}
      />
      <Field
        component={FormikSelectField}
        label="Relation"
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

const relationOptions = [
  { name: "Brother", value: "brother" },
  { name: "Sister", value: "sister" },
  { name: "Father", value: "father" },
  { name: "Mother", value: "mother" },
  { name: "Husband", value: "husband" },
  { name: "Wife", value: "wife" },
  { name: "Son", value: "son" },
  { name: "Daughter", value: "daughter" },
  { name: "Other", value: "other" },
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
