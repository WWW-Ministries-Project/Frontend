import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import type { ApiResponse } from "@/utils/interfaces";
import type { DeptReportKey, ExecutiveSummary as Summary } from "@/utils/api/reports/interfaces";

import { BranchSelect } from "../components/ReportControls";
import {
  Avatar,
  Card,
  CardTitle,
  DialogShell,
  MiniStat,
  PageEmpty,
  PageHeading,
  Pill,
  PillTabs,
  SkeletonGrid,
  TextArea,
  UiButton,
} from "../components/reportsUi";
import { initialsOf, printReport, severityPill } from "../utils/reportUiHelpers";
import { deptStatusPill, toKpi, useReportControls } from "../utils/reportAdapters";
import { fmtDate, healthPill, nf } from "../utils/reportFormat";

type SummaryPeriod = "MONTHLY" | "QUARTERLY" | "ANNUAL";

const reportPath = (key: DeptReportKey, query: Record<string, unknown>, from = "exec") => {
  const params = new URLSearchParams({ from });
  ["period_type", "period_key"].forEach((k) => query[k] && params.set(k, String(query[k])));
  return `/home/reports/department/${key}?${params.toString()}`;
};

const ExecutiveSummary = () => {
  const navigate = useNavigate();
  const controls = useReportControls();
  const periodType = (["MONTHLY", "QUARTERLY", "ANNUAL"].includes(controls.periodType)
    ? controls.periodType
    : "MONTHLY") as SummaryPeriod;
  // A weekly or custom link (e.g. from a department report) carries a period_key
  // the summary can't parse, so it falls back to the last completed month.
  const baseQuery = controls.query as typeof controls.query & { period_key?: string };
  const sameType = periodType === controls.periodType;
  const query = useMemo(() => {
    const { period_key: _key, ...rest } = baseQuery;
    return sameType ? { ...baseQuery, period_type: periodType } : { ...rest, period_type: periodType };
  }, [baseQuery, sameType, periodType]);

  const { data, loading, error, refetch } = useFetch<ApiResponse<Summary>>(
    api.fetch.fetchExecutiveSummary,
    query,
    !controls.ready,
    { silent: true }
  );
  const summary = data?.data ?? null;

  const [respond, setRespond] = useState<{ id: number; text: string } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<number | string | null>(null);

  const decide = async (id: number, decision: "APPROVE" | "RESPOND", response?: string) => {
    setBusy(id);
    try {
      await api.post.decideLeadershipRequest({ request_id: id, decision, response });
      notify.success({
        title: decision === "APPROVE" ? "Request approved" : "Response sent",
        message: "The head of department has been notified.",
      });
      setRespond(null);
      setNote("");
      refetch(query);
    } catch {
      // ApiErrorHandler already shows why it failed.
    } finally {
      setBusy(null);
    }
  };

  const remind = async (key: DeptReportKey, area: string) => {
    setBusy(key);
    try {
      await api.post.remindDepartmentReport({
        report_key: key,
        period_type: periodType,
        period_key: summary?.period.key || "",
        ...(controls.branchId ? { branch_id: controls.branchId } : {}),
      });
      notify.success({ title: "Reminder sent", message: `The ${area} head of department has been reminded.` });
    } catch {
      // ApiErrorHandler already shows why it failed.
    } finally {
      setBusy(null);
    }
  };

  const leadership = Boolean(summary?.viewer.is_leadership);
  const subtitle = summary
    ? `${summary.period.label} · ${summary.branch.name}. Headline numbers from every department report.`
    : "Headline numbers from every department report.";

  return (
    <section data-print-root="" className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeading
        title="Executive summary"
        subtitle={subtitle}
        actions={
          <>
            <PillTabs
              ariaLabel="Period"
              size="sm"
              value={periodType}
              onChange={(key) => controls.setPeriodType(key)}
              tabs={[
                { key: "MONTHLY", label: "Monthly" },
                { key: "QUARTERLY", label: "Quarterly" },
                { key: "ANNUAL", label: "Annual" },
              ]}
            />
            {summary && summary.period_options.length > 1 && (
              <select
                aria-label="Period"
                value={summary.period.key}
                onChange={(event) => controls.setPeriodKey(event.target.value)}
                className="h-10 rounded-lg border border-gray-500/35 bg-white px-3 text-sm text-primary"
              >
                {summary.period_options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <BranchSelect value={controls.branchId} onChange={controls.setBranch} />
            <UiButton tone="secondary" onClick={printReport} className="print:hidden">
              Export PDF
            </UiButton>
          </>
        }
      />

      {loading && !summary && <SkeletonGrid count={7} />}

      {error && !summary && !loading && (
        <PageEmpty
          badge="COULDN'T LOAD"
          title="Couldn't load the executive summary"
          text="Check your connection and try again."
          action={<UiButton onClick={() => refetch(query)}>Try again</UiButton>}
        />
      )}

      {summary && summary.empty && (
        <PageEmpty
          badge="NO REPORTS YET"
          title="Nothing submitted for this period"
          text="Drafts are pre-filled on the first day after the period ends. The summary fills in as heads of department submit."
        />
      )}

      {summary && !summary.empty && (
        <>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
            {summary.cards.map((card) => {
              const health = healthPill(card.health);
              const status = deptStatusPill(card.status, card.overdue);
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => navigate(reportPath(card.key, query))}
                  className="flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 text-left text-sm text-primary transition-shadow hover:shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <h2 className="text-base font-semibold leading-6">{card.area}</h2>
                    <Pill tone={health.tone} className="flex-shrink-0">{health.label}</Pill>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-3">
                    {card.failed ? (
                      <p className="col-span-2 text-gray-500">Figures couldn’t be worked out for this period.</p>
                    ) : (
                      card.headline.map((kpi) => <MiniStat key={kpi.key} kpi={toKpi(kpi)} />)
                    )}
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 border-t border-gray-200 pt-3">
                    <Pill tone={status.tone}>{status.label}</Pill>
                    <span className="truncate text-xs text-gray-500">{card.prepared_by}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
            <Card>
              <div className="pb-2">
                <CardTitle title="Top 5 things needing attention" sub="Across every department, most urgent first" />
              </div>
              {summary.top.map((item, index) => {
                const sev = severityPill(item.severity);
                return (
                  <div key={`${item.report_key}-${index}`} className="flex items-start gap-3 border-b border-gray-200 py-3 last:border-b-0">
                    <Avatar initials={String(index + 1)} size={28} dark />
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-gray-500">{item.area}</span>
                        <Pill tone={sev.tone} className="px-2 py-0">{sev.label}</Pill>
                      </div>
                      <p className="font-medium">{item.text}</p>
                      <button
                        type="button"
                        onClick={() => navigate(item.link_path || reportPath(item.report_key, query))}
                        className="bg-transparent p-0 text-sm font-medium text-primary underline underline-offset-[3px]"
                      >
                        {item.link_label || "Open report"} →
                      </button>
                    </div>
                  </div>
                );
              })}
              {summary.top.length === 0 && (
                <p className="rounded-lg border border-green-200 bg-green-50 p-3 font-medium text-green-700">
                  ✓ Nothing needs attention this period.
                </p>
              )}
            </Card>

            <Card>
              <div className="pb-2">
                <CardTitle
                  title="Report submission tracker"
                  sub={`${summary.tracker.submitted} of ${summary.tracker.total} submitted for ${summary.period.label} · due ${fmtDate(summary.tracker.due_date)}`}
                />
              </div>
              {summary.tracker.items.map((item) => {
                const status = deptStatusPill(item.status, item.overdue);
                const when = item.overdue
                  ? `Due ${fmtDate(summary.tracker.due_date)} · overdue`
                  : item.status === "RETURNED"
                    ? `Returned ${fmtDate(item.returned_at)} · waiting for changes`
                    : item.status === "APPROVED"
                      ? `Approved ${fmtDate(item.approved_at)}`
                      : item.status === "SUBMITTED"
                        ? `Submitted ${fmtDate(item.submitted_at)}`
                        : `Due ${fmtDate(summary.tracker.due_date)}`;
                return (
                  <div key={item.report_key} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-200 py-3 last:border-b-0">
                    <Avatar initials={initialsOf(item.prepared_by)} />
                    <div className="min-w-0 flex-[1_1_160px]">
                      <p className="font-medium">{item.area}</p>
                      <p className={item.overdue ? "text-xs text-red-700" : "text-xs text-gray-500"}>
                        {item.prepared_by} · {when}
                      </p>
                    </div>
                    <Pill tone={status.tone}>{status.label}</Pill>
                    {leadership && (item.status === "DRAFT" || item.status === "RETURNED") && (
                      <UiButton
                        tone="ghost"
                        size="sm"
                        disabled={busy === item.report_key}
                        onClick={() => remind(item.report_key, item.area)}
                      >
                        {busy === item.report_key ? "Sending…" : "Remind"}
                      </UiButton>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>

          <Card>
            <div className="pb-2">
              <CardTitle title="Requests to leadership" sub="Items heads of department marked as needing a decision" />
            </div>
            {summary.requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center gap-3 border-b border-gray-200 py-3 last:border-b-0">
                <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
                  <p className="font-medium">{request.text}</p>
                  <p className="text-xs text-gray-500">{request.from}</p>
                  {request.response && <p className="text-sm text-gray-600">Response: {request.response}</p>}
                </div>
                {!request.outcome && leadership ? (
                  <div className="flex gap-2">
                    <UiButton tone="secondary" onClick={() => setRespond({ id: request.id, text: request.text })}>
                      Respond
                    </UiButton>
                    <UiButton tone="primary" disabled={busy === request.id} onClick={() => decide(request.id, "APPROVE")}>
                      {busy === request.id ? "Approving…" : "Approve"}
                    </UiButton>
                  </div>
                ) : request.outcome ? (
                  <Pill tone={request.outcome === "APPROVED" ? "success" : "info"}>
                    {request.outcome === "APPROVED" ? "✓ Approved" : "Responded"}
                  </Pill>
                ) : (
                  <Pill tone="warning">Needs decision</Pill>
                )}
              </div>
            ))}
            {summary.requests.length === 0 && <p className="text-gray-500">No requests this period.</p>}
          </Card>

          <Card className="gap-4">
            <CardTitle title="People pipeline" sub="How new people moved towards serving this period" />
            <div className="flex flex-wrap items-stretch gap-2">
              {summary.pipeline.map((step, index) => {
                const last = index === summary.pipeline.length - 1;
                return (
                  <div key={step.label} className="flex min-w-0 flex-[1_1_200px] items-center gap-2">
                    <div
                      className={
                        last
                          ? "flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-lightGray bg-primary p-4 text-white"
                          : "flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-lightGray bg-inputBackground p-4 text-primary"
                      }
                    >
                      <span className="text-xs font-semibold">{step.label}</span>
                      <span className="text-2xl font-semibold leading-8">{step.value === null ? "—" : nf(step.value)}</span>
                      <span className="text-xs">{step.sub}</span>
                    </div>
                    {!last && (
                      <span aria-hidden="true" className="text-xl text-gray-500">
                        {index === 0 ? "+" : "→"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {summary.branches && summary.branches.length > 0 && (
            <section className="flex flex-col gap-3">
              <CardTitle title="Branch comparison" sub="Per-person figures make branches of different sizes comparable" />
              <div className="overflow-x-auto rounded-lg border border-lightGray bg-white shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]">
                <div className="min-w-[920px]">
                  <div className="grid gap-3 bg-lightGray px-6 py-4 font-semibold [grid-template-columns:minmax(180px,1.4fr)_repeat(6,minmax(110px,1fr))]">
                    <span>Branch</span>
                    <span className="text-right">Avg Sunday attendance</span>
                    <span className="text-right">Visitors per 100</span>
                    <span className="text-right">New members</span>
                    <span className="text-right">Giving per attendee</span>
                    <span className="text-right">Life centers meeting</span>
                    <span className="text-right">Reports in</span>
                  </div>
                  {summary.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="grid min-h-16 items-center gap-3 border-t border-lightGray px-6 py-3 hover:bg-lightGray/20 [grid-template-columns:minmax(180px,1.4fr)_repeat(6,minmax(110px,1fr))]"
                    >
                      <span className="font-semibold">{branch.name}</span>
                      <span className="text-right">{branch.avg_sunday_attendance === null ? "—" : nf(branch.avg_sunday_attendance)}</span>
                      <span className="text-right">{branch.visitors_per_100 === null ? "—" : nf(branch.visitors_per_100)}</span>
                      <span className="text-right">{branch.new_members === null ? "—" : nf(branch.new_members)}</span>
                      <span className="text-right">{branch.giving_per_attendee === null ? "—" : `GH₵ ${nf(branch.giving_per_attendee)}`}</span>
                      <span className="text-right">{branch.life_centers_meeting ?? "—"}</span>
                      <span className="text-right">{branch.reports_in}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <DialogShell
        open={Boolean(respond)}
        onClose={() => {
          setRespond(null);
          setNote("");
        }}
        title="Respond to request"
        subtitle={respond?.text}
        ctaLabel="Send response"
        ctaDisabled={!note.trim()}
        loading={busy === respond?.id}
        onConfirm={() => respond && decide(respond.id, "RESPOND", note.trim())}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-primary">Your response</span>
          <TextArea
            rows={4}
            value={note}
            placeholder="Your decision or next step"
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      </DialogShell>
    </section>
  );
};

export default ExecutiveSummary;
