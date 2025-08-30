import { image } from "@/pages/HomePage/Components/MultiImageComponent";
import { ICheckoutForm } from "@/pages/HomePage/pages/MarketPlace/components/cart/CheckOutForm";
export interface IMarket {
  name: string;
  description: string;
  event_id: string | number;
  start_date: string;
  end_date: string;
  id: string;
  event_name?: string;
}

export type MarketStatusType = "upcoming" | "active" | "ended";

export interface IProductType {
  name: string;
  id: string;
}

export type ProductColour = {
  colour: string;
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
  product_id: string;
  market_id: string;
}

export interface ICartSlice {
  cartItems: ICartItem[];
  addToCart: (product: ICartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  itemIsInCart: (productId: string) => boolean;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  cartOpen: boolean;
  toggleCart: (value: boolean) => void;
  setCartItems: (items: ICartItem[]) => void;
  updateSection: <T extends "color" | "quantity" | "size">(
    productId: string,
    section: T,
    value: T extends "quantity" ? number : string
  ) => void;
  billinDetails?: ICheckoutForm;
  setBillinDetails: (details: ICheckoutForm) => void;
}

interface IUserDetails {
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
  billing: IUserDetails;
  items: ICartItem[];
}

export interface CheckOutResponse {
  checkoutDirectUrl: string;
  checkoutId: string;
  checkoutUrl: string;
  clientReference: string;
}

export interface IOrders extends ICartItem, IUserDetails {
  payment_status: "pending" | "success" | "failed";
  delivery_status: "pending" | "delivered" | "cancelled";
}
