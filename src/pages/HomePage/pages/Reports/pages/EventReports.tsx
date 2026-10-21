import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import type { ApiResponse } from "@/utils/interfaces";
import type {
  EventReportEligibleEvent,
  EventReportOverviewItem,
} from "@/utils/api/eventReports/interfaces";
import { cn } from "@/utils/cn";

import {
  DialogShell,
  PageEmpty,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SelectInput,
  SkeletonGrid,
  UiButton,
} from "../components/reportsUi";
import { useIsWide } from "../utils/reportUiHelpers";
import { nf } from "../utils/reportFormat";
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL, eventStatusPill, eventTypeOf, fmtEventDate, fmtEventTime } from "../utils/eventReportFormat";

type Group = "date" | "type";
type StatusFilter = "all" | "Pending approval" | "Returned" | "Approved";

const reportRoute = (row: { event_id: string | number; event_date: string; event_name?: string }) => {
  const params = new URLSearchParams({ eventDate: row.event_date.slice(0, 10) });
  if (row.event_name) params.set("eventName", row.event_name);
  return `/home/reports/event-reports/${row.event_id}?${params.toString()}`;
};

const presentColor = (pct: number | null | undefined) =>
  pct === null || pct === undefined ? "#4B5563" : pct >= 75 ? "#15803D" : pct >= 60 ? "#B45309" : "#B91C1C";

const NO_DATA = "no attendance data yet";

