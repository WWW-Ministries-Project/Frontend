// Types for the Data Quality page — duplicate member records and their merge.
// Mirrors the Backend's dataQualityService (DuplicateCandidate / MergeResult).

export type DobRelation =
  | "exact"
  | "day-month-swapped"
  | "same-year"
  | "different"
  | "one-missing";

export interface DuplicateParent {
  id: number;
  name: string;
}

export interface DuplicatePerson {
  id: number;
  name: string;
  date_of_birth: string | null;
  is_user: boolean;
  member_id: string | null;
  parents: DuplicateParent[];
}

export interface DuplicateCandidate {
  match_type: "exact" | "fuzzy";
  name_score: number;
  first_name_close: boolean;
  dob_relation: DobRelation;
  /** true = the two records share a parent (possibly twins — review carefully). */
  shared_parent: boolean;
  suggested_keep_id: number;
  suggested_remove_id: number;
  records: [DuplicatePerson, DuplicatePerson];
}

export interface DuplicateChildrenResponse {
  total: number;
  exact: number;
  fuzzy: number;
  candidates: DuplicateCandidate[];
}

export interface MergeChildrenPayload {
  keep_id: number;
  remove_id: number;
}

export interface MergeChildrenResult {
  kept_id: number;
  removed_id: number;
  edges_repointed: number;
}

// Bulk merge: runs as a background job so the user can keep working.
export interface BulkMergePayload {
  pairs: MergeChildrenPayload[];
}

export type BulkMergeItemStatus = "merged" | "failed";

export interface BulkMergeItemResult {
  keep_id: number;
  remove_id: number;
  status: BulkMergeItemStatus;
  edges_repointed?: number;
  error?: string;
}

export type BulkMergeJobStatus = "running" | "completed";

export interface BulkMergeJob {
  id: string;
  status: BulkMergeJobStatus;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  results: BulkMergeItemResult[];
  created_by: number | null;
  started_at: string;
  finished_at: string | null;
}
