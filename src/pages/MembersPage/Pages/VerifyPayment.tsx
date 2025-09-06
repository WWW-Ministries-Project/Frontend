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

  const {
    data: verificationResult,
    loading,
    error,
    refetch,
  } = useFetch(api.fetch.verifyPayment, { reference });

  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  const { clearCart } = useCart();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (verificationResult && !loading && !error) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (type === "out") {
              navigate("/out/products");
            } else {
              navigate(relativePath.member.market);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [verificationResult, loading, error]);

  useEffect(() => {
    clearCart();
    localStorage.removeItem("my_cart");
  },[]);

  return (
    <div className="flex items-center justify-center w-full h-[80vh] px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <ArrowPathIcon className="w-12 h-12 animate-spin text-blue-500" />
            <p className="text-gray-600 text-lg">Verifying your payment...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-4">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <p className="text-red-600 font-medium">
              Payment verification failed.
            </p>
            <p className="text-gray-500 text-sm">
              Please try again or contact support.
            </p>
            <Button value="Retry" onClick={() => refetch()} />
          </div>
        )}

        {verificationResult && !loading && !error && (
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
