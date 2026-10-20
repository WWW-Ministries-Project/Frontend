import { useState } from "react";

import { describeError, notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";

import PageOutline from "../../../Components/PageOutline";
import { ListEmpty } from "../../ChurchCommunication/ui/commUi";
import { PageHeading, Pill, type PillTone, UiButton } from "../../MembershipManagement/components/membershipUi";
import { AddPersonDialog, ScheduleDialog, TimeOffDialog } from "../Components/AppointmentDialogs";
import { LegendDot, Meter, Panel } from "../Components/appointmentUi";
import {
  type ApptStaff,
  DOW,
  WEEK_ORDER,
  addDays,
  awayOn,
  dayIndex,
  fmtD,
  initials,
  iso,
  pc,
  plural,
  sessionCount,
  sessionsOn,
  slotOf,
  t12,
} from "../utils/appointmentModel";
import { useAppointmentsData } from "../utils/useAppointmentsData";

const LIVE = ["PENDING", "CONFIRMED", "RESCHEDULED", "COMPLETED", "NO_SHOW"];

type DialogState =
  | { kind: "add" }
  | { kind: "schedule"; person: ApptStaff | { id: string; name: string } }
  | { kind: "off"; person: ApptStaff };

const ManageAvailability = () => {
  const data = useAppointmentsData();
  const { staff, bookings, now, isAdmin } = data;
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const today = iso(now);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const live = bookings.filter((b) => LIVE.includes(b.status));
  const bookedOn = (day: string, personId?: string) =>
    live.filter((b) => slotOf(b).date === day && (!personId || b.attendeeId === personId)).length;

  const coverage = week.map((day) => {
    const offered = staff.reduce((sum, person) => sum + sessionsOn(person, day), 0);
    const booked = bookedOn(day);
    return { day, offered, booked };
  });
  const peak = Math.max(1, ...coverage.map((c) => Math.max(c.offered, c.booked)));

  const togglePause = async (person: ApptStaff) => {
    setBusyId(person.id);
    try {
      await api.put.setStaffBookingsPaused({ paused: !person.paused }, { id: person.id });
      await data.refetchStaff();
      notify.success(
        person.paused
          ? { title: "Bookings resumed", message: `Members can book ${person.name} again.` }
          : {
              title: "Bookings paused",
              message: "Existing appointments stay. Members can’t make new bookings.",
              undo: async () => {
                await api.put.setStaffBookingsPaused({ paused: false }, { id: person.id });
                await data.refetchStaff();
              },
              undoneTitle: "Bookings resumed",
            }
      );
    } catch (error) {
      notify.error({ title: "Couldn’t change bookings", message: describeError(error, { preferServerMessage: true }).message });
    } finally {
      setBusyId(null);
    }
  };

  const removeTimeOff = async (person: ApptStaff, id: string) => {
    setBusyId(person.id);
    try {
      await api.delete.deleteStaffTimeOff({ id });
      await data.refetchStaff();
      notify.success({ title: "Time off removed", message: `Members can book ${person.name} on those days again.` });
    } catch (error) {
      notify.error({ title: "Couldn’t remove the time off", message: describeError(error, { preferServerMessage: true }).message });
    } finally {
      setBusyId(null);
    }
  };

  const statusOf = (person: ApptStaff): { label: string; tone: PillTone } => {
    const away = awayOn(person, today);
    if (person.paused) return { label: "Paused", tone: "neutral" };
    if (away) return { label: `On leave until ${fmtD(away.to)}`, tone: "warning" };
    if (!Object.keys(person.sessions).length) return { label: "No hours set", tone: "neutral" };
    return { label: "Taking bookings", tone: "success" };
  };

  /** "Mon, Wed · 9:00 AM – 12:00 PM" lines, one per distinct set of hours. */
  const hourLines = (person: ApptStaff) => {
    const groups: Record<string, string[]> = {};
    WEEK_ORDER.forEach((d) => {
      const windows = person.windows[d];
      if (!windows?.length) return;
      const key = windows.map((w) => `${t12(w.from)} – ${t12(w.to)}`).join(", ");
      (groups[key] = groups[key] || []).push(DOW[d]);
    });
    return Object.entries(groups).map(([hours, days]) => `${days.join(", ")} · ${hours}`);
  };

  return (
    <PageOutline className="flex flex-col gap-6">
      <PageHeading
        title="Availability"
        subtitle="When each pastor and counsellor can be booked."
        actions={
          isAdmin && (
            <UiButton tone="primary" onClick={() => setDialog({ kind: "add" })}>
              Add person
            </UiButton>
          )
        }
      />

      {staff.length > 0 && (
        <Panel title="Coverage this week" helper="Open sessions across everyone, by day. Gaps mean members can’t book that day.">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {coverage.map((c) => {
              const open = Math.max(0, c.offered - c.booked);
              return (
                <div key={c.day} className="flex min-w-0 flex-col items-center gap-1">
                  <div
                    className="flex h-24 w-full flex-col justify-end overflow-hidden rounded-lg bg-[#F3F4F6]"
                    title={`${c.booked} booked, ${open} open`}
                  >
                    <div className="bg-primary/25" style={{ height: `${(open * 100) / peak}%` }} />
                    <div className="bg-primary" style={{ height: `${(Math.min(c.booked, c.offered || c.booked) * 100) / peak}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {DOW[dayIndex(c.day)]} <span className="hidden sm:inline">{Number(c.day.slice(8))}</span>
                  </span>
                  <span
                    className={`text-center text-xs ${!c.offered ? "text-[#B91C1C]" : open <= 1 ? "text-[#B45309]" : "text-[#6B7280]"}`}
                  >
                    {c.offered ? `${open} open` : "No one"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4">
            <LegendDot color="#080D2D" label="Booked" />
            <LegendDot color="rgba(8,13,45,0.25)" label="Still open" />
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] items-start gap-4">
        {staff.map((person) => {
          const status = statusOf(person);
          const offered = week.reduce((sum, day) => sum + sessionsOn(person, day), 0);
          const booked = week.reduce((sum, day) => sum + bookedOn(day, person.id), 0);
          const use = pc(booked, offered);
          const busy = busyId === person.id;
          return (
            <article key={person.id} className="flex flex-col gap-4 rounded-xl border border-lightGray bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {initials(person.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-primary">{person.name}</p>
                  {person.role && <p className="truncate text-sm text-[#6B7280]">{person.role}</p>}
                </div>
                <Pill tone={status.tone}>{status.label}</Pill>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEK_ORDER.map((d) => {
                  const n = sessionCount(person, d);
                  const windows = person.windows[d] ?? [];
                  return (
                    <div key={d} className="flex min-w-0 flex-col items-center gap-1">
                      <span className="text-xs text-[#6B7280]">{DOW[d]}</span>
                      <div
                        title={
                          windows.length
                            ? `${windows.map((w) => `${t12(w.from)} – ${t12(w.to)}`).join(", ")} · ${plural(n, "session")}`
                            : "Not available"
                        }
                        className={`flex h-10 w-full items-center justify-center rounded-md border text-xs font-semibold ${
                          windows.length ? "border-lightGray bg-primary/[0.06] text-primary" : "border-[#E5E7EB] bg-white text-[#9CA3AF]"
                        }`}
                      >
                        {windows.length ? n : "–"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1 text-sm text-[#4B5563]">
                {hourLines(person).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>
                  {person.duration} min sessions{person.buffer ? `, ${person.buffer} min break between` : ""} ·{" "}
                  {plural(person.max, "person", "people")} per session
                </p>
              </div>

              <Meter
                label={<span className="text-xs text-[#4B5563]">This week</span>}
                value={<span className="text-xs">{offered ? `${booked} of ${offered} sessions booked` : "No sessions this week"}</span>}
                percent={use}
                tone={use >= 90 ? "danger" : use >= 70 ? "warning" : "primary"}
              />

              {person.timeOff.length > 0 && (
                <div className="flex flex-col gap-1 rounded-lg bg-[#F8F9FC] p-3">
                  <p className="text-xs font-semibold text-[#6B7280]">TIME OFF</p>
                  {person.timeOff.map((off) => (
                    <div key={off.id} className="flex items-center gap-2 text-sm text-primary">
                      <span className="flex-1">
                        {fmtD(off.from)} – {fmtD(off.to)} · {off.note}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeTimeOff(person, off.id)}
                          className="min-h-8 rounded-lg px-2 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-60"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <UiButton className="flex-auto sm:flex-none" onClick={() => setDialog({ kind: "schedule", person })}>
                    Edit schedule
                  </UiButton>
                  <UiButton className="flex-auto sm:flex-none" onClick={() => setDialog({ kind: "off", person })}>
                    Add time off
                  </UiButton>
                  <UiButton
                    tone="ghost"
                    className="flex-auto text-primary hover:bg-primary/5 sm:flex-none"
                    disabled={busy}
                    onClick={() => togglePause(person)}
                  >
                    {person.paused ? "Resume bookings" : "Pause bookings"}
                  </UiButton>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!staff.length && (
        <ListEmpty>
          {data.staffLoaded
            ? isAdmin
              ? "Nobody can be booked yet. Add a pastor or counsellor and set their hours."
              : "Nobody can be booked yet."
            : "Loading schedules…"}
        </ListEmpty>
      )}

      {dialog?.kind === "add" && (
        <AddPersonDialog
          data={data}
          onClose={() => setDialog(null)}
          onPicked={(member) => setDialog({ kind: "schedule", person: member })}
        />
      )}
      {dialog?.kind === "schedule" && <ScheduleDialog person={dialog.person} data={data} onClose={() => setDialog(null)} />}
      {dialog?.kind === "off" && <TimeOffDialog person={dialog.person} data={data} onClose={() => setDialog(null)} />}
    </PageOutline>
  );
};

export default ManageAvailability;
