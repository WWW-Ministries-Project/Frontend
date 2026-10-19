import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { DepartmentCard } from "@/pages/HomePage/pages/MembershipManagement/components/departments/DepartmentCard";
import { DepartmentDeleteDialog } from "@/pages/HomePage/pages/MembershipManagement/components/departments/DepartmentDeleteDialog";
import { DepartmentFormDialog } from "@/pages/HomePage/pages/MembershipManagement/components/departments/DepartmentFormDialog";
import { setDepartmentStatus } from "@/pages/HomePage/pages/MembershipManagement/components/departments/departmentMutations";
import {
  apiErrorMessage,
  departmentsListPath,
  type DepartmentRecord,
} from "@/pages/HomePage/pages/MembershipManagement/components/departments/departmentShared";
import {
  PageHeading,
  PillTabs,
  SearchInput,
  SectionEmpty,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { encodeQuery, showLoader, showNotification } from "@/pages/HomePage/utils";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api, relativePath } from "@/utils";
import type { QueryType } from "@/utils/interfaces";

type MembershipOutletContext = {
  refetchDepartments: (query?: QueryType) => Promise<unknown>;
};

type StatusTab = "all" | "OPEN" | "CLOSED";

const matchesTab = (department: DepartmentRecord, tab: StatusTab) =>
  tab === "all" || (department.status ?? "OPEN") === tab;

export const DepartmentsAndMinistries = () => {
  const navigate = useNavigate();
  const { canAdmin, canManage, getScope } = useAccessControl();
  const canManageDepartments = canManage("Departments");
  const canDeleteDepartments = canAdmin("Departments");
  const isHodScopedAccess = getScope("Departments") === "assigned_departments";
  // The join-request list is open to membership managers and department heads.
  const canSeeJoinRequests = canManage("Membership_Management") || isHodScopedAccess;
  const { refetchDepartments } = useOutletContext<MembershipOutletContext>();
  const departments = useSettingsStore(
    (state) => state.departments
  ) as DepartmentRecord[];
  const departmentTotal = useSettingsStore((state) => state.departmentTotal);
  const { activeBranchId } = useBranchStore();

  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [deleting, setDeleting] = useState<DepartmentRecord | null>(null);

  const joinQuery = useMemo(
    () => ({ ...(buildBranchQuery(activeBranchId) ?? {}), status: "PENDING" }),
    [activeBranchId]
  );
  const { data: joinData, refetch: refetchJoins } = useFetch(
    api.fetch.fetchJoinRequests,
    joinQuery,
    !canSeeJoinRequests,
    { silent: true }
  );

  useEffect(() => {
    if (departments.length === 0) void refetchDepartments();
  }, [departments.length, refetchDepartments]);

  const pendingByDepartment = useMemo(() => {
    const counts = new Map<number, number>();
    (joinData?.data ?? []).forEach((request) => {
      if (request.status !== "PENDING" || !request.department_id) return;
      counts.set(request.department_id, (counts.get(request.department_id) ?? 0) + 1);
    });
    return counts;
  }, [joinData]);

  const searched = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((department) =>
      [department.name, department.department_head_info?.name].some((field) =>
        field?.toLowerCase().includes(term)
      )
    );
  }, [departments, search]);

  const visible = useMemo(
    () => searched.filter((department) => matchesTab(department, tab)),
    [searched, tab]
  );

  const tabs = (
    [
      ["all", "All"],
      ["OPEN", "Open"],
      ["CLOSED", "Closed"],
    ] as const
  ).map(([key, label]) => ({
    key,
    label,
    count: searched.filter((department) => matchesTab(department, key)).length,
  }));

  const openDepartment = (department: DepartmentRecord) =>
    navigate(`${departmentsListPath}/${encodeQuery(department.id)}`);

  const toggleStatus = async (department: DepartmentRecord) => {
    const closing = (department.status ?? "OPEN") === "OPEN";
    showLoader(true);
    try {
      await setDepartmentStatus(department, closing ? "CLOSED" : "OPEN");
      showNotification(`${department.name} ${closing ? "closed" : "reopened"}`, "success");
      await refetchDepartments();
    } catch (error) {
      showNotification(apiErrorMessage(error, "Unable to update department."), "error");
    } finally {
      showLoader(false);
    }
  };

  const menuFor = (department: DepartmentRecord) => [
    {
      label: "Edit department",
      hidden: !canManageDepartments,
      onClick: () => {
        setEditing(department);
        setFormOpen(true);
      },
    },
    {
      label:
        (department.status ?? "OPEN") === "OPEN" ? "Close department" : "Reopen department",
      hidden: !canManageDepartments,
      onClick: () => void toggleStatus(department),
    },
    {
      label: "Delete department",
      danger: true,
      hidden: !canManageDepartments || !canDeleteDepartments,
      onClick: () => setDeleting(department),
    },
  ];

  const crumbs = [
    { label: "Home", link: relativePath.home.main },
    {
      label: "Membership",
      link: `${relativePath.home.main}/${relativePath.home.membership.main}`,
    },
    { label: "Departments and Ministries" },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      <div className="flex flex-col gap-6">
        <PageHeading
          title={`Departments and Ministries (${departmentTotal || departments.length})`}
          subtitle={
            isHodScopedAccess
              ? "You can see the departments you lead."
              : "Create departments, assign heads and see who serves where."
          }
          actions={
            canManageDepartments && !isHodScopedAccess ? (
              <UiButton
                tone="primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Create department
              </UiButton>
            ) : undefined
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <PillTabs tabs={tabs} value={tab} onChange={setTab} ariaLabel="Department status" />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search departments or heads"
            ariaLabel="Search departments"
            className="max-w-[420px]"
          />
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
            {visible.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                pendingRequests={
                  canSeeJoinRequests ? pendingByDepartment.get(department.id) ?? 0 : null
                }
                menuItems={menuFor(department)}
                onOpen={() => openDepartment(department)}
              />
            ))}
          </div>
        ) : (
          <SectionEmpty
            title="No departments match"
            text="Try another status or clear the search."
          />
        )}
      </div>

      <DepartmentFormDialog
        open={formOpen}
        department={editing}
        existingNames={departments}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          void refetchDepartments();
        }}
      />
      <DepartmentDeleteDialog
        department={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          void refetchDepartments();
          if (canSeeJoinRequests) void refetchJoins();
        }}
      />
    </PageOutline>
  );
};

export default DepartmentsAndMinistries;
