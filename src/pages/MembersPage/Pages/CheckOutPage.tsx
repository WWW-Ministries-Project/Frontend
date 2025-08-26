import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import {
  CheckoutForm,
  type ICheckoutForm,
} from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
import { PaystackPayment } from "@/pages/HomePage/pages/MarketPlace/components/payment/PaystackPayment";
import { showNotification } from "@/pages/HomePage/utils";
import { relativePath } from "@/utils";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { api } from "@/utils";
import { usePost } from "@/CustomHooks/usePost";
import { useFetch } from "@/CustomHooks/useFetch";

export function CheckOutPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<ICheckoutForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { getTotalPrice, clearCart, cartItems } = useCart();
  const { postData, data, loading } = usePost(api.post.createOrder);
  const {
    data: verifiedData,
    refetch,
    loading: isVerifying,
  } = useFetch(api.fetch.verifyPayment, {}, true);

  const handleCheckout = (data: ICheckoutForm) => {
    const { first_name, last_name } = data.personal_info;
    const { email, resident_country, phone, } =
      data.contact_info;
    // setCheckoutData(data);
    // setIsOpen(true);
    postData({
      user_id: "1",
      market_id: "1",
      total_amount: "100",
      billing: {
        first_name,
        last_name,
        country: resident_country,
        country_code: phone.country_code,
        email,
        phone_number: phone.number,
      },
      items: cartItems,
      reference: "txn_ref_1456793456",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleVerifyPayment = async (reference: string) => {
    refetch({ reference });
    // // TODO: handle verification logic at the backend
    // // TODO: should not use secret key in the frontend

    // try {
    //   setIsLoading(true);
    //   const response = await axios.get(
    //     `https://api.paystack.co/transaction/verify/${reference}`,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${process.env.REACT_APP_PAYSTACK_SECRETE_KEY}`,
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   );

    //   if (response.status === 200) {
    //     showNotification("Payment verified successfully", "success");
    //     clearCart();
    //     navigate(relativePath.member.market);
    //     setIsOpen(false);
    //   }

    //   setIsOpen(false);
    // } catch {
    //   showNotification("Error verifying payment. Please try again.", "error");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const totalAmount = getTotalPrice();

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate(relativePath.member.market);
    }
  }, [cartItems]);
  return (
    <>

      <CheckoutForm handleCheckout={handleCheckout} />
      <Modal open={isOpen} onClose={handleClose}>
        <div className="p-5">
          <h2 className="text-lg font-semibold mb-4">Checkout</h2>
          <p className="text-sm text-gray-600 mb-4">
            Please review your order details before proceeding to payment.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Ensure all information is correct to avoid any issues with your
            order.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4 flex justify-end gap-3 p-5">
          <Button value="Cancel" variant="secondary" onClick={handleClose} />
          {checkoutData?.payment_method === "paystack" && (
            <PaystackPayment
              closeModal={handleClose}
              handleVerifyPayment={handleVerifyPayment}
              isLoading={isVerifying}
              openModal={() => setIsOpen(true)}
              data={{
                email: checkoutData.contact_info.email,
                amount: totalAmount,
                currency: "GHS",
              }}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
