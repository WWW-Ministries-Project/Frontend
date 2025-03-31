//TODO: UPDATE THIS AFTER DEMO

import { pictureInstance as axiosPic } from "@/axiosInstance";
import ChurchLogo from "@/components/ChurchLogo";
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
import { useCountryStore } from "../HomePage/store/coutryStore";
import { fetchCountries } from "../HomePage/utils";
import {
  IRegistrationContactSubForm,
  RegistrationContactSubForm,
} from "./components/subform/ContactSubForm";

const Registration = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { postData, loading, error, data } = usePost<
    ApiResponse<{ data: IRegistration }>
  >(api.post.createMember);

  const countryStore = useCountryStore();

  // Fetch countries on mount if not already in store
  useEffect(() => {
    if (!countryStore.countries.length) {
      fetchCountries().then((data) => {
        countryStore.setCountries(data);
      });
    }
  }, [countryStore]);

  async function handleSubmit(values: IRegistration) {
    console.log(values, "values");

    let dataToSend: IRegistration = { ...values };

    try {
      let uploadedFile = values.personal_info.picture.picture;

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
    } catch (error) {
      console.error("Error during submission:", error);
    }
  }

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
                console.log("Validation failed:", errors);
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
                handleBack={() =>
                  setCurrentStep((prev) => Math.max(0, prev - 1))
                }
              />
            );
          }}
        </Formik>
      </div>
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
  { label: "User Info", content: <UserSubForm prefix="personal_info" /> },
  { label: "Contact Info", content: <RegistrationContactSubForm /> },
  ...(hasChildren ? [{ label: "Children", content: <ChildrenSubForm /> }] : []),
  { label: "Work Info", content: <WorkInfoSubForm prefix="work_info" /> },
];

const getValidationSchema = (hasChildren: boolean): ObjectSchema<any>[] => [
  object({ personal_info: object(UserSubForm.validationSchema) }),
  object({ ...RegistrationContactSubForm.validationSchema }),
  ...(hasChildren ? [object({ ...ChildrenSubForm.validationSchema })] : []),
  object({ work_info: object(WorkInfoSubForm.validationSchema) }),
];

export default Registration;
