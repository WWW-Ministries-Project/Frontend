export type JoinRequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export interface OpenDepartmentToJoin {
  id: number;
  name: string;
  description?: string | null;
  status: "OPEN" | "CLOSED";
  department_head_info?: { id: number; name: string } | null;
  position: { id: number; name: string }[];
}

export interface JoinRequestRow {
  id: number;
  status: JoinRequestStatus;
  requested_at: string;
  decided_at?: string | null;
  decline_reason?: string | null;
  department_id?: number;
  department_name?: string;
  member_id?: number;
  member_name?: string;
  phone_number?: string | null;
}

export interface CreateJoinRequestPayload {
  department_id: number;
}

export interface ApproveJoinRequestPayload {
  id: number;
  position_id?: number;
  start_date?: string;
  instructions?: string;
}

export interface DeclineJoinRequestPayload {
  id: number;
  decline_reason?: string;
}

export interface BulkJoinRequestPayload {
  ids: number[];
  action: "approve" | "decline";
  position_id?: number;
  start_date?: string;
  instructions?: string;
  decline_reason?: string;
}
