import { useMemo, useState } from "react";

import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";

import PageOutline from "../../../Components/PageOutline";
import { LegendDot, Meter, Panel } from "../../AppointmentsManagement/Components/appointmentUi";
import { PageHeading, Pill, type PillTone, SelectInput, TextInput, UiButton } from "../../MembershipManagement/components/membershipUi";
import { useRequisitionFormOptions } from "../hooks/useRequisitionFormOptions";
import { addDaysKey, days1, downloadCsv, money, moneyS, pct, plural, todayKey } from "../utils/requisitionModel";

type By = "year" | "month" | "week" | "range";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Monday of the week containing `day`. */
const weekStart = (day: string) => {
  const date = new Date(`${day}T00:00:00`);
  const offset = (date.getDay() + 6) % 7;
  return addDaysKey(day, -offset);
};
const shortDay = (day: string) => {
  const date = new Date(`${day}T00:00:00`);
  return `${date.getDate()} ${SHORT[date.getMonth()]}`;
};

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", PENDING: "In approval", APPROVED: "Approved", REJECTED: "Rejected" };

const RequisitionsAnalytics = () => {
  const { user } = useAuth();
  const me = Number(user?.id) || 0;
  const today = todayKey();
  const year = Number(today.slice(0, 4));
  const thisMonth = Number(today.slice(5, 7));
  const weeks = useMemo(() => Array.from({ length: 8 }, (_, i) => addDaysKey(weekStart(today), -7 * i)), [today]);

  const [by, setBy] = useState<By>("year");
  const [month, setMonth] = useState(String(thisMonth));
  const [week, setWeek] = useState("0");
  const [from, setFrom] = useState(`${year}-${String(thisMonth).padStart(2, "0")}-01`);
  const [to, setTo] = useState(today);
  const [dept, setDept] = useState("");

  const options = useRequisitionFormOptions();

  const query = useMemo(() => {
    let start = `${year}-01-01`;
    let end = `${year}-12-31`;
    let bucket = "month";
    if (by === "month") {
      const m = Number(month);
      start = `${year}-${String(m).padStart(2, "0")}-01`;
      end = addDaysKey(m === 12 ? `${year + 1}-01-01` : `${year}-${String(m + 1).padStart(2, "0")}-01`, -1);
      bucket = "week";
    } else if (by === "week") {
      start = weeks[Number(week)] ?? weeks[0];
      end = addDaysKey(start, 6);
      bucket = "day";
    } else if (by === "range") {
      start = from || `${year}-01-01`;
      end = to && to >= start ? to : start;
      bucket = "";
    }
    return { from: start, to: end, ...(bucket ? { bucket } : {}), ...(dept ? { department_id: dept } : {}) };
  }, [by, month, week, from, to, dept, year, weeks]);

  const analytics = useFetch(api.fetch.fetchRequisitionAnalytics, query);
  const a = analytics.data?.data;
  const cur = a?.currency || "GHS";
  const reply = a?.reply_days ?? 3;

  const insights = useMemo(() => {
    if (!a) return [];
    const out: { tone: PillTone; tag: string; title: string; text: string }[] = [];
    const worst = a.steps.slice().sort((x, y) => (y.median_days ?? 0) - (x.median_days ?? 0))[0];
    if (worst?.median_days) {
      out.push({
        tone: "warning",
        tag: "Bottleneck",
        title: `${worst.label} is the slowest step`,
        text: `Typically ${days1(worst.median_days)} before a decision, and ${pct(worst.over_count, worst.total)} waited over ${reply} days. Consider a deputy approver for when they’re away.`,
      });
    }
    if (a.stuck_now.count) {
      out.push({
        tone: "danger",
        tag: "Needs attention",
        title: `${plural(a.stuck_now.count, "requisition is", "requisitions are")} stuck right now`,
        text: `${money(a.stuck_now.value, cur)} has waited more than ${reply} days with one approver. Longest: ${a.stuck_now.generated_ids.join(", ")}.`,
      });
    }
    const topDept = a.departments[0];
    if (topDept && a.kpis.approved_value) {
      out.push({
        tone: "info",
        tag: "Spending",
        title: `${topDept.name} accounts for ${pct(topDept.approved_value, a.kpis.approved_value)} of approved value`,
        text: `${moneyS(topDept.approved_value, cur)} across ${plural(topDept.submitted, "requisition")} in this period.`,
      });
    }
    const rejDept = a.departments
      .filter((d) => d.decided >= 3 && d.rejected)
      .sort((x, y) => y.rejected / y.decided - x.rejected / x.decided)[0];
    if (rejDept) {
      out.push({
        tone: "neutral",
        tag: "Rejections",
        title: `${rejDept.name} has the highest rejection rate`,
        text: `${rejDept.rejected} of ${rejDept.decided} decided requisitions were rejected. Check the reasons in each one’s history.`,
      });
    }
    const multi = a.top_items.find((item) => item.departments > 1);
    if (multi) {
      out.push({
        tone: "success",
        tag: "Save money",
        title: `${multi.name} was requested ${multi.times} times`,
        text: `By ${multi.departments} departments. One bulk order each month could cost less and save approvals.`,
      });
    }
    return out.length
      ? out
      : [{ tone: "neutral" as PillTone, tag: "Quiet period", title: "Not enough requisitions to compare", text: "Pick a longer period to see trends." }];
  }, [a, cur, reply]);

  const exportCsv = () => {
    if (!a) return;
    const maxSteps = Math.max(0, ...a.rows.map((r) => r.step_days.length));
    const stepHeaders = Array.from({ length: maxSteps }, (_, i) => `Days at step ${i + 1}`);
    downloadCsv(`requisition-analytics-${a.period.from}-to-${a.period.to}.csv`, [
      ["ID", "Requested by", "Department", "Event", "Amount", "Currency", "Status", "Submitted", ...stepHeaders, "Days to final decision"],
      ...a.rows.map((r) => [
        r.generated_id,
        r.requester,
        r.department,
        r.event ?? "",
        r.amount.toFixed(2),
        r.currency,
        STATUS_LABEL[r.status] ?? r.status,
        r.submitted_at?.slice(0, 10) ?? "",
        ...Array.from({ length: maxSteps }, (_, i) => r.step_days[i]?.days ?? ""),
        r.days_to_decision ?? "",
      ]),
    ]);
    notify.success({ title: "CSV downloaded", message: `${plural(a.rows.length, "requisition")} in this period.` });
  };

  const maxBucket = Math.max(1, ...(a?.buckets.map((b) => b.requested_value) ?? [0]));
  const maxStep = Math.max(0.1, ...(a?.steps.map((s) => s.median_days ?? 0) ?? [0]));
  const worstStep = a?.steps.slice().sort((x, y) => (y.median_days ?? 0) - (x.median_days ?? 0))[0];
  const maxDept = Math.max(1, ...(a?.departments.map((d) => d.approved_value) ?? [0]));
  const denied = !!analytics.error && !a;

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Requisition analytics"
        subtitle="How much is requested and approved, and where approvals slow down."
        actions={
          <>
            <SelectInput
              aria-label="Period"
              value={by}
              onChange={(e) => setBy(e.target.value as By)}
              className="w-auto"
              options={[
                { value: "year", label: `This year (${year})` },
                { value: "month", label: "Month" },
                { value: "week", label: "Week" },
                { value: "range", label: "Specific dates" },
              ]}
            />
            {by === "month" && (
              <SelectInput
                aria-label="Month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-auto"
                options={MONTHS.slice(0, thisMonth).map((label, i) => ({ value: String(i + 1), label: `${label} ${year}` }))}
              />
            )}
            {by === "week" && (
              <SelectInput
                aria-label="Week"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                className="w-auto"
                options={weeks.map((w, i) => ({ value: String(i), label: i === 0 ? `This week (from ${shortDay(w)})` : `Week of ${shortDay(w)}` }))}
              />
            )}
            {by === "range" && (
              <div className="flex flex-wrap items-center gap-2">
                <TextInput type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
                <span className="text-sm text-[#6B7280]">to</span>
                <TextInput type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
              </div>
            )}
            <SelectInput
              aria-label="Department"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-auto"
              options={[
                { value: "", label: "All departments" },
                ...options.departmentOptions.map((o) => ({ value: String(o.value), label: o.label })),
              ]}
            />
            <UiButton onClick={exportCsv} disabled={!a?.rows.length}>
              Export CSV
            </UiButton>
          </>
        }
      />

      {denied ? (
        <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-[#4B5563]">
          Analytics are for requisition managers and approvers. Ask an admin for access if you need them.
        </p>
      ) : (
        <>
          <p className="text-xs text-[#6B7280]">
            Counted by the date each requisition was submitted. Waiting times include requisitions still in approval.
            {a && !a.viewer.is_manager ? " You see the requisitions that pass through your steps." : ""}
          </p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
            {[
              { l: "Submitted", v: a?.kpis.submitted ?? "—", s: `${moneyS(a?.kpis.requested_value ?? 0, cur)} requested` },
              { l: "Value approved", v: moneyS(a?.kpis.approved_value ?? 0, cur), s: `${pct(a?.kpis.approved_value ?? 0, a?.kpis.requested_value ?? 0)} of value requested` },
              {
                l: "Approval rate",
                v: pct(a?.kpis.approved_count ?? 0, (a?.kpis.approved_count ?? 0) + (a?.kpis.rejected_count ?? 0)),
                s: `${a?.kpis.in_approval ?? 0} still in approval`,
              },
              { l: "Typical time to approval", v: days1(a?.kpis.median_days_to_approval), s: "Submit to final sign-off" },
              {
                l: `Waited over ${reply} days at a step`,
                v: a?.kpis.slow_count ?? "—",
                s: `${pct(a?.kpis.slow_count ?? 0, a?.kpis.submitted ?? 0)} of submitted`,
                warn: (a?.kpis.slow_count ?? 0) > 0,
              },
            ].map((k) => (
              <div key={k.l} className="flex flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4">
                <p className="text-sm text-[#4B5563]">{k.l}</p>
                <p className="text-2xl font-semibold leading-8 text-primary">{k.v}</p>
                <p className={cn("text-xs", k.warn ? "text-[#B45309]" : "text-[#6B7280]")}>{k.s}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
            <Panel
              className="col-span-full"
              title="Requested and approved value"
              helper={`By ${a?.period.bucket ?? "month"} submitted. Values in ${cur}.`}
              action={
                <div className="flex flex-wrap gap-3">
                  <LegendDot color="#D8DAE5" label="Requested" />
                  <LegendDot color="#080D2D" label="Approved" />
                </div>
              }
            >
              <div className="overflow-x-auto">
                <div className="flex min-w-[480px] flex-col gap-2">
                  <div className="flex h-[200px] items-end gap-2 border-b border-[#E5E7EB]">
                    {(a?.buckets ?? []).map((b) => (
                      <div
                        key={b.start}
                        title={`${b.label}: ${b.submitted} submitted, ${money(b.requested_value, cur)} requested, ${money(b.approved_value, cur)} approved`}
                        className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                      >
                        <span className="whitespace-nowrap text-xs font-semibold text-primary">
                          {b.requested_value ? moneyS(b.requested_value, "") : ""}
                        </span>
                        <div className="flex h-[170px] w-full max-w-[56px] items-end gap-[3px]">
                          <div className="flex-1 rounded-t bg-lightGray" style={{ height: `${Math.round((b.requested_value / maxBucket) * 100)}%` }} />
                          <div className="flex-1 rounded-t bg-primary" style={{ height: `${Math.round((b.approved_value / maxBucket) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {(a?.buckets ?? []).map((b) => (
                      <span key={b.start} className="min-w-0 flex-1 truncate text-center text-xs text-[#6B7280]">
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Time spent at each approval step" helper="Typical wait before each approver acts">
              {(a?.steps ?? []).map((s) => (
                <div key={s.order} className="flex flex-col gap-1">
                  <Meter
                    label={`Step ${s.order} · ${s.label}`}
                    value={days1(s.median_days)}
                    percent={((s.median_days ?? 0) / maxStep) * 100}
                    tone={s === worstStep && s.median_days ? "warning" : "primary"}
                  />
                  <span className={cn("text-xs", s.total && s.over_count / s.total > 0.25 ? "text-[#B45309]" : "text-[#6B7280]")}>
                    {pct(s.over_count, s.total)} waited over {reply} days · {s.waiting_now} waiting now
                  </span>
                </div>
              ))}
              {a && !a.steps.length && <p className="text-sm text-[#6B7280]">No approval steps in this period.</p>}
            </Panel>

            <Panel title="Approved value by department" helper="With how many were submitted and rejected">
              {(a?.departments ?? []).map((d) => (
                <div key={d.department_id} className="flex flex-col gap-1">
                  <Meter label={d.name} value={moneyS(d.approved_value, cur)} percent={(d.approved_value / maxDept) * 100} />
                  <span className="text-xs text-[#6B7280]">
                    {d.submitted} submitted · {d.rejected} rejected
                  </span>
                </div>
              ))}
              {a && !a.departments.length && <p className="text-sm text-[#6B7280]">Nothing submitted in this period.</p>}
            </Panel>

            <Panel
              className="col-span-full"
              title="How quickly each approver responds"
              helper={`Typical reply is the time from a requisition reaching them to their decision.${a && !a.viewer.is_manager ? " Your row is highlighted." : ""}`}
            >
              <div className="overflow-x-auto rounded-lg border border-lightGray">
                <div className="min-w-[760px] text-sm text-primary">
                  <div className="grid grid-cols-[minmax(200px,1.6fr)_repeat(5,minmax(90px,0.8fr))] gap-3 bg-lightGray px-4 py-3 font-semibold">
                    <span>Approver</span>
                    <span>Decided</span>
                    <span>Approved</span>
                    <span>Typical reply</span>
                    <span>Over {reply} days</span>
                    <span>Waiting now</span>
                  </div>
                  {(a?.approvers ?? []).map((p) => {
                    const overShare = p.decided ? p.over_count / p.decided : 0;
                    const late = (p.oldest_waiting_days ?? 0) > reply;
                    return (
                      <div
                        key={p.user_id}
                        className={cn(
                          "grid min-h-14 grid-cols-[minmax(200px,1.6fr)_repeat(5,minmax(90px,0.8fr))] items-center gap-3 border-b border-[#E5E7EB] px-4 py-2 last:border-b-0",
                          p.user_id === me ? "bg-[#F8F9FC]" : "bg-white"
                        )}
                      >
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-[#6B7280]">{p.role}</p>
                        </div>
                        <span>{p.decided}</span>
                        <span>{pct(p.approved, p.decided)}</span>
                        <span>{days1(p.median_days)}</span>
                        <span>
                          {p.decided ? (
                            <Pill tone={overShare > 0.25 ? "warning" : "success"}>{Math.round(overShare * 100)}%</Pill>
                          ) : (
                            <Pill>—</Pill>
                          )}
                        </span>
                        <span className={cn(late && "font-semibold text-[#B91C1C]")}>
                          {p.waiting_now ? `${p.waiting_now}${late ? ` · oldest ${days1(p.oldest_waiting_days)}` : ""}` : "0"}
                        </span>
                      </div>
                    );
                  })}
                  {a && !a.approvers.length && <p className="px-4 py-4 text-sm text-[#6B7280]">No decisions in this period.</p>}
                </div>
              </div>
            </Panel>

            <Panel title="Most requested items" helper="Items asked for by several departments may be cheaper bought once">
              <div className="flex flex-col">
                {(a?.top_items ?? []).map((item) => (
                  <div key={item.name} className="flex items-center gap-3 border-b border-[#E5E7EB] py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary">{item.name}</p>
                      <p className="text-xs text-[#6B7280]">
                        Qty {item.quantity.toLocaleString("en-US")} · {moneyS(item.value, cur)}
                      </p>
                    </div>
                    {item.departments > 1 && <Pill tone="info">{item.departments} departments</Pill>}
                    <span className="whitespace-nowrap text-sm font-semibold text-primary">{item.times}×</span>
                  </div>
                ))}
                {a && !a.top_items.length && <p className="text-sm text-[#6B7280]">No items in this period.</p>}
              </div>
            </Panel>

            <Panel title="What stands out">
              <div className="flex flex-col">
                {insights.map((insight) => (
                  <div key={insight.title} className="flex gap-3 border-b border-[#E5E7EB] py-3 last:border-b-0">
                    <span className="flex-shrink-0 self-start">
                      <Pill tone={insight.tone}>{insight.tag}</Pill>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-primary">{insight.title}</p>
                      <p className="text-sm text-[#4B5563]">{insight.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </PageOutline>
  );
};

export default RequisitionsAnalytics;