const EventReports = () => {
  const navigate = useNavigate();
  const wide = useIsWide();
  const { canManage } = useAccessControl();
  const canGenerate = canManage("Events");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [group, setGroup] = useState<Group>("date");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const query = useMemo(() => ({ date_scope: "all" }), []);
  const { data, loading, error, refetch } = useFetch<ApiResponse<EventReportOverviewItem[]>>(
    api.fetch.fetchEventReportsOverview,
    query,
    false,
    { silent: true }
  );
  const all = useMemo(
    () => (Array.isArray(data?.data) ? data!.data : []).filter((r) => r.report_status !== "not_generated"),
    [data]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((r) => status === "all" || (r.status_label || "Pending approval") === status)
      .filter((r) => {
        if (!q) return true;
        const type = EVENT_TYPE_LABEL[eventTypeOf(r.event_type)];
        return [r.event_name, type, r.location, fmtEventDate(r.event_date)].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => String(b.event_date).localeCompare(String(a.event_date)));
  }, [all, search, status]);

  const groups = useMemo(() => {
    const out: { label: string; rows: EventReportOverviewItem[] }[] = [];
    rows.forEach((r) => {
      const label =
        group === "date"
          ? new Date(`${r.event_date.slice(0, 10)}T00:00:00`).toLocaleString("en-GB", { month: "long", year: "numeric" })
          : EVENT_TYPE_LABEL[eventTypeOf(r.event_type)];
      let g = out.find((x) => x.label === label);
      if (!g) out.push((g = { label, rows: [] }));
      g.rows.push(r);
    });
    return out;
  }, [rows, group]);

  /* ------------------------------ generate flow ----------------------------- */
  const [genOpen, setGenOpen] = useState(false);
  const [pick, setPick] = useState("");
  const [genMsg, setGenMsg] = useState<{ tone: "info" | "danger"; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const eligible = useFetch<ApiResponse<EventReportEligibleEvent[]>>(api.fetch.fetchEligibleEventReports, {}, true, { silent: true });
  const eligibleRows = useMemo(
    () =>
      (Array.isArray(eligible.data?.data) ? eligible.data!.data : [])
        .slice()
        .sort((a, b) => String(b.event_date).localeCompare(String(a.event_date)) || a.event_name.localeCompare(b.event_name)),
    [eligible.data]
  );

  const openGenerate = () => {
    setGenOpen(true);
    setPick("");
    setGenMsg(null);
    eligible.refetch();
  };

  const generate = async () => {
    const chosen = eligibleRows.find((e) => `${e.event_id}::${e.event_date}` === pick);
    if (!chosen) {
      setGenMsg({ tone: "danger", text: "Select an event to continue." });
      return;
    }
    setGenerating(true);
    setGenMsg(null);
    try {
      const res = await api.post.generateEventReport({ event_id: chosen.event_id, event_date: chosen.event_date.slice(0, 10) });
      const message = String(res.message || res.data?.message || "");
      if (message.toLowerCase().includes(NO_DATA)) {
        setGenMsg({ tone: "info", text: message });
        return;
      }
      notify.success({ title: "Report generated", message: `${chosen.event_name} is ready for review.` });
      setGenOpen(false);
      navigate(reportRoute({ ...chosen, event_date: chosen.event_date.slice(0, 10) }));
    } catch (err) {
      const e = err as { message?: string; response?: { data?: { message?: string; error?: string } } };
      const message = e?.response?.data?.message || e?.response?.data?.error || e?.message || "";
      setGenMsg(
        message.toLowerCase().includes(NO_DATA)
          ? {
              tone: "info",
              text: `No attendance data yet for ${chosen.event_name}. Ask the departments to submit clock-ins or record a headcount first.`,
            }
          : { tone: "danger", text: message ? `Couldn't generate the report. ${message}` : "Couldn't generate the report. Try again." }
      );
    } finally {
      setGenerating(false);
    }
  };

  const isOpen = (label: string, index: number) => (openGroups[label] === undefined ? index === 0 : openGroups[label]);
  const grid = "minmax(240px,1.8fr) 140px 130px 110px 150px 150px 24px";

  return (
    <section className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeading
        title={`Event reports${data ? ` (${all.length})` : ""}`}
        subtitle="One report per service or event, built from clock-ins and headcounts."
        actions={
          canGenerate ? (
            <UiButton tone="primary" onClick={openGenerate}>
              Generate report
            </UiButton>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          className="max-w-[420px]"
          value={search}
          onChange={setSearch}
          placeholder="Search event, type or location"
          ariaLabel="Search event reports"
        />
        <SelectInput
          aria-label="Status"
          className="w-auto"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "Pending approval", label: "Pending approval" },
            { value: "Returned", label: "Returned" },
            { value: "Approved", label: "Approved" },
          ]}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#4B5563]">Group by</span>
          <PillTabs
            ariaLabel="Group by"
            size="sm"
            value={group}
            onChange={setGroup}
            tabs={[
              { key: "date", label: "Date" },
              { key: "type", label: "Type" },
            ]}
          />
        </div>
      </div>

      {loading && !data && <SkeletonGrid count={3} min={600} height={72} />}

      {error && !data && !loading && (
        <PageEmpty
          badge="COULDN'T LOAD"
          title="Couldn't load event reports"
          text="Check your connection and try again."
          action={<UiButton onClick={() => refetch(query)}>Try again</UiButton>}
        />
      )}

      {groups.map((g, index) => {
        const open = isOpen(g.label, index);
        return (
          <div key={g.label} className="overflow-hidden rounded-xl border border-lightGray bg-white">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenGroups((prev) => ({ ...prev, [g.label]: !open }))}
              className="flex w-full items-center justify-between gap-3 bg-white px-4 py-4 text-sm text-primary hover:bg-lightGray/20 sm:px-6"
            >
              <span className="flex items-center gap-2">
                <span className="text-base font-semibold">{g.label}</span>
                <Pill tone="neutral" className="px-2 py-0">{g.rows.length}</Pill>
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("transition-transform", open && "rotate-180")}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {open &&
              (wide ? (
                <div className="overflow-x-auto border-t border-lightGray">
                  <div className="min-w-[920px]">
                    <div className="grid gap-3 bg-lightGray px-6 py-4 font-semibold" style={{ gridTemplateColumns: grid }}>
                      <span>Event</span>
                      <span>Date</span>
                      <span>Time</span>
                      <span className="text-right">Attendance</span>
                      <span className="text-right">Workers present</span>
                      <span>Status</span>
                      <span />
                    </div>
                    {g.rows.map((r) => {
                      const type = eventTypeOf(r.event_type);
                      const pill = eventStatusPill(r.status_label);
                      return (
                        <div
                          key={`${r.event_id}-${r.event_date}`}
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(reportRoute(r))}
                          onKeyDown={(event) => event.key === "Enter" && navigate(reportRoute(r))}
                          className="grid min-h-16 cursor-pointer items-center gap-3 border-t border-lightGray bg-white px-6 py-3 hover:bg-lightGray/20"
                          style={{ gridTemplateColumns: grid }}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span title={EVENT_TYPE_LABEL[type]} className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: EVENT_TYPE_COLOR[type] }} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{r.event_name}</p>
                              <p className="truncate text-xs text-[#6B7280]">
                                {EVENT_TYPE_LABEL[type]}
                                {r.location ? ` · ${r.location}` : ""}
                              </p>
                            </div>
                          </div>
                          <span>{fmtEventDate(r.event_date)}</span>
                          <span className="text-[#4B5563]">{fmtEventTime(r.start_time, r.end_time) || "—"}</span>
                          <span className="text-right font-semibold">{r.total_attendance == null ? "—" : nf(r.total_attendance)}</span>
                          <span className="text-right font-semibold" style={{ color: presentColor(r.workers_present_pct) }}>
                            {r.workers_present_pct == null ? "—" : `${Math.round(r.workers_present_pct)}%`}
                          </span>
                          <span>
                            <Pill tone={pill.tone}>{pill.label}</Pill>
                          </span>
                          <span aria-hidden="true" className="text-[#6B7280]">›</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col border-t border-lightGray">
                  {g.rows.map((r) => {
                    const pill = eventStatusPill(r.status_label);
                    return (
                      <button
                        key={`${r.event_id}-${r.event_date}`}
                        type="button"
                        onClick={() => navigate(reportRoute(r))}
                        className="flex flex-col gap-1.5 border-b border-[#E5E7EB] bg-white p-4 text-left text-sm text-primary last:border-b-0"
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <p className="font-semibold">{r.event_name}</p>
                          <Pill tone={pill.tone} className="flex-shrink-0 px-2 py-0">{pill.label}</Pill>
                        </div>
                        <p className="text-[#4B5563]">
                          {fmtEventDate(r.event_date)}
                          {fmtEventTime(r.start_time, r.end_time) ? ` · ${fmtEventTime(r.start_time, r.end_time)}` : ""}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {r.total_attendance == null ? "—" : nf(r.total_attendance)} attended ·{" "}
                          {r.workers_present_pct == null ? "—" : `${Math.round(r.workers_present_pct)}%`} workers present
                        </p>
                      </button>
                    );
                  })}
                </div>
              ))}
          </div>
        );
      })}

      {data && groups.length === 0 && (
        <PageEmpty
          badge="NO REPORTS FOUND"
          title={all.length ? "No event reports match" : "No event reports yet"}
          text={
            all.length
              ? "Clear the search or status filter, or generate a report for a recent event."
              : "Generate a report once an event has finished and its attendance is recorded."
          }
          action={!all.length && canGenerate ? <UiButton tone="primary" onClick={openGenerate}>Generate report</UiButton> : undefined}
        />
      )}

      <DialogShell
        open={genOpen}
        onClose={() => setGenOpen(false)}
        wide
        title="Generate event report"
        subtitle="Only events that have finished and have no report yet are listed."
        ctaLabel="Generate report"
        ctaDisabled={!pick}
        loading={generating}
        onConfirm={generate}
      >
        <div role="radiogroup" aria-label="Event" className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {eligible.loading && <p className="text-[#6B7280]">Loading events…</p>}
          {!eligible.loading && eligibleRows.length === 0 && (
            <p className="rounded-lg border border-[#E5E7EB] bg-[#F8F9FC] px-4 py-3 text-[#4B5563]">
              Every finished event already has a report, or none has attendance recorded yet.
            </p>
          )}
          {eligibleRows.map((e) => {
            const value = `${e.event_id}::${e.event_date}`;
            const on = pick === value;
            const type = eventTypeOf(e.event_type);
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setPick(value);
                  setGenMsg(null);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-primary",
                  on ? "border-primary bg-[#F8F9FC]" : "border-lightGray bg-white"
                )}
              >
                <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 border-primary">
                  <span className={cn("h-2 w-2 rounded-full", on ? "bg-primary" : "bg-transparent")} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{e.event_name}</span>
                  <span className="block text-xs text-[#6B7280]">
                    {fmtEventDate(e.event_date)}
                    {e.event_type ? ` · ${EVENT_TYPE_LABEL[type]}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {genMsg && (
          <p
            role="status"
            className={cn(
              "rounded-lg border px-4 py-3",
              genMsg.tone === "info" ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]" : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
            )}
          >
            {genMsg.text}
          </p>
        )}
      </DialogShell>
    </section>
  );
};

export default EventReports;
