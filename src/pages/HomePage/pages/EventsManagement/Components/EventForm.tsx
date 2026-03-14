import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { ISelectOption } from "@/pages/HomePage/utils/homeInterfaces";
import { EventType } from "@/utils";
import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { object, string, array } from "yup";

interface IProps {
  closeModal: () => void;
  handleMutate: (value: EventType) => Promise<void>;
  loading: boolean;
  editData: EventType | null;
}

const EventTypeOptions: ISelectOption[] = [
  { label: "Activity", value: "ACTIVITY" },
  { label: "Program", value: "PROGRAM" },
  { label: "Service", value: "SERVICE" },
  { label: "Other", value: "OTHER" },
];

const initialValues: EventType = {
  event_name: "",
  event_type: "",
  event_description: "",
  id: "",
};

const validationSchema = object().shape({
  event_name: string()
    .required("Event name is required")
    .min(3, "Name must be at least 3 characters"),
  event_type: string().required("Event type is required"),
  event_description: string().required("Event description is required"),
});

const EventForm = ({ closeModal, handleMutate, loading, editData }: IProps) => {
  const initial: EventType = useMemo(() => editData || initialValues, [editData]);
  const formTitle = editData?.id ? "Update Event" : "Create Event";
  const formSubtitle = editData?.id
    ? "Review and update this event record."
    : "Add a new event to your system";

  return (
    <div className="text-primary">
      <div className="sticky top-0 w-full bg-primary p-4 px-6">
        <div className="text-white text-xl font-bold">
          {formTitle}
          <p className="text-sm font-normal text-white/80">{formSubtitle}</p>
        </div>
      </div>

      <div className="p-4 px-6 overflow-auto">
        <Formik
          initialValues={initial}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            await handleMutate(values);
          }}
          enableReinitialize
        >
          {() => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                <Field
                  component={FormikInputDiv}
                  name="event_name"
                  label="Event name *"
                  id="event_name"
                  placeholder="Enter the name of the event"
                  className="w-full"
                />

                <Field
                  component={FormikSelectField}
                  label="Event type *"
                  options={EventTypeOptions}
                  id="event_type"
                  name="event_type"
                  placeholder="Select event type"
                />
              </div>

              <Field
                component={FormikInputDiv}
                name="event_description"
                label="Event description *"
                id="event_description"
                placeholder="Enter a short description about the event"
                className="w-full"
                type="textarea"
                col={50}
              />

              <div className="sticky bottom-0 border-t border-lightGray">
                <div className="flex justify-end gap-2 border-lightGray bg-white/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                  <Button
                    value={editData?.id ? "Update" : "Save"}
                    variant="primary"
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  />
                  <Button
                    value="Cancel"
                    variant="secondary"
                    onClick={closeModal}
                  />
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EventForm;
