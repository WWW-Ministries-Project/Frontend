import { Button } from "@/components";
import emptyCartSvg from "@/assets/empty-cart.svg";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../utils/cartSlice";
export default function EmptyCartComponent() {
  const navigate = useNavigate();

  const { toggleCart } = useCart();
  const handleExploreItems = () => {
    toggleCart(false);
    navigate("/member/market");
  };
  return (
    <div className="space-y-2 text-[#474D66] flex flex-col items-center justify-center text-center">
      <img src={emptyCartSvg} alt="" />

      <h3 className="font-semibold">Your cart is empty</h3>
      <p className="text-sm">Continue shoping to explore more</p>

      <Button
        value="Explore items"
        variant="secondary"
        className="w-full"
        onClick={handleExploreItems}
      />
    </div>
  );
}
