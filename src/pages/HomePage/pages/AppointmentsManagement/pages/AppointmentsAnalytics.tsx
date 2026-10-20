import { useMemo, useState } from "react";

import PageOutline from "../../../Components/PageOutline";
import { KpiCard, PageHeading, Pill, type PillTone, SelectInput } from "../../MembershipManagement/components/membershipUi";
import { LegendDot, Meter, Panel } from "../Components/appointmentUi";
import {
  type ApptBooking,
  D,
  DOW,
  DOWF,
  MON,
  WEEK_ORDER,
  addDays,
  dayIndex,
  dur,
  fmtD,
  hrs,
  iso,
  median,
  pc,
  sessionsOn,
  toMin,
} from "../utils/appointmentModel";
import { useAppointmentsData } from "../utils/useAppointmentsData";

type Period = "30" | "month" | "quarter" | "year";

const PERIODS: { value: Period; label: string }[] = [
  { value: "30", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "Last 3 months" },
  { value: "year", label: "This year" },
];

const CATEGORIES: { label: string; color: string; test: (b: ApptBooking) => boolean }[] = [
  { label: "Completed", color: "#080D2D", test: (b) => b.status === "COMPLETED" },
  { label: "Confirmed", color: "rgba(8,13,45,0.45)", test: (b) => b.status === "CONFIRMED" },
  { label: "Awaiting", color: "#B45309", test: (b) => b.status === "PENDING" || b.status === "RESCHEDULED" },
  { label: "No-show", color: "#B91C1C", test: (b) => b.status === "NO_SHOW" },
  { label: "Declined or cancelled", color: "#D8DAE5", test: (b) => b.status === "DECLINED" || b.status === "CANCELLED" },
];

const BANDS: [number, number][] = [
  [8, 10],
  [10, 12],
  [12, 14],
  [14, 16],
  [16, 18],
  [18, 20],
];

const replyHours = (list: ApptBooking[]) =>
  list.filter((b) => b.respondedAt && b.createdAt).map((b) => hrs(b.createdAt, b.respondedAt as string));

const slaPill = (onTime: number, n: number): { label: string; tone: PillTone } =>
  !n
    ? { label: "—", tone: "neutral" }
    : { label: `${onTime}%`, tone: onTime >= 90 ? "success" : onTime >= 70 ? "warning" : "danger" };

