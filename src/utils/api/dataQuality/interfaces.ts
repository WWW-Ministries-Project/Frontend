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
