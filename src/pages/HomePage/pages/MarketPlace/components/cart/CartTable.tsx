import { Field, FieldArray, Form, Formik } from "formik";
import { array, number, object, string } from "yup";

import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { useCart } from "../../utils/cartSlice";
import { Button } from "@/components";
import { useNavigate } from "react-router-dom";

export function CartTable() {
  const { cartItems, setCartItems } = useCart();
  const initialValues = {
    cartItems,
  };

  const navigate = useNavigate();
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        console.log("Form submitted:", values);
        setCartItems(values.cartItems);
        // navigate("/checkout");
      }}
    >
      {({ values, handleSubmit }) => {
        const totalAmount = values.cartItems.reduce(
          (acc, item) => acc + item.price_amount * item.quantity,
          0
        );

        return (
          <Form className=" text-[#080808] bg-white p-4">
            <FieldArray name="cartItems">
              {() => (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left whitespace-nowrap">
                          Product name
                        </th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Color</th>
                        <th className="px-4 py-2">Size</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2 whitespace-nowrap">
                          Price (GHC){" "}
                        </th>
                        <th className="px-4 py-2 whitespace-nowrap">
                          Total (GHC)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.cartItems.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-2">{item.name}</td>

                          {/* Type */}
                          <td className="px-4 py-2">{item.product_type}</td>

                          {/* Category */}
                          <td className="px-4 py-2">{item.product_category}</td>

                          {/* TODO: create custom color select component */}
                          <td className="px-4 py-2">
                            <Field
                              component={FormikSelectField}
                              name={`cartItems[${index}].color`}
                              id={`cartItems[${index}].color`}
                              options={
                                item?.productColors?.map((color) => ({
                                  value: color,
                                  label: color,
                                })) || []
                              }
                              placeholder="Select color"
                            />
                          </td>

                          <td className="px-4 py-2">
                            <Field
                              component={FormikSelectField}
                              name={`cartItems[${index}].size`}
                              id={`cartItems[${index}].size`}
                              options={
                                item.productSizes?.map((size) => ({
                                  value: size,
                                  label: size,
                                })) || []
                              }
                              placeholder="Select size"
                            />
                          </td>

                          <td className="px-4 py-2">
                            <Field
                              component={FormikInputDiv}
                              type="number"
                              name={`cartItems[${index}].quantity`}
                              id={`cartItems[${index}].quantity`}
                              className="w-16"
                              min="1"
                              placeholder="Quantity"
                            />
                          </td>

                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            {item.price_amount.toFixed(2)}
                          </td>

                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            {(item.price_amount * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FieldArray>

            {/* Total Section */}
            <div className="flex justify-end mt-4 pt-4">
              <div className="w-64 flex justify-between border rounded-lg p-5">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">
                  GHC {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="flex justify-end mt-4 gap-2">
              <Button
                value="Back"
                onClick={() => navigate(-1)}
                variant="secondary"
              />
              <Button value="Proceed to Checkout" onClick={handleSubmit} />
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}

const validationSchema = object({
  cartItems: array().of(
    object().shape({
      color: string().required("Required"),
      size: string().required("Required"),
      quantity: number().min(1, "Must be at least 1").required("Required"),
    })
  ),
});
