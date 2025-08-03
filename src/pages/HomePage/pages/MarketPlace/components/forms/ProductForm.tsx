import { Field, Form, Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { array, mixed, object, string } from "yup";

import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { FormLayout } from "@/components/ui";
import type { IProduct } from "@/utils/api/marketPlace/interface";
import { ProductGallery } from "./ProductGallery";
import { Actions } from "@/components/ui/form/Actions";

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
            <FormLayout>
              <Field
                name="product_name"
                component={FormikInputDiv}
                label="Product name *"
                id="product_name"
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

              <ProductGallery
                values={values}
                errors={errors}
                touched={touched}
                setFieldValue={setFieldValue}
              />

              <Field
                name="price"
                component={FormikInputDiv}
                label="Price"
                id="price"
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

const initialValues: Product = {
  product_name: "",
  description: "",
  status: "published",
  type: "",
  category: "",
  price: "",
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
