/** SoM layout primitives: sub-nav, underline tabs, banners, modal/drawer/overlay shells. */
import { cn } from "@/utils/cn";
import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { BANNER_TONE, BannerTone } from "./uiTokens";

export type SubNavItem = {
  label: string;
  to?: string;
  onClick?: () => void;
  active?: boolean;
  count?: number;
  icon?: ReactNode;
};

/** Left rail sub-navigation (prototype SUBNAV_ADMIN / SUBNAV_INSTR). */
export const SubNav = ({
  eyebrow,
  items,
  footer,
  orientation = "vertical",
  className,
}: {
  eyebrow?: ReactNode;
  items: SubNavItem[];
  footer?: ReactNode;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) => {
  const horizontal = orientation === "horizontal";
  return (
  <aside
    className={cn(
      horizontal ? "flex w-full flex-col gap-1" : "flex w-full flex-col gap-1 md:w-[212px] md:flex-shrink-0",
      className
    )}
  >
    {eyebrow && (
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-mainGray">
        {eyebrow}
      </p>
    )}
    <nav className={cn(horizontal ? "flex gap-1 overflow-x-auto pb-1" : "flex flex-col gap-0.5")}>
      {items.map((it) => {
        const inner = (
          <>
            {it.icon}
            <span className="flex-1 truncate">{it.label}</span>
            {it.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  it.active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                {it.count}
              </span>
            )}
          </>
        );
        const classes = cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
          horizontal && "whitespace-nowrap",
          it.active ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
        );
        return it.to ? (
          <Link key={it.label} to={it.to} className={classes} aria-current={it.active ? "page" : undefined}>
            {inner}
          </Link>
        ) : (
          <button key={it.label} type="button" onClick={it.onClick} className={classes} aria-current={it.active ? "page" : undefined}>
            {inner}
          </button>
        );
      })}
    </nav>
    {footer && <div className="mt-2">{footer}</div>}
  </aside>
  );
};

/** Underline tab strip (light surfaces; the dark variant lives in WorkspaceHeader). */
export function Tabs<T extends string = string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { value: T; label: ReactNode; count?: number }[];
  active: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex gap-5 overflow-x-auto border-b border-gray-200", className)}>
      {tabs.map((t) => {
        const on = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={cn(
              "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
              on ? "border-primary text-primary" : "border-transparent text-mainGray hover:text-primary"
            )}
          >
            {t.label}
            {t.count != null && <span className="text-xs text-mainGray">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Inline banner / notice. */
export const Banner = ({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    role="status"
    className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm", BANNER_TONE[tone], className)}
  >
    <div className="min-w-0">
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title ? "mt-0.5" : undefined)}>{children}</div>}
    </div>
    {action}
  </div>
);

const useBodyLock = (open: boolean) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
};

const useEscape = (open: boolean, onClose?: () => void) => {
  useEffect(() => {
    if (!open || !onClose) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
};

const CloseButton = ({ onClose, label = "Close" }: { onClose?: () => void; label?: string }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClose}
    className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg leading-none text-gray-600 hover:bg-gray-50"
  >
    ×
  </button>
);

const MODAL_SIZE = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

/** Centered modal dialog (prototype modal shell). */
export const ModalShell = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof MODAL_SIZE;
  className?: string;
}) => {
  useBodyLock(open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-lightGray bg-white shadow-2xl",
          MODAL_SIZE[size],
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-primary">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-primaryGray">{description}</p>}
            </div>
            {onClose && <CloseButton onClose={onClose} />}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-gray-100 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/** Right-side drawer (prototype drawer shell, default 460px). */
export const DrawerShell = ({
  open,
  onClose,
  title,
  children,
  footer,
  width = 460,
}: {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) => {
  useBodyLock(open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary/50 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
        className="flex h-full w-full flex-col bg-white shadow-2xl"
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
            {title && <h2 className="text-lg font-bold text-primary">{title}</h2>}
            {onClose && <CloseButton onClose={onClose} />}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-gray-100 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/** Full-panel overlay (prototype "Full grading view"). */
export const FullOverlay = ({
  open,
  onClose,
  header,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  header?: ReactNode;
  children: ReactNode;
}) => {
  useBodyLock(open);
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {header && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
          {header}
          {onClose && <CloseButton onClose={onClose} />}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};
