import type {
  ICartItem,
  IMarket,
  IProductTypeResponse,
  ProductColour,
} from "@/utils";
import { encodeQuery } from "@/pages/HomePage/utils";

import {
  colourLabel,
  getMarketState,
  isStockManaged,
  productStock,
  sortSizes,
  type StatusInfo,
} from "../../utils/marketplaceModel";

/**
 * Storefront-only helpers (member shop, product detail, cart drawer). Shared
 * admin/member logic lives in marketplaceModel.ts; this file adds the bits
 * only the shop needs.
 */

/** Products created within this many days get a "New" badge. */
export const NEW_PRODUCT_DAYS = 14;
/** Products with this many units or fewer show "Only N left". */
export const LOW_STOCK_BADGE = 8;
/** Variants with this many units or fewer warn "order soon" on the detail page. */
export const LOW_STOCK_DETAIL = 5;

export const DEFAULT_SWATCH = "#D8DAE5";

/** The cart item we persist. `colour_name` is display-only; the API ignores it. */
export type StorefrontCartItem = ICartItem & { colour_name?: string };

type ProductWithDates = IProductTypeResponse & { created_at?: string };

const parseHex = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/(.)/g, "$1$1") : m[1];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

/** A pale background tint of a swatch colour, for imageless product tiles. */
export const tint = (hex: string) => {
  const rgb = parseHex(hex);
  if (!rgb) return "#F3F4F6";
  const mix = rgb.map((c) => Math.round(c * 0.16 + 255 * 0.84));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
};

export const swatchHex = (colour?: Pick<ProductColour, "colour"> | null) =>
  colour?.colour?.trim() || DEFAULT_SWATCH;

export const colourImage = (colour?: Pick<ProductColour, "image_url"> | null) =>
  typeof colour?.image_url === "string" ? colour.image_url : "";

export const isLiveProduct = (product: IProductTypeResponse) =>
  (!product.status || product.status === "published") &&
  (!product.market || getMarketState(product.market) === "Active");

export const isNewProduct = (product: IProductTypeResponse) => {
  const created = (product as ProductWithDates).created_at;
  if (!created) return false;
  const t = new Date(created).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= NEW_PRODUCT_DAYS * 86_400_000;
};

export const createdTime = (product: IProductTypeResponse) => {
  const t = new Date((product as ProductWithDates).created_at || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Sizes offered for a colour, in display order. Empty stock = one size. */
export const colourSizes = (colour?: ProductColour | null) => {
  const sizes = (colour?.stock || []).map((s) => s.size).filter(Boolean);
  return sortSizes(Array.from(new Set(sizes)));
};

/** Units available for one variant. Unmanaged products are unlimited. */
export const variantStock = (
  product: IProductTypeResponse,
  colour: ProductColour | undefined,
  size: string
) => {
  if (!isStockManaged(product)) return Number.POSITIVE_INFINITY;
  const entry = (colour?.stock || []).find((s) => s.size === size);
  return Math.max(0, Number(entry?.stock) || 0);
};

export const colourAvailable = (product: IProductTypeResponse, colour: ProductColour) => {
  if (!isStockManaged(product)) return Number.POSITIVE_INFINITY;
  return (colour.stock || []).reduce((a, s) => a + Math.max(0, Number(s.stock) || 0), 0);
};

/** First colour that still has stock, else the first colour. */
export const defaultColourIndex = (product: IProductTypeResponse) => {
  const colours = product.product_colours || [];
  const idx = colours.findIndex((c) => colourAvailable(product, c) > 0);
  return idx >= 0 ? idx : 0;
};

export const isSingleVariant = (product: IProductTypeResponse) => {
  const colours = product.product_colours || [];
  return colours.length === 1 && colourSizes(colours[0]).length <= 1;
};

export const productBadge = (product: IProductTypeResponse): StatusInfo | null => {
  const stock = productStock(product);
  if (stock <= 0) return { label: "Sold out", tone: "gray" };
  if (Number.isFinite(stock) && stock <= LOW_STOCK_BADGE)
    return { label: `Only ${stock} left`, tone: "yellow" };
  if (isNewProduct(product)) return { label: "New", tone: "blue" };
  return null;
};

export const variantLabel = (colourName: string, size: string) => {
  const parts = [colourName, size && size !== "One size" ? `Size ${size}` : ""].filter(
    Boolean
  );
  return parts.join(" · ");
};

/** Units of one variant already in the cart. */
export const cartQuantityFor = (
  items: ICartItem[],
  productId: string,
  colour: string,
  size: string
) =>
  items
    .filter(
      (i) => i.product_id === productId && i.color === colour && i.size === size
    )
    .reduce((a, i) => a + (Number(i.quantity) || 0), 0);

/** Build the cart payload the checkout (createOrder) expects. */
export const buildCartItem = (
  product: IProductTypeResponse,
  colourIndex: number,
  size: string,
  quantity: number
): StorefrontCartItem => {
  const colours = product.product_colours || [];
  const colour = colours[colourIndex] || colours[0];
  const sizes = colourSizes(colour);
  const stockManaged = isStockManaged(product);
  const colorStocks = colours.reduce<Record<string, { size: string; stock: number }[]>>(
    (acc, c) => {
      acc[c.colour] = (c.stock || []).map((s) => ({ size: s.size, stock: Number(s.stock) }));
      return acc;
    },
    {}
  );
  return {
    name: product.name,
    product_id: `${product.id}`,
    price_amount: Number(product.price_amount) || 0,
    price_currency: product.price_currency || "GHC",
    quantity,
    product_type: product.product_type?.name || "",
    product_category: product.product_category?.name || "",
    image_url: colourImage(colour),
    color: colour?.colour || "",
    colour_name: colourLabel(colour),
    size,
    productColors: Array.from(new Set(colours.map((c) => c.colour))),
    productSizes: sizes,
    sizeStocks: (colour?.stock || []).map((s) => ({ size: s.size, stock: Number(s.stock) })),
    colorStocks,
    stock: stockManaged ? variantStock(product, colour, size) : undefined,
    market_id: product.market_id ? `${product.market_id}` : "",
  };
};

export const isGuestPath = (pathname: string) => pathname.startsWith("/out");

export const shopPath = (guest: boolean) => (guest ? "/out/products" : "/member/market");

export const productPath = (id: string | number, guest: boolean) =>
  guest ? `/out/products/${encodeQuery(id)}` : `/member/market/product/${encodeQuery(id)}`;

export const activeMarketsByEnd = (markets: IMarket[]) =>
  markets
    .filter((m) => getMarketState(m) === "Active")
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());

export type PriceBucket = "" | "u50" | "mid" | "o150";

export const matchesPrice = (price: number, bucket: PriceBucket) =>
  !bucket ||
  (bucket === "u50" ? price < 50 : bucket === "mid" ? price >= 50 && price <= 150 : price > 150);
