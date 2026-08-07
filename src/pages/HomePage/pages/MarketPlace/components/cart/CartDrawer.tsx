import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { relativePath } from "@/utils";
import { useCart } from "../../utils/cartSlice";
import { useCartDetails } from "../../utils/useCartDetails";
import { ProductChip } from "../chips/ProductChip";
import EmptyCartComponent from "./EmptyCartComponent";

export default function CartDrawer() {
  const { cartOpen, toggleCart, removeFromCart } = useCart();
  const { items: cartWithDetails, totalPrice } = useCartDetails();

  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        cartOpen
      ) {
        toggleCart(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cartOpen, toggleCart]);

  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(itemId);
  };

  return (
    <div
      className={`fixed top-[65px] right-0 z-50 flex h-fit w-96 max-w-full flex-col rounded-tl-2xl border border-lightGray bg-white text-primary shadow-2xl transition-transform duration-300 ${
        cartOpen ? "translate-x-0" : "translate-x-full"
      }`}
      ref={drawerRef}
    >
      <div className="flex items-center justify-between border-b border-lightGray px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="size-6" />
          <h2 className="text-lg font-bold">Your cart</h2>
        </div>
        <button
          onClick={() => toggleCart(!cartOpen)}
          className="rounded-full p-1 hover:bg-lightGray/40"
          aria-label="Close cart"
        >
          <XMarkIcon className="size-5" />
        </button>
      </div>

      <div className="max-h-[60vh] divide-y divide-lightGray overflow-y-auto px-5">
        {cartWithDetails.length === 0 ? (
          <div className="py-6">
            <EmptyCartComponent />
          </div>
        ) : (
          cartWithDetails.map((item) => (
            <CartCard
              key={item.item_uuid}
              cartItem={item}
              onDelete={handleRemoveFromCart}
            />
          ))
        )}
      </div>

      {cartWithDetails.length > 0 && (
        <div className="space-y-3 border-t border-lightGray px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primaryGray">Subtotal</p>
            <p className="text-lg font-bold">GHC {totalPrice.toFixed(2)}</p>
          </div>
          <Button
            value="Proceed to checkout"
            className="w-full"
            onClick={() => {
              toggleCart(false);
              navigate(relativePath.member.checkOut);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface CartCardProps {
  cartItem: {
    image_url: string;
    name: string;
    price_amount?: number;
    quantity: number;
    product_id: string;
    product_type: string;
    product_category: string;
    item_uuid?: string | undefined;
  };
  onDelete: (itemId: string) => void;
}
const CartCard = ({ cartItem, onDelete }: CartCardProps) => {
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-lightGray bg-lightGray/30">
        <img
          src={cartItem.image_url}
          alt={cartItem.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-semibold">{cartItem.name}</p>
        <div className="flex flex-wrap items-center gap-1">
          <ProductChip section="type" text={cartItem.product_type} />
          <ProductChip section="category" text={cartItem.product_category} />
        </div>
        <p className="text-sm text-primaryGray">
          Qty {cartItem.quantity} · GHC {cartItem.price_amount?.toFixed(2)}
        </p>
      </div>
      <button
        onClick={() => onDelete(cartItem.item_uuid!)}
        className="rounded-full p-1 text-primaryGray hover:bg-lightGray/40 hover:text-red-600"
        aria-label={`Remove ${cartItem.name} from cart`}
      >
        <XMarkIcon className="size-4" />
      </button>
    </div>
  );
};
