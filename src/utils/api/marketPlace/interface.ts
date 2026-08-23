import { ICheckoutForm } from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
export interface IMarket {
  name: string;
  description: string;
  event_id: string | number;
  start_date: string;
  end_date: string;
  id: string;
  event_name?: string;
  branch_id?: number | "";
}

export type MarketStatusType =
  | "upcoming"
  | "active"
  | "ended"
  | "Upcoming"
  | "Active"
  | "Ended";

export interface IProductType {
  name: string;
  id: string;
}

export type ProductColour = {
  colour: string;
  colour_name?: string;
  image_url: string | File;
  stock?: {
    size: string;
    stock: string | number;
  }[];
};

export interface IProduct {
  name: string;
  description: string;
  status: "published" | "draft";
  product_type_id: string | number;
  product_category_id: string | number;
  price_amount: string | number;
  price_currency: string;
  market_id?: string;
  stock_managed: "yes" | "no";
  id?: number | string;
  product_colours: ProductColour[];
}

export interface IProductTypeResponse extends IProduct {
  product_category: IProductType;
  product_type: IProductType;
  market: IMarket;
}

export interface ICartItem {
  name: string;
  price_amount: number;
  price_currency: string;
  quantity: number;
  product_type: string;
  product_category: string;
  image_url: string;
  color: string;
  size: string;
  productColors?: string[];
  productSizes?: string[];
  sizeStocks?: { size: string; stock: number }[];
  colorStocks?: Record<string, { size: string; stock: number }[]>;
  stock?: number;
  product_id: string;
  market_id: string;
  item_uuid?: string;
}

export type CartSections = "color" | "quantity" | "size" | "stock";
export interface ICartSlice {
  cartItems: ICartItem[];
  addToCart: (product: ICartItem) => void;
  removeFromCart: (car: string) => void;
  clearCart: () => void;
  itemIsInCart: (productId: string) => boolean;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  cartOpen: boolean;
  toggleCart: (value: boolean) => void;
  /** True only when the drawer was opened by addToCart (not the cart icon). */
  cartAutoCloseArmed: boolean;
  /** Bumped on every addToCart call so an effect keyed on it can restart a
   * 5s auto-close countdown even when cartOpen/cartAutoCloseArmed didn't
   * themselves change value (e.g. adding a 2nd item while already open). */
  cartAddPulse: number;
  /** Opens the drawer as a deliberate user action — never auto-closes. */
  openCartManually: () => void;
  /** Cancels the auto-close countdown for the current open session. */
  disarmAutoClose: () => void;
  setCartItems: (items: ICartItem[]) => void;
  updateSection: <T extends CartSections>(
    productId: string,
    section: T,
    value: T extends "quantity" | "stock" ? number : string
  ) => void;
  updateVariant: (
    identifier: string,
    patch: Partial<
      Pick<ICartItem, "color" | "size" | "stock" | "sizeStocks" | "quantity">
    >
  ) => void;
  billinDetails?: ICheckoutForm;
  setBillinDetails: (details: ICheckoutForm) => void;
}

export interface IUserDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code: string;
}
export interface ICheckOut {
  user_id?: string;
  total_amount: string;
  return_url?: string;
  cancellation_url?: string;
  // Backend field name is `payment_type`, not `payment_method` - see
  // orderService.create in the Backend repo.
  payment_type?: "hubtel" | "paystack";
  billing: IUserDetails;
  items: ICartItem[];
}

export interface CheckOutResponse {
  checkoutDirectUrl: string;
  checkoutId: string;
  checkoutUrl: string;
  clientReference: string;
}

export interface RetryOrderPaymentPayload {
  id: string | number;
  return_url: string;
  cancellation_url: string;
}

export type PaymentStatus = "pending" | "success" | "failed" | "delivered";
export interface IOrders extends ICartItem, IUserDetails {
  payment_status: PaymentStatus;
  delivery_status?: "pending" | "shipped" | "delivered" | "cancelled";
  market_status: MarketStatusType;
  order_number: string;
  order_id?: string | number;
  reference?: string;
  total_amount?: number | string;
  created_at?: string;
  order_created_at?: string;
  ordered_at?: string;
  id: string | number;
  // Backend's flattenOrders attaches the ordered product's full colour list
  // per row so the raw `color` hex can be resolved back to its admin-given
  // name (see ProductGallery's "Colour name" field) — used by the Excel
  // export and anywhere else a human-readable colour is needed.
  product_colours?: ProductColour[];
}

// Unflattened order shape returned by GET /orders/get-order-by-id — one
// order with a real items[] array, as opposed to IOrders which is one
// flattened order+item row (mirrors the Backend's flattenOrders output used
// for order lists).
export interface IOrderItem {
  id: number;
  name: string;
  image_url: string;
  color: string;
  size: string;
  price_amount: number;
  price_currency: string;
  quantity: number;
  product_type: string;
  product_category: string;
  product_id?: number | null;
  product_colour_id?: number | null;
  size_id?: number | null;
  market_id?: number | null;
}

export interface IOrderBillingDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  country_code?: string;
}

export interface IOrderDetail {
  id: number;
  order_number: string;
  total_amount: number;
  payment_status: PaymentStatus;
  delivery_status: "pending" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  reference: string;
  items: IOrderItem[];
  billing_details?: IOrderBillingDetails | null;
}

export type OrderItemEditPayload = {
  id: number;
  quantity: number;
  color: string;
  size: string;
  price_amount: number;
  removed?: boolean;
};

export interface IUpdateOrderPayload {
  id: number | string;
  billing?: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    country: string;
    country_code: string;
  }>;
  payment_status?: "pending" | "success" | "failed";
  delivery_status?: "pending" | "shipped" | "delivered" | "cancelled";
  items?: OrderItemEditPayload[];
}

export interface ICreateOrderForMemberPayload {
  user_id: number;
  billing: IUserDetails;
  items: {
    market_id: number | string;
    id: number | string;
    name: string;
    price_amount: number;
    price_currency: string;
    quantity: number;
    product_type: string;
    product_category: string;
    image_url: string;
    color: string;
    size: string;
  }[];
  payment_mode: "manual" | "gateway";
  manual_status?: "success" | "pending";
  payment_type?: "paystack" | "hubtel";
  return_url?: string;
  cancellation_url?: string;
}

export interface IProductSlice {
  products: IProductTypeResponse[];
  setProducts: (products: IProductTypeResponse[]) => void;
  loading:boolean
  setLoading: (loading: boolean) => void;
  error:Error | null
  setError: (error: Error | null) => void;
}
