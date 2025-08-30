import { Field, FieldArray, FieldProps, Form, Formik, getIn } from "formik";
import { array, number, object, string } from "yup";
import { createPortal } from "react-dom";

import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { useCart } from "../../utils/cartSlice";
import { Button } from "@/components";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, TrashIcon } from "@heroicons/react/24/solid";
import { relativePath } from "@/utils";
import EmptyCartComponent from "./EmptyCartComponent";

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
        setCartItems(values.cartItems);
        navigate(relativePath.member.checkOut);
      }}
    >
      {({ values, handleSubmit }) => {
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
                        <tr key={item.product_id} className="border-t">
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

                          <td className="text-center px-4 py-2">
                            <TrashIcon
                              className="size-5 text-red-500 cursor-pointer"
                              onClick={() => remove(index)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FieldArray>
            {cartItems.length === 0 && (
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
                disabled={cartItems.length === 0}
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

// TODO: take this component outsite
interface IColorProps {
  colors: string[];
  id: string;
  name: string;
  onChange: (name: string, value: string) => void;
  value: string;
}

const ColorSelectField = ({
  colors,
  id,
  name,
  onChange,
  value,
}: IColorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (color: string) => {
    onChange(name, color);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative min-w-32 h-10 border rounded-lg">
      {/* Selected Color Display */}
      <div
        id={id}
        className="h-full w-full flex items-center justify-between cursor-pointer rounded-lg px-2"
        style={{ backgroundColor: value || "#fff" }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <p></p>
        {!value && <span className="text-sm text-gray-500">Select color</span>}
        <ChevronDownIcon
          className={`transition-transform size-4 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          color={value ? "#fff" : "#000"}
        />
      </div>

      {/* Dropdown */}

      {isOpen &&
        createPortal(
          <div
            className="absolute bg-white border rounded-lg shadow-lg p-2 flex flex-wrap gap-2 z-50"
            style={{
              top: dropdownRef.current
                ? dropdownRef.current.getBoundingClientRect().bottom +
                  window.scrollY
                : 0,
              left: dropdownRef.current
                ? dropdownRef.current.getBoundingClientRect().left +
                  window.scrollX
                : 0,
              width: dropdownRef.current?.offsetWidth || 0,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {colors.map((color) => (
              <div
                key={color}
                className="w-full h-8 rounded-sm cursor-pointer border border-gray-300"
                style={{ backgroundColor: color }}
                onClick={() => handleSelect(color)}
                title={color}
              />
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

interface FormikColorSelectProps extends FieldProps {
  colors: string[];
  id: string;
  name: string;
  onChange: () => void;
  value: string;
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
  };
}

export default function FormikColorSelect(props: FormikColorSelectProps) {
  return <ColorSelectField {...fieldToColorSelect(props)} />;
}

FormikColorSelect.displayName = "FormikColorSelect";
