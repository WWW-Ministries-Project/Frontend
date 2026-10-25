import { useMemo, useState } from "react";

import { InlineAlert, type InlineAlertTone, describeError, notify } from "@/components/feedback";

import type { CommDialogButton } from "../../ChurchCommunication/ui/commUi";
import { Field, SelectInput } from "../../MembershipManagement/components/membershipUi";
import {
  type ApptBooking,
  HISTORY_DOT,
  awayOn,
  dur,
  firstName,
  fmtD,
  fmtDL,
  fmtT,
  freeSlots,
  historyOf,
  hrs,
  isOverdue,
  needsOutcome,
  pillOf,
  slotOf,
  t12,
} from "../utils/appointmentModel";
import type { AppointmentsData } from "../utils/useAppointmentsData";
import { SideDrawer } from "./appointmentUi";

export type DrawerDialog = "suggest" | "decline" | "cancel";

/**
 * One booking: what it is, its history, and the actions its state allows.
 * Dialogs (suggest, decline, cancel) are owned by the page; the drawer asks
 * for them through `onDialog`.
 */
export const AppointmentDrawer = ({
  booking,
  data,
  startReassigning = false,
  onClose,
  onDialog,
}: {
  booking: ApptBooking;
  data: AppointmentsData;
  startReassigning?: boolean;
  onClose: () => void;
  onDialog: (kind: DrawerDialog) => void;
}) => {
  const [reassigning, setReassigning] = useState(startReassigning);
  const [reTo, setReTo] = useState("");
  const [busy, setBusy] = useState(false);

  const { access, now, settings } = data;
  const sla = settings.replyDeadlineHours;
  const person = data.personOf(booking);
  const slot = slotOf(booking);
  const away = booking.status === "PENDING" ? awayOn(person, booking.date) : undefined;
  const overdue = isOverdue(booking, sla, now);
  const outcomeDue = needsOutcome(booking, now);
  // The person booked acts on their own booking; anyone else needs the
  // action on a booking whose attendee isn't hidden from their role.
  const may = (action: Parameters<typeof access.onBooking>[0]) => access.onBooking(action, booking.attendeeId);
  const canRemind = access.forOthers("send_reminders", booking.attendeeId);
  const canReassign = access.forOthers("reassign", booking.attendeeId);

  const alert: { tone: InlineAlertTone; text: string } | null = away
    ? { tone: "warning", text: `${person.name} is on leave until ${fmtD(away.to)}. Reassign this request so ${firstName(booking.requester)} isn’t left waiting.` }
    : overdue
    ? {
        tone: "error",
        text: `No reply for ${dur(hrs(booking.createdAt, now))}. The ${sla} h deadline passed ${dur(hrs(booking.createdAt, now) - sla)} ago.`,
      }
    : outcomeDue
    ? { tone: "warning", text: "This appointment has passed. Record whether it happened." }
    : booking.status === "RESCHEDULED" && booking.proposal
    ? {
        tone: "info",
        text: `Waiting for ${firstName(booking.requester)} to accept ${fmtD(booking.proposal.date)}, ${t12(booking.proposal.start)}.${booking.phone ? ` Call ${booking.phone} if it’s urgent.` : ""}`,
      }
    : null;

  const facts = [
    { l: "Requester", v: booking.phone ? `${booking.requester} · ${booking.phone}` : booking.requester },
    { l: "With", v: person.name },
    { l: "Reason", v: booking.reason },
    { l: "Length", v: `${person.duration} minutes` },
    ...(booking.createdAt ? [{ l: "Requested", v: fmtT(booking.createdAt) }] : []),
    ...(booking.respondedAt && booking.createdAt
      ? [{ l: "First reply", v: `${dur(hrs(booking.createdAt, booking.respondedAt))} later` }]
      : booking.status === "PENDING" && booking.createdAt
      ? [{ l: "Reply due", v: fmtT(new Date(new Date(booking.createdAt).getTime() + sla * 36e5).toISOString()) }]
      : []),
  ];

  const reassignOptions = useMemo(
    () =>
      data.staff
        .filter((s) => s.id !== booking.attendeeId && !s.paused && !awayOn(s, booking.date) && !access.hidden(s.id))
        .map((s) => {
          const next = freeSlots({ staff: s, bookings: data.bookings, settings, now, limit: 1 })[0];
          return {
            value: s.id,
            label: `${s.name}${s.role ? ` · ${s.role}` : ""} · next free ${next ? fmtD(next.date) : "none"}`,
          };
        }),
    [data.staff, data.bookings, booking.attendeeId, booking.date, settings, now, access]
  );

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (error) {
      notify.error({ title: "Couldn’t update the appointment", message: describeError(error, { preferServerMessage: true }).message });
    } finally {
      setBusy(false);
    }
  };

  const accept = () =>
    run(async () => {
      await data.act(booking, { action: "accept" });
      onClose();
      notify.success({
        title: "Appointment confirmed",
        message: `${booking.requester} gets a push and SMS for ${fmtD(booking.date)}, ${t12(booking.start)}.`,
        undo: () => data.act(booking, { action: "reopen" }),
        undoneTitle: "Back to awaiting reply",
      });
    });

  const outcome = (kind: "complete" | "no_show") =>
    run(async () => {
      await data.act(booking, { action: kind });
      onClose();
      notify.success({
        title: kind === "complete" ? "Marked completed" : "Marked as no-show",
        message: `${booking.requester} · ${fmtD(booking.date)}`,
      });
    });

  const remind = () =>
    run(async () => {
      await data.act(booking, { action: "remind" });
      notify.success({
        title: `Reminder sent to ${person.name}`,
        message: "By push and SMS. You’ll see it here when they reply.",
      });
    });

  const reassign = () =>
    run(async () => {
      if (!reTo) return;
      const target = data.staffById[reTo];
      await data.act(booking, { action: "reassign", attendeeId: Number(reTo) });
      onClose();
      notify.success({
        title: `Reassigned to ${target?.name ?? "the new person"}`,
        message: `Their reply clock starts now. ${firstName(booking.requester)} has been told.`,
      });
    });

  const confirmProposal = () =>
    run(async () => {
      if (!booking.proposal) return;
      await data.act(booking, { action: "confirm_proposal" });
      onClose();
      notify.success({ title: `Confirmed for ${fmtD(booking.proposal.date)}`, message: "Both sides have been notified." });
    });

  let buttons: CommDialogButton[] = [{ label: "Close", onClick: onClose }];
  if (reassigning) {
    buttons = [
      { label: "Back", onClick: () => setReassigning(false) },
      { label: "Reassign", onClick: reassign, tone: "primary", disabled: !reTo },
    ];
  } else if (booking.status === "PENDING" && may("respond")) {
    buttons = [
      ...(canRemind ? [{ label: "Remind", onClick: remind, tone: "ghost" as const }] : []),
      ...(canReassign ? [{ label: "Reassign", onClick: () => setReassigning(true) }] : []),
      { label: "Decline", onClick: () => onDialog("decline"), tone: "danger" },
      { label: "Suggest time", onClick: () => onDialog("suggest") },
      { label: "Accept", onClick: accept, tone: "primary" },
    ];
  } else if (booking.status === "RESCHEDULED" && (canReassign || access.forOthers("respond", booking.attendeeId))) {
    buttons = [
      ...(canReassign ? [{ label: "Reassign", onClick: () => setReassigning(true) }] : []),
      ...(may("cancel_any") ? [{ label: "Cancel", onClick: () => onDialog("cancel"), tone: "danger" as const }] : []),
      ...(access.forOthers("respond", booking.attendeeId)
        ? [{ label: `Confirm for ${firstName(booking.requester)}`, onClick: confirmProposal, tone: "primary" as const }]
        : []),
    ];
  } else if (outcomeDue && may("complete")) {
    buttons = [
      { label: "No-show", onClick: () => outcome("no_show") },
      { label: "Completed", onClick: () => outcome("complete"), tone: "primary" },
    ];
  } else if (booking.status === "CONFIRMED" && (may("cancel_any") || may("respond"))) {
    buttons = [
      ...(may("cancel_any") ? [{ label: "Cancel appointment", onClick: () => onDialog("cancel"), tone: "danger" as const }] : []),
      ...(may("respond") ? [{ label: "Move to another time", onClick: () => onDialog("suggest") }] : []),
    ];
  }

  const endLabel = person.duration && slot.start ? ` – ${t12(slot.end)}` : "";

  return (
    <SideDrawer
      open
      onClose={onClose}
      busy={busy}
      pill={pillOf(booking, sla, now)}
      title={`${booking.reason} with ${person.name}`}
      subtitle={slot.date ? `${fmtDL(slot.date)}, ${t12(slot.start)}${endLabel}` : undefined}
      buttons={buttons}
    >
      {alert && <InlineAlert tone={alert.tone}>{alert.text}</InlineAlert>}
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
        {facts.map((fact) => (
          <div key={fact.l} className="flex flex-col gap-0.5">
            <dt className="text-xs text-gray-500">{fact.l}</dt>
            <dd className="m-0 text-sm font-medium text-primary">{fact.v}</dd>
          </div>
        ))}
      </dl>
      {booking.note && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Note from {firstName(booking.requester)}</span>
          <p className="rounded-lg bg-inputBackground px-4 py-3 text-sm text-gray-700">{booking.note}</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-primary">History</h3>
        <ol className="m-0 flex list-none flex-col p-0">
          {historyOf(booking)
            .slice()
            .reverse()
            .map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex gap-3 pb-3">
                <span className={`mt-[5px] h-2.5 w-2.5 flex-shrink-0 rounded-full ${HISTORY_DOT[entry.tone ?? "neutral"]}`} />
                <div>
                  <p className="text-sm text-primary">{entry.text}</p>
                  <p className="text-xs text-gray-500">{fmtT(entry.at)}</p>
                </div>
              </li>
            ))}
        </ol>
      </div>
      {reassigning && (
        <div className="flex flex-col gap-2 rounded-lg border border-lightGray p-4">
          <Field label={<span className="font-semibold">Reassign to</span>}>
            <SelectInput
              value={reTo}
              onChange={(e) => setReTo(e.target.value)}
              options={[{ value: "", label: "Choose a person" }, ...reassignOptions]}
            />
          </Field>
          <p className="text-xs text-gray-500">
            Their {sla} h reply clock starts now. {firstName(booking.requester)} is told who they’ll meet instead.
          </p>
        </div>
      )}
    </SideDrawer>
  );
};
