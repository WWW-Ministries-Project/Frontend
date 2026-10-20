import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

import { Pill, type PillTone, UiButton } from "../../MembershipManagement/components/membershipUi";

/**
 * Pieces only the Finance pages need. Generic parts (pills, tabs, inputs,
 * buttons, dialogs, drawers) come from the membership, communication and
 * appointments kits.
 */

type Tone = "muted" | "success" | "warning" | "danger";

const SUB_TONE: Record<Tone, string> = {
  muted: "text-[#6B7280]",
  success: "text-[#15803D]",
  warning: "text-[#B45309]",
  danger: "text-[#B91C1C]",
};

/** KPI tile. `alert` tints the border amber (warning) or red (danger). */
export const Kpi = ({
  label,
  value,
  sub,
  tone = "muted",
  alert,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  alert?: "warning" | "danger";
}) => (
  <div
    className={cn(
      "flex min-w-0 flex-col gap-1 rounded-xl border bg-white px-5 py-4",
      alert === "warning" ? "border-[#FDE68A]" : alert === "danger" ? "border-[#FECACA]" : "border-lightGray"
    )}
  >
    <span className="text-sm text-[#4B5563]">{label}</span>
    <span className="text-2xl font-semibold leading-8 text-primary">{value}</span>
    {sub ? <span className={cn("text-xs", SUB_TONE[tone])}>{sub}</span> : null}
  </div>
);

export const KpiGrid = ({ min = 200, children }: { min?: number; children: ReactNode }) => (
  <div
    className="grid gap-4"
    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}
  >
    {children}
  </div>
);

export interface AttentionAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface AttentionItem {
  key: string;
  pill: { label: string; tone: PillTone };
  title: string;
  text: string;
  actions: AttentionAction[];
}

/** Amber "Needs your attention" list. Renders nothing when empty. */
export const AttentionList = ({ items, limit = 6 }: { items: AttentionItem[]; limit?: number }) => {
  if (!items.length) return null;
  const shown = items.slice(0, limit);
  return (
    <section className="overflow-hidden rounded-xl border border-[#FDE68A] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FDE68A] bg-[#FFFBEB] px-5 py-4">
        <h2 className="text-base font-semibold text-primary">Needs your attention</h2>
        {items.length > limit && (
          <span className="text-xs text-[#6B7280]">
            Showing {limit} of {items.length}
          </span>
        )}
      </div>
      {shown.map((a) => (
        <div key={a.key} className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-5 py-4 last:border-b-0">
          <Pill tone={a.pill.tone}>{a.pill.label}</Pill>
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="font-semibold text-primary">{a.title}</p>
            <p className="text-sm text-[#4B5563]">{a.text}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {a.actions.map((b) => (
              <UiButton key={b.label} size="sm" tone={b.primary ? "primary" : "secondary"} onClick={b.onClick}>
                {b.label}
              </UiButton>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

const NOTE_TONES: Record<PillTone, string> = {
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
  warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  danger: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
  neutral: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
  primary: "border-primary/15 bg-primary/5 text-primary",
};

/** One-line status note under a page header. */
export const ToneNote = ({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) => (
  <p role="status" className={cn("rounded-lg border px-4 py-3 text-sm", NOTE_TONES[tone], className)}>
    {children}
  </p>
);

/** Dashed "nothing here" note. */
export const EmptyNote = ({ children }: { children: ReactNode }) => (
  <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-[#4B5563]">
    {children}
  </p>
);

export const BackLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="self-start bg-transparent p-0 text-sm text-[#4B5563] transition-colors hover:text-primary"
  >
    ← {label}
  </button>
);

/** Numbered step circle + heading, for the weekly record sections. */
export const StepHeading = ({ n, title, sub }: { n: number; title: string; sub?: string }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
      {n}
    </span>
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      {sub && <p className="text-xs text-[#6B7280]">{sub}</p>}
    </div>
  </div>
);

export const Bar = ({ percent, tone = "primary", thin }: { percent: number; tone?: "primary" | "success" | "danger"; thin?: boolean }) => (
  <div className={cn("overflow-hidden rounded-full bg-[#E5E7EB]", thin ? "h-1.5" : "h-2")}>
    <div
      className={cn("h-full", tone === "success" ? "bg-[#15803D]" : tone === "danger" ? "bg-[#B91C1C]" : "bg-primary")}
      style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
    />
  </div>
);

/** Caption + value pair used in cards and drawers. */
export const Fact = ({ label, value, valueClass }: { label: ReactNode; value: ReactNode; valueClass?: string }) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <span className="text-xs text-[#6B7280]">{label}</span>
    <span className={cn("font-semibold text-primary [overflow-wrap:anywhere]", valueClass)}>{value}</span>
  </div>
);

/** Small hint under a field. */
export const Hint = ({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) => (
  <span className={cn("text-xs", SUB_TONE[tone])}>{children}</span>
);
