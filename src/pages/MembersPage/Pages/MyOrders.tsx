import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { Skeleton } from "@/components/Skeleton";
import { PaginationComponent } from "@/pages/HomePage/Components/reusable/PaginationComponent";
import { encodeQuery } from "@/pages/HomePage/utils";
import {
  groupOrderRows,
  type MarketOrder,
} from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";
import { MemberOrderGroup } from "@/pages/MembersPage/components/MemberOrderGroup";
import {
  cancelOrderRequest,
  confirmCancelOrder,
  startOrderPayment,
} from "@/pages/MembersPage/components/orders/orderActions";
import { resolveFulfilment } from "@/pages/MembersPage/utils/orderLifecycle";
import { api, decodeToken, relativePath, type IOrders } from "@/utils";

const PAGE_SIZE = 10;

type OrderRow = IOrders & { delivery_fee?: number | string | null };

export const MyOrders = () => {
  const navigate = useNavigate();
  const user = decodeToken();
  const userId = user?.id ? String(user.id) : "";
  const { data, loading, error, refetch } = useFetch(
    api.fetch.fetchOrdersByUser,
    userId ? { user_id: userId } : undefined,
    !userId
  );
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const setBusy = useCallback((key: string, busy: boolean) => {
    setProcessing((prev) => {
      const next = new Set(prev);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const rows = useMemo<OrderRow[]>(() => {
    const list = Array.isArray(data)
      ? (data as OrderRow[])
      : (data as { data?: OrderRow[] } | null)?.data;
    return Array.isArray(list) ? list : [];
  }, [data]);

  // Newest first; groupOrderRows keeps the order it receives.
  const orders = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => Number(b.order_id ?? b.id) - Number(a.order_id ?? a.id)
    );
    const firstRow = new Map<string, OrderRow>();
    sorted.forEach((row) => {
      const key = String(row.order_id ?? row.order_number ?? row.id);
      if (!firstRow.has(key)) firstRow.set(key, row);
    });
    return groupOrderRows(sorted).map((order) => {
      const row =
        firstRow.get(String(order.id)) ?? firstRow.get(order.orderNumber);
      const method = resolveFulfilment(row);
      // order.total already folds in order_total / delivery_fee; a row's
      // total_amount is the per-item line total, not the order total.
      return { order, method, total: order.total };
    });
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const paged = orders.slice(
    (effectivePage - 1) * PAGE_SIZE,
    effectivePage * PAGE_SIZE
  );

  const handlePay = useCallback(
    async (order: MarketOrder) => {
      const key = order.orderNumber;
      setBusy(key, true);
      const redirecting = await startOrderPayment(order.id);
      if (!redirecting) setBusy(key, false);
    },
    [setBusy]
  );

  const handleCancel = useCallback(
    (order: MarketOrder) => {
      confirmCancelOrder(order.orderNumber, async () => {
        const key = order.orderNumber;
        setBusy(key, true);
        const ok = await cancelOrderRequest(order.id);
        setBusy(key, false);
        if (ok) await refetch();
      });
    },
    [refetch, setBusy]
  );

  const detailHref = (order: MarketOrder) =>
    `${relativePath.member.market}orders/${encodeQuery(String(order.id))}`;

  const count = orders.length;

  return (
    <div className="flex w-full flex-col gap-5 text-primary">
      <div>
        <h1 className="text-2xl font-semibold leading-8">
          My orders
          {count > 0 && (
            <span className="ml-2 text-base font-normal text-primaryGray">
              ({count})
            </span>
          )}
        </h1>
        <p className="text-primaryGray">Track purchases from church markets.</p>
      </div>

      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-lightGray bg-white px-6 py-12 text-center"
        >
          <h2 className="text-lg font-semibold">We couldn’t load your orders</h2>
          <p className="text-primaryGray">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 min-h-10 rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-lightGray bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">No orders yet</h2>
          <p className="text-primaryGray">
            When you buy from a church market it will show up here.
          </p>
          <button
            type="button"
            onClick={() => navigate(relativePath.member.market)}
            className="mt-2 min-h-10 rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90"
          >
            Start shopping
          </button>
        </div>
      ) : (
        <>
          {paged.map(({ order, method, total }) => (
            <MemberOrderGroup
              key={order.orderNumber}
              order={order}
              method={method}
              total={total}
              detailHref={detailHref(order)}
              onPay={handlePay}
              onCancel={handleCancel}
              isProcessing={processing.has(order.orderNumber)}
            />
          ))}
          {count > PAGE_SIZE && (
            <PaginationComponent
              total={count}
              take={PAGE_SIZE}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </>
      )}
    </div>
  );
};

function OrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-lightGray bg-white"
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3.5">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading your orders…</span>
    </div>
  );
}
