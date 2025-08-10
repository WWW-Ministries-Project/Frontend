import { Field, FieldArray, useFormikContext } from "formik";
import { array, mixed, object, string } from "yup";

import { Button } from "@/components";
import ImageUpload from "@/components/ImageUpload";
import type { IProduct } from "@/utils/api/marketPlace/interface";
import { IStocksSubForm, StocksSubForm } from "./StocksSubForm";
import { FormHeader } from "@/components/ui";

const ProductGallery = () => {
  const { values, errors, touched, setFieldValue } =
    useFormikContext<IProduct>();

  return (
    <FieldArray name="product_colours">
      {({ push }) => (
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
              <div key={index} className="space-y-3 cursor-pointer">
                <Field
                  name={`product_colours[${index}].colour`}
                  type="color"
                  className="w-full h-10 rounded-lg p-0.5"
                  title="Select product color"
                />

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
              onClick={() =>
                push({
                  colour: "#000000",
                  image_url: "",
                  stock: [{ size: "S", stock: 0 }],
                })
              }
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
    image_url: File | string;
    stock: IStocksSubForm[];
  }[];
}

const initialValues: IProductGalleryForm = {
  stock_managed: "yes",
  product_colours: [
    {
      colour: "#000000",
      image_url: "",
      stock: StocksSubForm.initialValues,
    },
  ],
};

const validationSchema = object().shape({
  stock_managed: string().oneOf(["yes", "no"]).required(),
  product_colours: array().of(
    object().shape({
      colour: string(),
      image_url: mixed().required("Required"),
      stock: array().when("$stock_managed", {
        is: "yes",
        then: () => StocksSubForm.validationSchema,
        otherwise: () => array().notRequired(),
      }),
    })
  ),
});


export const ProductGalleryWithForm = Object.assign(ProductGallery, {
  initialValues,
  validationSchema,
});
