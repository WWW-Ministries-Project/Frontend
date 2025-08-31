import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { date, object, ref, string } from "yup";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout } from "@/components/ui";
import type { IMarket } from "@/utils/api/marketPlace/interface";
import type { eventType } from "../../../EventsManagement/utils/eventInterfaces";

interface IProps {
  onSubmit: (values: IMarket) => void;
  onClose: () => void;
  editData: IMarket | null;
  loading: boolean;
  events: eventType[] | undefined;
}

export function AddMarketForm({
  onSubmit,
  onClose,
  editData,
  loading,
  events,
}: IProps) {
  const initials = useMemo(() => editData ?? initialValues, [editData]);

  const eventOptions =
    useMemo(
      () =>
        events &&
        events.map((event) => ({
          label: event.event_name,
          value: event.id,
        })),
      [events]
    ) ?? [];

  return (
    <Formik
      initialValues={initials}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ handleSubmit }) => (
        <Form className="space-y-6 ">
          <div className="bg-primary h-28 w-full -mt-3 text-white p-6">
            <p className="font-bold text-2xl">
              {editData ? "Update" : "Create New"} Market
            </p>
            <p className="text-xl">
              Set up a new marketplace for your event merchandise
            </p>
          </div>

          <div className="px-6 py-3">
            <FormLayout>
              <Field
                name="name"
                component={FormikInputDiv}
                label="Market name *"
                id="name"
                placeholder="Enter Market Name"
              />

              <Field
                name="event_id"
                component={FormikSelectField}
                options={eventOptions}
                label="Associated event"
                id="event_id"
                placeholder="Select Event"
              />

              <Field
                name="description"
                component={FormikInputDiv}
                label="Description *"
                id="description"
                placeholder="Enter Market Description"
                type="textarea"
                className="w-full col-span-2"
              />

              <Field
                type="date"
                name="start_date"
                component={FormikInputDiv}
                label="Start Date *"
                id="start_date"
                placeholder="Select date"
              />

              <Field
                type="date"
                name="end_date"
                component={FormikInputDiv}
                label="End Date *"
                id="end_date"
                placeholder="Select date"
              />
            </FormLayout>

            <div className="flex items-center justify-end gap-3 py-6">
              <Button
                type="submit"
                disabled={loading}
                value={editData ? "Update" : "Save"}
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
              />
              <Button
                type="button"
                disabled={loading}
                value="Cancel"
                variant="secondary"
                onClick={onClose}
              />
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}

const initialValues: IMarket = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  id: "",
  event_id: "",
};

const validationSchema = object().shape({
  name: string().required("required"),
  description: string().required("required"),
  start_date: date().required("required"),
  end_date: date()
    .required("required")
    .min(ref("start_date"), "End date can't be before start date"),
});
