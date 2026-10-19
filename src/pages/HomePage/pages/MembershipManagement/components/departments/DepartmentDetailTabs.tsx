import {
  CellText,
  GridTable,
  MemberStatusPill,
  Pill,
  SearchInput,
  SectionEmpty,
  SectionHeading,
  UiButton,
  type GridColumn,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  daysAgoLabel,
  formatDate,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import type { JoinRequestRow } from "@/utils";

import {
  joinRequestDetails,
  memberPositionIn,
  type DepartmentMemberRow,
} from "./departmentShared";

/* -------------------------------------------------------------------------- */
/*                                 Members tab                                */
/* -------------------------------------------------------------------------- */

const phoneOf = (member: DepartmentMemberRow) =>
  member.primary_number
    ? [member.country_code, member.primary_number].filter(Boolean).join(" ")
    : "—";

export const DepartmentMembersTab = ({
  departmentId,
  departmentName,
  headId,
  members,
  loading,
  search,
  onSearch,
  page,
  totalPages,
  onPageChange,
  canManage,
  onOpenMember,
  onMakeHead,
  onRemove,
}: {
  departmentId: number;
  departmentName: string;
  headId: number | null;
  members: DepartmentMemberRow[];
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canManage: boolean;
  onOpenMember: (member: DepartmentMemberRow) => void;
  onMakeHead: (member: DepartmentMemberRow) => void;
  onRemove: (member: DepartmentMemberRow) => void;
}) => {
  const positionLabel = (member: DepartmentMemberRow) =>
    member.id === headId
      ? "Head of department"
      : memberPositionIn(member, departmentId).name ?? "Member";

  // Head first, then by position, then by name (within the current page).
  const rows = [...members].sort((a, b) => {
    if (a.id === headId) return -1;
    if (b.id === headId) return 1;
    return (
      positionLabel(a).localeCompare(positionLabel(b)) ||
      (a.name ?? "").localeCompare(b.name ?? "")
    );
  });

  const columns: GridColumn<DepartmentMemberRow>[] = [
    {
      key: "member",
      header: "Member",
      width: "minmax(200px,2fr)",
      render: (member) => <CellText main={member.name} sub={member.member_id} strong />,
    },
    {
      key: "position",
      header: "Position",
      width: "1.3fr",
      render: (member) => <CellText main={positionLabel(member)} />,
    },
    {
      key: "phone",
      header: "Phone number",
      width: "1.2fr",
      render: (member) => <CellText main={phoneOf(member)} />,
    },
    {
      key: "status",
      header: "Membership status",
      width: "1.1fr",
      render: (member) => <MemberStatusPill member={member} />,
    },
  ];

  const searching = search.trim().length > 0;

  return (
    <>
      <SectionHeading
        title={`Members in ${departmentName}`}
        description="Select a member to open their profile."
      >
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Search by name or member ID"
          ariaLabel="Search department members"
          className="max-w-[420px]"
        />
      </SectionHeading>

      {rows.length > 0 || loading ? (
        <GridTable
          columns={columns}
          rows={rows}
          getRowId={(member) => String(member.id)}
          onRowClick={onOpenMember}
          loading={loading}
          minWidth="900px"
          actionsWidth="240px"
          renderActions={
            canManage
              ? (member) => (
                  <>
                    {member.id !== headId && (
                      <UiButton size="sm" tone="secondary" onClick={() => onMakeHead(member)}>
                        Make head
                      </UiButton>
                    )}
                    <UiButton size="sm" tone="danger" onClick={() => onRemove(member)}>
                      Remove
                    </UiButton>
                  </>
                )
              : undefined
          }
        />
      ) : (
        <SectionEmpty
          title={searching ? "No members match" : "No members yet"}
          text={
            searching
              ? "Try a different name or ID."
              : "Add members or approve join requests to build this team."
          }
        />
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className="text-sm text-[#4B5563]">
            Page {page} of {totalPages}
          </span>
          <UiButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </UiButton>
          <UiButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </UiButton>
        </div>
      )}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Positions tab                               */
/* -------------------------------------------------------------------------- */

export const DepartmentPositionsTab = ({
  departmentId,
  positions,
  members,
}: {
  departmentId: number;
  positions: { id: number; name: string }[];
  members: DepartmentMemberRow[];
}) => {
  if (positions.length === 0) {
    return (
      <SectionEmpty
        title="No positions yet"
        text="Positions for this department are set up in Settings."
      />
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
      {positions.map((position) => {
        const holders = members.filter(
          (member) => memberPositionIn(member, departmentId).id === position.id
        );
        return (
          <div
            key={position.id}
            className="flex flex-col gap-2 rounded-xl border border-lightGray p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-primary">{position.name}</h3>
              <Pill tone="neutral">{holders.length}</Pill>
            </div>
            <p className="text-sm text-[#4B5563]">
              {holders.length
                ? holders.map((member) => member.name).join(", ")
                : "No one in this position yet."}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Join requests tab                             */
/* -------------------------------------------------------------------------- */

const STATUS_ORDER: Record<JoinRequestRow["status"], number> = {
  PENDING: 0,
  APPROVED: 1,
  DECLINED: 1,
};

export const DepartmentJoinRequestsTab = ({
  departmentName,
  requests,
  loading,
  canDecide,
  onOpenMember,
  onApprove,
  onDecline,
}: {
  departmentName: string;
  requests: JoinRequestRow[];
  loading: boolean;
  canDecide: boolean;
  onOpenMember: (memberId: number) => void;
  onApprove: (request: JoinRequestRow) => void;
  onDecline: (request: JoinRequestRow) => void;
}) => {
  const rows = [...requests].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
  );

  const columns: GridColumn<JoinRequestRow>[] = [
    {
      key: "member",
      header: "Member",
      width: "minmax(200px,2fr)",
      render: (request) => (
        <CellText
          main={request.member_name || "Removed member"}
          sub={request.phone_number || undefined}
          strong
        />
      ),
    },
    {
      key: "department",
      header: "Department",
      width: "1.2fr",
      render: (request) => <CellText main={request.department_name || departmentName} />,
    },
    {
      key: "requested",
      header: "Requested",
      width: "1.1fr",
      render: (request) => (
        <CellText
          main={formatDate(request.requested_at)}
          sub={daysAgoLabel(request.requested_at)}
        />
      ),
    },
    {
      key: "details",
      header: "Details",
      width: "1.6fr",
      render: (request) => {
        const { main, sub } = joinRequestDetails(request);
        return <CellText main={main} sub={sub} />;
      },
    },
  ];

  return (
    <>
      <SectionHeading
        title={`Requests to join ${departmentName}`}
        description="Approve with a position and start date, or decline with a reason."
      />
      {rows.length > 0 || loading ? (
        <GridTable
          columns={columns}
          rows={rows}
          getRowId={(request) => String(request.id)}
          onRowClick={(request) => request.member_id && onOpenMember(request.member_id)}
          loading={loading}
          minWidth="900px"
          renderActions={(request) =>
            request.status === "PENDING" ? (
              canDecide ? (
                <>
                  <UiButton size="sm" tone="primary" onClick={() => onApprove(request)}>
                    Approve
                  </UiButton>
                  <UiButton size="sm" tone="danger" onClick={() => onDecline(request)}>
                    Decline
                  </UiButton>
                </>
              ) : (
                <Pill tone="warning">Pending</Pill>
              )
            ) : request.status === "APPROVED" ? (
              <Pill tone="success">Approved</Pill>
            ) : (
              <Pill tone="danger">Declined</Pill>
            )
          }
        />
      ) : (
        <SectionEmpty
          title="No join requests"
          text="Requests from members who want to serve here will appear here."
        />
      )}
    </>
  );
};
