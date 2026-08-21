import { CheckCircleIcon } from "@heroicons/react/24/solid";

import { cn } from "@/utils/cn";
import type { OrderLifecycleStage } from "@/pages/MembersPage/utils/orderLifecycle";

const STEPS = ["Submit Order", "Waiting for Delivery", "Transaction Complete"] as const;

interface IProps {
  stage: OrderLifecycleStage;
}

export function OrderProgressStepper({ stage }: IProps) {
  if (stage === "cancelled") {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
        This order was cancelled.
      </p>
    );
  }

  if (stage === "payment_failed") {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
        Payment failed — this order was not completed.
      </p>
    );
  }

  // Step 0 ("Submit Order") is always complete: the order exists.
  // Step 1 ("Waiting for Delivery") completes once payment succeeds.
  // Step 2 ("Transaction Complete") completes once delivery is marked delivered.
  const completedSteps =
    stage === "waiting_payment" ? 0 : stage === "waiting_delivery" ? 1 : 2;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center min-w-max">
        {STEPS.map((step, index) => {
          const isComplete = index <= completedSteps;
          const isCurrent = index === completedSteps + 1;
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
                    isComplete || isCurrent ? "font-medium text-primary" : "text-primaryGray"
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
  );
}
