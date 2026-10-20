import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { BranchSelectField } from "@/components/BranchSelectField";
import { notify } from "@/components/feedback";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils/api/apiCalls";
import type { FinanceData, FinanceSaveAction, FinancialRecord } from "@/utils/api/finance/interface";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { confirmAction } from "../../utils/helperFunctions";
import { CommDialog } from "../ChurchCommunication/ui/commUi";
import { errorText, useViewportWidth } from "../ChurchCommunication/ui/commUtils";
import {
  ActionMenu,
  Field,
  Pill,
  SelectInput,
  TextArea,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import { BackLink, EmptyNote, StepHeading, ToneNote } from "./Components/financeUi";
import {
  AUTO_TAG,
  type AutoKind,
  BALANCE_LABELS,
  MONF,
  RECORD_STATUS,
  amt,
  autoKind,
  blankRecord,
  calc,
  dayOf,
  downloadCsv,
  fmtD,
  money,
  num,
  rangeTxt,
  toWeekRecord,
  weekOf,
  weeksIn,
  withComputedTotals,
} from "./utils/financeModel";
import type { FinanceExportFormat } from "./utils/exportFinanceDetails";
import {
  useApprover,
  useFinanceConfig,
  useFinanceRecords,
  useIsAllBranches,
  useMemberNames,
  useToday,
  useWriteBranchId,
} from "./utils/useFinanceData";

type LineKey = "receipts" | "payments";
type BalKey = "ReserveForSavings" | "WeeklyRefund" | "OfficeMaintenanceReserve";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const unwrap = (d: unknown): FinancialRecord | null => {
  const rec = Array.isArray(d) ? d[0] : d;
  if (!rec || typeof rec !== "object") return null;
  const r = rec as FinancialRecord;
  return r.payload ? r : null;
};

/** One ledger row: label, amount (text or input) and a running column. */
const LedgerRow = ({
  label,
  tag,
  bold,
  value,
  input,
  onInput,
  run,
  runDanger,
  onRemove,
  hint,
  cols,
}: {
  label: string;
  tag?: string;
  bold?: boolean;
  value: string;
  input?: string | number | null;
  onInput?: (v: string) => void;
  run?: string;
  runDanger?: boolean;
  onRemove?: () => void;
  hint?: React.ReactNode;
  cols: string;
}) => (
  <div
    className={cn("grid min-h-12 items-center gap-3 border-b border-[#E5E7EB] px-3 py-1.5 text-sm", bold ? "bg-[#F8F9FC]" : "bg-white")}
    style={{ gridTemplateColumns: cols }}
  >
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("min-w-0", bold ? "font-semibold" : "font-normal")}>{label}</span>
        {tag && <Pill tone="info" className="px-2 py-0">{tag}</Pill>}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="ml-auto h-7 w-7 flex-shrink-0 rounded-lg text-base text-[#B91C1C] hover:bg-[#FEF2F2]"
          >
            ×
          </button>
        )}
      </div>
      {hint}
    </div>
    {onInput ? (
      <input
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        value={input ?? ""}
        placeholder="0.00"
        aria-label={label}
        onWheel={(e) => e.currentTarget.blur()}
        onChange={(e) => onInput(e.target.value)}
        className="h-10 w-full rounded-lg border border-[rgba(107,114,128,0.35)] bg-white px-3 text-right text-sm text-primary outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(8,13,45,0.08)]"
      />
    ) : (
      <span className={cn("text-right tabular-nums", bold && "font-semibold")}>{value}</span>
    )}
    <span className={cn("text-right font-semibold tabular-nums", runDanger ? "text-[#B91C1C]" : "text-primary")}>{run ?? ""}</span>
  </div>
);

