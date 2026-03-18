import type { ColumnFilter } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import useState from "react-usestateref";

import { useDelete } from "@/CustomHooks/useDelete";
import { useFetch } from "@/CustomHooks/useFetch";
import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { HeaderControls } from "@/components/HeaderControls";
import EmptyState from "@/components/EmptyState";
import { useStore } from "@/store/useStore";
import { MembersType, relativePath } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { QueryType } from "@/utils/interfaces";
import useWindowSize from "../../../../CustomHooks/useWindowSize";
import { SearchBar } from "../../../../components/SearchBar";
import PageOutline from "../../Components/PageOutline";
import GridComponent from "../../Components/reusable/GridComponent";
import { MembersCount } from "../../Components/reusable/MembersCount";
import { showDeleteDialog, showNotification } from "../../utils";
import { MemberCard } from "./Components/MemberCard";
import MembersFilter from "./Components/MembersFilter";
import { membersColumns } from "./utils";
import { UserType } from "./utils/membersInterfaces";

const PAGE_SIZE = 12;
const MEMBER_FILTER_KEYS = [
  "membership_type",
  "is_user",
  "department_id",
  "status",
  "is_active",
] as const;

const getMembershipTypeLabel = (value: string) => {
  if (value === "IN_HOUSE") return "In Person";
  if (value === "ONLINE") return "Online";
  return value;
};

const getWorkerLabel = (value: string) => {
  if (value === "true") return "Workers";
  if (value === "false") return "Non-workers";
  return value;
};

const getStatusLabel = (value: string) => {
  if (value === "UNCONFIRMED") return "Unconfirmed";
  if (value === "CONFIRMED") return "Confirmed";
  if (value === "MEMBER") return "Functional Member";
  return value;
};

const getActivityLabel = (value: string) => {
  if (value === "true") return "Active";
  if (value === "false") return "Inactive";
  return value;
};

