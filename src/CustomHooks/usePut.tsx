import React from "react";

export const usePut = <T,K>(putFunction: (payload: K,id?:string) => Promise<T>) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const updateData = React.useCallback(async (payload: K,id?:string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await putFunction(payload,id);
      setData(response);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [putFunction]);
  return { data, loading, error, updateData };
};
