import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components";

export default function GivingComplete() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
  const hasReference = Boolean(reference.trim());

  const openMobileApp = () => {
    const encodedReference = encodeURIComponent(reference);
    window.location.href = `wwm-mobile://payment/verify?reference=${encodedReference}&order_reference=${encodedReference}`;
  };

  useEffect(() => {
    if (!hasReference) return;

    const timer = setTimeout(() => {
      const encodedReference = encodeURIComponent(reference);
      window.location.replace(
        `wwm-mobile://payment/verify?reference=${encodedReference}&order_reference=${encodedReference}`
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasReference, reference]);

  return (
    <div className="flex items-center justify-center w-full h-[80vh] px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-4">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
          <p className="text-green-600 font-medium">
            Thank you for your giving!
          </p>

          {hasReference ? (
            <>
              <p className="text-gray-600 text-sm">
                Your payment has been submitted and a receipt is on its way.
                It will appear in your giving history shortly.
              </p>
              <p className="text-gray-500 text-sm">
                Reference: <span className="font-mono">{reference}</span>
              </p>
            </>
          ) : (
            <p className="text-gray-600 text-sm">
              Your payment has been submitted. Please return to the app and
              check your giving history to confirm.
            </p>
          )}

          <p className="text-gray-500 text-sm mt-2">
            You will be returned to the mobile app shortly...
          </p>
          <Button value="Open mobile app" onClick={openMobileApp} />
        </div>
      </div>
    </div>
  );
}
