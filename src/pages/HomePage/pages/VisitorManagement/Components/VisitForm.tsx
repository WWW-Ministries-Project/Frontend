import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { useStore } from "@/store/useStore";
import { formatInputDate } from "@/utils";
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
    <div className="bg-white p-4 sm:p-4 md:p-6  rounded-2xl shadow-xl w-[450px]">
  <div className="text-2xl font-semibold text-gray-800 mb-6">
    {initialData ? "Edit Visit" : "Record a Visit"}
  </div>

  <Formik
    initialValues={initial}
    validationSchema={validationSchema}
    onSubmit={(values) => onSubmit(values)}
  >
    {({ handleSubmit,values }) => (
      <Form className="flex flex-col gap-6">
        <Field
          component={FormikInputDiv}
          type="date"
          placeholder="When did you visit?"
          label="Visit Date *"
          value = {formatInputDate(values?.date)}
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

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 mt-4">
          <Button
            value="Cancel"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          />
          <Button
            value="Submit"
            variant="primary"
            type="submit"
            disabled={loading}
            loading={loading}
            onClick={handleSubmit}
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
