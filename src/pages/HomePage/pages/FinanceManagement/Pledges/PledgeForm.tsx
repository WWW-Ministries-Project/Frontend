import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, FieldArray } from "formik";
import PageOutline from "../../../Components/PageOutline";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { BranchSelectField } from "@/components/BranchSelectField";
import { useStore } from "@/store/useStore";
import { useBranchStore, ALL_BRANCHES } from "@/store/useBranchStore";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import CallerFieldArray from "./components/CallerFieldArray";
import PledgerFieldArray from "./components/PledgerFieldArray";
import {
  pledgeSchema,
  toPayload,
  emptyGroup,
  detailToFormValues,
  CURRENCY,
  type PledgeFormValues,
} from "./utils/pledgeHelpers";

interface PledgeFormProps {
  mode: "create" | "edit";
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "ghipss", label: "Bank account" },
  { value: "mobile_money", label: "Mobile money" },
];

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
};

const buildInitialValues = (): PledgeFormValues => ({
  branch_id: "",
  event_id: "",
  title: "",
  target_amount: "",
  deadline: "",
  callers: [],
  groups: [emptyGroup()],
  editGroups: true,
  account_type: "ghipss",
  settlement_bank: "",
  bank_name: "",
  account_number: "",
  account_name: "",
  editAccount: true,
});

