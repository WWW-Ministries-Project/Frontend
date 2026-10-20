import type { LifeCenterMemberType, LifeCenterSoul, MeetingType } from "@/utils/api/lifeCenter/interfaces";

import type { CommDialogButton } from "../../ChurchCommunication/ui/commUi";
import { Pill, type PillTone } from "../../MembershipManagement/components/membershipUi";
import { DrawerSection, RequisitionDrawerShell } from "../../Requisitions/components/requisitionUi";
import { dayKey, fmtDL, fmtS, n0 } from "../utils/lcModel";

/** One meeting: counts, notes, who came and who didn't. */
export const MeetingDrawer = ({
  meeting,
  centerName,
  members,
  souls,
  canEdit,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}: {
  meeting: MeetingType | null;
  centerName: string;
  members: LifeCenterMemberType[];
  souls: LifeCenterSoul[];
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (meeting: MeetingType) => void;
  onDelete: (meeting: MeetingType) => void;
}) => {
  const g = meeting;
  const day = g ? dayKey(g.day || g.date) : "";
  const came = new Set((g?.members ?? []).map((m) => String(m.user_id)));
  const memberById = new Map(members.map((m) => [String(m.userId), m]));
  const soulById = new Map(souls.map((s) => [String(s.id), s]));

  const people: { key: string; name: string; sub: string; pill: { label: string; tone: PillTone } }[] = g
    ? [
        ...(g.members ?? []).map((m) => {
          const current = memberById.get(String(m.user_id));
          const role = current?.role.name ?? m.role ?? "";
          const phone = current?.phone ?? "";
          return {
            key: `m${m.user_id}`,
            name: m.name || "Former member",
            sub: [role, phone].filter(Boolean).join(" · "),
            pill: { label: "Member", tone: "neutral" as PillTone },
          };
        }),
        ...g.attendees.map((a) => {
          const soul = soulById.get(String(a.soulWonId));
          const first = dayKey(soul?.first_meeting_date) || dayKey(soul?.date_won);
          const firstVisit = a.isFirstTimer || first === day;
          return {
            key: `s${a.soulWonId}`,
            name: a.name || "Removed record",
            sub: [a.phone?.number, firstVisit ? "first visit" : first ? `first came ${fmtS(first)}` : ""]
              .filter(Boolean)
              .join(" · "),
            pill: firstVisit
              ? { label: "First visit", tone: "warning" as PillTone }
              : { label: "Returning first-timer", tone: "info" as PillTone },
          };
        }),
      ]
    : [];
  const absent = members.filter((m) => !came.has(String(m.userId))).map((m) => m.name);

  const buttons: CommDialogButton[] = [];
  if (g && canDelete) buttons.push({ label: "Delete", onClick: () => onDelete(g), tone: "danger" });
  if (g && canEdit) buttons.push({ label: "Edit meeting", onClick: () => onEdit(g), tone: "primary" });

  const facts = g
    ? [
        { l: "Members present", v: `${came.size} of ${members.length}` },
        { l: "First-timers", v: String(g.attendees.length) },
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
      <DrawerSection title="Attendees">
        {people.length ? (
          <div className="overflow-hidden rounded-lg border border-lightGray">
            {people.map((p) => (
              <div key={p.key} className="flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-primary">{p.name}</p>
                  {p.sub && <p className="truncate text-xs text-[#6B7280]">{p.sub}</p>}
                </div>
                <Pill tone={p.pill.tone}>{p.pill.label}</Pill>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">No attendees recorded.</p>
        )}
      </DrawerSection>
      {absent.length > 0 && (
        <DrawerSection title="Didn’t come">
          <p className="text-sm text-[#4B5563]">{absent.join(", ")}</p>
        </DrawerSection>
      )}
    </RequisitionDrawerShell>
  );
};
