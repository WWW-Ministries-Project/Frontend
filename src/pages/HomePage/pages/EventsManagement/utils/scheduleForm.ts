import { useCallback, useState } from "react";

import { pictureInstance as axiosPic } from "@/axiosInstance";
import { notify } from "@/components/feedback";
import { useAuth } from "@/context/AuthWrapper";
import { ALL_BRANCHES } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { EventReminderRow } from "@/utils/api/events/interfaces";
import { getChangedValues } from "@/utils/helperFunctions";
import { validateUploadFile } from "@/utils/uploadValidation";

import type { SeriesScope } from "../Components/SeriesScopeModal";
import type { ReminderOffsetMinutes } from "./eventInterfaces";
import {
  addDays,
  countOccurrences,
  dayKey,
  fmtLongDay,
  fmtShortDay,
  plural,
  type RepeatFrequency,
  todayKey,
} from "./eventsModel";
import {
  emptyOnlineLinkValues,
  formValuesToOnlineLinks,
  ONLINE_PLATFORMS,
  onlineLinkError,
  onlineLinksToFormValues,
} from "./onlinePlatforms";

export interface EventsFormValues {
  event_name_id?: string | number;
  event_type?: string;
  event_name?: string;
  name?: string;
  description?: string;
  start_date?: string;
  start_time?: string;
  end_time?: string;
  day_event?: string;
  recurring?: {
    daysOfWeek?: number[];
    interval?: number;
    frequency?: string;
  };
  repetitive?: string;
  end_date?: string;
  recurrence_end_date?: string;
  timezone?: string;
  reminders?: ReminderOffsetMinutes[];
  location?: string;
  requires_registration?: boolean;
  registration_end_date?: string;
  registration_capacity?: number | string;
  registration_audience?: "MEMBERS_ONLY" | "MEMBERS_AND_NON_MEMBERS";
  public_registration_url?: string | null;
  audience_type?: "all" | "department" | "position";
  target_departments?: string[];
  target_positions?: string[];
  branch_id?: number | "";
  /** UI only: shows the online link fields. Never sent. */
  online?: boolean;
  /** One flat string per platform — see utils/onlinePlatforms.ts */
  zoom_url?: string;
  youtube_url?: string;
  links?: { platform: string; url: string }[];
  [key: string]: unknown;
}

const toDays = (value: unknown): number[] => {
  let list: unknown = value;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(",");
    }
  }
  if (typeof value === "number") list = [value];
  if (!Array.isArray(list)) return [];
  return Array.from(
    new Set(list.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))
  ).sort((a, b) => a - b);
};

const timeOf = (value: unknown) => String(value ?? "").slice(0, 5);

/** Defaults for a new schedule, optionally prefilled from a catalogue event. */
export const newScheduleValues = (prefill?: {
  eventNameId?: string | number;
  eventName?: string;
  eventType?: string;
  description?: string;
  date?: string;
  start?: string | null;
  end?: string | null;
  weekly?: boolean;
  day?: number | null;
}): EventsFormValues => {
  const date = prefill?.date || addDays(todayKey(), 1);
  const weekday = prefill?.day ?? new Date(`${date}T00:00:00`).getDay();
  return {
    event_name_id: prefill?.eventNameId ?? "",
    event_name: prefill?.eventName ?? "",
    event_type: prefill?.eventType ?? "",
    description: prefill?.description ?? "",
    start_date: date,
    start_time: prefill?.start || "09:00",
    end_time: prefill?.end || "11:00",
    day_event: "one",
    end_date: date,
    repetitive: prefill?.weekly ? "yes" : "no",
    recurring: { frequency: "weekly", interval: 1, daysOfWeek: [weekday] },
    recurrence_end_date: prefill?.weekly ? addDays(date, 7 * 12) : "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    reminders: [1440, 60],
    location: "",
    requires_registration: false,
    registration_end_date: "",
    registration_capacity: "",
    registration_audience: "MEMBERS_ONLY",
    audience_type: "all",
    target_departments: [],
    target_positions: [],
    branch_id: "",
    online: false,
    ...emptyOnlineLinkValues(),
  };
};

