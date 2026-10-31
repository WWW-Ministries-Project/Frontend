import type { PillTone } from "../../MembershipManagement/components/membershipUi";
import type {
  FinanceApprovalStatus,
  FinanceConfigLine,
  FinanceData,
  FinancialRecord,
  GivingContributionStatus,
} from "@/utils/api/finance/interface";

import { buildFinanceSummary } from "./helperFunctions";

/**
 * Pure helpers shared by the Finance pages: dates and weeks, money formatting,
 * the weekly-record model and its arithmetic, and status pills.
 */

/* --------------------------------- dates -------------------------------- */

export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONF = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD in local time. */
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayKey = () => isoDay(new Date());

/** A bare day is read as local midnight; a timestamp as the viewer's local day. */
export const parseDay = (value?: string | null): Date | null => {
  if (!value) return null;
  const s = String(value);
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** The viewer's local calendar day for any stored date or timestamp. */
export const dayOf = (value?: string | null) => {
  const d = parseDay(value);
  return d ? isoDay(d) : "";
};

export const addDays = (day: string, n: number) => {
  const d = parseDay(day) ?? new Date();
  d.setDate(d.getDate() + n);
  return isoDay(d);
};

export const daysBetween = (a: string, b: string) => {
  const x = parseDay(a);
  const y = parseDay(b);
  if (!x || !y) return 0;
  return Math.round((y.getTime() - x.getTime()) / 864e5);
};

/** "Oct 19, 2026" */
export const fmtD = (value?: string | null) => {
  const d = parseDay(value);
  return d ? `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : "—";
};

/** "Oct 19" */
export const fmtS = (value?: string | null) => {
  const d = parseDay(value);
  return d ? `${MON[d.getMonth()]} ${d.getDate()}` : "—";
};

/** "14:05" in the viewer's time. */
export const fmtTime = (value?: string | null) => {
  const d = parseDay(value);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
};

/** "Oct 6–12, 2026" or "Sep 29 – Oct 5, 2026" */
export const rangeTxt = (from: string, to: string) => {
  const a = parseDay(from);
  const b = parseDay(to);
  if (!a || !b) return "—";
  const sameMonth = a.getMonth() === b.getMonth();
  return `${fmtS(from)}${sameMonth ? `–${b.getDate()}` : ` – ${fmtS(to)}`}, ${b.getFullYear()}`;
};

export interface WeekRange {
  label: string;
  from: string;
  to: string;
}

/** Monday–Sunday weeks of a month, clipped to the month. `month` is 0-based. */
export const weeksIn = (year: number, month: number): WeekRange[] => {
  const out: WeekRange[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = new Date(first);
  start.setDate(start.getDate() + (start.getDay() === 0 ? -6 : 1 - start.getDay()));
  let i = 1;
  while (start <= last) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    out.push({
      label: `Week ${i}`,
      from: isoDay(start < first ? first : start),
      to: isoDay(end > last ? last : end),
    });
    i += 1;
    start.setDate(start.getDate() + 7);
  }
  return out;
};

/** The week (of its month) that contains `day`. */
export const weekOf = (day: string): { year: number; month: number; week: WeekRange } => {
  const d = parseDay(day) ?? new Date();
  const weeks = weeksIn(d.getFullYear(), d.getMonth());
  const key = isoDay(d);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    week: weeks.find((w) => w.from <= key && w.to >= key) ?? weeks[0],
  };
};

/* --------------------------------- money -------------------------------- */

export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fixed = (n: number) =>
  Math.abs(num(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "GHS 1,234.50", "−GHS 20.00" */
export const money = (n: number) => `${n < 0 ? "−" : ""}GHS ${fixed(n)}`;

/** "1,234.50" without currency, for table cells. */
export const amt = (n: number) => `${n < 0 ? "−" : ""}${fixed(n)}`;

/** Short money for KPI tiles: "GHS 12.4k", "GHS 1.20M". */
export const moneyS = (n: number) => {
  const a = Math.abs(num(n));
  const body =
    a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e4 ? `${(a / 1e3).toFixed(1)}k` : Math.round(a).toLocaleString("en-US");
  return `${n < 0 ? "−" : ""}GHS ${body}`;
};

export const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "0%");

/** Minor units (pesewas) to major units. */
export const fromMinor = (n: number | null | undefined) => (n === null || n === undefined ? null : n / 100);

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

/* ---------------------------------- CSV --------------------------------- */

export const downloadCsv = (name: string, rows: (string | number | null | undefined)[][]) => {
  const body = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/* --------------------------------- pills -------------------------------- */

export interface PillSpec {
  label: string;
  tone: PillTone;
}

export const RECORD_STATUS: Record<FinanceApprovalStatus, PillSpec> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
};

export const CONTRIB_STATUS: Record<GivingContributionStatus, PillSpec> = {
  success: { label: "Successful", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  abandoned: { label: "Abandoned", tone: "neutral" },
};

export const contribPill = (status: string): PillSpec =>
  CONTRIB_STATUS[status as GivingContributionStatus] ?? { label: status || "—", tone: "neutral" };

export const channelLabel = (c?: string | null) =>
  ({ mobile_money: "Mobile money", card: "Card", bank: "Bank", bank_transfer: "Bank transfer", ussd: "USSD" } as Record<string, string>)[
    String(c ?? "")
  ] ?? (c ? c.replace(/_/g, " ") : "—");

/* ---------------------------- weekly records ---------------------------- */

/** Receipt lines that fill in from other modules, by name. */
export type AutoKind = "pledges" | "giving";

export const autoKind = (item: string): AutoKind | null => {
  const s = item.toLowerCase();
  if (/pledge/.test(s) && /redeem|redemption/.test(s)) return "pledges";
  if (/online giving|paystack/.test(s)) return "giving";
  return null;
};

export const AUTO_TAG: Record<AutoKind, string> = { pledges: "From Pledges", giving: "From Giving" };

export const BALANCE_LABELS = {
  excess: "Excess of receipts over payments for the program",
  reserve: "Reserved for savings (GPP and sacrifice less expenses and tithes)",
  balance: "BALANCE",
  refund: "Weekly refund – BAMAH 3 7 7",
  office: "Reserved for office maintenance",
} as const;

export interface RecordTotals {
  R: number;
  T: number;
  tb: { item: string; percentage: number; amount: number }[];
  F: number;
  P: number;
  E: number;
  reserve: number;
  net: number;
  refund: number;
  office: number;
  fin: number;
  al: { movement: string; portion: number; actual: number; adjusted: number }[];
}

/** Totals for a record, using the same arithmetic as the exports. */
export const calc = (data: FinanceData): RecordTotals => {
  const s = buildFinanceSummary(data);
  return {
    R: s.receipts.total,
    T: s.tithe.amount,
    tb: s.tithe.breakdown,
    F: s.tithe.fundsAfterTithe,
    P: s.payments.total,
    E: s.balance.excessAfterPayments,
    reserve: s.balance.reserveForSavings,
    net: s.balance.netBalance,
    refund: s.balance.weeklyRefund,
    office: s.balance.officeReserve,
    fin: s.balance.finalBalance,
    al: s.fundAllocations.map((a: { movement: string; portionPercent: number; actual: number; adjusted: number }) => ({
      movement: a.movement,
      portion: a.portionPercent <= 1 && a.portionPercent > 0 ? a.portionPercent * 100 : a.portionPercent,
      actual: a.actual,
      adjusted: a.adjusted,
    })),
  };
};

/** Percent as entered (10) from either 10 or a 0.1 ratio. */
export const asPercent = (v: unknown) => {
  const n = num(v);
  return Math.abs(n) <= 1 && n !== 0 ? Math.round(n * 10000) / 100 : n;
};

export interface WeekRecord {
  id: string;
  status: FinanceApprovalStatus;
  year: number;
  /** 0-based */
  month: number;
  week: string;
  from: string;
  to: string;
  data: FinanceData;
  raw: FinancialRecord;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
  isEditable: boolean;
  totals: RecordTotals;
}

const monthIndex = (name: unknown, fallbackDay: string) => {
  const i = MONF.findIndex((m) => m.toLowerCase() === String(name ?? "").toLowerCase());
  if (i >= 0) return i;
  const d = parseDay(fallbackDay);
  return d ? d.getMonth() : new Date().getMonth();
};

/** A record the user prepared or submitted. The API never lets them approve it. */
export const isOwnRecord = (r: WeekRecord, userId: number) =>
  Boolean(userId) &&
  (Number(r.raw.createdByUserId) === userId || Number(r.raw.submittedByUserId) === userId);

export const toWeekRecord = (raw: FinancialRecord): WeekRecord => {
  const data = (raw.payload || {}) as FinanceData;
  const meta = (data.metaData || {}) as NonNullable<FinanceData["metaData"]>;
  const from = dayOf(meta.from) || dayOf(raw.periodDate ?? "") || dayOf(raw.createdAt);
  const to = dayOf(meta.to) || from;
  const year = num(meta.year) || parseDay(from)?.getFullYear() || new Date().getFullYear();
  const createdOn = meta.createdDate || raw.createdAt || "";
  const updatedOn = meta.updatedDate || raw.updatedAt || createdOn;
  return {
    id: String(raw.id),
    status: (raw.status || "DRAFT") as FinanceApprovalStatus,
    year,
    month: monthIndex(meta.month, from),
    week: meta.week || "Week",
    from,
    to,
    data,
    raw,
    createdBy: meta.createdBy || "—",
    createdOn,
    updatedBy: meta.updatedBy || meta.createdBy || "—",
    updatedOn,
    isEditable: raw.isEditable !== false,
    totals: calc(data),
  };
};

export const recordTitle = (r: { week: string; from: string; to: string }) => `${r.week} · ${rangeTxt(r.from, r.to)}`;

export interface FinanceConfigState {
  receipts: FinanceConfigLine[];
  payments: FinanceConfigLine[];
  tithe: FinanceConfigLine[];
  alloc: FinanceConfigLine[];
  rate: number;
}

/** A new weekly record laid out from configuration, with auto lines filled in. */
export const blankRecord = (
  cfg: FinanceConfigState,
  year: number,
  month: number,
  week: WeekRange,
  auto?: Partial<Record<AutoKind, number>>
): FinanceData => ({
  metaData: {
    periodDate: week.from,
    month: MONF[month],
    year,
    week: week.label,
    from: week.from,
    to: week.to,
    createdBy: null,
    createdDate: null,
    updatedBy: null,
    updatedDate: null,
  },
  receipts: cfg.receipts.map((c) => {
    const kind = autoKind(c.name);
    return { item: c.name, configId: c.id, amount: kind && auto?.[kind] !== undefined ? auto[kind]! : null };
  }),
  tithe: {
    totalTithe: { percentage: cfg.rate, label: "Tithe" },
    breakdown: cfg.tithe.map((c) => ({ item: c.name, percentage: asPercent(c.percentage), configId: c.id })),
  },
  payments: cfg.payments.map((c) => ({ item: c.name, configId: c.id, amount: null })),
  balance: {
    ExcessOfReceiptsOverPayments: { item: BALANCE_LABELS.excess, amount: 0 },
    ReserveForSavings: { item: BALANCE_LABELS.reserve, amount: "" },
    BalanceAmount: { item: BALANCE_LABELS.balance, amount: 0 },
    WeeklyRefund: { item: BALANCE_LABELS.refund, amount: "" },
    OfficeMaintenanceReserve: { item: BALANCE_LABELS.office, amount: "" },
  },
  fundAllocation: cfg.alloc.map((c) => ({
    movement: c.name,
    portionPercent: asPercent(c.percentage),
    actual: null,
    adjusted: null,
    configId: c.id,
  })),
});

/** Copies the calculated figures into the payload the server stores. */
export const withComputedTotals = (data: FinanceData): FinanceData => {
  const t = calc(data);
  return {
    ...data,
    tithe: {
      totalTithe: { ...data.tithe.totalTithe, amount: t.T, funds: t.F },
      breakdown: data.tithe.breakdown.map((b, i) => ({ ...b, amount: t.tb[i]?.amount ?? 0 })),
    },
    balance: {
      ...data.balance,
      ExcessOfReceiptsOverPayments: { ...data.balance.ExcessOfReceiptsOverPayments, amount: t.E },
      BalanceAmount: { ...data.balance.BalanceAmount, amount: t.net },
    },
    fundAllocation: data.fundAllocation.map((a, i) => ({
      ...a,
      actual: t.al[i]?.actual ?? 0,
      adjusted: t.al[i]?.adjusted ?? 0,
    })),
  };
};

/** Sum of a list's percentages. */
export const sumPct = (lines: { percentage?: number | null }[]) =>
  Math.round(lines.reduce((a, l) => a + asPercent(l.percentage), 0) * 100) / 100;
