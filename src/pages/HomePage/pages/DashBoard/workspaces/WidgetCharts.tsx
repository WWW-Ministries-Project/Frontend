import { Fragment, ReactNode } from "react";

import { Pill } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import type {
  RagCell,
  WorkspaceKpi,
  WorkspacePill,
} from "@/utils/api/workspaces/interfaces";
import { cn } from "@/utils/cn";

import { BZ, type HBarSpec, kpiDelta, kpiValue, MUTED, nf, NV, ringColor } from "./wsFormat";

export type { HBarSpec };

/*
 * Plain-markup charts and stat blocks for workspace widgets. They mirror the
 * Reports charts (same tokens) so both screens read as one system.
 */

export const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const range = hi - lo || 1;
  const points = values
    .map((x, i) => `${(2 + (i / (values.length - 1)) * 68).toFixed(1)},${(25 - ((x - lo) / range) * 22).toFixed(1)}`)
    .join(" ");
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" aria-hidden="true" className="max-w-full flex-shrink">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export const KpiRow = ({ kpis, vsLabel, min = 190 }: { kpis: WorkspaceKpi[]; vsLabel?: string; min?: number }) => (
  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}>
    {kpis.map((kpi) => {
      const delta = kpiDelta(kpi);
      return (
        <div key={kpi.key || kpi.label} className="flex min-w-0 flex-col gap-2 rounded-xl border border-lightGray bg-white px-5 py-4">
          <span className="text-sm text-gray-600">{kpi.label}</span>
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1">
            <span className="min-w-0 break-words text-2xl font-semibold leading-8 text-primary">{kpiValue(kpi)}</span>
            {kpi.spark?.length > 1 ? (
              <Sparkline values={kpi.spark} color={delta && delta.color !== MUTED ? delta.color : NV} />
            ) : null}
          </div>
          {delta ? (
            <span className="text-xs font-semibold" style={{ color: delta.color }}>
              {delta.text} {vsLabel ? <span className="font-normal text-gray-500">{vsLabel}</span> : null}
            </span>
          ) : null}
          {kpi.sub ? <span className="text-xs text-gray-500">{kpi.sub}</span> : null}
        </div>
      );
    })}
  </div>
);

export const KpiSkeleton = ({ count = 4, min = 190 }: { count?: number; min?: number }) => (
  <div aria-busy="true" className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white px-5 py-4">
        <span className="h-3.5 w-3/5 animate-pulse rounded bg-gray-100" />
        <span className="h-7 w-2/5 animate-pulse rounded bg-gray-100" />
        <span className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    ))}
  </div>
);

export interface StatSpec {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** Colour of the sub line (and the value when `strong`). */
  color?: string;
  strong?: boolean;
}

export const StatGrid = ({ stats, min = 130 }: { stats: StatSpec[]; min?: number }) => (
  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}>
    {stats.map((stat) => (
      <div key={stat.label} className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-gray-200 bg-inputBackground px-4 py-3">
        <span className="text-xs text-gray-600">{stat.label}</span>
        <span
          className="break-words text-xl font-semibold leading-7 text-primary"
          style={stat.strong && stat.color ? { color: stat.color } : undefined}
        >
          {stat.value}
        </span>
        {stat.sub ? (
          <span
            className={cn("text-xs", stat.color ? "font-semibold" : "text-gray-500")}
            style={stat.color ? { color: stat.color } : undefined}
          >
            {stat.sub}
          </span>
        ) : null}
      </div>
    ))}
  </div>
);

export const Legend = ({ items }: { items: { label: string; color: string; line?: boolean }[] }) => (
  <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
    {items.map((item) => (
      <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
        <span className="rounded-sm" style={{ background: item.color, width: item.line ? 14 : 10, height: item.line ? 3 : 10 }} />
        {item.label}
      </span>
    ))}
  </div>
);

