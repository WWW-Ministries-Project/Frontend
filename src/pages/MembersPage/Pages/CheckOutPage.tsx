import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { usePost } from "@/CustomHooks/usePost";
import {
  CheckoutForm,
  type ICheckoutDefaults,
  type ICheckoutForm,
} from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { useCartDetails } from "@/pages/HomePage/pages/MarketPlace/utils/useCartDetails";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { useDeliveryConfig } from "@/pages/MembersPage/components/orders/useDeliveryConfig";
import { useUserStore } from "@/store/userStore";
import { api, decodeToken, relativePath, type ICartItem, type ICheckOut } from "@/utils";

const getGuestCheckoutItem = (): ICartItem | null => {
  try {
    const myCartString = localStorage.getItem("my_cart");
    if (!myCartString) return null;
    return JSON.parse(myCartString) as ICartItem;
  } catch {
    return null;
  }
};

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", last: parts.length > 1 ? parts[parts.length - 1] : "" };
};

export function CheckOutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const is_member = location.pathname.includes("member");

  const { setBillinDetails } = useCart();
  const { postData, data, error, loading } = usePost(api.post.createOrder);
  const { items: cartItems } = useCartDetails();
  const delivery = useDeliveryConfig();
  const storeUser = useUserStore();
  const [redirecting, setRedirecting] = useState(false);
  const [serverError, setServerError] = useState("");

  const [guestItem] = useState(getGuestCheckoutItem);
  const checkoutItems: ICartItem[] = useMemo(
    () => (is_member ? cartItems : guestItem ? [guestItem] : []),
    [cartItems, guestItem, is_member]
  );

  const subtotal = checkoutItems.reduce(
    (acc, item) => acc + Number(item.price_amount || 0) * Number(item.quantity || 0),
    0
  );

  const tokenUser = decodeToken();
  const defaults: ICheckoutDefaults = useMemo(() => {
    const { first, last } = splitName(storeUser.name || tokenUser?.name || "");
    return {
      first_name: first,
      last_name: last,
      email: storeUser.email || tokenUser?.email || "",
      phone: storeUser.phone || tokenUser?.phone || "",
    };
  }, [storeUser.name, storeUser.email, storeUser.phone, tokenUser?.name, tokenUser?.email, tokenUser?.phone]);

  const shopPath = is_member ? relativePath.member.market : "/out/products";
  const returnPath = is_member ? relativePath.member.verify_payment : "/out/verify-payment/out";
  const cancellation_url = is_member
    ? `${window.location.origin}${relativePath.member.orders}`
    : `${window.location.origin}/out/products/check-out`;

  const handleCheckout = async (values: ICheckoutForm) => {
    setServerError("");
    if (checkoutItems.length === 0 || subtotal <= 0) {
      setServerError("Your cart is empty or has invalid pricing.");
      return;
    }

    const method =
      values.fulfilment_method === "delivery" && delivery.deliveryEnabled
        ? "delivery"
        : "pickup";
    const fee = method === "delivery" ? delivery.deliveryFee : 0;
    const { first_name, last_name } = values.personal_info;
    const { email, phone } = values.contact_info;
    const country =
      values.contact_info.resident_country ||
      useCountryStore.getState().dialOptions.find((c) => c.dialCode === phone.country_code)
        ?.name ||
      "Ghana";

    const payload: ICheckOut = {
      total_amount: (subtotal + fee).toFixed(2),
      cancellation_url,
      return_url: `${window.location.origin}${returnPath}`,
      // Backend reads `payment_type` (not `payment_method`) to pick the gateway.
      payment_type: values.payment_method,
      billing: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        country,
        country_code: phone.country_code,
        email: email.trim(),
        phone_number: phone.number,
      },
      items: checkoutItems.map((item) => ({
        ...item,
        price_amount: Number(item.price_amount || 0),
        quantity: Number(item.quantity || 0),
      })),
      fulfilment_method: method,
      ...(method === "delivery"
        ? {
            delivery_address: [values.delivery_address, values.delivery_city]
              .map((part) => (part || "").trim())
              .filter(Boolean)
              .join(", "),
          }
        : {}),
    };

    setBillinDetails({ ...values, fulfilment_method: method });
    const tokenId = decodeToken()?.id;
    await postData(is_member && tokenId ? { ...payload, user_id: String(tokenId) } : payload);
  };

  useEffect(() => {
    const checkoutUrl = data?.data?.checkoutUrl;
    if (!checkoutUrl) return;
    setRedirecting(true);
    // The cart is cleared on VerifyPayment once payment succeeds, so an
    // abandoned or failed gateway session leaves it intact.
    window.location.href = checkoutUrl;
  }, [data]);

  useEffect(() => {
    if (error) setServerError(error.message || "We couldn't start your payment. Please try again.");
  }, [error]);

  const paying = loading || redirecting;

  return (
    <div className={`flex w-full flex-col gap-6 text-primary ${is_member ? "" : "mx-auto max-w-7xl px-4 py-6"}`}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate(shopPath)}
          className="self-start text-sm text-primaryGray hover:text-primary"
        >
          ← Continue shopping
        </button>
        <h1 className="text-2xl font-semibold leading-8">Checkout</h1>
      </div>

      {checkoutItems.length === 0 && !redirecting ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-lightGray bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">Your cart is empty</h2>
          <p className="text-primaryGray">Add something from the marketplace to check out.</p>
          <button
            type="button"
            onClick={() => navigate(shopPath)}
            className="mt-2 min-h-10 rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Browse products
          </button>
        </div>
      ) : (
        <CheckoutForm
          items={checkoutItems}
          subtotal={subtotal}
          defaults={defaults}
          delivery={{
            enabled: delivery.deliveryEnabled,
            fee: delivery.deliveryFee,
            pickupLocation: delivery.pickupLocation,
          }}
          loading={paying}
          serverError={serverError}
          handleCheckout={handleCheckout}
        />
      )}

      {paying && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[400] flex flex-col items-center justify-center gap-3 bg-white/90 p-6 text-center"
        >
          <p className="text-lg font-semibold text-primary">Redirecting to Hubtel…</p>
          <p className="text-primaryGray">
            Complete payment in the secure window. Don’t close this page.
          </p>
        </div>
      )}
    </div>
  );
}
