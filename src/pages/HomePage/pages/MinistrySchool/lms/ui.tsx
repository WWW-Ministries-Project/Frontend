import { cn } from "@/utils/cn";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { initials } from "./somUtils";

export type Tone =
  | "gray"
  | "green"
  | "amber"
  | "blue"
  | "red"
  | "indigo"
  | "cyan"
  | "fuchsia"
  | "orange";

const TONE: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700 border-gray-200",
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  red: "bg-red-50 text-red-800 border-red-200",
  indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  fuchsia: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  orange: "bg-orange-50 text-orange-800 border-orange-200",
};

const STATUS_TONE: Record<string, Tone> = {
  Ongoing: "green",
  Upcoming: "amber",
  Completed: "blue",
  "On track": "green",
  Behind: "red",
  "Not started": "amber",
  Active: "green",
  Inactive: "gray",
  In_Person: "indigo",
  Online: "cyan",
  Hybrid: "fuchsia",
  Lesson: "gray",
  Video: "cyan",
  PDF: "red",
  Slides: "orange",
  Quiz: "amber",
  Essay: "fuchsia",
  "Live class": "indigo",
  "In person": "indigo",
};

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

export const StatusPill = ({ status, label }: { status: string; label?: string }) => (
  <Pill tone={STATUS_TONE[status] ?? "gray"}>{label ?? status}</Pill>
);

export const Avatar = ({ name }: { name: string }) => (
  <span
    aria-hidden
    className="inline-flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-neutralGray text-xs font-semibold text-primary"
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
  tone?: "primary" | "white";
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
      className={cn("h-full rounded-full", tone === "white" ? "bg-[#fff]" : "bg-primary")}
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

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  variant?: "primary" | "secondary" | "ghost" | "onDark" | "onDarkSolid";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  title?: string;
};

const BTN: Record<NonNullable<BtnProps["variant"]>, string> = {
  primary: "bg-primary text-white hover:bg-lighter",
  secondary: "border border-lightGray bg-white text-primary hover:bg-gray-50",
  ghost: "text-primary hover:underline",
  onDark: "border border-[#fff]/40 bg-transparent text-[#fff] hover:bg-[#fff]/10",
  onDarkSolid: "bg-[#fff] text-[#080D2D] hover:bg-[#F3F4F6]",
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
    <button type="button" onClick={onClick} disabled={disabled} className={classes} title={title}>
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
  to,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  to?: string;
  tone?: "default" | "warn";
}) => {
  const body = (
    <>
      <p className="text-[13px] text-mainGray">{label}</p>
      <p
        className={cn(
          "text-[26px] font-bold leading-tight",
          tone === "warn" ? "text-red-700" : "text-primary"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-mainGray">{sub}</p>}
    </>
  );
  const classes =
    "flex flex-col gap-1 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left";
  return to ? (
    <Link to={to} className={cn(classes, "transition hover:border-lightGray hover:shadow-sm")}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
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
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  minWidth?: number;
}) {
  if (!rows.length && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mainGray">
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
