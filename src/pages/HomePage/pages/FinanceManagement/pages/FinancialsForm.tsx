import { useNavigate } from "react-router-dom";
import FinanceBuilder from "../Components/FinanceBuilder";
import { FinanceData, FinanceSaveAction } from "@/utils/api/finance/interface";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";

const FinancialsForm = () => {
  const navigate = useNavigate();

  const handleCreateFinancial = async (
    values: FinanceData,
    action: FinanceSaveAction
  ) => {
    try {
      const response = await api.post.createFinancial({
        ...values,
        action,
      });
      const nextStatus = response.data.status || "DRAFT";
      const successMessage =
        nextStatus === "APPROVED"
          ? "Financial record approved successfully"
          : nextStatus === "PENDING_APPROVAL"
            ? "Financial record submitted for approval successfully"
            : "Financial record saved as draft successfully";
      showNotification(successMessage, "success");
      navigate("/home/finance");
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create financial record";
      showNotification(message, "error");
      return false;
    }
  };

  return (
    <FinanceBuilder mode="create" onSubmitFinancial={handleCreateFinancial} />
  );
};

export default FinancialsForm;
