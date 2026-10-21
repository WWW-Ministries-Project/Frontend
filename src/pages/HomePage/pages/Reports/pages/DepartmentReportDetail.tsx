import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import type { ApiResponse } from "@/utils/interfaces";
import type {
  DeptReportDetail,
  DeptReportKey,
  DeptReportSelector,
} from "@/utils/api/reports/interfaces";

import { ReportControls } from "../components/ReportControls";
import {
  ApprovalTrail,
  Banner,
  BandButton,
  CommentsCard,
  DialogShell,
  FlagsCard,
  HighlightsCard,
  KpiGrid,
  PageEmpty,
  Pill,
  ReportBand,
  SectionGrid,
  SkeletonGrid,
  TextArea,
  UiButton,
} from "../components/reportsUi";
import { deptStatusPill, toKpi, toSection, useReportControls } from "../utils/reportAdapters";
import { fmtDate, fmtDateTime } from "../utils/reportFormat";
import type { PillTone } from "../components/reportsUi";
import { usePrintRoot } from "../utils/reportUiHelpers";

type Tab = "report" | "comm" | "review";

const FIELDS = [
  ["wins", "Highlights and wins", "What went well this period"],
  ["challenges", "Challenges", "What got in the way"],
  ["plans", "Plans for next period", "What you will do next"],
  ["testimonies", "Testimonies and prayer points", "Optional"],
] as const;

type CommentaryField = (typeof FIELDS)[number][0];
interface DraftRequest {
  id?: number;
  text: string;
  needs_decision: boolean;
  outcome?: "APPROVED" | "RESPONDED" | null;
}

