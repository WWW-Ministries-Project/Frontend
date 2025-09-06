"use client"

import ChurchLogo from "@/components/ChurchLogo"
import { ArrowDownIcon, TrophyIcon } from "@heroicons/react/24/outline"
import type React from "react"

// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Download, Award } from "lucide-react"
import { useRef } from "react"

interface CertificateData {
  recipientName: string
  achievement: string
  description: string
  date: string
  issuer: string
  signatory: string
  signatoryTitle: string
}

interface CertificateTemplateProps {
  data: CertificateData
  closeModal?: () => void
}

export function CertificateTemplate({ data, closeModal }: CertificateTemplateProps) {
  const certificateRef = useRef<HTMLDivElement>(null)

  const exportToPDF = async () => {
    if (!certificateRef.current) return

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 297 // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`certificate-${data.recipientName.replace(/\s+/g, "-").toLowerCase()}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  const certificateStyles = {
    "--cert-primary": "#155e75", // cyan-800 equivalent
    "--cert-accent": "#ae6b23", // green-500 equivalent
    "--cert-border": "#334155", // slate-700 equivalent
    "--cert-text": "#374151", // slate-600 equivalent
    "--cert-text-dark": "#374151", // slate-700 equivalent
  } as React.CSSProperties

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={exportToPDF} className="flex items-center gap-2 border bg-primary text-white p-1 px-3 rounded-lg hover:bg-gray-100 hover:text-primary transition-colors">
          {/* <ArrowDownIcon className="w-4 h-4" /> */}
          Export as PDF
        </button>
        {closeModal && (
          <button onClick={closeModal} className="ml-4 flex items-center gap-2 border p-1 px-3 rounded-lg hover:bg-gray-100 transition-colors">
            Close
          </button>
        )}
      </div>

      <div className="overflow-hidden">
        <div ref={certificateRef} className="bg-white p-4 aspect-[297/210] font-sans" style={certificateStyles}>
          <div className="h-full relative rounded-lg border-8 border-double" style={{ borderColor: "var(--cert-border)" }}>
            <div className="h-full p-8 flex flex-col  border-4" style={{ borderColor: "var(--cert-border)" }}>
              {/* Header Section */}
              <div className="text-center space-y-6 mb-8">
                <div className="flex justify-center mb-4">
                  <div
                    className=" rounded-full flex items-center justify-center"
                    
                  >
                    {/* <TrophyIcon className="w-8 h-8 text-white" /> */}
                    <ChurchLogo show />
                  </div>
                </div>

                <h1 className="text-4xl font-bold font-serif" style={{ color: "var(--cert-border)" }}>
                  CERTIFICATE OF COMPLETION
                </h1>

                <div className="w-32 h-1 mx-auto" style={{ backgroundColor: "var(--cert-accent)" }}></div>
              </div>

              {/* Content Section */}
              <div className="flex-1 flex flex-col justify-center space-y-8 text-center">
                <div className="space-y-4">
                  <p className="text-lg font-medium" style={{ color: "var(--cert-text)" }}>
                    This is to certify that
                  </p>

                  <h2
                    className="text-5xl font-bold pb-2 inline-block font-serif  border-slate-300"
                    style={{ color: "var(--cert-primary)" }}
                  >
                    {data?.recipientName}
                  </h2>
                </div>

                <div className="space-y-4">
                  <p className="text-lg" style={{ color: "var(--cert-text)" }}>
                    has successfully completed
                  </p>

                  <h3 className="text-3xl font-bold font-serif" style={{ color: "var(--cert-primary)" }}>
                    {data?.achievement}
                  </h3>

                  <p className="text-base max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--cert-text)" }}>
                    {data?.description}
                  </p>
                </div>
              </div>

              {/* Footer Section */}
              <div className="flex justify-between items-end mt-8">
                <div className="text-left">
                  <p className="text-sm mb-1" style={{ color: "var(--cert-text)" }}>
                    Date of Issue
                  </p>
                  <p className="text-lg font-semibold" style={{ color: "var(--cert-text-dark)" }}>
                    {data?.date}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm mb-1" style={{ color: "var(--cert-text)" }}>
                    Issued by
                  </p>
                  <p className="text-xl font-bold font-serif" style={{ color: "var(--cert-primary)" }}>
                    {data?.issuer}
                  </p>
                </div>

                <div className="text-right">
                  <div className="w-full mb-2 border-b border-slate-400"></div>
                  <p className="text-lg font-semibold" style={{ color: "var(--cert-text-dark)" }}>
                    {data?.signatory}
                  </p>
                  <p className="text-sm" style={{ color: "var(--cert-text)" }}>
                    {data?.signatoryTitle}
                  </p>
                </div>
              </div>

              <div
                className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4"
                style={{ borderColor: "var(--cert-accent)" }}
              ></div>
              <div
                className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4"
                style={{ borderColor: "var(--cert-accent)" }}
              ></div>
              <div
                className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4"
                style={{ borderColor: "var(--cert-accent)" }}
              ></div>
              <div
                className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4"
                style={{ borderColor: "var(--cert-accent)" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
