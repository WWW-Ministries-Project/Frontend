/** SoM data-display primitives: horizontal bar chart, timeline, thumbnail, kebab menu. */
import { cn } from "@/utils/cn";
import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Tone, TONE_DOT } from "./uiTokens";

export type BarDatum = {
  label: ReactNode;
  value: number; // 0..max
  display?: ReactNode; // text shown at the end of the bar (defaults to value)
  tone?: "primary" | "gold" | "danger";
  trailing?: ReactNode; // e.g. a mode pill before the value
};

const BAR_FILL = {
  primary: "bg-primary",
  gold: "bg-secondary",
  danger: "bg-red-600",
} as const;

/** Horizontal bar chart card body (prototype Reports). */
export const BarChart = ({
  data,
  max = 100,
  className,
}: {
  data: BarDatum[];
  max?: number;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-3", className)}>
    {data.map((d, i) => (
      <div key={i} className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-2 truncate text-gray-700">{d.label}</span>
          <span className="flex items-center gap-2 font-semibold text-primary">
            {d.trailing}
            {d.display ?? d.value}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn("h-full rounded-full", BAR_FILL[d.tone ?? "primary"])}
            style={{ width: `${Math.max(0, Math.min(100, (d.value / max) * 100))}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);

export type Step = { label: ReactNode; value?: ReactNode; done?: boolean; tone?: Tone };

/** Vertical status timeline (prototype submission status). */
export const StatusSteps = ({ steps, className }: { steps: Step[]; className?: string }) => (
  <div className={cn("flex flex-col", className)}>
    {steps.map((s, i) => {
      const last = i === steps.length - 1;
      const dot = s.done ? TONE_DOT[s.tone ?? "green"] : "bg-white border-2 border-gray-300";
      return (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("mt-1 size-3.5 flex-shrink-0 rounded-full", dot)} />
            {!last && <span className={cn("min-h-7 w-0.5 flex-1", s.done ? "bg-green-500" : "bg-gray-200")} />}
          </div>
          <div className="pb-3.5">
            <p className="text-sm font-semibold text-primary">{s.label}</p>
            {s.value && <p className="text-[13px] text-mainGray">{s.value}</p>}
          </div>
        </div>
      );
    })}
  </div>
);

/** Content-library style thumbnail block. */
export const Thumbnail = ({
  badge,
  icon,
  className,
}: {
  badge?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) => (
  <div className={cn("relative flex h-24 items-center justify-center rounded-lg bg-gray-100 text-mainGray", className)}>
    {icon}
    {badge && <span className="absolute left-2 top-2">{badge}</span>}
  </div>
);

export type MenuAction = { label: string; onClick: () => void; danger?: boolean; icon?: ReactNode };

/** Kebab (⋮) action menu. */
export const KebabMenu = ({ actions, label = "Actions" }: { actions: MenuAction[]; label?: string }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    // Any scroll (page or the table's own overflow wrapper) would detach the
    // fixed-position menu from its trigger, so close it instead of letting it float.
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const rect = triggerRef.current?.getBoundingClientRect();

  return (
    <div className="inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex size-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            // Portaled to document.body with fixed positioning so the table's
            // overflow-x wrapper and the Panel's overflow-hidden can't clip it.
            className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            style={{
              top: rect.bottom + 4,
              left: Math.max(8, rect.right - 160),
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  a.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                  a.danger ? "text-red-700" : "text-primary"
                )}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
