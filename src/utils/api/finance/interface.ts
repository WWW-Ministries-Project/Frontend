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
