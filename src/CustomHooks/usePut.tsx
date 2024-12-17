import React from "react";

const usePut = <T,>(putFunction: (payload: any) => Promise<T>) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const updateData = React.useCallback(async (payload: any) => {
    setError(null);
    setLoading(true);

    try {
      const response = await putFunction(payload);
      setData(response);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [putFunction]);
  return { data, loading, error, updateData };
};

export default usePut;
