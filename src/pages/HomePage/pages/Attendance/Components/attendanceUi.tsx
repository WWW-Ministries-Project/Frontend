import { ReactNode } from "react";

import {
  Pill,
  PillTone,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { cn } from "@/utils/cn";

/* -------------------------------------------------------------------------- */
/*                              Collapsible group                             */
/* -------------------------------------------------------------------------- */

export const GroupSection = ({
  label,
  count,
  summary,
  open,
  onToggle,
  children,
  moreLabel,
  onMore,
}: {
  label: string;
  count: number;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  moreLabel?: string;
  onMore?: () => void;
}) => (
  <div className="flex flex-col gap-4">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-lightGray bg-[#F8F9FC] px-4 py-3 text-left text-base font-semibold text-primary transition-colors hover:bg-lightGray/30"
    >
      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span>
          {label} ({count})
        </span>
        <span className="text-sm font-normal text-[#4B5563]">{summary}</span>
      </span>
      <span className="text-lg leading-none">{open ? "−" : "+"}</span>
    </button>
    {open && children}
    {open && moreLabel && onMore && (
      <button
        type="button"
        onClick={onMore}
        className="min-h-10 self-center rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
      >
        {moreLabel}
      </button>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                   Charts                                   */
/* -------------------------------------------------------------------------- */

export interface LegendItem {
  label: string;
  color: string;
}

export const AnalyticsCard = ({
  title,
  sub,
  legend,
  fullWidth,
  children,
}: {
  title: string;
  sub?: ReactNode;
  legend?: LegendItem[];
  fullWidth?: boolean;
  children: ReactNode;
}) => (
  <section
    className={cn(
      "flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-6 shadow-[0_8px_24px_rgba(8,13,45,0.08)]",
      fullWidth && "col-span-full"
    )}
  >
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        {sub ? <p className="text-sm text-[#4B5563]">{sub}</p> : null}
      </div>
      {legend && legend.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {legend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-[#4B5563]">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
    {children}
  </section>
);

export const Note = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-[#6B7280]">{children}</p>
);

export interface BarRow {
  label: string;
  value: string;
  /** 0–100 */
  width: number;
  color: string;
}

export const BarRows = ({ items, emptyText = "No data in this period." }: { items: BarRow[]; emptyText?: string }) => {
  if (!items.length) return <Note>{emptyText}</Note>;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex justify-between gap-3 text-sm text-primary">
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{item.label}</span>
            <span className="whitespace-nowrap font-semibold">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
            <div
              className="h-full rounded-full"
              style={{ width: `${item.width}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface StackColumn {
  label: string;
  value: string;
  tip: string;
  /** 0–100, column height against the tallest. */
  height: number;
  segments: { pct: number; color: string }[];
}

export const StackColumns = ({ items, emptyText = "No data in this period." }: { items: StackColumn[]; emptyText?: string }) => {
  if (!items.length) return <Note>{emptyText}</Note>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-[220px] items-end gap-1.5 border-b border-[#E5E7EB]">
        {items.map((item) => (
          <div
            key={item.label}
            title={item.tip}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="whitespace-nowrap text-xs font-semibold text-primary">{item.value}</span>
            <div
              className="flex w-full max-w-[44px] flex-col-reverse overflow-hidden rounded-t"
              style={{ height: `${item.height}%` }}
            >
              {item.segments.map((segment, index) => (
                <div key={index} style={{ flex: `0 0 ${segment.pct}%`, background: segment.color }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {items.map((item) => (
          <span
            key={item.label}
            className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xs text-[#6B7280]"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export interface InsightItem {
  tag: string;
  tone: PillTone;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}

export const InsightList = ({ items, emptyText }: { items: InsightItem[]; emptyText: string }) => (
  <div className="flex flex-col">
    {items.map((item) => (
      <div
        key={item.title}
        className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-[#E5E7EB] py-3"
      >
        <Pill tone={item.tone}>{item.tag}</Pill>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <p className="text-sm font-semibold text-primary">{item.title}</p>
          <p className="text-sm text-[#4B5563]">{item.text}</p>
        </div>
        {item.action && item.onAction && (
          <button
            type="button"
            onClick={item.onAction}
            className="whitespace-nowrap bg-transparent p-0 text-sm font-medium text-primary underline"
          >
            {item.action}
          </button>
        )}
      </div>
    ))}
    {!items.length && <Note>{emptyText}</Note>}
  </div>
);

export interface LinkItem {
  key: string;
  label: string;
  sub: string;
  action: string;
  onClick: () => void;
}

export const LinkList = ({ items, emptyText }: { items: LinkItem[]; emptyText: string }) => (
  <div className="flex flex-col">
    {items.map((item) => (
      <button
        key={item.key}
        type="button"
        onClick={item.onClick}
        className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] bg-transparent py-3 text-left text-primary transition-colors hover:bg-lightGray/20"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">{item.label}</span>
          <span className="text-xs text-[#6B7280]">{item.sub}</span>
        </span>
        <span className="whitespace-nowrap text-sm text-[#4B5563]">{item.action}</span>
      </button>
    ))}
    {!items.length && <Note>{emptyText}</Note>}
  </div>
);

/** A table cell: plain text with an optional muted line, or a pill. */
export type MiniCell =
  | { text: string; sub?: string; strong?: boolean }
  | { pill: string; tone: PillTone };

export const MiniTable = ({
  head,
  cols,
  rows,
  minWidth = "560px",
  emptyText = "No data in this period.",
}: {
  head: string[];
  cols: string;
  rows: MiniCell[][];
  minWidth?: string;
  emptyText?: string;
}) => (
  <>
    <div className="overflow-x-auto rounded-lg border border-lightGray">
      <div style={{ minWidth }}>
        <div
          className="grid items-center gap-3 bg-lightGray px-4 py-3 text-sm font-semibold text-primary"
          style={{ gridTemplateColumns: cols }}
        >
          {head.map((cell) => (
            <span key={cell}>{cell}</span>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid min-h-14 items-center gap-3 border-b border-[#E5E7EB] px-4 py-2 text-sm text-primary transition-colors hover:bg-lightGray/20"
            style={{ gridTemplateColumns: cols }}
          >
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="min-w-0">
                {"pill" in cell ? (
                  <Pill tone={cell.tone}>{cell.pill}</Pill>
                ) : (
                  <>
                    <p
                      className={cn(
                        "overflow-hidden text-ellipsis whitespace-nowrap",
                        cell.strong && "font-semibold"
                      )}
                    >
                      {cell.text}
                    </p>
                    {cell.sub && (
                      <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#6B7280]">
                        {cell.sub}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
    {!rows.length && <Note>{emptyText}</Note>}
  </>
);

/** KPI tile whose sub-line can carry a status colour. */
export const StatTile = ({ label, value, sub, color = "#6B7280" }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="flex flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <p className="text-sm text-[#4B5563]">{label}</p>
    <p className="text-2xl font-semibold leading-8 text-primary">{value}</p>
    {sub ? (
      <p className="text-xs" style={{ color }}>
        {sub}
      </p>
    ) : null}
  </div>
);

export const StatGrid = ({ children, min = 200 }: { children: ReactNode; min?: number }) => (
  <div
    className="grid gap-4"
    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}
  >
    {children}
  </div>
);

/** Pill-styled tabs whose count badge turns dark when active (attendance design). */
export const CountTabs = <K extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  tabs: { key: K; label: string; count?: number | null }[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel: string;
  className?: string;
}) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className={cn(
      "flex max-w-full flex-wrap gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1",
      className
    )}
  >
    {tabs.map((tab) => {
      const on = tab.key === value;
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={on}
          onClick={() => onChange(tab.key)}
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm text-primary transition-colors",
            on
              ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              : "bg-transparent font-normal hover:bg-white/70"
          )}
        >
          {tab.label}
          {tab.count !== undefined && tab.count !== null && (
            <span
              className={cn(
                "rounded-full px-2 text-xs font-semibold",
                on ? "bg-primary text-white" : "bg-[#E5E7EB] text-[#374151]"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
