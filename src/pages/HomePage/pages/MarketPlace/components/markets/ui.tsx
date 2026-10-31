import type { ReactNode } from "react";

import { cn } from "@/utils/cn";
import { card } from "./styles";

/**
 * Small presentational primitives shared by the admin marketplace screens
 * (markets, market detail, products, product editor). They mirror the
 * Marketplace design spec: 8px radius 40px buttons, 12px radius cards with a
 * #D8DAE5 border, and pill tabs with counts.
 */

export interface PillTab<T extends string = string> {
  label: T;
  count: number;
}

/** Outline pill buttons with a count bubble; the active one is filled. */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  size = "md",
}: {
  tabs: PillTab<T>[];
  value: T;
  onChange: (tab: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {tabs.map((t) => {
        const on = t.label === value;
        return (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.label)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
              size === "sm" ? "px-3 py-1.5" : "gap-2 px-3.5 py-2",
              on
                ? "border-primary bg-primary text-white"
                : "border-lightGray bg-white text-primary hover:bg-gray-50"
            )}
          >
            {t.label}
            <span
              className={cn(
                "min-w-[22px] rounded-full px-1.5 text-center text-xs",
                on ? "bg-white/20" : "bg-gray-100"
              )}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Page title block used at the top of admin marketplace list pages. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold leading-8 text-primary">
          {title}
        </h1>
        {subtitle && <p className="text-base text-primaryGray">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={cn(card, "px-5 py-4")}>
      <p className="text-sm text-primaryGray">{label}</p>
      <p className="text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}
