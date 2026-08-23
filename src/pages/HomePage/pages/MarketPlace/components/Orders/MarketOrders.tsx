import { useFetch } from "@/CustomHooks/useFetch";
import { usePut } from "@/CustomHooks/usePut";
import { useDelete } from "@/CustomHooks/useDelete";
import { usePost } from "@/CustomHooks/usePost";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { Orders } from "./Orders";
import { Modal } from "@/components/Modal";
import { api, IOrders } from "@/utils";
import type {
  IOrderDetail,
  IUpdateOrderPayload,
  ICreateOrderForMemberPayload,
} from "@/utils/api/marketPlace/interface";
import { useParams } from "react-router-dom";
import { decodeQuery, showDeleteDialog } from "@/pages/HomePage/utils";
import { getBaseOrderColumns } from "./OrdersTableColumns";
import { EditOrderModal } from "./EditOrderModal";
import { CreateOrderForMemberModal } from "./CreateOrderForMemberModal";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import { ActionsMenu } from "@/pages/HomePage/Components/reusable/ActionsMenu";
import { showNotification } from "@/pages/HomePage/utils";

/**
 * usePut/useDelete store the raw Axios error (typed as Error, but with
 * .response.data.message still present at runtime) rather than extracting
 * the server's message the way usePost does — without this, every
 * carefully-worded Backend validation message (stock shortages, "cannot
 * remove every item", etc.) would be replaced by a generic "Request failed
 * with status code 400". Same extraction pattern already used by this
 * file's own handleReconcilePendingPayments, below.
 */
