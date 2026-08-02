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

export type PledgeAccountType = "ghipss" | "mobile_money";

/**
 * The settlement account a pledge's online redemptions are routed to. Required
 * when creating a pledge - the backend mints a Paystack subaccount from it, and
 * a pledge without one cannot be paid. Optional on update, so a meta-only edit
 * need not resend bank details.
 */
export interface PledgeSettlementAccountPayload {
  currency?: string;
  account_type: PledgeAccountType;
  /** Paystack bank or mobile money provider code */
  settlement_bank: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

export interface PledgeMutationPayload
  extends Partial<PledgeSettlementAccountPayload> {
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

/** What the API returns about a pledge's settlement account. Never the number. */
export interface PledgeSettlementSummary {
  currency: string;
  account_type: string;
  bank_name: string | null;
  account_name: string | null;
  masked_account_number: string | null;
  is_synced: boolean;
  can_be_paid_online: boolean;
}

export type PledgeStatus = "completed" | "in_progress";

export interface PledgeCaller {
  id?: number;
  user?: { id: number; name?: string } | null;
  guest_name?: string | null;
  guest_phone?: string | null;
}

export interface PledgeListRow extends PledgeSettlementSummary {
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

/* ------------------------------------------------------------------ */
/* Member-facing: paying your own pledge                               */
/* ------------------------------------------------------------------ */

/** One row of `GET /pledges/my-pledges` — the caller's own pledge. */
export interface MyPledgeRow {
  pledger_id: number;
  pledge_id: number;
  title: string | null;
  event_name: string | null;
  deadline: string | null;
  currency: string;
  group_label: string | null;
  /** Major units (GHS), unlike the payment amounts below. */
  pledged_amount: number;
  redeemed: number;
  remaining: number;
  percent: number;
  status: PledgeStatus;
  /** False when the pledge has no live subaccount, or nothing is outstanding. */
  can_be_paid_online: boolean;
  redemptions: Array<{
    id: number;
    amount: number;
    date: string;
    method: string;
    note?: string | null;
  }>;
}

/** All amounts in minor units (pesewas). */
export interface PledgeFeePreview {
  amount: number;
  fee: number;
  amount_charged: number;
}

export interface PledgePayment {
  id: string;
  reference: string;
  pledge_id: number;
  pledger_id: number | null;
  pledge_title: string;
  payer_name: string;
  /** Minor units. The redemption itself — what the pledge receives. */
  amount: number;
  /** Minor units. The Paystack fee the payer covered on top. */
  fee: number;
  /** Minor units. What the card was charged (amount + fee). */
  amount_charged: number | null;
  amount_paid: number | null;
  fee_actual: number | null;
  currency: string;
  status: "pending" | "success" | "failed" | "abandoned" | string;
  channel: string | null;
  paid_at: string | null;
  redemption_id: number | null;
  createdAt: string;
}

export interface InitializePledgePaymentPayload {
  pledger_id: number;
  /** Minor units (pesewas). Must not exceed the outstanding balance. */
  amount: number;
  /** Picks the post-payment landing page server-side. Never a URL. */
  client?: "web" | "mobile";
}

export interface InitializePledgePaymentResult {
  checkoutUrl: string;
  reference: string;
  payment: PledgePayment;
}
