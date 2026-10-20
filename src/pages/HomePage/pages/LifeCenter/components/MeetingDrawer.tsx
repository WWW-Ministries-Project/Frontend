import type { MeetingType } from "@/utils/api/lifeCenter/interfaces";

import type { CommDialogButton } from "../../ChurchCommunication/ui/commUi";
import { Pill } from "../../MembershipManagement/components/membershipUi";
import { DrawerSection, RequisitionDrawerShell } from "../../Requisitions/components/requisitionUi";
import { dayKey, fmtDL, n0 } from "../utils/lcModel";

/** One meeting: counts, offering, notes and the souls won who came. */
export const MeetingDrawer = ({
  meeting,
  centerName,
  canEdit,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}: {
  meeting: MeetingType | null;
  centerName: string;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (meeting: MeetingType) => void;
  onDelete: (meeting: MeetingType) => void;
}) => {
  const g = meeting;
  const day = g ? dayKey(g.day || g.date) : "";
  const people = g
    ? [...g.attendees].sort((a, b) => Number(b.isFirstTimer) - Number(a.isFirstTimer) || a.name.localeCompare(b.name))
    : [];
  const firstTimers = people.filter((p) => p.isFirstTimer).length;

  const buttons: CommDialogButton[] = [];
  if (g && canDelete) buttons.push({ label: "Delete", onClick: () => onDelete(g), tone: "danger" });
  if (g && canEdit) buttons.push({ label: "Edit meeting", onClick: () => onEdit(g), tone: "primary" });

  const facts = g
    ? [
        { l: "Attendees", v: String(people.length - firstTimers) },
        { l: "First-timers", v: String(firstTimers) },
        { l: "Offering", v: `${g.currency} ${n0(Number(g.offeringAmount) || 0)}` },
      ]
    : [];

  return (
    <RequisitionDrawerShell
      open={!!g}
      onClose={onClose}
      gid={centerName}
      title={g ? `Meeting · ${fmtDL(day)}` : "Meeting"}
      meta={g?.created_by?.name ? `Recorded by ${g.created_by.name}` : undefined}
      buttons={buttons}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,130px),1fr))] gap-3">
        {facts.map((f) => (
          <div key={f.l} className="flex flex-col gap-0.5 rounded-xl border border-lightGray px-4 py-3">
            <span className="text-xs text-[#6B7280]">{f.l}</span>
            <span className="text-xl font-semibold leading-7 text-primary">{f.v}</span>
          </div>
        ))}
      </div>
      {g?.note && (
        <DrawerSection title="Notes">
          <p className="rounded-lg bg-[#F8F9FC] px-4 py-3 text-sm text-[#374151]">{g.note}</p>
        </DrawerSection>
      )}
      <DrawerSection title={`Who came (${people.length})`}>
        {people.length ? (
          <div className="overflow-hidden rounded-lg border border-lightGray">
            {people.map((p) => (
              <div key={p.soulWonId} className="flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{p.name || "Removed record"}</p>
                  {p.phone?.number && (
                    <p className="truncate text-xs text-[#6B7280]">
                      {[p.phone.country_code, p.phone.number].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
                <Pill tone={p.isFirstTimer ? "warning" : "neutral"}>{p.isFirstTimer ? "First-timer" : "Attendee"}</Pill>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">No attendees recorded.</p>
        )}
      </DrawerSection>
    </RequisitionDrawerShell>
  );
};
