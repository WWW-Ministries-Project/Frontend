import {
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";

import { Modal } from "@/components/Modal";
import EllipsisIcon from "@/assets/ellipse.svg";
import SearchIcon from "@/assets/search.svg";
import EmptyStateImage from "@/assets/emptyState.svg";
import { cn } from "@/utils/cn";

import { memberStatusPill } from "./membershipUiUtils";

/* -------------------------------------------------------------------------- */
/*                                    Pills                                   */
/* -------------------------------------------------------------------------- */

export type PillTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

const PILL_TONES: Record<PillTone, string> = {
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
  warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  danger: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
  neutral: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
  primary: "border-primary/15 bg-primary/5 text-primary",
};

export const Pill = ({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      PILL_TONES[tone],
      className
    )}
  >
    {children}
  </span>
);

export const MemberStatusPill = ({
  member,
}: {
  member: { is_active?: boolean | null; status?: string | null };
}) => {
  const pill = memberStatusPill(member);
  return <Pill tone={pill.tone}>{pill.label}</Pill>;
};

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

export const PageHeading = ({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className="text-2xl font-semibold leading-8 text-primary">{title}</h1>
      {subtitle && (
        <p className="text-base leading-6 text-[#4B5563]">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const SectionHeading = ({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex min-w-0 flex-col gap-1">
      <h2 className="text-base font-semibold text-primary">{title}</h2>
      {description && <p className="text-sm text-[#4B5563]">{description}</p>}
    </div>
    {children && (
      <div className="flex flex-[1_1_320px] flex-wrap items-center justify-end gap-3">
        {children}
      </div>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                   Buttons                                  */
/* -------------------------------------------------------------------------- */

type ButtonTone = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_TONES: Record<ButtonTone, string> = {
  primary: "border-primary bg-primary text-white hover:bg-primary/90",
  secondary: "border-primary/30 bg-white text-primary hover:bg-primary/5",
  danger: "border-[#FECACA] bg-white text-[#B91C1C] hover:bg-[#FEF2F2]",
  ghost: "border-transparent bg-transparent text-[#4B5563] hover:text-primary",
};

export const UiButton = ({
  tone = "secondary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: {
  tone?: ButtonTone;
  size?: "md" | "sm";
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type={type}
    className={cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
      size === "md" ? "min-h-10 px-4 py-2" : "min-h-9 px-3 py-1.5",
      tone === "primary" && size === "md" && "px-5",
      BUTTON_TONES[tone],
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M13.9971 21C13.7822 21 13.5732 20.9317 13.4013 20.8054L9.40702 17.8865C9.28368 17.7959 9.18357 17.6783 9.11463 17.5432C9.04568 17.4081 9.00978 17.2592 9.00978 17.1081V13.5373L3.38984 6.10378C3.17102 5.81419 3.03856 5.47075 3.00722 5.11175C2.97589 4.75274 3.04691 4.39226 3.21237 4.07047C3.37783 3.74867 3.63123 3.47821 3.94434 3.28921C4.25745 3.1002 4.61798 3.00008 4.98575 3H19.0143C19.382 3.00008 19.7425 3.1002 20.0557 3.28921C20.3688 3.47821 20.6222 3.74867 20.7876 4.07047C20.9531 4.39226 21.0241 4.75274 20.9928 5.11175C20.9614 5.47075 20.829 5.81419 20.6102 6.10378L14.9902 13.5373V20.027C14.9902 20.2851 14.8856 20.5326 14.6993 20.715C14.5131 20.8975 14.2605 21 13.9971 21ZM10.996 16.6216L13.004 18.0879V13.2162C13.004 13.0057 13.0737 12.8008 13.2026 12.6324L19.0143 4.94595H4.98575L10.8013 12.6324C10.9303 12.8008 11 13.0057 11 13.2162L10.996 16.6216Z"
      fill="#474D66"
    />
  </svg>
);

export const FilterToggleButton = ({
  open,
  count,
  onClick,
}: {
  open: boolean;
  count: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={open}
    className={cn(
      "inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5",
      open ? "bg-primary/5" : "bg-white"
    )}
  >
    <FilterIcon />
    <span>Filters</span>
    {count > 0 && (
      <span className="rounded-full bg-primary px-2 text-xs font-semibold text-white">
        {count}
      </span>
    )}
  </button>
);

/* -------------------------------------------------------------------------- */
/*                                    Tabs                                    */
/* -------------------------------------------------------------------------- */

export interface PillTabItem<K extends string> {
  key: K;
  label: ReactNode;
  count?: number | null;
}

export const PillTabs = <K extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  className,
  size = "md",
}: {
  tabs: PillTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel: string;
  className?: string;
  size?: "md" | "sm";
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
            "inline-flex items-center gap-2 whitespace-nowrap rounded-lg text-sm text-primary transition-colors",
            size === "md" ? "px-4 py-2" : "px-3.5 py-1.5",
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
                on ? "bg-[#F3F4F6]" : "bg-white/70"
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

/** Tabs that sit at the bottom of the dark detail-page header band. */
export const BandTabs = <K extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: { key: K; label: ReactNode }[];
  value: K;
  onChange: (key: K) => void;
  ariaLabel: string;
}) => (
  <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-1 text-sm">
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
            "whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-sm transition-colors",
            on
              ? "bg-white font-semibold text-primary"
              : "bg-transparent font-normal text-white/80 hover:text-white"
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                    Inputs                                  */
/* -------------------------------------------------------------------------- */

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) => (
  <div className={cn("flex h-10 flex-[1_1_260px] items-center", className)}>
    <span className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-l-lg border border-lightGray bg-lightGray/30">
      <img src={SearchIcon} alt="" className="h-4" />
    </span>
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="h-10 min-w-0 flex-1 rounded-r-lg border border-l-0 border-[rgba(107,114,128,0.35)] bg-white px-3 text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]"
    />
  </div>
);

const controlClass = (hasError?: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-3 text-sm text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)] disabled:cursor-not-allowed disabled:bg-[#F8F9FC] disabled:opacity-60",
    hasError ? "border-[#B91C1C]" : "border-[rgba(107,114,128,0.35)]"
  );

export interface SelectOption {
  value: string;
  label: string;
}

export const Field = ({
  label,
  error,
  children,
  className,
}: {
  label: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={cn("flex flex-col gap-1", className)}>
    <span className="text-sm text-primary">{label}</span>
    {children}
    {error && (
      <span role="alert" className="text-xs text-[#B91C1C]">
        {error}
      </span>
    )}
  </label>
);

export const SelectInput = ({
  options,
  hasError,
  className,
  ...rest
}: {
  options: SelectOption[];
  hasError?: boolean;
} & SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(controlClass(hasError), "h-10", className)} {...rest}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const TextInput = ({
  hasError,
  className,
  ...rest
}: { hasError?: boolean } & InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(controlClass(hasError), "h-10", className)} {...rest} />
);

export const TextArea = ({
  hasError,
  className,
  ...rest
}: { hasError?: boolean } & TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    rows={3}
    className={cn(controlClass(hasError), "resize-y py-2 font-[inherit]", className)}
    {...rest}
  />
);

/* -------------------------------------------------------------------------- */
/*                                 Panels/cards                               */
/* -------------------------------------------------------------------------- */

export const FilterPanel = ({
  title,
  helper,
  onReset,
  resetDisabled,
  children,
}: {
  title: string;
  helper: string;
  onReset: () => void;
  resetDisabled?: boolean;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-lightGray bg-[#FAFBFC] p-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        <p className="text-sm text-[#4B5563]">{helper}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        disabled={resetDisabled}
        className="min-h-10 rounded-lg border border-lightGray bg-transparent px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Reset filters
      </button>
    </div>
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,180px),1fr))] gap-4">
      {children}
    </div>
  </div>
);

export const KpiCard = ({
  label,
  value,
  sub,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
}) => (
  <div className="flex flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <p className="text-sm text-[#4B5563]">{label}</p>
    <p className="text-2xl font-semibold leading-8 text-primary">{value}</p>
    {sub ? <p className="text-xs text-[#6B7280]">{sub}</p> : null}
  </div>
);

export const SectionEmpty = ({
  title,
  text,
  badge,
  action,
}: {
  title: string;
  text?: string;
  badge?: string;
  action?: ReactNode;
}) => (
  <section
    role="status"
    className="flex flex-wrap items-center gap-6 rounded-2xl border border-dashed border-lightGray bg-white p-6"
  >
    <div className="h-20 w-20 rounded-2xl border border-lightGray/70 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <img src={EmptyStateImage} alt="" className="h-full w-full object-contain" />
    </div>
    <div className="flex min-w-[220px] flex-1 flex-col gap-1">
      {badge && (
        <p className="self-start rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/70">
          {badge}
        </p>
      )}
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      {text && <p className="text-sm text-[#4B5563]">{text}</p>}
    </div>
    {action}
  </section>
);

export const BulkBar = ({
  label,
  actions,
  onClear,
}: {
  label: string;
  actions: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }[];
  onClear: () => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
    <span className="text-sm font-semibold text-[#1D4ED8]">{label}</span>
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "min-h-9 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-60",
            action.danger
              ? "border-[#FECACA] text-[#B91C1C]"
              : "border-primary/30 text-primary"
          )}
        >
          {action.label}
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="min-h-9 bg-transparent px-3 py-1.5 text-sm font-medium text-[#4B5563] hover:text-primary"
      >
        Clear selection
      </button>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                 Action menu                                */
/* -------------------------------------------------------------------------- */

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

export const ActionMenu = ({
  items,
  ariaLabel = "Actions",
  width = 220,
}: {
  items: ActionMenuItem[];
  ariaLabel?: string;
  width?: number;
}) => {
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

  const visible = items.filter((item) => !item.hidden);
  if (visible.length === 0) return null;

  return (
    <div ref={ref} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-lightGray bg-white transition-colors hover:bg-[#F8F9FC]"
      >
        <img src={EllipsisIcon} alt="" />
      </button>
      {open && (
        <div
          role="menu"
          style={{ width }}
          className="absolute right-0 top-full z-50 mt-2 rounded-md border border-[#E5E7EB] bg-white py-1 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]"
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[#F3F4F6]",
                item.danger ? "text-[#B91C1C]" : "text-primary"
              )}
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
/*                                  Grid table                                */
/* -------------------------------------------------------------------------- */

export interface GridColumn<T> {
  key: string;
  header: ReactNode;
  /** CSS grid track, e.g. `minmax(200px,2fr)` or `1.2fr`. */
  width: string;
  render: (row: T) => ReactNode;
}

/** Text cell with an optional muted second line. */
export const CellText = ({
  main,
  sub,
  strong,
}: {
  main: ReactNode;
  sub?: ReactNode;
  strong?: boolean;
}) => (
  <div className="min-w-0">
    <p className={cn("overflow-hidden text-ellipsis", strong ? "font-semibold" : "font-normal")}>
      {main === null || main === undefined || main === "" ? "—" : main}
    </p>
    {sub ? <p className="text-xs text-[#6B7280]">{sub}</p> : null}
  </div>
);

export const GridTable = <T,>({
  columns,
  rows,
  getRowId,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onRowClick,
  renderActions,
  actionsWidth = "200px",
  minWidth = "860px",
  loading,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleRow?: (id: string) => void;
  onToggleAll?: () => void;
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
  actionsWidth?: string;
  minWidth?: string;
  loading?: boolean;
}) => {
  const selected = selectedIds ?? [];
  const allSelected =
    rows.length > 0 && rows.every((row) => selected.includes(getRowId(row)));
  const template = [
    selectable ? "40px" : null,
    ...columns.map((column) => column.width),
    renderActions ? actionsWidth : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="overflow-x-auto rounded-lg border border-lightGray bg-white shadow-[0_8px_24px_rgba(8,13,45,0.08)]">
      <div style={{ minWidth }}>
        <div
          className="grid items-center gap-3 bg-lightGray px-6 py-4 text-sm font-semibold text-primary"
          style={{ gridTemplateColumns: template }}
        >
          {selectable && (
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onToggleAll?.()}
              aria-label="Select all"
              className="m-0 h-4 w-4 accent-primary"
            />
          )}
          {columns.map((column) => (
            <span key={column.key}>{column.header}</span>
          ))}
          {renderActions && <span />}
        </div>
        {loading && rows.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-[#F3F4F6]" />
            ))}
          </div>
        ) : (
          rows.map((row) => {
            const id = getRowId(row);
            const isSelected = selected.includes(id);
            return (
              <div
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "grid min-h-16 items-center gap-3 border-b border-lightGray px-6 py-3 text-sm text-primary transition-colors hover:bg-lightGray/20",
                  onRowClick ? "cursor-pointer" : "cursor-default",
                  isSelected ? "bg-primary/[0.04]" : "bg-white"
                )}
                style={{ gridTemplateColumns: template }}
              >
                {selectable && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleRow?.(id)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Select row"
                    className="m-0 h-4 w-4 accent-primary"
                  />
                )}
                {columns.map((column) => (
                  <div key={column.key} className="min-w-0">
                    {column.render(row)}
                  </div>
                ))}
                {renderActions && (
                  <div
                    className="flex flex-wrap justify-end gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {renderActions(row)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                    Dialog                                  */
/* -------------------------------------------------------------------------- */

export const DialogShell = ({
  open,
  onClose,
  title,
  subtitle,
  ctaLabel,
  ctaTone = "primary",
  onConfirm,
  loading,
  ctaDisabled,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  ctaLabel: string;
  ctaTone?: "primary" | "danger";
  onConfirm: () => void;
  loading?: boolean;
  ctaDisabled?: boolean;
  children?: ReactNode;
}) => (
  <Modal
    open={open}
    onClose={() => {
      if (!loading) onClose();
    }}
    persist={false}
    title={title}
    description={typeof subtitle === "string" ? subtitle : title}
    className="max-w-[520px] p-6 shadow-[0_10px_28px_rgba(8,13,45,0.2)]"
  >
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold leading-7 text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-[#4B5563]">{subtitle}</p>}
      </div>
      {children}
      <div className="flex justify-end gap-2">
        <UiButton tone="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </UiButton>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || ctaDisabled}
          className={cn(
            "inline-flex min-h-10 items-center justify-center rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            ctaTone === "danger"
              ? "bg-[#B91C1C] hover:bg-[#B91C1C]/90"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {loading ? "Working…" : ctaLabel}
        </button>
      </div>
    </div>
  </Modal>
);
