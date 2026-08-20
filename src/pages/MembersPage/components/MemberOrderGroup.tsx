import { Link } from "react-router-dom";

import { Button } from "@/components";
import { encodeQuery } from "@/pages/HomePage/utils";
import { relativePath } from "@/utils";
import type { IOrders } from "@/utils";
import { getOrderLifecycle } from "@/pages/MembersPage/utils/orderLifecycle";

const formatMoney = (amount: number) => `₵ ${amount.toFixed(2)}`;

const formatOrderDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

interface IProps {
  orderNumber: string;
  rows: IOrders[];
  onPay: (order: IOrders) => void;
  onCancel: (order: IOrders) => void;
  isProcessing: boolean;
}

export function MemberOrderGroup({
  orderNumber,
  rows,
  onPay,
  onCancel,
  isProcessing,
}: IProps) {
  const first = rows[0];
  const lifecycle = getOrderLifecycle(first);
  const orderTotal = rows.reduce(
    (sum, row) => sum + Number(row.price_amount || 0) * Number(row.quantity || 0),
    0
  );
  const detailHref = `${relativePath.member.market}orders/${encodeQuery(
    String(first.order_id ?? first.id)
  )}`;

  return (
    <div className="border-b border-lightGray py-4">
      <div className="flex flex-col gap-3 bg-lightGray/20 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-primaryGray">Order date: </span>
            <span className="font-semibold text-primary">
              {formatOrderDate(first.created_at || first.order_created_at || first.ordered_at)}
            </span>
          </p>
          <p>
            <span className="text-primaryGray">Order NO: </span>
            <span className="font-semibold text-primary">{orderNumber}</span>
          </p>
        </div>

        {(lifecycle.canPay || lifecycle.canCancel) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {lifecycle.canPay && (
              <Button
                value="Pay Now"
                loading={isProcessing}
                disabled={isProcessing}
                onClick={() => onPay(first)}
                className="w-full sm:w-auto"
              />
            )}
            {lifecycle.canCancel && (
              <Button
                value="Cancel Order"
                variant="secondary"
                disabled={isProcessing}
                onClick={() => onCancel(first)}
                className="w-full sm:w-auto"
              />
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-lightGray/60 px-4">
        {rows.map((row, index) => {
          const isLastRow = index === rows.length - 1;
          return (
            <div
              key={`${orderNumber}-${row.id}-${index}`}
              className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:gap-4"
            >
              <div className="flex gap-4 md:min-w-0 md:flex-1">
                <img
                  src={row.image_url}
                  alt={row.name}
                  className="h-16 w-16 flex-shrink-0 rounded-lg border border-lightGray object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-primary">{row.name}</p>
                  <p className="text-sm text-primaryGray">{row.color}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:flex md:w-auto md:flex-shrink-0 md:gap-4">
                <div className="md:w-16 md:text-center">
                  <p className="text-primaryGray">Qty</p>
                  <p className="font-semibold text-primary">X{row.quantity}</p>
                </div>

                <div className="md:w-24 md:text-center">
                  <p className="text-primaryGray">Price</p>
                  <p className="font-semibold text-primary">
                    {formatMoney(Number(row.price_amount || 0))}
                  </p>
                </div>
              </div>

              {isLastRow && (
                <div className="border-t border-lightGray/60 pt-3 text-sm md:w-40 md:flex-shrink-0 md:border-t-0 md:pt-0 md:text-right">
                  <p className="font-semibold text-primary">Total Price:</p>
                  <p className="text-lg font-bold text-primary">{formatMoney(orderTotal)}</p>
                  <p className="mt-1 text-primaryGray">{lifecycle.label}</p>
                  <Link to={detailHref} className="font-medium text-primary underline">
                    View Order &gt;
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
