import {
  AlertAction,
  AlertDetailSection,
  AlertInput,
  AlertKind,
  useNotificationStore,
} from "@/pages/HomePage/store/globalComponentsStore";

export interface NotifyAction {
  label: string;
  onClick: () => void;
}

export interface NotifyOptions {
  title: string;
  message?: string;
  /** One action, verb first ("View profile"). */
  action?: NotifyAction;
  /** Up to two actions. Ignored when `action` is set. */
  actions?: NotifyAction[];
  /** Adds a "Try again" action that dismisses the toast and re-runs this. */
  retry?: () => void;
  /** Adds an "Undo" action. Use instead of a confirm dialog for reversible actions. */
  undo?: () => void | Promise<unknown>;
  /** Title shown after undo succeeds. */
  undoneTitle?: string;
  details?: AlertDetailSection[];
  /** Milliseconds; 0 keeps it until dismissed. Defaults by tone. */
  duration?: number;
  onClose?: () => void;
}

export interface PartialFailure {
  label: string;
  reason?: string;
}

export interface PartialOptions {
  title: string;
  message?: string;
  failed: PartialFailure[];
  retry?: () => void;
}

export interface FromErrorOptions {
  /** Internal: marks the automatic toast raised by ApiErrorHandler. */
  source?: "api";
  /** What failed, e.g. "Couldn't save the event". */
  title?: string;
  retry?: () => void;
  /** Use when the server's own message should win for 4xx responses. */
  preferServerMessage?: boolean;
}

export interface ToastHandle {
  id: string;
  success: (options: NotifyOptions) => void;
  info: (options: NotifyOptions) => void;
  warning: (options: NotifyOptions) => void;
  error: (options: NotifyOptions) => void;
  dismiss: () => void;
}

const store = () => useNotificationStore.getState();

const buildActions = (options: NotifyOptions, getId: () => string): AlertAction[] => {
  const actions: AlertAction[] = [];
  const dismiss = () => store().removeNotification(getId());

  if (options.details?.some((section) => section.items.length)) {
    actions.push({ label: "Show details", toggleDetails: true });
  }

  const explicit = options.action ? [options.action] : options.actions ?? [];
  explicit.forEach((action) =>
    actions.push({
      label: action.label,
      onClick: () => {
        dismiss();
        action.onClick();
      },
    })
  );

  if (options.undo) {
    const undo = options.undo;
    actions.push({
      label: "Undo",
      onClick: (id) => {
        store().update(id, { kind: "loading", title: "Undoing…" });
        Promise.resolve()
          .then(() => undo())
          .then(() =>
            store().update(id, {
              kind: "info",
              title: options.undoneTitle ?? "Change undone",
            })
          )
          .catch(() =>
            store().update(id, {
              kind: "error",
              title: "Couldn't undo",
              message: "The change is still in place. Reverse it by hand or try again.",
            })
          );
      },
    });
  }

  if (options.retry) {
    const retry = options.retry;
    actions.push({
      label: "Try again",
      onClick: () => {
        dismiss();
        retry();
      },
    });
  }

  return actions.slice(0, 2);
};

const toInput = (
  kind: AlertKind,
  options: NotifyOptions,
  getId: () => string
): AlertInput => ({
  kind,
  title: options.title,
  message: options.message,
  actions: buildActions(options, getId),
  details: options.details,
  durationMs: options.duration,
  onClose: options.onClose,
});

const API_MERGE_WINDOW_MS = 1500;

/**
 * ApiErrorHandler toasts every failed request, and most callers then report
 * the same failure. Returns that automatic toast if it was raised a moment
 * ago so the caller can fold its copy into it instead of stacking a second.
 */
export const recentApiErrorToast = () => {
  const now = Date.now();
  return [...store().alerts]
    .reverse()
    .find(
      (alert) =>
        alert.source === "api" &&
        alert.kind === "error" &&
        now - alert.createdAt <= API_MERGE_WINDOW_MS
    );
};

const show = (
  kind: AlertKind,
  options: NotifyOptions,
  source?: "api"
): string => {
  // Fold a caller's error into the automatic toast for the same request.
  const recent =
    kind === "error" && source !== "api" ? recentApiErrorToast() : undefined;
  if (recent) {
    store().update(recent.id, toInput(kind, options, () => recent.id));
    store().patch(recent.id, { source: undefined });
    return recent.id;
  }

  let id = "";
  id = store().push({ ...toInput(kind, options, () => id), source });
  return id;
};

const handleFor = (id: string): ToastHandle => {
  const replace = (kind: AlertKind) => (options: NotifyOptions) =>
    store().update(id, toInput(kind, options, () => id));
  return {
    id,
    success: replace("success"),
    info: replace("info"),
    warning: replace("warning"),
    error: replace("error"),
    dismiss: () => store().removeNotification(id),
  };
};

/* ---------------------------------------------------------------- errors */

type ErrorLike = {
  statusCode?: number;
  status?: number;
  code?: string;
  message?: string;
  response?: { status?: number; data?: unknown; headers?: Record<string, unknown> };
  details?: unknown;
};

