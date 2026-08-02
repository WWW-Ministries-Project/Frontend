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
import ContributionsTable from "./components/ContributionsTable";
import { formatAmount } from "./utils/formatters";

type StatusFilter = "all" | GivingContributionStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "success",
  "pending",
  "failed",
  "abandoned",
];

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

  // The fund's income, not the donor's charge: `amount` is the donation itself,
  // unaffected by the fee grossed up on top of it.
  const totalReceived = React.useMemo(
    () =>
      contributions
        .filter((row) => row.status === "success")
        .reduce((sum, row) => sum + row.amount, 0),
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

      <ContributionsTable contributions={contributions} loading={loading} />
    </PageOutline>
  );
};

export default GivingContributions;
