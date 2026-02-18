import React from "react";
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

    if (!open) return null;

 const handleDownloadPDF = async () => {
    const certificateElement = document.getElementById("certificate-a4");

    if (!certificateElement) return;

    const canvas = await html2canvas(certificateElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "white",
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

      <div className="hidden lg:block">
        <CertificatePrint
            recipientName={recipientName}
            program={program}
            description={description}
            rightSignature={issueDate}
          />
      </div>

      {/* Hidden Print Layout rendered outside Modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <CertificatePrint
            recipientName={recipientName}
            program={program}
            description={description}
            rightSignature={issueDate}
          />,
            document.body
            )} 
    </>
  );
};

export default CertificateModal;
