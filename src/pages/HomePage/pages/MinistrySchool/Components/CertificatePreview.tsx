import React from "react";
import { formatDatefull } from "@/utils";
import type { CertificateData } from "@/utils/api/ministrySchool/interfaces";
import CertificateLogos from "./CertificateLogos";
import CertificatePrint from "./CertificatePrint";

interface CertificatePreviewProps {
  certificate: CertificateData;
  onDownload?: () => void;
  onClose?: () => void;
}

const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  certificate,
  onDownload,
  onClose,
}) => {
  return (
    <div className="w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
      <div className="flex-1 overflow-auto p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-lightGray/30 p-3">
            <CertificateLogos compact />
          </div>
        </div>

        <h2 className="text-lg font-semibold tracking-wide">
          Certificate of Participation
        </h2>

        <p className="mt-6 text-sm text-primaryGray">
          This certificate is proudly presented to
        </p>

        <h1 className="mt-2 text-xl font-serif font-medium">
          {certificate.recipientFullName}
        </h1>

        <p className="mt-3 text-sm text-primaryGray font-medium">
          {certificate.programTitle}
        </p>

        <p className="mt-4 text-sm text-primaryGray leading-relaxed">
          For the successful completion of the {certificate.programTitle} program.
        </p>

        <p className="mt-6 text-xs text-primaryGray">
          Issued on {formatDatefull(certificate.issueDate)}
        </p>

        <div className="mt-6 rounded-xl border border-lightGray/80 bg-lightest/40 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-primaryGray">
            Certificate Number
          </p>
          <p className="mt-2 text-sm font-semibold text-primary">
            {certificate.certificateNumber}
          </p>
        </div>

        <div className="mt-5 flex justify-center">
          <div className="rounded-xl border border-lightGray/80 bg-white p-3">
            <img
              src={certificate.qrCodeDataUrl}
              alt={`QR code for certificate ${certificate.certificateNumber}`}
              className="h-32 w-32"
            />
          </div>
        </div>
      </div>

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
      {/* <CertificatePrint certificate={certificate} /> */}
    </div>
  );
};

export default CertificatePreview;
