import type { PledgePayment } from "@/utils/api/pledges/interface";
import { cn } from "@/utils/cn";

const STATUS_STYLES: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  abandoned: "bg-lightGray/60 text-primaryGray",
};

/**
 * Payment amounts are minor units (pesewas), unlike the pledge/redemption
 * amounts elsewhere on this page which are major units. Keeping the formatters
 * named apart is what stops a GHS 50 payment rendering as GHS 0.50.
 */
const formatMinorUnits = (minorUnits: number, currency: string): string =>
  Number.isFinite(minorUnits)
    ? `${currency} ${(minorUnits / 100).toFixed(2)}`
    : `${currency} -`;

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

interface IProps {
  payments: PledgePayment[];
  loading?: boolean;
}

/**
 * Every online payment made against a pledge, successful or not.
 *
 * Distinct from the redemption ledger: a redemption is money the pledge has been
 * credited with (however it was collected), while these are Paystack attempts.
 * A successful one produces a redemption; a failed one produces nothing, which
 * is precisely why finance needs to see them — otherwise a member insisting they
 * paid has nothing to point at.
 */
const PledgePaymentsTable = ({ payments, loading = false }: IProps) => {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading online payments…</p>;
  }

  if (payments.length === 0) {
    return (
      <p className="rounded-lg bg-lightGray/30 px-4 py-6 text-sm text-primaryGray">
        No online payments have been made against this pledge yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-lightGray/60">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-lightGray/30 text-primaryGray">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Payer</th>
            <th className="px-4 py-3 font-medium">Redemption</th>
            <th className="px-4 py-3 font-medium">Fee / charged</th>
            <th className="px-4 py-3 font-medium">Method</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Reference</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((row) => {
            // amount_paid is what Paystack collected, i.e. the payer's charge -
            // so it is compared against amount_charged, not against `amount`
            // (the redemption the pledge receives). Rows predating the gross-up
            // have no amount_charged, so fall back to `amount`.
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
                <td className="px-4 py-3">{row.payer_name}</td>
                <td className="px-4 py-3">
                  <span className="block font-medium">
                    {formatMinorUnits(row.amount, row.currency)}
                  </span>
                  {isMismatch ? (
                    <span
                      className="mr-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600"
                      title={`Charged ${formatMinorUnits(expectedCharge, row.currency)}, Paystack collected ${formatMinorUnits(row.amount_paid as number, row.currency)}`}
                    >
                      mismatch
                    </span>
                  ) : null}
                  {isFeeDrift ? (
                    <span
                      className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                      title={`Grossed up by ${formatMinorUnits(row.fee, row.currency)}, Paystack actually charged ${formatMinorUnits(row.fee_actual as number, row.currency)}. The configured fee rate may be stale.`}
                    >
                      fee drift
                    </span>
                  ) : null}
                  {/* A settled payment with no ledger entry is the one failure
                      mode that loses money silently: the charge succeeded but
                      the pledger was never credited. */}
                  {row.status === "success" && row.redemption_id === null ? (
                    <span
                      className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600"
                      title="This payment settled but no redemption was recorded against the pledger. It needs to be entered manually."
                    >
                      not credited
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs text-primaryGray">
                  <span className="block">
                    Fee: {formatMinorUnits(row.fee, row.currency)}
                  </span>
                  <span className="block">
                    Charged:{" "}
                    {row.amount_charged !== null
                      ? formatMinorUnits(row.amount_charged, row.currency)
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
                      STATUS_STYLES[row.status] ??
                        "bg-lightGray/60 text-primaryGray"
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

export default PledgePaymentsTable;
