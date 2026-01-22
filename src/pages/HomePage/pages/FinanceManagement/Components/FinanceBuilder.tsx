import React from "react";
import { buildFinanceSummary } from "../utils/helperFunctions";
import { useAuth } from "@/context/AuthWrapper";
import { Formik, Form, Field, useFormikContext } from "formik";
import { useNavigate } from "react-router-dom";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";


type WeekRange = {
  label: string;
  from: string;
  to: string;
};

const getMondaySundayWeeksInMonth = (
  year: number,
  month: number
): WeekRange[] => {
  const weeks: WeekRange[] = [];

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Find Monday on or before the first day of the month
  const start = new Date(firstOfMonth);
  const day = start.getDay(); // 0=Sun, 1=Mon
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);

  let currentStart = new Date(start);
  let weekIndex = 1;

  while (currentStart <= lastOfMonth) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentStart.getDate() + 6);

    // Clamp to month boundaries
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

const MetadataFields = ({ mode }: { mode: "create" | "edit" | "view" }) => {
  const { values, setFieldValue } = useFormikContext<any>();

  React.useEffect(() => {
    if (!values.metaData?.periodDate) return;

    const date = new Date(values.metaData.periodDate);
    setFieldValue("metaData.month", date.toLocaleString("default", { month: "long" }));
    setFieldValue("metaData.year", date.getFullYear());
  }, [values.metaData?.periodDate]);

  React.useEffect(() => {
    if (!values.metaData?.periodDate || !values.metaData?.week) return;

    const date = new Date(values.metaData.periodDate);
    const year = date.getFullYear();
    const month = date.getMonth();

    const weeks = getMondaySundayWeeksInMonth(year, month);
    const selectedWeek = weeks.find(
      w => w.label === values.metaData.week
    );

    if (!selectedWeek) return;

    setFieldValue("metaData.from", selectedWeek.from);
    setFieldValue("metaData.to", selectedWeek.to);
  }, [values.metaData?.week, values.metaData?.periodDate]);

  if (mode === "view") return null;

  const weeks =
    values.metaData?.periodDate
      ? getMondaySundayWeeksInMonth(
          new Date(values.metaData.periodDate).getFullYear(),
          new Date(values.metaData.periodDate).getMonth()
        )
      : [];

  return (
    <section className="space-y-4 border p-4 rounded">
      <h2 className="font-semibold">Metadata</h2>

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
  options={weeks.map(w => ({ label: w.label, value: w.label }))}
 />

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
    </section>
  );
};

interface FinanceData {
    metaData?: {
        month: string;
        year: number;
        week: string;
        from: string;
        to: string;
        createdBy: string | null;
        createdDate: string | null;
        updatedBy: string | null;
        updatedDate: string | null;
    };
  receipts: Array<{ item: string; amount: number | null }>;
  tithe: {
    totalTithe: { percentage: number };
    generalTithe: { percentage: number };
    icareTithe: { percentage: number };
  };
  payments: Array<{ item: string; amount: number | null }>;
  balance: {
    ExcessOfReceiptsOverPayments: { item: string };
    ReserveForSavings: { item: string };
    BalanceAmount: { item: string };
    WeeklyRefund: { item: string };
    OfficeMaintenanceReserve: { item: string };
  };
}

