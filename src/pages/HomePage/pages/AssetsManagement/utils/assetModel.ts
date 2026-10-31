import type {
  AssetCategoryKey,
  AssetRow,
  AssetStatus,
  CountFix,
  CountResult,
  StockCheck,
  StockCheckItem,
} from "@/utils/api/assets/interfaces";

import type { PillTone } from "../../MembershipManagement/components/membershipUi";

/** Pure helpers shared by the Assets pages. No React in here. */

export { downloadCsv, todayKey, addDaysKey, money, moneyS, pct, plural } from "../../Requisitions/utils/requisitionModel";

const DAY_MS = 864e5;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CATEGORIES: { key: AssetCategoryKey; label: string }[] = [
  { key: "sound", label: "Sound" },
  { key: "music", label: "Musical instruments" },
  { key: "media", label: "Media and IT" },
  { key: "furniture", label: "Furniture" },
  { key: "appliance", label: "Appliances" },
  { key: "vehicle", label: "Vehicles" },
  { key: "other", label: "Other" },
];
export const categoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? "Other";

export const STATUS: Record<AssetStatus, { label: string; tone: PillTone; color: string }> = {
  ASSIGNED: { label: "Assigned", tone: "success", color: "rgb(var(--color-green-700))" },
  UNASSIGNED: { label: "In store", tone: "neutral", color: "rgb(var(--color-gray-400))" },
  NEEDS_REPAIR: { label: "Needs repair", tone: "warning", color: "#D97706" },
  OUT_OF_REPAIRS: { label: "Under repair", tone: "info", color: "rgb(var(--color-blue-700))" },
  NOT_FIXABLE: { label: "Beyond repair", tone: "danger", color: "#7F1D1D" },
  LOST_OR_STOLEN: { label: "Lost or stolen", tone: "danger", color: "rgb(var(--color-red-700))" },
};
export const STATUS_ORDER: AssetStatus[] = [
  "ASSIGNED",
  "UNASSIGNED",
  "NEEDS_REPAIR",
  "OUT_OF_REPAIRS",
  "NOT_FIXABLE",
  "LOST_OR_STOLEN",
];
export const OUT_OF_USE: AssetStatus[] = ["NEEDS_REPAIR", "OUT_OF_REPAIRS", "NOT_FIXABLE", "LOST_OR_STOLEN"];
export const isOut = (status: AssetStatus) => OUT_OF_USE.includes(status);

