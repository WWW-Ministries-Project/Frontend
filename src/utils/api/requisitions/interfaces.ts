/**
 * Requisition redesign endpoints. Shapes mirror the backend
 * `requisition-redesign.ts`; see docs/REQUISITIONS_REDESIGN_BACKEND_CONTRACT.md.
 */

export type RequisitionOverviewStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type RequisitionStepStatus = "WAITING" | "PENDING" | "APPROVED" | "REJECTED";
export type RequisitionStepType = "HEAD_OF_DEPARTMENT" | "POSITION" | "SPECIFIC_PERSON";

export interface RequisitionOverviewStep {
  order: number;
  label: string;
  type: RequisitionStepType;
  approver: { id: number; name: string };
  status: RequisitionStepStatus;
  started_at: string | null;
  acted_at: string | null;
  comment: string | null;
  signature: string | null;
}

export interface RequisitionOverviewRow {
  id: number;
  generated_id: string;
  status: RequisitionOverviewStatus;
  raw_status: string;
  requester: { id: number; name: string; position: string | null };
  department: { id: number; name: string };
  event: { id: number; name: string } | null;
  branch_id: number | null;
  currency: string;
  total_amount: number;
  items: { name: string; quantity: number; unit_price: number }[];
  purpose: string | null;
  needed_by: string | null;
  request_date: string;
  created_at: string;
  submitted_at: string | null;
  decided_at: string | null;
  last_reminder_at: string | null;
  revised_from: { id: number; generated_id: string } | null;
  revised_to: { id: number; generated_id: string } | null;
  /** Set once an approved requisition is marked disbursed (status stays APPROVED; raw_status is "DISBURSED"). */
  disbursed?: RequisitionDisbursement | null;
  attachment_count: number;
  comment_count: number;
  steps: RequisitionOverviewStep[];
}

export interface RequisitionDisbursement {
  at: string;
  by: { id: number; name: string } | null;
}

export interface RequisitionDisbursedResponse {
  requisition_id: number;
  raw_status: "DISBURSED";
  disbursed: RequisitionDisbursement;
}

/** What the viewer's role allows (newer servers). */
export interface RequisitionViewerCapabilities {
  scope: "own" | "department" | "branch";
  raise_for_any_department: boolean;
  send_reminders: boolean;
  export: boolean;
  mark_disbursed: boolean;
  delete: boolean;
  override_step: boolean;
  configure_approvals: boolean;
}

export interface RequisitionOverviewResponse {
  viewer: {
    user_id: number;
    is_manager: boolean;
    is_approver: boolean;
    can?: RequisitionViewerCapabilities;
  };
  reply_days: number;
  lookback_days: number;
  requisitions: RequisitionOverviewRow[];
}

export interface RequisitionHistoryEntry {
  at: string;
  text: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
}

export interface RequisitionOverviewDetail extends RequisitionOverviewRow {
  products: { id: number; name: string; quantity: number; unit_price: number; image_url: string | null }[];
  attachments: { id: number; url: string }[];
  comments: { id: number; user_id: number | null; name: string; comment: string; created_at: string }[];
  history: RequisitionHistoryEntry[];
}

export interface RequisitionReminderResponse {
  requisition_id: number;
  reminded_at: string;
  approver_name: string | null;
}

export interface RequisitionAnalyticsResponse {
  period: { from: string; to: string; bucket: "day" | "week" | "month" };
  currency: string;
  reply_days: number;
  viewer: { user_id: number; is_manager: boolean };
  kpis: {
    submitted: number;
    requested_value: number;
    approved_value: number;
    approved_count: number;
    rejected_count: number;
    in_approval: number;
    median_days_to_approval: number | null;
    slow_count: number;
  };
  buckets: {
    label: string;
    start: string;
    end: string;
    submitted: number;
    requested_value: number;
    approved_value: number;
  }[];
  steps: {
    order: number;
    label: string;
    median_days: number | null;
    over_count: number;
    total: number;
    waiting_now: number;
  }[];
  departments: {
    department_id: number;
    name: string;
    approved_value: number;
    submitted: number;
    rejected: number;
    decided: number;
  }[];
  approvers: {
    user_id: number;
    name: string;
    role: string;
    decided: number;
    approved: number;
    median_days: number | null;
    over_count: number;
    waiting_now: number;
    oldest_waiting_days: number | null;
  }[];
  top_items: { name: string; times: number; quantity: number; value: number; departments: number }[];
  stuck_now: { count: number; value: number; generated_ids: string[] };
  rows: {
    id: number;
    generated_id: string;
    requester: string;
    department: string;
    event: string | null;
    amount: number;
    currency: string;
    status: RequisitionOverviewStatus;
    submitted_at: string | null;
    step_days: { order: number; label: string; days: number | null }[];
    days_to_decision: number | null;
  }[];
}

/** Body for create-requisition / update-requisition from the redesigned form. */
export interface RequisitionFormPayload {
  id?: number;
  department_id: number;
  event_id: number | null;
  request_date: string;
  needed_by: string;
  purpose: string;
  currency: string;
  branch_id?: number;
  revised_from_id?: number;
  products: { id?: number; name: string; quantity: number; unitPrice: number; image_url?: string | null }[];
  attachmentLists: { id?: number; URL: string }[];
}
