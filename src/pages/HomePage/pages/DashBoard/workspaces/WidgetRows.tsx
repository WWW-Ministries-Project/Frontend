import { ReactNode } from "react";

import { Pill, UiButton } from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import type {
  AgendaItem,
  ListItem,
  QueueItem,
  WorkspacePill,
} from "@/utils/api/workspaces/interfaces";
import { cn } from "@/utils/cn";

import { actionsFor, KIND_META } from "./queueActions";
import { agendaParts, BZ, ghs, initials } from "./wsFormat";
import { Ring } from "./WidgetCharts";
import type { BtnSpec, WidgetCtx } from "./wsTypes";

/* ---------------------------------- Lists --------------------------------- */

export const ListRows = ({
  items,
  avatar,
  action,
}: {
  items: ListItem[];
  /** Fixed avatar text (e.g. "RQ"); defaults to initials of the title. */
  avatar?: string | ((item: ListItem) => string);
  action?: (item: ListItem) => ReactNode;
}) => (
  <div className="flex flex-col">
    {items.map((item, i) => (
      <div key={`${item.title}-${i}`} className="flex items-center gap-3 border-b border-gray-200 py-3 last:border-b-0">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-inputBackground text-xs font-semibold"
        >
          {typeof avatar === "function" ? avatar(item) : avatar ?? initials(item.title)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words font-medium">{item.title}</p>
          {item.sub ? <p className="text-xs text-gray-500">{item.sub}</p> : null}
        </div>
        {item.pill ? <PillOf pill={item.pill} /> : null}
        {item.right ? <span className="flex-shrink-0 whitespace-nowrap font-semibold">{item.right}</span> : null}
        {action?.(item)}
      </div>
    ))}
  </div>
);

export const PillOf = ({ pill }: { pill: WorkspacePill }) => (
  <span className="flex-shrink-0">
    <Pill tone={pill.tone}>{pill.label}</Pill>
  </span>
);

export const AgendaRows = <T extends AgendaItem>({
  items,
  action,
}: {
  items: T[];
  action?: (item: T) => ReactNode;
}) => (
  <div className="flex flex-col">
    {items.map((item, i) => {
      const parts = agendaParts(item.date);
      return (
        <div key={`${item.title}-${i}`} className="flex items-center gap-3 border-b border-gray-200 py-3 last:border-b-0">
          <div className="flex min-h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-gray-200 bg-inputBackground">
            <span className="text-xs font-semibold text-gray-500">{parts.top}</span>
            <span className="text-lg font-semibold leading-6">{parts.main}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="break-words font-medium">{item.title}</p>
            <p className="text-xs text-gray-500">{item.sub}</p>
          </div>
          {item.pill ? <span className="hidden sm:inline"><PillOf pill={item.pill} /></span> : null}
          {action?.(item)}
        </div>
      );
    })}
  </div>
);

/* ---------------------------------- Queue --------------------------------- */

const BTN_TONE = { primary: "primary", secondary: "secondary", danger: "danger" } as const;

export const QueueRows = ({
  widgetId,
  items,
  ctx,
}: {
  widgetId: string;
  items: QueueItem[];
  ctx: WidgetCtx;
}) => {
  const live = items.filter((item) => !ctx.isDone(item));
  const tab = ctx.tabOf(widgetId, "all");
  const shown = live.filter((item) => tab === "all" || item.kind === tab);
  return (
    <div className="flex flex-col">
      {shown.map((item) => {
        const busy = ctx.busyItem === item.id;
        return (
          <div key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-200 py-3">
            <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
              <p className="break-words font-medium">{item.title}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
            {item.amount !== null && item.amount !== undefined ? (
              <span className="whitespace-nowrap font-semibold">{ghs(item.amount)}</span>
            ) : null}
            {item.pill ? <PillOf pill={item.pill} /> : null}
            <div className="flex flex-wrap gap-2">
              <UiButton
                tone="ghost"
                className="text-primary underline underline-offset-[3px]"
                onClick={() => ctx.openItem(widgetId, item)}
              >
                View
              </UiButton>
              {actionsFor(item).map((action) => (
                <UiButton
                  key={action.key}
                  tone={BTN_TONE[action.tone]}
                  disabled={busy}
                  onClick={() =>
                    action.input || action.to
                      ? action.to
                        ? ctx.go(action.to(item))
                        : ctx.openItem(widgetId, item, action.key)
                      : ctx.runAction(widgetId, item, action.key)
                  }
                >
                  {action.label}
                </UiButton>
              ))}
            </div>
          </div>
        );
      })}
      {shown.length === 0 && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-4 font-medium text-green-700">✓ All clear here.</p>
      )}
    </div>
  );
};

