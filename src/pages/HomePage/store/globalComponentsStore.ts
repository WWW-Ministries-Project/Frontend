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