/** Vertical bars, one or more series side by side, with an optional line. */
export const BarsChart = ({
  labels,
  series,
  line,
  unit = "",
  height = 180,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  line?: { name: string; color: string; values: number[] };
  unit?: string;
  height?: number;
}) => {
  const max = Math.max(1, ...series.flatMap((s) => s.values), ...(line?.values ?? [])) * 1.1;
  const gap = labels.length > 8 ? 4 : 12;
  const linePoints = line
    ? line.values
        .map((x, i) => `${(((i + 0.5) / line.values.length) * 100).toFixed(2)},${(100 - (x / max) * 100).toFixed(2)}`)
        .join(" ")
    : "";
  return (
    <div className="flex flex-col gap-2">
      <Legend
        items={series
          .map((s) => ({ label: s.name, color: s.color }))
          .concat(line ? [{ label: line.name, color: line.color, line: true } as never] : [])}
      />
      <div className="relative flex items-end border-b border-gray-200" style={{ height, gap }}>
        {labels.map((label, i) => (
          <div
            key={`${label}-${i}`}
            title={[label, ...series.map((s) => `${s.name}: ${nf(s.values[i] ?? 0)}${unit}`)].join(" · ")}
            className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
          >
            {series.map((s) => (
              <div
                key={s.name}
                className="max-w-7 flex-1 rounded-t-[3px]"
                style={{ height: `${(((s.values[i] ?? 0) / max) * 100).toFixed(2)}%`, background: s.color }}
              />
            ))}
          </div>
        ))}
        {line && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <polyline points={linePoints} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
      <div className="flex" style={{ gap }}>
        {labels.map((label, i) => (
          <span key={`${label}-${i}`} className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xs text-gray-500">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Ranked horizontal bars. */
export const HBarList = ({
  rows,
  money,
  color = NV,
  format,
}: {
  rows: HBarSpec[];
  money?: boolean;
  color?: string;
  format?: (row: HBarSpec) => string;
}) => {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((row, i) => (
        <div key={`${row.label}-${i}`} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{row.label}</span>
            <span className="whitespace-nowrap font-semibold">
              {row.display ?? (format ? format(row) : money ? `GH₵ ${Math.round(row.value).toLocaleString("en-GB")}` : nf(row.value))}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(((row.value || 0) / (row.max || max)) * 100, 1)).toFixed(1)}%`,
                background: row.color || color,
              }}
            />
          </div>
          {row.sub ? <span className="text-xs text-gray-500">{row.sub}</span> : null}
        </div>
      ))}
    </div>
  );
};

export const FunnelChart = ({ steps }: { steps: { label: string; value: number }[] }) => {
  const top = steps[0]?.value || 1;
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].value : 0;
        return (
          <div key={step.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{step.label}</span>
              <span>
                <span className="font-semibold">{nf(step.value)}</span>
                {i > 0 && prev > 0 ? (
                  <span className="text-xs text-gray-500"> · {Math.round((step.value / prev) * 100)}% of previous</span>
                ) : null}
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded-lg bg-gray-100">
              <div
                className="h-full rounded-lg"
                style={{
                  width: `${Math.max((step.value / top) * 100, 4).toFixed(1)}%`,
                  background: i === steps.length - 1 ? BZ : NV,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Segments = ({ parts }: { parts: { label: string; value: number; color: string }[] }) => {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {parts.map((part) => (
          <div
            key={part.label}
            title={`${part.label}: ${nf(part.value)}`}
            style={{ width: `${((part.value / total) * 100).toFixed(2)}%`, background: part.color }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {parts.map((part) => (
          <span key={part.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <span className="h-2 w-2 rounded-sm" style={{ background: part.color }} />
            {part.label} <span className="font-semibold text-primary">{nf(part.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const RING_C = 188.5;

export const Ring = ({ value, color, children }: { value: number; color: string; children?: ReactNode }) => (
  <div className="relative h-[72px] w-[72px] flex-shrink-0">
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true" className="-rotate-90">
      <circle cx="36" cy="36" r="30" fill="none" stroke="rgb(var(--color-gray-100))" strokeWidth="8" />
      <circle
        cx="36"
        cy="36"
        r="30"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${((Math.max(0, Math.min(100, value)) / 100) * RING_C).toFixed(1)} ${RING_C}`}
      />
    </svg>
    {children ? <span className="absolute inset-0 flex items-center justify-center font-semibold">{children}</span> : null}
  </div>
);

export const RingGrid = ({ rings }: { rings: { label: string; value: number; sub: string }[] }) => (
  <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,96px),1fr))]">
    {rings.map((ring) => (
      <div key={ring.label} className="flex flex-col items-center gap-1.5 text-center">
        <Ring value={ring.value} color={ringColor(ring.value)}>
          {Math.round(ring.value)}%
        </Ring>
        <span className="font-medium">{ring.label}</span>
        <span className="text-xs text-gray-500">{ring.sub}</span>
      </div>
    ))}
  </div>
);

export const Pipeline = ({
  steps,
}: {
  steps: { label: string; count: number; amount: string; pill?: WorkspacePill | null }[];
}) => (
  <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]">
    {steps.map((step, i) => (
      <div key={step.label} className="flex min-w-0 flex-col gap-1 rounded-lg border border-lightGray bg-white px-4 py-3">
        <span className="text-xs font-semibold text-gray-600">
          {i + 1} · {step.label}
        </span>
        <span className="text-2xl font-semibold leading-8">{nf(step.count)}</span>
        <span className="text-gray-600">{step.amount}</span>
        {step.pill ? (
          <span className="self-start">
            <Pill tone={step.pill.tone}>{step.pill.label}</Pill>
          </span>
        ) : null}
      </div>
    ))}
  </div>
);

