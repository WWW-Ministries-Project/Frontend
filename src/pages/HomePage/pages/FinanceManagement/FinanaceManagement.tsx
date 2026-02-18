import React from "react";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../Components/PageOutline";
import FinanceCard from "./Components/FinanaceCard";
import { useNavigate } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { useDelete } from "@/CustomHooks/useDelete";
import { showDeleteDialog, showNotification } from "@/pages/HomePage/utils";
import { FinanceData, FinancialRecord } from "@/utils/api/finance/interface";

type FinanceCardData = {
  id: string;
  title: string;
  createdBy: string;
  createdDate: string;
  from: string;
  to: string;
  updatedBy: string;
  updatedDate: string;
  groupDate: string;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const getMonthYearLabel = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
};

const groupByMonthYear = (data: FinanceCardData[]) => {
  return data.reduce((acc, item) => {
    const group = getMonthYearLabel(item.groupDate || item.from);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, FinanceCardData[]>);
};

const getCurrentMonthYear = () => {
  const now = new Date();
  return now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
};

const mapFinancialToCard = (record: FinancialRecord): FinanceCardData => {
  const payload = record?.payload || ({} as FinanceData);
  const metaData = payload?.metaData || {};
  const month = metaData.month || "";
  const year = metaData.year || "";
  const week = metaData.week || "";

  const titleParts = [`${month} ${year}`.trim(), week].filter(Boolean);
  const createdDateRaw = metaData.createdDate || record?.createdAt || "";
  const updatedDateRaw = metaData.updatedDate || record?.updatedAt || "";
  const from = metaData.from || "—";
  const to = metaData.to || "—";

  return {
    id: String(record?.id ?? record?._id ?? record?.financialId ?? ""),
    title: titleParts.length > 0 ? titleParts.join(", ") : "Financial Record",
    createdBy: metaData.createdBy || "—",
    createdDate: formatDate(createdDateRaw),
    from,
    to,
    updatedBy: metaData.updatedBy || "—",
    updatedDate: formatDate(updatedDateRaw),
    groupDate: createdDateRaw || from,
  };
};

const extractFinancialRecords = (
  payload: FinancialRecord[] | FinancialRecord | FinanceData | undefined
): FinancialRecord[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .map((record: any) => {
        if (!record) return null;

        if (record.payload && record.id) {
          return record as FinancialRecord;
        }

        if (record.id) {
          return {
            id: String(record.id),
            payload: record as FinanceData,
            createdAt: record?.metaData?.createdDate,
            updatedAt: record?.metaData?.updatedDate,
          } as FinancialRecord;
        }

        return null;
      })
      .filter(Boolean) as FinancialRecord[];
  }

  if ((payload as any).payload && (payload as any).id) {
    return [payload as FinancialRecord];
  }

  if ((payload as any).id) {
    return [
      {
        id: String((payload as any).id),
        payload: payload as FinanceData,
        createdAt: (payload as any)?.metaData?.createdDate,
        updatedAt: (payload as any)?.metaData?.updatedDate,
      },
    ];
  }

  return [];
};

const FinanceManager = () => {
  const navigate = useNavigate();
  const [page] = React.useState(1);
  const [take] = React.useState(20);
  const [screenWidth, setScreenWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    {}
  );

  const { data, refetch, loading, error } = useFetch(api.fetch.fetchFinancials, {
    page,
    take,
  });
  const { executeDelete, success } = useDelete(api.delete.deleteFinancial);

  const financialItems = React.useMemo(() => {
    const records = extractFinancialRecords(data?.data);
    return records.map(mapFinancialToCard).filter((record) => record.id);
  }, [data]);

  const groupedData = React.useMemo(
    () => groupByMonthYear(financialItems),
    [financialItems]
  );
  const currentGroup = getCurrentMonthYear();
  const groupKeys = React.useMemo(() => Object.keys(groupedData), [groupedData]);

  const defaultOpenGroup = React.useMemo(() => {
    if (groupKeys.length === 0) return "";
    if (groupKeys.includes(currentGroup)) return currentGroup;
    return [...groupKeys].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [groupKeys, currentGroup]);

  React.useEffect(() => {
    setOpenGroups((prev) => {
      const next: Record<string, boolean> = {};
      groupKeys.forEach((key) => {
        next[key] = prev[key] ?? key === defaultOpenGroup;
      });
      return next;
    });
  }, [groupKeys, defaultOpenGroup]);

  React.useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (success) {
      showNotification("Financial record deleted successfully", "success");
      void refetch({ page, take });
    }
  }, [success, refetch, page, take]);

  return (
    <PageOutline>
      <HeaderControls
        title="Finance Management"
        subtitle="Manage all financial activities and records"
        screenWidth={screenWidth}
        btnName="Add Transaction"
        handleClick={() => {
          navigate("create");
        }}
      />

      <div className="space-y-4">
        {loading && (
          <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
            Loading financial records...
          </p>
        )}

        {error && !loading && (
          <p className="rounded-lg bg-red-50 px-4 py-6 text-sm text-red-700">
            Failed to load financial records. Please refresh and try again.
          </p>
        )}

        {!loading && !error && groupKeys.length === 0 && (
          <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
            No financial records found.
          </p>
        )}

        {Object.entries(groupedData).map(([group, items]) => (
          <div key={group} className="space-y-3">
            <button
              className="flex w-full items-center justify-between rounded-lg border border-lightGray bg-lightGray/30 px-4 py-3 text-lg font-semibold text-primary"
              onClick={() =>
                setOpenGroups((prev) => ({
                  ...prev,
                  [group]: !prev[group],
                }))
              }
            >
              <div className="flex gap-x-2">
                <span>{group}</span>
                <span>({items.length})</span>
              </div>
              <span className="text-sm">{openGroups[group] ? "−" : "+"}</span>
            </button>

            {openGroups[group] && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div key={item.id}>
                    <FinanceCard
                      finance={item}
                      onEdit={
                        item.id
                          ? () => navigate(item.id)
                          : undefined
                      }
                      onDelete={() =>
                        showDeleteDialog(
                          {
                            name: item.title || "financial record",
                            id: item.id,
                          },
                          (selectedId) =>
                            executeDelete({
                              id: String(selectedId),
                            })
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageOutline>
  );
};

export default FinanceManager;
