export interface StepperStep<T extends string = string> {
  id: T;
  label: string;
}

interface NewStepperProps<T extends string = string> {
  steps: StepperStep<T>[];
  activeStep: T;
  onStepChange?: (step: T) => void;
  title?: string;
}

const NewStepper = <T extends string>({
  steps,
  activeStep,
  onStepChange,
  title = "Progress",
}: NewStepperProps<T>) => {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <aside className="w-full max-w-xs rounded-xl border border-lightGray bg-white p-4">
      <div className="mb-5 text-sm font-semibold text-primary">
        {title}
      </div>

      <div className="flex flex-col gap-4">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep;
          const isCompleted = index < activeIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange?.(step.id)}
                className={`flex items-center gap-3 rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-primary/5 font-medium text-primary"
                    : "text-primaryGray hover:bg-lightGray/30 hover:text-primary"
                }`}
              >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                    ? "border-primary text-primary"
                    : "border-lightGray text-primaryGray"
                }`}
              >
                {isCompleted ? "✓" : index + 1}
              </span>

              <span>{step.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default NewStepper;
