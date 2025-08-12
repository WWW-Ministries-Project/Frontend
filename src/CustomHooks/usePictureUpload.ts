import { useCallback, useState } from "react";

import { pictureInstance as axiosPic } from "@/axiosInstance";
import { showNotification } from "@/pages/HomePage/utils";

export function usePictureUpload() {
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback(
    async (formData: FormData): Promise<string | null> => {
      setLoading(true);

      try {
        const response = await axiosPic.post("/upload", formData);
        if (response.status === 200) {
          return response.data.result.link;
        }
        return null;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        showNotification(errorMessage, "error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, handleUpload };
}
