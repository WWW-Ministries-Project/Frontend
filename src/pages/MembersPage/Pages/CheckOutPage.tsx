import axios from "axios";
import { useState } from "react";
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

export function CheckOutPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<ICheckoutForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { getTotalPrice, clearCart } = useCart();

  const handleCheckout = (data: ICheckoutForm) => {
    setCheckoutData(data);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleVerifyPayment = async (reference: string) => {
    // TODO: handle verification logic at the backend
    // TODO: should not use secret key in the frontend

    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_PAYSTACK_SECRETE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        showNotification("Payment verified successfully", "success");
        clearCart();
        navigate(relativePath.member.market);
        setIsOpen(false);
      }

      setIsOpen(false);
    } catch {
      showNotification("Error verifying payment. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = getTotalPrice();
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
              isLoading={isLoading}
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
