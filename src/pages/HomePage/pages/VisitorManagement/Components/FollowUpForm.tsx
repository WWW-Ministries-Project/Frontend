import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader, FormLayout } from "@/components/ui";
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
    <div className="bg-white rounded-lg w-full  mx-auto">
      
      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={(values) => onSubmit(values)}
      >
        {({ handleSubmit }) => (
          <Form className="flex flex-col  bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="sticky top-0 z-10">
                <FormHeader>
                  <p className="text-lg font-semibold">{initialData ? "Edit Follow-up" : "Record a Follow-up"}</p>
                  <p className="text-sm text-white">
                    Provide the details of the new soul you&apos;ve connected with.
                  </p>
                </FormHeader>
                
              </div>
           <div className="flex-1 overflow-y-auto px-6 py-4">
          <FormLayout $columns={1}>
             
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
              placeholder="How did you reach them?"
              id="type"
              name="type"
            />
            <Field
              component={FormikSelectField}
              options={membersOptions}
              label="Assigned To *"
              placeholder="Assigned To"
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
            </FormLayout>
            </div>

            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
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
            </div>
          
          
          </Form>
        )}
      </Formik>
    </div>
  );
};

const typeOptions = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "in-person", label: "In-Person" },
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
