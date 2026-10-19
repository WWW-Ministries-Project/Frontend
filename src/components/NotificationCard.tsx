import {
  AlertItem,
  AlertKind,
  useNotificationStore,
} from "@/pages/HomePage/store/globalComponentsStore";
import { cn } from "@/utils/cn";
import { useEffect } from "react";

const MAX_VISIBLE = 3;
const TICK_MS = 100;

const TONES: Record<
  AlertKind,
  { tile: string; bar: string; icon: string; role: "status" | "alert" }
> = {
  success: {
    tile: "bg-success/10 text-success",
    bar: "bg-success",
    icon: "M5 12.5l4.5 4.5L19 7.5",
    role: "status",
  },
  info: {
    tile: "bg-info/10 text-info",
    bar: "bg-info",
    icon: "M12 10.5v6.5M12 7v.5",
    role: "status",
  },
  warning: {
    tile: "bg-warning/10 text-warning",
    bar: "bg-warning",
    icon: "M12 6.5v7M12 17v.5",
    role: "status",
  },
  error: {
    tile: "bg-error/10 text-error",
    bar: "bg-error",
    icon: "M7 7l10 10M17 7L7 17",
    role: "alert",
  },
  loading: {
    tile: "bg-gray-100 text-gray-700",
    bar: "bg-gray-700",
    icon: "M12 3a9 9 0 1 0 9 9",
    role: "status",
  },
};

const isDialogOpen = () =>
  typeof document !== "undefined" &&
  !!document.querySelector('dialog[open], [role="dialog"], [role="alertdialog"]');

const ToastItem = ({ alert }: { alert: AlertItem }) => {
  const patch = useNotificationStore((state) => state.patch);
  const remove = useNotificationStore((state) => state.removeNotification);
  const tone = TONES[alert.kind];
  const progress = alert.durationMs
    ? Math.max(0, (alert.remainingMs / alert.durationMs) * 100)
    : 0;
  const detailCount = alert.details.reduce(
    (total, section) => total + section.items.length,
    0
  );

  const pause = () => patch(alert.id, { paused: true });
  const resume = () => {
    if (!alert.detailsOpen) patch(alert.id, { paused: false });
  };

  return (
    <article
      role={tone.role}
      aria-live={tone.role === "alert" ? "assertive" : "polite"}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="pointer-events-auto w-full overflow-hidden rounded-xl border border-lightGray bg-white shadow-lg animate-toast-in"
    >
      <div className="flex gap-3 p-4">
        <span
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
            tone.tile
          )}
          aria-hidden="true"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={alert.kind === "loading" ? "animate-spin" : undefined}
          >
            <path d={tone.icon} />
          </svg>
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm leading-5">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <span className="min-w-0">{alert.title}</span>
            {alert.count > 1 ? (
              <span className="rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700">
                ×{alert.count}
              </span>
            ) : null}
          </p>
          {alert.message ? (
            <p className="text-primaryGray [text-wrap:pretty]">{alert.message}</p>
          ) : null}

          {alert.detailsOpen && detailCount > 0 ? (
            <ul className="mt-2 flex max-h-52 flex-col gap-2 overflow-y-auto rounded-lg border border-lightGray bg-inputBackground p-3">
              {alert.details.flatMap((section) =>
                section.items.map((item) => (
                  <li
                    key={`${section.title}-${item.label}-${item.description ?? ""}`}
                    className="flex flex-col"
                  >
                    <span className="font-medium text-primary">{item.label}</span>
                    {item.description ? (
                      <span className="text-xs text-primaryGray">
                        {item.description}
                      </span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          ) : null}

          {alert.actions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {alert.actions.map((action, index) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    if (action.toggleDetails) {
                      patch(alert.id, {
                        detailsOpen: !alert.detailsOpen,
                        paused: true,
                      });
                      return;
                    }
                    action.onClick?.(alert.id);
                  }}
                  className={cn(
                    "min-h-8 rounded-lg bg-white px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/5",
                    index === alert.actions.length - 1
                      ? "border border-primary/30"
                      : "border border-transparent"
                  )}
                >
                  {action.toggleDetails && alert.detailsOpen ? "Hide" : action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => remove(alert.id)}
          aria-label="Dismiss notification"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-mainGray transition-colors hover:bg-gray-100 hover:text-primary"
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
      </div>

      {alert.durationMs ? (
        <div className="h-[3px] bg-gray-100" aria-hidden="true">
          <div
            className={cn("h-full transition-[width] duration-100 ease-linear", tone.bar)}
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </article>
  );
};

/** Global toast stack. Mounted once in main.tsx. */
export const NotificationCard = () => {
  const alerts = useNotificationStore((state) => state.alerts);
  const tick = useNotificationStore((state) => state.tick);
  const remove = useNotificationStore((state) => state.removeNotification);
  const clear = useNotificationStore((state) => state.clearNotifications);

  useEffect(() => {
    const interval = window.setInterval(() => tick(TICK_MS), TICK_MS);
    return () => window.clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isDialogOpen()) return;
      const { alerts: current } = useNotificationStore.getState();
      const newest = current[current.length - 1];
      if (newest) remove(newest.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [remove]);

  if (!alerts.length) return null;

  const visible = alerts.slice(-MAX_VISIBLE);
  const hidden = alerts.length - visible.length;

  return (
    <section
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 bottom-[5.5rem] z-[140] flex flex-col gap-3 tablet:left-auto tablet:right-4 tablet:w-[420px]"
    >
      {hidden > 0 ? (
        <div className="pointer-events-auto flex items-center gap-2 self-end rounded-full bg-primary py-1 pl-3 pr-1 text-xs font-semibold text-white">
          <span>+{hidden} more</span>
          <button
            type="button"
            onClick={clear}
            className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white"
          >
            Clear all
          </button>
        </div>
      ) : null}
      {visible.map((alert) => (
        <ToastItem key={alert.id} alert={alert} />
      ))}
    </section>
  );
};
