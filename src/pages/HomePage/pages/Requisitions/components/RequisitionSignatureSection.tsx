import React, { memo } from "react";
import type { IRequester, RequestApproval } from "../types/requestInterface";
import SignatureSection from "./SignatureSection";

interface RequisitionSignatureSectionProps {
  requester?: IRequester;
  requestApprovals?: RequestApproval;
  requesterSignature?: string | null;
}

const RequisitionSignatureSectionComponent: React.FC<
  RequisitionSignatureSectionProps
> = ({ requester, requestApprovals, requesterSignature }) => {
    const {
      hod_user,
      ps_user,
      finance_user,
      hod_sign,
      ps_sign,
      finance_sign,
      hod_approval_date,
      ps_approval_date,
      finance_approval_date,
    } = requestApprovals ?? {};

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-primary">Signatures</h3>
        <span className="text-xs text-primaryGray">
          Approval signatures and timestamps
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SignatureSection
          signature={{
            label: "Requested By",
            name: requester?.name ?? "",
            signature: requester?.user_sign ?? requesterSignature ?? "",
          }}
        />

        <SignatureSection
          signature={{
            label: "H.O.D Approval",
            name: hod_user?.name ?? "",
            signature: hod_sign ?? "",
            approvalDate: hod_approval_date,
          }}
        />

        <SignatureSection
          signature={{
            label: "Executive Pastor Approval",
            name: ps_user?.name ?? "",
            signature: ps_sign ?? "",
            approvalDate: ps_approval_date,
          }}
        />

        <SignatureSection
          signature={{
            label: "Finance Approval",
            name: finance_user?.name ?? "",
            signature: finance_sign ?? "",
            approvalDate: finance_approval_date,
          }}
        />
      </div>
    </section>
  );
};

const RequisitionSignatureSection = memo(RequisitionSignatureSectionComponent);

RequisitionSignatureSectionComponent.displayName = "RequisitionSignatureSection";
RequisitionSignatureSection.displayName = "RequisitionSignatureSection";

export default RequisitionSignatureSection;
