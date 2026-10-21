import { Delta, KpiFormat, PillSpec, ReportStatus } from "./reportTypes";

export const nf = (n: number | null | undefined) =>
  Number(n || 0).toLocaleString("en-GB", { maximumFractionDigits: 1 });

export const ghs = (n: number | null | undefined) => {
  const value = Number(n || 0);
  return (
    "GH₵ " +
    (Math.abs(value) >= 1e6
      ? (value / 1e6).toFixed(2) + "m"
      : Math.round(value).toLocaleString("en-GB"))
  );
};

export const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

export const formatValue = (value: number, format: KpiFormat) => {
  switch (format) {
    case "ghs":
      return ghs(value);
    case "pct":
      return `${Math.round(value * 10) / 10}%`;
    case "days":
      return `${value.toFixed(1)} days`;
    case "dec":
      return value.toFixed(1);
    case "signed":
      return `${value >= 0 ? "+" : "−"}${nf(Math.abs(Math.round(value)))}`;
    default:
      return nf(Math.round(value));
  }
};

/** Builds a delta from current and comparison values; null when no baseline. */
export const deltaOf = (
  current: number,
  previous: number | null | undefined,
  points?: boolean
): Delta | null => {
  if (previous === null || previous === undefined || Number.isNaN(previous)) return null;
  if (points) return { pct: Math.round((current - previous) * 10) / 10, unit: "pts" };
  if (previous === 0) return current === 0 ? { pct: 0, abs: 0 } : null;
  return {
    pct: Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10,
    abs: current - previous,
  };
};

export const formatDelta = (delta: Delta, format: KpiFormat) => {
  const arrow = delta.pct === 0 ? "■" : delta.pct > 0 ? "▲" : "▼";
  if (delta.unit === "pts") return `${arrow} ${Math.abs(delta.pct)} pts`;
  let abs = "";
  if (delta.abs !== null && delta.abs !== undefined) {
    const sign = delta.abs >= 0 ? "+" : "−";
    const magnitude = Math.abs(delta.abs);
    const shown =
      format === "ghs"
        ? ghs(magnitude)
        : format === "days" || format === "dec"
          ? magnitude.toFixed(1)
          : nf(Math.round(magnitude));
    abs = ` (${sign}${shown})`;
  }
  return `${arrow} ${Math.abs(delta.pct)}%${abs}`;
};

export const sparkPoints = (values: number[]) => {
  if (values.length < 2) return "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const range = hi - lo || 1;
  return values
    .map(
      (x, i) =>
        `${(2 + (i / (values.length - 1)) * 68).toFixed(1)},${(25 - ((x - lo) / range) * 22).toFixed(1)}`
    )
    .join(" ");
};

export const statusPill = (status: string | null | undefined): PillSpec => {
  switch (status) {
    case "Approved":
      return { tone: "success", label: "Approved" };
    case "Submitted":
      return { tone: "info", label: "Submitted" };
    case "Returned":
      return { tone: "danger", label: "Returned" };
    case "Pending approval":
      return { tone: "warning", label: "Pending approval" };
    case "Overdue":
      return { tone: "danger", label: "Overdue" };
    default:
      return { tone: "neutral", label: "Draft" };
  }
};

export const healthPill = (health: "ok" | "watch" | "act"): PillSpec =>
  health === "ok"
    ? { tone: "success", label: "✓ Healthy" }
    : health === "watch"
      ? { tone: "warning", label: "● Watch" }
      : { tone: "danger", label: "▲ Act now" };

export const isEditableStatus = (status: ReportStatus) =>
  status === "Draft" || status === "Returned";

const DATE_FMT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

export const fmtDate = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value.length === 10 ? `${value}T00:00:00` : value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", DATE_FMT);
};

export const fmtDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleDateString("en-GB", DATE_FMT)}, ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
