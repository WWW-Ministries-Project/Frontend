import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { notify } from "@/components/feedback";
import { downloadCsv } from "@/pages/HomePage/pages/Attendance/utils/attendanceModel";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { api } from "@/utils/api/apiCalls";
import type { EventRegistrationRecord, EventReminderRow } from "@/utils/api/events/interfaces";

import {
  audienceLabel,
  clockLabel,
  dayKey,
  EVENTS_PATHS,
  type EventRecord,
  fmtLongDay,
  fmtShortDay,
  reminderLabel,
  repeatLabel,
  type ScheduledEvent,
  statusOf,
  typeColor,
  typeLabel,
} from "../utils/eventsModel";
import { Dot, Drawer, Pill, type PillTone, UiButton } from "./eventsUi";

const STATUS_PILL: Record<string, [string, PillTone]> = {
  live: ["Happening now", "success"],
  ended: ["Ended", "neutral"],
  upcoming: ["Upcoming", "info"],
};

const SHOWN_REGISTRANTS = 6;

interface Props {
  event: ScheduledEvent;
  siblings: ScheduledEvent[];
  attendance: number | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (event: ScheduledEvent) => void;
  onDelete: (event: ScheduledEvent) => void;
}

const EventDetailDrawer = ({ event, siblings, attendance, canManage, onClose, onEdit, onDelete }: Props) => {
  const [detail, setDetail] = useState<EventRecord | null>(null);
  const [reminders, setReminders] = useState<EventReminderRow[] | null>(null);
  const { departments, positions } = useSettingsStore((state) => ({
    departments: state.departments,
    positions: state.positions,
  }));

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setReminders(null);
    api.fetch
      .fetchEventById({ id: event.id })
      .then((res) => {
        if (!cancelled && res?.data) setDetail(res.data as unknown as EventRecord);
      })
      .catch(() => undefined);
    api.fetch
      .fetchEventReminders({ event_id: event.id })
      .then((res) => {
        if (!cancelled) setReminders(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setReminders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  const raw = detail ?? event.raw;
  const status = statusOf(event);
  const [pillText, pillTone] = STATUS_PILL[status];
  const when = `${event.multiDay ? `${fmtLongDay(event.date)} – ${fmtLongDay(event.endDate)}` : fmtLongDay(event.date)}${
    event.start ? ` · ${clockLabel(event.start)}${event.end ? ` – ${clockLabel(event.end)}` : ""}` : ""
  }`;
  const audience = audienceLabel(raw, departments, positions);
  const repeat = repeatLabel(event, siblings);
  const links = (raw.online_links ?? []).filter((link) => link.url);
  const registrants: EventRegistrationRecord[] = useMemo(
    () => (Array.isArray(detail?.event_registers) ? detail!.event_registers! : []),
    [detail]
  );
  const registered = Number(raw.registration_count ?? registrants.length ?? event.registrations) || 0;
  const reminderText =
    reminders === null
      ? "…"
      : reminders.filter((row) => row.status === "PENDING" || row.status === "SENT").length
        ? Array.from(
            new Set(
              reminders
                .filter((row) => row.status !== "CANCELLED")
                .map((row) => Number(row.offset_minutes))
            )
          )
            .sort((a, b) => b - a)
            .map(reminderLabel)
            .join(", ")
        : "No reminders";

  const copyLink = async () => {
    if (!raw.public_registration_url) return;
    try {
      await navigator.clipboard.writeText(raw.public_registration_url);
      notify.success({
        title: "Registration link copied",
        message: "Share it on WhatsApp or in the church bulletin.",
      });
    } catch {
      notify.error({
        title: "Couldn't copy the link",
        message: "Your browser blocked the clipboard. Open full details and copy it from there.",
      });
    }
  };

  const exportRegistrants = () => {
    const slug = event.name.replace(/\W+/g, "-").toLowerCase();
    downloadCsv(`${slug}-${event.date}-registrations.csv`, [
      ["Name", "Type", "Member ID", "Email", "Phone", "Location", "Registered"],
      ...registrants.map((row) => [
        row.name ?? "",
        row.is_member ? "Member" : "Guest",
        row.member_id ?? "",
        row.email ?? "",
        row.phone ?? "",
        row.location ?? "",
        dayKey(row.created_at),
      ]),
    ]);
  };

  const header = (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
          <Dot color={typeColor(event.type)} />
          {typeLabel(event.type)}
        </span>
        <Pill tone={pillTone}>{pillText}</Pill>
      </div>
      <h2 className="text-xl font-semibold leading-7 text-primary">{event.name}</h2>
      <p className="text-sm text-gray-600">{when}</p>
    </div>
  );

  return (
    <Drawer
      open
      onClose={onClose}
      title={event.name}
      description={when}
      header={header}
      footer={
        <>
          {canManage && (
            <UiButton tone="ghost" className="mr-auto text-red-700 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(event)}>
              Delete
            </UiButton>
          )}
          <Link
            to={EVENTS_PATHS.view(event.id)}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
          >
            Full details
          </Link>
          {canManage && (
            <UiButton tone="primary" onClick={() => onEdit(event)}>
              Edit
            </UiButton>
          )}
        </>
      }
    >
      {raw.description ? <p className="text-sm text-gray-700">{raw.description}</p> : null}

      <dl className="m-0 grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        <dt className="text-gray-500">Where</dt>
        <dd className="m-0 text-primary">{event.location || "No location"}</dd>
        {audience && (
          <>
            <dt className="text-gray-500">Who it’s for</dt>
            <dd className="m-0 text-primary">{audience}</dd>
          </>
        )}
        {repeat && (
          <>
            <dt className="text-gray-500">Repeats</dt>
            <dd className="m-0 text-primary">{repeat}</dd>
          </>
        )}
        <dt className="text-gray-500">Reminders</dt>
        <dd className="m-0 text-primary">{reminderText}</dd>
      </dl>

      {links.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-primary">Online</h3>
          {links.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between gap-2 rounded-lg border border-lightGray px-4 py-3 text-primary no-underline hover:bg-inputBackground"
            >
              <span className="font-medium">{link.label || link.platform}</span>
              <span className="min-w-0 truncate text-xs text-gray-600">{link.url}</span>
            </a>
          ))}
        </div>
      )}

      {status === "ended" && (
        <div className="flex flex-col gap-0.5 rounded-xl bg-inputBackground p-4">
          <span className="text-xl font-semibold leading-7 text-primary">
            {attendance !== null ? `${attendance.toLocaleString()} people attended` : "Attendance not recorded yet"}
          </span>
          {event.requiresRegistration && attendance !== null && registered > 0 && (
            <span className="text-sm text-gray-600">
              {Math.round((attendance / registered) * 100)}% of registrants came
            </span>
          )}
        </div>
      )}

      {event.requiresRegistration && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-primary">Registration</h3>
            <div className="flex gap-2">
              {raw.public_registration_url && (
                <UiButton size="sm" onClick={() => void copyLink()}>
                  Copy link
                </UiButton>
              )}
              <UiButton size="sm" onClick={exportRegistrants} disabled={!registrants.length}>
                Export
              </UiButton>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,110px),1fr))] gap-3">
            {[
              ["Registered", String(registered)],
              ["Capacity", event.capacity ? String(event.capacity) : "No limit"],
              ["Closes", raw.registration_end_date ? fmtShortDay(dayKey(raw.registration_end_date)) : "At the start"],
              ["Who can register", raw.registration_audience === "MEMBERS_ONLY" ? "Members only" : "Anyone with the link"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-primary">{value}</span>
              </div>
            ))}
          </div>
          {registrants.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              {registrants.slice(0, SHOWN_REGISTRANTS).map((row) => (
                <div
                  key={row.id}
                  className="flex justify-between gap-2 border-b border-gray-200 px-3 py-2 text-sm last:border-b-0"
                >
                  <span className="min-w-0 truncate font-medium text-primary">{row.name || "Unnamed"}</span>
                  <span className="flex-shrink-0 text-xs text-gray-500">
                    {row.is_member ? "Member" : `Guest${row.phone ? ` · ${row.phone}` : ""}`}
                  </span>
                </div>
              ))}
              {registrants.length > SHOWN_REGISTRANTS && (
                <p className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                  + {registrants.length - SHOWN_REGISTRANTS} more in the export
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default EventDetailDrawer;
