import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { HeaderControls } from "@/components/HeaderControls";
import PageOutline from "../../../Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { useFetch } from "@/CustomHooks/useFetch";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { api } from "@/utils";
import { useBranchStore, buildBranchQuery } from "@/store/useBranchStore";
import useWindowSize from "@/CustomHooks/useWindowSize";
import type { PledgeListRow, PledgeStatus } from "@/utils/api/pledges/interface";
import { formatMoney, personLabel } from "./utils/pledgeHelpers";

type StatusFilter = "" | PledgeStatus;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

const PledgesOverview = () => {
  const navigate = useNavigate();
  const { screenWidth } = useWindowSize();
  const { activeBranchId } = useBranchStore();
  const { hasPermission } = useAccessControl();
  const [status, setStatus] = useState<StatusFilter>("");

  const query = useMemo(
    () => ({ ...buildBranchQuery(activeBranchId), ...(status ? { status } : {}) }),
    [activeBranchId, status],
  );

  const { data } = useFetch(api.fetch.fetchPledges, query);
  const rows: PledgeListRow[] = useMemo(() => data?.data ?? [], [data]);

  const columns: ColumnDef<PledgeListRow>[] = useMemo(
    () => [
      {
        header: "Event",
        accessorKey: "event",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.event?.event_name ?? row.original.title ?? "—"}
          </span>
        ),
      },
      {
        header: "Called by",
        accessorKey: "callers",
        cell: ({ row }) => {
          const callers = row.original.callers ?? [];
          if (callers.length === 0) return <span className="text-gray-400">—</span>;
          return <span>{callers.map((c) => personLabel(c)).join(", ")}</span>;
        },
      },
      {
        header: "% Covered",
        accessorKey: "percent",
        cell: ({ row }) => {
          const pct = row.original.percent;
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs w-9 text-right">{pct}%</span>
            </div>
          );
        },
      },
      {
        header: "Redeemed / Total",
        accessorKey: "totalRedeemed",
        cell: ({ row }) => (
          <span>
            {formatMoney(row.original.totalRedeemed)} / {formatMoney(row.original.totalPledged)}
          </span>
        ),
      },
      {
        header: "Remaining",
        accessorKey: "remaining",
        cell: ({ row }) => <span>{formatMoney(row.original.remaining)}</span>,
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              row.original.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {row.original.status === "completed" ? "Completed" : "In progress"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <PageOutline>
      <HeaderControls
        title="Pledges"
        subtitle="Pledge campaigns, redemptions and progress"
        screenWidth={screenWidth}
        btnName={hasPermission("manage_financials") ? "Create Pledge" : undefined}
        handleClick={() => navigate("/home/finance/pledges/create")}
      />

      <div className="flex gap-2 my-4">
        {TABS.map((tab) => (
          <button
            key={tab.key || "all"}
            type="button"
            onClick={() => setStatus(tab.key)}
            className={`text-sm px-4 py-2 rounded-full border ${
              status === tab.key
                ? "bg-primary text-white border-primary"
                : "border-gray-300 text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TableComponent
        columns={columns}
        data={rows}
        onRowClick={(row) => navigate(`/home/finance/pledges/${row.id}`)}
      />
    </PageOutline>
  );
};

export default PledgesOverview;
