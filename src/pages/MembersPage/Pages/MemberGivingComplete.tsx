import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components";
import { api } from "@/utils/api/apiCalls";
import { relativePath } from "@/utils";
import type { GivingContribution } from "@/utils/api/finance/interface";

const formatMinorUnits = (minorUnits: number, currency = "GHS"): string =>
  Number.isFinite(minorUnits)
    ? `${currency} ${(minorUnits / 100).toFixed(2)}`
    : `${currency} --`;

/**
 * Where Paystack returns a donor who gave from the browser.
 *
 * Distinct from `/out/giving-complete`, which is inert and deep-links into the
 * mobile app. Here the reference is verified straight away so the donor gets an
 * answer without waiting for the webhook — the verify endpoint settles through
 * the same idempotent path, so whichever arrives first wins.
 */
const MemberGivingComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";

  const [contribution, setContribution] = useState<GivingContribution | null>(
    null
  );
  const [loading, setLoading] = useState(Boolean(reference.trim()));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!reference.trim()) return;

    let cancelled = false;

    api.fetch
      .verifyGivingContribution(reference)
      .then((response) => {
        if (!cancelled) setContribution(response?.data ?? null);
      })
      .catch(() => {
        // Verification is a convenience, not the settlement path: the webhook
        // still settles this. Claiming failure here would be wrong.
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  const settled = contribution?.status === "success";

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
          ) : settled && contribution ? (
            <>
              <p className="font-medium text-green-600">
                Thank you for your giving!
              </p>
              <p className="text-sm text-primaryGray">
                {formatMinorUnits(contribution.amount, contribution.currency)}{" "}
                received for {contribution.giving_option_name}. A receipt is on
                its way.
              </p>
            </>
          ) : (
            <p className="text-sm text-primaryGray">
              {failed || !reference.trim()
                ? "We could not confirm this just now. If you completed the payment, it will appear in your giving history shortly."
                : "We have not seen this payment complete yet. If you were charged, it will appear in your giving history shortly."}
            </p>
          )}

          {reference.trim() && (
            <p className="text-sm text-gray-500">
              Reference: <span className="font-mono">{reference}</span>
            </p>
          )}

          <Button
            value="Back to giving"
            onClick={() => navigate(relativePath.member.giving)}
          />
        </div>
      </div>
    </div>
  );
};

export default MemberGivingComplete;
