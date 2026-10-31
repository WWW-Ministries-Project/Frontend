import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import EmptyStateImage from "@/assets/emptyState.svg";
import { notify } from "@/components/feedback";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";

import PageOutline from "../../Components/PageOutline";
import {
  ActionMenu,
  FilterPanel,
  FilterToggleButton,
  Field,
  PageHeading,
  Pill,
  SearchInput,
  SelectInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import { CalIcon, PersonIcon, PinIcon } from "./components/lcIcons";
import { LifeCenterFormDialog, LifeCenterFormValue, MeetingDialog, RolesDialog } from "./components/LifeCenterDialogs";
import {
  DAYF,
  DAYS,
  OVERDUE_DAYS,
  downloadCsv,
  expectedMeetings,
  gapOf,
  lastMetPill,
  lcDetailPath,
  n1,
  pctN,
  plural,
  rateColor,
  useToday,
} from "./utils/lcModel";
import { Center, recentAverage, useLifeCenterOverview } from "./utils/useLifeCenterOverview";
import { useLifeCenterAccess } from "./utils/useLifeCenterAccess";


type Filters = { day: string; status: string };

const LifeCenterList = () => {
  const navigate = useNavigate();
  const today = useToday();
  const year = today.slice(0, 4);
  const y0 = `${year}-01-01`;
  const mo0 = `${today.slice(0, 7)}-01`;
  const can = useLifeCenterAccess();

  const { centers, meetings, souls, roles, loaded, refetch } = useLifeCenterOverview(y0, today);

  const [q, setQ] = useState("");
  const [showF, setShowF] = useState(false);
  const [f, setF] = useState<Filters>({ day: "", status: "" });
  const [form, setForm] = useState<{ open: boolean; existing: LifeCenterFormValue | null }>({ open: false, existing: null });
  const [recordFor, setRecordFor] = useState<number | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);

  const rows = useMemo(
    () =>
      centers.map((c) => ({
        c,
        gap: gapOf(c.last, today),
        soulsY: souls.filter((s) => s.life_center_id === c.id).length,
        heldY: meetings.filter((g) => g.life_center_id === c.id).length,
        avg: recentAverage(c),
      })),
    [centers, souls, meetings, today]
  );

  const term = q.trim().toLowerCase();
  const list = rows.filter(
    (r) =>
      (!term || `${r.c.name} ${r.c.location} ${r.c.leader ?? ""}`.toLowerCase().includes(term)) &&
      (!f.day || r.c.days.includes(f.day as Center["days"][number])) &&
      (!f.status || (f.status === "overdue" ? r.gap > OVERDUE_DAYS : r.gap <= OVERDUE_DAYS))
  );
  const fCount = [f.day, f.status].filter(Boolean).length;

  const heldM = meetings.filter((g) => g.date >= mo0).length;
  const expM = centers.reduce((total, c) => total + expectedMeetings(c, mo0, today, today), 0);
  const overdue = rows.filter((r) => r.gap > OVERDUE_DAYS).length;
  const converted = souls.filter((s) => s.converted).length;
  const totalMembers = centers.reduce((total, c) => total + c.memberCount, 0);

  const kpis = [
    { l: "Life centers", v: String(centers.length), s: `${plural(totalMembers, "member")} in total` },
    {
      l: "Meetings this month",
      v: `${heldM} of ${expM}`,
      s: `${pctN(heldM, expM)}% of scheduled meetings held`,
      c: expM ? rateColor(pctN(heldM, expM)) : undefined,
    },
    { l: `Souls won in ${year}`, v: String(souls.length), s: `${converted} have become members` },
    {
      l: "Overdue for a meeting",
      v: String(overdue),
      s: overdue ? "Select to see which ones" : `Every center met in the last ${OVERDUE_DAYS} days`,
      c: overdue ? "rgb(var(--color-red-700))" : "rgb(var(--color-green-700))",
      danger: overdue > 0,
      go: overdue
        ? () => {
            setF({ day: "", status: "overdue" });
            setShowF(true);
          }
        : undefined,
    },
  ];

  const openEdit = async (c: Center) => {
    try {
      const response = await api.fetch.fetchLifeCenterById({ id: String(c.id) });
      const d = response.data;
      setForm({
        open: true,
        existing: {
          id: c.id,
          name: c.name,
          description: c.description,
          location: c.location,
          days: c.days,
          leaderUserId: c.leaderUserId ? String(c.leaderUserId) : "",
          members: d?.members ?? [],
        },
      });
    } catch {
      /* the API error toast already explains it */
    }
  };

  const remove = (c: Center) =>
    confirmAction({
      title: `Delete ${c.name}?`,
      points: [
        "Its members, meetings and souls-won records will be removed.",
        "Export them first if you need a copy.",
      ],
      confirmLabel: "Delete life center",
      tone: "danger",
      typeToConfirm: c.memberCount > 10 ? c.name : undefined,
      onConfirm: async () => {
        await api.delete.deleteLifeCenter({ id: String(c.id) });
        notify.success({ title: "Life center deleted", message: `${c.name} was removed.` });
        refetch();
      },
    });

  const exportCsv = () => {
    downloadCsv("life-centers.csv", [
      ["Name", "Location", "Meeting days", "Leader", "Members", `Souls won ${year}`, `Meetings held ${year}`, `Meetings scheduled ${year}`, "Last met"],
      ...list.map((r) => [
        r.c.name,
        r.c.location,
        r.c.days.join(" "),
        r.c.leader ?? "",
        r.c.memberCount,
        r.soulsY,
        r.heldY,
        expectedMeetings(r.c, y0, today, today),
        r.c.last ?? "",
      ]),
    ]);
    notify.success({ title: "CSV downloaded", message: `${plural(list.length, "life center")} saved.` });
  };

  const empty = loaded && centers.length === 0;

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Life centers"
        subtitle="Small groups meeting across the city. Open one to record meetings, souls won and members."
        actions={
          <>
            <FilterToggleButton open={showF} count={fCount} onClick={() => setShowF(!showF)} />
            {can.editRoles && <UiButton onClick={() => setRolesOpen(true)}>Manage roles</UiButton>}
            {can.exportData && (
              <UiButton onClick={exportCsv} disabled={!list.length}>
                Export CSV
              </UiButton>
            )}
            {can.createCenters && (
              <UiButton tone="primary" onClick={() => setForm({ open: true, existing: null })}>
                New life center
              </UiButton>
            )}
          </>
        }
      />

      {showF && (
        <FilterPanel
          title="Refine life centers"
          helper="Filters combine with the search."
          onReset={() => setF({ day: "", status: "" })}
          resetDisabled={!fCount}
        >
          <Field label="Meets on">
            <SelectInput
              value={f.day}
              onChange={(e) => setF({ ...f, day: e.target.value })}
              options={[{ value: "", label: "Any day" }, ...DAYS.map((d) => ({ value: d, label: DAYF[d] }))]}
            />
          </Field>
          <Field label="Meeting status">
            <SelectInput
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
              options={[
                { value: "", label: "All life centers" },
                { value: "ok", label: `Met in the last ${OVERDUE_DAYS} days` },
                { value: "overdue", label: `No meeting in ${OVERDUE_DAYS}+ days` },
              ]}
            />
          </Field>
        </FilterPanel>
      )}

      {!empty && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
          {kpis.map((k) => (
            <button
              key={k.l}
              type="button"
              onClick={k.go}
              disabled={!k.go}
              className={cn(
                "flex flex-col gap-1 rounded-xl border bg-white px-5 py-4 text-left text-sm text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow disabled:cursor-default",
                k.go && "hover:shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]",
                k.danger ? "border-red-200" : "border-lightGray"
              )}
            >
              <span className="text-gray-600">{k.l}</span>
              <span className="text-2xl font-semibold leading-8">{loaded ? k.v : "—"}</span>
              <span className="text-xs" style={{ color: k.c ?? "rgb(var(--color-gray-500))" }}>
                {loaded ? k.s : " "}
              </span>
            </button>
          ))}
        </div>
      )}

      {!empty && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search name, area or leader"
            ariaLabel="Search life centers"
            className="max-w-[420px] flex-[1_1_240px]"
          />
          <p className="text-sm text-gray-600">
            {list.length === centers.length
              ? plural(centers.length, "life center")
              : `Showing ${list.length} of ${plural(centers.length, "life center")}`}
          </p>
        </div>
      )}

      {!loaded ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[300px] animate-pulse rounded-2xl border border-lightGray bg-white" />
          ))}
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-lightGray bg-white px-6 py-12 text-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-inputBackground">
            <img src={EmptyStateImage} alt="" className="w-24" />
          </div>
          <Pill>NO LIFE CENTERS YET</Pill>
          <h2 className="text-2xl font-semibold leading-8 text-primary">Start your first life center</h2>
          <p className="max-w-[440px] text-base text-gray-600">
            Add where it meets, which days, and who leads it. Leaders can then record meetings and souls won.
          </p>
          {can.createCenters && (
            <UiButton tone="primary" onClick={() => setForm({ open: true, existing: null })}>
              New life center
            </UiButton>
          )}
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">
          No life centers match your search or filters.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
          {list.map((r) => {
            const pill = lastMetPill(r.c.last, today);
            const open = () => navigate(lcDetailPath(r.c.id));
            return (
              <div
                key={r.c.id}
                role="link"
                tabIndex={0}
                onClick={open}
                onKeyDown={(e) => {
                  if (e.key === "Enter") open();
                }}
                className="flex min-w-0 cursor-pointer flex-col gap-4 rounded-2xl border border-lightGray bg-white p-5 text-primary transition-shadow hover:shadow-[0_10px_28px_rgb(var(--color-shadow)_/_0.2)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-shadow)_/_0.08)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="text-xl font-semibold leading-7">{r.c.name}</h2>
                    <p className="line-clamp-2 text-sm text-gray-600">{r.c.description || "—"}</p>
                  </div>
                  <ActionMenu
                    ariaLabel={`More actions for ${r.c.name}`}
                    width={180}
                    items={[
                      { label: "Edit details", onClick: () => openEdit(r.c), hidden: !can.editCenters },
                      { label: "Record meeting", onClick: () => setRecordFor(r.c.id), hidden: !can.recordMeeting },
                      { label: "Delete", onClick: () => remove(r.c), danger: true, hidden: !can.remove },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <PinIcon />
                    <span className="min-w-0 truncate">{r.c.location || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalIcon />
                    <div className="flex flex-wrap gap-1">
                      {r.c.days.length ? (
                        r.c.days.map((d) => (
                          <Pill key={d} className="px-2 py-0">
                            {d}
                          </Pill>
                        ))
                      ) : (
                        <span>No meeting days set</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PersonIcon />
                    <span className="min-w-0 truncate">{r.c.leader ? `Led by ${r.c.leader}` : "No leader yet"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-4">
                  {[
                    { v: String(r.c.memberCount), l: "Members" },
                    { v: String(r.soulsY), l: `Souls won (${year})` },
                    { v: n1(r.avg), l: "Avg attendance" },
                  ].map((t) => (
                    <div key={t.l} className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xl font-semibold leading-7">{t.v}</span>
                      <span className="text-xs text-gray-500">{t.l}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Pill tone={pill.tone}>{pill.label}</Pill>
                  <span className="text-sm font-medium">Open →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LifeCenterFormDialog
        open={form.open}
        existing={form.existing}
        canAssignLeader={can.assignLeader}
        takenNames={centers.map((c) => c.name)}
        onClose={() => setForm({ open: false, existing: null })}
        onSaved={(id) => {
          const created = !form.existing;
          setForm({ open: false, existing: null });
          if (created && id) navigate(lcDetailPath(id));
          else refetch();
        }}
      />
      <MeetingDialog
        open={recordFor !== null}
        lifeCenterId={recordFor}
        onClose={() => setRecordFor(null)}
        onSaved={() => {
          setRecordFor(null);
          refetch();
        }}
      />
      <RolesDialog open={rolesOpen} roles={roles} canDelete={can.deleteRoles} onClose={() => setRolesOpen(false)} onChanged={() => refetch()} />
    </PageOutline>
  );
};

export default LifeCenterList;
