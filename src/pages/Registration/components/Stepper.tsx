import { FormLayout } from "@/components/ui";
import { Button } from "@/components";

interface IProps {
  steps: IStep[];
  currentStep: number;
  handleNext: () => void;
  handleBack: () => void;
}

export const Stepper = ({
  steps,
  currentStep,
  handleNext,
  handleBack,
}: IProps) => {
  return (
    <div className=" mx-auto  ">
      {/* Step Indicators */}
      <div className="hidden md:flex justify-between items-center mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w- h-8 flex items-center justify-center rounded-full gap-2
                ${index === currentStep ? "font-bold text-primary" : ""}
              `}
            >
              <span className={`w-4 h-4 md:w-8 md:h-8 flex items-center justify-center rounded-full border ${index === currentStep ? "bg-primary text-white " : ""}`}>
                {index + 1}
              </span>
              {/* <div className="h-2 w-5 bg-gray-300"></div> */}
              <span>{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-6">
        <FormLayout>{steps[currentStep].content}</FormLayout>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
        {(currentStep !== 0)&&<Button
          onClick={handleBack}
          disabled={currentStep === 0}
          variant="secondary"
          value="Back"
        />}
        </div>
        <Button
          onClick={handleNext}
          className="px-4 py-2 bg-primary text-white rounded"
          value={currentStep === steps.length - 1 ? "Submit" : "Next"}
        />
      </div>
    </div>
  );
};

interface IStep {
  label: string;
  content: JSX.Element;
}
