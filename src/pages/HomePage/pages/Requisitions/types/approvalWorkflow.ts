export type ApproverType =
  | "HEAD_OF_DEPARTMENT"
  | "POSITION"
  | "SPECIFIC_PERSON";

export type ApprovalStep = {
  order: number;
  type: ApproverType;
  position_id?: number;
  user_id?: number;
};

export type RequisitionApprovalConfigPayload = {
  module: "REQUISITION";
  requester_user_ids: number[];
  approvers: ApprovalStep[];
  notification_user_ids?: number[];
  is_active?: boolean;
};

export type RequisitionApprovalConfig = RequisitionApprovalConfigPayload & {
  id?: number;
  is_active: boolean;
};

export type ApprovalInstanceStatus =
  | "WAITING"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type ApprovalInstance = {
  id: number;
  request_id: number;
  config_id: number;
  step_order: number;
  step_type: ApproverType;
  approver_user_id: number;
  position_id: number | null;
  configured_user_id: number | null;
  status: ApprovalInstanceStatus;
  acted_by_user_id: number | null;
  acted_at: string | null;
  comment: string | null;
};

export type RequisitionApprovalActionPayload = {
  requisition_id: number;
  action: "APPROVE" | "REJECT";
  comment?: string;
  user_sign?: string;
};

export type SubmitRequisitionPayload = {
  requisition_id: number;
};
