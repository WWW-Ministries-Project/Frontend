import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/context/AuthWrapper";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import {
  CellText,
  Field,
  FilterPanel,
  FilterToggleButton,
  GridColumn,
  GridTable,
  PageHeading,
  Pill,
  SearchInput,
  SectionEmpty,
  SelectInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { notify } from "@/components/feedback";
import { resolveScope } from "@/utils";

import { CountTabs, GroupSection, StatGrid, StatTile } from "./Components/attendanceUi";
import { ImportCheckInsDialog } from "./Components/ImportCheckInsDialog";
import {
  arrivalOf,
  ArrivalKey,
  CheckIn,
  clock,
  daysInMonth,
  downloadCsv,
  fmtDate,
  fmtShort,
  isoDay,
  minutesFromStart,
  monthLabel,
  nf,
  Occurrence,
  pc,
  plural,
  t12,
  todayKey,
} from "./utils/attendanceModel";
import {
  useCheckIns,
  useEventOccurrences,
  useImportJobs,
  useTimingRules,
} from "./utils/useAttendanceData";

type Tab = "all" | "official" | "bio";
type GroupBy = "event" | "date";
const PAGE = 25;
const COLS = [
  "minmax(220px,2fr)",
  "minmax(200px,1.6fr)",
  "minmax(130px,1fr)",
  "minmax(130px,1fr)",
  "minmax(130px,1fr)",
  "minmax(130px,1fr)",
];

interface Row {
  checkIn: CheckIn;
  occ?: Occurrence;
  offset: number | null;
  arrival: ReturnType<typeof arrivalOf>;
}

const defaultFilters = () => ({ month: todayKey().slice(0, 7), eventId: "", dept: "", arr: "" as ArrivalKey | "" });

