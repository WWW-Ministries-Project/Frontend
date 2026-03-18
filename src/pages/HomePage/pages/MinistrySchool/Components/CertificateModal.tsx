import React, { useRef } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { CertificateData } from "@/utils/api/ministrySchool/interfaces";
import CertificatePreview from "./CertificatePreview";
import CertificatePrint from "./CertificatePrint";

interface CertificateModalProps {
  certificate?: CertificateData | null;
  error?: string | null;
  loading?: boolean;
  onClose: () => void;
  open?: boolean;
}

const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  error,
  loading,
  onClose,
  open,
}) => {
  const printCertificateRef = useRef<HTMLDivElement | null>(null);

  if (!open) return null;

  const handleDownloadPDF = async () => {
    const certificateElement = printCertificateRef.current;
    if (!certificateElement || !certificate) return;

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(certificateElement, {
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      backgroundColor: "white",
      windowWidth: certificateElement.scrollWidth,
      windowHeight: certificateElement.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
    pdf.save(`${certificate.certificateNumber}.pdf`);
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex min-h-[360px] items-center justify-center px-6 py-12">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-primaryGray">
              Preparing your certificate...
            </p>
          </div>
        </div>
      );
    }

    if (error || !certificate) {
      return (
        <div className="flex min-h-[360px] items-center justify-center px-6 py-12">
          <div className="max-w-md space-y-3 text-center">
            <h3 className="text-xl font-semibold text-primary">
              Certificate unavailable
            </h3>
            <p className="text-sm leading-6 text-primaryGray">
              {error ??
                "The certificate could not be loaded right now. Please try again."}
            </p>
            <button
              onClick={onClose}
              className="rounded-xl border border-lightGray px-4 py-2 text-sm font-medium text-primaryGray transition hover:bg-lightGray/20"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return (
      <CertificatePreview
        certificate={certificate}
        onDownload={handleDownloadPDF}
        onClose={onClose}
      />
    );
  };

  return (
    <>
      {renderBody()}

      {certificate &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: 0,
              left: "-10000px",
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            <CertificatePrint
              id="certificate-a4-print"
              containerRef={printCertificateRef}
              certificate={certificate}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default CertificateModal;
