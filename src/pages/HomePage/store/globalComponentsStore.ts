import { create } from "zustand";
interface NotificationType {
  title?: string;
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  show: boolean;
}

interface NotificationSlice {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  notification: NotificationType;
  setNotification: (notification: NotificationType) => void;
}

export const useNotificationStore = create<NotificationSlice>((set, get) => ({
  notification: {
    title: "",
    message: "",
    type: undefined,
    onClose: () => {},
    show: false,
  },
  visible: false,
  setVisible: (visible) => {
    set({ visible });
  },
  setNotification: (notification) => {
    set({ notification });
    get().setVisible(notification.show);
  },
}));



export const useDialogStore = create<NotificationSlice>((set, get) => ({
  notification: {
    title: "",
    message: "",
    type: undefined,
    onClose: () => {},
    show: false,
  },
  visible: false,
  setVisible: (visible) => {
    set({ visible });
  },
  setNotification: (notification) => {
    set({ notification });
    get().setVisible(notification.show);
  },
}));