import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import {
  CellText,
  DialogShell,
  Field,
  FilterPanel,
  FilterToggleButton,
  GridColumn,
  GridTable,
  PageHeading,
  Pill,
  SectionEmpty,
  SelectInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import { notify } from "@/components/feedback";
import { api } from "@/utils";

import { CountTabs, GroupSection, StatGrid, StatTile } from "./Components/attendanceUi";
import { RecordAttendanceDialog, RecordTarget } from "./Components/RecordAttendanceDialog";
import {
  AttendanceRecord,
  daysBetween,
  downloadCsv,
  fmtDate,
  fmtShort,
  groupKeyOf,
  monthLabel,
  MONF,
  nf,
  Occurrence,
  pc,
  plural,
  t12,
  takesHeadcount,
  todayKey,
  totalsOf,
  weekdayOf,
} from "./utils/attendanceModel";
import { useAttendanceRecords, useEventOccurrences } from "./utils/useAttendanceData";

type Tab = "rec" | "un";
type GroupBy = "month" | "service";

const EMPTY_FILTERS = { year: "", month: "", service: "", by: "" };
const PAGE = 20;


interface RecordRow {
  record: AttendanceRecord;
  name: string;
  groupKey: string;
  time: string;
  baseline: number;
}

export default function ChurchAttendance() {
  const { canManage, canAdmin } = useAccessControl();
  const canRecord = canManage("Church_Attendance");
  const canDelete = canAdmin("Church_Attendance");
  const [searchParams, setSearchParams] = useSearchParams();

  const { records, loading, refetch } = useAttendanceRecords();
  const today = todayKey();
  const thisYear = Number(today.slice(0, 4));
  const years = useMemo(() => {
    const set = new Set([thisYear, thisYear - 1]);
    records.forEach((record) => set.add(Number(record.date.slice(0, 4))));
    return [...set].filter((year) => year > 2000 && year <= thisYear);
  }, [records, thisYear]);
  const { events, byId } = useEventOccurrences(years);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [tab, setTab] = useState<Tab>("rec");
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [target, setTarget] = useState<RecordTarget | null>(null);
  const [deleting, setDeleting] = useState<RecordRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  /* ------------------------------ derived data ----------------------------- */

  const recByEvent = useMemo(() => new Map(records.map((record) => [record.eventId, record])), [records]);

  const rows = useMemo<RecordRow[]>(() => {
    const base = records.map((record) => {
      const occ = byId.get(record.eventId);
      const name = occ?.name || record.eventName || "Event";
      return { record, name, groupKey: groupKeyOf(name), time: occ?.time || "", baseline: 0 };
    });
    const byGroup: Record<string, RecordRow[]> = {};
    base.forEach((row) => (byGroup[row.groupKey] = byGroup[row.groupKey] || []).push(row));
    Object.values(byGroup).forEach((list) => {
      list.sort((a, b) => a.record.date.localeCompare(b.record.date));
      list.forEach((row, index) => {
        const prev = list.slice(Math.max(0, index - 6), index);
        row.baseline =
          prev.length >= 2 ? prev.reduce((sum, item) => sum + totalsOf(item.record).total, 0) / prev.length : 0;
      });
    });
    return base;
  }, [records, byId]);

  const usualFor = useMemo(() => {
    const byGroup: Record<string, { date: string; total: number }[]> = {};
    rows.forEach((row) =>
      (byGroup[row.groupKey] = byGroup[row.groupKey] || []).push({
        date: row.record.date,
        total: totalsOf(row.record).total,
      })
    );
    return (occ: Occurrence) => {
      const recent = (byGroup[occ.groupKey] || [])
        .filter((item) => item.date < occ.date)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6);
      return recent.length ? recent.reduce((sum, item) => sum + item.total, 0) / recent.length : 0;
    };
  }, [rows]);

  const held = useMemo(
    () => events.filter((occ) => takesHeadcount(occ) && occ.date <= today),
    [events, today]
  );
  const unrecorded = useMemo(
    () =>
      held
        .filter((occ) => !recByEvent.has(occ.id))
        .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time)),
    [held, recByEvent]
  );

  // Open the record dialog when linked from analytics (?record=<eventId>).
  const linkedEvent = searchParams.get("record");
  useEffect(() => {
    if (!linkedEvent || !byId.size) return;
    if (canRecord) setTarget({ eventId: byId.has(linkedEvent) ? linkedEvent : "" });
    searchParams.delete("record");
    setSearchParams(searchParams, { replace: true });
  }, [linkedEvent, byId, canRecord, searchParams, setSearchParams]);

  /* --------------------------------- KPIs ---------------------------------- */

  const kpis = useMemo(() => {
    const sundays: Record<string, number> = {};
    records.forEach((record) => {
      if (weekdayOf(record.date) === 0) sundays[record.date] = (sundays[record.date] || 0) + totalsOf(record).total;
    });
    const dates = Object.keys(sundays).sort().reverse();
    const last = dates[0];
    const prev = dates.slice(1, 5);
    const avg4 = prev.length ? prev.reduce((sum, date) => sum + sundays[date], 0) / prev.length : 0;
    const delta = last && avg4 ? ((sundays[last] - avg4) * 100) / avg4 : 0;
    const monthKey = today.slice(0, 7);
    const monthSundays = dates.filter((date) => date.startsWith(monthKey));
    const heldMonth = held.filter((occ) => occ.date.startsWith(monthKey));
    const recordedMonth = heldMonth.filter((occ) => recByEvent.has(occ.id));
    return [
      {
        label: "Last Sunday",
        value: last ? nf(sundays[last]) : "—",
        sub: last
          ? `${fmtDate(last)}${avg4 ? ` · ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs 4-week average` : ""}`
          : "No Sunday recorded yet",
        color: delta < -5 ? "rgb(var(--color-red-700))" : delta > 5 ? "rgb(var(--color-green-700))" : "rgb(var(--color-gray-500))",
      },
      {
        label: `Average Sunday, ${MONF[Number(monthKey.slice(5)) - 1]}`,
        value: monthSundays.length
          ? nf(monthSundays.reduce((sum, date) => sum + sundays[date], 0) / monthSundays.length)
          : "—",
        sub: `All services · ${plural(monthSundays.length, "Sunday")} so far`,
      },
      {
        label: "Recorded this month",
        value: `${recordedMonth.length} of ${heldMonth.length}`,
        sub: `${pc(recordedMonth.length, heldMonth.length)}% of services held`,
      },
      {
        label: "Awaiting headcount",
        value: String(unrecorded.length),
        sub: unrecorded.length
          ? `Latest: ${unrecorded[0].name}, ${fmtShort(unrecorded[0].date)}`
          : "Every service is recorded",
        color: unrecorded.length ? "rgb(var(--color-amber-700))" : "rgb(var(--color-green-700))",
      },
    ];
  }, [records, held, recByEvent, unrecorded, today]);

  /* ----------------------------- filtering/groups --------------------------- */

  const serviceOptions = useMemo(() => {
    const names = new Map<string, string>();
    rows.forEach((row) => names.set(row.groupKey, row.name));
    held.forEach((occ) => names.set(occ.groupKey, occ.name));
    return [...names.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows, held]);
  const recorders = useMemo(
    () => [...new Set(records.map((record) => record.recordedByName))].sort(),
    [records]
  );

  const dateOk = (date: string, groupKey: string) =>
    (!filters.year || date.startsWith(filters.year)) &&
    (!filters.month || Number(date.slice(5, 7)) === Number(filters.month)) &&
    (!filters.service || groupKey === filters.service);

  const recList = rows
    .filter((row) => dateOk(row.record.date, row.groupKey) && (!filters.by || row.record.recordedByName === filters.by))
    .sort((a, b) => b.record.date.localeCompare(a.record.date) || a.time.localeCompare(b.time));
  const unList = filters.by ? [] : unrecorded.filter((occ) => dateOk(occ.date, occ.groupKey));

  const isRec = tab === "rec";
  const groupOf = (date: string, key: string) => (groupBy === "month" ? date.slice(0, 7) : key);
  const sections = (() => {
    const groups: Record<string, { label: string; recs: RecordRow[]; occs: Occurrence[] }> = {};
    const add = (key: string, label: string) => (groups[key] = groups[key] || { label, recs: [], occs: [] });
    if (isRec) recList.forEach((row) => add(groupOf(row.record.date, row.groupKey), groupBy === "month" ? monthLabel(row.record.date) : row.name).recs.push(row));
    else unList.forEach((occ) => add(groupOf(occ.date, occ.groupKey), groupBy === "month" ? monthLabel(occ.date) : occ.name).occs.push(occ));
    const keys = Object.keys(groups);
    keys.sort(groupBy === "month" ? (a, b) => b.localeCompare(a) : (a, b) => groups[a].label.localeCompare(groups[b].label));
    return keys.map((key) => ({ key, ...groups[key] }));
  })();

  const filterCount = Object.values(filters).filter(Boolean).length;

  /* -------------------------------- columns -------------------------------- */

  const recColumns: GridColumn<RecordRow>[] = [
    {
      key: "service",
      header: "Service",
      width: "minmax(220px,2fr)",
      render: (row) => (
        <CellText
          strong
          main={row.name}
          sub={`${fmtShort(row.record.date)}${row.time ? ` · ${t12(row.time)}` : ""}`}
        />
      ),
    },
    { key: "adults", header: "Adults", width: "minmax(64px,0.6fr)", render: (row) => nf(totalsOf(row.record).adults) },
    { key: "youth", header: "Youth", width: "minmax(64px,0.6fr)", render: (row) => nf(totalsOf(row.record).youth) },
    { key: "children", header: "Children", width: "minmax(64px,0.6fr)", render: (row) => nf(totalsOf(row.record).children) },
    {
      key: "visitors",
      header: "Visitors",
      width: "minmax(64px,0.6fr)",
      render: (row) => {
        const t = totalsOf(row.record);
        return <CellText main={nf(t.vis + t.cl)} sub={t.cl ? `${t.cl} clergy` : undefined} />;
      },
    },
    {
      key: "total",
      header: "Total",
      width: "minmax(64px,0.6fr)",
      render: (row) => <span className="font-semibold">{nf(totalsOf(row.record).total)}</span>,
    },
    {
      key: "usual",
      header: "vs usual",
      width: "minmax(96px,0.8fr)",
      render: (row) => {
        if (!row.baseline) return <Pill>First record</Pill>;
        const d = ((totalsOf(row.record).total - row.baseline) * 100) / row.baseline;
        if (d >= 8) return <Pill tone="success">+{Math.round(d)}%</Pill>;
        if (d <= -8) return <Pill tone="danger">−{Math.round(-d)}%</Pill>;
        return <Pill>Usual</Pill>;
      },
    },
    {
      key: "by",
      header: "Recorded by",
      width: "minmax(150px,1.1fr)",
      render: (row) => (
        <CellText
          main={row.record.recordedByName}
          sub={
            row.record.enteredOn > row.record.date
              ? `Entered ${fmtDate(row.record.enteredOn)}`
              : fmtDate(row.record.enteredOn)
          }
        />
      ),
    },
  ];

  const unColumns: GridColumn<Occurrence>[] = [
    { key: "service", header: "Service", width: "minmax(220px,2fr)", render: (occ) => <CellText strong main={occ.name} sub={occ.typeLabel} /> },
    {
      key: "date",
      header: "Date",
      width: "minmax(170px,1.2fr)",
      render: (occ) => <CellText main={`${fmtShort(occ.date)} ${occ.date.slice(0, 4)}`} sub={occ.time ? t12(occ.time) : undefined} />,
    },
    {
      key: "held",
      header: "Held",
      width: "minmax(110px,0.8fr)",
      render: (occ) => {
        const ago = daysBetween(occ.date, today);
        return ago === 0 ? "Today" : `${plural(ago, "day")} ago`;
      },
    },
    {
      key: "expected",
      header: "Expected",
      width: "minmax(130px,0.9fr)",
      render: (occ) => {
        const usual = usualFor(occ);
        return <CellText main={usual ? `~${nf(usual)}` : "—"} sub={usual ? "Usual attendance" : "No history"} />;
      },
    },
    {
      key: "status",
      header: "Status",
      width: "minmax(110px,0.8fr)",
      render: (occ) =>
        daysBetween(occ.date, today) > 3 ? <Pill tone="danger">Overdue</Pill> : <Pill tone="warning">Due</Pill>,
    },
  ];

  /* -------------------------------- actions -------------------------------- */

  const exportCsv = () => {
    const filename = "church-attendance.csv";
    const count = plural(recList.length, "record");
    const toast = notify.loading({ title: `Exporting ${count}…` });
    try {
      downloadCsv(filename, [
        ["Service", "Date", "Time", "Adult male", "Adult female", "Youth male", "Youth female", "Children male", "Children female", "Visitors", "Visiting clergy", "Total", "Recorded by", "Recorded on"],
        ...recList.map(({ record: r, name, time }) => {
          const t = totalsOf(r);
          return [name, r.date, time, r.adultMale, r.adultFemale, r.youthMale, r.youthFemale, r.childrenMale, r.childrenFemale, t.vis, t.cl, t.total, r.recordedByName, r.enteredOn];
        }),
      ]);
      toast.success({ title: "Export ready", message: `${filename} · ${count}` });
    } catch {
      toast.error({ title: "Export didn't finish", message: "Nothing was downloaded. Try again.", retry: exportCsv });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.delete.deleteChurchAttendance({ id: deleting.record.id });
      notify.success({ title: "Record deleted", message: `${deleting.name} on ${deleting.record.date} was removed.` });
      setDeleting(null);
      refetch();
    } catch (error) {
      notify.fromError(error, { title: "Couldn't delete the record", retry: () => void confirmDelete() });
    } finally {
      setDeleteBusy(false);
    }
  };

  const list = isRec ? recList : unList;

  return (
    <PageOutline crumbs={[{ label: "Home", link: "/home" }, { label: "Attendance" }, { label: "Church Attendance" }]}>
      <div className="flex flex-col gap-6">
        <PageHeading
          title="Church Attendance"
          subtitle="Record and review headcounts for every service."
          actions={
            <>
              <FilterToggleButton open={showFilters} count={filterCount} onClick={() => setShowFilters((open) => !open)} />
              <UiButton onClick={exportCsv} disabled={!recList.length}>
                Export CSV
              </UiButton>
              {canRecord && (
                <UiButton tone="primary" onClick={() => setTarget({ eventId: unrecorded[0]?.id || "" })}>
                  Record attendance
                </UiButton>
              )}
            </>
          }
        />

        {showFilters && (
          <FilterPanel
            title="Refine records"
            helper="Narrow by period, service or the person who recorded it."
            onReset={() => setFilters(EMPTY_FILTERS)}
            resetDisabled={!filterCount}
          >
            <Field label="Year">
              <SelectInput
                value={filters.year}
                onChange={(event) => setFilters({ ...filters, year: event.target.value })}
                options={[{ value: "", label: "All years" }, ...[...years].sort().reverse().map((year) => ({ value: String(year), label: String(year) }))]}
              />
            </Field>
            <Field label="Month">
              <SelectInput
                value={filters.month}
                onChange={(event) => setFilters({ ...filters, month: event.target.value })}
                options={[{ value: "", label: "All months" }, ...MONF.map((label, index) => ({ value: String(index + 1), label }))]}
              />
            </Field>
            <Field label="Service">
              <SelectInput
                value={filters.service}
                onChange={(event) => setFilters({ ...filters, service: event.target.value })}
                options={[{ value: "", label: "All services" }, ...serviceOptions.map(([value, label]) => ({ value, label }))]}
              />
            </Field>
            <Field label="Recorded by">
              <SelectInput
                value={filters.by}
                onChange={(event) => setFilters({ ...filters, by: event.target.value })}
                options={[{ value: "", label: "Anyone" }, ...recorders.map((name) => ({ value: name, label: name }))]}
              />
            </Field>
          </FilterPanel>
        )}

        <StatGrid>
          {kpis.map((kpi) => (
            <StatTile key={kpi.label} label={kpi.label} value={kpi.value} sub={kpi.sub} color={kpi.color} />
          ))}
        </StatGrid>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <CountTabs
            ariaLabel="Recording status"
            value={tab}
            onChange={(key) => setTab(key)}
            tabs={[
              { key: "rec", label: "Recorded", count: recList.length },
              { key: "un", label: "Awaiting headcount", count: unList.length },
            ]}
          />
          <CountTabs
            ariaLabel="Group records"
            value={groupBy}
            onChange={(key) => {
              setGroupBy(key);
              setOpenGroups({});
            }}
            tabs={[
              { key: "month", label: "By month" },
              { key: "service", label: "By service" },
            ]}
          />
        </div>

        <p className="text-sm text-gray-600">
          {isRec
            ? `Showing ${nf(recList.length)} recorded service${recList.length === 1 ? "" : "s"} in ${plural(sections.length, "group")}.${canRecord ? " Select a row to edit it." : ""}`
            : `${plural(unList.length, "service")} held without a headcount.`}
        </p>

        {loading && !records.length && (
          <GridTable columns={recColumns} rows={[]} getRowId={(row) => row.record.id} loading minWidth="1040px" />
        )}

        {sections.map((section, index) => {
          const open = openGroups[section.key] ?? index === 0;
          const limit = limits[section.key] || PAGE;
          const count = isRec ? section.recs.length : section.occs.length;
          const total = section.recs.reduce((sum, row) => sum + totalsOf(row.record).total, 0);
          return (
            <GroupSection
              key={section.key}
              label={section.label}
              count={count}
              summary={isRec ? `${nf(total)} total · ${nf(total / Math.max(1, count))} average` : "Not yet recorded"}
              open={open}
              onToggle={() => setOpenGroups({ ...openGroups, [section.key]: !open })}
              moreLabel={count > limit ? `Show ${Math.min(PAGE, count - limit)} more of ${count - limit}` : undefined}
              onMore={() => setLimits({ ...limits, [section.key]: limit + PAGE })}
            >
              {isRec ? (
                <GridTable
                  columns={recColumns}
                  rows={section.recs.slice(0, limit)}
                  getRowId={(row) => row.record.id}
                  onRowClick={canRecord ? (row) => setTarget({ record: row.record }) : undefined}
                  minWidth="1180px"
                  actionsWidth="150px"
                  renderActions={
                    canRecord || canDelete
                      ? (row) => (
                          <>
                            {canRecord && (
                              <UiButton size="sm" onClick={() => setTarget({ record: row.record })}>
                                Edit
                              </UiButton>
                            )}
                            {canDelete && (
                              <UiButton size="sm" tone="danger" onClick={() => setDeleting(row)}>
                                Delete
                              </UiButton>
                            )}
                          </>
                        )
                      : undefined
                  }
                />
              ) : (
                <GridTable
                  columns={unColumns}
                  rows={section.occs.slice(0, limit)}
                  getRowId={(occ) => occ.id}
                  onRowClick={canRecord ? (occ) => setTarget({ eventId: occ.id }) : undefined}
                  minWidth="960px"
                  actionsWidth="140px"
                  renderActions={
                    canRecord
                      ? (occ) => (
                          <UiButton size="sm" tone="primary" onClick={() => setTarget({ eventId: occ.id })}>
                            Record now
                          </UiButton>
                        )
                      : undefined
                  }
                />
              )}
            </GroupSection>
          );
        })}

        {!loading && list.length === 0 && (
          <SectionEmpty
            title={isRec ? "No records match" : "Nothing awaiting a headcount"}
            text={
              isRec
                ? "No attendance records match these filters. Try another month or service."
                : "Every service in this view has a headcount."
            }
            action={
              filterCount ? (
                <UiButton onClick={() => setFilters(EMPTY_FILTERS)}>Reset filters</UiButton>
              ) : undefined
            }
          />
        )}
      </div>

      <RecordAttendanceDialog
        target={target}
        onClose={() => setTarget(null)}
        onSaved={() => refetch()}
        options={unrecorded}
        byId={byId}
        usualFor={usualFor}
      />

      <DialogShell
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this record?"
        subtitle={
          deleting
            ? `${deleting.name} on ${fmtDate(deleting.record.date)} (${nf(totalsOf(deleting.record).total)} people) will be removed and the service will show as awaiting a headcount.`
            : undefined
        }
        ctaLabel="Delete record"
        ctaTone="danger"
        onConfirm={confirmDelete}
        loading={deleteBusy}
      />
    </PageOutline>
  );
}
