import { ReactNode, useMemo, useState } from "react";
import {
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { ICartItem, IProductTypeResponse, relativePath } from "@/utils";
import { ProductChip } from "./chips/ProductChip";
import { cn } from "@/utils/cn";
import { useCart } from "../utils/cartSlice";
import { useNavigate } from "react-router-dom";

interface IProps {
  product: IProductTypeResponse;
  addToCart: (item: ICartItem) => void;
}

export function ProductDetails({ product, addToCart }: IProps) {
  const { itemIsInCart, updateSection, cartItems } = useCart();
  const navigate = useNavigate();

  const currentProduct = useMemo(() => {
    const productExists = cartItems.find((item) => item.id === `${product.id}`);
    return productExists
      ? {
          quantity: productExists.quantity,
          color: productExists.color,
          size: productExists.size,
        }
      : { quantity: 1, color: "", size: "" };
  }, []);

  const [selection, setSelection] = useState({
    selectedColor: currentProduct.color,
    selectedSize: currentProduct.size,
    quantity: currentProduct.quantity,
    currentIndex: 0,
  });
  const handleQuantityChange = (type: "increment" | "decrement") => {
    setSelection((prev) => {
      const newQuantity =
        type === "increment"
          ? prev.quantity + 1
          : prev.quantity > 1
          ? prev.quantity - 1
          : 1;
      updateSection(`${product.id}`, "quantity", newQuantity);
      return { ...prev, quantity: newQuantity };
    });
  };

  const handleCurrentIndexChange = (newIndex: number) => {
    setSelection((prev) => ({ ...prev, currentIndex: newIndex }));
  };

  const handleColorChange = (color: string) => {
    updateSection(`${product.id}`, "color", color);
    setSelection((prev) => ({ ...prev, selectedColor: color }));
  };

  const handleSizeChange = (size: string) => {
    updateSection(`${product.id}`, "size", size);
    setSelection((prev) => ({ ...prev, selectedSize: size }));
  };

  const productStock = product.product_colours.flatMap(
    (color) => color.stock || []
  );

  const itemExistInCart = itemIsInCart(`${product.id}`);
  const productColors = Array.from(
    new Set(product.product_colours.map((color) => color.colour))
  );
  const productSizes = Array.from(
    new Set(productStock.map((size) => size.size))
  );

  const handleAddToCart = () => {
    if (itemExistInCart) {
      navigate(relativePath.member.checkOut);
    } else {
      addToCart({
        name: product.name,
        id: `${product.id}`,
        price_amount: +product.price_amount,
        price_currency: product.price_currency,
        quantity: selection.quantity,
        product_type: product.product_type.name,
        product_category: product.product_category.name,
        image_url: `${
          product.product_colours[selection.currentIndex].image_url
        }`,
        color:
          selection.selectedColor ||
          product.product_colours[selection.currentIndex].colour,
        size: selection.selectedSize || productStock[0]?.size,
        productColors,
        productSizes,
      });
    }
  };

  const cartText = itemExistInCart ? "Checkout" : "Add to cart";

  return (
    <div className=" border rounded-lg w-full p-4 grid grid-cols-1 lg:grid-cols-2 gap-10 text-[#404040]">
      {/* Image Section */}
      <div>
        <div className=" border p-2 rounded-lg overflow-hidden max-h-[400px]">
          <img
            src={`${
              product.product_colours?.[selection.currentIndex].image_url
            }`}
            alt={product.name}
            className="w-full object-cover"
          />
        </div>
        {product.product_colours.length > 1 && (
          <div className="flex  items-center justify-between">
            <div className="flex gap-2 mt-4">
              {product.product_colours?.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCurrentIndexChange(idx)}
                  className={`border rounded-lg overflow-hidden size-14 ${
                    idx === selection.currentIndex ? "ring-1 ring-black" : ""
                  }`}
                >
                  <img
                    src={`${img.image_url}`}
                    alt={`Product ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center mt-4 cursor-pointer ">
              <ChevronLeftIcon
                onClick={() =>
                  handleCurrentIndexChange(
                    selection.currentIndex > 0
                      ? selection.currentIndex - 1
                      : product.product_colours.length - 1
                  )
                }
                className="border border-[#D1CCCC] rounded-full w-10 font-light text-lightGray hover:shadow-md"
              />
              <ChevronRightIcon
                onClick={() =>
                  handleCurrentIndexChange(
                    selection.currentIndex < product.product_colours.length - 1
                      ? selection.currentIndex + 1
                      : 0
                  )
                }
                className="border border-[#D1CCCC] rounded-full w-10 text-lightGray hover:shadow-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-2">
            <ProductChip section="type" text={product.product_type?.name} />
            <ProductChip
              section="category"
              text={product.product_category?.name}
            />
          </div>
          <p className="text-2xl font-semibold">
            <span>{product.price_currency || "GHC"}</span>{" "}
            {product.price_amount}
          </p>
        </div>

        <Section title="Colors">
          <div className="flex gap-2">
            {product.product_colours.map((color, idx) => (
              <button
                key={idx}
                onClick={() => handleColorChange(color.colour)}
                className={`w-8 h-8 rounded-lg border-2 ${
                  selection.selectedColor === color.colour
                    ? "border-blue-500"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: color.colour }}
              />
            ))}
          </div>
        </Section>

        {/* Sizes */}
        <Section title="Sizes">
          <div className="flex gap-2 flex-wrap">
            {productSizes.map((size) => (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                className={`px-3 py-1 border rounded ${
                  selection.selectedSize === size
                    ? "border border-black"
                    : "border-gray-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </Section>

        {/* Quantity */}
        <Section title="Quantity">
          <QuantitySelector
            quantity={selection.quantity}
            handleQuantityChange={handleQuantityChange}
          />
        </Section>

        {/* Buttons */}
        <div className="flex gap-4 flex-wrap w-full">
          {!itemExistInCart && (
            <Button
              value="Buy now"
              className="w-full"
              onClick={() => {
                handleAddToCart();
                navigate(relativePath.member.checkOut);
              }}
            />
          )}
          <Button
            value={cartText}
            variant={itemExistInCart ? "primary" : "secondary"}
            className="w-full"
            onClick={handleAddToCart}
          />
        </div>

        {/* Description */}
        <div>
          <h3 className="font-medium mb-2">Description</h3>
          <p className="text-gray-700">{product.description}</p>
        </div>
      </div>
    </div>
  );
}

interface ISectionProps {
  title: string;
  children: ReactNode;
}
const Section = ({ title, children }: ISectionProps) => {
  return (
    <div className="border-b pb-2 flex justify-between">
      <h3 className="font-bold mb-2">{title}</h3>
      {children}
    </div>
  );
};

interface IQuantitySelectorProps {
  quantity: number;
  handleQuantityChange: (type: "increment" | "decrement") => void;
}
const QuantitySelector = ({
  handleQuantityChange,
  quantity,
}: IQuantitySelectorProps) => {
  return (
    <div className="flex items-center  bg-gray-50 rounded border border-gray-300">
      <QuantityButton
        className="rounded-tl rounded-bl border-r"
        onClick={() => handleQuantityChange("decrement")}
      >
        <MinusIcon className="size-5" />
      </QuantityButton>

      <span className="w-8 text-center">{quantity}</span>
      <QuantityButton
        className="rounded-tr rounded-br border-l"
        onClick={() => handleQuantityChange("increment")}
      >
        <PlusIcon className="size-5" />
      </QuantityButton>
    </div>
  );
};

interface IQuantityButtonProps {
  className?: string;
  onClick: () => void;
  children: ReactNode;
}
const QuantityButton = ({
  className,
  children,
  onClick,
}: IQuantityButtonProps) => {
  return (
    <button
      className={cn(
        " h-full hover:bg-gray-100 bg-[#F3F4F6] w-8 flex items-center justify-center",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
