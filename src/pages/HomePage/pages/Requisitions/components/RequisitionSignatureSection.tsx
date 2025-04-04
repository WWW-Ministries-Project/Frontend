import React, { memo } from "react";
import type { IRequester, RequestApproval } from "../types/requestInterface";
import SignatureSection from "./SignatureSection";

interface RequisitionSignatureSectionProps {
  requester?: IRequester;
  requuest_approvals:RequestApproval | undefined;
}

const RequisitionSignatureSection: React.FC<RequisitionSignatureSectionProps> =
  memo(({ requester,requuest_approvals }) => {
    const { hod_user, ps_user, hod_sign, ps_sign,finance_sign,finance_user } = requuest_approvals ?? {};

    const hod = {
      name: hod_user?.name ?? "",
      signature: hod_sign ?? "",
    }

    const pastor = {
      name: ps_user?.name ?? "",
      signature: ps_sign ?? "",
    }

    const finance = {
      name: finance_user?.name ?? "",
      signature: finance_sign ?? "",
    }

    return (
      <section className="flex items-center justify-between px-4 text-dark900">
        <div className="flex flex-col gap-4">
          <SignatureSection
            signature={{
              name: requester?.name as string,
              label: "Requested by",
              signature: requester?.user_sign ?? "",
            }}
          />
          <SignatureSection
            signature={{ ...hod, label: "H.O.D" }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <SignatureSection
            signature={{
              ...pastor,
              label: "Executive Pastor",
            }}
          />
          <SignatureSection
            signature={{ ...finance, label: "Finance" }}
          />
        </div>
      </section>
    );
  });

export default RequisitionSignatureSection;
