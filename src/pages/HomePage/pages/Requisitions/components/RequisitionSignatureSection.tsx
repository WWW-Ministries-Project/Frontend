import React, { memo } from "react";
import type { IRequester } from "../types/requestInterface";
import SignatureSection from "./SignatureSection";

interface RequisitionSignatureSectionProps {
  requester?: IRequester;
  signatures: {
    receivedBy: { name: string; signature: string };
    authorizedBy: { name: string; signature: string };
    approvedBy: { name: string; signature: string };
  };
}

const RequisitionSignatureSection: React.FC<RequisitionSignatureSectionProps> =
  memo(({ requester, signatures }) => {
    return (
      <section className="flex items-center justify-between px-4 text-dark900">
        <div className="flex flex-col gap-4">
          {/* TODO remove the hardcoded signature */}
          <SignatureSection
            signature={{
              name: requester?.name as string,
              label: "Requested by",
              signature: requester?.user_sign ?? "",
            }}
          />
          <SignatureSection
            signature={{ ...signatures?.receivedBy, label: "H.O.D" }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <SignatureSection
            signature={{
              ...signatures?.authorizedBy,
              label: "Executive Pastor",
            }}
          />
          <SignatureSection
            signature={{ ...signatures?.approvedBy, label: "Finance" }}
          />
        </div>
      </section>
    );
  });

export default RequisitionSignatureSection;
