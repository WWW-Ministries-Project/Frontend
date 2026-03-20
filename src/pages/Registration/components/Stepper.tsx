import { FormLayout } from "@/components/ui";
import { Button } from "@/components";
import { ProgressStepper } from "@/components/ui/form/ProgressStepper";

interface IProps {
  steps: IStep[];
  currentStep: number;
  handleNext: () => void;
  handleBack: () => void;
  loading?: boolean;
}

export const Stepper = ({
  steps,
  currentStep,
  handleNext,
  handleBack,
  loading = false,
}: IProps) => {
  const progressSteps = steps.map((step, index) => ({
    id: index,
    label: step.label,
  }));

  return (
    <div className="relative mx-auto w-full">
      <div className="sticky top-0 z-10 mb-4 border-b border-lightGray bg-white px-4 py-4">
        <ProgressStepper
          steps={progressSteps}
          activeStep={currentStep}
          ariaLabel="Registration progress"
        />
      </div>

      {/* Step Content */}
      <div className="mb-6">
        <FormLayout>{steps[currentStep].content}</FormLayout>
      </div>

      <div className="sticky bottom-0 flex w-full justify-between border-t border-lightGray bg-white px-4 py-4">
        <div>
          {currentStep !== 0 && (
            <Button
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              variant="secondary"
              value="Back"
            />
          )}
        </div>
        <Button
          onClick={handleNext}
          disabled={loading}
          variant="primary"
          value={currentStep === steps.length - 1 ? "Submit" : "Next"}
          loading={loading}
        />
      </div>
    </div>
  );
};

interface IStep {
  label: string;
  content: JSX.Element;
}
