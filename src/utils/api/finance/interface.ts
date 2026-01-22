export interface FinanceData {
    metaData?: {
        month: string;
        year: number;
        week: string;
        from: string;
        to: string;
        createdBy: string;
        createdDate: string;
        updatedBy: string;
        updatedDate: string;
    };
  receipts: Array<{ item: string; amount: number | null }>;
  tithe: {
    totalTithe: { percentage: number };
    generalTithe: { percentage: number };
    icareTithe: { percentage: number };
  };
  payments: Array<{ item: string; amount: number | null }>;
  balance: {
    ExcessOfReceiptsOverPayments: { item: string };
    ReserveForSavings: { item: string };
    BalanceAmount: { item: string };
    WeeklyRefund: { item: string };
    OfficeMaintenanceReserve: { item: string };
  };
}