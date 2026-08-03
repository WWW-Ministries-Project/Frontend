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
          const normalizedQuantity = Math.max(1, Number(item.quantity) || 1);
          const normalizedPrice = Math.max(0, Number(item.price_amount) || 0);
          const normalizedItem = {
            ...item,
            quantity: normalizedQuantity,
            price_amount: normalizedPrice,
          };

          const existingItemIndex = state.cartItems.findIndex(
            (cartItem) =>
              cartItem.product_id === normalizedItem.product_id &&
              cartItem.market_id === normalizedItem.market_id &&
              cartItem.color === normalizedItem.color &&
              cartItem.size === normalizedItem.size
          );

          if (existingItemIndex >= 0) {
            const updatedCartItems = [...state.cartItems];
            const existingItem = updatedCartItems[existingItemIndex];
            const stockCap = normalizedItem.stock ?? Infinity;

            updatedCartItems[existingItemIndex] = {
              ...existingItem,
              ...normalizedItem,
              quantity: Math.min(existingItem.quantity + normalizedQuantity, stockCap),
            };

            showNotification("Product quantity updated in cart", "success");
            return { cartItems: updatedCartItems };
          }

          showNotification("Product added to cart", "success");
          return {
            cartItems: [
              ...state.cartItems,
              { ...normalizedItem, item_uuid: crypto.randomUUID() },
            ],
          };
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
      itemIsInCart: (productId: string) => {
        return get().cartItems.some((item) => item.product_id === productId);
      },
      getTotalPrice: () => {
        return get().cartItems.reduce((total, item) => {
          return (
            total +
            Math.max(0, Number(item.price_amount) || 0) *
              Math.max(1, Number(item.quantity) || 1)
          );
        }, 0);
      },
      toggleCart: (value) => {
        set({ cartOpen: value });
      },
      setCartItems: (items) => {
        const normalizedItems = items.map((item) => ({
          ...item,
          quantity: Math.max(1, Number(item.quantity) || 1),
          price_amount: Math.max(0, Number(item.price_amount) || 0),
        }));
        set({ cartItems: normalizedItems });
      },
      updateSection: (identifier, section, value) => {
        set((state) => {
          const hasUuidMatch = state.cartItems.some(
            (item) => item.item_uuid === identifier
          );
          let hasUpdatedByProductId = false;
          let hasChange = false;

          const updatedCartItems = state.cartItems.map((item) => {
            const isTarget = hasUuidMatch
              ? item.item_uuid === identifier
              : !hasUpdatedByProductId && item.product_id === identifier;
            if (!isTarget) return item;
            if (!hasUuidMatch) hasUpdatedByProductId = true;

            const normalizedValue =
              section === "quantity"
                ? Math.max(1, Math.min(Number(value) || 1, item.stock ?? Infinity))
                : section === "stock"
                ? Math.max(0, Number(value) || 0)
                : String(value || "");

            if (item[section] === normalizedValue) return item;
            hasChange = true;
            return { ...item, [section]: normalizedValue };
          });

          if (!hasChange) return state;
          return { cartItems: updatedCartItems };
        });
      },
      updateVariant: (identifier, patch) => {
        set((state) => {
          const hasUuidMatch = state.cartItems.some(
            (item) => item.item_uuid === identifier
          );
          let hasUpdatedByProductId = false;

          const updatedCartItems = state.cartItems.map((item) => {
            const isTarget = hasUuidMatch
              ? item.item_uuid === identifier
              : !hasUpdatedByProductId && item.product_id === identifier;
            if (!isTarget) return item;
            if (!hasUuidMatch) hasUpdatedByProductId = true;

            const stockCap =
              patch.stock ?? item.stock ?? Infinity;
            const quantity = Math.max(
              1,
              Math.min(patch.quantity ?? item.quantity, stockCap)
            );

            return { ...item, ...patch, quantity };
          });

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
