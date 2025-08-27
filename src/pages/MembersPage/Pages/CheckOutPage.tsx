import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { usePost } from "@/CustomHooks/usePost";
import {
  CheckoutForm,
  type ICheckoutForm,
} from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { api, decodeToken, relativePath } from "@/utils";

export function CheckOutPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const navigate = useNavigate();
  const { getTotalPrice, clearCart, cartItems } = useCart();
  const { postData, data, loading } = usePost(api.post.createOrder);

  const totalAmount = getTotalPrice();

  const my_cart_string = localStorage.getItem("my_cart");
  const my_cart = my_cart_string ? JSON.parse(my_cart_string) : null;
  const user = decodeToken();

  const amount = totalAmount
    ? totalAmount
    : my_cart?.price_amount * my_cart?.quantity;
  const location = useLocation();


  const handleCheckout = (data: ICheckoutForm) => {
    const { first_name, last_name } = data.personal_info;
    const { email, resident_country, phone } = data.contact_info;
    const checkout_data = {
      total_amount: `${amount}`,
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

    postData(
      user?.id ? { ...checkout_data, user_id: user?.id } : { ...checkout_data }
    );
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (data) {
      setIsOpen(true);
      setCheckoutUrl(data.data.checkoutUrl);
    }
  }, [data]);



  return (
    <>
      <CheckoutForm handleCheckout={handleCheckout} loading={loading} />
      <Modal open={isOpen} onClose={handleClose}>
        <div className="overflow-hidden">
          <iframe
            src={checkoutUrl}
            width="100%"
            height={600}
            className="overflow-hidden"
          ></iframe>
        </div>
      </Modal>
    </>
  );
}
