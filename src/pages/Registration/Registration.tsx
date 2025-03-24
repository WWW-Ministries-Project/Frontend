import ChurchLogo from "@/components/ChurchLogo";
import { Stepper } from "@/pages/Registration/components/Stepper";
import {
  ChildrenSubForm,
  ContactsSubForm,
  IChildrenSubForm,
  IContactsSubForm,
  IUserSubForm,
  UserSubForm,
} from "@components/subform";
import { Formik } from "formik";
import { useState } from "react";
import { object } from "yup";
import {
  IWorkInfoSubForm,
  WorkInfoSubForm,
} from "../HomePage/pages/Members/Components/subforms/WorkInfoSubForm";

const steps = [
  { label: "User Info", content: <UserSubForm prefix={`personal_info`} /> },
  {
    label: "Contact Info",
    content: <ContactsSubForm prefix={`contact_info`} />,
  },
  { label: "Children", content: <ChildrenSubForm /> },
  { label: "Work Info", content: <WorkInfoSubForm prefix="work_info" /> },
];

const Registration = () => {
  // const [steps, setSteps] = useState(stepss);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async (
    validateForm: () => Promise<any>,
    formikSubmit: () => void
  ) => {
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      console.log("Validation failed:", errors);
      return;
    }
    setCurrentStep((prev) => (prev == steps.length - 1 ? prev : prev + 1));
    if (currentStep === steps.length - 1) {
      formikSubmit();
    }
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
        <Formik
          initialValues={initialValues}
          onSubmit={(values) => console.log(values, "values")}
          validationSchema={validationSchema[currentStep]}
        >
          {({ handleSubmit, validateForm }) => (
            <>
              <Stepper
                steps={steps}
                currentStep={currentStep}
                handleNext={() => {
                  handleNext(validateForm, handleSubmit);
                }}
                handleBack={handleBack}
              />
            </>
          )}
        </Formik>
      </div>
    </div>
  );
};

interface IRegistration extends IChildrenSubForm {
  personal_info: IUserSubForm;
  contact_info: IContactsSubForm;
  work_info: IWorkInfoSubForm;
  status: "UNCONFIRMED" | "CONFIRMED" | "REJECTED";
}
const validationSchema = [
  object({ personal_info: object(UserSubForm.validationSchema) }),
  object({ contact_info: object(ContactsSubForm.validationSchema) }),
  // object({ children: object(ChildrenSubForm.validationSchema) }),
  object({ work_info: object(WorkInfoSubForm.validationSchema) }),
];

const initialValues: IRegistration = {
  personal_info: UserSubForm.initialValues,
  contact_info: ContactsSubForm.initialValues,
  work_info: WorkInfoSubForm.initialValues,
  status: "UNCONFIRMED",
  ...ChildrenSubForm.initialValues,
};

export default Registration;
