import type {
  ItemsData,
  KpisData,
  ListItem,
  QueueData,
  QueueItem,
} from "@/utils/api/workspaces/interfaces";

import { KpiRow } from "../WidgetCharts";
import { ListRows, QueueRows, QueueTabs } from "../WidgetRows";
import { pairSheet, type ExportSheet } from "../wsExport";
import { ghs, kpiDelta, kpiValue } from "../wsFormat";
import { def, queueCount, type WidgetCtx, type WidgetDef } from "../wsTypes";

/* Widget builders shared by several workspaces. */

export const kpiWidget = (id: string, min = 190): WidgetDef =>
  def<KpisData>({
    id,
    kind: "kpis",
    span: 12,
    title: "Key figures",
    isEmpty: (d) => !d.kpis?.length,
    render: (d, ctx) => <KpiRow kpis={d.kpis} vsLabel={ctx.range?.compare_label} min={min} />,
    exportSheet: (d) =>
      pairSheet(
        "Key figures",
        d.kpis.map((k) => ({ label: k.label, value: kpiValue(k), note: kpiDelta(k)?.text ?? "" }))
      ),
  });

export const queueSheet = (title: string, items: QueueItem[], ctx: WidgetCtx): ExportSheet => ({
  name: title,
  columns: [
    { header: "Item", key: "title", width: 36 },
    { header: "Details", key: "sub", width: 44 },
    { header: "Amount", key: "amount", width: 16 },
    { header: "Status", key: "status", width: 18 },
  ],
  rows: items
    .filter((item) => !ctx.isDone(item))
    .map((item) => ({
      title: item.title,
      sub: item.sub,
      amount: item.amount === null || item.amount === undefined ? "" : ghs(item.amount),
      status: item.pill?.label ?? "",
    })),
});

export const queueWidget = (
  id: string,
  title: string,
  span: number,
  opts: {
    sub?: (d: QueueData | undefined, ctx: WidgetCtx) => string | undefined;
    link?: { label: string; to: string };
    exportable?: boolean;
    empty?: { title: string; text: string };
  } = {}
): WidgetDef =>
  def<QueueData>({
    id,
    span,
    title,
    sub: opts.sub,
    count: (d, ctx) => queueCount(d.items ?? [], ctx),
    aside: (d, ctx) => <QueueTabs widgetId={id} items={d.items ?? []} ctx={ctx} />,
    link: opts.link ? () => opts.link ?? null : undefined,
    empty: opts.empty ?? { title: "Nothing waiting on you", text: "New items appear here as they reach your step." },
    isEmpty: (d) => !d.items?.length,
    render: (d, ctx) => <QueueRows widgetId={id} items={d.items ?? []} ctx={ctx} />,
    exportSheet: opts.exportable ? (d, ctx) => queueSheet(title, d.items ?? [], ctx) : undefined,
  });

export const listWidget = (
  id: string,
  title: string,
  span: number,
  opts: {
    sub?: (d: ItemsData | undefined, ctx: WidgetCtx) => string | undefined;
    link?: { label: string; to: string };
    avatar?: string;
    empty?: { title: string; text: string };
    btns?: WidgetDef<ItemsData>["btns"];
  } = {}
): WidgetDef =>
  def<ItemsData>({
    id,
    span,
    title,
    sub: opts.sub,
    link: opts.link ? () => opts.link ?? null : undefined,
    btns: opts.btns,
    empty: opts.empty,
    isEmpty: (d) => !d.items?.length,
    render: (d) => <ListRows items={d.items as ListItem[]} avatar={opts.avatar} />,
  });
