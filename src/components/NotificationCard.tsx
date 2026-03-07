import { AlertItem, useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useEffect } from "react";

const toneClasses: Record<
  AlertItem["type"],
  { container: string; icon: string; title: string; message: string }
> = {
  success: {
    container:
      "border-lightGray bg-white ring-1 ring-success/20 shadow-[var(--shadow-card)]",
    icon: "text-success",
    title: "text-primary",
    message: "text-primaryGray",
  },
  error: {
    container:
      "border-lightGray bg-white ring-1 ring-error/25 shadow-[var(--shadow-card)]",
    icon: "text-error",
    title: "text-primary",
    message: "text-primaryGray",
  },
};

const iconMap = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
};

const NotificationItem = ({ alert }: { alert: AlertItem }) => {
  const { removeNotification } = useNotificationStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      removeNotification(alert.id);
    }, alert.durationMs);

    return () => window.clearTimeout(timer);
  }, [alert.durationMs, alert.id, removeNotification]);

  const tones = toneClasses[alert.type];
  const Icon = iconMap[alert.type];
  const role = alert.type === "error" ? "alert" : "status";

  return (
    <article
      className={`pointer-events-auto w-full rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 animate-fadeIn ${tones.container}`}
      role={role}
      aria-live={alert.type === "error" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 flex-shrink-0 ${tones.icon}`} />
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-semibold leading-5 ${tones.title}`}>
            {alert.title}
          </h4>
          <p className={`mt-1 text-sm leading-5 ${tones.message}`}>
            {alert.message}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-primaryGray transition hover:bg-lightGray/20 hover:text-primary"
          onClick={() => removeNotification(alert.id)}
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
};

export const NotificationCard = () => {
  const alerts = useNotificationStore((state) => state.alerts);

  if (!alerts.length) return null;

  return (
    <section
      style={{ top: "calc(var(--app-header-height) + 1rem)" }}
      className="pointer-events-none fixed right-4 z-[130] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:w-full"
      aria-label="Notifications"
    >
      {alerts.map((alert) => (
        <NotificationItem key={alert.id} alert={alert} />
      ))}
    </section>
  );
};
