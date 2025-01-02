import StatusPill from "@/components/StatusPill";
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
  function isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
  return (
    <section className="text-dark900">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          {signature.label}: <span className="font-normal">{signature.name || "N/A"}</span>
        </p>
        <p className="font-semibold flex items-center gap-1">
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
                <span className="font-normal italic">{signature.signature}</span>
              )}
            </>
          ) : (
            <StatusPill text="Pending signature" />
          )}
        </p>
      </div>
    </section>
  );
});
