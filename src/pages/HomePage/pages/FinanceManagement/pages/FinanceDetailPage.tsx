import React from "react";
import { useParams } from "react-router-dom";
import { Banner } from "../../Members/Components/Banner";
import FinanceBuilder from "../Components/FinanceBuilder";
import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import { FinanceData, FinancialRecord } from "@/utils/api/finance/interface";

const unwrapFinancialPayload = (
  responseData: FinancialRecord | FinancialRecord[] | FinanceData | undefined
): FinanceData | null => {
  if (!responseData) return null;

  const record = Array.isArray(responseData)
    ? responseData[0]
    : responseData;
  if (!record) return null;

  const payload = (record as FinancialRecord)?.payload || (record as FinanceData);
  if (!payload) return null;

  return {
    ...payload,
    id: (record as FinancialRecord)?.id ?? payload?.id,
  };
};

const FinanceDetailPage = () => {
  const { id } = useParams();
  const [formMode, setFormMode] = React.useState<"create" | "view" | "edit">(
    "view"
  );

  const { data, refetch, loading, error } = useFetch(
    api.fetch.fetchFinancial,
    id ? { id } : undefined,
    !id
  );

  const financialData = React.useMemo(() => {
    return unwrapFinancialPayload(data?.data);
  }, [data]);

  const headerTitle = "Receipts and Payments Account";
  const headerSubtitle = financialData?.metaData
    ? `${financialData.metaData.month || ""} ${financialData.metaData.year || ""} · ${
        financialData.metaData.week || ""
      }`
    : "Financial record";

  const handleUpdateFinancial = async (values: FinanceData) => {
    if (!id) return false;

    try {
      await api.put.updateFinancial(values, { id });
      showNotification("Financial record updated successfully", "success");
      await Promise.resolve(refetch({ id }));
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update financial record";
      showNotification(message, "error");
      return false;
    }
  };

  if (!id) {
    return <div className="p-6">No financial id provided.</div>;
  }

  if (loading) {
    return <div className="p-6">Loading financial details...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-sm text-red-700">
        Failed to load financial details. Please refresh and try again.
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="rounded-lg bg-gray-50 p-6 text-sm text-gray-600">
        Financial record not found.
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <Banner>
        <div className="flex w-full items-center justify-between">
          <div className="w-full">
            <h1 className="text-2xl font-semibold">{headerTitle}</h1>
            <p className="mt-2">{headerSubtitle}</p>
          </div>

          <div>
            {formMode === "view" && (
              <Button
                value="Edit Financials"
                variant="primary"
                className="bg-white text-primary"
                onClick={() => setFormMode("edit")}
              />
            )}
          </div>
        </div>
      </Banner>

      <FinanceBuilder
        financeData={financialData}
        mode={formMode}
        onModeChange={setFormMode}
        onSubmitFinancial={handleUpdateFinancial}
      />
    </div>
  );
};

export default FinanceDetailPage;
