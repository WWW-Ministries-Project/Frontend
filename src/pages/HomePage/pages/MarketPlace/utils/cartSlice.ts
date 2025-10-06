import { create } from "zustand";
import { persist } from "zustand/middleware";

import { type ICartSlice } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";

export const useCart = create<ICartSlice>()(
  persist(
    (set, get) => ({
      cartItems: [],
      cartOpen: false,
      addToCart: (item) => {
        set((state) => {
          
          showNotification("Product added to cart", "success");
          return {
            cartItems: [
              ...state.cartItems,
              { ...item, item_uuid: crypto.randomUUID() },
            ],
          };

          // }
        });
      },
      removeFromCart: (uuid) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.item_uuid !== uuid),
        }));
         showNotification("Product removed from cart", "success");
      },
      clearCart: () => {
        set({ cartItems: [] });
      },
      getTotalItems: (): number => {
        return get().cartItems.length;
      },
      itemIsInCart: (uuid: string) => {
        return get().cartItems.some((item) => item.item_uuid === uuid);
      },
      getTotalPrice: () => {
        return get().cartItems.reduce((total, item) => {
          return total + item.price_amount * item.quantity;
        }, 0);
      },
      toggleCart: (value) => {
        set({ cartOpen: value });
      },
      setCartItems: (items) => {
        set({ cartItems: items });
      },
      updateSection: (uuid, section, value) => {
        set((state) => {
          const updatedCartItems = state.cartItems.map((item) =>
            item.item_uuid === uuid ? { ...item, [section]: value } : item
          );
          return { cartItems: updatedCartItems };
        });
      },
      setBillinDetails: (details) => {
        set({ billinDetails: details });
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
