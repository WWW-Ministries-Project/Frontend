import type {
  AdminDepartmentsData,
  AdminEventsData,
  AssetsSummaryData,
  CommsData,
  LogisticsData,
  PipelineData,
  RagData,
  WorkspacePill,
} from "@/utils/api/workspaces/interfaces";

import { PATHS } from "../queueActions";
import { DataTable, Pipeline, RagGrid, StatGrid, type StatSpec } from "../WidgetCharts";
import { AM, ghs, nf, parseDate, RD, shortDate } from "../wsFormat";
import { def, type WidgetDef } from "../wsTypes";
import { queueWidget } from "./shared";

const REPORT_PILL: Record<string, WorkspacePill> = {
  none: { tone: "danger", label: "Not submitted" },
  draft: { tone: "neutral", label: "Draft" },
  submitted: { tone: "warning", label: "Submitted" },
  approved: { tone: "success", label: "Approved" },
};

const serviceLabel = (value: string | null) => {
  const date = parseDate(value ? `${value}T00:00:00` : null);
  return date
    ? date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : undefined;
};

const dayLabel = (value: string) => {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })
    : value;
};

const isNum = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && !Number.isNaN(Number(value));

export const ADMIN_WIDGETS: WidgetDef[] = [
  queueWidget("a-q", "Waiting on you", 7, {
    sub: () => "Approve, reject or assign without leaving Home",
  }),
  def<RagData>({
    id: "a-rag",
    span: 5,
    title: "Department reports",
    sub: (_, ctx) => (ctx.allBranches ? "Last month by department and branch" : "Last 4 months by department"),
    link: () => ({ label: "Open Department reports", to: PATHS.deptReports }),
    isEmpty: (d) => !d.rows?.length,
    empty: { title: "No department reports yet", text: "Reports show here once departments start submitting." },
    render: (d) => <RagGrid columns={d.columns} rows={d.rows} />,
  }),
  def<PipelineData>({
    id: "a-kan",
    span: 12,
    title: "Requisitions in approval",
    sub: () => "Where every open requisition sits, and how long it has waited",
    link: () => ({ label: "Open Requisitions", to: PATHS.requisitions }),
    isEmpty: (d) => !d.steps?.length,
    render: (d) => (
      <Pipeline
        steps={d.steps.map((step) => ({
          label: step.label,
          count: step.count,
          amount: ghs(step.amount),
          pill: step.overdue
            ? { tone: step.overdue > 1 ? "danger" : "warning", label: `${nf(step.overdue)} overdue` }
            : null,
        }))}
      />
    ),
  }),
  def<AdminEventsData>({
    id: "a-ev",
    span: 7,
    title: "Events",
    sub: () => "Next 14 days, plus reports for last week",
    link: () => ({ label: "Open Events", to: PATHS.events }),
    isEmpty: (d) => !d.rows?.length,
    empty: { title: "No events coming up", text: "Scheduled events for the next 14 days show here." },
    render: (d) => (
      <DataTable
        minWidth={560}
        columns={[
          { label: "Event", width: "minmax(170px,1.6fr)" },
          { label: "Date", width: "80px" },
          { label: "Registered", width: "110px", align: "right" },
          { label: "Event report", width: "130px" },
        ]}
        rows={d.rows.map((row) => [
          { text: row.title, sub: row.past ? "Last week" : undefined, bold: true },
          dayLabel(row.date),
          isNum(row.registered)
            ? isNum(row.capacity)
              ? `${nf(row.registered)} / ${nf(row.capacity)}`
              : nf(row.registered)
            : "No registration",
          row.past && row.report ? { pill: REPORT_PILL[row.report] ?? REPORT_PILL.none } : "—",
        ])}
      />
    ),
  }),
  def<AdminDepartmentsData>({
    id: "a-dep",
    span: 5,
    title: "Departments",
    sub: () => "Members, join requests and heads",
    link: () => ({ label: "Open Departments", to: "/home/membership/departments-and-ministries" }),
    isEmpty: (d) => !d.rows?.length,
    render: (d) => (
      <DataTable
        minWidth={420}
        columns={[
          { label: "Department", width: "minmax(130px,1.4fr)" },
          { label: "Members", width: "70px", align: "right" },
          { label: "Requests", width: "70px", align: "right" },
          { label: "Head", width: "minmax(110px,1fr)" },
        ]}
        rows={d.rows.map((row) => [
          { text: row.name, bold: true },
          nf(row.members),
          row.requests ? { pill: { tone: "info", label: nf(row.requests) } } : "0",
          row.head ? row.head : { pill: { tone: "danger", label: "No head" } },
        ])}
      />
    ),
  }),
  def<AssetsSummaryData>({
    id: "a-ast",
    span: 4,
    title: "Assets",
    link: () => ({ label: "Open Assets", to: PATHS.assets }),
    render: (d) => {
      const due = parseDate(d.stock_check_due);
      const daysLeft = due ? Math.ceil((due.getTime() - Date.now()) / 86_400_000) : null;
      return (
        <StatGrid
          min={110}
          stats={[
            {
              label: "Needs repair",
              value: nf(d.needs_repair),
              sub: d.needs_repair_without_req
                ? `${nf(d.needs_repair_without_req)} without a repair requisition`
                : undefined,
              color: d.needs_repair ? AM : undefined,
              strong: true,
            },
            {
              label: "Lost or stolen",
              value: nf(d.lost),
              sub: d.last_lost_at ? `Reported ${shortDate(d.last_lost_at)}` : undefined,
              color: d.lost ? RD : undefined,
              strong: true,
            },
            {
              label: "Stock check",
              value: due ? `Due ${shortDate(d.stock_check_due)}` : "Not scheduled",
              sub:
                daysLeft !== null
                  ? daysLeft >= 0
                    ? `${nf(daysLeft)} ${daysLeft === 1 ? "day" : "days"} left`
                    : "Overdue"
                  : undefined,
              color: daysLeft !== null && daysLeft < 0 ? RD : undefined,
            },
          ]}
        />
      );
    },
  }),
  def<CommsData>({
    id: "a-com",
    span: 4,
    title: "Communication",
    render: (d) => (
      <StatGrid
        min={110}
        stats={[
          { label: "Messages sent", value: nf(d.sent) },
          { label: "Delivered", value: isNum(d.delivered_pct) ? `${nf(d.delivered_pct)}%` : "—" },
          { label: "Promotions live", value: nf(d.promotions_live) },
        ]}
      />
    ),
  }),
  def<LogisticsData>({
    id: "a-log",
    span: 4,
    title: "Rides and orders",
    sub: (d) => serviceLabel(d?.next_service ?? null),
    render: (d) => {
      const stats: StatSpec[] = [];
      if (isNum(d.ride_requests))
        stats.push({
          label: "Ride requests",
          value: nf(d.ride_requests),
          sub: isNum(d.seats_offered) ? `${nf(d.seats_offered)} seats offered` : undefined,
        });
      if (isNum(d.unmatched))
        stats.push({
          label: "Still need a ride",
          value: nf(d.unmatched),
          sub: d.unmatched ? "No driver yet" : undefined,
          color: d.unmatched ? AM : undefined,
          strong: true,
        });
      if (isNum(d.orders_to_fulfil))
        stats.push({ label: "Orders to fulfil", value: nf(d.orders_to_fulfil), sub: "Marketplace" });
      return stats.length ? (
        <StatGrid min={110} stats={stats} />
      ) : (
        <p className="text-gray-500">Nothing to show for this period.</p>
      );
    },
  }),
];