/** API event (get-event) → form values. */
export const editScheduleValues = (event: Record<string, unknown>, reminders?: number[]): EventsFormValues => {
  const start = dayKey(event.start_date);
  const end = dayKey(event.end_date) || start;
  const links = onlineLinksToFormValues(
    event.online_links as { platform: string; label: string; join_label: string; url: string }[] | undefined
  );
  const capacity = event.registration_capacity;
  return {
    event_name_id: (event.event_name_id as string | number) ?? "",
    event_name: String(event.event_name ?? event.name ?? ""),
    event_type: String(event.event_type ?? ""),
    description: String(event.description ?? ""),
    poster: event.poster ?? "",
    start_date: start,
    start_time: timeOf(event.start_time),
    end_time: timeOf(event.end_time),
    day_event: end > start ? "multi" : "one",
    end_date: end,
    repetitive: "no",
    recurring: { frequency: "weekly", interval: 1, daysOfWeek: toDays(event.day_of_week) },
    recurrence_end_date: dayKey(event.recurrence_end_date),
    timezone:
      String(event.timezone ?? "").trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    reminders: (Array.isArray(event.reminders) ? event.reminders : reminders ?? []) as ReminderOffsetMinutes[],
    location: String(event.location ?? ""),
    requires_registration: event.requires_registration === true || String(event.requires_registration) === "true",
    registration_end_date: dayKey(event.registration_end_date),
    registration_capacity:
      capacity !== undefined && capacity !== null && String(capacity).trim() !== "" ? Number(capacity) : "",
    registration_audience:
      String(event.registration_audience ?? "").toUpperCase() === "MEMBERS_ONLY" ? "MEMBERS_ONLY" : "MEMBERS_AND_NON_MEMBERS",
    public_registration_url: (event.public_registration_url as string | null) ?? null,
    audience_type: (event.audience_type as EventsFormValues["audience_type"]) || "all",
    target_departments: Array.isArray(event.target_departments) ? (event.target_departments as string[]) : [],
    target_positions: Array.isArray(event.target_positions) ? (event.target_positions as string[]) : [],
    branch_id: event.branch_id !== undefined && event.branch_id !== null ? (event.branch_id as number | "") : "",
    recurrence_series_id: event.recurrence_series_id ?? null,
    online: ONLINE_PLATFORMS.some((platform) => Boolean(links[platform.field])),
    ...links,
  };
};

/* -------------------------------------------------------------------------- */
/*                                 Validation                                 */
/* -------------------------------------------------------------------------- */

const toMinutes = (time?: string) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const crossesMidnight = (start?: string, end?: string) => {
  const a = toMinutes(start);
  const b = toMinutes(end);
  return a !== null && b !== null && b < a;
};

/** Messages follow the design: what to fix, in plain words. */
export const validateSchedule = (
  values: EventsFormValues,
  context: { updating: boolean; activeBranchId: unknown }
) => {
  const errors: Record<string, string> = {};
  const isNew = !context.updating;
  if (!values.event_name_id) errors.event_name_id = "Choose which event this is.";
  if (context.activeBranchId === ALL_BRANCHES && (values.branch_id === "" || values.branch_id === undefined)) {
    errors.branch_id = "Choose the branch it belongs to.";
  }
  if (!values.start_date) errors.start_date = "Pick a date.";
  if (!values.start_time) errors.start_time = "Add a start time.";
  if (!values.end_time) errors.end_time = "Add an end time.";
  const multi = values.day_event === "multi";
  if (multi) {
    if (!values.end_date || (values.start_date && values.end_date <= values.start_date)) {
      errors.end_date = "The last day must be after the first day.";
    }
  } else if (
    values.start_time &&
    values.end_time &&
    toMinutes(values.end_time)! <= toMinutes(values.start_time)! &&
    !crossesMidnight(values.start_time, values.end_time)
  ) {
    errors.end_time = "The end time must be after the start time.";
  }
  if (isNew && values.repetitive === "yes") {
    if (!values.recurrence_end_date || (values.start_date && values.recurrence_end_date < values.start_date)) {
      errors.recurrence_end_date = "Choose when the repeats stop, on or after the first date.";
    }
    if (!multi && values.recurring?.frequency === "weekly" && !(values.recurring?.daysOfWeek ?? []).length) {
      errors["recurring.daysOfWeek"] = "Pick at least one weekday it repeats on.";
    }
  }
  if (values.online) {
    const filled = ONLINE_PLATFORMS.filter((platform) => String(values[platform.field] ?? "").trim());
    if (!filled.length) errors.zoom_url = "Add at least one online link, or turn off Also online.";
    ONLINE_PLATFORMS.forEach((platform) => {
      const message = onlineLinkError(values[platform.field]);
      if (message) errors[platform.field] = message;
    });
  }
  if (values.audience_type === "department" && !(values.target_departments ?? []).length) {
    errors.target_departments = "Pick at least one department, or choose All members.";
  }
  if (values.audience_type === "position" && !(values.target_positions ?? []).length) {
    errors.target_positions = "Pick at least one position, or choose All members.";
  }
  if (values.requires_registration) {
    if (!values.registration_end_date) errors.registration_end_date = "Choose when registration closes.";
    else if (values.start_date && values.registration_end_date > values.start_date) {
      errors.registration_end_date = "Registration must close on or before the event date.";
    }
    const capacity = Number(values.registration_capacity);
    if (values.registration_capacity === "" || !Number.isInteger(capacity) || capacity < 1) {
      errors.registration_capacity = "Capacity must be a whole number above zero.";
    }
  }
  return errors;
};

