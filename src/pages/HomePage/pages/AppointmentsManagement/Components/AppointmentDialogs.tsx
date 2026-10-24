import { useMemo, useState } from "react";

import { describeError, notify } from "@/components/feedback";
import { useFetch } from "@/CustomHooks/useFetch";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import type { AppointmentReason, DayOfWeek } from "@/utils/api/appointment/interfaces";

import { CommDialog, FieldGrid, FieldHint, FullRow } from "../../ChurchCommunication/ui/commUi";
import { Field, SelectInput, TextArea, TextInput } from "../../MembershipManagement/components/membershipUi";
import {
  type ApptBooking,
  type ApptSlot,
  type ApptStaff,
  DECLINE_REASONS,
  DOWF,
  OPEN_STATUSES,
  WEEK_ORDER,
  buildSessions,
  dayNameOf,
  firstName,
  fmtD,
  fmtDL,
  freeSlots,
  fromMin,
  plural,
  t12,
  toMin,
} from "../utils/appointmentModel";
import type { AppointmentsData } from "../utils/useAppointmentsData";
import { MemberPicker, SlotPicker } from "./appointmentUi";

const errorMessage = (error: unknown) => describeError(error, { preferServerMessage: true }).message;

/* -------------------------------------------------------------------------- */
/*                               Suggest a time                               */
/* -------------------------------------------------------------------------- */

