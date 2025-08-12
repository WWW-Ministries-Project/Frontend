import { Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { number, object, string } from "yup";
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
  productTypes: { label: string; value: string }[];
  categories: { label: string; value: string }[];
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
          <Form className="px-5 space-y-6">
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
                placeholder=""
                type="number"
              />

              <Field
                name="status"
                component={FormikSelectField}
                options={productSatus}
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
  price_currency: "",
  id: "",
  ...ProductGalleryWithForm.initialValues,
};

const validationSchema = object({
  name: string().required("required"),
  description: string().required("required"),
  product_type_id: number().required("required"),
  product_category_id: number().required("required"),
  price_amount: number().required("required"),
}).concat(ProductGalleryWithForm.validationSchema);

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
