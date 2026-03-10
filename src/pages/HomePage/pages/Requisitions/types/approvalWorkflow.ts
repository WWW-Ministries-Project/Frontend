export type ApproverType =
  | "HEAD_OF_DEPARTMENT"
  | "POSITION"
  | "SPECIFIC_PERSON";

export type ApprovalModule = "REQUISITION" | "EVENT_REPORT";

export type ApprovalStep = {
  order: number;
  type: ApproverType;
  position_id?: number;
  user_id?: number;
};

type ApprovalConfigPayloadBase = {
  approvers: ApprovalStep[];
  notification_user_ids?: number[];
  is_active?: boolean;
  similar_item_lookback_days?: number;
};

export type RequisitionApprovalConfigPayload = ApprovalConfigPayloadBase & {
  module: "REQUISITION";
  requester_user_ids: number[];
};

export type EventReportApprovalConfigPayload = ApprovalConfigPayloadBase & {
  module?: "EVENT_REPORT";
  requester_user_ids?: number[];
};

export type ApprovalConfigPayload =
  | RequisitionApprovalConfigPayload
  | EventReportApprovalConfigPayload;

type ApprovalConfigBase = ApprovalConfigPayloadBase & {
  id?: number;
  module: ApprovalModule;
  requester_user_ids: number[];
  is_active: boolean;
};

export type RequisitionApprovalConfig = ApprovalConfigBase & {
  module: "REQUISITION";
};

export type EventReportApprovalConfig = ApprovalConfigBase & {
  module: "EVENT_REPORT";
};

export type ApprovalConfig = RequisitionApprovalConfig | EventReportApprovalConfig;

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

export type SimilarRequisitionItem = {
  item_name: string;
  image_url?: string | null;
  requisition_id: number;
  generated_id?: string | null;
  request_date?: string | null;
  requester_name?: string | null;
  status?: string | null;
  quantity?: number | null;
};

export type SimilarRequisitionMatchedItemGroup = {
  current_item_name: string;
  current_item_image_url?: string | null;
  matches?: SimilarRequisitionItem[];
};

export type RequisitionSimilarItemsResponse = {
  lookback_days_used?: number | null;
  items?: SimilarRequisitionItem[];
  matched_items?: SimilarRequisitionMatchedItemGroup[];
};
