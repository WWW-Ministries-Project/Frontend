import { cn } from "@/utils/cn";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { initials } from "./somUtils";
import { Checkbox } from "./uiControls";
import { Tone, TONE, resolveStatusTone } from "./uiTokens";

// Re-export the token layer + sibling primitive modules so every existing
// `from "./ui"` importer keeps working and gains the new primitives.
/* eslint-disable react-refresh/only-export-components */
export * from "./uiTokens";
export * from "./uiControls";
export * from "./uiLayout";
export * from "./uiData";
/* eslint-enable react-refresh/only-export-components */

export const Pill = ({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      TONE[tone],
      className
    )}
  >
    {children}
  </span>
);

export const StatusPill = ({
  status,
  label,
  tone,
}: {
  status: string;
  label?: string;
  tone?: Tone;
}) => <Pill tone={tone ?? resolveStatusTone(status)}>{label ?? status}</Pill>;

const AV_SIZE = {
  sm: "size-7 text-[11px]",
  md: "size-8 text-xs",
  lg: "size-11 text-sm",
  xl: "size-14 text-base",
} as const;

export const Avatar = ({
  name,
  size = "md",
  shape = "circle",
  tone = "muted",
  className,
}: {
  name: string;
  size?: keyof typeof AV_SIZE;
  shape?: "circle" | "square";
  tone?: "muted" | "navy";
  className?: string;
}) => (
  <span
    aria-hidden
    className={cn(
      "inline-flex flex-shrink-0 items-center justify-center font-semibold",
      AV_SIZE[size],
      shape === "circle" ? "rounded-full" : "rounded-xl",
      tone === "navy" ? "bg-primary text-white" : "bg-neutralGray text-primary",
      className
    )}
  >
    {initials(name)}
  </span>
);

