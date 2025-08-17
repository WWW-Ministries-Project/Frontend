import { Form, Formik } from "formik";
import { useCallback } from "react";
import { object } from "yup";

import { Button } from "@/components";
import {
  ContactsSubForm,
  IContactsSubForm,
  INameInfo,
  NameInfo,
} from "@/components/subform";
import { FormLayout } from "@/components/ui";
import { useCart } from "../../utils/cartSlice";
import { PaymentOptionsForm } from "./PaymentOptionsSubForm";
import { useNavigate } from "react-router-dom";
import { decodeToken } from "@/utils";

export function CheckoutForm() {
  const navigate = useNavigate();
  const { name, phone, email } = decodeToken();
  const [first_name, other_name, last_name] = name.split(" ");

  const initialValues: ICheckoutForm = {
    personal_info: {
      first_name,
      other_name: other_name || "",
      last_name,
    },
    contact_info: {
      ...ContactsSubForm.initialValues,
      email: email || "",
      phone: {
        ...ContactsSubForm.initialValues.phone,
        number: phone || "",
      },
    },
    payment_method: "hubtel",
  };

  return (
    <div className="text-[#474D66] ">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {({ handleSubmit, values }) => (
          <Form className="w-full mx-auto rounded-lg flex items-start gap-5 flex-col lg:flex-row">
            <div className="border rounded-lg p-5 w-full">
              <p className="font-bold mb-5">Billing Details</p>
              <FormLayout>
                <NameInfo prefix="personal_info" />
                <ContactsSubForm prefix="contact_info" />
              </FormLayout>
            </div>
            <div className="w-full space-y-5 ">
              <OrderSummary />
              <PaymentOptionsForm />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  value="Cancel"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                />
                <Button value="Place Order" onClick={handleSubmit} />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

interface ICheckoutForm {
  contact_info: IContactsSubForm;
  personal_info: INameInfo;
  payment_method: string;
}

const validationSchema = object({
  personal_info: object().shape({
    ...NameInfo.validationSchema,
  }),
  contact_info: object().shape({
    ...ContactsSubForm.validationSchema,
  }),
  ...PaymentOptionsForm.validationSchema,
});

const OrderSummary = () => {
  const { cartItems, getTotalPrice } = useCart();

  const getProductTotalAmount = useCallback(
    (price: number, quantity: number) => {
      return (price * quantity).toFixed(2);
    },
    []
  );

  const totalPrice = getTotalPrice().toFixed(2);

  return (
    <div className="w-full h-fit border rounded-lg p-4 space-y-2">
      <p className="font-bold">Order</p>
      <div className="flex justify-between">
        <p className="font-bold">Product</p>
        <p className="font-bold">Subtotal</p>
      </div>
      <div className="w-full space-y-2">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="w-full flex justify-between items-center gap-2"
          >
            <p>{item.name}</p>
            <p>GHC {getProductTotalAmount(item.price_amount, item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <p className="font-bold">Total</p>
        <p className="font-bold">GHC {totalPrice}</p>
      </div>
    </div>
  );
};
