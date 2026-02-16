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
      totalTithe: { percentage: 0, amount: 0, funds: 0, label: "" },
      generalTithe: { percentage: 0, amount: 0, funds: 0, label: "" },
      icareTithe: { percentage: 0, amount: 0, funds: 0, label: "" },
    },
    payments: [],
    balance: {
      ExcessOfReceiptsOverPayments: { item: "", amount: 0 },
      ReserveForSavings: { item: "", amount: 0 },
      BalanceAmount: { item: "", amount: 0 },
      WeeklyRefund: { item: "", amount: 0 },
      OfficeMaintenanceReserve: { item: "", amount: 0 },
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