export const SuggestTimeDialog = ({
  booking,
  data,
  onClose,
}: {
  booking: ApptBooking;
  data: AppointmentsData;
  onClose: () => void;
}) => {
  const person = data.personOf(booking);
  const [slot, setSlot] = useState<ApptSlot | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const slots = useMemo(
    () => freeSlots({ staff: person, bookings: data.bookings, settings: data.settings, now: data.now, limit: 12, skipId: booking.id }),
    [person, data.bookings, data.settings, data.now, booking.id]
  );
  const moving = booking.status === "CONFIRMED";

  const send = async () => {
    if (!slot) return setErrors(["Pick one of the free sessions."]);
    setBusy(true);
    try {
      await data.act(booking, {
        action: "suggest",
        date: slot.date,
        startTime: slot.start,
        endTime: slot.end,
        message: message.trim() || undefined,
      });
      notify.success({
        title: `New time sent to ${firstName(booking.requester)}`,
        message: "They’ll confirm or choose another time. You’ll be notified either way.",
      });
      onClose();
    } catch (error) {
      setErrors([errorMessage(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      busy={busy}
      title={moving ? "Move to another time" : "Suggest another time"}
      subtitle={`${booking.requester} gets a push and SMS to accept it or pick another.`}
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Send suggestion", onClick: send, tone: "primary" },
      ]}
    >
      <SlotPicker label={`Free sessions for ${person.name}`} slots={slots} value={slot} onChange={setSlot} />
      <Field label={`Note to ${firstName(booking.requester)}`}>
        <TextArea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional" maxLength={300} />
      </Field>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Decline                                  */
/* -------------------------------------------------------------------------- */

export const DeclineDialog = ({
  booking,
  data,
  onClose,
}: {
  booking: ApptBooking;
  data: AppointmentsData;
  onClose: () => void;
}) => {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!reason) return setErrors(["Choose a reason so the office can follow up."]);
    setBusy(true);
    try {
      await data.act(booking, { action: "decline", reason, message: message.trim() || undefined });
      notify.success({
        title: "Request declined",
        message: `${booking.requester} was told and shown other people they can book.`,
      });
      onClose();
    } catch (error) {
      setErrors([errorMessage(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      busy={busy}
      title="Decline request"
      subtitle={`${firstName(booking.requester)} is told and shown other people they can book.`}
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Decline request", onClick: send, tone: "danger" },
      ]}
    >
      <Field label="Reason">
        <SelectInput
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          hasError={errors.length > 0 && !reason}
          options={[{ value: "", label: "Choose a reason" }, ...DECLINE_REASONS.map((r) => ({ value: r, label: r }))]}
        />
      </Field>
      <Field label={`Message to ${firstName(booking.requester)}`}>
        <TextArea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="They’ll see this" maxLength={300} />
      </Field>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Cancel                                   */
/* -------------------------------------------------------------------------- */

export const CancelDialog = ({
  booking,
  data,
  onClose,
}: {
  booking: ApptBooking;
  data: AppointmentsData;
  onClose: () => void;
}) => {
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await data.act(booking, { action: "cancel", message: message.trim() || undefined });
      notify.success({ title: "Appointment cancelled", message: `${booking.requester} has been told.` });
      onClose();
    } catch (error) {
      setErrors([errorMessage(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      busy={busy}
      width={480}
      title="Cancel this appointment?"
      errors={errors}
      buttons={[
        { label: "Keep it", onClick: onClose },
        { label: "Cancel appointment", onClick: send, tone: "danger" },
      ]}
    >
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-gray-600">
        <li>{booking.requester} gets a push and SMS straight away.</li>
        <li>
          {fmtDL(booking.date)}, {t12(booking.start)} becomes free for others.
        </li>
      </ul>
      <Field label={`Reason (shared with ${firstName(booking.requester)})`}>
        <TextArea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={300} />
      </Field>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Book for someone                             */
/* -------------------------------------------------------------------------- */

export const BookDialog = ({ data, onClose, onBooked }: { data: AppointmentsData; onClose: () => void; onBooked: () => void }) => {
  const membersOptions = useStore((state) => state.membersOptions);
  const reasonsQuery = useFetch(api.fetch.fetchAppointmentReasons, undefined, false, { silent: true });
  const reasons = (Array.isArray(reasonsQuery.data?.data) ? reasonsQuery.data.data : []) as AppointmentReason[];

  const [member, setMember] = useState<{ id: string; name: string } | null>(null);
  const [phone, setPhone] = useState("");
  const [attendeeId, setAttendeeId] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [slot, setSlot] = useState<ApptSlot | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const person = attendeeId ? data.staffById[attendeeId] : undefined;
  const slots = useMemo(
    () => freeSlots({ staff: person, bookings: data.bookings, settings: data.settings, now: data.now, limit: 12 }),
    [person, data.bookings, data.settings, data.now]
  );

  const save = async () => {
    const list: string[] = [];
    if (!member) list.push("Choose the member.");
    if (!attendeeId) list.push("Choose who they’re meeting.");
    if (!reasonId) list.push("Choose a reason.");
    if (attendeeId && !slot) list.push("Pick a time.");
    setErrors(list);
    if (list.length || !member || !slot || !person) return;
    const reason = reasons.find((r) => String(r.id) === reasonId);
    setBusy(true);
    try {
      await api.post.createAppointmentBooking({
        requesterId: Number(member.id),
        attendeeId: Number(attendeeId),
        userId: Number(attendeeId),
        date: slot.date,
        startTime: slot.start,
        endTime: slot.end,
        purpose: reason?.label ?? "Other",
        reasonId: reason ? Number(reason.id) : undefined,
        note: note.trim(),
        fullName: member.name,
        email: "",
        phone: phone.trim(),
        status: "CONFIRMED",
      });
      await data.refetchBookings();
      notify.success({
        title: "Appointment booked",
        message: `${member.name} with ${person.name}, ${fmtD(slot.date)} ${t12(slot.start)}.`,
      });
      onBooked();
    } catch (error) {
      setErrors([errorMessage(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      busy={busy}
      title="Book an appointment"
      subtitle="For someone who called or walked in. It’s confirmed straight away and both sides are notified."
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Book appointment", onClick: save, tone: "primary" },
      ]}
    >
      <FieldGrid>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-primary">Member *</span>
          <MemberPicker options={membersOptions} value={member} onChange={setMember} hasError={errors.length > 0 && !member} />
        </div>
        <Field label="Phone">
          <TextInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="024 555 0123" maxLength={20} />
        </Field>
        <Field label="With *">
          <SelectInput
            value={attendeeId}
            onChange={(e) => {
              setAttendeeId(e.target.value);
              setSlot(null);
            }}
            hasError={errors.length > 0 && !attendeeId}
            options={[
              { value: "", label: "Choose a person" },
              ...data.staff.filter((s) => !s.paused).map((s) => ({ value: s.id, label: s.role ? `${s.name} · ${s.role}` : s.name })),
            ]}
          />
        </Field>
        <Field label="Reason *">
          <SelectInput
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value)}
            hasError={errors.length > 0 && !reasonId}
            options={[
              { value: "", label: "Choose a reason" },
              ...reasons.filter((r) => r.is_active).map((r) => ({ value: String(r.id), label: r.label })),
            ]}
          />
        </Field>
        {person && (
          <FullRow>
            <SlotPicker
              label="Time *"
              slots={slots}
              value={slot}
              onChange={setSlot}
              help="Next 3 weeks, using their schedule and time off."
            />
          </FullRow>
        )}
        <FullRow>
          <Field label="Note">
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything they should know beforehand"
              maxLength={300}
            />
          </Field>
        </FullRow>
      </FieldGrid>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                               Weekly schedule                              */
/* -------------------------------------------------------------------------- */

type DayDraft = { on: boolean; ranges: { from: string; to: string }[] };

const TIMES = (() => {
  const out: { value: string; label: string }[] = [];
  for (let m = 6 * 60; m <= 21 * 60; m += 30) out.push({ value: fromMin(m), label: t12(fromMin(m)) });
  return out;
})();

export const ScheduleDialog = ({
  person,
  data,
  onClose,
}: {
  /** An existing person, or a member being set up for the first time. */
  person: ApptStaff | { id: string; name: string };
  data: AppointmentsData;
  onClose: () => void;
}) => {
  const existing = "windows" in person ? person : null;
  const [days, setDays] = useState<Record<number, DayDraft>>(() => {
    const out: Record<number, DayDraft> = {};
    WEEK_ORDER.forEach((d) => {
      const list = existing?.windows[d] ?? [];
      out[d] = list.length
        ? { on: true, ranges: list.map((w) => ({ from: w.from, to: w.to })) }
        : { on: false, ranges: [{ from: "09:00", to: "12:00" }] };
    });
    return out;
  });
  const [duration, setDuration] = useState(String(existing?.duration ?? 30));
  const [buffer, setBuffer] = useState(String(existing?.buffer ?? 0));
  const [max, setMax] = useState(String(existing?.max ?? 1));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const du = Number(duration);
  const bf = Number(buffer);
  const update = (d: number, patch: Partial<DayDraft>) => setDays((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  const updateRange = (d: number, i: number, patch: Partial<{ from: string; to: string }>) =>
    update(d, { ranges: days[d].ranges.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const save = async () => {
    const list: string[] = [];
    WEEK_ORDER.forEach((d) => {
      if (!days[d].on) return;
      const ranges = days[d].ranges.slice().sort((a, b) => a.from.localeCompare(b.from));
      ranges.forEach((r, i) => {
        if (toMin(r.to) <= toMin(r.from)) list.push(`${DOWF[d]}: end time must be after the start.`);
        else if (buildSessions(r.from, r.to, du, bf).length === 0) list.push(`${DOWF[d]}: the hours are shorter than one session.`);
        if (i > 0 && toMin(r.from) < toMin(ranges[i - 1].to)) list.push(`${DOWF[d]}: the hours overlap.`);
      });
    });
    if (!WEEK_ORDER.some((d) => days[d].on)) list.push("Turn on at least one day, or pause bookings instead.");
    const unique = Array.from(new Set(list));
    setErrors(unique);
    if (unique.length) return;
    setBusy(true);
    try {
      const timeSlots = WEEK_ORDER.filter((d) => days[d].on).flatMap((d) =>
        days[d].ranges.map((r) => ({
          day: dayNameOf(d) as DayOfWeek,
          startTime: r.from,
          endTime: r.to,
          sessionDurationMinutes: du,
          sessions: buildSessions(r.from, r.to, du, bf),
        }))
      );
      await api.post.createStaffAvailability({
        userId: person.id,
        maxBookingsPerSlot: Number(max),
        bufferMinutes: bf,
        timeSlots,
      });
      await data.refetchStaff();
      notify.success({
        title: existing ? "Schedule saved" : `${person.name} added`,
        message: existing ? "New bookings use these hours from now on." : "Members can book them from now on.",
      });
      onClose();
    } catch (error) {
      setErrors([errorMessage(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      busy={busy}
      width={720}
      title={`Weekly schedule · ${person.name}`}
      subtitle="Members can book sessions inside these hours. Existing appointments aren’t moved."
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Save schedule", onClick: save, tone: "primary" },
      ]}
    >
      <div className="flex flex-col overflow-hidden rounded-lg border border-lightGray">
        {WEEK_ORDER.map((d) => {
          const day = days[d];
          return (
            <div
              key={d}
              className={`flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-gray-200 px-4 py-3 last:border-b-0 ${day.on ? "bg-white" : "bg-gray-50"}`}
            >
              <label className="flex min-h-10 flex-[0_0_120px] cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.on}
                  onChange={(e) => update(d, { on: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-semibold text-primary">{DOWF[d]}</span>
              </label>
              {day.on ? (
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2">
                  {day.ranges.map((r, i) => {
                    const bad = toMin(r.to) <= toMin(r.from);
                    const n = bad ? 0 : buildSessions(r.from, r.to, du, bf).length;
                    return (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-0 flex-[1_1_220px] items-center gap-2">
                          <SelectInput
                            aria-label={`${DOWF[d]} start`}
                            value={r.from}
                            onChange={(e) => updateRange(d, i, { from: e.target.value })}
                            options={TIMES}
                            className="flex-1 px-2"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <SelectInput
                            aria-label={`${DOWF[d]} end`}
                            value={r.to}
                            onChange={(e) => updateRange(d, i, { to: e.target.value })}
                            options={TIMES}
                            className="flex-1 px-2"
                          />
                        </div>
                        <span className={`min-w-[90px] text-xs ${bad ? "text-red-700" : "text-gray-500"}`}>
                          {bad ? "End is before start" : plural(n, "session")}
                        </span>
                        {day.ranges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => update(d, { ranges: day.ranges.filter((_, j) => j !== i) })}
                            className="text-xs font-medium text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      const last = day.ranges[day.ranges.length - 1];
                      const from = fromMin(Math.min(toMin(last.to) + 60, 20 * 60));
                      update(d, { ranges: [...day.ranges, { from, to: fromMin(Math.min(toMin(from) + 120, 21 * 60)) }] });
                    }}
                    className="self-start text-xs font-medium text-primary underline"
                  >
                    + Add hours
                  </button>
                </div>
              ) : (
                <span className="flex min-h-10 items-center text-sm text-gray-500">Not available</span>
              )}
            </div>
          );
        })}
      </div>
      <FieldGrid>
        <Field label="Session length">
          <SelectInput
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            options={[15, 30, 45, 60, 90].map((v) => ({ value: String(v), label: `${v} minutes` }))}
          />
        </Field>
        <Field label="Break between sessions">
          <SelectInput
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            options={[0, 5, 10, 15, 30].map((v) => ({ value: String(v), label: v ? `${v} minutes` : "None" }))}
          />
        </Field>
        <div className="flex flex-col gap-1">
          <Field label="People per session">
            <SelectInput
              value={max}
              onChange={(e) => setMax(e.target.value)}
              options={[1, 2, 3, 4, 5].map((v) => ({ value: String(v), label: v === 1 ? "1 (one-to-one)" : String(v) }))}
            />
          </Field>
          <FieldHint>More than 1 suits group sessions such as pre-marital classes.</FieldHint>
        </div>
      </FieldGrid>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Time off                                  */
/* -------------------------------------------------------------------------- */

export const TimeOffDialog = ({ person, data, onClose }: { person: ApptStaff; data: AppointmentsData; onClose: () => void }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const clash =
    from && to
      ? data.bookings.filter(
          (b) => b.attendeeId === person.id && OPEN_STATUSES.includes(b.status) && b.date >= from && b.date <= to
        ).length
      : 0;

  const save = async () => {
    const list: string[] = [];
    if (!from || !to) list.push("Choose both dates.");
    else if (to < from) list.push("The end date must be on or after the start.");
    setErrors(list);
    if (list.length) return;
    setBusy(true);
    try {
      await api.post.createStaffTimeOff(person.id, { from, to, note: note.trim() || undefined });
      await data.refetchStaff();
      notify.success({
        title: "Time off added",
        message: `${fmtD(from)} – ${fmtD(to)}${clash ? `. ${plural(clash, "appointment")} need${clash === 1 ? "s" : ""} moving.` : "."}`,
      });
      onClose();
    } catch (error) {
      setErrors([errorMessage(error)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommDialog
      open
      onClose={onClose}
      busy={busy}
      width={560}
      title={`Add time off · ${person.name}`}
      subtitle="Members can’t book these days."
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        { label: "Add time off", onClick: save, tone: "primary" },
      ]}
    >
      <FieldGrid>
        <Field label="From *">
          <TextInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To *">
          <TextInput type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <FullRow>
          <div className="flex flex-col gap-1">
            <Field label="Reason">
              <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Annual leave" maxLength={60} />
            </Field>
            {clash > 0 && (
              <FieldHint tone="warning">
                {plural(clash, "appointment")} {clash === 1 ? "falls" : "fall"} in this period. They stay booked and admins
                are asked to move them.
              </FieldHint>
            )}
          </div>
        </FullRow>
      </FieldGrid>
    </CommDialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Add person                                 */
/* -------------------------------------------------------------------------- */

export const AddPersonDialog = ({
  data,
  onClose,
  onPicked,
}: {
  data: AppointmentsData;
  onClose: () => void;
  onPicked: (member: { id: string; name: string }) => void;
}) => {
  const membersOptions = useStore((state) => state.membersOptions);
  const [member, setMember] = useState<{ id: string; name: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const exclude = useMemo(() => data.staff.map((s) => s.id), [data.staff]);

  return (
    <CommDialog
      open
      onClose={onClose}
      width={520}
      title="Add a person"
      subtitle="Pick the pastor or counsellor members should be able to book. Next you’ll set their hours."
      errors={errors}
      buttons={[
        { label: "Cancel", onClick: onClose },
        {
          label: "Next: set hours",
          tone: "primary",
          onClick: () => (member ? onPicked(member) : setErrors(["Choose a member."])),
        },
      ]}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm text-primary">Member</span>
        <MemberPicker options={membersOptions} value={member} onChange={setMember} exclude={exclude} />
        <FieldHint>People who already have a schedule aren’t listed.</FieldHint>
      </div>
    </CommDialog>
  );
};
