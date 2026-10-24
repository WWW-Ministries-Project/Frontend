import type {
  BarRow,
  WorkspaceKpi,
  WorkspacePill,
  WorkspaceTone,
} from "@/utils/api/workspaces/interfaces";

/* Chart colours — theme tokens, so they follow light/dark mode. */
export const NV = "rgb(var(--color-primary))";
export const BZ = "rgb(var(--color-secondary))";
export const SF = "rgb(var(--color-primary) / 0.3)";
export const GN = "rgb(var(--color-green-700))";
export const AM = "rgb(var(--color-amber-700))";
export const RD = "rgb(var(--color-red-700))";
export const MUTED = "rgb(var(--color-gray-600))";
export const SERIES = [NV, BZ, SF, "rgb(var(--color-blue-700))", GN, AM];

export const nf = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toLocaleString("en-GB", { maximumFractionDigits: 1 });

export const ghs = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  return `GH₵ ${
    Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(2)}m` : Math.round(n).toLocaleString("en-GB")
  }`;
};

export const pct = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${Math.round(value)}%`;

export const kpiValue = (kpi: WorkspaceKpi) => {
  const v = kpi.value;
  if (v === null || v === undefined) return "—";
  switch (kpi.format) {
    case "ghs":
      return ghs(v);
    case "pct":
      return pct(v);
    case "signed":
      return `${v >= 0 ? "+" : "−"}${nf(Math.abs(Math.round(v)))}`;
    case "raw":
      return String(v);
    default:
      return nf(Math.round(v));
  }
};

/** "▲ 4.1%" coloured by whether the move is good. */
export const kpiDelta = (kpi: Pick<WorkspaceKpi, "delta_pct" | "good" | "points">) => {
  const d = kpi.delta_pct;
  if (d === null || d === undefined) return null;
  const up = d >= 0;
  const arrow = d === 0 ? "■" : up ? "▲" : "▼";
  const text = `${arrow} ${nf(Math.abs(d))}${kpi.points ? " pts" : "%"}`;
  const color = !kpi.good || d === 0 ? MUTED : (kpi.good === "up") === up ? GN : RD;
  return { text, color };
};

export const toneText: Record<WorkspaceTone, string> = {
  success: GN,
  warning: AM,
  danger: RD,
  info: "rgb(var(--color-blue-700))",
  neutral: MUTED,
};

export const initials = (name: string) => {
  const parts = String(name || "")
    .replace(/^(Rev\.?|Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Elder|Deaconess|Pastor)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};

export const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const shortDate = (value: string | null | undefined) => {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : value || "—";
};

export const longDate = (date = new Date()) =>
  date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Date block for agenda rows: "TODAY / 10:00" or "FRI / 23". */
export const agendaParts = (value: string) => {
  const date = parseDate(value);
  if (!date) return { top: "", main: value };
  const hasTime = /T\d{2}:\d{2}/.test(value) && !/T00:00(:00)?(\.000)?Z?$/.test(value);
  if (hasTime && sameDay(date, new Date())) {
    return {
      top: "TODAY",
      main: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  }
  return {
    top: date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
    main: String(date.getDate()),
  };
};

export const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/** Pill for a free-text workflow status from the API. */
export const statusPill = (status: string | null | undefined): WorkspacePill => {
  const s = String(status || "").toLowerCase();
  if (s === "missing") return { tone: "danger", label: "No record" };
  if (s === "not_started") return { tone: "neutral", label: "Not started" };
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—";
  if (/approv|complete|paid|filled|done/.test(s)) return { tone: "success", label };
  if (/return|reject|overdue|miss|declin/.test(s)) return { tone: "danger", label };
  if (/pending|submit|await|review/.test(s))
    return { tone: "warning", label };
  return { tone: "neutral", label };
};

export const plural = (n: number, word: string) => `${nf(n)} ${word}${n === 1 ? "" : "s"}`;

export interface HBarSpec {
  label: string;
  value: number;
  display?: string;
  max?: number | null;
  sub?: string | null;
  color?: string;
}


/** BarRow from the API → bar spec; rows with `max` show a share. */
export const barRows = (rows: BarRow[], opts: { money?: boolean; share?: boolean } = {}): HBarSpec[] =>
  rows.map((row) => ({
    label: row.label,
    value: Number(row.value) || 0,
    max: row.max ?? null,
    sub: row.sub ?? null,
    display:
      opts.share && row.max
        ? `${Math.round(((Number(row.value) || 0) / row.max) * 100)}%`
        : undefined,
  }));


export const ringColor = (value: number) => (value >= 75 ? GN : value >= 50 ? NV : AM);

