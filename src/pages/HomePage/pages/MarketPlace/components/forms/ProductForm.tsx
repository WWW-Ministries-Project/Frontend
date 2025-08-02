import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { array, mixed, object, string } from "yup";
import { Field, FieldArray, Form, Formik, FormikHelpers } from "formik";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import ImageUpload from "@/components/ImageUpload";
import { FormLayout } from "@/components/ui";
import type { IProduct, IProductType } from "@/utils/api/marketPlace/interface";

interface IProps {
  addProduct: (product: IProduct) => void;
  isSubmitting: boolean;
  productTypes: { label: string; value: string }[];
  categories: { label: string; value: string }[];
}
export function ProductForm({
  addProduct,
  isSubmitting,
  productTypes,
  categories,
}: IProps) {
  const navigate = useNavigate();

  const toggleSize = useCallback(
    (
      size: string,
      selectedSizes: string[],
      setFieldValue: FormikHelpers<Product>["setFieldValue"]
    ) => {
      const updatedSizes = selectedSizes.includes(size)
        ? selectedSizes.filter((s) => s !== size)
        : [...selectedSizes, size];

      setFieldValue("sizes", updatedSizes);
    },
    []
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        addProduct(values);
      }}
    >
      {({ values, setFieldValue, handleSubmit, errors, touched }) => {
        const selectedSizes: string[] = values.sizes || [];

        return (
          <Form className="px-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <FormLayout>
                  <Field
                    name="product_name"
                    component={FormikInputDiv}
                    label="Product name *"
                    id="product_name"
                    placeholder="Enter Product Name"
                    className="col-span-2 w-full"
                  />

                  <Field
                    name="description"
                    component={FormikInputDiv}
                    label="Description *"
                    id="description"
                    placeholder="Enter description"
                    type="textarea"
                    className="col-span-2 w-full"
                  />

                  <Field
                    name="type"
                    component={FormikSelectField}
                    options={productTypes}
                    label="Product type"
                    id="type"
                    placeholder="Select Type"
                  />

                  <Field
                    name="category"
                    component={FormikSelectField}
                    options={categories}
                    label="Product category"
                    id="category"
                    placeholder="Select Category"
                  />
                </FormLayout>

                {/* Gallery Section */}
                <FieldArray name="gallery">
                  {({ push }) => (
                    <div>
                      <p className="text-primary font-semibold py-2">
                        Product gallery
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
                        {values.gallery.map((variant, index) => (
                          <div key={index} className="space-y-3 cursor-pointer">
                            {/* Color Picker */}
                            <Field
                              name={`gallery[${index}].color`}
                              type="color"
                              className="w-full h-10 rounded-lg p-0.5"
                              title="Select product color"
                            />

                            {/* Image Upload */}
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
                            {touched.gallery &&
                              typeof errors.gallery?.[index] === "object" &&
                              errors.gallery?.[index]?.image && (
                                <p className="text-sm text-red-500">
                                  {errors.gallery[index]?.image}
                                </p>
                              )}
                          </div>
                        ))}
                      </div>

                      {/* Add More Gallery Button */}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          value="+ Add another one"
                          onClick={() =>
                            push({
                              color: "#000000",
                              image: "",
                            })
                          }
                          className="hover:no-underline"
                        />
                      </div>
                    </div>
                  )}
                </FieldArray>

                <FormLayout>
                  <Field
                    name="price"
                    component={FormikInputDiv}
                    label="Price"
                    id="price"
                    placeholder=""
                    type="number"
                  />
                  <Field
                    name="stock"
                    component={FormikInputDiv}
                    label="Stock"
                    id="stock"
                    placeholder="Enter number of stocks"
                    type="number"
                  />
                  <div className="space-y-2  ">
                    <p className="font-semibold">Sizes</p>
                    <ul className="flex gap-2 font-semibold">
                      {sizes.map((size) => (
                        <li
                          key={size}
                          className={`border text-center flex items-center justify-center size-9 rounded-lg  p-1 cursor-pointer ${
                            values.sizes.includes(size)
                              ? "bg-gray-200"
                              : "bg-white"
                          }`}
                          onClick={() =>
                            toggleSize(size, selectedSizes, setFieldValue)
                          }
                        >
                          {size}
                        </li>
                      ))}
                    </ul>
                    {touched.sizes && errors.sizes && (
                      <p className="text-error text-sma">{errors.sizes}</p>
                    )}
                  </div>
                </FormLayout>
              </div>

              {/* Right Section: Status */}
              <div className="space-y-4">
                <Field
                  name="status"
                  component={FormikSelectField}
                  options={productSatus}
                  label="Status"
                  id="status"
                  placeholder="Select status"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 border-t p-2">
              <Button
                value="Save"
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
              <Button
                value="Cancel"
                variant="secondary"
                onClick={() => navigate(-1)}
              />
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

export interface Product extends IProduct {
  gallery: {
    color: string;
    image: File | string;
  }[];
  sizes: string[];
}

const initialValues: Product = {
  product_name: "",
  description: "",
  imageUrl: "",
  status: "published",
  type: "",
  category: "",
  price: "",
  stock: "",
  sizes: [],
  gallery: [
    {
      color: "",
      image: "",
    },
  ],
  id: "",
};

const validationSchema = object().shape({
  product_name: string().required("required"),
  description: string().required("required"),
  type: string().required("required"),
  category: string().required("required"),
  price: string().required("required"),
  stock: string().required("required"),
  gallery: array().of(
    object({
      color: string(),
      image: mixed().required("Image is required"),
    })
  ),
  sizes: array().min(1).required("required"),
});

const productSatus = [
  {
    label: "Published",
    value: "published",
  },
  {
    label: "Draft",
    value: "draft",
  },
];

const sizes = ["S", "M", "L", "XL", "2XL", "3XL"];
