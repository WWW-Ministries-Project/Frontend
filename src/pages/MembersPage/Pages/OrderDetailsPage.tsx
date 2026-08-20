import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components";
import { OrderProgressStepper } from "@/pages/MembersPage/components/OrderProgressStepper";
import { getOrderLifecycle } from "@/pages/MembersPage/utils/orderLifecycle";
import { decodeQuery, showNotification } from "@/pages/HomePage/utils";
import { api, relativePath } from "@/utils";

const SUPPORT_EMAIL = "systemadmin@worldwidewordministries.org";

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

export function OrderDetailsPage() {
  const { id } = useParams();
  const orderId = decodeQuery(id || "");
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useFetch(api.fetch.fetchOrderById, { id: orderId }, !orderId);

  const order = response?.data;

  const handlePay = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      const payload = {
        id: String(order.id),
        cancellation_url: `${window.location.origin}${relativePath.member.orders}`,
        return_url: `${window.location.origin}${relativePath.member.verify_payment}`,
      };
      const res = await api.post.retryOrderPayment(payload);
      const checkoutUrl = res?.data?.checkoutUrl;
      if (!checkoutUrl) {
        showNotification("Unable to start payment checkout.", "error");
        return;
      }
      window.location.href = checkoutUrl;
    } catch {
      showNotification("Failed to initiate payment.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      await api.put.cancelOrder({ id: order.id });
      showNotification("Order cancelled.", "success");
      await refetch();
    } catch {
      showNotification("Failed to cancel order.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6" aria-busy="true" aria-live="polite">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        scope="page"
        msg={error ? "Failed to load this order" : "Order not found"}
        actionLabel="Back to orders"
        onAction={() => navigate(relativePath.member.orders)}
      />
    );
  }

  const lifecycle = getOrderLifecycle(order);
  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price_amount || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-lightGray/20 p-4">
        <div>
          <p className="text-lg font-semibold text-primary">{lifecycle.label}</p>
          <p className="text-sm text-primaryGray">
            Order date: <span className="font-medium text-primary">{formatOrderDate(order.created_at)}</span>
          </p>
          <p className="text-sm text-primaryGray">
            Order NO: <span className="font-medium text-primary">{order.order_number}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            value="Contact Us"
            variant="secondary"
            onClick={() => {
              window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                `Order ${order.order_number}`
              )}`;
            }}
          />
          {lifecycle.canCancel && (
            <Button
              value="Cancel Order"
              variant="secondary"
              disabled={isProcessing}
              onClick={handleCancel}
            />
          )}
          {lifecycle.canPay && (
            <Button value="Pay Now" loading={isProcessing} disabled={isProcessing} onClick={handlePay} />
          )}
        </div>
      </div>

      <OrderProgressStepper stage={lifecycle.stage} />

      <div className="rounded-lg bg-lightGray/20 p-4 text-sm text-primaryGray">
        Sorry, there is no shipping information yet
      </div>

      <div className="divide-y divide-lightGray/60 rounded-lg border border-lightGray">
        {order.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex gap-4 p-4">
            <img
              src={item.image_url}
              alt={item.name}
              className="h-16 w-16 flex-shrink-0 rounded-lg border border-lightGray object-cover"
            />
            <div className="flex-1">
              <p className="font-medium text-primary">{item.name}</p>
              <p className="text-sm text-primaryGray">{item.color}</p>
            </div>
            <div className="w-16 text-center text-sm">
              <p className="text-primaryGray">Qty</p>
              <p className="font-semibold text-primary">X{item.quantity}</p>
            </div>
            <div className="w-24 text-right text-sm">
              <p className="text-primaryGray">Price</p>
              <p className="font-semibold text-primary">{formatMoney(Number(item.price_amount || 0))}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
        <p className="flex items-center justify-between">
          <span className="text-primaryGray">Subtotal</span>
          <span className="font-medium text-primary">{formatMoney(subtotal)}</span>
        </p>
        <p className="flex items-center justify-between border-t border-lightGray pt-2 text-base">
          <span className="font-semibold text-primary">Order Total</span>
          <span className="font-bold text-primary">{formatMoney(Number(order.total_amount || 0))}</span>
        </p>
      </div>
    </div>
  );
}
