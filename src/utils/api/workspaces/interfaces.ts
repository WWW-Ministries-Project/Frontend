/**
 * Home workspaces — shapes from
 * docs/WORKSPACES_AND_REPORT_CONFIG_BACKEND_CONTRACT.md §1 and §4.
 */

export const WORKSPACE_KEYS = ["prelate", "admin", "finance", "hod", "generic"] as const;
export type WorkspaceKey = (typeof WORKSPACE_KEYS)[number];

export const isWorkspaceKey = (value: unknown): value is WorkspaceKey =>
  typeof value === "string" && (WORKSPACE_KEYS as readonly string[]).includes(value);

export type WorkspaceRangeKey = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

export type WorkspaceTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface WorkspacePill {
  tone: WorkspaceTone;
  label: string;
}

export interface WorkspaceKpi {
  key: string;
  label: string;
  value: number | null;
  format: "n" | "pct" | "ghs" | "signed" | "raw";
  delta_pct: number | null;
  points?: boolean;
  good: "up" | "down" | null;
  spark: number[];
  sub?: string;
}

export type QueueKind =
  | "requisition"
  | "dept_report"
  | "appointment"
  | "join_request"
  | "visitor"
  | "weekly_record"
  | "sermon"
  | "follow_up";

export interface QueueItemDetail {
  fields: [string, string][];
  text?: string;
  text_label?: string;
  items?: { label: string; qty?: number | null; amount: number }[];
  steps?: { label: string; who: string; state: "ok" | "cur" | "wait"; when?: string }[];
}

export interface QueueItem {
  id: string;
  kind: QueueKind;
  /** Weekly finance records use string (cuid) ids. */
  ref_id: number | string;
  title: string;
  sub: string;
  amount?: number | null;
  pill?: WorkspacePill | null;
  detail?: QueueItemDetail;
  /**
   * Not in the contract yet: department reports are approved/returned by
   * `report_key` + period, not by id. When the API sends it, Approve/Return
   * work from Home; otherwise the item links to the report.
   */
  /** follow_up only: the visitor's latest open follow-up, completed instead of creating another. */
  follow_up_id?: number | null;
  selector?: {
    report_key: string;
    period_type: string;
    period_key: string;
    branch_id?: number;
  };
}

export interface AgendaItem {
  date: string;
  title: string;
  sub: string;
  pill?: WorkspacePill | null;
  ref_id?: number;
}

export interface ListItem {
  title: string;
  sub?: string;
  pill?: WorkspacePill | null;
  right?: string | null;
  ref_id?: number;
  /** In-app path to open (notifications). */
  action_url?: string | null;
}

export interface BarRow {
  label: string;
  value: number;
  max?: number | null;
  sub?: string | null;
}

export interface NeedsItem {
  key: string;
  label: string;
  count: number;
  widget: string;
  tab?: string;
}

export type WidgetResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export interface WorkspaceRange {
  key: WorkspaceRangeKey;
  label: string;
  compare_label: string;
  from: string;
  to: string;
}

export interface WorkspaceDepartment {
  id: number;
  name: string;
  pack: "media" | "evangelism" | "children" | null;
}

export interface WorkspaceResponse {
  ws: WorkspaceKey;
  range: WorkspaceRange;
  greeting_name: string;
  departments?: WorkspaceDepartment[];
  needs: NeedsItem[];
  widgets: Record<string, WidgetResult>;
}

/* ------------------------------ Widget data ------------------------------ */

export interface KpisData {
  kpis: WorkspaceKpi[];
}
export interface QueueData {
  items: QueueItem[];
}
export interface ItemsData<T = ListItem> {
  items: T[];
}
export interface RowsData<T = BarRow> {
  rows: T[];
}
export interface StepsData {
  steps: { label: string; value: number }[];
}

export interface HeroData {
  lines: string[];
  theme: string | null;
  verse: string | null;
}

