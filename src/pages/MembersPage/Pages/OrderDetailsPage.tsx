import { useBackNavigation } from "@/CustomHooks/useBackNavigation";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HubtelLogo from "@/assets/hubtel-logo.jpg";
import { useFetch } from "@/CustomHooks/useFetch";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { StatusPill } from "@/pages/HomePage/pages/MarketPlace/components/StatusPill";
import {
  colourLabel,
  formatDate,
  formatMoney,
  formatTime,
  fromOrderDetail,
} from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { OrderProgressStepper } from "@/pages/MembersPage/components/OrderProgressStepper";
import {
  cancelOrderRequest,
  confirmCancelOrder,
  startOrderPayment,
} from "@/pages/MembersPage/components/orders/orderActions";
import { ProductThumb } from "@/pages/MembersPage/components/orders/ProductThumb";
import { useDeliveryConfig } from "@/pages/MembersPage/components/orders/useDeliveryConfig";
import {
  fulfilmentTitle,
  getOrderLifecycle,
  memberStatusPill,
  paymentGateway,
  resolveFulfilment,
  stepsFor,
} from "@/pages/MembersPage/utils/orderLifecycle";
import { api, relativePath } from "@/utils";

const SUPPORT_EMAIL = "systemadmin@worldwidewordministries.org";

const card = "rounded-xl border border-lightGray bg-white";
const eyebrow = "text-xs font-semibold uppercase tracking-wider text-primaryGray";

