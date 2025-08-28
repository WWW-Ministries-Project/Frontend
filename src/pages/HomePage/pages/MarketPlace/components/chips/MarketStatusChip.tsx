import { useMemo } from "react";

import { getMarketStatus } from "../../MarketPlace";

interface IProps {
  start_date: string;
  end_date: string;
}
export const MarketStatusChip = ({ start_date, end_date }: IProps) => {
  const { status, color: colorClass } = useMarketStatus(start_date, end_date);
  return (
    <div>
      <span
        className={`${colorClass} py-1 px-3 text-white group-hover:hidden rounded-xl text-sm capitalize`}
      >
        {status}
      </span>
    </div>
  );
};

const useMarketStatus = (start_date: string, end_date: string) => {
  const { status, color } = useMemo(() => {
    const status = getMarketStatus({
      start_date: start_date,
      end_date: end_date,
    });
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
