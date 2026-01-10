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
//   const handleDownloadPDF = async () => {
//     const certificateElement = document.getElementById("certificate-a4");
//     if (!certificateElement) {
//       console.error("Certificate A4 element not found");
//       return;
//     }

//     // --- TEMPORARILY FORCE REAL DOM VISIBILITY ---
//     const originalStyles = {
//       position: certificateElement.style.position,
//       left: certificateElement.style.left,
//       top: certificateElement.style.top,
//       opacity: certificateElement.style.opacity,
//       transform: certificateElement.style.transform,
//       visibility: certificateElement.style.visibility,
//     };

//     certificateElement.style.position = "fixed";
//     certificateElement.style.left = "0";
//     certificateElement.style.top = "0";
//     certificateElement.style.opacity = "0";
//     certificateElement.style.visibility = "visible";
//     certificateElement.style.transform = "none";

//     // wait for layout + fonts
//     await new Promise((r) => requestAnimationFrame(r));
//     await new Promise((r) => setTimeout(r, 150));

//     const canvas = await html2canvas(certificateElement, {
//       scale: 2,
//       useCORS: true,
//       backgroundColor: "#ffffff",
//     });

//     // --- RESTORE ORIGINAL STYLES ---
//     certificateElement.style.position = originalStyles.position;
//     certificateElement.style.left = originalStyles.left;
//     certificateElement.style.top = originalStyles.top;
//     certificateElement.style.opacity = originalStyles.opacity;
//     certificateElement.style.transform = originalStyles.transform;
//     certificateElement.style.visibility = originalStyles.visibility;

//     const imgData = canvas.toDataURL("image/jpeg", 1.0);

//     const pdf = new jsPDF({
//       orientation: "landscape",
//       unit: "mm",
//       format: "a4",
//     });

//     pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
//     pdf.save(`${recipientName}-certificate.pdf`);
//   };

 const handleDownloadPDF = async () => {
    const certificateElement = document.getElementById("certificate-a4");

    if (!certificateElement) return;

    const canvas = await html2canvas(certificateElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
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