import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import TextEditor from "@/components/TextEditor";
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  Announcement,
  AudienceType,
  CreateAnnouncementDto,
} from "@/utils/api/announcements/interfaces";

interface AnnouncementFormValues {
  title: string;
  content: string;
  audience_type: AudienceType;
  department_id: number | null;
  position_id: number | null;
  /** Banner Carousel fields (wwm-mobile Home screen) — see the design spec
   *  in wwm-mobile's docs/superpowers/specs/2026-08-20-banner-carousel-design.md. */
  is_promoted: boolean;
  image_url: string;
  cta_label: string;
  deep_link: string;
  /** Kept as a string (native number input reports strings) — parsed in
   *  buildPayload. */
  sort_order: string;
  start_date: string;
  end_date: string;
}

/** ISO datetime → the `YYYY-MM-DD` shape a native `<input type="date">`
 *  expects. Empty/invalid input returns "" so the field just renders blank
 *  rather than crashing. */
const toDateInputValue = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const AUDIENCE_OPTIONS: { label: string; value: AudienceType }[] = [
  { label: "All members", value: "ALL_MEMBERS" },
  { label: "Ministry workers", value: "MINISTRY_WORKERS" },
  { label: "Heads of department", value: "HEADS_OF_DEPARTMENT" },
  { label: "Specific department", value: "SPECIFIC_DEPARTMENT" },
  { label: "Specific position", value: "SPECIFIC_POSITION" },
];

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const validationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  content: Yup.string()
    .required("Content is required")
    .test("content-not-empty", "Content is required", (value) =>
      Boolean(value && stripHtml(value).length > 0)
    ),
  audience_type: Yup.string().required("Audience is required"),
  department_id: Yup.number()
    .nullable()
    .when("audience_type", {
      is: "SPECIFIC_DEPARTMENT",
      then: (schema) => schema.required("Department is required"),
      otherwise: (schema) => schema.nullable(),
    }),
  position_id: Yup.number()
    .nullable()
    .when("audience_type", {
      is: "SPECIFIC_POSITION",
      then: (schema) => schema.required("Position is required"),
      otherwise: (schema) => schema.nullable(),
    }),
  sort_order: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .integer("Must be a whole number")
    .nullable(),
});

interface AnnouncementFormProps {
  announcement?: Announcement | null;
  onClose: () => void;
  onSaved: () => void;
}

