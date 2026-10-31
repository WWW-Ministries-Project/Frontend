import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import {
  PillTabs,
  SelectInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { ALL_BRANCHES, buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { useUserStore } from "@/store/userStore";
import type {
  QueueData,
  QueueItem,
  WidgetResult,
  WorkspaceKey,
  WorkspaceRangeKey,
} from "@/utils/api/workspaces/interfaces";
import { fetchWorkspace } from "@/utils/api/workspaces/workspaceApi";
import { relativePath } from "@/utils/const";

import { QueueModal } from "./QueueModal";
import { actionsFor, PATHS, type ActionValues, type QueueAction } from "./queueActions";
import { useQueueAccess } from "./useQueueAccess";
import { SlotHeading, WidgetFrame } from "./WidgetFrame";
import { WORKSPACE_WIDGETS } from "./widgets";
import { downloadSheets, fileSafe, type ExportSheet } from "./wsExport";
import { greetingFor } from "./wsFormat";
import { WidgetCtxContext, widgetState, type WidgetCtx, type WidgetDef } from "./wsTypes";

const EYEBROW: Record<WorkspaceKey, string> = {
  prelate: "Prelate",
  admin: "Administrative head",
  finance: "Head of Finance",
  hod: "Head of department",
  generic: "Personal",
};

const RANGES: { key: WorkspaceRangeKey; label: string }[] = [
  { key: "WEEK", label: "Week" },
  { key: "MONTH", label: "Month" },
  { key: "QUARTER", label: "Quarter" },
  { key: "YEAR", label: "Year" },
];

/** Widgets that only make sense with (or without) "all branches". */
const BRANCH_ONLY: Record<string, "all" | "one"> = { "f-br": "all", "f-ch": "one" };

/** Columns from the grid's own width; a callback ref re-observes when the grid remounts. */
const useContainerColumns = () => {
  const observer = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1200 : window.innerWidth));
  const ref = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.current.observe(el);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);
  return { ref, cols: width >= 1000 ? 12 : width >= 640 ? 2 : 1, narrow: width < 640 };
};

const columnFor = (widget: WidgetDef, cols: number) => {
  if (widget.kind === "kpis" || cols === 1) return "1 / -1";
  if (cols === 12) return `span ${widget.span} / span ${widget.span}`;
  return widget.span >= 7 ? "1 / -1" : "span 1 / span 1";
};

