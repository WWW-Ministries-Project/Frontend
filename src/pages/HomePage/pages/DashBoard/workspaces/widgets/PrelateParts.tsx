import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import type { AttendanceData, HeroData } from "@/utils/api/workspaces/interfaces";

import { PATHS } from "../queueActions";
import { BarsChart } from "../WidgetCharts";
import { MiniTabs } from "../WidgetRows";
import { BZ, NV, SERIES } from "../wsFormat";
import type { WidgetCtx } from "../wsTypes";

const movingAverage = (values: number[]) =>
  values.map((_, i) => {
    const window = values.slice(Math.max(0, i - 3), i + 1);
    return Math.round(window.reduce((sum, v) => sum + v, 0) / window.length);
  });

/** Hero body: the written summary plus the annual theme footer. */
export const HeroBody = ({ data, ctx }: { data: HeroData | undefined; ctx: WidgetCtx }) => (
  <>
    {data?.lines?.length ? (
      <div className="flex flex-col gap-3">
        {data.lines.map((line, i) => (
          <p key={i} className="text-base leading-6 text-white">
            {line}
          </p>
        ))}
      </div>
    ) : (
      <p className="text-base leading-6 text-white/80">
        Not enough activity yet to write a summary for this period.
      </p>
    )}
    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-white/20 pt-4">
      <div className="flex min-w-0 flex-col gap-1">
        {data?.theme ? (
          <>
            <span className="text-xs font-semibold uppercase tracking-[0.04em] text-white/70">Annual theme</span>
            <span className="break-words text-xl font-semibold leading-7 text-white">{data.theme}</span>
          </>
        ) : null}
        {data?.verse ? <span className="text-white/80">{data.verse}</span> : null}
      </div>
      <UiButton
        tone="secondary"
        className="border-white bg-white text-primary hover:bg-white/90"
        onClick={() => ctx.go(PATHS.executiveSummary)}
      >
        Open executive summary
      </UiButton>
    </div>
  </>
);

export const AttendanceAside = ({ data, ctx }: { data: AttendanceData; ctx: WidgetCtx }) => (
  <div className="flex flex-wrap items-center gap-2">
    {data.events?.length ? (
      <select
        aria-label="Scheduled event"
        value={ctx.attEvent}
        onChange={(event) => ctx.setAttEvent(event.target.value)}
        className="h-9 max-w-[220px] rounded-lg border border-lightGray bg-white px-2.5 text-sm text-primary"
      >
        <option value="">All scheduled events</option>
        {data.events.map((event) => (
          <option key={event.id} value={String(event.id)}>
            {event.name}
          </option>
        ))}
      </select>
    ) : null}
    {ctx.allBranches && data.points?.some((p) => p.by_branch?.length) ? (
      <MiniTabs
        label="Attendance view"
        value={ctx.tabOf("p-att", "all")}
        onChange={(v) => ctx.setTab("p-att", v)}
        tabs={[
          { key: "all", label: "Combined" },
          { key: "br", label: "By branch" },
        ]}
      />
    ) : null}
  </div>
);

export const AttendanceChart = ({ data, ctx }: { data: AttendanceData; ctx: WidgetCtx }) => {
  const labels = data.points.map((p) => p.label);
  if (ctx.allBranches && ctx.tabOf("p-att", "all") === "br") {
    const branches = new Map<number, string>();
    data.points.forEach((p) => p.by_branch?.forEach((b) => branches.set(b.branch_id, b.branch_name)));
    const series = Array.from(branches.entries()).map(([id, name], i) => ({
      name,
      color: SERIES[i % SERIES.length],
      values: data.points.map((p) => p.by_branch?.find((b) => b.branch_id === id)?.value ?? 0),
    }));
    return <BarsChart labels={labels} series={series} />;
  }
  const totals = data.points.map((p) => Number(p.total) || 0);
  return (
    <BarsChart
      labels={labels}
      series={[{ name: "Attendance", color: NV, values: totals }]}
      line={{ name: "4-week average", color: BZ, values: movingAverage(totals) }}
    />
  );
};
