import { ReactNode } from "react";

import { cn } from "@/utils/cn";

import { BarItem, ColumnItem, FollowUpItem } from "./chartBuilders";

export const ChartCard = ({
  title,
  sub,
  fullWidth,
  children,
}: {
  title: string;
  sub?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}) => (
  <section
    className={cn(
      "flex min-w-0 flex-col gap-4 rounded-xl border border-lightGray bg-white p-6 shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]",
      fullWidth && "col-span-full"
    )}
  >
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {sub ? <p className="text-sm text-gray-600">{sub}</p> : null}
    </div>
    {children}
  </section>
);

export const ChartNote = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-gray-500">{children}</p>
);

export const HorizontalBarList = ({ items }: { items: BarItem[] }) => {
  if (items.length === 0) return <ChartNote>No data in this view.</ChartNote>;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex justify-between gap-3 text-sm text-primary">
            <span className="min-w-0 break-words">{item.label}</span>
            <span className="whitespace-nowrap font-semibold">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full"
              style={{ width: `${item.width}%`, background: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ColumnChart = ({ items }: { items: ColumnItem[] }) => {
  if (items.length === 0) return <ChartNote>No data in this view.</ChartNote>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-[200px] items-end gap-2 border-b border-gray-200">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-xs font-semibold text-primary">{item.value}</span>
            <div
              title={item.tip}
              className="w-full max-w-[40px] rounded-t bg-primary"
              style={{ height: `${item.height}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xs text-gray-500"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const FollowUpList = ({
  items,
  emptyText = "Nothing to follow up right now.",
}: {
  items: FollowUpItem[];
  emptyText?: string;
}) => (
  <div className="flex flex-col">
    {items.map((item) => (
      <button
        key={item.key}
        type="button"
        onClick={item.onClick}
        className="flex items-center justify-between gap-3 border-b border-gray-200 bg-transparent py-3 text-left text-primary transition-colors hover:bg-lightGray/20"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">{item.label}</span>
          <span className="text-xs text-gray-500">{item.sub}</span>
        </span>
        <span className="whitespace-nowrap text-sm text-gray-600">View →</span>
      </button>
    ))}
    {items.length === 0 && <ChartNote>{emptyText}</ChartNote>}
  </div>
);
