import { useState } from "react";
import { pictureInstance as axiosPic } from "@/axiosInstance";

export function useImageUpload() {
  const [addingImage, setAddingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (formData: FormData): Promise<{ URL: string } | null> => {
    setAddingImage(true);
    setUploadError(null); 

    try {
      const response = await axiosPic.post("/upload", formData);
      if (response.status === 200) {
        return { URL: response.data.result.link as string };
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      console.error("Image upload error:", errorMessage);
      setUploadError(errorMessage);
      return null; 
    } finally {
      setAddingImage(false);
    }
  };

  return { addingImage, handleUpload, uploadError };
}