export function Members() {
  const location = useLocation();
  const task = location.state?.task;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManage } = useAccessControl();
  const canManageMembers = canManage("Members");

  const { refetchMembersOptions } = useOutletContext<{
    refetchMembersOptions: (query?: QueryType) => void;
  }>();

  const pageParam = searchParams.get("page")?.trim() || "1";
  const takeParam = searchParams.get("take")?.trim() || String(PAGE_SIZE);
  const activeSearchTerm = searchParams.get("search")?.trim() || "";
  const membershipTypeFilter =
    searchParams.get("membership_type")?.trim() || "";
  const ministryRoleFilter = searchParams.get("is_user")?.trim() || "";
  const departmentFilter = searchParams.get("department_id")?.trim() || "";
  const statusFilter = searchParams.get("status")?.trim() || "";
  const activeStateFilter = searchParams.get("is_active")?.trim() || "";

  const [filterMembers, setFilterMembers] = useState(activeSearchTerm);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [, setDataToDelete, dataToDeleteRef] = useState<UserType | object>({});
  const [showSearch, setShowSearch] = useState(Boolean(activeSearchTerm));
  const [showFilter, setShowFilter] = useState(
    Boolean(
      membershipTypeFilter ||
      ministryRoleFilter ||
      departmentFilter ||
      statusFilter ||
      activeStateFilter,
    ),
  );

  const membersQuery = useMemo(() => {
    const query: QueryType = {
      page: pageParam,
      take: takeParam,
    };

    if (activeSearchTerm) query.search = activeSearchTerm;
    if (membershipTypeFilter) query.membership_type = membershipTypeFilter;
    if (ministryRoleFilter) query.is_user = ministryRoleFilter;
    if (departmentFilter) query.department_id = departmentFilter;
    if (statusFilter) query.status = statusFilter;
    if (activeStateFilter) query.is_active = activeStateFilter;

    return query;
  }, [
    activeSearchTerm,
    activeStateFilter,
    departmentFilter,
    membershipTypeFilter,
    ministryRoleFilter,
    pageParam,
    statusFilter,
    takeParam,
  ]);

  const {
    data: allMembers,
    loading: membersLoading,
    refetch: refetchMembers,
  } = useFetch(api.fetch.fetchAllMembers, membersQuery);
  const { data: departmentsResponse, refetch: refetchDepartments } = useFetch(
    api.fetch.fetchDepartments,
    undefined,
    true,
  );
  const members = Array.isArray(allMembers?.data) ? allMembers.data : [];
  const total = allMembers?.meta?.total ?? members.length;

  const columnVisibility = useMemo(() => {
    return {
      membership_type: false,
      is_user: false,
      department_id: false,
      Actions: canManageMembers,
    };
  }, [canManageMembers]);

  const { screenWidth } = useWindowSize();
  const { executeDelete, success } = useDelete(api.delete.deleteMember);
  const { refetch: refetchUserStats } = useFetch(
    api.fetch.fetchUserStats,
    undefined,
    true,
  );
  const store = useStore();
  const { userStats } = store;

  const columns = membersColumns;
  const crumbs = [
    { label: "Home", link: "/home" },
    { label: "Members", link: "/members" },
  ];

  const updateMemberQuery = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        const normalizedValue =
          typeof value === "string" ? value.trim() : value;

        if (normalizedValue) nextParams.set(key, normalizedValue);
        else nextParams.delete(key);
      });

      nextParams.set("page", "1");
      nextParams.set("take", String(PAGE_SIZE));
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const departmentOptions = useMemo(() => {
    const departments = Array.isArray(departmentsResponse?.data)
      ? departmentsResponse.data
      : [];

    return [
      { label: "Unassigned", value: "unassigned" },
      ...departments.map((department) => ({
        label: department.name,
        value: String(department.id),
      })),
    ];
  }, [departmentsResponse]);

  const departmentLabelById = useMemo(() => {
    return departmentOptions.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, [departmentOptions]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];

    if (membershipTypeFilter) {
      chips.push({
        key: "membership_type",
        label: `Membership: ${getMembershipTypeLabel(membershipTypeFilter)}`,
      });
    }

    if (ministryRoleFilter) {
      chips.push({
        key: "is_user",
        label: `Ministry role: ${getWorkerLabel(ministryRoleFilter)}`,
      });
    }

    if (departmentFilter) {
      chips.push({
        key: "department_id",
        label: `Department: ${departmentLabelById[departmentFilter] || "Selected"}`,
      });
    }

    if (statusFilter) {
      chips.push({
        key: "status",
        label: `Status: ${getStatusLabel(statusFilter)}`,
      });
    }

    if (activeStateFilter) {
      chips.push({
        key: "is_active",
        label: `Activity: ${getActivityLabel(activeStateFilter)}`,
      });
    }

    return chips;
  }, [
    activeStateFilter,
    departmentFilter,
    departmentLabelById,
    membershipTypeFilter,
    ministryRoleFilter,
    statusFilter,
  ]);

  const hasLoadedMembers = allMembers !== null;
  const hasActiveSearch = activeSearchTerm.length > 0;
  const hasActiveFilters = activeFilterChips.length > 0;
  const showSearchEmptyState =
    hasLoadedMembers &&
    !membersLoading &&
    members.length === 0 &&
    hasActiveSearch;
  const showFilterEmptyState =
    hasLoadedMembers &&
    !membersLoading &&
    members.length === 0 &&
    !hasActiveSearch &&
    hasActiveFilters;
  const showPageEmptyState =
    hasLoadedMembers &&
    !membersLoading &&
    members.length === 0 &&
    !hasActiveSearch &&
    !hasActiveFilters;

  useEffect(() => {
    setFilterMembers(activeSearchTerm);
  }, [activeSearchTerm, setFilterMembers]);

  useEffect(() => {
    if (!searchParams.get("page") || !searchParams.get("take")) {
      const nextParams = new URLSearchParams(searchParams);
      if (!searchParams.get("page")) nextParams.set("page", "1");
      if (!searchParams.get("take")) nextParams.set("take", String(PAGE_SIZE));
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (hasActiveSearch) setShowSearch(true);
  }, [hasActiveSearch, setShowSearch]);

  useEffect(() => {
    if (hasActiveFilters) setShowFilter(true);
  }, [hasActiveFilters, setShowFilter]);

  useEffect(() => {
    if (showFilter || departmentFilter) {
      refetchDepartments();
    }
  }, [departmentFilter, refetchDepartments, showFilter]);

  // Handle notifications on delete
  useEffect(() => {
    const handleEffect = async () => {
      if (success) {
        showNotification("Member Deleted Successfully");
        refetchMembers();
        refetchMembersOptions();
        const userStatsData = await refetchUserStats();
        if (userStatsData) store.setUserStats(userStatsData.data);
      }
    };
    handleEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // Show notification after adding a member
  useEffect(() => {
    if (task) {
      showNotification(
        task === "add"
          ? "Member Added Successfully"
          : "Member Updated Successfully",
      );
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [task, location.pathname, navigate]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterMembers(e.target.value);
  };

  const handleSearchSubmit = useCallback(() => {
    const normalizedName = filterMembers.trim();
    updateMemberQuery({ search: normalizedName || null });
  }, [filterMembers, updateMemberQuery]);

  const handleNavigation = () => {
    navigate(`/home/${relativePath.home.members.manage}`);
  };

  const handleDelete = async () => {
    if (!("id" in dataToDeleteRef.current)) return;
    const id = dataToDeleteRef.current.id;
    await executeDelete({ id: String(id) });
  };

  const handleDeleteModal = (val?: MembersType) => {
    if (val) {
      setDataToDelete(val);
      showDeleteDialog(val, handleDelete);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    updateMemberQuery({ [name]: value || null });
  };

  const clearSearch = useCallback(() => {
    setFilterMembers("");
    updateMemberQuery({ search: null });
  }, [setFilterMembers, updateMemberQuery]);

  const clearMemberFilters = useCallback(() => {
    const filterResets = MEMBER_FILTER_KEYS.reduce<
      Record<string, string | null | undefined>
    >((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});

    updateMemberQuery(filterResets);
  }, [updateMemberQuery]);

  const clearAllCriteria = useCallback(() => {
    const resets = MEMBER_FILTER_KEYS.reduce<
      Record<string, string | null | undefined>
    >(
      (acc, key) => {
        acc[key] = null;
        return acc;
      },
      { search: null },
    );

    setFilterMembers("");
    updateMemberQuery(resets);
  }, [setFilterMembers, updateMemberQuery]);

  const clearSingleFilter = useCallback(
    (key: string) => {
      updateMemberQuery({ [key]: null });
    },
    [updateMemberQuery],
  );

  const membersCount = [
    {
      count: userStats.inhouse.total_members,
      label: "In person church family",
    },
    { count: userStats.inhouse.stats.adults.Male, label: "Adult male" },
    { count: userStats.inhouse.stats.adults.Female, label: "Adult female" },
    { count: userStats.inhouse.stats.children.Male, label: "Children male" },
    {
      count: userStats.inhouse.stats.children.Female,
      label: "Children female",
    },
  ];

  const visitorsCount = [
    {
      count: userStats.online.total_members,
      label: "Online e-church family",
    },
    { count: userStats.online.stats.adults.Male, label: "Adult male" },
    { count: userStats.online.stats.adults.Female, label: "Adult female" },
    { count: userStats.online.stats.children.Male, label: "Children male" },
    {
      count: userStats.online.stats.children.Female,
      label: "Children female",
    },
  ];

  const resultSummary = membersLoading
    ? "Loading church membership directory..."
    : total === 1
      ? "1 member matches the current view."
      : `${total} members match the current view.`;

  return (
    <PageOutline crumbs={crumbs}>
      <section className="flex flex-col gap-5 rounded-xl bg-white p-4">
        <HeaderControls
          title={`Church Memberships (${
            (userStats.online?.total_members ?? 0) +
            (userStats.inhouse?.total_members ?? 0)
          })`}
          hasFilter={true}
          hasSearch={true}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          handleClick={handleNavigation}
          screenWidth={screenWidth}
          btnName={canManageMembers ? "Add Member" : ""}
          subtitle="Search the member directory and refine by church membership, ministry role, department, status, and activity."
        />

        {showSearch ? (
          <div className="rounded-2xl border border-lightGray bg-lightGray/10 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-primary">
                  Search Directory
                </h2>
                <p className="text-sm text-primaryGray">
                  Search by member name, member ID, email, or primary phone
                  number.
                </p>
              </div>

              <button
                type="button"
                onClick={clearSearch}
                disabled={!filterMembers && !hasActiveSearch}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-lightGray px-4 text-sm font-medium text-primary transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-lightGray/40"
              >
                Clear search
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <SearchBar
                className="h-11 max-w-none"
                placeholder="Search members here..."
                value={filterMembers}
                onChange={handleSearchChange}
                id="searchMembers"
                onSubmit={handleSearchSubmit}
              />

              <button
                type="button"
                onClick={handleSearchSubmit}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Search
              </button>
            </div>
          </div>
        ) : null}

        {showFilter ? (
          <div className="rounded-2xl border border-lightGray bg-[#fafbfc] p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-primary">
                  Refine Members
                </h2>
                <p className="text-sm text-primaryGray">
                  Combine filters to narrow the directory without losing the
                  search term.
                </p>
              </div>

              <button
                type="button"
                onClick={clearMemberFilters}
                disabled={!hasActiveFilters}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-lightGray px-4 text-sm font-medium text-primary transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-lightGray/40"
              >
                Reset filters
              </button>
            </div>

            <MembersFilter
              onChange={handleFilterChange}
              values={{
                membership_type: membershipTypeFilter,
                is_user: ministryRoleFilter,
                department_id: departmentFilter,
                status: statusFilter,
                is_active: activeStateFilter,
              }}
              departmentOptions={departmentOptions}
            />
          </div>
        ) : null}

        {hasActiveSearch || hasActiveFilters ? (
          <div className="rounded-2xl border border-lightGray bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">
                  Active search and filters
                </p>
                <p className="text-sm text-primaryGray">
                  The current member view stays in the URL, so refresh and
                  shared links keep the same results.
                </p>
              </div>

              <button
                type="button"
                onClick={clearAllCriteria}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-lightGray px-4 text-sm font-medium text-primary transition hover:bg-lightGray/40"
              >
                Clear all
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {hasActiveSearch ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/15"
                >
                  <span>Search: "{activeSearchTerm}"</span>
                  <span aria-hidden="true">x</span>
                </button>
              ) : null}

              {activeFilterChips.map((chip) => (
                <button
                  type="button"
                  key={chip.key}
                  onClick={() => clearSingleFilter(chip.key)}
                  className="inline-flex items-center gap-2 rounded-full bg-lightGray/50 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-lightGray"
                >
                  <span>{chip.label}</span>
                  <span aria-hidden="true">x</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="hidden w-full gap-4 sm:hidden md:flex md:flex-col lg:flex lg:flex-row xl:flex-row">
          <MembersCount items={membersCount} />
          <MembersCount items={visitorsCount} />
        </div>

        <div className="w-full rounded-xl bg-transparent">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-primaryGray">{resultSummary}</p>
            {(hasActiveSearch || hasActiveFilters) && !membersLoading ? (
              <p className="text-sm text-primaryGray">
                Showing {members.length} member{members.length === 1 ? "" : "s"}{" "}
                on this page.
              </p>
            ) : null}
          </div>

          {showSearchEmptyState ? (
            <EmptyState
              scope="section"
              title="No members found"
              description={
                hasActiveFilters
                  ? `No church members match "${activeSearchTerm}" with the current filters. Try broadening the search or clearing some filters.`
                  : `No church members match "${activeSearchTerm}". Try another name, member ID, email, or phone number.`
              }
              actionLabel={
                hasActiveFilters ? "Clear search and filters" : "Clear search"
              }
              onAction={hasActiveFilters ? clearAllCriteria : clearSearch}
            />
          ) : null}

          {showFilterEmptyState ? (
            <EmptyState
              scope="section"
              title="No members match these filters"
              description="Adjust the membership filters or clear them to view more church members."
              actionLabel="Clear filters"
              onAction={clearMemberFilters}
            />
          ) : null}

          {showPageEmptyState ? (
            <EmptyState
              scope="page"
              title="No church members yet"
              description="Member records will appear here once profiles are added or synced."
            />
          ) : null}

          {!showSearchEmptyState &&
          !showFilterEmptyState &&
          !showPageEmptyState ? (
            <GridComponent
              columns={columns}
              data={members}
              displayedCount={PAGE_SIZE}
              total={total}
              filter=""
              setFilter={() => {}}
              columnFilters={columnFilters}
              setColumnFilters={setColumnFilters}
              columnVisibility={columnVisibility}
              onPageChange={() => {}}
              renderRow={(row) => (
                <MemberCard
                  member={row.original}
                  key={row.id}
                  showOptions={showOptions === row.original.id}
                  onShowOptions={() =>
                    setShowOptions((prev) =>
                      prev === row.original.id ? false : row.original.id,
                    )
                  }
                  onCloseOptions={() => setShowOptions(false)}
                  onDelete={handleDeleteModal}
                  canManage={canManageMembers}
                />
              )}
            />
          ) : null}
        </div>
      </section>
    </PageOutline>
  );
}
