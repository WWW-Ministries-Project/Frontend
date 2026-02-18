import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, relativePath } from "@/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/pages/HomePage/pages/MarketPlace/utils/cartSlice";
import { Button } from "@/components";

export default function VerifyPayment() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { type } = useParams();

  const reference = searchParams.get("order_reference") ?? "";
  const hasReference = Boolean(reference.trim());

  const {
    data: verificationResult,
    loading,
    error,
    refetch,
  } = useFetch(api.fetch.verifyPayment, { reference }, !hasReference);

  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  const { clearCart } = useCart();
  const isPaymentVerified =
    Boolean(verificationResult) && !loading && !error && hasReference;
  const redirectPath =
    type === "out" ? "/out/products" : relativePath.member.market;

  useEffect(() => {
    if (!isPaymentVerified) return;

    setCountdown(5);
    clearCart();
    localStorage.removeItem("my_cart");

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [clearCart, isPaymentVerified]);

  useEffect(() => {
    if (!isPaymentVerified || countdown > 0) return;
    navigate(redirectPath, { replace: true });
  }, [countdown, isPaymentVerified, navigate, redirectPath]);

  return (
    <div className="flex items-center justify-center w-full h-[80vh] px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        {!hasReference && (
          <div className="flex flex-col items-center gap-4">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <p className="text-red-600 font-medium">
              Missing payment reference.
            </p>
            <p className="text-gray-500 text-sm">
              We could not verify your payment because the reference is missing.
            </p>
            <Button
              value="Back to Marketplace"
              onClick={() =>
                navigate(type === "out" ? "/out/products" : relativePath.member.market)
              }
            />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4">
            <ArrowPathIcon className="w-12 h-12 animate-spin text-blue-500" />
            <p className="text-gray-600 text-lg">Verifying your payment...</p>
          </div>
        )}

        {error && !loading && hasReference && (
          <div className="flex flex-col items-center gap-4">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <p className="text-red-600 font-medium">
              Payment verification failed.
            </p>
            <p className="text-gray-500 text-sm">
              Please try again or contact support.
            </p>
            <Button value="Retry" onClick={() => refetch({ reference })} />
          </div>
        )}

        {verificationResult && !loading && !error && hasReference && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
            <p className="text-green-600 font-medium">
              Payment verified successfully!
            </p>
            <p className="text-gray-600 text-sm">
              Order Reference: <span className="font-mono">{reference}</span>
            </p>

            <p className="text-gray-500 text-sm mt-2">
              You will be redirected in{" "}
              <span className="font-semibold">{countdown}</span> seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
