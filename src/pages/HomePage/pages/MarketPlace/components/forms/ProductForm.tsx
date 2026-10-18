import { Field, Form, Formik, type FormikErrors } from "formik";
import { useMemo } from "react";
import { array, mixed, number, object, string } from "yup";

import type { IProduct } from "@/utils/api/marketPlace/interface";
import { cn } from "@/utils/cn";
import { formatMoney } from "../../utils/marketplaceModel";
import { backLink, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls, selectCls, tint } from "../markets/styles";
import { ProductGalleryWithForm } from "./ProductGallery";
import { colourUnits, useImagePreview } from "./productFormUtils";

type Option = { label: string; value: string | number };

interface IProps {
  onSubmit: (product: IProduct) => void;
  loading: boolean;
  productTypes: Option[];
  categories: Option[];
  markets: Option[];
  defaultMarketId?: string;
  initialData?: IProduct;
  isEdit: boolean;
  backLabel: string;
  onBack: () => void;
  onDelete?: () => void;
  /** Error from the API or image upload, shown in the form's error line. */
  serverError?: string;
}

const card = "flex flex-col gap-3.5 rounded-xl border border-lightGray bg-white p-5";

/** First error message in a nested Formik errors object, in field order. */
const firstError = (errors: FormikErrors<IProduct>): string => {
  const order: (keyof IProduct)[] = [
    "name",
    "price_amount",
    "product_type_id",
    "product_category_id",
    "market_id",
    "status",
    "product_colours",
  ];
  const dig = (e: unknown): string => {
    if (!e) return "";
    if (typeof e === "string") return e;
    if (Array.isArray(e)) {
      for (const item of e) {
        const m = dig(item);
        if (m) return m;
      }
      return "";
    }
    if (typeof e === "object") {
      for (const v of Object.values(e as Record<string, unknown>)) {
        const m = dig(v);
        if (m) return m;
      }
    }
    return "";
  };
  for (const key of order) {
    const m = dig(errors[key]);
    if (m) return m;
  }
  return "";
};

const Preview = ({
  values,
  productTypes,
  markets,
}: {
  values: IProduct;
  productTypes: Option[];
  markets: Option[];
}) => {
  const first = values.product_colours[0];
  const image = useImagePreview(
    values.product_colours.find((c) => c.image_url)?.image_url
  );
  const type =
    productTypes.find((t) => String(t.value) === String(values.product_type_id))
      ?.label || "Type";
  const market =
    markets.find((m) => String(m.value) === String(values.market_id))?.label ||
    "Market";
  const price = Number(values.price_amount);
  const managed = values.stock_managed === "yes";
  const units = values.product_colours.reduce((a, c) => a + colourUnits(c), 0);
  const variants = values.product_colours.reduce(
    (a, c) => a + (c.stock || []).length,
    0
  );

  return (
    <section className={card}>
      <p className="text-xs font-semibold uppercase tracking-wider text-primaryGray">
        Storefront preview
      </p>
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg"
        style={image ? undefined : { background: tint(first?.colour) }}
      >
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <div
            className="aspect-square w-[44%] rounded-[22%] shadow-[0_14px_28px_rgba(8,13,45,0.18)]"
            style={{ background: first?.colour || "#D8DAE5" }}
          />
        )}
        <span className="absolute bottom-2 left-2.5 rounded bg-white/70 px-1 text-xs uppercase tracking-wider text-primary/60">
          {type}
        </span>
      </div>
      <div>
        <p className="text-xs text-primaryGray">{market}</p>
        <p className="font-semibold">{values.name || "Product name"}</p>
        <p className="font-semibold">{formatMoney(price > 0 ? price : 0)}</p>
      </div>
      <p className="border-t border-gray-200 pt-2 text-sm text-primaryGray">
        {managed
          ? `${units} units across ${variants} ${variants === 1 ? "variant" : "variants"}`
          : `${variants} ${variants === 1 ? "variant" : "variants"} · stock not tracked`}
      </p>
    </section>
  );
};

