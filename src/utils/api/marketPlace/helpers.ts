import type { MarketStatus } from "./interface";


export const getMarketStatus = (
  start_date: string,
  end_date: string
): MarketStatus => {
  const now = new Date().getTime();
  const start = new Date(start_date).getTime();
  const end = new Date(end_date).getTime();

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
