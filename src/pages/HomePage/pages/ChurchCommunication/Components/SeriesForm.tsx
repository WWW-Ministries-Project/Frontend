import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import type { SermonSeries } from "@/utils/api/sermons/interfaces";

interface SeriesFormValues {
  title: string;
  description: string;
}

const validationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  description: Yup.string().nullable(),
});

interface SeriesFormProps {
  series?: SermonSeries | null;
  /** Renders without the full-height modal chrome, for the stacked modal. */
  compact?: boolean;
  onClose: () => void;
  onSaved: (series: SermonSeries) => void;
}

export const SeriesForm = ({
  series,
  compact = false,
  onClose,
  onSaved,
}: SeriesFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(series);

  const initialValues: SeriesFormValues = {
    title: series?.title ?? "",
    description: series?.description ?? "",
  };

  const handleSave = async (values: SeriesFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || null,
      };

      const response = series
        ? await api.put.updateSermonSeries(series.id, payload)
        : await api.post.createSermonSeries(payload);

      showNotification(
        series ? "Series updated" : "Series created",
        "success"
      );
      onSaved(response.data);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Sermon series submit failed", error);
      showNotification(
        "The series could not be saved. Please try again.",
        "error",
        "Sermons"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSave}
    >
      {({ handleSubmit }) => (
        <Form
          className={
            compact ? "flex flex-col" : "flex h-[calc(100vh-260px)] flex-col"
          }
        >
          {compact ? (
            <div className="px-6 pt-6">
              <p className="text-lg font-semibold">New series</p>
              <p className="text-sm text-gray-500">
                Give the series a title. You can add sermons to it afterwards.
              </p>
            </div>
          ) : (
            <FormHeader>
              <p className="text-lg font-semibold">
                {isEdit ? "Edit series" : "Create series"}
              </p>
              <p className="text-sm text-white">
                A series groups related sermons together
              </p>
            </FormHeader>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <Field
              component={FormikInputDiv}
              label="Title *"
              name="title"
              id="series-title"
              placeholder="Faith Foundations"
            />

            <Field
              component={FormikInputDiv}
              label="Description"
              name="description"
              id="series-description"
              type="textarea"
              placeholder="What is this series about?"
            />
          </div>

          <div className="flex justify-end gap-3 border-t bg-white px-6 py-4">
            <Button
              variant="secondary"
              type="button"
              value="Cancel"
              onClick={onClose}
            />
            <Button
              type="button"
              value={isEdit ? "Save changes" : "Create series"}
              loading={submitting}
              onClick={() => handleSubmit()}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SeriesForm;
