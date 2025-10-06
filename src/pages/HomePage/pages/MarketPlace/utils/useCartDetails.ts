// hooks/useCartDetails.ts

import { useStore } from "@/store/useStore";
import { useCart } from "./cartSlice";

export const useCartDetails = () => {
  const { cartItems, addToCart, removeFromCart, clearCart,  } = useCart();
  const { products } = useStore();

  // join cart with product details
  const cartWithDetails = cartItems.map((item) => {
    const product = products.find(
      (p) => String(p.id) === String(item.product_id)
    );
    return {
      ...item,
      price_amount: product ? +product.price_amount : 0,
      lineTotal: product ? +product.price_amount * item.quantity : 0,
    };
  });

  // grand total
  const totalPrice = cartWithDetails.reduce(
    (acc, item) => acc + item.lineTotal,
    0
  );

  return {
    items: cartWithDetails,
    totalPrice,
    addToCart,
    removeFromCart,
    clearCart,
  };
};
