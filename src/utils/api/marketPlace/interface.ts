export interface IMarket {
  name: string;
  description: string;
  event_name: string;
  start_date: string;
  end_date: string;
  id: string;
}

export type MarketStatus = "upcoming" | "active" | "ended";

export type IProduct = {
  imageUrl: string;
  title: string;
  status: "published" | "draft";
  type: string;
  category: string;
  price: number;
  stock: number;
  id:string
};
