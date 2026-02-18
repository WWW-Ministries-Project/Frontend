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
    financeData?.receipts || [],
    (r: any) => r.amount
  );

  const totalReceiptsFunds = sumBy(
    financeData?.receipts || [],
    (r: any) => r.funds
  );

  const totalPaymentsAmount = sumBy(
    financeData?.payments || [],
    (p: any) => p.amount
  );

//   const totalBalanceAmount = sumBy(
//     financeData.balance,
//     (b: any) => b.amount
//   );

  const totalFundAllocationActual = sumBy(
    financeData?.fundAllocation || [],
    (f: any) => f.actual
  );

  const totalFundAllocationAdjusted = sumBy(
    financeData?.fundAllocation || [],
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

const sumNullable = (
  values: (number | string | null | undefined)[]
): number =>
  values.reduce((acc: number, val) => {
    const parsed =
      typeof val === "string" ? Number(val) : typeof val === "number" ? val : 0;
    const num = Number.isFinite(parsed) ? parsed : 0;
    return acc + num;
  }, 0);

const toPercentageRatio = (value: number | string | null | undefined): number => {
  const numeric = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.abs(numeric) <= 1 ? numeric : numeric / 100;
};

const toNumberValue = (value: number | string | null | undefined): number => {
  const numeric = typeof value === "string" ? Number(value) : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const buildFinanceSummary = (financeData: any) => {
  // ---------------- RECEIPTS ----------------
  const receiptsTotal = sumNullable(
    (financeData.receipts || []).map((r: any) => r.amount)
  );

  // ---------------- TITHE ----------------
  const totalTithePercentage =
    Number(financeData?.tithe?.totalTithe?.percentage) || 0;
  const configuredBreakdown = Array.isArray(financeData?.tithe?.breakdown)
    ? financeData.tithe.breakdown
    : [];
  const legacyBreakdown = [
    financeData?.tithe?.generalTithe
      ? {
          item: financeData.tithe.generalTithe.label || "General Tithe",
          percentage: Number(financeData.tithe.generalTithe.percentage) || 0,
        }
      : null,
    financeData?.tithe?.icareTithe
      ? {
          item: financeData.tithe.icareTithe.label || "iCare Tithe",
          percentage: Number(financeData.tithe.icareTithe.percentage) || 0,
        }
      : null,
  ].filter(Boolean) as Array<{ item: string; percentage: number }>;
  const titheBreakdownSource =
    configuredBreakdown.length > 0 ? configuredBreakdown : legacyBreakdown;
  const titheAmount = receiptsTotal * toPercentageRatio(totalTithePercentage);

  const titheBreakdown = titheBreakdownSource.map((entry: any) => {
    const percentage = Number(entry.percentage) || 0;
    const amount = titheAmount * toPercentageRatio(percentage);

    return {
      item: entry.item || "Tithe",
      percentage,
      amount,
    };
  });

  const fundsAfterTithe = receiptsTotal - titheAmount;

  // ---------------- PAYMENTS ----------------
  const paymentsTotal = sumNullable(
    (financeData.payments || []).map((p: any) => p.amount)
  );

  const excessAfterPayments = fundsAfterTithe - paymentsTotal;

  // ---------------- BALANCE ----------------
  const reserveForSavings =
    toNumberValue(financeData?.balance?.ReserveForSavings?.amount);

  const weeklyRefund =
    toNumberValue(financeData?.balance?.WeeklyRefund?.amount);

  const officeReserve =
    toNumberValue(financeData?.balance?.OfficeMaintenanceReserve?.amount);

  const netBalance = excessAfterPayments - reserveForSavings;

  const finalBalance =
    netBalance + weeklyRefund + officeReserve;

  // ---------------- FUND ALLOCATION ----------------
  const fundAllocationSource = Array.isArray(financeData?.fundAllocation)
    ? financeData.fundAllocation
    : Array.isArray(financeData?.fundsAllocation)
    ? financeData.fundsAllocation
    : [];

  const fundAllocations = fundAllocationSource.map((allocation: any) => {
    const portionPercent = Number(allocation.portionPercent) || 0;
    const actual = toPercentageRatio(portionPercent) * finalBalance;

    const adjusted =
      String(allocation.movement || "").toLowerCase().includes("savings")
        ? actual + reserveForSavings
        : actual;

    return {
      ...allocation,
      portionPercent,
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
