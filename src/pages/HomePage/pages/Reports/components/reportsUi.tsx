import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

import EmptyStateImage from "@/assets/emptyState.svg";
import {
  Pill,
  PillTone,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { cn } from "@/utils/cn";

import {
  ChartColor,
  Delta,
  HeatCell,
  NV,
  ReportFlag,
  ReportKpi,
  ReportSection,
  TableCell,
} from "../utils/reportTypes";
import { formatDelta, sparkPoints } from "../utils/reportFormat";
import { initialsOf, severityPill } from "../utils/reportUiHelpers";

export {
  ActionMenu,
  DialogShell,
  Field,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SelectInput,
  TextArea,
  TextInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
export type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

/**
 * Building blocks shared by the Reports screens: the dark header band, stat
 * tiles, flags, highlights and the light-weight CSS/SVG charts used inside
 * report sections. Charts are plain markup so they print and reflow cleanly.
 */

/* -------------------------------------------------------------------------- */
/*                                   Surfaces                                 */
/* -------------------------------------------------------------------------- */

export const Card = ({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}) => (
  <Tag
    className={cn(
      "flex min-w-0 flex-col rounded-xl border border-lightGray bg-white p-4 sm:p-6",
      className
    )}
  >
    {children}
  </Tag>
);

export const CardTitle = ({
  title,
  sub,
  aside,
}: {
  title: ReactNode;
  sub?: ReactNode;
  aside?: ReactNode;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
    <div className="min-w-0">
      <h2 className="text-base font-semibold leading-6 text-primary">{title}</h2>
      {sub ? <p className="text-sm text-[#4B5563]">{sub}</p> : null}
    </div>
    {aside}
  </div>
);

export const Avatar = ({
  initials,
  size = 36,
  dark,
}: {
  initials: string;
  size?: 28 | 36;
  dark?: boolean;
}) => (
  <span
    aria-hidden="true"
    style={{ width: size, height: size }}
    className={cn(
      "flex flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
      dark ? "bg-primary text-white" : "bg-[#F3F4F6] text-primary"
    )}
  >
    {initials}
  </span>
);

export const PageEmpty = ({
  badge,
  title,
  text,
  action,
  bare,
}: {
  badge: string;
  title: string;
  text: string;
  action?: ReactNode;
  bare?: boolean;
}) => (
  <div
    role="status"
    className={cn(
      "flex flex-col items-center gap-3 px-6 py-12 text-center",
      !bare && "rounded-xl border border-lightGray bg-white"
    )}
  >
    <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-[#F8F9FC]">
      <img src={EmptyStateImage} alt="" className="w-24" />
    </div>
    <Pill tone="neutral">{badge}</Pill>
    <h2 className="text-2xl font-semibold leading-8 text-primary">{title}</h2>
    <p className="max-w-[460px] text-base leading-6 text-[#4B5563]">{text}</p>
    {action}
  </div>
);

export const SkeletonGrid = ({
  count = 6,
  min = 280,
  height = 200,
}: {
  count?: number;
  min?: number;
  height?: number;
}) => (
  <div
    aria-busy="true"
    className="grid gap-4"
    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}px), 1fr))` }}
  >
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        style={{ height }}
        className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-5"
      >
        <span className="h-4 w-1/2 animate-pulse rounded bg-[#F3F4F6]" />
        <span className="h-8 w-2/3 animate-pulse rounded bg-[#F3F4F6]" />
        <span className="h-3 w-2/5 animate-pulse rounded bg-[#F3F4F6]" />
      </div>
    ))}
  </div>
);

/** Status strip shown above a report body (returned, provisional, locked…). */
export const Banner = ({
  tone,
  title,
  text,
  action,
}: {
  tone: PillTone;
  title: string;
  text?: ReactNode;
  action?: { label: string; onClick: () => void };
}) => {
  const tones: Record<string, string> = {
    success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
    warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    danger: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
    neutral: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
    primary: "border-primary/15 bg-primary/5 text-primary",
  };
  return (
    <div
      role="status"
      className={cn("flex flex-wrap items-center gap-3 rounded-lg border p-4", tones[tone])}
    >
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
        <p className="font-semibold">{title}</p>
        {text ? <p className="text-[#374151]">{text}</p> : null}
      </div>
      {action ? (
        <UiButton tone="secondary" onClick={action.onClick} className="print:hidden">
          {action.label}
        </UiButton>
      ) : null}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Dark header band                             */
/* -------------------------------------------------------------------------- */

export interface BandTab<K extends string> {
  key: K;
  label: string;
  count?: number;
}

export interface ExportItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * The full-bleed #080D2D band used at the top of every report: back link,
 * eyebrow, title + status, meta line, preparer, actions and the tabs that
 * merge into the white content below.
 */
export const ReportBand = <K extends string>({
  backLabel,
  onBack,
  eyebrow,
  title,
  status,
  meta,
  preparedBy,
  actions,
  exportItems,
  tabs,
  tab,
  onTab,
}: {
  backLabel: string;
  onBack: () => void;
  eyebrow: string;
  title: string;
  status?: { tone: PillTone; label: string };
  meta: string[];
  preparedBy?: { name: string; role?: string };
  actions?: ReactNode;
  exportItems?: ExportItem[];
  tabs: BandTab<K>[];
  tab: K;
  onTab: (key: K) => void;
}) => (
  <div className="flex flex-col gap-4 bg-primary px-4 pt-5 text-white sm:px-6 print:hidden">
    <button
      type="button"
      onClick={onBack}
      className="self-start bg-transparent p-0 text-sm text-white/80 hover:text-white"
    >
      ← {backLabel}
    </button>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.04em] text-white/70">
          {eyebrow}
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-xl font-semibold leading-8 text-white sm:text-2xl">{title}</h1>
          {status ? <Pill tone={status.tone}>{status.label}</Pill> : null}
        </div>
        {meta.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
            {meta.filter(Boolean).map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        )}
        {preparedBy?.name ? (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary">
              {initialsOf(preparedBy.name)}
            </span>
            <span>
              Prepared by <span className="font-medium text-white">{preparedBy.name}</span>
              {preparedBy.role ? `, ${preparedBy.role}` : ""}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {exportItems && exportItems.length > 0 ? <ExportMenu items={exportItems} /> : null}
      </div>
    </div>
    <div role="tablist" aria-label="Report sections" className="-mx-1 flex gap-1 overflow-x-auto px-1">
      {tabs.map((item) => {
        const on = item.key === tab;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onTab(item.key)}
            className={cn(
              "inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-sm transition-colors",
              on ? "bg-white font-semibold text-primary" : "bg-transparent text-white/80 hover:text-white"
            )}
          >
            {item.label}
            {item.count ? (
              <span
                className={cn(
                  "rounded-full px-2 text-xs font-semibold text-white",
                  on ? "bg-primary" : "bg-white/20"
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  </div>
);

/** Ghost button that reads on the dark band. */
export const BandButton = ({
  children,
  onClick,
  solid,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  solid?: boolean;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
      solid
        ? "border-0 bg-white px-5 text-primary hover:bg-white/90"
        : "border border-white/40 bg-transparent px-4 text-white hover:bg-white/10"
    )}
  >
    {children}
  </button>
);

export const ExportMenu = ({ items }: { items: ExportItem[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <BandButton onClick={() => setOpen((prev) => !prev)}>
        Export
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </BandButton>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-20 flex min-w-[200px] flex-col rounded-md border border-[#E5E7EB] bg-white py-1 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="px-4 py-3 text-left text-sm text-primary hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Stat tiles                                */
/* -------------------------------------------------------------------------- */

const deltaColor = (delta: Delta | null | undefined, good?: "up" | "down" | null) => {
  if (!delta || !good || delta.pct === 0) return "#4B5563";
  const up = delta.pct > 0;
  return (good === "up") === up ? "#15803D" : "#B91C1C";
};

export const Sparkline = ({ values, color }: { values: number[]; color: string }) => (
  <svg width="72" height="28" viewBox="0 0 72 28" aria-hidden="true" className="max-w-full flex-shrink">
    <polyline
      points={sparkPoints(values)}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const KpiTile = ({ kpi, vsLabel }: { kpi: ReportKpi; vsLabel?: string }) => {
  const color = deltaColor(kpi.delta, kpi.good);
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-lightGray bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-[#4B5563]">{kpi.label}</span>
        {kpi.provisional ? <Pill tone="warning" className="px-2 py-0">Provisional</Pill> : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 break-words text-2xl font-semibold leading-8 text-primary">
          {kpi.value}
        </span>
        {kpi.spark && kpi.spark.length > 1 ? (
          <Sparkline values={kpi.spark} color={color === "#4B5563" ? NV : color} />
        ) : null}
      </div>
      {kpi.delta ? (
        <span className="text-xs font-semibold" style={{ color }}>
          {formatDelta(kpi.delta, kpi.format)}{" "}
          {vsLabel ? <span className="font-normal text-[#6B7280]">{vsLabel}</span> : null}
        </span>
      ) : null}
      {kpi.sub ? <span className="text-xs text-[#6B7280]">{kpi.sub}</span> : null}
    </div>
  );
};

export const KpiGrid = ({ kpis, vsLabel }: { kpis: ReportKpi[]; vsLabel?: string }) => (
  <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))]">
    {kpis.map((kpi) => (
      <KpiTile key={kpi.label} kpi={kpi} vsLabel={vsLabel} />
    ))}
  </div>
);

/** Compact two-number block used on executive and library cards. */
export const MiniStat = ({ kpi, muted }: { kpi: ReportKpi; muted?: boolean }) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <span className="break-words text-xl font-semibold leading-7 text-primary">{kpi.value}</span>
    <span className={cn(muted ? "text-xs text-[#6B7280]" : "text-sm text-[#4B5563]")}>{kpi.label}</span>
    <span className="text-xs font-semibold" style={{ color: kpi.delta ? deltaColor(kpi.delta, kpi.good) : "#6B7280" }}>
      {kpi.delta ? formatDelta(kpi.delta, kpi.format) : kpi.sub || " "}
    </span>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                           Needs attention + highlights                     */
/* -------------------------------------------------------------------------- */

const FLAG_ICON = {
  act: "M12 3l9.5 17h-19L12 3zM12 10v4M12 17.5v.01",
  watch: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2",
};

export const FlagsCard = ({ flags, hideLinks }: { flags: ReportFlag[]; hideLinks?: boolean }) => (
  <Card className="gap-3">
    <CardTitle
      title="Needs attention"
      sub="Rule-based flags, most urgent first"
      aside={
        <Pill tone="neutral">
          {flags.length} {flags.length === 1 ? "flag" : "flags"}
        </Pill>
      }
    />
    {flags.map((flag, index) => {
      const pill = severityPill(flag.severity);
      const act = flag.severity === "act";
      const fg = act ? "#B91C1C" : "#B45309";
      return (
        <div
          key={`${flag.text}-${index}`}
          className={cn(
            "flex gap-3 rounded-lg border p-3",
            act ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#FDE68A] bg-[#FFFBEB]"
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-shrink-0">
            <path d={FLAG_ICON[flag.severity]} />
          </svg>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="text-xs font-semibold" style={{ color: fg }}>
              {pill.label}
            </span>
            <p className="font-medium text-primary">{flag.text}</p>
            {!hideLinks && flag.link && flag.onOpen ? (
              <button
                type="button"
                onClick={flag.onOpen}
                className="bg-transparent p-0 text-sm font-medium text-primary underline underline-offset-[3px] print:hidden"
              >
                {flag.link} →
              </button>
            ) : null}
          </div>
        </div>
      );
    })}
    {flags.length === 0 && (
      <p className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 font-medium text-[#15803D]">
        ✓ Nothing needs attention this period.
      </p>
    )}
  </Card>
);

export const HighlightsCard = ({ items }: { items: string[] }) => (
  <Card className="gap-3">
    <CardTitle
      title="Highlights"
      sub="Written automatically from this period’s data"
      aside={<Pill tone="info">Auto-written</Pill>}
    />
    {items.length ? (
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {items.map((text, index) => (
          <li key={index} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span className="text-base leading-6 text-primary">{text}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-[#6B7280]">Not enough data this period to write highlights.</p>
    )}
  </Card>
);

/* -------------------------------------------------------------------------- */
/*                                Section charts                              */
/* -------------------------------------------------------------------------- */

const fmtNum = (value: number, money?: boolean) =>
  money
    ? `GH₵ ${Math.round(value).toLocaleString("en-GB")}`
    : Number(value).toLocaleString("en-GB", { maximumFractionDigits: 1 });

const Legend = ({ items }: { items: { label: string; color: ChartColor; line?: boolean }[] }) => (
  <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
    {items.map((item) => (
      <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-[#4B5563]">
        <span
          className="rounded-sm"
          style={{ background: item.color, width: item.line ? 14 : 10, height: item.line ? 3 : 10 }}
        />
        {item.label}
      </span>
    ))}
  </div>
);

const BarsChart = ({ s }: { s: Extract<ReportSection, { kind: "bars" }> }) => {
  const stack = s.stack !== false;
  const total = (i: number) =>
    stack
      ? s.series.reduce((sum, series) => sum + (series.values[i] || 0), 0)
      : Math.max(...s.series.map((series) => series.values[i] || 0));
  const max = Math.max(1, ...s.labels.map((_, i) => total(i))) * 1.08;
  const gap = s.labels.length > 10 ? 4 : 12;
  let line = "";
  if (s.line && s.line.values.length) {
    const values = s.line.values;
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const range = hi - lo || 1;
    line = values
      .map((x, i) => `${(((i + 0.5) / values.length) * 100).toFixed(2)},${(88 - ((x - lo) / range) * 70).toFixed(2)}`)
      .join(" ");
  }
  const tip = (i: number) =>
    [s.labels[i], ...s.series.map((series) => `${series.name}: ${fmtNum(series.values[i] || 0, s.money)}`)]
      .concat(s.line ? [`${s.line.name}: ${fmtNum(s.line.values[i] || 0, s.money)}`] : [])
      .join(" · ");

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-[180px] items-end border-b border-[#E5E7EB]" style={{ gap }}>
        {s.labels.map((label, i) => (
          <div key={`${label}-${i}`} title={tip(i)} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5">
            {(stack ? [s.series] : s.series.map((series) => [series])).map((group, gi) => (
              <div key={gi} className="flex h-full max-w-8 flex-1 flex-col justify-end">
                {group
                  .slice()
                  .reverse()
                  .map((series, si) => (
                    <div
                      key={series.name}
                      style={{
                        height: `${(((series.values[i] || 0) / max) * 100).toFixed(2)}%`,
                        background: series.color,
                        borderRadius: si === 0 ? "3px 3px 0 0" : 0,
                      }}
                    />
                  ))}
              </div>
            ))}
          </div>
        ))}
        {line && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <polyline points={line} fill="none" stroke={s.line?.color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
      <div className="flex" style={{ gap }}>
        {s.labels.map((label, i) => (
          <span key={`${label}-${i}`} className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xs text-[#6B7280]">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const HBars = ({ s }: { s: Extract<ReportSection, { kind: "hbars" }> }) => {
  const max = s.max || Math.max(1, ...s.rows.map((row) => row.value));
  return (
    <div className="flex flex-col gap-3.5">
      {s.rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{row.label}</span>
            <span className="whitespace-nowrap font-semibold">{row.display ?? fmtNum(row.value, s.money)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(((row.value || 0) / (row.max || max)) * 100, 1).toFixed(1)}%`,
                background: row.color || s.color || NV,
              }}
            />
          </div>
          {row.sub ? <span className="text-xs text-[#6B7280]">{row.sub}</span> : null}
        </div>
      ))}
      {s.rows.length === 0 && <p className="text-[#6B7280]">No data for this period.</p>}
    </div>
  );
};

