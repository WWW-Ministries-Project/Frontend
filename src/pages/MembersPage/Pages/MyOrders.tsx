import { useCallback, useMemo, useState } from "react";

import { useFetch } from "@/CustomHooks/useFetch";
import { PaginationComponent } from "@/pages/HomePage/Components/reusable/PaginationComponent";
import { showNotification } from "@/pages/HomePage/utils";
import { MemberOrderGroup } from "@/pages/MembersPage/components/MemberOrderGroup";
import { api, decodeToken, IOrders, relativePath } from "@/utils";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";

const PAGE_SIZE = 10;

export const MyOrders = () => {
  const user = decodeToken();
  const userId = user?.id ? String(user.id) : "";
  const { data, loading, error, refetch } = useFetch(
    api.fetch.fetchOrdersByUser,
    userId ? { user_id: userId } : undefined,
    !userId
  );
  const [processingKeys, setProcessingKeys] = useState<Set<string>>(
    new Set()
  );
  const [page, setPage] = useState(1);

  const markProcessing = useCallback((key: string) => {
    setProcessingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const unmarkProcessing = useCallback((key: string) => {
    setProcessingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const memberOrders = useMemo<IOrders[]>(() => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return [...data].sort((a, b) => Number(b.id) - Number(a.id));
    }

    const apiData = (data as { data?: IOrders[] }).data;
    if (Array.isArray(apiData)) {
      return [...apiData].sort((a, b) => Number(b.id) - Number(a.id));
    }

    return [];
  }, [data]);

  const getOrderKey = useCallback((order: IOrders) => {
    return String(
      order.order_number || order.reference || order.order_id || order.id
    );
  }, []);

  // Group the flattened one-row-per-line-item rows by order_number, in
  // descending order (newest order first, preserving memberOrders' sort).
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, IOrders[]>();
    for (const order of memberOrders) {
      const key = getOrderKey(order);
      const existing = groups.get(key);
      if (existing) existing.push(order);
      else groups.set(key, [order]);
    }
    return Array.from(groups.entries()).map(([orderNumber, rows]) => ({
      orderNumber,
      rows,
    }));
  }, [memberOrders, getOrderKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(groupedOrders.length / PAGE_SIZE)),
    [groupedOrders.length]
  );
  // groupedOrders can shrink out from under `page` (e.g. cancelling the only
  // order on the last page) without `page` itself being re-clamped, so slice
  // using an effective page that's always within range.
  const effectivePage = Math.min(page, totalPages);

  const pagedGroups = useMemo(() => {
    const start = (effectivePage - 1) * PAGE_SIZE;
    return groupedOrders.slice(start, start + PAGE_SIZE);
  }, [groupedOrders, effectivePage]);

  const handleRetryPayment = useCallback(
    async (selectedOrder: IOrders) => {
      if ((selectedOrder.payment_status || "").toLowerCase() !== "pending") {
        showNotification("This order is already paid.", "error");
        return;
      }

      const orderKey = getOrderKey(selectedOrder);
      markProcessing(orderKey);

      const retryOrderId = String(selectedOrder.order_id || selectedOrder.id || "").trim();
      if (!retryOrderId) {
        showNotification("Unable to process payment for this order.", "error");
        unmarkProcessing(orderKey);
        return;
      }

      const payload = {
        id: retryOrderId,
        cancellation_url: `${window.location.origin}${relativePath.member.orders}`,
        return_url: `${window.location.origin}${relativePath.member.verify_payment}`,
      };

      try {
        const response = await api.post.retryOrderPayment(payload);
        const checkoutUrl = response?.data?.checkoutUrl;

        if (!checkoutUrl) {
          showNotification("Unable to start payment checkout.", "error");
          return;
        }

        window.location.href = checkoutUrl;
      } catch (error: unknown) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { message?: string } } })
            .response?.data?.message === "string"
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : "Failed to initiate payment.";

        showNotification(message || "Failed to initiate payment.", "error");
      } finally {
        unmarkProcessing(orderKey);
      }
    },
    [getOrderKey, markProcessing, unmarkProcessing]
  );

  const handleCancelOrder = useCallback(
    async (selectedOrder: IOrders) => {
      const orderKey = getOrderKey(selectedOrder);
      markProcessing(orderKey);

      const orderId = String(selectedOrder.order_id || selectedOrder.id || "").trim();
      if (!orderId) {
        showNotification("Unable to cancel this order.", "error");
        unmarkProcessing(orderKey);
        return;
      }

      try {
        await api.put.cancelOrder({ id: orderId });
        showNotification("Order cancelled.", "success");
        await refetch();
      } catch (error: unknown) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { message?: string } } })
            .response?.data?.message === "string"
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : "Failed to cancel order.";

        showNotification(message || "Failed to cancel order.", "error");
      } finally {
        unmarkProcessing(orderKey);
      }
    },
    [getOrderKey, markProcessing, unmarkProcessing, refetch]
  );

  if (loading) {
    return <OrdersSkeleton />;
  }

  if (error) {
    return <EmptyState scope="page" msg="Failed to load your orders" />;
  }

  if (groupedOrders.length === 0) {
    return <EmptyState scope="page" msg="You have not placed any orders yet" />;
  }

  return (
    <div className="rounded-xl bg-white">
      {pagedGroups.map(({ orderNumber, rows }) => (
        <MemberOrderGroup
          key={orderNumber}
          orderNumber={orderNumber}
          rows={rows}
          onPay={handleRetryPayment}
          onCancel={handleCancelOrder}
          isProcessing={processingKeys.has(orderNumber)}
        />
      ))}

      <PaginationComponent
        total={groupedOrders.length}
        take={PAGE_SIZE}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};

function OrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="rounded-xl bg-white"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading your orders"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border-b border-lightGray py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-lightGray/20 px-4 py-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>

          <div className="flex gap-4 px-4 py-4">
            <Skeleton className="h-16 w-16 flex-shrink-0 rounded-lg" />
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
