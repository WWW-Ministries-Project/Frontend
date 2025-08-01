import { useNavigate } from "react-router-dom";
import { array, mixed, object, string } from "yup";
import { Field, FieldArray, Form, Formik } from "formik";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import ImageUpload from "@/components/ImageUpload";
import { FormLayout } from "@/components/ui";
import type { IProduct } from "@/utils/api/marketPlace/interface";
import { MinusCircleIcon } from "@heroicons/react/24/outline";

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

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        addProduct(values);
      }}
    >
      {({ values, setFieldValue, handleSubmit, errors, touched }) => {
        return (
          <Form className="px-5 space-y-6">
            <div className="g">
              <div className="lg:col-span-2 space-y-4">
                <FormLayout>
                  <Field
                    name="product_name"
                    component={FormikInputDiv}
                    label="Product name *"
                    id="product_name"
                    placeholder="Enter Product Name"
                    className="col-span-1 w-full"
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
                      <p className="text-primary font-semibold py-1">
                        Stock management
                      </p>
                      <div className="mt-1 mb-3 flex gap-4 text-900">
                        <label className="flex items-center gap-x-2">
                          <Field type="radio" name="manage_stock" value="yes" />
                          Yes
                        </label>
                        <label className="flex items-center gap-x-2">
                          <Field type="radio" name="manage_stock" value="no" />
                          No
                        </label>
                      </div>
                      <p className="text-primary font-semibold py-2">
                        Product gallery
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
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
                            {/* size and stocks */}
                            {values.manage_stock === "yes" && (
                              <div>
                                <FieldArray
                                  name={`gallery[${index}].stock_management`}
                                >
                                  {({ push, remove }) => (
                                    <>
                                      {values.gallery[
                                        index
                                      ].stock_management.map((item, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center gap-2 justify-between"
                                        >
                                          <div className="flex items-end">
                                            <FormLayout>
                                              <Field
                                                name={`gallery[${index}].stock_management[${i}].size`}
                                                component={FormikSelectField}
                                                options={sizes.filter(
                                                  (sizeOption) =>
                                                    !values.gallery[
                                                      index
                                                    ].stock_management.some(
                                                      (s) =>
                                                        s.size ===
                                                        sizeOption.value
                                                    ) ||
                                                    item.size ===
                                                      sizeOption.value
                                                )}
                                                id={`gallery[${index}].stock_management[${i}].size`}
                                                placeholder="Select size"
                                                title="Select size"
                                              />
                                              <Field
                                                name={`gallery[${index}].stock_management[${i}].stock`}
                                                component={FormikInputDiv}
                                                id={`gallery[${index}].stock_management[${i}].stock`}
                                                placeholder="Number of stocks"
                                                type="number"
                                              />
                                            </FormLayout>
                                            {values.gallery[index]
                                              .stock_management.length > 1 && (
                                              <MinusCircleIcon
                                                className="size-7 text-lightGray"
                                                onClick={() => remove(i)}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      <div className="flex justify-end">
                                        {values.gallery[index].stock_management
                                          .length < sizes.length && (
                                          <Button
                                            variant="ghost"
                                            value="+ Add size"
                                            onClick={() => {

                                              //add the next available size
                                              const nextSize = sizes.find(
                                                (s) =>
                                                  !values.gallery[
                                                    index
                                                  ].stock_management.some(
                                                    (item) =>
                                                      item.size === s.value
                                                  )
                                              )?.value;

                                              push({
                                                size: nextSize,
                                                stock: 0,
                                              });
                                            }}
                                            className="hover:no-underline"
                                          />
                                        )}
                                      </div>
                                    </>
                                  )}
                                </FieldArray>
                              </div>
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
                              stock_management: [{ size: "S", stock: 0 }],
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
                </FormLayout>
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
    stock_management: { stock?: number; size?: string }[];
  }[];
  manage_stock: "yes" | "no";
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
  gallery: [
    {
      color: "",
      image: "",
      stock_management: [{ size: "S", stock: 0 }],
    },
  ],
  id: "",
  manage_stock: "yes",
};

const validationSchema = object().shape({
  product_name: string().required("required"),
  description: string().required("required"),
  type: string().required("required"),
  category: string().required("required"),
  price: string().required("required"),
  manage_stock: string().oneOf(["yes", "no"]),

  gallery: array().of(
    object({
      color: string(),
      image: mixed().required("Required"),
      stock_management: array().of(
        object({
          size: string(),
        })
      ),
    })
  ),
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

const sizes = ["S", "M", "L", "XL", "2XL", "3XL"].map((size) => {
  return {
    label: size,
    value: size,
  };
});
