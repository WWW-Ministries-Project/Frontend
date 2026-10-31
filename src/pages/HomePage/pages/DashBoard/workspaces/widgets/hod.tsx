import type {
  AgendaItem,
  DeptReportStatusData,
  FollowUpSplitData,
  ItemsData,
  StepsData,
  TeamCheckinsData,
} from "@/utils/api/workspaces/interfaces";

import { PATHS } from "../queueActions";
import { BarsChart, FunnelChart, Segments, StatGrid } from "../WidgetCharts";
import { AgendaRows } from "../WidgetRows";
import { BZ, GN, NV, RD, shortDate, statusPill, toneText } from "../wsFormat";
import { def, type WidgetCtx, type WidgetDef } from "../wsTypes";
import { kpiWidget, listWidget, queueWidget } from "./shared";

const deptName = (ctx: WidgetCtx) => ctx.department?.name ?? "your department";

const packHeadings = {
  media: { title: "Media pack", sub: "Department assets and sermons" },
  evangelism: {
    title: "Evangelism pack",
    sub: "Visitors your team follows up, and souls won becoming members",
  },
  children: { title: "Children pack", sub: "Department assets and children’s events" },
} as const;

/** Heading above the first widget of a department pack. */
const packSlot = (ctx: WidgetCtx) => {
  const pack = ctx.department?.pack;
  return pack ? { ...packHeadings[pack], tag: "Department pack" } : null;
};

const assetsWidget = (id: string) =>
  listWidget(id, "Department assets", 5, {
    sub: (_, ctx) => `Assigned to ${deptName(ctx)}`,
    link: { label: "Open stock check", to: PATHS.assets },
    empty: { title: "No assets assigned", text: "Assets assigned to this department show here." },
  });

const reportOpen = (d: DeptReportStatusData) =>
  ["DRAFT", "RETURNED", "NOT_STARTED", ""].includes(String(d.current.status || "").toUpperCase());

/** The department's own attendance report (`dept_att:<id>`), monthly. */
const reportPath = (d: DeptReportStatusData, ctx: WidgetCtx) => {
  const key = d.current.key?.startsWith("dept_att:")
    ? d.current.key
    : `dept_att:${ctx.department?.id ?? ""}`;
  return PATHS.deptReport(key, "MONTHLY", d.current.period_key);
};