const RAG: Record<Exclude<RagCell, null>, { cls: string; mark: string; tip: string; key: string }> = {
  ok: { cls: "bg-green-50 text-green-700", mark: "✓", tip: "Approved", key: "Approved" },
  sub: { cls: "bg-blue-50 text-blue-700", mark: "•", tip: "Submitted, awaiting review", key: "Submitted" },
  ret: { cls: "bg-amber-50 text-amber-700", mark: "↺", tip: "Returned", key: "Returned" },
  miss: { cls: "bg-red-50 text-red-700", mark: "✕", tip: "Not submitted", key: "Not submitted" },
};

export const RagGrid = ({ columns, rows }: { columns: string[]; rows: { department: string; cells: RagCell[] }[] }) => (
  <div className="flex flex-col gap-3">
    <div className="overflow-x-auto">
      <div
        className="grid items-center gap-1 text-xs"
        style={{
          gridTemplateColumns: `minmax(120px,1.4fr) repeat(${columns.length}, minmax(44px,1fr))`,
          minWidth: 140 + columns.length * 52,
        }}
      >
        <span />
        {columns.map((column) => (
          <span key={column} className="overflow-hidden text-ellipsis whitespace-nowrap text-center text-gray-500">
            {column}
          </span>
        ))}
        {rows.map((row) => (
          <Fragment key={row.department}>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-sm">{row.department}</span>
            {columns.map((column, i) => {
              const cell = row.cells[i] ?? null;
              const spec = cell ? RAG[cell] : null;
              return (
                <span
                  key={column}
                  title={`${row.department} · ${column}: ${spec ? spec.tip : "No report expected"}`}
                  className={cn("flex h-8 items-center justify-center rounded font-semibold", spec ? spec.cls : "bg-gray-100 text-gray-500")}
                >
                  {spec ? spec.mark : "—"}
                </span>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {Object.values(RAG).map((spec) => (
        <span key={spec.key} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
          <span className={cn("h-2.5 w-2.5 rounded-sm", spec.cls)} />
          {spec.key}
        </span>
      ))}
    </div>
  </div>
);

export type CellSpec = string | number | null | { text?: string; sub?: string; bold?: boolean; pill?: WorkspacePill };

export const DataTable = ({
  columns,
  rows,
  minWidth = 520,
}: {
  columns: { label: string; width: string; align?: "left" | "right" }[];
  rows: CellSpec[][];
  minWidth?: number;
}) => {
  const grid = columns.map((column) => column.width).join(" ");
  return (
    <div className="overflow-x-auto rounded-lg border border-lightGray">
      <div style={{ minWidth }}>
        <div className="grid gap-3 bg-lightGray px-4 py-3 text-sm font-semibold" style={{ gridTemplateColumns: grid }}>
          {columns.map((column) => (
            <span key={column.label} className={column.align === "right" ? "text-right" : "text-left"}>
              {column.label}
            </span>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} className="grid min-h-14 items-center gap-3 border-t border-lightGray px-4 py-2 hover:bg-lightGray/20" style={{ gridTemplateColumns: grid }}>
            {row.map((raw, ci) => {
              const cell = typeof raw === "object" && raw !== null ? raw : { text: raw === null || raw === undefined ? "—" : String(raw) };
              return (
                <div key={ci} className={cn("min-w-0", columns[ci]?.align === "right" ? "text-right" : "text-left", cell.bold && "font-semibold")}>
                  {cell.pill ? (
                    <Pill tone={cell.pill.tone}>{cell.pill.label}</Pill>
                  ) : (
                    <>
                      <span>{cell.text}</span>
                      {cell.sub ? <span className="block text-xs font-normal text-gray-500">{cell.sub}</span> : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
