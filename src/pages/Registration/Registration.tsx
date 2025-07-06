import { pictureInstance as axiosPic } from "@/axiosInstance";
import { usePost } from "@/CustomHooks/usePost";
import { Stepper } from "@/pages/Registration/components/Stepper";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import {
  ChildrenSubForm,
  IChildrenSubForm,
  IUserSubForm,
  UserSubForm,
} from "@components/subform";
import { Formik, FormikProps } from "formik";
import { useEffect, useState } from "react";
import { object, ObjectSchema } from "yup";
import {
  IWorkInfoSubForm,
  WorkInfoSubForm,
} from "../../components/subform/WorkInfoSubForm";
import { baseUrl } from "../Authentication/utils/helpers";
import {
  IRegistrationContactSubForm,
  RegistrationContactSubForm,
} from "./components/subform/ContactSubForm";

const Registration = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const { postData, loading, error, data } = usePost<
    ApiResponse<{ data: IRegistration }>
  >(api.post.createMember);

  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        window.location.href = "https://worldwidewordministries.org/";
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess]);

  async function handleSubmit(values: IRegistration) {
    let dataToSend: IRegistration = { ...values };

    try {
      const uploadedFile = values.personal_info?.picture?.picture;

      if (uploadedFile instanceof File) {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await axiosPic.post(`${baseUrl}upload`, formData);

        if (response?.status === 200) {
          dataToSend = {
            ...values,
            personal_info: {
              ...values.personal_info,
              picture: { src: response.data.result.link, picture: null },
            },
          };
        } else {
          throw new Error("Image upload failed");
        }
      }

      // Send data regardless of whether an image was uploaded
      await postData(dataToSend);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error("Error during submission:", error);
    }
  }

  if (registrationSuccess) {
    return (
      <div className="bg-error w-full md:w-2/3 mx-auto rounded-lg px-8 py-12">
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-6">
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Registration Successful
            </h2>
            <p className="text-gray-700">
              Thank you for registering to be a member of the Worldwide Word Ministries.
              A contact person from the registry team will reach out to you soon.
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            You will be redirected to our homepage in 5 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white w-full md:w-2/3 max-h-[80vh] mx-auto overflow-y-scroll rounded-lg px-8">
      <div className="sticky top-0 bg-white flex flex-col items-center space-y-3 pt-8 z-10 rounded-lg w-[calc(100%+px)] -mx-8">
        <div className="text-center">
          <h2 className="p-1 text-xl md:text-2xl font-bold">
            Welcome to our registration portal
          </h2>
          <p className="text-sm md:text-lg">Let's get started with your registration</p>
        </div>
      </div>
      <Formik
        initialValues={initialValues}
        onSubmit={(values) => handleSubmit(values)}
        validationSchema={
          getValidationSchema(initialValues.personal_info.has_children)[
            currentStep
          ]
        }
      >
        {(formik: FormikProps<IRegistration>) => {
          const steps = getSteps(formik.values.personal_info.has_children);

          // Reset 'children' when 'has_children' is false
          useEffect(() => {
            if (!formik.values.personal_info.has_children) {
              formik.setFieldValue("children", undefined);
            } else if (!formik.values.children) {
              formik.setFieldValue(
                "children",
                ChildrenSubForm.initialValues.children
              );
            }
          }, [formik.values.personal_info.has_children]);

          const handleNext = async () => {
            const errors: any = await formik.validateForm();
            if (Object.keys(errors).length > 0) {
              formik.setTouched(errors);
              return;
            }
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
            if (currentStep === steps.length - 1) {
              formik.submitForm();
            }
          };

          return (
            <Stepper
              steps={steps}
              currentStep={currentStep}
              handleNext={handleNext}
              loading={loading}
              handleBack={() =>
                setCurrentStep((prev) => Math.max(0, prev - 1))
              }
            />
          );
        }}
      </Formik>
    </div>
  );
};

interface IRegistration extends IChildrenSubForm, IRegistrationContactSubForm {
  personal_info: IUserSubForm;
  work_info: IWorkInfoSubForm;
  status: "UNCONFIRMED" | "CONFIRMED" | "REJECTED";
}

const initialValues: IRegistration = {
  personal_info: UserSubForm.initialValues,
  work_info: WorkInfoSubForm.initialValues,
  status: "UNCONFIRMED",
  church_info: { membership_type: "ONLINE" },
  //@ts-expect-error
  children: undefined,
  ...RegistrationContactSubForm.initialValues,
};

const getSteps = (hasChildren: boolean) => [
  { label: "Personal Information", content: <UserSubForm prefix="personal_info" /> },
  { label: "Contact Information", content: <RegistrationContactSubForm /> },
  ...(hasChildren ? [{ label: "Family Information", content: <ChildrenSubForm /> }] : []),
  { label: "Work Information", content: <WorkInfoSubForm prefix="work_info" /> },
];

const getValidationSchema = (hasChildren: boolean): ObjectSchema<any>[] => [
  object({ personal_info: object(UserSubForm.validationSchema) }),
  object({ ...RegistrationContactSubForm.validationSchema }),
  ...(hasChildren ? [object({ ...ChildrenSubForm.validationSchema })] : []),
  object({ work_info: object(WorkInfoSubForm.validationSchema) }),
];

export default Registration;
