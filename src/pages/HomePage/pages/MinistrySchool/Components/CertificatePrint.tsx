"use client";

import type { Ref } from "react";
import type { CertificateData } from "@/utils/api/ministrySchool/interfaces";
import CertificateLogos from "./CertificateLogos";

interface CertificateProps {
  certificate: CertificateData;
  id?: string;
  containerRef?: Ref<HTMLDivElement>;
}

export default function CertificatePrint({
  certificate,
  id = "certificate-a4",
  containerRef,
}: CertificateProps) {
  const finalDescription = `In recognition of active participation and successful engagement in ${
    certificate.programTitle ? `${certificate.programTitle} program` : "the program"
  }. This certificate is awarded to acknowledge your commitment, learning, and meaningful contribution throughout the duration of the program.`;

  return (
    <div
      id={id}
      ref={containerRef}
      className="relative bg-white shadow-2xl overflow-hidden drop-shadow-sm"
      style={{
        width: "1123px",
        height: "794px",
      }}
    >
      <div className="absolute inset-6 border-2 border-primary bg-white ">
        <div className="relative w-full h-full ">
          <div className="absolute -left-10 -top-8 h-full w-48 overflow-hidden">
            <div className="absolute -translate-x-20  -rotate-45 -left-24 top-20 w-72 h-72 rounded-[6vw] bg-gradient-to-br from-lightGray to-secondary drop-shadow-xl shadow-xl border-2 " />
            <div className="absolute -translate-x-9  -rotate-45 -left-36  w-72 h-72 rounded-[6vw] bg-gradient-to-bl from-lightest to-primary drop-shadow-xl shadow-xl border-2 border-white" />
          </div>

          <div className="absolute -right-10 -top-8 h-full w-48 overflow-hidden ">
            <div className="absolute translate-x-20  -rotate-45 -right-24 top-20 w-72 h-72 rounded-[6vw] bg-gradient-to-tl  from-lightGray to-secondary drop-shadow-xl shadow-xl border-2 " />
            <div className="absolute translate-x-9  rotate-45 -right-36  w-72 h-72 rounded-[6vw] bg-gradient-to-tl from-lightest to-primary drop-shadow-xl shadow-xl border-2 border-white" />
          </div>

          <div className="relative z-50 flex flex-col items-center justify-center h-full px-16 py-16">
            <div className="text-center mb-6">
              <div className="rounded-full flex items-center justify-center mb-4">
                <CertificateLogos />
              </div>
              <div className="text-5xl font-serif tracking-[0.3em] text-primary mb-2 pb-2">
                CERTIFICATE
              </div>
              <div className="flex items-center justify-center gap-4 my-6 pb-6">
                <div className="h-px w-24 bg-lightGray" />
                <div className="text-sm tracking-[0.2em] text-primaryGray  uppercase">
                  OF Participation
                </div>
                <div className="h-px w-24 bg-lightGray" />
              </div>
              <p className="text-xs tracking-wider text-primaryGray ">
                THIS CERTIFICATE IS PROUDLY PRESENTED TO
              </p>
            </div>

            <div className="mb-6 ">
              <h2 className="text-4xl font-serif text-center text-primary">
                {certificate.recipientFullName}
              </h2>
            </div>

            <div className="max-w-2xl mb-10">
              <p className="text-center text-sm leading-relaxed text-primaryGray">
                {finalDescription}
              </p>
            </div>

            

            <div className="w-full max-w-2xl flex justify-between items-end mt-auto mb-6 pt-6">
              <div className="flex flex-col items-center">
                <div className="min-w-40 border-b border-lightGray mb-2 pb-2 text-center">
                  Prophet John Anokye
                </div>
                <p className="text-sm tracking-wider text-primaryGray ">
                  Prelate
                </p>
              </div>

              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lightest to-lighter flex items-center justify-center shadow-lg" />
              </div>

              <div className="flex flex-col items-center">
                <div className="min-w-40 border-b border-lightGray mb-2 pb-2 text-center">
                  {new Date(certificate.issueDate).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <p className="text-sm tracking-wider text-primaryGray ">
                  Date issued
                </p>
              </div>
            </div>

            <div className="m w-full flex items-center justify-between gap-6  ">
              <div className="text-left">
                <p className="text-[11px] tracking-[0.2em] text-primaryGray  uppercase">
                  Certificate Number
                </p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {certificate.certificateNumber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-lightGray/70">
                  <img
                    src={certificate.qrCodeDataUrl}
                    alt={`QR code for certificate ${certificate.certificateNumber}`}
                    className="h-16 w-16"
                  />
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
