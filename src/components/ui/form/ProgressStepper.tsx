import { cn } from "@/utils/cn";

export interface StepperStep<T extends string | number = string> {
  id: T;
  label: string;
  description?: string;
  ariaLabel?: string;
}

type StepperLayout = "horizontal" | "vertical";

interface ProgressStepperProps<T extends string | number = string> {
  steps: StepperStep<T>[];
  activeStep: T;
  onStepChange?: (step: T) => void;
  ariaLabel?: string;
  title?: string;
  className?: string;
  layout?: StepperLayout;
  showMobileSummary?: boolean;
  allowStepSelection?: boolean;
  isStepDisabled?: (step: StepperStep<T>, index: number) => boolean;
  isStepCompleted?: (step: StepperStep<T>, index: number) => boolean;
}

export const ProgressStepper = <T extends string | number = string>({
  steps,
  activeStep,
  onStepChange,
  ariaLabel,
  title,
  className,
  layout = "horizontal",
  showMobileSummary = true,
  allowStepSelection = true,
  isStepDisabled,
  isStepCompleted,
}: ProgressStepperProps<T>) => {
  if (steps.length === 0) return null;

  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep));
  const activeLabel = steps[activeIndex]?.label ?? "";

  const renderStep = (step: StepperStep<T>, index: number) => {
    const isActive = index === activeIndex;
    const isCompleted = !isActive && (isStepCompleted?.(step, index) ?? index < activeIndex);
    const interactive = Boolean(onStepChange) && allowStepSelection;
    const disabled = isStepDisabled?.(step, index) ?? false;
    const statusText = isActive ? "Current step" : isCompleted ? "Completed step" : "Upcoming step";

    const stepNode = (
      <>
        <span
          aria-hidden="true"
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
            isCompleted
              ? "border-success bg-success text-white"
              : isActive
              ? "border-primary bg-primary text-white"
              : "border-lightGray bg-white text-primaryGray"
          )}
        >
          {isCompleted ? "✓" : index + 1}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-sm",
              isActive ? "font-semibold text-primary" : "text-primaryGray"
            )}
          >
            {step.label}
          </span>
          {step.description && (
            <span className="block truncate text-xs text-primaryGray">{step.description}</span>
          )}
          <span className="sr-only">{statusText}</span>
        </span>
      </>
    );

    const itemClassName = cn(
      "group flex min-w-0 items-center gap-3 rounded-lg px-2 py-1 transition-colors",
      interactive && !disabled && "cursor-pointer hover:bg-primary/5",
      interactive && disabled && "cursor-not-allowed opacity-60",
      interactive && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    );

    if (!interactive) {
      return (
        <div aria-current={isActive ? "step" : undefined} className={itemClassName}>
          {stepNode}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onStepChange?.(step.id)}
        aria-current={isActive ? "step" : undefined}
        aria-label={step.ariaLabel || step.label}
        disabled={disabled}
        className={itemClassName}
      >
        {stepNode}
      </button>
    );
  };

  const mobileProgress = ((activeIndex + 1) / steps.length) * 100;

  return (
    <nav
      className={cn(
        "w-full",
        layout === "vertical" && "rounded-xl border border-lightGray bg-white p-4",
        className
      )}
      aria-label={ariaLabel || title || "Form progress"}
    >
      {title && <p className="mb-4 text-sm font-semibold text-primary">{title}</p>}

      {showMobileSummary && (
        <div className="mb-4 md:hidden">
          <p className="text-xs font-medium uppercase tracking-wide text-primaryGray">
            Step {activeIndex + 1} of {steps.length}
          </p>
          <p className="mt-1 text-sm font-semibold text-primary" aria-live="polite">
            {activeLabel}
          </p>
          <div
            className="mt-2 h-1.5 w-full rounded-full bg-lightGray/70"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={activeIndex + 1}
            aria-valuetext={`${activeLabel}, step ${activeIndex + 1} of ${steps.length}`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${mobileProgress}%` }}
            />
          </div>
        </div>
      )}

      {layout === "vertical" ? (
        <ol className="hidden md:flex md:flex-col md:gap-2">
          {steps.map((step, index) => (
            <li key={String(step.id)} className="flex flex-col">
              {renderStep(step, index)}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn("ml-5 mt-1 h-4 w-px bg-lightGray", index < activeIndex && "bg-primary/40")}
                />
              )}
            </li>
          ))}
        </ol>
      ) : (
        <ol className="hidden md:flex md:items-center">
          {steps.map((step, index) => (
            <li key={String(step.id)} className="flex min-w-0 flex-1 items-center">
              {renderStep(step, index)}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-px flex-1 bg-lightGray",
                    index < activeIndex && "bg-primary/40"
                  )}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
};
