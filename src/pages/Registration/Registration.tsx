import { pictureInstance as axiosPic } from "@/axiosInstance";
import { ProfilePicture } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import { FullWidth } from "@/components/ui";
import { usePost } from "@/CustomHooks/usePost";
import { Stepper } from "@/pages/Registration/components/Stepper";
import { api } from "@/utils/api/apiCalls";
import {
  ChildrenSubForm,
  IChildrenSubForm,
  IUserSubForm,
  UserSubForm,
} from "@components/subform";
import { Field, Formik, FormikProps, useFormikContext } from "formik";
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

export const Registration = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const [registrationSuccess, setRegistrationSuccess] =
    useState<boolean>(false);
  const { postData, loading, error, data } = usePost(api.post.createMember);

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
      const uploadedFile = values.picture?.picture;

      if (uploadedFile instanceof File) {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await axiosPic.post(`${baseUrl}upload`, formData);

        if (response?.status === 200) {
          dataToSend = {
            ...values,
            picture: { src: response.data.result.link, picture: null },
          };
        } else {
          throw new Error("Image upload failed");
        }
      }
      await postData(dataToSend);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error("Error during submission:", error);
    }
  }

  if (registrationSuccess) {
    return (
      <div className="bg-white w-full md:w-2/3 mx-auto rounded-lg px-8 py-12">
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
              Thank you for registering to be a member of the Worldwide Word
              Ministries. A contact person from the registry team will reach out
              to you soon.
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
    <main className="  py-8">
      <div className="bg-white w-full h-full sm:max-h-[80vh] mx-auto overflow-y-scroll rounded-lg px-8">
        <div className="sticky top-0 bg-white flex flex-col items-center space-y-3 pt-8 z-10 rounded-lg w-[calc(100%+px)] -mx-8">
          <div className="text-center">
            <h2 className="p-1 text-xl md:text-2xl font-bold">
              Welcome to our registration portal
            </h2>
            <p className="text-sm md:text-lg">
              Let&apos;s get started with your registration
            </p>
          </div>
        </div>
        <Formik
          initialValues={initialValues}
          onSubmit={(values) => handleSubmit(values)}
          validationSchema={{}}
        >
          {(formik: FormikProps<IRegistration>) => {
            const steps = getSteps(formik.values.personal_info.has_children);
            const handleNext = async () => {
              const errors: object = await formik.validateForm();
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
              <>
                <ChildrenResetWatcher />
                <Stepper
                  steps={steps}
                  currentStep={currentStep}
                  handleNext={handleNext}
                  loading={loading}
                  handleBack={() =>
                    setCurrentStep((prev) => Math.max(0, prev - 1))
                  }
                />
              </>
            );
          }}
        </Formik>
      </div>
    </main>
  );
};

interface IRegistration extends IChildrenSubForm, IRegistrationContactSubForm {
  personal_info: IUserSubForm;
  work_info: IWorkInfoSubForm;
  picture: {
    src: string;
    picture: File | null;
  };
  status: "UNCONFIRMED" | "CONFIRMED" | "REJECTED";
  church_info: {
    membership_type: "ONLINE" | "IN_HOUSE";
  };
}

const initialValues: IRegistration = {
  personal_info: UserSubForm.initialValues,
  work_info: WorkInfoSubForm.initialValues,
  status: "UNCONFIRMED",
  picture: {
    src: "",
    picture: null,
  },
  church_info: { membership_type: "ONLINE" },
  ...ChildrenSubForm.initialValues,
  ...RegistrationContactSubForm.initialValues,
};

const getSteps = (hasChildren: boolean) => [
  {
    label: "Personal Information",
    content: <FirstStep />,
  },
  { label: "Contact Information", content: <RegistrationContactSubForm /> },
  ...(hasChildren
    ? [{ label: "Family Information", content: <ChildrenSubForm /> }]
    : []),
  {
    label: "Work Information",
    content: <WorkInfoSubForm prefix="work_info" />,
  },
];

const getValidationSchema = (
  hasChildren: boolean
): ObjectSchema<typeof getSteps>[] => [
  object({ personal_info: object(UserSubForm.validationSchema) }),
  object({ ...RegistrationContactSubForm.validationSchema }),
  ...(hasChildren ? [object({ ...ChildrenSubForm.validationSchema })] : []),
  object({ work_info: object(WorkInfoSubForm.validationSchema) }),
];

const useChildrenFieldReset = () => {
  const formik = useFormikContext<IRegistration>();

  useEffect(() => {
    if (!formik.values.personal_info.has_children) {
      formik.setFieldValue("children", []);
    } else {
      formik.setFieldValue("children", initialValues.children);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.personal_info.has_children]);
};

const ChildrenResetWatcher = () => {
  useChildrenFieldReset();
  return null;
};

const FirstStep = () => {
  const { values, setFieldValue } = useFormikContext<IRegistration>();
  return (
    <>
      <FullWidth>
        <div className="">
          <ProfilePicture
            className="h-[8rem] w-[8rem] outline-lightGray mt-3 profilePic transition-all outline outline-1 duration-1000 mb-2"
            id="profile_picture"
            name="profile_picture"
            src={values.picture.src}
            editable={true}
            alt="Profile Picture"
            onChange={(obj) => {
              setFieldValue(`picture`, obj);
            }}
            textClass={"text-3xl text-primary"}
          />
          <p className="text-sm ">
            Click on the <strong>pen icon</strong> to upload your profile image{" "}
          </p>
        </div>
      </FullWidth>
      <UserSubForm prefix="personal_info" />
      <Field
        component={FormikInputDiv}
        label="Date joined"
        name="church_info.membership_type"
        type="date"
      />
    </>
  );
};
