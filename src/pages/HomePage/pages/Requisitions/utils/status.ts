import { RequisitionStatusType } from "../types/requestInterface";

type StatusShape = {
  approval_status?: RequisitionStatusType;
  request_approval_status?: RequisitionStatusType;
};

export const resolveRequisitionStatus = (
  value: StatusShape | undefined | null
): RequisitionStatusType => {
  if (!value) {
    return "Draft";
  }

  return value.request_approval_status ?? value.approval_status ?? "Draft";
};

export const isAwaitingApprovalStatus = (status: RequisitionStatusType) =>
  status.startsWith("Awaiting") || status === "Pending signature";