export const ProgressBar = ({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "white" | "gold";
}) => (
  <div
    role="progressbar"
    aria-valuenow={Math.round(value)}
    aria-valuemin={0}
    aria-valuemax={100}
    className={cn(
      "h-1.5 w-full overflow-hidden rounded-full",
      tone === "white" ? "bg-[#fff]/25" : "bg-gray-200",
      className
    )}
  >
    <div
      className={cn(
        "h-full rounded-full",
        tone === "white" ? "bg-[#fff]" : tone === "gold" ? "bg-secondary" : "bg-primary"
      )}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

export const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-1">
      {eyebrow && <p className="text-[13px] text-mainGray">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold text-primary">{title}</h1>
      {subtitle && <p className="max-w-2xl text-sm text-primaryGray">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

type BtnVariant = "primary" | "secondary" | "ghost" | "onDark" | "onDarkSolid" | "danger";

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  variant?: BtnVariant;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: "button" | "submit";
};

const BTN: Record<BtnVariant, string> = {
  primary: "bg-primary text-white hover:bg-lighter",
  secondary: "border border-lightGray bg-white text-primary hover:bg-gray-50",
  ghost: "text-primary hover:underline",
  onDark: "border border-[#fff]/40 bg-transparent text-[#fff] hover:bg-[#fff]/10",
  onDarkSolid: "bg-[#fff] text-[#080D2D] hover:bg-[#F3F4F6]",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

export const Btn = ({
  children,
  onClick,
  to,
  variant = "secondary",
  size = "md",
  disabled,
  className,
  title,
  type = "button",
}: BtnProps) => {
  const classes = cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variant !== "ghost" && (size === "sm" ? "h-8 px-3" : "h-10 px-4"),
    BTN[variant],
    className
  );
  if (to) {
    return (
      <Link to={to} className={classes} title={title}>
        {children}
      </Link>
    );
  }
  return (
    // eslint-disable-next-line react/button-has-type
    <button type={type} onClick={onClick} disabled={disabled} className={classes} title={title}>
      {children}
    </button>
  );
};

export const Panel = ({
  title,
  action,
  children,
  className,
  bodyClassName,
  icon,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: ReactNode;
}) => (
  <section className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white", className)}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          {title && <h3 className="text-[15px] font-semibold text-primary">{title}</h3>}
        </div>
        {action}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const Kpi = ({
  label,
  value,
  sub,
  delta,
  to,
  onClick,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: ReactNode;
  to?: string;
  onClick?: () => void;
  tone?: "default" | "warn" | "good";
}) => {
  const valueColor =
    tone === "warn" ? "text-red-700" : tone === "good" ? "text-green-700" : "text-primary";
  const body = (
    <>
      <p className="text-[13px] text-mainGray">{label}</p>
      <p className="flex items-baseline gap-1.5">
        <span className={cn("text-[26px] font-bold leading-tight", valueColor)}>{value}</span>
        {delta && <span className="text-xs font-semibold text-green-700">{delta}</span>}
      </p>
      {sub && <p className="text-xs text-mainGray">{sub}</p>}
    </>
  );
  const classes =
    "flex flex-col gap-1 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left";
  const interactive = "transition hover:border-lightGray hover:shadow-sm";
  if (to) {
    return (
      <Link to={to} className={cn(classes, interactive)}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, interactive)}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
};

export type Column<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
};

export function SimpleTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  minWidth = 640,
  selectable,
  isSelected,
  onToggleRow,
  allSelected,
  onToggleAll,
  bulkBar,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  minWidth?: number;
  /** Optional row selection (prototype gradebook / roster bulk actions). */
  selectable?: boolean;
  isSelected?: (row: T) => boolean;
  onToggleRow?: (row: T) => void;
  allSelected?: boolean;
  onToggleAll?: (next: boolean) => void;
  bulkBar?: ReactNode;
}) {
  if (!rows.length && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto">
      {bulkBar}
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mainGray">
            {selectable && (
              <th scope="col" className="w-10 px-4 py-2.5">
                <Checkbox checked={!!allSelected} onChange={(n) => onToggleAll?.(n)} label="Select all" />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-4 py-2.5 font-semibold", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-gray-100 last:border-0",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
            >
              {selectable && (
                <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected?.(row) ?? false}
                    onChange={() => onToggleRow?.(row)}
                    label="Select row"
                  />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 align-middle text-primary", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const EmptyBlock = ({ msg, action }: { msg: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-lightGray px-6 py-10 text-center text-sm text-primaryGray">
    <p>{msg}</p>
    {action}
  </div>
);

export const LoadError = ({ msg, onRetry }: { msg: string; onRetry: () => void }) => (
  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
    <span>{msg}</span>
    <Btn size="sm" onClick={onRetry}>Try again</Btn>
  </div>
);

export type Crumb = { label: string; to?: string };

/** Dark workspace band from the prototype: breadcrumbs, title, meta, actions and tabs. */
export const WorkspaceHeader = ({
  crumbs,
  title,
  status,
  meta,
  actions,
  tabs,
  activeTab,
  onTab,
  aside,
  extra,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  status?: ReactNode;
  meta?: ReactNode[];
  actions?: ReactNode;
  tabs?: string[];
  activeTab?: string;
  onTab?: (tab: string) => void;
  aside?: ReactNode;
  extra?: ReactNode;
}) => (
  <div className="flex flex-col gap-3.5 bg-[#080D2D] px-4 pt-5 text-[#fff] md:px-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <nav aria-label="Breadcrumb" className="text-[13px] text-[#fff]/75">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {i > 0 && <span className="px-1">/</span>}
              {c.to ? (
                <Link to={c.to} className="hover:text-[#fff] hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold">{title}</h1>
          {status && (
            <span className="rounded-full border border-[#fff]/35 bg-[#fff]/15 px-2.5 py-0.5 text-xs font-semibold">
              {status}
            </span>
          )}
        </div>
        {meta && meta.length > 0 && (
          <p className="flex flex-wrap gap-x-1.5 text-sm text-[#fff]/85">
            {meta.map((m, i) => (
              <span key={i} className="whitespace-nowrap">
                {m}
                {i < meta.length - 1 && " ·"}
              </span>
            ))}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      {aside}
    </div>
    {extra}
    {tabs && tabs.length > 0 ? (
      <div role="tablist" className="-mb-px flex gap-1 overflow-x-auto text-sm">
        {tabs.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTab?.(t)}
              className={cn(
                "whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white font-semibold text-primary"
                  : "text-[#fff]/80 hover:bg-[#fff]/10 hover:text-[#fff]"
              )}
            >
              {t}
            </button>
          );
        })}
      </div>
    ) : (
      <div className="h-2" />
    )}
  </div>
);

/** Content surface wrapper: white panel with the prototype's 4px gold top border. */
export const SomPanelSurface = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("rounded-xl border border-gray-200 border-t-4 border-t-secondary bg-white", className)}>
    {children}
  </div>
);
