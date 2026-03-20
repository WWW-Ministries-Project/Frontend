import { Button } from "@/components";
import { FormikInputDiv } from "@/components/FormikInputDiv";
import FormikSelectField from "@/components/FormikSelect";
import { useFetch } from "@/CustomHooks/useFetch";
import { maxMinValueForDate } from "@/pages/HomePage/utils";
import { api, EventType } from "@/utils";
import clsx from "clsx";
import { Field, Form, Formik, getIn } from "formik";
import React, { useEffect, useMemo } from "react";
import {
  formatInputDate,
  getChangedValues,
} from "../../../../../utils/helperFunctions";
import {
  eventFormValidator,
  eventUpdateFormValidator,
} from "../utils/eventHelpers";

interface EventsFormValues {
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
  location?: string;
  requires_registration?: boolean;
  registration_end_date?: string;
  registration_capacity?: number | string;
  registration_audience?: "MEMBERS_ONLY" | "MEMBERS_AND_NON_MEMBERS";
  public_registration_url?: string | null;
  [key: string]: unknown;
}

interface EventsFormProps {
  inputValue: EventsFormValues;
  onSubmit: (val: EventsFormValues) => void;
  loading?: boolean;
  updating?: boolean;
}

const WEEKDAY_OPTIONS = [
  { label: "Monday", short: "Mon", value: 1 },
  { label: "Tuesday", short: "Tue", value: 2 },
  { label: "Wednesday", short: "Wed", value: 3 },
  { label: "Thursday", short: "Thu", value: 4 },
  { label: "Friday", short: "Fri", value: 5 },
  { label: "Saturday", short: "Sat", value: 6 },
  { label: "Sunday", short: "Sun", value: 0 },
] as const;

const WEEKDAY_ORDER = WEEKDAY_OPTIONS.map((day) => day.value);

const isValidWeekDay = (day: number) =>
  Number.isInteger(day) && day >= 0 && day <= 6;

const normalizeRecurringDays = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map((day) => Number(day)).filter(isValidWeekDay))
    ).sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
  }

  if (typeof value === "number" && isValidWeekDay(value)) {
    return [value];
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmedValue);
      if (Array.isArray(parsed)) {
        return normalizeRecurringDays(parsed);
      }
    } catch {
      const csvValues = trimmedValue.split(",").map((item) => item.trim());
      return normalizeRecurringDays(csvValues);
    }
  }

  return [];
};

const addDaysToDateInput = (value: string, days: number) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const inferDayEvent = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return "one";

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (
    Number.isNaN(parsedStartDate.getTime()) ||
    Number.isNaN(parsedEndDate.getTime())
  ) {
    return "one";
  }

  return parsedEndDate > parsedStartDate ? "multi" : "one";
};

const RegistrationDefaultsSync = ({
  form,
}: {
  form: any;
  updating?: boolean;
}) => {
  const { setFieldValue, values } = form;

  useEffect(() => {
    const startDate = String(values.start_date || "");
    if (!startDate) return;

    if (values.day_event === "multi") {
      const nextDay = addDaysToDateInput(startDate, 1);
      if (
        !values.end_date ||
        new Date(String(values.end_date)) <= new Date(startDate)
      ) {
        setFieldValue("end_date", nextDay, false);
      }
      return;
    }

    if (values.end_date !== startDate) {
      setFieldValue("end_date", startDate, false);
    }
  }, [setFieldValue, values.day_event, values.end_date, values.start_date]);

  useEffect(() => {
    const startDate = String(values.start_date || "");
    if (!startDate) return;

    if (values.repetitive === "yes") {
      if (!values.recurrence_end_date) {
        setFieldValue("recurrence_end_date", startDate, false);
      }
      return;
    }

    if (values.recurrence_end_date) {
      setFieldValue("recurrence_end_date", "", false);
    }
  }, [
    setFieldValue,
    values.recurrence_end_date,
    values.repetitive,
    values.start_date,
  ]);

  useEffect(() => {
    const startDate = String(values.start_date || "");
    if (!startDate) return;

    if (values.requires_registration) {
      if (!values.registration_end_date) {
        setFieldValue("registration_end_date", startDate, false);
      }
      return;
    }

    if (
      values.registration_end_date ||
      values.registration_capacity ||
      values.registration_audience !== "MEMBERS_AND_NON_MEMBERS"
    ) {
      setFieldValue("registration_end_date", "", false);
      setFieldValue("registration_capacity", "", false);
      setFieldValue(
        "registration_audience",
        "MEMBERS_AND_NON_MEMBERS",
        false
      );
    }
  }, [
    setFieldValue,
    values.registration_audience,
    values.registration_capacity,
    values.registration_end_date,
    values.requires_registration,
    values.start_date,
  ]);

  useEffect(() => {
    if (
      values.day_event === "multi" &&
      Array.isArray(values.recurring?.daysOfWeek) &&
      values.recurring.daysOfWeek.length > 0
    ) {
      setFieldValue("recurring.daysOfWeek", [], false);
    }
  }, [setFieldValue, values.day_event, values.recurring?.daysOfWeek]);

  return null;
};

