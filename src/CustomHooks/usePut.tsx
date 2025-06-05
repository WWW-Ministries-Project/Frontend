import { QueryType } from "@/utils/interfaces";
import { useState, useCallback } from "react";

export const usePut = <T,K>(putFunction: (payload: K,query?:QueryType) => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateData = useCallback(async (payload: K,query?:QueryType) => {
    setError(null);
    setLoading(true);

    try {
      const response = await putFunction(payload,query);
      setData(response);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [putFunction]);
  return { data, loading, error, updateData,setData };
};
