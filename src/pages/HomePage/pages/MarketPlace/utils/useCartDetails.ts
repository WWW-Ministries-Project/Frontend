// hooks/useCartDetails.ts

import { useCart } from "./cartSlice";

export const useCartDetails = () => {
  const { cartItems, addToCart, removeFromCart, clearCart } = useCart();

  const normalizeNumber = (value: unknown, fallback = 0): number => {
    const converted = Number(value);
    return Number.isFinite(converted) ? converted : fallback;
  };

  // keep pricing data from cart state so totals remain stable after refresh
  const cartWithDetails = cartItems.map((item) => {
    const quantity = Math.max(1, normalizeNumber(item.quantity, 1));
    const priceAmount = Math.max(0, normalizeNumber(item.price_amount, 0));

    return {
      ...item,
      quantity,
      price_amount: priceAmount,
    };
  });

  const totalPrice = cartWithDetails.reduce(
    (acc, item) => acc + item.price_amount * item.quantity,
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
