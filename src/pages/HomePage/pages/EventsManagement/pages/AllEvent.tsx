import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { notify } from "@/components/feedback";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { confirmAction } from "@/pages/HomePage/utils/helperFunctions";
import { api } from "@/utils/api/apiCalls";
import type { EventType } from "@/utils/api/events/interfaces";

import EventCatalogueDialog from "../Components/EventCatalogueDialog";
import { Dot, PageHeading, SearchInput, Segmented, UiButton } from "../Components/eventsUi";
import ScheduleEventEditor, { type SchedulePrefill } from "../Components/ScheduleEventEditor";
import {
  clockLabel,
  EVENTS_PATHS,
  type EventRecord,
  fmtShortDay,
  monthKeyOf,
  nextWeekday,
  normalizeType,
  plural,
  type ScheduledEvent,
  sortBySchedule,
  TYPE_TABS,
  type TypeFilter,
  todayKey,
  toScheduled,
  typeColor,
  typeLabel,
  WEEKDAYS,
} from "../utils/eventsModel";

const scheduleText = (item: EventType) => {
  if (item.event_category === "WEEKLY" && typeof item.schedule_day === "number") {
    const times =
      item.schedule_start_time && item.schedule_end_time
        ? ` · ${clockLabel(item.schedule_start_time)} – ${clockLabel(item.schedule_end_time)}`
        : "";
    return `${WEEKDAYS[item.schedule_day]}s${times}`;
  }
  return "Scheduled as needed";
};

