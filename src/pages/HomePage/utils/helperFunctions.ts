import { useDialogStore } from "../store/globalComponentsStore";

type DialogValue = {
  id: string;
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
  handleDelete: (id: string) => void
) => {
  const dialogStore = useDialogStore();
  dialogStore.setDialog({
    name: val.name,
    showModal: true,
    onConfirm: () => handleDelete(val.id),
    onCancel: dialogStore.dialogDataReset,
  });
};
