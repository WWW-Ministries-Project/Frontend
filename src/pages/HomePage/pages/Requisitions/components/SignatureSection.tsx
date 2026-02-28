import StatusPill from "@/components/StatusPill";
import { isValidURL } from "@/pages/HomePage/utils/helperFunctions";
import { DateTime } from "luxon";
import React, { useMemo } from "react";

type SignatureProps = {
  signature: {
    label: string;
    name: string;
    signature: string;
    approvalDate?: string | null;
  };
};

const SignatureSectionComponent = ({
  signature,
}: Readonly<SignatureProps>) => {
  const formattedApprovalDate = useMemo(() => {
    if (!signature.approvalDate) {
      return null;
    }

    const parsed = DateTime.fromISO(signature.approvalDate);
    return parsed.isValid ? parsed.toFormat("dd LLL yyyy") : null;
  }, [signature.approvalDate]);

  return (
    <section className="rounded-lg border border-lightGray bg-white p-3 text-primary">
      <p className="text-sm font-semibold text-primary">{signature.label}</p>
      <p className="mt-1 text-sm text-primaryGray">
        {signature.name || "Pending assignment"}
      </p>

      <div className="mt-3 flex min-h-[56px] items-center gap-2">
        {signature.signature ? (
          isValidURL(signature.signature) ? (
            <img
              src={signature.signature}
              className="h-12 w-24 rounded border border-lightGray object-contain bg-white"
              alt={`${signature.name || signature.label} signature`}
            />
          ) : (
            <span className="app-signature-text break-words text-3xl text-primary">
              {signature.signature}
            </span>
          )
        ) : (
          <StatusPill text="Pending signature" />
        )}
      </div>

      {formattedApprovalDate && (
        <p className="mt-2 text-xs text-primaryGray">
          Signed on {formattedApprovalDate}
        </p>
      )}
    </section>
  );
};

const SignatureSection = React.memo(SignatureSectionComponent);

SignatureSectionComponent.displayName = "SignatureSection";
SignatureSection.displayName = "SignatureSection";

export default SignatureSection;
