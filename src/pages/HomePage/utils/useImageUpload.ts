import { pictureInstance as axiosPic } from "@/axiosInstance";
import { useState } from "react";

export const useImageUpload = () => {
  const [addingImage, setAddingImage] = useState(false);

  const handleUpload = async (
    formData: FormData
  ): Promise<{ URL: string } | null> => {
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
