import type { RequisitionSimilarItemsResponse } from "../types/approvalWorkflow";
import type {
  RequisitionOverviewRow,
  RequisitionOverviewStep,
} from "@/utils/api/requisitions/interfaces";

import type { PillTone } from "../../MembershipManagement/components/membershipUi";
import { formatDay, formatDayTime } from "../../ChurchCommunication/ui/commUtils";

/** Pure helpers shared by the Requisition pages. No React in here. */

export type Row = RequisitionOverviewRow;
export type Step = RequisitionOverviewStep;

const DAY_MS = 864e5;

export const fmtD = (value?: string | null) => formatDay(value) || "—";
/** Calendar dates (needed-by) are stored as UTC midnight; read the day, not the instant. */
export const fmtDay = (value?: string | null) => (value ? formatDay(value.slice(0, 10)) || "—" : "—");

/** Last path segment of an upload URL, readable. */
export const fileNameOf = (url: string) => {
  const raw = url.split("?")[0].split("/").pop() || "attachment";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

/** Only http(s) links are rendered as links. */
export const isSafeUrl = (url: string) => /^https?:\/\//i.test(url.trim());
/** "15 Nov 2026, 6:00 PM" */
export const fmtDT = (value?: string | null) => {
  const time = formatDayTime(value).split(", ")[1];
  return time ? `${formatDay(value)}, ${time}` : "—";
};

export const daysBetween = (from: string | Date, to: string | Date) =>
  (new Date(to).getTime() - new Date(from).getTime()) / DAY_MS;

/** "5 hours", "1 day", "3 days" */
export const dur = (days: number) => {
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24));
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  const n = Math.round(days);
  return `${n} ${n === 1 ? "day" : "days"}`;
};

export const days1 = (days: number | null | undefined) =>
  days === null || days === undefined ? "—" : `${days.toFixed(1)} days`;

export const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

export const money = (value: number, currency = "GHS") =>
  `${currency} ${(Number(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Short money for tiles and chart labels: "GHS 12.4k". */
export const moneyS = (value: number, currency = "GHS") => {
  const n = Number(value) || 0;
  const text =
    n >= 1e5 ? `${Math.round(n / 1e3)}k` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}k` : Math.round(n).toLocaleString("en-US");
  return currency ? `${currency} ${text}` : text;
};

