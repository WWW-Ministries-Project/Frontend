import { pictureInstance as axiosPic } from "@/axiosInstance";
import { useState } from "react";
import { showNotification } from "@/pages/HomePage/utils";
import { validateUploadFile } from "@/utils/uploadValidation";

const extractFileFromFormData = (formData: FormData): File | null => {
  const file = formData.get("file");
  return file instanceof File ? file : null;
};

export const useImageUpload = () => {
  const [addingImage, setAddingImage] = useState(false);

  const handleUpload = async (
    formData: FormData
  ): Promise<{ URL: string } | null> => {
    const file = extractFileFromFormData(formData);
    if (file) {
      const validation = validateUploadFile(file);
      if (!validation.valid) {
        showNotification(
          validation.message || "Invalid file selected.",
          "error",
          "File upload"
        );
        return null;
      }
    }

    try {
      setAddingImage(true);
      const response = await axiosPic.post("/upload", formData);
      if (response.status === 200) {
        return { URL: response.data.result.link as string };
      }
      return null;
    } catch (error) {
      console.error("Image upload failed", error);
      return null;
    } finally {
      setAddingImage(false);
    }
  };

  return { handleUpload, addingImage };
};
