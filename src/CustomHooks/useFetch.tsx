import { showNotification } from "@/pages/HomePage/utils";
import { useCallback, useEffect, useState } from "react";
export const useFetch = <T,>(
  fetchFunction: (params?: Record<string, string | number>) => Promise<T>,
  params?: Record<string, string | number>,
  lazy?: boolean
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (overrideParams?: Record<string, string | number>) => {
      setError(null);
      setLoading(true);

      try {
        const response = await fetchFunction(overrideParams || params);
        setData(response);
        return response;
      } catch (err) {
        if (!navigator.onLine)
          showNotification(
            "You are offline. Please check your internet connection.",
            "error"
          );
        else
          setError(error instanceof Error ? error : new Error("Unknown error"));
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction]
  );

  useEffect(() => {
    !lazy && fetchData();
  }, [fetchData, lazy]);

  return { data, loading, error, refetch: fetchData };
};
