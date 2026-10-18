import { useNavigate } from "react-router-dom";

import { relativePath } from "@/utils";
import { useCart } from "../../utils/cartSlice";

/** Empty state inside the cart drawer. */
export default function EmptyCartComponent() {
  const navigate = useNavigate();
  const toggleCart = useCart((s) => s.toggleCart);

  const startShopping = () => {
    toggleCart(false);
    navigate(relativePath.member.market);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-primary">
      <p className="text-base font-semibold">Your cart is empty</p>
      <p className="text-sm text-primaryGray">Browse the markets and add something you love.</p>
      <button
        type="button"
        onClick={startShopping}
        className="mt-2 min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90"
      >
        Start shopping
      </button>
    </div>
  );
}
