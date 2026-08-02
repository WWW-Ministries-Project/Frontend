import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import type {
  GivingContribution,
  GivingContributionQuery,
  GivingContributionStatus,
} from "@/utils/api/finance/interface";
import { cn } from "@/utils/cn";
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

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-lightGray/60 p-4">
    <span className="text-xs text-primaryGray">{label}</span>
    <span className="text-lg font-semibold text-primary">{value}</span>
  </div>
);

/**
 * One giving option and every transaction routed to it.
 *
 * Reached by clicking an option on the overview. The totals here are deliberately
 * computed from the rows on the page rather than asked for as an aggregate: the
 * contributions endpoint is paginated, so a figure labelled "total" would quietly
 * mean "total of the first page". The labels say so.
 */
const GivingOptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");

  const { data: optionData, loading: optionLoading } = useFetch(
    api.fetch.fetchGivingOption,
    id ? { id } : undefined
  );

  const contributionsQuery = React.useMemo<GivingContributionQuery>(
    () => ({
      ...(id ? { giving_option_id: id } : {}),
      ...(statusFilter === "all" ? {} : { status: statusFilter }),
    }),
    [id, statusFilter]
  );

  const { data: contributionsData, loading: contributionsLoading } = useFetch(
    api.fetch.fetchGivingContributions,
    contributionsQuery
  );

  const option = optionData?.data;

  const contributions = React.useMemo<GivingContribution[]>(
    () => (Array.isArray(contributionsData?.data) ? contributionsData.data : []),
    [contributionsData]
  );

  const successful = React.useMemo(
    () => contributions.filter((row) => row.status === "success"),
    [contributions]
  );

  // The fund's income, not the donors' charges: `amount` is the gift itself,
  // unaffected by the fee grossed up on top of it.
  const totalReceived = successful.reduce((sum, row) => sum + row.amount, 0);
  const unsuccessful = contributions.length - successful.length;
  const currency = option?.currency ?? contributions[0]?.currency ?? "GHS";

  if (optionLoading) {
    return (
      <PageOutline>
        <p className="text-sm text-primaryGray">Loading giving option…</p>
      </PageOutline>
    );
  }

  if (!option) {
    return (
      <PageOutline>
        <p className="text-sm text-primaryGray">
          This giving option could not be found.
        </p>
        <button
          type="button"
          className="mt-4 text-sm text-primary underline"
          onClick={() => navigate("/home/finance/giving-options")}
        >
          Back to giving options
        </button>
      </PageOutline>
    );
  }

  const isArchived = Boolean(option.archived_at);

  return (
    <PageOutline>
      <button
        type="button"
        className="text-sm text-primary underline"
        onClick={() => navigate("/home/finance/giving-options")}
      >
        ← Back to giving options
      </button>

      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-primary">{option.name}</h2>
          <p className="text-sm text-primaryGray">
            {option.description || "No description available."}
          </p>
          <p className="text-sm text-primary">
            {option.bank_name} &middot; {option.masked_account_number} &middot;{" "}
            {option.account_name}
          </p>
          <p className="text-xs text-primaryGray">
            Routes 100% of payments to this account ({option.currency})
          </p>
        </div>

        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            isArchived
              ? "bg-lightGray text-primaryGray"
              : "bg-green-100 text-green-700"
          )}
        >
          {isArchived ? "Archived" : "Active"}
        </span>
      </div>

      {!option.is_synced && (
        <p className="mb-6 flex items-start gap-1.5 text-xs font-medium text-amber-600">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          Not in sync with Paystack. Donors cannot give to this option until it is
          re-synced — save it again from the overview to mint a fresh subaccount.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Received (this page)"
          value={formatAmount(totalReceived, currency)}
        />
        <StatCard label="Successful" value={String(successful.length)} />
        <StatCard label="Unsuccessful" value={String(unsuccessful)} />
        <StatCard label="Transactions" value={String(contributions.length)} />
      </div>

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
      </div>

      <ContributionsTable
        contributions={contributions}
        loading={contributionsLoading}
        showGivingOption={false}
        emptyText={
          statusFilter === "all"
            ? "No transactions have been routed to this giving option yet."
            : `No ${statusFilter} transactions for this giving option.`
        }
      />
    </PageOutline>
  );
};

export default GivingOptionDetail;
