import { image } from '@/pages/HomePage/Components/MultiImageComponent';
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
  id: string;
  price_amount: number;
  price_currency: string;
  quantity: number;
  product_type: string;
  product_category: string;
  image_url: string;
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
}
