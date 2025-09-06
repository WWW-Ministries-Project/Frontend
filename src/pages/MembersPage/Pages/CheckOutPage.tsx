import { useEffect } from "react";

import { usePost } from "@/CustomHooks/usePost";
import {
  CheckoutForm,
  type ICheckoutForm,
} from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { api, decodeToken, relativePath } from "@/utils";
import { useLocation } from "react-router-dom";

export function CheckOutPage() {
  const { getTotalPrice, cartItems, setBillinDetails } = useCart();
  const { postData, data, loading } = usePost(api.post.createOrder);

  const totalAmount = getTotalPrice();
  const location = useLocation();
  const is_member = location.pathname.includes("member");

  const my_cart_string = localStorage.getItem("my_cart");
  const my_cart = my_cart_string ? JSON.parse(my_cart_string) : null;
  const user = decodeToken();

  const amount = is_member
    ? totalAmount
    : my_cart?.price_amount * my_cart?.quantity;

  const url = is_member
    ? relativePath.member.verify_payment
    : "/out/verify-payment/out";

  const cancellation_url = is_member
    ? `${window.location.origin}/member/market/check-out`
    : `${window.location.origin}/out/products/check-out`;

  const handleCheckout = async (data: ICheckoutForm) => {
    const { first_name, last_name } = data.personal_info;
    const { email, resident_country, phone } = data.contact_info;
    const checkout_data = {
      total_amount: `${amount}`,
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
      items: is_member ? cartItems : [my_cart],
    };
    setBillinDetails(data);
    await postData(
      is_member ? { ...checkout_data, user_id: user?.id } : { ...checkout_data }
    );
  };

  useEffect(() => {
    if (data) {
      window.location.href = data.data.checkoutUrl;
    }
  }, [data]);

  return (
    <>
      <CheckoutForm handleCheckout={handleCheckout} loading={loading} />
    </>
  );
}
