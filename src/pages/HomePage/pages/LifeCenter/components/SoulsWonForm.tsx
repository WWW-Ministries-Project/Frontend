import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { FormHeader, FormLayout } from "@/components/ui";
import { Field, Form, Formik } from "formik";
import { object, string } from "yup";

interface IProps {
  onSubmit: (values: ISoulsWonForm) => void;
  onClose: () => void;
}
export const SoulsWonForm = ({ onSubmit, onClose }: IProps) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values, { resetForm }) => {
        onSubmit(values);
        resetForm();
      }}
    >
      {({ isSubmitting, handleSubmit }) => (
        <Form className="space-y-6 w-[90vw] sm:w-[70vw] xl:w-[50vw] p-6">
          <FormLayout>
            <FormHeader>Add a Soul</FormHeader>
            <Field
              name="first_name"
              component={FormikInputDiv}
              label="First Name"
              id="first_name"
              placeholder="Enter first name"
            />
            <Field
              name="last_name"
              component={FormikInputDiv}
              label="Last Name"
              id="last_name"
              placeholder="Enter last name"
            />
            <Field
              name="contact_number"
              component={FormikInputDiv}
              label="Contact"
              id="contact"
              placeholder="Enter phone number"
            />
            <Field
              name="contact_email"
              component={FormikInputDiv}
              label="Email"
              id="email"
              placeholder="Email"
            />
            <Field
              name="country"
              component={FormikInputDiv}
              label="Country"
              id="location"
              placeholder="Enter country"
            />
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
              name="won_by"
              component={FormikInputDiv}
              label="Won By"
              id="won_by"
              placeholder="Enter name of person who won the soul"
            />
          </FormLayout>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              value="Save"
              variant="primary"
              onClick={handleSubmit}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
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
export interface ISoulsWonForm {
  first_name: string;
  last_name: string;
  contact_number: string;
  contact_email: string;
  country: string;
  city: string;
  date_won: string;
  won_by: string;
  id?: string;
}
const initialValues: ISoulsWonForm = {
  first_name: "",
  last_name: "",
  contact_number: "",
  contact_email: "",
  country: "",
  city: "",
  date_won: "",
  won_by: "",
  id: "",
};

const validationSchema = object().shape({
  first_name: string().required("required"),
  last_name: string().required("required"),
  contact_email: string().email().required("required"),
  contact_number: string().required("required"),
  country: string().required("required"),
  city: string().required("required"),
  date_won: string().required("required"),
  won_by: string().required("required"),
});
