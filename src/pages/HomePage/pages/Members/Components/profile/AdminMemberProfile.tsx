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
  showConfirmDialog,
  showLoader,
  showNotification,
} from "@/pages/HomePage/utils";
import { useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import {
  BulkOutcome,
  advanceMembers,
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
  const { canManage } = useAccessControl();
  const canManageMembers = canManage("Members");
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

  const backToDirectory = () => navigate(DIRECTORY_PATH);

  if (!member) {
    const failed = !userId || (!loading && (Boolean(error) || Boolean(data)));
    return (
      <div className="flex min-h-full flex-col">
        <div className="flex flex-col gap-4 bg-primary px-4 pb-6 pt-5 text-white sm:px-6">
          <button
            type="button"
            onClick={backToDirectory}
            className="self-start bg-transparent p-0 text-sm text-white/90 transition-colors hover:text-white"
          >
            ← Back to members
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
      showNotification(
        (reason as { message?: string })?.message || "Something went wrong",
        "error"
      );
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

  const removeDepartment = (department: ProfileDepartment) => {
    if (department.departmentId === null) return;
    const departmentId = department.departmentId;
    showConfirmDialog(
      `Remove from ${department.department}?`,
      async () => {
        showLoader(true);
        try {
          await removeMemberFromDepartment(memberId, departmentId);
          showNotification(`Removed from ${department.department}`);
          await refetch();
        } catch (reason) {
          showNotification(
            (reason as { message?: string })?.message || "Something went wrong",
            "error"
          );
        } finally {
          showLoader(false);
        }
      },
      {
        message: `${name} will no longer serve in this department.`,
        confirmLabel: "Remove",
      }
    );
  };

  const directoryMember = toDirectoryMember(member);
  const menuItems: ActionMenuItem[] = [
    { label: "Edit details", hidden: !canManageMembers, onClick: editProfile },
    {
      label: "Confirm membership",
      hidden: !canManageMembers || nextStage !== "CONFIRMED",
      onClick: advance,
    },
    {
      label: "Mark as functional member",
      hidden: !canManageMembers || nextStage !== "MEMBER",
      onClick: advance,
    },
    {
      label: "Change status…",
      hidden: !canManageMembers,
      onClick: () => setDialog({ kind: "status", members: [directoryMember] }),
    },
    {
      label: inactive ? "Reactivate" : "Mark inactive",
      hidden: !canManageMembers,
      onClick: () =>
        run(
          () => setMembersActive([memberId], inactive),
          `${name} ${inactive ? "reactivated" : "marked inactive"}`
        ),
    },
    {
      label: "Delete member",
      danger: true,
      hidden: !canManageMembers,
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
        onBack={backToDirectory}
        onEdit={canManageMembers ? editProfile : undefined}
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
            canManage={canManageMembers}
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
            nextLabel={canManageMembers && !inactive ? nextLabel : undefined}
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
