export const sumBy = <T>(
  items: T[],
  selector: (item: T) => number | null | undefined
): number => {
  return items.reduce((total, item) => {
    const value = selector(item);
    return total + (typeof value === "number" ? value : 0);
  }, 0);
};

export const calculateFinanceTotals = (financeData: any) => {
  const totalReceiptsAmount = sumBy(
    financeData.receipts,
    (r: any) => r.amount
  );

  const totalReceiptsFunds = sumBy(
    financeData.receipts,
    (r: any) => r.funds
  );

  const totalPaymentsAmount = sumBy(
    financeData.payments,
    (p: any) => p.amount
  );

//   const totalBalanceAmount = sumBy(
//     financeData.balance,
//     (b: any) => b.amount
//   );

  const totalFundAllocationActual = sumBy(
    financeData.fundAllocation,
    (f: any) => f.actual
  );

  const totalFundAllocationAdjusted = sumBy(
    financeData.fundAllocation,
    (f: any) => f.adjusted
  );

  return {
    receipts: {
      amount: totalReceiptsAmount,
      funds: totalReceiptsFunds,
    },
    payments: {
      amount: totalPaymentsAmount,
    },
    // balance: {
    //   amount: totalBalanceAmount,
    // },
    fundAllocation: {
      actual: totalFundAllocationActual,
      adjusted: totalFundAllocationAdjusted,
    },
  };
};

type NullableNumber = number | null | undefined;

// const sumNullable = (values: NullableNumber[]): number =>
//   values.reduce((acc: number, val) => acc + (typeof val === "number" ? val : 0), 0);

const sumNullable = (
  values: (number | string | null | undefined)[]
): number =>
  values.reduce((acc: number, val) => {
    const num = typeof val === "string" ? Number(val) : typeof val === "number" ? val : 0;
    return acc + num;
  }, 0);

export const buildFinanceSummary = (financeData: any) => {
  // ---------------- RECEIPTS ----------------
  const receiptsTotal = sumNullable(
    financeData.receipts.map((r: any) => r.amount)
  );

  // ---------------- TITHE ----------------
  const totalTithePercentage = financeData.tithe.totalTithe.percentage;
  const generalTithePercentage = financeData.tithe.generalTithe.percentage;
  const icareTithePercentage = financeData.tithe.icareTithe.percentage;

  if (generalTithePercentage + icareTithePercentage !== 100) {
    throw new Error("Tithe breakdown must total 100%");
  }

  const titheAmount = (receiptsTotal * totalTithePercentage) / 100;

  const titheBreakdown = {
    general: (titheAmount * generalTithePercentage) / 100,
    icare: (titheAmount * icareTithePercentage) / 100,
  };

  const fundsAfterTithe = receiptsTotal - titheAmount;

  // ---------------- PAYMENTS ----------------
  const paymentsTotal = sumNullable(
    financeData.payments.map((p: any) => p.amount)
  );

  const excessAfterPayments = fundsAfterTithe - paymentsTotal;

  // ---------------- BALANCE ----------------
  const reserveForSavings =
    financeData.balance.ReserveForSavings?.amount ?? 0;

  const weeklyRefund =
    financeData.balance.WeeklyRefund?.amount ?? 0;

  const officeReserve =
    financeData.balance.OfficeMaintenanceReserve?.amount ?? 0;

  const netBalance = excessAfterPayments - reserveForSavings;

  const finalBalance =
    netBalance + weeklyRefund + officeReserve;

  // ---------------- FUND ALLOCATION ----------------
  const allocationPercentTotal = financeData.fundAllocation.reduce(
    (sum: number, a: any) => sum + a.portionPercent,
    0
  );

  if (allocationPercentTotal !== 100) {
    throw new Error(
      `Fund allocation must total 100%, got ${allocationPercentTotal}%`
    );
  }

  const fundAllocations = financeData.fundAllocation.map((allocation: any) => {
    const actual = (allocation.portionPercent / 100) * finalBalance;

    const adjusted =
      allocation.movement === "Savings"
        ? actual + reserveForSavings
        : actual;

    return {
      ...allocation,
      actual,
      adjusted,
    };
  });

  const fundAllocationTotals = {
    actual: sumNullable(fundAllocations.map((a: any) => a.actual)),
    adjusted: sumNullable(fundAllocations.map((a: any) => a.adjusted)),
  };

  return {
    receipts: {
      total: receiptsTotal,
    },
    tithe: {
      amount: titheAmount,
      breakdown: titheBreakdown,
      fundsAfterTithe,
    },
    payments: {
      total: paymentsTotal,
    },
    balance: {
      excessAfterPayments,
      reserveForSavings,
      netBalance,
      weeklyRefund,
      officeReserve,
      finalBalance,
    },
    fundAllocations,
    fundAllocationTotals,
  };
};