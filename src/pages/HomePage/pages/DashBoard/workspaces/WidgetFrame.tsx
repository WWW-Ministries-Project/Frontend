import { UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import type { WidgetResult } from "@/utils/api/workspaces/interfaces";
import { cn } from "@/utils/cn";

import { KpiSkeleton } from "./WidgetCharts";
import { ButtonRow } from "./WidgetRows";
import { titleOf, widgetState, type WidgetCtx, type WidgetDef } from "./wsTypes";

const Skeleton = ({ height = 80 }: { height?: number }) => (
  <div aria-busy="true" className="flex flex-col gap-3">
    <span className="h-4 w-full animate-pulse rounded bg-gray-100" />
    <span className="h-4 w-[85%] animate-pulse rounded bg-gray-100" />
    <span className="h-4 w-[70%] animate-pulse rounded bg-gray-100" />
    <span className="w-[90%] animate-pulse rounded-lg bg-gray-100" style={{ height }} />
  </div>
);

const EmptyState = ({ title, text }: { title: string; text: string }) => (
  <div className="flex flex-col items-center gap-2 px-2 py-6 text-center">
    <span
      aria-hidden="true"
      className="flex h-12 w-12 items-center justify-center rounded-full border border-lightGray bg-inputBackground text-xl text-gray-500"
    >
      ○
    </span>
    <p className="font-medium text-primary">{title}</p>
    <p className="text-xs text-gray-500">{text}</p>
  </div>
);

const ErrorState = ({ name, onRetry }: { name: string; onRetry: () => void }) => (
  <div role="alert" className="flex flex-col items-center gap-2 px-2 py-6 text-center">
    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 font-semibold text-red-700">
      !
    </span>
    <p className="font-medium text-primary">Couldn’t load {name}</p>
    <p className="text-xs text-gray-500">The rest of your workspace is fine. Try again in a moment.</p>
    <UiButton tone="secondary" onClick={onRetry}>
      Retry
    </UiButton>
  </div>
);

export const WidgetFrame = ({
  widget,
  result,
  loading,
  ctx,
  gridColumn,
  highlighted,
  onExport,
}: {
  widget: WidgetDef;
  result: WidgetResult | undefined;
  loading: boolean;
  ctx: WidgetCtx;
  gridColumn: string;
  highlighted: boolean;
  onExport?: () => void;
}) => {
  const state = widgetState(widget, result, loading, ctx);
  const data = result && result.ok ? result.data : undefined;
  const title = titleOf(widget, ctx);
  const domId = `ws-${widget.id}`;
  const ring = highlighted ? "shadow-[0_0_0_4px_rgb(var(--color-primary)_/_0.15)]" : "";

  if (widget.kind === "kpis") {
    return (
      <div id={domId} className={cn("col-span-full rounded-xl transition-shadow duration-300", ring)} style={{ gridColumn: "1 / -1" }}>
        {state === "loading" ? (
          <KpiSkeleton />
        ) : state === "error" ? (
          <div className="rounded-xl border border-lightGray bg-white">
            <ErrorState name="key figures" onRetry={ctx.refetch} />
          </div>
        ) : state === "empty" ? null : (
          widget.render(data, ctx)
        )}
      </div>
    );
  }

  if (widget.kind === "hero") {
    return (
      <section
        id={domId}
        aria-label={title}
        className={cn("flex min-h-full min-w-0 flex-col gap-4 rounded-xl border border-primary bg-primary p-6 text-white transition-shadow duration-300", ring)}
        style={{ gridColumn }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-[0.04em] text-white/80">{title}</span>
          <span className="rounded-full border border-white/30 px-2.5 py-0.5 text-xs font-semibold text-white">
            Written by AI from live data
          </span>
        </div>
        {state === "loading" ? (
          <div className="flex flex-col gap-2.5">
            {[90, 80, 60].map((w) => (
              <span key={w} className="h-4 animate-pulse rounded bg-white/10" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : state === "error" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base text-white">Couldn’t load the summary.</p>
            <UiButton tone="secondary" className="border-white/40 bg-transparent text-white hover:bg-white/10" onClick={ctx.refetch}>
              Retry
            </UiButton>
          </div>
        ) : (
          widget.render(data, ctx)
        )}
      </section>
    );
  }

  const ready = state === "ready";
  const sub = widget.sub?.(data, ctx);
  const count = ready && widget.count ? widget.count(data, ctx) : null;
  const link = ready && widget.link ? widget.link(data, ctx) : null;
  const btns = ready && widget.btns ? widget.btns(data, ctx) : [];

  return (
    <section
      id={domId}
      aria-label={title}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-4 transition-shadow duration-300 sm:p-5",
        ring
      )}
      style={{ gridColumn }}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-[1_1_180px]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold leading-6 text-primary">{title}</h2>
            {count !== null && count !== undefined ? (
              <span className="rounded-full border border-lightGray bg-inputBackground px-2 text-xs font-semibold text-gray-600">
                {count}
              </span>
            ) : null}
          </div>
          {sub ? <p className="text-sm text-gray-600">{sub}</p> : null}
        </div>
        {(ready && widget.aside) || (onExport && ready) ? (
          <div className="flex flex-wrap items-center gap-2">
            {ready && widget.aside ? widget.aside(data, ctx) : null}
            {onExport && ready ? (
              <UiButton tone="secondary" size="sm" className="border-lightGray" onClick={onExport}>
                Export
              </UiButton>
            ) : null}
          </div>
        ) : null}
      </div>

      {state === "loading" && <Skeleton height={widget.skeleton} />}
      {state === "empty" && (
        <EmptyState
          title={widget.empty?.title ?? `Nothing here for ${(ctx.range?.label ?? "this period").toLowerCase()}`}
          text={widget.empty?.text ?? "It will fill in as activity is recorded."}
        />
      )}
      {state === "error" && <ErrorState name={title.toLowerCase()} onRetry={ctx.refetch} />}
      {ready && (
        <>
          {widget.render(data, ctx)}
          {btns.length > 0 && <ButtonRow btns={btns} go={ctx.go} />}
          {link ? (
            <button
              type="button"
              onClick={() => ctx.go(link.to)}
              className="self-start bg-transparent p-0 text-sm font-medium text-primary underline underline-offset-[3px]"
            >
              {link.label} →
            </button>
          ) : null}
        </>
      )}
    </section>
  );
};

/** Department pack heading spanning the grid. */
export const SlotHeading = ({ title, sub, tag }: { title: string; sub: string; tag?: string }) => (
  <div className="flex flex-col gap-1 border-t border-lightGray pt-6" style={{ gridColumn: "1 / -1" }}>
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-xl font-semibold leading-7 text-primary">{title}</h2>
      {tag ? (
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{tag}</span>
      ) : null}
    </div>
    <p className="text-gray-600">{sub}</p>
  </div>
);
