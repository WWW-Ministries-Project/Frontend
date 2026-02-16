import { showLoader, showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";

export const deleteMember = (id: string | number) => {
  showLoader(true);
  api.delete
    .deleteMember({ id: String(id) })
    .then(() => {
      showNotification("Member Deleted Successfully");
      const store = useStore.getState() as { removeMember?: (id: string | number) => void };
      store.removeMember?.(id);
      showLoader(false);
    })
    .catch((error) => {
      showNotification(error.message, "error");
      showLoader(false);
    });
};
