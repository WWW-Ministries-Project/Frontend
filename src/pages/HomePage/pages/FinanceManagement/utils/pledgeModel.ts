import { notify } from "@/components/feedback";
import { api } from "@/utils/api/apiCalls";
import type { PledgeListRow } from "@/utils/api/pledges/interface";

import { confirmAction } from "../../../utils/helperFunctions";
import { type PillSpec, dayOf, plural } from "./financeModel";

export const pledgeState = (p: PledgeListRow, today: string) => {
  const done = p.status === "completed";
  const deadline = dayOf(p.deadline);
  const over = !done && Boolean(deadline) && deadline < today;
  const pill: PillSpec = done
    ? { label: "Completed", tone: "success" }
    : over
      ? { label: "Past deadline", tone: "danger" }
      : { label: "In progress", tone: "info" };
  return { done, over, pill, deadline };
};

export const callersText = (p: PledgeListRow) =>
  p.callers
    .map((c) => c.user?.name || c.guest_name)
    .filter(Boolean)
    .join(", ");

/** Reminds everyone on a pledge who still has a balance. */
export const remindAll = (p: PledgeListRow, after?: () => void) => {
  const n = p.pledgers_with_balance;
  confirmAction({
    title: n ? `Remind ${plural(n, "pledger")}?` : "Remind pledgers with a balance?",
    points: [
      "Members get an in-app notification and email with their balance and a link to pay online.",
      "Pledgers who have paid in full, or were reminded in the last day, are left out. Guests without an account can’t be reached from here.",
    ],
    confirmLabel: "Send reminders",
    onConfirm: async () => {
      const res = await api.post.remindPledgers({ pledge_id: p.id });
      const d = res?.data;
      notify.success({
        title: `Reminders sent to ${plural(d?.reminded ?? 0, "pledger")}`,
        message:
          [
            d?.skipped_recent ? `${plural(d.skipped_recent, "pledger")} reminded in the last day ${d.skipped_recent === 1 ? "was" : "were"} skipped.` : "",
            d?.skipped_guests ? `${plural(d.skipped_guests, "guest")} without an account ${d.skipped_guests === 1 ? "was" : "were"} skipped.` : "",
            d?.failed ? `${plural(d.failed, "reminder")} couldn’t be sent.` : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined,
      });
      after?.();
    },
  });
};
