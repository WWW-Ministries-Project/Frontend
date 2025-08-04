import { Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { array, mixed, number, object, string } from "yup";

import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout } from "@/components/ui";
import type { IProduct, ProductType } from "@/utils/api/marketPlace/interface";
import { ProductGallery } from "./ProductGallery";
import { Actions } from "@/components/ui/form/Actions";

interface IProps {
  addProduct: (product: ProductType) => void;
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

              <ProductGallery
                values={values}
                errors={errors}
                touched={touched}
                setFieldValue={setFieldValue}
              />

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
              loading={isSubmitting}
              onCancel={() => navigate(-1)}
              onSubmit={handleSubmit}
            />
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

const initialValues: ProductType = {
  name: "",
  description: "",
  status: "published",
  product_type_id: 0,
  product_category_id: 0,
  price_amount: 0,
  price_currency: "",
  market_id: 0,
  stock_managed: "yes",
  id: "",
  product_colours: [
    {
      colour: "#000000",
      image_url: "",
      stock: [{ size: "", stock: 0 }],
    },
  ],
};

const validationSchema = object().shape({
  name: string().required("required"),
  description: string().required("required"),
  product_type_id: number().required("required"),
  product_category_id: string().required("required"),
  price_amount: string().required("required"),
  manage_stock: string().oneOf(["yes", "no"]),

  gallery: array().of(
    object({
      colour: string(),
      image: mixed().required("Required"),
      stock: array().of(
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
