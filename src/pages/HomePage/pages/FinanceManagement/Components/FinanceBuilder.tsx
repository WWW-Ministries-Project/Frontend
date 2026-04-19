import React from "react";
import { buildFinanceSummary } from "../utils/helperFunctions";
import { useAuth } from "@/context/AuthWrapper";
import { Formik, Form, Field, useFormikContext } from "formik";
import { useNavigate } from "react-router-dom";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { Button } from "@/components";
import { Modal } from "@/components/Modal";
import { showNotification } from "@/pages/HomePage/utils";
import { useStore } from "@/store/useStore";
import {
  FinanceApprovalConfig,
  FinanceData,
  FinanceSaveAction,
  FinancialRecord,
} from "@/utils/api/finance/interface";
import { ApiResponse } from "@/utils/interfaces";

type WeekRange = {
  label: string;
  from: string;
  to: string;
};

type FinanceConfigItem = {
  id?: string | number;
  name: string;
  percentage?: number | string | null;
};

type TitheBreakdownItem = {
  item: string;
  percentage: number;
  configId?: string | number;
};

type AmountInputValue = number | string;

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeManualAmount = (value: unknown): AmountInputValue => {
  if (value === null || value === undefined || value === "") return "";
  return typeof value === "string" ? value : toNumber(value);
};

const toRatio = (value: unknown): number => {
  const numeric = toNumber(value);
  return Math.abs(numeric) <= 1 ? numeric : numeric / 100;
};

const toDisplayPercent = (value: unknown): number => toRatio(value) * 100;

const formatPercent = (value: unknown): string => {
  const percent = toDisplayPercent(value);
  if (Number.isInteger(percent)) return String(percent);
  return percent.toFixed(2).replace(/\.?0+$/, "");
};

const getConfigKey = (id?: string | number, name?: string): string =>
  id !== undefined && id !== null ? `id:${String(id)}` : `name:${name || ""}`;

const getMondaySundayWeeksInMonth = (
  year: number,
  month: number
): WeekRange[] => {
  const weeks: WeekRange[] = [];

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const start = new Date(firstOfMonth);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);

  let currentStart = new Date(start);
  let weekIndex = 1;

  while (currentStart <= lastOfMonth) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentStart.getDate() + 6);

    const from = currentStart < firstOfMonth ? firstOfMonth : currentStart;
    const to = currentEnd > lastOfMonth ? lastOfMonth : currentEnd;

    weeks.push({
      label: `Week ${weekIndex}`,
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    });

    weekIndex++;
    currentStart.setDate(currentStart.getDate() + 7);
  }

  return weeks;
};

const getDefaultBalanceValues = () => ({
  ExcessOfReceiptsOverPayments: {
    item: "Excess of Receipts over payments for the program",
    amount: 0,
  },
  ReserveForSavings: {
    item: "Reserved for Savings (GPP and sacrifice less expenses and Tithes)",
    amount: "",
  },
  BalanceAmount: {
    item: "BALANCE",
    amount: 0,
  },
  WeeklyRefund: {
    item: "Weekly refund-BAMAH 3 7 7",
    amount: "",
  },
  OfficeMaintenanceReserve: {
    item: "Reserved for office maintenance",
    amount: "",
  },
});

const normalizeConfigList = (response: any): FinanceConfigItem[] => {
  const items = Array.isArray(response?.data) ? response.data : [];

  return items
    .map((item: any) => ({
      id: item?.id,
      name: String(item?.name || "").trim(),
      percentage: item?.percentage,
    }))
    .filter((item: FinanceConfigItem) => item.name.length > 0);
};

