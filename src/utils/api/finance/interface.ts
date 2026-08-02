export interface FinanceData {
  id?: string | number;
  branch_id?: number | "";
  metaData?: {
    periodDate?: string;
    month: string;
    year: number;
    week: string;
    from: string;
    to: string;
    createdBy: string | null;
    createdDate: string | null;
    updatedBy: string | null;
    updatedDate: string | null;
  };
  receipts: Array<{ item: string; amount: number | string | null; configId?: string | number }>;
  tithe: {
    totalTithe: { percentage: number; label?: string; amount?: number; funds?: number };
    breakdown: Array<{ item: string; percentage: number; configId?: string | number; amount?: number }>;
  };
  payments: Array<{ item: string; amount: number | string | null; configId?: string | number }>;
  balance: {
    ExcessOfReceiptsOverPayments: { item: string,  amount: number | string };
    ReserveForSavings: { item: string, amount: number | string };
    BalanceAmount: { item: string, amount:number | string };
    WeeklyRefund: { item: string, amount: number | string };
    OfficeMaintenanceReserve: { item: string, amount: number | string };
  };
  fundAllocation: Array<{
    movement: string;
    actual: number | null;
    portionPercent: number;
    adjusted: number | null;
    configId?: string | number;
  }>;

}

export type FinanceApprovalStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED";

export type FinanceSaveAction = "SAVE_DRAFT" | "SAVE_AND_APPROVE";

export interface FinanceApprovalConfig {
  finance_approver_user_id: number | null;
  notification_user_ids: number[];
  is_active: boolean;
}

export interface FinancialRecord {
  id: string;
  payload: FinanceData;
  periodDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  status?: FinanceApprovalStatus;
  financeApproverUserId?: number | null;
  submittedByUserId?: number | null;
  submittedAt?: string | null;
  approvedByUserId?: number | null;
  approvedAt?: string | null;
  isEditable?: boolean;
  notificationUserIds?: number[];
}

export interface FinancialListPayload {
  data: FinancialRecord[];
}

export type FinanceMutationRequest = FinanceData & {
  action: FinanceSaveAction;
};

export type GivingAccountType = "ghipss" | "mobile_money";

export interface GivingOption {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  account_type: GivingAccountType;
  /** Paystack bank or mobile money provider code */
  settlement_bank: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  masked_account_number: string;
  subaccount_code: string | null;
  /** Always 100 — payments are routed to this account, never split */
  percentage_charge: number;
  bearer: string;
  is_active: boolean;
  archived_at: string | null;
  paystack_synced_at: string | null;
  /** False when local state and Paystack are known to have drifted */
  is_synced: boolean;
  branch_id: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GivingOptionPayload {
  name: string;
  description?: string;
  account_type: GivingAccountType;
  settlement_bank: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  currency?: string;
  branch_id?: number;
}

export interface PaystackBank {
  name: string;
  code: string;
  type: string;
  currency: string;
  active: boolean;
}

export interface ResolvedBankAccount {
  account_number: string;
  account_name: string;
}

export type GivingContributionStatus =
  | "pending"
  | "success"
  | "failed"
  | "abandoned";

export interface GivingContribution {
  id: string;
  /** Paystack transaction reference */
  reference: string;
  giving_option_id: string;
  /** Snapshot taken when the payment started, not a live join */
  giving_option_name: string;
  user_id: number | null;
  donor_name: string;
  donor_email: string;
  /** Minor units (pesewas) - divide by 100 to display. The donation: what the fund receives, NOT what the donor's card was charged */
  amount: number;
  /** The Paystack fee the donor was grossed up by, at the rate configured when the payment started. Added on top of `amount` - never part of it */
  fee: number;
  /** What the donor's card was actually charged: amount + fee. Null for rows predating the gross-up. Compare `amount_paid` against THIS, not `amount` */
  amount_charged: number | null;
  /** The fee Paystack actually took, from the verify payload. Differs from `fee` only when the configured fee rate has drifted from Paystack's real one */
  fee_actual: number | null;
  /** What Paystack collected. Differs from amount_charged only when something went wrong */
  amount_paid: number | null;
  currency: string;
  status: GivingContributionStatus;
  channel: string | null;
  paid_at: string | null;
  receipt_sent_at: string | null;
  branch_id: number | null;
  createdAt: string;
  updatedAt: string;
}

export type GivingContributionQuery = Partial<
  Record<
    "page" | "take" | "branch_id" | "giving_option_id" | "status" | "from" | "to",
    string | number
  >
>;

/* ------------------------------------------------------------------ */
/* Member-facing giving                                                */
/* ------------------------------------------------------------------ */

/**
 * A giving option as a member sees it. Deliberately far narrower than the admin
 * `GivingOption`: settlement details are none of a donor's business.
 */
export interface AvailableGivingOption {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  branch_id: number | null;
}

/** All amounts in minor units (pesewas). */
export interface GivingFeePreview {
  /** The donation — what the fund receives. */
  amount: number;
  /** The Paystack fee the donor covers on top. */
  fee: number;
  /** What the card is actually charged. */
  amount_charged: number;
}

export interface InitializeGivingPayload {
  giving_option_id: string;
  /** Minor units (pesewas). Minimum 100. */
  amount: number;
  /** Picks the post-payment landing page server-side. Never a URL. */
  client?: "web" | "mobile";
}

export interface InitializeGivingResult {
  checkoutUrl: string;
  reference: string;
  contribution: GivingContribution;
}

/**
 * Retrying names the failed attempt and nothing else — the amount and the fund
 * are read off that row server-side, so a retry cannot become a different gift.
 * The result carries a NEW reference: Paystack requires references to be unique
 * per initialization, so the old attempt stays in history as its own row.
 */
export interface RetryGivingPayload {
  reference: string;
  /** Picks the post-payment landing page server-side. Never a URL. */
  client?: "web" | "mobile";
}
