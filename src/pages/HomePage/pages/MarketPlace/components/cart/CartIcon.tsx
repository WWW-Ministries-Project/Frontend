import { ShoppingCartIcon } from "@heroicons/react/24/outline";

import { useCart } from "../../utils/cartSlice";

export function CartIcon() {
  const openCartManually = useCart((s) => s.openCartManually);
  const cartCount = useCart((s) =>
    s.cartItems.reduce((a, i) => a + Math.max(1, Number(i.quantity) || 1), 0)
  );

  return (
    <button
      type="button"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
      onClick={() => openCartManually()}
      aria-label={cartCount > 0 ? `Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Open cart"}
    >
      <ShoppingCartIcon className="size-6" />
      {cartCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
}
