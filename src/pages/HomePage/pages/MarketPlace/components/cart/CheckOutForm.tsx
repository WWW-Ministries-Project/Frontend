import { Form, Formik, FormikProps } from "formik";
import { useCallback, useRef } from "react";
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
import HubtelLogo from "@/assets/hubtel-logo.jpg";

export function CheckoutForm() {
  const formikRef = useRef<FormikProps<ICheckoutForm>>(null);

  const handlePlaceOrder = () => {
    if (formikRef.current) {
      formikRef.current.submitForm();
    }
  };

  return (
    <div className="text-[#474D66] flex gap-5 flex-col lg:flex-row">
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values) => {}}
      >
        {() => (
          <Form className="space-y-6 w-full max-w-6xl mx-auto rounded-lg ">
            <div className="border rounded-lg p-5">
              <p className="font-semibold mb-5">Billing details</p>
              <FormLayout>
                <NameInfo prefix="personal_info" />
                <ContactsSubForm prefix="contact_info" />
              </FormLayout>
            </div>
          </Form>
        )}
      </Formik>
      <div className="w-full space-y-5">
        <OrderSummary />
        <PaymentMethod />
        <div className="flex items-center gap-2 justify-end">
          <Button value="Cancel" variant="secondary" />
          <Button value="Place Order" onClick={handlePlaceOrder} />
        </div>
      </div>
    </div>
  );
}

interface ICheckoutForm {
  contact_info: IContactsSubForm;
  personal_info: INameInfo;
}

const initialValues: ICheckoutForm = {
  contact_info: ContactsSubForm.initialValues,
  personal_info: NameInfo.initialValues,
};

const validationSchema = object({
  personal_info: object().shape({
    ...NameInfo.validationSchema,
  }),
  contact_info: object().shape({
    ...ContactsSubForm.validationSchema,
  }),
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

const PaymentMethod = () => {
  return (
    <div className="w-full h-fit border rounded-lg p-4 space-y-2">
      <p>Payment</p>
      <img
        src={HubtelLogo}
        alt="hubtel-image"
        className="size-20 border rounded-lg shadow-md cursor-pointer"
      />
    </div>
  );
};
