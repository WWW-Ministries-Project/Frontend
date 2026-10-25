import { useBackNavigation } from "@/CustomHooks/useBackNavigation";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import { api, downloadBlobFile } from "@/utils";
import type { ApiResponse } from "@/utils/interfaces";
import type {
  EventReportChurchAttendance,
  EventReportDepartment,
  EventReportDetail,
  EventReportOverviewItem,
  EventReportServiceSummaryFormat,
} from "@/utils/api/eventReports/interfaces";
import { cn } from "@/utils/cn";

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
  SelectInput,
  SkeletonGrid,
  TextArea,
  UiButton,
} from "../components/reportsUi";
import type { PillTone } from "../components/reportsUi";
import { EVENT_TYPE_LABEL, eventStatusPill, eventTypeOf, fmtClock, fmtEventDate, fmtEventTime } from "../utils/eventReportFormat";
import { deltaOf, fmtDateTime, nf } from "../utils/reportFormat";
import type { ReportFlag, ReportKpi, ReportSection } from "../utils/reportTypes";
import { AM, BL, BZ, GN, NV, RD, SF } from "../utils/reportTypes";

type Tab = "overview" | "depts" | "attendance" | "review";
type Timing = "Early" | "On time" | "Late" | "Absent";

const TIMING_TONE: Record<Timing, PillTone> = { Early: "success", "On time": "info", Late: "warning", Absent: "danger" };
const timingOf = (raw: string | null | undefined): Timing | null => {
  const v = String(raw || "").toLowerCase().replace(/[\s-]/g, "_");
  if (v === "early") return "Early";
  if (v === "on_time" || v === "ontime") return "On time";
  if (v === "late") return "Late";
  if (v === "absent") return "Absent";
  return null;
};

const ACTION_LABEL: Record<string, string> = {
  GENERATED: "Report generated",
  APPROVED: "Approved",
  RETURNED: "Returned for changes",
  RESUBMITTED: "Resubmitted for approval",
};

const n = (v: number | null | undefined) => Number(v || 0);

/** Normalised headcount, tolerant of the older and newer backend field names. */
const headcount = (c: (EventReportChurchAttendance & Record<string, unknown>) | null | undefined) => {
  const am = n(c?.adult_male), af = n(c?.adult_female);
  const ym = n(c?.youth_male), yf = n(c?.youth_female);
  const cm = n(c?.children_male), cf = n(c?.children_female);
  const vm = n(c?.visitors_male), vf = n(c?.visitors_female);
  const visitorsOnly = vm + vf || n(c?.visitors);
  const pm = n(c?.visitor_clergy_male), pf = n(c?.visitor_clergy_female);
  const clergy = pm + pf || n(c?.visitor_clergy_total) || n(c?.visiting_pastors);
  const members = am + af + ym + yf + cm + cf;
  return { am, af, ym, yf, cm, cf, vm, vf, visitors: visitorsOnly, pm, pf, clergy, members, total: members + visitorsOnly + clergy };
};

const deptStats = (departments: EventReportDepartment[]) => {
  const rows = departments.flatMap((d) => d.attendees || []);
  const count = (t: Timing) => rows.filter((r) => timingOf(r.status) === t).length;
  const total = departments.reduce((a, d) => a + n(d.total_members), 0);
  const present = departments.reduce((a, d) => a + n(d.present_members), 0);
  const early = count("Early"), onTime = count("On time"), late = count("Late");
  const arrived = early + onTime + late;
  return {
    total,
    present,
    pct: total ? Math.round((present / total) * 100) : 0,
    onTimePct: arrived ? Math.round(((early + onTime) / arrived) * 100) : 0,
    early,
    onTime,
    late,
    absent: count("Absent") || Math.max(0, total - present),
  };
};

const deptPct = (d: EventReportDepartment) =>
  d.attendance_percentage != null ? Math.round(d.attendance_percentage) : n(d.total_members) ? Math.round((n(d.present_members) / n(d.total_members)) * 100) : 0;

