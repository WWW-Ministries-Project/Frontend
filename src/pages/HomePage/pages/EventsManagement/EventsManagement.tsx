import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import { cn } from "@/utils/cn";

import EventDetailDrawer from "./Components/EventDetailDrawer";
import { Dot, EmptyBox, PageHeading, Pill, type PillTone, SearchInput, Segmented, UiButton } from "./Components/eventsUi";
import ScheduleEventEditor, { type ScheduleEditorMode } from "./Components/ScheduleEventEditor";
import SeriesScopeModal, { type SeriesScope } from "./Components/SeriesScopeModal";
import { useEventsAccess } from "./utils/useEventsAccess";
import {
  addDays,
  attendanceFor,
  audienceLabel,
  clockLabel,
  coversDay,
  type EventRecord,
  fmtLongDay,
  fmtShortDay,
  lastDayOfMonth,
  MONTHS,
  monthKeyOf,
  monthTitle,
  plural,
  repeatLabel,
  type ScheduledEvent,
  shiftMonth,
  sortBySchedule,
  statusOf,
  TYPE_TABS,
  type TypeFilter,
  todayKey,
  toScheduled,
  typeColor,
  typeLabel,
  WEEKDAYS,
  weekdayOf,
} from "./utils/eventsModel";
import { useHeadcounts } from "./utils/useEventsData";
import useSettingsStore from "../Settings/utils/settingsStore";

type View = "list" | "month";
const VIEW_KEY = "eventsScheduleView_v3";

const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === "month" ? "month" : "list";
  } catch {
    return "list";
  }
};

const STATUS_PILL: Record<string, [string, PillTone]> = {
  live: ["Happening now", "success"],
  ended: ["Ended", "neutral"],
  upcoming: ["Upcoming", "info"],
};

type RowEvent = ScheduledEvent & { status: ReturnType<typeof statusOf> };

