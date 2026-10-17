import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useRef, useState } from "react";
import { Button } from "@/components";
import { FormHeader } from "@/components/ui";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { api } from "@/utils/api/apiCalls";
import { usePictureUpload } from "@/CustomHooks/usePictureUpload";
import { showNotification } from "@/pages/HomePage/utils";
import type {
  CreatePromotionDto,
  Promotion,
} from "@/utils/api/promotions/interfaces";
import {
  parsePromotionLink,
  PROMOTION_APP_SCREENS,
  type PromotionLinkType,
  WEB_LINK_PATTERN,
} from "./promotionLinks";

interface PromotionFormValues {
  title: string;
  /** Plain text, not rich HTML — the mobile carousel renders it as a single
   *  short paragraph, so an editor would only produce markup to strip. */
  subtitle: string;
  image_url: string;
  cta_label: string;
  /** Where tapping the banner goes; combined into `deep_link` on save. */
  link_type: PromotionLinkType;
  app_screen: string;
  web_url: string;
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
  app_screen: Yup.string().when("link_type", {
    is: "screen",
    then: (schema) => schema.required("Choose the screen to open"),
  }),
  web_url: Yup.string()
    .trim()
    .when("link_type", {
      is: "web",
      then: (schema) =>
        schema
          .required("Enter the web address")
          .matches(
            WEB_LINK_PATTERN,
            "Enter a full web address starting with https://"
          ),
    }),
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState(promotion?.image_url ?? "");
  const { handleUpload, loading: uploadLoading } = usePictureUpload();

  const isEdit = Boolean(promotion);
  const isPublished = promotion?.status === "PUBLISHED";

  const initialLink = parsePromotionLink(promotion?.deep_link);
  // A link saved before the picker existed may point at a path that isn't in
  // the list — keep it selectable so editing the banner doesn't lose it.
  const screenOptions =
    initialLink.screen &&
    !PROMOTION_APP_SCREENS.some((option) => option.value === initialLink.screen)
      ? [
          ...PROMOTION_APP_SCREENS,
          { value: initialLink.screen, label: `Current: ${initialLink.screen}` },
        ]
      : [...PROMOTION_APP_SCREENS];

  const initialValues: PromotionFormValues = {
    title: promotion?.title ?? "",
    subtitle: promotion?.subtitle ?? "",
    image_url: promotion?.image_url ?? "",
    cta_label: promotion?.cta_label ?? "",
    link_type: initialLink.type,
    app_screen: initialLink.screen,
    web_url: initialLink.url,
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
    deep_link:
      values.link_type === "screen"
        ? values.app_screen || null
        : values.link_type === "web"
          ? values.web_url.trim() || null
          : null,
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
      {({ handleSubmit, setFieldValue, values }) => (
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
                <div className="mb-2 flex items-end gap-3">
                  <img
                    src={imagePreview}
                    alt="Banner preview"
                    className="h-24 w-full max-w-xs rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    disabled={uploadLoading}
                    onClick={() => {
                      setImagePreview("");
                      setFieldValue("image_url", "");
                      // Clear the picker too, so choosing the same file
                      // again still fires onChange.
                      if (imageInputRef.current) imageInputRef.current.value = "";
                    }}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remove image
                  </button>
                </div>
              )}
              <input
                ref={imageInputRef}
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
              <label className="block text-sm font-medium mb-2">
                When a member taps the banner
              </label>
              <div className="flex flex-col gap-2 md:flex-row md:gap-6">
                {(
                  [
                    ["screen", "Open a screen in the app"],
                    ["web", "Open a web page"],
                    ["none", "Nothing (not tappable)"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="text-sm">
                    <Field
                      type="radio"
                      name="link_type"
                      value={value}
                      className="mr-1"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {values.link_type === "screen" && (
                <div className="mt-3">
                  <Field
                    component={FormikSelectField}
                    label="Screen"
                    name="app_screen"
                    id="app_screen"
                    placeholder="Choose a screen"
                    options={screenOptions}
                    searchable
                  />
                </div>
              )}

              {values.link_type === "web" && (
                <div className="mt-3">
                  <Field
                    component={FormikInputDiv}
                    label="Web address"
                    name="web_url"
                    id="web_url"
                    placeholder="https://wwmchurch.org/events/convocation"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Opens in the app&apos;s built-in browser, where members can
                    also copy, share or open it in Safari/Chrome.
                  </p>
                </div>
              )}

              {values.link_type === "none" && (
                <p className="mt-1 text-xs text-gray-500">
                  The button label above isn&apos;t shown on a banner that
                  doesn&apos;t go anywhere.
                </p>
              )}
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
