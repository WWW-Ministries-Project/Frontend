import instance from "@/axiosInstance";

/**
 * Marketplace order endpoints added after the shared api clients (apiPost
 * etc.) were frozen. Same axios instance, so auth, branch header and error
 * toasts behave as for every other call.
 */

export interface MarketReconcileResult {
  /** Pending gateway payments looked up for the market. */
  checked?: number;
  /** Look-ups that failed and stay pending. */
  failed?: number;
}

/**
 * POST /orders/reconcile-hubtel-pending-payments?market_id= — checks one
 * market's pending gateway payments. Needs Marketplace.reconcile_payments.
 */
export const reconcileMarketPayments = async (
  marketId: number | string,
  limit = 100
): Promise<MarketReconcileResult | undefined> => {
  const response = await instance.post<{ data?: MarketReconcileResult }>(
    `orders/reconcile-hubtel-pending-payments?limit=${limit}&market_id=${encodeURIComponent(
      String(marketId)
    )}`,
    {}
  );
  return response?.data?.data;
};
