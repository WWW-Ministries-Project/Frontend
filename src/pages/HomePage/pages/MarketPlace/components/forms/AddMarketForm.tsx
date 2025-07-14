import { Button } from "@/components";;
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import {FormLayout } from "@/components/ui";
import { useStore } from "@/store/useStore";
import { IMarket } from "@/utils/api/marketPlace/interface";
import { Field, Form, Formik } from "formik";
import { useMemo } from "react";
import { object, string, date, ref } from "yup";

interface IProps {
  onSubmit: (values: IMarket) => void;
  onClose: () => void;
  editData: IMarket | null;
  loading: boolean;
}
export function AddMarketForm({
  onSubmit,
  onClose,
  editData,
  loading,
}: IProps) {
  const initialData = useMemo(
    () => editData || initialValues,
    [editData, initialValues]
  );

  const {events} = useStore()
  return (
    <Formik
      initialValues={initialData}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
    >
      {({ handleSubmit }) => (
        <Form className="space-y-6 w-[90vw] sm:w-[70vw] xl:w-[50vw]">
          <div className="bg-primary h-28 w-full -mt-3 text-white p-6">
            <p className="font-bold text-2xl">
              {initialData.id ? "Update" : "Create New"} Market
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
                name="event_name"
                component={FormikSelectField}
                options={events}
                label="Associated event"
                id="event_name"
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
                value={initialData.id ? "Update" : "Save"}
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
              />
              <Button
                type="submit"
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
  event_name: "",
  start_date: "",
  end_date: "",
  id: "",
};

const validationSchema = object().shape({
  name: string().required(),
  description: string().required("required"),
  event_name: string(),
  start_date: date().required("required"),
  end_date: date().min(
    ref("start_date"),
    "End date can't be before start date"
  ),
});
