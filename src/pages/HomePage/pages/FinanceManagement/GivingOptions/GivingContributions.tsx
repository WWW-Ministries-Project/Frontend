import { useFetch } from "@/CustomHooks/useFetch";
import PageHeader from "@/pages/HomePage/Components/PageHeader";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import type {
  GivingContribution,
  GivingContributionQuery,
  GivingContributionStatus,
} from "@/utils/api/finance/interface";
import { api } from "@/utils";
import { cn } from "@/utils/cn";
import React from "react";

type StatusFilter = "all" | GivingContributionStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "success",
  "pending",
  "failed",
  "abandoned",
];

const STATUS_STYLES: Record<GivingContributionStatus, string> = {
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  abandoned: "bg-lightGray/60 text-primaryGray",
};

/** Amounts are stored in minor units, so every display divides by 100. */
const formatAmount = (minorUnits: number, currency: string): string =>
  `${currency} ${(minorUnits / 100).toFixed(2)}`;

const formatDate = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const GivingContributions = () => {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  const query = React.useMemo<GivingContributionQuery>(
    () => (statusFilter === "all" ? {} : { status: statusFilter }),
    [statusFilter]
  );

  const { data, loading } = useFetch(api.fetch.fetchGivingContributions, query);

  const contributions = React.useMemo<GivingContribution[]>(
    () => (Array.isArray(data?.data) ? data.data : []),
    [data]
  );

  const totalReceived = React.useMemo(
    () =>
      contributions
        .filter((row) => row.status === "success")
        .reduce((sum, row) => sum + (row.amount_paid ?? row.amount), 0),
    [contributions]
  );

  return (
    <PageOutline>
      <PageHeader title="Giving Contributions" />

      <div className="my-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              statusFilter === filter
                ? "bg-primary text-white"
                : "bg-lightGray/40 text-primaryGray hover:bg-lightGray/70"
            )}
          >
            {filter}
          </button>
        ))}

        <p className="ml-auto text-sm font-semibold text-primaryGray">
          Received on this page: {formatAmount(totalReceived, "GHS")}
        </p>
      </div>

      {loading ? (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          Loading contributions...
        </p>
      ) : contributions.length === 0 ? (
        <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
          No contributions yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-lightGray/60">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-lightGray/30 text-primaryGray">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Giving option</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((row) => (
                <tr key={row.id} className="border-t border-lightGray/60">
                  <td className="px-4 py-3">
                    {formatDate(row.paid_at ?? row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{row.donor_name}</span>
                    <span className="block text-xs text-primaryGray">
                      {row.donor_email}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.giving_option_name}</td>
                  <td className="px-4 py-3">
                    {formatAmount(row.amount_paid ?? row.amount, row.currency)}
                    {row.amount_paid !== null &&
                    row.amount_paid !== row.amount ? (
                      <span
                        className="ml-2 text-xs font-medium text-red-600"
                        title={`Quoted ${formatAmount(row.amount, row.currency)}`}
                      >
                        mismatch
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {row.channel?.replace(/_/g, " ") ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                        STATUS_STYLES[row.status]
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageOutline>
  );
};

export default GivingContributions;
