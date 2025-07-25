export interface IMarket {
  name: string;
  description: string;
  event_id: string | number;
  start_date: string;
  end_date: string;
  id: string;
  event_name:string
}

export type MarketStatusType = "upcoming" | "active" | "ended";

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