const FinanceBuilder = ({ financeData }: { financeData: FinanceData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("edit");

  return (
    <Formik
      initialValues={financeData}
      onSubmit={(values, { resetForm }) => {
        const now = new Date().toISOString();

        if (formMode === "create") {
          values.metaData = {
            month: values.metaData?.month || "",
            year: values.metaData?.year || new Date().getFullYear(),
            week: values.metaData?.week || "",
            from: values.metaData?.from || "",
            to: values.metaData?.to || "",
            createdBy: user?.name || null,
            createdDate: now,
            updatedBy: null,
            updatedDate: null,
          };
        }

        if (formMode === "edit") {
          values.metaData = {
            month: values.metaData?.month || "",
            year: values.metaData?.year || new Date().getFullYear(),
            week: values.metaData?.week || "",
            from: values.metaData?.from || "",
            to: values.metaData?.to || "",
            createdBy: values.metaData?.createdBy || null,
            createdDate: values.metaData?.createdDate || null,
            updatedBy: user?.name || null,
            updatedDate: now,
          };
        }

        console.log("SUBMIT PAYLOAD", values);
        setFormMode("view");
      }}
    >
      {({ values, resetForm }) => {
        const summary = buildFinanceSummary(values);

        return (
          <Form>
            <MetadataFields mode={formMode} />

            <div className="px-6 space-y-6">
                  <div className="sticky top-0 bg-white ">
                    <div className="grid grid-cols-5 gap-3 text-lg font-bold border-b ">
                      <div className="col-span-2">Items</div>
                      <div></div>
                      <div className="text-right">Amount</div>
                      <div className="text-right">Funds</div>
                    </div>
                  </div>
            
                  {/* RECEIPTS */}
                  <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Receipts</h2>
            
                    {values.receipts.map((receipt, idx) => (
                      <div key={receipt.item} className="grid grid-cols-5 gap-3">
                        <span className="col-span-2">{receipt.item}</span>
                        <div></div>

                        {formMode === "view" ? (
                          <span className="text-right font-medium">
                            {receipt.amount !== null ? receipt.amount.toLocaleString() : "—"}
                          </span>
                        ) : (
                          <Field
                            component={FormikInputDiv}
                            name={`receipts.${idx}.amount`}
                            id={`receipts.${idx}.amount`}
                            type="number"
                          />
                        )}

                        <div></div>
                      </div>
                    ))}
            
                    <div className="grid grid-cols-5 gap-3 ">
            
                      <span className="col-span-2 font-semibold  pt-2">Total Receipts</span>
                      <div></div>
                      <span className="text-right font-semibold pt-2">{summary.receipts.total.toLocaleString()}</span>
                      <span className="text-right font-semibold pt-2">{summary.receipts.total?.toLocaleString()}</span>
                    </div>
            
                    
                  </section>
                  <hr />
            
                  {/* Tithe */}
                  <section>
                    <div className="grid grid-cols-5 gap-3 ">
            
                      <span className="col-span-2 font-semibold  pt-2">Tithe</span>
                      <div className="text-right font-semibold pt-2">{values.tithe.totalTithe.percentage}%</div>
                      <span className="text-right font-semibold pt-2">{summary.tithe.amount.toLocaleString()}</span>
                      <span className="text-right font-semibold pt-2">{summary.tithe.fundsAfterTithe.toLocaleString()}</span>
                    </div>
            
                    <div className="grid grid-cols-5 gap-3 ">
            
                      <span className="col-span-2 font-semibold  pt-2"></span>
                      <div className="text-right font-medium pt-2">{values.tithe.generalTithe.percentage}%</div>
                      <span className="text-right font-medium pt-2">{summary.tithe.breakdown.general.toLocaleString()}</span>
                      <span className="text-right font-semibold pt-2"></span>
                    </div>
            
                    <div className="grid grid-cols-5 gap-3 ">
            
                      <span className="col-span-2 font-semibold  pt-2"></span>
                      <div className="text-right font-medium pt-2">{values.tithe.icareTithe.percentage}%</div>
                      <span className="text-right font-medium pt-2">{summary.tithe.breakdown.icare.toLocaleString()}</span>
                      <span className="text-right font-semibold pt-2"></span>
                    </div>
                  </section>
                  <hr />
            
                  {/* PAYMENTS */}
                  <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Payments</h2>
            
                    {values.payments.map((payment, idx) => (
                      <div key={payment.item} className="grid grid-cols-5 gap-3">
                        <span className="col-span-2">{payment.item}</span>
                        <div></div>

                        {formMode === "view" ? (
                          <span className="text-right font-medium">
                            {payment.amount !== null ? payment.amount.toLocaleString() : "—"}
                          </span>
                        ) : (
                          <Field
                            component={FormikInputDiv}
                            name={`payments.${idx}.amount`}
                            id={`payments.${idx}.amount`}
                            type="number"
                          />
                        )}

                        <div></div>
                      </div>
                    ))}
            
                    <div className="grid grid-cols-5 gap-3 ">
            
                      <span className="col-span-2 font-semibold  pt-2">Total Payments</span>
                      <div></div>
                      <span className="text-right font-semibold pt-2">{summary.payments.total.toLocaleString()}</span>
                      <span className="text-right font-semibold pt-2">{summary.balance.excessAfterPayments.toLocaleString()}</span>
                    </div>
                  </section>
                  <hr />
            
                  {/* CALCULATIONS */}
                  <section className="space-y-4">
                    <h2 className="text-lg font-semibold"></h2>
            
                      <div className="grid grid-cols-5 gap-3">
                        <span className="col-span-2">{values.balance.ExcessOfReceiptsOverPayments.item}</span>
                        <div></div>
                        <span className="text-right font-medium">
                          {summary.balance.excessAfterPayments !== null ? summary.balance.excessAfterPayments.toLocaleString() : "—"}
                        </span>
                        <div></div>
                      </div>
            
                      <div className="grid grid-cols-5 gap-3">
                        <span className="col-span-2">{values.balance.ReserveForSavings.item}</span>
                        <div></div>
                        <span className="text-right font-medium">
                          {summary.balance.reserveForSavings !== null ? summary.balance.reserveForSavings.toLocaleString() : "—"}
                        </span>
                        <div></div>
                      </div>
            
                      <div className="grid grid-cols-5 gap-3">
                        <span className="col-span-2 font-semibold">{values.balance.BalanceAmount.item}</span>
                        <div></div>
                        <span className="text-right font-semibold">
                          {summary.balance.netBalance !== null ? summary.balance.netBalance.toLocaleString() : "—"}
                        </span>
                        <div></div>
                      </div>
            
                      <div className="grid grid-cols-5 gap-3">
                        <span className="col-span-2">{values.balance.WeeklyRefund.item}</span>
                        <div></div>
                        <span className="text-right font-medium">
                          {summary.balance.weeklyRefund !== null ? summary.balance.weeklyRefund.toLocaleString() : "—"}
                        </span>
                        <div></div>
                      </div>
            
                      <div className="grid grid-cols-5 gap-3">
                        <span className="col-span-2">{values.balance.OfficeMaintenanceReserve.item}</span>
                        <div></div>
                        <span className="text-right font-medium">
                          {summary.balance.officeReserve !== null ? summary.balance.officeReserve.toLocaleString() : "—"}
                        </span>
                        <div></div>
                      </div>
                    
            
                    <div className="grid grid-cols-5 gap-3 ">
            
                      <span className="col-span-2 font-semibold  pt-2">Total Balance</span>
                      <div></div>
                      <span className="text-right font-semibold pt-2">{summary.balance.finalBalance.toLocaleString()}</span>
                      <span className="text-right font-semibold pt-2">{summary.balance.finalBalance.toLocaleString()}</span>
                    </div>
                  </section>
                    <hr />
            
                  {/* ALLOCATIONS */}
                  <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Fund allocation</h2>
                    <div className="grid grid-cols-5 gap-3 text-lg font-bold ">
                      <div className="col-span-2">Movement</div>
                      <div className="text-right">Portions</div>
                      <div className="text-right">Actuals</div>
                      <div className="text-right">Adjusted</div>
                    </div>
            
                    {summary.fundAllocations.map((allocation:any) => (
                      <div key={allocation.movement} className="grid grid-cols-5 gap-3">
                        <span className="col-span-2">{allocation.movement}</span>
                        <div className="text-right">{allocation.portionPercent}%</div>
                        <span className="text-right font-medium">
                          {allocation.actual.toLocaleString()}
                        </span>
                        <div className="text-right">
                          {allocation.adjusted.toLocaleString()}
                        </div>
                      </div>
                    ))}
            
                    <div className="grid grid-cols-5 gap-3 ">
            
                      <span className="col-span-2 font-semibold  pt-2">Total Fund Allocation</span>
                      <div className="text-right font-semibold pt-2">100%</div>
                      <span className="text-right font-semibold pt-2">
                        {summary.fundAllocationTotals.actual.toLocaleString()}
                      </span>
                      <span className="text-right font-semibold pt-2">
                        {summary.fundAllocationTotals.adjusted.toLocaleString()}
                      </span>
                    </div>
                  </section>
                  </div> 

            {formMode !== "view" && (
              <div className="flex gap-4 mt-6">
                <button type="submit" className="btn-primary">Save</button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    resetForm();
                    if (formMode === "create") navigate("/finance");
                    if (formMode === "edit") setFormMode("view");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </Form>
        );
      }}
    </Formik>
  );
};
 
export default FinanceBuilder;