/* -------------------------------------------------------------------------- */
/*                                  Preview                                   */
/* -------------------------------------------------------------------------- */

export const occurrenceCount = (values: EventsFormValues, updating: boolean) => {
  if (updating || values.repetitive !== "yes") return 1;
  const multi = values.day_event === "multi";
  return countOccurrences({
    start: values.start_date ?? "",
    until: values.recurrence_end_date ?? "",
    frequency: (values.recurring?.frequency as RepeatFrequency) || "weekly",
    interval: Number(values.recurring?.interval) || 1,
    daysOfWeek: multi ? [] : values.recurring?.daysOfWeek ?? [],
  });
};

/* -------------------------------------------------------------------------- */
/*                                  Payload                                   */
/* -------------------------------------------------------------------------- */

const UI_ONLY_KEYS = ["online", "poster", "recurrence_series_id", "public_registration_url", "event_name", "name"];

/** Same shape the old schedule form sent, so the API contract does not move. */
export const buildSchedulePayload = (
  values: EventsFormValues,
  initial: EventsFormValues,
  updating: boolean
): Record<string, unknown> => {
  const isMultiDay = values.day_event === "multi";
  const isRecurring = !updating && values.repetitive === "yes";
  const prepared: EventsFormValues = {
    ...values,
    end_date: isMultiDay ? values.end_date || addDays(String(values.start_date || ""), 1) : values.start_date || "",
    recurrence_end_date: isRecurring ? values.recurrence_end_date : "",
    timezone: values.timezone || "UTC",
    reminders: Array.isArray(values.reminders) ? values.reminders : [],
    repetitive: isRecurring ? "yes" : "no",
    recurring: isRecurring
      ? {
          interval: Number(values.recurring?.interval) || 1,
          frequency: values.recurring?.frequency,
          ...(isMultiDay || values.recurring?.frequency !== "weekly"
            ? {}
            : { daysOfWeek: toDays(values.recurring?.daysOfWeek) }),
        }
      : undefined,
    requires_registration: Boolean(values.requires_registration),
    registration_end_date: values.requires_registration ? values.registration_end_date : "",
    registration_capacity: values.requires_registration ? values.registration_capacity : "",
    registration_audience: values.requires_registration ? values.registration_audience : "MEMBERS_AND_NON_MEMBERS",
    audience_type: values.audience_type || "all",
    target_departments: values.audience_type === "department" ? values.target_departments || [] : [],
    target_positions: values.audience_type === "position" ? values.target_positions || [] : [],
  };
  UI_ONLY_KEYS.forEach((key) => delete prepared[key]);
  ONLINE_PLATFORMS.forEach((platform) => delete prepared[platform.field]);

  const body = updating ? getChangedValues(initial, prepared) : prepared;
  const linkSource = values.online ? values : emptyOnlineLinkValues();
  return { ...body, links: formValuesToOnlineLinks(linkSource) };
};

/* -------------------------------------------------------------------------- */
/*                                   Submit                                   */
/* -------------------------------------------------------------------------- */