const AnnouncementForm = ({
  announcement,
  onClose,
  onSaved,
}: AnnouncementFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const publishRef = useRef(false);
  const [imagePreview, setImagePreview] = useState(announcement?.image_url ?? "");
  const { handleUpload, loading: uploadLoading } = usePictureUpload();

  const isEdit = Boolean(announcement);
  const isPublished = announcement?.status === "PUBLISHED";
  const audienceLocked = isPublished;

  const { data: departmentsData } = useFetch(api.fetch.fetchDepartments);
  const { data: positionsData } = useFetch(api.fetch.fetchPositions);

  const departmentOptions = useMemo(
    () =>
      (departmentsData?.data ?? []).map((department) => ({
        label: department.name,
        value: department.id,
      })),
    [departmentsData]
  );

  const positionOptions = useMemo(
    () =>
      (positionsData?.data ?? []).map((position) => ({
        label: position.name,
        value: position.id,
      })),
    [positionsData]
  );

  const initialValues: AnnouncementFormValues = {
    title: announcement?.title ?? "",
    content: announcement?.content ?? "",
    audience_type: announcement?.audience_type ?? "ALL_MEMBERS",
    department_id: announcement?.department_id ?? null,
    position_id: announcement?.position_id ?? null,
    is_promoted: announcement?.is_promoted ?? false,
    image_url: announcement?.image_url ?? "",
    cta_label: announcement?.cta_label ?? "",
    deep_link: announcement?.deep_link ?? "",
    sort_order: announcement?.sort_order != null ? String(announcement.sort_order) : "",
    start_date: toDateInputValue(announcement?.start_date),
    end_date: toDateInputValue(announcement?.end_date),
  };

  const buildPayload = (
    values: AnnouncementFormValues
  ): CreateAnnouncementDto => ({
    title: values.title.trim(),
    content: values.content,
    audience_type: values.audience_type,
    department_id:
      values.audience_type === "SPECIFIC_DEPARTMENT"
        ? values.department_id
        : null,
    position_id:
      values.audience_type === "SPECIFIC_POSITION" ? values.position_id : null,
    is_promoted: values.is_promoted,
    // Sent as-entered regardless of is_promoted — unchecking "Promote" just
    // stops the carousel from showing it (is_promoted is the only gate on
    // the mobile/backend side); it doesn't wipe the banner copy an admin
    // might re-enable later.
    image_url: values.image_url || null,
    cta_label: values.cta_label.trim() || null,
    deep_link: values.deep_link.trim() || null,
    sort_order: values.sort_order === "" ? null : Number(values.sort_order),
    start_date: values.start_date || null,
    end_date: values.end_date || null,
  });

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const uploadedUrl = await handleUpload(formData);
    if (uploadedUrl) setImagePreview(uploadedUrl);
    return uploadedUrl;
  };

  const handleSave = async (values: AnnouncementFormValues) => {
    const shouldPublish = publishRef.current;
    const payload = buildPayload(values);

    setSubmitting(true);
    try {
      if (announcement) {
        await api.put.updateAnnouncement(announcement.id, payload);
        if (shouldPublish && !isPublished) {
          await api.post.publishAnnouncement(announcement.id);
        }
      } else {
        const response = await api.post.createAnnouncement(payload);
        const newId = response.data?.id;
        if (shouldPublish && newId) {
          await api.post.publishAnnouncement(newId);
        }
      }

      showNotification(
        shouldPublish
          ? "Announcement published successfully"
          : "Announcement saved successfully",
        "success"
      );
      onSaved();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Announcement submit failed", error);
      showNotification(
        "Announcement could not be saved. Please try again.",
        "error",
        "Announcement"
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
      {({ handleSubmit, values, errors, touched, setFieldValue, setFieldTouched }) => (
        <Form className="h-[calc(100vh-180px)] flex flex-col overflow-auto">
          <div className="sticky top-0 z-10">
            <FormHeader>
              <p className="text-lg font-semibold">
                {isEdit ? "Edit Announcement" : "Create Announcement"}
              </p>
              <p className="text-sm text-white">
                {isEdit
                  ? "Make changes to the announcement details"
                  : "Fill in the details for the new announcement"}
              </p>
            </FormHeader>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
            <Field
              component={FormikInputDiv}
              label="Title *"
              name="title"
              id="title"
              placeholder="Announcement title"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Content *</label>
              <TextEditor
                value={values.content}
                onChange={(value) => {
                  setFieldValue("content", value);
                  setFieldTouched("content", true, false);
                }}
                placeholder="Write the announcement..."
              />
              {touched.content && errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            <Field
              component={FormikSelectField}
              label="Audience *"
              name="audience_type"
              id="audience_type"
              options={AUDIENCE_OPTIONS}
              disabled={audienceLocked}
            />

            {values.audience_type === "SPECIFIC_DEPARTMENT" && (
              <Field
                component={FormikSelectField}
                label="Department *"
                name="department_id"
                id="department_id"
                options={departmentOptions}
                searchable
                disabled={audienceLocked}
              />
            )}

            {values.audience_type === "SPECIFIC_POSITION" && (
              <Field
                component={FormikSelectField}
                label="Position *"
                name="position_id"
                id="position_id"
                options={positionOptions}
                searchable
                disabled={audienceLocked}
              />
            )}

            <div className="flex items-center pt-2 border-t">
              <Field
                type="checkbox"
                id="is_promoted"
                name="is_promoted"
                className="mr-2"
              />
              <label htmlFor="is_promoted" className="text-sm font-medium">
                Promote on the mobile app&apos;s Home carousel
              </label>
            </div>

            {values.is_promoted && (
              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Shown as a banner slide on the mobile app&apos;s Home screen
                  while published and within the active window below. Up to
                  3 promoted announcements show at once, ordered by display
                  order.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Banner image (Optional)
                  </label>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="mb-2 h-24 w-full max-w-xs rounded-lg object-cover"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadLoading}
                    onChange={async (event) => {
                      const url = await handleImageSelect(
                        event.target.files?.[0] ?? null
                      );
                      if (url) setFieldValue("image_url", url);
                    }}
                    className="text-sm"
                  />
                  {uploadLoading && (
                    <p className="mt-1 text-xs text-gray-500">Uploading…</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    16:9 works best (about 1200×675px). Leave empty for a
                    plain accent-colored card instead of a photo.
                  </p>
                </div>

                <Field
                  component={FormikInputDiv}
                  label="Button label"
                  name="cta_label"
                  id="cta_label"
                  placeholder="Reserve your seat"
                />

                <div>
                  <Field
                    component={FormikInputDiv}
                    label="Deep link"
                    name="deep_link"
                    id="deep_link"
                    placeholder="/member/appointments"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Where tapping the banner goes in the app, e.g.{" "}
                    <code>/member/appointments</code>,{" "}
                    <code>/member/give?segment=Pledges</code>,{" "}
                    <code>/member/watch</code>. Leave empty for a
                    non-tappable banner.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Field
                    component={FormikInputDiv}
                    label="Start date"
                    name="start_date"
                    id="start_date"
                    type="date"
                  />
                  <Field
                    component={FormikInputDiv}
                    label="End date"
                    name="end_date"
                    id="end_date"
                    type="date"
                  />
                </div>

                <Field
                  component={FormikInputDiv}
                  label="Display order"
                  name="sort_order"
                  id="sort_order"
                  type="number"
                  placeholder="1"
                />
              </div>
            )}
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

export default AnnouncementForm;