export const WorkspaceView = ({ ws }: { ws: WorkspaceKey }) => {
  const navigate = useNavigate();
  const queueAccess = useQueueAccess();
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const userId = useUserStore((state) => state.id);
  const userName = useUserStore((state) => state.name);
  const allBranches = activeBranchId === ALL_BRANCHES;

  const [range, setRange] = useState<WorkspaceRangeKey>("WEEK");
  const [deptId, setDeptId] = useState("");
  const [attEvent, setAttEvent] = useState("");
  const [tabs, setTabs] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [modal, setModal] = useState<{ widgetId: string; itemId: string; focus?: string } | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const highlightTimer = useRef<number>();

  const query = useMemo(
    () => ({
      ws,
      range,
      ...(buildBranchQuery(activeBranchId) ?? {}),
      ...(ws === "hod" && deptId ? { department_id: deptId } : {}),
      ...(ws === "prelate" && attEvent ? { att_event: attEvent } : {}),
    }),
    [ws, range, activeBranchId, deptId, attEvent]
  );
  const { data: response, loading, error, refetch } = useFetch(fetchWorkspace, query, false, {
    silent: true,
  });
  const data = response?.data ?? null;

  // Acted-on items stay hidden until fresh data arrives without them.
  useEffect(() => setDone(new Set()), [data]);
  useEffect(() => {
    setTabs({});
    setModal(null);
  }, [activeBranchId, range, deptId]);
  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  const reload = useCallback(() => void refetch(), [refetch]);
  const { ref: gridRef, cols, narrow } = useContainerColumns();

  const departments = data?.departments ?? [];
  const department =
    departments.find((d) => String(d.id) === deptId) ?? departments[0] ?? null;

  const widgetsData = useMemo<Record<string, WidgetResult>>(() => data?.widgets ?? {}, [data]);
  const queueItems = useCallback(
    (widgetId: string): QueueItem[] => {
      const result = widgetsData[widgetId];
      return result?.ok ? ((result.data as QueueData)?.items ?? []) : [];
    },
    [widgetsData]
  );

  const liveItems = useCallback(
    (widgetId: string) => queueItems(widgetId).filter((item) => !done.has(item.id)),
    [queueItems, done]
  );

  const runAction = useCallback(
    async (widgetId: string, item: QueueItem, action: QueueAction, values: Omit<ActionValues, "userId">) => {
      if (!action.run) return;
      setBusyItem(item.id);
      try {
        await action.run(item, { ...values, userId });
        notify.success({ title: action.doneTitle, message: item.title });
        const list = liveItems(widgetId);
        const at = list.findIndex((x) => x.id === item.id);
        const rest = list.filter((x) => x.id !== item.id);
        const next = list.slice(at + 1).find((x) => x.id !== item.id) ?? rest[0] ?? null;
        setDone((prev) => new Set(prev).add(item.id));
        setModal((current) =>
          current && current.itemId === item.id ? (next ? { widgetId, itemId: next.id } : null) : current
        );
        void refetch();
      } catch (err) {
        notify.fromError(err, { title: action.failTitle });
      } finally {
        setBusyItem(null);
      }
    },
    [liveItems, refetch, userId]
  );

  const ctx: WidgetCtx = useMemo(
    () => ({
      ws,
      range: data?.range ?? null,
      allBranches,
      userId,
      department,
      go: (to: string) => navigate(to),
      tabOf: (id, fallback) => tabs[id] ?? fallback,
      setTab: (id, value) => setTabs((prev) => ({ ...prev, [id]: value })),
      isDone: (item) => done.has(item.id),
      openItem: (widgetId, item, actionKey) => setModal({ widgetId, itemId: item.id, focus: actionKey }),
      runAction: (widgetId, item, actionKey) => {
        const action = actionsFor(item, queueAccess).find((a) => a.key === actionKey);
        if (action) void runAction(widgetId, item, action, { note: "", assignee: null, followType: "" });
      },
      busyItem,
      attEvent,
      setAttEvent,
      refetch: reload,
    }),
    [ws, data?.range, allBranches, userId, department, navigate, tabs, done, runAction, busyItem, attEvent, reload, queueAccess]
  );

  const jump = (widgetId: string, tab?: string) => {
    if (tab) setTabs((prev) => ({ ...prev, [widgetId]: tab }));
    document.getElementById(`ws-${widgetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlight(widgetId);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlight(null), 1600);
  };

  /* Which widgets to lay out. */
  const defs = WORKSPACE_WIDGETS[ws].filter((widget) => {
    const only = BRANCH_ONLY[widget.id];
    if (only && (only === "all") !== allBranches) return false;
    if (widget.clientOnly) return true;
    if (!data) return !widget.slot; // skeleton layout before the first response
    const result = widgetsData[widget.id];
    if (!result) return false;
    if (widget.hideIfEmpty && result.ok && widget.isEmpty?.(result.data, ctx)) return false;
    return true;
  });

  const exportOf = (widget: WidgetDef): ExportSheet[] => {
    const result = widgetsData[widget.id];
    if (!widget.exportSheet || !result?.ok) return [];
    const sheets = widget.exportSheet(result.data, ctx);
    return Array.isArray(sheets) ? sheets : [sheets];
  };
  const rangeLabel = data?.range?.label ?? RANGES.find((r) => r.key === range)?.label ?? "";
  const doExport = async (name: string, sheets: ExportSheet[]) => {
    if (!sheets.length) {
      notify.info({ title: "Nothing to export", message: "There is no data in this view yet." });
      return;
    }
    try {
      await downloadSheets(fileSafe(`${name} - ${rangeLabel}`), sheets);
    } catch (err) {
      notify.fromError(err, { title: "Couldn't export the spreadsheet" });
    }
  };

  /* Needs-you strip, less what was handled here. */
  const needs = (data?.needs ?? [])
    .map((need) => {
      const handled = need.tab
        ? queueItems(need.widget).filter((item) => item.kind === need.tab && done.has(item.id)).length
        : 0;
      return { ...need, count: Math.max(0, need.count - handled) };
    })
    .filter((need) => need.count > 0);

  /* Modal item. */
  const modalList = modal ? liveItems(modal.widgetId) : [];
  const modalIndex = modal ? modalList.findIndex((item) => item.id === modal.itemId) : -1;
  const modalItem = modalIndex >= 0 ? modalList[modalIndex] : null;

  const now = new Date();
  const dateLabel = now
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
  const name = data?.greeting_name || userName?.split(" ")[0] || "";
  const question =
    ws === "prelate"
      ? "Is the church healthy and growing?"
      : ws === "admin"
        ? "Is everything running?"
        : ws === "finance"
          ? "Where is the money, and what’s waiting on me?"
          : ws === "hod"
            ? `How is ${department?.name ?? "your department"}, and what do I need to do?`
            : `Here’s what’s happening for you ${rangeLabel ? rangeLabel.toLowerCase() : "this week"}.`;

  const noDepartment = ws === "hod" && !!data && departments.length === 0;
  let slotShown = false;

  return (
    <WidgetCtxContext.Provider value={ctx}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
            <p className="text-xs font-semibold tracking-[0.04em] text-gray-500">
              {dateLabel} · {EYEBROW[ws].toUpperCase()}
            </p>
            <h1 className="text-xl font-semibold leading-8 text-primary sm:text-2xl">
              {greetingFor(now)}
              {name ? `, ${name}` : ""}
            </h1>
            <p className="text-base leading-6 text-gray-600">{question}</p>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-2">
            {ws === "hod" && departments.length > 1 ? (
              <SelectInput
                aria-label="Department"
                value={String(department?.id ?? "")}
                onChange={(event) => setDeptId(event.target.value)}
                options={departments.map((d) => ({ value: String(d.id), label: `Leading: ${d.name}` }))}
                className="max-w-full"
              />
            ) : null}
            <PillTabs
              ariaLabel="Time range"
              size="sm"
              tabs={RANGES}
              value={range}
              onChange={setRange}
            />
            {ws === "finance" ? (
              <>
                <UiButton
                  tone="secondary"
                  onClick={() =>
                    void doExport(
                      "Finance workspace",
                      defs.flatMap((widget) => exportOf(widget))
                    )
                  }
                >
                  Export
                </UiButton>
                <UiButton tone="primary" onClick={() => navigate(PATHS.financeNew)}>
                  New weekly record
                </UiButton>
              </>
            ) : null}
            {ws === "hod" ? (
              <UiButton tone="primary" onClick={() => navigate(PATHS.requisitionNew)}>
                New requisition
              </UiButton>
            ) : null}
            {ws === "generic" ? (
              <UiButton tone="primary" onClick={() => navigate(relativePath.member.giving)}>
                Give
              </UiButton>
            ) : null}
          </div>
        </header>

        <section
          aria-label="Needs you"
          className={
            "flex items-center gap-2 overflow-x-auto rounded-xl border border-lightGray bg-white px-4 py-3 " +
            (narrow ? "flex-nowrap" : "flex-wrap")
          }
        >
          <span className="flex-shrink-0 pr-1 text-xs font-semibold tracking-[0.04em] text-gray-500">NEEDS YOU</span>
          {!data && loading ? (
            [1, 2, 3].map((k) => <span key={k} className="h-10 w-44 flex-shrink-0 animate-pulse rounded-full bg-gray-100" />)
          ) : needs.length ? (
            needs.map((need) => (
              <button
                key={need.key}
                type="button"
                onClick={() => jump(need.widget, need.tab)}
                className="inline-flex min-h-10 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-lightGray bg-inputBackground py-1.5 pl-3.5 pr-1.5 text-sm font-medium text-primary hover:border-gray-500"
              >
                {need.label}
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-white">
                  {need.count}
                </span>
              </button>
            ))
          ) : data ? (
            <span className="inline-flex items-center gap-2 font-medium text-green-700">
              <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-xs">
                ✓
              </span>
              You’re all caught up. Nothing needs you right now.
            </span>
          ) : null}
        </section>

        {!data && error && !loading ? (
          <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-lightGray bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold text-primary">Couldn’t load this workspace</p>
            <p className="text-gray-600">Check your connection and try again.</p>
            <UiButton tone="secondary" onClick={reload}>
              Retry
            </UiButton>
          </div>
        ) : noDepartment ? (
          <div role="status" className="flex flex-col items-center gap-2 rounded-xl border border-lightGray bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold text-primary">You don’t lead a department yet</p>
            <p className="max-w-[460px] text-gray-600">
              Once you’re made head of a department, its team, requests and report show here.
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className={"grid items-start gap-4 transition-opacity " + (loading && data ? "opacity-70" : "")}
            style={{
              gridTemplateColumns:
                cols === 12 ? "repeat(12, minmax(0, 1fr))" : cols === 2 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
            }}
          >
            {defs.map((widget) => {
              const result = widgetsData[widget.id];
              const slot = !slotShown && widget.slot ? widget.slot(ctx) : null;
              if (slot) slotShown = true;
              const exportable =
                ws === "finance" &&
                !!widget.exportSheet &&
                widget.kind !== "kpis" &&
                widgetState(widget, result, loading, ctx) === "ready";
              return (
                <WidgetSlot key={widget.id} slot={slot}>
                  <WidgetFrame
                    widget={widget}
                    result={result}
                    loading={loading}
                    ctx={ctx}
                    gridColumn={columnFor(widget, cols)}
                    highlighted={highlight === widget.id}
                    onExport={
                      exportable
                        ? () =>
                            void doExport(
                              typeof widget.title === "string" ? widget.title : widget.id,
                              exportOf(widget)
                            )
                        : undefined
                    }
                  />
                </WidgetSlot>
              );
            })}
          </div>
        )}
      </div>

      {modalItem ? (
        <QueueModal
          item={modalItem}
          index={modalIndex}
          total={modalList.length}
          busy={busyItem === modalItem.id}
          focusAction={modal?.focus}
          onPrev={() => modalIndex > 0 && setModal({ widgetId: modal!.widgetId, itemId: modalList[modalIndex - 1].id })}
          onNext={() =>
            modalIndex < modalList.length - 1 &&
            setModal({ widgetId: modal!.widgetId, itemId: modalList[modalIndex + 1].id })
          }
          onClose={() => setModal(null)}
          onAction={(action, values) => void runAction(modal!.widgetId, modalItem, action, values)}
          go={(to) => navigate(to)}
        />
      ) : null}
    </WidgetCtxContext.Provider>
  );
};

const WidgetSlot = ({
  slot,
  children,
}: {
  slot: { title: string; sub: string; tag?: string } | null;
  children: React.ReactNode;
}) => (
  <>
    {slot ? <SlotHeading {...slot} /> : null}
    {children}
  </>
);
