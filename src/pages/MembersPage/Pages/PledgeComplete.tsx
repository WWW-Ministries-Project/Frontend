import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components";

/**
 * The inert landing page Paystack returns a MOBILE pledge payer to.
 *
 * Mirrors GivingComplete: it verifies nothing and deep-links back into the app,
 * where the payment is verified against the caller's own session. Browser
 * payers land on /member/pledges/complete instead, which does verify inline.
 */
export default function PledgeComplete() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
  const hasReference = Boolean(reference.trim());

  /**
   * Deliberately the pledges list, NOT `payment/verify`.
   *
   * That screen verifies against the ORDERS endpoint and clears the member's
   * shopping cart on success — handing it a pledge reference produces a failed
   * lookup and nothing useful. The pledge itself is settled by the webhook (and
   * by the app's own verify call when the member returns through the in-app
   * browser), so the only job left here is to put them back where they can see
   * the result.
   */
  const deepLink = "wwm-mobile://pledges";

  useEffect(() => {
    if (!hasReference) return;

    const timer = setTimeout(() => {
      window.location.replace(deepLink);
    }, 5000);

    return () => clearTimeout(timer);
  }, [deepLink, hasReference]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <CheckCircleIcon className="h-12 w-12 text-green-500" />
          <p className="font-medium text-green-600">
            Thank you for redeeming your pledge!
          </p>

          {hasReference ? (
            <>
              <p className="text-sm text-gray-600">
                Your payment has been submitted and a receipt is on its way. It
                will appear against your pledge shortly.
              </p>
              <p className="text-sm text-gray-500">
                Reference: <span className="font-mono">{reference}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Your payment has been submitted. Please return to the app and
              check your pledges to confirm.
            </p>
          )}

          <p className="mt-2 text-sm text-gray-500">
            You will be returned to the mobile app shortly...
          </p>
          <Button
            value="Open mobile app"
            onClick={() => {
              window.location.href = deepLink;
            }}
          />
        </div>
      </div>
    </div>
  );
}
