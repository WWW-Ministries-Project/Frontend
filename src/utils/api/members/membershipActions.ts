import { Workbook } from "exceljs";

import { api } from "@/utils/api/apiCalls";
import { downloadBlobFile } from "@/utils/helperFunctions";

import type { IMemberInfo } from "./interfaces";

/**
 * Membership actions shared by the Church Directory, Department details and
 * Membership manager screens. The backend exposes per-user endpoints for most of
 * these, so bulk variants fan out and report how many succeeded.
 */

export type MemberStageValue = "UNCONFIRMED" | "CONFIRMED" | "MEMBER";

export interface BulkOutcome {
  succeeded: number;
  failed: number;
  errors: string[];
}

type Id = string | number;

const errorMessage = (reason: unknown): string => {
  if (reason && typeof reason === "object") {
    const response = (reason as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
    const message = (reason as { message?: string }).message;
    if (message) return message;
  }
  return "Something went wrong";
};

const settle = async <T>(
  ids: Id[],
  run: (id: Id) => Promise<T>
): Promise<BulkOutcome> => {
  const results = await Promise.allSettled(ids.map((id) => run(id)));
  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => errorMessage(result.reason));
  return {
    succeeded: results.length - errors.length,
    failed: errors.length,
    errors: Array.from(new Set(errors)),
  };
};

/** Sets a member's journey stage directly (forwards or backwards). */
export const setMembersStage = (ids: Id[], status: MemberStageValue) =>
  settle(ids, (id) => api.put.updateMember({ status }, { user_id: String(id) }));

/** Moves members one step forward using the bulk transition endpoint. */
export const advanceMembers = async (
  ids: Id[],
  status: "CONFIRMED" | "MEMBER"
): Promise<BulkOutcome> => {
  if (ids.length === 0) return { succeeded: 0, failed: 0, errors: [] };
  const response = await api.post.bulkUpdateMemberStatus({ status, user_ids: ids });
  const results = response.data?.results ?? [];
  const failures = results.filter((result) => !result.success);
  return {
    succeeded: results.length ? results.length - failures.length : ids.length,
    failed: failures.length,
    errors: Array.from(
      new Set(failures.map((failure) => failure.message || "Update failed"))
    ),
  };
};

export const setMembersActive = async (
  ids: Id[],
  isActive: boolean
): Promise<BulkOutcome> => {
  if (ids.length === 0) return { succeeded: 0, failed: 0, errors: [] };
  const response = await api.post.bulkUpdateUserStatus({
    user_ids: ids,
    is_active: isActive,
  });
  const summary = response.data?.summary;
  if (summary) {
    return {
      succeeded: summary.succeeded + (summary.skipped ?? 0),
      failed: summary.failed,
      errors: [],
    };
  }
  return { succeeded: ids.length, failed: 0, errors: [] };
};

export const deleteMembers = (ids: Id[]) =>
  settle(ids, (id) => api.delete.deleteMember({ id: String(id) }));

interface DepartmentAssignment {
  department_id: number;
  position_id: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

const dateField = (row: object, key: "start_date" | "end_date") => {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === "string" && value ? value : null;
};

const readAssignments = (member: IMemberInfo): DepartmentAssignment[] => {
  const rows = Array.isArray(member.department_positions)
    ? member.department_positions
    : [];
  const assignments: DepartmentAssignment[] = [];
  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    const departmentId = Number(row.department_id);
    if (!Number.isFinite(departmentId) || departmentId <= 0) return;
    if (assignments.some((item) => item.department_id === departmentId)) return;
    const positionId = Number(row.position_id);
    assignments.push({
      department_id: departmentId,
      position_id: Number.isFinite(positionId) && positionId > 0 ? positionId : null,
      start_date: dateField(row, "start_date"),
      end_date: dateField(row, "end_date"),
    });
  });
  return assignments;
};

const fetchAssignments = async (id: Id) => {
  const response = await api.fetch.fetchAMember({ user_id: String(id) });
  return readAssignments(response.data as IMemberInfo);
};