export function ProductForm({
  onSubmit,
  loading,
  productTypes,
  categories,
  markets,
  defaultMarketId,
  initialData,
  isEdit,
  backLabel,
  onBack,
  onDelete,
  serverError,
}: IProps) {
  const initial: IProduct = useMemo(
    () =>
      initialData || {
        ...initialValues,
        market_id: defaultMarketId || "",
      },
    [initialData, defaultMarketId]
  );

  return (
    <Formik
      enableReinitialize
      initialValues={initial}
      validationSchema={validationSchema}
      validateOnBlur={false}
      onSubmit={(values) => onSubmit(values)}
    >
      {({ values, errors, submitCount }) => {
        const error = (submitCount > 0 && firstError(errors)) || serverError;
        return (
          <Form className="flex flex-col gap-4 text-primary" noValidate>
            <button type="button" className={backLink} onClick={onBack}>
              ← {backLabel}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold leading-8">
                {isEdit ? "Edit product" : "Add product"}
              </h1>
              <div className="flex flex-wrap gap-2">
                {onDelete && (
                  <button
                    type="button"
                    className={btnDanger}
                    onClick={onDelete}
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={onBack}
                  disabled={loading}
                >
                  Discard
                </button>
                <button type="submit" className={btnPrimary} disabled={loading}>
                  {loading ? "Saving…" : "Save product"}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col gap-4">
                <section className={card}>
                  <h2 className="text-base font-semibold">General</h2>
                  <label className={labelCls}>
                    Product name
                    <Field
                      name="name"
                      placeholder="e.g. Conference Tee 2026"
                      className={inputCls}
                    />
                  </label>
                  <label className={labelCls}>
                    Description
                    <Field
                      as="textarea"
                      name="description"
                      rows={4}
                      className={cn(inputCls, "h-auto resize-y py-2.5")}
                    />
                  </label>
                  <label className={cn(labelCls, "max-w-[240px]")}>
                    Price (GH₵)
                    <Field
                      type="number"
                      name="price_amount"
                      min={0}
                      step="0.01"
                      className={inputCls}
                    />
                  </label>
                </section>

                <ProductGalleryWithForm />
              </div>

              <div className="flex flex-col gap-4 xl:sticky xl:top-4">
                <section className={card}>
                  <h2 className="text-base font-semibold">Status & organisation</h2>
                  <label className={labelCls}>
                    Status
                    <Field as="select" name="status" className={cn(selectCls, "w-full")}>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </Field>
                  </label>
                  <label className={labelCls}>
                    Market
                    <Field as="select" name="market_id" className={cn(selectCls, "w-full")}>
                      <option value="">Select a market</option>
                      {markets.map((m) => (
                        <option key={m.value} value={String(m.value)}>
                          {m.label}
                        </option>
                      ))}
                    </Field>
                  </label>
                  <label className={labelCls}>
                    Category
                    <Field
                      as="select"
                      name="product_category_id"
                      className={cn(selectCls, "w-full")}
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c.value} value={String(c.value)}>
                          {c.label}
                        </option>
                      ))}
                    </Field>
                  </label>
                  <label className={labelCls}>
                    Product type
                    <Field
                      as="select"
                      name="product_type_id"
                      className={cn(selectCls, "w-full")}
                    >
                      <option value="">Select a type</option>
                      {productTypes.map((t) => (
                        <option key={t.value} value={String(t.value)}>
                          {t.label}
                        </option>
                      ))}
                    </Field>
                  </label>
                </section>

                <Preview values={values} productTypes={productTypes} markets={markets} />
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

const initialValues: IProduct = {
  name: "",
  description: "",
  status: "draft",
  product_type_id: "",
  product_category_id: "",
  price_amount: "",
  price_currency: "GHC",
  market_id: "",
  id: "",
  ...ProductGalleryWithForm.initialValues,
};

const requiredId = (message: string) =>
  mixed().test(
    "required-id",
    message,
    (value) => String(value ?? "").trim() !== "" && Number(value) !== 0
  );

const validationSchema = object({
  name: string().trim().required("Add a product name."),
  price_amount: number()
    .transform((v, orig) => (orig === "" ? undefined : v))
    .typeError("Add a price greater than zero.")
    .required("Add a price greater than zero.")
    .moreThan(0, "Add a price greater than zero."),
  product_type_id: requiredId("Choose a product type."),
  product_category_id: requiredId("Choose a category."),
  market_id: string().required("Choose a market."),
  status: string().oneOf(["published", "draft"]).required(),
  stock_managed: string().oneOf(["yes", "no"]).required(),
  product_colours: array()
    .min(1, "Add at least one colour.")
    .of(
      object({
        colour: string().required("Every colour needs a swatch."),
        colour_name: string().trim().required("Every colour needs a name."),
        stock: array()
          .min(1, "Pick at least one size.")
          .of(
            object({
              size: string().required(),
              stock: number()
                .transform((v, orig) => (orig === "" ? 0 : v))
                .typeError("Stock must be a number.")
                .min(0, "Stock can't be negative."),
            })
          ),
      })
    ),
});
