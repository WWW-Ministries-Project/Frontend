import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

import { useFetch } from "@/CustomHooks/useFetch";
import { Button } from "@/components";
import { Orders } from "@/pages/HomePage/pages/MarketPlace/components/Orders/Orders";
import { getBaseOrderColumns } from "@/pages/HomePage/pages/MarketPlace/components/Orders/OrdersTableColumns";
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
            onClick={() => handleRetryPayment(order)}
          />
        );
      },
    };

    return getBaseOrderColumns([actionColumn]);
  }, [getOrderKey, handleRetryPayment, processingOrderKey]);

  return (
    <Orders
      orders={memberOrders}
      tableColumns={tableColumns}
      searchCustomer={false}
      defaultMarketStatus="active"
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
  );
};
