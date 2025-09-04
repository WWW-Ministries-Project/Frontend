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

          // if (existingItemIndex !== -1) {
          //   const updatedCartItems = [...state.cartItems];
          //   updatedCartItems[existingItemIndex] = {
          //     ...updatedCartItems[existingItemIndex],
          //     quantity: item.quantity,
          //   };
          //   return { cartItems: updatedCartItems };
          // } else {
            return { cartItems: [...state.cartItems, {...item, item_uuid:crypto.randomUUID()}] };
          // }
        });
      },
      removeFromCart: (uuid) => {
        set((state) => ({
          cartItems: state.cartItems.filter(
            (item) => item.item_uuid !== uuid
          ),
        }));
      },
      clearCart: () => {
        set({ cartItems: [] });
      },
      getTotalItems: (): number => {
        return get().cartItems.length;
      },
      itemIsInCart: (uuid: string) => {
        return get().cartItems.some(
          (item) => item.item_uuid === uuid
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
      updateSection: (uuid, section, value) => {
        
        set((state) => {
          const updatedCartItems = state.cartItems.map((item) =>
            item.item_uuid === uuid
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
