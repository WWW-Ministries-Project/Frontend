import { useBackNavigation } from "@/CustomHooks/useBackNavigation";
import { useMemo, useState } from "react";
import { Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import {
  ActionMenuItem,
  SectionEmpty,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  formatDate,
  memberStatusPill,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import {
  DirectoryDialog,
  DirectoryDialogs,
} from "@/pages/HomePage/pages/Members/Components/directory/DirectoryDialogs";
import {
  decodeQuery,
  encodeQuery,
  showLoader,
  showNotification,
} from "@/pages/HomePage/utils";
import { notify } from "@/components/feedback";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import {
  BulkOutcome,
  advanceMembers,
  assignMembersToDepartment,
  describeOutcome,
  removeMemberFromDepartment,
  setMembersActive,
} from "@/utils/api/members/membershipActions";
import { relativePath } from "@/utils/const";

import { AtAGlanceCard, MembershipJourneyCard } from "./ProfileAside";
import { ProfileBanner } from "./ProfileBanner";
import { ProfileSections } from "./ProfileSections";
import {
  ProfileDepartment,
  ProfileMember,
  ProfileTab,
  departmentsOf,
  familyOf,
  fullNameOf,
  joinedDateOf,
  journeyOf,
  membershipTypeLabel,
  parseProfileTab,
  phoneLabel,
  programsOf,
  relationOf,
  stageIndexOf,
  toDirectoryMember,
} from "./profileHelpers";

const DIRECTORY_PATH = "/home/membership";

/** Admin member profile (`/home/members/:id`). */
export const AdminMemberProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id ? decodeQuery(id) : "";
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseProfileTab(searchParams.get("tab"));
  const { hasAction } = useAccessControl();
  const canEdit = hasAction("Members.edit");
  const canChangeStatus = hasAction("Members.change_status");
  const canConfirm = canChangeStatus || hasAction("Membership_Management.confirm_member");
  const canDelete = hasAction("Members.delete");
  const branches = useBranchStore((state) => state.branches);
  const [dialog, setDialog] = useState<DirectoryDialog>(null);
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => (userId ? { user_id: String(userId) } : undefined), [userId]);
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchAMember, query, !userId);
  const member = data?.data as ProfileMember | undefined;

  const setTab = (next: ProfileTab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "basic") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  const back = useBackNavigation(DIRECTORY_PATH);

  if (!member) {
    const failed = !userId || (!loading && (Boolean(error) || Boolean(data)));
    return (
      <div className="flex min-h-full flex-col">
        <div className="flex flex-col gap-4 bg-primary px-4 pb-6 pt-5 text-white sm:px-6">
          <button
            type="button"
            onClick={back.goBack}
            className="self-start bg-transparent p-0 text-sm text-white/90 transition-colors hover:text-white"
          >
            ← Back to {back.label}
          </button>
          <h1 className="text-2xl font-semibold leading-8">
            {failed ? "Member profile" : "Loading member…"}
          </h1>
        </div>
        {failed && (
          <div className="bg-white px-4 py-6 sm:px-6">
            <SectionEmpty
              title="Member not found"
              text="This record may have been deleted, or you may not have access to it."
            />
          </div>
        )}
        <Outlet />
      </div>
    );
  }

  const memberId = member.id;
  const name = fullNameOf(member);
  const status = memberStatusPill(member);
  const stageIndex = stageIndexOf(member.status);
  const inactive = member.is_active === false;
  const departments = departmentsOf(member);
  const childCount = familyOf(member).filter((person) => relationOf(person) === "child").length;
  const programCount = programsOf(member).length;
  const branchName =
    branches.find((branch) => String(branch.id) === String(member.branch_id ?? ""))?.name ?? "";

  const nextStage: "CONFIRMED" | "MEMBER" | null =
    stageIndex === 0 ? "CONFIRMED" : stageIndex === 1 ? "MEMBER" : null;
  const nextLabel =
    nextStage === "CONFIRMED"
      ? "Confirm membership"
      : nextStage === "MEMBER"
        ? "Mark as functional member"
        : undefined;

  const run = async (
    action: () => Promise<BulkOutcome>,
    successText: string
  ) => {
    setBusy(true);
    showLoader(true);
    try {
      const outcome = await action();
      const { message, type } = describeOutcome(outcome, () => successText);
      showNotification(message, type);
      if (outcome.succeeded > 0) await refetch();
    } catch (reason) {
      notify.fromError(reason, { title: `Couldn't update ${name}` });
    } finally {
      setBusy(false);
      showLoader(false);
    }
  };

  const advance = () => {
    if (!nextStage) return;
    run(
      () => advanceMembers([memberId], nextStage),
      nextStage === "CONFIRMED"
        ? `${name} confirmed`
        : `${name} is now a functional member`
    );
  };

  const editProfile = () =>
    navigate(
      `/home/${relativePath.home.members.manage}?member_id=${encodeQuery(memberId)}`,
      { state: { mode: "edit" } }
    );

  const removeDepartment = async (department: ProfileDepartment) => {
    if (department.departmentId === null) return;
    const departmentId = department.departmentId;
    const departmentName = department.department;
    // Keep the position so Undo puts the member back exactly where they were.
    const previousRow = (Array.isArray(member.department_positions)
      ? member.department_positions
      : []
    ).find(
      (row) =>
        row && typeof row === "object" && Number(row.department_id) === departmentId
    );
    const previousPositionId =
      previousRow && typeof previousRow === "object" && Number(previousRow.position_id) > 0
        ? Number(previousRow.position_id)
        : null;

    showLoader(true);
    try {
      await removeMemberFromDepartment(memberId, departmentId);
      await refetch();
      notify.success({
        title: `Removed from ${departmentName}`,
        message: `${name} no longer appears on the roster.`,
        undo: async () => {
          const outcome = await assignMembersToDepartment(
            [memberId],
            departmentId,
            previousPositionId
          );
          if (outcome.failed > 0) throw new Error(outcome.errors[0]);
          await refetch();
        },
        undoneTitle: `${name} is back in ${departmentName}`,
      });
    } catch (reason) {
      notify.fromError(reason, {
        title: `Couldn't remove ${name} from ${departmentName}`,
      });
    } finally {
      showLoader(false);
    }
  };

  const directoryMember = toDirectoryMember(member);
  const menuItems: ActionMenuItem[] = [
    { label: "Edit details", hidden: !canEdit, onClick: editProfile },
    {
      label: "Confirm membership",
      hidden: !canConfirm || nextStage !== "CONFIRMED",
      onClick: advance,
    },
    {
      label: "Mark as functional member",
      hidden: !canConfirm || nextStage !== "MEMBER",
      onClick: advance,
    },
    {
      label: "Change status…",
      hidden: !canConfirm,
      onClick: () => setDialog({ kind: "status", members: [directoryMember] }),
    },
    {
      label: inactive ? "Reactivate" : "Mark inactive",
      hidden: !canChangeStatus,
      onClick: () =>
        run(
          () => setMembersActive([memberId], inactive),
          `${name} ${inactive ? "reactivated" : "marked inactive"}`
        ),
    },
    {
      label: "Delete member",
      danger: true,
      hidden: !canDelete,
      onClick: () => setDialog({ kind: "delete", members: [directoryMember] }),
    },
  ];

  const joined = formatDate(joinedDateOf(member));

  return (
    <div className="flex min-h-full flex-col">
      <ProfileBanner
        name={name}
        memberId={member.member_id}
        email={member.email}
        phone={phoneLabel(member.country_code, member.primary_number)}
        photo={member.photo}
        pills={[
          membershipTypeLabel(member.membership_type),
          status.label,
          member.is_user ? "Ministry worker" : "Church member",
        ].filter(Boolean)}
        onBack={back.goBack}
        backLabel={back.label}
        onEdit={canEdit ? editProfile : undefined}
        menuItems={menuItems}
        tab={tab}
        onTabChange={setTab}
      />

      <div className="grid flex-1 items-start gap-4 bg-white px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <ProfileSections
            tab={tab}
            member={member}
            branchName={branchName}
            departments={departments}
            canManage={canEdit}
            onAssignDepartment={() =>
              setDialog({ kind: "assign", members: [directoryMember] })
            }
            onRemoveDepartment={removeDepartment}
            onAddChild={editProfile}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <MembershipJourneyCard
            member={member}
            steps={journeyOf(member)}
            nextLabel={canConfirm && !inactive ? nextLabel : undefined}
            onAdvance={advance}
            busy={busy}
          />
          <AtAGlanceCard
            rows={[
              ["Member since", joined === "—" ? "" : joined],
              ["Branch", branchName],
              ["Departments", departments.length ? String(departments.length) : "None"],
              ["Children", String(childCount)],
              ["Programs", String(programCount)],
            ]}
          />
        </aside>
      </div>

      <DirectoryDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        onDone={() => {
          if (dialog?.kind === "delete") {
            navigate(DIRECTORY_PATH);
            return;
          }
          void refetch();
        }}
      />
      <Outlet />
    </div>
  );
};
