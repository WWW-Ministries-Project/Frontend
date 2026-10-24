/** Church-wide reports a department can be made responsible for. */
export type ReportConfigKey =
  | "membership"
  | "visitors"
  | "events"
  | "attendance"
  | "assets"
  | "finance"
  | "lifecenters";

export interface ReportConfigDepartment {
  id: number;
  name: string;
  branch_id: number | null;
  branch_name: string | null;
  head: { id: number; name: string } | null;
  members: number;
}

export interface ReportConfig {
  /** Department id responsible for each church-wide report. */
  owners: Record<ReportConfigKey, number | null>;
  dept_attendance: { due_day: number; disabled_department_ids: number[] };
  /** Limited to the caller's branches. */
  departments: ReportConfigDepartment[];
}

export interface ReportConfigPayload {
  owners?: Partial<Record<ReportConfigKey, number | null>>;
  dept_attendance?: { due_day?: number; disabled_department_ids?: number[] };
}
