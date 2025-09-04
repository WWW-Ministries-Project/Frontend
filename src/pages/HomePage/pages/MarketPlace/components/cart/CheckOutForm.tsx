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
import { decodeToken, ICartItem } from "@/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../utils/cartSlice";
import { PaymentOptionsForm } from "./PaymentOptionsSubForm";

interface IProps {
  handleCheckout: (data: ICheckoutForm) => void;
  loading: boolean;
}
export function CheckoutForm(props: IProps) {
  const navigate = useNavigate();
  const user = decodeToken();
  const name = user?.name || "";
  const phone = user?.phone || "";
  const email = user?.email || "";
  const [first_name, other_name, last_name] = name.split(" ");

  const { billinDetails } = useCart();

  const initialValues: ICheckoutForm = billinDetails || {
    personal_info: {
      first_name: first_name || "",
      other_name: other_name || "",
      last_name: last_name || "",
    },
    contact_info: {
      ...ContactsSubForm.initialValues,
      email: email || "",
      phone: {
        ...ContactsSubForm.initialValues.phone,
        number: phone || "",
      },
    },
    payment_method: "paystack",
  };

  return (
    <div className="text-[#474D66] bg-white rounded-lg ">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, isValid) => {
          if (isValid) {
            props.handleCheckout(values);
          }
        }}
      >
        {({ handleSubmit, values }) => (
          <Form className="w-full mx-auto rounded-lg flex items-start gap-5 flex-col lg:flex-row p-3">
            <div className="border rounded-lg p-5 w-full">
              <p className="font-bold mb-5 text-xl">Billing Details</p>
              <FormLayout>
                <NameInfo prefix="personal_info" />
                <ContactsSubForm prefix="contact_info" />
              </FormLayout>
            </div>
            <div className="w-full lg:w-1/2  space-y-5">
              <OrderSummary />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  value="Cancel"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                />
                <Button
                  value="Place Order"
                  onClick={handleSubmit}
                  loading={props.loading}
                  disabled={props.loading}
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export interface ICheckoutForm {
  contact_info: IContactsSubForm;
  personal_info: INameInfo;
  payment_method: "hubtel" | "paystack";
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

  const totalPrice = getTotalPrice();
  const my_cart_string = localStorage.getItem("my_cart");
  const my_cart = my_cart_string ? JSON.parse(my_cart_string) : null;

  const location = useLocation();
  const is_member = location.pathname.includes("member");

  const amount = (
    is_member ? totalPrice : my_cart?.price_amount * my_cart?.quantity
  ).toFixed(2);

  return (
    <div className="w-full h-fit border rounded-lg p-4 space-y-2">
      <p className="font-bold text-xl">Order</p>
      <div className="flex justify-between">
        <p className="font-bold">Product</p>
        <p className="font-bold">Subtotal</p>
      </div>
      <div className="w-full space-y-2">
        {is_member
          ? cartItems.map((item) => (
              <ItemCard key={item.product_id} item={item} />
            ))
          : my_cart && <ItemCard item={my_cart} />}
      </div>

      <div className="flex justify-between">
        <p className="font-bold">Total</p>
        <p className="font-bold">GHC {amount}</p>
      </div>
    </div>
  );
};

interface ICardProp {
  item: ICartItem;
}
const ItemCard = ({ item }: ICardProp) => {
  const getProductTotalAmount = useCallback(() => {
    return (item.price_amount * item.quantity).toFixed(2);
  }, []);

  return (
    <div className="w-full flex justify-between items-center gap-2 font-medium">
      <p className="flex items-center gap-2">
        {item.name} <span>x</span>
        <span>{item.quantity}</span>
      </p>

      <p>GHC {getProductTotalAmount()}</p>
    </div>
  );
};
