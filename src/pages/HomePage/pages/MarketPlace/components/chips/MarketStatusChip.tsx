import { useMemo } from "react";

import { compareDates, type MarketStatusType } from "@/utils";

interface IProps {
  start_date: string;
  end_date: string;
}
export const MarketStatusChip = ({ start_date, end_date }: IProps) => {
  const { status, color: colorClass } = useMarketStatus(start_date, end_date);
  return (
    <div>
      <span
        className={`${colorClass} py-1 px-3 text-white rounded-xl text-sm capitalize`}
      >
        {status}
      </span>
    </div>
  );
};

const useMarketStatus = (start_date: string, end_date: string) => {
  const { status, color } = useMemo(() => {
    let status: MarketStatusType;

    if (compareDates(start_date)) {
      status = "upcoming";
    } else if (compareDates(end_date)) {
      status = "active";
    } else {
      status = "ended";
    }

    const color =
      status === "active"
        ? "bg-[#34C759]"
        : status === "ended"
        ? "bg-red-500"
        : "bg-blue-400";

    return { status, color };
  }, [start_date, end_date]);

  return { status, color };
};
