import { ReactNode, useState } from "react";
import {
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { ICartItem, IProductTypeResponse } from "@/utils";
import { ProductChip } from "./chips/ProductChip";
import { cn } from "@/utils/cn";

interface IProps {
  product: IProductTypeResponse;
  addToCart: (item: ICartItem) => void;
}

export function ProductDetails({ product, addToCart }: IProps) {
  const [selection, setSelection] = useState({
    selectedColor: "",
    selectedSize: "",
    quantity: 1,
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
      return { ...prev, quantity: newQuantity };
    });
  };

  const handleCurrentIndexChange = (newIndex: number) => {
    setSelection((prev) => ({ ...prev, currentIndex: newIndex }));
  };

  const handleColorChange = (color: string) => {
    setSelection((prev) => ({ ...prev, selectedColor: color }));
  };

  const handleSizeChange = (size: string) => {
    setSelection((prev) => ({ ...prev, selectedSize: size }));
  };

  const productStock = product.product_colours.flatMap(
    (color) => color.stock || []
  );

  const handleAddToCart = () => {};

  return (
    <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-10 text-[#404040]">
      {/* Image Section */}
      <div>
        <div className="border rounded-lg overflow-hidden max-h-[400px]">
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
                  className={`border rounded-lg overflow-hidden size-10 ${
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
            {productStock.map((size) => (
              <button
                key={size.size}
                onClick={() => handleSizeChange(size.size)}
                className={`px-3 py-1 border rounded ${
                  selection.selectedSize === size.size
                    ? "border border-black"
                    : "border-gray-300"
                }`}
              >
                {size.size}
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
          <Button value="By now" className="w-full" />
          <Button
            value="Add to cart"
            variant="secondary"
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