const AllEvent = () => {
  const navigate = useNavigate();
  const { canManage } = useAccessControl();
  const canManageEvents = canManage("Events");

  const { data, refetch } = useFetch(api.fetch.fetchAllUniqueEvents);
  const { data: upcomingData, refetch: refetchUpcoming } = useFetch(
    api.fetch.fetchUpcomingEvents,
    undefined,
    false,
    { silent: true }
  );

  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ event: EventType | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<SchedulePrefill | null>(null);

  const catalogue = useMemo(() => (Array.isArray(data?.data) ? (data!.data as EventType[]) : []), [data]);

  const upcomingByEvent = useMemo(() => {
    const today = todayKey();
    const map = new Map<string, ScheduledEvent[]>();
    const list = Array.isArray(upcomingData?.data) ? (upcomingData!.data as unknown as EventRecord[]) : [];
    list
      .map(toScheduled)
      .filter((event) => event.endDate >= today)
      .sort(sortBySchedule)
      .forEach((event) => {
        const key = event.eventNameId;
        map.set(key, [...(map.get(key) ?? []), event]);
      });
    return map;
  }, [upcomingData]);

  const q = query.trim().toLowerCase();
  const cards = useMemo(
    () =>
      catalogue
        .filter(
          (item) =>
            (type === "all" || normalizeType(item.event_type) === type) &&
            (!q || `${item.event_name} ${item.event_description}`.toLowerCase().includes(q))
        )
        .sort(
          (a, b) =>
            Number(b.event_category === "WEEKLY") - Number(a.event_category === "WEEKLY") ||
            String(a.event_name).localeCompare(String(b.event_name))
        ),
    [catalogue, q, type]
  );

  const save = async (payload: EventType) => {
    const editing = dialog?.event;
    setSaving(true);
    try {
      if (editing) {
        await api.put.updateUniqueEvent(payload, { id: editing.id });
        notify.success({ title: "Event updated", message: `Changes to ${payload.event_name} were saved.` });
      } else {
        await api.post.createUniqueEvent(payload);
        notify.success({
          title: "Event added",
          message: `${payload.event_name}. Schedule its first date when you’re ready.`,
        });
      }
      setDialog(null);
      await refetch();
    } catch (error) {
      notify.fromError(error, { title: "Couldn't save the event" });
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (item: EventType) => {
    const upcoming = upcomingByEvent.get(String(item.id))?.length ?? 0;
    if (upcoming) {
      confirmAction({
        title: `${item.event_name} still has ${plural(upcoming, "upcoming date")}`,
        message:
          "Delete those first from Scheduled events, then remove it here. Past dates stay in your history either way.",
        confirmLabel: "Delete event",
        blocked: true,
        onConfirm: () => undefined,
      });
      return;
    }
    confirmAction({
      title: `Delete ${item.event_name}?`,
      points: ["It disappears from this list.", "Past dates and their attendance stay in analytics."],
      confirmLabel: "Delete event",
      tone: "danger",
      onConfirm: async () => {
        await api.delete.deleteUniqueEvent({ id: item.id });
        notify.success({ title: "Event deleted", message: `${item.event_name} was removed.` });
        await refetch();
      },
    });
  };

  return (
    <PageOutline className="flex flex-col gap-4">
      <div className="mb-2">
        <PageHeading
          title="Events"
          subtitle="The gatherings your church runs. Define each once, then schedule it as often as you need."
          actions={
            canManageEvents ? (
              <UiButton tone="primary" onClick={() => setDialog({ event: null })}>
                New event
              </UiButton>
            ) : undefined
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Segmented ariaLabel="Type" items={TYPE_TABS} value={type} onChange={setType} scroll />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search events"
          ariaLabel="Search events"
          className="max-w-[340px] flex-[1_1_240px]"
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
        {cards.map((item) => {
          const upcoming = upcomingByEvent.get(String(item.id)) ?? [];
          const next = upcoming[0];
          const weekly = item.event_category === "WEEKLY";
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-lightGray bg-white p-5 shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                  <Dot color={typeColor(item.event_type)} />
                  {typeLabel(item.event_type)}
                </span>
                <span className="text-xs text-gray-500">{weekly ? "Weekly" : "Special"}</span>
              </div>
              <h2 className="text-xl font-semibold leading-7 text-primary">{item.event_name}</h2>
              <p className="flex-1 text-sm text-gray-600">{item.event_description || "No description yet."}</p>
              <div className="flex flex-col gap-0.5 rounded-lg bg-inputBackground p-3">
                <span className="text-xs text-gray-500">{scheduleText(item)}</span>
                <span className={next ? "text-sm font-medium text-primary" : "text-sm font-medium text-amber-700"}>
                  {next
                    ? `Next: ${fmtShortDay(next.date)}${next.start ? `, ${clockLabel(next.start)}` : ""}`
                    : "Nothing scheduled"}
                </span>
                {upcoming.length > 0 && (
                  <span className="text-xs text-gray-500">{plural(upcoming.length, "upcoming date")}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canManageEvents && (
                  <UiButton
                    tone="primary"
                    className="px-4"
                    onClick={() =>
                      setSchedule({
                        eventNameId: item.id,
                        date: nextWeekday(weekly && typeof item.schedule_day === "number" ? item.schedule_day : null),
                      })
                    }
                  >
                    Schedule
                  </UiButton>
                )}
                <UiButton
                  onClick={() =>
                    navigate(
                      `${EVENTS_PATHS.scheduled}?event=${item.id}&month=${monthKeyOf(next?.date ?? todayKey())}`
                    )
                  }
                >
                  See dates
                </UiButton>
                {canManageEvents && (
                  <>
                    <UiButton tone="ghost" className="px-3 text-primary hover:bg-primary/5" onClick={() => setDialog({ event: item })}>
                      Edit
                    </UiButton>
                    <UiButton
                      tone="ghost"
                      aria-label={`Delete ${item.event_name}`}
                      className="ml-auto px-3 text-red-700 hover:bg-red-50 hover:text-red-700"
                      onClick={() => askDelete(item)}
                    >
                      Delete
                    </UiButton>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {cards.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">
          {catalogue.length ? "No events match." : "No events yet. Add the gatherings your church runs."}
        </p>
      )}

      <EventCatalogueDialog
        open={Boolean(dialog)}
        event={dialog?.event ?? null}
        existing={catalogue}
        saving={saving}
        onClose={() => setDialog(null)}
        onSave={save}
      />

      {schedule && (
        <ScheduleEventEditor
          mode={{ kind: "new", prefill: schedule }}
          onClose={() => setSchedule(null)}
          onSaved={() => {
            setSchedule(null);
            void refetchUpcoming();
          }}
        />
      )}
    </PageOutline>
  );
};

export default AllEvent;
