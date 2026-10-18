import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { ArrowPathIcon, ClockIcon } from "@heroicons/react/24/outline";

import { useFetch } from "@/CustomHooks/useFetch";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import {
  colourLabel,
  formatMoney,
  fromOrderDetail,
  type PaymentState,
} from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";
import { encodeQuery } from "@/pages/HomePage/utils";
import { ProductThumb } from "@/pages/MembersPage/components/orders/ProductThumb";
import { useDeliveryConfig } from "@/pages/MembersPage/components/orders/useDeliveryConfig";
import {
  fulfilmentTitle,
  paymentGateway,
  resolveFulfilment,
} from "@/pages/MembersPage/utils/orderLifecycle";
import { useUserStore } from "@/store/userStore";
import { api, relativePath } from "@/utils";

const MOBILE_REDIRECT_SECONDS = 5;

type VerifyResult = {
  message?: string;
  order?: { id?: number | string; order_number?: string; payment_status?: string } | null;
};

const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-[22px] text-sm font-semibold text-white hover:bg-primary/90";
const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-lightGray bg-white px-[22px] text-sm font-semibold text-primary hover:bg-gray-100";

export default function VerifyPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { type } = useParams();
  const searchParams = new URLSearchParams(location.search);

  const reference = searchParams.get("order_reference") ?? "";
  const hasReference = Boolean(reference.trim());
  const isMobileReturn = type === "mobile";
  const isGuest = type === "out";
  const shopPath = isGuest ? "/out/products" : relativePath.member.market;
  const deepLink = `wwm-mobile://payment/verify?reference=${encodeURIComponent(
    reference
  )}&order_reference=${encodeURIComponent(reference)}`;

  const {
    data: verification,
    loading,
    error,
    refetch,
  } = useFetch(api.fetch.verifyPayment, { reference }, !hasReference);

  const verified = Boolean(verification) && !loading && !error && hasReference;
  const result = (verification?.data ?? null) as VerifyResult | null;
  const verifiedOrderId = result?.order?.id;

  // Members get the full confirmation card (order lines, totals, fulfilment).
  const canLoadOrder = verified && !isGuest && !isMobileReturn && verifiedOrderId != null;
  const {
    data: orderResponse,
    error: orderError,
    refetch: fetchOrder,
  } = useFetch(
    api.fetch.fetchOrderById,
    canLoadOrder ? { id: String(verifiedOrderId) } : undefined,
    true,
    { silent: true }
  );
  useEffect(() => {
    if (canLoadOrder) fetchOrder({ id: String(verifiedOrderId) });
  }, [canLoadOrder, fetchOrder, verifiedOrderId]);

  const detail = orderResponse?.data;
  const order = useMemo(() => (detail ? fromOrderDetail(detail) : null), [detail]);


  // The mobile app needs the browser to hand control back via deep link.
  const [countdown, setCountdown] = useState(MOBILE_REDIRECT_SECONDS);
  useEffect(() => {
    if (!verified || !isMobileReturn) return;
    setCountdown(MOBILE_REDIRECT_SECONDS);
    const timer = setInterval(() => setCountdown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [isMobileReturn, verified]);
  useEffect(() => {
    if (verified && isMobileReturn && countdown === 0) window.location.replace(deepLink);
  }, [countdown, deepLink, isMobileReturn, verified]);

  const payment: PaymentState = (() => {
    const raw = String(order?.payment ?? result?.order?.payment_status ?? "success").toLowerCase();
    return raw === "failed" ? "failed" : raw === "pending" ? "pending" : "success";
  })();

  // Only a confirmed payment empties the cart; failed or pending payments
  // keep it so the member can retry checkout.
  const { clearCart } = useCart();
  useEffect(() => {
    if (!verified || payment !== "success") return;
    clearCart();
    localStorage.removeItem("my_cart");
  }, [clearCart, verified, payment]);

  const wrapper = `w-full text-primary ${isGuest ? "mx-auto max-w-7xl px-4 py-10" : "py-4"}`;

  if (!hasReference) {
    return (
      <div className={wrapper}>
        <StateCard
          icon={<XCircleIcon className="size-12 text-red-600" />}
          title="Missing payment reference"
          body="We could not verify your payment because the reference is missing."
        >
          <button type="button" className={primaryBtn} onClick={() => navigate(shopPath)}>
            Back to marketplace
          </button>
        </StateCard>
      </div>
    );
  }

  if (loading || (canLoadOrder && !orderResponse && !orderError)) {
    return (
      <div className={wrapper}>
        <StateCard
          icon={<ArrowPathIcon className="size-12 animate-spin text-primary" />}
          title="Confirming your payment…"
          body="This only takes a moment. Please don't close this page."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={wrapper}>
        <StateCard
          icon={<XCircleIcon className="size-12 text-red-600" />}
          title="We couldn't confirm your payment"
          body="Please try again. If you were charged, your order will update automatically — contact the church office if it doesn't."
        >
          <button type="button" className={primaryBtn} onClick={() => refetch({ reference })}>
            Try again
          </button>
          {!isGuest && (
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => navigate(relativePath.member.orders)}
            >
              My orders
            </button>
          )}
        </StateCard>
      </div>
    );
  }

  if (isMobileReturn) {
    return (
      <div className={wrapper}>
        <StateCard
          icon={<CheckCircleIcon className="size-12 text-green-600" />}
          title="Payment confirmed"
          body={`Order reference ${reference}. You will be returned to the app in ${countdown} seconds…`}
        >
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              window.location.href = deepLink;
            }}
          >
            Open mobile app
          </button>
        </StateCard>
      </div>
    );
  }

  const orderHref =
    verifiedOrderId != null
      ? `${relativePath.member.market}orders/${encodeQuery(String(verifiedOrderId))}`
      : relativePath.member.orders;

  if (payment !== "success") {
    const failed = payment === "failed";
    return (
      <div className={wrapper}>
        <StateCard
          icon={
            failed ? (
              <XCircleIcon className="size-12 text-red-600" />
            ) : (
              <ClockIcon className="size-12 text-amber-600" />
            )
          }
          title={failed ? "Payment failed" : "Payment not completed yet"}
          body={
            failed
              ? "Your payment didn't go through, so the order wasn't confirmed. You can try paying again from your order."
              : "We haven't received confirmation from Hubtel yet. If you completed payment, check again in a moment."
          }
        >
          {!failed && (
            <button type="button" className={primaryBtn} onClick={() => refetch({ reference })}>
              Check again
            </button>
          )}
          {!isGuest && (
            <button
              type="button"
              className={failed ? primaryBtn : secondaryBtn}
              onClick={() => navigate(orderHref)}
            >
              View order
            </button>
          )}
          <button type="button" className={secondaryBtn} onClick={() => navigate(shopPath)}>
            Continue shopping
          </button>
        </StateCard>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <OrderConfirmed
        reference={reference}
        detail={detail ?? null}
        order={order}
        isGuest={isGuest}
        onViewOrder={() => navigate(orderHref)}
        onContinue={() => navigate(shopPath)}
      />
    </div>
  );
}

