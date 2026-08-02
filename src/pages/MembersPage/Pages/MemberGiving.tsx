import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type {
  AvailableGivingOption,
  GivingFeePreview,
} from "@/utils/api/finance/interface";
import BannerWrapper from "../layouts/BannerWrapper";

/** Presets in minor units (pesewas), matching the mobile app's Give screen. */
const PRESETS_MINOR_UNITS = [1000, 2000, 5000, 10000];

const MINIMUM_MINOR_UNITS = 100;

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

const MemberGiving = () => {
  const [selected, setSelected] = useState<AvailableGivingOption | null>(null);
  const [amountText, setAmountText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feePreview, setFeePreview] = useState<GivingFeePreview | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  const { data: optionsData, loading: optionsLoading } = useFetch(
    api.fetch.fetchAvailableGivingOptions
  );
  const { data: historyData, loading: historyLoading } = useFetch(
    api.fetch.fetchMyContributions
  );

  const options = useMemo(
    () => (Array.isArray(optionsData?.data) ? optionsData.data : []),
    [optionsData]
  );
  const contributions = useMemo(
    () => (Array.isArray(historyData?.data) ? historyData.data : []),
    [historyData]
  );

  const minorUnits = useMemo(() => {
    const parsed = Number(amountText);
    // Rounded at the boundary: 10.005 * 100 is 1000.4999… in binary floating
    // point, and the API rejects a non-integer amount outright.
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : NaN;
  }, [amountText]);

  /**
   * Debounced server-side fee preview. The fee formula lives on the backend, so
   * it must be asked for rather than recomputed here, where a copy would drift
   * from the configured rate. Clearing synchronously guarantees the breakdown
   * never shows a stale figure next to what the member is currently typing.
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
        .fetchGivingFeePreview({ amount: minorUnits })
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

  const give = async () => {
    if (!selected) return;

    if (!Number.isFinite(minorUnits)) {
      showNotification("Enter a valid amount, for example 50.00", "error");
      return;
    }

    if (minorUnits < MINIMUM_MINOR_UNITS) {
      showNotification("The minimum contribution is GHS 1.00", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post.initializeGiving({
        giving_option_id: selected.id,
        amount: minorUnits,
        // Sends the browser to the in-app landing page instead of the mobile
        // deep-link page. The server owns both URLs; this only picks between them.
        client: "web",
      });

      const checkoutUrl = response?.data?.checkoutUrl;

      if (!checkoutUrl) throw new Error("Checkout URL was not returned.");

      // Same tab, deliberately: Paystack redirects back to our own completion
      // page afterwards, and a popup would be blocked as often as not.
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
          <div className="font-bold text-3xl">Giving</div>
          <div>
            Support the work of the ministry and keep track of everything you
            have given.
          </div>
        </div>
      </BannerWrapper>

      <main className="mx-auto flex flex-col gap-8 py-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-primary">Ways to give</h2>

          {optionsLoading ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-sm text-primaryGray">
              Loading giving options...
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-primaryGray">
              No giving options are available yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-lightGray bg-white p-5"
                >
                  <div>
                    <h3 className="text-lg font-medium text-primary">
                      {option.name}
                    </h3>
                    {option.description && (
                      <p className="mt-1 text-sm text-primaryGray">
                        {option.description}
                      </p>
                    )}
                  </div>
                  <Button
                    value="Give"
                    onClick={() => {
                      setSelected(option);
                      setAmountText("");
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-primary">Giving history</h2>

          {historyLoading ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-sm text-primaryGray">
              Loading your giving...
            </div>
          ) : contributions.length === 0 ? (
            <div className="rounded-xl border border-lightGray bg-white p-6 text-primaryGray">
              You have not given yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-lightGray bg-white">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-lightGray text-primaryGray">
                  <tr>
                    <th className="px-4 py-3 font-medium">Giving option</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((row) => (
                    <tr key={row.id} className="border-b border-lightGray/60">
                      <td className="px-4 py-3">{row.giving_option_name}</td>
                      <td className="px-4 py-3">
                        {formatDate(row.paid_at ?? row.createdAt)}
                      </td>
                      {/* The donation, not amount_paid: amount_paid is the
                          grossed-up card charge, and history should read as
                          "what I gave", consistent with the receipt email. */}
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
          aria-label={`Give to ${selected.name}`}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-primary">
              {selected.name}
            </h3>
            {selected.description && (
              <p className="mt-1 text-sm text-primaryGray">
                {selected.description}
              </p>
            )}

            <label className="mt-4 block text-sm font-medium" htmlFor="amount">
              Amount ({selected.currency})
            </label>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-lightGray p-2 text-sm"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS_MINOR_UNITS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="rounded-md border border-lightGray px-3 py-1 text-sm hover:bg-primary/5"
                  onClick={() => setAmountText((preset / 100).toFixed(2))}
                >
                  {formatMinorUnits(preset, selected.currency)}
                </button>
              ))}
            </div>

            {feeLoading ? (
              <p className="mt-4 text-sm text-primaryGray">Calculating…</p>
            ) : feePreview ? (
              <dl className="mt-4 space-y-1 rounded-lg bg-lightGray/30 p-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-primaryGray">Your giving</dt>
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
                onClick={give}
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

export default MemberGiving;
