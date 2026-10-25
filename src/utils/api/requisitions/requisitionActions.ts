import instance from "@/axiosInstance";

import type { RequisitionDisbursedResponse } from "./interfaces";

/**
 * Requisition endpoints added after the shared api clients (apiPost etc.)
 * were frozen. Same axios instance, so auth, branch header and error toasts
 * behave as for every other call.
 */

/** POST /requisitions/mark-disbursed — needs Requisition.mark_disbursed. */
export const markRequisitionDisbursed = async (
  requisitionId: number
): Promise<RequisitionDisbursedResponse | undefined> => {
  const response = await instance.post<{ data?: RequisitionDisbursedResponse }>(
    "requisitions/mark-disbursed",
    { requisition_id: requisitionId }
  );
  return response?.data?.data;
};
