import { MarketStatus } from "./interface";

export interface IStatus{
  start_date:string,
  end_date:string
}
export const getMarketStatus = (status: IStatus): MarketStatus => {
  const now = new Date().getTime();
  const start = new Date(status.start_date).getTime();
  const end = new Date(status.end_date).getTime();

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "ended";
};

export const getStatusColor = (status: MarketStatus) => {
  switch (status) {
    case "active":
      return "bg-[#34C759]";
    case "ended":
      return "bg-red-500";
    case "upcoming":
    default:
      return "bg-blue-400";
  }
};
