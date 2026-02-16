import { AlertItem, useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useEffect } from "react";

const toneClasses: Record<
  AlertItem["type"],
  { container: string; icon: string; title: string }
> = {
  success: {
    container:
      "border-emerald-200 bg-emerald-50/95 shadow-[0_10px_30px_-20px_rgba(5,150,105,0.65)]",
    icon: "text-emerald-600",
    title: "text-emerald-900",
  },
  error: {
    container:
      "border-rose-200 bg-rose-50/95 shadow-[0_10px_30px_-20px_rgba(220,38,38,0.7)]",
    icon: "text-rose-600",
    title: "text-rose-900",
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
          <p className="mt-1 text-sm leading-5 text-gray-700">{alert.message}</p>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-gray-500 transition hover:bg-black/5 hover:text-gray-700"
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
      className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:w-full"
      aria-label="Notifications"
    >
      {alerts.map((alert) => (
        <NotificationItem key={alert.id} alert={alert} />
      ))}
    </section>
  );
};
