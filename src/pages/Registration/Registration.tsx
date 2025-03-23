import Stepper from "@components/Stepper";
import { useState } from "react";

const steps = [
  { label: "User Info", content: <div>Form 1: User Info</div> },
  { label: "Contact Info", content: <div>Form 2: Contact Info</div> },
  { label: "Children", content: <div>Form 3: Children</div> },
  { label: "Work Info", content: <div>Form 4: Work Info</div> },
];

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    // Run validation or async checks before proceeding
    console.log(`Validating step ${currentStep}`);
    // Proceed to the next step if checks pass
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="bg-[url('https://res.cloudinary.com/akwaah/image/upload/v1740860331/background_oswjfy.jpg')] bg-no-repeat bg-right bg-cover h-screen flex items-center">
      <div className="p-10 bg-white w-2/3 h-4/5 mx-auto">
        <h2 className="text-2xl font-bold mb-4">Let's get started</h2>
        <Stepper
          steps={steps}
          currentStep={currentStep}
          handleNext={handleNext}
          handleBack={handleBack}
        />
      </div>
    </div>
  );
};

export default App;
