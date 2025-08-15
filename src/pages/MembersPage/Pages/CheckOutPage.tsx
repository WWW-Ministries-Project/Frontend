import { MarketLayout } from "../layouts/MarketLayout";
import { CheckoutForm } from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";

export function CheckOutPage() {
  return (
    <MarketLayout>
      <div className="w-full max-w-6xl mx-auto bg-white p-4 rounded-lg">
        <CheckoutForm />
      </div>
    </MarketLayout>
  );
}
