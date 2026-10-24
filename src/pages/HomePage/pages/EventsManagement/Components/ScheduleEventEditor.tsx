import { Form, Formik, type FormikProps } from "formik";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BranchSelectField } from "@/components/BranchSelectField";
import { FormikErrorSummary, notify } from "@/components/feedback";
import ImageUpload from "@/components/ImageUpload";
import { useFetch } from "@/CustomHooks/useFetch";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type { EventReminderRow, EventType } from "@/utils/api/events/interfaces";

import { REMINDER_OFFSET_OPTIONS, type ReminderOffsetMinutes } from "../utils/eventInterfaces";
import {
  addDays,
  EVENTS_PATHS,
  EVENT_TYPES,
  ordinal,
  plural,
  todayKey,
  typeLabel,
  WEEKDAYS,
} from "../utils/eventsModel";
import { ONLINE_PLATFORMS, onlineLinkWarning } from "../utils/onlinePlatforms";
import {
  crossesMidnight,
  editScheduleValues,
  type EventsFormValues,
  newScheduleValues,
  occurrenceCount,
  useScheduleEventSubmit,
  validateSchedule,
} from "../utils/scheduleForm";
import {
  Drawer,
  Field,
  FieldError,
  FormSection,
  MutedPanel,
  Segmented,
  SelectInput,
  Switch,
  TextArea,
  TextInput,
  ToggleChip,
  UiButton,
} from "./eventsUi";
import SeriesScopeModal, { type SeriesScope } from "./SeriesScopeModal";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface SchedulePrefill {
  eventNameId?: string | number;
  date?: string;
}

export type ScheduleEditorMode =
  | { kind: "new"; prefill?: SchedulePrefill }
  | {
      kind: "edit";
      id: string;
      /** Pre-chosen scope (deep links). Otherwise asked on save for series. */
      scope?: SeriesScope | null;
    };

interface Props {
  mode: ScheduleEditorMode;
  onClose: () => void;
  onSaved: (info: { date?: string }) => void;
  frame?: "drawer" | "page";
}

const NEW_EVENT = "__new__";
const TIMEZONES: string[] = (() => {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
    const list = intl.supportedValuesOf?.("timeZone");
    return list?.length ? list : ["UTC", "Africa/Accra"];
  } catch {
    return ["UTC", "Africa/Accra"];
  }
})();

