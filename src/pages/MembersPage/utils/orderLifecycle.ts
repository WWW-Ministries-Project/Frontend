import type { IOrders, IOrderDetail } from "@/utils";

export type OrderLifecycleStage =
  | "waiting_payment"
  | "payment_failed"
  | "waiting_delivery"
  | "complete"
  | "cancelled";

export interface OrderLifecycle {
  stage: OrderLifecycleStage;
  label: string;
  canPay: boolean;
  canCancel: boolean;
}

type LifecycleInput = Pick<
  IOrders | IOrderDetail,
  "payment_status" | "delivery_status"
>;

const STAGE_LABELS: Record<OrderLifecycleStage, string> = {
  waiting_payment: "Waiting for Payment",
  payment_failed: "Payment Failed",
  waiting_delivery: "Waiting for Delivery",
  complete: "Transaction Complete",
  cancelled: "Order Cancelled",
};

/**
 * Single source of truth for order status wording, used by both the
 * member order list (badges) and the order detail page (progress bar).
 * There is no separate "Been Shipped" stage — delivery_status === "shipped"
 * folds into "waiting_delivery" since there is no real shipment-tracking
 * data model to justify a distinct stage.
 */
export function getOrderLifecycle(order: LifecycleInput): OrderLifecycle {
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  const deliveryStatus = String(order.delivery_status || "").toLowerCase();

  let stage: OrderLifecycleStage;
  if (deliveryStatus === "cancelled") {
    stage = "cancelled";
  } else if (paymentStatus === "failed") {
    stage = "payment_failed";
  } else if (paymentStatus === "pending") {
    stage = "waiting_payment";
  } else if (deliveryStatus === "delivered") {
    stage = "complete";
  } else {
    // paid (success), delivery pending or shipped
    stage = "waiting_delivery";
  }

  return {
    stage,
    label: STAGE_LABELS[stage],
    canPay: stage === "waiting_payment",
    canCancel: stage === "waiting_payment",
  };
}