const saveAssignments = (id: Id, assignments: DepartmentAssignment[]) =>
  // The backend replaces every row, so each existing row is sent back with its
  // dates. An empty list clears all departments. Serving in a department makes
  // the member a ministry worker (the member form only keeps departments for
  // workers), but removing the last one never clears `is_user`: that flag also
  // carries the member's access level.
  api.put.updateMember(
    {
      ...(assignments.length > 0 ? { is_user: true } : {}),
      department_positions: assignments.map((item) => ({
        department_id: item.department_id,
        position_id: item.position_id ?? null,
        ...(item.start_date ? { start_date: item.start_date } : {}),
        ...(item.end_date ? { end_date: item.end_date } : {}),
      })),
    },
    { user_id: String(id) }
  );

/**
 * Adds members to a department (or updates their position there) while keeping
 * the other departments they already serve in. Pass `null` for no position.
 */
export const assignMembersToDepartment = (
  ids: Id[],
  departmentId: number,
  positionId: number | null
) =>
  settle(ids, async (id) => {
    const current = await fetchAssignments(id);
    const next = current.some((item) => item.department_id === departmentId)
      ? current.map((item) =>
          item.department_id === departmentId
            ? { ...item, position_id: positionId }
            : item
        )
      : [...current, { department_id: departmentId, position_id: positionId }];
    await saveAssignments(id, next);
  });

/**
 * Removes a member from one department, keeping the others. Removing the last
 * one sends an empty list, which clears their departments.
 */
export const removeMemberFromDepartment = async (id: Id, departmentId: number) => {
  const current = await fetchAssignments(id);
  const next = current.filter((item) => item.department_id !== departmentId);
  if (next.length === current.length) return;
  await saveAssignments(id, next);
};

/* -------------------------------------------------------------------------- */
/*                                Excel export                                */
/* -------------------------------------------------------------------------- */

export interface MemberExportRow {
  member_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  membership_type?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  is_user?: boolean | null;
  departments?: string | null;
  date_joined?: string | null;
}

const STAGE_LABEL: Record<string, string> = {
  UNCONFIRMED: "Unconfirmed",
  CONFIRMED: "Confirmed",
  MEMBER: "Functional member",
};

export const exportMembersToExcel = async (
  rows: MemberExportRow[],
  fileName = "Members.xlsx"
) => {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Members");
  sheet.columns = [
    { header: "Member ID", key: "member_id", width: 20 },
    { header: "Name", key: "name", width: 28 },
    { header: "Email", key: "email", width: 32 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Membership type", key: "membership_type", width: 22 },
    { header: "Status", key: "status", width: 18 },
    { header: "Active", key: "active", width: 10 },
    { header: "Ministry worker", key: "worker", width: 16 },
    { header: "Departments", key: "departments", width: 30 },
    { header: "Date joined", key: "date_joined", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  rows.forEach((row) => {
    sheet.addRow({
      member_id: row.member_id ?? "",
      name: row.name ?? "",
      email: row.email ?? "",
      phone: row.phone ?? "",
      membership_type:
        row.membership_type === "ONLINE"
          ? "Online e-church family"
          : row.membership_type === "IN_HOUSE"
            ? "In-person church family"
            : row.membership_type ?? "",
      status: STAGE_LABEL[row.status ?? ""] ?? "Unconfirmed",
      active: row.is_active === false ? "No" : "Yes",
      worker: row.is_user ? "Yes" : "No",
      departments: row.departments ?? "",
      date_joined: row.date_joined ?? "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlobFile(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName
  );
};

/** Short, human summary of a bulk outcome for notifications. */
export const describeOutcome = (
  outcome: BulkOutcome,
  successText: (count: number) => string
): { message: string; type: "success" | "error" } => {
  if (outcome.failed === 0) {
    return { message: successText(outcome.succeeded), type: "success" };
  }
  const reason = outcome.errors[0] ? ` ${outcome.errors[0]}` : "";
  if (outcome.succeeded === 0) {
    return { message: `Nothing was updated.${reason}`, type: "error" };
  }
  return {
    message: `${successText(outcome.succeeded)} · ${outcome.failed} failed.${reason}`,
    type: "error",
  };
};
