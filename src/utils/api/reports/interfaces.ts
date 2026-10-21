/**
 * Department reports and executive summary.
 * Contract: docs/DEPARTMENT_REPORTS_BACKEND_CONTRACT.md
 */

export type DeptReportKey =
  | "membership"
  | "visitors"
  | "events"
  | "attendance"
  | "assets"
  | "finance"
  | "lifecenters";

export type ReportPeriodType = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
export type DeptReportStatus = "DRAFT" | "SUBMITTED" | "RETURNED" | "APPROVED";
export type ReportHealth = "ok" | "watch" | "act";
export type ApiPillTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface ApiPill {
  tone: ApiPillTone;
  label: string;
}

export interface ApiKpi {
  key: string;
  label: string;
  value: number | null;
  display?: string | null;
  format: "n" | "pct" | "ghs" | "days" | "dec" | "signed" | "raw";
  compare: { prev: number | null; yoy: number | null };
  points?: boolean;
  good: "up" | "down" | null;
  spark: number[];
  sub?: string | null;
  provisional?: boolean;
}

export interface ApiFlag {
  severity: "act" | "watch";
  text: string;
  link_label?: string | null;
  link_path?: string | null;
}

type ApiCell =
  | string
  | number
  | null
  | { text?: string; sub?: string; bold?: boolean; pill?: ApiPill };

interface ApiSectionBase {
  id: string;
  title: string;
  sub?: string;
  full?: boolean;
  note?: string;
  legend?: { label: string; color: string; line?: boolean }[];
}

export type ApiSection =
  | (ApiSectionBase & {
      kind: "bars";
      labels: string[];
      series: { name: string; color: string; values: number[] }[];
      stack?: boolean;
      money?: boolean;
      line?: { name: string; color: string; values: number[] };
    })
  | (ApiSectionBase & {
      kind: "hbars";
      rows: { label: string; value: number; display?: string; color?: string; sub?: string; max?: number }[];
      money?: boolean;
      max?: number;
      color?: string;
    })
  | (ApiSectionBase & { kind: "funnel"; steps: { label: string; value: number; note?: string }[] })
  | (ApiSectionBase & {
      kind: "table";
      columns: { label: string; width: string; align?: "left" | "right" }[];
      rows: { cells: ApiCell[]; keys?: (string | number)[] }[];
      sortable?: boolean;
      minWidth?: string;
    })
  | (ApiSectionBase & {
      kind: "segments";
      groups: { label?: string; parts: { label: string; value: number; color: string; display?: string }[] }[];
    })
  | (ApiSectionBase & {
      kind: "heat";
      columns: string[];
      rows: { label: string; cells: { bg: string; fg: string; text: string }[] }[];
    })
  | (ApiSectionBase & {
      kind: "calendar";
      days: { key: string; dow: string; day: number; weekend?: boolean; colors: string[]; tip: string }[];
    })
  | (ApiSectionBase & {
      kind: "list";
      items: { title: string; sub?: string; pill?: ApiPill; right?: string; pii?: boolean }[];
    })
  | (ApiSectionBase & {
      kind: "stats";
      stats: { label: string; value: string; sub?: string; color?: string }[];
    });

export interface ApiReportBody {
  kpis: ApiKpi[];
  flags: ApiFlag[];
  highlights: string[];
  sections: ApiSection[];
  by_branch: ApiSection | null;
  headline: [number, number];
  health: ReportHealth;
  provisional_note: string | null;
  empty: boolean;
  restricted?: boolean;
}

export interface ReportPeriodInfo {
  type: ReportPeriodType;
  key: string;
  label: string;
  from: string;
  to: string;
  in_progress: boolean;
  due_date: string;
  prev_label: string;
  yoy_label: string;
}

export interface ReportPeriodOption {
  key: string;
  label: string;
  in_progress: boolean;
}

export interface DeptReportRequest {
  id: number;
  text: string;
  needs_decision: boolean;
  outcome: "APPROVED" | "RESPONDED" | null;
  response: string | null;
  decided_at?: string | null;
  decided_by?: string | null;
}

