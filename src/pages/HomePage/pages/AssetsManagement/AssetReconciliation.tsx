import { ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { notify } from "@/components/feedback";
import type { AssetDepartment, CountResult, StockCheck, StockCheckItem } from "@/utils/api/assets/interfaces";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { confirmAction } from "../../utils/helperFunctions";
import { FieldGrid, FullRow } from "../ChurchCommunication/ui/commUi";
import {
  Field,
  PageHeading,
  Pill,
  PillTabs,
  SearchInput,
  SelectInput,
  TextArea,
  TextInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import { RequisitionDialog } from "../Requisitions/components/requisitionUi";
import {
  CATEGORIES,
  FIX_OPTIONS,
  FIX_TEXT,
  RESULT,
  STATUS,
  STORE_KEY,
  addDaysKey,
  ago,
  categoryLabel,
  checkStats,
  dayOf,
  defaultCheckName,
  differenceCount,
  downloadCsv,
  dueInfo,
  fmtD,
  fmtS,
  initials,
  isDone,
  money,
  moneyS,
  pct,
  plural,
  todayKey,
} from "./utils/assetModel";
import { useAssetsData, useStockChecks, useToday } from "./utils/useAssetsData";

type View = "home" | "count" | "review" | "report";
type Filter = "todo" | "done" | "all";
const PAGE = 40;

/** Runs an action; the API layer already toasts failures. Returns true on success. */
const attempt = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
};

const StepCard = ({ n, title, text }: { n: number; title: string; text: string }) => (
  <div className="flex gap-3 rounded-xl border border-lightGray bg-white px-5 py-4">
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{n}</span>
    <div>
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="text-sm text-[#4B5563]">{text}</p>
    </div>
  </div>
);

const Bar = ({ pct: value, height = "h-3", color = "bg-primary" }: { pct: number; height?: string; color?: string }) => (
  <div className={cn("overflow-hidden rounded-full bg-[#E5E7EB]", height)}>
    <div className={cn("h-full", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const Banner = ({ tone, children, action }: { tone: "success" | "info" | "warning"; children: ReactNode; action?: ReactNode }) => (
  <div
    role="status"
    className={cn(
      "flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm",
      tone === "success" && "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]",
      tone === "info" && "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
      tone === "warning" && "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
    )}
  >
    <p className="flex-[1_1_260px]">{children}</p>
    {action}
  </div>
);

const KpiTile = ({ label, value, sub, color = "#6B7280" }: { label: string; value: ReactNode; sub: string; color?: string }) => (
  <div className="flex flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4">
    <p className="text-sm text-[#4B5563]">{label}</p>
    <p className="text-2xl font-semibold leading-8 text-primary">{value}</p>
    <p className="text-xs" style={{ color }}>
      {sub}
    </p>
  </div>
);

const BackLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="self-start bg-transparent p-0 text-sm text-[#4B5563] hover:text-primary">
    ← {label}
  </button>
);

/* -------------------------------------------------------------------------- */

const AssetReconciliation = () => {
  const [params, setParams] = useSearchParams();
  const today = useToday();
  const stock = useStockChecks();
  const register = useAssetsData();
  const departments = register.departments;
  const admin = stock.viewer.is_admin;
  const myKeys = stock.viewer.department_keys;

  const checkId = Number(params.get("check")) || null;
  const requested = (params.get("view") as View) || (checkId && !admin ? "count" : "home");
  const deptParam = params.get("dept");

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todo");
  const [limit, setLimit] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  const active = stock.checks.find((c) => c.status === "open") ?? null;
  const check = checkId ? stock.checks.find((c) => c.id === checkId) ?? null : null;

  // Closed reports (and checks opened from a notification) aren't in the list: fetch on demand.
  const [missing, setMissing] = useState<number | null>(null);
  const { loadCheck } = stock;
  useEffect(() => {
    if (!checkId || check || !stock.loaded) return;
    let live = true;
    setMissing(null);
    loadCheck(checkId)
      .then((found) => live && !found && setMissing(checkId))
      .catch(() => live && setMissing(checkId));
    return () => {
      live = false;
    };
  }, [checkId, check, stock.loaded, loadCheck]);
  const loadingCheck = Boolean(checkId && !check && missing !== checkId);

  let view: View = requested;
  if (!check) view = "home";
  else if (!admin && (view !== "count" || check.status !== "open")) view = check.status === "open" ? "count" : "home";
  else if (view === "count" && check.status !== "open") view = "report";
  else if (view === "review" && check.status === "closed") view = "report";

  const go = (next: { view: View; check?: number | null; dept?: string | null; filter?: Filter }) => {
    const p = new URLSearchParams();
    if (next.check) p.set("check", String(next.check));
    if (next.view !== "home") p.set("view", next.view);
    if (next.dept !== undefined && next.dept !== null && next.dept !== "") p.set("dept", next.dept);
    setParams(p);
    setQ("");
    setLimit(PAGE);
    if (next.filter) setFilter(next.filter);
    const el = document.getElementById("wwm-scroll");
    if (el) el.scrollTop = 0;
    else window.scrollTo(0, 0);
  };

  useEffect(() => {
    setLimit(PAGE);
  }, [filter, deptParam]);

  const deptName = (key: number | null) =>
    key === STORE_KEY || key === null ? "Store (not assigned)" : departments.find((d) => d.id === key)?.name || `Department #${key}`;

  const run = async (action: string, payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      return await stock.run(action, payload);
    } finally {
      setBusy(false);
    }
  };

  const morePast = async () => {
    setBusy(true);
    await attempt(() => stock.loadMorePast());
    setBusy(false);
  };

  /* ---------------------------------- home --------------------------------- */

  const renderHome = () => {
    const past = stock.past;
    const mine = !admin && active ? active.departments.filter((d) => myKeys.includes(d.key)) : [];
    return (
      <>
        <PageHeading
          title="Reconciliation"
          subtitle="Count what is physically there, match it to the register, and fix the differences."
          actions={
            admin && !active ? (
              <UiButton tone="primary" onClick={() => setStartOpen(true)}>
                Start stock check
              </UiButton>
            ) : undefined
          }
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
          <StepCard n={1} title="Count" text="Each department head ticks off what they hold: found, found somewhere else, damaged or not found." />
          <StepCard n={2} title="Review differences" text="The administrator decides what to do with anything that doesn’t match the register." />
          <StepCard n={3} title="Close and update" text="Closing applies the changes, marks counted items as verified, and keeps a report." />
        </div>

        {admin && active && renderActive(active)}

        {mine.map((d) => {
          const items = active!.items.filter((i) => i.expected_key === d.key);
          const done = items.filter(isDone).length;
          const due = dueInfo(active!, today);
          const sb = d.submitted_at;
          return (
            <section key={d.key} className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-6 shadow-[0_8px_24px_rgba(8,13,45,0.08)]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold leading-7 text-primary">{active!.name}</h2>
                <Pill tone={sb ? "success" : done ? "info" : "neutral"}>{sb ? "Submitted" : done ? "Counting" : "Not started"}</Pill>
              </div>
              <p className="text-sm text-[#4B5563]">
                {sb
                  ? `You submitted the ${d.name} count on ${fmtD(sb)}. ${active!.created_by?.name || "The administrator"} will review any differences and close the check.`
                  : `${active!.created_by?.name || "The administrator"} asked you to count the ${plural(items.length, "asset")} ${d.name} holds. Mark each one as you see it, then submit.`}
              </p>
              {!sb && (
                <p className="text-xs font-semibold" style={{ color: due.color }}>
                  {due.text}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold">
                    {done} of {items.length} counted
                  </span>
                  <span className="text-[#4B5563]">{pct(done, items.length)}</span>
                </div>
                <Bar pct={(done / (items.length || 1)) * 100} />
              </div>
              <UiButton
                tone="primary"
                className="min-h-11 self-start px-6"
                onClick={() => go({ view: "count", check: active!.id, dept: String(d.key), filter: sb ? "done" : "todo" })}
              >
                {sb ? "View my count" : done ? "Continue counting" : "Start counting"}
              </UiButton>
            </section>
          );
        })}

        {(!active || (!admin && !mine.length)) && stock.loaded && (
          <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-lightGray bg-white p-6 text-center">
            <p className="text-sm font-semibold text-primary">No stock check in progress</p>
            <p className="text-sm text-[#4B5563]">
              {!admin
                ? "Nothing for you to count right now. You’ll be notified when the next check starts."
                : past.length
                  ? `Last check closed ${fmtD(past[0].closed_at)} (${ago(past[0].closed_at, today)} ago). Most churches count every quarter.`
                  : "Start one to confirm the register matches what is on the ground."}
            </p>
          </div>
        )}
        {!stock.loaded && <div className="h-40 animate-pulse rounded-xl bg-[#F3F4F6]" />}

        {admin && (
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-primary">Past stock checks</h2>
            {past.map((c) => {
              const st = c.stats;
              const diffs = st.differences;
              const misV = st.not_found_value;
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-lightGray bg-white px-5 py-4">
                  <div className="min-w-0 flex-[1_1_220px]">
                    <p className="text-sm font-semibold text-primary">{c.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {c.scope_label} · closed {fmtD(c.closed_at)} by {c.closed_by?.name || c.created_by?.name || "—"}
                    </p>
                  </div>
                  {[
                    { l: "Counted", v: `${st.counted} of ${st.expected}`, c: "#080D2D" },
                    { l: "Matched", v: pct(st.matched, st.expected), c: "#080D2D" },
                    { l: "Differences", v: String(diffs), c: diffs ? "#B45309" : "#080D2D" },
                    { l: "Not found", v: moneyS(misV), c: misV ? "#B91C1C" : "#080D2D" },
                  ].map((x) => (
                    <div key={x.l} className="flex flex-col">
                      <span className="text-xs text-[#6B7280]">{x.l}</span>
                      <span className="text-sm font-semibold" style={{ color: x.c }}>
                        {x.v}
                      </span>
                    </div>
                  ))}
                  <UiButton onClick={() => go({ view: "report", check: c.id })}>View report</UiButton>
                </div>
              );
            })}
            {past.length < stock.pastTotal && (
              <UiButton className="self-center" disabled={busy} onClick={() => void morePast()}>
                Show {Math.min(10, stock.pastTotal - past.length)} more
              </UiButton>
            )}
            {stock.loaded && !past.length && <p className="text-sm text-[#6B7280]">No closed stock checks yet.</p>}
          </section>
        )}
      </>
    );
  };

  const renderActive = (c: StockCheck) => {
    const st = checkStats(c);
    const due = dueInfo(c, today);
    const nSub = c.departments.filter((d) => d.submitted_at).length;
    const me = stock.viewer.user_id;
    const chips = [
      st.elsewhere.length && { t: `${st.elsewhere.length} found elsewhere`, tone: "info" as const },
      st.damaged.length && { t: `${st.damaged.length} damaged`, tone: "warning" as const },
      st.missing.length && { t: `${st.missing.length} not found`, tone: "danger" as const },
      st.extras.length && { t: `${st.extras.length} not on register`, tone: "info" as const },
    ].filter(Boolean) as { t: string; tone: "info" | "warning" | "danger" }[];
    const depts = c.departments
      .map((d) => {
        const items = c.items.filter((i) => i.expected_key === d.key);
        return { d, total: items.length, done: items.filter(isDone).length };
      })
      .sort((a, b) => Number(!!a.d.submitted_at) - Number(!!b.d.submitted_at) || a.done / a.total - b.done / b.total);

    return (
      <section className="flex flex-col gap-5 rounded-xl border border-lightGray bg-white p-6 shadow-[0_8px_24px_rgba(8,13,45,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold leading-7 text-primary">{c.name}</h2>
              <Pill tone="info">In progress</Pill>
            </div>
            <p className="text-sm text-[#4B5563]">
              {c.scope_label} · started {fmtD(c.started_at)} by {c.created_by?.name || "—"}
            </p>
            <p className="text-xs font-semibold" style={{ color: due.color }}>
              {due.text}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <UiButton tone="danger" onClick={() => cancelCheck(c)}>
              Cancel check
            </UiButton>
            <UiButton onClick={() => go({ view: "review", check: c.id })}>Review differences</UiButton>
            <UiButton tone="primary" onClick={() => go({ view: "count", check: c.id, filter: "todo" })}>
              Continue counting
            </UiButton>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <span className="font-semibold">
              {st.done} of {st.expected} assets counted · {nSub} of {c.departments.length} departments submitted
            </span>
            <span className="text-[#4B5563]">{pct(st.done, st.expected)}</span>
          </div>
          <Bar pct={(st.done / (st.expected || 1)) * 100} />
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Pill key={chip.t} tone={chip.tone}>
                {chip.t}
              </Pill>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-primary">By department</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
            {depts.map(({ d, total, done }) => {
              const mineK = d.counter?.id === me;
              return (
                <div key={d.key} className="flex flex-col gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{d.name}</span>
                    <Pill tone={d.submitted_at ? "success" : done ? "info" : "neutral"}>
                      {d.submitted_at ? "Submitted" : done ? "Counting" : "Not started"}
                    </Pill>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Bar pct={(done / (total || 1)) * 100} height="h-1.5" color={d.submitted_at ? "bg-[#15803D]" : "bg-primary"} />
                    </div>
                    <span className="text-xs font-semibold">
                      {done} / {total}
                    </span>
                  </div>
                  <span className="text-xs text-[#6B7280]">
                    {d.submitted_at
                      ? `Submitted ${fmtS(d.submitted_at)} by ${d.submitted_by_name || "—"}`
                      : `Counter: ${mineK ? "you" : d.counter?.name || "no department head set"}${d.reminded_at ? ` · reminded ${fmtS(d.reminded_at)}` : ""}`}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <UiButton
                      size="sm"
                      className="flex-auto"
                      onClick={() => go({ view: "count", check: c.id, dept: String(d.key), filter: d.submitted_at ? "done" : "todo" })}
                    >
                      {mineK && !d.submitted_at ? "Count" : "Open list"}
                    </UiButton>
                    {!d.submitted_at && !mineK && d.counter && (
                      <UiButton size="sm" className="flex-auto" disabled={busy} onClick={() => void remind(c, [d.key])}>
                        {d.reminded_at ? "Remind again" : "Send reminder"}
                      </UiButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const remind = async (c: StockCheck, keys?: number[]) => {
    let sent = 0;
    const ok = await attempt(async () => {
      const result = (await run("remind", { check_id: c.id, ...(keys ? { department_keys: keys } : {}) })) as unknown as { sent?: number };
      sent = result?.sent ?? 0;
    });
    if (!ok) return;
    if (keys?.length === 1) {
      const d = c.departments.find((x) => x.key === keys[0]);
      notify.success({ title: `Reminder sent to ${d?.counter?.name || d?.name}`, message: "By push and email, with a link straight to their list." });
    } else {
      notify.success({ title: "Reminders sent", message: sent ? `To ${plural(sent, "counter")} who haven’t submitted.` : "Everyone left to remind was reminded in the last hour." });
    }
  };

  const cancelCheck = (c: StockCheck) =>
    confirmAction({
      title: `Cancel ${c.name}?`,
      points: ["Counts recorded so far are discarded and nothing on the register changes.", "Counters are told the check was cancelled."],
      confirmLabel: "Cancel check",
      cancelLabel: "Keep it",
      tone: "danger",
      onConfirm: async () => {
        await stock.cancel(c.id);
        go({ view: "home" });
        notify.success({ title: `${c.name} cancelled`, message: "You can start a new check any time." });
      },
    });

  /* --------------------------------- count --------------------------------- */

  const renderCount = (c: StockCheck) => {
    const key = admin ? (deptParam !== null && deptParam !== "" ? Number(deptParam) : null) : deptParam !== null ? Number(deptParam) : myKeys[0] ?? null;
    const dept = key === null ? null : c.departments.find((d) => d.key === key) ?? null;
    const sb = dept?.submitted_at ?? null;
    const canEdit = admin || !sb;
    const term = q.trim().toLowerCase();
    const deptAll = c.items.filter((i) => key === null || i.expected_key === key);
    const pool = deptAll.filter((i) => !term || `${i.asset.name} ${i.asset.code}`.toLowerCase().includes(term));
    const todo = pool.filter((i) => !isDone(i));
    const done = pool.filter(isDone);
    const list = filter === "todo" ? todo : filter === "done" ? done : pool;
    const left = deptAll.filter((i) => !isDone(i));
    const diffN = deptAll.filter((i) => isDone(i) && i.result !== "found").length;
    const st = checkStats(c);
    const me = stock.viewer.user_id;
    const counterName = dept?.counter ? (dept.counter.id === me ? "you" : dept.counter.name) : "no department head set";

    const mark = (item: StockCheckItem, result: CountResult | null, foundKey?: number | null) =>
      void attempt(() => run("mark", { check_id: c.id, marks: [{ asset_id: item.asset_id, result, ...(foundKey !== undefined ? { found_key: foundKey } : {}) }] }));

    const bulkFound = () =>
      confirmAction({
        title: `Mark ${plural(left.length, "item")} as found?`,
        points: ["Use this when you have physically seen every remaining item on this list.", "You can still change any of them afterwards."],
        confirmLabel: "Mark as found",
        cancelLabel: "Go back",
        onConfirm: async () => {
          await stock.run("mark", { check_id: c.id, marks: left.map((i) => ({ asset_id: i.asset_id, result: "found" })) });
          notify.success({ title: `${plural(left.length, "item")} marked as found`, message: deptName(key) });
        },
      });

    const submit = () => {
      if (key === null) return;
      if (left.length) {
        notify.warning({ title: `${plural(left.length, "item")} still to count`, message: "Mark each one, or use “Mark remaining as found” if you’ve seen them all." });
        return;
      }
      confirmAction({
        title: `Submit the count for ${deptName(key)}?`,
        points: [
          `${plural(deptAll.length, "item")} counted, ${diffN} with differences.`,
          admin ? "The department is marked as done." : `${c.created_by?.name || "The administrator"} is notified. You can reopen it until the check is closed.`,
        ],
        confirmLabel: "Submit count",
        cancelLabel: "Not yet",
        onConfirm: async () => {
          await stock.run("submit", { check_id: c.id, department_key: key });
          notify.success({
            title: `Count submitted for ${deptName(key)}`,
            message: admin ? "Recorded as submitted by you." : `${c.created_by?.name || "The administrator"} has been notified and will review any differences.`,
          });
        },
      });
    };

    const reopen = () =>
      void attempt(async () => {
        await run("reopen", { check_id: c.id, department_key: key });
        notify.info({ title: "Count reopened", message: "Make your changes, then submit again." });
      });

    const deptCounts = c.departments.map((d) => {
      const items = c.items.filter((i) => i.expected_key === d.key);
      return { d, total: items.length, done: items.filter(isDone).length };
    });
    const extras = c.extras.filter((x) => admin || x.found_key === key || x.recorded_by === me);
    const whereOptions = (exp: number) => [
      { value: "", label: "Choose where" },
      ...departments.filter((d) => d.id !== exp).map((d) => ({ value: String(d.id), label: d.name })),
      ...(exp !== STORE_KEY ? [{ value: "0", label: "In the store" }] : []),
    ];

    return (
      <>
        <BackLink label="Reconciliation" onClick={() => go({ view: "home" })} />
        <PageHeading
          title={c.name}
          subtitle={
            admin
              ? key !== null
                ? `${deptName(key)} · counter: ${counterName}. Changes save straight away.`
                : "All departments. Pick one to count it or submit on its behalf."
              : `${deptName(key)} · mark each item as you see it. Changes save straight away.`
          }
          actions={
            <>
              {canEdit && <UiButton onClick={() => setExtraOpen(true)}>Found something not listed</UiButton>}
              {admin && (
                <UiButton tone="primary" onClick={() => go({ view: "review", check: c.id })}>
                  Review differences
                </UiButton>
              )}
            </>
          }
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <span className="font-semibold">
              {deptAll.filter(isDone).length} of {deptAll.length} counted{key !== null ? ` in ${deptName(key)}` : ""}
            </span>
            <span className="text-[#4B5563]">{pct(deptAll.filter(isDone).length, deptAll.length)}</span>
          </div>
          <Bar pct={(deptAll.filter(isDone).length / (deptAll.length || 1)) * 100} height="h-2" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillTabs
            ariaLabel="Count progress"
            value={filter}
            onChange={setFilter}
            tabs={[
              { key: "todo", label: "To count", count: todo.length || null },
              { key: "done", label: "Counted", count: done.length || null },
              { key: "all", label: "All" },
            ]}
          />
          <div className="flex max-w-[560px] flex-[1_1_320px] flex-wrap gap-2">
            {(admin || myKeys.length > 1) && (
              <SelectInput
                aria-label="Department"
                className="flex-[1_1_180px]"
                value={key === null ? "" : String(key)}
                onChange={(e) => go({ view: "count", check: c.id, dept: e.target.value, filter })}
                options={[
                  ...(admin ? [{ value: "", label: `All departments (${st.done}/${st.expected})` }] : []),
                  ...deptCounts
                    .filter(({ d }) => admin || myKeys.includes(d.key))
                    .map(({ d, total, done: n }) => ({
                      value: String(d.key),
                      label: `${d.name} (${n}/${total})${d.submitted_at ? " · submitted" : ""}`,
                    })),
                ]}
              />
            )}
            <SearchInput className="flex-[1_1_200px]" value={q} onChange={setQ} placeholder="Name or asset ID on the tag" ariaLabel="Find asset" />
          </div>
        </div>

        {key !== null && sb && (
          <Banner
            tone="success"
            action={
              !admin ? (
                <UiButton size="sm" disabled={busy} onClick={reopen}>
                  Reopen my count
                </UiButton>
              ) : undefined
            }
          >
            {admin
              ? `Submitted by ${dept?.submitted_by_name || "—"} on ${fmtD(sb)}. Changes you make now are logged under your name.`
              : `You submitted this count on ${fmtD(sb)}. Reopen it if you need to change something before ${c.created_by?.name || "the administrator"} closes the check.`}
          </Banner>
        )}
        {key !== null && !sb && admin && dept?.counter && dept.counter.id !== me && (
          <Banner tone="info">{dept.counter.name} is counting this department. You can count or submit on their behalf.</Banner>
        )}

        {canEdit && key !== null && left.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[#6B7280]">Walked the room and everything is there? Mark the rest in one go, then fix any exceptions.</p>
            <button
              type="button"
              onClick={bulkFound}
              className="min-h-10 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2 text-sm font-medium text-[#15803D] hover:bg-[#DCFCE7]"
            >
              Mark remaining {left.length} as found
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {list.slice(0, limit).map((item) => {
            const a = item.asset;
            const dn = isDone(item);
            const picking = item.result === "elsewhere" && item.found_key === null;
            const opts: [CountResult, string, "primary" | "secondary" | "danger"][] =
              a.status === "OUT_OF_REPAIRS"
                ? [
                    ["atrepair", "Still with repairer", "primary"],
                    ["back", "Back from repair", "secondary"],
                    ["missing", "Not found", "danger"],
                  ]
                : [
                    ["found", a.status === "NEEDS_REPAIR" ? "Found, still faulty" : "Found", "primary"],
                    ["elsewhere", "Somewhere else", "secondary"],
                    ...(a.status === "NEEDS_REPAIR" ? [] : ([["damaged", "Damaged", "secondary"]] as [CountResult, string, "secondary"][])),
                    ["missing", "Not found", "danger"],
                  ];
            const statusNote =
              a.status === "OUT_OF_REPAIRS"
                ? `Out for repair since ${fmtS(a.status_since)}. Confirm with the repairer.`
                : a.status === "NEEDS_REPAIR"
                  ? `Reported faulty ${fmtS(a.status_since)}. ${a.status_note || ""}`
                  : a.status_note || "";
            return (
              <div key={item.asset_id} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-lightGray bg-white px-4 py-3">
                <div className="flex min-w-0 flex-[1_1_240px] items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F3F5FA] text-xs font-semibold text-[#4B5563]">
                    {initials(a.name)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-sm font-semibold text-primary">{a.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {a.code} · {categoryLabel(a.category)}
                    </p>
                    {(a.status === "NEEDS_REPAIR" || a.status === "OUT_OF_REPAIRS" || a.status === "NOT_FIXABLE") && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pill tone={STATUS[a.status].tone} className="px-2 py-0">
                          {STATUS[a.status].label}
                        </Pill>
                        <span className="text-xs text-[#4B5563]">{statusNote}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-[0_1_200px]">
                  <p className="text-xs text-[#6B7280]">Should be with</p>
                  <p className="text-sm">{item.expected_name}</p>
                </div>
                <div className="flex flex-[1_1_340px] flex-wrap items-center justify-end gap-2">
                  {!item.result && canEdit &&
                    opts.map(([res, label, tone]) => (
                      <UiButton key={res} tone={tone} className="min-h-11 flex-auto px-3" disabled={busy} onClick={() => mark(item, res)}>
                        {label}
                      </UiButton>
                    ))}
                  {picking && canEdit && (
                    <>
                      <label className="flex flex-[1_1_220px] flex-col gap-1">
                        <span className="text-xs text-[#4B5563]">Found with</span>
                        <select
                          value=""
                          disabled={busy}
                          onChange={(e) => e.target.value !== "" && mark(item, "elsewhere", Number(e.target.value))}
                          className="h-11 rounded-lg border border-primary bg-white px-3 text-sm text-primary"
                        >
                          {whereOptions(item.expected_key).map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <UiButton className="min-h-11" disabled={busy} onClick={() => mark(item, null)}>
                        Cancel
                      </UiButton>
                    </>
                  )}
                  {dn && (
                    <>
                      <div className="flex flex-col items-end gap-0.5">
                        <Pill tone={RESULT[item.result!].tone}>{RESULT[item.result!].label}</Pill>
                        <span className="text-xs text-[#6B7280]">
                          {item.result === "elsewhere" ? `With ${item.found_name} · ` : ""}
                          {item.counted_at ? `${fmtS(item.counted_at)} · ${item.counted_by_name || ""}` : ""}
                        </span>
                      </div>
                      {canEdit && (
                        <UiButton size="sm" disabled={busy} onClick={() => mark(item, null)}>
                          Change
                        </UiButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {list.length > limit && (
            <UiButton className="self-center" onClick={() => setLimit(limit + PAGE)}>
              Show {Math.min(PAGE, list.length - limit)} more
            </UiButton>
          )}
          {!list.length && (
            <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-[#4B5563]">
              {filter === "todo" && !term
                ? `Everything here has been counted.${key !== null && !sb ? " Submit the count below." : admin && st.done === st.expected ? " Review the differences to close the check." : ""}`
                : "Nothing matches."}
            </p>
          )}
        </div>

        {extras.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-primary">Found but not on the register</h2>
            {extras.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#BFDBFE] bg-white px-4 py-3">
                <div className="min-w-0 flex-[1_1_240px]">
                  <p className="text-sm font-semibold text-primary">{x.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    Found with {x.found_name} · {categoryLabel(x.category)}
                    {x.note ? ` · ${x.note}` : ""} · {x.recorded_by_name || "—"}
                  </p>
                </div>
                {canEdit && (admin || x.recorded_by === me) && (
                  <UiButton size="sm" tone="danger" disabled={busy} onClick={() => void attempt(() => run("remove-extra", { check_id: c.id, extra_id: x.id }))}>
                    Remove
                  </UiButton>
                )}
              </div>
            ))}
          </section>
        )}

        {key !== null && !sb && (
          <section className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-xl border border-lightGray bg-white px-5 py-4 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
            <div className="flex-[1_1_260px]">
              <p className="text-sm font-semibold text-primary">
                {admin
                  ? `Submit count for ${deptName(key)}${dept?.counter && dept.counter.id !== me ? ` on behalf of ${dept.counter.name}` : ""}`
                  : "Submit your count"}
              </p>
              <p className="text-xs" style={{ color: left.length ? "#B45309" : "#15803D" }}>
                {left.length
                  ? `${left.length} still to count before you can submit`
                  : `All ${deptAll.length} counted · ${plural(diffN, "difference")} for ${c.created_by?.name || "the administrator"} to review`}
              </p>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className={cn(
                "min-h-11 rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-60",
                left.length ? "bg-[#6B7280]" : "bg-primary hover:bg-primary/90"
              )}
            >
              Submit count
            </button>
          </section>
        )}

        <ExtraDialog
          open={extraOpen}
          departments={departments}
          defaultKey={key}
          allowedKeys={admin ? null : myKeys}
          onClose={() => setExtraOpen(false)}
          onSave={async (values) => {
            await stock.run("add-extra", { check_id: c.id, ...values });
            setExtraOpen(false);
            notify.success({ title: "Recorded as not on the register", message: "The administrator decides whether to add it when reviewing." });
          }}
        />
      </>
    );
  };

  /* ------------------------------ review / report --------------------------- */

  const renderReview = (c: StockCheck) => {
    const closed = c.status === "closed";
    const st = checkStats(c);
    const diffs = differenceCount(st);
    const todoN = st.expected - st.done;
    const uns = c.departments.filter((d) => !d.submitted_at);
    const misV = st.missing.reduce((t, i) => t + i.asset.price, 0);

    const setFix = (payload: Record<string, unknown>) => void attempt(() => run("set-fix", { check_id: c.id, ...payload }));
    const recount = (item: StockCheckItem) =>
      void attempt(async () => {
        const result = (await run("recount", { check_id: c.id, asset_id: item.asset_id })) as unknown as { counter_name?: string | null };
        notify.success({
          title: `Recount requested${result?.counter_name ? ` from ${result.counter_name}` : ""}`,
          message: `${item.asset.name} is back on their list and their count is reopened.`,
        });
      });

    const Options = ({ current, options, onPick, extra }: { current: string | null; options: [string, string][]; onPick: (k: string) => void; extra?: ReactNode }) => (
      <div role="radiogroup" className="flex flex-[1_1_320px] flex-wrap justify-end gap-2">
        {options.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={current === k}
            disabled={busy}
            onClick={() => onPick(k)}
            className={cn(
              "min-h-10 flex-auto rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60",
              current === k ? "border-primary bg-primary text-white" : "border-primary/30 bg-white text-primary hover:bg-primary/5"
            )}
          >
            {label}
          </button>
        ))}
        {extra}
      </div>
    );

    const itemRow = (item: StockCheckItem, kind: "missing" | "elsewhere" | "damaged" | "back") => {
      const exp = item.expected_name;
      const detail =
        (kind === "elsewhere"
          ? `Should be with ${exp}, found with ${item.found_name}`
          : kind === "damaged" || kind === "back"
            ? `With ${exp} · ${categoryLabel(item.asset.category)} · was ${STATUS[item.asset.status].label.toLowerCase()}`
            : `Should be with ${exp} · worth ${money(item.asset.price)}`) + (item.counted_by_name ? ` · counted by ${item.counted_by_name}` : "");
      return (
        <div key={item.asset_id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#E5E7EB] px-5 py-3 last:border-b-0">
          <div className="min-w-0 flex-[1_1_240px]">
            <p className="text-sm font-semibold text-primary">
              {item.asset.name} · {item.asset.code}
            </p>
            <p className="text-xs text-[#6B7280]">{detail}</p>
          </div>
          {closed ? (
            <span className="text-sm text-[#374151]">{item.fix ? FIX_TEXT[item.fix] : "—"}</span>
          ) : (
            <Options
              current={item.fix}
              options={FIX_OPTIONS[kind]}
              onPick={(fix) => setFix({ asset_id: item.asset_id, fix })}
              extra={
                kind === "missing" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => recount(item)}
                    className="min-h-10 flex-auto rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm font-medium text-[#1D4ED8] hover:bg-[#EFF6FF] disabled:opacity-60"
                  >
                    Ask for recount
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      );
    };

    const groups: { key: string; pill: [string, "danger" | "info" | "warning"]; title: string; sub: string; body: ReactNode }[] = [];
    if (st.missing.length)
      groups.push({
        key: "missing",
        pill: ["Not found", "danger"],
        title: `${st.missing.length} not found`,
        sub: `Worth ${money(misV)}. Mark them lost, keep them on the register, or ask the counter to look again.`,
        body: st.missing.map((i) => itemRow(i, "missing")),
      });
    if (st.elsewhere.length)
      groups.push({
        key: "elsewhere",
        pill: ["Elsewhere", "info"],
        title: `${st.elsewhere.length} found somewhere else`,
        sub: "Update the register to where they are, or send them back.",
        body: st.elsewhere.map((i) => itemRow(i, "elsewhere")),
      });
    if (st.damaged.length)
      groups.push({
        key: "damaged",
        pill: ["Damaged", "warning"],
        title: `${st.damaged.length} found damaged`,
        sub: "Choose the status they should have from now on.",
        body: st.damaged.map((i) => itemRow(i, "damaged")),
      });
    if (st.back.length)
      groups.push({
        key: "back",
        pill: ["Back from repair", "info"],
        title: `${st.back.length} back from repair`,
        sub: "The register says these are with the repairer, but they were found here.",
        body: st.back.map((i) => itemRow(i, "back")),
      });
    if (st.extras.length)
      groups.push({
        key: "extras",
        pill: ["Not on register", "info"],
        title: `${st.extras.length} found but not on the register`,
        sub: "Added items get an asset ID. Purchase details can be filled in later.",
        body: st.extras.map((x) => (
          <div key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#E5E7EB] px-5 py-3 last:border-b-0">
            <div className="min-w-0 flex-[1_1_240px]">
              <p className="text-sm font-semibold text-primary">{x.name}</p>
              <p className="text-xs text-[#6B7280]">
                Found with {x.found_name}
                {x.note ? ` · ${x.note}` : ""} · {x.recorded_by_name || "—"}
              </p>
            </div>
            {closed ? (
              <span className="text-sm text-[#374151]">{FIX_TEXT[x.fix]}</span>
            ) : (
              <Options current={x.fix} options={FIX_OPTIONS.extra} onPick={(fix) => setFix({ extra_id: x.id, fix })} />
            )}
          </div>
        )),
      });

    const summary = [
      `${plural(st.found.length, "item")} marked verified`,
      `${st.elsewhere.filter((i) => i.fix === "move").length} moved on the register`,
      `${st.damaged.filter((i) => i.fix !== "keep").length + st.back.filter((i) => i.fix === "needs").length} marked needs repair or beyond repair`,
      `${st.back.filter((i) => i.fix === "working").length} back in use after repair`,
      `${st.missing.filter((i) => i.fix === "lost").length} marked lost or stolen`,
      `${st.extras.filter((x) => x.fix === "add").length} added to the register`,
    ];

    const markRest = () =>
      confirmAction({
        title: `Record ${plural(todoN, "uncounted asset")} as not found?`,
        points: [
          "They move to “Not found” below, set to “Check again next time”, so nothing is marked lost by accident.",
          "You can still change each one before closing.",
        ],
        confirmLabel: "Record as not found",
        cancelLabel: "Keep counting",
        tone: "danger",
        onConfirm: () => stock.run("mark-rest-missing", { check_id: c.id }),
      });

    const close = () => {
      const nAdd = st.extras.filter((x) => x.fix === "add").length;
      const changes = st.elsewhere.length + st.damaged.length + st.back.length + st.missing.length;
      confirmAction({
        title: `Close ${c.name}?`,
        points: [
          `${plural(st.found.length, "item")} marked verified on ${fmtD(todayKey())}.`,
          `${plural(changes, "difference")} applied to the register as you chose${nAdd ? `, and ${plural(nAdd, "new item")} added` : ""}.`,
          "The check is locked and kept as a report.",
          ...(uns.length ? [`${uns.map((d) => d.name).join(", ")} ${uns.length === 1 ? "hasn’t" : "haven’t"} submitted. Their counts are used as they stand.`] : []),
        ],
        confirmLabel: "Close and update register",
        cancelLabel: "Not yet",
        onConfirm: async () => {
          await stock.run("close", { check_id: c.id });
          await register.reload();
          go({ view: "report", check: c.id });
          // Refresh the history list; the report reloads itself if it drops out of the list.
          void stock.reload();
          notify.success({ title: `${c.name} closed`, message: "The register is updated and the report is saved." });
        },
      });
    };

    const exportReport = () => {
      downloadCsv(`${c.name.toLowerCase().replace(/\s+/g, "-")}-report.csv`, [
        ["Asset ID", "Name", "Category", "Should be with", "Result", "Found with", "Outcome", "Counted on", "Counted by", "Value (GHS)"],
        ...c.items.map((i) => [
          i.asset.code,
          i.asset.name,
          categoryLabel(i.asset.category),
          i.expected_name,
          i.result ? RESULT[i.result].label : "Not counted",
          i.found_name ?? "",
          i.result === "found" ? "Verified" : i.fix ? FIX_TEXT[i.fix] : "",
          dayOf(i.counted_at),
          i.counted_by_name ?? "",
          i.asset.price.toFixed(2),
        ]),
        ...c.extras.map((x) => ["", x.name, categoryLabel(x.category), "", "Not on register", x.found_name, FIX_TEXT[x.fix], dayOf(x.recorded_at), x.recorded_by_name ?? "", ""]),
      ]);
      notify.success({ title: "Report downloaded", message: `${plural(st.expected, "asset")} and ${plural(c.extras.length, "unregistered item")}.` });
    };

    return (
      <>
        <BackLink label="Reconciliation" onClick={() => go({ view: "home" })} />
        <PageHeading
          title={closed ? `${c.name} report` : "Review differences"}
          subtitle={
            closed
              ? `${c.scope_label} · ${fmtD(c.started_at)} to ${fmtD(c.closed_at)} · closed by ${c.closed_by?.name || c.created_by?.name || "—"}`
              : `${c.name} · ${st.done} of ${st.expected} counted. Choose what happens to each difference, then close the check.`
          }
          actions={closed ? <UiButton onClick={exportReport}>Export report CSV</UiButton> : undefined}
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
          <KpiTile label="Expected" value={st.expected} sub="Assets on the register in scope" />
          <KpiTile label="Found as recorded" value={pct(st.found.length, st.expected)} sub={plural(st.found.length, "item")} color="#15803D" />
          <KpiTile
            label="Differences"
            value={diffs}
            sub={`${st.elsewhere.length} elsewhere · ${st.damaged.length} damaged · ${st.back.length} back from repair · ${st.missing.length} not found`}
            color={diffs ? "#B45309" : "#6B7280"}
          />
          <KpiTile label="Not found value" value={moneyS(misV)} sub={plural(st.missing.length, "item")} color={misV ? "#B91C1C" : "#6B7280"} />
        </div>

        {!closed && todoN > 0 && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4">
            <div className="flex-[1_1_280px]">
              <p className="text-sm font-semibold text-primary">
                {plural(todoN, "asset")} {todoN === 1 ? "hasn’t" : "haven’t"} been counted yet
              </p>
              <p className="text-sm text-[#374151]">Count them, or record them as not found so the check can close.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <UiButton onClick={() => go({ view: "count", check: c.id, filter: "todo" })}>Keep counting</UiButton>
              <UiButton tone="danger" onClick={markRest}>
                Record {todoN} as not found
              </UiButton>
            </div>
          </div>
        )}
        {!closed && uns.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-5 py-4">
            <div className="flex-[1_1_280px]">
              <p className="text-sm font-semibold text-primary">
                {uns.length === 1 ? "1 department hasn’t" : `${uns.length} departments haven’t`} submitted: {uns.map((d) => d.name).join(", ")}
              </p>
              <p className="text-sm text-[#374151]">You can still close, but their counts haven’t been signed off.</p>
            </div>
            <UiButton disabled={busy} onClick={() => void remind(c)}>
              Remind them
            </UiButton>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.key} className="overflow-hidden rounded-xl border border-lightGray bg-white">
            <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
              <Pill tone={g.pill[1]}>{g.pill[0]}</Pill>
              <div>
                <h2 className="text-base font-semibold text-primary">{g.title}</h2>
                <p className="text-sm text-[#4B5563]">{g.sub}</p>
              </div>
            </div>
            {g.body}
          </section>
        ))}
        {!diffs && (
          <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-[#4B5563]">
            Everything counted matches the register.
          </p>
        )}

        {!closed && todoN === 0 && (
          <section className="flex flex-wrap items-center gap-4 rounded-xl border border-lightGray bg-white p-5">
            <div className="flex flex-[1_1_320px] flex-col gap-1">
              <h2 className="text-base font-semibold text-primary">When you close this check</h2>
              <ul className="m-0 flex flex-col gap-0.5 pl-[18px] text-sm text-[#374151]">
                {summary.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <UiButton tone="primary" className="min-h-11 px-6" onClick={close}>
              Close stock check
            </UiButton>
          </section>
        )}
      </>
    );
  };

  /* --------------------------------- render -------------------------------- */

  return (
    <PageOutline className="flex flex-col gap-6">
      {loadingCheck ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="h-8 w-64 animate-pulse rounded bg-[#F3F4F6]" />
          <div className="h-40 animate-pulse rounded-xl bg-[#F3F4F6]" />
        </div>
      ) : view === "home" || !check ? (
        renderHome()
      ) : view === "count" ? (
        renderCount(check)
      ) : (
        renderReview(check)
      )}

      <StartCheckDialog
        open={startOpen}
        departments={departments}
        countFor={(key, cat) =>
          register.assets.filter(
            (a) => a.status !== "LOST_OR_STOLEN" && (key === "" || (key === "0" ? !a.department : String(a.department?.id) === key)) && (!cat || a.category === cat)
          ).length
        }
        onClose={() => setStartOpen(false)}
        onStart={async (values) => {
          const result = await stock.start(values);
          setStartOpen(false);
          go({ view: "count", check: result.check.id, filter: "todo" });
          notify.success({
            title: `${result.check.name} started`,
            message: `${plural(result.counted, "asset")} to count. ${
              result.notified ? `${plural(result.notified, "department head")} notified by push and email.` : "You’re the only counter."
            }`,
          });
        }}
      />
    </PageOutline>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Dialogs                                  */
/* -------------------------------------------------------------------------- */

const StartCheckDialog = ({
  open,
  departments,
  countFor,
  onClose,
  onStart,
}: {
  open: boolean;
  departments: AssetDepartment[];
  countFor: (deptKey: string, category: string) => number;
  onClose: () => void;
  onStart: (values: { name: string; department_key: number | null; category: string; due_date: string }) => Promise<unknown>;
}) => {
  const [name, setName] = useState(defaultCheckName());
  const [dept, setDept] = useState("");
  const [cat, setCat] = useState("");
  const [due, setDue] = useState(addDaysKey(todayKey(), 14));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(defaultCheckName());
    setDept("");
    setCat("");
    setDue(addDaysKey(todayKey(), 14));
    setTried(false);
  }, [open]);

  const n = countFor(dept, cat);
  const errs = [!name.trim() && "Give the check a name.", !due && "Set a due date.", n === 0 && "No assets match this scope."].filter(Boolean) as string[];
  const submit = async () => {
    if (errs.length) return setTried(true);
    setBusy(true);
    await attempt(() => onStart({ name: name.trim(), department_key: dept === "" ? null : Number(dept), category: cat, due_date: due }));
    setBusy(false);
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      width={560}
      title="Start a stock check"
      subtitle={`${plural(n, "asset")} will be listed for counting. Lost or stolen items are left out.`}
      errorTitle="Almost there"
      errors={tried ? errs : []}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Start and notify counters", onClick: () => void submit(), tone: "primary" },
      ]}
    >
      <FieldGrid>
        <FullRow>
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} hasError={tried && !name.trim()} maxLength={191} />
          </Field>
        </FullRow>
        <Field label="Department">
          <SelectInput
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            options={[{ value: "", label: "All departments" }, { value: "0", label: "Store only" }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))]}
          />
          <span className="text-xs text-[#6B7280]">Each department head counts their own items.</span>
        </Field>
        <Field label="Category">
          <SelectInput
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
          />
        </Field>
        <Field label="Count by">
          <TextInput type="date" value={due} min={todayKey()} onChange={(e) => setDue(e.target.value)} hasError={tried && !due} />
          <span className="text-xs text-[#6B7280]">Counters get a reminder 3 days before.</span>
        </Field>
      </FieldGrid>
    </RequisitionDialog>
  );
};

const ExtraDialog = ({
  open,
  departments,
  defaultKey,
  allowedKeys,
  onClose,
  onSave,
}: {
  open: boolean;
  departments: AssetDepartment[];
  defaultKey: number | null;
  /** null = any department or the store (administrator). */
  allowedKeys: number[] | null;
  onClose: () => void;
  onSave: (values: { name: string; category: string; found_key: number; note: string }) => Promise<unknown>;
}) => {
  const [name, setName] = useState("");
  const [cat, setCat] = useState("");
  const [where, setWhere] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCat("");
    setWhere(defaultKey === null ? "" : String(defaultKey));
    setNote("");
    setTried(false);
  }, [open, defaultKey]);

  const options = [
    { value: "", label: "Choose where" },
    ...departments.filter((d) => !allowedKeys || allowedKeys.includes(d.id)).map((d) => ({ value: String(d.id), label: d.name })),
    ...(!allowedKeys ? [{ value: "0", label: "In the store" }] : []),
  ];
  const errs = [!name.trim() && "Say what the item is.", where === "" && "Choose where it was found."].filter(Boolean) as string[];
  const submit = async () => {
    if (errs.length) return setTried(true);
    setBusy(true);
    await attempt(() => onSave({ name: name.trim(), category: cat || "other", found_key: Number(where), note: note.trim() }));
    setBusy(false);
  };

  return (
    <RequisitionDialog
      open={open}
      onClose={onClose}
      busy={busy}
      width={520}
      title="Found something not listed"
      subtitle="Record it now. The administrator decides whether to add it to the register when reviewing."
      errorTitle="Almost there"
      errors={tried ? errs : []}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Record item", onClick: () => void submit(), tone: "primary" },
      ]}
    >
      <FieldGrid>
        <FullRow>
          <Field label="What is it?">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cordless drill (Bosch)" hasError={tried && !name.trim()} maxLength={191} />
          </Field>
        </FullRow>
        <Field label="Category">
          <SelectInput
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            options={[{ value: "", label: "Choose category" }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
          />
        </Field>
        <Field label="Found with">
          <SelectInput value={where} onChange={(e) => setWhere(e.target.value)} options={options} hasError={tried && where === ""} />
        </Field>
        <FullRow>
          <Field label="Note (optional)">
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where exactly, condition, any marks or serial number" />
          </Field>
        </FullRow>
      </FieldGrid>
    </RequisitionDialog>
  );
};

export default AssetReconciliation;

/** Deep link from stock-check notifications; open to department counters without Asset access. */
export const AssetCountPage = () => <AssetReconciliation />;
