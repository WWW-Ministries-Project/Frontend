import {
  useDialogStore,
  useNotificationStore,
} from "../store/globalComponentsStore";

type DialogValue = {
  id: string | number;
  name: string;
};

export const maxMinValueForDate = () => {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const maxDate = currentYear + "-12-31";
  const minDate = today.toISOString().split("T")[0];
  return { minDate, maxDate };
};

export const showDeleteDialog = <T extends DialogValue>(
  val: T,
  handleDelete: (id: string | number) => void
) => {
  const dialogStore = useDialogStore.getState();
  dialogStore.setDialog({
    name: val.name,
    showModal: true,
    onConfirm: () => {
      handleDelete(val.id);
      dialogStore.dialogDataReset();
    },
    onCancel: dialogStore.dialogDataReset,
  });
};

export const showNotification = (
  message: string,
  type: "success" | "error" = "success",
  handleClose = () => {}
) => {
  const notification = useNotificationStore.getState().setNotification;
  notification({ message, show: true, onClose: handleClose, type });
};