export interface ScheduleSubmitContext {
  id?: string | null;
  scope?: SeriesScope | null;
  seriesId?: string | null;
  fromDate?: string | null;
  file?: File | null;
  initial: EventsFormValues;
  /** Reminder rows the occurrence had when the form opened. */
  reminderRows?: EventReminderRow[];
  /** Events › Manage online links; when false an edit leaves links alone. */
  canEditLinks?: boolean;
  /** Events › Send reminders; when false an edit leaves reminders alone. */
  canEditReminders?: boolean;
}

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

/**
 * Create / update a schedule. Mirrors the old CreateEvent page: poster upload,
 * series scopes, and online links sent separately on update (update-event
 * SMSes registrants). Returns true when the event saved.
 */
export const useScheduleEventSubmit = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const submit = useCallback(
    async (values: EventsFormValues, context: ScheduleSubmitContext): Promise<boolean> => {
      const updating = Boolean(context.id);
      const { links, ...eventValues } = buildSchedulePayload(values, context.initial, updating) as {
        links: { platform: string; url: string }[];
      } & Record<string, unknown>;
      const name = String(values.event_name || "The event");
      setSaving(true);
      try {
        let poster = "";
        if (context.file) {
          const check = validateUploadFile(context.file, {
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          });
          if (!check.valid) {
            notify.error({
              title: "Couldn't use that poster",
              message: check.message || "Pick a JPG, PNG, WebP or GIF image.",
            });
            return false;
          }
          const data = new FormData();
          data.append("file", context.file);
          const upload = await axiosPic.post("/upload", data);
          if (upload.status === 200) poster = upload.data?.result?.link ?? "";
        }
        const withPoster = poster ? { poster } : {};

        if (!updating) {
          await api.post.createEvent({ ...eventValues, ...withPoster, links, created_by: user?.id });
          const count = occurrenceCount(values, false);
          const until = values.recurrence_end_date || "";
          notify.success({
            title: count > 1 ? `${plural(count, "event")} scheduled` : "Event scheduled",
            message:
              count > 1
                ? `${name} from ${fmtShortDay(values.start_date || "")} to ${fmtShortDay(until)}.`
                : `${name} on ${fmtLongDay(values.start_date || "")}.`,
          });
          return true;
        }

        const id = String(context.id);
        const base = { ...eventValues, ...withPoster, updated_by: user?.id };
        if (context.scope === "all" && context.seriesId) {
          await api.put.updateEventSeries({ ...base, series_id: context.seriesId });
        } else if (context.scope === "following" && context.seriesId && context.fromDate) {
          await api.put.updateEventSeriesFrom({
            ...base,
            series_id: context.seriesId,
            from_date: context.fromDate,
          });
        } else {
          await api.put.updateEvent(base, { id });
        }

        // Links and reminders are per occurrence and go through their own
        // endpoints so update-event never carries them.
        const followUps: string[] = [];
        if (context.canEditLinks !== false) {
          try {
            await api.put.updateEventOnlineLinks({ links }, { id });
          } catch {
            followUps.push("online links");
          }
        }
        const nextReminders = (values.reminders ?? []).map(Number);
        const pending = (context.reminderRows ?? []).filter((row) => row.status === "PENDING");
        const previous = pending.map((row) => Number(row.offset_minutes));
        if (context.canEditReminders !== false && !sameSet(nextReminders, previous)) {
          try {
            if (nextReminders.length) {
              await api.post.saveEventReminders({ event_id: Number(id), reminders: nextReminders });
            } else {
              await Promise.all(pending.map((row) => api.delete.cancelEventReminder({ id: row.id })));
            }
          } catch {
            followUps.push("reminders");
          }
        }

        if (followUps.length) {
          notify.warning({
            title: "Event saved, with a gap",
            message: `${name} saved, but its ${followUps.join(" and ")} didn't update. Open it again and save to retry.`,
          });
        } else {
          notify.success({
            title: "Event updated",
            message:
              context.scope === "all"
                ? `${name} · every date in the series.`
                : context.scope === "following"
                  ? `${name} · this and later dates.`
                  : `Changes to ${name} were saved.`,
          });
        }
        return true;
      } catch (error) {
        notify.fromError(error, {
          title: updating ? "Couldn't save the event" : "Couldn't schedule the event",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user?.id]
  );

  return { submit, saving };
};