const Funnel = ({ s }: { s: Extract<ReportSection, { kind: "funnel" }> }) => {
  const top = s.steps[0]?.value || 1;
  return (
    <div className="flex flex-col gap-3">
      {s.steps.map((step, i) => {
        const prev = i > 0 ? s.steps[i - 1].value : 0;
        return (
          <div key={step.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{step.label}</span>
              <span>
                <span className="font-semibold">{fmtNum(step.value)}</span>
                {i > 0 && prev > 0 ? (
                  <span className="text-xs text-[#6B7280]"> · {Math.round((step.value / prev) * 100)}% of previous step</span>
                ) : null}
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded-lg bg-[#F3F4F6]">
              <div
                className="h-full rounded-lg"
                style={{
                  width: `${Math.max((step.value / top) * 100, 4).toFixed(1)}%`,
                  background: i === s.steps.length - 1 ? "#9A5D1A" : NV,
                }}
              />
            </div>
            {step.note ? <span className="text-xs text-[#6B7280]">{step.note}</span> : null}
          </div>
        );
      })}
    </div>
  );
};

const cellView = (cell: TableCell) =>
  typeof cell === "object" && cell !== null ? cell : { text: String(cell ?? "—") };

const sortKey = (row: { cells: TableCell[]; keys?: (string | number)[] }, i: number) => {
  if (row.keys && row.keys[i] !== undefined) return row.keys[i];
  const cell = cellView(row.cells[i]);
  const text = cell.text ?? cell.pill?.label ?? "";
  const num = parseFloat(String(text).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(num) ? String(text) : num;
};

const DataTable = ({ s }: { s: Extract<ReportSection, { kind: "table" }> }) => {
  const [sort, setSort] = useState<{ i: number; dir: 1 | -1 } | null>(null);
  const grid = s.columns.map((column) => column.width).join(" ");
  const rows = useMemo(() => {
    if (!sort) return s.rows;
    return s.rows.slice().sort((a, b) => {
      const x = sortKey(a, sort.i);
      const y = sortKey(b, sort.i);
      const diff = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return diff * sort.dir;
    });
  }, [s.rows, sort]);

  return (
    <div className="overflow-x-auto rounded-lg border border-lightGray">
      <div style={{ minWidth: s.minWidth || "640px" }}>
        <div className="grid gap-3 bg-lightGray px-4 py-4 font-semibold sm:px-6" style={{ gridTemplateColumns: grid }}>
          {s.columns.map((column, i) => (
            <button
              key={column.label}
              type="button"
              disabled={!s.sortable}
              onClick={() => setSort((prev) => (prev && prev.i === i ? { i, dir: prev.dir === 1 ? -1 : 1 } : { i, dir: 1 }))}
              className={cn(
                "flex bg-transparent p-0 text-sm font-semibold text-primary disabled:cursor-default",
                column.align === "right" ? "justify-end text-right" : "justify-start text-left"
              )}
            >
              {column.label}
              {sort && sort.i === i ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
            </button>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div
            key={ri}
            onClick={row.onClick}
            className={cn(
              "grid min-h-16 items-center gap-3 border-t border-lightGray px-4 py-3 hover:bg-lightGray/20 sm:px-6",
              row.onClick && "cursor-pointer"
            )}
            style={{ gridTemplateColumns: grid }}
          >
            {row.cells.map((raw, ci) => {
              const cell = cellView(raw);
              const align = s.columns[ci]?.align === "right" ? "text-right" : "text-left";
              return (
                <div key={ci} className={cn("min-w-0", align, cell.bold && "font-semibold")}>
                  {cell.pill ? (
                    <Pill tone={cell.pill.tone}>{cell.pill.label}</Pill>
                  ) : (
                    <>
                      <span>{cell.text}</span>
                      {cell.sub ? <span className="block text-xs font-normal text-[#6B7280]">{cell.sub}</span> : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {rows.length === 0 && <p className="border-t border-lightGray px-6 py-4 text-[#6B7280]">No rows for this period.</p>}
      </div>
    </div>
  );
};

const Segments = ({ s }: { s: Extract<ReportSection, { kind: "segments" }> }) => (
  <div className="flex flex-col gap-4">
    {s.groups.map((group, gi) => {
      const total = group.parts.reduce((sum, part) => sum + part.value, 0) || 1;
      return (
        <div key={group.label || gi} className="flex flex-col gap-2">
          {group.label ? <span className="text-xs font-semibold text-[#4B5563]">{group.label}</span> : null}
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {group.parts.map((part) => (
              <div
                key={part.label}
                title={`${part.label}: ${part.display ?? fmtNum(part.value)}`}
                style={{ width: `${((part.value / total) * 100).toFixed(2)}%`, background: part.color }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {group.parts.map((part) => (
              <span key={part.label} className="inline-flex items-center gap-1.5 text-xs text-[#4B5563]">
                <span className="h-2 w-2 rounded-sm" style={{ background: part.color }} />
                {part.label}{" "}
                <span className="font-semibold text-primary">
                  {part.display ?? fmtNum(part.value)} · {Math.round((part.value / total) * 100)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const Heatmap = ({ s }: { s: Extract<ReportSection, { kind: "heat" }> }) => {
  const grid = `minmax(130px,1.4fr) repeat(${s.columns.length}, minmax(44px,1fr))`;
  return (
    <div className="overflow-x-auto">
      <div className="grid items-center gap-1 text-xs" style={{ gridTemplateColumns: grid, minWidth: 170 + s.columns.length * 52 }}>
        <span />
        {s.columns.map((column) => (
          <span key={column} className="text-center text-[#6B7280]">
            {column}
          </span>
        ))}
        {s.rows.map((row) => (
          <HeatRow key={row.label} label={row.label} cells={row.cells} columns={s.columns} />
        ))}
      </div>
    </div>
  );
};

const HeatRow = ({ label, cells, columns }: { label: string; cells: HeatCell[]; columns: string[] }) => (
  <>
    <span className="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-sm">{label}</span>
    {cells.map((cell, i) => (
      <span
        key={i}
        title={`${label} · ${columns[i]}: ${cell.text}`}
        className="flex h-8 items-center justify-center rounded font-semibold"
        style={{ background: cell.bg, color: cell.fg }}
      >
        {cell.text}
      </span>
    ))}
  </>
);

const CalendarStrip = ({ s }: { s: Extract<ReportSection, { kind: "calendar" }> }) => (
  <div className="overflow-x-auto">
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${s.days.length}, minmax(30px,1fr))`,
        minWidth: Math.max(s.days.length * 34, 320),
      }}
    >
      {s.days.map((day) => (
        <div
          key={day.key}
          title={day.tip}
          className="flex min-h-[72px] flex-col items-center gap-1 rounded-lg border border-[#E5E7EB] px-1 py-1.5"
          style={{ background: day.weekend ? "#F8F9FC" : "#fff" }}
        >
          <span className="text-xs text-[#6B7280]">{day.dow}</span>
          <span className="text-xs font-semibold">{day.day}</span>
          {day.colors.map((color, i) => (
            <span key={i} className="h-1.5 w-full rounded-full" style={{ background: color }} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const PeopleList = ({ s }: { s: Extract<ReportSection, { kind: "list" }> }) => (
  <div className="flex flex-col">
    {s.items.map((item, i) => (
      <div key={`${item.title}-${i}`} className="flex items-center gap-3 border-b border-[#E5E7EB] py-3">
        <Avatar initials={item.hidden ? "••" : initialsOf(item.title)} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.hidden ? "Name hidden" : item.title}</p>
          {item.sub ? <p className="text-xs text-[#6B7280]">{item.sub}</p> : null}
        </div>
        {item.pill ? <Pill tone={item.pill.tone}>{item.pill.label}</Pill> : null}
        {item.right ? <span className="whitespace-nowrap font-semibold">{item.right}</span> : null}
      </div>
    ))}
    {s.items.length === 0 && <p className="text-[#6B7280]">Nothing to list for this period.</p>}
  </div>
);

const StatGrid = ({ s }: { s: Extract<ReportSection, { kind: "stats" }> }) => (
  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]">
    {s.stats.map((stat) => (
      <div key={stat.label} className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[#E5E7EB] bg-[#F8F9FC] px-4 py-3">
        <span className="text-xs text-[#4B5563]">{stat.label}</span>
        <span className="text-xl font-semibold leading-7">{stat.value}</span>
        {stat.sub ? (
          <span className="text-xs font-semibold" style={{ color: stat.color || "#6B7280" }}>
            {stat.sub}
          </span>
        ) : null}
      </div>
    ))}
  </div>
);

export const SectionCard = ({ s }: { s: ReportSection }) => {
  const legend =
    s.kind === "bars"
      ? s.series
          .map((series) => ({ label: series.name, color: series.color }))
          .concat(s.line ? [{ label: s.line.name, color: s.line.color, line: true } as never] : [])
      : s.legend || [];
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-4 [break-inside:avoid] sm:p-6",
        s.full && "col-span-full"
      )}
    >
      <CardTitle title={s.title} sub={s.sub} aside={legend.length ? <Legend items={legend} /> : undefined} />
      {s.kind === "bars" && <BarsChart s={s} />}
      {s.kind === "hbars" && <HBars s={s} />}
      {s.kind === "funnel" && <Funnel s={s} />}
      {s.kind === "table" && <DataTable s={s} />}
      {s.kind === "segments" && <Segments s={s} />}
      {s.kind === "heat" && <Heatmap s={s} />}
      {s.kind === "calendar" && <CalendarStrip s={s} />}
      {s.kind === "list" && <PeopleList s={s} />}
      {s.kind === "stats" && <StatGrid s={s} />}
      {s.note ? <p className="text-xs text-[#6B7280]">{s.note}</p> : null}
    </section>
  );
};

export const SectionGrid = ({ sections }: { sections: ReportSection[] }) => (
  <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
    {sections.map((section) => (
      <SectionCard key={section.id} s={section} />
    ))}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                         Approval trail and comments                        */
/* -------------------------------------------------------------------------- */

export interface TrailStep {
  action: string;
  who: string;
  when: string;
  done: boolean;
}

export const ApprovalTrail = ({ steps, children }: { steps: TrailStep[]; children?: ReactNode }) => (
  <Card className="gap-4">
    <CardTitle title="Approval trail" sub="Who did what, and when" />
    <ol className="m-0 flex list-none flex-col p-0">
      {steps.map((step, i) => {
        const returned = /return/i.test(step.action);
        const color = step.done ? (returned ? "#B91C1C" : NV) : "#D8DAE5";
        return (
          <li key={`${step.action}-${i}`} className="flex gap-3">
            <div className="flex flex-shrink-0 flex-col items-center">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs leading-none text-white"
                style={{ borderColor: color, background: step.done ? color : "#fff" }}
              >
                {step.done ? (returned ? "↩" : "✓") : ""}
              </span>
              <span
                className="min-h-4 w-0.5 flex-1"
                style={{ background: i === steps.length - 1 ? "transparent" : "#D8DAE5" }}
              />
            </div>
            <div className="min-w-0 pb-4">
              <p className={cn("font-semibold", step.done ? "text-primary" : "text-[#6B7280]")}>{step.action}</p>
              <p className="text-xs text-[#6B7280]">
                {step.who} · {step.when}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
    {children}
  </Card>
);

export interface CommentItem {
  id: string | number;
  author: string;
  when: string;
  text: string;
}

export const CommentsCard = ({
  comments,
  onPost,
  posting,
  canPost = true,
  sub = "Visible to the head of department",
}: {
  comments: CommentItem[];
  onPost?: (text: string) => Promise<unknown> | void;
  posting?: boolean;
  canPost?: boolean;
  sub?: string;
}) => {
  const [draft, setDraft] = useState("");
  return (
    <Card className="gap-3">
      <CardTitle title="Leadership comments" sub={sub} />
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3 border-b border-[#E5E7EB] py-3">
          <Avatar initials={initialsOf(comment.author)} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p>
              <span className="font-semibold">{comment.author}</span>{" "}
              <span className="text-xs text-[#6B7280]">· {comment.when}</span>
            </p>
            <p className="whitespace-pre-wrap">{comment.text}</p>
          </div>
        </div>
      ))}
      {comments.length === 0 && <p className="text-[#6B7280]">No comments yet.</p>}
      {canPost && onPost ? (
        <div className="flex flex-col gap-2 print:hidden">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="Write a comment"
            aria-label="Comment"
            className="w-full resize-y rounded-lg border border-[rgba(107,114,128,0.35)] px-3 py-2.5 text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]"
          />
          <UiButton
            tone="secondary"
            className="self-end"
            disabled={posting || !draft.trim()}
            onClick={async () => {
              const text = draft.trim();
              if (!text) return;
              await onPost(text);
              setDraft("");
            }}
          >
            {posting ? "Posting…" : "Post comment"}
          </UiButton>
        </div>
      ) : null}
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*                                    Helpers                                 */
/* -------------------------------------------------------------------------- */


