import { Button } from "@/components";
import { Formik, Form, FormikProps, getIn } from "formik";
import * as Yup from "yup";
import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { FormHeader } from "@/components/ui";
import {
  Appointment,
  BookedSession,
  BookingFormValues,
  CreateAppointmentBookingPayload,
  Session,
  UpdateAppointmentBookingPayload,
} from "@/utils/api/appointment/interfaces";
import {
  BOOKING_WINDOW_DAYS,
  BookableDay,
  buildBookableDays,
  normalizeAppointmentReasons,
  normalizeBookingOptions,
  parseInputDate,
  toInputDate,
  toIntegerId,
  toStringValue,
} from "@/utils/api/appointment/bookingUtils";
import { showNotification } from "@/pages/HomePage/utils";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { cn } from "@/utils/cn";
import { useStore } from "@/store/useStore";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useAuth } from "@/context/AuthWrapper";

/* -------------------------------------------------------------------------- */
/*  Reasons                                                                   */
/* -------------------------------------------------------------------------- */

interface ReasonOption {
  key: string;
  label: string;
  description?: string | null;
}

const OTHER_REASON_KEY = "other";
const OTHER_REASON_LABEL = "Something else";

const OTHER_REASON: ReasonOption = {
  key: OTHER_REASON_KEY,
  label: OTHER_REASON_LABEL,
  description: "Tell us in your own words",
};

// Used when `appointment/reasons` fails or returns nothing, so booking never
// dead-ends. Mirrors the mobile app's built-in reasons.
const DEFAULT_REASONS: ReasonOption[] = [
  { key: "default:marriage", label: "Marriage & family" },
  { key: "default:spiritual", label: "Spiritual guidance" },
  { key: "default:ministry", label: "Ministry & serving" },
];

const matchReasonKey = (purpose: string, options: ReasonOption[]): string => {
  const normalized = purpose.trim().toLowerCase();
  if (!normalized) return "";

  const match = options.find(
    (option) => option.label.trim().toLowerCase() === normalized
  );

  return match ? match.key : OTHER_REASON_KEY;
};

/* -------------------------------------------------------------------------- */
/*  Form                                                                      */
/* -------------------------------------------------------------------------- */

const NOTE_MIN = 10;
const NOTE_MAX = 500;
const EMPTY_BOOKED_SESSIONS: BookedSession[] = [];

interface BookingFlowValues extends BookingFormValues {
  reasonKey: string;
}

const validationSchema = Yup.object({
  reasonKey: Yup.string().required("Choose what you'd like to talk about"),
  note: Yup.string()
    .trim()
    .min(NOTE_MIN, `Please write at least ${NOTE_MIN} characters`)
    .max(NOTE_MAX, `Please keep it under ${NOTE_MAX} characters`)
    .required("Please tell us a little about it"),
  staffId: Yup.string().required("Choose who you'd like to see"),
  date: Yup.string().required("Pick a date"),
  session: Yup.object({
    start: Yup.string().required(),
    end: Yup.string().required(),
  })
    .nullable()
    .required("Pick a time"),
});

const isNoteValid = (note: string) => {
  const length = note.trim().length;
  return length >= NOTE_MIN && length <= NOTE_MAX;
};

const formatLongDate = (value: string): string => {
  const date = parseInputDate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const formatMonth = (value: string): string => {
  const date = parseInputDate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const pluralTimes = (count: number) =>
  `${count} open time${count === 1 ? "" : "s"}`;

const firstOpenSession = (day?: BookableDay): Session | undefined =>
  day?.sessions.find((entry) => !entry.booked)?.session;

const groupDaysByMonth = (days: BookableDay[]) =>
  days.reduce<Array<{ month: string; days: BookableDay[] }>>((groups, day) => {
    const month = formatMonth(day.date);
    const last = groups[groups.length - 1];
    if (last && last.month === month) {
      last.days.push(day);
    } else {
      groups.push({ month, days: [day] });
    }
    return groups;
  }, []);

/* -------------------------------------------------------------------------- */
/*  Radio-group helpers (cards, staff rows, date chips, time slots)           */
/* -------------------------------------------------------------------------- */

// Arrow/Home/End move focus + selection between enabled radios in the
// nearest radiogroup, matching native radio-button keyboard behaviour.
const handleRadioKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  const forward = ["ArrowDown", "ArrowRight"];
  const backward = ["ArrowUp", "ArrowLeft"];
  if (![...forward, ...backward, "Home", "End"].includes(event.key)) return;

  const group = event.currentTarget.closest('[role="radiogroup"]');
  if (!group) return;

  const radios = Array.from(
    group.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])')
  );
  if (radios.length === 0) return;

  const index = radios.indexOf(event.currentTarget);
  let nextIndex = index;
  if (forward.includes(event.key)) nextIndex = (index + 1) % radios.length;
  if (backward.includes(event.key))
    nextIndex = (index - 1 + radios.length) % radios.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = radios.length - 1;

  event.preventDefault();
  radios[nextIndex].focus();
  radios[nextIndex].click();
};

