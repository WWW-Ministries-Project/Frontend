import { CalendarIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import type { IMarket } from "@/utils/api/marketPlace/interface";
import { StatusPill } from "../StatusPill";
import {
  formatDate,
  formatMoney,
  getMarketState,
  marketStatePill,
} from "../../utils/marketplaceModel";
import { btnPrimary } from "../markets/styles";

interface IProps {
  market: IMarket;
  products?: number;
  orders?: number;
  revenue?: number;
  canManage: boolean;
  canDelete: boolean;
  onEdit: (market: IMarket) => void;
  onDuplicate: (market: IMarket) => void;
  onDelete: (market: IMarket) => void;
  onOpen: (market: IMarket) => void;
}

const Stat = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="min-w-0">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="whitespace-nowrap font-semibold">{value ?? "—"}</p>
  </div>
);

export function MarketCard({
  market,
  products,
  orders,
  revenue,
  canManage,
  canDelete,
  onEdit,
  onDuplicate,
  onDelete,
  onOpen,
}: IProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const state = getMarketState(market);
  const showMenu = canManage || canDelete;

  const menuItem =
    "block w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-gray-100";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 text-primary shadow-sm transition-shadow hover:shadow-[0_8px_24px_rgba(8,13,45,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {market.event_name && (
            <p className="truncate text-xs uppercase tracking-wider text-primaryGray">
              {market.event_name}
            </p>
          )}
          <button
            type="button"
            onClick={() => onOpen(market)}
            className="text-left text-lg font-semibold hover:underline"
          >
            {market.name}
          </button>
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <StatusPill status={marketStatePill(state)} />
          {showMenu && (
            <button
              type="button"
              aria-label="Market options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex size-8 items-center justify-center rounded-lg text-lg text-primaryGray hover:bg-gray-100"
            >
              ⋯
            </button>
          )}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-[41] mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
              >
                {canManage && (
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(market);
                    }}
                  >
                    Edit
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    role="menuitem"
                    className={menuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(market);
                    }}
                  >
                    Duplicate
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    className={`${menuItem} text-red-700`}
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(market);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {market.description && (
        <p className="line-clamp-2 text-sm text-primaryGray">
          {market.description}
        </p>
      )}

      <p className="flex items-center gap-2 text-sm">
        <CalendarIcon className="size-[18px] shrink-0" />
        {formatDate(market.start_date)} – {formatDate(market.end_date)}
      </p>

      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-200 pt-4">
        <Stat label="Products" value={products} />
        <Stat label="Orders" value={orders} />
        <Stat
          label="Revenue"
          value={revenue === undefined ? undefined : formatMoney(revenue)}
        />
      </div>

      <button type="button" className={btnPrimary} onClick={() => onOpen(market)}>
        Manage store
      </button>
    </div>
  );
}
