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
}

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
  });

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
