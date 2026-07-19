import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import PageOutline from "../../../Components/PageOutline";
import TableComponent from "@/pages/HomePage/Components/reusable/TableComponent";
import { useFetch } from "@/CustomHooks/useFetch";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { api } from "@/utils";
import type { PledgerRow } from "@/utils/api/pledges/interface";
import { formatMoney, personLabel } from "./utils/pledgeHelpers";
import RedemptionModal from "./components/RedemptionModal";
import AddPledgersModal from "./components/AddPledgersModal";

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="border rounded-lg p-4 flex flex-col gap-1">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-lg font-semibold">{value}</span>
  </div>
);

const PledgeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAccessControl();
  const canManage = hasPermission("manage_financials");
  const { data, refetch } = useFetch(
    api.fetch.fetchPledge,
    id ? { id: Number(id) } : undefined,
  );
  const pledge = data?.data;

  const [redeemFor, setRedeemFor] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const pledgers: PledgerRow[] = useMemo(() => pledge?.pledgers ?? [], [pledge]);

  const columns: ColumnDef<PledgerRow>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "user",
        cell: ({ row }) => <span className="font-medium">{personLabel(row.original)}</span>,
      },
      {
        header: "Group",
        accessorKey: "group_label",
        cell: ({ row }) => <span>{row.original.group_label || formatMoney(row.original.called_amount)}</span>,
      },
      {
        header: "Pledged",
        accessorKey: "pledged_amount",
        cell: ({ row }) => <span>{formatMoney(row.original.pledged_amount)}</span>,
      },
      {
        header: "Redeemed",
        accessorKey: "redeemed",
        cell: ({ row }) => <span>{formatMoney(row.original.redeemed)}</span>,
      },
      {
        header: "Remaining",
        accessorKey: "remaining",
        cell: ({ row }) => <span>{formatMoney(row.original.remaining)}</span>,
      },
      ...(canManage
        ? [
            {
              header: "Actions",
              id: "actions",
              cell: ({ row }: { row: { original: PledgerRow } }) => (
                <button
                  type="button"
                  className="text-sm text-primary"
                  onClick={() => setRedeemFor(row.original.id)}
                >
                  Record redemption
                </button>
              ),
            } as ColumnDef<PledgerRow>,
          ]
        : []),
    ],
    [canManage],
  );

  if (!pledge) {
    return (
      <PageOutline>
        <p className="text-sm text-gray-500">Loading pledge…</p>
      </PageOutline>
    );
  }

  return (
    <PageOutline>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">
            {pledge.event?.event_name ?? pledge.title ?? "Pledge"}
          </h2>
          <p className="text-sm text-gray-500">
            Called by:{" "}
            {(pledge.callers ?? []).map((c) => personLabel(c)).join(", ") || "—"}
          </p>
          <span
            className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
              pledge.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {pledge.status === "completed" ? "Completed" : "In progress"}
          </span>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 border rounded-md text-sm"
              onClick={() => navigate(`/home/finance/pledges/${id}/edit`)}
            >
              Edit pledge
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-primary text-white rounded-md text-sm"
              onClick={() => setAddOpen(true)}
            >
              Add members
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total pledged" value={formatMoney(pledge.totalPledged)} />
        <StatCard label="Total redeemed" value={formatMoney(pledge.totalRedeemed)} />
        <StatCard label="Remaining" value={formatMoney(pledge.remaining)} />
        <StatCard label="% Covered" value={`${pledge.percent}%`} />
      </div>

      <TableComponent columns={columns} data={pledgers} />

      <RedemptionModal
        open={redeemFor != null}
        pledgerId={redeemFor}
        onClose={() => setRedeemFor(null)}
        onSuccess={refetch}
      />
      <AddPledgersModal
        open={addOpen}
        groups={pledge.groups}
        onClose={() => setAddOpen(false)}
        onSuccess={refetch}
      />
    </PageOutline>
  );
};

export default PledgeDetail;
