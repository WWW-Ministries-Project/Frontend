import { ApiResponse } from "@/utils/interfaces";
import { useCallback } from "react";
import useState from "react-usestateref";

export const useDelete = (
  deleteFunction: (id: string | number) => Promise<ApiResponse<void>>
) => {
  const [loading, setLoading] = useState(false);
  const [, setError, errorRef] = useState<Error | null>(null);
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

  return { executeDelete, loading, error: errorRef.current, success };
};