const extractErrorMessage = (error: unknown, fallback: string): string => {
  const message =
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
      ? (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message
      : error instanceof Error
      ? error.message
      : undefined;
  return message || fallback;
};

const DELIVERY_STATUS_OPTIONS: IOrders["delivery_status"][] = [
  "pending",
  "shipped",
  "delivered",
  "cancelled",
];

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
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<IOrderDetail | null>(null);
  const [showCreateForMember, setShowCreateForMember] = useState(false);
  const [createForMemberCheckoutUrl, setCreateForMemberCheckoutUrl] = useState<
    string | null
  >(null);
  const { canAdmin, canManage } = useAccessControl();

  const {
    data: deliveryStatusResponse,
    error: deliveryStatusError,
    loading: isUpdatingDeliveryStatus,
    updateData: updateDeliveryStatus,
  } = usePut(api.put.updateOrderDeliveryStatus);

  const { data: orderDetailResponse, refetch: fetchOrderDetail } = useFetch(
    api.fetch.fetchOrderById,
    {},
    true
  );

  const {
    data: updatedOrderResponse,
    error: updateOrderError,
    loading: isUpdatingOrder,
    updateData: submitUpdateOrder,
  } = usePut(api.put.updateOrder);

  const {
    executeDelete: executeDeleteOrder,
    error: deleteOrderError,
    success: deleteOrderSuccess,
  } = useDelete(api.delete.deleteOrder);
  const {
    executeDelete: executeBulkDeleteOrders,
    data: bulkDeleteResult,
    error: bulkDeleteError,
    success: bulkDeleteSuccess,
  } = useDelete(api.delete.bulkDeleteOrders);

  const {
    data: createdOrderResponse,
    error: createOrderError,
    loading: isCreatingOrder,
    postData: submitCreateOrderForMember,
  } = usePost(api.post.createOrderForMember);

  useEffect(() => {
    if (orderDetailResponse?.data) {
      setEditingOrder(orderDetailResponse.data as IOrderDetail);
    }
  }, [orderDetailResponse]);

  useEffect(() => {
    if (!updatedOrderResponse) return;
    showNotification("Order updated successfully", "success");
    setEditingOrder(null);
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedOrderResponse]);

  useEffect(() => {
    if (!updateOrderError) return;
    showNotification(extractErrorMessage(updateOrderError, "Unable to update order"), "error");
  }, [updateOrderError]);

  useEffect(() => {
    if (!deleteOrderSuccess) return;
    showNotification("Order deleted successfully", "success");
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteOrderSuccess]);

  useEffect(() => {
    if (!deleteOrderError) return;
    showNotification(extractErrorMessage(deleteOrderError, "Unable to delete order"), "error");
  }, [deleteOrderError]);

  useEffect(() => {
    if (!bulkDeleteSuccess) return;
    const skippedCount = bulkDeleteResult?.skipped?.length || 0;
    if (skippedCount > 0) {
      showNotification(
        `${bulkDeleteResult?.deleted ?? 0} order(s) deleted, ${skippedCount} could not be deleted`,
        "error"
      );
    } else {
      showNotification("Selected orders deleted successfully", "success");
    }
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkDeleteSuccess]);

  useEffect(() => {
    if (!bulkDeleteError) return;
    showNotification(extractErrorMessage(bulkDeleteError, "Unable to delete selected orders"), "error");
  }, [bulkDeleteError]);

  useEffect(() => {
    if (!createdOrderResponse) return;
    const hasCheckoutUrl = "checkoutUrl" in createdOrderResponse.data;
    if (hasCheckoutUrl) {
      // Keep the modal open so the admin can copy the link — do NOT close it
      // here. Track the URL in its own state (not read straight from
      // createdOrderResponse) because usePost has no reset function: if we
      // read the checkout URL directly off createdOrderResponse.data, it
      // would still be truthy the NEXT time this modal opens for a brand
      // new order, showing a stale link and incorrectly locking the form.
      setCreateForMemberCheckoutUrl(
        (createdOrderResponse.data as { checkoutUrl: string }).checkoutUrl
      );
    } else {
      showNotification("Order placed successfully", "success");
      setShowCreateForMember(false);
    }
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrderResponse]);

  useEffect(() => {
    if (!createOrderError) return;
    // usePost already extracts the server's message into .message (unlike
    // usePut/useDelete) — no need for extractErrorMessage here.
    showNotification(createOrderError.message || "Unable to place order", "error");
  }, [createOrderError]);

  const handleEditOrder = (order: IOrders) => {
    const orderId = order.order_id;
    if (orderId == null) {
      showNotification("Unable to edit: missing order id", "error");
      return;
    }
    fetchOrderDetail({ id: orderId });
  };

  const handleUpdateOrder = (payload: IUpdateOrderPayload) => {
    submitUpdateOrder(payload);
  };

  const handleDeleteOrder = (order: IOrders) => {
    const orderId = order.order_id;
    if (orderId == null) {
      showNotification("Unable to delete: missing order id", "error");
      return;
    }
    showDeleteDialog({ id: orderId, name: order.order_number }, async (id) => {
      await executeDeleteOrder({ id });
    });
  };

  const handleBulkDeleteOrders = (selected: IOrders[]) => {
    const orderIds = Array.from(
      new Set(
        selected
          .map((order) => order.order_id)
          .filter((orderId): orderId is string | number => orderId != null)
          .map(String)
      )
    );
    if (orderIds.length === 0) return;
    showDeleteDialog(
      { id: orderIds.join(","), name: `${orderIds.length} order(s)` },
      async (ids) => {
        await executeBulkDeleteOrders({ ids });
      }
    );
  };

  const handleOpenCreateForMember = () => {
    setCreateForMemberCheckoutUrl(null);
    setShowCreateForMember(true);
  };

  const handleCloseCreateForMember = () => {
    setShowCreateForMember(false);
    setCreateForMemberCheckoutUrl(null);
  };

  const handleCreateOrderForMember = (payload: ICreateOrderForMemberPayload) => {
    submitCreateOrderForMember(payload);
  };

  useEffect(() => {
    if (!deliveryStatusResponse) return;

    showNotification("Delivery status updated successfully", "success");
    setUpdatingOrderId(null);
    refetch({ market_id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryStatusResponse]);

  useEffect(() => {
    if (!deliveryStatusError) return;

    showNotification(
      deliveryStatusError.message || "Unable to update delivery status",
      "error"
    );
    setUpdatingOrderId(null);
  }, [deliveryStatusError]);

  const handleDeliveryStatusChange = (
    order: IOrders,
    status: IOrders["delivery_status"]
  ) => {
    const orderId = order.order_id ?? order.id;
    if (!orderId || !status) {
      showNotification("Unable to update delivery status: missing order id", "error");
      return;
    }

    setUpdatingOrderId(String(orderId));
    updateDeliveryStatus({ id: orderId, status });
  };

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
    // Update Delivery + Actions are appended AFTER getBaseOrderColumns
    // (rather than passed in as otherFields, which getBaseOrderColumns
    // always puts first) so they land as the last two columns.
    const baseColumns = getBaseOrderColumns([
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

    return [
      ...baseColumns,
      {
        header: "Update Delivery",
        cell: ({ row }: { row: { original: IOrders } }) => {
          const order = row.original;
          const orderId = String(order.order_id ?? order.id ?? "");
          const isThisRowUpdating =
            isUpdatingDeliveryStatus && updatingOrderId === orderId;

          return (
            <select
              className="border rounded px-2 py-1 text-xs capitalize disabled:opacity-50"
              value={order.delivery_status || "pending"}
              disabled={isThisRowUpdating}
              onChange={(event) =>
                handleDeliveryStatusChange(
                  order,
                  event.target.value as IOrders["delivery_status"]
                )
              }
            >
              {DELIVERY_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }: { row: { original: IOrders } }) => {
          const order = row.original;
          const paid = order.payment_status === "success";
          // ActionsMenu has no built-in permission gating (unlike Button's
          // label-regex auto-derivation) — gate explicitly here so Edit/
          // Delete keep matching the manage/admin tiers the old buttons had.
          const menuActions = [
            ...(canManage("Marketplace")
              ? [{ label: "Edit", onClick: () => handleEditOrder(order) }]
              : []),
            ...(canAdmin("Marketplace")
              ? [
                  {
                    label: "Delete",
                    variant: "danger" as const,
                    disabled: paid,
                    disabledReason: "Paid orders can't be deleted from here.",
                    onClick: () => handleDeleteOrder(order),
                  },
                ]
              : []),
          ];

          if (menuActions.length === 0) return null;
          return <ActionsMenu actions={menuActions} />;
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdatingDeliveryStatus, updatingOrderId, canAdmin, canManage]);

  return (
    <div className="mb-10">
      <Orders
        orders={data?.data || []}
        tableColumns={tableColumns}
        showExport
        defaultPaymentStatus="success"
        enableOrderDateFilter
        enableBulkDelete={canAdmin("Marketplace")}
        onBulkDelete={handleBulkDeleteOrders}
        headerAction={
          <div className="flex gap-2">
            <Button
              value="Reconcile Payments"
              variant="secondary"
              loading={isReconciling}
              disabled={isReconciling}
              onClick={handleReconcilePendingPayments}
            />
            {canManage("Marketplace") && (
              <Button
                value="Place order for member"
                variant="primary"
                onClick={handleOpenCreateForMember}
              />
            )}
          </div>
        }
      />

      <Modal open={Boolean(editingOrder)} onClose={() => setEditingOrder(null)}>
        <EditOrderModal
          order={editingOrder}
          loading={isUpdatingOrder}
          onSubmit={handleUpdateOrder}
          onClose={() => setEditingOrder(null)}
        />
      </Modal>

      <Modal open={showCreateForMember} onClose={handleCloseCreateForMember}>
        <CreateOrderForMemberModal
          marketId={market_id}
          loading={isCreatingOrder}
          checkoutUrl={createForMemberCheckoutUrl}
          onSubmit={handleCreateOrderForMember}
          onClose={handleCloseCreateForMember}
        />
      </Modal>
    </div>
  );
}
