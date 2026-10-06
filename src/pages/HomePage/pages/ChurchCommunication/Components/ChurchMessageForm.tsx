import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { api } from "@/utils/api/apiCalls";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { showNotification } from "@/pages/HomePage/utils";
import type { CreateCommunityPostDto } from "@/utils/api/community/interfaces";

type MessageAudience = "CHURCH" | "DEPARTMENT";

interface ChurchMessageValues {
  body: string;
  audience: MessageAudience;
  department_id: number | null;
}

const MAX_IMAGES = 4;

const AUDIENCE_OPTIONS: { label: string; value: MessageAudience }[] = [
  { label: "Whole church", value: "CHURCH" },
  { label: "A department", value: "DEPARTMENT" },
];

const validationSchema = Yup.object({
  body: Yup.string().trim().required("Message is required"),
  audience: Yup.string().oneOf(["CHURCH", "DEPARTMENT"]).required(),
  department_id: Yup.number()
    .nullable()
    .when("audience", {
      is: "DEPARTMENT",
      then: (schema) => schema.required("Department is required"),
      otherwise: (schema) => schema.nullable(),
    }),
});

interface ChurchMessageFormProps {
  onClose: () => void;
  onSaved: () => void;
}

/** Important church message: a Community post with `type: MESSAGE` and
 *  `isImportant: true`, pinned in members' feeds for 7 days. */
const ChurchMessageForm = ({ onClose, onSaved }: ChurchMessageFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleUpload, loading: uploading } = usePictureUpload();
  const { data: departmentsData } = useFetch(api.fetch.fetchDepartments);

  const departmentOptions = useMemo(
    () =>
      (departmentsData?.data ?? []).map((department) => ({
        label: department.name,
        value: department.id,
      })),
    [departmentsData]
  );

  const initialValues: ChurchMessageValues = {
    body: "",
    audience: "CHURCH",
    department_id: null,
  };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, MAX_IMAGES - images.length);
    for (const file of picked) {
      const formData = new FormData();
      formData.append("file", file);
      const link = await handleUpload(formData);
      if (link) setImages((current) => [...current, link].slice(0, MAX_IMAGES));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (values: ChurchMessageValues) => {
    const payload: CreateCommunityPostDto = {
      type: "MESSAGE",
      isImportant: true,
      body: values.body.trim(),
      audience: values.audience,
      ...(values.audience === "DEPARTMENT" && values.department_id
        ? { departmentId: Number(values.department_id) }
        : {}),
      ...(images.length ? { imageUrls: images } : {}),
    };

    setSubmitting(true);
    try {
      await api.post.createCommunityPost(payload);
      showNotification("Church message posted", "success");
      onSaved();
      onClose();
    } catch {
      // ApiErrorHandler has already shown the error.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSave}
    >
      {({ handleSubmit, values }) => (
        <Form className="flex max-h-[calc(100vh-180px)] flex-col overflow-auto">
          <div className="sticky top-0 z-10">
            <FormHeader>
              <p className="text-lg font-semibold">New church message</p>
              <p className="text-sm text-white">
                Posted as an important message from church leadership and
                pinned in members&apos; Community feed for 7 days.
              </p>
            </FormHeader>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <Field
              component={FormikInputDiv}
              type="textarea"
              label="Message *"
              name="body"
              id="body"
              placeholder="What's your message?"
            />

            <Field
              component={FormikSelectField}
              label="Audience *"
              name="audience"
              id="audience"
              options={AUDIENCE_OPTIONS}
            />

            {values.audience === "DEPARTMENT" && (
              <Field
                component={FormikSelectField}
                label="Department *"
                name="department_id"
                id="department_id"
                options={departmentOptions}
                searchable
              />
            )}

            <div>
              <p className="mb-2 block text-sm font-medium">
                Photos (optional, up to {MAX_IMAGES})
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-lightGray"
                  >
                    <img
                      src={src}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() =>
                        setImages((current) =>
                          current.filter((_, position) => position !== index)
                        )
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-20 items-center rounded-lg border border-dashed border-lightGray px-4 text-sm text-primaryGray hover:bg-lightGray/30 disabled:opacity-60"
                  >
                    {uploading ? "Uploading…" : "Add photos"}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(event) => addImages(event.target.files)}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-6 py-4">
            <Button
              variant="secondary"
              type="button"
              value="Cancel"
              onClick={onClose}
            />
            <Button
              type="button"
              value="Post message"
              loading={submitting}
              disabled={uploading}
              onClick={() => handleSubmit()}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ChurchMessageForm;
