import { showNotification } from "@/pages/HomePage/utils";
import React from "react";

export const usePost = <T,K>(postFunction: (payload: K) => Promise<T>) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const postData = React.useCallback(async (payload: K) => {
    setError(null);
    setLoading(true);

    try {
      const response = await postFunction(payload);
      setData(response);
    } catch (error) {
      if(!navigator.onLine) showNotification("You are offline. Please check your internet connection.","error")
      else setError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [postFunction]);

  return { data, loading, error, postData };
};
