import { cn } from "@/utils/cn";

import type { MemberFormStep, StepKey } from "./memberFormSteps";

export const MemberFormStepper = ({
  steps,
  current,
  onSelect,
}: {
  steps: MemberFormStep[];
  current: StepKey;
  onSelect: (key: StepKey) => void;
}) => {
  const currentIndex = steps.findIndex((step) => step.key === current);

  return (
    <nav
      aria-label="Member registration progress"
      className="overflow-x-auto rounded-xl border border-[#D8DAE5] bg-white p-3"
    >
      <ol className="m-0 flex list-none gap-2 p-0">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isDone = index < currentIndex;
          return (
            <li key={step.key} className="min-w-[170px] flex-[1_1_0]">
              <button
                type="button"
                onClick={() => onSelect(step.key)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.title}. ${step.description}`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[rgba(216,218,229,0.3)]",
                  isCurrent ? "bg-[rgba(216,218,229,0.3)]" : "bg-transparent"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    isCurrent || isDone
                      ? "border-primary bg-primary text-white"
                      : "border-[#D8DAE5] bg-white text-[#4B5563]"
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-primary">{step.title}</span>
                  <span className="text-xs text-[#6B7280]">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
