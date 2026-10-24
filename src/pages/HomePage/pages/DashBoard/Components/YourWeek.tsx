import { addDays, sameDay, startOfDay } from "../utils/homeUtils";

export type WeekItemKind = "church" | "appt" | "som";

export type WeekItem = {
  key: string;
  kind: WeekItemKind;
  title: string;
  /** "09:00" */
  time: string;
  date: Date;
};

const KIND: Record<WeekItemKind, { label: string; color: string; bg: string }> = {
  church: { label: "Church", color: "#1C64F2", bg: "#EBF5FF" },
  appt: { label: "Appointment", color: "#0E9F6E", bg: "#F3FAF7" },
  som: { label: "School of Ministry", color: "#9061F9", bg: "#F5F3FF" },
};

export const YourWeek = ({ items, showSchool }: { items: WeekItem[]; showSchool: boolean }) => {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const legend = (Object.keys(KIND) as WeekItemKind[]).filter((k) => k !== "som" || showSchool);

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-[clamp(16px,2.5vw,24px)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold leading-7 text-primary">Your week</h3>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          {legend.map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: KIND[k].color }} />
              {KIND[k].label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid snap-x snap-mandatory grid-cols-[repeat(7,minmax(120px,1fr))] gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {days.map((day, i) => {
          const isToday = i === 0;
          const dayItems = items
            .filter((it) => sameDay(it.date, day))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
          return (
            <div
              key={day.toISOString()}
              className="flex min-h-[132px] snap-start flex-col gap-2 rounded-[10px] border p-2.5"
              style={{
                borderColor: isToday ? "rgb(var(--color-primary))" : "rgb(var(--color-gray-200))",
                background: isToday ? "rgb(var(--color-gray-50))" : "rgb(var(--color-white))",
              }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.04em] text-gray-500">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: isToday ? "rgb(var(--color-primary))" : "rgb(var(--color-gray-700))" }}
                >
                  {day.getDate()}
                </span>
              </div>
              {dayItems.map((it) => (
                <div
                  key={it.key}
                  className="flex flex-col gap-0.5 rounded-md border-l-[3px] px-2 py-1.5"
                  style={{ background: KIND[it.kind].bg, borderLeftColor: KIND[it.kind].color }}
                >
                  <span className="text-xs font-semibold leading-4 text-gray-900">{it.title}</span>
                  {it.time && <span className="text-[11px] text-gray-600">{it.time}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
};
