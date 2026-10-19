export const BAR_PRIMARY = "#080D2D";
export const BAR_SUCCESS = "#15803D";
export const BAR_WARNING = "#B45309";

export interface BarItem {
  label: string;
  value: string;
  /** 0–100 */
  width: number;
  color: string;
}

export interface ColumnItem {
  label: string;
  value: number;
  /** 0–100 */
  height: number;
  tip: string;
}

export interface FollowUpItem {
  key: string;
  label: string;
  sub: string;
  onClick: () => void;
}

/* ------------------------------ builders ------------------------------ */

const scaled = (value: number, max: number) =>
  value ? Math.max(4, Math.round((value * 100) / Math.max(1, max))) : 0;

/**
 * entries: [label, value, extra]
 * - extra undefined → "value · pct% of total" (when total > 0)
 * - extra false → value only
 * - extra string → "value · extra"
 */
export const buildBars = (
  entries: [string, number, (string | false)?][],
  total: number,
  color: string = BAR_PRIMARY
): BarItem[] => {
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  return entries.map(([label, value, extra]) => {
    let text = String(value);
    if (typeof extra === "string") text += ` · ${extra}`;
    else if (extra === undefined && total) {
      text += ` · ${Math.round((value * 100) / total)}%`;
    }
    return { label, value: text, width: scaled(value, max), color };
  });
};

/** Funnel: first step plain, later steps show % of first; last step green. */
export const buildFunnel = (entries: [string, number][]): BarItem[] => {
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  const first = entries[0]?.[1] ?? 0;
  return entries.map(([label, value], index) => ({
    label,
    value:
      index && first ? `${value} · ${Math.round((value * 100) / first)}%` : String(value),
    width: scaled(value, max),
    color: index === entries.length - 1 ? BAR_SUCCESS : BAR_PRIMARY,
  }));
};

export const buildColumns = (entries: [string, number][]): ColumnItem[] => {
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  return entries.map(([label, value]) => ({
    label,
    value,
    height: scaled(value, max),
    tip: `${label}: ${value}`,
  }));
};
