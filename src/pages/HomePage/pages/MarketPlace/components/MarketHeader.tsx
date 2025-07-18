import {
  getMarketStatus,
  getStatusColor,
} from "@/utils/api/marketPlace/helpers";
import { IMarket } from "@/utils/api/marketPlace/interface";
import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { MarketStatusChip } from "./chips/MarketStatusChip";

interface HeaderProps {
  market: IMarket;
}

export function MarketHeader({ market }: HeaderProps) {
  const { name, description, end_date, start_date } = market;
  return (
    <div className="bg-primary text-white rounded-t-2xl p-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{name}</h2>
        <MarketStatusChip start_date={start_date} end_date={end_date} />
      </div>
      <p className="text-sm mt-1">{description}</p>

      <div className="flex items-center gap-4 mt-4 text-sm text-gray-200">
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-4 w-4" />
          <span>{"location"}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {start_date} to {end_date}
          </span>
        </div>
      </div>
    </div>
  );
}