export interface DeptReportWorkflow {
  id: number | null;
  status: DeptReportStatus;
  status_label: string;
  overdue: boolean;
  due_date: string;
  submitted_at: string | null;
  approved_at: string | null;
  returned_at: string | null;
  prepared_by: { id: number; name: string | null } | null;
  commentary: { wins: string; challenges: string; plans: string; testimonies: string };
  requests: DeptReportRequest[];
  trail: { action: string; who: string; when: string | null; note: string | null; done: boolean }[];
  comments: { id: number; author: string; author_id?: number; when: string; text: string }[];
}

export interface DeptReportPermissions {
  can_edit: boolean;
  can_submit: boolean;
  can_approve: boolean;
  can_return: boolean;
  can_comment: boolean;
  can_decide: boolean;
  can_remind: boolean;
}

export interface DeptReportMeta {
  key: DeptReportKey;
  area: string;
  name: string;
  hod_role: string;
  cadence: string;
}

export interface DeptReportDetail {
  meta: DeptReportMeta;
  period: ReportPeriodInfo;
  period_options: ReportPeriodOption[];
  branch: { id: number | null; name: string };
  workflow: DeptReportWorkflow;
  permissions: DeptReportPermissions;
  body: ApiReportBody;
  failed?: boolean;
}

export interface DeptReportListItem extends DeptReportMeta {
  status: DeptReportStatus;
  status_label: string;
  overdue: boolean;
  due_date: string;
  submitted_at: string | null;
  approved_at: string | null;
  returned_at: string | null;
  prepared_by: { id: number; name: string | null } | null;
  health: ReportHealth;
  headline: ApiKpi[];
  failed?: boolean;
  permissions: DeptReportPermissions;
}

export interface DeptReportList {
  period: ReportPeriodInfo;
  period_options: ReportPeriodOption[];
  branch: { id: number | null; name: string };
  viewer: { is_leadership: boolean; hod_of: DeptReportKey[] };
  reports: DeptReportListItem[];
}

export interface ExecutiveSummary {
  period: ReportPeriodInfo;
  period_options: ReportPeriodOption[];
  branch: { id: number | null; name: string };
  viewer: { is_leadership: boolean };
  empty: boolean;
  cards: {
    key: DeptReportKey;
    area: string;
    health: ReportHealth;
    headline: ApiKpi[];
    status: DeptReportStatus;
    status_label: string;
    overdue: boolean;
    prepared_by: string;
    failed?: boolean;
  }[];
  top: (ApiFlag & { report_key: DeptReportKey; area: string })[];
  tracker: {
    submitted: number;
    total: number;
    due_date: string;
    items: {
      report_key: DeptReportKey;
      area: string;
      prepared_by: string;
      status: DeptReportStatus;
      status_label: string;
      overdue: boolean;
      submitted_at: string | null;
      returned_at: string | null;
      approved_at: string | null;
    }[];
  };
  requests: {
    id: number;
    report_key: DeptReportKey;
    text: string;
    from: string;
    outcome: "APPROVED" | "RESPONDED" | null;
    response: string | null;
  }[];
  pipeline: { label: string; value: number | null; sub: string }[];
  branches:
    | {
        id: number;
        name: string;
        avg_sunday_attendance: number | null;
        visitors_per_100: number | null;
        new_members: number | null;
        giving_per_attendee: number | null;
        life_centers_meeting: string | null;
        reports_in: string;
      }[]
    | null;
}

export interface DeptReportSelector {
  report_key: DeptReportKey;
  period_type: ReportPeriodType;
  period_key: string;
  branch_id?: number;
}

export interface DeptReportCommentaryPayload extends DeptReportSelector {
  wins?: string;
  challenges?: string;
  plans?: string;
  testimonies?: string;
  requests?: { id?: number; text: string; needs_decision: boolean }[];
}

/* -------------------------------------------------------------------------- */
/*                           Event report sign-off                            */
/* -------------------------------------------------------------------------- */

export interface EventReportSignOffPayload {
  event_id: string | number;
  event_date: string;
  note?: string;
  text?: string;
}
