"use client"

import ChurchLogo from "@/components/ChurchLogo"
import { ArrowDownIcon, TrophyIcon } from "@heroicons/react/24/outline"
import type React from "react"
// import { Award } from 'lucide-react';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateProps {
  recipientName?: string;
  description?: string;
  leftSignature?: string;
  rightSignature?: string;
}

export default function Certificate({
  recipientName = "Marcia Cardenas",
  description = "In recognition of active participation and successful engagement in the program. This certificate is awarded to acknowledge commitment, learning, and meaningful contribution throughout the duration of the session",
  leftSignature = "President Director",
  rightSignature = "General Manager"
}: CertificateProps) {
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
    pdf.save("certificate.pdf");
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
       <button
      onClick={handleDownloadPDF}
      className="px-4 py-2 rounded-md bg-[#2d3e6f] text-white text-sm hover:opacity-90"
    >
      Download Certificate (PDF)
    </button>
      <div
        id="certificate-a4"
        className="relative bg-white shadow-2xl w-full max-w-[1123px]"
        style={{ aspectRatio: "297 / 210" }}
      >
          {/* Outer border */}
          <div className="absolute inset-4 border-2 border-gray-300">
            {/* Inner certificate content */}
            <div className="relative w-full h-full overflow-hidden">

              {/* Decorative curved elements - Left side */}
              <div className="absolute left-0 top-0 h-full w-48 overflow-hidden">
                <div className="absolute -left-24 top-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 opacity-60"></div>
                <div className="absolute -left-16 top-1/3 w-48 h-48 rounded-full bg-gradient-to-br from-[#2d3e6f] to-[#1e2847]"></div>
              </div>

              {/* Decorative curved elements - Right side */}
              <div className="absolute right-0 top-0 h-full w-48 overflow-hidden">
                <div className="absolute -right-24 top-1/4 w-64 h-64 rounded-full bg-gradient-to-bl from-gray-100 to-gray-200 opacity-60"></div>
                <div className="absolute -right-16 top-1/3 w-48 h-48 rounded-full bg-gradient-to-bl from-[#2d3e6f] to-[#1e2847]"></div>
              </div>

              {/* Main content */}
              <div className="relative z-50 flex flex-col items-center justify-center h-full px-16 py-16">

                {/* logo */}

                {/* Header */}
                <div className="text-center mb-16">
                  <h1 className="text-5xl font-serif tracking-[0.3em] text-gray-800 mb-2">
                    CERTIFICATE
                  </h1>
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="h-px w-24 bg-gray-400"></div>
                    <h2 className="text-sm tracking-[0.2em] text-gray-600 font-light">
                      OF Participation
                    </h2>
                    <div className="h-px w-24 bg-gray-400"></div>
                  </div>
                  <p className="text-xs tracking-wider text-gray-500 font-light">
                    THIS CERTIFICATE IS PROUDLY PRESENTED TO :
                  </p>
                </div>

                {/* Recipient name */}
                <div className="mb-6">
                  <h2 className="text-6xl font-serif  text-gray-800 text-center" style={{ fontFamily: 'Georgia, serif' }}>
                    {recipientName}
                  </h2>
                  <div className="h-px w-[35vw] bg-gray-400"></div>
                </div>

                {/* Description */}
                <div className="max-w-2xl mb-12">
                  <p className="text-center text-sm leading-relaxed text-gray-600">
                    {description}
                  </p>
                </div>

                {/* Signature section */}
                <div className="w-full max-w-2xl flex justify-between items-end mt-auto pt-8">
                  {/* Left signature */}
                  <div className="flex flex-col items-center">
                    <div className="w-40 border-t border-gray-400 mb-2"></div>
                    <p className="text-xs tracking-wider text-gray-600 font-light">
                      {leftSignature}
                    </p>
                  </div>

                  {/* Center badge */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2d3e6f] to-[#1e2847] flex items-center justify-center shadow-lg">
                      {/* <Award className="w-8 h-8 text-amber-400" strokeWidth={2} /> */}
                    </div>
                  </div>

                  {/* Right signature */}
                  <div className="flex flex-col items-center">
                    <div className="w-40 border-t border-gray-400 mb-2"></div>
                    <p className="text-xs tracking-wider text-gray-600 font-light">
                      {rightSignature}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

   
  </div>
  );
}
