import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { AddDepartmentMemberDialog } from "@/pages/HomePage/pages/MembershipManagement/components/departments/AddDepartmentMemberDialog";
import {
  DepartmentJoinRequestsTab,
  DepartmentMembersTab,
  DepartmentPositionsTab,
} from "@/pages/HomePage/pages/MembershipManagement/components/departments/DepartmentDetailTabs";
import { DepartmentFormDialog } from "@/pages/HomePage/pages/MembershipManagement/components/departments/DepartmentFormDialog";
import {
  clearDepartmentHead,
  setDepartmentHead,
} from "@/pages/HomePage/pages/MembershipManagement/components/departments/departmentMutations";
import {
  apiErrorMessage,
  departmentStatusPill,
  departmentsListPath,
  memberProfilePath,
  type DepartmentMemberRow,
  type DepartmentRecord,
} from "@/pages/HomePage/pages/MembershipManagement/components/departments/departmentShared";
import {
  ApproveJoinRequestDialog,
  DeclineJoinRequestDialog,
} from "@/pages/HomePage/pages/MembershipManagement/components/departments/JoinRequestDialogs";
import {
  BandTabs,
  SectionEmpty,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  plural,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import {
  decodeQuery,
  encodeQuery,
  showLoader,
  showNotification,
} from "@/pages/HomePage/utils";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type { JoinRequestRow } from "@/utils";
import { removeMemberFromDepartment } from "@/utils/api/members/membershipActions";
import type { ApiResponse, QueryType } from "@/utils/interfaces";

type MembershipOutletContext = {
  refetchDepartments: (query?: QueryType) => Promise<unknown>;
};

type DetailTab = "members" | "positions" | "joins";

type DepartmentDetailsResponse = ApiResponse<
  (DepartmentRecord & { members: DepartmentMemberRow[] }) | null
> & { total?: number; totalPages?: number };

const MEMBERS_PER_PAGE = 12;
/** Upper bound for the unpaginated roster used by the Positions tab and pickers. */
const ROSTER_LIMIT = 1000;

const fetchDetails = api.fetch.fetchDepartmentDetails as unknown as (
  query?: QueryType
) => Promise<DepartmentDetailsResponse>;

export const DepartmentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { refetchDepartments } = useOutletContext<MembershipOutletContext>();
  const { canManage, getScope } = useAccessControl();
  const canManageDepartments = canManage("Departments");
  const isHodScopedAccess = getScope("Departments") === "assigned_departments";
  const canSeeJoinRequests = canManage("Membership_Management") || isHodScopedAccess;
  const departments = useSettingsStore(
    (state) => state.departments
  ) as DepartmentRecord[];
  const storePositions = useSettingsStore((state) => state.positions) as {
    id: number;
    name: string;
    department?: { id: number } | null;
  }[];
  const { activeBranchId, branches } = useBranchStore();

  const [tab, setTab] = useState<DetailTab>("members");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [approving, setApproving] = useState<JoinRequestRow | null>(null);
  const [declining, setDeclining] = useState<JoinRequestRow | null>(null);

  const departmentId = useMemo(() => {
    if (!id) return null;
    const decoded = Number(decodeQuery(String(id)));
    return Number.isFinite(decoded) && decoded > 0 ? decoded : null;
  }, [id]);

  // Server-side search, debounced.
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, departmentId]);

  useEffect(() => {
    if (departments.length === 0) void refetchDepartments();
  }, [departments.length, refetchDepartments]);

  const pageQuery = useMemo(
    () =>
      departmentId === null
        ? undefined
        : {
            id: String(departmentId),
            page: String(page),
            limit: String(MEMBERS_PER_PAGE),
            ...(appliedSearch ? { name: appliedSearch } : {}),
          },
    [appliedSearch, departmentId, page]
  );
  const {
    data: pageResponse,
    loading: pageLoading,
    error: pageError,
    refetch: refetchPage,
  } = useFetch(fetchDetails, pageQuery, departmentId === null);

  const rosterQuery = useMemo(
    () =>
      departmentId === null
        ? undefined
        : { id: String(departmentId), page: "1", limit: String(ROSTER_LIMIT) },
    [departmentId]
  );
  const { data: rosterResponse, refetch: refetchRoster } = useFetch(
    fetchDetails,
    rosterQuery,
    departmentId === null,
    { silent: true }
  );

  const joinQuery = useMemo(
    // Any status other than PENDING/APPROVED/DECLINED returns every status.
    () => ({
      ...(buildBranchQuery(activeBranchId) ?? {}),
      status: "ALL",
      ...(departmentId !== null ? { department_id: departmentId } : {}),
    }),
    [activeBranchId, departmentId]
  );
  const {
    data: joinResponse,
    loading: joinLoading,
    refetch: refetchJoins,
  } = useFetch(
    api.fetch.fetchJoinRequests,
    joinQuery,
    !canSeeJoinRequests || departmentId === null,
    { silent: true }
  );

  const storeDepartment = departments.find((item) => item.id === departmentId);
  const department: DepartmentRecord | undefined =
    rosterResponse?.data ?? pageResponse?.data ?? storeDepartment;
  const roster = useMemo(() => rosterResponse?.data?.members ?? [], [rosterResponse]);
  const pageMembers = pageResponse?.data?.members ?? [];
  const pageTotal = pageResponse?.meta?.total ?? pageResponse?.total ?? pageMembers.length;
  const totalPages = Math.max(1, Math.ceil(pageTotal / MEMBERS_PER_PAGE));
  const memberCount =
    rosterResponse?.data?.member_count ??
    storeDepartment?.member_count ??
    (appliedSearch ? roster.length : pageTotal);
  const headId = department?.department_head_info?.id ?? department?.department_head ?? null;

  const positions = useMemo(() => {
    const fromDepartment = storeDepartment?.position ?? [];
    if (fromDepartment.length > 0) return fromDepartment;
    return storePositions
      .filter((position) => position.department?.id === departmentId)
      .map((position) => ({ id: position.id, name: position.name }));
  }, [departmentId, storeDepartment, storePositions]);

  const rosterIds = useMemo(() => new Set(roster.map((member) => member.id)), [roster]);

  const requests = useMemo(
    () =>
      (joinResponse?.data ?? []).filter(
        (request) => request.department_id === departmentId
      ),
    [departmentId, joinResponse]
  );
  const pendingCount = requests.filter((request) => request.status === "PENDING").length;

  const branchName = branches.find((branch) => branch.id === department?.branch_id)?.name;
  const status = departmentStatusPill(department?.status);

  const refreshAll = () => {
    void refetchPage();
    void refetchRoster();
    void refetchDepartments();
  };

  const openMember = (memberId: number) =>
    navigate(memberProfilePath(encodeQuery(memberId)));

  const makeHead = async (member: DepartmentMemberRow) => {
    if (!department) return;
    showLoader(true);
    try {
      await setDepartmentHead(department, member.id);
      showNotification(`${member.name} is now head of ${department.name}`, "success");
      refreshAll();
    } catch (error) {
      showNotification(apiErrorMessage(error, "Unable to change the head."), "error");
    } finally {
      showLoader(false);
    }
  };

  const removeMember = async (member: DepartmentMemberRow) => {
    if (!department) return;
    showLoader(true);
    try {
      await removeMemberFromDepartment(member.id, department.id);
    } catch (error) {
      showNotification(apiErrorMessage(error, "Unable to remove member."), "error");
      showLoader(false);
      return;
    }
    try {
      if (member.id === headId) await clearDepartmentHead(department);
      showNotification(`${member.name} removed from ${department.name}`, "success");
    } catch (error) {
      showNotification(
        apiErrorMessage(
          error,
          `${member.name} was removed, but the department head couldn't be cleared.`
        ),
        "error"
      );
    } finally {
      refreshAll();
      showLoader(false);
    }
  };

  const afterJoinDecision = () => {
    setApproving(null);
    setDeclining(null);
    void refetchJoins();
    refreshAll();
  };

  const notFound =
    departmentId === null || (Boolean(pageResponse) && !pageResponse?.data && !pageLoading);

  if (notFound) {
    return (
      <PageOutline
        crumbs={[
          { label: "Departments and Ministries", link: departmentsListPath },
          { label: "Department" },
        ]}
      >
        <SectionEmpty
          title="Department not found"
          text="It may have been deleted, or you may not have access to it."
        />
      </PageOutline>
    );
  }

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "members", label: `Members (${memberCount})` },
    { key: "positions", label: "Positions" },
    ...(canSeeJoinRequests
      ? [{ key: "joins" as const, label: `Join requests (${pendingCount})` }]
      : []),
  ];

  const headName = department?.department_head_info?.name?.trim();
  const meta = [
    headName ? `Head: ${headName}` : "Head not assigned",
    plural(memberCount, "member"),
    branchName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-4 bg-primary px-[var(--app-page-padding-inline)] pt-5 text-white">
        <button
          type="button"
          onClick={() => navigate(departmentsListPath)}
          className="self-start bg-transparent p-0 text-sm text-white/80 transition-colors hover:text-white"
        >
          ← Back to departments
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 max-w-[760px] flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold leading-8">
                {department?.name ?? "Loading department…"}
              </h1>
              {department && (
                <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
                  {status.label}
                </span>
              )}
            </div>
            <p className="text-sm text-white/85">
              {department?.description?.trim() || "No description yet."}
            </p>
            {department && <p className="text-sm text-white/85">{meta}</p>}
          </div>
          {canManageDepartments && department && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="min-h-10 rounded-lg border border-white/40 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Edit department
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="min-h-10 rounded-lg bg-white px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-[#F3F4F6]"
              >
                Add member
              </button>
            </div>
          )}
        </div>
        <BandTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="Department sections" />
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-white px-[var(--app-page-padding-inline)] py-6">
        {pageError && tab === "members" && (
          <p role="alert" className="text-sm text-[#B91C1C]">
            {apiErrorMessage(pageError, "Unable to load department members.")}
          </p>
        )}
        {tab === "members" && department && (
          <DepartmentMembersTab
            departmentId={department.id}
            departmentName={department.name}
            headId={headId}
            members={pageMembers}
            loading={pageLoading}
            search={search}
            onSearch={setSearch}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            canManage={canManageDepartments}
            onOpenMember={(member) => openMember(member.id)}
            onMakeHead={(member) => void makeHead(member)}
            onRemove={(member) => void removeMember(member)}
          />
        )}
        {tab === "positions" && department && (
          <DepartmentPositionsTab
            departmentId={department.id}
            positions={positions}
            members={roster}
          />
        )}
        {tab === "joins" && department && (
          <DepartmentJoinRequestsTab
            departmentName={department.name}
            requests={requests}
            loading={joinLoading}
            canDecide={canSeeJoinRequests}
            onOpenMember={openMember}
            onApprove={setApproving}
            onDecline={setDeclining}
          />
        )}
      </div>

      {department && (
        <>
          <DepartmentFormDialog
            open={editOpen}
            department={department}
            existingNames={departments}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false);
              refreshAll();
            }}
          />
          <AddDepartmentMemberDialog
            open={addOpen}
            departmentId={department.id}
            departmentName={department.name}
            positions={positions}
            memberIdsInDepartment={rosterIds}
            onClose={() => setAddOpen(false)}
            onAdded={() => {
              setAddOpen(false);
              refreshAll();
            }}
          />
          <ApproveJoinRequestDialog
            request={approving}
            positions={positions}
            onClose={() => setApproving(null)}
            onDone={afterJoinDecision}
          />
          <DeclineJoinRequestDialog
            request={declining}
            onClose={() => setDeclining(null)}
            onDone={afterJoinDecision}
          />
        </>
      )}
    </div>
  );
};

export default DepartmentDetails;
