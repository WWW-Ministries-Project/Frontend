import { FormLayout } from "@/components/ui";
import { Button } from "@/components";
import { Fragment } from "react/jsx-runtime";

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
  return (
    <div className="relative mx-auto w-full">
      <div className="sticky top-0 z-10 mb-3 hidden items-center justify-between overflow-x-auto border-b border-lightGray bg-white px-4 py-4 md:flex">
        {steps.map((step, index) => (
          <Fragment key={index+step.label}>
          <div  className="flex items-center ">
            <div
              className={`flex items-center gap-2 ${
                index === currentStep ? "font-bold text-primary" : ""
              }`}
            >
              <span
                className={`min-w-8 min-h-8 flex items-center justify-center rounded-full border ${
                  index === currentStep ? "bg-primary text-white" : ""
                }`}
              >
                {index + 1}
              </span>
              <span>{step.label}</span>
            </div>
            
            
          </div>
          {index < steps.length - 1 && (
              <div id="seperator" className="h-0.5  bg-gray-300 mx-2"></div>
            )}
          </Fragment>
          
        ))}
        
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
          className="px-4 py-2 bg-primary text-white rounded"
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
