import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { type ICartItem, type IDeliveryConfig, type IProductTypeResponse, relativePath } from "@/utils";
import { cn } from "@/utils/cn";

import { useCart } from "../utils/cartSlice";
import {
  colourLabel,
  formatDate,
  formatMoney,
  isStockManaged,
  PICKUP_LOCATION,
  productStock,
} from "../utils/marketplaceModel";
import { ProductCard } from "./cards/ProductCard";
import { ProductTile } from "./storefront/ProductTile";
import {
  buildCartItem,
  cartQuantityFor,
  colourAvailable,
  colourImage,
  colourSizes,
  defaultColourIndex,
  isGuestPath,
  LOW_STOCK_DETAIL,
  productPath,
  shopPath,
  swatchHex,
  tint,
  variantStock,
} from "./storefront/storefrontModel";

interface IProps {
  readonly product: IProductTypeResponse;
  /** Defaults to the shared cart store. Admin preview passes a no-op. */
  readonly addToCart?: (item: ICartItem) => void;
  readonly relatedProducts?: IProductTypeResponse[];
  readonly deliveryConfig?: IDeliveryConfig | null;
}

const ICONS = {
  store:
    "M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z",
  truck:
    "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  lock:
    "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
};

export function ProductDetails({
  product,
  addToCart,
  relatedProducts = [],
  deliveryConfig = null,
}: IProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const guest = isGuestPath(pathname);
  const shopping = guest || pathname.startsWith("/member");
  const cartItems = useCart((s) => s.cartItems);
  const storeAddToCart = useCart((s) => s.addToCart);
  const toggleCart = useCart((s) => s.toggleCart);
  const add = addToCart ?? storeAddToCart;

  const colours = useMemo(() => product.product_colours || [], [product.product_colours]);
  const managed = isStockManaged(product);
  const [colourIdx, setColourIdx] = useState(() => defaultColourIndex(product));
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeErr, setSizeErr] = useState(false);

  const colour = colours[colourIdx] || colours[0];
  const hex = swatchHex(colour);
  const sizes = colourSizes(colour);
  const oneSize = sizes.length <= 1;
  const stockOf = (z: string) => variantStock(product, colour, z);
  const selSize = oneSize
    ? sizes[0] ?? ""
    : size && sizes.includes(size) && stockOf(size) > 0
      ? size
      : null;
  const avail = selSize !== null ? stockOf(selSize) : 0;
  const inCart =
    selSize !== null && !guest
      ? cartQuantityFor(cartItems, `${product.id}`, colour?.colour || "", selSize)
      : 0;
  const room = Math.max(0, avail - inCart);
  const quantity = Math.max(1, Math.min(qty, room || 1));
  const total = productStock(product);
  const soldOut = total <= 0;
  const market = product.market;

  const pickColour = (i: number) => {
    setColourIdx(i);
    setSize(null);
    setSizeErr(false);
    setQty(1);
  };

  const stockMsg = soldOut
    ? "Sold out"
    : selSize === null
      ? "Select a size to see availability"
      : room === 0
        ? avail > 0
          ? "You have all available stock in your cart"
          : "Out of stock"
        : Number.isFinite(avail) && avail <= LOW_STOCK_DETAIL
          ? `Only ${avail} left — order soon`
          : "In stock";
  const stockTone =
    soldOut || (selSize !== null && room === 0)
      ? "text-red-700"
      : selSize !== null && Number.isFinite(avail) && avail <= LOW_STOCK_DETAIL
        ? "text-amber-700"
        : selSize !== null
          ? "text-green-700"
          : "text-primaryGray";

  const submit = (buyNow: boolean) => {
    if (selSize === null) {
      setSizeErr(true);
      return;
    }
    if (room <= 0) return;
    const item = buildCartItem(product, colourIdx, selSize, quantity);
    if (guest) {
      // Guests have no cart: buy-now carries the single item to checkout.
      localStorage.setItem("my_cart", JSON.stringify(item));
      navigate("/out/products/check-out");
      return;
    }
    add(item);
    setQty(1);
    if (buyNow) {
      toggleCart(false);
      navigate(relativePath.member.checkOut);
    }
  };

  const toShop = () => navigate(shopPath(guest));
  const toMarket = () =>
    navigate(product.market_id ? `${shopPath(guest)}?market=${product.market_id}` : shopPath(guest));

  return (
    <div data-screen-label="Product Detail" className={cn("flex flex-col gap-6 text-primary", !shopping && "p-4")}>
      {shopping && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-primaryGray">
          <button type="button" onClick={toShop} className="hover:text-primary">
            Marketplace
          </button>
          <span aria-hidden="true">/</span>
          {market?.name && (
            <>
              <button type="button" onClick={toMarket} className="hover:text-primary">
                {market.name}
              </button>
              <span aria-hidden="true">/</span>
            </>
          )}
          <span className="font-medium text-primary" aria-current="page">
            {product.name}
          </span>
        </nav>
      )}

      <div className="grid grid-cols-1 items-start gap-10 min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <ProductTile
            hex={hex}
            imageUrl={colourImage(colour)}
            alt={`${product.name}${colour ? ` in ${colourLabel(colour)}` : ""}`}
            swatchClassName="w-[42%] shadow-[0_24px_48px_rgb(var(--color-shadow)_/_0.2)]"
            className="rounded-2xl border border-lightGray"
            label={[product.product_type?.name, colourLabel(colour)].filter(Boolean).join(" · ")}
            labelClassName="bottom-3.5 left-4 text-xs"
          />
          {colours.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {colours.map((c, i) => {
                const img = colourImage(c);
                return (
                  <button
                    key={`${c.colour}-${i}`}
                    type="button"
                    onClick={() => pickColour(i)}
                    aria-label={colourLabel(c)}
                    aria-pressed={i === colourIdx}
                    className={cn(
                      "flex aspect-square items-center justify-center overflow-hidden rounded-lg border-2 p-0",
                      i === colourIdx ? "border-primary" : "border-transparent"
                    )}
                    style={{ background: tint(swatchHex(c)) }}
                  >
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span
                        className="aspect-square w-[40%] rounded-[22%]"
                        style={{ background: swatchHex(c) }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {market?.name &&
              (shopping ? (
                <button
                  type="button"
                  onClick={toMarket}
                  className="self-start rounded-full bg-primary/[0.06] px-3 py-1 text-sm font-medium text-primary"
                >
                  {market.name}
                </button>
              ) : (
                <span className="self-start rounded-full bg-primary/[0.06] px-3 py-1 text-sm font-medium">
                  {market.name}
                </span>
              ))}
            <h1 className="text-balance text-2xl font-semibold">{product.name}</h1>
            <p className="text-2xl font-semibold">{formatMoney(product.price_amount)}</p>
            {market?.end_date && (
              <p className="text-sm text-primaryGray">
                Sold in {market.name} · ends {formatDate(market.end_date)}
              </p>
            )}
          </div>

          {colours.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Colour: <b>{colourLabel(colour)}</b>
              </p>
              <div className="flex flex-wrap gap-3.5 p-[3px]">
                {colours.map((c, i) => (
                  <button
                    key={`${c.colour}-${i}`}
                    type="button"
                    onClick={() => pickColour(i)}
                    title={colourLabel(c)}
                    aria-label={colourLabel(c)}
                    aria-pressed={i === colourIdx}
                    className="h-9 w-9 rounded-full"
                    style={{
                      background: swatchHex(c),
                      opacity: colourAvailable(product, c) > 0 ? 1 : 0.35,
                      boxShadow:
                        i === colourIdx
                          ? "0 0 0 2px #fff, 0 0 0 4px rgb(var(--color-primary))"
                          : "0 0 0 1px rgb(var(--color-lightGray))",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!oneSize && (
            <div className="flex flex-col gap-3">
              <p className="text-sm">Size</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
                {sizes.map((z) => {
                  const off = stockOf(z) <= 0;
                  const on = selSize === z;
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => {
                        if (off) return;
                        setSize(z);
                        setSizeErr(false);
                        setQty(1);
                      }}
                      aria-pressed={on}
                      aria-disabled={off}
                      className={cn(
                        "h-11 rounded-lg border text-sm font-medium",
                        on
                          ? "border-primary bg-primary text-white"
                          : off
                            ? "cursor-not-allowed border-lightGray bg-gray-50 text-gray-400 line-through"
                            : "border-lightGray bg-white text-primary hover:bg-gray-100"
                      )}
                    >
                      {z}
                    </button>
                  );
                })}
              </div>
              {sizeErr && (
                <p role="alert" className="text-sm text-red-700">
                  Please choose a size.
                </p>
              )}
            </div>
          )}

          {shopping && (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-11 items-center rounded-lg border border-lightGray bg-white">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    className="h-full w-11 text-lg text-primary disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center font-semibold" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(room, quantity + 1))}
                    aria-label="Increase quantity"
                    disabled={quantity >= room}
                    className="h-full w-11 text-lg text-primary disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className={cn("text-sm font-medium", stockTone)}>{stockMsg}</p>
              </div>

              {soldOut ? (
                <div className="rounded-lg bg-gray-100 px-4 py-3.5 text-sm text-gray-700">
                  This item is sold out. Check back — stock is often replenished before the event.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {!guest && (
                    <button
                      type="button"
                      onClick={() => submit(false)}
                      disabled={selSize !== null && room <= 0}
                      className="min-h-12 rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add to cart
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => submit(true)}
                    disabled={selSize !== null && room <= 0}
                    className={cn(
                      "min-h-12 rounded-lg text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50",
                      guest
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-primary bg-white text-primary hover:bg-gray-100"
                    )}
                  >
                    Buy now
                  </button>
                </div>
              )}

              <div className="flex flex-col rounded-xl border border-lightGray bg-white">
                <InfoRow
                  icon={ICONS.store}
                  title="Free pickup at church"
                  body={deliveryConfig?.pickup_location || PICKUP_LOCATION}
                  border
                />
                {deliveryConfig?.delivery_enabled && (
                  <InfoRow
                    icon={ICONS.truck}
                    title={`Home delivery · ${formatMoney(deliveryConfig.delivery_fee)}`}
                    body="Choose delivery and enter your address at checkout."
                    border
                  />
                )}
                <InfoRow
                  icon={ICONS.lock}
                  title="Secure checkout"
                  body="Pay by mobile money or card via Hubtel."
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">About this item</h2>
            {product.description && (
              <p className="whitespace-pre-line text-pretty text-base text-gray-700">
                {product.description}
              </p>
            )}
            <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {product.product_category?.name && (
                <>
                  <span className="text-primaryGray">Category</span>
                  <span>{product.product_category.name}</span>
                </>
              )}
              {product.product_type?.name && (
                <>
                  <span className="text-primaryGray">Type</span>
                  <span>{product.product_type.name}</span>
                </>
              )}
              {market?.end_date && (
                <>
                  <span className="text-primaryGray">Market closes</span>
                  <span>{formatDate(market.end_date)}</span>
                </>
              )}
              {!managed && !shopping && (
                <>
                  <span className="text-primaryGray">Stock</span>
                  <span>Not tracked</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {shopping && relatedProducts.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">More from {market?.name || "this market"}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-6 tablet:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                product={related}
                variant="compact"
                handleViewProduct={(id) => navigate(productPath(id, guest))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const InfoRow = ({
  icon,
  title,
  body,
  border,
}: {
  icon: string;
  title: string;
  body: ReactNode;
  border?: boolean;
}) => (
  <div className={cn("flex gap-3 px-4 py-3.5", border && "border-b border-gray-200")}>
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="mt-0.5 shrink-0 text-primary"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
    </svg>
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-sm text-primaryGray">{body}</p>
    </div>
  </div>
);
