import { Link } from "react-router-dom";

import type { FulfilmentMethod } from "@/utils";
import { StatusPill } from "@/pages/HomePage/pages/MarketPlace/components/StatusPill";
import {
  formatDate,
  formatMoney,
  type MarketOrder,
} from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";
import { ProductThumb } from "@/pages/MembersPage/components/orders/ProductThumb";
import {
  fulfilmentShortLabel,
  getOrderLifecycle,
  memberStatusPill,
} from "@/pages/MembersPage/utils/orderLifecycle";

interface IProps {
  order: MarketOrder;
  method: FulfilmentMethod;
  total: number;
  detailHref: string;
  onPay: (order: MarketOrder) => void;
  onCancel: (order: MarketOrder) => void;
  isProcessing: boolean;
}

/** One order card in "My orders". The whole card links to the order. */
export function MemberOrderGroup({
  order,
  method,
  total,
  detailHref,
  onPay,
  onCancel,
  isProcessing,
}: IProps) {
  const lifecycle = getOrderLifecycle(order);
  const status = memberStatusPill(order, method);
  const names = Array.from(new Set(order.lines.map((l) => l.name).filter(Boolean))).join(", ");
  const count = `${order.units} ${order.units === 1 ? "item" : "items"}`;

  return (
    <article className="relative overflow-hidden rounded-xl border border-lightGray bg-white transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/30">
      <Link
        to={detailHref}
        aria-label={`View order ${order.orderNumber}`}
        className="absolute inset-0 z-0 focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3.5 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-primary">
          <span>
            <span className="text-primaryGray">Order</span>{" "}
            <b className="font-semibold">{order.orderNumber}</b>
          </span>
          <span>
            <span className="text-primaryGray">Placed</span> {formatDate(order.createdAt)}
          </span>
          <span>
            <span className="text-primaryGray">Total</span>{" "}
            <b className="font-semibold">{formatMoney(total)}</b>
          </span>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="flex gap-2">
          {order.lines.slice(0, 4).map((line) => (
            <ProductThumb
              key={line.id}
              imageUrl={line.imageUrl}
              colour={line.colour}
              alt={line.name}
            />
          ))}
        </div>
        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-semibold text-primary">{names || "Order items"}</p>
          <p className="text-sm text-primaryGray">
            {count} · {fulfilmentShortLabel(method)}
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {lifecycle.canCancel && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onCancel(order)}
              className="min-h-10 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {lifecycle.canPay ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onPay(order)}
              className="min-h-10 rounded-lg bg-primary px-[18px] text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? "Please wait…" : "Pay now"}
            </button>
          ) : (
            <Link
              to={detailHref}
              tabIndex={-1}
              className="inline-flex min-h-10 items-center rounded-lg border border-lightGray bg-white px-[18px] text-sm font-medium text-primary hover:bg-gray-100"
            >
              View details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
