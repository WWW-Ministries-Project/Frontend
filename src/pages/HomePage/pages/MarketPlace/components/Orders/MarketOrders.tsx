import { useFetch } from "@/CustomHooks/useFetch";
import { Orders } from "./Orders";
import { api, IOrders } from "@/utils";
import { useParams } from "react-router-dom";
import { decodeQuery } from "@/pages/HomePage/utils";
import { getBaseOrderColumns } from "./OrdersTableColumns";
import { useMemo, useState } from "react";
import { Button } from "@/components";
import { showNotification } from "@/pages/HomePage/utils";

const getOrderTimestamp = (order: IOrders) => {
  return order.created_at || order.order_created_at || order.ordered_at || "";
};

const formatOrderDateTime = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export function MarketOrders() {
  const { id } = useParams();
  const market_id = decodeQuery(String(id));
  const { data, refetch } = useFetch(api.fetch.fetchOrdersByMarket, { market_id });
  const [isReconciling, setIsReconciling] = useState(false);

  const handleReconcilePendingPayments = async () => {
    setIsReconciling(true);
    try {
      const response = await api.post.reconcileHubtelPendingPayments(100);
      const message =
        typeof response?.message === "string"
          ? response.message
          : "Payment reconciliation completed.";
      showNotification(message, "success");
      await refetch({ market_id });
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Unable to reconcile pending payments.";
      showNotification(message || "Unable to reconcile pending payments.", "error");
    } finally {
      setIsReconciling(false);
    }
  };
  const tableColumns = useMemo(() => {
    return getBaseOrderColumns([
      {
        header: "Name",
        cell: ({ row }) => {
          const full_name = `${row.original.first_name} ${row.original.last_name}`;
          return (
            <div>
              <p>
                {`${full_name}`}
              </p>
               <p className="text-xs">{row.original.email}</p>
            </div>
          );
        },
      },
      {
        header: "Location",
        accessorKey: "country",
      },
      {
        header: "Phone",
        accessorKey: "phone_number",
      },
      {
        header: "Order Date & Time",
        cell: ({ row }) => {
          const timestamp = getOrderTimestamp(row.original);
          return <span>{formatOrderDateTime(timestamp)}</span>;
        },
      },
    ]);
  }, []);

  return (
    <div className="mb-10">
      <Orders
        orders={data?.data || []}
        tableColumns={tableColumns}
        showExport
        enableOrderDateFilter
        headerAction={
          <Button
            value="Reconcile Payments"
            variant="secondary"
            loading={isReconciling}
            disabled={isReconciling}
            onClick={handleReconcilePendingPayments}
          />
        }
      />
    </div>
  );
}
