import React, { useRef } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CertificatePreview from "./CertificatePreview";
import CertificatePrint from "./CertificatePrint";

interface CertificateModalProps {
  onClose: () => void;
  recipientName: string;
  program?: string;
  description?: string;
  issueDate?: string;
  open?:boolean
}

const CertificateModal: React.FC<CertificateModalProps> = ({
  onClose,
  recipientName,
  program,
  description,
  issueDate,
  open
}) => {
  const printCertificateRef = useRef<HTMLDivElement | null>(null);

  if (!open) return null;

  const handleDownloadPDF = async () => {
    const certificateElement = printCertificateRef.current;

    if (!certificateElement) return;

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

    const pdfWidth = 297;
    const pdfHeight = 210;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${recipientName}-${program}-certificate.pdf`);
  };
  return (
    <>
      {/* Mobile / Screen Preview */}
      <CertificatePreview
        recipientName={recipientName}
        programName={program}
        description={description}
        issueDate={issueDate}
        onDownload={handleDownloadPDF}
        onClose={onClose}
      />

      {/* Hidden Print Layout rendered outside Modal */}
      {typeof document !== "undefined" &&
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
              recipientName={recipientName}
              program={program}
              description={description}
              rightSignature={issueDate}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default CertificateModal;
