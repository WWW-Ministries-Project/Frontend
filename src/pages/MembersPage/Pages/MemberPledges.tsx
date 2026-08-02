import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  MyPledgeRow,
  PledgeFeePreview,
} from "@/utils/api/pledges/interface";
import BannerWrapper from "../layouts/BannerWrapper";

const MINIMUM_MINOR_UNITS = 100;

/** Pledged/redeemed amounts arrive in major units; payments are minor units. */
const formatMajorUnits = (amount: number, currency = "GHS"): string =>
  `${currency} ${Number(amount ?? 0).toFixed(2)}`;

const formatMinorUnits = (minorUnits: number, currency = "GHS"): string =>
  Number.isFinite(minorUnits)
    ? `${currency} ${(minorUnits / 100).toFixed(2)}`
    : `${currency} --`;

const formatDate = (value?: string | null): string =>
  value ? new Date(value).toLocaleDateString() : "--";

const statusClass = (status: string): string => {
  if (status === "success") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "failed" || status === "abandoned") return "bg-red-100 text-red-700";
  return "bg-lightGray text-primaryGray";
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
};

const pledgeLabel = (row: MyPledgeRow): string =>
  row.title || row.event_name || `Pledge #${row.pledge_id}`;

const MemberPledges = () => {
  const [selected, setSelected] = useState<MyPledgeRow | null>(null);
  const [amountText, setAmountText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feePreview, setFeePreview] = useState<PledgeFeePreview | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const { data: pledgesData, loading: pledgesLoading } = useFetch(
    api.fetch.fetchMyPledges
  );
  const { data: paymentsData, loading: paymentsLoading } = useFetch(
    api.fetch.fetchMyPledgePayments
  );

  const pledges = useMemo(
    () => (Array.isArray(pledgesData?.data) ? pledgesData.data : []),
    [pledgesData]
  );
  const payments = useMemo(
    () => (Array.isArray(paymentsData?.data) ? paymentsData.data : []),
    [paymentsData]
  );

  const minorUnits = useMemo(() => {
    const parsed = Number(amountText);
    // Rounded at the boundary: 10.005 * 100 is 1000.4999… in binary floating
    // point, and the API rejects a non-integer amount outright.
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : NaN;
  }, [amountText]);

  const remainingMinorUnits = selected
    ? Math.round(selected.remaining * 100)
    : 0;

  /**
   * Debounced server-side fee preview. The fee formula lives on the backend, so
   * asking for it is what keeps the quoted total and the actual charge in step.
   */
  useEffect(() => {
    setFeePreview(null);

    if (!Number.isFinite(minorUnits) || minorUnits < MINIMUM_MINOR_UNITS) {
      setFeeLoading(false);
      return;
    }

    setFeeLoading(true);
    const timer = setTimeout(() => {
      api.fetch
        .fetchPledgeFeePreview({ amount: minorUnits })
        .then((response) => setFeePreview(response?.data ?? null))
        .catch(() => setFeePreview(null))
        .finally(() => setFeeLoading(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [minorUnits]);

  const closeSheet = () => {
    setSelected(null);
    setAmountText("");
    setFeePreview(null);
  };

  const pay = async () => {
    if (!selected) return;

    if (!Number.isFinite(minorUnits)) {
      showNotification("Enter a valid amount, for example 50.00", "error");
      return;
    }

    if (minorUnits < MINIMUM_MINOR_UNITS) {
      showNotification("The minimum payment is GHS 1.00", "error");
      return;
    }

    // Checked here too, not only server-side, so the member is told before
    // being sent to Paystack rather than after.
    if (minorUnits > remainingMinorUnits) {
      showNotification(
        `The outstanding balance on this pledge is ${formatMajorUnits(
          selected.remaining,
          selected.currency
        )}`,
        "error"
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post.initializePledgePayment({
        pledger_id: selected.pledger_id,
        amount: minorUnits,
        // Picks the in-browser landing page over the mobile deep-link one. The
        // server owns both URLs; this only chooses between them.
        client: "web",
      });

      const checkoutUrl = response?.data?.checkoutUrl;

      if (!checkoutUrl) throw new Error("Checkout URL was not returned.");

      window.location.assign(checkoutUrl);
    } catch (error) {
      showNotification(
        extractErrorMessage(error, "Unable to start this payment"),
        "error"
      );
      setSubmitting(false);
    }
  };

  return (
    <div>
      <BannerWrapper>
        <div className="space-y-4 w-full">
          <div className="font-bold text-3xl">My Pledges</div>
          <div>
            Track what you have pledged, what you have redeemed, and pay off the
            balance online.
          </div>
        </div>
      </BannerWrapper>

      <main className="mx-auto flex flex-col gap-8 py-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-primary">Your pledges</h2>

          {pledgesLoading ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-sm text-primaryGray">
              Loading your pledges...
            </div>
          ) : pledges.length === 0 ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-primaryGray">
              You have no pledges yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pledges.map((row) => (
                <div
                  key={row.pledger_id}
                  className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5"
                >
                  <div>
                    <h3 className="text-lg font-medium text-primary">
                      {pledgeLabel(row)}
                    </h3>
                    <p className="text-sm text-primaryGray">
                      {row.event_name ?? "Pledge"}
                      {row.group_label ? ` · ${row.group_label}` : ""}
                      {row.deadline ? ` · due ${formatDate(row.deadline)}` : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-primaryGray">Pledged</div>
                      <div className="font-semibold">
                        {formatMajorUnits(row.pledged_amount, row.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-primaryGray">Redeemed</div>
                      <div className="font-semibold">
                        {formatMajorUnits(row.redeemed, row.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-primaryGray">Outstanding</div>
                      <div className="font-semibold">
                        {formatMajorUnits(row.remaining, row.currency)}
                      </div>
                    </div>
                  </div>

                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-lightGray"
                    role="progressbar"
                    aria-valuenow={row.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${pledgeLabel(row)} redemption progress`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(row.percent, 100)}%` }}
                    />
                  </div>

                  {row.status === "completed" ? (
                    <p className="text-sm font-medium text-green-700">
                      Fully redeemed. Thank you.
                    </p>
                  ) : row.can_be_paid_online ? (
                    <Button
                      value="Pay pledge"
                      onClick={() => {
                        setSelected(row);
                        setAmountText(row.remaining.toFixed(2));
                      }}
                    />
                  ) : (
                    <p className="text-sm text-amber-700">
                      Online payment is not available for this pledge yet.
                      Please contact the church office.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-primary">Payment history</h2>

          {paymentsLoading ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-sm text-primaryGray">
              Loading your payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-primaryGray">
              You have not paid a pledge online yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-lightGray bg-white">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-lightGray text-primaryGray">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pledge</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((row) => (
                    <tr key={row.id} className="border-b border-lightGray/60">
                      <td className="px-4 py-3">{row.pledge_title}</td>
                      <td className="px-4 py-3">
                        {formatDate(row.paid_at ?? row.createdAt)}
                      </td>
                      {/* The redemption, not amount_paid: amount_paid is the
                          grossed-up card charge including the fee. */}
                      <td className="px-4 py-3">
                        {formatMinorUnits(row.amount, row.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Pay ${pledgeLabel(selected)}`}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-primary">
              {pledgeLabel(selected)}
            </h3>
            <p className="mt-1 text-sm text-primaryGray">
              Outstanding:{" "}
              {formatMajorUnits(selected.remaining, selected.currency)}
            </p>

            <label className="mt-4 block text-sm font-medium" htmlFor="amount">
              Amount ({selected.currency})
            </label>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              max={selected.remaining}
              className="mt-1 w-full rounded-md border border-lightGray p-2 text-sm"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
            />

            <button
              type="button"
              className="mt-2 text-sm text-primary underline"
              onClick={() => setAmountText(selected.remaining.toFixed(2))}
            >
              Pay the full balance
            </button>

            {feeLoading ? (
              <p className="mt-4 text-sm text-primaryGray">Calculating…</p>
            ) : feePreview ? (
              <dl className="mt-4 space-y-1 rounded-lg bg-lightGray/30 p-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-primaryGray">Redemption</dt>
                  <dd>{formatMinorUnits(feePreview.amount, selected.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-primaryGray">Transaction fee</dt>
                  <dd>{formatMinorUnits(feePreview.fee, selected.currency)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>You&apos;ll pay</dt>
                  <dd>
                    {formatMinorUnits(
                      feePreview.amount_charged,
                      selected.currency
                    )}
                  </dd>
                </div>
              </dl>
            ) : null}

            <p className="mt-4 text-xs text-primaryGray">
              You will be taken to a secure Paystack page, then returned here.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                value="Cancel"
                variant="secondary"
                onClick={closeSheet}
                disabled={submitting}
              />
              <Button
                value={
                  feePreview
                    ? `Pay ${formatMinorUnits(
                        feePreview.amount_charged,
                        selected.currency
                      )}`
                    : "Continue to payment"
                }
                onClick={pay}
                disabled={submitting}
                loading={submitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberPledges;
