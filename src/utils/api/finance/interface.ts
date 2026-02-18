export interface FinanceData {
    id?: string | number;
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

export interface FinancialRecord {
  id: string;
  payload: FinanceData;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialListPayload {
  data: FinancialRecord[];
}
