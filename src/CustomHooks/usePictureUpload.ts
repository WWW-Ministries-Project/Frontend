import { useCallback, useState } from "react";

import { pictureInstance as axiosPic } from "@/axiosInstance";
import { showNotification } from "@/pages/HomePage/utils";
import { validateUploadFile } from "@/utils/uploadValidation";

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const extractFileFromFormData = (formData: FormData): File | null => {
  const file = formData.get("file");
  return file instanceof File ? file : null;
};

export function usePictureUpload() {
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback(
    async (formData: FormData): Promise<string | null> => {
      setLoading(true);

      try {
        const file = extractFileFromFormData(formData);
        if (file) {
          const validation = validateUploadFile(file, {
            allowedMimeTypes: IMAGE_MIME_TYPES,
          });

          if (!validation.valid) {
            showNotification(
              validation.message || "Invalid image selected.",
              "error",
              "Image upload"
            );
            return null;
          }
        }

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
