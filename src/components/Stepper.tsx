import React from "react";

interface Step {
  label: string;
  content: JSX.Element;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  handleNext: () => void;
  handleBack: () => void;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  handleNext,
  handleBack,
}) => {
  return (
    <div className=" mx-auto p-6">
      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w- h-8 flex items-center justify-center rounded-full gap-2
                ${index === currentStep ? "font-bold" : ""}
              `}
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-full border">{index + 1}</span>
              {/* <div className="h-2 w-5 bg-gray-300"></div> */}
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-16 h-1 bg-gray-300 mx-2"></div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-6">{steps[currentStep].content}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {currentStep === steps.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default Stepper;
