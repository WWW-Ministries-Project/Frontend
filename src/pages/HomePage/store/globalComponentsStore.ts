import { create } from "zustand";
interface NotificationCardProps {
  title?: string;
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  show: boolean;
}

interface NotificationSlice {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  notification: NotificationCardProps;
  setNotification: (notification: NotificationCardProps) => void;
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
