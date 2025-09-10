import { Field, FieldArray, FieldProps, Form, Formik, getIn } from "formik";
import { array, number, object, string } from "yup";

import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { type CartSections, relativePath } from "@/utils";
import { TrashIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../utils/cartSlice";
import EmptyCartComponent from "./EmptyCartComponent";
import { ColorSelectField } from "@/pages/HomePage/Components/reusable/ColorSelectField";
import { useCartDetails } from "../../utils/useCartDetails";

export function CartTable() {
  const { setCartItems, updateSection, removeFromCart } = useCart();
  const { items: cartWithDetails } = useCartDetails();

  const initialValues = {
    cartItems: cartWithDetails,
  };

  const handleUpdateSection = (
    productId: string,
    section: CartSections,
    value: number | string
  ) => {
    updateSection(productId, section, value);
  };

  const navigate = useNavigate();
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        setCartItems(values.cartItems);
        navigate(relativePath.member.checkOut);
      }}
      enableReinitialize
    >
      {({ values, handleSubmit, setFieldValue }) => {
        const totalAmount = values.cartItems.reduce(
          (acc, item) => acc + item.price_amount * item.quantity,
          0
        );

        return (
          <Form className=" text-[#080808] bg-white">
            <FieldArray name="cartItems">
              {({ remove }) => (
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
                        <th> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.cartItems.map((item, index) => (
                        <tr key={item.item_uuid} className="border-t">
                          <td className="px-4 py-2">{item.name}</td>

                          {/* Type */}
                          <td className="px-4 py-2">{item.product_type}</td>

                          {/* Category */}
                          <td className="px-4 py-2">{item.product_category}</td>

                          <td className="px-4 py-2">
                            <Field
                              component={FormikColorSelect}
                              name={`cartItems[${index}].color`}
                              id={`cartItems[${index}].color`}
                              colors={item.productColors || []}
                              placeholder="Select color"
                              onChange={(_: string, value: string) => {
                                handleUpdateSection(
                                  item.item_uuid!,
                                  "color",
                                  value
                                );
                                setFieldValue(
                                  `cartItems[${index}].color`,
                                  value
                                );
                              }}
                              showAll={false}
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
                              onChange={(_: string, value: string) => {
                                handleUpdateSection(
                                  item.item_uuid!,
                                  "size",
                                  value
                                );
                                setFieldValue(
                                  `cartItems[${index}].size`,
                                  value
                                );
                              }}
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
                              onChange={(_: string, value: string) => {
                                handleUpdateSection(
                                  item.item_uuid!,
                                  "quantity",
                                  +value
                                );
                                setFieldValue(
                                  `cartItems[${index}].quantity`,
                                  value
                                );
                              }}
                            />
                          </td>

                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            {item.price_amount.toFixed(2)}
                          </td>

                          <td className="px-4 py-2 whitespace-nowrap text-center">
                            {(item.price_amount * item.quantity).toFixed(2)}
                          </td>

                          <td className="text-center px-4 py-2">
                            <TrashIcon
                              className="size-5 text-red-500 cursor-pointer"
                              onClick={() => {
                                remove(index);
                                removeFromCart(item.item_uuid!);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FieldArray>
            {values.cartItems.length === 0 && (
              <div className="w-full flex items-center justify-center mt-5">
                <div className="w-1/2 flex items-center justify-center">
                  <EmptyCartComponent />
                </div>
              </div>
            )}

            {/* Total Section */}
            <div className="flex justify-end mt-2 pt-4">
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
              <Button
                value="Proceed to Checkout"
                onClick={handleSubmit}
                disabled={values.cartItems.length === 0}
              />
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

interface FormikColorSelectProps extends FieldProps {
  colors: string[];
  id: string;
  name: string;
  onChange: () => void;
  value: string;
  placeholder: string;
}

function fieldToColorSelect({
  form: { touched, errors },
  field: { onChange: fieldOnChange, ...field },
  ...props
}: FormikColorSelectProps) {
  const fieldError = getIn(errors, field.name);
  const showError = getIn(touched, field.name) && fieldError;

  return {
    ...field,
    ...props,
    value: props.value || field.value,
    onChange:
      props.onChange ??
      ((name: string, value: string) =>
        fieldOnChange({ target: { name, value } })),
    error: showError,
    placeholder: props.placeholder,
  };
}

export default function FormikColorSelect(props: FormikColorSelectProps) {
  return <ColorSelectField {...fieldToColorSelect(props)} />;
}

FormikColorSelect.displayName = "FormikColorSelect";