export function OrderDetailsPage() {
  const { id } = useParams();
  const orderId = decodeQuery(id || "");
  const navigate = useNavigate();
  const back = useBackNavigation(relativePath.member.orders);
  const [busy, setBusy] = useState(false);
  const { pickupLocation } = useDeliveryConfig();

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useFetch(api.fetch.fetchOrderById, { id: orderId }, !orderId);

  const detail = response?.data;

  if (loading) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        scope="page"
        msg={error ? "Failed to load this order" : "Order not found"}
        actionLabel="Back to my orders"
        onAction={() => navigate(relativePath.member.orders)}
      />
    );
  }

  const order = fromOrderDetail(detail);
  const method = resolveFulfilment(detail);
  const lifecycle = getOrderLifecycle(order);
  const status = memberStatusPill(order, method);
  const gateway = paymentGateway(order);
  const subtotal = order.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const fee = method === "delivery" ? Number(detail.delivery_fee) || 0 : 0;
  const total = Number(detail.total_amount) || subtotal + fee;
  const showSteps = order.delivery !== "cancelled" && order.payment !== "failed";
  const paymentLabel =
    order.payment === "success" ? "Paid" : order.payment === "failed" ? "Failed" : "Pending";

  const handlePay = async () => {
    setBusy(true);
    const redirecting = await startOrderPayment(order.id);
    if (!redirecting) setBusy(false);
  };

  const handleCancel = () =>
    confirmCancelOrder(order.orderNumber, async () => {
      setBusy(true);
      const ok = await cancelOrderRequest(order.id);
      setBusy(false);
      if (ok) await refetch();
    });

  const openProduct = (productId?: string | number) => {
    if (productId == null) return;
    navigate(`/member/market/product/${encodeQuery(String(productId))}`);
  };

  return (
    <div className="flex w-full flex-col gap-5 text-primary">
      <button
        type="button"
        onClick={back.goBack}
        className="self-start text-sm text-primaryGray hover:text-primary"
      >
        ← {back.label}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold leading-8">Order {order.orderNumber}</h1>
            <StatusPill status={status} />
          </div>
          <p className="text-primaryGray">
            Placed {formatDate(order.createdAt)}
            {formatTime(order.createdAt) ? ` at ${formatTime(order.createdAt)}` : ""}
          </p>
        </div>
        {lifecycle.canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={handleCancel}
            className="min-h-10 rounded-lg border border-primary/30 bg-white px-[18px] text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
      </div>

      {lifecycle.canPay && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-5 py-4 text-amber-700">
          <div>
            <p className="font-semibold">Payment not completed</p>
            <p className="text-sm">
              Complete payment to confirm the order and keep your items reserved.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handlePay}
            className="min-h-10 rounded-lg bg-primary px-[18px] text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Please wait…" : `Pay ${formatMoney(total)}`}
          </button>
        </div>
      )}

      {order.delivery === "cancelled" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          This order was cancelled.
        </p>
      )}
      {order.payment === "failed" && order.delivery !== "cancelled" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          Payment failed — this order was not completed.
        </p>
      )}

      {showSteps && <OrderProgressStepper steps={stepsFor(order, method)} />}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className={`${card} flex flex-col gap-4 p-6`}>
          <h2 className="text-lg font-semibold">Items ({order.units})</h2>
          {order.lines.map((line) => {
            const colour = colourLabel({ colour: line.colour, colour_name: line.colourName });
            const variant = [colour, line.size && line.size !== "One size" ? `Size ${line.size}` : ""]
              .filter(Boolean)
              .join(" · ");
            const canOpen = line.productId != null;
            return (
              <div key={line.id} className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label={`View ${line.name}`}
                  disabled={!canOpen}
                  onClick={() => openProduct(line.productId)}
                  className="flex-shrink-0 rounded-lg disabled:cursor-default"
                >
                  <ProductThumb
                    imageUrl={line.imageUrl}
                    colour={line.colour}
                    alt=""
                    className="size-[72px]"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  {canOpen ? (
                    <button
                      type="button"
                      onClick={() => openProduct(line.productId)}
                      className="text-left font-semibold hover:underline"
                    >
                      {line.name}
                    </button>
                  ) : (
                    <p className="font-semibold">{line.name}</p>
                  )}
                  {variant && <p className="text-sm text-primaryGray">{variant}</p>}
                  <p className="text-sm text-primaryGray">
                    {line.quantity} × {formatMoney(line.unitPrice)}
                  </p>
                </div>
                <span className="whitespace-nowrap font-semibold">
                  {formatMoney(line.lineTotal)}
                </span>
              </div>
            );
          })}
          <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-primaryGray">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primaryGray">Delivery</span>
              <span>{fee > 0 ? formatMoney(fee) : "Free"}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className={`${card} flex flex-col gap-1.5 p-5`}>
            <p className={eyebrow}>{fulfilmentTitle(method)}</p>
            <p className="text-sm">
              {method === "delivery"
                ? detail.delivery_address || "Delivery address not provided"
                : pickupLocation}
            </p>
          </section>

          <section className={`${card} flex flex-col gap-1.5 p-5`}>
            <p className={eyebrow}>Payment</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {gateway.name} · {paymentLabel}
              </p>
              {gateway.hasLogo && (
                <img src={HubtelLogo} alt="Hubtel" className="h-5 max-w-16 object-contain" />
              )}
            </div>
            <p className="break-all text-sm text-primaryGray">
              {gateway.channel}
              {order.reference ? ` · Ref ${order.reference}` : ""}
            </p>
          </section>

          {(order.customer.name || order.customer.email) && (
            <section className={`${card} flex flex-col gap-1.5 p-5`}>
              <p className={eyebrow}>Contact</p>
              <p className="text-sm font-semibold">{order.customer.name}</p>
              {order.customer.email && (
                <p className="text-sm text-primaryGray">{order.customer.email}</p>
              )}
              {order.customer.phone && (
                <p className="text-sm text-primaryGray">{order.customer.phone}</p>
              )}
            </section>
          )}

          <section className={`${card} flex flex-col gap-2 p-5`}>
            <p className={eyebrow}>Need help?</p>
            <p className="text-sm text-primaryGray">
              Questions about this order? Email the church office and quote your
              order number.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                `Order ${order.orderNumber}`
              )}`}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary/30 bg-white px-[18px] text-sm font-medium text-primary hover:bg-gray-100"
            >
              Contact us
            </a>
            <p className="break-all text-xs text-primaryGray">{SUPPORT_EMAIL}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
