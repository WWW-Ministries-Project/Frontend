import StatusPill from "@/components/StatusPill";
import { isValidURL } from "@/pages/HomePage/utils/helperFunctions";
import React from "react";

type SignatureProps = {
 signature:{
    label: string;
    name: string;
    signature: string;
 }
};

export default React.memo(function SignatureSection({
  signature
}: Readonly<SignatureProps>) {
  // TODO make this util
  
  return (
    <section className="text-primary">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          {signature.label}: <span className="font-normal">{signature.name || "N/A"}</span>
        </p>
        <div className="font-semibold flex items-center gap-1">
          Signature:
          {signature.signature ? (
            <>
              {isValidURL(signature.signature) ? (
                <img
                  src={signature.signature}
                  className="w-12 h-12"
                  alt={`${signature.name}'s signature`}
                  />
              ) : (
                <span className="font-normal ">{signature.signature}</span>
              )}
            </>
          ) : (
            <StatusPill text="Pending signature" />
          )}
        </div>
      </div>
    </section>
  );
});
