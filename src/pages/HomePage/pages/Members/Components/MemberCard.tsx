import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

import {
  ActionMenu,
  ActionMenuItem,
  MemberStatusPill,
  Pill,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  initialsOf,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { cn } from "@/utils/cn";

import {
  departmentNames,
  DirectoryMember,
  MASKED_VALUE,
  membershipTypeLabel,
  phoneLabel,
} from "./directory/directoryHelpers";

interface MemberCardProps {
  member: DirectoryMember;
  /** Member is on the viewer's exclusion list: contact masked, no profile. */
  restricted: boolean;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onView?: () => void;
  menuItems: ActionMenuItem[];
}

export const MemberAvatar = ({
  member,
  className,
}: {
  member: DirectoryMember;
  className?: string;
}) =>
  member.photo ? (
    <img
      src={member.photo}
      alt=""
      className={cn("border border-lightGray bg-lightGray object-cover", className)}
    />
  ) : (
    <div
      className={cn(
        "flex items-center justify-center border border-lightGray bg-lightGray font-semibold text-primary/70",
        className
      )}
    >
      {initialsOf(member.name)}
    </div>
  );

export const MemberCard = ({
  member,
  restricted,
  selectable,
  selected,
  onToggleSelect,
  onView,
  menuItems,
}: MemberCardProps) => {
  const departments = departmentNames(member);
  const email = restricted ? MASKED_VALUE : member.email || "No email";
  const phone = restricted ? MASKED_VALUE : phoneLabel(member) || "No phone number";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-[0_8px_24px_rgba(8,13,45,0.08)] transition-shadow hover:shadow-[0_10px_28px_rgba(8,13,45,0.2)]",
        selected ? "border-primary" : "border-lightGray"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <MemberAvatar member={member} className="h-[72px] w-[72px] rounded-xl text-xl" />
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select ${member.name}`}
              className="absolute -left-1.5 -top-1.5 m-0 h-[18px] w-[18px] cursor-pointer bg-white accent-primary"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <button
            type="button"
            onClick={onView}
            disabled={!onView}
            className="truncate text-left text-lg font-semibold leading-7 text-primary disabled:cursor-default"
          >
            {member.name}
          </button>
          <p className="text-sm text-[#4B5563]">{member.member_id || "Member ID pending"}</p>
          <p className="text-xs text-[#6B7280]">
            {departments.length ? departments.join(", ") : "No department"}
          </p>
        </div>
        <ActionMenu items={menuItems} ariaLabel="Member actions" />
      </div>

      <div className="flex flex-col gap-2 text-sm text-primary">
        <div className="flex min-w-0 items-center gap-2">
          <EnvelopeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-2">
          <PhoneIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{phone}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill tone="neutral">{membershipTypeLabel(member.membership_type)}</Pill>
        {member.is_user ? (
          <Pill tone="primary">Ministry worker</Pill>
        ) : (
          <Pill tone="neutral">Church member</Pill>
        )}
        <MemberStatusPill member={member} />
      </div>

      <button
        type="button"
        onClick={onView}
        disabled={!onView}
        className="mt-auto min-h-10 w-full rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        View profile
      </button>
    </div>
  );
};