const FinanceRecord = () => {
  const { id } = useParams();
  const isNew = !id || id === "create";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const width = useViewportWidth();
  const phone = width < 640;
  const wideRail = width >= 1100;
  const today = useToday();
  const { canManageCurrentRoute: canManage } = useRouteAccess();
  const allBranches = useIsAllBranches();
  const writeBranchId = useWriteBranchId();

  const { config, approval, loaded: cfgLoaded, failed: cfgFailed } = useFinanceConfig();
  const { isApprover, approverName, me, notifyNames } = useApprover(approval);
  const { nameOf } = useMemberNames();
  const { records, reload: reloadList } = useFinanceRecords();

  const query = useMemo(() => (isNew ? undefined : { id: String(id) }), [id, isNew]);
  const recRes = useFetch(api.fetch.fetchFinancial, query, isNew);
  const raw = useMemo(() => unwrap(recRes.data?.data), [recRes.data]);
  const rec = useMemo(() => (raw ? toWeekRecord(raw) : null), [raw]);

  const [editing, setEditing] = useState(isNew);
  const [ed, setEd] = useState<FinanceData | null>(null);
  const [branchId, setBranchId] = useState<number | "">("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addSel, setAddSel] = useState<Record<LineKey, string>>({ receipts: "", payments: "" });
  const [auto, setAuto] = useState<Partial<Record<AutoKind, number>> | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [returnTried, setReturnTried] = useState(false);
  const started = useRef(false);

  const canEditRec = (r: typeof rec) =>
    canManage && !!r && r.isEditable && (r.status === "DRAFT" || isApprover);

  /* ------------------------------- start edit ------------------------------ */

  const fetchAuto = async (from: string, to: string, branch?: number | null) => {
    try {
      const res = await api.fetch.fetchFinanceAutoAmounts({ from, to, ...(branch ? { branch_id: branch } : {}) });
      const d = res?.data;
      const next = d ? { pledges: num(d.pledges_redeemed), giving: num(d.online_giving) } : null;
      setAuto(next);
      return next;
    } catch {
      setAuto(null);
      return null;
    }
  };

  // New record: lay it out from configuration once that has loaded.
  useEffect(() => {
    if (!isNew || !cfgLoaded || started.current) return;
    started.current = true;
    const wk = weekOf(params.get("from") || today);
    const base = blankRecord(config, wk.year, wk.month, wk.week);
    setEd(base);
    void fetchAuto(wk.week.from, wk.week.to).then((a) => {
      if (!a) return;
      setEd((prev) => (prev ? applyAuto(prev, a) : prev));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, cfgLoaded]);

  // Existing record opened with ?edit=1.
  useEffect(() => {
    if (isNew || !rec || started.current) return;
    if (params.get("edit") === "1" && canEditRec(rec)) {
      started.current = true;
      startEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec, isNew]);

  // In "All branches" the totals follow the branch the record is saved to.
  useEffect(() => {
    if (!isNew || !allBranches || !branchId || !ed) return;
    const f = dayOf(ed.metaData?.from);
    const t2 = dayOf(ed.metaData?.to);
    void fetchAuto(f, t2, Number(branchId)).then((a) => {
      if (a) setEd((prev) => (prev ? applyAuto(prev, a) : prev));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const startEdit = () => {
    if (!rec) return;
    setEd(clone(rec.data));
    setBranchId(rec.raw.branch_id ?? "");
    setTried(false);
    setEditing(true);
    void fetchAuto(rec.from, rec.to, rec.raw.branch_id);
  };

  const applyAuto = (data: FinanceData, a: Partial<Record<AutoKind, number>>): FinanceData => ({
    ...data,
    receipts: data.receipts.map((x) => {
      const k = autoKind(x.item);
      return k && a[k] !== undefined ? { ...x, amount: a[k]! } : x;
    }),
  });

  /* --------------------------------- derived ------------------------------- */

  const data = editing ? ed : rec?.data ?? null;
  const t = useMemo(() => (data ? calc(data) : null), [data]);
  const meta = data?.metaData;
  const from = dayOf(meta?.from);
  const to = dayOf(meta?.to);
  const status = isNew ? null : rec?.status ?? "DRAFT";

  const recErrs = (e: FinanceData): string[] => {
    const out: string[] = [];
    const f = dayOf(e.metaData?.from);
    if (!f) out.push("Choose the month and week.");
    // Weeks are unique per branch; with "All branches" the list mixes branches.
    const targetBranch = isNew ? (allBranches ? Number(branchId) || null : writeBranchId ?? null) : rec?.raw.branch_id ?? null;
    const dup = records.find(
      (r) => r.from === f && r.id !== rec?.id && (!allBranches || (r.raw.branch_id ?? null) === targetBranch)
    );
    if (f && dup) out.push(`There is already a record for ${e.metaData?.week} of ${e.metaData?.month}. Open that one instead.`);
    if (!e.receipts.some((x) => num(x.amount) > 0)) out.push("Enter at least one receipt amount.");
    const bal = e.balance;
    if (
      [...e.receipts, ...e.payments].some((x) => num(x.amount) < 0) ||
      [bal.ReserveForSavings, bal.WeeklyRefund, bal.OfficeMaintenanceReserve].some((x) => num(x.amount) < 0)
    )
      out.push("Amounts can’t be negative.");
    if (isNew && allBranches && !branchId) out.push("Choose the branch this record belongs to.");
    return out;
  };
  const errs = editing && tried && ed ? recErrs(ed) : [];

  /* --------------------------------- actions ------------------------------- */

  const save = async (action: FinanceSaveAction) => {
    if (!ed) return;
    if (recErrs(ed).length) {
      setTried(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (action === "SAVE_AND_APPROVE" && !approval?.finance_approver_user_id) {
      notify.error({
        title: "Couldn’t submit",
        message: "No finance approver is set. Choose one in Finance configuration, then submit again.",
      });
      return;
    }
    const now = new Date().toISOString();
    const payload: FinanceData = withComputedTotals({
      ...ed,
      metaData: {
        ...(ed.metaData as NonNullable<FinanceData["metaData"]>),
        periodDate: dayOf(ed.metaData?.from),
        createdBy: isNew ? me || null : ed.metaData?.createdBy ?? null,
        createdDate: isNew ? now : ed.metaData?.createdDate ?? null,
        updatedBy: me || null,
        updatedDate: now,
      },
    });
    const branch = isNew ? (allBranches ? Number(branchId) || undefined : writeBranchId) : rec?.raw.branch_id ?? undefined;
    setBusy(true);
    try {
      const body = { ...payload, ...(branch ? { branch_id: branch } : {}), action };
      const res = isNew
        ? await api.post.createFinancial(body)
        : await api.put.updateFinancial(body, { id: String(id) });
      const next = res.data;
      const nextStatus = next?.status ?? "DRAFT";
      const title = `${payload.metaData?.week} · ${rangeTxt(dayOf(payload.metaData?.from), dayOf(payload.metaData?.to))}`;
      notify.success(
        nextStatus === "APPROVED"
          ? { title: "Record approved", message: "Locked. Only the finance approver can edit it now." }
          : nextStatus === "PENDING_APPROVAL"
            ? { title: "Submitted for approval", message: `${approverName || "The finance approver"} has been notified.` }
            : { title: "Draft saved", message: title }
      );
      setEditing(false);
      setEd(null);
      setTried(false);
      void reloadList();
      if (isNew && next?.id) navigate(`/home/finance/${next.id}`, { replace: true });
      else await recRes.refetch();
    } catch (error) {
      notify.error({ title: "Couldn’t save the record", message: errorText(error, "Check the figures and try again.") });
    } finally {
      setBusy(false);
    }
  };

  const approve = () => {
    if (!rec || !t) return;
    confirmAction({
      title: `Approve ${rec.week} · ${rangeTxt(rec.from, rec.to)}?`,
      points: [
        `Total balance ${money(t.fin)} is shared across fund accounts as shown.`,
        "The record locks. Only you can edit it afterwards.",
        `${[rec.createdBy, ...notifyNames].filter(Boolean).join(", ")} ${notifyNames.length ? "are" : "is"} notified.`,
      ],
      confirmLabel: "Approve record",
      onConfirm: async () => {
        await api.post.approveFinancial(rec.id);
        await recRes.refetch();
        void reloadList();
        notify.success({ title: "Record approved", message: `${rec.week} of ${MONF[rec.month]}` });
      },
    });
  };

  const submitReturn = async () => {
    if (!rec) return;
    if (!returnNote.trim()) {
      setReturnTried(true);
      return;
    }
    setBusy(true);
    try {
      await api.post.returnFinancial(rec.id, returnNote.trim());
      setReturnOpen(false);
      setReturnNote("");
      setReturnTried(false);
      await recRes.refetch();
      void reloadList();
      notify.success({ title: `Returned to ${rec.createdBy}`, message: "They’ve been notified with your note." });
    } catch (error) {
      notify.error({ title: "Couldn’t return the record", message: errorText(error, "Try again.") });
    } finally {
      setBusy(false);
    }
  };

  const del = () => {
    if (!rec) return;
    confirmAction({
      title: "Delete this draft?",
      points: [`${rec.week} · ${rangeTxt(rec.from, rec.to)} will be removed.`, "Nothing has been approved, so no balances change."],
      confirmLabel: "Delete draft",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteFinancial({ id: rec.id });
        void reloadList();
        notify.success({ title: "Draft deleted", message: `${rec.week} · ${rangeTxt(rec.from, rec.to)}` });
        navigate("/home/finance");
      },
    });
  };

  const exportCsv = () => {
    if (!rec || !t) return;
    const d = rec.data;
    downloadCsv(`finance-${rec.from}.csv`, [
      ["Section", "Item", "Amount (GHS)"],
      ...d.receipts.map((x) => ["Receipts", x.item, num(x.amount).toFixed(2)]),
      ["Receipts", "Total receipts", t.R.toFixed(2)],
      ["Tithe", `Tithe (${num(d.tithe.totalTithe.percentage)}%)`, t.T.toFixed(2)],
      ...t.tb.map((b) => ["Tithe", `${b.item} (${b.percentage}%)`, b.amount.toFixed(2)]),
      ["Tithe", "Funds after tithe", t.F.toFixed(2)],
      ...d.payments.map((x) => ["Payments", x.item, num(x.amount).toFixed(2)]),
      ["Payments", "Total payments", t.P.toFixed(2)],
      ["Balance", BALANCE_LABELS.excess, t.E.toFixed(2)],
      ["Balance", BALANCE_LABELS.reserve, t.reserve.toFixed(2)],
      ["Balance", BALANCE_LABELS.balance, t.net.toFixed(2)],
      ["Balance", BALANCE_LABELS.refund, t.refund.toFixed(2)],
      ["Balance", BALANCE_LABELS.office, t.office.toFixed(2)],
      ["Balance", "Total balance", t.fin.toFixed(2)],
      ...t.al.map((a) => ["Fund allocation", `${a.movement} (${a.portion}%)`, `${a.actual.toFixed(2)} / adjusted ${a.adjusted.toFixed(2)}`]),
    ]);
    notify.success({ title: "CSV downloaded" });
  };

  const download = async (format: FinanceExportFormat) => {
    if (!rec) return;
    try {
      // docx, exceljs and jspdf are heavy; load them only when someone downloads.
      const { downloadFinanceDetails } = await import("./utils/exportFinanceDetails");
      await downloadFinanceDetails({ ...rec.data, id: rec.id }, format);
    } catch (error) {
      notify.error({ title: "Couldn’t download the record", message: errorText(error, "Try again.") });
    }
  };

  /* --------------------------------- editing ------------------------------- */

  const setLine = (key: LineKey, i: number, v: string) =>
    setEd((p) => (p ? { ...p, [key]: p[key].map((x, j) => (j === i ? { ...x, amount: v } : x)) } : p));
  const removeLine = (key: LineKey, i: number) =>
    setEd((p) => (p ? { ...p, [key]: p[key].filter((_, j) => j !== i) } : p));
  const addLine = (key: LineKey) => {
    const name = addSel[key];
    if (!name) return;
    const c = config[key].find((x) => x.name === name);
    const k = autoKind(name);
    setEd((p) =>
      p
        ? { ...p, [key]: [...p[key], { item: name, configId: c?.id, amount: k && auto?.[k] !== undefined ? auto[k]! : null }] }
        : p
    );
    setAddSel((s) => ({ ...s, [key]: "" }));
  };
  const setBal = (k: BalKey, v: string) =>
    setEd((p) => (p ? { ...p, balance: { ...p.balance, [k]: { ...p.balance[k], amount: v } } } : p));

  const setPeriod = async (year: number, month: number, weekLabel?: string) => {
    const weeks = weeksIn(year, month);
    const w = weeks.find((x) => x.label === weekLabel) ?? weeks[0];
    setEd((p) =>
      p
        ? {
            ...p,
            metaData: {
              ...(p.metaData as NonNullable<FinanceData["metaData"]>),
              periodDate: w.from,
              month: MONF[month],
              year,
              week: w.label,
              from: w.from,
              to: w.to,
            },
          }
        : p
    );
    const a = await fetchAuto(w.from, w.to, isNew ? Number(branchId) || writeBranchId : rec?.raw.branch_id);
    if (a) setEd((p) => (p ? applyAuto(p, a) : p));
  };

  /* ---------------------------------- render ------------------------------- */

  if (!isNew && recRes.loading && !rec) {
    return (
      <PageOutline>
        <div className="flex flex-col gap-4">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-white" />
          <div className="h-64 animate-pulse rounded-xl bg-white" />
        </div>
      </PageOutline>
    );
  }
  if (!isNew && !rec) {
    return (
      <PageOutline>
        <div className="flex flex-col gap-5">
          <BackLink label="Finance Management" onClick={() => navigate("/home/finance")} />
          <EmptyNote>{recRes.error ? "Couldn’t load this record. Refresh to try again." : "Record not found."}</EmptyNote>
        </div>
      </PageOutline>
    );
  }
  if (!data || !t) {
    return (
      <PageOutline>
        <div className="flex flex-col gap-5">
          <BackLink label="Finance Management" onClick={() => navigate("/home/finance")} />
          <EmptyNote>{cfgFailed ? "Couldn’t load finance configuration. Refresh to try again." : "Loading finance configuration…"}</EmptyNote>
        </div>
      </PageOutline>
    );
  }

  const amtW = phone ? "104px" : "150px";
  const cols = `minmax(0,1fr) ${amtW} ${amtW}`;
  const titleTxt = from ? `${meta?.week} · ${rangeTxt(from, to)}` : "New weekly record";
  const pill = isNew ? { label: "New", tone: "info" as const } : RECORD_STATUS[status ?? "DRAFT"];
  const rawRec = rec?.raw;

  const banner = (() => {
    if (!rec) return null;
    if (!editing && rec.status === "PENDING_APPROVAL")
      return {
        tone: "warning" as const,
        text: isApprover
          ? `Submitted by ${nameOf(rawRec?.submittedByUserId) || rec.updatedBy}. Check the figures, then approve or return it with a note.`
          : `Waiting for ${approverName || "the finance approver"} to approve. You can’t edit it until it’s approved or returned.`,
      };
    if (rec.status === "DRAFT" && rawRec?.returnNote)
      return {
        tone: "danger" as const,
        text: `Returned by ${nameOf(rawRec.returnedByUserId) || "the finance approver"} on ${fmtD(rawRec.returnedAt)}: “${rawRec.returnNote}”`,
      };
    if (!editing && rec.status === "APPROVED")
      return {
        tone: "success" as const,
        text: `Approved. ${isApprover ? "You can still edit it as the finance approver." : `Locked. Only ${approverName || "the finance approver"} can make changes.`}`,
      };
    return null;
  })();

  const log = (() => {
    if (!rec || !rawRec) return [{ t: "Not saved yet", when: today, c: "#374151" }];
    const out: { t: string; when: string; c: string }[] = [
      { t: `Created by ${rec.createdBy}`, when: rec.createdOn, c: "#374151" },
    ];
    if (rawRec.submittedAt)
      out.push({ t: `Submitted for approval by ${nameOf(rawRec.submittedByUserId) || rec.updatedBy}`, when: rawRec.submittedAt, c: "#1D4ED8" });
    if (rawRec.returnedAt)
      out.push({ t: `Returned by ${nameOf(rawRec.returnedByUserId)}: “${rawRec.returnNote ?? ""}”`, when: rawRec.returnedAt, c: "#B91C1C" });
    if (rawRec.approvedAt)
      out.push({ t: `Approved by ${nameOf(rawRec.approvedByUserId) || approverName}`, when: rawRec.approvedAt, c: "#15803D" });
    return out.sort((a, b) => String(b.when).localeCompare(String(a.when)));
  })();

  const monthOpts = (() => {
    const base = new Date();
    const list: { value: string; label: string }[] = [];
    for (let i = 0; i < 13; i += 1) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      list.push({ value: `${d.getFullYear()}-${d.getMonth()}`, label: `${MONF[d.getMonth()]} ${d.getFullYear()}` });
    }
    const cur = `${num(meta?.year)}-${MONF.indexOf(String(meta?.month))}`;
    if (meta && !list.some((o) => o.value === cur)) list.push({ value: cur, label: `${meta.month} ${meta.year}` });
    return list;
  })();
  const curYear = num(meta?.year) || new Date().getFullYear();
  const curMonth = Math.max(0, MONF.indexOf(String(meta?.month)));

  const autoHint = (item: string, amount: unknown) => {
    const k = autoKind(item);
    if (!editing || !k || !auto || auto[k] === undefined || Math.abs(num(amount) - auto[k]!) < 0.005) return undefined;
    return (
      <button
        type="button"
        onClick={() =>
          setEd((p) => (p ? { ...p, receipts: p.receipts.map((x) => (x.item === item ? { ...x, amount: auto[k]! } : x)) } : p))
        }
        className="self-start bg-transparent p-0 text-xs text-[#1D4ED8] underline"
      >
        {k === "pledges" ? "Pledges" : "Giving"} now shows {money(auto[k]!)} for this week. Use it
      </button>
    );
  };

  const addBlock = (key: LineKey, label: string) => {
    if (!editing) return null;
    const avail = config[key].filter((c) => !data[key].some((x) => x.item === c.name));
    if (!avail.length) return null;
    return (
      <div className="flex flex-wrap gap-2 pt-3">
        <SelectInput
          aria-label={label}
          className="flex-[1_1_220px]"
          value={addSel[key]}
          onChange={(e) => setAddSel((s) => ({ ...s, [key]: e.target.value }))}
          options={[{ value: "", label: "Choose a line to add" }, ...avail.map((c) => ({ value: c.name, label: c.name }))]}
        />
        <UiButton onClick={() => addLine(key)} disabled={!addSel[key]} className="border-dashed">
          {label}
        </UiButton>
      </div>
    );
  };

  const header = (head: string) => (
    <div
      className="grid gap-3 rounded-t-lg bg-lightGray px-3 py-2 text-xs font-semibold text-primary"
      style={{ gridTemplateColumns: cols }}
    >
      <span>ITEM</span>
      <span className="text-right">AMOUNT (GHS)</span>
      <span className="text-right">{head}</span>
    </div>
  );

  const section = "flex flex-col gap-1 rounded-xl border border-lightGray bg-white p-5";
  const rate = num(data.tithe.totalTithe.percentage);
  const fl = phone ? "flex-auto" : "";

  const topButtons = !editing && rec && (
    <div className="flex flex-wrap gap-2">
      <UiButton onClick={exportCsv}>Export CSV</UiButton>
      <ActionMenu
        ariaLabel="More downloads"
        items={[
          { label: "Download PDF", onClick: () => void download("pdf") },
          { label: "Download Word", onClick: () => void download("docx") },
          { label: "Download spreadsheet", onClick: () => void download("xlsx") },
        ]}
      />
      {canManage && rec.status === "DRAFT" && (
        <UiButton tone="danger" onClick={del}>
          Delete
        </UiButton>
      )}
      {canEditRec(rec) && (
        <UiButton tone={rec.status === "DRAFT" ? "primary" : "secondary"} onClick={startEdit}>
          Edit
        </UiButton>
      )}
      {isApprover && rec.status === "PENDING_APPROVAL" && (
        <>
          <UiButton tone="danger" onClick={() => setReturnOpen(true)}>
            Return with a note
          </UiButton>
          <UiButton tone="primary" onClick={approve}>
            Approve
          </UiButton>
        </>
      )}
    </div>
  );

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        <BackLink label="Finance Management" onClick={() => navigate("/home/finance")} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold leading-8 text-primary sm:text-2xl">{titleTxt}</h1>
              <Pill tone={pill.tone}>{pill.label}</Pill>
            </div>
            <p className="text-sm text-[#4B5563]">
              {rec
                ? `Created by ${rec.createdBy} on ${fmtD(rec.createdOn)} · last updated by ${rec.updatedBy} on ${fmtD(rec.updatedOn)}`
                : "Lines come from Finance configuration. Pledges and online giving fill in automatically for the week."}
            </p>
          </div>
          {topButtons}
        </div>

        {banner && <ToneNote tone={banner.tone}>{banner.text}</ToneNote>}
        {errs.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm">
            <p className="font-semibold text-primary">Fix these before saving</p>
            {errs.map((e) => (
              <p key={e} className="text-[#B91C1C]">
                · {e}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4">
            {/* 1. Period */}
            <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5">
              <StepHeading n={1} title="Period" />
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-4">
                {editing ? (
                  <>
                    <Field label="Month">
                      <SelectInput
                        value={`${curYear}-${curMonth}`}
                        onChange={(e) => {
                          const [y, m] = e.target.value.split("-").map(Number);
                          void setPeriod(y, m);
                        }}
                        options={monthOpts}
                      />
                    </Field>
                    <Field label="Week">
                      <SelectInput
                        value={String(meta?.week ?? "")}
                        onChange={(e) => void setPeriod(curYear, curMonth, e.target.value)}
                        options={weeksIn(curYear, curMonth).map((w) => ({
                          value: w.label,
                          label: `${w.label} (${rangeTxt(w.from, w.to).replace(/, \d{4}$/, "")})`,
                        }))}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Month">
                      <p className="flex min-h-10 items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm">
                        {meta?.month} {meta?.year}
                      </p>
                    </Field>
                    <Field label="Week">
                      <p className="flex min-h-10 items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm">{meta?.week}</p>
                    </Field>
                  </>
                )}
                <Field label="From">
                  <p className="flex min-h-10 items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm">{fmtD(from)}</p>
                </Field>
                <Field label="To">
                  <p className="flex min-h-10 items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm">{fmtD(to)}</p>
                </Field>
              </div>
              {editing && isNew && (
                <BranchSelectField
                  value={branchId}
                  onChange={setBranchId}
                  required
                  error={tried && allBranches && !branchId ? "Choose the branch this record belongs to." : undefined}
                />
              )}
            </section>

            {/* 2. Receipts */}
            <section className={section}>
              <div className="pb-3">
                <StepHeading n={2} title="Receipts" sub="Money received this week. Tagged lines are filled in from Pledges and Giving." />
              </div>
              {header("")}
              {data.receipts.map((x, i) => {
                const k = autoKind(x.item);
                return (
                  <LedgerRow
                    key={`${x.item}-${i}`}
                    cols={cols}
                    label={x.item}
                    tag={k ? AUTO_TAG[k] : undefined}
                    value={x.amount === null || x.amount === "" ? "—" : amt(num(x.amount))}
                    input={x.amount}
                    onInput={editing ? (v) => setLine("receipts", i, v) : undefined}
                    onRemove={editing ? () => removeLine("receipts", i) : undefined}
                    hint={autoHint(x.item, x.amount)}
                  />
                );
              })}
              <LedgerRow cols={cols} label="Total receipts" bold value={amt(t.R)} run={amt(t.R)} />
              {addBlock("receipts", "Add receipt")}
            </section>

            {/* 3. Tithe */}
            <section className={section}>
              <div className="pb-3">
                <StepHeading n={3} title="Tithe" sub={`${rate}% of total receipts, split as configured.`} />
              </div>
              {header("RUNNING")}
              <LedgerRow cols={cols} label={`Tithe (${rate}% of receipts)`} bold value={amt(t.T)} />
              {t.tb.map((b, i) => (
                <LedgerRow key={`${b.item}-${i}`} cols={cols} label={`${b.item} · ${b.percentage}%`} value={amt(b.amount)} />
              ))}
              {!t.tb.length && (
                <p className="px-3 py-3 text-sm text-[#6B7280]">No tithe breakdown configured.</p>
              )}
              <LedgerRow cols={cols} label="Funds after tithe" bold value="" run={amt(t.F)} />
            </section>

            {/* 4. Payments */}
            <section className={section}>
              <div className="pb-3">
                <StepHeading n={4} title="Payments" sub="Money spent this week." />
              </div>
              {header("RUNNING")}
              {data.payments.map((x, i) => (
                <LedgerRow
                  key={`${x.item}-${i}`}
                  cols={cols}
                  label={x.item}
                  value={x.amount === null || x.amount === "" ? "—" : amt(num(x.amount))}
                  input={x.amount}
                  onInput={editing ? (v) => setLine("payments", i, v) : undefined}
                  onRemove={editing ? () => removeLine("payments", i) : undefined}
                />
              ))}
              <LedgerRow cols={cols} label="Total payments" bold value={amt(t.P)} run={amt(t.E)} runDanger={t.E < 0} />
              {addBlock("payments", "Add payment")}
            </section>

            {/* 5. Balance */}
            <section className={section}>
              <div className="pb-3">
                <StepHeading n={5} title="Balance summary" sub="Enter the reserves and refund; the rest is calculated." />
              </div>
              {header("")}
              <LedgerRow cols={cols} label={BALANCE_LABELS.excess} value={amt(t.E)} />
              <LedgerRow
                cols={cols}
                label={BALANCE_LABELS.reserve}
                value={amt(t.reserve)}
                input={data.balance.ReserveForSavings.amount}
                onInput={editing ? (v) => setBal("ReserveForSavings", v) : undefined}
              />
              <LedgerRow cols={cols} label={BALANCE_LABELS.balance} bold value={amt(t.net)} />
              <LedgerRow
                cols={cols}
                label={BALANCE_LABELS.refund}
                value={amt(t.refund)}
                input={data.balance.WeeklyRefund.amount}
                onInput={editing ? (v) => setBal("WeeklyRefund", v) : undefined}
              />
              <LedgerRow
                cols={cols}
                label={BALANCE_LABELS.office}
                value={amt(t.office)}
                input={data.balance.OfficeMaintenanceReserve.amount}
                onInput={editing ? (v) => setBal("OfficeMaintenanceReserve", v) : undefined}
              />
              <LedgerRow cols={cols} label="Total balance" bold value={amt(t.fin)} run={amt(t.fin)} runDanger={t.fin < 0} />
            </section>

            {/* 6. Fund allocation */}
            <section className={section}>
              <div className="pb-3">
                <StepHeading n={6} title="Fund allocation" sub="Total balance shared across accounts. Savings also receives the reserve." />
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                  <div className="grid grid-cols-[minmax(140px,1fr)_80px_120px_120px] gap-3 rounded-t-lg bg-lightGray px-3 py-2 text-xs font-semibold">
                    <span>MOVEMENT</span>
                    <span className="text-right">PORTION</span>
                    <span className="text-right">ACTUAL</span>
                    <span className="text-right">ADJUSTED</span>
                  </div>
                  {t.al.map((a, i) => (
                    <div
                      key={`${a.movement}-${i}`}
                      className="grid min-h-11 grid-cols-[minmax(140px,1fr)_80px_120px_120px] items-center gap-3 border-b border-[#E5E7EB] px-3 py-1.5 text-sm tabular-nums"
                    >
                      <span>{a.movement}</span>
                      <span className="text-right">{a.portion}%</span>
                      <span className="text-right">{amt(a.actual)}</span>
                      <span className="text-right">{amt(a.adjusted)}</span>
                    </div>
                  ))}
                  <div className="grid min-h-11 grid-cols-[minmax(140px,1fr)_80px_120px_120px] items-center gap-3 border-b border-[#E5E7EB] bg-[#F8F9FC] px-3 py-1.5 text-sm font-semibold tabular-nums">
                    <span>Total</span>
                    <span className="text-right">{Math.round(t.al.reduce((a, x) => a + x.portion, 0) * 100) / 100}%</span>
                    <span className="text-right">{amt(t.al.reduce((a, x) => a + x.actual, 0))}</span>
                    <span className="text-right">{amt(t.al.reduce((a, x) => a + x.adjusted, 0))}</span>
                  </div>
                  {!t.al.length && <p className="px-3 py-3 text-sm text-[#6B7280]">No fund accounts configured.</p>}
                </div>
              </div>
            </section>
          </div>

          <aside
            className={cn("flex min-w-0 flex-[1_1_280px] flex-col gap-4", wideRail ? "sticky top-4 max-w-[320px]" : "max-w-full")}
          >
            <section className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-5 shadow-[0_8px_24px_rgba(8,13,45,0.08)]">
              <h2 className="pb-1 text-base font-semibold text-primary">Summary</h2>
              {(
                [
                  ["Total receipts", t.R],
                  ["Tithe", -t.T],
                  ["Total payments", -t.P],
                  ["Reserved for savings", -t.reserve],
                  ["Refund and office reserve", t.refund + t.office],
                ] as [string, number][]
              ).map(([l, v]) => (
                <div key={l} className="flex justify-between gap-3 border-b border-[#E5E7EB] py-1.5 text-sm">
                  <span className="text-[#4B5563]">{l}</span>
                  <span className={cn("tabular-nums", v < 0 ? "text-[#4B5563]" : "text-primary")}>{money(v)}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3 py-1.5 text-sm font-semibold">
                <span>Total balance</span>
                <span className={cn("tabular-nums", t.fin < 0 ? "text-[#B91C1C]" : "text-primary")}>{money(t.fin)}</span>
              </div>
            </section>
            <section className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-5">
              <h2 className="text-base font-semibold text-primary">Approval</h2>
              <p className="text-sm text-[#4B5563]">
                Finance approver: <span className="font-semibold text-primary">{approverName || "Not set"}</span>
              </p>
              <ol className="m-0 flex list-none flex-col p-0">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-3 py-1.5 text-sm">
                    <span className="mt-[5px] h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: l.c }} />
                    <div className="min-w-0">
                      <p className="[overflow-wrap:anywhere]">{l.t}</p>
                      <p className="text-xs text-[#6B7280]">{fmtD(l.when)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        {editing && (
          <div className="sticky bottom-0 z-[5] flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-lightGray bg-white px-4 py-3 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
            <p className="flex-[1_1_200px] font-semibold">Total balance {money(t.fin)}</p>
            <UiButton
              className={cn("min-h-11", fl)}
              disabled={busy}
              onClick={() => {
                if (isNew) navigate("/home/finance");
                else {
                  setEditing(false);
                  setEd(null);
                  setTried(false);
                }
              }}
            >
              Cancel
            </UiButton>
            {status === "APPROVED" ? (
              <UiButton tone="primary" className={cn("min-h-11", fl)} disabled={busy} onClick={() => void save("SAVE_AND_APPROVE")}>
                {busy ? "Saving…" : "Save changes"}
              </UiButton>
            ) : (
              <>
                <UiButton className={cn("min-h-11", fl)} disabled={busy} onClick={() => void save("SAVE_DRAFT")}>
                  Save draft
                </UiButton>
                <UiButton
                  tone="primary"
                  className={cn("min-h-11", phone ? "basis-full" : "")}
                  disabled={busy}
                  onClick={() => void save("SAVE_AND_APPROVE")}
                >
                  {busy ? "Saving…" : isApprover ? "Save and approve" : "Submit for approval"}
                </UiButton>
              </>
            )}
          </div>
        )}
      </div>

      {rec && (
        <CommDialog
          open={returnOpen}
          onClose={() => setReturnOpen(false)}
          title={`Return ${rec.week} · ${rangeTxt(rec.from, rec.to)}`}
          subtitle={`It goes back to ${rec.createdBy} as a draft.`}
          busy={busy}
          width={560}
          errors={returnTried && !returnNote.trim() ? ["Say what needs to change."] : undefined}
          buttons={[
            { label: "Cancel", onClick: () => setReturnOpen(false) },
            { label: `Return to ${rec.createdBy.split(" ")[0]}`, onClick: () => void submitReturn(), tone: "primary" },
          ]}
        >
          <ul className="m-0 flex list-disc flex-col gap-1 rounded-lg bg-[#F8F9FC] py-3 pl-8 pr-4 text-sm text-[#374151]">
            <li>{rec.createdBy} is notified with your note.</li>
            <li>They fix it and submit again. Nothing is approved in the meantime.</li>
          </ul>
          <Field label="What needs to change">
            <TextArea
              value={returnNote}
              hasError={returnTried && !returnNote.trim()}
              placeholder="e.g. Fuel for genset looks doubled. Check the receipt."
              onChange={(e) => setReturnNote(e.target.value)}
            />
          </Field>
        </CommDialog>
      )}
    </PageOutline>
  );
};

export default FinanceRecord;
