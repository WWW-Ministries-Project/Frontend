import React, { ReactNode } from "react";
import useFileUpload from "@/CustomHooks/useFileUpload";
import { DEFAULT_UPLOAD_ACCEPT } from "@/utils/uploadValidation";

interface UploadButtonProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  accept?: string;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onFileChange,
  disabled = false,
  children,
  className = "",
  accept = DEFAULT_UPLOAD_ACCEPT,
}) => {
  const { handleFileChange } = useFileUpload(onFileChange);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <input
        type="file"
        accept={accept}
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