const EventReportDetails = () => {
  const { id = "" } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search);
  const eventDate = search.get("eventDate") || "";
  const nameFromQuery = search.get("eventName") || "";

  const query = useMemo(() => ({ event_id: id, ...(eventDate ? { event_date: eventDate } : {}) }), [id, eventDate]);
  const { data, loading, error, refetch } = useFetch<ApiResponse<EventReportDetail | null>>(
    api.fetch.fetchEventReportDetails,
    query,
    !id,
    { silent: true }
  );
  const report = data?.data ?? null;
  const eventName = report?.event_name || nameFromQuery;

  // Other occurrences of the same event: same event id on other dates, or other events with the same name.
  const siblingsQuery = useMemo(() => ({ date_scope: "all", ...(eventName ? { search: eventName } : {}) }), [eventName]);
  const siblings = useFetch<ApiResponse<EventReportOverviewItem[]>>(api.fetch.fetchEventReportsOverview, siblingsQuery, !eventName, { silent: true });
  const occurrences = useMemo(() => {
    const list = new Map<string, { event_id: string; event_date: string }>();
    (report?.available_dates || []).forEach((d) => list.set(`${id}::${d.slice(0, 10)}`, { event_id: id, event_date: d.slice(0, 10) }));
    (Array.isArray(siblings.data?.data) ? siblings.data!.data : [])
      .filter((r) => r.event_name === eventName)
      .forEach((r) => list.set(`${r.event_id}::${r.event_date.slice(0, 10)}`, { event_id: String(r.event_id), event_date: r.event_date.slice(0, 10) }));
    if (report) list.set(`${id}::${report.event_date.slice(0, 10)}`, { event_id: id, event_date: report.event_date.slice(0, 10) });
    return Array.from(list.values()).sort((a, b) => b.event_date.localeCompare(a.event_date));
  }, [report, siblings.data, eventName, id]);

  const currentDate = report?.event_date.slice(0, 10) || eventDate;
  const previous = occurrences.find((o) => o.event_date < currentDate);
  const prevQuery = useMemo(() => (previous ? { event_id: previous.event_id, event_date: previous.event_date } : undefined), [previous]);
  const prev = useFetch<ApiResponse<EventReportDetail | null>>(api.fetch.fetchEventReportDetails, prevQuery, !previous, { silent: true });
  const prevReport = previous ? prev.data?.data ?? null : null;

  const [tab, setTab] = useState<Tab>("overview");
  const [deptF, setDeptF] = useState("ALL");
  const [timeF, setTimeF] = useState<"ALL" | Timing>("ALL");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [note, setNote] = useState("");

  const goTo = (o: { event_id: string; event_date: string }) => {
    const params = new URLSearchParams({ eventDate: o.event_date });
    if (eventName) params.set("eventName", eventName);
    // Another date of the same event: swap in place so Back still leaves the report.
    navigate(`/home/reports/event-reports/${o.event_id}?${params.toString()}`, { replace: true });
    setTab("overview");
  };
  const { goBack: back, label: backLabel } = useBackNavigation("/home/reports/event-reports");

  if (!report) {
    return (
      <section className="flex flex-col gap-6 p-4 sm:p-6">
        <button type="button" onClick={back} className="self-start bg-transparent p-0 text-sm text-gray-600 hover:text-primary">
          ← {backLabel}
        </button>
        {loading || (!error && id) ? (
          <SkeletonGrid count={6} min={200} height={120} />
        ) : (
          <PageEmpty
            badge="NOT FOUND"
            title="Couldn't load this event report"
            text="It may not have been generated for this date yet."
            action={<UiButton onClick={() => refetch(query)}>Try again</UiButton>}
          />
        )}
      </section>
    );
  }

  const selector = { event_id: id, event_date: currentDate };
  const statusLabel = report.report?.status_label || "Pending approval";
  const status = eventStatusPill(statusLabel);
  const can = report.permissions || { can_approve: false, can_return: false, can_resubmit: false, can_comment: false };
  const type = eventTypeOf(report.event_type);
  const departments = report.departments || [];
  const ca = headcount(report.church_attendance as never);
  const pca = prevReport ? headcount(prevReport.church_attendance as never) : null;
  const ds = deptStats(departments);
  const pds = prevReport ? deptStats(prevReport.departments || []) : null;
  const vsLabel = previous ? `vs ${fmtEventDate(previous.event_date).replace(/^\w+, /, "")}` : undefined;
  const start = fmtClock(report.start_time);

  /* --------------------------------- overview -------------------------------- */
  const kpis: ReportKpi[] = [
    { label: "Total attendance", value: nf(ca.total), format: "n", good: "up", delta: pca ? deltaOf(ca.total, pca.total) : null },
    { label: "Members", value: nf(ca.members), format: "n", good: "up", delta: pca ? deltaOf(ca.members, pca.members) : null },
    { label: "Visitors", value: nf(ca.visitors), format: "n", good: "up", delta: pca ? deltaOf(ca.visitors, pca.visitors) : null, sub: ca.vm + ca.vf ? `${ca.vf} women · ${ca.vm} men` : undefined },
    { label: "Visiting clergy", value: nf(ca.clergy), format: "n" },
    { label: "Workers present", value: `${ds.pct}%`, format: "pct", good: "up", delta: pds ? deltaOf(ds.pct, pds.pct, true) : null, sub: `${ds.present} of ${ds.total} workers` },
    { label: "Workers on time", value: `${ds.onTimePct}%`, format: "pct", good: "up", sub: "Early or on time at clock-in" },
  ];

  const low = departments.filter((d) => n(d.total_members) > 0 && deptPct(d) < 60);
  const flags: ReportFlag[] = [
    ...low.map((d) => ({
      severity: "act" as const,
      text: `${d.department_name} had only ${deptPct(d)}% of its workers present (${n(d.present_members)} of ${n(d.total_members)})`,
      link: `View ${d.department_name}`,
      onOpen: () => {
        setTab("depts");
        setDeptF(String(d.department_id));
        setTimeF("ALL");
      },
    })),
    ...(ds.early + ds.onTime + ds.late > 0 && ds.late / (ds.early + ds.onTime + ds.late) > 0.2
      ? [
          {
            severity: "watch" as const,
            text: `${ds.late} workers clocked in late (${Math.round((ds.late / (ds.early + ds.onTime + ds.late)) * 100)}% of those present)`,
            link: "View late arrivals",
            onOpen: () => {
              setTab("depts");
              setDeptF("ALL");
              setTimeF("Late");
            },
          },
        ]
      : []),
  ];

  const best = departments.slice().sort((a, b) => deptPct(b) - deptPct(a))[0];
  const change = pca && pca.total ? Math.round(((ca.total - pca.total) / pca.total) * 1000) / 10 : null;
  const highlights = [
    `${nf(ca.total)} people attended${change !== null && vsLabel ? `, ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% on ${vsLabel.slice(3)}` : ""}.`,
    ...(ds.total ? [`${ds.present} of ${ds.total} workers served (${ds.pct}%).${best ? ` ${best.department_name} had the best turnout at ${deptPct(best)}%.` : ""}`] : []),
    ...(ds.early + ds.onTime + ds.late ? [`${ds.onTimePct}% of workers who came clocked in early or on time.`] : []),
    `${nf(ca.visitors)} visitors${ca.clergy ? ` and ${ca.clergy} visiting clergy were` : " were"} recorded.`,
  ];

  const pctColor = (p: number) => (p >= 75 ? GN : p >= 60 ? AM : RD);
  const overviewSections: ReportSection[] = [
    {
      kind: "hbars",
      id: "presence",
      title: "Department presence",
      sub: "Share of each department’s workers present",
      max: 100,
      rows: departments
        .slice()
        .sort((a, b) => deptPct(b) - deptPct(a))
        .map((d) => ({ label: d.department_name, value: deptPct(d), display: `${deptPct(d)}% · ${n(d.present_members)} of ${n(d.total_members)}`, color: pctColor(deptPct(d)) })),
    },
    {
      kind: "segments",
      id: "mix",
      title: "Attendance mix",
      sub: `Everyone counted at the ${EVENT_TYPE_LABEL[type].toLowerCase()}`,
      groups: [
        { label: "Members, visitors and clergy", parts: [{ label: "Members", value: ca.members, color: NV }, { label: "Visitors", value: ca.visitors, color: BZ }, { label: "Visiting clergy", value: ca.clergy, color: SF }].filter((p) => p.value > 0) },
        { label: "Age group", parts: [{ label: "Adults", value: ca.am + ca.af, color: NV }, { label: "Youth", value: ca.ym + ca.yf, color: BZ }, { label: "Children", value: ca.cm + ca.cf, color: SF }].filter((p) => p.value > 0) },
        { label: "Gender", parts: [{ label: "Female", value: ca.af + ca.yf + ca.cf + ca.vf + ca.pf, color: NV }, { label: "Male", value: ca.am + ca.ym + ca.cm + ca.vm + ca.pm, color: BZ }].filter((p) => p.value > 0) },
      ].filter((g) => g.parts.length > 0),
    },
    {
      kind: "segments",
      id: "arrival",
      title: "Worker arrival",
      sub: start ? `Clock-in compared with the ${start} start` : "Clock-in compared with the start time",
      full: true,
      groups: [{ parts: [{ label: "Early", value: ds.early, color: GN }, { label: "On time", value: ds.onTime, color: BL }, { label: "Late", value: ds.late, color: AM }, { label: "Absent", value: ds.absent, color: RD }].filter((p) => p.value > 0) }],
    },
  ];

  const attendanceSections: ReportSection[] = [
    {
      kind: "table",
      id: "headcount",
      title: "Headcount by group",
      sub: "From the ushers’ count",
      minWidth: "480px",
      columns: [
        { label: "Group", width: "minmax(160px,1.5fr)" },
        { label: "Male", width: "100px", align: "right" },
        { label: "Female", width: "100px", align: "right" },
        { label: "Total", width: "100px", align: "right" },
      ],
      rows: [
        ["Adults", ca.am, ca.af],
        ["Youth", ca.ym, ca.yf],
        ["Children", ca.cm, ca.cf],
        ["Visitors", ca.vm, ca.vf, ca.visitors],
        ["Visiting clergy", ca.pm, ca.pf, ca.clergy],
      ]
        .map(([label, m, f, t]) => ({
          cells: [{ text: String(label), bold: true }, nf(Number(m)), nf(Number(f)), { text: nf(Number(t ?? Number(m) + Number(f))), bold: true }],
        }))
        .concat([
          {
            cells: [
              { text: "Total", bold: true },
              { text: nf(ca.am + ca.ym + ca.cm + ca.vm + ca.pm), bold: true },
              { text: nf(ca.af + ca.yf + ca.cf + ca.vf + ca.pf), bold: true },
              { text: nf(ca.total), bold: true },
            ],
          },
        ]),
    },
    {
      kind: "bars",
      id: "by-group",
      title: "By group",
      sub: "Male and female",
      stack: false,
      labels: ["Adults", "Youth", "Children", "Visitors", "Clergy"],
      series: [
        { name: "Male", color: NV, values: [ca.am, ca.ym, ca.cm, ca.vm, ca.pm] },
        { name: "Female", color: BZ, values: [ca.af, ca.yf, ca.cf, ca.vf, ca.pf] },
      ],
    },
  ];

  /* ---------------------------------- actions -------------------------------- */
  const run = async (name: string, call: () => Promise<unknown>, toast: { title: string; message: string }) => {
    setBusy(name);
    try {
      await call();
      notify.success(toast);
      await refetch(query);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(null);
    }
  };
  const download = async (format: EventReportServiceSummaryFormat) => {
    setBusy(format);
    try {
      const file = await api.post.downloadEventReportServiceSummary(selector, format);
      downloadBlobFile(file.blob, file.fileName);
    } catch {
      notify.error({ title: "Couldn't download the report", message: `The ${format.toUpperCase()} file could not be created. Try again in a minute.` });
    } finally {
      setBusy(null);
    }
  };

  const trail = (report.trail || []).map((t) => ({ action: ACTION_LABEL[t.action] || t.action, who: t.who || "System", when: fmtDateTime(t.when), done: true }));
  if (statusLabel === "Pending approval") trail.push({ action: "Waiting for approval", who: "Leadership", when: "Pending", done: false });
  const comments = report.comments || [];
  const lastReturn = [...comments].reverse()[0];

  const banners: { tone: PillTone; title: string; text?: string }[] = [];
  if (statusLabel === "Pending approval") {
    banners.push(
      can.can_approve
        ? { tone: "warning", title: "Waiting for your approval", text: "Check the department turnout and headcount, then approve or return it." }
        : { tone: "info", title: "Waiting for leadership approval", text: report.generated_at ? `Generated on ${fmtDateTime(report.generated_at)}.` : undefined }
    );
  }
  if (statusLabel === "Returned") banners.push({ tone: "danger", title: "Returned for changes", text: lastReturn ? `“${lastReturn.text}” — ${lastReturn.author || "Leadership"}` : undefined });
  if (statusLabel === "Approved") banners.push({ tone: "success", title: "Approved and locked", text: `Approved${report.report?.acted_by_name ? ` by ${report.report.acted_by_name}` : ""}. Downloads use this approved version.` });

  /* -------------------------------- departments ------------------------------ */
  const deptRows = departments
    .filter((d) => deptF === "ALL" || String(d.department_id) === deptF)
    .map((d) => {
      const attendees = (d.attendees || []).filter((a) => timeF === "ALL" || timingOf(a.status) === timeF);
      return { d, attendees, open: deptF !== "ALL" || Boolean(openDepts[String(d.department_id)]) };
    });

  return (
    <section className="flex min-h-full flex-1 flex-col">
      <ReportBand
        backLabel={backLabel}
        onBack={back}
        eyebrow={`Event report · ${EVENT_TYPE_LABEL[type]}`}
        title={eventName}
        status={status}
        meta={[fmtEventDate(currentDate), fmtEventTime(report.start_time, report.end_time), report.location || "", report.generated_at ? `Generated ${fmtDateTime(report.generated_at)}` : ""].filter(Boolean)}
        tab={tab}
        onTab={setTab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "depts", label: "Departments", count: low.length },
          { key: "attendance", label: "Church attendance" },
          { key: "review", label: "Approval", count: comments.length },
        ]}
        exportItems={[
          { label: busy === "pdf" ? "Preparing PDF…" : "Download PDF", onClick: () => download("pdf"), disabled: Boolean(busy) },
          { label: busy === "docx" ? "Preparing DOCX…" : "Download DOCX", onClick: () => download("docx"), disabled: Boolean(busy) },
        ]}
        actions={
          <>
            {occurrences.length > 1 && (
              <select
                aria-label="Report date"
                value={`${id}::${currentDate}`}
                onChange={(event) => {
                  const o = occurrences.find((x) => `${x.event_id}::${x.event_date}` === event.target.value);
                  if (o) goTo(o);
                }}
                className="h-10 max-w-full rounded-lg border border-white/40 bg-primary px-3 text-sm text-white"
              >
                {occurrences.map((o) => (
                  <option key={`${o.event_id}::${o.event_date}`} value={`${o.event_id}::${o.event_date}`}>
                    {fmtEventDate(o.event_date)}
                  </option>
                ))}
              </select>
            )}
            {can.can_return && <BandButton onClick={() => setReturnOpen(true)}>Return</BandButton>}
            {can.can_approve && (
              <BandButton
                solid
                disabled={busy === "approve"}
                onClick={() => run("approve", () => api.post.approveEventReport(selector), { title: "Event report approved", message: `${eventName} on ${fmtEventDate(currentDate)} is approved and locked.` })}
              >
                {busy === "approve" ? "Approving…" : "Approve report"}
              </BandButton>
            )}
            {can.can_resubmit && (
              <BandButton
                solid
                disabled={busy === "resubmit"}
                onClick={() => run("resubmit", () => api.post.resubmitEventReport(selector), { title: "Resubmitted for approval", message: "Leadership can review the report again." })}
              >
                {busy === "resubmit" ? "Resubmitting…" : "Resubmit for approval"}
              </BandButton>
            )}
          </>
        }
      />

      <div className="flex w-full flex-1 flex-col gap-6 bg-white p-4 sm:p-6">
        {banners.map((b) => (
          <Banner key={b.title} tone={b.tone} title={b.title} text={b.text} />
        ))}

        {loading && <SkeletonGrid count={6} min={200} height={120} />}

        {!loading && tab === "overview" && (
          <>
            <KpiGrid kpis={kpis} vsLabel={vsLabel} />
            <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
              <FlagsCard flags={flags} />
              <HighlightsCard items={highlights} />
            </div>
            <SectionGrid sections={overviewSections} />
          </>
        )}

        {!loading && tab === "attendance" && <SectionGrid sections={attendanceSections} />}

        {!loading && tab === "depts" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <label className="flex max-w-[280px] flex-[1_1_200px] flex-col gap-1">
                <span className="text-sm text-primary">Department</span>
                <SelectInput
                  value={deptF}
                  onChange={(event) => setDeptF(event.target.value)}
                  options={[{ value: "ALL", label: "All departments" }, ...departments.map((d) => ({ value: String(d.department_id), label: d.department_name }))]}
                />
              </label>
              <label className="flex max-w-[240px] flex-[1_1_180px] flex-col gap-1">
                <span className="text-sm text-primary">Arrival</span>
                <SelectInput
                  value={timeF}
                  onChange={(event) => setTimeF(event.target.value as "ALL" | Timing)}
                  options={[{ value: "ALL", label: "All arrivals" }, ...(["Early", "On time", "Late", "Absent"] as Timing[]).map((t) => ({ value: t, label: t }))]}
                />
              </label>
              <div className="flex flex-[1_1_320px] flex-wrap justify-start gap-2 sm:justify-end">
                {(["Early", "On time", "Late", "Absent"] as Timing[]).map((t) => (
                  <Pill key={t} tone={TIMING_TONE[t]}>
                    {t} {t === "Early" ? ds.early : t === "On time" ? ds.onTime : t === "Late" ? ds.late : ds.absent}
                  </Pill>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Timing is measured against the {start || "event"} start using the attendance timing rules in Settings.
            </p>
            {deptRows.map(({ d, attendees, open }) => {
              const p = deptPct(d);
              const lateN = (d.attendees || []).filter((a) => timingOf(a.status) === "Late").length;
              return (
                <div key={d.department_id} className="overflow-hidden rounded-xl border border-lightGray">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenDepts((prev) => ({ ...prev, [String(d.department_id)]: !open }))}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-3 bg-white px-4 py-4 text-left text-sm text-primary hover:bg-lightGray/20 sm:grid-cols-[minmax(0,1fr)_auto_auto_20px] sm:gap-4 sm:px-6"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{d.department_name}</span>
                      <span className="block text-xs text-gray-500">
                        Head: {d.head_name || "Not set"} · {lateN} late
                      </span>
                    </span>
                    <span className="hidden whitespace-nowrap text-gray-600 sm:inline">
                      {n(d.present_members)} of {n(d.total_members)}
                    </span>
                    <Pill tone={p >= 75 ? "success" : p >= 60 ? "warning" : "danger"}>{p < 60 ? `▼ ${p}%` : `${p}%`}</Pill>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--color-gray-600))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("transition-transform", open && "rotate-180")}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {open && (
                    <div className="overflow-x-auto border-t border-lightGray">
                      <div className="min-w-[620px]">
                        <div className="grid grid-cols-[minmax(180px,1.5fr)_110px_minmax(160px,1fr)_120px] gap-3 bg-inputBackground px-6 py-3 font-semibold">
                          <span>Name</span>
                          <span>Clock-in</span>
                          <span>Relative to start</span>
                          <span>Status</span>
                        </div>
                        {attendees.map((a) => {
                          const t = timingOf(a.status);
                          return (
                            <div key={a.id} className="grid min-h-12 grid-cols-[minmax(180px,1.5fr)_110px_minmax(160px,1fr)_120px] items-center gap-3 border-t border-gray-200 px-6 py-2">
                              <span>{a.name}</span>
                              <span>{fmtClock(a.arrival_time || a.arrival_at) || a.reported_time || "—"}</span>
                              <span className="text-gray-600">{a.relative_to_start && a.relative_to_start !== "-" ? a.relative_to_start : "—"}</span>
                              <span>{t ? <Pill tone={TIMING_TONE[t]}>{t}</Pill> : "—"}</span>
                            </div>
                          );
                        })}
                        {attendees.length === 0 && <p className="px-6 py-4 text-gray-500">Nobody in this department matches the arrival filter.</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {departments.length === 0 && <p className="text-gray-500">No department clock-ins were recorded for this event.</p>}
          </div>
        )}

        {!loading && tab === "review" && (
          <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
            <ApprovalTrail steps={trail}>
              {(can.can_approve || can.can_return) && (
                <div className="flex flex-wrap gap-2">
                  {can.can_return && <UiButton onClick={() => setReturnOpen(true)}>Return with note</UiButton>}
                  {can.can_approve && (
                    <UiButton
                      tone="primary"
                      disabled={busy === "approve"}
                      onClick={() => run("approve", () => api.post.approveEventReport(selector), { title: "Event report approved", message: `${eventName} on ${fmtEventDate(currentDate)} is approved and locked.` })}
                    >
                      {busy === "approve" ? "Approving…" : "Approve report"}
                    </UiButton>
                  )}
                </div>
              )}
            </ApprovalTrail>
            <CommentsCard
              sub="Visible to everyone who can open this report"
              comments={comments.map((c) => ({ id: c.id, author: c.author || "Unknown user", when: fmtDateTime(c.when), text: c.text }))}
              canPost={can.can_comment}
              posting={busy === "comment"}
              onPost={async (text) => {
                setBusy("comment");
                try {
                  await api.post.commentOnEventReport({ ...selector, text });
                  await refetch(query);
                } finally {
                  setBusy(null);
                }
              }}
            />
          </div>
        )}
      </div>

      <DialogShell
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Return for changes"
        subtitle="The report goes back to the event team. Your note appears on the report and in the comments."
        ctaLabel="Return report"
        ctaDisabled={!note.trim()}
        loading={busy === "return"}
        onConfirm={async () => {
          const ok = await run("return", () => api.post.returnEventReport({ ...selector, note: note.trim() }), {
            title: "Report returned",
            message: "The event team can see your note and resubmit.",
          });
          if (ok) {
            setReturnOpen(false);
            setNote("");
          }
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-primary">Note</span>
          <TextArea rows={4} value={note} placeholder="What needs to change?" onChange={(event) => setNote(event.target.value)} />
        </label>
      </DialogShell>
    </section>
  );
};

export default EventReportDetails;
