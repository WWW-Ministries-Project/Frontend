import { FinanceData } from "@/utils/api/finance/interface";
import FinanceBuilder from "../Components/FinanceBuilder";

const FinancialsForm = () => {
    const defaultValues: FinanceData = {
    metaData: {
      month: "",
      year: new Date().getFullYear(),
      week: "",
      from: "",
      to: "",
      createdBy: null,
      createdDate: null,
      updatedBy: null,
      updatedDate: null,
    },
    receipts: [],
    tithe: {
      totalTithe: { percentage: 0 },
      generalTithe: { percentage: 0 },
      icareTithe: { percentage: 0 },
    },
    payments: [],
    balance: {
      ExcessOfReceiptsOverPayments: { item: "" },
      ReserveForSavings: { item: "" },
      BalanceAmount: { item: "" },
      WeeklyRefund: { item: "" },
      OfficeMaintenanceReserve: { item: "" },
    },
    fundsAllocation:[]
  };
    return ( 
        <FinanceBuilder 
            mode="create"
        financeData={defaultValues}
        />
     );
}
 
export default FinancialsForm;