import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { Field } from "formik";

const EmergencyContactComponent = ({
  disabled = false,
  prefix
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
        id={`${prefix}.emergency_contact_name`}
        name={`${prefix}.emergency_contact_name`}
      />
      <Field
        component={FormikSelectField}
        label="Relation"
        disabled={disabled}
        id={`${prefix}.emergency_contact_relation`}
        name={`${prefix}.emergency_contact_relation`}
        options={relationOptions}
      />
      <Field
        component={FormikInputDiv}
        label="Phone Number"
        disabled={disabled}
        id={`${prefix}.emergency_contact_phone_number`}
        name={`${prefix}.emergency_contact_phone_number`}
      />
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
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone_number?: string;
}

const initialValues = {
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone_number: "",
};
const validationSchema = {};

export const EmergencyContact = Object.assign(EmergencyContactComponent, {
  initialValues,
  validationSchema,
});
