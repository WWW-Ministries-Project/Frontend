import type {
  GivingContribution,
  GivingContributionStatus,
} from "@/utils/api/finance/interface";
import { cn } from "@/utils/cn";
import { formatAmount, formatDateTime } from "../utils/formatters";

const STATUS_STYLES: Record<GivingContributionStatus, string> = {
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  abandoned: "bg-lightGray/60 text-primaryGray",
};

interface IProps {
  contributions: GivingContribution[];
  loading?: boolean;
  emptyText?: string;
  /**
   * Hidden when the table is already scoped to a single fund — repeating the
   * same option name down every row is noise on a detail page.
   */
  showGivingOption?: boolean;
}

/**
 * Every contribution row, as finance staff need to read it: the gift, the fee
 * the donor covered, and the two reconciliation warnings that matter.
 *
 * Shared by the all-contributions page and a single giving option's detail page
 * so the mismatch and fee-drift badges cannot end up on one and not the other.
 */
const ContributionsTable = ({
  contributions,
  loading = false,
  emptyText = "No contributions yet.",
  showGivingOption = true,
}: IProps) => {
  if (loading) {
    return (
      <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
        Loading contributions...
      </p>
    );
  }

  if (contributions.length === 0) {
    return (
      <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-lightGray/60">
      <table
        className={cn(
          "w-full text-left text-sm",
          showGivingOption ? "min-w-[1050px]" : "min-w-[900px]"
        )}
      >
        <thead className="bg-lightGray/30 text-primaryGray">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Donor</th>
            {showGivingOption && (
              <th className="px-4 py-3 font-medium">Giving option</th>
            )}
            <th className="px-4 py-3 font-medium">Giving</th>
            <th className="px-4 py-3 font-medium">Fee / charged</th>
            <th className="px-4 py-3 font-medium">Method</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Reference</th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((row) => {
            // The gross-up means `amount_paid` (what Paystack collected) is the
            // donor's charge, not the gift - so it must be compared against
            // `amount_charged`. Rows predating the gross-up have no
            // `amount_charged`, so fall back to `amount` for those.
            const expectedCharge = row.amount_charged ?? row.amount;
            const isMismatch =
              row.amount_paid !== null && row.amount_paid !== expectedCharge;
            const isFeeDrift =
              row.fee_actual !== null && row.fee_actual !== row.fee;

            return (
              <tr key={row.id} className="border-t border-lightGray/60">
                <td className="px-4 py-3">
                  {formatDateTime(row.paid_at ?? row.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="block">{row.donor_name}</span>
                  <span className="block text-xs text-primaryGray">
                    {row.donor_email}
                  </span>
                </td>
                {showGivingOption && (
                  <td className="px-4 py-3">{row.giving_option_name}</td>
                )}
                <td className="px-4 py-3">
                  <span className="block font-medium">
                    {formatAmount(row.amount, row.currency)}
                  </span>
                  {isMismatch ? (
                    <span
                      className="mr-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600"
                      title={`Charged ${formatAmount(expectedCharge, row.currency)}, Paystack collected ${formatAmount(row.amount_paid as number, row.currency)}`}
                    >
                      mismatch
                    </span>
                  ) : null}
                  {isFeeDrift ? (
                    <span
                      className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                      title={`Grossed up by ${formatAmount(row.fee, row.currency)}, Paystack actually charged ${formatAmount(row.fee_actual as number, row.currency)}. The configured fee rate may be stale.`}
                    >
                      fee drift
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs text-primaryGray">
                  <span className="block">
                    Fee: {formatAmount(row.fee, row.currency)}
                  </span>
                  <span className="block">
                    Charged:{" "}
                    {row.amount_charged !== null
                      ? formatAmount(row.amount_charged, row.currency)
                      : "-"}
                  </span>
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
                <td className="px-4 py-3 font-mono text-xs">{row.reference}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ContributionsTable;
