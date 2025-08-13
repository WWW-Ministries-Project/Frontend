import { type ICartSlice } from "@/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCart = create<ICartSlice>()(
  persist(
    (set, get) => ({
      cartItems: [],
      addToCart: (item) => {
        set((state) => ({
          cartItems: [...state.cartItems, item],
        }));
      },
      removeFromCart: (itemId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.id !== itemId),
        }));
      },
      clearCart: () => {
        set({ cartItems: [] });
      },
      getTotalItems: (): number => {
        return get().cartItems.length;
      },
      itemIsInCart: (productId: string) => {
        console.log("Checking if item is in cart", productId);
        return get().cartItems.some((item) => item.id === productId);
      },
      getTotalPrice: () => {
        return get().cartItems.reduce((total, item) => {
          return total + item.price_amount * item.quantity;
        }, 0);
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        cartItems: state.cartItems,
      }),
    }
  )
);
