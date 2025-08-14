import { CartTable } from "@/pages/HomePage/pages/MarketPlace/components/cart/CartTable";
import { MarketLayout } from "../layouts/MarketLayout";

export function ViewCart() {
  return (
    <div>
      <MarketLayout title="My Cart">
       <div className="w-full max-w-6xl mx-auto bg-white p-4 rounded-lg">
         <CartTable />
       </div>
      </MarketLayout>
    </div>
  );
}
