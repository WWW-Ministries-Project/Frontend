import type {
  AttendanceData,
  HeroData,
  FollowUpData,
  ItemsData,
  AgendaItem,
  LifeCentersData,
  SchoolData,
  StepsData,
} from "@/utils/api/workspaces/interfaces";

import { PATHS } from "../queueActions";
import {
  FunnelChart,
  HBarList,
  RingGrid,
  StatGrid,
} from "../WidgetCharts";
import { AgendaRows, ListRows } from "../WidgetRows";
import { AM, barRows, BZ, longDate, nf, RD } from "../wsFormat";
import { def, type WidgetCtx, type WidgetDef } from "../wsTypes";
import { AttendanceAside, AttendanceChart, HeroBody } from "./PrelateParts";
import { kpiWidget, queueWidget } from "./shared";

const rangeLower = (ctx: WidgetCtx) => (ctx.range?.label ?? "this period").toLowerCase();

export const PRELATE_WIDGETS: WidgetDef[] = [
  def<HeroData>({
    id: "p-hero",
    kind: "hero",
    span: 8,
    title: (ctx) => `State of the church · ${ctx.range?.label ?? ""}`.toUpperCase(),
    isEmpty: (d) => !d.lines?.length,
    render: (d, ctx) => <HeroBody data={d} ctx={ctx} />,
  }),
  queueWidget("p-sign", "Waiting on you", 4, { sub: () => "Items at your approval step" }),
  kpiWidget("p-kpi"),
  def<AttendanceData>({
    id: "p-att",
    span: 7,
    title: "Attendance trend",
    skeleton: 160,
    sub: (d, ctx) => {
      const event = d?.events?.find((e) => String(e.id) === ctx.attEvent);
      return event ? `${event.name}, last 12 occurrences` : "All scheduled events, weekly total";
    },
    aside: (d, ctx) => <AttendanceAside data={d} ctx={ctx} />,
    isEmpty: (d) => !d.points?.length,
    render: (d, ctx) => <AttendanceChart data={d} ctx={ctx} />,
  }),
  def<StepsData>({
    id: "p-fun",
    span: 5,
    title: "Growth funnel",
    sub: (_, ctx) => `Visitors and souls won becoming members, ${rangeLower(ctx)}`,
    isEmpty: (d) => !d.steps?.length,
    render: (d) => <FunnelChart steps={d.steps} />,
  }),
  def<FollowUpData>({
    id: "p-fol",
    span: 4,
    title: "Visitors to follow up",
    sub: (d) =>
      d ? `${nf(d.need_follow_up)} need follow-up · ${nf(d.unassigned)} have no responsible person` : undefined,
    link: () => ({ label: "Open Visitors", to: PATHS.visitors }),
    empty: { title: "No visitors to follow up", text: "Every visitor has been followed up." },
    isEmpty: (d) => !d.items?.length,
    render: (d) => <ListRows items={d.items} />,
  }),
  def<LifeCentersData>({
    id: "p-lc",
    span: 4,
    title: "Life Centers health",
    sub: () => "Meetings, attendance and leadership",
    link: () => ({ label: "Open Life Centers", to: PATHS.lifeCenters }),
    render: (d) => {
      const s = d.stats;
      const won = Number(s.souls_won) || 0;
      return (
        <div className="flex flex-col gap-4">
          <StatGrid
            min={120}
            stats={[
              { label: "Souls won", value: nf(s.souls_won) },
              {
                label: "Became members",
                value: nf(s.became_members),
                sub: won ? `${Math.round(((Number(s.became_members) || 0) / won) * 100)}% of souls won` : undefined,
              },
              { label: "Active centers", value: `${nf(s.active_centers)} of ${nf(s.total_centers)}` },
              { label: "Avg attendance", value: nf(s.avg_attendance) },
              {
                label: "Without a leader",
                value: nf(s.without_leader?.count),
                sub: s.without_leader?.names?.join(", ") || undefined,
                color: s.without_leader?.count ? RD : undefined,
                strong: true,
              },
              {
                label: "No meeting in 2+ weeks",
                value: nf(s.no_meeting_2w?.count),
                sub: s.no_meeting_2w?.names?.join(", ") || undefined,
                color: s.no_meeting_2w?.count ? AM : undefined,
              },
            ]}
          />
          {d.top?.length ? <HBarList rows={barRows(d.top)} color={BZ} /> : null}
        </div>
      );
    },
  }),
  def<SchoolData>({
    id: "p-som",
    span: 4,
    title: "School of Ministry",
    sub: (d) => {
      if (!d?.cohorts?.length) return undefined;
      const onTrack = d.cohorts.reduce((sum, c) => sum + (Number(c.on_track) || 0), 0);
      return `${d.cohorts.length} ${d.cohorts.length === 1 ? "cohort" : "cohorts"} in progress · ${nf(onTrack)} learners on track`;
    },
    isEmpty: (d) => !d.cohorts?.length,
    empty: { title: "No cohorts in progress", text: "Cohorts appear here once classes start." },
    render: (d) => (
      <RingGrid
        rings={d.cohorts.map((c) => ({
          label: c.name,
          value: c.total ? (c.on_track / c.total) * 100 : 0,
          sub: `${nf(c.on_track)} of ${nf(c.total)} on track`,
        }))}
      />
    ),
  }),
  def<ItemsData<AgendaItem>>({
    id: "p-today",
    span: 6,
    title: "My appointments today",
    sub: () => longDate(),
    link: () => ({ label: "Open Appointments", to: PATHS.appointments }),
    empty: { title: "No appointments today", text: "Confirmed appointments for today show here." },
    isEmpty: (d) => !d.items?.length,
    render: (d) => <AgendaRows items={d.items} />,
  }),
  def<ItemsData<AgendaItem>>({
    id: "p-events",
    span: 6,
    title: "Upcoming events",
    sub: () => "Next 14 days",
    link: () => ({ label: "Open Events", to: PATHS.events }),
    empty: { title: "No events in the next 14 days", text: "Scheduled events show here." },
    isEmpty: (d) => !d.items?.length,
    render: (d) => <AgendaRows items={d.items} />,
  }),
];

