import React, { ReactNode } from "react";
import useFileUpload from "@/CustomHooks/useFileUpload";

interface UploadButtonProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onFileChange,
  disabled = false,
  children,
  className = "",
}) => {
  const { handleFileChange } = useFileUpload(onFileChange);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        id="fileUpload"
        disabled={disabled}
      />
      <label
        htmlFor="fileUpload"
        className="flex items-center justify-center w-full h-full cursor-pointer"
      >
       {children}
      </label>
    </div>
  );
};

export default UploadButton;
