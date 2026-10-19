import type { PillTone } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";

import type {
  BarRow,
  InsightItem,
  LegendItem,
  LinkItem,
  MiniCell,
  StackColumn,
} from "../Components/attendanceUi";
import {
  addDays,
  arrivalOf,
  AttendanceRecord,
  CheckIn,
  daysBetween,
  daysInMonth,
  DOW,
  fmtDate,
  fmtShort,
  groupKeyOf,
  keyToDate,
  minutesFromStart,
  MON,
  MONF,
  nf,
  nk,
  Occurrence,
  pc,
  plural,
  RecordTotals,
  share,
  takesHeadcount,
  TimingRules,
  totalsOf,
  weekdayOf,
} from "./attendanceModel";

export const ANALYTICS_SECTIONS = [
  ["Overview", "Headline attendance, trend and what needs attention"],
  ["Services", "How each service and event performs against its history and registrations"],
  ["Demographics", "Adults, youth, children and gender mix"],
  ["Visitors", "Visitor share and visiting clergy from headcounts"],
  ["Punctuality", "When workers arrive, from biometric check-ins"],
  ["Worker participation", "Department turnout and workers to follow up"],
  ["Data quality", "Recording gaps, pending confirmations and late entries"],
] as const;

export interface Kpi {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export type Chart = { title: string; sub: string; full?: boolean; legend?: LegendItem[] } & (
  | { kind: "stack"; items: StackColumn[] }
  | { kind: "bar"; items: BarRow[] }
  | { kind: "table"; head: string[]; cols: string; rows: MiniCell[][]; minWidth: string; emptyText?: string }
  | { kind: "insight"; items: InsightItem[]; emptyText: string }
  | { kind: "list"; items: LinkItem[]; emptyText: string }
);

export interface AnalyticsInput {
  section: number;
  /** Selected period, already resolved (cumulative applied). */
  rFrom: string;
  /** End of the selected period, capped at today. */
  rTo: string;
  /** Comparison period, or null when there is none. */
  compare: { from: string; to: string; label: string } | null;
  cumulative: boolean;
  future: boolean;
  today: string;
  service: string;
  department: string;
  records: AttendanceRecord[];
  events: Occurrence[];
  byId: Map<string, Occurrence>;
  checkIns: CheckIn[];
  rules: TimingRules;
  onSection: (index: number) => void;
  onRecord: (occ: Occurrence) => void;
  onWorker: (name: string) => void;
}

interface Rec {
  r: AttendanceRecord;
  t: RecordTotals;
  name: string;
  groupKey: string;
  date: string;
  occ?: Occurrence;
}

const PRIMARY = "#080D2D";
const SECONDARY = "#9A5D1A";
const MUTED = "rgba(8,13,45,0.45)";
const SUCCESS = "#15803D";
const WARNING = "#B45309";
const DANGER = "#B91C1C";
const INFO = "#1D4ED8";
const GREY = "#6B7280";

const K = (label: string, value: string, sub = "", color = GREY): Kpi => ({ label, value, sub, color });
const tx = (text: string | number, sub?: string, strong?: boolean): MiniCell => ({ text: String(text), sub, strong });
const pill = (text: string, tone: PillTone): MiniCell => ({ pill: text, tone });
const groupBy = <T>(list: T[], key: (item: T) => string) => {
  const out: Record<string, T[]> = {};
  list.forEach((item) => (out[key(item)] = out[key(item)] || []).push(item));
  return out;
};
const avgOf = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const bars = (entries: [string, number, string?, string?][], color = PRIMARY): BarRow[] => {
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  return entries.map(([label, value, text, c]) => ({
    label,
    value: text ?? nf(value),
    width: value > 0 ? Math.max(3, Math.round((value * 100) / max)) : 0,
    color: c || color,
  }));
};

const singleColumns = (entries: [string, number, string][]): StackColumn[] => {
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  return entries.map(([label, value, color]) => ({
    label,
    value: nf(value),
    tip: `${label}: ${nf(value)}`,
    height: value ? Math.max(2, (value * 100) / max) : 0,
    segments: [{ pct: 100, color }],
  }));
};

const deltaTone = (d: number | null): MiniCell => {
  if (d === null) return pill("—", "neutral");
  const text = `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}%`;
  return pill(text, d >= 3 ? "success" : d <= -3 ? "danger" : "neutral");
};

export const buildSection = (input: AnalyticsInput) => {
  const { section, rFrom, rTo, compare, cumulative, future, today, rules, byId } = input;
  const cmpLabel = compare?.label || "previous period";

  const svcOk = (groupKey: string, occ?: Occurrence) =>
    !input.service || (input.service === "__special" ? occ?.type === "PROGRAM" : groupKey === input.service);

  const allRecs: Rec[] = input.records.map((r) => {
    const occ = byId.get(r.eventId);
    const name = occ?.name || r.eventName || "Event";
    return { r, t: totalsOf(r), name, groupKey: groupKeyOf(name), date: r.date, occ };
  });
  const recByEvent = new Map(allRecs.map((rec) => [rec.r.eventId, rec]));

  const stats = (a: string, b: string) => {
    const rec = future ? [] : allRecs.filter((x) => x.date >= a && x.date <= b && svcOk(x.groupKey, x.occ));
    const heldOccs = future
      ? []
      : input.events.filter((o) => takesHeadcount(o) && o.date >= a && o.date <= b && o.date <= today && svcOk(o.groupKey, o));
    const heldIds = new Set([...heldOccs.map((o) => o.id), ...rec.map((x) => x.r.eventId)]);
    const S = { rec, heldOccs, held: heldIds.size, total: 0, mem: 0, vis: 0, cl: 0, adults: 0, youth: 0, children: 0, male: 0, female: 0, sun: {} as Record<string, number>, peak: null as Rec | null, sunAvg: 0, avg: 0 };
    rec.forEach((x) => {
      (["total", "mem", "vis", "cl", "adults", "youth", "children", "male", "female"] as const).forEach((k) => {
        S[k] += x.t[k];
      });
      if (weekdayOf(x.date) === 0) S.sun[x.date] = (S.sun[x.date] || 0) + x.t.total;
      if (!S.peak || x.t.total > S.peak.t.total) S.peak = x;
    });
    S.sunAvg = avgOf(Object.values(S.sun));
    S.avg = rec.length ? S.total / rec.length : 0;
    return S;
  };

  const S = stats(rFrom, rTo);
  const P = compare ? stats(compare.from, compare.to) : null;
  const deptOk = (c: CheckIn) => !input.department || c.department === input.department;
  const ciIn = (a: string, b: string) =>
    input.checkIns.filter((c) => c.date >= a && c.date <= b && deptOk(c) && svcOk(groupKeyOf(byId.get(c.eventId)?.name || c.eventName), byId.get(c.eventId)));
  const ciR = future ? [] : ciIn(rFrom, rTo);
  const ciP = compare ? ciIn(compare.from, compare.to) : [];
  const offsetOf = (c: CheckIn) => minutesFromStart(c, byId.get(c.eventId));
  const classOf = (c: CheckIn) => arrivalOf(offsetOf(c), rules).key;

  const delta = (a: number, b?: number) => (P && b ? ((a - b) * 100) / b : null);
  const dTxt = (d: number | null) =>
    d === null
      ? cumulative
        ? "Cumulative, no comparison"
        : "No earlier data to compare"
      : `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}% vs ${cmpLabel}`;
  const dCol = (d: number | null, inverse?: boolean) =>
    d === null || Math.abs(d) < 2 ? GREY : d > 0 !== Boolean(inverse) ? SUCCESS : DANGER;

  /* -------------------------------- buckets -------------------------------- */

  const span = daysBetween(rFrom, rTo);
  const unit = span > 731 ? "year" : span > 62 ? "month" : span > 14 ? "week" : "day";
  const buckets: [string, string, string][] = [];
  if (!future && rFrom <= rTo) {
    const a = keyToDate(rFrom);
    const b = keyToDate(rTo);
    const multiYear = a.getFullYear() !== b.getFullYear();
    if (unit === "year") {
      for (let y = a.getFullYear(); y <= b.getFullYear(); y += 1) buckets.push([String(y), `${y}-01-01`, `${y}-12-31`]);
    } else if (unit === "month") {
      const d = new Date(a.getFullYear(), a.getMonth(), 1);
      while (d <= b) {
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const key = `${y}-${String(m).padStart(2, "0")}`;
        buckets.push([MON[m - 1] + (multiYear ? ` ${String(y).slice(2)}` : ""), `${key}-01`, `${key}-${daysInMonth(y, m)}`]);
        d.setMonth(d.getMonth() + 1);
      }
    } else if (unit === "week") {
      let cursor = rFrom;
      while (cursor <= rTo) {
        const end = addDays(cursor, 6) > rTo ? rTo : addDays(cursor, 6);
        const d = keyToDate(cursor);
        buckets.push([`${d.getDate()} ${MON[d.getMonth()]}`, cursor, end]);
        cursor = addDays(cursor, 7);
      }
    } else {
      let cursor = rFrom;
      while (cursor <= rTo) {
        const d = keyToDate(cursor);
        buckets.push([`${DOW[d.getDay()]} ${d.getDate()}`, cursor, cursor]);
        cursor = addDays(cursor, 1);
      }
    }
  }

  const stack = (series: ((a: string, b: string) => number)[], legend: [string, string][]) => {
    const values = buckets.map(([, a, b]) => series.map((fn) => fn(a, b)));
    const max = Math.max(1, ...values.map((v) => v.reduce((x, y) => x + y, 0)));
    const dense = buckets.length > 14;
    const items: StackColumn[] = buckets.map(([label], i) => {
      const v = values[i];
      const total = v.reduce((x, y) => x + y, 0);
      return {
        label,
        value: dense || !total ? "" : nk(total),
        tip: `${label}: ${legend.map(([l], j) => `${l} ${nf(v[j])}`).join(", ")}`,
        height: total ? Math.max(2, (total * 100) / max) : 0,
        segments: v.map((x, j) => ({ pct: total ? (x * 100) / total : 0, color: legend[j][1] })),
      };
    });
    return { items, legend: legend.map(([label, color]) => ({ label, color })) };
  };
  const sumRec = (a: string, b: string, fn: (x: Rec) => number) =>
    S.rec.filter((x) => x.date >= a && x.date <= b).reduce((sum, x) => sum + fn(x), 0);

  /* ------------------------------ per service ------------------------------ */

  const svcStats = (st: ReturnType<typeof stats>) => {
    const names: Record<string, string> = {};
    const held: Record<string, Set<string>> = {};
    const totals: Record<string, number[]> = {};
    st.heldOccs.forEach((o) => {
      names[o.groupKey] = o.name;
      (held[o.groupKey] = held[o.groupKey] || new Set()).add(o.id);
    });
    st.rec.forEach((x) => {
      names[x.groupKey] = names[x.groupKey] || x.name;
      (held[x.groupKey] = held[x.groupKey] || new Set()).add(x.r.eventId);
      (totals[x.groupKey] = totals[x.groupKey] || []).push(x.t.total);
    });
    return Object.keys(names)
      .map((k) => {
        const list = totals[k] || [];
        return {
          k,
          name: names[k],
          held: held[k]?.size || 0,
          rec: list.length,
          avg: avgOf(list),
          max: list.length ? Math.max(...list) : 0,
          min: list.length ? Math.min(...list) : 0,
        };
      })
      .sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name));
  };
  const SS = svcStats(S);
  const PS = P ? Object.fromEntries(svcStats(P).map((x) => [x.k, x])) : {};
  const unrecorded = S.heldOccs.filter((o) => !recByEvent.has(o.id)).sort((a, b) => b.date.localeCompare(a.date));
  const usual = (o: Occurrence) =>
    avgOf(
      allRecs
        .filter((x) => x.groupKey === o.groupKey && x.date < o.date)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6)
        .map((x) => x.t.total)
    );

  /* --------------------------- worker participation ------------------------ */

  const workerCis = ciR;
  const sundayDates = [...new Set(workerCis.filter((c) => weekdayOf(c.date) === 0).map((c) => c.date))].sort();
  const otherDates = [...new Set(workerCis.filter((c) => weekdayOf(c.date) !== 0).map((c) => c.date))].sort();
  const byWorker = groupBy(workerCis, (c) => c.userId);
  const workers = Object.values(byWorker).map((list) => {
    const dates = new Set(list.map((c) => c.date));
    return {
      name: list[0].name,
      dept: list[0].department,
      lastSeen: list.map((c) => c.date).sort().pop() || "",
      sunRate: sundayDates.length ? sundayDates.filter((d) => dates.has(d)).length / sundayDates.length : 0,
      midRate: otherDates.length ? otherDates.filter((d) => dates.has(d)).length / otherDates.length : 0,
      dates,
    };
  });
  const last3 = sundayDates.slice(-3);
  const missed =
    last3.length === 3
      ? workers.filter((w) => last3.every((d) => !w.dates.has(d))).sort((a, b) => a.lastSeen.localeCompare(b.lastSeen))
      : [];

  /* -------------------------------- sections ------------------------------- */

  let kpis: Kpi[] = [];
  let charts: Chart[] = [];
  const rCount = S.rec.length;

  if (section === 0) {
    const dSun = delta(S.sunAvg, P?.sunAvg);
    const dAvg = delta(S.avg, P?.avg);
    kpis = [
      K("Total attendance", nf(S.total), `${plural(rCount, "service")} recorded`),
      K("Average Sunday", nf(S.sunAvg), dTxt(dSun), dCol(dSun)),
      K("Average per service", nf(S.avg), dTxt(dAvg), dCol(dAvg)),
      K("Peak attendance", S.peak ? nf(S.peak.t.total) : "—", S.peak ? `${S.peak.name}, ${fmtDate(S.peak.date)}` : "No records"),
      K("Recording rate", `${pc(rCount, S.held)}%`, `${S.held - rCount} of ${S.held} services without a headcount`, S.held - rCount ? WARNING : SUCCESS),
    ];
    const insights: InsightItem[] = [];
    if (dSun !== null && P) {
      insights.push({
        tag: dSun >= 0 ? "Growth" : "Decline",
        tone: dSun >= 0 ? "success" : "danger",
        title: `Average Sunday attendance is ${nf(S.sunAvg)}`,
        text: `${dSun >= 0 ? "Up" : "Down"} ${Math.abs(dSun).toFixed(1)}% on the ${cmpLabel} (${nf(P.sunAvg)}).`,
      });
    }
    const drops = SS.filter((x) => PS[x.k]?.avg && x.rec >= 3)
      .map((x) => ({ x, d: ((x.avg - PS[x.k].avg) * 100) / PS[x.k].avg }))
      .sort((a, b) => a.d - b.d);
    if (drops[0] && drops[0].d <= -3) {
      insights.push({
        tag: "Watch",
        tone: "warning",
        title: `${drops[0].x.name} is down ${Math.abs(drops[0].d).toFixed(1)}%`,
        text: `Averaging ${nf(drops[0].x.avg)} against ${nf(PS[drops[0].x.k].avg)} in the ${cmpLabel}.`,
        action: "See services",
        onAction: () => input.onSection(1),
      });
    }
    if (unrecorded.length) {
      insights.push({
        tag: "Action",
        tone: "danger",
        title: `${plural(unrecorded.length, "service")} ${unrecorded.length > 1 ? "have" : "has"} no headcount`,
        text: `${unrecorded.slice(0, 3).map((o) => `${o.name} (${fmtShort(o.date)})`).join(", ")}${unrecorded.length > 3 ? ` and ${unrecorded.length - 3} more.` : "."} Totals and averages exclude them.`,
        action: "Record now",
        onAction: () => input.onRecord(unrecorded[0]),
      });
    }
    const months = Object.entries(groupBy(S.rec, (x) => x.date.slice(0, 7)))
      .filter(([, list]) => list.length >= 4)
      .map(([k, list]) => ({ k, sh: list.reduce((a, x) => a + x.t.youth, 0) / Math.max(1, list.reduce((a, x) => a + x.t.mem, 0)) }));
    if (months.length > 2 && S.mem) {
      const avgShare = S.youth / S.mem;
      const low = months.sort((a, b) => a.sh - b.sh)[0];
      if (avgShare - low.sh > 0.03) {
        insights.push({
          tag: "Pattern",
          tone: "info",
          title: `Youth attendance dips in ${MONF[Number(low.k.slice(5)) - 1]}`,
          text: `Youth were ${Math.round(low.sh * 100)}% of members that month against ${Math.round(avgShare * 100)}% across the period.`,
          action: "See demographics",
          onAction: () => input.onSection(2),
        });
      }
    }
    const classified = ciR.filter((c) => classOf(c) !== "unknown");
    if (classified.length) {
      const late = classified.filter((c) => classOf(c) === "late").length;
      insights.push({
        tag: "Punctuality",
        tone: late / classified.length > 0.25 ? "warning" : "neutral",
        title: `${pc(late, classified.length)}% of worker check-ins were late`,
        text: `Checked against the start time, with a ${rules.lateMinutes} minute on-time window.`,
        action: "See punctuality",
        onAction: () => input.onSection(4),
      });
    }
    if (missed.length) {
      insights.push({
        tag: "Care",
        tone: "warning",
        title: `${plural(missed.length, "worker")} ${missed.length > 1 ? "have" : "has"} missed the last 3 Sundays`,
        text: "Consider a call from their department head this week.",
        action: "See workers",
        onAction: () => input.onSection(5),
      });
    }
    const attention: LinkItem[] = [
      ...unrecorded.slice(0, 4).map((o) => ({
        key: `un-${o.id}`,
        label: `${o.name} · ${fmtShort(o.date)}`,
        sub: "No headcount recorded",
        action: "Record →",
        onClick: () => input.onRecord(o),
      })),
      ...S.heldOccs
        .filter((o) => o.registrations > 0 && recByEvent.has(o.id) && (recByEvent.get(o.id) as Rec).t.total < o.registrations * 0.8)
        .map((o) => {
          const total = (recByEvent.get(o.id) as Rec).t.total;
          return {
            key: `reg-${o.id}`,
            label: `${o.name} · ${fmtShort(o.date)}`,
            sub: `${nf(total)} attended of ${nf(o.registrations)} registered (${pc(total, o.registrations)}%)`,
            action: "View →",
            onClick: () => input.onSection(1),
          };
        }),
    ];
    const st = stack(
      [(a, b) => sumRec(a, b, (x) => x.t.mem), (a, b) => sumRec(a, b, (x) => x.t.vis), (a, b) => sumRec(a, b, (x) => x.t.cl)],
      [["Members", PRIMARY], ["Visitors", SECONDARY], ["Visiting clergy", MUTED]]
    );
    charts = [
      { kind: "stack", title: `Attendance by ${unit}`, sub: `Members, visitors and visiting clergy, summed per ${unit}. Hover a column for the breakdown.`, full: true, ...st },
      { kind: "insight", title: "What stands out", sub: `Generated from the selected period${P ? ` and the ${cmpLabel}` : ""}.`, items: insights, emptyText: "Nothing unusual in this period." },
      { kind: "bar", title: "Average attendance by service", sub: "Mean headcount per recorded occurrence", items: bars(SS.filter((x) => x.rec).slice(0, 8).map((x) => [x.name, x.avg, `${nf(x.avg)} · ${x.rec} recorded`])) },
      { kind: "list", title: "Needs attention", sub: "Services without a headcount and events that fell short of registrations", items: attention, emptyText: "Nothing needs attention in this period." },
    ];
  }

  if (section === 1) {
    const recorded = SS.filter((x) => x.rec);
    const busiest = recorded[0];
    const quietest = recorded[recorded.length - 1];
    const regEvents = S.heldOccs.filter((o) => o.registrations > 0).sort((a, b) => b.date.localeCompare(a.date));
    const regRec = regEvents.filter((o) => recByEvent.has(o.id));
    const turnout = regRec.length
      ? avgOf(regRec.map((o) => pc((recByEvent.get(o.id) as Rec).t.total, o.registrations)))
      : 0;
    kpis = [
      K("Services held", nf(S.held), `${rCount} recorded`),
      K("Busiest service", busiest ? nf(busiest.avg) : "—", busiest ? `${busiest.name}, average` : "No records"),
      K("Quietest service", quietest && quietest !== busiest ? nf(quietest.avg) : "—", quietest && quietest !== busiest ? `${quietest.name}, average` : ""),
      K("Registration events", String(regEvents.length), regRec.length ? `Average turnout ${Math.round(turnout)}%` : "None recorded in this period"),
    ];
    const sundays = S.rec.filter((x) => weekdayOf(x.date) === 0);
    const first = sundays.filter((x) => Number(x.date.slice(8)) <= 7);
    const others = sundays.filter((x) => Number(x.date.slice(8)) > 7);
    const av = (list: Rec[]) => avgOf(list.map((x) => x.t.total));
    charts = [
      {
        kind: "table",
        title: "Service performance",
        sub: "Headcount per occurrence for each service and event in the period",
        full: true,
        head: ["Service", "Held", "Recorded", "Average", "Highest", "Lowest", "Change"],
        cols: "minmax(200px,2fr) repeat(5,minmax(72px,0.7fr)) minmax(96px,0.8fr)",
        minWidth: "860px",
        rows: SS.map((x) => [
          tx(x.name, "", true),
          tx(x.held),
          tx(x.rec, x.held - x.rec ? `${x.held - x.rec} missing` : ""),
          tx(nf(x.avg), "", true),
          tx(nf(x.max)),
          tx(nf(x.min)),
          deltaTone(PS[x.k]?.avg ? ((x.avg - PS[x.k].avg) * 100) / PS[x.k].avg : null),
        ]),
      },
      { kind: "bar", title: "Average attendance by service", sub: "Mean headcount per recorded occurrence", items: bars(recorded.slice(0, 10).map((x) => [x.name, x.avg, `${nf(x.avg)} · ${x.rec} recorded`])) },
      {
        kind: "bar",
        title: "Communion Sundays vs other Sundays",
        sub: "First Sunday of the month against the rest, per service",
        items: bars([
          ["First Sunday of the month", av(first), `${nf(av(first))} · ${plural(first.length, "service")}`],
          ["Other Sundays", av(others), `${nf(av(others))} · ${plural(others.length, "service")}`, MUTED],
        ]),
      },
      {
        kind: "table",
        title: "Registration vs turnout",
        sub: "Events that took registrations",
        full: true,
        head: ["Event", "Date", "Registered", "Attended", "Turnout"],
        cols: "minmax(200px,2fr) minmax(120px,1fr) repeat(2,minmax(90px,0.8fr)) minmax(100px,0.8fr)",
        minWidth: "720px",
        emptyText: "No registration events in this period.",
        rows: regEvents.map((o) => {
          const rec = recByEvent.get(o.id);
          const p = rec ? pc(rec.t.total, o.registrations) : 0;
          return [
            tx(o.name, "", true),
            tx(fmtDate(o.date)),
            tx(nf(o.registrations)),
            tx(rec ? nf(rec.t.total) : "—", rec ? "" : "Not recorded"),
            !rec ? pill("No headcount", "danger") : pill(`${p}%`, p >= 90 ? "success" : p >= 75 ? "warning" : "danger"),
          ];
        }),
      },
    ];
  }

  if (section === 2) {
    const pS = (a: number, b: number) => (b ? (a * 100) / b : 0);
    const dd = (k: "adults" | "youth" | "children") => (P && P.mem ? pS(S[k], S.mem) - pS(P[k], P.mem) : null);
    const pts = (d: number | null) => (d === null ? "No comparison" : `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} pts vs ${cmpLabel}`);
    const fD = P && P.total ? pS(S.female, S.total) - pS(P.female, P.total) : null;
    kpis = [
      K("Adults", share(S.adults, S.mem), pts(dd("adults"))),
      K("Youth", share(S.youth, S.mem), pts(dd("youth")), dCol(dd("youth"))),
      K("Children", share(S.children, S.mem), pts(dd("children"))),
      K("Female", share(S.female, S.total), pts(fD)),
    ];
    const sm = (k: keyof AttendanceRecord) => S.rec.reduce((a, x) => a + Number(x.r[k] || 0), 0);
    const avgP = (st: ReturnType<typeof stats> | null, k: "adults" | "youth" | "children" | "vis") =>
      st && st.rec.length ? st[k] / st.rec.length : 0;
    const sundayServices = SS.filter((x) => S.rec.some((y) => y.groupKey === x.k && weekdayOf(y.date) === 0)).slice(0, 4);
    const st = stack(
      [(a, b) => sumRec(a, b, (x) => x.t.adults), (a, b) => sumRec(a, b, (x) => x.t.youth), (a, b) => sumRec(a, b, (x) => x.t.children)],
      [["Adults", PRIMARY], ["Youth", SECONDARY], ["Children", MUTED]]
    );
    charts = [
      { kind: "stack", title: `Age group mix by ${unit}`, sub: `Members only, summed per ${unit}`, full: true, ...st },
      {
        kind: "bar",
        title: "By group and gender",
        sub: "Share of members in the period",
        items: bars(
          ([
            ["Adult women", sm("adultFemale")],
            ["Adult men", sm("adultMale")],
            ["Young women", sm("youthFemale")],
            ["Young men", sm("youthMale")],
            ["Girls", sm("childrenFemale")],
            ["Boys", sm("childrenMale")],
          ] as [string, number][]).map(([l, v]) => [l, v, `${nf(v)} · ${share(v, S.mem)}`])
        ),
      },
      {
        kind: "table",
        title: "Average per service",
        sub: `How each group has moved against the ${cmpLabel}`,
        head: ["Group", "This period", "Before", "Change"],
        cols: "minmax(120px,1.4fr) repeat(2,minmax(90px,1fr)) minmax(96px,1fr)",
        minWidth: "420px",
        rows: ([["Adults", "adults"], ["Youth", "youth"], ["Children", "children"], ["Visitors", "vis"]] as const).map(([l, k]) => {
          const a = avgP(S, k);
          const b = avgP(P, k);
          return [tx(l, "", true), tx(nf(a)), tx(P ? nf(b) : "—"), deltaTone(P && b ? ((a - b) * 100) / b : null)];
        }),
      },
      {
        kind: "bar",
        title: "Children's ministry staffing",
        sub: "Average children per Sunday service, with teachers needed at 1 per 12 children",
        items: bars(
          sundayServices.map((x) => {
            const a = avgOf(S.rec.filter((y) => y.groupKey === x.k).map((y) => y.t.children));
            return [x.name, a, `${nf(a)} children · ${Math.ceil(a / 12)} teachers`];
          })
        ),
      },
    ];
  }

  if (section === 3) {
    const vT = S.vis + S.cl;
    const dV = delta(rCount ? vT / rCount : 0, P && P.rec.length ? (P.vis + P.cl) / P.rec.length : 0);
    const sunCount = Object.keys(S.sun).length;
    const sunV = sunCount ? S.rec.filter((x) => weekdayOf(x.date) === 0).reduce((a, x) => a + x.t.vis + x.t.cl, 0) / sunCount : 0;
    kpis = [
      K("Visitors", nf(vT), `Including ${nf(S.cl)} visiting clergy`),
      K("Visitor share", share(vT, S.total), "Of total attendance"),
      K("Visitors per Sunday", nf(sunV), "All Sunday services combined"),
      K("Per service", nf(rCount ? vT / rCount : 0), dTxt(dV), dCol(dV)),
    ];
    const vm = S.rec.reduce((a, x) => a + x.r.visitorsMale + x.r.clergyMale, 0);
    const vf = S.rec.reduce((a, x) => a + x.r.visitorsFemale + x.r.clergyFemale, 0);
    const top = S.rec.slice().sort((a, b) => b.t.vis + b.t.cl - (a.t.vis + a.t.cl)).slice(0, 6);
    const st = stack(
      [(a, b) => sumRec(a, b, (x) => x.t.vis), (a, b) => sumRec(a, b, (x) => x.t.cl)],
      [["Visitors", SECONDARY], ["Visiting clergy", PRIMARY]]
    );
    charts = [
      { kind: "stack", title: `Visitors by ${unit}`, sub: "From headcounts. Follow-up and referral sources are in Visitors → Analytics.", full: true, ...st },
      {
        kind: "bar",
        title: "Visitors per service",
        sub: "Average per recorded occurrence",
        items: bars(
          SS.filter((x) => x.rec)
            .map((x): [string, number, string] => {
              const list = S.rec.filter((y) => y.groupKey === x.k);
              const v = list.reduce((a, y) => a + y.t.vis + y.t.cl, 0);
              return [x.name, v / list.length, `${nf(v / list.length)} · ${share(v, list.reduce((a, y) => a + y.t.total, 0))}`];
            })
            .sort((a, b) => b[1] - a[1]),
          SECONDARY
        ),
      },
      {
        kind: "bar",
        title: "Visitors by gender",
        sub: "Including visiting clergy",
        items: bars([["Female", vf, `${nf(vf)} · ${share(vf, vf + vm)}`], ["Male", vm, `${nf(vm)} · ${share(vm, vf + vm)}`]], SECONDARY),
      },
      {
        kind: "table",
        title: "Most visited services",
        sub: "Highest visitor counts in the period",
        full: true,
        head: ["Service", "Date", "Visitors", "Clergy", "Share of attendance"],
        cols: "minmax(200px,2fr) minmax(120px,1fr) repeat(2,minmax(80px,0.7fr)) minmax(140px,1fr)",
        minWidth: "700px",
        rows: top.map((x) => [tx(x.name, "", true), tx(fmtDate(x.date)), tx(nf(x.t.vis)), tx(nf(x.t.cl)), tx(share(x.t.vis + x.t.cl, x.t.total))]),
      },
    ];
  }

  if (section === 4) {
    const withOffset = ciR.map((c) => ({ c, off: offsetOf(c) })).filter((x): x is { c: CheckIn; off: number } => x.off !== null);
    const cls = (list: { off: number }[]) => {
      const r = { early: 0, ontime: 0, late: 0 };
      list.forEach(({ off }) => {
        const k = arrivalOf(off, rules).key;
        if (k !== "unknown") r[k] += 1;
      });
      return r;
    };
    const prev = ciP.map((c) => ({ off: offsetOf(c) })).filter((x): x is { off: number } => x.off !== null);
    const cr = cls(withOffset);
    const pr = cls(prev);
    const n = withOffset.length;
    const onRate = pc(cr.early + cr.ontime, n);
    const pOn = prev.length ? pc(pr.early + pr.ontime, prev.length) : null;
    const md = median(withOffset.map((x) => x.off));
    kpis = [
      K("Check-ins", nf(ciR.length), `${plural(new Set(ciR.map((c) => c.eventId)).size, "event")} with devices`),
      K("On-time rate", `${onRate}%`, pOn === null ? `Early or within ${rules.lateMinutes} min` : `${onRate - pOn >= 0 ? "+" : "−"}${Math.abs(onRate - pOn)} pts vs ${cmpLabel}`, pOn === null ? GREY : dCol(onRate - pOn)),
      K("Late arrivals", `${pc(cr.late, n)}%`, `${nf(cr.late)} check-ins ${rules.lateMinutes}+ min after start`, pc(cr.late, n) > 25 ? WARNING : GREY),
      K("Typical arrival", n ? (md < 0 ? `${-md} min early` : `${md} min late`) : "—", "Median first punch against start"),
    ];
    const bins: [string, number, number][] = [
      ["30+ early", -9999, -31],
      ["15–30 early", -30, -16],
      ["0–15 early", -15, 0],
      ["1–15 late", 1, 15],
      ["16–30 late", 16, 30],
      ["31–45 late", 31, 45],
      ["45+ late", 46, 9999],
    ];
    const arrTxt = (m: number) => (m < 0 ? `${-m} min before start` : m === 0 ? "At start time" : `${m} min after start`);
    const byS = groupBy(withOffset, (x) => groupKeyOf(byId.get(x.c.eventId)?.name || x.c.eventName));
    const byD = groupBy(withOffset, (x) => x.c.department);
    const st = stack(
      [
        (a, b) => withOffset.filter((x) => x.c.date >= a && x.c.date <= b && x.off < rules.lateMinutes).length,
        (a, b) => withOffset.filter((x) => x.c.date >= a && x.c.date <= b && x.off >= rules.lateMinutes).length,
      ],
      [["Early or on time", SUCCESS], ["Late", WARNING]]
    );
    charts = [
      {
        kind: "bar",
        title: "Arrival status",
        sub: "Share of check-ins with a known start time",
        items: bars([
          [`Early (${rules.earlyMinutes}+ min before)`, cr.early, `${nf(cr.early)} · ${pc(cr.early, n)}%`, INFO],
          [`On time (within ${rules.lateMinutes} min)`, cr.ontime, `${nf(cr.ontime)} · ${pc(cr.ontime, n)}%`, SUCCESS],
          [`Late (${rules.lateMinutes}+ min after)`, cr.late, `${nf(cr.late)} · ${pc(cr.late, n)}%`, WARNING],
        ]),
      },
      {
        kind: "stack",
        title: "When workers arrive",
        sub: "Minutes between first punch and start time",
        items: singleColumns(bins.map(([l, a, b]) => [l, withOffset.filter((x) => x.off >= a && x.off <= b).length, a >= rules.lateMinutes ? WARNING : SUCCESS])),
      },
      { kind: "stack", title: `Punctuality by ${unit}`, sub: "Check-ins on time against late", full: true, ...st },
      {
        kind: "table",
        title: "By service",
        sub: "Arrival pattern for each service",
        head: ["Service", "Check-ins", "On time", "Late", "Typical"],
        cols: "minmax(180px,2fr) repeat(3,minmax(72px,0.7fr)) minmax(110px,1fr)",
        minWidth: "620px",
        rows: Object.keys(byS)
          .sort()
          .map((k) => {
            const list = byS[k];
            const c = cls(list);
            const late = pc(c.late, list.length);
            return [
              tx(byId.get(list[0].c.eventId)?.name || list[0].c.eventName, "", true),
              tx(nf(list.length)),
              tx(`${pc(c.early + c.ontime, list.length)}%`),
              late > 30 ? pill(`${late}%`, "warning") : tx(`${late}%`),
              tx(arrTxt(median(list.map((x) => x.off)))),
            ];
          }),
      },
      {
        kind: "bar",
        title: "Late arrivals by department",
        sub: "Share of each department’s check-ins after the on-time window",
        items: bars(
          Object.keys(byD)
            .map((k): [string, number, string, string] => {
              const v = pc(cls(byD[k]).late, byD[k].length);
              return [k, v, `${v}% · ${nf(byD[k].length)} check-ins`, v > 30 ? WARNING : PRIMARY];
            })
            .sort((a, b) => b[1] - a[1])
        ),
      },
    ];
  }

  if (section === 5) {
    const avgRate = avgOf(workers.map((w) => w.sunRate));
    const consistent = workers.filter((w) => w.sunRate >= 0.75).length;
    kpis = [
      K("Workers tracked", String(workers.length), input.department || "All departments"),
      K("Sunday attendance rate", `${Math.round(avgRate * 100)}%`, `Across ${plural(sundayDates.length, "imported Sunday")}`),
      K("Consistent (75%+)", String(consistent), `${pc(consistent, workers.length)}% of workers`),
      K("Missed last 3 Sundays", String(missed.length), missed.length ? "Follow up this week" : "No one at risk", missed.length ? WARNING : SUCCESS),
    ];
    const byD = groupBy(workers, (w) => w.dept);
    const bands: [string, number, number][] = [
      ["Under 25%", 0, 0.25],
      ["25–49%", 0.25, 0.5],
      ["50–74%", 0.5, 0.75],
      ["75% and over", 0.75, 1.01],
    ];
    charts = [
      {
        kind: "bar",
        title: "Sunday attendance rate by department",
        sub: "Average of each worker’s share of imported Sundays attended",
        items: bars(
          Object.keys(byD)
            .map((k): [string, number, string, string] => {
              const r = avgOf(byD[k].map((w) => w.sunRate));
              return [k, r * 100, `${Math.round(r * 100)}% · ${plural(byD[k].length, "worker")}`, r < 0.6 ? WARNING : PRIMARY];
            })
            .sort((a, b) => b[1] - a[1])
        ),
      },
      {
        kind: "stack",
        title: "How regularly workers attend",
        sub: "Number of workers in each Sunday attendance band",
        items: singleColumns(
          bands.map(([l, a, b], i) => [l, workers.filter((w) => w.sunRate >= a && w.sunRate < b).length, i === 0 ? DANGER : i === 1 ? WARNING : PRIMARY])
        ),
      },
      {
        kind: "list",
        title: "Missed the last 3 Sundays",
        sub: "Workers with check-ins in this period but none on the three most recent imported Sundays",
        items: missed.map((w) => ({
          key: w.name + w.lastSeen,
          label: w.name,
          sub: `${w.dept} · last seen ${w.lastSeen ? fmtDate(w.lastSeen) : "never"}`,
          action: "Check-ins →",
          onClick: () => input.onWorker(w.name),
        })),
        emptyText: last3.length < 3 ? "Fewer than 3 Sundays have check-ins in this period." : "Every worker attended at least one of the last 3 Sundays.",
      },
      {
        kind: "table",
        title: "Department turnout",
        sub: "Sunday and other-day rates side by side",
        head: ["Department", "Workers", "Sunday", "Other days"],
        cols: "minmax(150px,1.6fr) repeat(3,minmax(72px,0.8fr))",
        minWidth: "460px",
        rows: Object.keys(byD)
          .sort()
          .map((d) => [
            tx(d, "", true),
            tx(byD[d].length),
            tx(`${Math.round(avgOf(byD[d].map((w) => w.sunRate)) * 100)}%`),
            tx(`${Math.round(avgOf(byD[d].map((w) => w.midRate)) * 100)}%`),
          ]),
      },
    ];
  }

  if (section === 6) {
    const bio = ciR.filter((c) => !c.official);
    const lateEntries = S.rec.filter((x) => x.r.enteredOn > x.date);
    kpis = [
      K("Recording rate", `${pc(rCount, S.held)}%`, `${rCount} of ${S.held} services`),
      K("Awaiting headcount", String(unrecorded.length), unrecorded.length ? "Services held without a record" : "All recorded", unrecorded.length ? DANGER : SUCCESS),
      K("Check-ins to confirm", nf(bio.length), "Biometric only, not yet official", bio.length ? WARNING : SUCCESS),
      K("Late entries", String(lateEntries.length), "Headcounts entered after the service day", lateEntries.length ? WARNING : SUCCESS),
    ];
    const byE = groupBy(ciR, (c) => `${c.eventId}:${c.date}`);
    const evKeys = Object.keys(byE).sort((a, b) => byE[b][0].date.localeCompare(byE[a][0].date)).slice(0, 8);
    const byR = groupBy(S.rec, (x) => x.r.recordedByName);
    charts = [
      {
        kind: "list",
        title: "Services without a headcount",
        sub: "Record these so totals and averages are complete",
        items: unrecorded.slice(0, 8).map((o) => {
          const u = usual(o);
          return {
            key: o.id,
            label: `${o.name} · ${fmtShort(o.date)} ${o.date.slice(0, 4)}`,
            sub: `${plural(daysBetween(o.date, today), "day")} ago${u ? ` · usually ~${nf(u)}` : ""}`,
            action: "Record →",
            onClick: () => input.onRecord(o),
          };
        }),
        emptyText: "Every service in this period has a headcount.",
      },
      {
        kind: "bar",
        title: "Who records attendance",
        sub: "Records entered in the period, with how many were entered after the service day",
        items: bars(
          Object.keys(byR)
            .map((k): [string, number, string] => {
              const late = byR[k].filter((x) => x.r.enteredOn > x.date).length;
              return [k, byR[k].length, `${plural(byR[k].length, "record")}${late ? ` · ${late} late` : ""}`];
            })
            .sort((a, b) => b[1] - a[1])
        ),
      },
      {
        kind: "table",
        title: "Check-in confirmation by event",
        sub: "Recent events with device check-ins",
        full: true,
        head: ["Event", "Date", "Check-ins", "Official", "Biometric only", "Status"],
        cols: "minmax(200px,2fr) minmax(110px,1fr) repeat(3,minmax(80px,0.8fr)) minmax(120px,1fr)",
        minWidth: "820px",
        rows: evKeys.map((k) => {
          const list = byE[k];
          const b = list.filter((c) => !c.official).length;
          return [
            tx(byId.get(list[0].eventId)?.name || list[0].eventName, "", true),
            tx(fmtDate(list[0].date)),
            tx(nf(list.length)),
            tx(nf(list.length - b)),
            tx(nf(b)),
            b ? pill("To confirm", "warning") : pill("Complete", "success"),
          ];
        }),
      },
      {
        kind: "bar",
        title: "Late entries",
        sub: "Headcounts entered after the service day, by service",
        items: bars(
          Object.entries(groupBy(lateEntries, (x) => x.groupKey)).map(([k, list]): [string, number, string] => [
            list[0].name,
            list.length,
            `${list.length} of ${S.rec.filter((x) => x.groupKey === k).length}`,
          ])
        ),
      },
    ];
  }

  const base =
    section >= 4
      ? `${nf(ciR.length)} check-ins · ${plural(new Set(ciR.map((c) => c.userId)).size, "worker")}`
      : `${S.held} services held · ${rCount} recorded`;

  return { kpis, charts, base, unrecordedCount: unrecorded.length, unit };
};

/** Comparison period for a resolved range (same period last year for a year view). */
export const comparisonFor = (
  periodType: string,
  from: string,
  to: string,
  earliest: string
): { from: string; to: string; label: string } | null => {
  let cFrom: string;
  let cTo: string;
  if (periodType === "year") {
    cFrom = `${Number(from.slice(0, 4)) - 1}${from.slice(4)}`;
    cTo = `${Number(to.slice(0, 4)) - 1}${to.slice(4)}`;
  } else {
    const len = daysBetween(from, to);
    cTo = addDays(from, -1);
    cFrom = addDays(cTo, -len);
  }
  if (cTo < earliest) return null;
  return {
    from: cFrom < earliest ? earliest : cFrom,
    to: cTo,
    label: periodType === "year" ? "same period last year" : "previous period",
  };
};

