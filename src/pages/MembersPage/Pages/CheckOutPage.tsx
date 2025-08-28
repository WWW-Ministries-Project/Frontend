import { useEffect } from "react";

import { usePost } from "@/CustomHooks/usePost";
import {
  CheckoutForm,
  type ICheckoutForm,
} from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { api, decodeToken, relativePath } from "@/utils";

export function CheckOutPage() {
  const { getTotalPrice, cartItems } = useCart();
  const { postData, data, loading } = usePost(api.post.createOrder);

  const totalAmount = getTotalPrice();

  const my_cart_string = localStorage.getItem("my_cart");
  const my_cart = my_cart_string ? JSON.parse(my_cart_string) : null;
  const user = decodeToken();

  const amount = totalAmount
    ? totalAmount
    : my_cart?.price_amount * my_cart?.quantity;

  const url = user?.id
    ? relativePath.member.verify_payment
    : "/out/verify-payment/out";

  const cancellation_url = user?.id
    ? `${window.location.origin}/member/market`
    : `${window.location.origin}/out/products`;

  const handleCheckout = async(data: ICheckoutForm) => {
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
      items: cartItems?.length ? cartItems : [my_cart],
    };

    await postData(
      user?.id ? { ...checkout_data, user_id: user?.id } : { ...checkout_data }
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