const PledgeForm = ({ mode }: PledgeFormProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const membersOptions = useStore((state) => state.membersOptions);
  const eventsOptions = useStore((state) => state.eventsOptions);
  const { activeBranchId } = useBranchStore();
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const { data: detail } = useFetch(
    api.fetch.fetchPledge,
    mode === "edit" && id ? { id: Number(id) } : undefined,
    mode !== "edit",
  );

  const { data: banksResponse, loading: banksLoading } = useFetch(
    api.fetch.fetchPaystackBanks,
    { currency: CURRENCY },
  );

  const banks = useMemo(
    () => (Array.isArray(banksResponse?.data) ? banksResponse.data : []),
    [banksResponse],
  );

  const initialValues = useMemo<PledgeFormValues>(() => {
    if (mode === "edit" && detail?.data) return detailToFormValues(detail.data);
    return buildInitialValues();
  }, [mode, detail]);

  const handleSubmit = async (values: PledgeFormValues) => {
    if (activeBranchId === ALL_BRANCHES && !values.branch_id) {
      showNotification("Please select a branch", "error");
      return;
    }
    const payload = toPayload(values, mode);
    setSubmitting(true);
    try {
      if (mode === "edit" && id) {
        await api.put.updatePledge({ ...payload, id: Number(id) });
        showNotification("Pledge updated", "success");
        navigate(`/home/finance/pledges/${id}`);
      } else {
        const res = await api.post.createPledge(payload);
        showNotification("Pledge created", "success");
        const newId = res?.data?.id;
        navigate(newId ? `/home/finance/pledges/${newId}` : "/home/finance/pledges");
      }
    } catch (error) {
      // Surfaced verbatim: creating a pledge mints a Paystack subaccount, and
      // "Paystack rejected the settlement account" is actionable in a way that
      // a generic failure is not.
      showNotification(
        extractErrorMessage(error, "Something went wrong saving the pledge"),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageOutline>
      <h2 className="text-xl font-semibold mb-4">
        {mode === "edit" ? "Edit Pledge" : "Create Pledge"}
      </h2>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={pledgeSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched }) => {
          const bankOptions = banks
            .filter((bank) =>
              values.account_type === "mobile_money"
                ? bank.type === "mobile_money"
                : bank.type !== "mobile_money",
            )
            .map((bank) => ({ value: bank.code, label: bank.name }));

          /**
           * Convenience only. Paystack's resolve endpoint has patchy coverage
           * in Ghana, so a miss is silent and the typed name stands.
           */
          const tryResolveAccountName = async () => {
            const accountNumber = values.account_number.trim();

            if (!values.settlement_bank || !/^[0-9]{5,20}$/.test(accountNumber)) {
              return;
            }

            setResolving(true);

            try {
              const response = await api.fetch.resolveBankAccount({
                account_number: accountNumber,
                bank_code: values.settlement_bank,
              });

              if (response?.data?.account_name) {
                setFieldValue("account_name", response.data.account_name);
              }
            } catch {
              // Deliberately silent — the field stays editable.
            } finally {
              setResolving(false);
            }
          };

          return (
          <Form className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <BranchSelectField
                value={values.branch_id}
                onChange={(v) => setFieldValue("branch_id", v)}
                required
              />
              <div className="flex flex-col">
                <label className="text-sm font-medium">Event</label>
                <SelectField
                  id="event_id"
                  placeholder="Select event"
                  searchable
                  options={eventsOptions}
                  value={values.event_id}
                  onChange={(_n, value) =>
                    setFieldValue("event_id", value === "" || value == null ? "" : Number(value))
                  }
                  error={touched.event_id ? (errors.event_id as string) : undefined}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Title (optional)</label>
                <input
                  className="border rounded-md p-2 text-sm"
                  value={values.title}
                  onChange={(e) => setFieldValue("title", e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Target amount (optional)</label>
                <input
                  type="number"
                  className="border rounded-md p-2 text-sm"
                  value={values.target_amount}
                  onChange={(e) =>
                    setFieldValue(
                      "target_amount",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Deadline (optional)</label>
                <input
                  type="date"
                  className="border rounded-md p-2 text-sm"
                  value={values.deadline}
                  onChange={(e) => setFieldValue("deadline", e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4 flex flex-col gap-4">
              <div>
                <h4 className="font-semibold">Settlement account</h4>
                <p className="text-sm text-gray-500">
                  Redemptions paid online are routed in full to this account.
                  Paystack transaction fees are added on top and paid by the
                  member, so the pledge receives the whole amount.
                </p>
              </div>

              {mode === "edit" && (
                <div className="rounded-md border bg-gray-50 p-3 text-sm flex flex-col gap-1">
                  <span>
                    Current:{" "}
                    <strong>
                      {detail?.data?.bank_name ?? "No account on file"}
                    </strong>
                    {detail?.data?.masked_account_number
                      ? ` · ${detail.data.masked_account_number}`
                      : ""}
                    {detail?.data?.account_name
                      ? ` · ${detail.data.account_name}`
                      : ""}
                  </span>
                  {detail?.data && !detail.data.can_be_paid_online && (
                    <span className="text-amber-700">
                      This pledge cannot take online payments yet. Set a
                      settlement account below to enable them.
                    </span>
                  )}
                  <label className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={values.editAccount}
                      onChange={(e) =>
                        setFieldValue("editAccount", e.target.checked)
                      }
                    />
                    Change the settlement account
                  </label>
                </div>
              )}

              {(mode === "create" || values.editAccount) && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium">
                      Settlement account type
                    </label>
                    <SelectField
                      id="account_type"
                      placeholder="Select"
                      options={ACCOUNT_TYPE_OPTIONS}
                      value={values.account_type}
                      onChange={(_n, value) => {
                        setFieldValue("account_type", value ?? "ghipss");
                        // Bank codes are not shared between the two lists.
                        setFieldValue("settlement_bank", "");
                        setFieldValue("bank_name", "");
                      }}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium">
                      {values.account_type === "mobile_money"
                        ? "Mobile money provider"
                        : "Bank"}
                    </label>
                    <SelectField
                      id="settlement_bank"
                      searchable
                      placeholder={
                        banksLoading ? "Loading providers..." : "Select"
                      }
                      options={bankOptions}
                      value={values.settlement_bank}
                      onChange={(_n, value) => {
                        const code = value == null ? "" : String(value);
                        setFieldValue("settlement_bank", code);
                        // bank_name travels with the code: the API stores the
                        // human label for display and cannot derive it.
                        setFieldValue(
                          "bank_name",
                          banks.find((bank) => bank.code === code)?.name ?? "",
                        );
                      }}
                      error={
                        touched.settlement_bank
                          ? (errors.settlement_bank as string)
                          : undefined
                      }
                    />
                    {!banksLoading && bankOptions.length === 0 && (
                      <span className="text-xs text-amber-700">
                        Could not load the list from Paystack. Check the
                        server&apos;s Paystack configuration.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium">
                      {values.account_type === "mobile_money"
                        ? "Mobile money number"
                        : "Account number"}
                    </label>
                    <input
                      className="border rounded-md p-2 text-sm"
                      value={values.account_number}
                      onChange={(e) =>
                        setFieldValue("account_number", e.target.value)
                      }
                      onBlur={() => void tryResolveAccountName()}
                    />
                    {touched.account_number && errors.account_number && (
                      <span className="text-xs text-red-500">
                        {errors.account_number as string}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium">Account name</label>
                    <input
                      className="border rounded-md p-2 text-sm"
                      placeholder={
                        resolving
                          ? "Looking up account name..."
                          : "Account holder name"
                      }
                      value={values.account_name}
                      onChange={(e) =>
                        setFieldValue("account_name", e.target.value)
                      }
                    />
                    {touched.account_name && errors.account_name && (
                      <span className="text-xs text-red-500">
                        {errors.account_name as string}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <CallerFieldArray membersOptions={membersOptions} />
            </div>

            {mode === "edit" && (
              <label className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-md p-3">
                <input
                  type="checkbox"
                  checked={values.editGroups}
                  onChange={(e) => setFieldValue("editGroups", e.target.checked)}
                />
                Edit amounts &amp; pledgers — <strong>warning:</strong> this replaces all pledgers and
                their recorded redemptions. To add people to an existing group, use “Add members” on
                the pledge detail page instead.
              </label>
            )}

            {(mode === "create" || values.editGroups) && (
              <div className="border-t pt-4">
                <FieldArray name="groups">
                  {({ push, remove }) => (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Called amounts &amp; groups</h4>
                        <button
                          type="button"
                          className="text-sm text-primary"
                          onClick={() => push(emptyGroup())}
                        >
                          + Add group
                        </button>
                      </div>
                      {values.groups.map((group, gi) => (
                        <div key={gi} className="border rounded-md p-4 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="grid md:grid-cols-2 gap-3 flex-1">
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Called amount</label>
                                <input
                                  type="number"
                                  className="border rounded-md p-2 text-sm"
                                  value={group.called_amount}
                                  onChange={(e) =>
                                    setFieldValue(
                                      `groups[${gi}].called_amount`,
                                      e.target.value === "" ? "" : Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Label (optional)</label>
                                <input
                                  className="border rounded-md p-2 text-sm"
                                  value={group.label}
                                  onChange={(e) =>
                                    setFieldValue(`groups[${gi}].label`, e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            {values.groups.length > 1 && (
                              <button
                                type="button"
                                className="text-sm text-red-500"
                                onClick={() => remove(gi)}
                              >
                                Remove group
                              </button>
                            )}
                          </div>
                          <PledgerFieldArray
                            name={`groups[${gi}].pledgers`}
                            calledAmount={group.called_amount}
                            membersOptions={membersOptions}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </FieldArray>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border rounded-md text-sm"
                onClick={() => navigate("/home/finance/pledges")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60"
              >
                {mode === "edit" ? "Save changes" : "Create pledge"}
              </button>
            </div>
          </Form>
          );
        }}
      </Formik>
    </PageOutline>
  );
};

export default PledgeForm;