export default function EventAttendance() {
  const { user } = useAuth();
  const { canManage } = useAccessControl();
  const canManageAttendance = canManage("Church_Attendance");
  const departmentScoped = resolveScope(user.access_permissions, "Church_Attendance") === "assigned_departments";
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedQuery = searchParams.get("q");

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() =>
    linkedQuery ? { ...defaultFilters(), month: "" } : defaultFilters()
  );
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState(linkedQuery || "");
  const [groupBy, setGroupBy] = useState<GroupBy>("event");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!linkedQuery) return;
    searchParams.delete("q");
    setSearchParams(searchParams, { replace: true });
  }, [linkedQuery, searchParams, setSearchParams]);

  const range = useMemo(() => {
    if (!filters.month) return {};
    const [year, month] = filters.month.split("-").map(Number);
    return { fromDate: `${filters.month}-01`, toDate: `${filters.month}-${daysInMonth(year, month)}` };
  }, [filters.month]);
  const { checkIns, loading, error, refetch } = useCheckIns(range);

  const years = useMemo(() => {
    const set = new Set<number>();
    if (filters.month) set.add(Number(filters.month.slice(0, 4)));
    else checkIns.forEach((checkIn) => set.add(Number(checkIn.date.slice(0, 4))));
    return [...set].filter(Boolean);
  }, [filters.month, checkIns]);
  const { byId } = useEventOccurrences(years);
  const rules = useTimingRules();
  const recordJobs = useImportJobs(() => refetch());

  const setFilter = (patch: Partial<ReturnType<typeof defaultFilters>>) => {
    setFilters((current) => ({ ...current, ...patch, ...(patch.month !== undefined ? { eventId: "" } : {}) }));
    setSelected([]);
  };

  /* ------------------------------ derived rows ----------------------------- */

  const allRows = useMemo<Row[]>(
    () =>
      checkIns.map((checkIn) => {
        const occ = byId.get(checkIn.eventId);
        const offset = minutesFromStart(checkIn, occ);
        return { checkIn, occ, offset, arrival: arrivalOf(offset, rules) };
      }),
    [checkIns, byId, rules]
  );

  const q = query.trim().toLowerCase();
  const base = allRows.filter(
    ({ checkIn, arrival }) =>
      (!filters.eventId || checkIn.eventId === filters.eventId) &&
      (!filters.dept || checkIn.department === filters.dept) &&
      (!filters.arr || arrival.key === filters.arr) &&
      (!q || checkIn.name.toLowerCase().includes(q) || checkIn.memberId.toLowerCase().includes(q))
  );
  const officialRows = base.filter((row) => row.checkIn.official);
  const bioRows = base.filter((row) => !row.checkIn.official);
  const list = (tab === "official" ? officialRows : tab === "bio" ? bioRows : base)
    .slice()
    .sort((a, b) => b.checkIn.date.localeCompare(a.checkIn.date) || a.checkIn.firstAt.localeCompare(b.checkIn.firstAt));

  const groups: { key: string; label: string; rows: Row[] }[] = [];
  const groupIndex: Record<string, number> = {};
  list.forEach((row) => {
    const key = groupBy === "event" ? `${row.checkIn.eventId}:${row.checkIn.date}` : row.checkIn.date;
    if (groupIndex[key] === undefined) {
      groupIndex[key] = groups.length;
      groups.push({
        key,
        label: groupBy === "event" ? `${row.occ?.name || row.checkIn.eventName} · ${fmtShort(row.checkIn.date)}` : fmtDate(row.checkIn.date),
        rows: [],
      });
    }
    groups[groupIndex[key]].rows.push(row);
  });

  const eventOptions = useMemo(() => {
    const seen = new Map<string, CheckIn>();
    checkIns.forEach((checkIn) => {
      if (!seen.has(checkIn.eventId)) seen.set(checkIn.eventId, checkIn);
    });
    return [...seen.values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((checkIn) => ({
        value: checkIn.eventId,
        label: `${byId.get(checkIn.eventId)?.name || checkIn.eventName} · ${fmtShort(checkIn.date)}`,
      }));
  }, [checkIns, byId]);
  const departments = useMemo(
    () => [...new Set(checkIns.map((checkIn) => checkIn.department))].sort(),
    [checkIns]
  );
  const monthOptions = useMemo(() => {
    const options = [];
    const cursor = new Date();
    cursor.setDate(1);
    for (let index = 0; index < 36; index += 1) {
      const key = isoDay(cursor).slice(0, 7);
      options.push({ value: key, label: monthLabel(key) });
      cursor.setMonth(cursor.getMonth() - 1);
    }
    return options;
  }, []);

  const classified = base.filter((row) => row.arrival.key !== "unknown");
  const onTime = classified.filter((row) => row.arrival.key !== "late").length;
  const filterCount = [filters.month !== defaultFilters().month, filters.eventId, filters.dept, filters.arr].filter(Boolean).length;

  /* -------------------------------- actions -------------------------------- */

  const exportRows = (rows: Row[], filename = "event-attendance.csv") =>
    downloadCsv(filename, [
      ["Member", "Member ID", "Department", "Position", "Event", "Date", "Start", "First check-in", "Last check-in", "Minutes from start", "Arrival", "Punches", "Devices", "Status"],
      ...rows.map(({ checkIn: c, occ, offset, arrival }) => [
        c.name,
        c.memberId,
        c.department,
        c.position,
        occ?.name || c.eventName,
        c.date,
        occ?.time || "",
        clock(c.firstAt),
        clock(c.lastAt),
        offset ?? "",
        arrival.label,
        c.punches,
        c.devices.join(" "),
        c.official ? "Official" : "Biometric only",
      ]),
    ]);

  const exportAll = () => {
    const filename = "event-attendance.csv";
    const count = plural(list.length, "check-in");
    const toast = notify.loading({ title: `Exporting ${count}…` });
    try {
      exportRows(list, filename);
      toast.success({ title: "Export ready", message: `${filename} · ${count}` });
    } catch {
      toast.error({ title: "Export didn't finish", message: "Nothing was downloaded. Try again.", retry: exportAll });
    }
  };

  const recordSelectedAsOfficial = async () => {
    const chosen = new Set(selected);
    const eventIds = [
      ...new Set(list.filter((row) => chosen.has(row.checkIn.id) && !row.checkIn.official).map((row) => row.checkIn.eventId)),
    ];
    if (!eventIds.length) {
      notify.info({
        title: "Already official",
        message:
          selected.length === 1
            ? "The selected check-in was recorded earlier."
            : `All ${selected.length} selected check-ins were recorded earlier.`,
      });
      return;
    }
    const started = await recordJobs.start(eventIds, false);
    if (started) {
      setSelected([]);
      notify.info({
        title: "Recording check-ins",
        message: `Check-ins for ${plural(eventIds.length, "event")} are being recorded as official attendance.`,
      });
    }
  };

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const columns: GridColumn<Row>[] = [
    {
      key: "member",
      header: "Member",
      width: COLS[0],
      render: ({ checkIn: c }) => (
        <CellText
          strong
          main={c.name}
          sub={[c.memberId, c.department + (c.position ? ` (${c.position})` : "")].filter(Boolean).join(" · ")}
        />
      ),
    },
    {
      key: "event",
      header: "Event",
      width: COLS[1],
      render: ({ checkIn: c, occ }) => (
        <CellText
          main={occ?.name || c.eventName}
          sub={`${fmtShort(c.date)}${occ?.time ? ` · starts ${t12(occ.time)}` : ""}`}
        />
      ),
    },
    {
      key: "first",
      header: "First check-in",
      width: COLS[2],
      render: ({ checkIn: c }) => (
        <CellText main={clock(c.firstAt)} sub={c.punches > 1 ? `Last ${clock(c.lastAt)}` : "Single punch"} />
      ),
    },
    { key: "arrival", header: "Arrival", width: COLS[3], render: ({ arrival }) => <Pill tone={arrival.tone}>{arrival.label}</Pill> },
    {
      key: "device",
      header: "Device",
      width: COLS[4],
      render: ({ checkIn: c }) => (
        <CellText main={c.devices.join(", ") || "—"} sub={plural(c.punches, "punch", "punches")} />
      ),
    },
    {
      key: "status",
      header: "Status",
      width: COLS[5],
      render: ({ checkIn: c }) =>
        c.official ? <Pill tone="success">Official</Pill> : <Pill tone="warning">Biometric only</Pill>,
    },
  ];

  return (
    <PageOutline crumbs={[{ label: "Home", link: "/home" }, { label: "Attendance" }, { label: "Event Attendance" }]}>
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Event Attendance"
          subtitle="Worker check-ins captured by biometric devices at each event."
          actions={
            <>
              <FilterToggleButton open={showFilters} count={filterCount} onClick={() => setShowFilters((open) => !open)} />
              <UiButton
                disabled={!list.length}
                onClick={exportAll}
              >
                Export CSV
              </UiButton>
              {canManageAttendance && (
                <UiButton tone="primary" onClick={() => setImportOpen(true)}>
                  Import check-ins
                </UiButton>
              )}
            </>
          }
        />

        {departmentScoped && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Department access is active. You only see check-ins for members of the departments you are
            assigned to or lead.
          </p>
        )}

        {showFilters && (
          <FilterPanel
            title="Refine check-ins"
            helper="Filters combine with the search and status tabs."
            onReset={() => {
              setFilters(defaultFilters());
              setQuery("");
              setTab("all");
              setSelected([]);
            }}
            resetDisabled={!filterCount && !query && tab === "all"}
          >
            <Field label="Month">
              <SelectInput
                value={filters.month}
                onChange={(event) => setFilter({ month: event.target.value })}
                options={[{ value: "", label: "All months" }, ...monthOptions]}
              />
            </Field>
            <Field label="Event">
              <SelectInput
                value={filters.eventId}
                onChange={(event) => setFilter({ eventId: event.target.value })}
                options={[{ value: "", label: "All events" }, ...eventOptions]}
              />
            </Field>
            <Field label="Department">
              <SelectInput
                value={filters.dept}
                onChange={(event) => setFilter({ dept: event.target.value })}
                options={[{ value: "", label: "All departments" }, ...departments.map((dept) => ({ value: dept, label: dept }))]}
              />
            </Field>
            <Field label="Arrival">
              <SelectInput
                value={filters.arr}
                onChange={(event) => setFilter({ arr: event.target.value as ArrivalKey | "" })}
                options={[
                  { value: "", label: "Any arrival" },
                  { value: "early", label: "Early" },
                  { value: "ontime", label: "On time" },
                  { value: "late", label: "Late" },
                ]}
              />
            </Field>
          </FilterPanel>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message || "Unable to load check-ins."}
          </p>
        )}

        <StatGrid min={180}>
          <StatTile label="Check-ins" value={nf(base.length)} sub={filters.month ? monthLabel(filters.month) : "All months"} />
          <StatTile label="Events covered" value={String(new Set(base.map((row) => row.checkIn.eventId)).size)} sub="With device check-ins" />
          <StatTile label="Members matched" value={nf(new Set(base.map((row) => row.checkIn.userId)).size)} sub="Distinct members with a check-in" />
          <StatTile
            label="On-time rate"
            value={`${pc(onTime, classified.length)}%`}
            sub={`Early or within ${rules.lateMinutes} min of start`}
          />
          <StatTile
            label="Awaiting confirmation"
            value={nf(bioRows.length)}
            sub={bioRows.length ? "Biometric only, not yet official" : "All check-ins are official"}
            color={bioRows.length ? "rgb(var(--color-amber-700))" : "rgb(var(--color-green-700))"}
          />
        </StatGrid>

        <CountTabs
          ariaLabel="Check-in status"
          className="self-start"
          value={tab}
          onChange={(key) => {
            setTab(key);
            setSelected([]);
          }}
          tabs={[
            { key: "all", label: "All", count: base.length },
            { key: "official", label: "Official", count: officialRows.length },
            { key: "bio", label: "Biometric only", count: bioRows.length },
          ]}
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            className="max-w-[420px]"
            value={query}
            onChange={(value) => {
              setQuery(value);
              setSelected([]);
            }}
            placeholder="Search by name or member ID"
            ariaLabel="Search check-ins"
          />
          <CountTabs
            ariaLabel="Group check-ins"
            className="ml-auto"
            value={groupBy}
            onChange={(key) => {
              setGroupBy(key);
              setOpenGroups({});
            }}
            tabs={[
              { key: "event", label: "By event" },
              { key: "date", label: "By date" },
            ]}
          />
        </div>

        {selected.length > 0 && (
          <div
            role="region"
            aria-label="Bulk actions"
            className="flex flex-wrap items-center gap-3 rounded-lg bg-primary px-4 py-3 text-white"
          >
            <span className="text-sm font-semibold">{plural(selected.length, "check-in")} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              {canManageAttendance && (
                <button
                  type="button"
                  disabled={recordJobs.busy}
                  onClick={recordSelectedAsOfficial}
                  className="min-h-9 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-primary disabled:opacity-60"
                >
                  {recordJobs.busy ? "Recording…" : "Record as official"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const chosen = new Set(selected);
                  exportRows(list.filter((row) => chosen.has(row.checkIn.id)), "event-attendance-selected.csv");
                }}
                className="min-h-9 rounded-lg border border-white/50 bg-transparent px-3 py-1.5 text-sm font-medium text-white"
              >
                Export selected
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="min-h-9 rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Showing {nf(list.length)} check-in{list.length === 1 ? "" : "s"} across{" "}
          {plural(groups.length, groupBy === "event" ? "event" : "date")}.
        </p>

        {loading && !checkIns.length && (
          <GridTable columns={columns} rows={[]} getRowId={(row) => row.checkIn.id} loading minWidth="1150px" />
        )}

        {groups.map((group, index) => {
          const open = openGroups[group.key] ?? index === 0;
          const limit = limits[group.key] || PAGE;
          const groupClassified = group.rows.filter((row) => row.arrival.key !== "unknown");
          const groupOnTime = groupClassified.filter((row) => row.arrival.key !== "late").length;
          const ids = group.rows.map((row) => row.checkIn.id);
          return (
            <GroupSection
              key={group.key}
              label={group.label}
              count={group.rows.length}
              summary={`${pc(groupOnTime, groupClassified.length)}% on time · ${group.rows.filter((row) => !row.checkIn.official).length} biometric only`}
              open={open}
              onToggle={() => setOpenGroups({ ...openGroups, [group.key]: !open })}
              moreLabel={group.rows.length > limit ? `Show ${Math.min(PAGE, group.rows.length - limit)} more of ${group.rows.length - limit}` : undefined}
              onMore={() => setLimits({ ...limits, [group.key]: limit + PAGE })}
            >
              <GridTable
                columns={columns}
                rows={group.rows.slice(0, limit)}
                getRowId={(row) => row.checkIn.id}
                selectable
                selectedIds={selected}
                onToggleRow={toggle}
                onToggleAll={() => {
                  const allOn = ids.every((id) => selected.includes(id));
                  setSelected((current) =>
                    allOn ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]
                  );
                }}
                minWidth="1150px"
              />
            </GroupSection>
          );
        })}

        {!loading && list.length === 0 && (
          <SectionEmpty
            title="No check-ins found"
            text="Nothing matches the current month, filters or search. Import check-ins for recent events or widen the filters."
            action={
              <UiButton
                onClick={() => {
                  setFilters(defaultFilters());
                  setQuery("");
                  setTab("all");
                }}
              >
                Reset view
              </UiButton>
            }
          />
        )}
      </div>

      <ImportCheckInsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => refetch()}
        canManage={canManageAttendance}
      />
    </PageOutline>
  );
}

