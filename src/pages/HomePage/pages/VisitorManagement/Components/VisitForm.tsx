import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormHeader } from "@/components/ui";
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
    <div className="bg-white  rounded-2xl shadow-xl ">
  
  <Formik
    initialValues={initial}
    validationSchema={validationSchema}
    onSubmit={(values) => onSubmit(values)}
  >
    {({ handleSubmit,values }) => (
      
      <Form className="flex flex-col  ">
        <div className="sticky top-0 z-10 ">
            <FormHeader>
              <p className="text-lg font-semibold">{initialData ? "Edit Visit" : "Record a Visit"}</p>
              <p className="text-sm text-white">
                Provide the details of the visits.
              </p>
            </FormHeader>
            
          </div>

         <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          type="date"
          placeholder="When did you visit?"
          label="Visit Date *"
          value = {formatInputDate(values?.date)}
          id="date"
          name="date"
        />
        
        </div>
        <Field
          component={FormikInputDiv}
          type="textarea"
          label="Note *"
          placeholder="Enter any notes about the visit"
          id="notes"
          name="notes"
        />
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
