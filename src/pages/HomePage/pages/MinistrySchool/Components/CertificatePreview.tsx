import React from "react";
import ChurchLogo from "@/components/ChurchLogo"

interface CertificatePreviewProps {
  recipientName: string;
  programName?: string;
  description?: string;
  issueDate?: string;
  onDownload?: () => void;
  onClose?: () => void;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  recipientName,
  programName,
  description,
  issueDate,
  onDownload,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Content */}
        <div className="flex-1 overflow-auto p-6 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 p-2 rounded-full bg-lightGray/30 flex items-center justify-center">
              <span className="text-sm font-semibold"><ChurchLogo/></span>
            </div>
          </div>

          <h2 className="text-lg font-semibold tracking-wide">
            Certificate of Participation
          </h2>

          <p className="mt-6 text-sm text-primaryGray">
            This certificate is proudly presented to
          </p>

          <h1 className="mt-2 text-xl font-serif font-medium">
            {recipientName}
          </h1>

          {programName && (
            <p className="mt-3 text-sm text-primaryGray font-medium">
              {programName}
            </p>
          )}

          {description && (
            <p className="mt-4 text-sm text-primaryGray leading-relaxed">
              {description}
            </p>
          )}

          {issueDate && (
            <p className="mt-6 text-xs text-primaryGray">
              Issued on {issueDate}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onDownload}
            className="flex-1 rounded-lg bg-primary text-white py-2 text-sm font-medium hover:bg-primary/90"
          >
            Download Certificate
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-lightGray py-2 text-sm font-medium text-primaryGray hover:bg-lightGray/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
