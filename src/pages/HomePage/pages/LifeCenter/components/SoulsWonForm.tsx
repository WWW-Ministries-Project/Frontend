import { FormikInputDiv } from "@/components/FormikInputDiv";
import { Formik, Form, Field } from "formik";
import { Button } from "@/components";
import { SoulsWonType } from "@/utils";
import { FormLayout } from "@/components/ui";
import { object,string } from "yup";

interface IProps {
  onSubmit: (values: SoulsWonType) => void;
  onClose: () => void;
}
export const SoulsWonForm = ({ onSubmit, onClose }: IProps) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={soulsWonSchema}
      onSubmit={(values, { resetForm }) => {
        onSubmit(values);
        resetForm();
      }}
    >
      {({ isSubmitting, handleSubmit }) => (
        <Form className="space-y-6 w-[90vw] sm:w-[70vw] xl:w-[50vw] p-6">
          <h3 className="text-lg font-semibold">Add a Soul</h3>

          <div>
            <FormLayout>
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
          </div>

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

const initialValues: SoulsWonType = {
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

const soulsWonSchema = object().shape({
  first_name: string().required("First name is required"),
  last_name: string().required("Last name is required"),
  contact_email: string().email().required("Email is required"),
  contact_number: string().required("Contact is required"),
  country: string().required("Country is required"),
  city: string().required("City is required"),
  date_won: string().required("Date won is required"),
  won_by: string().required("Won by is required"),
});