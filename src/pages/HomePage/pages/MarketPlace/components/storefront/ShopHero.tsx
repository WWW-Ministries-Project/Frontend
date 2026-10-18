import type { IMarket } from "@/utils";
import { cn } from "@/utils/cn";

import { daysLeft, formatDate } from "../../utils/marketplaceModel";

interface IProps {
  market: IMarket;
  secondary?: IMarket | null;
  secondaryCount: number;
  onShop: (marketId: string) => void;
}

const leftLabel = (m: IMarket) => {
  const n = daysLeft(m);
  if (n <= 0) return "Last day";
  return `${n} ${n === 1 ? "day" : "days"} left`;
};

/** Featured market banner (soonest-ending active market) + "Also open" card. */
export function ShopHero({ market, secondary, secondaryCount, onShop }: IProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        secondary && "min-[900px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      )}
    >
      <div className="flex min-h-[220px] flex-col justify-between gap-6 rounded-2xl bg-primary p-8 text-white">
        <div className="flex flex-col gap-2.5">
          <span className="self-start rounded-full bg-white/[0.14] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.05em]">
            Featured market · {leftLabel(market)}
          </span>
          <h1 className="text-balance text-[32px] font-semibold leading-10">{market.name}</h1>
          {market.description && (
            <p className="max-w-[520px] text-pretty text-white/[0.82]">{market.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onShop(String(market.id))}
            className="min-h-11 rounded-lg bg-white px-[22px] py-2.5 text-sm font-semibold text-primary hover:bg-gray-200"
          >
            Shop the collection
          </button>
          <span className="text-sm text-white/[0.82]">Open until {formatDate(market.end_date)}</span>
        </div>
      </div>

      {secondary && (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-lightGray bg-white p-6 text-primary shadow-[0_8px_24px_rgba(8,13,45,0.06)]">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-primaryGray">
              Also open
            </p>
            <h2 className="text-xl font-semibold">{secondary.name}</h2>
            {secondary.description && (
              <p className="text-pretty text-sm text-primaryGray">{secondary.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-primaryGray">Until {formatDate(secondary.end_date)}</p>
            <button
              type="button"
              onClick={() => onShop(String(secondary.id))}
              className="min-h-10 rounded-lg border border-lightGray bg-white text-sm font-medium text-primary hover:bg-gray-100"
            >
              Browse {secondaryCount} {secondaryCount === 1 ? "item" : "items"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
