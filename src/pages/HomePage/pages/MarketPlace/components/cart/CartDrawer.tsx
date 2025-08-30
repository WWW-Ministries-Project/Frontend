import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { ShoppingCartIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useCart } from "../../utils/cartSlice";
import { ProductChip } from "../chips/ProductChip";
import EmptyCartComponent from "./EmptyCartComponent";
import { relativePath } from "@/utils";

export default function CartDrawer() {
  const { cartItems, cartOpen, toggleCart, removeFromCart, getTotalPrice } =
    useCart();

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

  const totalPrice = getTotalPrice();

  return (
    <div
      className={`fixed top-[65px] right-0 w-96 h-fit   z-50 p-4 rounded-tl-md text-[#474D66] bg-white shadow-lg transform transition-transform duration-300 ${
        cartOpen ? "translate-x-0" : "translate-x-full"
      }`}
      ref={drawerRef}
    >
      <div className="flex items-center justify-between border-b ">
        <div className="flex items-center ">
          <ShoppingCartIcon className="size-7" />
          <h2 className="p-4 font-bold text-xl">Shopping cart</h2>
        </div>
        <button onClick={() => toggleCart(!cartOpen)} className="p-4">
          <XMarkIcon className="size-5" />
        </button>
      </div>
      <div className="p-4 divide-y-[1px] max-h-[60vh] overflow-y-scroll">
        {cartItems.length === 0 ? (
          <EmptyCartComponent />
        ) : (
          <>
            {cartItems.map((item) => (
              <CartCard
                key={item.product_id}
                cartItem={item}
                onDelete={handleRemoveFromCart}
              />
            ))}
          </>
        )}
      </div>
      {cartItems.length > 0 && (
        <>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Subtotal</p>
              <p className="text-lg font-semibold">
                <span>GHC </span>
                {totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <Button
              value="Checkout"
              onClick={() => {
                toggleCart(false);
                navigate(relativePath.member.checkOut);
              }}
            />
            <Button
              value="View cart"
              variant="secondary"
              onClick={() => {
                toggleCart(false);
                navigate(relativePath.member.cart);
              }}
            />
          </div>
        </>
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
  };

  onDelete: (itemId: string) => void;
}
const CartCard = ({ cartItem, onDelete }: CartCardProps) => {
  const handleRemoveFromCart = (itemId: string) => {
    onDelete(itemId);
  };
  return (
    <div className="flex justify-between mb-2 py-2 font-medium">
      <div className="flex  gap-2">
        <div className="bg-slate-500 rounded-lg overflow-hidden w-20 h-24 ">
          <img
            src={cartItem.image_url}
            alt=""
            className="w-20 h-24 object-cover"
          />
        </div>
        <div className="flex flex-col justify-between h-full ">
          <p>{cartItem.name}</p>
          <div className="flex items-center gap-2">
            <ProductChip section="type" text={cartItem.product_type} />
            <ProductChip section="category" text={cartItem.product_category} />
          </div>
          <p className="flex items-center gap-2 pt-4">
            <span>{cartItem.quantity}</span>
            <span>
              <XMarkIcon className="size-5" />
            </span>
            <span>GHC {cartItem.price_amount?.toFixed(2)}</span>
          </p>
        </div>
      </div>
      <XMarkIcon
        className="size-5 cursor-pointer"
        onClick={() => handleRemoveFromCart(cartItem.product_id)}
      />
    </div>
  );
};
