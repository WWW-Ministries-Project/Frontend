import { ProgressStepper, type StepperStep } from "@/components/ui/form/ProgressStepper";

interface NewStepperProps<T extends string = string> {
  steps: StepperStep<T>[];
  activeStep: T;
  onStepChange?: (step: T) => void;
  title?: string;
  className?: string;
}

const NewStepper = <T extends string>({
  steps,
  activeStep,
  onStepChange,
  title = "Progress",
  className,
}: NewStepperProps<T>) => {
  return (
    <ProgressStepper
      steps={steps}
      activeStep={activeStep}
      onStepChange={onStepChange}
      title={title}
      ariaLabel={title}
      layout="vertical"
      className={className}
    />
  );
};

export default NewStepper;
export type { StepperStep };
