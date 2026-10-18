import { useCallback } from "react";

import type { IProductTypeResponse } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";

import { useCart } from "../../utils/cartSlice";
import { buildCartItem, cartQuantityFor, colourSizes, variantStock } from "./storefrontModel";

/**
 * Adds a variant to the cart, capped at what's left after the units already
 * in the cart. Returns false when nothing could be added.
 */
export function useStorefrontAddToCart() {
  const cartItems = useCart((s) => s.cartItems);
  const addToCart = useCart((s) => s.addToCart);

  return useCallback(
    (product: IProductTypeResponse, colourIndex: number, size: string, quantity: number) => {
      const colour = product.product_colours?.[colourIndex];
      if (!colour) return false;
      const avail = variantStock(product, colour, size);
      const inCart = cartQuantityFor(cartItems, `${product.id}`, colour.colour, size);
      const room = avail - inCart;
      if (room <= 0) {
        showNotification("You already have all available stock in your cart", "error");
        return false;
      }
      addToCart(buildCartItem(product, colourIndex, size, Math.max(1, Math.min(quantity, room))));
      return true;
    },
    [cartItems, addToCart]
  );
}

/** Quick add from a product card: only valid for single-variant products. */
export function useQuickAdd() {
  const add = useStorefrontAddToCart();
  return useCallback(
    (product: IProductTypeResponse) => {
      const colour = product.product_colours?.[0];
      add(product, 0, colourSizes(colour)[0] || "", 1);
    },
    [add]
  );
}
