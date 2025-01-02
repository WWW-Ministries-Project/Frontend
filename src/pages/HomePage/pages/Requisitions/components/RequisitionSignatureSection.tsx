import SignatureSection from "./SignatureSection";
import React from "react";

export default React.memo(function RequisitionSignatureSection() {
  return (
    <section className="flex items-center justify-between px-4 text-dark900">
      <div className="flex flex-col gap-4">
        {/* TODO remove the hardcoded signature */}
        <SignatureSection
          label="Requested by"
          name="Tuffour Boateng"
          signature="https://www.jsign.com/wp-content/uploads/2022/06/graphic-signature-angle.png.webp"
        />
        <SignatureSection
          label="Received by"
          name="Saah Asiedu"
          signature="S.A"
        />
      </div>
      <div className="flex flex-col gap-2">
        <SignatureSection label="Authorized by" name="Tuffour" signature="" />
        <SignatureSection label="Approved by" name="Tuffour" signature="" />
      </div>
    </section>
  );
});
