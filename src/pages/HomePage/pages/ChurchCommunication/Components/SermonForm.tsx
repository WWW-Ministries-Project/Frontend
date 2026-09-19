import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { api } from "@/utils/api/apiCalls";
import { showNotification } from "@/pages/HomePage/utils";
import { extractYouTubeVideoId, youtubeThumbnail } from "../utils/youtube";
import SeriesForm from "./SeriesForm";
import TagSelect from "./TagSelect";
import type {
  Sermon,
  SermonSeries,
  SermonTag,
} from "@/utils/api/sermons/interfaces";

interface SermonFormValues {
  title: string;
  description: string;
  youtube_url: string;
  series_id: number | "";
  tags: string[];
}

// Validate with the same parser that produces the preview, rather than a
// looser regex. A regex accepts /channel/... and /playlist?... links, which
// yield no video id — the field goes green while the preview stays blank and
// the save then fails server-side.
const validationSchema = Yup.object({
  title: Yup.string().trim().required("Name is required"),
  description: Yup.string().nullable(),
  youtube_url: Yup.string()
    .trim()
    .required("A YouTube link is required")
    .test(
      "is-youtube-video",
      "Enter a link to a YouTube video",
      (value) => !!extractYouTubeVideoId(value ?? "")
    ),
});

interface SermonFormProps {
  sermon?: Sermon | null;
  onClose: () => void;
  onSaved: () => void;
}

export const SermonForm = ({ sermon, onClose, onSaved }: SermonFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [seriesOptions, setSeriesOptions] = useState<SermonSeries[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<SermonTag[]>([]);
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const publishRef = useRef(false);

  const isEdit = Boolean(sermon);
  const isPublished = sermon?.status === "PUBLISHED";

  // Loaded once when the form mounts. The series list is mutated locally when
  // the user creates one inline, so it is not re-fetched on every render.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [seriesRes, tagsRes] = await Promise.all([
          api.fetch.fetchSermonSeries(),
          api.fetch.fetchSermonTags(),
        ]);
        if (cancelled) return;
        setSeriesOptions(seriesRes.data ?? []);
        setTagSuggestions(tagsRes.data ?? []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load sermon form options", error);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const initialValues: SermonFormValues = {
    title: sermon?.title ?? "",
    description: sermon?.description ?? "",
    youtube_url: sermon?.youtube_url ?? "",
    series_id: sermon?.series_id ?? "",
    tags: sermon?.tags?.map((tag) => tag.name) ?? [],
  };

  const seriesSelectOptions = useMemo(
    () => seriesOptions.map((item) => ({ value: item.id, label: item.title })),
    [seriesOptions]
  );

  const handleSave = async (values: SermonFormValues) => {
    const shouldPublish = publishRef.current;
    setSubmitting(true);

    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        youtube_url: values.youtube_url.trim(),
        series_id: values.series_id === "" ? null : Number(values.series_id),
        tags: values.tags,
      };

      const saved = sermon
        ? await api.put.updateSermon(sermon.id, payload)
        : await api.post.createSermon(payload);

      const savedId = sermon?.id ?? saved.data?.id;
      if (shouldPublish && savedId && !isPublished) {
        await api.post.publishSermon(savedId);
      }

      showNotification(
        shouldPublish ? "Sermon published" : "Sermon saved",
        "success"
      );
      onSaved();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Sermon submit failed", error);
      showNotification(
        "The sermon could not be saved. Please try again.",
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
      {({ handleSubmit, values, setFieldValue }) => {
        const previewUrl = youtubeThumbnail(
          extractYouTubeVideoId(values.youtube_url)
        );

        return (
          <Form className="flex h-[calc(100vh-180px)] flex-col overflow-auto">
            <div className="sticky top-0 z-10">
              <FormHeader>
                <p className="text-lg font-semibold">
                  {isEdit ? "Edit sermon" : "Add sermon"}
                </p>
                <p className="text-sm text-white">
                  {isEdit
                    ? "Make changes to this sermon"
                    : "The thumbnail is generated from the YouTube link"}
                </p>
              </FormHeader>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <Field
                component={FormikInputDiv}
                label="Name *"
                name="title"
                id="sermon-title"
                placeholder="Walking In Faith"
              />

              <Field
                component={FormikInputDiv}
                label="Description"
                name="description"
                id="sermon-description"
                type="textarea"
                placeholder="What is this message about?"
              />

              <Field
                component={FormikInputDiv}
                label="YouTube link *"
                name="youtube_url"
                id="sermon-url"
                placeholder="https://www.youtube.com/watch?v=..."
              />

              <div className="flex flex-col gap-1">
                <span className="block text-sm font-medium">Thumbnail</span>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Video thumbnail"
                    className="aspect-video w-full max-w-xs rounded-lg border object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full max-w-xs items-center justify-center rounded-lg border border-dashed text-xs text-gray-400">
                    Paste a YouTube link to preview the thumbnail
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Generated from the link. Nothing to upload.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <Field
                  component={FormikSelectField}
                  label="Series"
                  name="series_id"
                  id="sermon-series"
                  options={seriesSelectOptions}
                  placeholder="No series"
                  searchable
                  clearable
                />
                <button
                  type="button"
                  className="self-start text-sm text-primary"
                  onClick={() => setSeriesModalOpen(true)}
                >
                  + Create new series
                </button>
              </div>

              <TagSelect
                suggestions={tagSuggestions}
                value={values.tags}
                onChange={(names) => setFieldValue("tags", names)}
              />
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-6 py-4">
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
                value={isPublished ? "Save" : "Save & publish"}
                loading={submitting}
                onClick={() => {
                  publishRef.current = !isPublished;
                  handleSubmit();
                }}
              />
            </div>

            {/* Stacked over this form. The sermon form is never unmounted, so
                anything already typed survives creating a series. */}
            <Modal
              open={seriesModalOpen}
              onClose={() => setSeriesModalOpen(false)}
              title="Create series"
              className="max-w-lg"
            >
              <SeriesForm
                compact
                onClose={() => setSeriesModalOpen(false)}
                onSaved={(created) => {
                  setSeriesOptions((prev) => [created, ...prev]);
                  setFieldValue("series_id", created.id);
                }}
              />
            </Modal>
          </Form>
        );
      }}
    </Formik>
  );
};

export default SermonForm;
