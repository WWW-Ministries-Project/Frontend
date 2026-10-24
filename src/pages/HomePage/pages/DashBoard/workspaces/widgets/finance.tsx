import type {
  MarketData,
  PledgesData,
  RowsData,
  WeeklyRecordsData,
} from "@/utils/api/workspaces/interfaces";

import { PATHS } from "../queueActions";
import { DataTable, HBarList, StatGrid } from "../WidgetCharts";
import { pairSheet } from "../wsExport";
import { AM, barRows, BZ, ghs, GN, nf, RD, statusPill } from "../wsFormat";
import { def, type WidgetCtx, type WidgetDef } from "../wsTypes";
import { kpiWidget, queueWidget } from "./shared";

const barWidget = (
  id: string,
  title: string,
  span: number,
  opts: {
    sub?: (ctx: WidgetCtx) => string;
    color?: string;
    link?: { label: string; to: string };
  } = {}
): WidgetDef =>
  def<RowsData>({
    id,
    span,
    title,
    sub: (_, ctx) => opts.sub?.(ctx),
    link: opts.link ? () => opts.link ?? null : undefined,
    isEmpty: (d) => !d.rows?.length,
    render: (d) => <HBarList rows={barRows(d.rows)} money color={opts.color} />,
    exportSheet: (d) =>
      pairSheet(
        title,
        d.rows.map((row) => ({ label: row.label, value: Math.round(Number(row.value) || 0), note: row.sub ?? "" })),
        "GH₵"
      ),
  });

const scope = (ctx: WidgetCtx) => ctx.range?.label ?? "";

export const FINANCE_WIDGETS: WidgetDef[] = [
  kpiWidget("f-kpi", 200),
  queueWidget("f-q", "Waiting on finance", 8, { exportable: true }),
  def<WeeklyRecordsData>({
    id: "f-wkt",
    span: 4,
    title: "Weekly records",
    sub: () => "Recent weeks by branch",
    link: () => ({ label: "Open Finance Manager", to: PATHS.finance }),
    isEmpty: (d) => !d.rows?.length,
    render: (d) => (
      <DataTable
        minWidth={280}
        columns={[
          { label: "Week", width: "minmax(120px,1.3fr)" },
          { label: "Status", width: "140px" },
        ]}
        rows={d.rows.map((row) => [
          { text: row.week_label, sub: row.branch_name, bold: true },
          { pill: statusPill(row.status) },
        ])}
      />
    ),
    exportSheet: (d) => ({
      name: "Weekly records",
      columns: [
        { header: "Week", key: "week", width: 16 },
        { header: "Branch", key: "branch", width: 24 },
        { header: "Status", key: "status", width: 18 },
      ],
      rows: d.rows.map((row) => ({ week: row.week_label, branch: row.branch_name, status: statusPill(row.status).label })),
    }),
  }),
  barWidget("f-opt", "Giving by option", 6, { sub: scope }),
  { ...barWidget("f-br", "Giving by branch", 6, { sub: () => "Giving per attendee under each branch", color: BZ }), hideIfEmpty: true },
  barWidget("f-ch", "Online giving by method", 6, {
    sub: () => "This branch only. Switch to All branches to compare branches.",
    color: BZ,
  }),
  barWidget("f-rqd", "Approved requisitions by department", 7, {
    sub: (ctx) => `Value approved, ${(ctx.range?.label ?? "this period").toLowerCase()}`,
    link: { label: "Open Requisition analytics", to: PATHS.requisitionAnalytics },
  }),
  def<PledgesData>({
    id: "f-pl",
    span: 5,
    title: "Pledges",
    link: (d) =>
      d.overdue_count
        ? { label: `View ${nf(d.overdue_count)} overdue ${d.overdue_count === 1 ? "pledge" : "pledges"}`, to: PATHS.pledges }
        : { label: "Open Pledges", to: PATHS.pledges },
    render: (d) => (
      <div className="flex flex-col gap-4">
        <StatGrid
          min={110}
          stats={[
            { label: "Pledged", value: ghs(d.pledged) },
            {
              label: "Paid",
              value: ghs(d.paid),
              sub: d.pledged ? `${Math.round(((Number(d.paid) || 0) / d.pledged) * 100)}%` : undefined,
            },
            {
              label: "Overdue",
              value: nf(d.overdue_count),
              sub: d.overdue_amount ? ghs(d.overdue_amount) : undefined,
              color: d.overdue_count ? RD : undefined,
              strong: true,
            },
          ]}
        />
        {d.campaigns?.length ? (
          <HBarList
            rows={d.campaigns.map((row) => {
              const share = row.max ? (Number(row.value) || 0) / row.max : 0;
              return {
                label: row.label,
                value: Number(row.value) || 0,
                max: row.max ?? null,
                sub: row.sub ?? (row.max ? `${ghs(row.value)} of ${ghs(row.max)}` : null),
                display: row.max ? `${Math.round(share * 100)}%` : ghs(row.value),
                color: share >= 0.75 ? GN : share < 0.5 ? AM : undefined,
              };
            })}
          />
        ) : null}
      </div>
    ),
    exportSheet: (d) => [
      pairSheet("Pledges", [
        { label: "Pledged", value: Math.round(Number(d.pledged) || 0) },
        { label: "Paid", value: Math.round(Number(d.paid) || 0) },
        { label: "Overdue pledges", value: d.overdue_count },
        { label: "Overdue amount", value: Math.round(Number(d.overdue_amount) || 0) },
      ]),
      {
        name: "Pledge campaigns",
        columns: [
          { header: "Campaign", key: "label", width: 32 },
          { header: "Paid (GH₵)", key: "value", width: 14 },
          { header: "Target (GH₵)", key: "max", width: 14 },
          { header: "Note", key: "sub", width: 32 },
        ],
        rows: (d.campaigns ?? []).map((row) => ({
          label: row.label,
          value: Math.round(Number(row.value) || 0),
          max: row.max ?? "",
          sub: row.sub ?? "",
        })),
      },
    ],
  }),
  def<MarketData>({
    id: "f-mkt",
    span: 12,
    title: "Marketplace",
    sub: (_, ctx) => scope(ctx),
    render: (d) => (
      <StatGrid
        min={150}
        stats={[
          { label: "Revenue", value: ghs(d.revenue) },
          { label: "Orders", value: nf(d.orders) },
          {
            label: "Unpaid orders",
            value: nf(d.unpaid_orders),
            sub: d.unpaid_amount ? `${ghs(d.unpaid_amount)} outstanding` : undefined,
            color: d.unpaid_orders ? AM : undefined,
            strong: true,
          },
          { label: "Awaiting collection", value: nf(d.awaiting_collection) },
        ]}
      />
    ),
    exportSheet: (d) =>
      pairSheet("Marketplace", [
        { label: "Revenue (GH₵)", value: Math.round(Number(d.revenue) || 0) },
        { label: "Orders", value: d.orders },
        { label: "Unpaid orders", value: d.unpaid_orders },
        { label: "Unpaid amount (GH₵)", value: Math.round(Number(d.unpaid_amount) || 0) },
        { label: "Awaiting collection", value: d.awaiting_collection },
      ]),
  }),
];
