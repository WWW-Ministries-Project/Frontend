

export const financeData = {
  metaData: {
    month: "January",
    year: 2023,
    week: "Week 1",
    from: "2023-01-01",
    to: "2023-01-07",
    createdBy: "John Doe",
    createdDate: "2023-01-08",
    updatedBy: "Jane Smith",
    updatedDate: "2023-01-09",
  },
  receipts: [
    {
      item: "Tree of Life Service – Offering & Seed",
      amount: 1000,
      funds: null,
    },
    {
      item: "Diamond Glory",
      amount: 500,
      funds: null,
    },
    {
      item: "Global Prayer Place – Thursday",
      amount: 2000,
      funds: null,
    },
    {
      item: "Global Prayer Place – Friday",
      amount: 3000,
      funds: null,
    },
    {
      item: "Fruit Bearing Service",
      amount: 1000,
      funds: null,
    },
    {
      item: "Seed on Altar",
      amount: 400,
      funds: null,
    },
    {
      item: "Pledges Redeemed",
      amount: null,
      funds: null,
    },
  ],

  tithe: {
    totalTithe:{
      label: "Tithe",
      percentage: 10,
      amount: 0,
      funds: 0,
    },
    generalTithe:{
      label: "Tithe Allocation",
      percentage: 60,
      amount: 0,
      funds: null,
    },
    icareTithe:{
      label: "Tithe Allocation",
      percentage: 40,
      amount: 0,
      funds: null,
    },
},

  payments: [
    {
      item: "Fuel for genset",
      amount: 5000,
      funds: null,
    },
    {
      item: "Feeding setup team",
      amount: 2000,
      funds: null,
    },
    {
      item: "Transport - bus",
      amount: null,
      funds: null,
    },
    {
      item: "Maintenance",
      amount: null,
      funds: null,
    },
    {
      item: "Dollar Redeemed",
      amount: null,
      funds: null,
    },
  ],

  balance: {
    ExcessOfReceiptsOverPayments: {
      item: "Excess of Receipts over payments for the program",
      amount: 0,
    },
    ReserveForSavings:{
      item:
        "Reserved for Savings (GPP and sacrifice less expenses and Tithes)",
      amount: 50,
    },
    BalanceAmount: {
      item: "BALANCE",
      amount: 0,
    },
    WeeklyRefund: {
      item: "Weekly refund-BAMAH 3 7 7",
      amount: 100,
    },
    OfficeMaintenanceReserve: {
      item: "Reserved for office maintenance",
      amount: 200,
    },
  },

  fundAllocation: [
    {
      movement: "Savings",
      portionPercent: 30,
      actual: 0,
      adjusted: 0,
    },
    {
      movement: "Operations",
      portionPercent: 28,
      actual: null,
      adjusted: null,
    },
    {
      movement: "Project",
      portionPercent: 15,
      actual: null,
      adjusted: null,
    },
    {
      movement: "Farming Project",
      portionPercent: 10,
      actual: null,
      adjusted: null,
    },
    {
      movement: "Giving",
      portionPercent: 7,
      actual: null,
      adjusted: null,
    },
    {
      movement: "Support tithes account",
      portionPercent: 10,
      actual: null,
      adjusted: null,
    },
  ],
};