const StateCard = ({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) => (
  <div
    role="status"
    className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-lightGray bg-white p-8 text-center"
  >
    {icon}
    <h1 className="text-xl font-semibold">{title}</h1>
    <p className="text-sm text-primaryGray">{body}</p>
    {children && <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>}
  </div>
);

const OrderConfirmed = ({
  reference,
  detail,
  order,
  isGuest,
  onViewOrder,
  onContinue,
}: {
  reference: string;
  detail: Parameters<typeof fromOrderDetail>[0] | null;
  order: ReturnType<typeof fromOrderDetail> | null;
  isGuest: boolean;
  onViewOrder: () => void;
  onContinue: () => void;
}) => {
  const userName = useUserStore((s) => s.name);
  const { pickupLocation } = useDeliveryConfig();
  const firstName = order?.customer.firstName || (isGuest ? "" : (userName || "").split(" ")[0]);
  const method = resolveFulfilment(detail);
  const gateway = paymentGateway({ reference: order?.reference ?? reference });

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircleIcon className="size-12 text-green-600" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold leading-8">
          Thank you{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-primaryGray">
          Order <b className="text-primary">{order?.orderNumber ?? reference}</b> is confirmed.
          {order?.customer.email ? ` A receipt has been sent to ${order.customer.email}.` : ""}
        </p>
      </div>

      {order && (
        <div className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-primaryGray">Total paid</p>
              <p className="text-base font-semibold">{formatMoney(order.total)}</p>
            </div>
            <div>
              <p className="text-primaryGray">Payment</p>
              <p className="text-base font-semibold">{gateway.name}</p>
            </div>
            <div>
              <p className="text-primaryGray">{fulfilmentTitle(method)}</p>
              <p className="font-medium">
                {method === "delivery" ? detail?.delivery_address || "Your address" : pickupLocation}
              </p>
            </div>
            <div>
              <p className="text-primaryGray">Reference</p>
              <p className="break-all font-medium">{order.reference || reference}</p>
            </div>
          </div>
          <ul className="flex flex-col gap-3 border-t border-gray-200 pt-4">
            {order.lines.map((line) => {
              const colour = colourLabel({ colour: line.colour, colour_name: line.colourName });
              const variant = [colour, line.size && line.size !== "One size" ? `Size ${line.size}` : ""]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={line.id} className="flex items-center gap-3">
                  <ProductThumb imageUrl={line.imageUrl} colour={line.colour} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{line.name}</p>
                    <p className="text-sm text-primaryGray">
                      {variant ? `${variant} · ` : ""}Qty {line.quantity}
                    </p>
                  </div>
                  <span className="text-sm">{formatMoney(line.lineTotal)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {!isGuest && (
          <button type="button" className={primaryBtn} onClick={onViewOrder}>
            View order
          </button>
        )}
        <button
          type="button"
          className={isGuest ? primaryBtn : secondaryBtn}
          onClick={onContinue}
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
};
