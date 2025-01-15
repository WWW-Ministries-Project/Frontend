import { UserType } from "../../Members/utils/membersInterfaces";

export type RequisitionStatusType = "Draft" | "Awaiting_HOD_Approval" | "Awaiting_Pastor_Approval";
export interface Requisition {
  comment: string;
  currency: string;
  department_id: number;
  event_id: number;
  id: number;
  approval_status: RequisitionStatusType;
  requisition_id: string;
  date_created: string;
  user_id: number;
  product_names: string[];
  user: UserType;
  generated_id: string;
}


export interface IRequestSummary {
  requisition_id: string;
  department: string;
  program: string;
  request_date: string;
  total_cost: number;
  status: RequisitionStatusType;
  event_id: number;
  department_id: number;
}

export interface IRequester {
  name: string;
  email: string;
  position: null;
  user_sign: string | null;
}
export interface IRequisitionDetails {
  comment: string;
  currency: string;

  summary: IRequestSummary;
  requester: IRequester;
  request_approvals: null;
  products: {
    id: number;
    request_id: number;
    name: string;
    unitPrice: number;
    quantity: number;
  }[];
  attachmentLists: {
    URL: string;
    id: number;
  }[];
}

export interface TableRow {
  name: string;
  quantity: number;
  amount: number;
  total: number;
  id: string | number;
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