const buildCreateValues = (
  receiptConfig: FinanceConfigItem[],
  paymentConfig: FinanceConfigItem[],
  titheConfig: FinanceConfigItem[],
  bankAccountConfig: FinanceConfigItem[]
): FinanceData => ({
  metaData: {
    periodDate: "",
    month: "",
    year: new Date().getFullYear(),
    week: "",
    from: "",
    to: "",
    createdBy: null,
    createdDate: null,
    updatedBy: null,
    updatedDate: null,
  },
  receipts: receiptConfig.map((item) => ({
    item: item.name,
    amount: null,
    configId: item.id,
  })),
  tithe: {
    totalTithe: { percentage: 10, label: "Tithe" },
    breakdown: titheConfig.map((item) => ({
      item: item.name,
      percentage: toNumber(item.percentage),
      configId: item.id,
    })),
  },
  payments: paymentConfig.map((item) => ({
    item: item.name,
    amount: null,
    configId: item.id,
  })),
  balance: getDefaultBalanceValues(),
  fundAllocation: bankAccountConfig.map((item) => ({
    movement: item.name,
    portionPercent: toNumber(item.percentage),
    actual: null,
    adjusted: null,
    configId: item.id,
  })),
});

const normalizeExistingValues = (financeData?: any): FinanceData => {
  const legacyTitheBreakdown: TitheBreakdownItem[] = [
    financeData?.tithe?.generalTithe
      ? {
          item: financeData.tithe.generalTithe.label || "General Tithe",
          percentage: toNumber(financeData.tithe.generalTithe.percentage),
        }
      : null,
    financeData?.tithe?.icareTithe
      ? {
          item: financeData.tithe.icareTithe.label || "iCare Tithe",
          percentage: toNumber(financeData.tithe.icareTithe.percentage),
        }
      : null,
  ].filter(Boolean) as TitheBreakdownItem[];

  const titheBreakdown = Array.isArray(financeData?.tithe?.breakdown)
    ? financeData.tithe.breakdown.map((item: any) => ({
        item: String(item?.item || item?.name || "").trim(),
        percentage: toNumber(item?.percentage),
        configId: item?.configId ?? item?.id,
      }))
    : legacyTitheBreakdown;

  const fundAllocationSource = Array.isArray(financeData?.fundAllocation)
    ? financeData.fundAllocation
    : Array.isArray(financeData?.fundsAllocation)
    ? financeData.fundsAllocation
    : [];

  return {
    metaData: {
      periodDate: financeData?.metaData?.periodDate || "",
      month: financeData?.metaData?.month || "",
      year: toNumber(financeData?.metaData?.year) || new Date().getFullYear(),
      week: financeData?.metaData?.week || "",
      from: financeData?.metaData?.from || "",
      to: financeData?.metaData?.to || "",
      createdBy: financeData?.metaData?.createdBy || null,
      createdDate: financeData?.metaData?.createdDate || null,
      updatedBy: financeData?.metaData?.updatedBy || null,
      updatedDate: financeData?.metaData?.updatedDate || null,
    },
    receipts: Array.isArray(financeData?.receipts)
      ? financeData.receipts.map((receipt: any) => ({
          item: String(receipt?.item || "").trim(),
          amount:
            receipt?.amount === null || receipt?.amount === undefined
              ? null
              : toNumber(receipt.amount),
          configId: receipt?.configId,
        }))
      : [],
    tithe: {
      totalTithe: {
        percentage: toNumber(financeData?.tithe?.totalTithe?.percentage),
        label: financeData?.tithe?.totalTithe?.label || "Tithe",
      },
      breakdown: titheBreakdown.filter((item) => item.item.length > 0),
    },
    payments: Array.isArray(financeData?.payments)
      ? financeData.payments.map((payment: any) => ({
          item: String(payment?.item || "").trim(),
          amount:
            payment?.amount === null || payment?.amount === undefined
              ? null
              : toNumber(payment.amount),
          configId: payment?.configId,
        }))
      : [],
    balance: {
      ExcessOfReceiptsOverPayments: {
        item:
          financeData?.balance?.ExcessOfReceiptsOverPayments?.item ||
          getDefaultBalanceValues().ExcessOfReceiptsOverPayments.item,
        amount: toNumber(
          financeData?.balance?.ExcessOfReceiptsOverPayments?.amount
        ),
      },
      ReserveForSavings: {
        item:
          financeData?.balance?.ReserveForSavings?.item ||
          getDefaultBalanceValues().ReserveForSavings.item,
        amount: normalizeManualAmount(financeData?.balance?.ReserveForSavings?.amount),
      },
      BalanceAmount: {
        item:
          financeData?.balance?.BalanceAmount?.item ||
          getDefaultBalanceValues().BalanceAmount.item,
        amount: toNumber(financeData?.balance?.BalanceAmount?.amount),
      },
      WeeklyRefund: {
        item:
          financeData?.balance?.WeeklyRefund?.item ||
          getDefaultBalanceValues().WeeklyRefund.item,
        amount: normalizeManualAmount(financeData?.balance?.WeeklyRefund?.amount),
      },
      OfficeMaintenanceReserve: {
        item:
          financeData?.balance?.OfficeMaintenanceReserve?.item ||
          getDefaultBalanceValues().OfficeMaintenanceReserve.item,
        amount: normalizeManualAmount(financeData?.balance?.OfficeMaintenanceReserve?.amount),
      },
    },
    fundAllocation: fundAllocationSource.map((item: any) => ({
      movement: String(item?.movement || item?.name || "").trim(),
      portionPercent: toNumber(item?.portionPercent ?? item?.percentage),
      actual:
        item?.actual === null || item?.actual === undefined
          ? null
          : toNumber(item.actual),
      adjusted:
        item?.adjusted === null || item?.adjusted === undefined
          ? null
          : toNumber(item.adjusted),
      configId: item?.configId ?? item?.id,
    })),
  };
};

