import { ApiResponse } from "@/utils/interfaces";
import { useCallback, useState } from "react";

export const useDelete = (
  deleteFunction: (id: string | number) => Promise<ApiResponse<void>>, // Expecting a Promise-returning function
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const executeDelete = useCallback(
    async (id: string | number): Promise<void> => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        await deleteFunction(id);
        setSuccess(true);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    },
    [deleteFunction]
  );

  return { executeDelete, loading, error, success };
};
