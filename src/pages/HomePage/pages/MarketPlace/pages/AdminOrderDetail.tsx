import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import HubtelLogo from "@/assets/hubtel-logo.jpg";
import PaystackLogo from "@/assets/Paystack-logo.png";
import { Modal } from "@/components/Modal";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import {
  decodeQuery,
  showConfirmDialog,
  showDeleteDialog,
  showNotification,
} from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { IOrderDetail, IUpdateOrderPayload } from "@/utils/api/marketPlace/interface";
import { cn } from "@/utils/cn";

import { EditOrderModal } from "../components/Orders/EditOrderModal";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  card,
  errorMessage,
  sectionLabel,
} from "../components/Orders/orderUi";
import { ProductThumb } from "../components/Orders/ProductThumb";
import { StatusPill } from "../components/StatusPill";
import {
  formatDate,
  formatMoney,
  formatTime,
  fromOrderDetail,
  fulfilmentPill,
  isDeliveryOrder,
  isManualOrder,
  nextOrderAction,
  orderSteps,
  paymentGateway,
  paymentPill,
  PICKUP_LOCATION,
} from "../utils/marketplaceModel";

const ORDERS_PATH = "/home/market-place/orders";

/** Admin view of a single order: status actions, items, customer, payment. */
export const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const id = decodeQuery(String(orderId || ""));
  const navigate = useNavigate();
  const location = useLocation();
  const { canAdmin, canManage } = useAccessControl();
  const nav = (location.state || {}) as { from?: string; backLabel?: string };

  const query = useMemo(() => ({ id }), [id]);
  const { data, loading, refetch } = useFetch(api.fetch.fetchOrderById, query);
  const { data: deliveryRes } = useFetch(api.fetch.fetchDeliveryConfig, undefined, false, {
    silent: true,
  });

  const detail = data?.data as IOrderDetail | undefined;
  const order = useMemo(() => (detail ? fromOrderDetail(detail) : null), [detail]);

  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [editing, setEditing] = useState(false);

  const goBack = () => navigate(nav.from || ORDERS_PATH);
  const backLabel = nav.backLabel || "Back to orders";

  const update = async (patch: Omit<IUpdateOrderPayload, "id">, success: string) => {
    if (!order) return;
    setBusy(true);
    try {
      await api.put.updateOrder({ id: order.id, ...patch });
      showNotification(success, "success");
      await refetch();
    } catch (err) {
      showNotification(errorMessage(err, "Unable to update order"), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!order) {
    return (
      <PageOutline>
        <button
          type="button"
          onClick={goBack}
          className="self-start text-sm text-gray-600 hover:text-primary"
        >
          ← {backLabel}
        </button>
        {!loading && <p className="p-8 text-center text-gray-600">Order not found.</p>}
      </PageOutline>
    );
  }

  const delivery = isDeliveryOrder(order);
  const pp = paymentPill(order);
  const fp = fulfilmentPill(order);
  const next = nextOrderAction(order);
  const gw = paymentGateway(order);
  const canCancel =
    canManage("Marketplace") && order.delivery !== "cancelled" && order.delivery !== "delivered";
  const showSteps = order.delivery !== "cancelled" && order.payment !== "failed";
  const steps = orderSteps(order);
  const subtotal = order.subtotal ?? order.lines.reduce((a, l) => a + l.lineTotal, 0);
  const fee = order.deliveryFee || 0;
  const initials = order.customer.name
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const pickupLocation = deliveryRes?.data?.pickup_location || PICKUP_LOCATION;
  const canCheckPayment =
    order.payment === "pending" &&
    order.delivery !== "cancelled" &&
    !isManualOrder(order) &&
    Boolean(order.reference);

  const handleCancel = () =>
    showConfirmDialog(
      `Cancel order ${order.orderNumber}?`,
      () => update({ delivery_status: "cancelled" }, "Order cancelled"),
      {
        message: "Reserved stock is released and the member is notified.",
        confirmLabel: "Cancel order",
      }
    );

  const handleDelete = () =>
    showDeleteDialog({ id: order.id, name: order.orderNumber }, async (orderKey) => {
      try {
        await api.delete.deleteOrder({ id: orderKey });
        showNotification("Order deleted", "success");
        navigate(nav.from || ORDERS_PATH);
      } catch (err) {
        showNotification(errorMessage(err, "Unable to delete order"), "error");
      }
    });

  const handleCheckPayment = async () => {
    if (!order.reference) return;
    setChecking(true);
    try {
      await api.fetch.verifyPayment({ reference: order.reference });
      const res = await refetch();
      const status = res?.data?.payment_status;
      showNotification(
        status === "success"
          ? "Payment confirmed"
          : status === "failed"
            ? "Payment failed at the gateway"
            : "Payment is still pending",
        status === "failed" ? "error" : "success"
      );
    } catch (err) {
      showNotification(errorMessage(err, "Unable to check payment status"), "error");
    } finally {
      setChecking(false);
    }
  };

  const handleEditSubmit = async (payload: IUpdateOrderPayload) => {
    setBusy(true);
    try {
      await api.put.updateOrder(payload);
      showNotification("Order updated", "success");
      setEditing(false);
      await refetch();
    } catch (err) {
      showNotification(errorMessage(err, "Unable to update order"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageOutline>
      <div className="flex flex-col gap-4 text-primary">
        <button
          type="button"
          onClick={goBack}
          className="self-start text-sm text-gray-600 hover:text-primary"
        >
          ← {backLabel}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
              <StatusPill status={pp} />
              <StatusPill status={fp} />
            </div>
            <p className="text-gray-600">
              {formatDate(order.createdAt)}
              {formatTime(order.createdAt) ? ` at ${formatTime(order.createdAt)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage("Marketplace") && (
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setEditing(true)}
                disabled={busy}
              >
                Edit
              </button>
            )}
            {canAdmin("Marketplace") && (
              <button
                type="button"
                className={btnDanger}
                onClick={handleDelete}
                disabled={busy || order.payment === "success"}
                title={
                  order.payment === "success" ? "Paid orders can't be deleted" : undefined
                }
              >
                Delete
              </button>
            )}
            {canCancel && (
              <button type="button" className={btnDanger} onClick={handleCancel} disabled={busy}>
                Cancel order
              </button>
            )}
            {next && canManage("Marketplace") && (
              <button
                type="button"
                className={btnPrimary}
                disabled={busy}
                onClick={() => update(next.patch, next.success)}
              >
                {next.label}
              </button>
            )}
          </div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <section className={cn(card, "flex flex-col gap-3.5 p-5")}>
              <h2 className="text-base font-semibold">Items ({order.units})</h2>
              {order.lines.map((l) => (
                <div key={l.id} className="flex items-center gap-3 text-sm">
                  <ProductThumb
                    imageUrl={l.imageUrl}
                    hex={l.colour}
                    alt={l.name}
                    className="h-[52px] w-[52px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-gray-500">
                      {[l.colourName, l.size && l.size !== "One size" ? `Size ${l.size}` : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-gray-600">
                    {l.quantity} × {formatMoney(l.unitPrice)}
                  </span>
                  <span className="min-w-24 text-right font-semibold">
                    {formatMoney(l.lineTotal)}
                  </span>
                </div>
              ))}
              <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span>{delivery && fee ? formatMoney(fee) : "Free"}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(order.total)}</span>
                </div>
              </div>
            </section>

            {showSteps && (
              <section className={cn(card, "flex flex-col gap-3.5 p-5")}>
                <h2 className="text-base font-semibold">Timeline</h2>
                {steps.map((t) => (
                  <div key={t.label} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                        t.done ? "border-primary bg-primary" : "border-lightGray bg-white"
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm",
                          t.done ? "font-semibold text-primary" : "text-gray-500"
                        )}
                      >
                        {t.label}
                      </p>
                      {t.sub && <p className="text-sm text-gray-500">{t.sub}</p>}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <section className={cn(card, "flex flex-col gap-2 p-5")}>
              <p className={sectionLabel}>Customer</p>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lightGray/50 text-sm font-semibold">
                  {initials || "?"}
                </span>
                <p className="font-semibold">{order.customer.name}</p>
              </div>
              {order.customer.email && (
                <p className="break-all text-sm text-gray-600">{order.customer.email}</p>
              )}
              {order.customer.phone && (
                <p className="text-sm text-gray-600">{order.customer.phone}</p>
              )}
            </section>

            <section className={cn(card, "flex flex-col gap-1.5 p-5")}>
              <p className={sectionLabel}>Fulfilment</p>
              <p className="text-sm font-semibold">
                {delivery ? "Home delivery" : "Pickup at church"}
              </p>
              <p className="text-sm text-gray-600">
                {delivery ? order.deliveryAddress || "No address recorded" : pickupLocation}
              </p>
            </section>

            <section className={cn(card, "flex flex-col gap-1.5 p-5")}>
              <p className={sectionLabel}>Payment</p>
              <div className="flex items-center gap-2">
                {gw.key !== "manual" && (
                  <img
                    src={gw.key === "hubtel" ? HubtelLogo : PaystackLogo}
                    alt=""
                    className="h-6 w-auto rounded"
                  />
                )}
                <p className="text-sm font-semibold">
                  {gw.name} · {pp.label}
                </p>
              </div>
              <p className="text-sm text-gray-600">{gw.channel}</p>
              {order.reference && (
                <p className="break-all text-sm text-gray-500">Ref {order.reference}</p>
              )}
              {canCheckPayment && (
                <button
                  type="button"
                  className={cn(btnSecondary, "mt-2 self-start")}
                  onClick={handleCheckPayment}
                  disabled={checking}
                >
                  {checking ? "Checking…" : "Check payment status"}
                </button>
              )}
            </section>
          </div>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit order">
        <EditOrderModal
          order={detail || null}
          loading={busy}
          onSubmit={handleEditSubmit}
          onClose={() => setEditing(false)}
        />
      </Modal>
    </PageOutline>
  );
};
