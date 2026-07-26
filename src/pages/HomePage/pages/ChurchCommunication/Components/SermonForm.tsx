import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { useRef, useState } from "react";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  SermonSeries,
  CreateSermonSeriesDto,
  UpdateSermonSeriesDto,
} from "@/utils/api/sermons/interfaces";

interface SermonLinkValue {
  id?: number;
  youtube_url: string;
  title?: string;
}

interface SermonFormValues {
  title: string;
  description: string;
  sermons: SermonLinkValue[];
}

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+/i;

const validationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  description: Yup.string().nullable(),
  sermons: Yup.array()
    .of(
      Yup.object({
        youtube_url: Yup.string()
          .trim()
          .required("YouTube link is required")
          .matches(YOUTUBE_URL_REGEX, "Enter a valid YouTube link"),
      })
    )
    .min(1, "Add at least one YouTube link"),
});

interface SermonFormProps {
  series?: SermonSeries | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyLink = (): SermonLinkValue => ({ youtube_url: "" });

const SermonForm = ({ series, onClose, onSaved }: SermonFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const publishRef = useRef(false);

  const isEdit = Boolean(series);
  const isPublished = series?.status === "PUBLISHED";

  const initialValues: SermonFormValues = {
    title: series?.title ?? "",
    description: series?.description ?? "",
    sermons:
      series?.sermons && series.sermons.length > 0
        ? series.sermons.map((sermon) => ({
            id: sermon.id,
            youtube_url: sermon.youtube_url,
            title: sermon.title,
          }))
        : [emptyLink()],
  };

  const handleSave = async (values: SermonFormValues) => {
    const shouldPublish = publishRef.current;

    setSubmitting(true);
    try {
      if (series) {
        const payload: UpdateSermonSeriesDto = {
          title: values.title.trim(),
          description: values.description.trim() || null,
          sermons: values.sermons.map((link) => ({
            ...(link.id ? { id: link.id } : {}),
            youtube_url: link.youtube_url.trim(),
          })),
        };
        await api.put.updateSermonSeries(series.id, payload);
        if (shouldPublish && !isPublished) {
          await api.post.publishSermonSeries(series.id);
        }
      } else {
        const payload: CreateSermonSeriesDto = {
          title: values.title.trim(),
          description: values.description.trim() || null,
          sermons: values.sermons.map((link) => ({
            youtube_url: link.youtube_url.trim(),
          })),
        };
        const response = await api.post.createSermonSeries(payload);
        const newId = response.data?.id;
        if (shouldPublish && newId) {
          await api.post.publishSermonSeries(newId);
        }
      }

      showNotification(
        shouldPublish
          ? "Sermon series published successfully"
          : "Sermon series saved successfully",
        "success"
      );
      onSaved();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Sermon series submit failed", error);
      showNotification(
        "Sermon series could not be saved. Please try again.",
        "error",
        "Sermons"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const primaryLabel = isPublished ? "Save" : "Save & publish";

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={handleSave}
    >
      {({ handleSubmit, values }) => (
        <Form className="h-[calc(100vh-180px)] flex flex-col overflow-auto">
          <div className="sticky top-0 z-10">
            <FormHeader>
              <p className="text-lg font-semibold">
                {isEdit ? "Edit Sermon Series" : "Create Sermon Series"}
              </p>
              <p className="text-sm text-white">
                {isEdit
                  ? "Make changes to the sermon series"
                  : "Add a title, description and one or more YouTube links"}
              </p>
            </FormHeader>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
            <Field
              component={FormikInputDiv}
              label="Title *"
              name="title"
              id="title"
              placeholder="Sermon series title"
            />

            <Field
              component={FormikInputDiv}
              label="Short description"
              name="description"
              id="description"
              placeholder="What is this series about?"
            />

            <FieldArray name="sermons">
              {({ push, remove }) => (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">
                      YouTube links *
                    </label>
                    <button
                      type="button"
                      className="text-sm text-primary"
                      onClick={() => push(emptyLink())}
                    >
                      + Add link
                    </button>
                  </div>

                  {values.sermons.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-md border p-3"
                    >
                      <div className="flex-1">
                        <Field
                          component={FormikInputDiv}
                          name={`sermons[${index}].youtube_url`}
                          id={`sermons-${index}-url`}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {link.title && (
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {link.title}
                          </p>
                        )}
                      </div>
                      {values.sermons.length > 1 && (
                        <button
                          type="button"
                          className="mt-2 text-sm text-red-500"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">
                    Video names are captured automatically from each link when
                    you save.
                  </p>
                </div>
              )}
            </FieldArray>
          </div>

          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              value="Cancel"
              onClick={onClose}
            />

            {!isPublished && (
              <Button
                variant="secondary"
                type="button"
                value="Save as draft"
                loading={submitting}
                onClick={() => {
                  publishRef.current = false;
                  handleSubmit();
                }}
              />
            )}

            <Button
              type="button"
              value={primaryLabel}
              loading={submitting}
              onClick={() => {
                publishRef.current = !isPublished;
                handleSubmit();
              }}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SermonForm;
