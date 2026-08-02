import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components";
import { api } from "@/utils/api/apiCalls";
import { relativePath } from "@/utils";
import type { PledgePayment } from "@/utils/api/pledges/interface";

const formatMinorUnits = (minorUnits: number, currency = "GHS"): string =>
  Number.isFinite(minorUnits)
    ? `${currency} ${(minorUnits / 100).toFixed(2)}`
    : `${currency} --`;

/**
 * Where Paystack returns a member who redeemed a pledge from the browser.
 *
 * The reference is verified straight away so they get an answer without waiting
 * for the webhook; that endpoint settles through the same idempotent path and
 * also writes the redemption against the pledge, so whichever arrives first wins.
 */
const MemberPledgeComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";

  const [payment, setPayment] = useState<PledgePayment | null>(null);
  const [loading, setLoading] = useState(Boolean(reference.trim()));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!reference.trim()) return;

    let cancelled = false;

    api.fetch
      .verifyPledgePayment(reference)
      .then((response) => {
        if (!cancelled) setPayment(response?.data ?? null);
      })
      .catch(() => {
        // Verification is a convenience, not the settlement path — the webhook
        // still settles this, so failure here must not assert a failed payment.
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  const settled = payment?.status === "success";

  return (
    <div className="flex w-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="flex flex-col items-center gap-4">
          {settled ? (
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          ) : (
            <ClockIcon className="h-12 w-12 text-amber-500" />
          )}

          {loading ? (
            <p className="text-primaryGray">Confirming your payment...</p>
          ) : settled && payment ? (
            <>
              <p className="font-medium text-green-600">
                Thank you for redeeming your pledge!
              </p>
              <p className="text-sm text-primaryGray">
                {formatMinorUnits(payment.amount, payment.currency)} received
                for {payment.pledge_title}. A receipt is on its way.
              </p>
            </>
          ) : (
            <p className="text-sm text-primaryGray">
              {failed || !reference.trim()
                ? "We could not confirm this just now. If you completed the payment, it will appear in your payment history shortly."
                : "We have not seen this payment complete yet. If you were charged, it will appear in your payment history shortly."}
            </p>
          )}

          {reference.trim() && (
            <p className="text-sm text-gray-500">
              Reference: <span className="font-mono">{reference}</span>
            </p>
          )}

          <Button
            value="Back to my pledges"
            onClick={() => navigate(relativePath.member.pledges)}
          />
        </div>
      </div>
    </div>
  );
};

export default MemberPledgeComplete;
