import { useMemo, useState } from "react";

import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { downloadCsv } from "@/pages/HomePage/pages/Attendance/utils/attendanceModel";
import { cn } from "@/utils/cn";

import { Dot, KpiCard, PageHeading, Pill, type PillTone, Segmented, UiButton } from "../Components/eventsUi";
import {
  addDays,
  attendanceFor,
  EVENT_TYPES,
  fmtShortDay,
  keyToDate,
  MONTHS,
  plural,
  type ScheduledEvent,
  TYPE_TABS,
  type TypeFilter,
  todayKey,
  typeColor,
  typeLabel,
  weekdayOf,
} from "../utils/eventsModel";
import { useEventsForYears, useHeadcounts } from "../utils/useEventsData";

type Period = "month" | "3m" | "year";

const periodRange = (period: Period, today: string): { from: string; label: string } => {
  const date = keyToDate(today);
  const year = date.getFullYear();
  const month = date.getMonth();
  if (period === "month") {
    return { from: `${today.slice(0, 7)}-01`, label: `${MONTHS[month]} ${year}` };
  }
  if (period === "3m") {
    const start = new Date(year, month - 2, 1);
    const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
    const sameYear = start.getFullYear() === year;
    return {
      from,
      label: `${MONTHS[start.getMonth()].slice(0, 3)}${sameYear ? "" : ` ${start.getFullYear()}`} – ${MONTHS[month].slice(0, 3)} ${year}`,
    };
  }
  return { from: `${year}-01-01`, label: `${year} so far` };
};

const rateTone = (rate: number): PillTone => (rate >= 80 ? "success" : rate >= 60 ? "warning" : "danger");

interface Held {
  event: ScheduledEvent;
  attendance: number;
}