const DepartmentReportDetail = () => {
  const { key = "" } = useParams<{ key: DeptReportKey }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const controls = useReportControls();
  const from = params.get("from");

  const query = useMemo(() => ({ ...controls.query, report_key: key }), [controls.query, key]);
  const { data, loading, error, refetch } = useFetch<ApiResponse<DeptReportDetail>>(
    api.fetch.fetchDepartmentReport,
    query,
    !controls.ready,
    { silent: true }
  );
  const [override, setOverride] = useState<DeptReportDetail | null>(null);
  const report = override ?? data?.data ?? null;
  useEffect(() => setOverride(null), [data]);

  const [tab, setTab] = useState<Tab>("report");
  const [print, setPrint] = useState(false);
  usePrintRoot(print);
  const [busy, setBusy] = useState<string | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [note, setNote] = useState("");

  const selector: DeptReportSelector | null = report
    ? {
        report_key: report.meta.key,
        period_type: report.period.type,
        period_key: report.period.key,
        ...(report.branch.id ? { branch_id: report.branch.id } : {}),
      }
    : null;

  /* ---------------------------- commentary draft --------------------------- */
  const [draft, setDraft] = useState<Record<CommentaryField, string>>({ wins: "", challenges: "", plans: "", testimonies: "" });
  const [requests, setRequests] = useState<DraftRequest[]>([]);
  const [newReq, setNewReq] = useState("");
  const [saved, setSaved] = useState("");
  const dirty = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  // Bumped on every edit and every reload, so a save that returns after newer
  // edits (or after another report loaded) doesn't overwrite them.
  const editVersion = useRef(0);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const workflowKey = report ? `${report.meta.key}|${report.period.key}|${report.branch.id}|${report.workflow.status}` : "";

  useEffect(() => {
    if (!report) return;
    clearTimeout(saveTimer.current);
    editVersion.current += 1;
    setDraft({ ...report.workflow.commentary });
    setRequests(report.workflow.requests.map((r) => ({ id: r.id, text: r.text, needs_decision: r.needs_decision, outcome: r.outcome })));
    setSaved("");
    dirty.current = false;
    // Only reset the draft when a different report or status is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowKey]);

  const persist = async (nextDraft = draft, nextRequests = requests, quiet = true): Promise<boolean> => {
    if (!selector) return false;
    // One save at a time: a second one racing the first could create a new request twice.
    if (inFlight.current) await inFlight.current;
    const version = editVersion.current;
    const run = (async () => {
      try {
        setSaved("Saving…");
        const res = await api.put.saveDepartmentReportCommentary({
          ...selector,
          ...nextDraft,
          requests: nextRequests.filter((r) => !r.outcome).map((r) => ({ id: r.id, text: r.text, needs_decision: r.needs_decision })),
        });
        if (version === editVersion.current) {
          dirty.current = false;
          setSaved("Saved just now");
          if (res.data) {
            setRequests(res.data.workflow.requests.map((r) => ({ id: r.id, text: r.text, needs_decision: r.needs_decision, outcome: r.outcome })));
          }
        }
        if (!quiet) notify.success({ title: "Draft saved", message: `Your commentary on the ${report?.meta.name.toLowerCase()} is saved.` });
        return true;
      } catch {
        if (version === editVersion.current) setSaved("Couldn’t save. Your text is still here.");
        return false;
      }
    })();
    inFlight.current = run;
    try {
      return await run;
    } finally {
      if (inFlight.current === run) inFlight.current = null;
    }
  };

  const scheduleSave = (nextDraft: typeof draft, nextRequests: DraftRequest[]) => {
    dirty.current = true;
    editVersion.current += 1;
    setSaved("Unsaved changes");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(nextDraft, nextRequests), 1200);
  };
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  /* --------------------------------- actions -------------------------------- */
  const act = async (name: string, run: () => Promise<ApiResponse<DeptReportDetail>>, toast: { title: string; message: string }) => {
    setBusy(name);
    try {
      const res = await run();
      if (res.data) setOverride(res.data);
      notify.success(toast);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!selector || !report) return;
    clearTimeout(saveTimer.current);
    if (dirty.current) await persist();
    const ok = await act("submit", () => api.post.submitDepartmentReport(selector), {
      title: "Submitted to leadership",
      message: `The ${report.meta.name.toLowerCase()} is locked while leadership reviews it.`,
    });
    if (ok) setTab("report");
  };
  const approve = () =>
    selector &&
    report &&
    act("approve", () => api.post.approveDepartmentReport(selector), {
      title: "Report approved",
      message: `${report.meta.name} for ${report.period.label} is approved and locked.`,
    });
  const doReturn = async () => {
    if (!selector || !report || !note.trim()) return;
    const ok = await act("return", () => api.post.returnDepartmentReport({ ...selector, note: note.trim() }), {
      title: "Report returned",
      message: "The head of department can edit it again and sees your note.",
    });
    if (ok) {
      setReturnOpen(false);
      setNote("");
    }
  };
  const remind = async () => {
    if (!selector || !report) return;
    setBusy("remind");
    try {
      await api.post.remindDepartmentReport(selector);
      notify.success({ title: "Reminder sent", message: `The ${report.meta.area} head of department has been reminded.` });
    } catch {
      // ApiErrorHandler already shows why it failed.
    } finally {
      setBusy(null);
    }
  };
  const postComment = async (text: string) => {
    if (!selector) return;
    setBusy("comment");
    try {
      const res = await api.post.commentOnDepartmentReport({ ...selector, text });
      if (res.data) setOverride(res.data);
    } finally {
      setBusy(null);
    }
  };

  /* ---------------------------------- view ---------------------------------- */
  const backLabel = from === "exec" ? "Executive summary" : "Department reports";
  const back = () => navigate(from === "exec" ? "/home/reports/executive-summary" : "/home/reports/department");

  if (!report) {
    return (
      <section className="flex flex-col gap-6 p-4 sm:p-6">
        <button type="button" onClick={back} className="self-start bg-transparent p-0 text-sm text-[#4B5563] hover:text-primary">
          ← {backLabel}
        </button>
        {loading || !error ? (
          <SkeletonGrid count={6} min={200} height={120} />
        ) : (
          <PageEmpty
            badge="COULDN'T LOAD"
            title="Couldn't load this report"
            text="It may not exist, or your access level doesn't include it."
            action={<UiButton onClick={() => refetch(query)}>Try again</UiButton>}
          />
        )}
      </section>
    );
  }

  const { workflow, permissions: can, body, period } = report;
  const status = deptStatusPill(workflow.status);
  const vsLabel = `vs ${controls.compare === "yoy" ? period.yoy_label : period.prev_label}`;
  const leadersNote = [...workflow.comments].reverse().find((c) => workflow.returned_at && c.when >= workflow.returned_at);
  const showReport = print || tab === "report";
  const showComm = print || tab === "comm";
  const showReview = print || tab === "review";
  const editable = can.can_edit && !print;
  const prepared = workflow.prepared_by?.name || report.meta.hod_role;
  const statusMeta =
    workflow.status === "DRAFT"
      ? `Due ${fmtDate(workflow.due_date)}`
      : workflow.status === "APPROVED"
        ? `Approved ${fmtDate(workflow.approved_at)}`
        : `Submitted ${fmtDate(workflow.submitted_at)}`;

  const banners: { tone: PillTone; title: string; text?: string; action?: { label: string; onClick: () => void } }[] = [];
  if (workflow.status === "RETURNED") {
    banners.push({
      tone: "danger",
      title: `Returned to ${can.can_edit ? "you" : prepared} for changes`,
      text: leadersNote ? `“${leadersNote.text}” — ${leadersNote.author}` : "See leadership comments.",
      action: can.can_edit && !print ? { label: "Update commentary", onClick: () => setTab("comm") } : undefined,
    });
  }
  if (workflow.status === "DRAFT" && !period.in_progress) {
    banners.push(
      can.can_edit
        ? {
            tone: workflow.overdue ? "danger" : "info",
            title: "Draft pre-filled from system data",
            text: `Check the numbers, add your commentary and submit. Due ${fmtDate(workflow.due_date)}${workflow.overdue ? ", now overdue" : ""}.`,
            action: !print && tab !== "comm" ? { label: "Write commentary", onClick: () => setTab("comm") } : undefined,
          }
        : {
            tone: workflow.overdue ? "danger" : "info",
            title: "Not submitted yet",
            text: `${prepared} has not submitted this report. Due ${fmtDate(workflow.due_date)}${workflow.overdue ? ", now overdue" : ""}.`,
            action: can.can_remind && !print ? { label: busy === "remind" ? "Sending…" : "Send reminder", onClick: remind } : undefined,
          }
    );
  }
  if (period.in_progress) {
    banners.push({ tone: "info", title: "This period is still in progress", text: "Figures will keep changing until it closes. It can be submitted after it ends." });
  }
  if (workflow.status === "SUBMITTED") {
    banners.push(
      can.can_approve
        ? { tone: "info", title: "Waiting for your review", text: `Submitted by ${prepared} on ${fmtDate(workflow.submitted_at)}. Approve it, or return it with a note.` }
        : { tone: "info", title: "Submitted, waiting for leadership", text: "Editing is locked while leadership reviews it." }
    );
  }
  if (workflow.status === "APPROVED") {
    banners.push({ tone: "success", title: "Approved and locked", text: `Approved on ${fmtDate(workflow.approved_at)}. This report is read-only.` });
  }
  if (body.provisional_note && !body.empty) banners.push({ tone: "warning", title: "Some figures are provisional", text: body.provisional_note });
  if (body.restricted && body.sections.some((s) => s.kind === "list" && s.items.some((i) => i.pii))) {
    banners.push({ tone: "info", title: "Some member details are hidden", text: "Your access level shows counts but not names. Ask an administrator if you need the full list." });
  }
  if (report.failed) banners.push({ tone: "danger", title: "Couldn't work out the figures", text: "Something went wrong building this report. Try again in a few minutes." });

  const decisions = requests.filter((r) => r.needs_decision).length;
  const kpis = body.kpis.map((k) => toKpi(k, controls.compare));
  const sections = body.sections.map(toSection).concat(body.by_branch && report.branch.id === null ? [toSection(body.by_branch)] : []);

  return (
    <section className="flex min-h-full flex-1 flex-col">
      {!print && (
        <ReportBand
          backLabel={backLabel}
          onBack={back}
          eyebrow={`${report.meta.area} · ${period.type}`}
          title={report.meta.name}
          status={status}
          meta={[period.label, report.branch.name, statusMeta]}
          preparedBy={{ name: prepared, role: workflow.prepared_by ? report.meta.hod_role : undefined }}
          tab={tab}
          onTab={setTab}
          tabs={[
            { key: "report", label: "Report" },
            { key: "comm", label: "Commentary", count: decisions },
            { key: "review", label: "Sign-off", count: workflow.comments.length },
          ]}
          exportItems={[
            { label: "Download PDF", onClick: () => { setPrint(true); setTimeout(() => window.print(), 300); } },
            {
              label: "Download DOCX",
              onClick: async () => {
                const { downloadDepartmentReportDocx } = await import("../utils/exportReportDocx");
                await downloadDepartmentReportDocx(report, controls.compare);
              },
            },
            { label: "Print view (A4)", onClick: () => setPrint(true) },
          ]}
          actions={
            <>
              {can.can_return && <BandButton onClick={() => setReturnOpen(true)}>Return to HOD</BandButton>}
              {can.can_approve && (
                <BandButton solid onClick={approve} disabled={busy === "approve"}>
                  {busy === "approve" ? "Approving…" : "Approve report"}
                </BandButton>
              )}
              {can.can_submit && (
                <BandButton solid onClick={submit} disabled={busy === "submit"}>
                  {busy === "submit" ? "Submitting…" : "Submit to leadership"}
                </BandButton>
              )}
            </>
          }
        />
      )}

      <div className={print ? "flex flex-1 flex-col gap-4 bg-[#F3F5FA] px-4 py-6 print:bg-white print:p-0" : "flex flex-1 flex-col bg-white"}>
        {print && (
          <div className="mx-auto flex w-full max-w-[794px] flex-wrap items-center justify-between gap-2 print:hidden">
            <div>
              <p className="font-semibold">Print preview · A4 portrait</p>
              <p className="text-xs text-[#4B5563]">Controls are hidden. Commentary and sign-off are included.</p>
            </div>
            <div className="flex gap-2">
              <UiButton tone="secondary" onClick={() => setPrint(false)}>Back to report</UiButton>
              <UiButton tone="primary" onClick={() => window.print()}>Print</UiButton>
            </div>
          </div>
        )}
        <div
          data-print-root={print ? "" : undefined}
          className={
            print
              ? "mx-auto flex w-full max-w-[794px] flex-1 flex-col gap-6 bg-white p-6 shadow-[0_8px_24px_rgba(8,13,45,0.08)] sm:p-10 print:max-w-none print:p-0 print:shadow-none"
              : "flex w-full flex-1 flex-col gap-6 p-4 sm:p-6"
          }
        >
          {print && (
            <div className="flex flex-wrap justify-between gap-4 border-b-2 border-primary pb-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-[0.04em] text-[#6B7280]">WORLDWIDE WORD MINISTRIES</span>
                <h1 className="text-2xl font-semibold leading-8">{report.meta.name}</h1>
                <p className="text-[#4B5563]">
                  {period.label} · {report.branch.name} · Prepared by {prepared}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Pill tone={status.tone}>{status.label}</Pill>
                <span className="text-xs text-[#6B7280]">{statusMeta}</span>
              </div>
            </div>
          )}

          {showReport && !print && (
            <ReportControls
              periodType={controls.periodType}
              periodKey={controls.periodKey || period.key}
              period={period}
              options={report.period_options}
              compare={controls.compare}
              branchId={controls.branchId}
              onPeriodType={controls.setPeriodType}
              onPeriodKey={controls.setPeriodKey}
              onCompare={controls.setCompare}
              onBranch={controls.setBranch}
            />
          )}

          {banners.map((b) => (
            <Banner key={b.title} tone={b.tone} title={b.title} text={b.text} action={b.action} />
          ))}

          {showReport && loading && <SkeletonGrid count={6} min={200} height={120} />}

          {showReport && !loading && body.empty && (
            <PageEmpty
              bare
              badge="NO DATA YET"
              title={`No data for ${period.label} yet`}
              text="The draft is pre-filled automatically the day after the period closes. Until then, pick an earlier period."
            />
          )}

          {showReport && !loading && !body.empty && (
            <>
              <KpiGrid kpis={kpis} vsLabel={vsLabel} />
              <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
                <FlagsCard
                  hideLinks={print}
                  flags={body.flags.map((f) => ({
                    severity: f.severity,
                    text: f.text,
                    link: f.link_label || undefined,
                    onOpen: f.link_path ? () => navigate(f.link_path as string) : undefined,
                  }))}
                />
                <HighlightsCard items={body.highlights} />
              </div>
              <SectionGrid sections={sections} />
            </>
          )}

          {showComm && (
            <section className="flex flex-col gap-5 [break-inside:avoid]">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold leading-7 text-[#1F2937]">Head of department commentary</h2>
                  <p className="text-[#4B5563]">
                    {editable ? "Your view of the numbers. Saved as you type and locked once submitted." : `Written by ${prepared}`}
                  </p>
                </div>
                {editable && <span className="text-xs text-[#6B7280]" aria-live="polite">{saved}</span>}
              </div>
              {FIELDS.map(([field, label, hint]) => (
                <div key={field} className="flex flex-col gap-1">
                  <label htmlFor={`comm-${field}`} className="font-medium">{label}</label>
                  <span className="text-xs text-[#6B7280]">{hint}</span>
                  {editable ? (
                    <TextArea
                      id={`comm-${field}`}
                      rows={3}
                      placeholder={hint}
                      value={draft[field]}
                      onChange={(event) => {
                        const next = { ...draft, [field]: event.target.value };
                        setDraft(next);
                        scheduleSave(next, requests);
                      }}
                    />
                  ) : (
                    <p className={`whitespace-pre-wrap rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 ${draft[field] ? "text-primary" : "text-[#6B7280]"}`}>
                      {draft[field] || "Nothing written yet."}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex flex-col gap-2">
                <span className="font-medium">Requests to leadership</span>
                <span className="text-xs text-[#6B7280]">Mark anything that needs a decision. These collect on the executive summary.</span>
                {requests.map((request, index) => {
                  const decided = workflow.requests.find((r) => r.id === request.id);
                  return (
                    <div key={request.id ?? `new-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-lightGray px-4 py-3">
                      <p className="min-w-0 flex-[1_1_280px]">{request.text}</p>
                      {editable && !request.outcome ? (
                        <>
                          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={request.needs_decision}
                              onChange={() => {
                                const next = requests.map((r, i) => (i === index ? { ...r, needs_decision: !r.needs_decision } : r));
                                setRequests(next);
                                scheduleSave(draft, next);
                              }}
                            />
                            Needs decision
                          </label>
                          <UiButton
                            tone="danger"
                            size="sm"
                            className="border-transparent"
                            aria-label="Remove request"
                            onClick={() => {
                              const next = requests.filter((_, i) => i !== index);
                              setRequests(next);
                              scheduleSave(draft, next);
                            }}
                          >
                            Remove
                          </UiButton>
                        </>
                      ) : request.outcome ? (
                        <Pill tone={request.outcome === "APPROVED" ? "success" : "info"}>
                          {request.outcome === "APPROVED" ? "✓ Approved" : "Responded"}
                        </Pill>
                      ) : request.needs_decision ? (
                        <Pill tone="warning">Needs decision</Pill>
                      ) : null}
                      {decided?.response && <p className="w-full text-sm text-[#4B5563]">Response: {decided.response}</p>}
                    </div>
                  );
                })}
                {requests.length === 0 && <p className="text-[#6B7280]">No requests this period.</p>}
                {editable && (
                  <form
                    className="flex flex-wrap gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const text = newReq.trim();
                      if (!text) return;
                      const next = [...requests, { text, needs_decision: true }];
                      setRequests(next);
                      setNewReq("");
                      scheduleSave(draft, next);
                    }}
                  >
                    <input
                      value={newReq}
                      onChange={(event) => setNewReq(event.target.value)}
                      placeholder="Add a request to leadership"
                      aria-label="New request"
                      className="h-10 min-w-0 flex-[1_1_280px] rounded-lg border border-[rgba(107,114,128,0.35)] px-3 text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]"
                    />
                    <UiButton type="submit" tone="secondary">Add request</UiButton>
                  </form>
                )}
              </div>

              {editable && (
                <div className="flex flex-wrap justify-end gap-2 border-t border-[#E5E7EB] pt-4">
                  <UiButton tone="secondary" onClick={() => { clearTimeout(saveTimer.current); persist(draft, requests, false); }}>
                    Save draft
                  </UiButton>
                  {can.can_submit && (
                    <UiButton tone="primary" onClick={submit} disabled={busy === "submit"}>
                      {busy === "submit" ? "Submitting…" : "Submit to leadership"}
                    </UiButton>
                  )}
                </div>
              )}
            </section>
          )}

          {showReview && (
            <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
              <ApprovalTrail
                steps={workflow.trail.map((t) => ({
                  action: t.action,
                  who: t.who,
                  when: t.when ? (/^\d{4}-/.test(t.when) ? fmtDateTime(t.when) : t.when) : "Pending",
                  done: t.done,
                }))}
              >
                {(can.can_approve || can.can_return) && !print && (
                  <div className="flex flex-wrap gap-2">
                    {can.can_return && (
                      <UiButton tone="secondary" onClick={() => setReturnOpen(true)}>Return to HOD with note</UiButton>
                    )}
                    {can.can_approve && (
                      <UiButton tone="primary" onClick={approve} disabled={busy === "approve"}>
                        {busy === "approve" ? "Approving…" : "Approve report"}
                      </UiButton>
                    )}
                  </div>
                )}
              </ApprovalTrail>
              <CommentsCard
                comments={workflow.comments.map((c) => ({ id: c.id, author: c.author, when: fmtDate(c.when), text: c.text }))}
                canPost={can.can_comment && !print}
                posting={busy === "comment"}
                onPost={postComment}
              />
            </div>
          )}
        </div>
      </div>

      <DialogShell
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Return to head of department"
        subtitle="The report goes back as editable. Your note appears on the report and in the comments."
        ctaLabel="Return report"
        ctaDisabled={!note.trim()}
        loading={busy === "return"}
        onConfirm={doReturn}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-primary">Note to the head of department</span>
          <TextArea rows={4} value={note} placeholder="What needs to change?" onChange={(event) => setNote(event.target.value)} />
        </label>
      </DialogShell>
    </section>
  );
};

export default DepartmentReportDetail;
