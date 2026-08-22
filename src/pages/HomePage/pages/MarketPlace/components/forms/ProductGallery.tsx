import { Field, FieldArray, useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { array, mixed, number, object, string } from "yup";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import ImageUpload from "@/components/ImageUpload";
import type { IProduct } from "@/utils/api/marketPlace/interface";
import { IStocksSubForm, StocksSubForm } from "./StocksSubForm";

const ProductGallery = () => {
  const { values, errors, touched, setFieldValue } =
    useFormikContext<IProduct>();

  // React keys these rows by array index below, but FieldArray's
  // push/remove splice that same array — after a remove, every row after
  // the removed one keeps its DOM node (same index-derived key) while its
  // props silently shift to a DIFFERENT colour's data, including a native
  // <input type="color"> whose displayed swatch can lag/flash to the
  // browser's invalid-value fallback (black) for a render. Track a stable
  // id per row, independent of position, so removing one row never touches
  // any other row's identity.
  const [rowKeys, setRowKeys] = useState<string[]>(() =>
    values.product_colours.map(() => crypto.randomUUID())
  );
  useEffect(() => {
    setRowKeys((prev) => {
      if (prev.length === values.product_colours.length) return prev;
      return values.product_colours.map((_, i) => prev[i] ?? crypto.randomUUID());
    });
    // Only the length matters here — reacting to the array reference would
    // re-run (harmlessly, but pointlessly) on every keystroke in any colour
    // field, since Formik replaces the array on each field-level update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.product_colours.length]);

  return (
    <FieldArray name="product_colours">
      {({ push, remove }) => (
        <div className="col-span-2">
          <p className="text-primary font-semibold py-1">Stock management</p>
          <div className="mt-1 mb-3 flex gap-4 text-900">
            {["yes", "no"].map((option) => (
              <label
                key={option}
                className="flex items-center gap-x-2 capitalize"
              >
                <Field type="radio" name="stock_managed" value={option} />
                {option}
              </label>
            ))}
          </div>

          <p className="text-primary font-semibold py-2">Product Gallery</p>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.product_colours.map((product_colours, index) => (
              <div key={rowKeys[index] ?? index} className="space-y-3 relative border border-gray-200 rounded-lg p-3">
                {values.product_colours.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      remove(index);
                      setRowKeys((prev) => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute top-2 right-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <Field
                    name={`product_colours[${index}].colour`}
                    type="color"
                    className="h-10 w-14 shrink-0 rounded-lg p-0.5"
                    title="Select product color"
                  />
                  <Field
                    component={FormikInputDiv}
                    id={`product_colours[${index}].colour_name`}
                    name={`product_colours[${index}].colour_name`}
                    placeholder="Colour name (e.g. Forest Green)"
                    className="flex-1"
                  />
                </div>

                <ImageUpload
                  id={`fileUpload-${index}`}
                  src={
                    typeof product_colours.image_url === "string"
                      ? product_colours.image_url
                      : ""
                  }
                  onFileChange={(file: File) => {
                    setFieldValue(`product_colours[${index}].image_url`, file);
                  }}
                  label="Click to upload or drag and drop"
                />

                {touched.product_colours?.[index]?.image_url &&
                  typeof errors.product_colours?.[index] === "object" &&
                  "image_url" in errors.product_colours[index] &&
                  typeof errors.product_colours[index]?.image_url ===
                    "string" && (
                    <p className="text-sm text-red-500">
                      {errors.product_colours[index]?.image_url}
                    </p>
                  )}

                {values.stock_managed === "yes" && (
                  <StocksSubForm index={index} />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              value="+ Add another one"
              onClick={() => {
                push({
                  colour: "#000000",
                  colour_name: "",
                  image_url: "",
                  stock: [{ size: "S", stock: 0 }],
                });
                setRowKeys((prev) => [...prev, crypto.randomUUID()]);
              }}
              className="hover:no-underline"
            />
          </div>
        </div>
      )}
    </FieldArray>
  );
};

interface IProductGalleryForm {
  stock_managed: "yes" | "no";
  product_colours: {
    colour: string;
    colour_name?: string;
    image_url: File | string;
    stock: IStocksSubForm[];
  }[];
}

const initialValues: IProductGalleryForm = {
  stock_managed: "yes",
  product_colours: [
    {
      colour: "#000000",
      colour_name: "",
      image_url: "",
      stock: StocksSubForm.initialValues,
    },
  ],
};

const validationSchema = object().shape({
  stock_managed: string().oneOf(["yes", "no"]).required(),
  product_colours: array()
    .min(1, "At least one product color is required")
    .of(
      object().shape({
        colour: string().required("Required"),
        colour_name: string().optional(),
        image_url: mixed().required("Required"),
        stock: array().of(
          object().shape({
            size: string().required("Required"),
            stock: number()
              .typeError("Stock must be a number")
              .min(0, "Stock can't be negative"),
          })
        ),
      })
    )
    .test(
      "stock-required-when-managed",
      "Each selected size must have stock greater than 0 when stock management is enabled.",
      function (productColours) {
        if (this.parent?.stock_managed !== "yes") return true;

        const colours = productColours || [];
        return colours.every((colourItem) => {
          const stockList = colourItem?.stock || [];
          if (stockList.length === 0) return false;
          return stockList.every((stockItem) => Number(stockItem?.stock) > 0);
        });
      }
    ),
});

export const ProductGalleryWithForm = Object.assign(ProductGallery, {
  initialValues,
  validationSchema,
});
