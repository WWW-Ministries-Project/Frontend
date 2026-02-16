import { create } from "zustand";

export type AlertKind = "success" | "error";

interface NotificationType {
  id?: string;
  title?: string;
  message: string;
  type?: AlertKind;
  onClose?: () => void;
  show?: boolean;
  durationMs?: number;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: AlertKind;
  onClose: () => void;
  durationMs: number;
}

interface NotificationSlice {
  alerts: AlertItem[];
  visible: boolean;
  setVisible: (visible: boolean) => void;
  notification: NotificationType;
  setNotification: (notification: NotificationType) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface DialogType {
  name?: string;
  onCancel: () => void;
  onConfirm: () => void;
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
  notification: {
    id: "",
    title: "",
    message: "",
    type: "success",
    onClose: () => {},
    show: true,
    durationMs: 5000,
  },
  visible: false,
  setVisible: (visible) => {
    if (!visible) {
      get().clearNotifications();
      return;
    }
    set({ visible: true });
  },
  setNotification: (notification) => {
    if (notification.show === false) {
      get().clearNotifications();
      return;
    }

    const type = notification.type ?? "success";
    const title =
      notification.title ||
      (type === "error" ? "Action failed" : "Action completed");

    const normalizedAlert: AlertItem = {
      id: notification.id || crypto.randomUUID(),
      title,
      message: notification.message,
      type,
      onClose: notification.onClose ?? (() => {}),
      durationMs: notification.durationMs ?? (type === "error" ? 7000 : 5000),
    };

    set((state) => {
      const nextAlerts = [...state.alerts, normalizedAlert].slice(-5);
      return {
        alerts: nextAlerts,
        notification: normalizedAlert,
        visible: true,
      };
    });
  },
  removeNotification: (id) => {
    const alert = get().alerts.find((item) => item.id === id);
    alert?.onClose?.();

    set((state) => {
      const nextAlerts = state.alerts.filter((item) => item.id !== id);
      return {
        alerts: nextAlerts,
        visible: nextAlerts.length > 0,
        notification:
          nextAlerts[nextAlerts.length - 1] || {
            id: "",
            title: "",
            message: "",
            type: "success",
            onClose: () => {},
            show: false,
            durationMs: 5000,
          },
      };
    });
  },
  clearNotifications: () => {
    get().alerts.forEach((alert) => alert.onClose?.());
    set({
      alerts: [],
      visible: false,
      notification: {
        id: "",
        title: "",
        message: "",
        type: "success",
        onClose: () => {},
        show: false,
        durationMs: 5000,
      },
    });
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
