import { useCallback, useEffect, useState } from "react";
export const useFetch = (
  fetchFunction: () => Promise<any>,
  params: string | number
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetchFunction();
      setData(response);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [params, fetchFunction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch:fetchData };
};
