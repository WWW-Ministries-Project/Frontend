import { UserType } from "../../Members/utils/membersInterfaces";
import { ApprovalInstance } from "./approvalWorkflow";

export type RequisitionStatusType =
  | "Draft"
  | "Awaiting_HOD_Approval"
  | "Awaiting_Pastor_Approval"
  | "APPROVED"
  | "REJECTED"
  | "Awaiting_Executive_Pastor_Approval"
  | "Pending signature";

export type RequesterApprover = {
  name?: string;
  position?: {
    name?: string;
  } | string | null;
};

export interface RequestApproval {
  id: number;
  request_id: number;
  hod_user_id: number;
  hod_approved: boolean;
  hod_approval_date: string;
  hod_sign: string;
  ps_user_id: number | null;
  ps_approved: boolean;
  ps_approval_date: string | null;
  ps_sign: string | null;
  hod_user: RequesterApprover | null;
  ps_user: RequesterApprover | null;
  finance_user_id: number | null;
  finance_approved: boolean;
  finance_approval_date: string | null;
  finance_sign: string | null;
  requester_sign?: string | null;
  finance_user: RequesterApprover | null;
  requester_user?: RequesterApprover | null;
}

export type RequestComments = {
  comment: string;
  created_at: string;
  id: number;
  request_comment_user: RequesterApprover | null;
  request_id: number;
  user_id: number;
};
export interface Requisition {
  comment: string;
  currency: string;
  department_id: number;
  event_id: number;
  id: number;
  approval_status: RequisitionStatusType;
  request_approval_status?: RequisitionStatusType;
  requisition_id: string;
  date_created: string;
  total_amount?: number;
  user_id: number;
  product_names: string[];
  user: UserType;
  generated_id: string;
}

export interface IRequestSummary {
  requisition_id: string;
  department: string;
  program?: string;
  event?: string;
  event_name?: string;
  request_date: string;
  total_cost: number;
  status: RequisitionStatusType;
  request_approval_status?: RequisitionStatusType;
  event_id?: number | string;
  department_id: number;
  user_sign?: string | null;
  program_id?: number | string;
}

export interface IRequester {
  name?: string;
  email?: string;
  position?: string | null;
  user_sign: string | null;
}
export interface IRequisitionDetails {
  id?: number;
  comment: string;
  currency: string;
  approval_status?: RequisitionStatusType;
  request_approval_status?: RequisitionStatusType;
  summary: IRequestSummary;
  requester: IRequester;
  request_approvals?: RequestApproval;
  approval_instances?: ApprovalInstance[];
  products: {
    id: number;
    request_id: number;
    name: string;
    unitPrice: number;
    quantity: number;
    image_url?: string | null;
    image?: string | null;
  }[];
  attachmentLists: {
    URL: string;
    id: number;
  }[];
  request_comments: RequestComments[];
}

export interface TableRow {
  name: string;
  quantity: number;
  amount: number;
  total: number;
  id: string | number;
  image_url?: string;
}

export interface EditableTableStore {
  rows: TableRow[];
  addRow: () => void;
  deleteRow: (index: number) => void;
  updateRow: (index: number, field: keyof TableRow, value: string) => void;
  setInitialRows: (data: TableRow[]) => void;
}

export interface RequisitionStore {
  requests: Requisition[];
  removeRequest: (id: string) => void;
  setRequests: (requests: Requisition[]) => void;
}
