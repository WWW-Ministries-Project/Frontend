import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import ImageUpload from "@/components/ImageUpload";
import { FormLayout } from "@/components/ui";
import { IProduct } from "@/utils/api/marketPlace/interface";
import { Field, FieldArray, Form, Formik } from "formik";
import { object, string, number } from "yup";

export function ProductForm() {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        const colors = values.variants.map((v) => v.color);
        const images = values.variants.map((v) => v.image);
        console.log({ ...values, colors, images });
      }}
    >
      {({ values, setFieldValue }) => (
        <Form className="px-5">
          <FormLayout>
            <Field
              name="title"
              component={FormikInputDiv}
              label="Product name *"
              id="title"
              placeholder="Enter Product Name"
              className="col-span-2 w-1/2"
            />

            <Field
              name="name"
              component={FormikInputDiv}
              label="Market name *"
              id="name"
              placeholder="Enter Market Name"
              type="textarea"
              className="col-span-2"
            />

            <Field
              name="type"
              component={FormikSelectField}
              options={[]}
              label="Product type"
              id="type"
              placeholder="Select Type"
            />

            <Field
              name="category"
              component={FormikSelectField}
              options={[]}
              label="Product category"
              id="category"
              placeholder="Select Category"
            />

            {/* Variants Section */}
            <FieldArray name="variants">
              {({ push, remove }) => (
                <>
                  <div className="w-full col-span-2 flex flex-wrap gap-4">
                    {values.variants.map((variant, index) => (
                      <div key={index} className="w-[250px] space-y-2">
                        <Field
                          name={`variants[${index}].color`}
                          component={FormikInputDiv}
                          id={`color-${index}`}
                          //   type="color"
                          className="w-32"
                        />
                        <ImageUpload
                          onChange={(url: string) =>
                            setFieldValue(`variants[${index}].image`, url)
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end col-span-2">
                    <Button
                      value="+ Add another one"
                      onClick={() =>
                        push({
                          color: "#000000",
                          image: "",
                        })
                      }
                    />
                  </div>
                </>
              )}
            </FieldArray>
          </FormLayout>
        </Form>
      )}
    </Formik>
  );
}

interface Product extends IProduct {
  variants: {
    color: string;
    image: string;
  }[];
  sizes: string[];
}

const initialValues: Product = {
  title: "",
  imageUrl: "",
  status: "published",
  type: "",
  category: "",
  price: 0,
  stock: 0,
  sizes: [],
  variants: [
    {
      color: "#000000",
      image: "",
    },

    {
      color: "#000000",
      image: "",
    },

    {
      color: "#000000",
      image: "",
    },
  ],
  id: "",
};

const validationSchema = object().shape({
  title: string().required("Product name is required"),
  description: string().required("Description is required"),
  category: string().required("Category is required"),
  price: number().required("Price is required"),
  stock: number().required("Stock is required"),
});
