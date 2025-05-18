import { showLoader } from "@/pages/HomePage/utils";
import { ApiResponse, QueryType } from "@/utils/interfaces";
import { useCallback } from "react";
import useState from "react-usestateref";

export const useDelete = (
  deleteFunction: (query: QueryType) => Promise<ApiResponse<void>>
) => {
  const [loading, setLoading] = useState(false);
  const [, setError, errorRef] = useState<Error | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const executeDelete = useCallback(
    async (query: QueryType): Promise<void> => {
      showLoader(true);
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        await deleteFunction(query);
        setSuccess(true);
      } catch (error) {
        setError(error as Error);
      } finally {
        showLoader(false);
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteFunction]
  );

  return { executeDelete, loading, error: errorRef.current, success };
};
