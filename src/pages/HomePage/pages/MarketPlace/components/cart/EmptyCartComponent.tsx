import { useNavigate } from "react-router-dom";

import emptyCartSvg from "@/assets/empty-cart.svg";
import { Button } from "@/components";
import { useCart } from "../../utils/cartSlice";

export default function EmptyCartComponent() {
  const navigate = useNavigate();

  const { toggleCart } = useCart();
  const handleExploreItems = () => {
    toggleCart(false);
    navigate("/member/market");
  };
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-primary">
      <img src={emptyCartSvg} alt="" className="h-24 w-24" />
      <h3 className="font-semibold">Your cart is empty</h3>
      <p className="text-sm text-primaryGray">Continue shopping to explore more</p>
      <Button
        value="Explore items"
        variant="secondary"
        className="mt-2 w-full"
        onClick={handleExploreItems}
      />
    </div>
  );
}