type RepeatKey = "none" | "daily" | "weekly" | "monthly" | "yearly";
const REPEAT_ITEMS: { key: RepeatKey; label: string }[] = [
  { key: "none", label: "Doesn’t repeat" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];
const UNIT: Record<Exclude<RepeatKey, "none">, [string, string]> = {
  daily: ["day", "days"],
  weekly: ["week", "weeks"],
  monthly: ["month", "months"],
  yearly: ["year", "years"],
};

/* -------------------------------------------------------------------------- */
/*                                   Editor                                   */
/* -------------------------------------------------------------------------- */

const ScheduleEventEditor = ({ mode, onClose, onSaved, frame = "drawer" }: Props) => {
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const { data: catalogueData, refetch: refetchCatalogue } = useFetch(
    api.fetch.fetchAllUniqueEvents,
    undefined,
    false,
    { silent: true }
  );
  const catalogue = useMemo(
    () => (Array.isArray(catalogueData?.data) ? (catalogueData?.data as EventType[]) : []),
    [catalogueData]
  );
  const { submit, saving } = useScheduleEventSubmit();

  const editId = mode.kind === "edit" ? mode.id : null;
  const [loaded, setLoaded] = useState<{ values: EventsFormValues; reminders: EventReminderRow[] } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [scopeFor, setScopeFor] = useState<EventsFormValues | null>(null);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setLoaded(null);
    setLoadFailed(false);
    Promise.all([
      api.fetch.fetchEventById({ id: editId }),
      api.fetch.fetchEventReminders({ event_id: editId }).catch(() => null),
    ])
      .then(([eventRes, reminderRes]) => {
        if (cancelled) return;
        const rows = Array.isArray(reminderRes?.data) ? reminderRes.data : [];
        const pending = rows.filter((row) => row.status === "PENDING").map((row) => Number(row.offset_minutes));
        setLoaded({
          values: editScheduleValues((eventRes?.data ?? {}) as Record<string, unknown>, pending),
          reminders: rows,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const prefill = mode.kind === "new" ? mode.prefill : undefined;
  const initialValues = useMemo<EventsFormValues | null>(() => {
    if (editId) return loaded?.values ?? null;
    const source = catalogue.find((item) => String(item.id) === String(prefill?.eventNameId ?? ""));
    return newScheduleValues(
      source
        ? {
            eventNameId: source.id,
            eventName: source.event_name,
            eventType: source.event_type,
            description: source.event_description,
            date: prefill?.date,
            start: source.schedule_start_time,
            end: source.schedule_end_time,
            weekly: source.event_category === "WEEKLY",
            day: typeof source.schedule_day === "number" ? source.schedule_day : null,
          }
        : { date: prefill?.date }
    );
    // Prefill only needs the catalogue once it arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, loaded, prefill?.eventNameId ? catalogue.length > 0 : false, prefill?.eventNameId, prefill?.date]);

  const updating = Boolean(editId);
  const seriesId = updating ? (loaded?.values.recurrence_series_id as string | null) ?? null : null;
  const presetScope = mode.kind === "edit" ? mode.scope ?? null : null;

  const runSubmit = async (values: EventsFormValues, scope: SeriesScope | null) => {
    if (!initialValues) return;
    const ok = await submit(values, {
      id: editId,
      scope,
      seriesId,
      fromDate: initialValues.start_date || null,
      file,
      initial: initialValues,
      reminderRows: loaded?.reminders,
    });
    if (ok) {
      setScopeFor(null);
      onSaved({ date: values.start_date });
    }
  };

  const handleSubmit = async (values: EventsFormValues) => {
    if (updating && seriesId && !presetScope) {
      setScopeFor(values);
      return;
    }
    await runSubmit(values, presetScope);
  };

  const title = updating ? "Edit scheduled event" : "Schedule an event";

  const body = (form: FormikProps<EventsFormValues> | null) => {
    if (loadFailed) {
      return (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn’t load this event. Close this panel and open it again.
        </p>
      );
    }
    if (!form) {
      return (
        <div className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      );
    }
    return (
      <ScheduleFields
        form={form}
        updating={updating}
        seriesId={seriesId}
        presetScope={presetScope}
        catalogue={catalogue}
        refetchCatalogue={() => refetchCatalogue()}
        onFile={setFile}
        onLeave={onClose}
      />
    );
  };

  const footer = (form: FormikProps<EventsFormValues> | null) => {
    const count = form ? occurrenceCount(form.values, updating) : 1;
    return (
      <>
        <UiButton tone="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </UiButton>
        <UiButton
          tone="primary"
          type="submit"
          form="schedule-event-form"
          disabled={!form || saving}
        >
          {saving ? "Saving…" : updating ? "Save changes" : count > 1 ? `Schedule ${count} dates` : "Schedule event"}
        </UiButton>
      </>
    );
  };

  const frameWith = (form: FormikProps<EventsFormValues> | null, content: ReactNode) =>
    frame === "drawer" ? (
      <Drawer open onClose={onClose} width={640} title={title} busy={saving} footer={footer(form)}>
        {content}
      </Drawer>
    ) : (
      <section className="mx-auto flex w-full max-w-3xl flex-col rounded-2xl border border-lightGray bg-white">
        <div className="border-b border-gray-200 px-4 py-5 tablet:px-6">
          <h1 className="text-xl font-semibold leading-7 text-primary tablet:text-2xl tablet:leading-8">{title}</h1>
        </div>
        <div className="flex flex-col gap-6 px-4 py-6 tablet:px-6">{content}</div>
        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 rounded-b-2xl border-t border-gray-200 bg-white px-4 py-4 tablet:px-6">
          {footer(form)}
        </div>
      </section>
    );

  if (!initialValues) return frameWith(null, body(null));

  return (
    <Formik<EventsFormValues>
      initialValues={initialValues}
      enableReinitialize
      validateOnBlur={false}
      validate={(values) => validateSchedule(values, { updating, activeBranchId })}
      onSubmit={handleSubmit}
    >
      {(form) => (
        <>
          {frameWith(
            form,
            <Form id="schedule-event-form" noValidate className="flex flex-col gap-6">
              {body(form)}
            </Form>
          )}
          {scopeFor && (
            <SeriesScopeModal
              action="edit"
              eventName={String(scopeFor.event_name || "")}
              loading={saving}
              onCancel={() => setScopeFor(null)}
              onConfirm={(scope) => void runSubmit(scopeFor, scope)}
            />
          )}
        </>
      )}
    </Formik>
  );
};

export default ScheduleEventEditor;

/* -------------------------------------------------------------------------- */
/*                                   Fields                                   */
/* -------------------------------------------------------------------------- */

const ScheduleFields = ({
  form,
  updating,
  seriesId,
  presetScope,
  catalogue,
  refetchCatalogue,
  onFile,
  onLeave,
}: {
  form: FormikProps<EventsFormValues>;
  updating: boolean;
  seriesId: string | null;
  presetScope: SeriesScope | null;
  catalogue: EventType[];
  refetchCatalogue: () => Promise<unknown>;
  onFile: (file: File | null) => void;
  onLeave: () => void;
}) => {
  const navigate = useNavigate();
  const { values, setFieldValue, errors, submitCount } = form;
  const showError = (key: string) => (submitCount > 0 ? (errors as Record<string, string>)[key] : undefined);
  const { departments, positions } = useSettingsStore((state) => ({
    departments: state.departments,
    positions: state.positions,
  }));
  const [adding, setAdding] = useState<{ name: string; type: string; busy: boolean } | null>(null);

  const set = (key: string, value: unknown) => void setFieldValue(key, value, submitCount > 0);
  const multi = values.day_event === "multi";
  const repeat: RepeatKey =
    values.repetitive === "yes" ? ((values.recurring?.frequency as RepeatKey) || "weekly") : "none";
  const days = values.recurring?.daysOfWeek ?? [];
  const reminders = (values.reminders ?? []) as ReminderOffsetMinutes[];
  const count = occurrenceCount(values, updating);
  const selected = catalogue.find((item) => String(item.id) === String(values.event_name_id ?? ""));
  const seriesEdit = updating && Boolean(seriesId);

  // An end time before the start time runs past midnight: make it two days.
  useEffect(() => {
    if (!values.start_date || values.day_event === "multi") return;
    if (crossesMidnight(values.start_time, values.end_time)) {
      void setFieldValue("day_event", "multi", false);
      void setFieldValue("end_date", addDays(values.start_date, 1), false);
    }
  }, [setFieldValue, values.day_event, values.end_time, values.start_date, values.start_time]);

  const pickEvent = (id: string) => {
    if (id === NEW_EVENT) {
      setAdding({ name: "", type: "OTHER", busy: false });
      return;
    }
    const source = catalogue.find((item) => String(item.id) === id);
    set("event_name_id", id);
    if (!source) return;
    void setFieldValue("event_name", source.event_name, false);
    void setFieldValue("event_type", source.event_type, false);
    if (source.event_description && !values.description) {
      void setFieldValue("description", source.event_description, false);
    }
    if (source.schedule_start_time) void setFieldValue("start_time", source.schedule_start_time, false);
    if (source.schedule_end_time) void setFieldValue("end_time", source.schedule_end_time, false);
    if (!updating && source.event_category === "WEEKLY") {
      void setFieldValue("repetitive", "yes", false);
      void setFieldValue("recurring.frequency", "weekly", false);
      if (typeof source.schedule_day === "number") {
        void setFieldValue("recurring.daysOfWeek", [source.schedule_day], false);
      }
      if (!values.recurrence_end_date) {
        void setFieldValue("recurrence_end_date", addDays(values.start_date || todayKey(), 7 * 12), false);
      }
    }
  };

  const createCatalogueEvent = async () => {
    if (!adding) return;
    const name = adding.name.trim();
    if (!name) return;
    setAdding({ ...adding, busy: true });
    try {
      const res = await api.post.createUniqueEvent({
        event_name: name,
        event_type: adding.type,
        event_description: "",
      } as EventType);
      const created = res?.data;
      await refetchCatalogue();
      if (created?.id) {
        set("event_name_id", created.id);
        void setFieldValue("event_name", created.event_name ?? name, false);
        void setFieldValue("event_type", created.event_type || adding.type, false);
      }
      notify.success({ title: "Event added", message: `${name} is in your events list.` });
      setAdding(null);
    } catch (error) {
      notify.fromError(error, { title: "Couldn't add the event" });
      setAdding({ ...adding, busy: false });
    }
  };

  const setRepeat = (key: RepeatKey) => {
    if (key === "none") {
      set("repetitive", "no");
      return;
    }
    set("repetitive", "yes");
    void setFieldValue("recurring.frequency", key, false);
    if (!values.recurring?.interval) void setFieldValue("recurring.interval", 1, false);
    if (key === "weekly" && !days.length && values.start_date) {
      void setFieldValue("recurring.daysOfWeek", [new Date(`${values.start_date}T00:00:00`).getDay()], false);
    }
    if (!values.recurrence_end_date && values.start_date) {
      void setFieldValue("recurrence_end_date", addDays(values.start_date, key === "daily" ? 30 : 7 * 12), false);
    }
  };

  const onDateChange = (next: string) => {
    set("start_date", next);
    if (multi && values.end_date && next && values.end_date <= next) {
      void setFieldValue("end_date", addDays(next, 1), false);
    }
    if (!multi) void setFieldValue("end_date", next, false);
    if (repeat === "weekly" && days.length <= 1 && next) {
      void setFieldValue("recurring.daysOfWeek", [new Date(`${next}T00:00:00`).getDay()], false);
    }
  };

  const toggleMulti = () => {
    if (multi) {
      set("day_event", "one");
      void setFieldValue("end_date", values.start_date || "", false);
    } else {
      set("day_event", "multi");
      void setFieldValue("end_date", addDays(values.start_date || todayKey(), 1), false);
      void setFieldValue("recurring.daysOfWeek", [], false);
    }
  };

  const toggleRegistration = (on: boolean) => {
    set("requires_registration", on);
    if (on && !values.registration_end_date && values.start_date) {
      const twoBefore = addDays(values.start_date, -2);
      void setFieldValue(
        "registration_end_date",
        twoBefore < todayKey() ? values.start_date : twoBefore,
        false
      );
    }
  };

  const audienceChoices =
    values.audience_type === "department"
      ? departments.map((item) => ({ id: String(item.id), name: item.name }))
      : values.audience_type === "position"
        ? positions.map((item) => ({ id: String(item.id), name: item.name }))
        : [];
  const audienceKey = values.audience_type === "department" ? "target_departments" : "target_positions";
  const audienceIds = ((values.audience_type === "department" ? values.target_departments : values.target_positions) ??
    []) as string[];

  const startDay = values.start_date ? new Date(`${values.start_date}T00:00:00`) : null;
  const interval = Number(values.recurring?.interval) || 1;

  return (
    <>
      <FormikErrorSummary />

      {seriesEdit && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {presetScope === "all"
            ? "Part of a repeating series. Changes apply to every date in it."
            : presetScope === "following"
              ? "Part of a repeating series. Changes apply to this and later dates."
              : "Part of a repeating series. You’ll choose which dates to update when you save."}{" "}
          Online links and reminders only change for this date.
        </p>
      )}

      {/* Event */}
      <div className="flex flex-col gap-2">
        <Field label={<span className="font-medium">Event</span>} error={showError("event_name_id")}>
          <SelectInput
            id="event_name_id"
            name="event_name_id"
            value={adding ? NEW_EVENT : String(values.event_name_id ?? "")}
            onChange={(event) => pickEvent(event.target.value)}
            hasError={Boolean(showError("event_name_id"))}
            options={[
              { value: "", label: "Choose an event…" },
              ...catalogue
                .slice()
                .sort((a, b) => String(a.event_name).localeCompare(String(b.event_name)))
                .map((item) => ({ value: String(item.id), label: `${item.event_name} · ${typeLabel(item.event_type)}` })),
              { value: NEW_EVENT, label: "+ Add a new event" },
            ]}
          />
        </Field>
        {adding ? (
          <MutedPanel>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
              <Field label="New event name">
                <TextInput
                  autoFocus
                  value={adding.name}
                  placeholder="e.g. Youth Camp"
                  onChange={(event) => setAdding({ ...adding, name: event.target.value })}
                />
              </Field>
              <Field label="Type">
                <SelectInput
                  value={adding.type}
                  onChange={(event) => setAdding({ ...adding, type: event.target.value })}
                  options={EVENT_TYPES.map((type) => ({ value: type.key, label: type.label }))}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <UiButton
                tone="primary"
                size="sm"
                disabled={!adding.name.trim() || adding.busy}
                onClick={() => void createCatalogueEvent()}
              >
                {adding.busy ? "Adding…" : "Add event"}
              </UiButton>
              <UiButton tone="ghost" size="sm" onClick={() => setAdding(null)} disabled={adding.busy}>
                Cancel
              </UiButton>
            </div>
          </MutedPanel>
        ) : (
          <p className="text-xs text-gray-500">
            {selected?.event_description || "Not listed? Add it here or under Events."}{" "}
            <button
              type="button"
              onClick={() => {
                onLeave();
                navigate(EVENTS_PATHS.catalogue);
              }}
              className="text-xs text-primary underline"
            >
              Manage events
            </button>
          </p>
        )}
      </div>

      <BranchSelectField
        value={values.branch_id ?? ""}
        onChange={(value) => set("branch_id", value)}
        required
        error={showError("branch_id")}
      />

      {/* When */}
      <FormSection title="When">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3">
          <Field label={<span className="font-medium">Date</span>} error={showError("start_date")}>
            <TextInput
              id="start_date"
              name="start_date"
              type="date"
              value={values.start_date ?? ""}
              onChange={(event) => onDateChange(event.target.value)}
              hasError={Boolean(showError("start_date"))}
            />
          </Field>
          <Field label={<span className="font-medium">Starts</span>} error={showError("start_time")}>
            <TextInput
              id="start_time"
              name="start_time"
              type="time"
              value={values.start_time ?? ""}
              onChange={(event) => set("start_time", event.target.value)}
              hasError={Boolean(showError("start_time"))}
            />
          </Field>
          <Field label={<span className="font-medium">Ends</span>} error={showError("end_time")}>
            <TextInput
              id="end_time"
              name="end_time"
              type="time"
              value={values.end_time ?? ""}
              onChange={(event) => set("end_time", event.target.value)}
              hasError={Boolean(showError("end_time"))}
            />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
          <input type="checkbox" checked={multi} onChange={toggleMulti} className="h-4 w-4 accent-primary" />
          Runs over more than one day
        </label>
        {multi && (
          <Field
            label={<span className="font-medium">Last day</span>}
            error={showError("end_date")}
            className="max-w-[240px]"
          >
            <TextInput
              id="end_date"
              name="end_date"
              type="date"
              min={values.start_date}
              value={values.end_date ?? ""}
              onChange={(event) => set("end_date", event.target.value)}
              hasError={Boolean(showError("end_date"))}
            />
          </Field>
        )}
        {crossesMidnight(values.start_time, values.end_time) && (
          <p className="text-xs text-gray-600">Ends after midnight, so it runs into the next day.</p>
        )}

        {!updating && (
          <>
            <Segmented
              role="radiogroup"
              ariaLabel="Repeat"
              items={REPEAT_ITEMS}
              value={repeat}
              onChange={setRepeat}
              scroll
              className="self-start"
            />
            {repeat !== "none" && (
              <MutedPanel>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
                  <Field label={<span className="font-medium">How often</span>}>
                    <SelectInput
                      value={String(interval)}
                      onChange={(event) => set("recurring.interval", Number(event.target.value))}
                      options={[1, 2, 3, 4, 5, 6].map((n) => ({
                        value: String(n),
                        label: n === 1 ? `Every ${UNIT[repeat][0]}` : `Every ${n} ${UNIT[repeat][1]}`,
                      }))}
                    />
                  </Field>
                  <Field label={<span className="font-medium">Until</span>} error={showError("recurrence_end_date")}>
                    <TextInput
                      id="recurrence_end_date"
                      name="recurrence_end_date"
                      type="date"
                      min={values.start_date}
                      value={values.recurrence_end_date ?? ""}
                      onChange={(event) => set("recurrence_end_date", event.target.value)}
                      hasError={Boolean(showError("recurrence_end_date"))}
                    />
                  </Field>
                </div>
                {repeat === "weekly" && !multi && (
                  <div className="flex flex-col gap-1">
                    <div role="group" aria-label="On these days" id="recurring.daysOfWeek" className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((label, index) => (
                        <ToggleChip
                          key={label}
                          shape="box"
                          title={label}
                          on={days.includes(index)}
                          onClick={() =>
                            set(
                              "recurring.daysOfWeek",
                              days.includes(index)
                                ? days.filter((day) => day !== index)
                                : [...days, index].sort((a, b) => a - b)
                            )
                          }
                        >
                          {label.slice(0, 3)}
                        </ToggleChip>
                      ))}
                    </div>
                    <FieldError message={showError("recurring.daysOfWeek")} />
                  </div>
                )}
                {repeat === "monthly" && startDay && (
                  <p className="text-sm text-gray-600">On the {ordinal(startDay.getDate())} of the month</p>
                )}
                {repeat === "yearly" && startDay && (
                  <p className="text-sm text-gray-600">
                    Every {startDay.getDate()} {startDay.toLocaleString("en-GB", { month: "long" })}
                  </p>
                )}
                {multi && (
                  <p className="text-xs text-gray-600">Each date keeps the same number of days.</p>
                )}
                <p className="text-xs text-gray-600">Creates {plural(count, "date")} on the calendar.</p>
              </MutedPanel>
            )}
          </>
        )}
      </FormSection>

      {/* Where */}
      <FormSection title="Where">
        <Field label={<span className="font-medium">Location</span>}>
          <TextInput
            id="location"
            name="location"
            value={values.location ?? ""}
            placeholder="e.g. Main Auditorium, East Legon"
            onChange={(event) => set("location", event.target.value)}
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-sm font-medium text-primary">Also online</span>
            <span className="text-xs text-gray-500">
              Members get a Join button in the app.{seriesEdit ? " Links change for this date only." : ""}
            </span>
          </span>
          <Switch label="Also online" on={Boolean(values.online)} onChange={(on) => set("online", on)} />
        </div>
        {values.online && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
            {ONLINE_PLATFORMS.map((platform) => {
              const value = String(values[platform.field] ?? "");
              const warning = onlineLinkWarning(platform, value);
              return (
                <Field
                  key={platform.key}
                  label={<span className="font-medium">{platform.label} link</span>}
                  error={showError(platform.field)}
                >
                  <TextInput
                    id={platform.field}
                    name={platform.field}
                    value={value}
                    placeholder={platform.placeholder}
                    onChange={(event) => set(platform.field, event.target.value)}
                    hasError={Boolean(showError(platform.field))}
                  />
                  {warning && <span className="text-xs text-gray-600">{warning}</span>}
                </Field>
              );
            })}
          </div>
        )}
      </FormSection>

      {/* Who it's for */}
      <FormSection title="Who it’s for">
        <Segmented
          role="radiogroup"
          ariaLabel="Audience"
          items={[
            { key: "all", label: "All members" },
            { key: "department", label: "Departments" },
            { key: "position", label: "Positions" },
          ]}
          value={values.audience_type || "all"}
          onChange={(key) => {
            set("audience_type", key);
            void setFieldValue("target_departments", [], false);
            void setFieldValue("target_positions", [], false);
          }}
          scroll
        />
        {values.audience_type && values.audience_type !== "all" && (
          <div className="flex flex-col gap-1">
            {audienceChoices.length ? (
              <div role="group" id={audienceKey} aria-label="Pick who it’s for" className="flex flex-wrap gap-2">
                {audienceChoices.map((choice) => (
                  <ToggleChip
                    key={choice.id}
                    on={audienceIds.includes(choice.id)}
                    onClick={() =>
                      set(
                        audienceKey,
                        audienceIds.includes(choice.id)
                          ? audienceIds.filter((id) => id !== choice.id)
                          : [...audienceIds, choice.id]
                      )
                    }
                  >
                    {choice.name}
                  </ToggleChip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No {values.audience_type === "department" ? "departments" : "positions"} yet. Add them in Settings.
              </p>
            )}
            <FieldError message={showError(audienceKey)} />
          </div>
        )}
      </FormSection>

      {/* Registration */}
      <FormSection
        title="Registration"
        hint="Ask people to register before they come."
        aside={
          <Switch
            label="Requires registration"
            on={Boolean(values.requires_registration)}
            onChange={toggleRegistration}
          />
        }
      >
        {values.requires_registration && (
          <MutedPanel>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
              <Field label={<span className="font-medium">Closes on</span>} error={showError("registration_end_date")}>
                <TextInput
                  id="registration_end_date"
                  name="registration_end_date"
                  type="date"
                  max={values.start_date}
                  value={values.registration_end_date ?? ""}
                  onChange={(event) => set("registration_end_date", event.target.value)}
                  hasError={Boolean(showError("registration_end_date"))}
                />
              </Field>
              <Field label={<span className="font-medium">Capacity</span>} error={showError("registration_capacity")}>
                <TextInput
                  id="registration_capacity"
                  name="registration_capacity"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="e.g. 100"
                  value={String(values.registration_capacity ?? "")}
                  onChange={(event) =>
                    set("registration_capacity", event.target.value === "" ? "" : Number(event.target.value))
                  }
                  hasError={Boolean(showError("registration_capacity"))}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-primary">Who can register</span>
              <Segmented
                role="radiogroup"
                ariaLabel="Who can register"
                items={[
                  { key: "MEMBERS_ONLY", label: "Members only" },
                  { key: "MEMBERS_AND_NON_MEMBERS", label: "Anyone with the link" },
                ]}
                value={values.registration_audience || "MEMBERS_ONLY"}
                onChange={(key) => set("registration_audience", key)}
                scroll
              />
            </div>
            {updating && values.public_registration_url && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-primary">Registration link</span>
                <div className="flex gap-2">
                  <TextInput readOnly value={values.public_registration_url} className="min-w-0 flex-1" />
                  <UiButton
                    onClick={() => {
                      navigator.clipboard
                        .writeText(String(values.public_registration_url))
                        .then(() => notify.success({ title: "Link copied", duration: 3000 }))
                        .catch(() =>
                          notify.error({
                            title: "Couldn't copy the link",
                            message: "Your browser blocked the clipboard. Select the link and copy it yourself.",
                          })
                        );
                    }}
                  >
                    Copy
                  </UiButton>
                </div>
              </div>
            )}
          </MutedPanel>
        )}
      </FormSection>

      {/* Reminders */}
      <FormSection
        title="Reminders"
        hint={`Sent to the audience and registrants.${seriesEdit ? " Changes apply to this date only." : ""}`}
      >
        <div role="group" aria-label="Reminders" className="flex flex-wrap gap-2">
          {REMINDER_OFFSET_OPTIONS.slice()
            .reverse()
            .map((option) => (
              <ToggleChip
                key={option.value}
                on={reminders.includes(option.value)}
                onClick={() =>
                  set(
                    "reminders",
                    reminders.includes(option.value)
                      ? reminders.filter((value) => value !== option.value)
                      : [...reminders, option.value].sort((a, b) => b - a)
                  )
                }
              >
                {option.value === 0 ? "At start" : option.label}
              </ToggleChip>
            ))}
        </div>
      </FormSection>

      {/* More details */}
      <FormSection title="Details">
        <Field label={<span className="font-medium">Description</span>}>
          <TextArea
            id="description"
            name="description"
            rows={3}
            value={values.description ?? ""}
            onChange={(event) => set("description", event.target.value)}
          />
        </Field>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-primary">Poster</span>
          <ImageUpload
            onFileChange={(file: File) => onFile(file)}
            src={String(values.poster ?? "")}
            label="Add a poster image"
          />
        </div>
        <Field label={<span className="font-medium">Time zone</span>}>
          <SelectInput
            id="timezone"
            name="timezone"
            value={values.timezone ?? "UTC"}
            onChange={(event) => set("timezone", event.target.value)}
            options={(TIMEZONES.includes(values.timezone ?? "") ? TIMEZONES : [values.timezone ?? "UTC", ...TIMEZONES]).map(
              (zone) => ({ value: zone, label: zone })
            )}
          />
        </Field>
      </FormSection>
    </>
  );
};
