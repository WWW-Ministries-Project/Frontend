import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { useStore } from "@/store/useStore";
import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { date, object, string } from "yup";

interface IProps {
  onClose: () => void;
  initialData?: IVisitForm;
  onSubmit: (data: IVisitForm) => void;
  loading: boolean;
}

const VisitFormComponent = ({
  onClose,
  initialData,
  onSubmit,
  loading,
}: IProps) => {
  const initial: IVisitForm = useMemo(
    () => initialData || initialValues,
    [initialData]
  );
  const { eventsOptions } = useStore();

  return (
    <div className="bg-white p-6 px-12 rounded-lg w-full max-w-3xl mx-auto">
      <div className="font-bold text-lg mb-4">
        {initialData ? "Edit Visit" : "Record a Visit"}
      </div>

      <Formik
        initialValues={initial}
        validationSchema={validationSchema}
        onSubmit={(values) => onSubmit(values)}
      >
        {({ handleSubmit }) => (
          <Form className="flex flex-col gap-4">
            <Field
              component={FormikInputDiv}
              type="date"
              label="Visit Date *"
              id="date"
              name="date"
            />
            <Field
              component={FormikSelectField}
              options={eventsOptions}
              label="Event *"
              placeholder="Select an event"
              id="eventId"
              name="eventId"
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

export interface IVisitForm {
  date: string;
  eventId: string;
  notes: string;
}

const initialValues: IVisitForm = {
  date: "",
  eventId: "",
  notes: "",
};

const validationSchema = object({
  date: date()
    .required("Visit date is required")
    .typeError("Invalid date format"),
  eventId: string().required("Event selection is required"),
  notes: string()
    .required("Notes are required")
    .max(500, "Notes cannot exceed 500 characters"),
});

export const VisitForm = Object.assign(VisitFormComponent, {
  initialValues,
  validationSchema,
});