const MetadataFields = ({ mode }: { mode: "create" | "edit" | "view" }) => {
  const { values, setFieldValue } = useFormikContext<any>();

  React.useEffect(() => {
    if (!values.metaData?.periodDate) return;

    const date = new Date(values.metaData.periodDate);
    setFieldValue(
      "metaData.month",
      date.toLocaleString("default", { month: "long" })
    );
    setFieldValue("metaData.year", date.getFullYear());
  }, [values.metaData?.periodDate, setFieldValue]);

  React.useEffect(() => {
    if (!values.metaData?.periodDate || !values.metaData?.week) return;

    const date = new Date(values.metaData.periodDate);
    const year = date.getFullYear();
    const month = date.getMonth();

    const weeks = getMondaySundayWeeksInMonth(year, month);
    const selectedWeek = weeks.find((w) => w.label === values.metaData.week);

    if (!selectedWeek) return;

    setFieldValue("metaData.from", selectedWeek.from);
    setFieldValue("metaData.to", selectedWeek.to);
  }, [values.metaData?.week, values.metaData?.periodDate, setFieldValue]);

  if (mode === "view") return null;

  const weeks = values.metaData?.periodDate
    ? getMondaySundayWeeksInMonth(
        new Date(values.metaData.periodDate).getFullYear(),
        new Date(values.metaData.periodDate).getMonth()
      )
    : [];

  return (
    <section className="app-card space-y-6">
      <h2 className="font-semibold">Metadata</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field
          component={FormikInputDiv}
          type="month"
          label="Period (Month & Year) *"
          name="metaData.periodDate"
          id="metaData.periodDate"
        />

        <Field
          component={FormikSelectField}
          label="Week *"
          name="metaData.week"
          id="metaData.week"
          options={weeks.map((w) => ({ label: w.label, value: w.label }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field
          component={FormikInputDiv}
          label="From"
          name="metaData.from"
          id="metaData.from"
          disabled
        />
        <Field
          component={FormikInputDiv}
          label="To"
          name="metaData.to"
          id="metaData.to"
          disabled
        />
      </div>
    </section>
  );
};

const FinanceBuilder = ({
  financeData,
  mode,
  onModeChange,
  onSubmitFinancial,
}: {
  financeData?: FinanceData & Partial<FinancialRecord>;
  mode: "create" | "edit" | "view";
  onModeChange?: (mode: "create" | "edit" | "view") => void;
  onSubmitFinancial?: (
    values: FinanceData,
    action: FinanceSaveAction
  ) => Promise<boolean>;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [receiptToAdd, setReceiptToAdd] = React.useState("");
  const [paymentToAdd, setPaymentToAdd] = React.useState("");
  const [confirmApprovalOpen, setConfirmApprovalOpen] = React.useState(false);
  const submitActionRef = React.useRef<FinanceSaveAction>("SAVE_DRAFT");
  const membersOptions = useStore((state) => state.membersOptions);
  const currentUserId = Number(user?.id || 0);

  const loadConfig = mode !== "view";

  const {
    data: receiptConfigResponse,
    loading: receiptConfigLoading,
    error: receiptConfigError,
  } = useFetch(api.fetch.fetchReceiptConfig, undefined, !loadConfig);
  const {
    data: paymentConfigResponse,
    loading: paymentConfigLoading,
    error: paymentConfigError,
  } = useFetch(api.fetch.fetchPaymentConfig, undefined, !loadConfig);
  const {
    data: titheConfigResponse,
    loading: titheConfigLoading,
    error: titheConfigError,
  } = useFetch(api.fetch.fetchTitheBreakdownConfig, undefined, !loadConfig);
  const {
    data: bankConfigResponse,
    loading: bankConfigLoading,
    error: bankConfigError,
  } = useFetch(api.fetch.fetchBankAccountConfig, undefined, !loadConfig);
  const { data: financeApprovalConfigResponse } = useFetch<
    ApiResponse<FinanceApprovalConfig>
  >(api.fetch.fetchFinanceApprovalConfig);

  const receiptConfig = React.useMemo(
    () => normalizeConfigList(receiptConfigResponse),
    [receiptConfigResponse]
  );
  const paymentConfig = React.useMemo(
    () => normalizeConfigList(paymentConfigResponse),
    [paymentConfigResponse]
  );
  const titheConfig = React.useMemo(
    () => normalizeConfigList(titheConfigResponse),
    [titheConfigResponse]
  );
  const bankAccountConfig = React.useMemo(
    () => normalizeConfigList(bankConfigResponse),
    [bankConfigResponse]
  );

  const createValues = React.useMemo(
    () =>
      buildCreateValues(
        receiptConfig,
        paymentConfig,
        titheConfig,
        bankAccountConfig
      ),
    [receiptConfig, paymentConfig, titheConfig, bankAccountConfig]
  );
  const initialValues = React.useMemo(
    () => (mode === "create" ? createValues : normalizeExistingValues(financeData)),
    [mode, createValues, financeData]
  );
  const financeApprovalConfig = financeApprovalConfigResponse?.data ?? null;
  const financeApproverUserId = Number(
    financeApprovalConfig?.finance_approver_user_id || 0
  );
  const isCurrentUserFinanceApprover =
    financeApproverUserId > 0 && financeApproverUserId === currentUserId;
  const notificationRecipientNames = React.useMemo(() => {
    const byId = new Map(
      membersOptions.map((option) => [String(option.value), option.label])
    );

    return (financeApprovalConfig?.notification_user_ids || [])
      .map((id) => byId.get(String(id)) || `User ${id}`)
      .filter(Boolean);
  }, [financeApprovalConfig?.notification_user_ids, membersOptions]);
  const financeApproverName = React.useMemo(() => {
    return (
      membersOptions.find(
        (option) => String(option.value) === String(financeApproverUserId)
      )?.label || null
    );
  }, [financeApproverUserId, membersOptions]);

  if (
    mode === "create" &&
    (receiptConfigLoading ||
      paymentConfigLoading ||
      titheConfigLoading ||
      bankConfigLoading)
  ) {
    return <div className="p-6">Loading finance configuration...</div>;
  }

  return (
    <Formik<FinanceData>
      initialValues={initialValues}
      enableReinitialize
      onSubmit={async (values) => {
        const action = submitActionRef.current;
        const now = new Date().toISOString();
        const payload: FinanceData = {
          ...values,
          metaData: {
            periodDate: values.metaData?.periodDate || "",
            month: values.metaData?.month || "",
            year: values.metaData?.year || new Date().getFullYear(),
            week: values.metaData?.week || "",
            from: values.metaData?.from || "",
            to: values.metaData?.to || "",
            createdBy:
              mode === "create"
                ? user?.name || null
                : values.metaData?.createdBy || null,
            createdDate:
              mode === "create"
                ? now
                : values.metaData?.createdDate || null,
            updatedBy:
              mode === "edit" ? user?.name || null : null,
            updatedDate: mode === "edit" ? now : null,
          },
          receipts: values.receipts.map((receipt) => ({ ...receipt })),
          payments: values.payments.map((payment) => ({ ...payment })),
          tithe: {
            totalTithe: { ...values.tithe.totalTithe },
            breakdown: values.tithe.breakdown.map((entry) => ({ ...entry })),
          },
          balance: {
            ExcessOfReceiptsOverPayments: {
              ...values.balance.ExcessOfReceiptsOverPayments,
            },
            ReserveForSavings: { ...values.balance.ReserveForSavings },
            BalanceAmount: { ...values.balance.BalanceAmount },
            WeeklyRefund: { ...values.balance.WeeklyRefund },
            OfficeMaintenanceReserve: { ...values.balance.OfficeMaintenanceReserve },
          },
          fundAllocation: values.fundAllocation.map((allocation) => ({
            ...allocation,
          })),
        };

        const success = onSubmitFinancial
          ? await onSubmitFinancial(payload, action)
          : true;

        if (success && onModeChange) onModeChange("view");
      }}
    >
      {({ values, resetForm, setFieldValue, isSubmitting, handleSubmit }) => {
        const summary = buildFinanceSummary(values);
        const preventNumberWheelChange = (
          event: React.WheelEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
          if (event.currentTarget instanceof HTMLInputElement) {
            event.currentTarget.blur();
          }
        };

        const selectedReceiptKeys = new Set(
          values.receipts.map((item) => getConfigKey(item.configId, item.item))
        );
        const selectedPaymentKeys = new Set(
          values.payments.map((item) => getConfigKey(item.configId, item.item))
        );

        const availableReceiptOptions = receiptConfig.filter(
          (item) => !selectedReceiptKeys.has(getConfigKey(item.id, item.name))
        );
        const availablePaymentOptions = paymentConfig.filter(
          (item) => !selectedPaymentKeys.has(getConfigKey(item.id, item.name))
        );

        const totalAllocationPercent =
          values.fundAllocation.reduce(
            (total, allocation) => total + toRatio(allocation.portionPercent),
            0
          ) * 100;

        return (
          <Form className="space-y-6">
            {mode !== "view" &&
              (receiptConfigError ||
                paymentConfigError ||
                titheConfigError ||
                bankConfigError) && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  Some finance configuration data failed to load. Save may be incomplete.
                </div>
              )}

            <MetadataFields mode={mode} />

            <div className="app-card space-y-6">
              <div className="sticky top-0 z-[2] bg-white/95 pb-3 backdrop-blur">
                <div className="hidden border-b text-lg font-bold md:grid md:grid-cols-5 md:gap-6">
                  <div className="col-span-2">Items</div>
                  <div></div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Funds</div>
                </div>
              </div>

              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Receipts</h2>

                {mode !== "view" && (
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      className="app-input w-full md:w-auto md:min-w-[18rem]"
                      value={receiptToAdd}
                      onChange={(event) => setReceiptToAdd(event.target.value)}
                    >
                      <option value="">Select receipt to add</option>
                      {availableReceiptOptions.map((item) => {
                        const key = getConfigKey(item.id, item.name);
                        return (
                          <option key={key} value={key}>
                            {item.name}
                          </option>
                        );
                      })}
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!receiptToAdd}
                      value="Add receipt"
                      onClick={() => {
                        const selected = availableReceiptOptions.find(
                          (item) =>
                            getConfigKey(item.id, item.name) === receiptToAdd
                        );
                        if (!selected) return;

                        setFieldValue("receipts", [
                          ...values.receipts,
                          {
                            item: selected.name,
                            amount: null,
                            configId: selected.id,
                          },
                        ]);
                        setReceiptToAdd("");
                      }}
                    />
                  </div>
                )}

                {values.receipts.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No receipts added yet. Add configured receipt items to begin.
                  </p>
                )}

                {mode !== "view" &&
                  values.receipts.length > 0 &&
                  availableReceiptOptions.length === 0 && (
                    <p className="text-sm text-gray-500">
                      All configured receipt items have been added.
                    </p>
                  )}

                {mode !== "view" && receiptConfig.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No receipt configuration found. Add receipts in Finance Configuration.
                  </p>
                )}

                {values.receipts.map((receipt, idx) => (
                  <div
                    key={`${receipt.item}-${idx}`}
                    className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6"
                  >
                    <span className="col-span-2">{receipt.item}</span>
                    <div>
                      {mode !== "view" && (
                        <button
                          type="button"
                          className="text-sm text-red-600"
                          aria-label={`Remove receipt ${receipt.item}`}
                          onClick={() =>
                            setFieldValue(
                              "receipts",
                              values.receipts.filter((_, index) => index !== idx)
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {mode === "view" ? (
                      <span className="text-right font-medium">
                        {receipt.amount !== null
                          ? toNumber(receipt.amount).toLocaleString()
                          : "—"}
                      </span>
                    ) : (
                      <Field
                        component={FormikInputDiv}
                        name={`receipts.${idx}.amount`}
                        id={`receipts.${idx}.amount`}
                        type="number"
                        onWheel={preventNumberWheelChange}
                      />
                    )}

                    <div></div>
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2 pt-2 font-semibold">Total Receipts</span>
                  <div></div>
                  <span className="pt-2 text-right font-semibold">
                    {summary.receipts.total.toLocaleString()}
                  </span>
                  <span className="pt-2 text-right font-semibold">
                    {summary.receipts.total.toLocaleString()}
                  </span>
                </div>
              </section>
              <hr />

              <section className="space-y-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2 pt-2 font-semibold">
                    {values.tithe.totalTithe.label || "Tithe"}
                  </span>
                  <div className="pt-2 text-right font-semibold">
                    {formatPercent(values.tithe.totalTithe.percentage)}%
                  </div>
                  <span className="pt-2 text-right font-semibold">
                    {summary.tithe.amount.toLocaleString()}
                  </span>
                  <span className="pt-2 text-right font-semibold">
                    {summary.tithe.fundsAfterTithe.toLocaleString()}
                  </span>
                </div>

                {values.tithe.breakdown.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No tithe breakdown configured. Add tithe breakdown items in Finance Configuration.
                  </p>
                )}

                {values.tithe.breakdown.map((entry, idx) => (
                  <div
                    key={`${entry.item}-${idx}`}
                    className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6"
                  >
                    <span className="col-span-2 pt-2">{entry.item}</span>
                    <div className="pt-2 text-right font-medium">
                      {formatPercent(entry.percentage)}%
                    </div>
                    <span className="pt-2 text-right font-medium">
                      {toNumber(summary.tithe.breakdown[idx]?.amount).toLocaleString()}
                    </span>
                    <span className="pt-2 text-right font-semibold"></span>
                  </div>
                ))}
              </section>
              <hr />

              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Payments</h2>

                {mode !== "view" && (
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      className="app-input w-full md:w-auto md:min-w-[18rem]"
                      value={paymentToAdd}
                      onChange={(event) => setPaymentToAdd(event.target.value)}
                    >
                      <option value="">Select payment to add</option>
                      {availablePaymentOptions.map((item) => {
                        const key = getConfigKey(item.id, item.name);
                        return (
                          <option key={key} value={key}>
                            {item.name}
                          </option>
                        );
                      })}
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!paymentToAdd}
                      value="Add payment"
                      onClick={() => {
                        const selected = availablePaymentOptions.find(
                          (item) =>
                            getConfigKey(item.id, item.name) === paymentToAdd
                        );
                        if (!selected) return;

                        setFieldValue("payments", [
                          ...values.payments,
                          {
                            item: selected.name,
                            amount: null,
                            configId: selected.id,
                          },
                        ]);
                        setPaymentToAdd("");
                      }}
                    />
                  </div>
                )}

                {values.payments.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No payments added yet. Add configured payment items to begin.
                  </p>
                )}

                {mode !== "view" &&
                  values.payments.length > 0 &&
                  availablePaymentOptions.length === 0 && (
                    <p className="text-sm text-gray-500">
                      All configured payment items have been added.
                    </p>
                  )}

                {mode !== "view" && paymentConfig.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No payment configuration found. Add payments in Finance Configuration.
                  </p>
                )}

                {values.payments.map((payment, idx) => (
                  <div
                    key={`${payment.item}-${idx}`}
                    className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6"
                  >
                    <span className="col-span-2">{payment.item}</span>
                    <div>
                      {mode !== "view" && (
                        <button
                          type="button"
                          className="text-sm text-red-600"
                          aria-label={`Remove payment ${payment.item}`}
                          onClick={() =>
                            setFieldValue(
                              "payments",
                              values.payments.filter((_, index) => index !== idx)
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {mode === "view" ? (
                      <span className="text-right font-medium">
                        {payment.amount !== null
                          ? toNumber(payment.amount).toLocaleString()
                          : "—"}
                      </span>
                    ) : (
                      <Field
                        component={FormikInputDiv}
                        name={`payments.${idx}.amount`}
                        id={`payments.${idx}.amount`}
                        type="number"
                        onWheel={preventNumberWheelChange}
                      />
                    )}

                    <div></div>
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2 pt-2 font-semibold">Total Payments</span>
                  <div></div>
                  <span className="pt-2 text-right font-semibold">
                    {summary.payments.total.toLocaleString()}
                  </span>
                  <span className="pt-2 text-right font-semibold">
                    {summary.balance.excessAfterPayments.toLocaleString()}
                  </span>
                </div>
              </section>
              <hr />

              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Balance Summary</h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2">
                    {values.balance.ExcessOfReceiptsOverPayments.item}
                  </span>
                  <div></div>
                  <span className="text-right font-medium">
                    {summary.balance.excessAfterPayments !== null
                      ? summary.balance.excessAfterPayments.toLocaleString()
                      : "—"}
                  </span>
                  <div></div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2">
                    {values.balance.ReserveForSavings.item}
                  </span>
                  <div></div>
                  {mode === "view" ? (
                    <span className="text-right font-medium">
                      {summary.balance.reserveForSavings !== null
                        ? summary.balance.reserveForSavings.toLocaleString()
                        : "—"}
                    </span>
                  ) : (
                    <Field
                      component={FormikInputDiv}
                      name="balance.ReserveForSavings.amount"
                      id="balance.ReserveForSavings.amount"
                      type="number"
                      onWheel={preventNumberWheelChange}
                    />
                  )}
                  <div></div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2 font-semibold">
                    {values.balance.BalanceAmount.item}
                  </span>
                  <div></div>
                  <span className="text-right font-semibold">
                    {summary.balance.netBalance !== null
                      ? summary.balance.netBalance.toLocaleString()
                      : "—"}
                  </span>
                  <div></div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2">{values.balance.WeeklyRefund.item}</span>
                  <div></div>
                  {mode === "view" ? (
                    <span className="text-right font-medium">
                      {summary.balance.weeklyRefund !== null
                        ? summary.balance.weeklyRefund.toLocaleString()
                        : "—"}
                    </span>
                  ) : (
                    <Field
                      component={FormikInputDiv}
                      name="balance.WeeklyRefund.amount"
                      id="balance.WeeklyRefund.amount"
                      type="number"
                      onWheel={preventNumberWheelChange}
                    />
                  )}
                  <div></div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2">
                    {values.balance.OfficeMaintenanceReserve.item}
                  </span>
                  <div></div>
                  {mode === "view" ? (
                    <span className="text-right font-medium">
                      {summary.balance.officeReserve !== null
                        ? summary.balance.officeReserve.toLocaleString()
                        : "—"}
                    </span>
                  ) : (
                    <Field
                      component={FormikInputDiv}
                      name="balance.OfficeMaintenanceReserve.amount"
                      id="balance.OfficeMaintenanceReserve.amount"
                      type="number"
                      onWheel={preventNumberWheelChange}
                    />
                  )}
                  <div></div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2 pt-2 font-semibold">Total Balance</span>
                  <div></div>
                  <span className="pt-2 text-right font-semibold">
                    {summary.balance.finalBalance.toLocaleString()}
                  </span>
                  <span className="pt-2 text-right font-semibold">
                    {summary.balance.finalBalance.toLocaleString()}
                  </span>
                </div>
              </section>
              <hr />

              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Fund allocation</h2>
                <div className="hidden text-lg font-bold md:grid md:grid-cols-5 md:gap-6">
                  <div className="col-span-2">Movement</div>
                  <div className="text-right">Portions</div>
                  <div className="text-right">Actuals</div>
                  <div className="text-right">Adjusted</div>
                </div>

                {summary.fundAllocations.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No fund allocation configured. Add bank account configurations to allocate funds.
                  </p>
                )}

                {summary.fundAllocations.map((allocation: any, idx: number) => (
                  <div
                    key={`${allocation.movement}-${idx}`}
                    className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6"
                  >
                    <span className="col-span-2">{allocation.movement}</span>
                    <div className="text-right">
                      {formatPercent(allocation.portionPercent)}%
                    </div>
                    <span className="text-right font-medium">
                      {toNumber(allocation.actual).toLocaleString()}
                    </span>
                    <div className="text-right">
                      {toNumber(allocation.adjusted).toLocaleString()}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-6">
                  <span className="col-span-2 pt-2 font-semibold">
                    Total Fund Allocation
                  </span>
                  <div className="pt-2 text-right font-semibold">
                    {formatPercent(totalAllocationPercent)}%
                  </div>
                  <span className="pt-2 text-right font-semibold">
                    {summary.fundAllocationTotals.actual.toLocaleString()}
                  </span>
                  <span className="pt-2 text-right font-semibold">
                    {summary.fundAllocationTotals.adjusted.toLocaleString()}
                  </span>
                </div>
              </section>
            </div>

            {mode !== "view" && (
              <div className="sticky bottom-0 z-10 mt-6 border-t bg-white px-6 py-4">
                <div className="flex justify-end gap-3">
                  <Button
                    value={isSubmitting ? "Saving..." : "Save as Draft"}
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      submitActionRef.current = "SAVE_DRAFT";
                      void handleSubmit();
                    }}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  />
                  <Button
                    value="Save and Approve"
                    variant="primary"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (!financeApproverUserId) {
                        showNotification(
                          "Finance approval configuration is required before approval can be submitted.",
                          "error"
                        );
                        return;
                      }

                      setConfirmApprovalOpen(true);
                    }}
                  />
                  <Button
                    value="Cancel"
                    variant="secondary"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      resetForm();
                      if (mode === "create") navigate("/home/finance");
                      if (mode === "edit" && onModeChange) onModeChange("view");
                    }}
                  />
                </div>
              </div>
            )}

            <Modal
              open={confirmApprovalOpen}
              onClose={() => {
                if (!isSubmitting) {
                  setConfirmApprovalOpen(false);
                }
              }}
              className="max-w-xl"
            >
              <div className="space-y-5 p-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-primary">
                    Confirm Save and Approve
                  </h3>
                  {isCurrentUserFinanceApprover ? (
                    <p className="text-sm text-primaryGray">
                      This record will be approved immediately. The selected
                      members below will be notified by email and in-app, and
                      only the configured finance approver can continue editing
                      it afterwards.
                    </p>
                  ) : (
                    <p className="text-sm text-primaryGray">
                      This record will be submitted to the finance approver for
                      review. Final notify recipients are contacted only after
                      the finance approver confirms approval.
                    </p>
                  )}
                </div>

                {isCurrentUserFinanceApprover ? (
                  <div className="space-y-2 rounded-xl border border-lightGray bg-lightGray/20 p-4">
                    <p className="text-sm font-medium text-primary">
                      Members to notify after approval
                    </p>
                    {notificationRecipientNames.length > 0 ? (
                      <p className="text-sm text-primaryGray">
                        {notificationRecipientNames.join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm text-primaryGray">
                        No post-approval recipients have been configured.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-lightGray bg-lightGray/20 p-4">
                    <p className="text-sm font-medium text-primary">
                      Finance approver
                    </p>
                    <p className="text-sm text-primaryGray">
                      {financeApproverName || "Configured finance approver"}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    value="Cancel"
                    variant="secondary"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setConfirmApprovalOpen(false)}
                  />
                  <Button
                    value={isCurrentUserFinanceApprover ? "Approve" : "Submit for Approval"}
                    variant="primary"
                    type="button"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    onClick={() => {
                      submitActionRef.current = "SAVE_AND_APPROVE";
                      setConfirmApprovalOpen(false);
                      void handleSubmit();
                    }}
                  />
                </div>
              </div>
            </Modal>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FinanceBuilder;
