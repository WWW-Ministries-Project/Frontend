import { ShoppingCartIcon } from "@heroicons/react/24/outline";

import { useCart } from "../../utils/cartSlice";

export function CartIcon() {
  const { cartOpen, toggleCart, getTotalItems } = useCart();

  const cartCount = getTotalItems();

  return (
    <div className="relative cursor-pointer" onClick={() => toggleCart(true)}>
      <ShoppingCartIcon className="size-7" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
          {cartCount}
        </span>
      )}
    </div>
  );
}
