"use client"

import ChurchLogo from "@/components/ChurchLogo"

// import { Award } from 'lucide-react';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatDatefull } from "@/utils";
import { Button } from "@/components";

interface CertificateProps {
  recipientName?: string;
  description?: string;
  leftSignature?: string;
  leftSignatureLabel?: string;
  rightSignature?: string;
  rightSignatureLabel?: string;
  program?:string;
  onClose?: () => void;
}

export default function Certificate({
  program,
  recipientName = "",
  description = `In recognition of active participation and successful engagement in ${program?`${program} program`:'the program'}. This certificate is awarded to acknowledge commitment, learning, and meaningful contribution throughout the duration of the session`,
  leftSignature = "Prophet John Anokye",
  leftSignatureLabel = "Prelate",
  rightSignature = formatDatefull(new Date().toISOString()),
  rightSignatureLabel  = "Date issued",
  onClose
  
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
    <div className="w-full flex flex-col items-center gap-4 p-8 bg-white rounded-lg z-30">
       
      <div
        id="certificate-a4"
        className="relative bg-white shadow-2xl w-full max-w-[1123px] overflow-x-hidden drop-shadow-sm "
        style={{ aspectRatio: "297 / 210" }}
      >
          {/* Outer border */}
          <div className="absolute inset-6 border-2 border-primary ">
            {/* Inner certificate content */}
            <div className="relative w-full h-full ">

              {/* Decorative curved elements - Left side */}
              <div className="absolute -left-10 -top-8 h-full w-48 overflow-hidden">
                <div className="absolute -translate-x-20  -rotate-45 -left-24 top-20 w-72 h-72 rounded-[6vw] bg-gradient-to-bl from-[#2d3e6f] to-primary drop-shadow-xl shadow-xl border-2 border-primary"></div>
                <div className="absolute -translate-x-9  -rotate-45 -left-36  w-72 h-72 rounded-[6vw] bg-gradient-to-bl from-gray-100 to-white drop-shadow-xl shadow-xl border-2 border-white"></div>
              </div>

              {/* Decorative curved elements - Right side */}
              <div className="absolute -right-10 -top-8 h-full w-48 overflow-hidden ">
                
                <div className="absolute translate-x-20  -rotate-45 -right-24 top-20 w-72 h-72 rounded-[6vw] bg-gradient-to-bl from-[#2d3e6f] to-primary drop-shadow-xl shadow-xl border-2 border-primary"></div>
                <div className="absolute translate-x-9  rotate-45 -right-36  w-72 h-72 rounded-[6vw] bg-gradient-to-bl from-gray-200 to-white drop-shadow-xl shadow-xl border-2 border-white"></div>
              </div>

              {/* Main content */}
              <div className="relative z-50 flex flex-col items-center justify-center h-full px-16 py-16">

                

                {/* Header */}
                <div className="text-center mb-16">
                  {/* logo */}
                <div className=" rounded-full flex items-center justify-center mb-4">
                    {/* <TrophyIcon className="w-8 h-8 text-white" /> */}
                    <ChurchLogo show />
                  </div>
                  <h1 className="text-5xl font-serif tracking-[0.3em] text-gray-800 mb-2 pb-2">
                    CERTIFICATE
                  </h1>
                  <div className="flex items-center justify-center gap-4 mb-8 pb-8">
                    <div className="h-px w-24 bg-gray-400"></div>
                    <h2 className="text-sm tracking-[0.2em] text-gray-600 font-light uppercase">
                      OF Participation
                    </h2>
                    <div className="h-px w-24 bg-gray-400"></div>
                  </div>
                  <p className="text-xs tracking-wider text-gray-500 font-light">
                    THIS CERTIFICATE IS PROUDLY PRESENTED TO :
                  </p>
                </div>

                {/* Recipient name */}
                <div className="mb-6 ">
                  <h2 className="text-6xl font-serif  text-gray-800 text-center" style={{ fontFamily: 'Georgia, serif' }}>
                    {recipientName}
                  </h2>
                  {/* <div className="h-px w-[35vw] bg-gray-400"></div> */}
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
                    <div className="min-w-40 border-b border-gray-400 mb-2 pb-2 text-center">{leftSignature}</div>
                    <p className="text-sm tracking-wider text-gray-600 font-light">
                      {leftSignatureLabel}
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
                    <div className="min-w-40 border-b border-gray-400 mb-2 pb-2 text-center">{rightSignature}</div>
                    <p className="text-sm tracking-wider text-gray-600 font-light">
                      {rightSignatureLabel}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
        <Button
       value="Download Certificate"
      onClick={handleDownloadPDF}
      className=""
    />
    <Button
    variant="secondary"
      value="Close"
      onClick={onClose}
    />
       </div>
  </div>
  );
}
