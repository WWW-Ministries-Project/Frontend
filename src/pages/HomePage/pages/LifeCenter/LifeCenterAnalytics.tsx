import { ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type { LeaderReminderReason } from "@/utils/api/lifeCenter/interfaces";

import PageOutline from "../../Components/PageOutline";
import {
  CellText,
  GridTable,
  PageHeading,
  Pill,
  PillTabs,
  type PillTone,
  SelectInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import {
  DAYF,
  DAYS,
  MON,
  MONF,
  OVERDUE_DAYS,
  addDaysKey,
  dow,
  downloadCsv,
  errorText,
  firstWord,
  fmtD,
  fmtS,
  gapOf,
  ghsOf,
  joinAnd,
  lcDetailPath,
  moneyMix,
  n0,
  n1,
  pctN,
  plural,
  rateColor,
  rateTone,
  useToday,
} from "./utils/lcModel";
import { Center, useLifeCenterOverview } from "./utils/useLifeCenterOverview";
import { useLifeCenterAccess } from "./utils/useLifeCenterAccess";

type Metric = "meetings" | "attendance" | "offering";
type Sort = "held" | "rate" | "avg" | "off" | "last";
type Bucket = { key: string; l: string };
type Meeting = ReturnType<typeof useLifeCenterOverview>["meetings"][number];
type Soul = ReturnType<typeof useLifeCenterOverview>["souls"][number];

/** Week of the month as the original analytics counted it: days 1–7 are week 1. */
const weekOfMonth = (day: string) => String(Math.ceil(Number(day.slice(8, 10)) / 7));
const peopleAt = (g: Meeting) => g.attendee_ids.length + g.first_timer_ids.length;

/** The original performance rating: compared with the average souls won per center. */
const performanceOf = (count: number, average: number): { label: string; tone: PillTone } => {
  if (average <= 0) return { label: "No data", tone: "neutral" };
  if (count > average) return { label: "Excellent", tone: "primary" };
  if (Math.abs(count - average) < 0.001) return { label: "Good", tone: "info" };
  return { label: "Needs support", tone: "warning" };
};

const Section = ({ title, sub }: { title: string; sub: string }) => (
  <div className="flex flex-col gap-1 border-t border-lightGray pt-6 first:border-t-0 first:pt-0">
    <h2 className="text-xl font-semibold leading-7 text-primary">{title}</h2>
    <p className="text-sm text-gray-600">{sub}</p>
  </div>
);

const Kpis = ({ items, loaded }: { items: { l: string; v: string; s: string; c?: string }[]; loaded: boolean }) => (
  <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
    {items.map((k) => (
      <div key={k.l} className="flex min-w-0 flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4">
        <p className="text-sm text-gray-600">{k.l}</p>
        <p className="break-words text-2xl font-semibold leading-8 text-primary">{loaded ? k.v : "—"}</p>
        <p className="text-xs" style={{ color: k.c ?? "rgb(var(--color-gray-500))" }}>
          {loaded ? k.s : " "}
        </p>
      </div>
    ))}
  </div>
);

const Card = ({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) => (
  <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-lightGray bg-white p-5 tablet:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        {sub && <p className="text-sm text-gray-600">{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const HBar = ({ label, value, width, sub }: { label: string; value: ReactNode; width: string; sub: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between gap-3 text-sm text-primary">
      <span className="min-w-0 truncate">{label}</span>
      <span className="whitespace-nowrap font-semibold">{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
      <div className="h-full bg-primary" style={{ width }} />
    </div>
    <span className="text-xs text-gray-500">{sub}</span>
  </div>
);

const Legend = ({ items }: { items: { label: string; className: string }[] }) => (
  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
    {items.map((i) => (
      <span key={i.label} className="inline-flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-sm ${i.className}`} />
        {i.label}
      </span>
    ))}
  </div>
);

/** Vertical bars, one or two series per bucket. Scrolls sideways when there are many buckets. */
const Bars = ({
  rows,
  loaded,
}: {
  rows: { key: string; l: string; label: string; tip: string; a?: number; b: number; max: number; aClass?: string; bClass?: string; stack?: boolean }[];
  loaded: boolean;
}) => (
  <div className="overflow-x-auto">
    <div className="flex flex-col gap-2" style={{ minWidth: Math.max(320, rows.length * 48) }}>
      <div className="flex h-[220px] items-end gap-2 border-b border-gray-200">
        {rows.map((r) => (
          <div key={r.key} title={r.tip} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="whitespace-nowrap text-xs font-semibold text-primary">{loaded ? r.label : ""}</span>
            {r.stack ? (
              <div className="flex h-full w-full max-w-14 flex-col justify-end">
                <div className={`w-full rounded-t ${r.aClass}`} style={{ height: `${((r.a ?? 0) / r.max) * 100}%` }} />
                <div className={`w-full ${r.a ? "" : "rounded-t"} ${r.bClass}`} style={{ height: `${(r.b / r.max) * 100}%` }} />
              </div>
            ) : (
              <div className="flex h-full w-full max-w-14 items-end" style={{ gap: r.a !== undefined ? 3 : 0 }}>
                {r.a !== undefined && <div className={`flex-1 rounded-t ${r.aClass}`} style={{ height: `${(r.a / r.max) * 100}%` }} />}
                <div className={`flex-1 rounded-t ${r.bClass}`} style={{ height: `${(r.b / r.max) * 100}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {rows.map((r) => (
          <span key={r.key} className="min-w-0 flex-1 truncate text-center text-xs text-gray-500">
            {r.l}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Souls won through life centers (the original analytics, filtered by year,
 * month and week of the month), followed by meetings and offering. With
 * `fixedCenterId` it shows one center only (the leader's view).
 */
export const LifeCenterAnalyticsView = ({
  fixedCenterId,
  embedded,
  eyebrow,
}: {
  fixedCenterId?: string | number;
  embedded?: boolean;
  /** Small caps label above the title (member portal). */
  eyebrow?: string;
}) => {
  const navigate = useNavigate();
  const today = useToday();
  const thisYear = Number(today.slice(0, 4));
  // A fixed center is the member portal's own center: its leadership team.
  const can = useLifeCenterAccess(Boolean(fixedCenterId));
  const canRemind = can.remindLeader && !fixedCenterId;

  const [year, setYear] = useState(String(thisYear));
  const [month, setMonth] = useState("all");
  const [week, setWeek] = useState("all");
  const [lcSel, setLcSel] = useState("");
  const [metric, setMetric] = useState<Metric>("meetings");
  const [sort, setSort] = useState<Sort>("held");
  const [reminded, setReminded] = useState<Record<number, boolean>>({});

  const allYears = year === "all";
  const fetchFrom = allYears ? "" : `${year}-01-01`;
  const fetchTo = allYears || year === String(thisYear) ? today : `${year}-12-31`;
  const { centers: allCenters, meetings: allMeetings, souls: allSouls, loaded } = useLifeCenterOverview(
    fetchFrom,
    fetchTo,
    fixedCenterId ?? null
  );

  const centerFilter = fixedCenterId ? String(fixedCenterId) : lcSel;
  const cs = allCenters.filter((c) => !centerFilter || String(c.id) === centerFilter);
  const ids = new Set(cs.map((c) => c.id));
  const byId = new Map(allCenters.map((c) => [c.id, c]));

  /* --------------------------------- period --------------------------------- */

  const inPeriod = (day: string) =>
    (allYears || day.slice(0, 4) === year) &&
    (month === "all" || String(Number(day.slice(5, 7))) === month) &&
    (week === "all" || weekOfMonth(day) === week);

  const souls = allSouls.filter((s) => ids.has(s.life_center_id) && inPeriod(s.date_won));
  const meetings = allMeetings.filter((g) => ids.has(g.life_center_id) && inPeriod(g.date));

  const firstYear = useMemo(() => {
    const seen = [...allSouls.map((s) => s.date_won), ...allMeetings.map((g) => g.date), ...allCenters.map((c) => c.created)]
      .map((d) => Number(d.slice(0, 4)))
      .filter((y) => y > 1990);
    return Math.min(thisYear, ...seen);
  }, [allSouls, allMeetings, allCenters, thisYear]);

  // Chart buckets: years for "All years", months for a year, weeks of the month for a month, days for a week.
  const bucketKey = (day: string) =>
    allYears ? day.slice(0, 4) : month === "all" ? day.slice(5, 7) : week === "all" ? weekOfMonth(day) : day;
  const buckets: Bucket[] = useMemo(() => {
    if (allYears) return Array.from({ length: thisYear - firstYear + 1 }, (_, i) => String(firstYear + i)).map((y) => ({ key: y, l: y }));
    if (month === "all") {
      const last = Number(year) === thisYear ? Number(today.slice(5, 7)) : 12;
      return Array.from({ length: last }, (_, i) => ({ key: String(i + 1).padStart(2, "0"), l: MON[i] }));
    }
    if (week === "all") return ["1", "2", "3", "4", "5"].map((w) => ({ key: w, l: `Week ${w}` }));
    const m = month.padStart(2, "0");
    const out: Bucket[] = [];
    for (let d = Number(week) * 7 - 6; d <= Number(week) * 7; d++) {
      const day = `${year}-${m}-${String(d).padStart(2, "0")}`;
      if (Number(day.slice(8)) !== d || new Date(`${day}T00:00:00`).getMonth() + 1 !== Number(month)) continue;
      out.push({ key: day, l: `${dow(day)} ${d}` });
    }
    return out;
  }, [allYears, month, week, year, thisYear, firstYear, today]);

  /** Scheduled meetings per center and bucket, counted from each center's meeting days up to yesterday. */
  const scheduled = useMemo(() => {
    const yesterday = addDaysKey(today, -1);
    const out = new Map<number, Map<string, number>>();
    cs.forEach((c) => {
      const per = new Map<string, number>();
      const start = allYears ? c.created : `${year}-01-01` > c.created ? `${year}-01-01` : c.created;
      const end = allYears ? yesterday : `${year}-12-31` < yesterday ? `${year}-12-31` : yesterday;
      if (c.days.length) {
        for (let d = start; d <= end; d = addDaysKey(d, 1)) {
          if (c.days.includes(dow(d)) && inPeriod(d)) per.set(bucketKey(d), (per.get(bucketKey(d)) ?? 0) + 1);
        }
      }
      out.set(c.id, per);
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs.map((c) => c.id).join(","), allCenters, year, month, week, today]);
  const expectedFor = (centerIds: number[], key?: string) =>
    centerIds.reduce((t, id) => {
      const per = scheduled.get(id);
      if (!per) return t;
      if (key !== undefined) return t + (per.get(key) ?? 0);
      let sum = 0;
      per.forEach((n) => (sum += n));
      return t + sum;
    }, 0);

  const periodLabel = allYears
    ? "All years"
    : `${month === "all" ? "" : `${MONF[Number(month) - 1]} `}${year}${week === "all" ? "" : ` · week ${week}`}`;

  /* -------------------------------- souls won -------------------------------- */

  const soulsByCenter = cs
    .map((c) => {
      const list = souls.filter((s) => s.life_center_id === c.id);
      return { c, list, count: list.length, conv: list.filter((s) => s.converted).length };
    })
    .sort((a, b) => b.count - a.count);
  const activeCenters = soulsByCenter.filter((r) => r.count > 0);
  const average = activeCenters.length ? souls.length / activeCenters.length : 0;
  const topCenter = activeCenters[0];
  const converted = souls.filter((s) => s.converted).length;
  const locations = new Set(souls.map((s) => s.city.trim().toLowerCase()).filter(Boolean)).size;
  const below = average > 0 ? activeCenters.filter((r) => r.count < average).length : 0;
  const consistent = activeCenters.filter((r) => r.count >= 2).length;

  const soulKpis = [
    { l: "Souls won", v: String(souls.length), s: `${converted} have become members (${pctN(converted, souls.length)}%)` },
    { l: "Active life centers", v: String(activeCenters.length), s: `of ${plural(cs.length, "center")} won souls` },
    { l: "Average per center", v: n1(average), s: "souls won per active center" },
    { l: "Still to follow up", v: String(souls.length - converted), s: "not yet church members" },
    { l: "Locations reached", v: String(locations), s: "cities or areas recorded" },
  ];

  const soulTrend = buckets.map((b) => {
    const list = souls.filter((s) => bucketKey(s.date_won) === b.key);
    return { b, n: list.length, conv: list.filter((s) => s.converted).length };
  });
  const soulMax = Math.max(1, ...soulTrend.map((t) => t.n));
  const peak = [...soulTrend].sort((a, b) => b.n - a.n)[0];
  const lastTwo = soulTrend.filter((t, i) => i < soulTrend.length && (t.n > 0 || i >= soulTrend.length - 2)).slice(-2);

  const insights: { tone: PillTone; p: string; s: string }[] = [];
  if (peak && peak.n) insights.push({ tone: "success", p: "Peak period", s: `${peak.b.l} was the most productive with ${plural(peak.n, "soul")} won.` });
  if (topCenter) insights.push({ tone: "info", p: "Top center", s: `${topCenter.c.name} leads with ${plural(topCenter.count, "soul")}, led by ${topCenter.c.leader ?? "no one yet"}.` });
  if (activeCenters.length) insights.push({ tone: "info", p: "Average", s: `Active centers are winning ${n1(average)} souls each in this period.` });
  if (below) insights.push({ tone: "warning", p: "Growth", s: `${plural(below, "center")} ${below === 1 ? "is" : "are"} below average and could use support.` });
  if (activeCenters.length) insights.push({ tone: "success", p: "Consistency", s: `${pctN(consistent, activeCenters.length)}% of active centers won more than one soul.` });
  if (locations) insights.push({ tone: "info", p: "Reach", s: `Souls were won in ${plural(locations, "location")}.` });
  if (lastTwo.length === 2 && !allYears && month === "all") {
    const [prev, last] = lastTwo;
    insights.push(
      prev.n === 0
        ? { tone: last.n ? "success" : "neutral", p: "Trend", s: last.n ? `New growth in ${last.b.l} after none in ${prev.b.l}.` : `No souls won in ${prev.b.l} or ${last.b.l}.` }
        : {
            tone: last.n >= prev.n ? "success" : "warning",
            p: "Trend",
            s: `${last.n >= prev.n ? "Up" : "Down"} ${Math.abs(pctN(last.n - prev.n, prev.n))}% from ${prev.b.l} to ${last.b.l}.`,
          }
    );
  }
  if (!insights.length) insights.push({ tone: "neutral", p: "No data", s: "No souls won in this period yet." });

  /* --------------------------------- meetings -------------------------------- */

  const agg = (list: Meeting[], centerIds: number[], key?: string) => {
    const people = list.reduce((t, g) => t + peopleAt(g), 0);
    const exp = expectedFor(centerIds, key);
    return {
      held: list.length,
      exp,
      rate: Math.min(100, pctN(list.length, exp)),
      people,
      attendees: list.reduce((t, g) => t + g.attendee_ids.length, 0),
      ft: list.reduce((t, g) => t + g.first_timer_ids.length, 0),
      avg: list.length ? people / list.length : 0,
      ghs: ghsOf(list),
      ghsMeetings: list.filter((g) => g.currency === "GHS").length,
      money: moneyMix(list),
    };
  };
  const csIds = cs.map((c) => c.id);
  const M = agg(meetings, csIds);
  const meetKpis = [
    {
      l: "Meetings held",
      v: `${M.held} of ${M.exp}`,
      s: M.exp ? `${M.rate}% of scheduled meetings` : "None scheduled in this period",
      c: M.exp ? rateColor(M.rate) : undefined,
    },
    { l: "Total attendance", v: n0(M.people), s: `${n0(M.attendees)} attendees · ${n0(M.ft)} first-timers` },
    { l: "Average attendance", v: n1(M.avg), s: "people per meeting" },
    { l: "First-timers", v: String(M.ft), s: M.held ? `${n1(M.ft / M.held)} per meeting` : "No meetings yet" },
    { l: "Offering raised", v: M.money, s: `across ${plural(M.held, "meeting")}` },
    {
      l: "Average offering",
      v: `GHS ${n0(M.ghsMeetings ? M.ghs / M.ghsMeetings : 0)}`,
      s: M.ghsMeetings ? "per meeting (cedi meetings)" : "No cedi offerings yet",
    },
  ];

  const meetTrend = buckets.map((b) => {
    const list = meetings.filter((g) => bucketKey(g.date) === b.key);
    return { b, x: agg(list, csIds, b.key) };
  });
  const meetMax = Math.max(
    1,
    ...meetTrend.map((t) => (metric === "meetings" ? Math.max(t.x.held, t.x.exp) : metric === "attendance" ? t.x.people : t.x.ghs))
  );
  const chartText: Record<Metric, [string, string]> = {
    meetings: ["Meetings held against scheduled", "Based on each center’s meeting days"],
    attendance: ["Attendance", "Attendees and first-timers at meetings"],
    offering: ["Offering raised", "GHS only. Other currencies are listed in the totals and table."],
  };

  const meetRows = cs.map((c) => {
    const list = meetings.filter((g) => g.life_center_id === c.id);
    return { c, x: agg(list, [c.id]), gap: gapOf(c.last, today) };
  });
  const sorters: Record<Sort, (a: (typeof meetRows)[number], b: (typeof meetRows)[number]) => number> = {
    held: (a, b) => b.x.held - a.x.held,
    rate: (a, b) => b.x.rate - a.x.rate,
    avg: (a, b) => b.x.avg - a.x.avg,
    off: (a, b) => b.x.ghs - a.x.ghs,
    last: (a, b) => b.gap - a.gap,
  };
  const meetSorted = [...meetRows].sort(sorters[sort]);
  const offerTop = meetRows.filter((r) => r.x.held).sort(sorters.off).slice(0, 6);
  const offerMax = Math.max(1, ...offerTop.map((r) => r.x.ghs));
  const regPill = (x: ReturnType<typeof agg>): { label: string; tone: PillTone } =>
    !x.exp
      ? { label: "None scheduled", tone: "neutral" }
      : { label: `${x.rate}% · ${x.rate >= 85 ? "Regular" : x.rate >= 60 ? "Irregular" : "Often missed"}`, tone: rateTone(x.rate) };
  const lastText = (r: (typeof meetRows)[number]) => (r.c.last ? `${fmtS(r.c.last)} (${r.gap}d)` : "Never");

  const byDay: Record<string, number[]> = {};
  meetings.forEach((g) => {
    const d = dow(g.date);
    (byDay[d] = byDay[d] || []).push(peopleAt(g));
  });
  const dayList = DAYS.filter((d) => byDay[d]).map((d) => ({ d, avg: byDay[d].reduce((a, b) => a + b, 0) / byDay[d].length, n: byDay[d].length }));
  const dMax = Math.max(1, ...dayList.map((x) => x.avg));

  /* -------------------------------- attention -------------------------------- */

  const remind = async (c: Center, reason: LeaderReminderReason) => {
    try {
      const response = await api.post.remindLifeCenterLeader({ lifeCenterId: c.id, reason });
      setReminded((prev) => ({ ...prev, [c.id]: true }));
      notify.success({
        title: "Reminder sent",
        message: `${response?.data?.sent_to || c.leader || "The leader"} has been asked to update ${c.name}.`,
      });
    } catch (error) {
      notify.error({ title: "Couldn’t send the reminder", message: errorText(error, "Try again later.") });
    }
  };
  const attention = meetRows
    .map((r) => {
      const leader = r.c.leader ?? "the leader";
      const daysText = r.c.days.length ? `Meets on ${joinAnd(r.c.days.map((d) => DAYF[d]))}, led by ${leader}.` : `Led by ${leader}.`;
      if (r.gap > OVERDUE_DAYS)
        return {
          r,
          tone: "danger" as PillTone,
          pill: "Overdue",
          title: r.c.last ? `${r.c.name} hasn’t met in ${r.gap} days` : `${r.c.name} has never recorded a meeting`,
          text: `${r.c.last ? `Last meeting ${fmtD(r.c.last)}. ` : ""}${daysText}`,
          reason: "overdue" as LeaderReminderReason,
          k: 0,
          g: r.gap,
        };
      if (r.x.exp >= 3 && r.x.rate < 60)
        return {
          r,
          tone: "warning" as PillTone,
          pill: "Irregular",
          title: `${r.c.name} held ${r.x.held} of ${r.x.exp} scheduled meetings`,
          text: "Meetings are often skipped in this period. Check whether the meeting day still works.",
          reason: "irregular" as LeaderReminderReason,
          k: 1,
          g: r.x.rate,
        };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.k - b!.k || b!.g - a!.g) as {
    r: (typeof meetRows)[number];
    tone: PillTone;
    pill: string;
    title: string;
    text: string;
    reason: LeaderReminderReason;
  }[];

  /* ---------------------------------- export --------------------------------- */

  const exportCsv = () => {
    downloadCsv(`life-center-analytics-${periodLabel.replace(/\W+/g, "-").toLowerCase()}.csv`, [
      ["Period", periodLabel],
      [],
      [
        "Life center",
        "Leader",
        "Souls won",
        "Became members",
        "Performance",
        "Meetings held",
        "Meetings scheduled",
        "Held %",
        "Total attendance",
        "Avg attendance",
        "First-timers",
        "Offering",
        "Last met",
      ],
      ...cs.map((c) => {
        const s = soulsByCenter.find((r) => r.c.id === c.id);
        const m = meetRows.find((r) => r.c.id === c.id)!;
        return [
          c.name,
          c.leader ?? "",
          s?.count ?? 0,
          s?.conv ?? 0,
          performanceOf(s?.count ?? 0, average).label,
          m.x.held,
          m.x.exp,
          m.x.rate,
          m.x.people,
          n1(m.x.avg),
          m.x.ft,
          m.x.money,
          c.last ?? "",
        ];
      }),
    ]);
    notify.success({ title: "CSV downloaded", message: `Analytics for ${periodLabel} saved.` });
  };

  /* --------------------------------- controls -------------------------------- */

  const yearOpts = [
    { value: "all", label: "All years" },
    ...Array.from({ length: thisYear - firstYear + 1 }, (_, i) => String(thisYear - i)).map((y) => ({ value: y, label: y })),
  ];
  const controls = (
    <>
      <SelectInput
        aria-label="Year"
        className="w-auto"
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          if (e.target.value === "all") {
            setMonth("all");
            setWeek("all");
          }
        }}
        options={yearOpts}
      />
      <SelectInput
        aria-label="Month"
        className="w-auto"
        value={month}
        disabled={allYears}
        onChange={(e) => {
          setMonth(e.target.value);
          if (e.target.value === "all") setWeek("all");
        }}
        options={[{ value: "all", label: "All months" }, ...MONF.map((m, i) => ({ value: String(i + 1), label: m }))]}
      />
      <SelectInput
        aria-label="Week of the month"
        className="w-auto"
        value={week}
        disabled={allYears}
        onChange={(e) => setWeek(e.target.value)}
        options={[{ value: "all", label: "All weeks" }, ...["1", "2", "3", "4", "5"].map((w) => ({ value: w, label: `Week ${w}` }))]}
      />
      {!fixedCenterId && (
        <SelectInput
          aria-label="Life center"
          className="w-auto max-w-full"
          value={lcSel}
          onChange={(e) => setLcSel(e.target.value)}
          options={[{ value: "", label: "All life centers" }, ...allCenters.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
      )}
      {can.exportData && (
        <UiButton onClick={exportCsv} disabled={!cs.length}>
          Export CSV
        </UiButton>
      )}
    </>
  );

  const note = `${periodLabel}${centerFilter ? (cs[0] ? ` · ${cs[0].name}` : "") : ` · ${plural(allCenters.length, "life center")}`}. Week 1 is days 1–7 of the month. Scheduled meetings are counted from each center’s meeting days up to yesterday.`;

  const body = (
    <>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            {eyebrow && <p className="text-xs font-semibold tracking-[0.04em] text-gray-500">{eyebrow}</p>}
            {eyebrow ? (
              <h1 className="text-xl font-semibold leading-8 text-primary tablet:text-2xl">Analytics</h1>
            ) : (
              <h2 className="text-xl font-semibold leading-7 text-primary">Analytics</h2>
            )}
            <p className="text-sm text-gray-600">Souls won, meetings and offering for this center.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">{controls}</div>
        </div>
      ) : (
        <PageHeading
          title="Life center analytics"
          subtitle="Track soul-winning across life centers, and how their meetings and offerings are going."
          actions={controls}
        />
      )}
      <p className="text-xs text-gray-500">{note}</p>

      {/* ------------------------------ souls won ----------------------------- */}
      <Section title="Souls won" sub="People won through life centers in the selected period." />
      <Kpis items={soulKpis} loaded={loaded} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-4">
        <Card title="Souls won over time" sub={allYears ? "By year" : month === "all" ? "By month" : week === "all" ? "By week of the month" : "By day"}>
          <Legend items={[{ label: "Became members", className: "bg-secondary" }, { label: "Still to follow up", className: "bg-primary" }]} />
          <Bars
            loaded={loaded}
            rows={soulTrend.map((t) => ({
              key: t.b.key,
              l: t.b.l,
              label: String(t.n),
              tip: `${t.b.l}: ${plural(t.n, "soul")} won, ${t.conv} now members`,
              a: t.conv,
              b: t.n - t.conv,
              max: soulMax,
              aClass: "bg-secondary",
              bClass: "bg-primary",
              stack: true,
            }))}
          />
        </Card>
        {!fixedCenterId ? (
          <Card title="Top life centers" sub="By souls won, with who leads each one">
            {activeCenters.length ? (
              activeCenters.slice(0, 10).map((r) => (
                <HBar
                  key={r.c.id}
                  label={r.c.name}
                  value={r.count}
                  width={`${(r.count / Math.max(1, activeCenters[0].count)) * 100}%`}
                  sub={`${r.c.leader ?? "No leader yet"} · ${r.conv} now members`}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No souls won in this period.</p>
            )}
          </Card>
        ) : (
          <Card title="Who won them" sub="Souls won by each person in this period">
            {(() => {
              const by: Record<string, number> = {};
              souls.forEach((s: Soul) => {
                const k = s.won_by || "Unknown";
                by[k] = (by[k] || 0) + 1;
              });
              const list = Object.entries(by).sort((a, b) => b[1] - a[1]);
              const mx = Math.max(1, ...list.map((x) => x[1]));
              return list.length ? (
                list.slice(0, 8).map(([name, n]) => <HBar key={name} label={name} value={n} width={`${(n / mx) * 100}%`} sub={plural(n, "soul")} />)
              ) : (
                <p className="text-sm text-gray-500">No souls won in this period.</p>
              );
            })()}
          </Card>
        )}
      </div>
      <Card title="What stands out">
        <div className="-mt-1 flex flex-col">
          {insights.map((i) => (
            <div key={i.p} className="flex gap-3 border-b border-gray-200 py-3 last:border-b-0">
              <Pill tone={i.tone} className="flex-shrink-0 self-start">
                {i.p}
              </Pill>
              <p className="text-sm text-gray-700">{i.s}</p>
            </div>
          ))}
        </div>
      </Card>
      {!fixedCenterId && (
        <section className="flex min-w-0 flex-col gap-3">
          <div>
            <h3 className="text-base font-semibold text-primary">Souls won by life center</h3>
            <p className="text-sm text-gray-600">Performance compares each center with the average of {n1(average)} souls.</p>
          </div>
          {soulsByCenter.length ? (
            <>
              <div className="hidden md:block">
                <GridTable
                  rows={soulsByCenter}
                  loading={!loaded}
                  getRowId={(r) => String(r.c.id)}
                  onRowClick={(r) => navigate(lcDetailPath(r.c.id))}
                  minWidth="760px"
                  columns={[
                    { key: "name", header: "Life center", width: "minmax(200px,1.6fr)", render: (r) => <CellText strong main={r.c.name} sub={r.c.location} /> },
                    { key: "leader", header: "Leader", width: "minmax(160px,1fr)", render: (r) => <CellText main={r.c.leader ?? "No leader yet"} /> },
                    { key: "souls", header: "Souls won", width: "100px", render: (r) => <span className="font-semibold">{r.count}</span> },
                    { key: "conv", header: "Became members", width: "130px", render: (r) => `${r.conv} (${pctN(r.conv, r.count)}%)` },
                    {
                      key: "perf",
                      header: "Performance",
                      width: "140px",
                      render: (r) => {
                        const p = performanceOf(r.count, average);
                        return <Pill tone={p.tone}>{p.label}</Pill>;
                      },
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 md:hidden">
                {soulsByCenter.map((r) => {
                  const p = performanceOf(r.count, average);
                  return (
                    <button
                      key={r.c.id}
                      type="button"
                      onClick={() => navigate(lcDetailPath(r.c.id))}
                      className="flex items-start justify-between gap-3 rounded-xl border border-lightGray bg-white p-4 text-left text-sm text-primary"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{r.c.name}</p>
                        <p className="text-xs text-gray-500">
                          {r.c.leader ?? "No leader yet"} · {plural(r.count, "soul")} · {r.conv} members
                        </p>
                      </div>
                      <Pill tone={p.tone}>{p.label}</Pill>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">
              {loaded ? "No life centers to show." : "Loading life centers…"}
            </p>
          )}
        </section>
      )}

      {/* ------------------------------- meetings ----------------------------- */}
      <Section title="Meetings and offering" sub="How regularly centers meet, who turns up, and the offering raised." />
      <Kpis items={meetKpis} loaded={loaded} />

      {loaded && attention.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-amber-200 bg-white">
          <div className="flex flex-col gap-1 border-b border-amber-200 bg-amber-50 px-5 py-4">
            <h3 className="text-base font-semibold text-primary">Needs your attention</h3>
            <p className="text-sm text-gray-700">
              {plural(attention.length, "life center")} need follow-up. Overdue is based on today; irregular on the selected period.
            </p>
          </div>
          {attention.map((a) => (
            <div key={a.r.c.id} className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 last:border-b-0">
              <Pill tone={a.tone} className="flex-shrink-0">
                {a.pill}
              </Pill>
              <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                <p className="text-sm font-semibold text-primary">{a.title}</p>
                <p className="text-sm text-gray-600">{a.text}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canRemind && a.r.c.leader && (
                  <UiButton size="sm" onClick={() => remind(a.r.c, a.reason)} disabled={reminded[a.r.c.id]}>
                    {reminded[a.r.c.id] ? "Reminder sent" : `Remind ${firstWord(a.r.c.leader)}`}
                  </UiButton>
                )}
                {!fixedCenterId && (
                  <UiButton size="sm" tone="primary" onClick={() => navigate(lcDetailPath(a.r.c.id))}>
                    Open life center
                  </UiButton>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <Card
        title={chartText[metric][0]}
        sub={chartText[metric][1]}
        action={
          <PillTabs
            size="sm"
            ariaLabel="Chart metric"
            value={metric}
            onChange={setMetric}
            tabs={[
              { key: "meetings", label: "Meetings" },
              { key: "attendance", label: "Attendance" },
              { key: "offering", label: "Offering" },
            ]}
          />
        }
      >
        {metric === "meetings" && <Legend items={[{ label: "Scheduled", className: "bg-lightGray" }, { label: "Held", className: "bg-primary" }]} />}
        {metric === "attendance" && <Legend items={[{ label: "First-timers", className: "bg-secondary" }, { label: "Attendees", className: "bg-primary" }]} />}
        <Bars
          loaded={loaded}
          rows={meetTrend.map((t) => {
            const tip = `${t.b.l}: ${t.x.held} of ${t.x.exp} meetings, ${t.x.people} people (${t.x.ft} first-timers), ${t.x.money}`;
            if (metric === "meetings")
              return { key: t.b.key, l: t.b.l, label: `${t.x.held}/${t.x.exp}`, tip, a: t.x.exp, b: t.x.held, max: meetMax, aClass: "bg-lightGray", bClass: "bg-primary" };
            if (metric === "attendance")
              return { key: t.b.key, l: t.b.l, label: String(t.x.people), tip, a: t.x.ft, b: t.x.attendees, max: meetMax, aClass: "bg-secondary", bClass: "bg-primary", stack: true };
            return { key: t.b.key, l: t.b.l, label: t.x.ghs >= 1000 ? `${n1(t.x.ghs / 1000)}k` : n0(t.x.ghs), tip, b: t.x.ghs, max: meetMax, bClass: "bg-primary" };
          })}
        />
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-4">
        {!fixedCenterId && (
          <Card title="Offering by life center" sub="GHS raised at meetings in this period">
            {offerTop.length ? (
              offerTop.map((r) => (
                <HBar
                  key={r.c.id}
                  label={r.c.name}
                  value={`GHS ${n0(r.x.ghs)}`}
                  width={`${(r.x.ghs / offerMax) * 100}%`}
                  sub={`${plural(r.x.held, "meeting")} · GHS ${n0(r.x.ghsMeetings ? r.x.ghs / r.x.ghsMeetings : 0)} each${
                    r.x.money.includes("+") ? ` · ${r.x.money}` : ""
                  }`}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No offering recorded in this period.</p>
            )}
          </Card>
        )}
        <Card title="Turnout by meeting day" sub="Average attendance on each day meetings happen">
          {dayList.length ? (
            dayList.map((x) => (
              <HBar
                key={x.d}
                label={DAYF[x.d]}
                value={n1(x.avg)}
                width={`${(x.avg / dMax) * 100}%`}
                sub={`${plural(x.n, "meeting")}${
                  fixedCenterId
                    ? ""
                    : ` · ${cs
                        .filter((c) => c.days.includes(x.d))
                        .map((c) => c.name.replace(/ Life Center$/i, ""))
                        .join(", ")}`
                }`}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">No meetings in this period.</p>
          )}
        </Card>
      </div>

      {!fixedCenterId && (
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-primary">Meetings by life center</h3>
              <p className="text-sm text-gray-600">Select a row to open the center.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span className="whitespace-nowrap">Sort by</span>
              <SelectInput
                className="w-auto"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                options={[
                  { value: "held", label: "Meetings held" },
                  { value: "rate", label: "Regularity" },
                  { value: "avg", label: "Average attendance" },
                  { value: "off", label: "Offering" },
                  { value: "last", label: "Longest since last meeting" },
                ]}
              />
            </label>
          </div>
          {meetSorted.length ? (
            <>
              <div className="hidden md:block">
                <GridTable
                  rows={meetSorted}
                  loading={!loaded}
                  getRowId={(r) => String(r.c.id)}
                  onRowClick={(r) => navigate(lcDetailPath(r.c.id))}
                  minWidth="1080px"
                  columns={[
                    {
                      key: "name",
                      header: "Life center",
                      width: "minmax(200px,1.6fr)",
                      render: (r) => <CellText strong main={r.c.name} sub={`${r.c.leader ?? "No leader yet"} · ${r.c.days.join(", ") || "No days"}`} />,
                    },
                    { key: "held", header: "Meetings held", width: "120px", render: (r) => `${r.x.held} of ${r.x.exp}` },
                    {
                      key: "reg",
                      header: "Regularity",
                      width: "150px",
                      render: (r) => {
                        const p = regPill(r.x);
                        return <Pill tone={p.tone}>{p.label}</Pill>;
                      },
                    },
                    { key: "avg", header: "Avg attendance", width: "120px", render: (r) => <CellText main={n1(r.x.avg)} sub={`${r.x.people} in total`} /> },
                    { key: "ft", header: "First-timers", width: "100px", render: (r) => r.x.ft },
                    {
                      key: "off",
                      header: "Offering",
                      width: "minmax(140px,1fr)",
                      render: (r) => <CellText main={r.x.money} sub={r.x.ghsMeetings ? `GHS ${n0(r.x.ghs / r.x.ghsMeetings)} per meeting` : undefined} />,
                    },
                    {
                      key: "last",
                      header: "Last met",
                      width: "120px",
                      render: (r) => <span style={{ color: r.gap > OVERDUE_DAYS ? "rgb(var(--color-red-700))" : undefined }}>{lastText(r)}</span>,
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 md:hidden">
                {meetSorted.map((r) => {
                  const p = regPill(r.x);
                  return (
                    <button
                      key={r.c.id}
                      type="button"
                      onClick={() => navigate(lcDetailPath(r.c.id))}
                      className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4 text-left text-sm text-primary"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{r.c.name}</p>
                          <p className="text-xs text-gray-500">{r.c.leader ?? "No leader yet"}</p>
                        </div>
                        <Pill tone={p.tone}>{p.label}</Pill>
                      </div>
                      <div className="grid w-full grid-cols-3 gap-2">
                        {[
                          { v: `${r.x.held}/${r.x.exp}`, l: "Meetings" },
                          { v: n1(r.x.avg), l: "Avg attendance" },
                          { v: String(r.x.ft), l: "First-timers" },
                        ].map((t) => (
                          <div key={t.l}>
                            <p className="font-semibold">{t.v}</p>
                            <p className="text-xs text-gray-500">{t.l}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: r.gap > OVERDUE_DAYS ? "rgb(var(--color-red-700))" : "rgb(var(--color-gray-500))" }}>
                        Last met {lastText(r)} · {r.x.money}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </section>
      )}
      {byId.size === 0 && loaded && (
        <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-gray-600">No life centers yet.</p>
      )}
    </>
  );

  return embedded ? <div className="flex flex-col gap-6">{body}</div> : <PageOutline className="flex flex-col gap-6">{body}</PageOutline>;
};

const LifeCenterAnalytics = () => <LifeCenterAnalyticsView />;

export default LifeCenterAnalytics;
