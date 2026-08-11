import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { useFetch } from "@/CustomHooks/useFetch";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { Orders } from "@/pages/HomePage/pages/MarketPlace/components/Orders/Orders";
import { getBaseOrderColumns } from "@/pages/HomePage/pages/MarketPlace/components/Orders/OrdersTableColumns";
import { OrderStatusTimeline } from "@/pages/HomePage/pages/MarketPlace/components/Orders/OrderStatusTimeline";
import { showNotification } from "@/pages/HomePage/utils";
import {
  api,
  decodeToken,
  IOrders,
  relativePath,
} from "@/utils";

export const MyOrders = () => {
  const user = decodeToken();
  const userId = user?.id ? String(user.id) : "";
  const { data } = useFetch(
    api.fetch.fetchOrdersByUser,
    userId ? { user_id: userId } : undefined,
    !userId
  );
  const [processingOrderKey, setProcessingOrderKey] = useState<string | null>(
    null
  );
  const [viewingOrder, setViewingOrder] = useState<IOrders | null>(null);

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

  const handleRetryPayment = useCallback(
    async (selectedOrder: IOrders) => {
      if ((selectedOrder.payment_status || "").toLowerCase() !== "pending") {
        showNotification("This order is already paid.", "error");
        return;
      }

      const orderKey = getOrderKey(selectedOrder);
      setProcessingOrderKey(orderKey);

      const retryOrderId = String(selectedOrder.order_id || selectedOrder.id || "").trim();
      if (!retryOrderId) {
        showNotification("Unable to process payment for this order.", "error");
        setProcessingOrderKey(null);
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
        setProcessingOrderKey(null);
      }
    },
    [getOrderKey]
  );

  const tableColumns = useMemo(() => {
    const actionColumn: ColumnDef<IOrders> = {
      header: "Action",
      cell: ({ row }) => {
        const order = row.original;
        const orderKey = getOrderKey(order);
        const isPending = (order.payment_status || "").toLowerCase() === "pending";

        if (!isPending) {
          return <span className="text-xs text-gray-400">Paid</span>;
        }

        return (
          <Button
            value="Pay now"
            className="min-h-8 px-3 py-1 text-xs"
            loading={processingOrderKey === orderKey}
            disabled={processingOrderKey !== null}
            onClick={(e) => {
              e?.stopPropagation?.();
              handleRetryPayment(order);
            }}
          />
        );
      },
    };

    return getBaseOrderColumns([actionColumn]);
  }, [getOrderKey, handleRetryPayment, processingOrderKey]);

  return (
    <>
      <Orders
        orders={memberOrders}
        tableColumns={tableColumns}
        searchCustomer={false}
        defaultMarketStatus="active"
        onRowClick={(order) => setViewingOrder(order)}
        renderOrderAction={(order) => {
          const orderKey = getOrderKey(order);
          const isPending = (order.payment_status || "").toLowerCase() === "pending";

          if (!isPending) {
            return <p className="text-xs text-gray-500">Payment completed</p>;
          }

          return (
            <Button
              value="Pay now"
              className="w-full"
              loading={processingOrderKey === orderKey}
              disabled={processingOrderKey !== null}
              onClick={() => handleRetryPayment(order)}
            />
          );
        }}
      />

      <Modal
        open={Boolean(viewingOrder)}
        persist={false}
        onClose={() => setViewingOrder(null)}
        className="max-w-lg"
      >
        {viewingOrder && (
          <div className="space-y-5 p-6 text-primary">
            <div>
              <h3 className="text-lg font-bold">{viewingOrder.order_number}</h3>
              <p className="text-sm text-primaryGray">
                {viewingOrder.name} · Qty {viewingOrder.quantity}
              </p>
            </div>

            <OrderStatusTimeline
              paymentStatus={viewingOrder.payment_status}
              deliveryStatus={viewingOrder.delivery_status}
            />

            <div className="rounded-lg border border-lightGray p-4 space-y-1 text-sm">
              <p className="flex items-center justify-between gap-3">
                <span className="font-medium">Total</span>
                <span className="min-w-0 break-words text-right">
                  GHC{" "}
                  {(
                    Number(viewingOrder.price_amount || 0) *
                    Number(viewingOrder.quantity || 0)
                  ).toFixed(2)}
                </span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="font-medium">Billed to</span>
                <span className="min-w-0 break-words text-right">
                  {viewingOrder.first_name} {viewingOrder.last_name}
                </span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span className="font-medium">Email</span>
                <span className="min-w-0 break-words text-right">{viewingOrder.email}</span>
              </p>
            </div>

            {(viewingOrder.payment_status || "").toLowerCase() === "pending" && (
              <Button
                value="Pay now"
                className="w-full"
                loading={processingOrderKey === getOrderKey(viewingOrder)}
                disabled={processingOrderKey !== null}
                onClick={() => handleRetryPayment(viewingOrder)}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