/** "All 6 · Requisitions 2 · …" tabs, only when the queue mixes kinds. */
export const QueueTabs = ({
  widgetId,
  items,
  ctx,
}: {
  widgetId: string;
  items: QueueItem[];
  ctx: WidgetCtx;
}) => {
  const live = items.filter((item) => !ctx.isDone(item));
  const kinds = Array.from(new Set(items.map((item) => item.kind)));
  if (kinds.length < 2) return null;
  const tabs = [{ key: "all", label: "All", n: live.length }].concat(
    kinds.map((kind) => ({
      key: kind,
      label: KIND_META[kind].tab,
      n: live.filter((item) => item.kind === kind).length,
    }))
  );
  return <MiniTabs label="Queue view" value={ctx.tabOf(widgetId, "all")} onChange={(v) => ctx.setTab(widgetId, v)} tabs={tabs} />;
};

/** Small pill tabs for card headers. */
export const MiniTabs = ({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { key: string; label: string; n?: number }[];
  value: string;
  onChange: (key: string) => void;
  label: string;
}) => (
  <div role="tablist" aria-label={label} className="flex max-w-full flex-wrap gap-1 rounded-lg border border-lightGray bg-lightGray/30 p-1">
    {tabs.map((tab) => {
      const on = tab.key === value;
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={on}
          onClick={() => onChange(tab.key)}
          className={cn(
            "whitespace-nowrap rounded-lg px-2.5 py-1 text-xs text-primary transition-colors",
            on ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "bg-transparent hover:bg-white/70"
          )}
        >
          {tab.label}
          {tab.n !== undefined ? ` ${tab.n}` : ""}
        </button>
      );
    })}
  </div>
);

/* ------------------------------ Misc. blocks ------------------------------ */

export const ButtonRow = ({ btns, go }: { btns: BtnSpec[]; go: (to: string) => void }) => (
  <div className="mt-auto flex flex-wrap gap-2">
    {btns.map((btn) => (
      <UiButton
        key={btn.label}
        tone={btn.tone}
        disabled={btn.disabled}
        className="flex-auto"
        onClick={() => (btn.onClick ? btn.onClick() : btn.to ? go(btn.to) : undefined)}
      >
        {btn.label}
      </UiButton>
    ))}
  </div>
);

export const ProfileNudge = ({ pct, missing }: { pct: number; missing: string[] }) => {
  const done = pct >= 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Ring value={pct} color={done ? "rgb(var(--color-green-700))" : BZ} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-2xl font-semibold leading-8">{Math.round(pct)}%</span>
          <span className="text-gray-600">
            {done ? "Complete. Thank you." : `${missing.length} ${missing.length === 1 ? "detail" : "details"} left to add`}
          </span>
        </div>
      </div>
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {missing.map((item) => (
            <span key={item} className="rounded-full border border-lightGray bg-inputBackground px-2.5 py-0.5 text-xs font-semibold text-gray-600">
              + {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const MediaBlock = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) => (
  <div className="flex min-h-[120px] items-center gap-4 rounded-lg bg-primary p-5 text-white">
    <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-primary">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-[0.04em] text-white/70">{eyebrow}</span>
      <span className="break-words text-lg font-semibold leading-7">{title}</span>
      <span className="text-white/80">{sub}</span>
    </div>
  </div>
);

export interface CtaSpec {
  title: string;
  sub: string;
  icon: string;
  to: string;
  solid?: boolean;
}

export const CtaGrid = ({ ctas, go }: { ctas: CtaSpec[]; go: (to: string) => void }) => (
  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]">
    {ctas.map((cta) => (
      <button
        key={cta.title}
        type="button"
        onClick={() => go(cta.to)}
        className={cn(
          "flex min-h-[120px] flex-col gap-3 rounded-xl border border-lightGray p-4 text-left text-sm transition-shadow hover:shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]",
          cta.solid ? "bg-primary text-white" : "bg-white text-primary"
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            cta.solid ? "bg-white text-primary" : "bg-inputBackground text-primary"
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={cta.icon} />
          </svg>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-base font-semibold leading-6">{cta.title}</span>
          <span className="text-xs opacity-80">{cta.sub}</span>
        </span>
      </button>
    ))}
  </div>
);

