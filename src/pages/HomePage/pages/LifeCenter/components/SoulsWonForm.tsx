import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { FormHeader, FormLayout } from "@/components/ui";
import { Field, Form, Formik } from "formik";
import { object, string } from "yup";
import FormikSelectField from "@/components/FormikSelect";
import { useStore } from "@/store/useStore";
import { useMemo } from "react";
import { ContactInput, IContactInput } from "@/components/ContactInput";
import { INameInfo, NameInfo } from "@/components/subform";
import { CountryField } from "@/components/fields/CountryField";

interface IProps {
  onSubmit: (values: ISoulsWonForm) => void;
  onClose: () => void;
  editData: ISoulsWonForm | null;
  loading: boolean;
}
export const SoulsWonForm = ({
  onSubmit,
  onClose,
  editData,
  loading,
}: IProps) => {
  const { members: allMembers } = useStore();
  const members = useMemo(() => {
    return Array.isArray(allMembers)
      ? allMembers.map((event) => ({
          name: event?.name,
          value: event?.id,
        }))
      : [];
  }, [allMembers]);

  const initial = useMemo(() => editData || initialValues, [editData]);
  return (
    <Formik
      initialValues={initial}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        // onSubmit(values);
        console.log(values)
      }}
    >
      {({ handleSubmit }) => (
        <Form className="space-y-6 w-[90vw] sm:w-[70vw] xl:w-[50vw] p-6">
          <FormLayout>
            <FormHeader>{initial.id ? "Update" : "Add"} a Soul</FormHeader>
            <NameInfo prefix="name_info"/>
            <ContactInput />
            <Field
              name="contact_email"
              component={FormikInputDiv}
              label="Email"
              id="contact_email"
              placeholder="Email"
            />
            {/* <Field
              name="country"
              component={FormikInputDiv}
              label="Country"
              id="country"
              placeholder="Enter country"
            /> */}
            <CountryField name="country"/>
            <Field
              name="city"
              component={FormikInputDiv}
              label="City"
              id="city"
              placeholder="Enter city"
            />
            <Field
              type="date"
              name="date_won"
              component={FormikInputDiv}
              label="Date Won"
              id="date_won"
              placeholder="Select date"
            />
            <Field
              name="wonById"
              component={FormikSelectField}
              options={members}
              label="Won By"
              id="wonById"
              placeholder="Soul won by"
            />
          </FormLayout>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={loading}
              value={initial.id ? "Update" : "Save"}
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
            />
            <Button
              type="submit"
              disabled={loading}
              value="Cancel"
              variant="secondary"
              onClick={onClose}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};
export interface ISoulsWonForm extends INameInfo {
  // first_name: string;
  // last_name: string;
  
  contact_email: string;
  country: string;
  phone: IContactInput
  city: string;
  date_won: string;
  wonById: string;
  id: string;
  lifeCenterId: string;
}
const initialValues: ISoulsWonForm = {
  // first_name: "",
  // last_name: "",
  ...NameInfo.initialValues,
  phone:ContactInput.initialValues,
  contact_email: "",
  country: "",
  city: "",
  date_won: "",
  wonById: "",
  id: "",
  lifeCenterId: "",
};

const validationSchema = object().shape({
  // first_name: string().required("required"),
  // last_name: string().required("required"),
  // contact_email: string().email().required("required"),
  // contact_number: string().required("required"),
  // country: string().required("required"),
  // city: string().required("required"),
  // date_won: string().required("required"),
  // wonById: string().required("required"),
  // ...ContactInput.validationSchema
  // ...NameInfo.validationSchema
});