const AppointmentsAnalytics = () => {
  const data = useAppointmentsData();
  const { bookings, staff, now, settings } = data;
  const sla = settings.replyDeadlineHours;
  const [period, setPeriod] = useState<Period>("month");
  const [personId, setPersonId] = useState("");

  const to = iso(now);
  const from =
    period === "30"
      ? addDays(to, -29)
      : period === "month"
      ? `${to.slice(0, 8)}01`
      : period === "quarter"
      ? addDays(to, -89)
      : `${to.slice(0, 4)}-01-01`;

  const stats = useMemo(() => {
    const list = bookings.filter((b) => b.date >= from && b.date <= to && (!personId || b.attendeeId === personId));
    const replies = replyHours(list);
    const answered = list.filter((b) => b.respondedAt);
    const accepted = answered.filter((b) => b.status !== "DECLINED").length;
    const held = list.filter((b) => b.status === "COMPLETED" || b.status === "NO_SHOW");
    const noShows = held.filter((b) => b.status === "NO_SHOW").length;
    const onTime = pc(replies.filter((h) => h <= sla).length, replies.length);

    // Bars: by week for up to 3 months, by month for the year.
    const byMonth = period === "year";
    const keyOf = (day: string) => {
      if (byMonth) return day.slice(0, 7);
      const date = D(day);
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      return iso(date);
    };
    const keys: string[] = [];
    for (let d = from; d <= to; d = addDays(d, byMonth ? 1 : 7)) {
      const key = keyOf(d);
      if (!keys.includes(key)) keys.push(key);
    }
    if (!keys.includes(keyOf(to))) keys.push(keyOf(to));
    const values = keys.map((key) => CATEGORIES.map((c) => list.filter((b) => keyOf(b.date) === key && c.test(b)).length));
    const tallest = Math.max(1, ...values.map((v) => v.reduce((a, b) => a + b, 0)));
    const bars = keys.map((key, i) => {
      const v = values[i];
      const total = v.reduce((a, b) => a + b, 0);
      return {
        key,
        label: byMonth ? MON[Number(key.slice(5)) - 1] : `${D(key).getDate()} ${MON[D(key).getMonth()]}`,
        total,
        height: total ? Math.max(2, (total * 100) / tallest) : 0,
        tip: CATEGORIES.map((c, j) => `${c.label} ${v[j]}`).join(", "),
        segments: v.map((n, j) => ({ pct: total ? (n * 100) / total : 0, color: CATEGORIES[j].color })),
      };
    });

    const scope = personId ? staff.filter((s) => s.id === personId) : staff;
    const people = scope.map((s) => {
      const mine = list.filter((b) => b.attendeeId === s.id);
      const r = replyHours(mine);
      const h = mine.filter((b) => b.status === "COMPLETED" || b.status === "NO_SHOW");
      const ns = h.filter((b) => b.status === "NO_SHOW").length;
      const answeredMine = mine.filter((b) => b.respondedAt);
      const ot = pc(r.filter((x) => x <= sla).length, r.length);
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        n: mine.length,
        replies: r.length,
        median: r.length ? median(r) : 0,
        onTime: ot,
        accepted: answeredMine.length ? pc(answeredMine.filter((b) => b.status !== "DECLINED").length, answeredMine.length) : null,
        noShow: h.length ? pc(ns, h.length) : null,
        noShowHigh: h.length > 0 && ns / h.length > 0.12,
      };
    });

    const reasonCounts: Record<string, number> = {};
    list.forEach((b) => {
      reasonCounts[b.reason] = (reasonCounts[b.reason] || 0) + 1;
    });
    const reasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

    const heat = BANDS.map(([a, b]) =>
      WEEK_ORDER.map((d) => list.filter((x) => x.start && dayIndex(x.date) === d && toMin(x.start) >= a * 60 && toMin(x.start) < b * 60).length)
    );
    const heatMax = Math.max(1, ...heat.flat());

    const days: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
    const utilisation = scope.map((s) => {
      const offered = days.reduce((sum, d) => sum + sessionsOn(s, d), 0);
      const booked = list.filter((b) => b.attendeeId === s.id && b.status !== "DECLINED" && b.status !== "CANCELLED").length;
      return { id: s.id, name: s.name, offered, booked, use: pc(booked, offered) };
    });

    const insights: { pill: { label: string; tone: PillTone }; title: string; text: string }[] = [];
    const slow = people.filter((p) => p.replies >= 3).sort((a, b) => a.onTime - b.onTime)[0];
    if (slow && slow.onTime < 80) {
      insights.push({
        pill: { label: "Reply time", tone: "warning" },
        title: `${slow.name} replies on time ${slow.onTime}% of the time`,
        text: `Typical reply is ${dur(slow.median)} against a ${sla} h target. Consider a delegate or turning on SMS reminders for them.`,
      });
    }
    if (reasons[0]) {
      insights.push({
        pill: { label: "Demand", tone: "info" },
        title: `${reasons[0][0]} is the most requested reason`,
        text: `${pc(reasons[0][1], list.length)}% of requests. Make sure enough people are set up for it.`,
      });
    }
    const flat = heat.flat();
    const busiest = flat.indexOf(Math.max(...flat));
    if (flat[busiest]) {
      const [a, b] = BANDS[Math.floor(busiest / 7)];
      insights.push({
        pill: { label: "Timing", tone: "neutral" },
        title: `Busiest slot: ${DOWF[WEEK_ORDER[busiest % 7]]} ${a}:00–${b}:00`,
        text: "Adding sessions here would cut waiting the most.",
      });
    }
    if (held.length && noShows / held.length > 0.08) {
      insights.push({
        pill: { label: "No-shows", tone: "danger" },
        title: `${pc(noShows, held.length)}% of booked appointments were missed`,
        text: "Turning on the SMS reminder 2 hours before usually helps.",
      });
    }

    return { list, replies, answered, accepted, held, noShows, onTime, bars, people, reasons, heat, heatMax, utilisation, insights };
  }, [bookings, staff, from, to, personId, period, sla]);

  const s = stats;
  const reasonMax = Math.max(1, ...s.reasons.map((r) => r[1]));

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Appointment analytics"
        subtitle="Demand, reply times and how full each calendar is."
        actions={
          <>
            <SelectInput
              aria-label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              options={PERIODS}
              className="w-auto min-w-[160px] flex-auto sm:flex-none"
            />
            <SelectInput
              aria-label="Person"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              options={[{ value: "", label: "Everyone" }, ...staff.map((p) => ({ value: p.id, label: p.name }))]}
              className="w-auto min-w-[160px] flex-auto sm:flex-none"
            />
          </>
        }
      />
      <p className="text-xs text-[#6B7280]">
        Appointments dated {fmtD(from)} {from.slice(0, 4)} to {fmtD(to)} {to.slice(0, 4)}. Reply time counts from the request to the
        first answer.
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
        <KpiCard
          label="Requests"
          value={s.list.length}
          sub={`${s.list.filter((b) => b.status === "PENDING").length} still awaiting reply`}
        />
        <KpiCard label="Typical reply" value={s.replies.length ? dur(median(s.replies)) : "—"} sub="Median, first answer" />
        <KpiCard
          label="Replied on time"
          value={s.replies.length ? `${s.onTime}%` : "—"}
          sub={<span className={s.replies.length && s.onTime < 80 ? "text-[#B45309]" : "text-[#15803D]"}>Within {sla} h</span>}
        />
        <KpiCard
          label="Accepted"
          value={s.answered.length ? `${pc(s.accepted, s.answered.length)}%` : "—"}
          sub={`${s.answered.length - s.accepted} declined`}
        />
        <KpiCard
          label="No-shows"
          value={s.held.length ? `${pc(s.noShows, s.held.length)}%` : "—"}
          sub={
            <span className={s.held.length && s.noShows / s.held.length > 0.08 ? "text-[#B91C1C]" : ""}>
              {s.noShows} of {s.held.length} held
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
        <Panel
          className="col-span-full"
          title="Requests by week"
          helper="What happened to each request, by the week it was made."
          action={
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((c) => (
                <LegendDot key={c.label} color={c.color} label={c.label} />
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <div style={{ minWidth: Math.max(280, s.bars.length * 36) }}>
              <div className="flex h-[200px] items-end gap-1.5 border-b border-[#E5E7EB]">
                {s.bars.map((bar) => (
                  <div key={bar.key} title={bar.tip} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-xs font-semibold text-primary">{bar.total || ""}</span>
                    <div
                      className="flex w-full max-w-[40px] flex-col-reverse overflow-hidden rounded-t"
                      style={{ height: `${bar.height}%` }}
                    >
                      {bar.segments.map((seg, j) => (
                        <div key={j} style={{ flex: `0 0 ${seg.pct}%`, background: seg.color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-1.5">
                {s.bars.map((bar) => (
                  <span key={bar.key} className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-center text-xs text-[#6B7280]">
                    {bar.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          className="col-span-full"
          title="How quickly each person responds"
          helper={`Target: reply within ${sla} hours. Change it in Settings → Booking rules.`}
        >
          <div className="overflow-x-auto rounded-lg border border-lightGray">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[minmax(180px,1.6fr)_repeat(5,minmax(90px,0.8fr))] gap-3 bg-lightGray px-4 py-3 text-sm font-semibold text-primary">
                <span>Person</span>
                <span>Requests</span>
                <span>Typical reply</span>
                <span>On time</span>
                <span>Accepted</span>
                <span>No-shows</span>
              </div>
              {s.people.map((p) => {
                const pill = slaPill(p.onTime, p.replies);
                return (
                  <div
                    key={p.id}
                    className="grid min-h-14 grid-cols-[minmax(180px,1.6fr)_repeat(5,minmax(90px,0.8fr))] items-center gap-3 border-b border-[#E5E7EB] px-4 py-2 text-sm text-primary last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      {p.role && <p className="truncate text-xs text-[#6B7280]">{p.role}</p>}
                    </div>
                    <span>{p.n}</span>
                    <span>{p.replies ? dur(p.median) : "—"}</span>
                    <span>
                      <Pill tone={pill.tone}>{pill.label}</Pill>
                    </span>
                    <span>{p.accepted === null ? "—" : `${p.accepted}%`}</span>
                    <span className={p.noShowHigh ? "text-[#B91C1C]" : ""}>{p.noShow === null ? "—" : `${p.noShow}%`}</span>
                  </div>
                );
              })}
              {!s.people.length && <p className="px-4 py-6 text-sm text-[#6B7280]">Nobody has a schedule yet.</p>}
            </div>
          </div>
        </Panel>

        <Panel title="What people book for" helper="Requests by reason">
          {s.reasons.map(([label, n]) => (
            <Meter key={label} label={label} value={`${n} · ${pc(n, s.list.length)}%`} percent={(n * 100) / reasonMax} />
          ))}
          {!s.reasons.length && <p className="text-sm text-[#6B7280]">No requests in this period.</p>}
        </Panel>

        <Panel title="When people want to meet" helper="Requested start times. Darker means busier.">
          <div className="overflow-x-auto">
            <div className="grid min-w-[320px] grid-cols-[44px_repeat(7,minmax(32px,1fr))] gap-1">
              <span />
              {WEEK_ORDER.map((d) => (
                <span key={d} className="text-center text-xs text-[#6B7280]">
                  {DOW[d]}
                </span>
              ))}
              {BANDS.map(([a, b], i) => [
                <span key={`l${a}`} className="flex h-7 items-center text-xs text-[#6B7280]">
                  {a % 12 || 12}
                  {a < 12 ? "am" : "pm"}
                </span>,
                ...WEEK_ORDER.map((d, j) => {
                  const v = s.heat[i][j];
                  const k = v / s.heatMax;
                  return (
                    <div
                      key={`${a}-${d}`}
                      title={`${DOW[d]} ${a}:00–${b}:00 · ${v} requests`}
                      className="flex h-7 items-center justify-center rounded text-xs"
                      style={{
                        background: v ? `rgba(8,13,45,${(0.08 + k * 0.85).toFixed(2)})` : "#F3F4F6",
                        color: k > 0.45 ? "#fff" : "#080D2D",
                      }}
                    >
                      {v || ""}
                    </div>
                  );
                }),
              ])}
            </div>
          </div>
        </Panel>

        <Panel title="How full each calendar is" helper="Booked sessions out of sessions offered">
          {s.utilisation.map((u) => (
            <Meter
              key={u.id}
              label={u.name}
              value={u.offered ? `${u.use}% · ${u.booked} of ${u.offered}` : "No sessions offered"}
              percent={u.use}
              tone={u.use >= 85 ? "danger" : u.use >= 65 ? "warning" : "primary"}
            />
          ))}
          {!s.utilisation.length && <p className="text-sm text-[#6B7280]">Nobody has a schedule yet.</p>}
        </Panel>

        <Panel title="What stands out">
          <div className="-mt-3 flex flex-col">
            {s.insights.map((item) => (
              <div key={item.title} className="flex gap-3 border-b border-[#E5E7EB] py-3 last:border-b-0">
                <span className="flex-shrink-0 self-start">
                  <Pill tone={item.pill.tone}>{item.pill.label}</Pill>
                </span>
                <div>
                  <p className="text-sm font-semibold text-primary">{item.title}</p>
                  <p className="text-sm text-[#4B5563]">{item.text}</p>
                </div>
              </div>
            ))}
            {!s.insights.length && <p className="pt-3 text-sm text-[#6B7280]">Nothing unusual in this period.</p>}
          </div>
        </Panel>
      </div>
    </PageOutline>
  );
};

export default AppointmentsAnalytics;