const HOD_BASE: WidgetDef[] = [
  kpiWidget("h-kpi", 180),
  queueWidget("h-join", "Join requests", 5, {
    sub: (_, ctx) => `People asking to join ${deptName(ctx)}`,
    empty: { title: "No join requests", text: "New requests to join your department show here." },
  }),
  def<TeamCheckinsData>({
    id: "h-att",
    span: 7,
    title: "Team check-ins",
    sub: () => "Share of the team checked in at Sunday service, last 8 weeks",
    skeleton: 160,
    link: () => ({ label: "Open Event attendance", to: PATHS.eventAttendance }),
    isEmpty: (d) => !d.points?.length,
    render: (d) => (
      <BarsChart
        height={160}
        unit="%"
        labels={d.points.map((p) => p.label)}
        series={[{ name: "Checked in", color: NV, values: d.points.map((p) => Number(p.rate) || 0) }]}
      />
    ),
  }),
  listWidget("h-abs", "Not checked in recently", 5, {
    sub: () => "Team members with no check-in for 2+ Sundays",
    empty: { title: "Everyone checked in", text: "No one on the team has missed two Sundays in a row." },
  }),
  listWidget("h-req", "My requisitions", 7, {
    sub: (_, ctx) => `Raised for ${deptName(ctx)}`,
    avatar: "RQ",
    empty: { title: "No requisitions yet", text: "Requisitions raised for your department show here." },
    btns: () => [{ label: "New requisition", tone: "secondary", to: PATHS.requisitionNew }],
  }),
  def<DeptReportStatusData>({
    id: "h-rep",
    span: 5,
    title: "Department report",
    sub: (d) =>
      d?.current ? `${d.current.period_label} report · due ${shortDate(d.current.due_date)}` : undefined,
    isEmpty: (d) => !d.current,
    render: (d) => {
      const cur = statusPill(d.current.status);
      const prev = d.previous ? statusPill(d.previous.status) : null;
      return (
        <StatGrid
          min={120}
          stats={[
            { label: "Status", value: cur.label, sub: d.current.period_label, color: toneText[cur.tone] },
            ...(d.previous && prev && String(d.previous.status).toUpperCase() !== "NOT_STARTED"
              ? [
                  {
                    label: d.previous.period_label,
                    value: prev.label,
                    sub: d.previous.decided_at ? `Decided ${shortDate(d.previous.decided_at)}` : undefined,
                    color: toneText[prev.tone],
                  },
                ]
              : []),
          ]}
        />
      );
    },
    btns: (d, ctx) =>
      d.current
        ? [
            {
              label: reportOpen(d) ? "Continue report" : "View report",
              tone: "primary",
              to: reportPath(d, ctx),
            },
          ]
        : [],
  }),
  def<ItemsData<AgendaItem>>({
    id: "h-ev",
    span: 7,
    title: "Upcoming events",
    sub: () => "Next 7 days",
    isEmpty: (d) => !d.items?.length,
    empty: { title: "No events this week", text: "Events your team serves at show here." },
    render: (d) => <AgendaRows items={d.items} />,
  }),
  listWidget("h-pos", "Positions", 5, {
    sub: (_, ctx) => `Who holds each position in ${deptName(ctx)}`,
    empty: { title: "No positions set up", text: "Add positions to the department to see who holds them." },
  }),
  /* Media pack */
  assetsWidget("m-ast"),
  queueWidget("m-ser", "Sermons", 7, {
    sub: () => "Drafts waiting to be published",
    link: { label: "Open Sermons", to: PATHS.sermons },
    empty: { title: "No drafts waiting", text: "Every sermon has been published." },
  }),
  /* Evangelism pack */
  queueWidget("e-g", "Visitors your team follows up", 5, {
    link: { label: "Open Visitors", to: PATHS.visitors },
    empty: { title: "No visitors to follow up", text: "Every visitor has been followed up." },
  }),
  def<FollowUpSplitData>({
    id: "e-s",
    span: 3,
    title: "Visitor follow-up",
    sub: (d) =>
      d
        ? `${(d as FollowUpSplitData & { visitors?: number }).visitors ??
            (Number(d.followed_up) || 0) + (Number(d.pending) || 0) + (Number(d.not_contacted) || 0)} visitors`
        : undefined,
    render: (d) => (
      <Segments
        parts={[
          { label: "Followed up", value: Number(d.followed_up) || 0, color: GN },
          { label: "Pending", value: Number(d.pending) || 0, color: BZ },
          { label: "Not contacted", value: Number(d.not_contacted) || 0, color: RD },
        ]}
      />
    ),
  }),
  def<StepsData>({
    id: "e-f",
    span: 4,
    title: "Souls won to members",
    sub: () => "Through life centers",
    isEmpty: (d) => !d.steps?.length,
    render: (d) => <FunnelChart steps={d.steps} />,
  }),
  /* Children pack */
  assetsWidget("k-ast"),
  def<ItemsData<AgendaItem>>({
    id: "k-ev",
    span: 7,
    title: "Children’s events",
    sub: () => "Registration for upcoming children’s events",
    isEmpty: (d) => !d.items?.length,
    render: (d) => <AgendaRows items={d.items} />,
  }),
];

const PACK_IDS = new Set(["m-ast", "m-ser", "e-g", "e-s", "e-f", "k-ast", "k-ev"]);

/** Pack widgets carry the pack heading; the view shows it once, above the first. */
export const HOD_WIDGETS: WidgetDef[] = HOD_BASE.map((widget) =>
  PACK_IDS.has(widget.id) ? { ...widget, slot: packSlot } : widget
);
