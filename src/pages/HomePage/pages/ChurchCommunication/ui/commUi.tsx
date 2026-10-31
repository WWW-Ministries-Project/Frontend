import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode, useId, useRef, useState } from "react";

import { cn } from "@/utils/cn";

import { UiButton } from "../../MembershipManagement/components/membershipUi";

/**
 * Pieces shared by the five Communication pages (themes, community,
 * promotions, sermons, messaging). Everything generic — pills, tabs, inputs,
 * buttons, KPI cards — comes from the membership UI kit; this file only holds
 * what those pages need on top of it.
 */

/* -------------------------------------------------------------------------- */
/*                                 Small parts                                */
/* -------------------------------------------------------------------------- */

/** Dashed box shown when a filtered list has nothing to show. */
export const ListEmpty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">
    {children}
  </p>
);

/** On/off switch (role="switch"). */
export const ToggleSwitch = ({
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
      "flex h-6 w-11 flex-shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-60",
      on ? "justify-end bg-primary" : "justify-start bg-lightGray"
    )}
  >
    <span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
  </button>
);

/** Row of options where exactly one is chosen, styled as outlined buttons. */
export const ChoiceButtons = <K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: K; label: string }[];
  value: K;
  onChange: (value: K) => void;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-primary">{label}</span>
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-10 flex-[1_1_140px] rounded-lg border px-3 py-2 text-sm text-primary transition-colors",
              on ? "border-primary bg-primary/5 font-semibold" : "border-lightGray bg-white font-normal hover:bg-inputBackground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);

/** A checkbox with a bold label and a helper line, in a muted box. */
export const CheckCard = ({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  help?: string;
}) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-lightGray bg-inputBackground px-4 py-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-0.5 h-4 w-4 accent-primary"
    />
    <span className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-primary">{label}</span>
      {help && <span className="text-xs text-gray-500">{help}</span>}
    </span>
  </label>
);

