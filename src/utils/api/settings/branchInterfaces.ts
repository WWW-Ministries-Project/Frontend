export interface Branch {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  pastor_in_charge_id?: number | null;
  pastor_in_charge?: {
    id: number;
    name: string;
    member_id?: string | null;
  } | null;
  is_default?: boolean;
  /** People whose home branch this is (list-branches only). */
  member_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BranchPayload {
  id?: number;
  name: string;
  description?: string | null;
  location?: string | null;
  pastor_in_charge_id?: number | null;
}

export interface BranchDeleteBlocker {
  key: string;
  /** Ready to show, e.g. "412 members". */
  label: string;
  count: number;
}

export interface BranchDeleteImpact {
  branch_id: number;
  name: string;
  is_default: boolean;
  deletable: boolean;
  blockers: BranchDeleteBlocker[];
}
