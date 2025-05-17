import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { useStore } from "@/store/useStore";
import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { date, object, string } from "yup";

interface IProps {
  onClose: () => void;
  initialData?: IFollowUpForm;
  onSubmit: (data: IFollowUpForm) => void;
  loading: boolean;
}

const FollowUpFormComponent = ({
  initialData,
  onSubmit,
  onClose,
  loading,
}: IProps) => {
  const { membersOptions } = useStore();
  const initial: IFollowUpForm = useMemo(
    () => initialData || initialValues,
    [initialData]
  );

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-md mx-auto">
      <div className="font-bold text-lg mb-4">
        {initial ? "Edit Follow-up" : "Record a Follow-up"}
      </div>
      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={(values) => onSubmit(values)}
      >
        {({ handleSubmit }) => (
          <Form>
            <Field
              component={FormikInputDiv}
              type="date"
              label="Visit Date *"
              placeholder="When did you  visit?"
              id="date"
              name="date"
            />
            <Field
              component={FormikSelectField}
              options={typeOptions}
              label="Type *"
              placeholder="how did you reach them?"
              id="type"
              name="type"
            />
            <Field
              component={FormikSelectField}
              options={membersOptions}
              label="assigned To *"
              placeholder="assigned To"
              id="assignedTo"
              name="assignedTo"
            />
            <Field
              component={FormikInputDiv}
              type="textarea"
              label="Note *"
              placeholder="Enter any notes about the visit"
              id="notes"
              name="notes"
            />

            <div className="flex justify-end gap-4 mt-2">
              <Button
                value="Submit"
                variant="primary"
                type="submit"
                disabled={loading}
                loading={loading}
                onClick={handleSubmit}
              />
              <Button
                value="Cancel"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

const typeOptions = [
  { value: "phone", name: "Phone" },
  { value: "email", name: "Email" },
  { value: "in-person", name: "In-Person" },
];

export interface IFollowUpForm {
  date: string;
  type: string;
  assignedTo: string;
  notes: string;
}
const initialValues: IFollowUpForm = {
  date: new Date().toISOString().split("T")[0],
  type: "phone",
  assignedTo: "",
  notes: "",
};
const validationSchema = object({
  date: date().required("Date is required").typeError("Invalid date format"),
  type: string().required("Type is required"),
  assignedTo: string().required("Assigned To is required"),
  notes: string().required("Notes are required"),
});
export const FollowUpForm = Object.assign(FollowUpFormComponent, {
  initialValues,
  validationSchema,
});
