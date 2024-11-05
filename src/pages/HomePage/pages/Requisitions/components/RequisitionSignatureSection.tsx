import React from "react";

export default function RequisitionSignatureSection() {
  return (
    <section className="flex items-center justify-between px-4">
      <div className="flex flex-col gap-4">
        <p className="font-semibold">
          Requested By: <span className="font-normal">Tuffour Boateng</span>
        </p>
        <p className="font-semibold">
          Signature: <span className="font-normal italic">Tuffour Boateng</span>
        </p>
        <p className="font-semibold">
          Requested By: <span className="font-normal">Tuffour Boateng</span>
        </p>
        <p className="font-semibold">
          Signature: <span className="font-normal italic">Tuffour Boateng</span>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-semibold">
          Authorized By: <span className="font-normal">Tuffour Boateng</span>
        </p>
        <p className="font-semibold">
          Signature: <span className="italic font-normal">Tuffour Boateng</span>
        </p>
        <p className="font-semibold">
          Approved By: <span className="font-normal">Tuffour Boateng</span>
        </p>
        <p className="font-semibold">
          Signature: <span className="italic font-normal">Tuffour Boateng</span>
        </p>
      </div>
    </section>
  );
}
