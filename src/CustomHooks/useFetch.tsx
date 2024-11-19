import { useCallback, useEffect, useState } from "react";
export const useFetch = <T,>(
  fetchFunction: (params?: Record<string, string|number>) => Promise<T>,
  params?: Record<string, string|number>,
  lazy?: boolean
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetchFunction(params);
      setData(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    !lazy && fetchData();
  }, [fetchData, lazy]);

  return { data, loading, error, refetch: fetchData };
};
