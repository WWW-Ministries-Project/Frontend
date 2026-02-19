import { useEffect } from "react";

import { usePost } from "@/CustomHooks/usePost";
import {
  CheckoutForm,
  type ICheckoutForm,
} from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { showNotification } from "@/pages/HomePage/utils";
import { api, decodeToken, ICartItem, relativePath } from "@/utils";
import { useLocation } from "react-router-dom";
import { useCartDetails } from "@/pages/HomePage/pages/MarketPlace/utils/useCartDetails";

export function CheckOutPage() {
  const { setBillinDetails } = useCart();
  const { postData, data, loading } = usePost(api.post.createOrder);
  const { items: cartItems, clearCart } = useCartDetails();

  const location = useLocation();
  const is_member = location.pathname.includes("member");

  const getGuestCheckoutItem = (): ICartItem | null => {
    try {
      const myCartString = localStorage.getItem("my_cart");
      if (!myCartString) return null;
      return JSON.parse(myCartString) as ICartItem;
    } catch {
      return null;
    }
  };

  const my_cart = getGuestCheckoutItem();
  const user = decodeToken();

  const checkoutItems: ICartItem[] = is_member
    ? cartItems
    : my_cart
    ? [my_cart]
    : [];

  const amount = checkoutItems.reduce((acc, item) => {
    return acc + Number(item.price_amount || 0) * Number(item.quantity || 0);
  }, 0);

  const url = is_member
    ? relativePath.member.verify_payment
    : "/out/verify-payment/out";

  const cancellation_url = is_member
    ? `${window.location.origin}/member/market/check-out`
    : `${window.location.origin}/out/products/check-out`;

  const handleCheckout = async (data: ICheckoutForm) => {
    if (checkoutItems.length === 0 || amount <= 0) {
      showNotification(
        "Your cart is empty or has invalid pricing.",
        "error"
      );
      return;
    }

    const { first_name, last_name } = data.personal_info;
    const { email, resident_country, phone } = data.contact_info;
    const normalizedItems = checkoutItems.map((item) => ({
      ...item,
      price_amount: Number(item.price_amount || 0),
      quantity: Number(item.quantity || 0),
    }));

    const checkout_data = {
      total_amount: `${amount.toFixed(2)}`,
      cancellation_url,
      return_url: `${window.location.origin}${url}`,
      billing: {
        first_name,
        last_name,
        country: resident_country,
        country_code: phone.country_code,
        email,
        phone_number: phone.number,
      },
      items: normalizedItems,
    };
    setBillinDetails(data);
    await postData(
      is_member ? { ...checkout_data, user_id: user?.id } : { ...checkout_data }
    );
  };

  useEffect(() => {
    if (data) {
      window.location.href = data.data.checkoutUrl;
      clearCart();
      localStorage.removeItem("my_cart");
    }
  }, [data, clearCart]);

  return (
    <>
      <CheckoutForm handleCheckout={handleCheckout} loading={loading} />
    </>
  );
}