export const firstName = (name: string) =>
  name.replace(/^(Rev\.?|Pastor|Elder|Deacon|Deaconess|Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+/i, "").split(/\s+/)[0] || name;

export const titleOf = (row: Pick<Row, "items">) =>
  row.items.length
    ? `${row.items[0].name}${row.items.length > 1 ? ` and ${row.items.length - 1} more` : ""}`
    : "Untitled requisition";

export const sumOf = (rows: Row[]) => rows.reduce((total, row) => total + row.total_amount, 0);

/** Currency most rows use, for totals across a list. */
export const mainCurrency = (rows: Row[]) => {
  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    counts[row.currency] = (counts[row.currency] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "GHS";
};

/* -------------------------------------------------------------------------- */
/*                                 Step helpers                               */
/* -------------------------------------------------------------------------- */

export const pendingStep = (row: Row): Step | undefined => row.steps.find((step) => step.status === "PENDING");

/** When the current step started: submission or the previous step's decision. */
export const waitStart = (row: Row) => pendingStep(row)?.started_at ?? row.submitted_at ?? row.created_at;

export const waitDays = (row: Row, now: Date) => (row.status === "PENDING" ? daysBetween(waitStart(row), now) : 0);

export const canAct = (row: Row, me: number) => row.status === "PENDING" && pendingStep(row)?.approver.id === me;

/** A step later in the chain belongs to me and the requisition hasn't reached me yet. */
export const isComing = (row: Row, me: number) => {
  if (row.status !== "PENDING") return false;
  const current = pendingStep(row);
  return !!current && row.steps.some((step) => step.approver.id === me && step.order > current.order);
};

export const actedByMe = (row: Row, me: number) => row.steps.some((step) => step.approver.id === me && step.acted_at);

export const stepDays = (step: Step, now: Date) => {
  if (!step.started_at) return null;
  if (step.acted_at) return daysBetween(step.started_at, step.acted_at);
  return step.status === "PENDING" ? daysBetween(step.started_at, now) : null;
};

export const rejectedStep = (row: Row) => row.steps.find((step) => step.status === "REJECTED");

/** Requester can still change it: a draft, or submitted with no decision yet. */
export const requesterCanEdit = (row: Row, me: number) =>
  row.requester.id === me &&
  (row.status === "DRAFT" || (row.status === "PENDING" && !row.steps.some((step) => step.acted_at)));

/* -------------------------------------------------------------------------- */
/*                                 Status copy                                */
/* -------------------------------------------------------------------------- */

export const waitColor = (days: number, reply: number) =>
  days > reply ? "text-[#B91C1C]" : days >= reply - 1 ? "text-[#B45309]" : "text-[#6B7280]";

export const pillOf = (row: Row, me: number, now: Date, reply: number): { label: string; tone: PillTone } => {
  if (row.status === "DRAFT") return { label: "Draft", tone: "neutral" };
  if (row.status === "APPROVED") return { label: "Approved", tone: "success" };
  if (row.status === "REJECTED") return { label: "Rejected", tone: "danger" };
  const over = waitDays(row, now) > reply;
  if (canAct(row, me)) return { label: "Waiting for you", tone: over ? "danger" : "info" };
  return over ? { label: "Overdue", tone: "danger" } : { label: "Awaiting approval", tone: "warning" };
};

/** Second line under the status pill. */
export const subOf = (row: Row, me: number, now: Date, reply: number): { text: string; className: string } => {
  const muted = "text-[#6B7280]";
  if (row.status === "DRAFT") return { text: "Not submitted yet", className: muted };
  if (row.status === "APPROVED") {
    const took = row.submitted_at && row.decided_at ? ` · took ${dur(daysBetween(row.submitted_at, row.decided_at))}` : "";
    return { text: `Approved ${fmtD(row.decided_at)}${took}`, className: muted };
  }
  if (row.status === "REJECTED") {
    const step = rejectedStep(row);
    return { text: step ? `By ${step.approver.name} · ${step.label}` : "Rejected", className: muted };
  }
  const step = pendingStep(row);
  const days = waitDays(row, now);
  if (!step) return { text: `In approval · ${dur(days)}`, className: waitColor(days, reply) };
  const of = `Step ${step.order} of ${row.steps.length}`;
  return {
    text: canAct(row, me) ? `${of} · waiting ${dur(days)}` : `${of} · with ${step.approver.name} · ${dur(days)}`,
    className: waitColor(days, reply),
  };
};

/* -------------------------------------------------------------------------- */
/*                                Similar items                               */
/* -------------------------------------------------------------------------- */

export interface SimilarGroup {
  item: string;
  matches: { gid: string; who: string; date: string; quantity: number; status: string }[];
}

const STATUS_WORD: Record<string, string> = { APPROVED: "Approved", REJECTED: "Rejected", PENDING: "In approval" };

/** Same item names requested in other submitted requisitions within the lookback window. */
export const similarFromRows = (row: Row, rows: Row[], lookbackDays: number, now: Date): SimilarGroup[] => {
  const cutoff = now.getTime() - lookbackDays * DAY_MS;
  const out: SimilarGroup[] = [];
  row.items.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    const matches = rows.filter(
      (other) =>
        other.id !== row.id &&
        other.status !== "DRAFT" &&
        other.submitted_at &&
        new Date(other.submitted_at).getTime() >= cutoff &&
        other.items.some((x) => x.name.trim().toLowerCase() === key)
    );
    if (matches.length) {
      out.push({
        item: item.name,
        matches: matches.slice(0, 4).map((other) => ({
          gid: other.generated_id,
          who: `${other.requester.name}, ${other.department.name}`,
          date: fmtD(other.submitted_at),
          quantity: other.items.find((x) => x.name.trim().toLowerCase() === key)?.quantity ?? 0,
          status: STATUS_WORD[other.status] ?? other.status,
        })),
      });
    }
  });
  return out;
};

/** Turns the pre-approval endpoint into the same groups the list builds. */
export const similarFromApi = (response?: RequisitionSimilarItemsResponse | null): SimilarGroup[] =>
  (response?.matched_items ?? [])
    .filter((group) => group.matches?.length)
    .map((group) => ({
      item: group.current_item_name,
      matches: (group.matches ?? []).slice(0, 4).map((match) => ({
        gid: match.generated_id || `#${match.requisition_id}`,
        who: match.requester_name || "Unknown",
        date: fmtD(match.request_date),
        quantity: Number(match.quantity) || 0,
        status:
          match.status === "APPROVED"
            ? "Approved"
            : match.status === "REJECTED"
              ? "Rejected"
              : match.status === "Draft"
                ? "Draft"
                : "In approval",
      })),
    }));

/* -------------------------------------------------------------------------- */
/*                                     CSV                                    */
/* -------------------------------------------------------------------------- */

export const downloadCsv = (name: string, rows: (string | number | null | undefined)[][]) => {
  const body = rows
    .map((row) =>
      row
        .map((cell) => {
          // A leading = + - @ (or tab/CR) would run as a spreadsheet formula.
          const raw = String(cell ?? "");
          const text = typeof cell === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

export const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const addDaysKey = (day: string, n: number) => {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/** Encoded id used by notification deep links: /home/requests/{base64(id)}. */
export const encodeId = (id: number) => window.btoa(String(id));
export const decodeId = (value?: string | null): number | null => {
  if (!value) return null;
  const direct = Number(value);
  if (Number.isInteger(direct) && direct > 0) return direct;
  try {
    const decoded = Number(window.atob(value));
    return Number.isInteger(decoded) && decoded > 0 ? decoded : null;
  } catch {
    return null;
  }
};
