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
