import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Banner } from "../../Members/Components/Banner";
import { financeData } from "../utils/data";
import { buildFinanceSummary } from "../utils/helperFunctions";
import React from "react";
import FinanceBuilder from "../Components/FinanceBuilder";



const FinanceDetailPage = () => {
    const summary = buildFinanceSummary(financeData);

  return (
    <div className="w-full space-y-8">
      <Banner>
        <div className="w-full">
          <h1 className="text-2xl font-semibold">
            Receipts and Payments Account
          </h1>
          <p className="mt-2  ">
            August 2024 · Week Three 
          </p>
        </div>
      </Banner>
      <FinanceBuilder financeData={financeData} />

      <div className="px-6 space-y-6">
      <div className="sticky top-0 bg-white ">
        <div className="grid grid-cols-5 gap-3 text-lg font-bold border-b ">
          <div className="col-span-2">Items</div>
          <div></div>
          <div className="text-right">Amount</div>
          <div className="text-right">Funds</div>
        </div>
      </div>

      {/* RECEIPTS */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Receipts</h2>

        {financeData.receipts.map((receipt) => (
          <div key={receipt.item} className="grid grid-cols-5 gap-3">
            <span className="col-span-2">{receipt.item}</span>
            <div></div>
            <span className="text-right font-medium">
              {receipt.amount !== null ?  receipt.amount.toLocaleString() : "—"}
            </span>
            <div></div>
          </div>
        ))}

        <div className="grid grid-cols-5 gap-3 ">

          <span className="col-span-2 font-semibold  pt-2">Total Receipts</span>
          <div></div>
          <span className="text-right font-semibold pt-2">{summary.receipts.total.toLocaleString()}</span>
          <span className="text-right font-semibold pt-2">{summary.receipts.total?.toLocaleString()}</span>
        </div>

        
      </section>
      <hr />

      {/* Tithe */}
      <section>
        <div className="grid grid-cols-5 gap-3 ">

          <span className="col-span-2 font-semibold  pt-2">Tithe</span>
          <div className="text-right font-semibold pt-2">{financeData.tithe.totalTithe.percentage}%</div>
          <span className="text-right font-semibold pt-2">{summary.tithe.amount.toLocaleString()}</span>
          <span className="text-right font-semibold pt-2">{summary.tithe.fundsAfterTithe.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-5 gap-3 ">

          <span className="col-span-2 font-semibold  pt-2"></span>
          <div className="text-right font-medium pt-2">{financeData.tithe.generalTithe.percentage}%</div>
          <span className="text-right font-medium pt-2">{summary.tithe.breakdown.general.toLocaleString()}</span>
          <span className="text-right font-semibold pt-2"></span>
        </div>

        <div className="grid grid-cols-5 gap-3 ">

          <span className="col-span-2 font-semibold  pt-2"></span>
          <div className="text-right font-medium pt-2">{financeData.tithe.icareTithe.percentage}%</div>
          <span className="text-right font-medium pt-2">{summary.tithe.breakdown.icare.toLocaleString()}</span>
          <span className="text-right font-semibold pt-2"></span>
        </div>
      </section>
      <hr />

      {/* PAYMENTS */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Payments</h2>

        {financeData.payments.map((payment) => (
          <div key={payment.item} className="grid grid-cols-5 gap-3">
            <span className="col-span-2">{payment.item}</span>
            <div></div>
            <span className="text-right font-medium">
              {payment.amount !== null ? payment.amount.toLocaleString() : "—"}
            </span>
            <div></div>
          </div>
        ))}

        <div className="grid grid-cols-5 gap-3 ">

          <span className="col-span-2 font-semibold  pt-2">Total Payments</span>
          <div></div>
          <span className="text-right font-semibold pt-2">{summary.payments.total.toLocaleString()}</span>
          <span className="text-right font-semibold pt-2">{summary.balance.excessAfterPayments.toLocaleString()}</span>
        </div>
      </section>
      <hr />

      {/* CALCULATIONS */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold"></h2>

          <div className="grid grid-cols-5 gap-3">
            <span className="col-span-2">{financeData.balance.ExcessOfReceiptsOverPayments.item}</span>
            <div></div>
            <span className="text-right font-medium">
              {summary.balance.excessAfterPayments !== null ? summary.balance.excessAfterPayments.toLocaleString() : "—"}
            </span>
            <div></div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <span className="col-span-2">{financeData.balance.ReserveForSavings.item}</span>
            <div></div>
            <span className="text-right font-medium">
              {summary.balance.reserveForSavings !== null ? summary.balance.reserveForSavings.toLocaleString() : "—"}
            </span>
            <div></div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <span className="col-span-2 font-semibold">{financeData.balance.BalanceAmount.item}</span>
            <div></div>
            <span className="text-right font-semibold">
              {summary.balance.netBalance !== null ? summary.balance.netBalance.toLocaleString() : "—"}
            </span>
            <div></div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <span className="col-span-2">{financeData.balance.WeeklyRefund.item}</span>
            <div></div>
            <span className="text-right font-medium">
              {summary.balance.weeklyRefund !== null ? summary.balance.weeklyRefund.toLocaleString() : "—"}
            </span>
            <div></div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <span className="col-span-2">{financeData.balance.OfficeMaintenanceReserve.item}</span>
            <div></div>
            <span className="text-right font-medium">
              {summary.balance.officeReserve !== null ? summary.balance.officeReserve.toLocaleString() : "—"}
            </span>
            <div></div>
          </div>
        

        <div className="grid grid-cols-5 gap-3 ">

          <span className="col-span-2 font-semibold  pt-2">Total Balance</span>
          <div></div>
          <span className="text-right font-semibold pt-2">{summary.balance.finalBalance.toLocaleString()}</span>
          <span className="text-right font-semibold pt-2">{summary.balance.finalBalance.toLocaleString()}</span>
        </div>
      </section>
        <hr />

      {/* ALLOCATIONS */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Fund allocation</h2>
        <div className="grid grid-cols-5 gap-3 text-lg font-bold ">
          <div className="col-span-2">Movement</div>
          <div className="text-right">Portions</div>
          <div className="text-right">Actuals</div>
          <div className="text-right">Adjusted</div>
        </div>

        {summary.fundAllocations.map((allocation:any) => (
          <div key={allocation.movement} className="grid grid-cols-5 gap-3">
            <span className="col-span-2">{allocation.movement}</span>
            <div className="text-right">{allocation.portionPercent}%</div>
            <span className="text-right font-medium">
              {allocation.actual.toLocaleString()}
            </span>
            <div className="text-right">
              {allocation.adjusted.toLocaleString()}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-5 gap-3 ">

          <span className="col-span-2 font-semibold  pt-2">Total Fund Allocation</span>
          <div className="text-right font-semibold pt-2">100%</div>
          <span className="text-right font-semibold pt-2">
            {summary.fundAllocationTotals.actual.toLocaleString()}
          </span>
          <span className="text-right font-semibold pt-2">
            {summary.fundAllocationTotals.adjusted.toLocaleString()}
          </span>
        </div>
      </section>
      </div> 
    </div>
  );
};

export default FinanceDetailPage;