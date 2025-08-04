import { MinusCircleIcon } from "@heroicons/react/24/outline";
import { Field, FieldArray, FormikErrors, FormikTouched } from "formik";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import ImageUpload from "@/components/ImageUpload";
import { FormLayout } from "@/components/ui";
import type { Product } from "./ProductForm";

interface IProps {
  values: Product;
  errors: FormikErrors<Product>;
  touched: FormikTouched<Product>;
  setFieldValue: (field: string, value: File) => void;
}

export const ProductGallery = ({
  values,
  errors,
  touched,
  setFieldValue,
}: IProps) => {
  return (
    <FieldArray name="gallery">
      {({ push: pushGallery }) => (
        <div className="col-span-2">
          <p className="text-primary font-semibold py-1">Stock management</p>
          <div className="mt-1 mb-3 flex gap-4 text-900">
            {["yes", "no"].map((option) => (
              <label
                key={option}
                className="flex items-center gap-x-2 capitalize"
              >
                <Field type="radio" name="manage_stock" value={option} />
                {option}
              </label>
            ))}
          </div>

          <p className="text-primary font-semibold py-2">Product gallery</p>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.gallery.map((gallery, index: number) => (
              <div key={index} className="space-y-3 cursor-pointer">
                <Field
                  name={`gallery[${index}].color`}
                  type="color"
                  className="w-full h-10 rounded-lg p-0.5"
                  title="Select product color"
                />

                <ImageUpload
                  id={`fileUpload-${index}`}
                  src={
                    typeof values.gallery[index].image === "string"
                      ? values.gallery[index].image
                      : ""
                  }
                  onFileChange={(file: File) => {
                    setFieldValue(`gallery[${index}].image`, file);
                  }}
                  label="Click to upload or drag and drop"
                />
                {touched.gallery?.[index]?.image &&
                  typeof errors.gallery?.[index] === "object" &&
                  "image" in errors.gallery[index] &&
                  typeof errors.gallery[index]?.image === "string" && (
                    <p className="text-sm text-red-500">
                      {errors.gallery[index]?.image}
                    </p>
                  )}

                {values.manage_stock === "yes" && (
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
                  color: "#000000",
                  image: "",
                  stock_management: [{ size: "S", stock: 0 }],
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
  values: Product;
  index: number;
}
const StockManagement = ({ values, index }: IStockProps) => {
  return (
    <FieldArray name={`gallery[${index}].stock_management`}>
      {({ push, remove }) => (
        <>
          {values.gallery[index].stock_management.map((item, i: number) => (
            <div key={i} className="flex items-center gap-2 justify-between">
              <div className="flex items-end">
                <FormLayout>
                  <Field
                    name={`gallery[${index}].stock_management[${i}].size`}
                    component={FormikSelectField}
                    options={sizes.filter(
                      (sizeOption) =>
                        !values.gallery[index].stock_management.some(
                          (stock) => stock.size === sizeOption.value
                        ) || item.size === sizeOption.value
                    )}
                    placeholder="Select size"
                    id={`gallery[${index}].stock_management[${i}].size`}
                  />
                  <Field
                    name={`gallery[${index}].stock_management[${i}].stock`}
                    component={FormikInputDiv}
                    placeholder="Number of stocks"
                    type="number"
                    id={`gallery[${index}].stock_management[${i}].stock`}
                  />
                </FormLayout>
                {values.gallery[index].stock_management.length > 1 && (
                  <MinusCircleIcon
                    className="size-7 text-lightGray"
                    onClick={() => remove(i)}
                  />
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            {values.gallery[index].stock_management.length < sizes.length && (
              <Button
                variant="ghost"
                value="+ Add size"
                onClick={() => {
                  const nextSize = sizes.find(
                    (s) =>
                      !values.gallery[index].stock_management.some(
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
