import { useNavigate } from "react-router-dom";
import FinanceBuilder from "../Components/FinanceBuilder";
import { FinanceData } from "@/utils/api/finance/interface";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";

const FinancialsForm = () => {
  const navigate = useNavigate();

  const handleCreateFinancial = async (values: FinanceData) => {
    try {
      await api.post.createFinancial(values);
      showNotification("Financial record created successfully", "success");
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
