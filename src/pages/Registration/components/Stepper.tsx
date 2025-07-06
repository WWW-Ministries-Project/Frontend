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
    <div className="mx-auto relative">
      {/* Step Indicators */}
      <div className="hidden md:flex justify-between  items-center mb-2 sticky top-24 bg-white py-4 px-4 border-b border-gray-200  z-10 ">
        {steps.map((step, index) => (
          <Fragment key={index+step.label}>
          <div  className="flex items-center ">
            <div
              className={`flex items-center gap-2 ${
                index === currentStep ? "font-bold text-primary" : ""
              }`}
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full border ${
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

      {/* Navigation Buttons */}
      <div className="flex justify-between sticky bottom-0 bg-white py-4 px-4 border-t border-gray-200 w-full">
        <div>
          {currentStep !== 0 && (
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="secondary"
              value="Back"
            />
          )}
        </div>
        <Button
          onClick={handleNext}
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