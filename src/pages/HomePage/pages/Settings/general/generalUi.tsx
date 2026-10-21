import type { ReactNode } from "react";

import { InlineAlert } from "@/components/feedback";
import { cn } from "@/utils/cn";

/** Section heading: 20px title, one-line description, optional action. */
export const SectionTitle = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
    <div className="flex min-w-0 flex-col gap-0.5">
      <h2 className="text-xl font-semibold leading-7 text-primary">{title}</h2>
      <p className="text-sm text-[#4B5563]">{text}</p>
    </div>
    {action}
  </div>
);

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("overflow-hidden rounded-xl border border-lightGray bg-white", className)}>{children}</div>
);

/** Muted strip at the top of a card. */
export const CardHead = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] bg-[#F8F9FC] px-4 py-3">
    {children}
  </div>
);

const Bar = ({ className }: { className?: string }) => (
  <span className={cn("block animate-pulse rounded bg-lightGray/60", className)} />
);

/** Placeholder rows while a section loads. */
export const RowsSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <Card>
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-[#E5E7EB] p-4 last:border-b-0">
          <div className="flex flex-1 flex-col gap-2">
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-64 max-w-full" />
          </div>
          <Bar className="h-10 w-28" />
        </div>
      ))}
    </div>
  </Card>
);

export const CardsSkeleton = ({ count = 3 }: { count?: number }) => (
  <div aria-busy="true" aria-label="Loading" className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
        <Bar className="h-5 w-40" />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-2/3" />
      </div>
    ))}
  </div>
);

/** Shown when a section's data didn't load. */
export const LoadFailed = ({ what, onRetry }: { what: string; onRetry: () => void }) => (
  <InlineAlert tone="error" title={`Couldn't load ${what}`} action={{ label: "Try again", onClick: onRetry }}>
    Check your connection and try again.
  </InlineAlert>
);

/** Program chip: dark when picked. */
export const ProgramChip = ({
  on,
  onClick,
  disabled,
  children,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default",
      on ? "border-primary bg-primary text-white" : "border-lightGray bg-white text-primary enabled:hover:bg-[#F8F9FC]"
    )}
  >
    {children}
  </button>
);
