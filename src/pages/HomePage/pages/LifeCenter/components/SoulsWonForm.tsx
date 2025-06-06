import { FormikInputDiv } from "@/components/FormikInputDiv";
import { SoulsWon } from "@/utils/api/lifeCenter/interface";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Button } from "@/components";
import FormWrapperNew from "@/Wrappers/FormWrapperNew";

export const SoulsWonForm = ({ onSubmit,onClose }: Props) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={soulsWonSchema}
      onSubmit={(values, { resetForm }) => {
        onSubmit(values);
        resetForm();
      }}
    >
      {({ isSubmitting,handleSubmit }) => (
        <Form className="space-y-6 w-[90vw] sm:w-[70vw] xl:w-[50vw] p-6">
          <h3 className="text-lg font-semibold">Add a Soul</h3>

          <div >
            <FormWrapperNew>
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
              name="contact"
              component={FormikInputDiv}
              label="Contact"
              id="contact"
              placeholder="Enter phone number"
            />
            <Field
              name="life_center_name"
              component={FormikInputDiv}
              label="Name of Soul Won"
              id="life_center_name"
              placeholder="Enter name of soul won"
            />
            <Field
              name="location"
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
          </FormWrapperNew>
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

type Props = {
  onSubmit: (values: SoulsWon) => void;
  onClose:()=>void
};

const initialValues: SoulsWon = {
  first_name: "",
  last_name: "",
  contact: "",
  location: "",
  city: "",
  date_won: "",
  won_by: "",
  life_center_name: "",
};

const soulsWonSchema = Yup.object().shape({
  first_name: Yup.string().required("First name is required"),
  last_name: Yup.string().required("Last name is required"),
  contact: Yup.string().required("Contact is required"),
  location: Yup.string().required("Country is required"),
  city: Yup.string().required("City is required"),
  date_won: Yup.string().required("Date won is required"),
  won_by: Yup.string().required("Won by is required"),
  life_center_name: Yup.string().required("Name of soul won is required"),
});
