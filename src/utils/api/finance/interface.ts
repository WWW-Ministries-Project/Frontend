export interface FinanceData {
    metaData?: {
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
  receipts: Array<{ item: string; amount: number | null }>;
  tithe: {
    totalTithe: { percentage: number, amount: number, funds:number, label:string };
    generalTithe: { percentage: number, amount: number, funds:number, label:string};
    icareTithe: { percentage: number, amount: number, funds:number, label:string};
  };
  payments: Array<{ item: string; amount: number | null }>;
  balance: {
    ExcessOfReceiptsOverPayments: { item: string,  amount: number };
    ReserveForSavings: { item: string, amount: number};
    BalanceAmount: { item: string, amount:number };
    WeeklyRefund: { item: string, amount: number };
    OfficeMaintenanceReserve: { item: string, amount: number };
  };
  fundsAllocation: Array<{ movement: string; actual: number; portionPercent: number;  adjusted: number}>;


}