const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const serverMessage = (error: ErrorLike): string | null => {
  const payload = (error.response?.data ?? error.details) as
    | Record<string, unknown>
    | undefined;
  if (payload && typeof payload === "object") {
    const nested =
      payload.data && typeof payload.data === "object"
        ? (payload.data as Record<string, unknown>)
        : undefined;
    const found =
      asText(nested?.error) ||
      asText(nested?.message) ||
      asText(payload.error) ||
      asText(payload.message);
    if (found) return found;
  }
  return asText(error.message);
};

const statusOf = (error: ErrorLike): number | null =>
  error.statusCode ?? error.response?.status ?? error.status ?? null;

const isOffline = (error: ErrorLike) =>
  (typeof navigator !== "undefined" && navigator.onLine === false) ||
  error.code === "ERR_NETWORK";

const isTimeout = (error: ErrorLike) =>
  error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

const GENERIC_SERVER_MESSAGES = [
  "an error occurred",
  "an unexpected error occurred",
  "internal server error",
  "something went wrong",
  "request failed with status code",
  "network error",
];

const isUsefulServerMessage = (message: string | null): message is string =>
  !!message &&
  !GENERIC_SERVER_MESSAGES.some((generic) =>
    message.toLowerCase().startsWith(generic)
  );

const retryAfterSeconds = (error: ErrorLike): number | null => {
  const raw = error.response?.headers?.["retry-after"];
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
};

export interface DescribedError {
  title: string;
  message: string;
  status: number | null;
}

/** Maps any thrown value to plain-language copy. */
export const describeError = (
  error: unknown,
  options: Pick<FromErrorOptions, "title" | "preferServerMessage"> = {}
): DescribedError => {
  const err = (error && typeof error === "object" ? error : {}) as ErrorLike;
  const status = statusOf(err);
  const server = serverMessage(err);
  const useful = isUsefulServerMessage(server) ? server : null;
  const pick = (title: string, message: string) => ({
    title: options.title ?? title,
    message,
    status,
  });

  if (isOffline(err)) {
    return pick(
      "You're offline",
      "We'll keep your changes here; try again when you're connected."
    );
  }
  if (isTimeout(err) || (status !== null && status >= 500)) {
    return pick(
      "The server didn't respond",
      "Your changes are kept. Try again in a minute."
    );
  }
  switch (status) {
    case 401:
      return pick(
        "Your session ended",
        "Sign in again to continue; your changes are kept."
      );
    case 403:
      return pick(
        "You don't have access",
        "Your access level can't do this. Ask a branch admin for access."
      );
    case 404:
      return pick(
        "Record not found",
        options.preferServerMessage && useful
          ? useful
          : "This record no longer exists. It may have been deleted by someone else."
      );
    case 409:
      return pick(
        "Couldn't save",
        useful ?? "Someone else changed this record. Reload to see the latest version."
      );
    case 429: {
      const wait = retryAfterSeconds(err);
      return pick(
        "Too many requests",
        wait ? `Wait ${wait} seconds, then try again.` : "Wait a moment, then try again."
      );
    }
    default:
      return pick(
        "Couldn't finish that",
        useful ?? "Nothing was changed. Check the details and try again."
      );
  }
};

/* ------------------------------------------------------------------ api */


export const notify = {
  success: (options: NotifyOptions) => handleFor(show("success", options)),
  info: (options: NotifyOptions) => handleFor(show("info", options)),
  warning: (options: NotifyOptions) => handleFor(show("warning", options)),
  error: (options: NotifyOptions) => handleFor(show("error", options)),
  /** A toast that stays until you call `.success()` / `.error()` on the handle. */
  loading: (options: Pick<NotifyOptions, "title" | "message">) =>
    handleFor(show("loading", options)),

  /** Bulk results where some items failed. Lists which ones and why. */
  partial: ({ title, message, failed, retry }: PartialOptions) => {
    let id = "";
    const actions: AlertAction[] = [
      { label: `Show ${failed.length}`, toggleDetails: true },
    ];
    if (retry) {
      actions.push({
        label: `Retry ${failed.length}`,
        onClick: () => {
          store().removeNotification(id);
          retry();
        },
      });
    }
    id = store().push({
      kind: "warning",
      title,
      message,
      actions,
      details: [
        {
          title: "Not changed",
          tone: "error",
          items: failed.map((item) => ({
            label: item.label,
            description: item.reason,
          })),
        },
      ],
    });
    return handleFor(id);
  },

  /** Maps 401/403/404/409/429/5xx/offline to plain copy and shows an error toast. */
  fromError: (error: unknown, options: FromErrorOptions = {}) => {
    const described = describeError(error, options);
    const toast: NotifyOptions = {
      title: described.title,
      message: described.message,
      retry: options.retry,
    };

    return handleFor(show("error", toast, options.source));
  },

  dismiss: (id: string) => store().removeNotification(id),
  clear: () => store().clearNotifications(),
};
