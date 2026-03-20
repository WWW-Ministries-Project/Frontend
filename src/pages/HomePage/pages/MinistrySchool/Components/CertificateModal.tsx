import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { CertificateData } from "@/utils/api/ministrySchool/interfaces";
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
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const certificateWidth = 1123;
  const certificateHeight = 794;

  useEffect(() => {
    if (!open) return;

    const viewport = previewViewportRef.current;
    if (!viewport || !certificate) return;

    const updateScale = () => {
      const availableWidth = viewport.clientWidth;
      if (!availableWidth) return;

      setPreviewScale(Math.min(1, availableWidth / certificateWidth));
    };

    updateScale();

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(updateScale);
      resizeObserver.observe(viewport);

      return () => resizeObserver.disconnect();
    }

    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [certificate, certificateWidth, open]);

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
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-lightGray bg-white px-5 py-4 tablet:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
              Certificate Preview
            </p>
            <h3 className="mt-1 text-lg font-semibold text-primary tablet:text-xl">
              {certificate.recipientFullName}
            </h3>
            <p className="mt-1 text-sm text-primaryGray">
              {certificate.certificateNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-lightGray px-3 py-2 text-sm font-medium text-primaryGray transition hover:bg-lightGray/20"
          >
            Close
          </button>
        </div>

        <div
          ref={previewViewportRef}
          className="app-scrollbar flex-1 overflow-auto bg-gradient-to-br from-lightest/70 via-white to-lightGray/10 p-4 tablet:p-6"
        >
          <div
            className="mx-auto"
            style={{
              width: `${certificateWidth * previewScale}px`,
              height: `${certificateHeight * previewScale}px`,
            }}
          >
            <div
              style={{
                width: `${certificateWidth}px`,
                height: `${certificateHeight}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
            >
              <CertificatePrint
                id="certificate-a4-preview"
                certificate={certificate}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-lightGray bg-white px-5 py-4 tablet:px-6">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            Download Certificate
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-lightGray px-4 py-2 text-sm font-medium text-primaryGray transition hover:bg-lightGray/20"
          >
            Close
          </button>
        </div>
      </div>
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
