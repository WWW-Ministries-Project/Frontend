import { CheckCircleIcon } from "@heroicons/react/24/solid";

import { cn } from "@/utils/cn";
import type { IOrders, PaymentStatus } from "@/utils";

const STEPS = ["Ordered", "Paid", "Preparing", "Shipped", "Delivered"] as const;

interface IProps {
  paymentStatus: PaymentStatus;
  deliveryStatus?: IOrders["delivery_status"];
}

/**
 * Maps the existing payment_status/delivery_status enums onto a 5-step
 * visual timeline. Introduces no new statuses — purely a presentation of
 * data that already exists on IOrders.
 */
export function OrderStatusTimeline({ paymentStatus, deliveryStatus }: IProps) {
  const isPaid = paymentStatus === "success" || paymentStatus === "delivered";
  const isFailed = paymentStatus === "failed";
  const isCancelled = deliveryStatus === "cancelled";

  const completedSteps = (() => {
    if (!isPaid) return 0; // only "Ordered" is complete
    if (isCancelled) return 1; // "Ordered" + "Paid" complete, then cancelled
    switch (deliveryStatus) {
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      case "pending":
      default:
        return 1; // paid; "Preparing" is the current/active step
    }
  })();

  if (isFailed) {
    return (
      <p className="text-sm font-medium text-red-600 dark:text-red-400">
        Payment failed — this order was not completed.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div className="flex items-center min-w-max">
          {STEPS.map((step, index) => {
            const isComplete = index <= completedSteps;
            const isCurrent = index === completedSteps + 1 && !isCancelled;
            const isLast = index === STEPS.length - 1;

            return (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-semibold",
                      isComplete
                        ? "border-primary bg-primary text-white"
                        : isCurrent
                        ? "border-primary text-primary"
                        : "border-lightGray text-primaryGray"
                    )}
                  >
                    {isComplete ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "whitespace-nowrap text-[11px]",
                      isComplete || isCurrent
                        ? "font-medium text-primary"
                        : "text-primaryGray"
                    )}
                  >
                    {step}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1",
                      index < completedSteps ? "bg-primary" : "bg-lightGray"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {isCancelled && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          This order was cancelled after payment.
        </p>
      )}
    </div>
  );
}
