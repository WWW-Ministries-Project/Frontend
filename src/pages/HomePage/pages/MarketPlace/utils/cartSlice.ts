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
            (cartItem) => cartItem.product_id === item.product_id
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
      removeFromCart: (itemproduct_id) => {
        set((state) => ({
          cartItems: state.cartItems.filter(
            (item) => item.product_id !== itemproduct_id
          ),
        }));
      },
      clearCart: () => {
        set({ cartItems: [] });
      },
      getTotalItems: (): number => {
        return get().cartItems.length;
      },
      itemIsInCart: (productproduct_id: string) => {
        return get().cartItems.some(
          (item) => item.product_id === productproduct_id
        );
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
      updateSection: (productproduct_id, section, value) => {
        console.log(
          "Updating quantity for product:",
          productproduct_id,
          "to",
          section
        );
        set((state) => {
          const updatedCartItems = state.cartItems.map((item) =>
            item.product_id === productproduct_id
              ? { ...item, [section]: value }
              : item
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
