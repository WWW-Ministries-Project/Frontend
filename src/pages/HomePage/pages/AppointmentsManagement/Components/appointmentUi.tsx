import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode, useMemo, useState } from "react";

import { cn } from "@/utils/cn";

import { Pill, type PillTone, UiButton } from "../../MembershipManagement/components/membershipUi";
import type { CommDialogButton } from "../../ChurchCommunication/ui/commUi";
import { type ApptSlot, fmtD, t12 } from "../utils/appointmentModel";

/**
 * Pieces only the Appointments pages need. Generic parts (pills, tabs, inputs,
 * buttons, dialogs) come from the membership and communication kits.
 */

/** KPI tile that jumps to a tab or page when clicked. */
export const KpiButton = ({
  label,
  value,
  sub,
  subTone = "muted",
  alert,
  onClick,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  subTone?: "muted" | "success" | "warning" | "danger";
  alert?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 text-left text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(8,13,45,0.08)]",
      alert ? "border-[#FECACA]" : "border-lightGray"
    )}
  >
    <span className="text-sm text-[#4B5563]">{label}</span>
    <span className="text-2xl font-semibold leading-8">{value}</span>
    {sub && (
      <span
        className={cn(
          "text-xs",
          subTone === "success" && "text-[#15803D]",
          subTone === "warning" && "text-[#B45309]",
          subTone === "danger" && "text-[#B91C1C]",
          subTone === "muted" && "text-[#6B7280]"
        )}
      >
        {sub}
      </span>
    )}
  </button>
);

/** White card with a 16px heading and helper line. */
export const Panel = ({
  title,
  helper,
  action,
  className,
  children,
}: {
  title: ReactNode;
  helper?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <section className={cn("flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 sm:p-6", className)}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {helper && <p className="text-sm text-[#4B5563]">{helper}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

/** Horizontal meter with a label row above it. */
export const Meter = ({
  label,
  value,
  percent,
  tone = "primary",
}: {
  label: ReactNode;
  value: ReactNode;
  percent: number;
  tone?: "primary" | "warning" | "danger";
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between gap-3 text-sm text-primary">
      <span className="min-w-0">{label}</span>
      <span className="flex-shrink-0 font-semibold">{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
      <div
        className={cn(
          "h-full",
          tone === "danger" ? "bg-[#B91C1C]" : tone === "warning" ? "bg-[#B45309]" : "bg-primary"
        )}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  </div>
);

/** Small coloured square + label for chart legends. */
export const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-[#4B5563]">
    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
    {label}
  </span>
);

/** Grid of free sessions to pick one from. */
export const SlotPicker = ({
  label,
  slots,
  value,
  onChange,
  help,
}: {
  label: string;
  slots: ApptSlot[];
  value: ApptSlot | null;
  onChange: (slot: ApptSlot) => void;
  help?: string;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-primary">{label}</span>
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const on = !!value && value.date === slot.date && value.start === slot.start;
        return (
          <button
            key={slot.date + slot.start}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(slot)}
            className={cn(
              "min-h-11 flex-[1_1_150px] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none",
              on ? "border-primary bg-primary text-white" : "border-lightGray bg-white text-primary hover:bg-[#F8F9FC]"
            )}
          >
            {fmtD(slot.date)} · {t12(slot.start)}
          </button>
        );
      })}
      {slots.length === 0 && (
        <p className="text-sm text-[#6B7280]">No free sessions in the next three weeks. Try another person.</p>
      )}
    </div>
    {help && <span className="text-xs text-[#6B7280]">{help}</span>}
  </div>
);

/** Search-as-you-type picker over the member options already in the store. */
export const MemberPicker = ({
  options,
  value,
  onChange,
  hasError,
  placeholder = "Search members",
  exclude = [],
}: {
  options: { label: string; value: string | number }[];
  value: { id: string; name: string } | null;
  onChange: (member: { id: string; name: string } | null) => void;
  hasError?: boolean;
  placeholder?: string;
  exclude?: string[];
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter((option) => !exclude.includes(String(option.value)) && option.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [options, query, exclude]);

  if (value) {
    return (
      <div className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-[rgba(107,114,128,0.35)] bg-[#F8F9FC] px-3">
        <span className="truncate text-sm font-semibold text-primary">{value.name}</span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          className="text-sm font-medium text-[#4B5563] underline hover:text-primary"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]",
          hasError ? "border-[#B91C1C]" : "border-[rgba(107,114,128,0.35)]"
        )}
      />
      {open && query.trim() && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-[#E5E7EB] bg-white py-1 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
        >
          {matches.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange({ id: String(option.value), name: option.label });
                setOpen(false);
              }}
              className="block w-full px-4 py-3 text-left text-sm text-primary hover:bg-[#F3F4F6]"
            >
              {option.label}
            </button>
          ))}
          {matches.length === 0 && <p className="px-4 py-3 text-sm text-[#6B7280]">No members match.</p>}
        </div>
      )}
    </div>
  );
};

/**
 * Right-hand drawer for one record. Full width on phones; footer buttons
 * stretch there so they're easy to tap.
 */
export const SideDrawer = ({
  open,
  onClose,
  pill,
  title,
  subtitle,
  buttons,
  busy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  pill?: { label: string; tone: PillTone };
  title: string;
  subtitle?: string;
  buttons: CommDialogButton[];
  busy?: boolean;
  children: ReactNode;
}) => (
  <Dialog.Root
    open={open}
    onOpenChange={(next) => {
      if (!next && !busy) onClose();
    }}
  >
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[120] bg-primary/45" />
      <Dialog.Content className="fixed inset-y-0 right-0 z-[120] flex h-full w-full flex-col border-l border-lightGray bg-white focus:outline-none sm:w-[min(520px,100%)]">
        <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-5 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {pill && (
              <span className="self-start">
                <Pill tone={pill.tone}>{pill.label}</Pill>
              </span>
            )}
            <Dialog.Title className="text-xl font-semibold leading-7 text-primary">{title}</Dialog.Title>
            <Dialog.Description className={cn("text-sm text-[#4B5563]", !subtitle && "sr-only")}>
              {subtitle || title}
            </Dialog.Description>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="h-9 w-9 flex-shrink-0 rounded-lg text-xl text-[#6B7280] hover:bg-[#F3F4F6]"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-5">{children}</div>
        </div>
        {buttons.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#E5E7EB] px-5 py-4 sm:px-6">
            {buttons.map((button) => (
              <UiButton
                key={button.label}
                tone={button.tone ?? "secondary"}
                onClick={button.onClick}
                disabled={busy || button.disabled}
                className={cn(
                  "min-h-11 flex-auto sm:flex-none",
                  button.tone === "ghost" && "text-primary hover:bg-primary/5"
                )}
              >
                {button.label}
              </UiButton>
            ))}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