/** Toggleable pill, dark when on. */
export const ChipToggle = ({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={cn(
      "min-h-8 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
      on ? "border-primary bg-primary text-white" : "border-lightGray bg-white text-gray-700 hover:bg-inputBackground"
    )}
  >
    {children}
  </button>
);

/** Outlined toggle button used for channel pickers ("SMS", "Email"…). */
export const OptionToggle = ({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={cn(
      "min-h-9 rounded-lg border px-3 py-1.5 text-sm font-medium text-primary transition-colors",
      on ? "border-primary bg-primary/5" : "border-lightGray bg-white hover:bg-inputBackground"
    )}
  >
    {children}
  </button>
);

/** "+ first name" chips that insert a {placeholder}. */
export const PlaceholderChips = ({
  chips,
  onAdd,
  counter,
}: {
  chips: { token: string; label: string }[];
  onAdd: (token: string) => void;
  counter?: ReactNode;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {chips.map((chip) => (
      <button
        key={chip.token}
        type="button"
        onClick={() => onAdd(chip.token)}
        className="min-h-7 rounded-full border border-dashed border-lightGray bg-inputBackground px-2.5 py-0.5 text-xs text-gray-700 hover:bg-white"
      >
        + {chip.label}
      </button>
    ))}
    {counter !== undefined && <span className="ml-auto text-xs text-gray-500">{counter}</span>}
  </div>
);

/** Small help/error line under a control. */
export const FieldHint = ({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" | "warning" }) => (
  <span
    role={tone === "error" ? "alert" : undefined}
    className={cn(
      "text-xs",
      tone === "error" ? "text-red-700" : tone === "warning" ? "text-amber-700" : "text-gray-500"
    )}
  >
    {children}
  </span>
);

/* -------------------------------------------------------------------------- */
/*                             Dark banner preview                            */
/* -------------------------------------------------------------------------- */

/** Dark 16:9 card standing in for a mobile Home banner or theme hero. */
export const BannerPreview = ({
  kicker,
  title,
  subtitle,
  cta,
  imageUrl,
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  cta?: string;
  imageUrl?: string | null;
  className?: string;
}) => (
  <div
    className={cn(
      "relative flex aspect-video max-h-60 flex-col justify-end gap-1 overflow-hidden rounded-xl bg-primary p-5 text-white",
      className
    )}
  >
    {imageUrl && (
      <>
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
      </>
    )}
    <div className="relative flex flex-col gap-1">
      {kicker && <span className="text-xs font-semibold text-white/70">{kicker}</span>}
      <p className="text-xl font-semibold leading-7">{title}</p>
      {subtitle && <p className="line-clamp-2 text-sm text-white/85">{subtitle}</p>}
      {cta && (
        <span className="mt-1 self-start rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-primary">
          {cta}
        </span>
      )}
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                 Image field                                */
/* -------------------------------------------------------------------------- */

/** Dashed drop zone for one image. Shows the current image once chosen. */
export const ImageDropField = ({
  label,
  help,
  previewUrl,
  onFile,
  onClear,
  clearLabel = "Remove image",
  busy,
}: {
  label: string;
  help: string;
  previewUrl?: string | null;
  onFile: (file: File) => void;
  onClear?: () => void;
  clearLabel?: string;
  busy?: boolean;
}) => {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-primary">{label}</span>
      {previewUrl ? (
        <div className="flex flex-col gap-2">
          <img src={previewUrl} alt="" className="aspect-video max-h-60 w-full rounded-lg border border-lightGray object-cover" />
          <div className="flex flex-wrap gap-2">
            <UiButton size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              Replace image
            </UiButton>
            {onClear && (
              <UiButton size="sm" tone="ghost" onClick={onClear} disabled={busy}>
                {clearLabel}
              </UiButton>
            )}
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            take(event.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-5 text-center",
            dragging ? "border-primary bg-primary/5" : "border-lightGray bg-inputBackground"
          )}
        >
          <p className="text-sm font-semibold text-primary">{busy ? "Uploading…" : "Drop an image or browse"}</p>
          <p className="text-xs text-gray-500">{help}</p>
        </label>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Dialog                                   */
/* -------------------------------------------------------------------------- */

export interface CommDialogButton {
  label: string;
  onClick: () => void;
  tone?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
}

/**
 * Form/detail dialog: header with title and subtitle, scrolling body, footer
 * buttons. Full screen on phones. With three or more buttons the first one
 * (usually Cancel/Close) sits on the left.
 */
export const CommDialog = ({
  open,
  onClose,
  title,
  subtitle,
  busy,
  width = 672,
  errors,
  buttons,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  busy?: boolean;
  width?: number;
  /** Shown as a summary above the fields after a failed save. */
  errors?: string[];
  buttons: CommDialogButton[];
  children: ReactNode;
}) => (
  <Dialog.Root
    open={open}
    onOpenChange={(next) => {
      if (!next && !busy) onClose();
    }}
  >
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[130] bg-primary/45" />
      <div className="fixed inset-0 z-[130] flex items-stretch justify-center sm:items-center sm:p-4">
        <Dialog.Content
          style={{ maxWidth: width }}
          className="flex h-full w-full flex-col overflow-hidden bg-white focus:outline-none sm:h-auto sm:max-h-[calc(100dvh-32px)] sm:rounded-2xl sm:border sm:border-lightGray"
        >
          <div className="flex items-start gap-3 border-b border-gray-200 px-6 py-5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Dialog.Title className="text-xl font-semibold leading-7 text-primary">{title}</Dialog.Title>
              <Dialog.Description className={cn("text-sm text-gray-600", !subtitle && "sr-only")}>
                {subtitle || title}
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
            <div className="flex flex-col gap-4">
              {errors && errors.length > 0 && (
                <div role="alert" className="flex flex-col gap-1 rounded-lg border border-error/25 bg-error/5 px-4 py-3 text-sm">
                  <p className="font-semibold text-primary">
                    {errors.length > 1 ? `${errors.length} things need attention` : "Check this before saving"}
                  </p>
                  {errors.map((error) => (
                    <p key={error} className="text-error">
                      · {error}
                    </p>
                  ))}
                </div>
              )}
              {children}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {buttons.map((button, index) => (
              <UiButton
                key={button.label}
                tone={button.tone === "danger" ? "danger" : button.tone ?? "secondary"}
                onClick={button.onClick}
                disabled={busy || button.disabled}
                className={cn(
                  "flex-auto sm:flex-none",
                  index === 0 && buttons.length > 2 && "sm:mr-auto",
                  button.tone === "ghost" && "text-primary hover:bg-primary/5"
                )}
              >
                {busy && button.tone === "primary" ? "Saving…" : button.label}
              </UiButton>
            ))}
          </div>
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  </Dialog.Root>
);

/** Two-column (auto-fit) grid for dialog fields; `full` children span both. */
export const FieldGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">{children}</div>
);

export const FullRow = ({ children }: { children: ReactNode }) => <div className="col-span-full">{children}</div>;
