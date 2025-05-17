import { showLoader, showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";

export const deleteMember = (id: string | number) => {
  showLoader(true);
  api.delete
    .deleteMember({ id: String(id) })
    .then(() => {
      showNotification("Member Deleted Successfully");
      useStore.getState().removeMember(id);
      showLoader(false);
    })
    .catch((error) => {
      showNotification(error.message, "error");
      showLoader(false);
    });
};
