import type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { formatDate } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { relativePath } from "@/utils";
import type { DepartmentStatus, JoinRequestRow, MembersType } from "@/utils";

/** Department fields the list and detail endpoints return. */
export interface DepartmentRecord {
  id: number;
  name: string;
  description?: string | null;
  department_head?: number | null;
  department_head_info?: { id: number; name: string } | null;
  member_count?: number;
  status?: DepartmentStatus;
  branch_id?: number | null;
  position?: { id: number; name: string }[];
}

/** A member row from `department/get-department`. */
export type DepartmentMemberRow = MembersType & {
  department_positions?: {
    department_id: number | null;
    department_name?: string | null;
    position_id: number | null;
    position_name?: string | null;
  }[];
};

export const departmentsListPath = `${relativePath.home.main}/${relativePath.home.membership.main}/${relativePath.home.membership.departments.main}`;

export const memberProfilePath = (encodedId: string) =>
  `${relativePath.home.main}/${relativePath.home.members.main}/${encodedId}`;

export const departmentStatusPill = (
  status?: DepartmentStatus | null
): { label: string; tone: PillTone } =>
  (status ?? "OPEN") === "OPEN"
    ? { label: "Open", tone: "success" }
    : { label: "Closed", tone: "neutral" };

/**
 * "Details" cell for a join request: the member's note while pending, the
 * position and start date once approved, the reason once declined.
 */
export const joinRequestDetails = (
  request: JoinRequestRow
): { main: string; sub?: string } => {
  if (request.status === "APPROVED") {
    return {
      main: request.position_name?.trim() || "Member",
      sub: request.start_date ? `Starts ${formatDate(request.start_date)}` : undefined,
    };
  }
  if (request.status === "DECLINED") {
    return { main: request.decline_reason?.trim() || "Declined" };
  }
  return { main: request.note?.trim() || "No note" };
};

export const apiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
};

/** Position this member holds in the given department, if the API sent it. */
export const memberPositionIn = (
  member: DepartmentMemberRow,
  departmentId: number
): { id: number | null; name: string | null } => {
  const entry = (member.department_positions ?? []).find(
    (row) => Number(row.department_id) === departmentId
  );
  return {
    id: entry?.position_id ?? null,
    name: entry?.position_name?.trim() || null,
  };
};

export const todayIso = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};
