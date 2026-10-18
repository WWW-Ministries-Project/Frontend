import type { FulfilmentMethod, IOrderDetail, IOrders } from "@/utils";
import {
  formatDate,
  formatTime,
  isManualOrder,
  type MarketOrder,
  type StatusInfo,
} from "@/pages/HomePage/pages/MarketPlace/utils/marketplaceModel";

export type OrderLifecycleStage =
  | "waiting_payment"
  | "payment_failed"
  | "waiting_delivery"
  | "complete"
  | "cancelled";

export interface OrderLifecycle {
  stage: OrderLifecycleStage;
  canPay: boolean;
  canCancel: boolean;
}

type LifecycleInput = Pick<MarketOrder, "payment" | "delivery">;

/**
 * Which member actions are available for an order. Members can only pay for
 * or cancel an order while it is still awaiting payment — once paid, changes
 * go through the church office.
 */
export function getOrderLifecycle(order: LifecycleInput): OrderLifecycle {
  let stage: OrderLifecycleStage;
  if (order.delivery === "cancelled") stage = "cancelled";
  else if (order.payment === "failed") stage = "payment_failed";
  else if (order.payment === "pending") stage = "waiting_payment";
  else if (order.delivery === "delivered") stage = "complete";
  else stage = "waiting_delivery";

  return {
    stage,
    canPay: stage === "waiting_payment",
    canCancel: stage === "waiting_payment",
  };
}

// ---------------------------------------------------------------------------
// Delivery-aware wording (the shared model assumes pickup).
// ---------------------------------------------------------------------------

/** Old orders have no fulfilment_method — treat them as pickup. */
export const resolveFulfilment = (
  source:
    | Pick<IOrderDetail, "fulfilment_method">
    | (IOrders & { fulfilment_method?: FulfilmentMethod | null })
    | null
    | undefined
): FulfilmentMethod =>
  source?.fulfilment_method === "delivery" ? "delivery" : "pickup";

export const memberStatusPill = (
  o: LifecycleInput,
  method: FulfilmentMethod
): StatusInfo => {
  const pickup = method === "pickup";
  if (o.delivery === "cancelled") return { label: "Cancelled", tone: "red" };
  if (o.payment === "failed") return { label: "Payment failed", tone: "red" };
  if (o.payment === "pending") return { label: "Awaiting payment", tone: "yellow" };
  if (o.delivery === "delivered")
    return { label: pickup ? "Collected" : "Delivered", tone: "green" };
  if (o.delivery === "shipped")
    return { label: pickup ? "Ready for pickup" : "On the way", tone: "blue" };
  return { label: "Processing", tone: "gray" };
};

export interface MemberOrderStep {
  label: string;
  sub: string;
  done: boolean;
}

export const stepsFor = (
  o: MarketOrder,
  method: FulfilmentMethod
): MemberOrderStep[] => {
  const pickup = method === "pickup";
  const idx =
    o.delivery === "delivered"
      ? 3
      : o.delivery === "shipped"
        ? 2
        : o.payment === "success"
          ? 1
          : 0;
  const placed = [formatDate(o.createdAt), formatTime(o.createdAt)]
    .filter(Boolean)
    .join(" · ");
  const labels = [
    "Order placed",
    "Payment confirmed",
    pickup ? "Ready for pickup" : "Out for delivery",
    pickup ? "Collected" : "Delivered",
  ];
  const subs = [
    placed,
    isManualOrder(o) ? "Recorded by the church office" : "Via Hubtel",
    pickup ? "We'll notify you when it's ready" : "On its way to your address",
    pickup
      ? "Show your order number at the church office"
      : "Delivered to your address",
  ];
  return labels.map((label, i) => ({
    label,
    sub: i <= idx ? subs[i] : i === idx + 1 ? "Up next" : "",
    done: i <= idx,
  }));
};

export const fulfilmentShortLabel = (method: FulfilmentMethod) =>
  method === "delivery" ? "Delivery" : "Pickup";

export const fulfilmentTitle = (method: FulfilmentMethod) =>
  method === "delivery" ? "Home delivery" : "Pickup at church";

export const paymentGateway = (o: Pick<MarketOrder, "reference">) =>
  isManualOrder(o)
    ? { name: "Manual", channel: "Cash / bank transfer", hasLogo: false }
    : { name: "Hubtel", channel: "Mobile money", hasLogo: true };

/** Pulls a readable message out of an axios-style error. */
export const apiErrorMessage = (error: unknown, fallback: string) => {
  const body = (error as { response?: { data?: { message?: unknown; error?: unknown } } })
    ?.response?.data;
  const message = body?.message ?? body?.error;
  return typeof message === "string" && message.trim() ? message : fallback;
};
