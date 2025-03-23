import Stepper from "@components/Stepper";
import { Formik } from "formik";
import { useState } from "react";
import { UserSubForm } from "./components/UserSubForm";
import { ContactDetails } from "../HomePage/Components/subforms/ContactDetails";
import { ContactsSubForm } from "./components/ContactsSubForm";

const steps = [
  { label: "User Info", content: <UserSubForm /> },
  { label: "Contact Info", content: <ContactsSubForm /> },
  { label: "Children", content: <div>Form 3: Children</div> },
  { label: "Work Info", content: <div>Form 4: Work Info</div> },
];

const Registration = () => {
  // const [steps, setSteps] = useState(stepss);
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
      <div className="p-10 bg-white w-2/3 h-[90%] mx-auto overflow-y-scroll">
        <h2 className="text-2xl font-bold mb-4">Let's get started</h2>
        <Formik initialValues={UserSubForm.initialValues} onSubmit={() => {}}>
          <Stepper
            steps={steps}
            currentStep={currentStep}
            handleNext={handleNext}
            handleBack={handleBack}
          />
        </Formik>
      </div>
    </div>
  );
};

export default Registration;
