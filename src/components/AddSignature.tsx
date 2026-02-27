import { isValidURL } from "@/pages/HomePage/utils/helperFunctions";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";

type Signature = {
  cancel: () => void;
  text?: string;
  handleSignature: (signature: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  header?: string;
  defaultSignature?: string;
};
export default function AddSignature({
  cancel,
  text = "Sign",
  handleSignature,
  onSubmit,
  loading,
  header = "Request Approval Signing",
  defaultSignature,
}: Readonly<Signature>) {
  const initialSignature = useMemo(() => {
    const normalized = String(defaultSignature ?? "").trim();
    return normalized && !isValidURL(normalized) ? normalized : "";
  }, [defaultSignature]);
  const [signature, setSignature] = useState<string>(initialSignature);
  const trimmedSignature = signature.trim();

  useEffect(() => {
    setSignature(initialSignature);
    handleSignature(initialSignature);
  }, [handleSignature, initialSignature]);

  return (
    <div className="w-[min(92vw,560px)] rounded-xl bg-white p-6 md:p-8">
      <h2 className="text-center text-xl font-semibold text-primary md:text-2xl">
        {header}
      </h2>
      <p className="mt-2 text-center text-sm text-primaryGray">
        Enter your legal signature text below to authorize this request.
      </p>

      <div className="mt-6 space-y-2">
        <label
          htmlFor="request-signature"
          className="text-sm font-semibold text-primary"
        >
          Signature
        </label>
        <input
          id="request-signature"
          className="app-input w-full"
          placeholder="Type your full name"
          value={signature}
          onChange={(e) => {
            const nextSignature = e.target.value;
            setSignature(nextSignature);
            handleSignature(nextSignature.trim());
          }}
        />
        <p className="text-xs text-primaryGray">
          This signature will appear exactly as entered.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-lightGray bg-[#F8F9FC] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primaryGray">
          Signature Preview
        </p>
        <div className="mt-3 min-h-[78px] rounded-lg border border-lightGray bg-white px-4 py-3">
          {trimmedSignature ? (
            <p className="app-signature-text break-words text-[2rem] text-primary md:text-[2.25rem]">
              {trimmedSignature}
            </p>
          ) : (
            <p className="text-sm text-primaryGray">
              Your typed signature preview will appear here.
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-primaryGray">
        By clicking &quot;{text}&quot;, you agree to use this as your official
        signature
        for the request.
      </p>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button
          value="Cancel"
          variant="ghost"
          onClick={() => {
            cancel();
          }}
        />
        <Button
          value={text}
          variant="primary"
          onClick={onSubmit}
          disabled={!trimmedSignature}
          loading={loading}
        />
      </div>
    </div>
  );
}