const EventsScheduleForm: React.FC<EventsFormProps> = (props) => {
  const { data: eventsData } = useFetch(api.fetch.fetchAllUniqueEvents);
  const eventOptions = useMemo(
    () =>
      eventsData?.data?.map((event: EventType) => ({
        label: event.event_name,
        value: event.id,
        description: event.event_description,
        eventType: event.event_type,
      })) || [],
    [eventsData?.data]
  );

  const resolvedEventNameId = useMemo(() => {
    if (
      props.inputValue.event_name_id !== undefined &&
      props.inputValue.event_name_id !== null &&
      String(props.inputValue.event_name_id).trim() !== ""
    ) {
      return props.inputValue.event_name_id;
    }

    const eventName = String(
      props.inputValue.event_name || props.inputValue.name || ""
    )
      .trim()
      .toLowerCase();

    if (!eventName) return "";

    const matchedEvent = eventOptions.find(
      (event) => event.label.trim().toLowerCase() === eventName
    );

    return matchedEvent?.value ?? "";
  }, [
    eventOptions,
    props.inputValue.event_name,
    props.inputValue.event_name_id,
    props.inputValue.name,
  ]);

  const normalizedInitialValues = useMemo(
    () => ({
      ...props.inputValue,
      event_name_id: resolvedEventNameId,
      start_date: props.inputValue.start_date
        ? formatInputDate(String(props.inputValue.start_date)) ?? ""
        : "",
      end_date: props.inputValue.end_date
        ? formatInputDate(String(props.inputValue.end_date)) ?? ""
        : "",
      recurrence_end_date: props.inputValue.recurrence_end_date
        ? formatInputDate(String(props.inputValue.recurrence_end_date)) ?? ""
        : "",
      start_time: String(props.inputValue.start_time || "").slice(0, 5),
      end_time: String(props.inputValue.end_time || "").slice(0, 5),
      day_event: String(
        props.inputValue.day_event ||
          inferDayEvent(
            props.inputValue.start_date ? String(props.inputValue.start_date) : "",
            props.inputValue.end_date ? String(props.inputValue.end_date) : ""
          ) ||
          "one"
      ),
      repetitive:
        String(props.inputValue.repetitive || "no").toLowerCase() === "yes"
          ? "yes"
          : "no",
      requires_registration:
        props.inputValue.requires_registration === true ||
        String(props.inputValue.requires_registration).toLowerCase() === "true",
      registration_end_date: props.inputValue.registration_end_date
        ? formatInputDate(String(props.inputValue.registration_end_date)) ?? ""
        : "",
      registration_capacity:
        props.inputValue.registration_capacity !== undefined &&
        props.inputValue.registration_capacity !== null &&
        String(props.inputValue.registration_capacity).trim() !== ""
          ? Number(props.inputValue.registration_capacity)
          : "",
      registration_audience:
        String(props.inputValue.registration_audience || "MEMBERS_AND_NON_MEMBERS")
          .toUpperCase() === "MEMBERS_ONLY"
          ? "MEMBERS_ONLY"
          : "MEMBERS_AND_NON_MEMBERS",
      recurring: {
        interval:
          props.inputValue.recurring?.interval !== undefined &&
          props.inputValue.recurring?.interval !== null &&
          String(props.inputValue.recurring?.interval).trim() !== ""
            ? Number(props.inputValue.recurring?.interval)
            : 1,
        frequency: String(props.inputValue.recurring?.frequency || "weekly"),
        daysOfWeek: normalizeRecurringDays(
          props.inputValue.recurring?.daysOfWeek
        ),
      },
    }),
    [props.inputValue, resolvedEventNameId]
  );

  return (
    <Formik<EventsFormValues>
      onSubmit={(val) => {
        const parsedDays = normalizeRecurringDays(val.recurring?.daysOfWeek);
        const isMultiDay = val.day_event === "multi";
        const isRecurring = val.repetitive === "yes";
        const normalizedEndDate = isMultiDay
          ? val.end_date || addDaysToDateInput(String(val.start_date || ""), 1)
          : val.start_date || "";

        const preparedValues: EventsFormValues = {
          ...val,
          end_date: normalizedEndDate,
          recurrence_end_date: isRecurring ? val.recurrence_end_date : "",
          recurring: isRecurring
            ? {
                interval:
                  val.recurring?.interval !== undefined &&
                  val.recurring?.interval !== null
                    ? Number(val.recurring.interval)
                    : undefined,
                frequency: val.recurring?.frequency,
                ...(isMultiDay ||
                val.recurring?.frequency !== "weekly"
                  ? {}
                  : {
                      daysOfWeek: parsedDays,
                    }),
              }
            : undefined,
          requires_registration: Boolean(val.requires_registration),
          registration_end_date: val.requires_registration
            ? val.registration_end_date
            : "",
          registration_capacity: val.requires_registration
            ? val.registration_capacity
            : "",
          registration_audience: val.requires_registration
            ? val.registration_audience
            : "MEMBERS_AND_NON_MEMBERS",
        };

        const changedValues = props.updating
          ? getChangedValues(normalizedInitialValues, preparedValues)
          : preparedValues;
        props.onSubmit(changedValues);
      }}
      initialValues={normalizedInitialValues}
      enableReinitialize
      validationSchema={
        props.updating ? eventUpdateFormValidator : eventFormValidator
      }
    >
      {(form) => (
        <Form className="mt-4 flex w-full flex-col gap-6">
          <RegistrationDefaultsSync form={form} updating={props.updating} />
          <section className="rounded-xl border border-lightGray bg-white p-5 md:p-6">
            <div className="mb-4 space-y-1">
              <h2 className="H400 text-primary">Event Information</h2>
              <p className="text-sma text-primaryGray">
                Pick the event and review details before scheduling.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                component={FormikSelectField}
                options={eventOptions}
                label="Event Name"
                id="event_name_id"
                name="event_name_id"
                onChange={(name: string, value: string | number) => {
                  form.setFieldValue(name, value);
                  const selectedEvent = eventOptions.find(
                    (event) => String(event.value) === String(value)
                  );
                  form.setFieldValue("description", selectedEvent?.description || "");
                  form.setFieldValue("event_type", selectedEvent?.eventType || "");
                }}
                value={form.values.event_name_id}
              />
              <Field
                component={FormikInputDiv}
                label="Event Type"
                id="event_type"
                name="event_type"
                type="text"
                disabled
                value={form.values.event_type}
              />
            </div>
            <div className="mt-4">
              <Field
                component={FormikInputDiv}
                label="Event Description"
                id="description"
                name="description"
                type="textarea"
                inputClass="!min-h-[150px] resize-none"
                value={form.values.description}
              />
            </div>
          </section>

          <section className="rounded-xl border border-lightGray bg-white p-5 md:p-6">
            <div className="mb-4 space-y-1">
              <h2 className="H400 text-primary">Date and Time</h2>
              <p className="text-sma text-primaryGray">
                Configure when this event starts and ends.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                component={FormikInputDiv}
                label="Start Date"
                type="date"
                id="start_date"
                name="start_date"
                value={form.values.start_date}
              />
              <Field
                component={FormikInputDiv}
                label="Start Time"
                type="time"
                id="start_time"
                name="start_time"
                value={form.values.start_time}
              />
              <Field
                component={FormikInputDiv}
                label="End Time"
                type="time"
                id="end_time"
                name="end_time"
                value={form.values.end_time}
              />
            </div>

            <div className="mt-6 space-y-5">
              {!props.updating && (
                <>
                  <div>
                    <p className="text-sm font-medium text-primary">Event Duration</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "One-day Event",
                          value: "one",
                          description: "Ends the same day it starts.",
                        },
                        {
                          label: "Multi-day Event",
                          value: "multi",
                          description: "Runs across consecutive dates.",
                        },
                      ].map((option) => {
                        const isActive = form.values.day_event === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              form.setFieldValue("day_event", option.value);
                              if (option.value === "one") {
                                form.setFieldValue(
                                  "end_date",
                                  form.values.start_date || "",
                                  false
                                );
                                form.setFieldValue("recurring.daysOfWeek", [], false);
                                return;
                              }

                              form.setFieldValue(
                                "end_date",
                                addDaysToDateInput(
                                  String(form.values.start_date || ""),
                                  1
                                ),
                                false
                              );
                            }}
                            className={clsx(
                              "rounded-lg border px-4 py-3 text-left transition-colors",
                              isActive
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-lightGray text-primaryGray hover:border-primary/40 hover:bg-primary/5"
                            )}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="mt-1 text-xs">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                    {getIn(form.touched, "day_event") && getIn(form.errors, "day_event") && (
                      <p className="mt-2 text-sma text-error">
                        {String(getIn(form.errors, "day_event"))}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-primary">
                      Is this event repetitive?
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label: "Yes, repeat event",
                          value: "yes",
                          description: "Use a recurrence end date for the final occurrence.",
                        },
                        {
                          label: "No, one schedule",
                          value: "no",
                          description: "Create a single event schedule.",
                        },
                      ].map((option) => {
                        const isActive = form.values.repetitive === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              form.setFieldValue("repetitive", option.value);
                              if (option.value === "yes") {
                                form.setFieldValue(
                                  "recurring.interval",
                                  form.values.recurring?.interval || 1,
                                  false
                                );
                                form.setFieldValue(
                                  "recurring.frequency",
                                  form.values.recurring?.frequency || "weekly",
                                  false
                                );
                                return;
                              }

                              form.setFieldValue("recurrence_end_date", "", false);
                              form.setFieldValue("recurring.daysOfWeek", [], false);
                            }}
                            className={clsx(
                              "rounded-lg border px-4 py-3 text-left transition-colors",
                              isActive
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-lightGray text-primaryGray hover:border-primary/40 hover:bg-primary/5"
                            )}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="mt-1 text-xs">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {form.values.day_event === "multi" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    component={FormikInputDiv}
                    label="Event End Date"
                    type="date"
                    id="end_date"
                    name="end_date"
                    min={form.values.start_date || maxMinValueForDate().minDate}
                    max={maxMinValueForDate().maxDate}
                    value={form.values.end_date}
                  />
                </div>
              )}

              {!props.updating && form.values.repetitive === "yes" && (
                <div className="space-y-4 rounded-lg border border-lightGray/90 bg-gray-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      component={FormikInputDiv}
                      label="Repeat Every"
                      type="number"
                      id="recurring.interval"
                      name="recurring.interval"
                      min="1"
                    />
                    <Field
                      component={FormikSelectField}
                      label="Repeat Unit"
                      id="recurring.frequency"
                      name="recurring.frequency"
                      options={[
                        { label: "Day(s)", value: "daily" },
                        { label: "Week(s)", value: "weekly" },
                        { label: "Month(s)", value: "monthly" },
                      ]}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      component={FormikInputDiv}
                      label="Recurrence End Date"
                      type="date"
                      id="recurrence_end_date"
                      name="recurrence_end_date"
                      min={form.values.start_date || maxMinValueForDate().minDate}
                      max={maxMinValueForDate().maxDate}
                      value={form.values.recurrence_end_date}
                    />
                  </div>

                  {form.values.day_event !== "multi" &&
                    form.values.recurring?.frequency === "weekly" && (
                      <div>
                        <p className="text-sm font-medium text-primary">Recurs On</p>
                        <p className="mt-1 text-xs text-primaryGray">
                          Select the weekday(s) for each weekly occurrence.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                          {WEEKDAY_OPTIONS.map((day) => {
                            const selectedDays = normalizeRecurringDays(
                              form.values.recurring?.daysOfWeek
                            );
                            const isSelected = selectedDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                aria-pressed={isSelected}
                                title={day.label}
                                onClick={() => {
                                  const updatedDays = isSelected
                                    ? selectedDays.filter(
                                        (currentDay) => currentDay !== day.value
                                      )
                                    : [...selectedDays, day.value].sort(
                                        (a, b) =>
                                          WEEKDAY_ORDER.indexOf(a) -
                                          WEEKDAY_ORDER.indexOf(b)
                                      );
                                  form.setFieldValue(
                                    "recurring.daysOfWeek",
                                    updatedDays
                                  );
                                  form.setFieldTouched(
                                    "recurring.daysOfWeek",
                                    true,
                                    false
                                  );
                                }}
                                className={clsx(
                                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary text-white"
                                    : "border-lightGray bg-white text-primary hover:border-primary/40 hover:bg-primary/5"
                                )}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                        {((getIn(form.touched, "recurring.daysOfWeek") as boolean) ||
                          form.submitCount > 0) &&
                          getIn(form.errors, "recurring.daysOfWeek") && (
                            <p className="mt-2 text-sma text-error">
                              {String(getIn(form.errors, "recurring.daysOfWeek"))}
                            </p>
                          )}
                      </div>
                    )}

                  {form.values.day_event === "multi" && (
                    <p className="text-xs text-primaryGray">
                      Multi-day recurrences reuse the event start date pattern and
                      keep the same duration for every occurrence.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-lightGray bg-white p-5 md:p-6">
            <div className="mb-4 space-y-1">
              <h2 className="H400 text-primary">Registration</h2>
              <p className="text-sma text-primaryGray">
                Decide whether attendees must register before the event.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-primary">
                  Does this event require registration?
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "No registration",
                      value: false,
                      description: "Attendees do not need to register first.",
                    },
                    {
                      label: "Registration required",
                      value: true,
                      description: "Set the registration closing date and audience.",
                    },
                  ].map((option) => {
                    const isActive =
                      Boolean(form.values.requires_registration) === option.value;
                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() =>
                          form.setFieldValue(
                            "requires_registration",
                            option.value
                          )
                        }
                        className={clsx(
                          "rounded-lg border px-4 py-3 text-left transition-colors",
                          isActive
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-lightGray text-primaryGray hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="mt-1 text-xs">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.values.requires_registration && (
                <div className="space-y-4 rounded-lg border border-lightGray/90 bg-gray-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      component={FormikInputDiv}
                      label="Registration End Date"
                      type="date"
                      id="registration_end_date"
                      name="registration_end_date"
                      min={maxMinValueForDate().minDate}
                      max={form.values.start_date || maxMinValueForDate().maxDate}
                      value={form.values.registration_end_date}
                    />
                    <Field
                      component={FormikInputDiv}
                      label="Expected Capacity"
                      type="number"
                      id="registration_capacity"
                      name="registration_capacity"
                      min="1"
                    />
                  </div>

                  <Field
                    component={FormikSelectField}
                    label="Who Can Register?"
                    id="registration_audience"
                    name="registration_audience"
                    options={[
                      {
                        label: "Members & Non-members",
                        value: "MEMBERS_AND_NON_MEMBERS",
                      },
                      {
                        label: "Members Only",
                        value: "MEMBERS_ONLY",
                      },
                    ]}
                  />

                  {props.updating && form.values.public_registration_url && (
                    <Field
                      component={FormikInputDiv}
                      label="Public Registration URL"
                      type="text"
                      id="public_registration_url"
                      name="public_registration_url"
                      disabled
                      value={String(form.values.public_registration_url || "")}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-lightGray bg-white p-5 md:p-6">
            <div className="mb-4 space-y-1">
              <h2 className="H400 text-primary">Other Information</h2>
              <p className="text-sma text-primaryGray">
                Add optional location details for this event.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                component={FormikInputDiv}
                label="Location"
                type="text"
                id="location"
                name="location"
                value={form.values.location}
              />
            </div>
          </section>

          <div className="sticky bottom-0 z-10 border-t border-lightGray bg-white/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex justify-end gap-3">
              <Button
                value="Cancel"
                variant="secondary"
                onClick={() => window.history.back()}
              />
              <Button
                value={props.updating ? "Update Event" : "Schedule Event"}
                type="submit"
                variant="primary"
                loading={props.loading}
                disabled={Boolean(props.loading) || form.isSubmitting}
              />
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default EventsScheduleForm;
