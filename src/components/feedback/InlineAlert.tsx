import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

export type InlineAlertTone = "info" | "warning" | "error" | "success" | "neutral";

interface InlineAlertAction {
  label: string;
  onClick: () => void;
}

interface InlineAlertProps {
  tone: InlineAlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: InlineAlertAction;
  /** Only info and success alerts can be dismissed. */
  onDismiss?: () => void;
  className?: string;
}

const TONES: Record<
  InlineAlertTone,
  { box: string; icon: string; action: string; role: "note" | "status" | "alert" }
> = {
  info: {
    box: "border-info/30 bg-info/5",
    icon: "text-info",
    action: "border border-info bg-white text-info hover:bg-info/5",
    role: "note",
  },
  warning: {
    box: "border-warning/30 bg-warning/5",
    icon: "text-warning",
    action: "border border-warning bg-white text-warning hover:bg-warning/5",
    role: "status",
  },
  error: {
    box: "border-error/25 bg-error/5",
    icon: "text-error",
    action: "bg-error text-white hover:bg-error/90",
    role: "alert",
  },
  success: {
    box: "border-success/30 bg-success/5",
    icon: "text-success",
    action: "border border-success bg-white text-success hover:bg-success/5",
    role: "status",
  },
  neutral: {
    box: "border-lightGray bg-gray-100",
    icon: "text-gray-700",
    action: "border border-primary/30 bg-white text-primary hover:bg-primary/5",
    role: "status",
  },
};

const ToneIcon = ({ tone }: { tone: InlineAlertTone }) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (tone) {
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.5v.5" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <path d="M12 4l9 16H3z" />
          <path d="M12 10v4M12 17v.5" />
        </svg>
      );
    case "error":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16v.5" />
        </svg>
      );
    case "success":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l3 3 5-6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
  }
};

/**
 * A lasting state of the page (missing data, read-only access, load
 * failure). Stays until the condition is fixed. Use a toast for results of
 * an action instead.
 */
export const InlineAlert = ({
  tone,
  title,
  children,
  action,
  onDismiss,
  className,
}: InlineAlertProps) => {
  const styles = TONES[tone];
  const dismissible = !!onDismiss && (tone === "info" || tone === "success");

  if (tone === "neutral") {
    return (
      <div
        role={styles.role}
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm leading-5",
          styles.box,
          className
        )}
      >
        <span className={cn("flex flex-shrink-0", styles.icon)}>
          <ToneIcon tone={tone} />
        </span>
        <p className="min-w-0 flex-[1_1_280px] text-gray-700">
          {title ? <b className="font-semibold text-primary">{title} </b> : null}
          {children}
        </p>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className={cn("min-h-9 rounded-lg px-3 py-1.5 font-medium", styles.action)}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role={styles.role}
      className={cn(
        "flex flex-wrap gap-3 rounded-lg border px-4 py-3 text-sm leading-5",
        styles.box,
        className
      )}
    >
      <span className={cn("flex flex-shrink-0 pt-0.5", styles.icon)}>
        <ToneIcon tone={tone} />
      </span>
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
        {title ? <p className="font-semibold text-primary">{title}</p> : null}
        {children ? <div className="text-gray-700">{children}</div> : null}
      </div>
      {action ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={action.onClick}
            className={cn("min-h-9 rounded-lg px-3 py-1.5 font-medium", styles.action)}
          >
            {action.label}
          </button>
        </div>
      ) : null}
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={cn(
            "flex h-7 w-7 items-center justify-center self-start rounded-lg hover:bg-primary/5",
            styles.icon
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
};
