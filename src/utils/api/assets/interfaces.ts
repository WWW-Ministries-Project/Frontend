/** Shapes for the Assets section. Backend: docs/ASSETS_REDESIGN_BACKEND_CONTRACT.md. */

export type AssetStatus =
  | "ASSIGNED"
  | "UNASSIGNED"
  | "NEEDS_REPAIR"
  | "OUT_OF_REPAIRS"
  | "NOT_FIXABLE"
  | "LOST_OR_STOLEN";

export type AssetCategoryKey = "sound" | "music" | "media" | "furniture" | "appliance" | "vehicle" | "other";

export type AssetHistoryTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface AssetRow {
  id: number;
  /** Human asset ID on the tag, e.g. WWM-HC-ASSET-20260012. */
  code: string;
  name: string;
  category: AssetCategoryKey;
  status: AssetStatus;
  department: { id: number; name: string } | null;
  date_assigned: string | null;
  date_purchased: string | null;
  supplier: string | null;
  price: number;
  description: string | null;
  photo: string | null;
  status_since: string | null;
  status_note: string | null;
  lost_confirmed_at: string | null;
  last_counted_at: string | null;
  created_at: string;
  branch_id: number | null;
  repair_requisition: {
    id: number;
    generated_id: string;
    status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  } | null;
}

export interface AssetDepartment {
  id: number;
  name: string;
  head: { id: number; name: string } | null;
}

export interface AssetOverviewResponse {
  viewer: {
    user_id: number | null;
    can_view_all: boolean;
    can_manage: boolean;
    can_delete: boolean;
    department_ids: number[];
  };
  repair_stale_days: number;
  categories: { key: AssetCategoryKey; label: string }[];
  departments: AssetDepartment[];
  assets: AssetRow[];
}

export interface AssetHistoryEntry {
  id: number;
  at: string;
  text: string;
  tone: AssetHistoryTone;
  by: { id: number; name: string } | null;
}

export interface AssetHistoryResponse {
  asset_id: number;
  history: AssetHistoryEntry[];
}

export interface AssetSavePayload {
  id?: number;
  name: string;
  category: string;
  date_purchased: string;
  supplier: string;
  price: number;
  status: AssetStatus;
  description: string;
  department_id: number | null;
  date_assigned: string | null;
  status_note?: string;
  photo?: string | null;
  branch_id?: number;
}

/** State before a status change, sent back to undo it. */
export interface AssetSnapshot {
  id: number;
  status: AssetStatus;
  department_id: number | null;
  date_assigned: string | null;
  status_since: string | null;
  status_note: string | null;
  lost_confirmed_at: string | null;
  repair_request_id: number | null;
}

export interface AssetStatusPayload {
  ids: number[];
  status: AssetStatus;
  department_id?: number | null;
  date?: string;
  note?: string;
}

export interface AssetStatusResponse {
  assets: AssetRow[];
  previous: AssetSnapshot[];
}

export interface RepairRequisitionPayload {
  asset_ids: number[];
  estimates: Record<number, number>;
  needed_by: string;
  purpose: string;
  user_sign: string;
  fallback_department_id?: number | null;
  branch_id?: number;
}

export interface RepairRequisitionResponse {
  requisitions: {
    id: number;
    generated_id: string;
    department: { id: number; name: string };
    head_name: string | null;
    asset_ids: number[];
  }[];
  skipped: string[];
  assets: AssetRow[];
}

/* ------------------------------ Stock checks ------------------------------ */

export type CountResult = "found" | "elsewhere" | "damaged" | "missing" | "atrepair" | "back";
export type CountFix =
  | "move"
  | "return"
  | "needs"
  | "beyond"
  | "keep"
  | "repair"
  | "working"
  | "lost"
  | "add"
  | "ignore";

export interface StockCheckItem {
  asset_id: number;
  asset: {
    code: string;
    name: string;
    category: AssetCategoryKey;
    status: AssetStatus;
    status_since: string | null;
    status_note: string | null;
    price: number;
  };
  /** Department id, or 0 for the store. */
  expected_key: number;
  expected_name: string;
  result: CountResult | null;
  /** Where an "elsewhere" item was found; 0 = store; null = not chosen yet. */
  found_key: number | null;
  found_name: string | null;
  fix: CountFix | null;
  counted_at: string | null;
  counted_by_name: string | null;
}

export interface StockCheckExtra {
  id: number;
  name: string;
  category: AssetCategoryKey;
  found_key: number | null;
  found_name: string;
  note: string | null;
  fix: "add" | "ignore";
  recorded_at: string;
  recorded_by: number | null;
  recorded_by_name: string | null;
  created_asset_id: number | null;
}

export interface StockCheckDepartment {
  key: number;
  name: string;
  counter: { id: number; name: string } | null;
  submitted_at: string | null;
  submitted_by_name: string | null;
  reminded_at: string | null;
}

export interface StockCheck {
  id: number;
  name: string;
  scope_label: string;
  status: "open" | "closed";
  started_at: string;
  due_date: string;
  closed_at: string | null;
  created_by: { id: number; name: string } | null;
  closed_by: { id: number; name: string } | null;
  departments: StockCheckDepartment[];
  items: StockCheckItem[];
  extras: StockCheckExtra[];
}

/** A closed check in the paged history list; open it with stock-checks/detail. */
export interface PastStockCheck {
  id: number;
  name: string;
  scope_label: string;
  started_at: string;
  closed_at: string | null;
  created_by: { id: number; name: string } | null;
  closed_by: { id: number; name: string } | null;
  stats: { expected: number; counted: number; matched: number; differences: number; not_found_value: number };
}

export interface StockCheckListResponse {
  viewer: { user_id: number | null; is_admin: boolean; department_keys: number[] };
  /** Open checks, in full. */
  checks: StockCheck[];
  /** Closed checks, newest first (administrators only). */
  past: PastStockCheck[];
  past_total: number;
  past_offset: number;
  past_limit: number;
}

export interface StockCheckResponse {
  check: StockCheck;
}
