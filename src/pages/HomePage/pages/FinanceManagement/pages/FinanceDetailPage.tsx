import React from "react";
import { useParams } from "react-router-dom";
import { Banner } from "../../Members/Components/Banner";
import FinanceBuilder from "../Components/FinanceBuilder";
import { Button } from "@/components";
import { FinanceStatusBadge } from "../Components/FinanceStatusBadge";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import {
  FinanceData,
  FinanceSaveAction,
  FinancialRecord,
} from "@/utils/api/finance/interface";
import {
  downloadFinanceDetails,
  FinanceExportFormat,
} from "../utils/exportFinanceDetails";

const unwrapFinancialPayload = (
  responseData: FinancialRecord | FinancialRecord[] | FinanceData | undefined
): (FinanceData & Partial<FinancialRecord>) | null => {
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
    status: (record as FinancialRecord)?.status,
    financeApproverUserId: (record as FinancialRecord)?.financeApproverUserId,
    submittedByUserId: (record as FinancialRecord)?.submittedByUserId,
    submittedAt: (record as FinancialRecord)?.submittedAt,
    approvedByUserId: (record as FinancialRecord)?.approvedByUserId,
    approvedAt: (record as FinancialRecord)?.approvedAt,
    isEditable: (record as FinancialRecord)?.isEditable,
    notificationUserIds: (record as FinancialRecord)?.notificationUserIds,
  };
};

const FinanceDetailPage = () => {
  const { id } = useParams();
  const [formMode, setFormMode] = React.useState<"create" | "view" | "edit">(
    "view"
  );
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const [downloadingFormat, setDownloadingFormat] = React.useState<
    FinanceExportFormat | ""
  >("");
  const downloadMenuRef = React.useRef<HTMLDivElement | null>(null);

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

  React.useEffect(() => {
    if (!downloadOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setDownloadOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [downloadOpen]);

  const handleUpdateFinancial = async (
    values: FinanceData,
    action: FinanceSaveAction
  ) => {
    if (!id) return false;

    try {
      const response = await api.put.updateFinancial(
        {
          ...values,
          action,
        },
        { id }
      );
      const nextStatus = response.data.status || "DRAFT";
      const successMessage =
        nextStatus === "APPROVED"
          ? "Financial record approved successfully"
          : nextStatus === "PENDING_APPROVAL"
            ? "Financial record submitted for approval successfully"
            : "Financial record saved as draft successfully";
      showNotification(successMessage, "success");
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

  const handleDownload = async (format: FinanceExportFormat) => {
    if (!financialData) return;

    setDownloadingFormat(format);
    setDownloadOpen(false);

    try {
      await downloadFinanceDetails(financialData, format);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to download financial details.";
      showNotification(message, "error");
    } finally {
      setDownloadingFormat("");
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
    <div className="w-full space-y-6">
      <Banner>
        <div className="flex w-full items-center justify-between">
          <div className="w-full">
            <h1 className="text-2xl font-semibold">{headerTitle}</h1>
            <p className="mt-2">{headerSubtitle}</p>
            <div className="mt-3">
              <FinanceStatusBadge status={financialData.status} />
            </div>
          </div>

          <div className="flex  justify-end gap-3">
            {formMode === "view" && (
              <div className="relative" ref={downloadMenuRef}>
                <Button
                  value={downloadingFormat ? "Downloading..." : "Download"}
                  variant="secondary"
                  requireManageAccess={false}
                  disabled={Boolean(downloadingFormat)}
                  loading={Boolean(downloadingFormat)}
                  onClick={() => setDownloadOpen((open) => !open)}
                />

                {downloadOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(downloadingFormat)}
                      onClick={() => void handleDownload("docx")}
                    >
                      Download as DOCX
                    </button>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(downloadingFormat)}
                      onClick={() => void handleDownload("xlsx")}
                    >
                      Download as Spreadsheet
                    </button>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(downloadingFormat)}
                      onClick={() => void handleDownload("pdf")}
                    >
                      Download as PDF
                    </button>
                  </div>
                )}
              </div>
            )}

            {formMode === "view" && financialData.isEditable !== false && (
              <Button
                value="Edit Financials"
                variant="primary"
                requireManageAccess={false}
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
