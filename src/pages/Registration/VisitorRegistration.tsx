// TODO remove THE next time you see this 
import { usePost } from "@/CustomHooks/usePost";
import {
  IVisitorForm,
  VisitorForm,
} from "@/pages/HomePage/pages/VisitorManagement/Components/VisitorForm";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useState } from "react";

export const VisitorRegistration = () => {
  const [registrationSuccess, setRegistrationSuccess] =
    useState<boolean>(false);
  const { postData, loading } = usePost(api.post.createVisitor);

  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        window.location.href = "https://worldwidewordministries.org/";
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess]);

  async function handleSubmit(values: IVisitorForm) {
    try {
      await postData(values);
      setRegistrationSuccess(true);
    } catch {
      // Error is handled by the usePost hook
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
              Visitor Registration Successful
            </h2>
            <p className="text-gray-700">
              Thank you for registering as a visitor to the Worldwide Word
              Ministries. We look forward to connecting with you soon.
            </p>
          </div>
          <p className="text-gray-500 text-sm">
            You will be redirected to our homepage in 10 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="py-8">
      <div className="bg-white w-full h-full sm:max-h-[80vh] mx-auto overflow-y-scroll rounded-lg px-8">
        <div className="sticky top-0 bg-white flex flex-col items-center space-y-3 pt-8 z-10 rounded-lg w-[calc(100%+px)] -mx-8">
          <div className="text-center">
            <h2 className="p-1 text-xl md:text-2xl font-bold">
              Welcome to our visitor registration portal
            </h2>
            <p className="text-sm md:text-lg">
              Let&apos;s get started with your visitor registration
            </p>
          </div>
        </div>
        <div className="py-8">
          <VisitorForm
            onClose={() => {}}
            onSubmit={handleSubmit}
            loading={loading}
            showHeader={false}
          />
        </div>
      </div>
    </main>
  );
};