export const REQ_STATUS: Record<string, { label: string; tone: PillTone }> = {
  PENDING: { label: "Awaiting approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  DRAFT: { label: "Draft", tone: "neutral" },
};

/* --------------------------------- Dates ---------------------------------- */

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Calendar day (YYYY-MM-DD) of a stored value, in the viewer's time zone.
 * Date-only fields (bought, assigned, due, effective dates) are stored as UTC
 * midnight and mean that calendar day everywhere, so they're read as-is.
 * Real timestamps (when something was recorded) are converted to the local day.
 */
export const dayOf = (value?: string | null) => {
  if (!value) return "";
  if (value.length === 10 || /T00:00:00(\.000)?Z$/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const asDate = (day: string) => new Date(`${day}T00:00:00`);
export const daysSince = (value: string | null | undefined, today: string) =>
  value ? (asDate(today).getTime() - asDate(dayOf(value)).getTime()) / DAY_MS : 0;
export const fmtD = (value?: string | null) => {
  const day = dayOf(value);
  if (!day) return "—";
  const d = asDate(day);
  return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
export const fmtS = (value?: string | null) => {
  const day = dayOf(value);
  if (!day) return "—";
  const d = asDate(day);
  return `${MON[d.getMonth()]} ${d.getDate()}`;
};
/** "today", "5 days", "3 months", "1.4 years" */
export const ago = (value: string | null | undefined, today: string) => {
  const d = Math.round(daysSince(value, today));
  if (d < 1) return "today";
  if (d < 45) return `${d} ${d === 1 ? "day" : "days"}`;
  if (d < 365) return `${Math.round(d / 30)} months`;
  return `${(d / 365).toFixed(1)} years`;
};

export const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();

export const valueOf = (list: AssetRow[]) => list.reduce((total, asset) => total + asset.price, 0);

/** Second line under the status pill. */
export const subOf = (asset: AssetRow, today: string, staleDays: number): { text: string; color: string } => {
  const d = daysSince(asset.status_since, today);
  switch (asset.status) {
    case "ASSIGNED":
      return { text: `Since ${fmtD(asset.date_assigned || asset.status_since)}`, color: "rgb(var(--color-gray-500))" };
    case "UNASSIGNED":
      return { text: `In store for ${ago(asset.status_since, today)}`, color: d > 90 ? "rgb(var(--color-amber-700))" : "rgb(var(--color-gray-500))" };
    case "NEEDS_REPAIR": {
      const r = asset.repair_requisition;
      if (!r) return { text: "No repair requisition yet", color: "rgb(var(--color-amber-700))" };
      return {
        text: `${r.generated_id} · ${REQ_STATUS[r.status].label.toLowerCase()}`,
        color: r.status === "REJECTED" ? "rgb(var(--color-red-700))" : r.status === "APPROVED" ? "rgb(var(--color-green-700))" : "rgb(var(--color-gray-500))",
      };
    }
    case "OUT_OF_REPAIRS":
      return { text: `For ${ago(asset.status_since, today)}`, color: d > staleDays ? "rgb(var(--color-red-700))" : "rgb(var(--color-amber-700))" };
    default:
      return { text: `Since ${fmtD(asset.status_since)}`, color: "rgb(var(--color-gray-500))" };
  }
};

/* ------------------------------ Stock checks ------------------------------ */

export const STORE_KEY = 0;

export const RESULT: Record<CountResult, { label: string; tone: PillTone }> = {
  found: { label: "Found", tone: "success" },
  elsewhere: { label: "Found elsewhere", tone: "info" },
  damaged: { label: "Found damaged", tone: "warning" },
  missing: { label: "Not found", tone: "danger" },
  atrepair: { label: "Confirmed with repairer", tone: "success" },
  back: { label: "Back from repair", tone: "info" },
};

export const FIX_OPTIONS: Record<string, [CountFix, string][]> = {
  elsewhere: [["move", "Update register"], ["return", "Send it back"]],
  damaged: [["needs", "Needs repair"], ["beyond", "Beyond repair"], ["keep", "No change"]],
  back: [["working", "Back in use"], ["needs", "Still needs repair"], ["keep", "No change"]],
  missing: [["lost", "Mark lost or stolen"], ["keep", "Check again next time"]],
  extra: [["add", "Add to register"], ["ignore", "Ignore"]],
};
export const FIX_TEXT: Record<CountFix, string> = {
  move: "Register updated to where it was found",
  return: "Sent back; register unchanged",
  repair: "Marked under repair",
  needs: "Marked needs repair",
  working: "Marked back in use",
  beyond: "Marked beyond repair",
  keep: "No change",
  lost: "Marked lost or stolen",
  add: "Added to the register",
  ignore: "Ignored",
};

export const isDone = (item: Pick<StockCheckItem, "result" | "found_key">) =>
  Boolean(item.result) && !(item.result === "elsewhere" && item.found_key === null);

export const checkStats = (check: StockCheck) => {
  const done = check.items.filter(isDone);
  const by = (result: CountResult) => done.filter((item) => item.result === result);
  return {
    expected: check.items.length,
    done: done.length,
    found: done.filter((item) => item.result === "found" || item.result === "atrepair"),
    elsewhere: by("elsewhere"),
    damaged: by("damaged"),
    back: by("back"),
    missing: by("missing"),
    extras: check.extras,
  };
};
export type CheckStats = ReturnType<typeof checkStats>;

export const differenceCount = (stats: CheckStats) =>
  stats.elsewhere.length + stats.damaged.length + stats.back.length + stats.missing.length + stats.extras.length;

export const dueInfo = (check: StockCheck, today: string) => {
  const left = Math.round(-daysSince(check.due_date, today));
  return left < 0
    ? { text: `Overdue by ${-left} days (due ${fmtD(check.due_date)})`, color: "rgb(var(--color-red-700))", overdue: true, left }
    : {
        text: `Due ${fmtD(check.due_date)} · ${left} ${left === 1 ? "day" : "days"} left`,
        color: left <= 3 ? "rgb(var(--color-amber-700))" : "rgb(var(--color-gray-600))",
        overdue: false,
        left,
      };
};

/** Quarter name for a new check: "Q4 2026 stock check". */
export const defaultCheckName = (now = new Date()) =>
  `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()} stock check`;
