import { useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api, CertificateData, formatDatefull } from "@/utils";
import type { ApiResponse, QueryType } from "@/utils/interfaces";
import CertificateLogos from "@/pages/HomePage/pages/MinistrySchool/Components/CertificateLogos";

export default function CertificateVerificationPage() {
  const { certificateNumber = "" } = useParams<{ certificateNumber: string }>();
  const normalizedCertificateNumber = certificateNumber.trim();

  const { data, loading, error } = useFetch<ApiResponse<CertificateData>>(
    api.fetch.fetchCertificateVerification as (
      query?: QueryType
    ) => Promise<ApiResponse<CertificateData>>,
    { certificateNumber: normalizedCertificateNumber },
    !normalizedCertificateNumber
  );

  const certificate = data?.data ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,44,94,0.12),_transparent_45%),linear-gradient(180deg,_#f8fafc_0%,_#eef4f8_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[32px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="text-center">
            <CertificateLogos compact />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.4em] text-primary/60">
              Certificate Verification
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-primary sm:text-4xl">
              {normalizedCertificateNumber || "Verification"}
            </h1>
          </div>

          {!normalizedCertificateNumber && (
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center">
              <p className="text-sm font-medium text-amber-800">
                No certificate number was provided.
              </p>
            </div>
          )}

          {normalizedCertificateNumber && loading && (
            <div className="mt-10 flex min-h-[240px] items-center justify-center">
              <div className="space-y-3 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
                <p className="text-sm text-primaryGray">
                  Verifying certificate...
                </p>
              </div>
            </div>
          )}

          {normalizedCertificateNumber && !loading && error && (
            <div className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
                Verification Failed
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-rose-700">
                Certificate not found
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-rose-700/80">
                {error.message ||
                  "The certificate number could not be verified. Please confirm the number and try again."}
              </p>
            </div>
          )}

          {normalizedCertificateNumber && !loading && certificate && (
            <div className="mt-10 space-y-6">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  Verified Certificate
                </p>
                <p className="mt-2 text-sm text-emerald-800">
                  This certificate number matches a valid completion record.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-lightGray bg-white p-6 shadow-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-lightest/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/55">
                        Program Name
                      </p>
                      <p className="mt-2 text-lg font-semibold text-primary">
                        {certificate.programTitle}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-lightest/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/55">
                        Member Name
                      </p>
                      <p className="mt-2 text-lg font-semibold text-primary">
                        {certificate.recipientFullName}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-lightest/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/55">
                        Date of Completion
                      </p>
                      <p className="mt-2 text-base font-medium text-primary">
                        {formatDatefull(certificate.completionDate)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-lightest/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/55">
                        Certificate Number
                      </p>
                      <p className="mt-2 break-all text-base font-medium text-primary">
                        {certificate.certificateNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-lightGray bg-white p-6 text-center shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/55">
                    Scan Again
                  </p>
                  <div className="mx-auto mt-4 flex h-52 w-52 items-center justify-center rounded-2xl bg-lightest/60 p-4">
                    <img
                      src={certificate.qrCodeDataUrl}
                      alt={`QR code for certificate ${certificate.certificateNumber}`}
                      className="h-full w-full"
                    />
                  </div>
                  <a
                    href={certificate.verificationUrl}
                    className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4"
                  >
                    Open direct verification link
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
