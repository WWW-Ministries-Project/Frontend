import { Form, Formik } from "formik";
import { useCallback, useMemo, useState } from "react";
import { object } from "yup";

import { MinusIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { Modal } from "@/components/Modal";
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
import { useCartDetails } from "../../utils/useCartDetails";

interface IProps {
  handleCheckout: (data: ICheckoutForm) => void;
  loading: boolean;
}

const getGuestCheckoutItem = (): ICartItem | null => {
  try {
    const myCartString = localStorage.getItem("my_cart");
    if (!myCartString) return null;
    return JSON.parse(myCartString) as ICartItem;
  } catch {
    return null;
  }
};

export function CheckoutForm(props: IProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const is_member = location.pathname.includes("member");
  const user = decodeToken();
  const name = user?.name || "";
  const phone = user?.phone || "";
  const email = user?.email || "";
  const [first_name, other_name, last_name] = name.split(" ");

  const { billinDetails, updateSection, removeFromCart } = useCart();
  const { items: cartWithDetails, totalPrice } = useCartDetails();
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [pendingCheckoutData, setPendingCheckoutData] =
    useState<ICheckoutForm | null>(null);
  const [orderAcknowledged, setOrderAcknowledged] = useState(false);

  const closeOrderConfirmation = useCallback(() => {
    setPendingCheckoutData(null);
    setShowOrderConfirmation(false);
    setOrderAcknowledged(false);
  }, []);

  const my_cart = getGuestCheckoutItem();

  const checkoutItems = useMemo<ICartItem[]>(() => {
    if (is_member) {
      return cartWithDetails;
    }

    return my_cart ? [my_cart] : [];
  }, [cartWithDetails, is_member, my_cart]);

  const totalQuantity = useMemo(() => {
    return checkoutItems.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  }, [checkoutItems]);

  const checkoutTotalPrice = useMemo(() => {
    if (is_member) return Number(totalPrice || 0);
    return checkoutItems.reduce(
      (acc, item) => acc + Number(item.price_amount || 0) * Number(item.quantity || 0),
      0
    );
  }, [checkoutItems, is_member, totalPrice]);

  const initialValues: ICheckoutForm = {
    ...(billinDetails || {
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
    }),
    // Paystack is temporarily disabled - Hubtel is the only available
    // payment method, so it's forced here regardless of any stale
    // persisted billing details from an earlier session.
    payment_method: "hubtel",
  };

  return (
    <div className="text-[#474D66] bg-white rounded-lg ">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          setPendingCheckoutData(values);
          setOrderAcknowledged(false);
          setShowOrderConfirmation(true);
        }}
      >
        {({ handleSubmit }) => (
          <Form className="w-full mx-auto rounded-lg flex items-start gap-5 flex-col lg:flex-row p-3">
            <div className="border rounded-lg p-5 w-full">
              <p className="font-bold mb-5 text-xl">Billing Details</p>
              <FormLayout>
                <NameInfo prefix="personal_info" />
                <ContactsSubForm prefix="contact_info" />
              </FormLayout>
            </div>
            <div className="w-full lg:w-1/2 space-y-5">
              <OrderSummary
                items={checkoutItems}
                totalAmount={checkoutTotalPrice}
                editable={is_member}
                onQuantityChange={(item, quantity) =>
                  updateSection(item.item_uuid!, "quantity", quantity)
                }
                onRemove={(item) => removeFromCart(item.item_uuid!)}
              />
              <PaymentOptionsForm />
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
                  disabled={props.loading || checkoutItems.length === 0}
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>
      <Modal
        open={showOrderConfirmation}
        persist={false}
        onClose={closeOrderConfirmation}
        className="max-w-2xl"
      >
        <div className="p-6 space-y-5 text-[#474D66]">
          <h3 className="text-xl font-bold">Confirm Order</h3>

          <div className="max-h-[45vh] overflow-y-auto space-y-3">
            {checkoutItems.map((item, index) => (
              <div
                key={`${item.item_uuid || item.product_id || index}`}
                className="rounded-lg border p-3 flex items-start gap-3"
              >
                <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 border">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-base">{item.name}</p>
                  <p>
                    <span className="font-medium">Color:</span>{" "}
                    {item.color ? (
                      <span className="inline-flex items-center gap-2 align-middle">
                        <span
                          className="inline-block h-4 w-6 rounded border border-gray-300"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.color}</span>
                      </span>
                    ) : (
                      "-"
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Size:</span> {item.size || "-"}
                  </p>
                  <p>
                    <span className="font-medium">Quantity:</span> {item.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Price:</span> GHC{" "}
                    {Number(item.price_amount || 0).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Subtotal:</span> GHC{" "}
                    {(Number(item.price_amount || 0) * Number(item.quantity || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4 space-y-1 text-sm">
            <p className="flex items-center justify-between">
              <span className="font-medium">Total Quantity</span>
              <span>{totalQuantity}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="font-medium">Total Price</span>
              <span>GHC {checkoutTotalPrice.toFixed(2)}</span>
            </p>
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
            <p className="font-bold">⚠️ Please Review Your Order Carefully</p>
            <label
              htmlFor="order-acknowledgement"
              className="flex items-start gap-3 text-sm cursor-pointer"
            >
              <input
                id="order-acknowledgement"
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer"
                checked={orderAcknowledged}
                onChange={(e) => setOrderAcknowledged(e.target.checked)}
              />
              <span>
                I have carefully reviewed my order and confirm that all items,
                colours, sizes, and quantities are correct. I understand that my
                order will be processed exactly as submitted, and the PA Apparel
                Team will not be held responsible for any incorrect selections
                made by me.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              value="Cancel"
              variant="secondary"
              onClick={closeOrderConfirmation}
            />
            <Button
              value="Confirm"
              loading={props.loading}
              disabled={
                props.loading ||
                checkoutItems.length === 0 ||
                !orderAcknowledged
              }
              onClick={() => {
                if (!pendingCheckoutData || !orderAcknowledged) return;
                props.handleCheckout(pendingCheckoutData);
                closeOrderConfirmation();
              }}
            />
          </div>
        </div>
      </Modal>
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

const OrderSummary = ({
  items,
  totalAmount,
  editable = false,
  onQuantityChange,
  onRemove,
}: {
  items: ICartItem[];
  totalAmount: number;
  editable?: boolean;
  onQuantityChange?: (item: ICartItem, quantity: number) => void;
  onRemove?: (item: ICartItem) => void;
}) => {
  const amount = Number(totalAmount || 0).toFixed(2);

  return (
    <div className="w-full h-fit border rounded-lg p-4 space-y-2">
      <p className="font-bold text-xl">Order</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="flex justify-between">
            <p className="font-bold">Product</p>
            <p className="font-bold">Subtotal</p>
          </div>
          <div className="w-full space-y-2">
            {items.map((item, index) => (
              <ItemCard
                key={`${item.item_uuid || item.product_id || "item"}-${index}`}
                item={item}
                editable={editable}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex justify-between">
        <p className="font-bold">Total</p>
        <p className="font-bold">GHC {amount}</p>
      </div>
    </div>
  );
};

interface ICardProp {
  item: ICartItem;
  editable?: boolean;
  onQuantityChange?: (item: ICartItem, quantity: number) => void;
  onRemove?: (item: ICartItem) => void;
}
const ItemCard = ({ item, editable, onQuantityChange, onRemove }: ICardProp) => {
  const getProductTotalAmount = useCallback(() => {
    return (item.price_amount * item.quantity).toFixed(2);
  }, [item]);

  const stockCap = item.stock ?? Infinity;

  return (
    <div className="w-full flex justify-between items-center gap-2 font-medium">
      <div className="flex items-center gap-2">
        <p>{item.name}</p>
        {editable ? (
          <div className="flex items-center gap-1 rounded border border-gray-300 bg-gray-50">
            <button
              type="button"
              className="p-1 disabled:opacity-40"
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange?.(item, Math.max(1, item.quantity - 1))}
            >
              <MinusIcon className="size-3" />
            </button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="p-1 disabled:opacity-40"
              disabled={item.quantity >= stockCap}
              onClick={() =>
                onQuantityChange?.(item, Math.min(stockCap, item.quantity + 1))
              }
            >
              <PlusIcon className="size-3" />
            </button>
          </div>
        ) : (
          <>
            <span>x</span>
            <span>{item.quantity}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p>GHC {getProductTotalAmount()}</p>
        {editable && (
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove?.(item)}
            className="text-gray-400 hover:text-red-600"
          >
            <XMarkIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};
