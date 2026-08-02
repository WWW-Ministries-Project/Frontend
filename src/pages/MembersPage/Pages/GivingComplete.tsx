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

  /**
   * Deliberately the Give screen, NOT `payment/verify`.
   *
   * `payment/verify` belongs to the marketplace: it verifies against the ORDERS
   * endpoint and calls `clearCart()` on success. Handing it a giving reference
   * produced a failed order lookup and nothing useful — the same trap this
   * landing page was created to avoid on the web side.
   *
   * Nothing is lost by not passing the reference along: the webhook settles the
   * contribution, and the app verifies it itself when the member returns
   * through the in-app browser. All this link has to do is put them back where
   * they can see the result.
   */
  const deepLink = "wwm-mobile://give";

  const openMobileApp = () => {
    window.location.href = deepLink;
  };

  useEffect(() => {
    if (!hasReference) return;

    const timer = setTimeout(() => {
      window.location.replace(deepLink);
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasReference]);

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