const EventsAnalytics = () => {
  const today = todayKey();
  const [period, setPeriod] = useState<Period>("3m");
  const [type, setType] = useState<TypeFilter>("all");
  const range = periodRange(period, today);

  const years = useMemo(() => {
    const list = [Number(range.from.slice(0, 4)), Number(today.slice(0, 4)), Number(addDays(today, 30).slice(0, 4))];
    return Array.from(new Set(list));
  }, [range.from, today]);
  const { events, loading, failed } = useEventsForYears(years);
  const { headcounts } = useHeadcounts();

  const held = useMemo<Held[]>(
    () =>
      events
        .filter(
          (event) =>
            event.date >= range.from &&
            event.date < today &&
            (type === "all" || event.type === type)
        )
        .map((event) => ({ event, attendance: attendanceFor(event, headcounts) }))
        .filter((row): row is Held => row.attendance !== null)
        .sort((a, b) => a.event.date.localeCompare(b.event.date)),
    [events, headcounts, range.from, today, type]
  );

  const total = held.reduce((sum, row) => sum + row.attendance, 0);
  const regHeld = held.filter((row) => row.event.requiresRegistration);
  const regCount = regHeld.reduce((sum, row) => sum + row.event.registrations, 0);
  const regAttended = regHeld.reduce((sum, row) => sum + row.attendance, 0);
  const upcoming30 = events.filter(
    (event) => event.date >= today && event.date <= addDays(today, 30) && (type === "all" || event.type === type)
  ).length;

  const weeks = useMemo(() => {
    const map = new Map<string, number>();
    held.forEach((row) => {
      const week = addDays(row.event.date, -weekdayOf(row.event.date));
      map.set(week, (map.get(week) ?? 0) + row.attendance);
    });
    return Array.from(map.entries())
      .map(([week, value]) => ({ week, value }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [held]);
  const weekMax = Math.max(1, ...weeks.map((week) => week.value));

  const byEvent = useMemo(() => {
    const map = new Map<string, { name: string; type: string; values: number[] }>();
    held.forEach((row) => {
      const key = row.event.eventNameId || row.event.name;
      const entry = map.get(key) ?? { name: row.event.name, type: row.event.type, values: [] };
      entry.values.push(row.attendance);
      map.set(key, entry);
    });
    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        avg: Math.round(entry.values.reduce((sum, value) => sum + value, 0) / entry.values.length),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [held]);
  const eventMax = Math.max(1, ...byEvent.map((row) => row.avg));

  const mix = EVENT_TYPES.map((item) => ({
    ...item,
    count: held.filter((row) => row.event.type === item.key).length,
  })).filter((item) => item.count > 0);

  const regRows = [...regHeld].sort((a, b) => b.event.date.localeCompare(a.event.date));

  const exportCsv = () =>
    downloadCsv(`events-analytics-${range.from}-to-${today}.csv`, [
      ["Event", "Type", "Date", "Start", "Attendance", "Registered", "Capacity"],
      ...held.map((row) => [
        row.event.name,
        typeLabel(row.event.type),
        row.event.date,
        row.event.start,
        row.attendance,
        row.event.requiresRegistration ? row.event.registrations : "",
        row.event.capacity ?? "",
      ]),
    ]);

  return (
    <PageOutline className="flex flex-col gap-4">
      <div className="mb-2">
        <PageHeading
          title="Events analytics"
          subtitle={`How many came, which gatherings draw people, and who shows up after registering · ${range.label}`}
          actions={
            <UiButton onClick={exportCsv} disabled={!held.length}>
              Export CSV
            </UiButton>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Segmented
          ariaLabel="Period"
          items={[
            { key: "month", label: "This month" },
            { key: "3m", label: "Last 3 months" },
            { key: "year", label: "This year" },
          ]}
          value={period}
          onChange={setPeriod}
          scroll
        />
        <Segmented ariaLabel="Type" items={TYPE_TABS} value={type} onChange={setType} scroll />
      </div>

      {failed && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn’t load events for this period. Refresh the page to try again.
        </p>
      )}

      <div className={cn("grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4", loading && "opacity-60")}>
        <KpiCard label="Events held" value={held.length} sub={`${plural(upcoming30, "event")} coming up in the next 30 days`} />
        <KpiCard label="Total attendance" value={total.toLocaleString()} sub={`Across ${plural(held.length, "event")}`} />
        <KpiCard
          label="Average per event"
          value={held.length ? Math.round(total / held.length).toLocaleString() : "—"}
          sub="People per gathering"
        />
        <KpiCard
          label="Show-up rate"
          value={regCount ? `${Math.round((regAttended / regCount) * 100)}%` : "—"}
          sub={regCount ? `${regAttended} of ${regCount} registrants came` : "No registration events"}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
          <h2 className="text-base font-semibold text-primary">Attendance by week</h2>
          {weeks.length ? (
            <div className="overflow-x-auto">
              <div
                role="img"
                aria-label="Weekly attendance chart"
                className="flex h-[200px] min-w-min items-end gap-2 pt-5"
              >
                {weeks.map((week) => {
                  const date = keyToDate(week.week);
                  return (
                    <div
                      key={week.week}
                      title={`Week of ${fmtShortDay(week.week)}: ${week.value.toLocaleString()}`}
                      className="flex h-full flex-[1_0_28px] flex-col items-center justify-end gap-1 tablet:flex-[1_0_40px]"
                    >
                      <span className="text-xs text-gray-600">{week.value.toLocaleString()}</span>
                      <span
                        className="w-full max-w-10 rounded-t bg-primary"
                        style={{ height: `${Math.round((week.value / weekMax) * 140)}px` }}
                      />
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        {date.getDate()} {MONTHS[date.getMonth()].slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No attendance recorded in this period.</p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-lightGray bg-white p-4">
          <h2 className="text-base font-semibold text-primary">Average attendance by event</h2>
          {byEvent.length === 0 && <p className="text-sm text-gray-500">No attendance recorded in this period.</p>}
          {byEvent.map((row) => (
            <div key={row.name} className="flex flex-col gap-1">
              <div className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium text-primary">{row.name}</span>
                <span className="whitespace-nowrap">
                  <strong className="font-semibold text-primary">{row.avg.toLocaleString()}</strong>{" "}
                  <span className="text-xs text-gray-500">· {plural(row.values.length, "time")}</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full"
                  style={{ width: `${(row.avg / eventMax) * 100}%`, background: typeColor(row.type) }}
                />
              </div>
            </div>
          ))}
          {mix.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
              <span className="text-xs font-semibold uppercase text-gray-500">Mix of events held</span>
              <div className="flex h-3 overflow-hidden rounded-full">
                {mix.map((item) => (
                  <span key={item.key} style={{ width: `${(item.count / held.length) * 100}%`, background: item.color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {mix.map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                    <Dot color={item.color} />
                    {item.label} · {item.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]">
        <div className="p-4">
          <h2 className="text-base font-semibold text-primary">Registration vs. attendance</h2>
          <p className="text-sm text-gray-600">For events that needed registration.</p>
        </div>
        {regRows.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[560px] text-sm text-primary">
              <div className="grid grid-cols-[minmax(180px,2fr)_110px_110px_100px_100px] bg-lightGray font-semibold">
                {["Event", "Date", "Registered", "Attended", "Show-up"].map((head) => (
                  <span key={head} className="px-4 py-3">
                    {head}
                  </span>
                ))}
              </div>
              {regRows.map((row) => {
                const rate = Math.round((row.attendance / Math.max(1, row.event.registrations)) * 100);
                return (
                  <div
                    key={row.event.id}
                    className="grid min-h-14 grid-cols-[minmax(180px,2fr)_110px_110px_100px_100px] items-center border-b border-lightGray"
                  >
                    <span className="px-4 py-3 font-medium">{row.event.name}</span>
                    <span className="px-4 py-3 text-gray-600">{fmtShortDay(row.event.date)}</span>
                    <span className="px-4 py-3">
                      {row.event.registrations}
                      {row.event.capacity ? ` / ${row.event.capacity}` : ""}
                    </span>
                    <span className="px-4 py-3">{row.attendance.toLocaleString()}</span>
                    <span className="px-4 py-3">
                      <Pill tone={rateTone(rate)}>{rate}%</Pill>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="px-4 pb-4 text-sm text-gray-500">No registration events in this period.</p>
        )}
      </div>
    </PageOutline>
  );
};

export { EventsAnalytics };
export default EventsAnalytics;
