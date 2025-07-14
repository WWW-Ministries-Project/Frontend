import {
  getMarketStatus,
  getStatusColor,
  IStatus,
} from "@/utils/api/marketPlace/helpers";

export function MarketStatusChip({ start_date, end_date }: IStatus) {
  const status = getMarketStatus({ start_date, end_date });
  const colorClass = getStatusColor(status);
  return (
    <div>
      <span
        className={`${colorClass} py-1 px-3 text-white rounded-xl text-sm capitalize`}
      >
        {status}
      </span>
    </div>
  );
}
