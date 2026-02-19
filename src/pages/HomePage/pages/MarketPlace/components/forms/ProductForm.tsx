import { Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { mixed, number, object, string } from "yup";
import { useMemo } from "react";

import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout } from "@/components/ui";
import { Actions } from "@/components/ui/form/Actions";
import type { IProduct } from "@/utils/api/marketPlace/interface";
import { ProductGalleryWithForm } from "./ProductGallery";

interface IProps {
  onSubmit: (product: IProduct) => void;
  loading: boolean;
  productTypes: { label: string; value: string | number }[];
  categories: { label: string; value: string | number }[];
  initialData?: IProduct;
}
export function ProductForm({
  onSubmit,
  loading,
  productTypes,
  categories,
  initialData,
}: IProps) {
  const navigate = useNavigate();

  const initial: IProduct = useMemo(
    () => initialData || initialValues,
    [initialData]
  );
  return (
    <Formik
      enableReinitialize
      initialValues={initial}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSubmit(values);
      }}
    >
      {({ handleSubmit }) => {
        return (
          <Form className="py-5 space-y-6">
            <FormLayout>
              <Field
                name="name"
                component={FormikInputDiv}
                label="Product name *"
                id="name"
                placeholder="Enter Product Name"
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
                name="product_type_id"
                component={FormikSelectField}
                options={productTypes}
                label="Product type"
                id="product_type_id"
                placeholder="Select Type"
              />

              <Field
                name="product_category_id"
                component={FormikSelectField}
                options={categories}
                label="Product category"
                id="product_category_id"
                placeholder="Select Category"
              />

              <ProductGalleryWithForm />

              <Field
                name="price_amount"
                component={FormikInputDiv}
                label="Price"
                id="price_amount"
                placeholder="Enter price"
                type="number"
                min="0.01"
              />

              <Field
                name="status"
                component={FormikSelectField}
                options={productStatus}
                label="Status"
                id="status"
                placeholder="Select status"
              />
            </FormLayout>

            {/* Submit Button */}

            <Actions
              loading={loading}
              onCancel={() => navigate(-1)}
              onSubmit={handleSubmit}
            />
          </Form>
        );
      }}
    </Formik>
  );
}

const initialValues: IProduct = {
  name: "",
  description: "",
  status: "published",
  product_type_id: 0,
  product_category_id: 0,
  price_amount: 0,
  price_currency: "GHC",
  id: "",
  ...ProductGalleryWithForm.initialValues,
};

const validationSchema = object({
  name: string().trim().required("Required"),
  description: string().trim().required("Required"),
  product_type_id: mixed()
    .required("Required")
    .test(
      "is-valid-product-type",
      "Required",
      (value) => String(value || "").trim() !== "" && Number(value) !== 0
    ),
  product_category_id: mixed()
    .required("Required")
    .test(
      "is-valid-product-category",
      "Required",
      (value) => String(value || "").trim() !== "" && Number(value) !== 0
    ),
  price_amount: number()
    .typeError("Price must be a number")
    .moreThan(0, "Price must be greater than 0")
    .required("Required"),
  status: string().required("Required"),
}).concat(ProductGalleryWithForm.validationSchema);

const productStatus = [
  {
    label: "Published",
    value: "published",
  },
  {
    label: "Draft",
    value: "draft",
  },
];
