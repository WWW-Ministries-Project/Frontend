import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";

export const deleteMember = (id: string | number) => {
  api.delete
    .deleteMember(id)
    .then(() => {
      useNotificationStore.getState().setNotification({
        title: "Success",
        message: "Member deleted successfully",
        type: "success",
        onClose: () => {},
        show: true,
      });
      useStore.getState().removeMember(id);
    })
    .catch((error) => {
      useNotificationStore.getState().setNotification({
        title: "Error",
        message: error.message,
        type: "error",
        onClose: () => {},
        show: true,
      });
    });
};
