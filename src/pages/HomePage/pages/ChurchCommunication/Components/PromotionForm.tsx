import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useRef, useState } from "react";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { api } from "@/utils/api/apiCalls";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  CreatePromotionDto,
  Promotion,
} from "@/utils/api/promotions/interfaces";

interface PromotionFormValues {
  title: string;
  /** Plain text, not rich HTML — the mobile carousel renders it as a single
   *  short paragraph, so an editor would only produce markup to strip. */
  subtitle: string;
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

const validationSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  sort_order: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .integer("Must be a whole number")
    .min(0, "Must be zero or more")
    .nullable(),
  end_date: Yup.string().test(
    "end-after-start",
    "End date must be on or after the start date",
    function (value) {
      const { start_date: startDate } = this.parent as PromotionFormValues;
      if (!value || !startDate) return true;
      return new Date(value).getTime() >= new Date(startDate).getTime();
    }
  ),
});

interface PromotionFormProps {
  promotion?: Promotion | null;
  onClose: () => void;
  onSaved: () => void;
}

const PromotionForm = ({ promotion, onClose, onSaved }: PromotionFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const publishRef = useRef(false);
  const [imagePreview, setImagePreview] = useState(promotion?.image_url ?? "");
  const { handleUpload, loading: uploadLoading } = usePictureUpload();

  const isEdit = Boolean(promotion);
  const isPublished = promotion?.status === "PUBLISHED";

  const initialValues: PromotionFormValues = {
    title: promotion?.title ?? "",
    subtitle: promotion?.subtitle ?? "",
    image_url: promotion?.image_url ?? "",
    cta_label: promotion?.cta_label ?? "",
    deep_link: promotion?.deep_link ?? "",
    sort_order:
      promotion?.sort_order != null ? String(promotion.sort_order) : "",
    start_date: toDateInputValue(promotion?.start_date),
    end_date: toDateInputValue(promotion?.end_date),
  };

  const buildPayload = (values: PromotionFormValues): CreatePromotionDto => ({
    title: values.title.trim(),
    subtitle: values.subtitle.trim() || null,
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

  const handleSave = async (values: PromotionFormValues) => {
    const shouldPublish = publishRef.current;
    const payload = buildPayload(values);

    setSubmitting(true);
    try {
      if (promotion) {
        await api.put.updatePromotion(promotion.id, payload);
        if (shouldPublish && !isPublished) {
          await api.post.publishPromotion(promotion.id);
        }
      } else {
        const response = await api.post.createPromotion(payload);
        const newId = response.data?.id;
        if (shouldPublish && newId) {
          await api.post.publishPromotion(newId);
        }
      }

      showNotification(
        shouldPublish
          ? "Promotion published successfully"
          : "Promotion saved successfully",
        "success"
      );
      onSaved();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Promotion submit failed", error);
      showNotification(
        "Promotion could not be saved. Please try again.",
        "error",
        "Promotion"
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
      {({ handleSubmit, setFieldValue }) => (
        <Form className="h-[calc(100vh-180px)] flex flex-col overflow-auto">
          <div className="sticky top-0 z-10">
            <FormHeader>
              <p className="text-lg font-semibold">
                {isEdit ? "Edit Promotion" : "Create Promotion"}
              </p>
              <p className="text-sm text-white">
                Shown as a banner slide on the mobile app&apos;s Home screen.
                Publishing does not notify members.
              </p>
            </FormHeader>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
            <Field
              component={FormikInputDiv}
              label="Title *"
              name="title"
              id="title"
              placeholder="Building fund campaign"
            />

            <Field
              component={FormikInputDiv}
              label="Subtitle"
              name="subtitle"
              id="subtitle"
              placeholder="One short line under the title"
            />

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
                16:9 works best (about 1200×675px). Leave empty for a plain
                accent-colored card instead of a photo.
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
                <code>/member/announcements</code>. Leave empty for a
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

            <div>
              <Field
                component={FormikInputDiv}
                label="Display order"
                name="sort_order"
                id="sort_order"
                type="number"
                placeholder="1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Lowest number shows first. Up to 3 live promotions appear on
                Home; ones with no order fall to the back.
              </p>
            </div>
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

export default PromotionForm;
