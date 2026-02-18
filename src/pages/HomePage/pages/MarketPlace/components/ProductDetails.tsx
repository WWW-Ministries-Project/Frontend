import { ReactNode, useMemo, useState } from "react";
import {
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { ICartItem, IProductTypeResponse, relativePath } from "@/utils";
import { ProductChip } from "./chips/ProductChip";
import { cn } from "@/utils/cn";
import { useCart } from "../utils/cartSlice";
import { matchRoutes, useLocation, useNavigate } from "react-router-dom";
import { routes } from "@/routes/appRoutes";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";

interface IProps {
  readonly product: IProductTypeResponse;
  readonly addToCart: (item: ICartItem) => void;
}

export function ProductDetails({ product, addToCart }: IProps) {
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const matches = matchRoutes(routes, location);
  const routeName = matches?.find((m) => m.route.name)?.route.name;

  const currentProduct = useMemo(() => {
    const productExists = cartItems.find(
      (item) => item.product_id === `${product.id}`
    );
    return productExists
      ? {
        quantity: productExists.quantity,
        color: productExists.color,
        size: productExists.size,
      }
      : { quantity: 1, color: "", size: "" };
  }, [cartItems, product.id]);

  const initialCurrentIndex = useMemo(() => {
    if (!currentProduct.color) return 0;

    const existingIndex = product.product_colours.findIndex(
      (colorItem) => colorItem.colour === currentProduct.color
    );

    return existingIndex >= 0 ? existingIndex : 0;
  }, [currentProduct.color, product.product_colours]);

  const [selection, setSelection] = useState({
    selectedColor:
      currentProduct.color ||
      product.product_colours[initialCurrentIndex]?.colour ||
      "",
    selectedSize:
      currentProduct.size ||
      product.product_colours[initialCurrentIndex]?.stock?.[0]?.size ||
      "",
    quantity: currentProduct.quantity,
    currentIndex: initialCurrentIndex,
  });
  const [pendingPurchase, setPendingPurchase] = useState<{
    action: "buy_now" | "add_to_cart";
    item: ICartItem;
  } | null>(null);
  const handleQuantityChange = (
    type: "increment" | "decrement",
    value?: number
  ) => {
    setSelection((prev) => {
      const hasExplicitValue =
        typeof value === "number" && Number.isFinite(value);
      const newQuantity = hasExplicitValue
        ? Math.max(1, Math.floor(value))
        : type === "increment"
          ? prev.quantity + 1
          : prev.quantity > 1
            ? prev.quantity - 1
            : 1;
      return { ...prev, quantity: newQuantity };
    });
  };

  const handleCurrentIndexChange = (newIndex: number) => {
    const nextColor = product.product_colours[newIndex];
    const nextSizes = nextColor?.stock || [];

    setSelection((prev) => {
      const hasCurrentSize = nextSizes.some(
        (sizeOption) => sizeOption.size === prev.selectedSize
      );
      const nextSelectedSize = hasCurrentSize
        ? prev.selectedSize
        : nextSizes[0]?.size || "";

      return {
        ...prev,
        currentIndex: newIndex,
        selectedColor: nextColor?.colour || "",
        selectedSize: nextSelectedSize,
      };
    });
  };

  const handleColorChange = (color: string, idx: number) => {
    const nextSizes = product.product_colours[idx]?.stock || [];

    setSelection((prev) => {
      const hasCurrentSize = nextSizes.some(
        (sizeOption) => sizeOption.size === prev.selectedSize
      );
      const nextSelectedSize = hasCurrentSize
        ? prev.selectedSize
        : nextSizes[0]?.size || "";

      return {
        ...prev,
        selectedColor: color,
        selectedSize: nextSelectedSize,
        currentIndex: idx,
      };
    });
  };

  const handleSizeChange = (size: string) => {
    setSelection((prev) => ({ ...prev, selectedSize: size }));
  };

  const productColors = Array.from(
    new Set(product.product_colours.map((color) => color.colour))
  );
  const sizes = useMemo(() => {
    return product?.product_colours?.[selection.currentIndex]?.stock ?? []
  }, [selection.currentIndex, product?.product_colours])


  const cartItem = {
    name: product.name,
    product_id: `${product.id}`,
    price_amount: +product.price_amount,
    price_currency: product.price_currency || "GHC",
    quantity: selection.quantity,
    product_type: product.product_type.name,
    product_category: product.product_category.name,
    image_url: `${product.product_colours[selection.currentIndex].image_url}`,
    color:
      selection.selectedColor ||
      product.product_colours[selection.currentIndex].colour,
    size: selection.selectedSize || sizes[0]?.size || "",
    productColors,
    productSizes:sizes?.map(size=>size?.size),
    market_id: product?.market_id || "",
  };

  const handleAddToCart = () => {
    setPendingPurchase({
      action: "add_to_cart",
      item: { ...cartItem },
    });
  };



  const handleBuy = () => {
    setPendingPurchase({
      action: "buy_now",
      item: { ...cartItem },
    });
  };

  const clearPendingPurchase = () => {
    setPendingPurchase(null);
  };

  const confirmPendingPurchase = () => {
    if (!pendingPurchase) return;

    if (pendingPurchase.action === "add_to_cart") {
      addToCart(pendingPurchase.item);
      clearPendingPurchase();
      return;
    }

    if (routeName === "out") {
      localStorage.setItem("my_cart", JSON.stringify(pendingPurchase.item));
      clearPendingPurchase();
      navigate(`/out/products/check-out`);
    } else {
      addToCart(pendingPurchase.item);
      clearPendingPurchase();
      navigate(relativePath.member.checkOut);
    }
  };

  const is_not_admin = routeName === "out" || routeName === "member";

  return (
    <div className="">
      {routeName === "out" && (
        <div className="p-4 space-y-2">
          <div
            className="flex items-center gap-2 cursor-pointer text-primary font-semibold"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="size-6  " />
            back
          </div>
          <div className="text-xl font-bold ">Product Specification</div>
        </div>
      )}
      <div className=" mx-auto max-w-6xl  rounded-lg   p-4 grid grid-cols-1 lg:grid-cols-2 gap-10 text-[#404040]">
        {/* Image Section */}
        <div className="">
          <div className=" border p-2 rounded-lg overflow-hidden ">
            <img
              src={`${product.product_colours?.[selection.currentIndex].image_url
                }`}
              alt={product.name}
              className=" aspect-video object-contain w-full h-72"
            />
          </div>
          {product.product_colours.length > 1 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center w-full overflow-auto">
                <div className="flex gap-2 mt-4 p-2">
                  {product.product_colours?.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCurrentIndexChange(idx)}
                      className={`border rounded-lg overflow-hidden size-14 ${idx === selection.currentIndex
                          ? "ring-1 ring-black"
                          : ""
                        }`}
                    >
                      <img
                        src={`${img.image_url}`}
                        alt={`Product ${idx}`}
                        className="w-full h-full object-"
                      />
                    </button>
                  ))}
                </div>
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
                      selection.currentIndex <
                        product.product_colours.length - 1
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
              {Number(product.price_amount).toFixed(2)}
            </p>
          </div>

          <Section title="Colors">
            <div className="flex gap-2 flex-wrap">
              {product.product_colours.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleColorChange(color.colour, idx)}
                  className={`w-8 h-8 rounded-lg border-2 ${selection.selectedColor === color.colour
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
              {sizes.map((size) => (
                <button
                  key={size.size}
                  onClick={() => handleSizeChange(size?.size)}
                  className={`px-3 py-1 border rounded ${selection.selectedSize === size?.size
                      ? "border border-black"
                      : "border-gray-300"
                    }`}
                >
                  {size?.size}
                </button>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section title="Quantity">
            <QuantitySelector
              quantity={selection.quantity}
              handleQuantityChange={handleQuantityChange}
              disabled={!is_not_admin}
            />
          </Section>

          {/* Buttons */}
          {is_not_admin && (
            <div className="flex gap-4 flex-wrap w-full">
              {/* {!itemExistInCart && ( */}
              <Button value="Buy now" className="w-full" onClick={handleBuy} />
              {/* )} */}
              {routeName !== "out" && (
                <Button
                  value="Add to cart"
                  variant={"secondary"}
                  className="w-full"
                  onClick={handleAddToCart}
                />
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>
        </div>
      </div>
      <Modal
        open={Boolean(pendingPurchase)}
        persist={false}
        onClose={clearPendingPurchase}
        className="max-w-xl"
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-[#404040]">
            Confirm {pendingPurchase?.action === "buy_now" ? "Purchase" : "Cart Item"}
          </h3>

          {pendingPurchase?.item && (
            <div className="border rounded-lg p-4 flex items-start gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 border">
                <img
                  src={pendingPurchase.item.image_url}
                  alt={pendingPurchase.item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-semibold text-base text-[#404040]">
                  {pendingPurchase.item.name}
                </p>
                <p>
                  <span className="font-medium">Color:</span>{" "}
                  {pendingPurchase.item.color ? (
                    <span className="inline-flex items-center gap-2 align-middle">
                      <span
                        className="inline-block h-4 w-6 rounded border border-gray-300"
                        style={{ backgroundColor: pendingPurchase.item.color }}
                      />
                      <span>Selected</span>
                    </span>
                  ) : (
                    "-"
                  )}
                </p>
                <p>
                  <span className="font-medium">Size:</span> {pendingPurchase.item.size || "-"}
                </p>
                <p>
                  <span className="font-medium">Quantity:</span> {pendingPurchase.item.quantity}
                </p>
                <p>
                  <span className="font-medium">Price:</span>{" "}
                  {pendingPurchase.item.price_currency || "GHC"}{" "}
                  {Number(pendingPurchase.item.price_amount).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end items-center gap-3">
            <Button value="Cancel" variant="secondary" onClick={clearPendingPurchase} />
            <Button
              value="Confirm"
              onClick={confirmPendingPurchase}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface ISectionProps {
  title: string;
  children: ReactNode;
}
const Section = ({ title, children }: ISectionProps) => {
  return (
    <div className="border-b pb-2 flex justify-between gap-2">
      <h3 className="font-bold mb-2">{title}</h3>
      {children}
    </div>
  );
};

interface IQuantitySelectorProps {
  quantity: number;
  handleQuantityChange: (
    type: "increment" | "decrement",
    value?: number
  ) => void;
  disabled: boolean;
}
const QuantitySelector = ({
  handleQuantityChange,
  quantity,
  disabled,
}: IQuantitySelectorProps) => {
  return (
    <div className="flex items-center  bg-gray-50 rounded border border-gray-300">
      <QuantityButton
        className="rounded-tl rounded-bl border-r"
        onClick={() => handleQuantityChange("decrement")}
        disabled={disabled}
      >
        <MinusIcon className="size-5" />
      </QuantityButton>

      <InputDiv
        className="text-center w-11 outline-none"
        value={quantity}
        id=""
        onChange={(_, value) => {
          const parsedValue = Math.max(1, Number(value) || 1);
          handleQuantityChange("increment", parsedValue);
        }}
        disabled={disabled}
      />
      <QuantityButton
        className="rounded-tr rounded-br border-l"
        onClick={() => handleQuantityChange("increment")}
        disabled={disabled}
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
  disabled: boolean;
}
const QuantityButton = ({
  className,
  children,
  onClick,
  disabled,
}: IQuantityButtonProps) => {
  return (
    <button
      className={cn(
        " h-full hover:bg-gray-100 bg-[#F3F4F6] w-8 flex items-center justify-center disabled:cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
