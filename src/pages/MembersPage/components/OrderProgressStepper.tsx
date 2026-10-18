import { cn } from "@/utils/cn";
import type { MemberOrderStep } from "@/pages/MembersPage/utils/orderLifecycle";

interface IProps {
  steps: MemberOrderStep[];
}

/** Horizontal order progress: one bar per step, filled once reached. */
export function OrderProgressStepper({ steps }: IProps) {
  return (
    <ol
      aria-label="Order progress"
      className="grid grid-cols-2 gap-x-3 gap-y-5 rounded-xl border border-lightGray bg-white p-6 sm:grid-cols-4"
    >
      {steps.map((step) => (
        <li key={step.label} className="flex flex-col gap-2">
          <div
            className={cn(
              "h-1.5 rounded-full",
              step.done ? "bg-primary" : "bg-gray-200"
            )}
          />
          <p
            className={cn(
              "text-sm",
              step.done ? "font-semibold text-primary" : "text-gray-500"
            )}
          >
            {step.label}
            <span className="sr-only">{step.done ? " (done)" : ""}</span>
          </p>
          {step.sub ? <p className="text-xs text-gray-500">{step.sub}</p> : null}
        </li>
      ))}
    </ol>
  );
}
