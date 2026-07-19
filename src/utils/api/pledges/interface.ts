export interface PledgePerson {
  user_id?: number | null;
  guest_name?: string | null;
  guest_phone?: string | null;
}

export interface PledgerInput extends PledgePerson {
  id?: number;
  pledged_amount?: number;
}

export interface PledgeGroupInput {
  id?: number;
  called_amount: number;
  label?: string | null;
  pledgers: PledgerInput[];
}

export interface PledgeMutationPayload {
  id?: number;
  branch_id?: number | "";
  event_id: number | "";
  title?: string;
  target_amount?: number | null;
  deadline?: string | null;
  callers: PledgePerson[];
  // Omit `groups` on a meta/callers-only edit to preserve existing pledgers + redemptions.
  groups?: PledgeGroupInput[];
}

export type PledgeStatus = "completed" | "in_progress";

export interface PledgeCaller {
  id?: number;
  user?: { id: number; name?: string } | null;
  guest_name?: string | null;
  guest_phone?: string | null;
}

export interface PledgeListRow {
  id: number;
  event: { id: number; event_name: string } | null;
  title: string | null;
  callers: PledgeCaller[];
  totalPledged: number;
  totalRedeemed: number;
  remaining: number;
  percent: number;
  status: PledgeStatus;
}

export interface Redemption {
  id: number;
  amount: number;
  date: string;
  method: string;
  note?: string | null;
  image_url?: string | null;
}

export interface PledgerRow {
  id: number;
  group_id: number;
  group_label?: string | null;
  called_amount: number;
  user?: { id: number; name?: string } | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  pledged_amount: number;
  redeemed: number;
  remaining: number;
  redemptions: Redemption[];
}

export interface PledgeDetail extends PledgeListRow {
  deadline: string | null;
  groups: PledgeGroupInput[];
  pledgers: PledgerRow[];
}

export interface RedemptionPayload {
  pledger_id: number;
  amount: number;
  date: string;
  method: string;
  note?: string;
  file?: File | null;
}
