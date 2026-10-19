import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";

import { useAccessControl } from "@/CustomHooks/useAccessControl";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePaginate } from "@/CustomHooks/usePaginate";
import {
  ActionMenuItem,
  BulkBar,
  FilterToggleButton,
  PageHeading,
  PillTabs,
  SearchInput,
  SectionEmpty,
  SelectInput,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { notify } from "@/components/feedback";
import { encodeQuery, showLoader, showNotification } from "@/pages/HomePage/utils";
import { useBranchStore } from "@/store/useBranchStore";
import { useStore } from "@/store/useStore";
import { relativePath } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import {
  advanceMembers,
  BulkOutcome,
  describeOutcome,
  exportMembersToExcel,
  setMembersActive,
} from "@/utils/api/members/membershipActions";
import { QueryType } from "@/utils/interfaces";

import PageOutline from "../../Components/PageOutline";
import { MemberCard } from "./Components/MemberCard";
import MembersFilter from "./Components/MembersFilter";
import { DirectoryDialog, DirectoryDialogs } from "./Components/directory/DirectoryDialogs";
import { DirectoryStats } from "./Components/directory/DirectoryStats";
import {
  buildDirectoryQuery,
  DirectoryFilters,
  DirectoryMember,
  EXPORT_TAKE,
  FILTER_KEYS,
  PAGE_SIZE,
  parseSort,
  parseStatusTab,
  SORT_OPTIONS,
  STATUS_TABS,
  statusTabCount,
  toExportRow,
  ViewMode,
} from "./Components/directory/directoryHelpers";
import { MembersTable } from "./Components/directory/MembersTable";

const crumbs = [{ label: "Home", link: "/home" }, { label: "Members" }];

const countText = (count: number) => `${count} ${count === 1 ? "member" : "members"}`;

/** The directory stat cards count active members only. */
const ACTIVE_STATS_QUERY: QueryType = { active_only: "true" };

const isUnconfirmed = (member: DirectoryMember) =>
  !member.status || member.status === "UNCONFIRMED";

export function Members() {
  const location = useLocation();
  const task = location.state?.task;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManage, isExcluded } = useAccessControl();
  const canManageMembers = canManage("Members");
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const departments = useSettingsStore((state) => state.departments);
  const store = useStore();

  const { refetchMembersOptions } = useOutletContext<{
    refetchMembersOptions: (query?: QueryType) => void;
  }>();

  /* ------------------------------ URL state ------------------------------ */
  const pageParam = searchParams.get("page")?.trim() || "1";
  const activeSearch = searchParams.get("search")?.trim() || "";
  const statusTab = parseStatusTab(searchParams.get("status"));
  const sort = parseSort(searchParams.get("sort"));
  const viewMode: ViewMode = searchParams.get("view") === "table" ? "table" : "cards";
  const filters: DirectoryFilters = {
    membership_type: searchParams.get("membership_type")?.trim() || "",
    is_user: searchParams.get("is_user")?.trim() || "",
    department_id: searchParams.get("department_id")?.trim() || "",
    is_active: searchParams.get("is_active")?.trim() || "",
  };
  const filterSignature = FILTER_KEYS.map((key) => filters[key]).join("|");
  const filterCount = FILTER_KEYS.filter((key) => filters[key]).length;

  const [searchDraft, setSearchDraft] = useState(activeSearch);
  const [showFilter, setShowFilter] = useState(filterCount > 0);
  const [selected, setSelected] = useState<Map<string, DirectoryMember>>(new Map());
  const [dialog, setDialog] = useState<DirectoryDialog>(null);

  const updateQuery = useCallback(
    (updates: Record<string, string | null | undefined>, resetPage = true) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        const normalized = typeof value === "string" ? value.trim() : value;
        if (normalized) next.set(key, normalized);
        else next.delete(key);
      });
      if (resetPage) next.set("page", "1");
      next.set("take", String(PAGE_SIZE));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  /* -------------------------------- Queries ------------------------------- */
  const tabQuery = useMemo(
    () => buildDirectoryQuery(statusTab, filters, activeSearch),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusTab, filterSignature, activeSearch]
  );
  // A status tab that contradicts the Activity filter can't match anything.
  const impossibleView = tabQuery === null;

  const membersQuery = useMemo<QueryType>(() => {
    const base =
      tabQuery ??
      buildDirectoryQuery(statusTab, { ...filters, is_active: "" }, activeSearch) ??
      {};
    return {
      ...base,
      ...(sort !== "name" ? { sort } : {}),
      include_status_counts: "true",
      page: pageParam,
      take: String(PAGE_SIZE),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabQuery, pageParam, sort]);

  const {
    data: membersResponse,
    loading: membersLoading,
    refetch: refetchMembers,
  } = useFetch(api.fetch.fetchAllMembers, membersQuery);
  // Shared shell stats (all members) stay as HomePage loaded them; refreshed
  // after changes so other screens see the update.
  const { refetch: refetchUserStats } = useFetch(
    api.fetch.fetchUserStats,
    undefined,
    true
  );
  const { data: activeStatsResponse, refetch: refetchActiveStats } = useFetch(
    api.fetch.fetchUserStats,
    ACTIVE_STATS_QUERY,
    false,
    { silent: true }
  );
  const activeStats = activeStatsResponse?.data ?? null;

  const rows = useMemo(() => {
    if (impossibleView) return [];
    return Array.isArray(membersResponse?.data)
      ? (membersResponse.data as DirectoryMember[])
      : [];
  }, [impossibleView, membersResponse]);
  const total = impossibleView
    ? 0
    : membersResponse?.meta?.total ?? rows.length;

  const { currentPage, totalPages, canGoBack, canGoForward, goBack, goForward } =
    usePaginate({ total, take: PAGE_SIZE, onPageChange: () => undefined });

  // After deletes or status moves the last page can disappear; step back to
  // the new last page instead of showing an empty view without a pager.
  useEffect(() => {
    if (membersLoading || !membersResponse) return;
    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > lastPage) updateQuery({ page: String(lastPage) }, false);
  }, [currentPage, membersLoading, membersResponse, total, updateQuery]);

  // Tab counts come back with the list (`include_status_counts`). They ignore
  // the status and activity filters, so apply the Activity filter here.
  const statusCounts = membersResponse?.meta?.status_counts;

  /* ------------------------------- Effects -------------------------------- */
  useEffect(() => {
    setSearchDraft(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    const term = searchDraft.trim();
    if (term === activeSearch) return;
    const timer = window.setTimeout(() => updateQuery({ search: term || null }), 400);
    return () => window.clearTimeout(timer);
  }, [searchDraft, activeSearch, updateQuery]);

  useEffect(() => {
    setSelected(new Map());
  }, [activeBranchId]);

  useEffect(() => {
    if (task) {
      // ManageMember may pass the saved member along with the task.
      const saved = location.state?.member as
        | { id?: string | number; name?: string }
        | undefined;
      const name = saved?.name?.trim();
      const savedId = saved?.id;
      const viewAction =
        savedId !== undefined && savedId !== null
          ? {
              label: "View profile",
              onClick: () => navigate(`/home/members/${encodeQuery(savedId)}`),
            }
          : undefined;
      if (task === "add") {
        notify.success({
          title: "Member added",
          message: name
            ? `${name} is now in the member directory.`
            : "The new member is now in the directory.",
          action: viewAction,
        });
      } else {
        notify.success({
          title: "Member updated",
          message: name ? `${name}'s details are saved.` : undefined,
          action: viewAction,
        });
      }
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  /* ------------------------------- Helpers -------------------------------- */
  const isRestricted = useCallback(
    (member: DirectoryMember) =>
      Boolean(member.is_restricted) || isExcluded("Members", member.id),
    [isExcluded]
  );

  const refreshAll = useCallback(async () => {
    setSelected(new Map());
    refetchMembers();
    refetchMembersOptions();
    refetchActiveStats();
    const stats = await refetchUserStats();
    if (stats) store.setUserStats(stats.data);
  }, [refetchActiveStats, refetchMembers, refetchMembersOptions, refetchUserStats, store]);

  const runAction = async (
    action: () => Promise<BulkOutcome>,
    successText: (count: number) => string
  ) => {
    showLoader(true);
    try {
      const outcome = await action();
      const { message, type } = describeOutcome(outcome, successText);
      showNotification(message, type);
      if (outcome.succeeded > 0) await refreshAll();
    } catch (error) {
      notify.fromError(error, {
        title: "Couldn't update the members",
      });
    } finally {
      showLoader(false);
    }
  };

  const viewProfile = (member: DirectoryMember) =>
    navigate(`/home/members/${encodeQuery(member.id)}`);

  const menuItemsFor = (member: DirectoryMember): ActionMenuItem[] => {
    const restricted = isRestricted(member);
    const inactive = member.is_active === false;
    return [
      { label: "View profile", hidden: restricted, onClick: () => viewProfile(member) },
      {
        label: "Edit details",
        hidden: restricted || !canManageMembers,
        onClick: () =>
          navigate(
            `/home/${relativePath.home.members.manage}?member_id=${encodeQuery(member.id)}`
          ),
      },
      {
        label: "Confirm membership",
        hidden: !canManageMembers || !isUnconfirmed(member),
        onClick: () =>
          runAction(
            () => advanceMembers([member.id], "CONFIRMED"),
            () => `${member.name} confirmed`
          ),
      },
      {
        label: "Mark as functional member",
        hidden: !canManageMembers || member.status !== "CONFIRMED",
        onClick: () =>
          runAction(
            () => advanceMembers([member.id], "MEMBER"),
            () => `${member.name} is now a functional member`
          ),
      },
      {
        label: "Change status…",
        hidden: !canManageMembers,
        onClick: () => setDialog({ kind: "status", members: [member] }),
      },
      {
        label: inactive ? "Reactivate" : "Mark inactive",
        hidden: !canManageMembers,
        onClick: () =>
          runAction(
            () => setMembersActive([member.id], inactive),
            () => `${member.name} ${inactive ? "reactivated" : "marked inactive"}`
          ),
      },
      {
        label: "Delete member",
        danger: true,
        hidden: !canManageMembers,
        onClick: () => setDialog({ kind: "delete", members: [member] }),
      },
    ];
  };

  /* ------------------------------ Selection ------------------------------- */
  const selectedIds = useMemo(() => Array.from(selected.keys()), [selected]);
  const selectedMembers = useMemo(() => Array.from(selected.values()), [selected]);
  const pageIds = rows.map((member) => String(member.id));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleMember = (member: DirectoryMember) =>
    setSelected((prev) => {
      const next = new Map(prev);
      const id = String(member.id);
      if (next.has(id)) next.delete(id);
      else next.set(id, member);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else rows.forEach((member) => next.set(String(member.id), member));
      return next;
    });

  const bulkActions = [
    {
      label: "Confirm membership",
      onClick: () => {
        const ids = selectedMembers.filter(isUnconfirmed).map((member) => member.id);
        if (ids.length === 0) {
          const n = selectedMembers.length;
          notify.info({
            title: "Nothing to confirm",
            message:
              n === 1
                ? "The selected member is already confirmed."
                : `All ${n} selected members are already confirmed.`,
          });
          return;
        }
        runAction(() => advanceMembers(ids, "CONFIRMED"), (count) => `${countText(count)} confirmed`);
      },
    },
    {
      label: "Change status…",
      onClick: () => setDialog({ kind: "status", members: selectedMembers }),
    },
    {
      label: "Assign department",
      onClick: () => setDialog({ kind: "assign", members: selectedMembers }),
    },
    {
      label: "Export selected",
      onClick: () =>
        exportMembersToExcel(selectedMembers.map(toExportRow), "Selected members.xlsx"),
    },
    {
      label: "Mark inactive",
      onClick: () =>
        runAction(
          () => setMembersActive(selectedMembers.map((member) => member.id), false),
          (count) => `${countText(count)} marked inactive`
        ),
    },
    {
      label: "Delete",
      danger: true,
      onClick: () => setDialog({ kind: "delete", members: selectedMembers }),
    },
  ];

  /* -------------------------------- Export -------------------------------- */
  const exportDisabled = Boolean(impossibleView) || total === 0;

  const exportView = async () => {
    // The Export button is disabled when the view is empty.
    if (exportDisabled) return;
    showLoader(true);
    try {
      const response = await api.fetch.fetchAllMembers({
        ...membersQuery,
        page: 1,
        take: EXPORT_TAKE,
      });
      const data = Array.isArray(response.data) ? (response.data as DirectoryMember[]) : [];
      await exportMembersToExcel(data.map(toExportRow));
      showNotification(`${countText(data.length)} exported`);
    } catch (error) {
      showNotification(
        (error as { message?: string })?.message || "Export failed",
        "error"
      );
    } finally {
      showLoader(false);
    }
  };

  /* -------------------------------- Render -------------------------------- */
  const departmentOptions = useMemo(
    () => [
      { value: "unassigned", label: "Unassigned" },
      ...departments.map((department) => ({
        value: String(department.id),
        label: department.name,
      })),
    ],
    [departments]
  );

  const resetFilters = () =>
    updateQuery(Object.fromEntries(FILTER_KEYS.map((key) => [key, null])));

  const resetView = () => {
    setSearchDraft("");
    updateQuery({
      ...Object.fromEntries(FILTER_KEYS.map((key) => [key, null])),
      search: null,
      status: null,
    });
  };

  const headerTotal =
    (activeStats?.online?.total_members ?? 0) + (activeStats?.inhouse?.total_members ?? 0);
  const initialLoading = membersLoading && membersResponse === null;
  const pageStart = (currentPage - 1) * PAGE_SIZE + 1;
  const countLabel = total
    ? `Showing ${pageStart}–${pageStart + rows.length - 1} of ${countText(total)}`
    : "0 members match the current view.";
  const showEmpty = !membersLoading && rows.length === 0 && (membersResponse !== null || impossibleView);

  return (
    <PageOutline crumbs={crumbs}>
      <div className="flex flex-col gap-6">
        <PageHeading
          title={`Church Memberships (${headerTotal})`}
          subtitle="Find members, move them through the membership journey and keep their records current."
          actions={
            <>
              <FilterToggleButton
                open={showFilter}
                count={filterCount}
                onClick={() => setShowFilter((open) => !open)}
              />
              <UiButton
                tone="secondary"
                onClick={exportView}
                disabled={exportDisabled}
                title={exportDisabled ? "No members match these filters." : undefined}
              >
                Export to Excel
              </UiButton>
              {canManageMembers && (
                <UiButton
                  tone="primary"
                  onClick={() => navigate(`/home/${relativePath.home.members.manage}`)}
                >
                  Add Member
                </UiButton>
              )}
            </>
          }
        />

        <DirectoryStats stats={activeStats} />

        {showFilter && (
          <MembersFilter
            values={filters}
            departmentOptions={departmentOptions}
            onChange={(name, value) => updateQuery({ [name]: value || null })}
            onReset={resetFilters}
          />
        )}

        <div className="flex flex-col gap-4">
          <PillTabs
            ariaLabel="Membership status"
            className="self-start"
            tabs={STATUS_TABS.map((tab) => ({
              key: tab.key,
              label: tab.label,
              count: statusTabCount(statusCounts, tab.key, filters.is_active),
            }))}
            value={statusTab}
            onChange={(key) => updateQuery({ status: key === "ALL" ? null : key })}
          />

          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={searchDraft}
              onChange={setSearchDraft}
              placeholder="Search by name, member ID, email or phone"
              ariaLabel="Search members"
              className="max-w-[520px] flex-[1_1_280px]"
            />
            <SelectInput
              aria-label="Sort members"
              value={sort}
              options={SORT_OPTIONS}
              onChange={(event) =>
                updateQuery({ sort: event.target.value === "name" ? null : event.target.value }, false)
              }
              className="w-auto"
            />
            <PillTabs
              ariaLabel="View"
              size="sm"
              className="ml-auto"
              tabs={[
                { key: "cards", label: "Cards" },
                { key: "table", label: "Table" },
              ]}
              value={viewMode}
              onChange={(key) => updateQuery({ view: key === "table" ? "table" : null }, false)}
            />
          </div>

          {canManageMembers && selected.size > 0 && (
            <BulkBar
              label={`${countText(selected.size)} selected`}
              actions={bulkActions}
              onClear={() => setSelected(new Map())}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[#4B5563]">
              {initialLoading ? "Loading members…" : countLabel}
            </p>
            {canManageMembers && rows.length > 0 && (
              <button
                type="button"
                onClick={togglePage}
                className="bg-transparent p-0 text-sm text-[#4B5563] underline hover:text-primary"
              >
                {allPageSelected ? "Deselect this page" : "Select this page"}
              </button>
            )}
          </div>

          {showEmpty ? (
            <SectionEmpty
              badge="Section empty"
              title="No members match this view"
              text="Try another status tab, clear the search or reset filters."
              action={
                <UiButton tone="secondary" onClick={resetView}>
                  Reset view
                </UiButton>
              }
            />
          ) : viewMode === "table" ? (
            <MembersTable
              rows={rows}
              loading={membersLoading}
              selectable={canManageMembers}
              selectedIds={selectedIds}
              onToggleRow={(id) => {
                const member = rows.find((row) => String(row.id) === id);
                if (member) toggleMember(member);
              }}
              onToggleAll={togglePage}
              isRestricted={isRestricted}
              onView={viewProfile}
              menuItemsFor={menuItemsFor}
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
              {initialLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[300px] animate-pulse rounded-2xl border border-lightGray bg-white"
                    />
                  ))
                : rows.map((member) => {
                    const restricted = isRestricted(member);
                    return (
                      <MemberCard
                        key={member.id}
                        member={member}
                        restricted={restricted}
                        selectable={canManageMembers}
                        selected={selected.has(String(member.id))}
                        onToggleSelect={() => toggleMember(member)}
                        onView={restricted ? undefined : () => viewProfile(member)}
                        menuItems={menuItemsFor(member)}
                      />
                    );
                  })}
            </div>
          )}

          {totalPages > 1 && !impossibleView && (
            <div className="flex items-center justify-end gap-2">
              <span className="mr-2 text-sm text-[#4B5563]">
                Page {currentPage} of {totalPages}
              </span>
              <UiButton tone="secondary" onClick={goBack} disabled={!canGoBack}>
                Previous
              </UiButton>
              <UiButton tone="secondary" onClick={goForward} disabled={!canGoForward}>
                Next
              </UiButton>
            </div>
          )}
        </div>
      </div>

      <DirectoryDialogs
        dialog={dialog}
        onClose={() => setDialog(null)}
        onDone={refreshAll}
      />
    </PageOutline>
  );
}
