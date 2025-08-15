import { type ICartSlice } from "@/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCart = create<ICartSlice>()(
  persist(
    (set, get) => ({
      cartItems: [],
      cartOpen: false,
      addToCart: (item) => {
        set((state) => {
          const existingItemIndex = state.cartItems.findIndex(
            (cartItem) => cartItem.id === item.id
          );

          if (existingItemIndex !== -1) {
            const updatedCartItems = [...state.cartItems];
            updatedCartItems[existingItemIndex] = {
              ...updatedCartItems[existingItemIndex],
              quantity: item.quantity,
            };
            return { cartItems: updatedCartItems };
          } else {
            return { cartItems: [...state.cartItems, item] };
          }
        });
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
        return get().cartItems.some((item) => item.id === productId);
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
      updateSection: (productId, section, value) => {
        console.log("Updating quantity for product:", productId, "to", section);
        set((state) => {
          const updatedCartItems = state.cartItems.map((item) =>
            item.id === productId ? { ...item, [section]: value } : item
          );
          return { cartItems: updatedCartItems };
        });
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