// Roving tabindex: only the selected radio (or the first enabled one when
// nothing is selected) is in the tab order.
const radioTabIndex = (
  isSelected: boolean,
  isFirstEnabled: boolean,
  hasSelection: boolean
) => (isSelected || (!hasSelection && isFirstEnabled) ? 0 : -1);

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const FieldError = ({ id, children }: { id: string; children: ReactNode }) => (
  <p id={id} role="alert" className="text-sm text-red-600 dark:text-red-400">
    {children}
  </p>
);

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const AppointmentBookingForm = ({
  onClose,
  bookedSessions = EMPTY_BOOKED_SESSIONS,
  appointment,
  onSuccess,
}: {
  onClose: () => void;
  bookedSessions?: BookedSession[];
  appointment?: Appointment;
  onSuccess?: () => void;
}) => {
  const membersOptions = useStore((state) => state.membersOptions);
  const { user } = useAuth();
  const isEditing = Boolean(appointment);

  const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const hasMountedRef = useRef(false);
  const formikRef = useRef<FormikProps<BookingFlowValues> | null>(null);
  const reasonPrefilledRef = useRef(false);

  const membersLookup = useMemo(
    () =>
      membersOptions.reduce<Record<string, string>>((acc, option) => {
        acc[String(option.value)] = option.label;
        return acc;
      }, {}),
    [membersOptions]
  );

  // Open (protect-only) endpoint — same one the mobile app uses — so members
  // without the global "view appointments" permission still get the full
  // staff list to book against, instead of an empty "own"-scoped result.
  const { data: availabilityResponse, loading: availabilityLoading } = useFetch(
    api.fetch.fetchAppointmentBookingOptions
  );
  const { data: reasonsResponse, loading: reasonsLoading } = useFetch(
    api.fetch.fetchAppointmentReasons
  );

  const {
    data: postResponse,
    error: postError,
    loading: postLoading,
    postData,
  } = usePost(api.post.createAppointmentBooking);
  const {
    data: putResponse,
    error: putError,
    loading: putLoading,
    updateData,
  } = usePut(api.put.updateAppointmentBooking);

  const reasonOptions = useMemo<ReasonOption[]>(() => {
    const fetched = normalizeAppointmentReasons(reasonsResponse?.data)
      .filter((reason) => reason.is_active)
      .map((reason) => ({
        key: `reason:${reason.id}`,
        label: reason.label,
        description: reason.description,
      }));

    return [...(fetched.length > 0 ? fetched : DEFAULT_REASONS), OTHER_REASON];
  }, [reasonsResponse]);

  const staffAvailability = useMemo(
    () => normalizeBookingOptions(availabilityResponse?.data, membersLookup),
    [availabilityResponse, membersLookup]
  );

  const currentAppointmentSlot = useMemo(
    () =>
      appointment?.id
        ? {
            staffId: toStringValue(appointment.staffId || appointment.attendeeId),
            date: appointment.date,
            start: appointment.session?.start,
            end: appointment.session?.end,
          }
        : undefined,
    [appointment]
  );

  const bookableDaysByStaff = useMemo(() => {
    const now = new Date();
    return staffAvailability.reduce<Record<string, BookableDay[]>>(
      (acc, staff) => {
        acc[staff.staffId] = buildBookableDays(staff, {
          extraBookedSessions: bookedSessions,
          currentAppointment: currentAppointmentSlot,
          now,
        });
        return acc;
      },
      {}
    );
  }, [bookedSessions, currentAppointmentSlot, staffAvailability]);

  const [initialValues] = useState<BookingFlowValues>(() => ({
    fullName: appointment?.fullName ?? user?.name ?? "",
    email: appointment?.email ?? user?.email ?? "",
    phone: appointment?.phone ?? user?.phone ?? "",
    purpose: appointment?.purpose ?? "",
    note: appointment?.note ?? "",
    reasonKey: appointment
      ? matchReasonKey(appointment.purpose ?? "", [
          ...DEFAULT_REASONS,
          OTHER_REASON,
        ])
      : "",
    staffId: (appointment?.staffId || appointment?.attendeeId) ?? "",
    date: toInputDate(appointment?.date),
    session: appointment?.session ?? undefined,
  }));

  // Edit mode: once the real reasons arrive, re-match the stored purpose
  // against them (unless the member already picked a reason themselves).
  useEffect(() => {
    if (!appointment || reasonsLoading || reasonPrefilledRef.current) return;
    if (!reasonsResponse) return;
    const formik = formikRef.current;
    if (!formik) return;

    reasonPrefilledRef.current = true;
    if (getIn(formik.touched, "reasonKey")) return;

    formik.setFieldValue(
      "reasonKey",
      matchReasonKey(appointment.purpose ?? "", reasonOptions),
      false
    );
  }, [appointment, reasonOptions, reasonsLoading, reasonsResponse]);

  // Move focus to the new step's heading so keyboard / screen-reader users
  // land at the top of the step they just opened.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!postResponse) return;

    showNotification("Appointment booked successfully.", "success", "Appointment");
    onSuccess?.();
    onClose();
  }, [onClose, onSuccess, postResponse]);

  useEffect(() => {
    if (!putResponse) return;

    showNotification("Appointment updated successfully.", "success", "Appointment");
    onSuccess?.();
    onClose();
  }, [onClose, onSuccess, putResponse]);

  useEffect(() => {
    if (!postError) return;
    showNotification(postError.message || "Unable to book appointment.", "error");
  }, [postError]);

  useEffect(() => {
    if (!putError) return;
    showNotification(putError.message || "Unable to update appointment.", "error");
  }, [putError]);

  const purposeFor = (reasonKey: string): string => {
    if (reasonKey === OTHER_REASON_KEY) return OTHER_REASON_LABEL;
    return (
      reasonOptions.find((option) => option.key === reasonKey)?.label ??
      OTHER_REASON_LABEL
    );
  };

  const handleSubmitForm = (values: BookingFlowValues) => {
    if (!values.session) {
      showNotification("Please select a time slot.", "error", "Appointment");
      return;
    }

    const loggedInRequesterId = toIntegerId(user?.id);
    const requesterId = appointment?.id
      ? toIntegerId(appointment?.requesterId ?? user?.id)
      : loggedInRequesterId;
    const attendeeId = toIntegerId(values.staffId);
    const bookingDate = toInputDate(values.date);

    if (loggedInRequesterId === null) {
      showNotification("You must be logged in to book an appointment.", "error");
      return;
    }

    if (requesterId === null) {
      showNotification("Unable to identify requester for this booking.", "error");
      return;
    }

    if (attendeeId === null) {
      showNotification(
        "Selected staff member has an invalid id. Please choose another staff member.",
        "error"
      );
      return;
    }

    if (!bookingDate) {
      showNotification("Please select a valid appointment date.", "error");
      return;
    }

    const basePayload: CreateAppointmentBookingPayload = {
      requesterId,
      attendeeId,
      userId: attendeeId,
      staffId: attendeeId,
      date: bookingDate,
      startTime: values.session.start,
      endTime: values.session.end,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      purpose: purposeFor(values.reasonKey),
      note: values.note.trim(),
      availabilityId:
        toStringValue(values.session.availabilityId).trim() || undefined,
      sessionId: toStringValue(values.session.id).trim() || undefined,
    };

    if (appointment?.id) {
      const appointmentId = toStringValue(appointment.id).trim();

      if (!appointmentId) {
        showNotification("Unable to identify appointment to update.", "error");
        return;
      }

      const updatePayload: UpdateAppointmentBookingPayload = basePayload;
      updateData(updatePayload, { id: appointmentId });
      return;
    }

    postData(basePayload);
  };

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmitForm}
    >
      {({
        values,
        errors,
        touched,
        setFieldValue,
        setFieldTouched,
        setTouched,
        validateForm,
        submitForm,
        handleBlur,
        handleChange,
      }) => {
        const isOther = values.reasonKey === OTHER_REASON_KEY;
        const noteLength = values.note.length;
        const step1Valid = Boolean(values.reasonKey) && isNoteValid(values.note);

        const noteError =
          getIn(touched, "note") && typeof errors.note === "string"
            ? errors.note
            : "";
        const reasonError =
          getIn(touched, "reasonKey") && typeof errors.reasonKey === "string"
            ? errors.reasonKey
            : "";
        const staffError =
          getIn(touched, "staffId") && typeof errors.staffId === "string"
            ? errors.staffId
            : "";
        const dateError =
          getIn(touched, "date") && typeof errors.date === "string"
            ? errors.date
            : "";
        const rawSessionError = getIn(errors, "session");
        const sessionError =
          getIn(touched, "session") && typeof rawSessionError === "string"
            ? rawSessionError
            : "";

        const selectedStaff = staffAvailability.find(
          (staff) => staff.staffId === values.staffId
        );
        const days = bookableDaysByStaff[values.staffId] ?? [];
        const selectedDay = days.find((day) => day.date === values.date);
        const monthGroups = groupDaysByMonth(days);

        const isOriginalSlot =
          Boolean(currentAppointmentSlot) &&
          currentAppointmentSlot?.staffId === values.staffId &&
          toInputDate(currentAppointmentSlot?.date) ===
            toInputDate(values.date) &&
          currentAppointmentSlot?.start === values.session?.start;
        const selectionOutsideWindow =
          Boolean(values.date) && !selectedDay && isOriginalSlot;

        const staffName =
          selectedStaff?.staffName ||
          appointment?.staffName ||
          appointment?.attendeeName ||
          "";
        const summary =
          values.date && values.session && staffName
            ? `${formatLongDate(values.date)} · ${values.session.start} with ${staffName}`
            : "";

        const handleReasonSelect = (key: string) => {
          setFieldValue("reasonKey", key);
          setFieldTouched("reasonKey", true, false);
        };

        const handleContinue = () => {
          if (!step1Valid) {
            setTouched({ ...touched, reasonKey: true, note: true });
            return;
          }
          setStep(2);
        };

        const handleStaffSelect = (staffId: string) => {
          if (staffId === values.staffId) return;

          const staffDays = bookableDaysByStaff[staffId] ?? [];
          const firstDay = staffDays[0];

          setFieldValue("staffId", staffId);
          setFieldValue("date", firstDay?.date ?? "");
          setFieldValue("session", firstOpenSession(firstDay));
          setFieldTouched("staffId", true, false);
          setFieldTouched("date", false, false);
          setFieldTouched("session", false, false);
        };

        const handleDateSelect = (day: BookableDay) => {
          if (day.date === values.date) return;

          // Keep the chosen time if it's also open on the new date.
          const sameTime = day.sessions.find(
            (entry) =>
              !entry.booked &&
              entry.session.start === values.session?.start &&
              entry.session.end === values.session?.end
          );

          setFieldValue("date", day.date);
          setFieldValue("session", sameTime?.session ?? firstOpenSession(day));
          setFieldTouched("date", true, false);
        };

        const handleSessionSelect = (session: Session) => {
          setFieldValue("session", session);
          setFieldTouched("session", true, false);
        };

        const attemptSubmit = async () => {
          const validation = await validateForm();
          if (validation.reasonKey || validation.note) {
            setTouched({ ...touched, reasonKey: true, note: true });
            setStep(1);
            return;
          }
          submitForm();
        };

        const firstEnabledStaffId = staffAvailability.find(
          (staff) => (bookableDaysByStaff[staff.staffId] ?? []).length > 0
        )?.staffId;
        const firstEnabledSessionKey = selectedDay?.sessions.find(
          (entry) => !entry.booked
        );

        return (
          <Form className="flex h-[80vh] flex-col overflow-hidden" noValidate>
            <div className="sticky top-0 z-10">
              <FormHeader>
                <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                  Step {step} of 2
                </p>
                <p className="text-lg font-semibold">
                  {isEditing ? "Edit appointment" : "Book an appointment"}
                </p>
              </FormHeader>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {step === 1 ? (
                <>
                  <div className="space-y-1">
                    <h2
                      id="booking-step-1-title"
                      ref={stepHeadingRef}
                      tabIndex={-1}
                      className="text-xl font-semibold text-primary focus:outline-none"
                    >
                      What would you like to talk about?
                    </h2>
                    <p className="text-sm text-primaryGray">
                      This helps us prepare. Everything you share stays
                      confidential.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div
                      role="radiogroup"
                      aria-labelledby="booking-step-1-title"
                      aria-required="true"
                      aria-invalid={Boolean(reasonError)}
                      aria-describedby={reasonError ? "reason-error" : undefined}
                      aria-busy={reasonsLoading}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    >
                      {reasonOptions.map((option, index) => {
                        const isSelected = values.reasonKey === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={radioTabIndex(
                              isSelected,
                              index === 0,
                              Boolean(values.reasonKey)
                            )}
                            onClick={() => handleReasonSelect(option.key)}
                            onKeyDown={handleRadioKeyDown}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                              focusRing,
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-lightGray bg-white hover:border-primary/40 hover:bg-lightGray/20"
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-primary">
                                {option.label}
                              </span>
                              {option.description ? (
                                <span className="mt-0.5 block text-sm text-primaryGray">
                                  {option.description}
                                </span>
                              ) : null}
                            </span>
                            <span
                              aria-hidden="true"
                              className={cn(
                                "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border",
                                isSelected
                                  ? "border-primary"
                                  : "border-lightGray"
                              )}
                            >
                              {isSelected && (
                                <CheckCircleIcon className="h-5 w-5 text-primary" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {reasonError && (
                      <FieldError id="reason-error">{reasonError}</FieldError>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="booking-note"
                      className="block text-sm font-medium text-primary"
                    >
                      {isOther
                        ? "Tell us in your own words"
                        : "What would you like to discuss?"}{" "}
                      <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="booking-note"
                      name="note"
                      rows={4}
                      maxLength={NOTE_MAX}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(noteError)}
                      aria-describedby={cn(
                        "booking-note-help booking-note-count",
                        noteError && "booking-note-error"
                      )}
                      placeholder={
                        isOther
                          ? "What would you like to talk about?"
                          : "A sentence or two helps your pastor prepare."
                      }
                      value={values.note}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={cn(
                        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-primary placeholder:text-primaryGray/70",
                        focusRing,
                        noteError ? "border-red-500" : "border-lightGray"
                      )}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <p
                        id="booking-note-help"
                        className="text-xs text-primaryGray"
                      >
                        Only the person you meet will see this.
                      </p>
                      <p
                        id="booking-note-count"
                        aria-live="polite"
                        className={cn(
                          "flex-shrink-0 text-xs",
                          noteLength >= NOTE_MAX
                            ? "text-red-600"
                            : "text-primaryGray"
                        )}
                      >
                        {noteLength}/{NOTE_MAX}
                      </p>
                    </div>
                    {noteError && (
                      <FieldError id="booking-note-error">{noteError}</FieldError>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h2
                      ref={stepHeadingRef}
                      tabIndex={-1}
                      className="text-xl font-semibold text-primary focus:outline-none"
                    >
                      Choose a time
                    </h2>
                    {(values.fullName || values.email) && (
                      <p className="text-sm text-primaryGray">
                        Booking as{" "}
                        <span className="font-medium text-primary">
                          {values.fullName || "you"}
                        </span>
                        {values.email ? ` · ${values.email}` : ""}
                      </p>
                    )}
                  </div>

                  {/* Who you'll see */}
                  <section className="space-y-2" aria-labelledby="booking-staff-title">
                    <h3
                      id="booking-staff-title"
                      className="text-base font-semibold text-primary"
                    >
                      Who you'll see
                    </h3>

                    {availabilityLoading && staffAvailability.length === 0 ? (
                      <div className="space-y-2" aria-busy="true">
                        <span className="sr-only">Loading who's available…</span>
                        {[0, 1, 2].map((key) => (
                          <div
                            key={key}
                            className="h-16 animate-pulse rounded-xl bg-lightGray/40"
                          />
                        ))}
                      </div>
                    ) : staffAvailability.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-lightGray p-4 text-sm text-primaryGray">
                        No one is taking appointments right now. Please check
                        back later.
                      </p>
                    ) : (
                      <div
                        role="radiogroup"
                        aria-labelledby="booking-staff-title"
                        aria-required="true"
                        aria-invalid={Boolean(staffError)}
                        aria-describedby={staffError ? "staff-error" : undefined}
                        className="space-y-2"
                      >
                        {staffAvailability.map((staff) => {
                          const staffDays =
                            bookableDaysByStaff[staff.staffId] ?? [];
                          const openTimes = staffDays.reduce(
                            (total, day) => total + day.openCount,
                            0
                          );
                          const isDisabled = openTimes === 0;
                          const isSelected = values.staffId === staff.staffId;

                          return (
                            <button
                              key={staff.staffId}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              disabled={isDisabled}
                              aria-disabled={isDisabled}
                              tabIndex={
                                isDisabled
                                  ? -1
                                  : radioTabIndex(
                                      isSelected,
                                      staff.staffId === firstEnabledStaffId,
                                      Boolean(
                                        values.staffId &&
                                          (bookableDaysByStaff[values.staffId] ?? [])
                                            .length > 0
                                      )
                                    )
                              }
                              onClick={() => handleStaffSelect(staff.staffId)}
                              onKeyDown={handleRadioKeyDown}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                                focusRing,
                                isDisabled
                                  ? "cursor-not-allowed border-lightGray bg-lightGray/20 opacity-70"
                                  : isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-lightGray bg-white hover:border-primary/40 hover:bg-lightGray/20"
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                              >
                                {staff.staffName
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0]?.toUpperCase())
                                  .join("")}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-primary">
                                  {staff.staffName}
                                </span>
                                {staff.position ? (
                                  <span className="block truncate text-sm text-primaryGray">
                                    {staff.position}
                                  </span>
                                ) : null}
                                <span
                                  className={cn(
                                    "block text-xs",
                                    isDisabled
                                      ? "text-primaryGray"
                                      : "text-primary/80"
                                  )}
                                >
                                  {isDisabled
                                    ? "No open times"
                                    : `${pluralTimes(openTimes)} in the next 4 weeks`}
                                </span>
                              </span>
                              {isSelected && (
                                <CheckCircleIcon
                                  aria-hidden="true"
                                  className="h-5 w-5 flex-shrink-0 text-primary"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {staffError && (
                      <FieldError id="staff-error">{staffError}</FieldError>
                    )}
                  </section>

                  {/* Pick a time */}
                  <section className="space-y-3" aria-labelledby="booking-time-title">
                    <h3
                      id="booking-time-title"
                      className="text-base font-semibold text-primary"
                    >
                      Pick a time
                    </h3>

                    {!values.staffId ? (
                      <p className="text-sm text-primaryGray">
                        Choose who you'd like to see to view their open times.
                      </p>
                    ) : days.length === 0 ? (
                      <p className="text-sm text-primaryGray">
                        {selectedStaff?.staffName || "This person"} has no open
                        times in the next {BOOKING_WINDOW_DAYS / 7} weeks.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <p
                            id="booking-date-title"
                            className="text-sm font-medium text-primary"
                          >
                            Date
                          </p>
                          <div
                            role="radiogroup"
                            aria-labelledby="booking-date-title"
                            aria-required="true"
                            aria-invalid={Boolean(dateError)}
                            aria-describedby={dateError ? "date-error" : undefined}
                            className="space-y-3"
                          >
                            {monthGroups.map((group) => (
                              <div key={group.month} className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primaryGray">
                                  {group.month}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {group.days.map((day) => {
                                    const date = parseInputDate(day.date);
                                    const isSelected = values.date === day.date;
                                    return (
                                      <button
                                        key={day.date}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        aria-label={`${formatLongDate(day.date)}, ${pluralTimes(day.openCount)}`}
                                        tabIndex={radioTabIndex(
                                          isSelected,
                                          day.date === days[0].date,
                                          Boolean(selectedDay)
                                        )}
                                        onClick={() => handleDateSelect(day)}
                                        onKeyDown={handleRadioKeyDown}
                                        className={cn(
                                          "flex w-16 flex-col items-center rounded-xl border px-2 py-2 transition-colors",
                                          focusRing,
                                          isSelected
                                            ? "border-primary bg-primary text-white"
                                            : "border-lightGray bg-white text-primary hover:border-primary/40"
                                        )}
                                      >
                                        <span className="text-[11px] font-medium uppercase">
                                          {date?.toLocaleDateString("en-US", {
                                            weekday: "short",
                                          })}
                                        </span>
                                        <span className="text-lg font-semibold leading-6">
                                          {date?.getDate()}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                          {dateError && (
                            <FieldError id="date-error">{dateError}</FieldError>
                          )}
                        </div>

                        {selectionOutsideWindow && values.session && (
                          <p className="rounded-lg bg-lightGray/30 p-3 text-sm text-primaryGray">
                            Currently booked for{" "}
                            <span className="font-medium text-primary">
                              {formatLongDate(values.date)} · {values.session.start}
                            </span>
                            . Pick a date above to move it.
                          </p>
                        )}

                        {selectedDay && (
                          <div className="space-y-1">
                            <p
                              id="booking-session-title"
                              className="text-sm font-medium text-primary"
                            >
                              Time on {formatLongDate(selectedDay.date)}
                            </p>
                            <div
                              role="radiogroup"
                              aria-labelledby="booking-session-title"
                              aria-required="true"
                              aria-invalid={Boolean(sessionError)}
                              aria-describedby={
                                sessionError ? "session-error" : undefined
                              }
                              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                            >
                              {selectedDay.sessions.map(({ session, booked }) => {
                                const isSelected =
                                  values.session?.start === session.start &&
                                  values.session?.end === session.end;
                                const hasSelection = selectedDay.sessions.some(
                                  (entry) =>
                                    !entry.booked &&
                                    entry.session.start === values.session?.start &&
                                    entry.session.end === values.session?.end
                                );

                                return (
                                  <button
                                    key={`${session.start}-${session.end}`}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected && !booked}
                                    disabled={booked}
                                    aria-disabled={booked}
                                    aria-label={`${session.start} to ${session.end}${booked ? ", booked" : ""}`}
                                    tabIndex={
                                      booked
                                        ? -1
                                        : radioTabIndex(
                                            isSelected,
                                            firstEnabledSessionKey?.session === session,
                                            hasSelection
                                          )
                                    }
                                    onClick={() => handleSessionSelect(session)}
                                    onKeyDown={handleRadioKeyDown}
                                    className={cn(
                                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                                      focusRing,
                                      booked
                                        ? "cursor-not-allowed border-lightGray bg-lightGray/30 text-primaryGray line-through"
                                        : isSelected
                                        ? "border-primary bg-primary text-white"
                                        : "border-lightGray bg-white text-primary hover:border-primary/40"
                                    )}
                                  >
                                    {session.start}
                                  </button>
                                );
                              })}
                            </div>
                            {sessionError && (
                              <FieldError id="session-error">
                                {sessionError}
                              </FieldError>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="sticky bottom-0 space-y-3 border-t bg-white px-6 py-4">
              {step === 2 && summary && (
                <p className="text-sm text-primary" aria-live="polite">
                  <span className="font-medium">{summary}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {step === 2 && (
                    <Button
                      value="Back"
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(1)}
                    />
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    value="Cancel"
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                  />
                  {step === 1 ? (
                    <Button
                      value="Continue"
                      type="button"
                      variant="primary"
                      disabled={!step1Valid}
                      onClick={handleContinue}
                    />
                  ) : (
                    <Button
                      value={isEditing ? "Update appointment" : "Book appointment"}
                      type="button"
                      variant="primary"
                      onClick={attemptSubmit}
                      loading={postLoading || putLoading}
                      disabled={postLoading || putLoading}
                    />
                  )}
                </div>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default AppointmentBookingForm;
