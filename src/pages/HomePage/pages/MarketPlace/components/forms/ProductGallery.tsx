import { MinusCircleIcon } from "@heroicons/react/24/outline";
import { Field, FieldArray, FormikErrors, FormikTouched } from "formik";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import ImageUpload from "@/components/ImageUpload";
import { FormLayout } from "@/components/ui";
import type { ProductType } from "@/utils/api/marketPlace/interface";

interface IProps {
  values: ProductType;
  errors: FormikErrors<ProductType>;
  touched: FormikTouched<ProductType>;
  setFieldValue: (field: string, value: File) => void;
}

export const ProductGallery = ({
  values,
  errors,
  touched,
  setFieldValue,
}: IProps) => {
  return (
    <FieldArray name="product_colours">
      {({ push: pushGallery }) => (
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
            {values.product_colours.map((product_colours, index: number) => (
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
                    typeof values.product_colours[index].image_url === "string"
                      ? values.product_colours[index].image_url
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
                  <StockManagement values={values} index={index} />
                )}
              </div>
            ))}
          </div>

          {/* Add More Gallery */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              value="+ Add another one"
              onClick={() =>
                pushGallery({
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

const sizes = ["S", "M", "L", "XL", "2XL", "3XL"].map((size) => ({
  label: size,
  value: size,
}));

interface IStockProps {
  values: ProductType;
  index: number;
}
const StockManagement = ({ values, index }: IStockProps) => {
  return (
    <FieldArray name={`product_colours[${index}].stock`}>
      {({ push, remove }) => (
        <>
          {values.product_colours[index].stock.map((item, i: number) => (
            <div key={i} className="flex items-center gap-2 justify-between">
              <div className="flex items-end">
                <FormLayout>
                  <Field
                    name={`product_colours[${index}].stock[${i}].size`}
                    component={FormikSelectField}
                    options={sizes.filter(
                      (sizeOption) =>
                        !values.product_colours[index].stock.some(
                          (stock) => stock.size === sizeOption.value
                        ) || item.size === sizeOption.value
                    )}
                    placeholder="Select size"
                    id={`product_colours[${index}].stock[${i}].size`}
                  />
                  <Field
                    name={`product_colours[${index}].stock[${i}].stock`}
                    component={FormikInputDiv}
                    placeholder="Number of stocks"
                    type="number"
                    id={`product_colours[${index}].stock[${i}].stock`}
                  />
                </FormLayout>
                {values.product_colours[index].stock.length > 1 && (
                  <MinusCircleIcon
                    className="size-7 text-lightGray"
                    onClick={() => remove(i)}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            {values.product_colours[index].stock.length < sizes.length && (
              <Button
                variant="ghost"
                value="+ Add size"
                onClick={() => {
                  const nextSize = sizes.find(
                    (s) =>
                      !values.product_colours[index].stock.some(
                        (item) => item.size === s.value
                      )
                  )?.value;

                  push({ size: nextSize, stock: 0 });
                }}
                className="hover:no-underline"
              />
            )}
          </div>
        </>
      )}
    </FieldArray>
  );
};