const EventsManagement = () => {
  const [params, setParams] = useSearchParams();
  const today = todayKey();
  const access = useEventsAccess();
  const canManageEvents = access.create;
  const { departments, positions } = useSettingsStore((state) => ({
    departments: state.departments,
    positions: state.positions,
  }));

  const month = /^\d{4}-\d{2}$/.test(params.get("month") ?? "") ? String(params.get("month")) : monthKeyOf(today);
  const eventFilter = params.get("event") ?? "";
  const [view, setView] = useState<View>(readView);
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [selDay, setSelDay] = useState(month === monthKeyOf(today) ? today : `${month}-01`);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editor, setEditor] = useState<ScheduleEditorMode | null>(null);
  const [deleteScope, setDeleteScope] = useState<ScheduledEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* private mode */
    }
  }, [view]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const goMonth = (next: string) => {
    setParam("month", next === monthKeyOf(today) ? null : next);
    setSelDay(next === monthKeyOf(today) ? today : `${next}-01`);
  };

  /* --------------------------------- Data --------------------------------- */

  const fetchQuery = useMemo(
    () => ({ month: Number(month.slice(5, 7)), year: Number(month.slice(0, 4)), page: 1, take: 500 }),
    [month]
  );
  const { data, refetch } = useFetch(api.fetch.fetchEvents, fetchQuery);
  const { headcounts } = useHeadcounts();

  const monthEvents = useMemo(() => {
    const list = Array.isArray(data?.data) ? (data!.data as unknown as EventRecord[]) : [];
    return list.map(toScheduled).filter((event) => event.date).sort(sortBySchedule);
  }, [data]);

  const filterName = useMemo(() => {
    if (!eventFilter) return "";
    return monthEvents.find((event) => event.eventNameId === eventFilter)?.name ?? "this event";
  }, [eventFilter, monthEvents]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      monthEvents.filter(
        (event) =>
          (type === "all" || event.type === type) &&
          (!eventFilter || event.eventNameId === eventFilter) &&
          (!q || `${event.name} ${event.location}`.toLowerCase().includes(q))
      ),
    [eventFilter, monthEvents, q, type]
  );

  const isCurrentMonth = month === monthKeyOf(today);
  const hidingPast = isCurrentMonth && !showPast;
  const shown = useMemo(
    () => (hidingPast ? filtered.filter((event) => event.endDate >= today) : filtered),
    [filtered, hidingPast, today]
  );
  const pastCount = filtered.length - shown.length;

  const days = useMemo(() => {
    const groups: { date: string; items: RowEvent[] }[] = [];
    shown.forEach((event) => {
      let group = groups.find((item) => item.date === event.date);
      if (!group) {
        group = { date: event.date, items: [] };
        groups.push(group);
      }
      group.items.push({ ...event, status: statusOf(event) });
    });
    return groups;
  }, [shown]);

  const filtersOn = Boolean(q || type !== "all" || eventFilter);
  const emptyText = filtered.length
    ? "Nothing else this month."
    : filtersOn
      ? "No events match these filters."
      : `Nothing scheduled for ${MONTHS[Number(month.slice(5, 7)) - 1]} yet.`;

  /* -------------------------------- Actions ------------------------------- */

  const openNew = (date?: string) => {
    const fallback = isCurrentMonth ? addDays(today, 1) : `${month}-01`;
    const pick = date && date >= today ? date : fallback;
    setOpenId(null);
    setEditor({ kind: "new", prefill: { date: pick, eventNameId: eventFilter || undefined } });
  };

  const runDelete = async (event: ScheduledEvent, scope: SeriesScope) => {
    const seriesId = event.seriesId;
    if (scope === "this" || !seriesId) {
      await api.delete.deleteEvent({ id: event.id });
    } else if (scope === "following") {
      await api.delete.deleteEventSeriesFrom({ series_id: seriesId, from_date: event.date });
    } else {
      await api.delete.deleteEventSeries({ series_id: seriesId });
    }
    notify.success({
      title: scope === "this" || !seriesId ? "Event deleted" : "Events deleted",
      message:
        scope === "all" && seriesId
          ? `Every date of ${event.name} was removed. Registrations for them were removed too.`
          : scope === "following" && seriesId
            ? `${event.name} was removed from ${fmtShortDay(event.date)} onward.`
            : `${event.name} on ${fmtShortDay(event.date)} was removed.`,
    });
    setOpenId(null);
    await refetch();
  };

  const askDelete = (event: ScheduledEvent) => {
    if (event.seriesId) {
      setDeleteScope(event);
      return;
    }
    confirmAction({
      title: `Delete ${event.name} on ${fmtShortDay(event.date)}?`,
      points: event.registrations
        ? [`${plural(event.registrations, "registration")} will be removed.`, "It disappears from the calendar and member app."]
        : ["It disappears from the calendar and member app."],
      confirmLabel: "Delete event",
      tone: "danger",
      onConfirm: () => runDelete(event, "this"),
    });
  };

  const confirmScopedDelete = async (scope: SeriesScope) => {
    if (!deleteScope) return;
    setDeleting(true);
    try {
      await runDelete(deleteScope, scope);
      setDeleteScope(null);
    } catch (error) {
      notify.fromError(error, { title: "Couldn't delete the event" });
    } finally {
      setDeleting(false);
    }
  };

  const openEvent = monthEvents.find((event) => event.id === openId) ?? null;

  /* -------------------------------- Calendar ------------------------------ */

  const cells = useMemo(() => {
    const first = `${month}-01`;
    const last = lastDayOfMonth(month);
    const lead = weekdayOf(first);
    const list: { key: string; inMonth: boolean; events: ScheduledEvent[] }[] = [];
    for (let index = 0; index < 42; index += 1) {
      const key = addDays(first, index - lead);
      if (index >= 35 && key > last) break;
      if (index % 7 === 0 && key > last) break;
      list.push({
        key,
        inMonth: key >= first && key <= last,
        events: filtered.filter((event) => coversDay(event, key)),
      });
    }
    return list;
  }, [filtered, month]);

  const dayEvents = filtered.filter((event) => coversDay(event, selDay));

  /* --------------------------------- Render ------------------------------- */

  const rowMeta = (event: ScheduledEvent) => {
    const audience = audienceLabel(event.raw, departments, positions);
    const repeat = repeatLabel(event, monthEvents);
    return [
      event.location || "No location",
      event.onlinePlatforms.length ? `Online on ${event.onlinePlatforms.join(", ")}` : "",
      audience,
      repeat,
      event.multiDay ? `Until ${fmtShortDay(event.endDate)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  };

  return (
    <PageOutline className="flex flex-col gap-4">
      <div className="mb-2">
        <PageHeading
          title="Scheduled events"
          subtitle="Every dated gathering on the church calendar. Members see these in the app."
          actions={
            canManageEvents ? (
              <UiButton tone="primary" onClick={() => openNew()}>
                Schedule event
              </UiButton>
            ) : undefined
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => goMonth(shiftMonth(month, -1))}
            className="h-10 w-10 rounded-lg border border-lightGray bg-white text-base text-primary hover:bg-gray-100"
          >
            ‹
          </button>
          <h2 aria-live="polite" className="min-w-[148px] text-center text-xl font-semibold leading-7 text-primary">
            {monthTitle(month)}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => goMonth(shiftMonth(month, 1))}
            className="h-10 w-10 rounded-lg border border-lightGray bg-white text-base text-primary hover:bg-gray-100"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => goMonth(monthKeyOf(today))}
            className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            Today
          </button>
        </div>
        <Segmented
          ariaLabel="View"
          size="lg"
          items={[
            { key: "list", label: "List" },
            { key: "month", label: "Calendar" },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Segmented ariaLabel="Type" items={TYPE_TABS} value={type} onChange={setType} scroll />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search events or places"
          ariaLabel="Search events"
          className="max-w-[340px] flex-[1_1_240px]"
        />
      </div>

      {eventFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2 pl-4 pr-2">
          <span className="flex-1 text-sm font-medium text-blue-700">Showing {filterName} only</span>
          <UiButton size="sm" onClick={() => setParam("event", null)}>
            Show all events
          </UiButton>
        </div>
      )}

      {view === "list" ? (
        <>
          {hidingPast && pastCount > 0 && (
            <button
              type="button"
              onClick={() => setShowPast(true)}
              className="self-start text-sm text-gray-600 underline"
            >
              Show {plural(pastCount, "earlier event")} this month
            </button>
          )}
          {isCurrentMonth && showPast && (
            <button
              type="button"
              onClick={() => setShowPast(false)}
              className="self-start text-sm text-gray-600 underline"
            >
              Hide past events
            </button>
          )}

          {days.map((group) => {
            const tag = group.date === today ? "Today" : group.date === addDays(today, 1) ? "Tomorrow" : "";
            return (
              <div key={group.date} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-primary">{fmtLongDay(group.date)}</h3>
                  {tag && <Pill tone="info">{tag}</Pill>}
                </div>
                <div className="overflow-hidden rounded-xl border border-lightGray bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  {group.items.map((event) => {
                    const attendance = event.status === "ended" ? attendanceFor(event, headcounts) : null;
                    const showReg = event.requiresRegistration && event.status !== "ended";
                    const regWidth = event.capacity
                      ? Math.min(100, (event.registrations / event.capacity) * 100)
                      : 100;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setOpenId(event.id)}
                        className="flex min-h-16 w-full flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 bg-white px-4 py-3 text-left text-sm text-primary last:border-b-0 hover:bg-lightGray/20"
                      >
                        <span className="flex flex-[0_0_76px] flex-col">
                          <span className="font-semibold">{clockLabel(event.start) || "—"}</span>
                          <span className="text-xs text-gray-500">{clockLabel(event.end)}</span>
                        </span>
                        <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <Dot color={typeColor(event.type)} />
                            <span className="font-semibold">{event.name}</span>
                            <span className="text-xs text-gray-500">{typeLabel(event.type)}</span>
                            {event.status === "live" && <Pill tone={STATUS_PILL.live[1]}>{STATUS_PILL.live[0]}</Pill>}
                          </span>
                          <span className="text-xs text-gray-600">{rowMeta(event)}</span>
                        </span>
                        {showReg && (
                          <span className="flex flex-[0_0_140px] flex-col gap-1">
                            <span className="text-xs text-gray-600">
                              {event.capacity
                                ? `${event.registrations} / ${event.capacity} registered`
                                : `${event.registrations} registered`}
                            </span>
                            <span className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                              <span className="block h-full bg-primary" style={{ width: `${regWidth}%` }} />
                            </span>
                          </span>
                        )}
                        {attendance !== null && (
                          <span className="flex-none text-xs text-gray-600">
                            {attendance.toLocaleString()} attended
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {shown.length === 0 && (
            <EmptyBox
              title={emptyText}
              action={
                canManageEvents ? (
                  <UiButton onClick={() => openNew()}>Schedule event</UiButton>
                ) : undefined
              }
            />
          )}
        </>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-lightGray bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-7 bg-lightGray">
              {WEEKDAYS.map((day) => (
                <span key={day} className="p-2 text-center text-xs font-semibold text-primary">
                  <span className="laptop:hidden">{day[0]}</span>
                  <span className="hidden laptop:inline">{day.slice(0, 3)}</span>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {cells.map((cell) => {
                const selected = cell.key === selDay;
                const isToday = cell.key === today;
                return (
                  <div
                    key={cell.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`${fmtLongDay(cell.key)}, ${plural(cell.events.length, "event")}`}
                    aria-pressed={selected}
                    onClick={() => setSelDay(cell.key)}
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                        keyEvent.preventDefault();
                        setSelDay(cell.key);
                      }
                    }}
                    className={cn(
                      "flex min-h-[52px] min-w-0 cursor-pointer flex-col items-stretch gap-0.5 p-1 laptop:min-h-[112px]",
                      selected ? "bg-inputBackground shadow-[inset_0_0_0_1px_#080D2D]" : "bg-white",
                      !cell.inMonth && "opacity-40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 min-w-6 items-center justify-center self-start rounded-full px-1 text-xs font-semibold",
                        isToday ? "bg-primary text-white" : "text-primary"
                      )}
                    >
                      {Number(cell.key.slice(8, 10))}
                    </span>
                    <div className="hidden min-w-0 flex-col gap-0.5 laptop:flex">
                      {cell.events.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setSelDay(cell.key);
                            setOpenId(event.id);
                          }}
                          className="flex min-w-0 items-center gap-1 rounded bg-inputBackground px-1 py-0.5 text-left text-xs text-primary hover:bg-gray-200"
                        >
                          <Dot size={6} color={typeColor(event.type)} />
                          <span className="truncate">
                            {clockLabel(event.start).replace(" ", "").toLowerCase()} {event.name}
                          </span>
                        </button>
                      ))}
                      {cell.events.length > 2 && (
                        <span className="px-1 text-xs text-gray-600">+{cell.events.length - 2} more</span>
                      )}
                    </div>
                    {cell.events.length > 0 && (
                      <span className="flex flex-wrap justify-center gap-0.5 laptop:hidden">
                        {cell.events.slice(0, 4).map((event) => (
                          <Dot key={event.id} size={6} color={typeColor(event.type)} />
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-primary">{fmtLongDay(selDay)}</h3>
              {canManageEvents && <UiButton onClick={() => openNew(selDay)}>+ Add on this day</UiButton>}
            </div>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing scheduled.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-lightGray bg-white">
                {dayEvents.map((event) => {
                  const status = statusOf(event);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setOpenId(event.id)}
                      className="flex w-full items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 text-left text-sm text-primary last:border-b-0 hover:bg-lightGray/20"
                    >
                      <span className="flex-[0_0_76px] font-semibold">{clockLabel(event.start) || "—"}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-2">
                          <Dot color={typeColor(event.type)} />
                          <span className="truncate font-semibold">{event.name}</span>
                        </span>
                        <span className="truncate text-xs text-gray-600">{event.location || "No location"}</span>
                      </span>
                      {status === "live" && <Pill tone="success">Happening now</Pill>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {openEvent && (
        <EventDetailDrawer
          event={openEvent}
          siblings={monthEvents}
          attendance={attendanceFor(openEvent, headcounts)}
          canEdit={access.edit}
          canDelete={access.delete}
          onClose={() => setOpenId(null)}
          onEdit={(event) => {
            setOpenId(null);
            setEditor({ kind: "edit", id: event.id });
          }}
          onDelete={askDelete}
        />
      )}

      {editor && (
        <ScheduleEventEditor
          mode={editor}
          onClose={() => setEditor(null)}
          onSaved={({ date }) => {
            setEditor(null);
            if (date && monthKeyOf(date) !== month) {
              goMonth(monthKeyOf(date));
            } else {
              if (date) setSelDay(date);
              void refetch();
            }
          }}
        />
      )}

      {deleteScope && (
        <SeriesScopeModal
          action="delete"
          eventName={deleteScope.name}
          loading={deleting}
          onCancel={() => setDeleteScope(null)}
          onConfirm={(scope) => void confirmScopedDelete(scope)}
        />
      )}
    </PageOutline>
  );
};

export default EventsManagement;
