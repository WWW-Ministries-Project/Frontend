import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useAuth } from "@/context/AuthWrapper";
import type { AssetRow, AssetStatus } from "@/utils/api/assets/interfaces";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import { confirmAction } from "../../utils/helperFunctions";
import { KpiButton } from "../AppointmentsManagement/Components/appointmentUi";
import type { CommDialogButton } from "../ChurchCommunication/ui/commUi";
import { WIDE_TABLE_MIN, useViewportWidth } from "../ChurchCommunication/ui/commUtils";
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
import { AssetDrawer } from "./Components/AssetDrawer";
import { AssetFormDialog, RepairDialog, StatusDialog } from "./Components/AssetDialogs";
import {
  CATEGORIES,
  OUT_OF_USE,
  STATUS,
  ago,
  categoryLabel,
  checkStats,
  dayOf,
  daysSince,
  differenceCount,
  downloadCsv,
  dueInfo,
  fmtD,
  fmtS,
  initials,
  money,
  moneyS,
  pct,
  plural,
  subOf,
  valueOf,
} from "./utils/assetModel";
import { useAssetsData, useStockChecks, useToday } from "./utils/useAssetsData";

type Tab = "all" | AssetStatus;
type Filters = { cat: string; dept: string; from: string; to: string };
const NO_FILTERS: Filters = { cat: "", dept: "", from: "", to: "" };
const PAGE = 30;
const VIEW_KEY = "wwm-assets-view";

type DialogState =
  | { kind: "form"; asset: AssetRow | null }
  | { kind: "status"; ids: number[]; status: AssetStatus | null }
  | { kind: "repair"; ids: number[]; skipped: string[] }
  | null;

type Attention = {
  key: string;
  pill: { label: string; tone: "danger" | "warning" | "success" | "info" | "neutral" };
  title: string;
  text: string;
  actions: { label: string; onClick: () => void; primary?: boolean }[];
  kind: "lost" | "repairLong" | "idle" | "check" | "noReq" | "approved" | "rejected";
};

const readView = (): "table" | "cards" => {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "cards" ? "cards" : "table";
  } catch {
    return "table";
  }
};

const Initials = ({ name, className }: { name: string; className?: string }) => (
  <span
    className={cn(
      "flex flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-background text-xs font-semibold text-gray-600",
      className
    )}
  >
    {initials(name)}
  </span>
);

const AssetManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const width = useViewportWidth();
  const wide = width >= WIDE_TABLE_MIN;
  const today = useToday();

  const data = useAssetsData();
  const { assets, departments, viewer, staleDays } = data;
  const canManage = viewer.can_manage;
  const stock = useStockChecks();
  const active = stock.checks.find((c) => c.status === "open") ?? null;

  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setViewState] = useState<"table" | "cards">(readView);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<number[]>([]);
  const [attAll, setAttAll] = useState(false);
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [drawerVersion, setDrawerVersion] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);

  const setView = (next: "table" | "cards") => {
    setViewState(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Per-viewer convenience only.
    }
  };
  const pickTab = (next: Tab) => {
    setTab(next);
    setLimit(PAGE);
  };

  const byId = (id: number) => assets.find((a) => a.id === id);
  const drawerAsset = drawerId ? byId(drawerId) ?? null : null;
  const afterChange = () => setDrawerVersion((v) => v + 1);

  /* --------------------------------- lists -------------------------------- */

  const term = q.trim().toLowerCase();
  const base = useMemo(
    () =>
      assets.filter((a) => {
        const bought = dayOf(a.date_purchased);
        return (
          (!filters.cat || a.category === filters.cat) &&
          (!filters.dept || (filters.dept === "_store" ? !a.department : String(a.department?.id) === filters.dept)) &&
          (!filters.from || bought >= filters.from) &&
          (!filters.to || bought <= filters.to) &&
          (!term ||
            `${a.name} ${a.code} ${a.supplier ?? ""} ${a.department?.name ?? ""} ${categoryLabel(a.category)}`
              .toLowerCase()
              .includes(term))
        );
      }),
    [assets, filters, term]
  );
  const list = useMemo(
    () =>
      (tab === "all" ? base : base.filter((a) => a.status === tab))
        .slice()
        .sort((x, y) => dayOf(y.date_purchased).localeCompare(dayOf(x.date_purchased))),
    [base, tab]
  );
  const shown = list.slice(0, limit);
  const filterCount = (Object.keys(filters) as (keyof Filters)[]).filter((k) => filters[k]).length;
  const cnt = (status: AssetStatus) => assets.filter((a) => a.status === status);

  /* -------------------------------- actions ------------------------------- */

  const openStatus = (ids: number[], status: AssetStatus | null) => setDialog({ kind: "status", ids, status });

  const openRepair = (ids: number[]) => {
    const ok = assets.filter((a) => ids.includes(a.id) && a.status === "NEEDS_REPAIR" && !a.repair_requisition);
    const skip = assets.filter((a) => ids.includes(a.id) && !ok.includes(a)).map((a) => a.name);
    if (!ok.length) {
      notify.warning({
        title: "Nothing to raise",
        message: skip.length
          ? "Only assets marked “Needs repair” without an open repair requisition can be included."
          : "Select assets that need repair.",
      });
      return;
    }
    setDrawerId(null);
    setDialog({ kind: "repair", ids: ok.map((a) => a.id), skipped: skip });
  };

  const confirmLost = (a: AssetRow) =>
    confirmAction({
      title: `Confirm ${a.name} as lost?`,
      points: [
        "The search is closed and it leaves “Needs your attention”.",
        "It stays on the register as lost, with its history, and still counts in loss figures in Analytics.",
        "If it turns up later, open it and change the status back.",
      ],
      confirmLabel: "Confirm as lost",
      cancelLabel: "Keep searching",
      tone: "danger",
      onConfirm: async () => {
        const previous = await data.confirmLost(a.id);
        afterChange();
        notify.success({
          title: "Confirmed as lost",
          message: `${a.name} left Needs your attention. You’ll still find it under Lost or stolen.`,
          undo: async () => {
            await data.restore([previous]);
            afterChange();
          },
        });
      },
    });

  const remove = (a: AssetRow) =>
    confirmAction({
      title: `Delete ${a.name}?`,
      points: [
        `${a.code} and its history are removed from the register.`,
        "If it was lost, stolen or thrown away, mark it that way instead so the record stays.",
      ],
      confirmLabel: "Delete asset",
      cancelLabel: "Keep it",
      tone: "danger",
      onConfirm: async () => {
        await data.remove(a.id);
        setDrawerId(null);
        notify.success({ title: "Asset deleted", message: `${a.name} · ${a.code}` });
      },
    });

  const raiseAgain = async (a: AssetRow) => {
    try {
      const fresh = await data.clearRepair(a.id);
      afterChange();
      setDialog({ kind: "repair", ids: [fresh.id], skipped: [] });
    } catch {
      // Toast already shown.
    }
  };

  const exportRows = (rows: AssetRow[], name: string) => {
    downloadCsv(`${name}-${today}.csv`, [
      ["Asset ID", "Name", "Category", "Status", "Department", "Date assigned", "Date purchased", "Supplier", "Amount (GHS)", "Status since", "Note", "Description"],
      ...rows.map((a) => [
        a.code,
        a.name,
        categoryLabel(a.category),
        STATUS[a.status].label,
        a.department?.name ?? "",
        dayOf(a.date_assigned),
        dayOf(a.date_purchased),
        a.supplier ?? "",
        a.price.toFixed(2),
        dayOf(a.status_since),
        a.status_note ?? "",
        a.description ?? "",
      ]),
    ]);
    notify.success({ title: "CSV downloaded", message: plural(rows.length, "asset") + "." });
  };

  /* ------------------------------- attention ------------------------------ */

  const attention = useMemo<Attention[]>(() => {
    if (!canManage) return [];
    const out: Attention[] = [];
    if (active) {
      const st = checkStats(active);
      const due = dueInfo(active, today);
      const diffs = differenceCount(st);
      out.push({
        key: `check-${active.id}`,
        kind: "check",
        pill: { label: "Stock check", tone: due.overdue ? "danger" : "info" },
        title: `${active.name} · ${st.done} of ${st.expected} counted`,
        text: `${due.overdue ? `Overdue since ${fmtD(active.due_date)}` : `Due ${fmtD(active.due_date)}, ${plural(due.left, "day")} left`}. ${plural(diffs, "difference")} found so far.`,
        actions: [
          { label: "Continue counting", onClick: () => navigate(`/home/assets/reconciliation?check=${active.id}&view=count`), primary: true },
          { label: "Open", onClick: () => navigate("/home/assets/reconciliation") },
        ],
      });
    }
    const nr = assets.filter((a) => a.status === "NEEDS_REPAIR");
    const noReq = nr.filter((a) => !a.repair_requisition);
    if (noReq.length) {
      out.push({
        key: "noReq",
        kind: "noReq",
        pill: { label: "Needs repair", tone: "warning" },
        title: noReq.length === 1 ? `${noReq[0].name} needs repair` : `${noReq.length} assets need repair and have no requisition`,
        text: `${noReq
          .slice(0, 4)
          .map((a) => a.name + (a.department ? ` (${a.department.name})` : ""))
          .join(", ")}${noReq.length > 4 ? ` and ${noReq.length - 4} more` : ""}. Raise a requisition to get the repair approved and paid for.`,
        actions: [
          { label: noReq.length === 1 ? "Raise requisition" : `Raise requisition for all ${noReq.length}`, onClick: () => openRepair(noReq.map((a) => a.id)), primary: true },
          { label: "Show them", onClick: () => pickTab("NEEDS_REPAIR") },
        ],
      });
    }
    nr.filter((a) => a.repair_requisition?.status === "APPROVED").forEach((a) =>
      out.push({
        key: `appr-${a.id}`,
        kind: "approved",
        pill: { label: "Repair approved", tone: "success" },
        title: `${a.name} · ${a.repair_requisition!.generated_id} approved`,
        text: "Funds are approved. Send it to the repairer and mark it under repair.",
        actions: [
          { label: "Mark under repair", onClick: () => openStatus([a.id], "OUT_OF_REPAIRS"), primary: true },
          { label: "View", onClick: () => setDrawerId(a.id) },
        ],
      })
    );
    nr.filter((a) => a.repair_requisition?.status === "REJECTED").forEach((a) =>
      out.push({
        key: `rej-${a.id}`,
        kind: "rejected",
        pill: { label: "Repair rejected", tone: "danger" },
        title: `${a.name} · ${a.repair_requisition!.generated_id} rejected`,
        text: "Raise a new requisition with changes, or decide it’s beyond repair.",
        actions: [
          { label: "Raise again", onClick: () => void raiseAgain(a) },
          { label: "Beyond repair", onClick: () => openStatus([a.id], "NOT_FIXABLE") },
        ],
      })
    );
    cnt("LOST_OR_STOLEN")
      .filter((a) => !a.lost_confirmed_at)
      .sort((x, y) => dayOf(y.status_since).localeCompare(dayOf(x.status_since)))
      .forEach((a) =>
        out.push({
          key: `lost-${a.id}`,
          kind: "lost",
          pill: { label: "Lost or stolen", tone: "danger" },
          title: `${a.name} · ${a.code}`,
          text: `${a.department ? `${a.department.name} · ` : ""}reported ${fmtD(a.status_since)} (${ago(a.status_since, today)} ago).${a.status_note ? ` ${a.status_note}` : ""} Worth ${money(a.price)}.`,
          actions: [
            { label: "Mark found", onClick: () => openStatus([a.id], a.department ? "ASSIGNED" : "UNASSIGNED") },
            { label: "Confirm as lost", onClick: () => confirmLost(a) },
            { label: "View", onClick: () => setDrawerId(a.id) },
          ],
        })
      );
    cnt("OUT_OF_REPAIRS")
      .filter((a) => daysSince(a.status_since, today) > staleDays)
      .sort((x, y) => dayOf(x.status_since).localeCompare(dayOf(y.status_since)))
      .forEach((a) =>
        out.push({
          key: `long-${a.id}`,
          kind: "repairLong",
          pill: { label: "Long repair", tone: "warning" },
          title: `${a.name} has been under repair for ${ago(a.status_since, today)}`,
          text: `${a.department ? `${a.department.name} · ` : ""}${a.status_note || "No repair note."}`,
          actions: [
            { label: "Back in use", onClick: () => openStatus([a.id], a.department ? "ASSIGNED" : "UNASSIGNED") },
            { label: "Beyond repair", onClick: () => openStatus([a.id], "NOT_FIXABLE") },
          ],
        })
      );
    cnt("UNASSIGNED")
      .filter((a) => daysSince(a.status_since, today) > 90)
      .sort((x, y) => y.price - x.price)
      .forEach((a) =>
        out.push({
          key: `idle-${a.id}`,
          kind: "idle",
          pill: { label: "Idle", tone: "neutral" },
          title: `${a.name} has been in the store for ${ago(a.status_since, today)}`,
          text: `${money(a.price)} of equipment no department is using. Assign it or consider selling it.`,
          actions: [
            { label: "Assign", onClick: () => openStatus([a.id], "ASSIGNED") },
            { label: "View", onClick: () => setDrawerId(a.id) },
          ],
        })
      );
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, active, canManage, today, staleDays]);

  const attentionNote = (() => {
    const n = (kind: Attention["kind"]) => attention.filter((a) => a.kind === kind).length;
    const noReq = assets.filter((a) => a.status === "NEEDS_REPAIR" && !a.repair_requisition).length;
    return (
      [
        n("lost") && `${n("lost")} lost and still being searched for`,
        n("repairLong") && `${n("repairLong")} under repair over ${staleDays} days`,
        n("idle") && `${n("idle")} idle in the store over 3 months`,
        active && "a stock check in progress",
        noReq && `${noReq} needing a repair requisition`,
        n("approved") && `${n("approved")} repairs approved`,
      ]
        .filter(Boolean)
        .join(" · ") + "."
    );
  })();

  /* ------------------------------ derived bits ---------------------------- */

  const out = assets.filter((a) => OUT_OF_USE.includes(a.status));
  const asg = cnt("ASSIGNED");
  const sto = cnt("UNASSIGNED");

  const tabs = (
    [
      ["all", "All"],
      ["ASSIGNED", "Assigned"],
      ["UNASSIGNED", "In store"],
      ["NEEDS_REPAIR", "Needs repair"],
      ["OUT_OF_REPAIRS", "Under repair"],
      ["NOT_FIXABLE", "Beyond repair"],
      ["LOST_OR_STOLEN", "Lost or stolen"],
    ] as [Tab, string][]
  ).map(([key, label]) => {
    const n = key === "all" ? 0 : base.filter((a) => a.status === key).length;
    return { key, label, count: n > 0 ? n : null };
  });

  const selectedRows = assets.filter((a) => selected.includes(a.id));
  const toggle = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => {
    const all = shown.length > 0 && shown.every((a) => selected.includes(a.id));
    setSelected((prev) => (all ? prev.filter((id) => !shown.some((a) => a.id === id)) : Array.from(new Set([...prev, ...shown.map((a) => a.id)]))));
  };

  const statusCell = (a: AssetRow) => {
    const sub = subOf(a, today, staleDays);
    return (
      <div className="flex flex-col items-start gap-1">
        <Pill tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Pill>
        <span className="text-xs" style={{ color: sub.color }}>
          {sub.text}
        </span>
      </div>
    );
  };

  const drawerButtons = (a: AssetRow): CommDialogButton[] => {
    if (!canManage) return [];
    const b: CommDialogButton[] = [];
    if (viewer.can_delete) b.push({ label: "Delete", onClick: () => remove(a), tone: "danger" });
    b.push({ label: "Edit", onClick: () => setDialog({ kind: "form", asset: a }) });
    if (a.status === "ASSIGNED") b.push({ label: "Reassign", onClick: () => openStatus([a.id], "ASSIGNED") });
    const r = a.repair_requisition;
    if (a.status === "NEEDS_REPAIR" && !r) b.push({ label: "Raise repair requisition", onClick: () => openRepair([a.id]), tone: "primary" });
    if (r) b.push({ label: "Open requisition", onClick: () => navigate(`/home/requests/${window.btoa(String(r.id))}`) });
    if (a.status === "NEEDS_REPAIR" && r?.status === "APPROVED") b.push({ label: "Mark under repair", onClick: () => openStatus([a.id], "OUT_OF_REPAIRS"), tone: "primary" });
    if (a.status === "LOST_OR_STOLEN" && !a.lost_confirmed_at) b.push({ label: "Confirm as lost", onClick: () => confirmLost(a) });
    b.push({
      label: a.status === "UNASSIGNED" ? "Assign" : "Change status",
      onClick: () => openStatus([a.id], a.status === "UNASSIGNED" ? "ASSIGNED" : null),
      tone: "primary",
    });
    return b;
  };

  const statusAssets = dialog?.kind === "status" ? assets.filter((a) => dialog.ids.includes(a.id)) : [];
  const repairAssets = dialog?.kind === "repair" ? assets.filter((a) => dialog.ids.includes(a.id)) : [];

  /* --------------------------------- render ------------------------------- */

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Assets"
        subtitle="Everything the church owns, who has it, and what needs fixing or replacing."
        actions={
          <>
            <FilterToggleButton open={showFilters} count={filterCount} onClick={() => setShowFilters((v) => !v)} />
            <UiButton onClick={() => exportRows(list, `assets-${tab === "all" ? "all" : STATUS[tab].label.toLowerCase().replace(/ /g, "-")}`)}>
              Export CSV
            </UiButton>
            {canManage && (
              <UiButton tone="primary" onClick={() => setDialog({ kind: "form", asset: null })}>
                Add asset
              </UiButton>
            )}
          </>
        }
      />

      {showFilters && (
        <FilterPanel
          title="Refine assets"
          helper="Filters combine with the search and status tabs."
          onReset={() => {
            setFilters(NO_FILTERS);
            setQ("");
          }}
          resetDisabled={!filterCount && !q}
        >
          <Field label="Category">
            <SelectInput
              value={filters.cat}
              onChange={(e) => setFilters({ ...filters, cat: e.target.value })}
              options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
            />
          </Field>
          <Field label="Held by">
            <SelectInput
              value={filters.dept}
              onChange={(e) => setFilters({ ...filters, dept: e.target.value })}
              options={[
                { value: "", label: "Anyone" },
                { value: "_store", label: "Not assigned" },
                ...departments.map((d) => ({ value: String(d.id), label: d.name })),
              ]}
            />
          </Field>
          <Field label="Bought from">
            <TextInput type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </Field>
          <Field label="Bought to">
            <TextInput type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </Field>
        </FilterPanel>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <KpiButton label="On the register" value={assets.length} sub={`${moneyS(valueOf(assets))} purchase value`} onClick={() => pickTab("all")} />
        <KpiButton label="Assigned" value={asg.length} sub={`${pct(asg.length, assets.length)} of assets in use by a department`} onClick={() => pickTab("ASSIGNED")} />
        <KpiButton
          label="In store"
          value={sto.length}
          sub={sto.length ? `Free to assign · ${moneyS(valueOf(sto))}` : "Nothing idle"}
          onClick={() => pickTab("UNASSIGNED")}
        />
        <KpiButton
          label="Out of use"
          value={out.length}
          sub={`${moneyS(valueOf(out))} · ${cnt("NEEDS_REPAIR").length} need repair, ${cnt("OUT_OF_REPAIRS").length} under repair, ${cnt("NOT_FIXABLE").length} beyond, ${cnt("LOST_OR_STOLEN").length} lost`}
          subTone={out.length ? "danger" : "muted"}
          alert={out.length > 0}
          onClick={() => pickTab("OUT_OF_REPAIRS")}
        />
      </div>

      {attention.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-primary">Needs your attention</h2>
              <p className="text-sm text-gray-700">{attentionNote}</p>
            </div>
            {attention.length > 4 && (
              <UiButton size="sm" onClick={() => setAttAll((v) => !v)}>
                {attAll ? "Show fewer" : `Show all ${attention.length}`}
              </UiButton>
            )}
          </div>
          {(attAll ? attention : attention.slice(0, 4)).map((item) => (
            <div key={item.key} className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 last:border-b-0">
              <Pill tone={item.pill.tone} className="flex-shrink-0">
                {item.pill.label}
              </Pill>
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                <p className="text-sm font-semibold text-primary">{item.title}</p>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.actions.map((action) => (
                  <UiButton key={action.label} size="sm" tone={action.primary ? "primary" : "secondary"} onClick={action.onClick}>
                    {action.label}
                  </UiButton>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillTabs tabs={tabs} value={tab} onChange={pickTab} ariaLabel="Asset status" />
          <div className="flex max-w-[480px] flex-[1_1_320px] items-center gap-2">
            <SearchInput
              value={q}
              onChange={(value) => {
                setQ(value);
                setLimit(PAGE);
              }}
              placeholder="Search name, ID, supplier"
              ariaLabel="Search assets"
            />
            {wide && (
              <div role="radiogroup" aria-label="Layout" className="flex flex-shrink-0 gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1">
                {(["table", "cards"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={view === key}
                    onClick={() => setView(key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm text-primary",
                      view === key ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "font-normal hover:bg-white/70"
                    )}
                  >
                    {key === "table" ? "Table" : "Cards"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {canManage && selectedRows.length > 0 && (
          <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-primary px-4 py-3 text-white">
            <span className="flex-[1_1_120px] text-sm font-semibold">{selectedRows.length} selected</span>
            {[
              { label: "Raise repair requisition", onClick: () => openRepair(selectedRows.map((a) => a.id)) },
              { label: "Assign to department", onClick: () => openStatus(selectedRows.map((a) => a.id), "ASSIGNED") },
              { label: "Change status", onClick: () => openStatus(selectedRows.map((a) => a.id), "UNASSIGNED") },
              { label: "Export selected", onClick: () => exportRows(selectedRows, "assets-selected") },
              { label: "Clear", onClick: () => setSelected([]) },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={b.onClick}
                className="min-h-9 whitespace-nowrap rounded-lg border border-white/40 bg-transparent px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
              >
                {b.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-600">
          {plural(list.length, "asset")} · {money(valueOf(list))} purchase value{term || filterCount ? " · filtered" : ""}
        </p>

        {wide && view === "table" ? (
          <GridTable<AssetRow>
            rows={shown}
            getRowId={(a) => String(a.id)}
            loading={!data.loaded}
            minWidth="1100px"
            selectable={canManage}
            selectedIds={selected.map(String)}
            onToggleRow={(id) => toggle(Number(id))}
            onToggleAll={toggleAll}
            onRowClick={(a) => setDrawerId(a.id)}
            actionsWidth="72px"
            renderActions={(a) => (
              <UiButton size="sm" onClick={() => setDrawerId(a.id)}>
                View
              </UiButton>
            )}
            columns={[
              {
                key: "asset",
                header: "Asset",
                width: "minmax(240px,2fr)",
                render: (a) => (
                  <div className="flex min-w-0 items-center gap-3">
                    {a.photo ? (
                      <img src={a.photo} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg border border-gray-200 object-cover" />
                    ) : (
                      <Initials name={a.name} className="h-10 w-10" />
                    )}
                    <CellText main={a.name} sub={a.code} strong />
                  </div>
                ),
              },
              { key: "cat", header: "Category", width: "minmax(140px,1fr)", render: (a) => <span className="text-gray-600">{categoryLabel(a.category)}</span> },
              {
                key: "dept",
                header: "Assigned to",
                width: "minmax(170px,1.2fr)",
                render: (a) => (
                  <CellText
                    main={a.department?.name || "Not assigned"}
                    sub={a.status === "ASSIGNED" && a.date_assigned ? `Since ${fmtS(a.date_assigned)}, ${dayOf(a.date_assigned).slice(0, 4)}` : undefined}
                  />
                ),
              },
              { key: "bought", header: "Purchased", width: "minmax(160px,1.1fr)", render: (a) => <CellText main={fmtD(a.date_purchased)} sub={a.supplier || "—"} /> },
              { key: "price", header: "Value", width: "130px", render: (a) => <span className="font-semibold">{money(a.price)}</span> },
              { key: "status", header: "Status", width: "minmax(170px,1.2fr)", render: statusCell },
            ]}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
            {!data.loaded &&
              [0, 1, 2].map((n) => <div key={n} className="h-[260px] animate-pulse rounded-xl bg-gray-100" />)}
            {shown.map((a) => {
              const on = selected.includes(a.id);
              const sub = subOf(a, today, staleDays);
              return (
                <div
                  key={a.id}
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]",
                    on ? "border-primary" : "border-lightGray"
                  )}
                >
                  <button type="button" onClick={() => setDrawerId(a.id)} className="flex flex-col bg-transparent p-0 text-left text-sm text-primary">
                    {a.photo ? (
                      <img src={a.photo} alt="" className="h-[120px] w-full border-b border-gray-200 object-cover" />
                    ) : (
                      <div className="flex h-[120px] flex-col items-center justify-center gap-1 border-b border-gray-200 bg-background">
                        <span className="text-xl font-semibold text-gray-600">{initials(a.name)}</span>
                        <span className="text-xs text-gray-500">{categoryLabel(a.category)}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{a.name}</p>
                          <p className="text-xs text-gray-500">{a.code}</p>
                        </div>
                        <Pill tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Pill>
                      </div>
                      <p className="text-gray-600">{a.department?.name || "Not assigned"}</p>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs" style={{ color: sub.color }}>
                          {sub.text}
                        </span>
                        <span className="whitespace-nowrap font-semibold">{money(a.price)}</span>
                      </div>
                    </div>
                  </button>
                  {canManage && (
                    <label className="absolute left-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-lightGray bg-white">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(a.id)}
                        aria-label={`Select ${a.name} ${a.code}`}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {list.length > limit && (
          <UiButton className="self-center" onClick={() => setLimit(limit + PAGE)}>
            Show {Math.min(PAGE, list.length - limit)} more
          </UiButton>
        )}
        {data.loaded && !list.length && (
          <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">
            {term || filterCount
              ? "Nothing matches these filters. Try clearing the search or resetting filters."
              : tab === "LOST_OR_STOLEN"
                ? "Nothing is recorded as lost or stolen."
                : canManage
                  ? "No assets here yet. Add the first one to start the register."
                  : "No assets here yet."}
          </p>
        )}
      </div>

      <AssetDrawer
        asset={drawerAsset}
        today={today}
        staleDays={staleDays}
        version={drawerVersion}
        loadHistory={data.loadHistory}
        buttons={drawerAsset ? drawerButtons(drawerAsset) : []}
        onClose={() => setDrawerId(null)}
      />

      <AssetFormDialog
        open={dialog?.kind === "form"}
        asset={dialog?.kind === "form" ? dialog.asset : null}
        departments={departments}
        onClose={() => setDialog(null)}
        onSave={async (values) => {
          const editing = dialog?.kind === "form" ? dialog.asset : null;
          const row = await data.save({ ...(editing ? { id: editing.id } : {}), ...values });
          setDialog(null);
          afterChange();
          if (editing) {
            setDrawerId(row.id);
            notify.success({ title: "Asset updated", message: row.name });
          } else {
            setTab("all");
            setQ("");
            notify.success({
              title: `Asset added as ${row.code}`,
              message: `${row.name} is now on the register.`,
              action: { label: "View", onClick: () => setDrawerId(row.id) },
            });
          }
        }}
      />

      <StatusDialog
        open={dialog?.kind === "status"}
        assets={statusAssets}
        initialStatus={dialog?.kind === "status" ? dialog.status : null}
        departments={departments}
        onClose={() => setDialog(null)}
        onSave={async (values) => {
          const ids = dialog?.kind === "status" ? dialog.ids : [];
          const result = await data.updateStatus({ ids, ...values });
          setDialog(null);
          setSelected([]);
          afterChange();
          const dept = departments.find((d) => d.id === values.department_id)?.name;
          const text =
            values.status === "ASSIGNED"
              ? `Assigned to ${dept}`
              : values.status === "UNASSIGNED"
                ? "Returned to the store"
                : `Marked ${STATUS[values.status].label.toLowerCase()}`;
          notify.success({
            title: ids.length > 1 ? `${ids.length} assets updated` : text,
            message: ids.length > 1 ? `${text}.` : result.assets[0]?.name,
            undo: async () => {
              await data.restore(result.previous);
              afterChange();
            },
          });
        }}
      />

      <RepairDialog
        open={dialog?.kind === "repair"}
        assets={repairAssets}
        skipped={dialog?.kind === "repair" ? dialog.skipped : []}
        departments={departments}
        signerName={String(user?.name ?? "")}
        onClose={() => setDialog(null)}
        onSubmit={async (values) => {
          const result = await data.raiseRepair({ asset_ids: repairAssets.map((a) => a.id), ...values });
          setDialog(null);
          setSelected([]);
          afterChange();
          const made = result.requisitions;
          notify.success({
            title: made.length === 1 ? `Requisition ${made[0].generated_id} submitted` : `${made.length} requisitions submitted`,
            message:
              made.length > 1
                ? `One per department: ${made.map((r) => r.generated_id).join(", ")}. Each goes through its own approval.`
                : made[0]?.head_name
                  ? `It’s with ${made[0].head_name} (Head of department) now.`
                  : "It’s in the approval queue now.",
            action: { label: "Open in Requisition", onClick: () => navigate("/home/requests") },
          });
        }}
      />
    </PageOutline>
  );
};

export default AssetManager;
