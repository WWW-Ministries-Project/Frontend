import { ShoppingCartIcon } from "@heroicons/react/24/outline";

import { useCart } from "../../utils/cartSlice";

export function CartIcon() {
  const { toggleCart, getTotalItems } = useCart();

  const cartCount = getTotalItems();

  return (
    <button
      type="button"
      className="relative"
      onClick={() => toggleCart(true)}
      aria-label={cartCount > 0 ? `Open cart, ${cartCount} items` : "Open cart"}
    >
      <ShoppingCartIcon className="size-7" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
          {cartCount}
        </span>
      )}
    </button>
  );
}
