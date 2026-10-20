import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { confirmAction } from "../../utils/helperFunctions";
import { Pill, PageHeading, SelectInput, UiButton } from "../MembershipManagement/components/membershipUi";
import { AttentionList, type AttentionItem, EmptyNote, Kpi, KpiGrid } from "./Components/financeUi";
import {
  MONF,
  RECORD_STATUS,
  type WeekRecord,
  downloadCsv,
  fmtD,
  money,
  moneyS,
  recordTitle,
  sumPct,
  weeksIn,
} from "./utils/financeModel";
import { useApprover, useFinanceConfig, useFinanceRecords, useMemberNames, useToday } from "./utils/useFinanceData";

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#474D66" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 20h4L19 9l-4-4L4 16v4z" strokeLinejoin="round" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="1.8" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" strokeLinejoin="round" />
  </svg>
);

const FinanceManager = () => {
  const navigate = useNavigate();
  const today = useToday();
  const { canManageCurrentRoute: canManage } = useRouteAccess();
  const { records, loading, error, reload } = useFinanceRecords();
  const { config, approval, loaded: cfgLoaded } = useFinanceConfig();
  const { isApprover, approverName } = useApprover(approval);
  const { nameOf } = useMemberNames();

  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7)) - 1;
  const [year, setYear] = useState(String(nowYear));
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const canEdit = (r: WeekRecord) => canManage && (r.status === "DRAFT" || isApprover) && r.isEditable;
  const openRec = (r: WeekRecord, edit?: boolean) => navigate(`/home/finance/${r.id}${edit ? "?edit=1" : ""}`);
  const newRecord = (from?: string) => navigate(`/home/finance/create${from ? `?from=${from}` : ""}`);

  const delRec = (r: WeekRecord) =>
    confirmAction({
      title: "Delete this draft?",
      points: [`${recordTitle(r)} will be removed.`, "Nothing has been approved, so no balances change."],
      confirmLabel: "Delete draft",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteFinancial({ id: r.id });
        await reload();
        notify.success({ title: "Draft deleted", message: recordTitle(r) });
      },
    });

  const yr = Number(year);
  const list = useMemo(
    () => records.filter((r) => r.year === yr && (!status || r.status === status)),
    [records, yr, status]
  );

  const years = useMemo(() => {
    const set = new Set<number>([nowYear, ...records.map((r) => r.year)]);
    return [...set].sort((a, b) => b - a).map((y) => ({ value: String(y), label: String(y) }));
  }, [records, nowYear]);

  const recordFroms = useMemo(() => new Set(records.map((r) => r.from)), [records]);

  const months = useMemo(() => {
    const set = new Set(list.map((r) => r.month));
    if (yr === nowYear && !status) set.add(nowMonth);
    return [...set].sort((a, b) => b - a);
  }, [list, yr, nowYear, nowMonth, status]);

  const groups = months.map((m) => {
    const items = list.filter((r) => r.month === m).sort((a, b) => b.from.localeCompare(a.from));
    const key = `${yr}-${m}`;
    const isOpen = open[key] ?? (m === nowMonth || m === months[0]);
    const receipts = items.reduce((a, r) => a + r.totals.R, 0);
    const balance = items.reduce((a, r) => a + r.totals.fin, 0);
    const missing =
      status || !canManage ? [] : weeksIn(yr, m).filter((w) => w.from <= today && !recordFroms.has(w.from));
    return { m, key, items, isOpen, receipts, balance, missing };
  });

  /* ---------------------------------- KPIs --------------------------------- */

  const thisMonth = records.filter((r) => r.year === nowYear && r.month === nowMonth);
  const pending = records.filter((r) => r.status === "PENDING_APPROVAL");
  const sum = (k: "R" | "P" | "T" | "fin") => thisMonth.reduce((a, r) => a + r.totals[k], 0);

  /* -------------------------------- attention ------------------------------ */

  const attention: AttentionItem[] = [];
  if (isApprover) {
    pending.forEach((r) =>
      attention.push({
        key: `p-${r.id}`,
        pill: { label: "Approve", tone: "warning" },
        title: `${recordTitle(r)} is waiting for you`,
        text: `Submitted by ${nameOf(r.raw.submittedByUserId) || r.updatedBy}. Total balance ${money(r.totals.fin)}.`,
        actions: [{ label: "Review", onClick: () => openRec(r), primary: true }],
      })
    );
  }
  if (canManage) {
    records
      .filter((r) => r.status === "DRAFT")
      .forEach((r) => {
        const returned = Boolean(r.raw.returnNote);
        attention.push({
          key: `d-${r.id}`,
          pill: returned ? { label: "Returned", tone: "danger" } : { label: "Draft", tone: "neutral" },
          title: `${recordTitle(r)}${returned ? " was returned" : " is still a draft"}`,
          text: returned
            ? `${nameOf(r.raw.returnedByUserId) || "Finance approver"}: “${r.raw.returnNote}”`
            : `Last edited ${fmtD(r.updatedOn)} by ${r.updatedBy}.${approverName ? ` Submit it so ${approverName} can approve.` : ""}`,
          actions: [
            { label: returned ? "Fix and resubmit" : "Continue", onClick: () => openRec(r, true), primary: true },
          ],
        });
      });
    if (!isApprover) {
      [nowMonth - 1, nowMonth].forEach((mm) => {
        const y = mm < 0 ? nowYear - 1 : nowYear;
        const m = (mm + 12) % 12;
        weeksIn(y, m).forEach((w) => {
          if (w.to < today && !recordFroms.has(w.from)) {
            attention.push({
              key: `m-${w.from}`,
              pill: { label: "Missing", tone: "danger" },
              title: `No record for ${w.label} of ${MONF[m]}`,
              text: `${fmtD(w.from)} – ${fmtD(w.to)} has ended.`,
              actions: [{ label: "Create record", onClick: () => newRecord(w.from), primary: true }],
            });
          }
        });
      });
    }
    if (cfgLoaded) {
      const t = sumPct(config.tithe);
      const a = sumPct(config.alloc);
      if ((config.tithe.length && t !== 100) || (config.alloc.length && a !== 100)) {
        attention.push({
          key: "cfg",
          pill: { label: "Settings", tone: "danger" },
          title: "Percentages in configuration don’t add up",
          text: `Tithe breakdown is ${t}% and fund allocation is ${a}%. Both must be 100%.`,
          actions: [{ label: "Open configuration", onClick: () => navigate("/home/finance/configuration") }],
        });
      }
    }
  }

  const exportCsv = () => {
    downloadCsv(`finance-records-${year}.csv`, [
      ["Week", "From", "To", "Status", "Receipts", "Tithe", "Payments", "Total balance", "Created by", "Last updated"],
      ...list.map((r) => [
        `${r.week} ${MONF[r.month]}`,
        r.from,
        r.to,
        RECORD_STATUS[r.status].label,
        r.totals.R.toFixed(2),
        r.totals.T.toFixed(2),
        r.totals.P.toFixed(2),
        r.totals.fin.toFixed(2),
        r.createdBy,
        fmtD(r.updatedOn),
      ]),
    ]);
    notify.success({ title: "CSV downloaded", message: `${list.length} records.` });
  };

  return (
    <PageOutline>
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Finance Management"
          subtitle="Weekly financial records, from receipts through to fund allocation."
          actions={
            <>
              <SelectInput
                aria-label="Year"
                className="w-auto"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                options={years}
              />
              <SelectInput
                aria-label="Status"
                className="w-auto"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "", label: "All statuses" },
                  ...Object.entries(RECORD_STATUS).map(([value, s]) => ({ value, label: s.label })),
                ]}
              />
              <UiButton onClick={exportCsv} disabled={!list.length}>
                Export CSV
              </UiButton>
              {canManage && (
                <UiButton tone="primary" onClick={() => newRecord()}>
                  New weekly record
                </UiButton>
              )}
            </>
          }
        />

        <KpiGrid>
          <Kpi label={`Receipts in ${MONF[nowMonth]}`} value={moneyS(sum("R"))} sub={`${thisMonth.length} weekly records`} />
          <Kpi label={`Payments in ${MONF[nowMonth]}`} value={moneyS(sum("P"))} sub={`Tithe ${moneyS(sum("T"))}`} />
          <Kpi label={`Total balance in ${MONF[nowMonth]}`} value={moneyS(sum("fin"))} sub="After tithe, payments and reserves" />
          <Kpi
            label="Awaiting approval"
            value={pending.length}
            sub={pending.length ? (approverName ? `With ${approverName}` : "No approver set") : "Nothing waiting"}
            tone={pending.length ? "warning" : "muted"}
            alert={pending.length ? "warning" : undefined}
          />
        </KpiGrid>

        <AttentionList items={attention} />

        {error && !records.length && (
          <EmptyNote>Couldn’t load financial records. Refresh the page to try again.</EmptyNote>
        )}
        {loading && !records.length && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        )}

        {groups.map((g) => (
          <div key={g.key} className="flex flex-col gap-3">
            <button
              type="button"
              aria-expanded={g.isOpen}
              onClick={() => setOpen((p) => ({ ...p, [g.key]: !g.isOpen }))}
              className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-lightGray bg-lightGray/30 px-4 py-3 text-left text-primary"
            >
              <span className="text-lg font-semibold">
                {MONF[g.m]} {yr} <span className="font-normal text-[#4B5563]">({g.items.length})</span>
              </span>
              <span className="flex items-center gap-4 text-sm text-[#4B5563]">
                Receipts {moneyS(g.receipts)} · balance {moneyS(g.balance)}
                <span className="text-lg text-primary">{g.isOpen ? "−" : "+"}</span>
              </span>
            </button>
            {g.isOpen && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
                {g.items.map((r) => {
                  const s = RECORD_STATUS[r.status];
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4 shadow-[0_8px_24px_rgba(8,13,45,0.08)] transition-shadow hover:shadow-[0_10px_28px_rgba(8,13,45,0.2)]"
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => openRec(r)}
                          className="min-w-0 flex-1 bg-transparent p-0 text-left text-base font-semibold text-[#111827] hover:underline"
                        >
                          {recordTitle(r)}
                        </button>
                        {canEdit(r) && (
                          <button
                            type="button"
                            aria-label="Edit record"
                            onClick={() => openRec(r, true)}
                            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-lightGray bg-white hover:bg-[#F8F9FC]"
                          >
                            <EditIcon />
                          </button>
                        )}
                        {canManage && r.status === "DRAFT" && (
                          <button
                            type="button"
                            aria-label="Delete draft"
                            onClick={() => delRec(r)}
                            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-[#FECACA] bg-white hover:bg-[#FEF2F2]"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 text-sm text-[#4B5563]">
                        <div>
                          <span className="font-medium text-[#374151]">Status:</span> <Pill tone={s.tone}>{s.label}</Pill>
                        </div>
                        <div>
                          <span className="font-medium text-[#374151]">Created by:</span> {r.createdBy} on {fmtD(r.createdOn)}
                        </div>
                        <div>
                          <span className="font-medium text-[#374151]">Last updated:</span> {r.updatedBy} on {fmtD(r.updatedOn)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-[#E5E7EB] pt-3 text-sm">
                        <div>
                          <p className="text-xs text-[#6B7280]">Receipts</p>
                          <p className="font-semibold">{money(r.totals.R)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6B7280]">Total balance</p>
                          <p className={cn("font-semibold", r.totals.fin < 0 && "text-[#B91C1C]")}>{money(r.totals.fin)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {g.missing.map((w) => (
                  <button
                    key={w.from}
                    type="button"
                    onClick={() => newRecord(w.from)}
                    className="flex min-h-40 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-lightGray bg-[#FAFBFC] p-4 text-sm text-[#4B5563] transition-colors hover:border-primary hover:text-primary"
                  >
                    <span className="font-semibold">
                      {w.label} · {fmtD(w.from).replace(/, \d{4}$/, "")} – {fmtD(w.to)}
                    </span>
                    <span>{w.to < today ? "No record yet" : "This week, in progress"}</span>
                    <span className="font-semibold text-primary">+ Create record</span>
                  </button>
                ))}
                {!g.items.length && !g.missing.length && <EmptyNote>No records this month.</EmptyNote>}
              </div>
            )}
          </div>
        ))}

        {!loading && !groups.length && <EmptyNote>No financial records match.</EmptyNote>}
      </div>
    </PageOutline>
  );
};

export default FinanceManager;
