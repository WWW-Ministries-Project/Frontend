import { useCallback, useState } from "react";

export const useDelete = (
  deleteFunction: (id: string | number) => void,
  id: string | number
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const executeDelete = useCallback(
    async (id: string | number) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        deleteFunction(id);
        setSuccess(true)
        console.log(success,"mmm")
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    },
    [deleteFunction]
  );

  return {executeDelete, loading, error, success};
};
