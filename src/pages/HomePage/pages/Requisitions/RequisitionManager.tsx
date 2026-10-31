import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "@/context/AuthWrapper";
import { notify } from "@/components/feedback";
import type { RequisitionFormPayload, RequisitionOverviewDetail } from "@/utils/api/requisitions/interfaces";
import { cn } from "@/utils/cn";
import EmptyStateImage from "@/assets/emptyState.svg";

import PageOutline from "../../Components/PageOutline";
import { confirmAction } from "../../utils/helperFunctions";
import { WIDE_TABLE_MIN, useViewportWidth } from "../ChurchCommunication/ui/commUtils";
import { KpiButton } from "../AppointmentsManagement/Components/appointmentUi";
import {
  CellText,
  Field,
  FilterPanel,
  FilterToggleButton,
  GridTable,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SelectInput,
  TextInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import { ApproveDialog, type FormSeed, RejectDialog, RequisitionFormDialog, SignDialog } from "./components/RequisitionDialogs";
import { RequisitionDrawer } from "./components/RequisitionDrawer";
import { StepperH } from "./components/requisitionUi";
import { useRequisitionFormOptions } from "./hooks/useRequisitionFormOptions";
import {
  type Row,
  type SimilarGroup,
  actedByMe,
  canAct,
  days1,
  decodeId,
  downloadCsv,
  dur,
  firstName,
  fmtD,
  fmtDT,
  fmtDay,
  isComing,
  mainCurrency,
  median,
  money,
  moneyS,
  pct,
  pendingStep,
  pillOf,
  plural,
  rejectedStep,
  similarFromRows,
  subOf,
  sumOf,
  titleOf,
  todayKey,
  waitDays,
  daysBetween,
} from "./utils/requisitionModel";
import { useRequisitionsData } from "./utils/useRequisitionsData";

type Section = "mine" | "all";
type Filters = { dept: string; event: string; step: string; from: string; to: string };
const NO_FILTERS: Filters = { dept: "", event: "", step: "", from: "", to: "" };
const PAGE = 25;

type DialogState =
  | { kind: "form"; seed: FormSeed }
  | { kind: "sign"; row: Row }
  | { kind: "approve"; row: Row; similar: SimilarGroup[] }
  | { kind: "reject"; row: Row }
  | null;

type TabDef = { key: string; label: string; list: Row[]; counted: boolean; warn?: boolean };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Small action button used inside attention rows and cards. */
const ActBtn = ({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) => (
  <UiButton size="sm" tone={primary ? "primary" : "secondary"} onClick={onClick}>
    {label}
  </UiButton>
);

const RequisitionManager = ({ section }: { section: Section }) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const myName = String(user?.name ?? "");
  const width = useViewportWidth();
  const wide = width >= WIDE_TABLE_MIN;

  const data = useRequisitionsData(section);
  const { me, now, rows, isManager, isApprover, can, replyDays, lookbackDays, loaded, reload } = data;
  const mine = section === "mine";
  const role: "requester" | "admin" | "approver" = mine ? "requester" : isManager ? "admin" : "approver";

  const options = useRequisitionFormOptions();
  const departments = useMemo(
    () => options.departmentOptions.map((o) => ({ value: String(o.value), label: o.label })),
    [options.departmentOptions]
  );
  const events = useMemo(
    () => options.eventOptions.map((o) => ({ value: String(o.value), label: o.label })),
    [options.eventOptions]
  );

  const [tab, setTab] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);

  // Deep links: /home/requests/:id (notifications) and ?new=1 (legacy create route).
  useEffect(() => {
    const id = decodeId(params.id) ?? decodeId(searchParams.get("open"));
    if (id) setDrawerId(id);
  }, [params.id, searchParams]);
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setDialog({ kind: "form", seed: {} });
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setTab(null);
    setLimit(PAGE);
  }, [section]);

  const openRow = useCallback((row: Row) => setDrawerId(row.id), []);
  const closeDrawer = useCallback(() => {
    setDrawerId(null);
    if (params.id) navigate("/home/requests/staff_requests", { replace: true });
    else if (searchParams.get("open")) {
      searchParams.delete("open");
      setSearchParams(searchParams, { replace: true });
    }
  }, [params.id, navigate, searchParams, setSearchParams]);

  const refresh = useCallback(async () => {
    await reload();
    setVersion((v) => v + 1);
  }, [reload]);

  /* --------------------------------- actions -------------------------------- */

  const onSaveForm = async (payload: RequisitionFormPayload, thenSign: boolean) => {
    const seed = dialog?.kind === "form" ? dialog.seed : {};
    try {
      const saved = await data.save(payload);
      await refresh();
      if (thenSign) {
        const detail = await data.loadDetail(saved.id);
        setDialog(detail ? { kind: "sign", row: detail } : null);
        return;
      }
      setDialog(null);
      if (seed.editing && seed.editing.status !== "DRAFT") {
        notify.success({ title: "Changes saved", message: `${seed.editing.generated_id} · approvers see the update in its history.` });
      } else if (seed.revisedFrom) {
        notify.success({ title: `New draft ${saved.generatedId || ""}`.trim(), message: "Sign and submit it when the changes are done." });
      } else {
        notify.success({ title: "Draft saved", message: "Only you can see it until you sign and submit." });
      }
      setDrawerId(saved.id);
    } catch (error) {
      notify.fromError(error, { title: "Couldn’t save the requisition" });
    }
  };

  const onSubmit = async (row: Row, signature: string) => {
    try {
      await data.submit(row.id, signature);
      await refresh();
      const detail = await data.loadDetail(row.id).catch(() => null);
      const first = detail?.steps[0]?.approver.name;
      setDialog(null);
      notify.success({
        title: "Requisition submitted",
        message: `It’s with ${first || "the first approver"} now. You’ll be notified at every step.`,
      });
    } catch (error) {
      notify.fromError(error, { title: `Couldn’t submit ${row.generated_id}`, preferServerMessage: true });
    }
  };

  const onApprove = async (row: Row, signature: string, comment: string) => {
    const current = pendingStep(row);
    const next = current ? row.steps.find((s) => s.order === current.order + 1) : undefined;
    try {
      await data.approve(row.id, signature, comment);
      setDialog(null);
      await refresh();
      notify.success({
        title: next ? `Sent to ${next.approver.name}` : "Requisition fully approved",
        message: `${row.generated_id} approved. ${row.requester.name} has been notified.`,
      });
    } catch (error) {
      notify.fromError(error, { title: `Couldn’t approve ${row.generated_id}`, preferServerMessage: true });
    }
  };

  const onReject = async (row: Row, reason: string) => {
    try {
      await data.reject(row.id, reason);
      setDialog(null);
      await refresh();
      notify.success({
        title: "Requisition rejected",
        message: `${firstName(row.requester.name)} has been told why and can revise it as a new draft.`,
      });
    } catch (error) {
      notify.fromError(error, { title: `Couldn’t reject ${row.generated_id}`, preferServerMessage: true });
    }
  };

  const onRemind = async (row: Row) => {
    const step = pendingStep(row);
    try {
      await data.remind(row.id);
      await refresh();
      notify.success({
        title: `Reminder sent to ${step?.approver.name ?? "the approver"}`,
        message: "By push and email. You’ll see it in the history when they act.",
      });
    } catch (error) {
      notify.fromError(error, { title: "Couldn’t send the reminder", preferServerMessage: true });
    }
  };

  const onDelete = (row: Row) => {
    const draft = row.status === "DRAFT" && row.requester.id === me;
    return confirmAction({
      title: draft ? "Delete this draft?" : `Delete ${row.generated_id}?`,
      points: draft
        ? [`${row.generated_id} · ${titleOf(row)} will be removed.`, "No one else has seen it, so no one is notified."]
        : [
            `${row.generated_id} · ${titleOf(row)} from ${row.requester.name} will be removed with its items, attachments and approvals.`,
            "This can’t be undone. Approved requisitions can’t be deleted.",
          ],
      confirmLabel: draft ? "Delete draft" : "Delete requisition",
      cancelLabel: draft ? "Keep draft" : "Keep it",
      tone: "danger",
      onConfirm: async () => {
        await data.remove(row.id);
        setDrawerId(null);
        await refresh();
        notify.success({ title: draft ? "Draft deleted" : "Requisition deleted", message: `${row.generated_id} · ${titleOf(row)}` });
      },
    });
  };

  const onMarkDisbursed = (row: Row) =>
    confirmAction({
      title: `Mark ${row.generated_id} disbursed?`,
      points: [
        `Records that ${money(row.total_amount, row.currency)} for ${titleOf(row)} has been paid out or handed over.`,
        `${row.requester.name} is notified, and your name and the time are kept in its history.`,
      ],
      confirmLabel: "Mark disbursed",
      cancelLabel: "Not yet",
      onConfirm: async () => {
        await data.markDisbursed(row.id);
        await refresh();
        notify.success({ title: "Marked disbursed", message: `${row.generated_id} · ${firstName(row.requester.name)} has been notified.` });
      },
    });

  const openEdit = (detail: RequisitionOverviewDetail) => setDialog({ kind: "form", seed: { editing: detail } });
  const openRevise = (detail: RequisitionOverviewDetail) => {
    setDrawerId(null);
    setDialog({ kind: "form", seed: { revisedFrom: detail } });
  };
  const openNew = () => setDialog({ kind: "form", seed: {} });
  const editDraftById = async (row: Row) => {
    const detail = await data.loadDetail(row.id).catch(() => null);
    if (detail) openEdit(detail);
  };
  const reviseById = async (row: Row) => {
    const detail = await data.loadDetail(row.id).catch(() => null);
    if (detail) openRevise(detail);
  };

  /* ------------------------------ derived lists ----------------------------- */

  const P = (r: Row) => r.status === "PENDING";
  const byWait = (a: Row, b: Row) => waitDays(b, now) - waitDays(a, now);
  const dateOf = (r: Row) => r.submitted_at || r.created_at;
  const byDate = (a: Row, b: Row) => dateOf(b).localeCompare(dateOf(a));
  const over = (r: Row) => P(r) && waitDays(r, now) > replyDays;

  const term = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const day = dateOf(r).slice(0, 10);
        const step = pendingStep(r);
        return (
          (!filters.dept || String(r.department.id) === filters.dept) &&
          (!filters.event || String(r.event?.id ?? "") === filters.event) &&
          (!filters.step || (P(r) && String(step?.order ?? "") === filters.step)) &&
          (!filters.from || day >= filters.from) &&
          (!filters.to || day <= filters.to) &&
          (!term ||
            [r.generated_id, r.requester.name, r.department.name, r.event?.name ?? "", ...r.items.map((i) => i.name)]
              .join(" ")
              .toLowerCase()
              .includes(term))
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, filters, term]
  );

  const myQueue = rows.filter((r) => canAct(r, me)).sort(byWait);

  const tabs: TabDef[] = useMemo(() => {
    const base = filtered;
    if (role === "requester")
      return [
        {
          key: "all",
          label: "All",
          list: base.slice().sort((a, b) => (a.status === "DRAFT") !== (b.status === "DRAFT") ? (a.status === "DRAFT" ? -1 : 1) : byDate(a, b)),
          counted: false,
        },
        { key: "draft", label: "Drafts", list: base.filter((r) => r.status === "DRAFT").sort(byDate), counted: true },
        { key: "pending", label: "In approval", list: base.filter(P).sort(byWait), counted: true },
        { key: "approved", label: "Approved", list: base.filter((r) => r.status === "APPROVED").sort(byDate), counted: false },
        { key: "rejected", label: "Rejected", list: base.filter((r) => r.status === "REJECTED").sort(byDate), counted: false },
      ];
    if (role === "approver")
      return [
        { key: "mine", label: "Waiting for you", list: base.filter((r) => canAct(r, me)).sort(byWait), counted: true, warn: base.some((r) => canAct(r, me) && over(r)) },
        { key: "coming", label: "Coming to you", list: base.filter((r) => isComing(r, me)).sort(byWait), counted: true },
        { key: "acted", label: "You acted on", list: base.filter((r) => actedByMe(r, me)).sort(byDate), counted: false },
        { key: "all", label: "All", list: base.slice().sort(byDate), counted: false },
      ];
    const adminTabs: TabDef[] = [
      { key: "awaiting", label: "Awaiting approval", list: base.filter(P).sort(byWait), counted: true, warn: base.some(over) },
      { key: "approved", label: "Approved", list: base.filter((r) => r.status === "APPROVED").sort(byDate), counted: false },
      { key: "rejected", label: "Rejected", list: base.filter((r) => r.status === "REJECTED").sort(byDate), counted: false },
      { key: "all", label: "All", list: base.slice().sort(byDate), counted: false },
    ];
    // Managers who are also approvers get their own queue first.
    const queue = base.filter((r) => canAct(r, me)).sort(byWait);
    return queue.length || isApprover
      ? [{ key: "mine", label: "Waiting for you", list: queue, counted: true, warn: queue.some(over) }, ...adminTabs]
      : adminTabs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, role, me, now, replyDays, isApprover]);

  const activeTab =
    tabs.find((t) => t.key === tab) ?? (role === "admin" ? tabs.find((t) => t.key === "awaiting") : tabs[0]) ?? tabs[0];
  const list = activeTab.list;
  const shown = list.slice(0, limit);
  const filterCount = Object.values(filters).filter(Boolean).length;
  const isFiltered = !!term || filterCount > 0;
  const currency = mainCurrency(rows);

  const pickTab = (key: string) => {
    setTab(key);
    setLimit(PAGE);
  };

  /* -------------------------------- overview -------------------------------- */

  const monthKey = todayKey().slice(0, 7);
  const monthName = MONTH_NAMES[Number(monthKey.slice(5)) - 1];
  const year = todayKey().slice(0, 4);

  const overview = useMemo(() => {
    const kpis: { label: string; value: string | number; sub: string; subTone?: "muted" | "warning" | "danger"; alert?: boolean; onClick?: () => void }[] = [];
    const attention: { key: string; title: string; text: string; actions: { label: string; onClick: () => void; primary?: boolean }[] }[] = [];
    let attentionNote = "";

    if (role === "requester") {
      const pend = rows.filter(P);
      const drafts = rows.filter((r) => r.status === "DRAFT");
      const rej = rows.filter((r) => r.status === "REJECTED" && !r.revised_to && r.decided_at && daysBetween(r.decided_at, now) < 60);
      const appr = rows.filter((r) => r.status === "APPROVED" && (r.decided_at ?? "").startsWith(year));
      const times = rows
        .filter((r) => r.status === "APPROVED" && r.submitted_at && r.decided_at)
        .map((r) => daysBetween(r.submitted_at as string, r.decided_at as string));
      const act = drafts.length + rej.length;
      kpis.push(
        { label: "In approval", value: pend.length, sub: pend.length ? `${money(sumOf(pend), currency)} waiting` : "Nothing waiting", onClick: () => pickTab("pending") },
        { label: "Needs your action", value: act, sub: `${drafts.length} to submit · ${rej.length} rejected`, subTone: act ? "warning" : "muted", onClick: () => pickTab(drafts.length ? "draft" : "rejected") },
        { label: "Approved this year", value: moneyS(sumOf(appr), currency), sub: plural(appr.length, "requisition"), onClick: () => pickTab("approved") },
        { label: "Typical approval time", value: days1(median(times)), sub: "From submitting to final sign-off" }
      );
      drafts.forEach((r) =>
        attention.push({
          key: `d${r.id}`,
          title: `Draft not submitted · ${r.generated_id}`,
          text: `${titleOf(r)} · ${money(r.total_amount, r.currency)}. Approvers can’t see it until you sign and submit.`,
          actions: [
            { label: "Sign and submit", primary: true, onClick: () => setDialog({ kind: "sign", row: r }) },
            { label: "Edit", onClick: () => void editDraftById(r) },
          ],
        })
      );
      rej.forEach((r) => {
        const step = rejectedStep(r);
        attention.push({
          key: `r${r.id}`,
          title: `Rejected by ${step?.approver.name ?? "an approver"} · ${r.generated_id}`,
          text: `“${step?.comment || "No reason given"}”`,
          actions: [
            { label: "Revise as new draft", primary: true, onClick: () => void reviseById(r) },
            { label: "View", onClick: () => openRow(r) },
          ],
        });
      });
      pend.filter(over).forEach((r) =>
        attention.push({
          key: `o${r.id}`,
          title: `${r.generated_id} has been with ${pendingStep(r)?.approver.name ?? "an approver"} for ${dur(waitDays(r, now))}`,
          text: `That’s over the ${replyDays}-day reply time. A reminder goes to them automatically.`,
          actions: [{ label: "View", onClick: () => openRow(r) }],
        })
      );
      attentionNote = `${attention.length === 1 ? "1 thing needs" : `${attention.length} things need`} you before your requests can move.`;
    } else if (role === "approver") {
      const coming = rows.filter((r) => isComing(r, me));
      const actedM = rows.filter((r) => r.steps.some((s) => s.approver.id === me && s.status === "APPROVED" && (s.acted_at ?? "").startsWith(monthKey)));
      const oldest = myQueue.length ? waitDays(myQueue[0], now) : 0;
      kpis.push(
        { label: "Waiting for you", value: myQueue.length, sub: myQueue.length ? money(sumOf(myQueue), currency) : "All clear", alert: myQueue.some(over), onClick: () => pickTab("mine") },
        {
          label: "Oldest waiting",
          value: myQueue.length ? dur(oldest) : "—",
          sub: !myQueue.length ? "Nothing waiting" : oldest > replyDays ? `Over the ${replyDays}-day reply time` : `Within the ${replyDays}-day reply time`,
          subTone: oldest > replyDays ? "danger" : "muted",
          onClick: () => pickTab("mine"),
        },
        { label: "Coming to you", value: coming.length, sub: coming.length ? `${money(sumOf(coming), currency)} at earlier steps` : "Nothing on the way", onClick: () => pickTab("coming") },
        { label: `You approved in ${monthName}`, value: actedM.length, sub: money(sumOf(actedM), currency), onClick: () => pickTab("acted") }
      );
    } else {
      const pend = rows.filter(P);
      const overList = pend.filter(over).sort(byWait);
      const apM = rows.filter((r) => r.status === "APPROVED" && (r.decided_at ?? "").startsWith(monthKey));
      const rjM = rows.filter((r) => r.status === "REJECTED" && (r.decided_at ?? "").startsWith(monthKey));
      kpis.push(
        { label: "Awaiting approval", value: pend.length, sub: money(sumOf(pend), currency), onClick: () => pickTab("awaiting") },
        {
          label: `Over ${replyDays} days at one step`,
          value: overList.length,
          sub: overList.length ? `Longest: ${dur(waitDays(overList[0], now))} with ${pendingStep(overList[0])?.approver.name ?? "an approver"}` : "Everything is moving",
          subTone: overList.length ? "danger" : "muted",
          alert: overList.length > 0,
          onClick: () => pickTab("awaiting"),
        },
        { label: `Approved in ${monthName}`, value: moneyS(sumOf(apM), currency), sub: plural(apM.length, "requisition"), onClick: () => pickTab("approved") },
        { label: `Rejected in ${monthName}`, value: rjM.length, sub: `${pct(rjM.length, rjM.length + apM.length)} of decisions`, onClick: () => pickTab("rejected") }
      );
      overList.forEach((r) => {
        const step = pendingStep(r);
        attention.push({
          key: `o${r.id}`,
          title: `${r.generated_id} · with ${step?.approver.name ?? "an approver"} for ${dur(waitDays(r, now))}`,
          text: `${r.requester.name}, ${r.department.name} · ${titleOf(r)} · ${money(r.total_amount, r.currency)}${
            r.last_reminder_at ? ` · Reminder sent ${fmtDT(r.last_reminder_at)}` : ""
          }`,
          actions: [
            ...(can.sendReminders
              ? [{ label: r.last_reminder_at ? "Remind again" : "Send reminder", onClick: () => void onRemind(r) }]
              : []),
            { label: "View", onClick: () => openRow(r) },
          ],
        });
      });
      attentionNote = `${overList.length === 1 ? "1 requisition has" : `${overList.length} requisitions have`} waited more than ${replyDays} days with one approver. Requesters can’t move them on themselves.`;
    }
    return { kpis, attention, attentionNote };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, role, me, now, replyDays, currency, myQueue.length]);

  // Admin pipeline: what's waiting at each step order.
  const pipeline = useMemo(() => {
    if (role !== "admin") return [];
    const pend = rows.filter(P);
    const maxSteps = Math.max(0, ...rows.map((r) => r.steps.length));
    return Array.from({ length: maxSteps }, (_, index) => {
      const order = index + 1;
      const at = pend.filter((r) => pendingStep(r)?.order === order);
      const label =
        rows.map((r) => r.steps.find((s) => s.order === order)?.label).find(Boolean) ?? `Step ${order}`;
      const oldest = at.length ? Math.max(...at.map((r) => waitDays(r, now))) : 0;
      const who = Array.from(new Set(at.map((r) => pendingStep(r)?.approver.name).filter(Boolean)));
      return { order, label, count: at.length, value: sumOf(at), oldest, who };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, role, now]);

  /* ---------------------------------- CSV ---------------------------------- */

  const exportCsv = () => {
    downloadCsv(`requisitions-${activeTab.key}-${todayKey()}.csv`, [
      ["ID", "Requested by", "Department", "Event", "Items", "Amount", "Currency", "Status", "Waiting with", "Days waiting", "Submitted", "Final decision"],
      ...list.map((r) => {
        const step = r.status === "PENDING" ? pendingStep(r) : undefined;
        return [
          r.generated_id,
          r.requester.name,
          r.department.name,
          r.event?.name ?? "",
          r.items.map((i) => `${i.quantity} x ${i.name}`).join("; "),
          r.total_amount.toFixed(2),
          r.currency,
          pillOf(r, me, now, replyDays).label,
          step?.approver.name ?? "",
          step ? waitDays(r, now).toFixed(1) : "",
          r.submitted_at?.slice(0, 10) ?? "",
          r.decided_at?.slice(0, 10) ?? "",
        ];
      }),
    ]);
    notify.success({ title: "CSV downloaded", message: `${plural(list.length, "requisition")} from the ${activeTab.label.toLowerCase()} tab.` });
  };

  /* --------------------------------- render --------------------------------- */

  if (!mine && loaded && !isManager && !isApprover) {
    return <Navigate to={params.id ? `/home/requests?open=${params.id}` : "/home/requests"} replace />;
  }

  const filterOptions = {
    depts: Array.from(new Map(rows.map((r) => [String(r.department.id), r.department.name])).entries()).map(([value, label]) => ({ value, label })),
    events: Array.from(new Map(rows.filter((r) => r.event).map((r) => [String(r.event!.id), r.event!.name])).entries()).map(([value, label]) => ({ value, label })),
  };

  const title = mine ? "My requisitions" : "Requisitions";
  const subtitle = mine
    ? "Requests you’ve raised, and who has each one now."
    : role === "approver"
      ? "Requests waiting for your approval, and those on their way to you."
      : "Every submitted requisition, and where approvals are holding up.";

  const firstEmpty = mine && loaded && rows.length === 0;
  const showQueue = role === "approver" || (role === "admin" && myQueue.length > 0);
  const tracked = mine ? rows.filter(P).sort(byWait) : [];

  const statusCell = (r: Row) => {
    const pill = pillOf(r, me, now, replyDays);
    const sub = subOf(r, me, now, replyDays);
    return (
      <div className="flex flex-col items-start gap-1">
        <Pill tone={pill.tone}>{pill.label}</Pill>
        <span className={cn("text-xs", sub.className)}>{sub.text}</span>
      </div>
    );
  };

  const noneText = isFiltered
    ? "Nothing matches these filters. Try clearing the search or resetting filters."
    : ({
        draft: "No drafts. Everything you started has been submitted.",
        pending: "Nothing in approval right now.",
        mine: "Nothing is waiting for you.",
        coming: "Nothing is on its way to you.",
        awaiting: "Nothing is awaiting approval.",
      } as Record<string, string>)[activeTab.key] ?? "No requisitions here yet.";

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <FilterToggleButton open={showFilters} count={filterCount} onClick={() => setShowFilters((v) => !v)} />
            {/* My own list is always exportable; everyone else's needs Requisition.export. */}
            {(mine || can.export) && (
              <UiButton onClick={exportCsv} disabled={!list.length}>
                Export CSV
              </UiButton>
            )}
            {can.raise && (
              <UiButton tone="primary" onClick={openNew}>
                New requisition
              </UiButton>
            )}
          </>
        }
      />

      {showFilters && (
        <FilterPanel
          title="Refine requisitions"
          helper="Filters combine with the search and tabs. Dates are when it was submitted."
          onReset={() => {
            setFilters(NO_FILTERS);
            setQ("");
          }}
          resetDisabled={!isFiltered}
        >
          <Field label="Department">
            <SelectInput
              value={filters.dept}
              onChange={(e) => setFilters((f) => ({ ...f, dept: e.target.value }))}
              options={[{ value: "", label: "All departments" }, ...filterOptions.depts]}
            />
          </Field>
          <Field label="Event or programme">
            <SelectInput
              value={filters.event}
              onChange={(e) => setFilters((f) => ({ ...f, event: e.target.value }))}
              options={[{ value: "", label: "All events" }, ...filterOptions.events]}
            />
          </Field>
          {!mine && (
            <Field label="Waiting at">
              <SelectInput
                value={filters.step}
                onChange={(e) => setFilters((f) => ({ ...f, step: e.target.value }))}
                options={[
                  { value: "", label: "Any step" },
                  ...Array.from(
                    new Map(rows.flatMap((r) => r.steps.map((s) => [String(s.order), `Step ${s.order} · ${s.label}`] as const))).entries()
                  )
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([value, label]) => ({ value, label })),
                ]}
              />
            </Field>
          )}
          <Field label="Submitted from">
            <TextInput type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          </Field>
          <Field label="Submitted to">
            <TextInput type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </Field>
        </FilterPanel>
      )}

      {firstEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-lightGray bg-white px-6 py-12 text-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-inputBackground">
            <img src={EmptyStateImage} alt="" className="w-24" />
          </div>
          <Pill>NO REQUISITIONS YET</Pill>
          <h2 className="text-2xl font-semibold leading-8 text-primary">You haven’t raised a requisition</h2>
          <p className="max-w-[440px] text-base text-gray-600">
            When your department needs something bought, raise it here. You’ll see who has it at every step until Finance signs off.
          </p>
          {can.raise && (
            <UiButton tone="primary" onClick={openNew}>
              New requisition
            </UiButton>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
            {overview.kpis.map((kpi) => (
              <KpiButton key={kpi.label} label={kpi.label} value={kpi.value} sub={kpi.sub} subTone={kpi.subTone} alert={kpi.alert} onClick={kpi.onClick} />
            ))}
          </div>

          {overview.attention.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-amber-200 bg-white">
              <div className="flex flex-col gap-1 border-b border-amber-200 bg-amber-50 px-5 py-4">
                <h2 className="text-base font-semibold text-primary">Needs your attention</h2>
                <p className="text-sm text-gray-700">{overview.attentionNote}</p>
              </div>
              {overview.attention.map((item) => (
                <div key={item.key} className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 last:border-b-0">
                  <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                    <p className="text-sm font-semibold text-primary">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.text}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.actions.map((action) => (
                      <ActBtn key={action.label} {...action} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {role === "admin" && pipeline.length > 0 && (
            <section className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-primary">Where approvals are waiting</h2>
                <p className="text-sm text-gray-600">
                  Every requisition goes {pipeline.map((p) => p.label).join(" → ")}. Pick a step to list what’s waiting there.
                </p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
                {pipeline.map((p) => {
                  const on = filters.step === String(p.order);
                  return (
                    <button
                      key={p.order}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setFilters((f) => ({ ...f, step: on ? "" : String(p.order) }));
                        pickTab("awaiting");
                      }}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border p-4 text-left text-sm text-primary transition-colors",
                        on ? "border-primary bg-inputBackground" : "border-lightGray bg-white hover:bg-inputBackground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{p.order}</span>
                        <span className="font-semibold">{p.label}</span>
                      </span>
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="text-2xl font-semibold leading-8">{p.count}</span>
                        <span className="text-gray-600">waiting · {money(p.value, currency)}</span>
                      </span>
                      <span className={cn("text-xs", p.oldest > replyDays ? "text-red-700" : "text-gray-500")}>
                        {p.count ? `Oldest: ${dur(p.oldest)}` : "Nothing waiting"}
                      </span>
                      <span className="text-xs text-gray-500">{p.who.length ? p.who.join(", ") : "No one waiting"}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {showQueue && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-primary">Waiting for your approval</h2>
                <p className="text-sm text-gray-600">
                  Oldest first. Items requested recently by anyone are flagged so you can check before approving.
                </p>
              </div>
              {myQueue.length ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
                  {myQueue.map((r) => {
                    const step = pendingStep(r);
                    const prev = step ? r.steps.find((s) => s.order === step.order - 1) : undefined;
                    const days = waitDays(r, now);
                    const similar = similarFromRows(r, rows, lookbackDays, now);
                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
                          days > replyDays ? "border-red-200" : "border-lightGray"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-xs text-gray-500">{r.generated_id}</span>
                            <p className="text-base font-semibold leading-6 text-primary">{titleOf(r)}</p>
                            <p className="text-sm text-gray-600">
                              {r.requester.name} · {r.department.name}
                              {r.event ? ` · ${r.event.name}` : ""}
                            </p>
                          </div>
                          <span className="whitespace-nowrap text-sm font-semibold text-primary">{money(r.total_amount, r.currency)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={cn("text-xs font-semibold", days > replyDays ? "text-red-700" : days >= replyDays - 1 ? "text-amber-700" : "text-gray-600")}>
                            Waiting {dur(days)}
                            {days > replyDays ? " · over reply time" : ""}
                          </span>
                          <span className="text-xs text-gray-500">
                            {prev?.acted_at ? `Approved by ${prev.approver.name} on ${fmtD(prev.acted_at)}` : `Submitted ${fmtD(r.submitted_at)}`}
                          </span>
                        </div>
                        {similar.length > 0 && (
                          <span className="self-start">
                            <Pill tone="info">
                              {plural(similar.length, "item")} requested in the last {lookbackDays} days
                            </Pill>
                          </span>
                        )}
                        <div className="mt-auto flex gap-2">
                          <UiButton className="flex-1" onClick={() => openRow(r)}>
                            Review
                          </UiButton>
                          <UiButton className="flex-1" tone="primary" onClick={() => setDialog({ kind: "approve", row: r, similar })}>
                            Approve
                          </UiButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">
                  Nothing is waiting for you. You’ll be notified when a requisition reaches your step.
                </p>
              )}
            </section>
          )}

          {tracked.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-primary">Where your requests are</h2>
                <p className="text-sm text-gray-600">Who has each one now, and how long it’s been with them.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
                {tracked.map((r) => {
                  const step = pendingStep(r);
                  const days = waitDays(r, now);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => openRow(r)}
                      className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 text-left text-sm text-primary transition-shadow hover:shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]"
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-xs text-gray-500">{r.generated_id}</span>
                          <p className="font-semibold">{titleOf(r)}</p>
                        </div>
                        <span className="whitespace-nowrap font-semibold">{money(r.total_amount, r.currency)}</span>
                      </div>
                      {r.steps.length > 0 && <StepperH row={r} />}
                      <p className={cn("text-xs font-semibold", days > replyDays ? "text-red-700" : days >= replyDays - 1 ? "text-amber-700" : "text-green-700")}>
                        {step ? `With ${step.approver.name} (${step.label}) · ${dur(days)}` : `In approval · ${dur(days)}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PillTabs
                ariaLabel="Requisition status"
                value={activeTab.key}
                onChange={pickTab}
                tabs={tabs.map((t) => ({
                  key: t.key,
                  label: (
                    <>
                      {t.label}
                      {t.counted && t.list.length > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-2 text-xs font-semibold",
                            t.warn ? "bg-error text-white" : t.key === activeTab.key ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
                          )}
                        >
                          {t.list.length}
                        </span>
                      )}
                    </>
                  ),
                }))}
              />
              <SearchInput
                value={q}
                onChange={(value) => {
                  setQ(value);
                  setLimit(PAGE);
                }}
                placeholder="Search ID, item or person"
                ariaLabel="Search requisitions"
                className="max-w-[360px] flex-[1_1_240px]"
              />
            </div>
            <p className="text-sm text-gray-600">
              {plural(list.length, "requisition")} · {money(sumOf(list), currency)}
              {isFiltered ? " · filtered" : ""}
            </p>

            {wide ? (
              <GridTable<Row>
                rows={shown}
                getRowId={(r) => String(r.id)}
                onRowClick={openRow}
                loading={data.loading && !loaded}
                minWidth="980px"
                actionsWidth="80px"
                renderActions={(r) => (
                  <UiButton size="sm" onClick={() => openRow(r)}>
                    View
                  </UiButton>
                )}
                columns={[
                  {
                    key: "id",
                    header: "Requisition",
                    width: "140px",
                    render: (r) => <CellText strong main={r.generated_id} sub={r.submitted_at ? fmtD(r.submitted_at) : `Created ${fmtD(r.created_at)}`} />,
                  },
                  {
                    key: "items",
                    header: "Items",
                    width: "minmax(220px,2fr)",
                    render: (r) => (
                      <div className="min-w-0">
                        <p className="truncate font-medium">{titleOf(r)}</p>
                        <p className="truncate text-xs text-gray-500">
                          {r.department.name}
                          {r.event ? ` · ${r.event.name}` : ""}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "c3",
                    header: mine ? "Needed by" : "Requested by",
                    width: "minmax(160px,1.2fr)",
                    render: (r) => (mine ? <CellText main={fmtDay(r.needed_by)} /> : <CellText main={r.requester.name} sub={r.requester.position ?? undefined} />),
                  },
                  { key: "amount", header: "Amount", width: "140px", render: (r) => <p className="font-semibold">{money(r.total_amount, r.currency)}</p> },
                  { key: "status", header: "Status", width: "minmax(220px,1.5fr)", render: statusCell },
                ]}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {shown.map((r) => {
                  const pill = pillOf(r, me, now, replyDays);
                  const sub = subOf(r, me, now, replyDays);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => openRow(r)}
                      className="flex flex-col gap-2 rounded-xl border border-lightGray bg-white p-4 text-left text-sm text-primary"
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">
                            {r.generated_id} · {r.submitted_at ? fmtD(r.submitted_at) : `Created ${fmtD(r.created_at)}`}
                          </p>
                          <p className="font-semibold">{titleOf(r)}</p>
                        </div>
                        <Pill tone={pill.tone}>{pill.label}</Pill>
                      </div>
                      <p className="text-gray-600">
                        {mine ? `Needed by ${fmtDay(r.needed_by)}` : r.requester.name} · {r.department.name}
                      </p>
                      <div className="flex w-full flex-wrap items-baseline justify-between gap-3">
                        <span className={cn("text-xs", sub.className)}>{sub.text}</span>
                        <span className="font-semibold">{money(r.total_amount, r.currency)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {list.length > limit && (
              <UiButton className="self-center" onClick={() => setLimit((l) => l + PAGE)}>
                Show {Math.min(PAGE, list.length - limit)} more
              </UiButton>
            )}
            {loaded && !list.length && (
              <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">{noneText}</p>
            )}
          </div>
        </>
      )}

      <RequisitionDrawer
        rowId={drawerId}
        data={data}
        version={version}
        onClose={closeDrawer}
        intents={{
          onEdit: openEdit,
          onSign: (row) => setDialog({ kind: "sign", row }),
          onApprove: (row, similar) => setDialog({ kind: "approve", row, similar }),
          onReject: (row) => setDialog({ kind: "reject", row }),
          onRevise: openRevise,
          onDelete,
          onRemind: (row) => void onRemind(row),
          onMarkDisbursed,
        }}
      />

      <RequisitionFormDialog
        open={dialog?.kind === "form"}
        seed={dialog?.kind === "form" ? dialog.seed : {}}
        departments={departments}
        events={events}
        onClose={() => setDialog(null)}
        onSave={onSaveForm}
      />
      <SignDialog
        open={dialog?.kind === "sign"}
        row={dialog?.kind === "sign" ? dialog.row : null}
        requesterName={myName}
        onClose={() => setDialog(null)}
        onSubmit={(signature) => (dialog?.kind === "sign" ? onSubmit(dialog.row, signature) : Promise.resolve())}
      />
      <ApproveDialog
        open={dialog?.kind === "approve"}
        row={dialog?.kind === "approve" ? dialog.row : null}
        similar={dialog?.kind === "approve" ? dialog.similar : []}
        lookbackDays={lookbackDays}
        myName={myName}
        onClose={() => setDialog(null)}
        onApprove={(signature, comment) => (dialog?.kind === "approve" ? onApprove(dialog.row, signature, comment) : Promise.resolve())}
      />
      <RejectDialog
        open={dialog?.kind === "reject"}
        row={dialog?.kind === "reject" ? dialog.row : null}
        onClose={() => setDialog(null)}
        onReject={(reason) => (dialog?.kind === "reject" ? onReject(dialog.row, reason) : Promise.resolve())}
      />
    </PageOutline>
  );
};

export const MyRequisitionsPage = () => <RequisitionManager section="mine" />;
export const AllRequisitionsPage = () => <RequisitionManager section="all" />;
/**
 * Deep link from notifications (/home/requests/:id): opens the drawer over the
 * all-requisitions view; requesters are sent to their own list with ?open=.
 */
export const RequisitionDeepLinkPage = () => <RequisitionManager section="all" />;

export default RequisitionManager;

/** Old /home/requests/request/:id edit links now open the drawer. */
export const LegacyRequestRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/home/requests/${id}` : "/home/requests?new=1"} replace />;
};
