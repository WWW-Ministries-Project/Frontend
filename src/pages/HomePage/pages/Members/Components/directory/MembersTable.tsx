import {
  ActionMenu,
  ActionMenuItem,
  GridColumn,
  GridTable,
  MemberStatusPill,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  formatDate,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { cn } from "@/utils/cn";

import { MemberAvatar } from "../MemberCard";
import {
  departmentNames,
  DirectoryMember,
  joinedDate,
  MASKED_VALUE,
  membershipTypeLabel,
  phoneLabel,
} from "./directoryHelpers";

interface MembersTableProps {
  rows: DirectoryMember[];
  loading: boolean;
  selectable: boolean;
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  isRestricted: (member: DirectoryMember) => boolean;
  onView: (member: DirectoryMember) => void;
  menuItemsFor: (member: DirectoryMember) => ActionMenuItem[];
}

export const MembersTable = ({
  rows,
  loading,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
  isRestricted,
  onView,
  menuItemsFor,
}: MembersTableProps) => {
  const columns: GridColumn<DirectoryMember>[] = [
    {
      key: "name",
      header: "Name",
      width: "minmax(220px,2.2fr)",
      render: (member) => (
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatar
            member={member}
            className={cn(
              "h-10 w-10 flex-shrink-0 rounded-full border-2 text-sm",
              member.is_active === false ? "border-red-700" : "border-green-700"
            )}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{member.name}</p>
            <p className="text-xs text-gray-500">{member.member_id || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone number",
      width: "1.3fr",
      render: (member) => (
        <span>{isRestricted(member) ? MASKED_VALUE : phoneLabel(member) || "—"}</span>
      ),
    },
    {
      key: "membership",
      header: "Membership",
      width: "1fr",
      render: (member) => <span>{membershipTypeLabel(member.membership_type)}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "1.1fr",
      render: (member) => <MemberStatusPill member={member} />,
    },
    {
      key: "department",
      header: "Department",
      width: "1.5fr",
      render: (member) => {
        const names = departmentNames(member);
        return (
          <span className="block truncate">
            {names.length
              ? `${names[0]}${names.length > 1 ? ` +${names.length - 1}` : ""}`
              : "—"}
          </span>
        );
      },
    },
    {
      key: "joined",
      header: "Date joined",
      width: "1fr",
      render: (member) => <span>{formatDate(joinedDate(member))}</span>,
    },
  ];

  return (
    <GridTable
      columns={columns}
      rows={rows}
      loading={loading}
      getRowId={(member) => String(member.id)}
      selectable={selectable}
      selectedIds={selectedIds}
      onToggleRow={onToggleRow}
      onToggleAll={onToggleAll}
      onRowClick={(member) => {
        if (!isRestricted(member)) onView(member);
      }}
      renderActions={(member) => (
        <ActionMenu items={menuItemsFor(member)} ariaLabel="Member actions" />
      )}
      actionsWidth="56px"
      minWidth="980px"
    />
  );
};
