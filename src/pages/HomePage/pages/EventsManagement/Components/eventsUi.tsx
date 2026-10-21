import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export {
  DialogShell,
  Field,
  KpiCard,
  PageHeading,
  Pill,
  SearchInput,
  SelectInput,
  TextArea,
  TextInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
export type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

/**
 * Pieces shared by the Events screens. Generic parts (pills, buttons, inputs,
 * dialogs) come from the membership kit so the modules look the same.
 */

/* -------------------------------------------------------------------------- */
/*                                 Segmented                                  */
/* -------------------------------------------------------------------------- */

export interface SegItem<K extends string> {
  key: K;
  label: ReactNode;
}

/**
 * The grey segmented control. `scroll` keeps it on one line and lets the row
 * scroll sideways on narrow screens; otherwise it wraps.
 */
export const Segmented = <K extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  role = "tablist",
  scroll,
  size = "md",
  className,
}: {
  items: SegItem<K>[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel: string;
  role?: "tablist" | "radiogroup";
  scroll?: boolean;
  size?: "md" | "lg";
  className?: string;
}) => {
  const group = (
    <div
      role={role}
      aria-label={ariaLabel}
      className={cn(
        "gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1",
        scroll ? "inline-flex" : "flex max-w-full flex-wrap self-start",
        !scroll && className
      )}
    >
      {items.map((item) => {
        const on = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role={role === "tablist" ? "tab" : "radio"}
            aria-selected={role === "tablist" ? on : undefined}
            aria-checked={role === "radiogroup" ? on : undefined}
            onClick={() => onChange(item.key)}
            className={cn(
              "whitespace-nowrap rounded-lg py-1.5 text-sm text-primary transition-colors",
              size === "lg" ? "px-4" : "px-3",
              on
                ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                : "bg-transparent font-normal hover:bg-white/70"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
  if (!scroll) return group;
  return <div className={cn("max-w-full overflow-x-auto", className)}>{group}</div>;
};

/* -------------------------------------------------------------------------- */
/*                                 Small bits                                 */
/* -------------------------------------------------------------------------- */

export const Dot = ({ color, size = 8 }: { color: string; size?: 6 | 8 }) => (
  <span
    aria-hidden="true"
    style={{ background: color, width: size, height: size }}
    className="inline-block flex-shrink-0 rounded-full"
  />
);

export const Switch = ({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={cn(
      "flex h-6 w-11 flex-shrink-0 rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
      on ? "justify-end bg-primary" : "justify-start bg-lightGray"
    )}
  >
    <span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
  </button>
);

/** Pressable chip, dark when on. `shape="box"` gives the weekday buttons. */
export const ToggleChip = ({
  on,
  onClick,
  children,
  shape = "pill",
  title,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  shape?: "pill" | "box";
  title?: string;
}) => (
  <button
    type="button"
    aria-pressed={on}
    title={title}
    onClick={onClick}
    className={cn(
      "border text-sm transition-colors",
      shape === "pill" ? "min-h-9 rounded-full px-3 py-1" : "min-h-10 min-w-12 rounded-lg px-2 py-1 font-medium",
      on ? "border-primary bg-primary text-white" : "border-lightGray bg-white text-primary hover:bg-[#F3F4F6]"
    )}
  >
    {children}
  </button>
);

export const FormSection = ({
  title,
  hint,
  aside,
  children,
}: {
  title: string;
  hint?: string;
  aside?: ReactNode;
  children?: ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        {hint && <span className="text-xs text-[#6B7280]">{hint}</span>}
      </div>
      {aside}
    </div>
    {children}
  </section>
);

export const MutedPanel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex flex-col gap-3 rounded-xl bg-[#F8F9FC] p-4", className)}>{children}</div>
);

export const FieldError = ({ id, message }: { id?: string; message?: string }) =>
  message ? (
    <span id={id} role="alert" className="text-xs text-[#B91C1C]">
      {message}
    </span>
  ) : null;

/* -------------------------------------------------------------------------- */
/*                                   Drawer                                   */
/* -------------------------------------------------------------------------- */

export const Drawer = ({
  open,
  onClose,
  width = 520,
  title,
  header,
  description,
  footer,
  busy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  width?: 520 | 640;
  title: string;
  /** Replaces the default title block. `title` is still used for screen readers. */
  header?: ReactNode;
  description?: string;
  footer?: ReactNode;
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
      <Dialog.Content
        style={{ maxWidth: width }}
        onInteractOutside={(event) => {
          // The global confirm dialog and toasts live outside this tree.
          const target = event.target as HTMLElement | null;
          if (target?.closest("dialog, [role='status'], [role='alert']")) event.preventDefault();
        }}
        className="fixed inset-y-0 right-0 z-[120] flex h-full w-full flex-col border-l border-lightGray bg-white focus:outline-none"
      >
        <div className="flex items-start gap-3 border-b border-[#E5E7EB] px-4 py-5 tablet:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {header ?? (
              <Dialog.Title className="text-xl font-semibold leading-7 text-primary">{title}</Dialog.Title>
            )}
            {header && <Dialog.Title className="sr-only">{title}</Dialog.Title>}
            <Dialog.Description className="sr-only">{description || title}</Dialog.Description>
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
        <div className="flex-1 overflow-y-auto px-4 py-6 tablet:px-6">
          <div className="flex flex-col gap-6">{children}</div>
        </div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#E5E7EB] px-4 py-4 tablet:px-6">
            {footer}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export const EmptyBox = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-lightGray bg-white px-4 py-8 text-center">
    <p className="text-base font-semibold text-primary">{title}</p>
    {action}
  </div>
);
