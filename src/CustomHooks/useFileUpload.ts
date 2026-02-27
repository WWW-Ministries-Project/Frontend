import { useState } from "react";
import { showNotification } from "@/pages/HomePage/utils";
import { validateUploadFile } from "@/utils/uploadValidation";

const useFileUpload = (onFileChange?: (file: File) => void) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const isValid = handleFile(files[0]);
      if (!isValid) {
        e.target.value = "";
      }
    }
  };

  const handleFile = (file: File) => {
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      showNotification(
        validation.message || "Invalid file selected.",
        "error",
        "File upload"
      );
      return false;
    }

    setFile(file);
    if (onFileChange) {
      onFileChange(file);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    return true;
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return {
    isDragActive,
    file,
    preview,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileChange,
    clearFile,
  };
};

export default useFileUpload;
