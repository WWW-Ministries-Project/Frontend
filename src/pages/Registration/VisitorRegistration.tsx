// TODO remove THE next time you see this
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import {
  IVisitorForm,
  VisitorForm,
} from "@/pages/HomePage/pages/VisitorManagement/Components/VisitorForm";
import { showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { decodeToken } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useState } from "react";

const VISITOR_REDIRECT_DELAY_MS = 10000;

const hasSuccessfulStatus = (response: unknown): boolean => {
  if (!response || typeof response !== "object") return false;
  const status = (response as { status?: unknown }).status;
  return typeof status === "number" && status >= 200 && status < 300;
};

export const VisitorRegistration = () => {
  const [registrationSuccess, setRegistrationSuccess] =
    useState<boolean>(false);
  const {
    postData,
    loading,
    data: registrationResponse,
    error,
  } = usePost(api.post.createVisitor);
  const { data, refetch } = useFetch(api.fetch.fetchEvents, {}, true);
  const store = useStore();
  const user = decodeToken();

  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => {
        window.location.href = "https://worldwidewordministries.org/";
      }, VISITOR_REDIRECT_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [registrationSuccess]);

  useEffect(() => {
    if (!registrationResponse) return;

    if (hasSuccessfulStatus(registrationResponse)) {
      setRegistrationSuccess(true);
      return;
    }

    showNotification(
      "Unable to complete visitor registration. Please try again.",
      "error"
    );
  }, [registrationResponse]);

  useEffect(() => {
    if (!error) return;
    showNotification(
      error.message || "Unable to complete visitor registration.",
      "error"
    );
  }, [error]);

  async function handleSubmit(values: IVisitorForm) {
    await postData(values);
  }

  useEffect(() => {
    if (!user?.id) {
      refetch();
    }
  }, [user?.id, refetch]);

  useEffect(() => {
    if (data) {
      store.setEvents(data.data);
    }
  }, [data, store]);

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
            You will be redirected to our homepage in{" "}
            {Math.floor(VISITOR_REDIRECT_DELAY_MS / 1000)} seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="bg-white w-full max-w-4xl mx-auto rounded-lg px-4 md:px-8 flex-1 flex flex-col max-h-screen overflow-hidden">
        <div className="bg-white flex flex-col items-center space-y-3 pt-4 pb-4 rounded-lg flex-shrink-0">
          <div className="text-center">
            <h2 className="p-1 text-xl md:text-2xl font-bold">
              Welcome to our visitor registration portal
            </h2>
            <p className="text-sm md:text-lg">
              Let&apos;s get started with your visitor registration
            </p>
          </div>
        </div>
        <VisitorForm
          onClose={() => {}}
          onSubmit={handleSubmit}
          loading={loading}
          showHeader={false}
        />
      </div>
    </main>
  );
};
