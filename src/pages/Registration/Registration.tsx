import ChurchLogo from "@/components/ChurchLogo";
import { Stepper } from "@/pages/Registration/components/Stepper";
import {
  ChildrenSubForm,
  ContactDetails,
  ContactsSubForm,
  UserSubForm,
} from "@components/subform";
import { Formik } from "formik";
import { useState } from "react";
import { WorkInfoSubForm } from "../HomePage/pages/Members/Components/subforms/WorkInfoSubForm";

const steps = [
  { label: "User Info", content: <UserSubForm /> },
  { label: "Contact Info", content: <ContactsSubForm /> },
  { label: "Children", content: <ChildrenSubForm /> },
  { label: "Work Info", content: <WorkInfoSubForm /> },
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
      <div className="bg-white w-2/3 max-w-[1000px] h-[90%] mx-auto overflow-y-scroll rounded-lg">
        <div className="flex flex-col items-center">
          <ChurchLogo className={" mb-5 "} show={true} />
          <h2 className="p-1 text-sm md:text-2xl font-bold mb-4">
            Welcome to our registration portal
          </h2>
          <p className="md:text-2xl mb-4">Let's get started</p>
        </div>
        <Formik initialValues={initialValues} onSubmit={() => {}}>
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

const initialValues = {
  ...UserSubForm.initialValues,
  ...ContactDetails.initialValues,
  ...ContactsSubForm.initialValues,
  ...ChildrenSubForm.initialValues,
  ...WorkInfoSubForm.initialValues,
};

export default Registration;
