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