export interface AttendanceData {
  events: { id: number; name: string }[];
  points: {
    label: string;
    total: number;
    by_branch?: { branch_id: number; branch_name: string; value: number }[];
  }[];
}

export interface FollowUpData {
  need_follow_up: number;
  unassigned: number;
  items: ListItem[];
}

export interface LifeCentersData {
  stats: {
    souls_won: number;
    became_members: number;
    active_centers: number;
    total_centers: number;
    avg_attendance: number | null;
    without_leader: { count: number; names: string[] };
    no_meeting_2w: { count: number; names: string[] };
  };
  top: BarRow[];
}

export interface SchoolData {
  cohorts: { name: string; on_track: number; total: number }[];
}

export type RagCell = "ok" | "sub" | "ret" | "miss" | null;
export interface RagData {
  columns: string[];
  rows: { department: string; cells: RagCell[] }[];
}

export interface PipelineData {
  steps: { label: string; count: number; amount: number; overdue: number }[];
}

export interface AdminEventsData {
  rows: {
    id?: number;
    title: string;
    date: string;
    registered: number | null;
    capacity: number | null;
    report: "none" | "draft" | "submitted" | "approved" | null;
    past: boolean;
  }[];
}

export interface AdminDepartmentsData {
  rows: { id: number; name: string; members: number; requests: number; head: string | null }[];
}

export interface AssetsSummaryData {
  needs_repair: number;
  needs_repair_without_req: number;
  lost: number;
  last_lost_at: string | null;
  stock_check_due: string | null;
}

export interface CommsData {
  sent: number | null;
  delivered_pct: number | null;
  promotions_live: number | null;
}

export interface LogisticsData {
  /** "YYYY-MM-DD". */
  next_service: string | null;
  ride_requests: number | null;
  seats_offered: number | null;
  unmatched: number | null;
  orders_to_fulfil: number | null;
}

export interface WeeklyRecordsData {
  rows: {
    week_label: string;
    branch_name: string;
    status: "APPROVED" | "PENDING_APPROVAL" | "DRAFT" | "RETURNED" | "MISSING" | string;
    ref_id?: string | null;
  }[];
}

export interface PledgesData {
  pledged: number;
  paid: number;
  overdue_count: number;
  overdue_amount: number;
  campaigns: BarRow[];
}

export interface MarketData {
  revenue: number;
  orders: number;
  unpaid_orders: number;
  unpaid_amount: number;
  awaiting_collection: number;
}

export interface TeamCheckinsData {
  points: { label: string; rate: number | null }[];
}

export interface DeptReportStatusData {
  current: {
    period_label: string;
    status: string;
    due_date: string;
    key: string;
    period_key: string;
  };
  previous: {
    period_label: string;
    status: string;
    decided_at: string | null;
    due_date?: string;
    period_key?: string;
  } | null;
}

export interface FollowUpSplitData {
  followed_up: number;
  pending: number;
  not_contacted: number;
}

export interface ProfileData {
  pct: number;
  missing: string[];
}

export type GenericEvent = AgendaItem & { registered: boolean; can_register: boolean };

export interface GivingData {
  year_total: number;
  month_total: number;
  month_delta_pct: number | null;
  pledge: {
    name: string;
    paid: number;
    amount: number;
    next_due: string | null;
    next_amount: number | null;
  } | null;
}

export interface RideData {
  service_label: string | null;
  item: ListItem | null;
}

export interface GrowData {
  life_center: ListItem | null;
  assignment: ListItem | null;
  course: BarRow | null;
}

export interface MyRequisitionsData {
  department: string | null;
  items: ListItem[];
}

export type LatestSermonData = {
  title: string;
  preacher: string | null;
  date: string;
  duration_min: number | null;
  id: number;
  series?: string | null;
  thumbnail_url?: string | null;
  youtube_url?: string | null;
} | null;

export interface NotificationsData {
  items: ListItem[];
  unread?: number;
}
