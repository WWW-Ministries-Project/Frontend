import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

import { UiButton } from "../../MembershipManagement/components/membershipUi";
import { initials, LEVEL_DOT, LEVEL_DOT_BORDER } from "../utils/settingsModel";

/**
 * Pieces shared by the Settings screens. Generic parts (pills, buttons, tabs,
 * inputs, dialogs) come from the membership and communication kits.
 */

export const Avatar = ({ name, size = 36, className }: { name: string; size?: 28 | 32 | 36 | 48; className?: string }) => (
  <span
    aria-hidden="true"
    style={{ width: size, height: size }}
    className={cn(
      "flex flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700",
      size === 48 ? "text-base" : "text-xs",
      className
    )}
  >
    {initials(name)}
  </span>
);

/** Coloured dot for an access level (rank 0–3). */
export const LevelDot = ({ rank, size = 8 }: { rank: number; size?: 8 | 10 }) => (
  <span
    aria-hidden="true"
    style={{ width: size, height: size, background: LEVEL_DOT[rank], borderColor: LEVEL_DOT_BORDER[rank] }}
    className="inline-block flex-shrink-0 rounded-full border"
  />
);

export const RemovableChip = ({
  label,
  onRemove,
  tone = "muted",
}: {
  label: string;
  /** Omit to render a read-only chip. */
  onRemove?: () => void;
  tone?: "muted" | "white";
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-0.5 rounded-full border border-lightGray py-0.5 pl-2.5 text-xs font-medium text-primary",
      onRemove ? "pr-1" : "pr-2.5",
      tone === "white" ? "bg-white" : "bg-inputBackground"
    )}
  >
    {label}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-sm leading-none text-gray-500 hover:bg-gray-100"
      >
        ×
      </button>
    )}
  </span>
);

/**
 * People shown as removable chips with an "Add a person…" select after them.
 * `options` should already leave out the people who are picked.
 */
export const PeopleChips = ({
  people,
  options,
  onAdd,
  onRemove,
  addLabel,
  placeholder = "Add a person…",
  emptyText = "No one",
  disabled,
  hasError,
  framed = true,
  tone = "muted",
}: {
  people: { id: number; name: string }[];
  options: { id: number; name: string }[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
  /** Accessible name for the select. */
  addLabel: string;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  hasError?: boolean;
  framed?: boolean;
  tone?: "muted" | "white";
}) => (
  <div
    className={cn(
      "flex flex-wrap items-center gap-2",
      framed && "rounded-lg border p-3",
      framed && (hasError ? "border-red-700" : "border-lightGray")
    )}
  >
    {people.map((person) => (
      <RemovableChip
        key={person.id}
        label={person.name}
        tone={tone}
        onRemove={disabled ? undefined : () => onRemove(person.id)}
      />
    ))}
    {!people.length && <span className="text-xs text-gray-500">{emptyText}</span>}
    {!disabled && (
      <select
        value=""
        onChange={(event) => {
          const id = Number(event.target.value);
          if (id) onAdd(id);
        }}
        aria-label={addLabel}
        className="h-10 max-w-[220px] rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    )}
  </div>
);

/** Segmented radio group (TabSelection look). */
export const Segmented = <K extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled,
  stretch,
  role = "radiogroup",
}: {
  /** `disabled` + `title` on an option lock just that choice (e.g. above your own access). */
  options: { value: K; label: ReactNode; disabled?: boolean; title?: string }[];
  value: K;
  onChange: (value: K) => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Buttons share the row equally. */
  stretch?: boolean;
  role?: "radiogroup" | "tablist";
}) => (
  <div
    role={role}
    aria-label={ariaLabel}
    className="flex flex-wrap gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1"
  >
    {options.map((option) => {
      const on = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role={role === "tablist" ? "tab" : "radio"}
          aria-checked={role === "tablist" ? undefined : on}
          aria-selected={role === "tablist" ? on : undefined}
          disabled={disabled || option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-primary transition-colors disabled:cursor-default",
            stretch && "flex-auto",
            option.disabled && !disabled && "opacity-60",
            on
              ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              : "bg-transparent font-normal enabled:hover:bg-white/70"
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

/** Sticky footer that appears while a page has unsaved changes. */
export const UnsavedBar = ({
  title,
  subtitle,
  onDiscard,
  onSave,
  saving,
}: {
  title: string;
  subtitle?: string;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
}) => (
  <div
    role="region"
    aria-label="Unsaved changes"
    className="sticky bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-lightGray bg-white px-4 py-3 shadow-[0_-4px_12px_rgb(var(--color-shadow)_/_0.08)] tablet:px-6"
  >
    <div className="flex flex-col">
      <p className="text-sm font-semibold text-primary">{title}</p>
      {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
    </div>
    <div className="flex gap-2">
      <UiButton tone="secondary" onClick={onDiscard} disabled={saving}>
        Discard
      </UiButton>
      <UiButton tone="primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </UiButton>
    </div>
  </div>
);

/** Right-hand drawer. Full width on phones. */
export const SettingsDrawer = ({
  open,
  onClose,
  width = 480,
  header,
  title,
  description,
  footer,
  busy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  width?: 480 | 600;
  /** Replaces the default title block (e.g. avatar + name). Still pass `title` for screen readers. */
  header?: ReactNode;
  title: string;
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
        className="fixed inset-y-0 right-0 z-[120] flex h-full w-full flex-col border-l border-lightGray bg-white focus:outline-none"
      >
        <div className="flex items-start gap-3 border-b border-gray-200 px-6 py-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {header ?? (
              <>
                <Dialog.Title className="text-xl font-semibold leading-7 text-primary">{title}</Dialog.Title>
              </>
            )}
            {header && <Dialog.Title className="sr-only">{title}</Dialog.Title>}
            <Dialog.Description className={cn("text-sm text-gray-600", (!description || Boolean(header)) && "sr-only")}>
              {description || title}
            </Dialog.Description>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="h-9 w-9 flex-shrink-0 rounded-lg text-xl text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">{children}</div>
        </div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-6 py-4">{footer}</div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

/** Section heading inside drawers and cards. */
export const SubHeading = ({ title, text, children }: { title: string; text?: ReactNode; children?: ReactNode }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
    <div className="flex flex-col">
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
    {children}
  </div>
);
