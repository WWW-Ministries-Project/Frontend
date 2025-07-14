import { showNotification } from "@/pages/HomePage/utils";
import { useCallback, useState } from "react";

export const usePost = <T, K>(postFunction: (payload: K) => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const postData = useCallback(
    async (payload: K) => {
      setError(null);
      setLoading(true);

      try {
        const response = await postFunction(payload);
        setData(response);
      } catch (error: unknown) {
        if (!navigator.onLine) {
          showNotification(
            "You are offline. Please check your internet connection.",
            "error"
          );
        } else if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const err = error as { response?: { data?: { message?: string } } };
          const message = err.response?.data?.message || "Server error";
          // showNotification(`Request failed: ${message}`, "error");
          setError(new Error(message));
        } else if (error instanceof Error) {
          // showNotification(error.message, "error");
          setError(error);
        } else {
          // showNotification("An unknown error occurred.", "error");
          setError(new Error("Unknown error"));
        }
      } finally {
        setLoading(false);
      }
    },
    [postFunction]
  );

  return { data, loading, error, postData };
};
