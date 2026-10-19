import type { ReactNode } from "react";
import { create } from "zustand";

export type AlertKind = "success" | "info" | "warning" | "error" | "loading";
export type AlertDetailTone = "success" | "error" | "neutral";

export interface AlertDetailItem {
  label: string;
  description?: string;
}

export interface AlertDetailSection {
  title: string;
  tone?: AlertDetailTone;
  items: AlertDetailItem[];
}

export interface AlertAction {
  label: string;
  onClick?: (id: string) => void;
  /** Toggles the details list instead of running a callback. */
  toggleDetails?: boolean;
}

/** What callers pass to create or replace a toast. */
export interface AlertInput {
  id?: string;
  kind?: AlertKind;
  title: string;
  message?: string;
  actions?: AlertAction[];
  details?: AlertDetailSection[];
  /** Milliseconds; 0 keeps the toast until dismissed. Defaults by kind. */
  durationMs?: number;
  onClose?: () => void;
  /** "api" marks the automatic toast raised by ApiErrorHandler. */
  source?: "api";
}

export interface AlertItem {
  id: string;
  kind: AlertKind;
  title: string;
  message: string;
  actions: AlertAction[];
  details: AlertDetailSection[];
  detailsOpen: boolean;
  count: number;
  durationMs: number;
  remainingMs: number;
  paused: boolean;
  onClose: () => void;
  source?: "api";
  createdAt: number;
}

/** Visible lifetime per tone. 0 = stays until dismissed or resolved. */
export const ALERT_DURATIONS: Record<AlertKind, number> = {
  success: 5000,
  info: 6000,
  warning: 8000,
  error: 0,
  loading: 0,
};

const ACTION_BONUS_MS = 3000;
const MAX_QUEUE = 20;

const resolveDuration = (input: AlertInput, kind: AlertKind) => {
  if (input.durationMs !== undefined) return input.durationMs;
  const base = ALERT_DURATIONS[kind];
  if (!base) return 0;
  return base + (input.actions?.length ? ACTION_BONUS_MS : 0);
};

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `alert-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

interface NotificationSlice {
  alerts: AlertItem[];
  push: (input: AlertInput) => string;
  update: (id: string, input: AlertInput) => void;
  patch: (id: string, patch: Partial<AlertItem>) => void;
  tick: (elapsedMs: number) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  /** Kept for callers that hide everything on logout. */
  setVisible: (visible: boolean) => void;
}

export interface ConfirmDialogOptions {
  title: string;
  /** Short consequence list shown as bullets. */
  points?: string[];
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" uses the red button and trash icon. */
  tone?: "danger" | "default";
  /** When set, the person must type this exact value before confirming. */
  typeToConfirm?: string;
  /** Hides the confirm button; the dialog only explains why it can't proceed. */
  blocked?: boolean;
  /**
   * Returning a promise keeps the dialog open with a spinner until it
   * settles. A rejection shows its message inside the dialog.
   */
  onConfirm: () => void | Promise<unknown>;
  onCancel?: () => void;
}

interface DialogType extends Partial<ConfirmDialogOptions> {
  /** Legacy: record name used for the default "Delete {name}?" copy. */
  name?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<unknown>;
  showModal: boolean;
}

interface DialogSlice {
  dialogData: DialogType;
  setDialog: (dialog: DialogType) => void;
  dialogDataReset: () => void;
}

interface LoaderSlice {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationSlice>((set, get) => ({
  alerts: [],
  push: (input) => {
    const kind = input.kind ?? "success";
    const message = input.message ?? "";
    const duplicate = get().alerts.find(
      (alert) =>
        alert.kind === kind &&
        alert.title === input.title &&
        alert.message === message &&
        !alert.details.length
    );

    if (duplicate) {
      set((state) => ({
        alerts: state.alerts.map((alert) =>
          alert.id === duplicate.id
            ? {
                ...alert,
                count: alert.count + 1,
                remainingMs: alert.durationMs,
                createdAt: Date.now(),
                source: input.source ?? alert.source,
              }
            : alert
        ),
      }));
      return duplicate.id;
    }

    const durationMs = resolveDuration(input, kind);
    const alert: AlertItem = {
      id: input.id || createId(),
      kind,
      title: input.title,
      message,
      actions: input.actions ?? [],
      details: input.details ?? [],
      detailsOpen: false,
      count: 1,
      durationMs,
      remainingMs: durationMs,
      paused: false,
      onClose: input.onClose ?? (() => {}),
      source: input.source,
      createdAt: Date.now(),
    };

    set((state) => ({ alerts: [...state.alerts, alert].slice(-MAX_QUEUE) }));
    return alert.id;
  },
  update: (id, input) => {
    set((state) => ({
      alerts: state.alerts.map((alert) => {
        if (alert.id !== id) return alert;
        const kind = input.kind ?? alert.kind;
        const durationMs = resolveDuration(input, kind);
        return {
          ...alert,
          kind,
          title: input.title,
          message: input.message ?? "",
          actions: input.actions ?? [],
          details: input.details ?? [],
          detailsOpen: false,
          durationMs,
          remainingMs: durationMs,
          onClose: input.onClose ?? alert.onClose,
        };
      }),
    }));
  },
  patch: (id, patch) => {
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, ...patch } : alert
      ),
    }));
  },
  tick: (elapsedMs) => {
    const { alerts } = get();
    if (!alerts.some((alert) => alert.durationMs && !alert.paused)) return;

    const expired: AlertItem[] = [];
    const next = alerts.flatMap((alert) => {
      if (!alert.durationMs || alert.paused) return [alert];
      const remainingMs = alert.remainingMs - elapsedMs;
      if (remainingMs <= 0) {
        expired.push(alert);
        return [];
      }
      return [{ ...alert, remainingMs }];
    });

    set({ alerts: next });
    expired.forEach((alert) => alert.onClose());
  },
  removeNotification: (id) => {
    const alert = get().alerts.find((item) => item.id === id);
    set((state) => ({ alerts: state.alerts.filter((item) => item.id !== id) }));
    alert?.onClose();
  },
  clearNotifications: () => {
    const { alerts } = get();
    set({ alerts: [] });
    alerts.forEach((alert) => alert.onClose());
  },
  setVisible: (visible) => {
    if (!visible) get().clearNotifications();
  },
}));

export const useDialogStore = create<DialogSlice>((set, get) => ({
  dialogData: {
    name: "",
    onCancel: () => {},
    onConfirm: () => {},
    showModal: false,
  },
  setDialog: (dialogData) => {
    set({ dialogData });
  },
  dialogDataReset: () => {
    set({ dialogData: { ...get().dialogData, showModal: false } });
  },
}));

export const useLoaderStore = create<LoaderSlice>((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),
}));
