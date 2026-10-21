import type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

/* Palette taken from the design system (see CLAUDE.md in the design project). */
export const NV = "#080D2D";
export const BZ = "#9A5D1A";
export const SF = "rgba(8,13,45,0.3)";
export const GR = "#D8DAE5";
export const MG = "#6B7280";
export const GN = "#15803D";
export const AM = "#B45309";
export const RD = "#B91C1C";
export const BL = "#1D4ED8";

export type ChartColor = string;

export type KpiFormat = "n" | "pct" | "ghs" | "days" | "dec" | "signed" | "raw";

/** Change against the comparison period. `unit: "pts"` means percentage points. */
export interface Delta {
  pct: number;
  abs?: number | null;
  unit?: "pts";
}

export interface ReportKpi {
  label: string;
  value: string;
  format: KpiFormat;
  delta?: Delta | null;
  good?: "up" | "down" | null;
  spark?: number[];
  sub?: string;
  provisional?: boolean;
}

export type Severity = "act" | "watch";

export interface ReportFlag {
  severity: Severity;
  text: string;
  link?: string;
  onOpen?: () => void;
}

export interface PillSpec {
  tone: PillTone;
  label: string;
}

export type TableCell =
  | string
  | number
  | null
  | undefined
  | { text?: string; sub?: string; bold?: boolean; pill?: PillSpec };

export interface TableColumn {
  label: string;
  width: string;
  align?: "left" | "right";
}

export interface HeatCell {
  bg: string;
  fg: string;
  text: string;
}

interface SectionBase {
  id: string;
  title: string;
  sub?: string;
  full?: boolean;
  note?: string;
  legend?: { label: string; color: ChartColor; line?: boolean }[];
}

export type ReportSection =
  | (SectionBase & {
      kind: "bars";
      labels: string[];
      series: { name: string; color: ChartColor; values: number[] }[];
      stack?: boolean;
      money?: boolean;
      line?: { name: string; color: ChartColor; values: number[] };
    })
  | (SectionBase & {
      kind: "hbars";
      rows: { label: string; value: number; display?: string; color?: ChartColor; sub?: string; max?: number }[];
      money?: boolean;
      max?: number;
      color?: ChartColor;
    })
  | (SectionBase & { kind: "funnel"; steps: { label: string; value: number; note?: string }[] })
  | (SectionBase & {
      kind: "table";
      columns: TableColumn[];
      rows: { cells: TableCell[]; keys?: (string | number)[]; onClick?: () => void }[];
      sortable?: boolean;
      minWidth?: string;
    })
  | (SectionBase & {
      kind: "segments";
      groups: { label?: string; parts: { label: string; value: number; color: ChartColor; display?: string }[] }[];
    })
  | (SectionBase & { kind: "heat"; columns: string[]; rows: { label: string; cells: HeatCell[] }[] })
  | (SectionBase & {
      kind: "calendar";
      days: { key: string; dow: string; day: number; weekend?: boolean; colors: string[]; tip: string }[];
    })
  | (SectionBase & {
      kind: "list";
      items: { title: string; sub?: string; pill?: PillSpec; right?: string; hidden?: boolean }[];
    })
  | (SectionBase & {
      kind: "stats";
      stats: { label: string; value: string; sub?: string; color?: string }[];
    });

/* -------------------------------------------------------------------------- */
/*                           Department report model                          */
/* -------------------------------------------------------------------------- */

export type ReportStatus = "Draft" | "Submitted" | "Returned" | "Approved";
export type DeptReportId =
  | "membership"
  | "visitors"
  | "events"
  | "attendance"
  | "assets"
  | "finance"
  | "lifecenters";

export type PeriodType = "Weekly" | "Monthly" | "Quarterly" | "Annual" | "Custom";
export type CompareMode = "prev" | "yoy";
export type Health = "ok" | "watch" | "act";

export interface LeadershipRequest {
  text: string;
  needsDecision: boolean;
  outcome?: "Approved" | "Responded" | null;
  response?: string | null;
}

export interface Commentary {
  wins: string;
  challenges: string;
  plans: string;
  testimonies: string;
  requests: LeadershipRequest[];
}

export interface TrailEntry {
  action: string;
  who: string;
  when: string;
}

export interface ReportComment {
  id: string;
  author: string;
  when: string;
  text: string;
}

/** Workflow state for one department report in one period + branch. */
export interface ReportWorkflow {
  status: ReportStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  returnedAt?: string | null;
  commentary: Commentary;
  trail: TrailEntry[];
  comments: ReportComment[];
}

/** The computed body of a report: everything drawn on the Report tab. */
export interface ReportBody {
  kpis: ReportKpi[];
  flags: ReportFlag[];
  highlights: string[];
  sections: ReportSection[];
  byBranch?: ReportSection | null;
  /** Two KPI indexes used on executive and library cards. */
  headline: [number, number];
  health: Health;
  provisional?: string | null;
  empty?: boolean;
}

export interface DeptReportMeta {
  id: DeptReportId;
  area: string;
  name: string;
  hodRole: string;
  cadence: string;
  /** Permission domain whose `view` access is needed to read the source data. */
  domain: string;
}

export interface PeriodRange {
  type: PeriodType;
  key: string;
  label: string;
  from: string;
  to: string;
  inProgress: boolean;
  /** Buckets used for trend charts (e.g. last 12 months). */
}

export const EMPTY_COMMENTARY: Commentary = {
  wins: "",
  challenges: "",
  plans: "",
  testimonies: "",
  requests: [],
};
