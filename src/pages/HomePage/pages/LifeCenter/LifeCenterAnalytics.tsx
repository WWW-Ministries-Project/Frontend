import { ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
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
  TextInput,
  UiButton,
} from "../MembershipManagement/components/membershipUi";
import {
  DAYF,
  DAYS,
  MON,
  MONF,
  OVERDUE_DAYS,
  addDaysKey,
  daysBetween,
  dow,
  downloadCsv,
  errorText,
  expectedMeetings,
  firstWord,
  fmtD,
  fmtL,
  fmtS,
  gapOf,
  ghsOf,
  joinAnd,
  lcDetailPath,
  moneyMix,
  mondayOf,
  n0,
  n1,
  pctN,
  plural,
  rateColor,
  rateTone,
  useToday,
} from "./utils/lcModel";
import { Center, useLifeCenterOverview } from "./utils/useLifeCenterOverview";

type By = "year" | "month" | "week" | "range";
type Metric = "meetings" | "attendance" | "souls" | "offering";
type Sort = "souls" | "rate" | "avg" | "off" | "last";
type Bucket = { l: string; a: string; b: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar months, weeks or days covering `from`–`to`, depending on the span. */
const bucketsOf = (from: string, to: string, by: By): Bucket[] => {
  const span = daysBetween(from, to) + 1;
  const out: Bucket[] = [];
  if (by === "year" || span > 92) {
    let y = Number(from.slice(0, 4));
    let m = Number(from.slice(5, 7));
    for (let i = 0; i < 36; i++) {
      const a = `${y}-${pad(m)}-01`;
      if (a > to) break;
      const next = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
      const e = addDaysKey(next, -1);
      out.push({ l: MON[m - 1], a: a < from ? from : a, b: e > to ? to : e });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
  } else if (span > 14) {
    let a = from;
    while (a <= to) {
      const mon = mondayOf(a);
      const b = addDaysKey(mon, 6);
      out.push({ l: `w/c ${fmtS(mon)}`, a, b: b > to ? to : b });
      a = addDaysKey(b, 1);
    }
  } else {
    for (let a = from; a <= to; a = addDaysKey(a, 1)) out.push({ l: `${dow(a)} ${Number(a.slice(8))}`, a, b: a });
  }
  return out;
};

const Card = ({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) => (
  <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-lightGray bg-white p-5 tablet:p-6">
    <div>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {sub && <p className="text-sm text-[#4B5563]">{sub}</p>}
    </div>
    {children}
  </section>
);

const HBar = ({ label, value, width, sub }: { label: string; value: ReactNode; width: string; sub: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between gap-3 text-sm text-primary">
      <span className="min-w-0 truncate">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
      <div className="h-full bg-primary" style={{ width }} />
    </div>
    <span className="text-xs text-[#6B7280]">{sub}</span>
  </div>
);

/**
 * Souls won, how regularly each center meets, and who turns up. With
 * `fixedCenterId` it shows one center only (the leader's view).
 */
export const LifeCenterAnalyticsView = ({ fixedCenterId, embedded }: { fixedCenterId?: string | number; embedded?: boolean }) => {
  const navigate = useNavigate();
  const today = useToday();
  const year = today.slice(0, 4);
  const { canManage } = useAccessControl();
  const manage = canManage("Life Center") && !fixedCenterId;

  const [by, setBy] = useState<By>("year");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [week, setWeek] = useState("0");
  const [from, setFrom] = useState(addDaysKey(today, -49));
  const [to, setTo] = useState(today);
  const [lcSel, setLcSel] = useState("");
  const [metric, setMetric] = useState<Metric>("meetings");
  const [sort, setSort] = useState<Sort>("souls");
  const [reminded, setReminded] = useState<Record<number, boolean>>({});

  const mon0 = mondayOf(today);
  const P = useMemo(() => {
    if (by === "month") {
      const [y, m] = month.split("-").map(Number);
      const a = `${y}-${pad(m)}-01`;
      const b = addDaysKey(m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`, -1);
      return { from: a, to: b > today ? today : b, label: `${MONF[m - 1]} ${y}` };
    }
    if (by === "week") {
      const a = addDaysKey(mon0, -7 * Number(week));
      const b = addDaysKey(a, 6);
      return { from: a, to: b > today ? today : b, label: `Week of ${fmtL(a)}` };
    }
    if (by === "range") {
      let a = from || addDaysKey(today, -49);
      let b = to || today;
      if (b < a) [a, b] = [b, a];
      if (b > today) b = today;
      return { from: a, to: b, label: `${fmtL(a)} – ${fmtL(b)}` };
    }
    return { from: `${year}-01-01`, to: today, label: `1 Jan – ${fmtL(today)}` };
  }, [by, month, week, from, to, today, year, mon0]);

  const L = daysBetween(P.from, P.to) + 1;
  const pTo = addDaysKey(P.from, -1);
  const pFrom = addDaysKey(P.from, -L);

  const centerFilter = fixedCenterId ? String(fixedCenterId) : lcSel;
  const { centers: allCenters, meetings, souls, loaded } = useLifeCenterOverview(pFrom, P.to, fixedCenterId ?? null);
  const cs = allCenters.filter((c) => !centerFilter || String(c.id) === centerFilter);

  const memberCount = useMemo(() => new Map(allCenters.map((c) => [c.id, c.memberCount])), [allCenters]);
  const agg = (list: Center[], a: string, b: string) => {
    const ids = new Set(list.map((c) => c.id));
    const ms = meetings.filter((g) => ids.has(g.life_center_id) && g.date >= a && g.date <= b);
    const ss = souls.filter((s) => ids.has(s.life_center_id) && s.date_won >= a && s.date_won <= b);
    const exp = list.reduce((t, c) => t + expectedMeetings(c, a, b, today), 0);
    const att = ms.reduce((t, g) => t + g.member_user_ids.length + g.first_timer_ids.length, 0);
    const memAtt = ms.reduce((t, g) => t + g.member_user_ids.length, 0);
    const memSlots = ms.reduce((t, g) => t + (memberCount.get(g.life_center_id) ?? 0), 0);
    const ft = ms.reduce((t, g) => t + g.first_timer_ids.length, 0);
    return {
      ms,
      ss,
      exp,
      held: ms.length,
      avg: ms.length ? att / ms.length : 0,
      memAtt,
      memSlots,
      ft,
      ftUniq: new Set(ms.flatMap((g) => g.first_timer_ids)).size,
      conv: ss.filter((s) => s.converted).length,
      rate: Math.min(100, pctN(ms.length, exp)),
    };
  };
  type Agg = ReturnType<typeof agg>;

  const A = agg(cs, P.from, P.to);
  const B = agg(cs, pFrom, pTo);
  const delta = (a: number, b: number) => {
    if (!b) return null;
    const d = pctN(a - b, b);
    return { s: `${d >= 0 ? "+" : "−"}${Math.abs(d)}% vs previous period`, c: d >= 0 ? "#15803D" : "#B91C1C" };
  };
  const dS = delta(A.ss.length, B.ss.length);
  const dA = B.held ? delta(A.avg, B.avg) : null;
  const ghsMeetings = A.ms.filter((g) => g.currency === "GHS").length;

  const kpis = [
    { l: "Souls won", v: String(A.ss.length), s: dS ? dS.s : `${A.conv} have become members`, c: dS?.c },
    {
      l: "Meetings held",
      v: `${A.held} of ${A.exp}`,
      s: A.exp ? `${A.rate}% of scheduled meetings` : "None scheduled in this period",
      c: A.exp ? rateColor(A.rate) : undefined,
    },
    { l: "Average attendance", v: n1(A.avg), s: dA ? dA.s : "people per meeting", c: dA?.c },
    { l: "Member turnout", v: `${pctN(A.memAtt, A.memSlots)}%`, s: "of members came to a typical meeting" },
    { l: "First-timers at meetings", v: String(A.ft), s: `${plural(A.ftUniq, "different person", "different people")}` },
    {
      l: "Offering recorded",
      v: moneyMix(A.ms),
      s: A.held ? `GHS ${n0(ghsOf(A.ms) / Math.max(1, ghsMeetings))} per meeting on average` : "No meetings yet",
    },
  ];

  /* ------------------------------ per-center rows ----------------------------- */

  const rows = cs.map((c) => ({ c, a: agg([c], P.from, P.to), b: agg([c], pFrom, pTo), gap: gapOf(c.last, today) }));
  const sorters: Record<Sort, (x: (typeof rows)[number], y: (typeof rows)[number]) => number> = {
    souls: (x, y) => y.a.ss.length - x.a.ss.length,
    rate: (x, y) => y.a.rate - x.a.rate,
    avg: (x, y) => y.a.avg - x.a.avg,
    off: (x, y) => ghsOf(y.a.ms) - ghsOf(x.a.ms),
    last: (x, y) => y.gap - x.gap,
  };
  const sorted = [...rows].sort(sorters[sort]);
  const open = (id: number) => navigate(lcDetailPath(id));
  const regPill = (a: Agg): { label: string; tone: PillTone } =>
    !a.exp
      ? { label: "None scheduled", tone: "neutral" }
      : { label: `${a.rate}% · ${a.rate >= 85 ? "Regular" : a.rate >= 60 ? "Irregular" : "Often missed"}`, tone: rateTone(a.rate) };
  const lastText = (r: (typeof rows)[number]) => (r.c.last ? `${fmtS(r.c.last)} (${r.gap}d)` : "Never");

  /* --------------------------------- attention -------------------------------- */

  const remind = async (r: (typeof rows)[number], reason: LeaderReminderReason) => {
    try {
      const response = await api.post.remindLifeCenterLeader({ lifeCenterId: r.c.id, reason });
      setReminded((prev) => ({ ...prev, [r.c.id]: true }));
      notify.success({
        title: "Reminder sent",
        message: `${response?.data?.sent_to || r.c.leader || "The leader"} has been asked to update ${r.c.name}.`,
      });
    } catch (error) {
      notify.error({ title: "Couldn’t send the reminder", message: errorText(error, "Try again later.") });
    }
  };
  type Att = { r: (typeof rows)[number]; tone: PillTone; pill: string; title: string; text: string; reason: LeaderReminderReason; verb: string; k: number; g: number };
  const attention: Att[] = [];
  rows.forEach((r) => {
    const leader = r.c.leader ?? "the leader";
    const daysText = r.c.days.length ? `Meets on ${joinAnd(r.c.days.map((d) => DAYF[d]))}, led by ${leader}.` : `Led by ${leader}.`;
    if (r.gap > OVERDUE_DAYS)
      attention.push({
        r,
        tone: "danger",
        pill: "Overdue",
        title: r.c.last ? `${r.c.name} hasn’t met in ${r.gap} days` : `${r.c.name} has never recorded a meeting`,
        text: `${r.c.last ? `Last meeting ${fmtD(r.c.last)}. ` : ""}${daysText}`,
        reason: "overdue",
        verb: "Remind",
        k: 0,
        g: r.gap,
      });
    else if (r.a.exp >= 3 && r.a.rate < 60)
      attention.push({
        r,
        tone: "warning",
        pill: "Irregular",
        title: `${r.c.name} held ${r.a.held} of ${r.a.exp} scheduled meetings`,
        text: "Meetings are often skipped in this period. Check whether the meeting day still works for members.",
        reason: "irregular",
        verb: "Remind",
        k: 1,
        g: r.a.rate,
      });
    else if (r.b.held >= 2 && r.a.held >= 2 && r.a.avg < r.b.avg * 0.8)
      attention.push({
        r,
        tone: "warning",
        pill: "Attendance down",
        title: `${r.c.name} attendance fell from ${n1(r.b.avg)} to ${n1(r.a.avg)}`,
        text: `Average turnout dropped by ${pctN(r.b.avg - r.a.avg, r.b.avg)}% against the previous period.`,
        reason: "attendance",
        verb: "Check in with",
        k: 2,
        g: 0,
      });
  });
  attention.sort((a, b) => a.k - b.k || b.g - a.g);

  /* ----------------------------------- chart ---------------------------------- */

  const buckets = bucketsOf(P.from, P.to, by);
  const vals = buckets.map((b) => {
    const x = agg(cs, b.a, b.b);
    const v = metric === "souls" ? x.ss.length : metric === "meetings" ? x.held : metric === "attendance" ? x.avg : ghsOf(x.ms);
    return { b, x, v, e: x.exp };
  });
  const mx = Math.max(1, ...vals.map((o) => (metric === "meetings" ? Math.max(o.v, o.e) : o.v)));
  const chartLabel: Record<Metric, [string, string]> = {
    souls: ["Souls won over time", "New people won through life centers"],
    meetings: ["Meetings held against scheduled", "Based on each center’s meeting days"],
    attendance: ["Average attendance per meeting", "Members and first-timers together"],
    offering: ["Offering recorded", "GHS only. Other currencies are left out of the chart."],
  };
  const fmtV = (o: (typeof vals)[number]) =>
    metric === "meetings" ? `${o.v}/${o.e}` : metric === "attendance" ? n1(o.v) : metric === "offering" ? (o.v >= 1000 ? `${n1(o.v / 1000)}k` : n0(o.v)) : String(o.v);

  /* ---------------------------------- side cards ------------------------------ */

  const top = rows.filter((r) => r.a.ss.length).sort(sorters.souls).slice(0, 6);
  const tMax = Math.max(1, ...top.map((r) => r.a.ss.length));
  const byDay: Record<string, number[]> = {};
  A.ms.forEach((g) => {
    const d = dow(g.date);
    (byDay[d] = byDay[d] || []).push(g.member_user_ids.length + g.first_timer_ids.length);
  });
  const dayList = DAYS.filter((d) => byDay[d]).map((d) => ({ d, avg: byDay[d].reduce((a, b) => a + b, 0) / byDay[d].length, n: byDay[d].length }));
  const dMax = Math.max(1, ...dayList.map((x) => x.avg));

  const insights: { tone: PillTone; p: string; s: string }[] = [];
  const peak = [...vals].sort((a, b) => b.x.ss.length - a.x.ss.length)[0];
  if (peak && peak.x.ss.length) insights.push({ tone: "success", p: "Peak", s: `${peak.b.l} had the most souls won (${peak.x.ss.length}).` });
  const reg = rows.filter((r) => r.a.exp >= 2).sort((a, b) => b.a.rate - a.a.rate || b.a.avg - a.a.avg)[0];
  if (reg) insights.push({ tone: "success", p: "Most regular", s: `${reg.c.name} held ${reg.a.held} of ${reg.a.exp} scheduled meetings (${reg.a.rate}%).` });
  const big = rows.filter((r) => r.a.held).sort((a, b) => b.a.avg - a.a.avg)[0];
  if (big && rows.length > 1) insights.push({ tone: "info", p: "Attendance", s: `${big.c.name} draws the most people, ${n1(big.a.avg)} per meeting.` });
  if (A.ss.length) insights.push({ tone: "warning", p: "Follow-up", s: `${A.ss.length - A.conv} of ${A.ss.length} souls won in this period are not yet members.` });
  if (A.ft && A.held) insights.push({ tone: "info", p: "Visitors", s: `Each meeting brings ${n1(A.ft / A.held)} first-timers on average.` });
  if (!insights.length) insights.push({ tone: "neutral", p: "No data", s: "Nothing recorded in this period yet." });

  /* ----------------------------------- export --------------------------------- */

  const exportCsv = () => {
    downloadCsv("life-center-analytics.csv", [
      ["Period", P.label],
      [],
      ["Life center", "Leader", "Souls won", "Became members", "Meetings held", "Meetings scheduled", "Held %", "Avg attendance", "Member turnout %", "First-timers", "Offering", "Last met"],
      ...sorted.map((r) => [
        r.c.name,
        r.c.leader ?? "",
        r.a.ss.length,
        r.a.conv,
        r.a.held,
        r.a.exp,
        r.a.rate,
        n1(r.a.avg),
        pctN(r.a.memAtt, r.a.memSlots),
        r.a.ft,
        moneyMix(r.a.ms),
        r.c.last ?? "",
      ]),
    ]);
    notify.success({ title: "CSV downloaded", message: `Analytics for ${P.label} saved.` });
  };

  /* ---------------------------------- options --------------------------------- */

  const monthOpts = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const d = new Date(`${today.slice(0, 7)}-01T00:00:00`);
    for (let i = 0; i < 12; i++) {
      out.push({ value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: `${MONF[d.getMonth()]} ${d.getFullYear()}` });
      d.setMonth(d.getMonth() - 1);
    }
    return out;
  }, [today]);
  const weekOpts = Array.from({ length: 12 }, (_, i) => {
    const w = addDaysKey(mon0, -7 * i);
    return { value: String(i), label: i === 0 ? `This week (from ${fmtS(w)})` : `Week of ${fmtS(w)}` };
  });
  const centerName = cs.length === 1 && centerFilter ? cs[0].name : "";
  const note = `${P.label}${centerFilter ? (centerName ? ` · ${centerName}` : "") : ` · all ${plural(allCenters.length, "life center")}`}. Scheduled meetings are counted from each center’s meeting days up to yesterday. Changes compare with the ${L} days before.`;

  const controls = (
    <>
      <SelectInput
        aria-label="Period"
        className="w-auto"
        value={by}
        onChange={(e) => setBy(e.target.value as By)}
        options={[
          { value: "year", label: `This year (${year})` },
          { value: "month", label: "Month" },
          { value: "week", label: "Week" },
          { value: "range", label: "Specific dates" },
        ]}
      />
      {by === "month" && <SelectInput aria-label="Month" className="w-auto" value={month} onChange={(e) => setMonth(e.target.value)} options={monthOpts} />}
      {by === "week" && <SelectInput aria-label="Week" className="w-auto" value={week} onChange={(e) => setWeek(e.target.value)} options={weekOpts} />}
      {by === "range" && (
        <div className="flex flex-wrap items-center gap-2">
          <TextInput type="date" aria-label="From" className="w-auto" max={today} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-sm text-[#6B7280]">to</span>
          <TextInput type="date" aria-label="To" className="w-auto" max={today} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}
      {!fixedCenterId && (
        <SelectInput
          aria-label="Life center"
          className="w-auto max-w-full"
          value={lcSel}
          onChange={(e) => setLcSel(e.target.value)}
          options={[{ value: "", label: "All life centers" }, ...allCenters.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
      )}
      <UiButton onClick={exportCsv} disabled={!rows.length}>
        Export CSV
      </UiButton>
    </>
  );

  const body = (
    <>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold leading-7 text-primary">Analytics</h2>
            <p className="text-sm text-[#4B5563]">Souls won, how regularly the center meets, and who turns up.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">{controls}</div>
        </div>
      ) : (
        <PageHeading
          title="Life center analytics"
          subtitle="Souls won, how regularly each center meets, and who turns up."
          actions={controls}
        />
      )}
      <p className="text-xs text-[#6B7280]">{note}</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
        {kpis.map((k) => (
          <div key={k.l} className="flex min-w-0 flex-col gap-1 rounded-xl border border-lightGray bg-white px-5 py-4">
            <p className="text-sm text-[#4B5563]">{k.l}</p>
            <p className="break-words text-2xl font-semibold leading-8 text-primary">{loaded ? k.v : "—"}</p>
            <p className="text-xs" style={{ color: k.c ?? "#6B7280" }}>
              {loaded ? k.s : " "}
            </p>
          </div>
        ))}
      </div>

      {loaded && attention.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-[#FDE68A] bg-white">
          <div className="flex flex-col gap-1 border-b border-[#FDE68A] bg-[#FFFBEB] px-5 py-4">
            <h2 className="text-base font-semibold text-primary">Needs your attention</h2>
            <p className="text-sm text-[#374151]">
              {plural(attention.length, "life center")} need follow-up. Overdue is based on today; the rest on the selected period.
            </p>
          </div>
          {attention.map((a) => (
            <div key={a.r.c.id} className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] px-5 py-4 last:border-b-0">
              <Pill tone={a.tone} className="flex-shrink-0">
                {a.pill}
              </Pill>
              <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                <p className="text-sm font-semibold text-primary">{a.title}</p>
                <p className="text-sm text-[#4B5563]">{a.text}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {manage && a.r.c.leader && (
                  <UiButton size="sm" onClick={() => remind(a.r, a.reason)} disabled={reminded[a.r.c.id]}>
                    {reminded[a.r.c.id] ? "Reminder sent" : `${a.verb} ${firstWord(a.r.c.leader)}`}
                  </UiButton>
                )}
                {!fixedCenterId && (
                  <UiButton size="sm" tone="primary" onClick={() => open(a.r.c.id)}>
                    Open life center
                  </UiButton>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-5 tablet:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-primary">{chartLabel[metric][0]}</h2>
            <p className="text-sm text-[#4B5563]">{chartLabel[metric][1]}</p>
          </div>
          <PillTabs
            size="sm"
            ariaLabel="Chart metric"
            value={metric}
            onChange={setMetric}
            tabs={[
              { key: "meetings", label: "Meetings" },
              { key: "attendance", label: "Attendance" },
              { key: "souls", label: "Souls won" },
              { key: "offering", label: "Offering" },
            ]}
          />
        </div>
        {metric === "meetings" && (
          <div className="flex flex-wrap gap-3 text-xs text-[#4B5563]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-lightGray" />
              Scheduled
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
              Held
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <div className="flex flex-col gap-2" style={{ minWidth: Math.max(320, buckets.length * 48) }}>
            <div className="flex h-[220px] items-end gap-2 border-b border-[#E5E7EB]">
              {vals.map((o) => (
                <div
                  key={o.b.a}
                  title={`${o.b.l}: ${o.x.held} of ${o.x.exp} meetings, ${n1(o.x.avg)} avg attendance, ${o.x.ss.length} souls won, ${moneyMix(o.x.ms)}`}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                >
                  <span className="whitespace-nowrap text-xs font-semibold text-primary">{loaded ? fmtV(o) : ""}</span>
                  <div className="flex h-full w-full max-w-14 items-end" style={{ gap: metric === "meetings" ? 3 : 0 }}>
                    {metric === "meetings" && (
                      <div className="flex-1 rounded-t bg-lightGray" style={{ height: `${(o.e / mx) * 100}%` }} />
                    )}
                    <div className="flex-1 rounded-t bg-primary" style={{ height: `${(o.v / mx) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {vals.map((o) => (
                <span key={o.b.a} className="min-w-0 flex-1 truncate text-center text-xs text-[#6B7280]">
                  {o.b.l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!fixedCenterId && (
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-primary">How each life center is doing</h2>
              <p className="text-sm text-[#4B5563]">Souls won and meetings in the selected period. Select a row to open the center.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#4B5563]">
              <span className="whitespace-nowrap">Sort by</span>
              <SelectInput
                className="w-auto"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                options={[
                  { value: "souls", label: "Souls won" },
                  { value: "rate", label: "Regularity" },
                  { value: "avg", label: "Average attendance" },
                  { value: "off", label: "Offering" },
                  { value: "last", label: "Longest since last meeting" },
                ]}
              />
            </label>
          </div>
          {sorted.length ? (
            <>
              <div className="hidden md:block">
                <GridTable
                  rows={sorted}
                  loading={!loaded}
                  getRowId={(r) => String(r.c.id)}
                  onRowClick={(r) => open(r.c.id)}
                  minWidth="1100px"
                  columns={[
                    {
                      key: "name",
                      header: "Life center",
                      width: "minmax(200px,1.6fr)",
                      render: (r) => <CellText strong main={r.c.name} sub={`${r.c.leader ?? "No leader yet"} · ${r.c.days.join(", ") || "No days"}`} />,
                    },
                    { key: "souls", header: "Souls won", width: "90px", render: (r) => <span className="font-semibold">{r.a.ss.length}</span> },
                    { key: "held", header: "Meetings held", width: "120px", render: (r) => `${r.a.held} of ${r.a.exp}` },
                    {
                      key: "reg",
                      header: "Regularity",
                      width: "150px",
                      render: (r) => {
                        const p = regPill(r.a);
                        return <Pill tone={p.tone}>{p.label}</Pill>;
                      },
                    },
                    { key: "avg", header: "Avg attendance", width: "130px", render: (r) => <CellText main={n1(r.a.avg)} sub={`${pctN(r.a.memAtt, r.a.memSlots)}% of members`} /> },
                    { key: "ft", header: "First-timers", width: "100px", render: (r) => r.a.ft },
                    { key: "off", header: "Offering", width: "minmax(120px,1fr)", render: (r) => <CellText main={moneyMix(r.a.ms)} /> },
                    {
                      key: "last",
                      header: "Last met",
                      width: "120px",
                      render: (r) => <span style={{ color: r.gap > OVERDUE_DAYS ? "#B91C1C" : undefined }}>{lastText(r)}</span>,
                    },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 md:hidden">
                {sorted.map((r) => {
                  const p = regPill(r.a);
                  return (
                    <button
                      key={r.c.id}
                      type="button"
                      onClick={() => open(r.c.id)}
                      className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-4 text-left text-sm text-primary"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{r.c.name}</p>
                          <p className="text-xs text-[#6B7280]">{r.c.leader ?? "No leader yet"}</p>
                        </div>
                        <Pill tone={p.tone}>{p.label}</Pill>
                      </div>
                      <div className="grid w-full grid-cols-3 gap-2">
                        {[
                          { v: String(r.a.ss.length), l: "Souls won" },
                          { v: String(r.a.held), l: "Meetings held" },
                          { v: n1(r.a.avg), l: "Avg attendance" },
                        ].map((t) => (
                          <div key={t.l}>
                            <p className="font-semibold">{t.v}</p>
                            <p className="text-xs text-[#6B7280]">{t.l}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: r.gap > OVERDUE_DAYS ? "#B91C1C" : "#6B7280" }}>
                        Last met {lastText(r)} · {moneyMix(r.a.ms)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-lightGray bg-white p-6 text-center text-sm text-[#4B5563]">
              {loaded ? "No life centers to show." : "Loading life centers…"}
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-start gap-4">
        {!fixedCenterId && (
          <Card title="Top centers by souls won" sub="With who leads each one">
            {top.length ? (
              top.map((r) => (
                <HBar
                  key={r.c.id}
                  label={r.c.name}
                  value={r.a.ss.length}
                  width={`${(r.a.ss.length / tMax) * 100}%`}
                  sub={`${r.c.leader ?? "No leader yet"} · ${r.a.conv} now members`}
                />
              ))
            ) : (
              <p className="text-sm text-[#6B7280]">No souls won in this period.</p>
            )}
          </Card>
        )}
        <Card title="Turnout by meeting day" sub={fixedCenterId ? "Average attendance on each meeting day" : "Average attendance on each day centers meet"}>
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
            <p className="text-sm text-[#6B7280]">No meetings in this period.</p>
          )}
        </Card>
        <section className="flex min-w-0 flex-col gap-1 rounded-xl border border-lightGray bg-white p-5 tablet:p-6">
          <h3 className="text-base font-semibold text-primary">What stands out</h3>
          {insights.map((i) => (
            <div key={i.p} className="flex gap-3 border-b border-[#E5E7EB] py-3 last:border-b-0">
              <Pill tone={i.tone} className="flex-shrink-0 self-start">
                {i.p}
              </Pill>
              <p className="text-sm text-[#374151]">{i.s}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );

  return embedded ? <div className="flex flex-col gap-6">{body}</div> : <PageOutline className="flex flex-col gap-6">{body}</PageOutline>;
};

const LifeCenterAnalytics = () => <LifeCenterAnalyticsView />;

export default LifeCenterAnalytics;
