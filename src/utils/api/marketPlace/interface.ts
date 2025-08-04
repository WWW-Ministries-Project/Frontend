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

export type IProduct = {
  product_name: string;
  description: string;
  status: "published" | "draft";
  type: string;
  category: string;
  price: string;
  id: string;
};

export interface IProductType {
  name: string;
  id: string;
}

export type ProductColour = {
  colour: string;
  image_url: string | File;
  stock: {
    size: string;
    stock: string | number;
  }[];
};

export type ProductType = {
  name: string;
  description: string;
  status: "published" | "draft";
  product_type_id: string | number;
  product_category_id: string | number;
  price_amount: string | number;
  price_currency: string;
  market_id: number;
  stock_managed: "yes" | "no";
  id?: number | string;
  product_colours: ProductColour[];
};

type BooleanValues = {
  published: boolean;
  stock_managed: boolean;
};

export type ProductResponse = Omit<ProductType, "status" | "stock_managed"> &
  BooleanValues;
