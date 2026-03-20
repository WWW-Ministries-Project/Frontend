import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { encodeQuery, showNotification } from "@/pages/HomePage/utils";
import type {
  BulkUpdateMemberStatusResponse,
  BulkUpdateMemberStatusResult,
  MembersType,
} from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { formatDate, formatPhoneNumber } from "@/utils/helperFunctions";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ProgressionStatus = "CONFIRMED" | "MEMBER";

type MemberStatus = "UNCONFIRMED" | "CONFIRMED" | "MEMBER";
type MemberTab = "UNCONFIRMED" | "CONFIRMED";
type PaginationItem = number | "ellipsis-left" | "ellipsis-right";
type MemberSelectionState = Record<MemberTab, Array<MembersType["id"]>>;

const MEMBERS_PAGE_SIZE = 12;
const createEmptySelectionState = (): MemberSelectionState => ({
  UNCONFIRMED: [],
  CONFIRMED: [],
});

const getPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
};

const normalizeMemberStatus = (status?: string | null): MemberStatus => {
  const normalized = (status || "").toUpperCase().trim();

  if (normalized === "CONFIRMED") return "CONFIRMED";
  if (normalized === "MEMBER") return "MEMBER";

  return "UNCONFIRMED";
};

const formatMemberStatus = (status?: string | null): string => {
  const normalizedStatus = normalizeMemberStatus(status);

  if (normalizedStatus === "MEMBER") return "Functional Member";
  if (normalizedStatus === "CONFIRMED") return "Confirmed Member";

  return "Unconfirmed Member";
};

const getMemberDisplayName = (member: MembersType): string => {
  const fullName = `${member.title || ""} ${member.name || ""}`.trim();
  return fullName || "No Name";
};

const getMemberNotificationLabel = (member: MembersType): string => {
  const displayName = getMemberDisplayName(member);
  return member.member_id ? `${displayName} (${member.member_id})` : displayName;
};

const getBulkResultNotificationLabel = (
  result: BulkUpdateMemberStatusResult,
  membersById: Map<string, MembersType>
): string => {
  const member = membersById.get(String(result.user_id));
  return member ? getMemberNotificationLabel(member) : `User ${result.user_id}`;
};

const getBulkResultSuccessMessage = (
  result: BulkUpdateMemberStatusResult,
  status: ProgressionStatus
): string => {
  if (result.message) return result.message;
  if (result.current_status) return `Now ${formatMemberStatus(result.current_status)}.`;

  return status === "CONFIRMED"
    ? "Moved to confirmed member."
    : "Moved to functional member.";
};

const getBulkResultFailureMessage = (
  result: BulkUpdateMemberStatusResult,
  status: ProgressionStatus
): string => {
  if (result.message && result.code && !result.message.includes(result.code)) {
    return `${result.code}: ${result.message}`;
  }

  if (result.message) return result.message;
  if (result.code) return result.code;

  return status === "CONFIRMED"
    ? "Could not confirm this member."
    : "Could not make this member functional.";
};

const hasMemberStatus = (member: MembersType, expectedStatus: MemberStatus): boolean =>
  normalizeMemberStatus(member.status) === expectedStatus;

const filterMembersByQuery = (
  members: MembersType[],
  query: string
): MembersType[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return members;

  return members.filter((member) => {
    const searchableValues = [
      getMemberDisplayName(member),
      member.email || "",
      member.member_id || "",
      formatPhoneNumber(member.country_code, member.primary_number),
    ];

    return searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    );
  });
};

interface MembersTableProps {
  title: string;
  description: string;
  members: MembersType[];
  totalMembers: number;
  totalPages: number;
  actionLabel: string;
  emptyStateMessage: string;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onMemberClick: (member: MembersType) => void;
  onAction: (member: MembersType) => void;
  canPerformAction?: (member: MembersType) => boolean;
  blockedActionLabel?: string;
  processingId: string | number | null;
  selectedIds: Array<MembersType["id"]>;
  onToggleMemberSelection: (memberId: MembersType["id"]) => void;
  onToggleSelectAll: (members: MembersType[]) => void;
  onClearSelection: () => void;
  bulkActionLabel: string;
  onBulkAction: () => void;
  bulkActionLoading?: boolean;
  selectionDisabled?: boolean;
  actionsDisabled?: boolean;
}

const MembersTable = ({
  title,
  description,
  members,
  totalMembers,
  totalPages,
  actionLabel,
  emptyStateMessage,
  currentPage,
  pageSize,
  onPageChange,
  onMemberClick,
  onAction,
  canPerformAction,
  blockedActionLabel,
  processingId,
  selectedIds,
  onToggleMemberSelection,
  onToggleSelectAll,
  onClearSelection,
  bulkActionLabel,
  onBulkAction,
  bulkActionLoading = false,
  selectionDisabled = false,
  actionsDisabled = false,
}: MembersTableProps) => {
  const safeTotalPages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);
  const rangeStart = totalMembers === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const rangeEnd = totalMembers === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalMembers);
  const paginationItems = getPaginationItems(safeCurrentPage, safeTotalPages);
  const canGoBack = safeCurrentPage > 1;
  const canGoForward = safeCurrentPage < safeTotalPages;
  const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleSelectedCount = members.filter((member) => selectedIdsSet.has(member.id)).length;
  const allVisibleSelected = members.length > 0 && visibleSelectedCount === members.length;
  const hasVisibleSelection = visibleSelectedCount > 0 && !allVisibleSelected;

  const goToPage = (page: number) => {
    const safePage = Math.min(Math.max(page, 1), safeTotalPages);
    onPageChange(safePage);
  };

  return (
    <section className="rounded-xl border border-lightGray">
      <div className="p-4 border-b border-lightGray space-y-1">
        <h2 className="text-lg font-semibold text-primary">
          {title} ({totalMembers})
        </h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {selectedIds.length > 0 ? (
        <div className="mx-4 mt-4 rounded-lg border border-primary/15 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">
                {selectedIds.length} member{selectedIds.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-xs text-primaryGray">
                The header checkbox selects members on the current page. Selection stays intact while
                you move between pages.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                value={bulkActionLabel}
                variant="primary"
                onClick={onBulkAction}
                loading={bulkActionLoading}
                disabled={bulkActionLoading || actionsDisabled}
              />
              <Button
                value="Clear Selection"
                variant="secondary"
                onClick={onClearSelection}
                disabled={bulkActionLoading || actionsDisabled}
              />
            </div>
          </div>
        </div>
      ) : null}

      {totalMembers === 0 ? (
        <div className="p-4">
          <EmptyState scope="section" msg={emptyStateMessage} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-lightGray text-primary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold w-14">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(element) => {
                        if (element) {
                          element.indeterminate = hasVisibleSelection;
                        }
                      }}
                      onChange={() => onToggleSelectAll(members)}
                      disabled={selectionDisabled || members.length === 0}
                      className="h-4 w-4 rounded border-lightGray text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Select all ${title.toLowerCase()} on this page`}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Date Registered</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isProcessing = processingId === member.id;
                  const canPerform = canPerformAction ? canPerformAction(member) : true;
                  const isActionBlocked = !canPerform;
                  const isDisabled = isProcessing || isActionBlocked || actionsDisabled;
                  const actionText = isProcessing
                    ? "Processing..."
                    : isActionBlocked && blockedActionLabel
                    ? blockedActionLabel
                    : actionLabel;

                  return (
                    <tr key={member.id} className="border-t border-lightGray">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIdsSet.has(member.id)}
                          onChange={() => onToggleMemberSelection(member.id)}
                          disabled={selectionDisabled}
                          className="h-4 w-4 rounded border-lightGray text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Select ${getMemberDisplayName(member)}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onMemberClick(member)}
                          className="font-semibold text-primary hover:underline text-left"
                        >
                          {getMemberDisplayName(member)}
                        </button>
                        <p className="text-xs text-gray-500">{member.member_id || "-"}</p>
                      </td>
                      <td className="px-4 py-3">{member.email || "-"}</td>
                      <td className="px-4 py-3">
                        {formatPhoneNumber(member.country_code, member.primary_number)}
                      </td>
                      <td className="px-4 py-3">{formatDate(member.created_at, "long")}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => onAction(member)}
                          className="px-3 py-2 text-xs rounded-md bg-primary text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {actionText}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {safeTotalPages > 1 ? (
            <nav
              className="mx-4 mb-4 mt-1 flex flex-col gap-3 border-t border-lightGray pt-3 md:flex-row md:items-center md:justify-between"
              aria-label={`${title} pagination`}
            >
              <p className="text-sm text-primaryGray">
                Showing {rangeStart}-{rangeEnd} of {totalMembers}
              </p>

              <div className="flex flex-wrap items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(1)}
                  disabled={!canGoBack}
                  className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
                  aria-label="Go to first page"
                >
                  <span className="hidden sm:inline">First</span>
                  <span className="sm:hidden">«</span>
                </button>

                <button
                  type="button"
                  onClick={() => goToPage(safeCurrentPage - 1)}
                  disabled={!canGoBack}
                  className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
                  aria-label="Go to previous page"
                >
                  <span className="hidden sm:inline">Prev</span>
                  <span className="sm:hidden">‹</span>
                </button>

                {paginationItems.map((item) => {
                  if (item === "ellipsis-left" || item === "ellipsis-right") {
                    return (
                      <span
                        key={item}
                        className="inline-flex min-w-9 select-none items-center justify-center px-1 text-sm text-primaryGray"
                        aria-hidden="true"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = item === safeCurrentPage;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => goToPage(item)}
                      className={`min-w-9 rounded-md border px-2.5 py-1.5 text-sm transition ${
                        isActive
                          ? "border-primary bg-primary text-white"
                          : "border-lightGray text-primary hover:bg-lightGray/40"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`Go to page ${item}`}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => goToPage(safeCurrentPage + 1)}
                  disabled={!canGoForward}
                  className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
                  aria-label="Go to next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">›</span>
                </button>

                <button
                  type="button"
                  onClick={() => goToPage(safeTotalPages)}
                  disabled={!canGoForward}
                  className="min-w-9 rounded-md border border-lightGray px-2.5 py-1.5 text-sm text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-lightGray/40"
                  aria-label="Go to last page"
                >
                  <span className="hidden sm:inline">Last</span>
                  <span className="sm:hidden">»</span>
                </button>
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </section>
  );
};

export const MemberConfirmation = () => {
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllMembers, {
    take: 5000,
    limit: 5000,
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MembersType | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MemberTab>("UNCONFIRMED");
  const [unconfirmedPage, setUnconfirmedPage] = useState(1);
  const [confirmedPage, setConfirmedPage] = useState(1);
  const [selectedMemberIds, setSelectedMemberIds] = useState<MemberSelectionState>(
    createEmptySelectionState()
  );
  const [bulkProcessing, setBulkProcessing] = useState<{
    tab: MemberTab;
    status: ProgressionStatus;
  } | null>(null);

  const members = useMemo(() => data?.data || [], [data]);
  const filteredMembers = useMemo(
    () => filterMembersByQuery(members, searchQuery),
    [members, searchQuery]
  );

  const unconfirmedMembers = useMemo(
    () =>
      filteredMembers.filter((member) =>
        hasMemberStatus(member, "UNCONFIRMED")
      ),
    [filteredMembers]
  );
  const confirmedMembers = useMemo(
    () =>
      filteredMembers.filter((member) =>
        hasMemberStatus(member, "CONFIRMED")
      ),
    [filteredMembers]
  );

  const unconfirmedTotalMembers = unconfirmedMembers.length;
  const confirmedTotalMembers = confirmedMembers.length;
  const unconfirmedPageSize = MEMBERS_PAGE_SIZE;
  const confirmedPageSize = MEMBERS_PAGE_SIZE;

  const unconfirmedTotalPages = Math.max(
    Math.ceil(unconfirmedTotalMembers / unconfirmedPageSize),
    1
  );
  const confirmedTotalPages = Math.max(
    Math.ceil(confirmedTotalMembers / confirmedPageSize),
    1
  );

  useEffect(() => {
    if (unconfirmedPage > unconfirmedTotalPages) {
      setUnconfirmedPage(unconfirmedTotalPages);
    }
  }, [unconfirmedPage, unconfirmedTotalPages]);

  useEffect(() => {
    if (confirmedPage > confirmedTotalPages) {
      setConfirmedPage(confirmedTotalPages);
    }
  }, [confirmedPage, confirmedTotalPages]);

  useEffect(() => {
    setUnconfirmedPage(1);
    setConfirmedPage(1);
    setSelectedMemberIds(createEmptySelectionState());
  }, [searchQuery]);

  useEffect(() => {
    const unconfirmedIds = new Set(unconfirmedMembers.map((member) => member.id));
    const confirmedIds = new Set(confirmedMembers.map((member) => member.id));

    setSelectedMemberIds((previousSelection) => ({
      UNCONFIRMED: previousSelection.UNCONFIRMED.filter((id) => unconfirmedIds.has(id)),
      CONFIRMED: previousSelection.CONFIRMED.filter((id) => confirmedIds.has(id)),
    }));
  }, [unconfirmedMembers, confirmedMembers]);

  const paginatedUnconfirmedMembers = useMemo(() => {
    const start = (unconfirmedPage - 1) * unconfirmedPageSize;
    return unconfirmedMembers.slice(start, start + unconfirmedPageSize);
  }, [unconfirmedMembers, unconfirmedPage, unconfirmedPageSize]);

  const paginatedConfirmedMembers = useMemo(() => {
    const start = (confirmedPage - 1) * confirmedPageSize;
    return confirmedMembers.slice(start, start + confirmedPageSize);
  }, [confirmedMembers, confirmedPage, confirmedPageSize]);

  const activeMembers =
    activeTab === "UNCONFIRMED"
      ? paginatedUnconfirmedMembers
      : paginatedConfirmedMembers;
  const activeLoading = loading;

  const selectedUnconfirmedMembers = useMemo(() => {
    const selectedIdsSet = new Set(selectedMemberIds.UNCONFIRMED);
    return unconfirmedMembers.filter((member) => selectedIdsSet.has(member.id));
  }, [selectedMemberIds.UNCONFIRMED, unconfirmedMembers]);

  const selectedConfirmedMembers = useMemo(() => {
    const selectedIdsSet = new Set(selectedMemberIds.CONFIRMED);
    return confirmedMembers.filter((member) => selectedIdsSet.has(member.id));
  }, [selectedMemberIds.CONFIRMED, confirmedMembers]);

  const isAnyActionProcessing = Boolean(processingId) || Boolean(bulkProcessing);

  const updateStatus = async (member: MembersType, status: ProgressionStatus) => {
    setProcessingId(member.id);

    try {
      await api.put.updateMemberStatus({}, { user_id: String(member.id), status });

      showNotification(
        status === "CONFIRMED"
          ? "Member confirmed successfully"
          : "Member promoted to functional member successfully",
        "success"
      );

      await refetch();
    } catch {
      // Error notifications are handled by API error middleware.
    } finally {
      setProcessingId(null);
    }
  };

  const openConfirmModal = (member: MembersType) => {
    setSelectedMember(member);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedMember(null);
  };

  const confirmSelectedMember = async () => {
    if (!selectedMember) return;

    await updateStatus(selectedMember, "CONFIRMED");
    closeConfirmModal();
  };

  const makeMemberFunctional = async (member: MembersType) => {
    if (!hasMemberStatus(member, "CONFIRMED")) {
      showNotification("Only confirmed members can be made functional", "error");
      return;
    }

    await updateStatus(member, "MEMBER");
  };

  const toggleMemberSelection = (
    tab: MemberTab,
    memberId: MembersType["id"]
  ) => {
    if (isAnyActionProcessing) return;

    setSelectedMemberIds((previousSelection) => {
      const currentIds = previousSelection[tab];
      const nextIds = currentIds.includes(memberId)
        ? currentIds.filter((id) => id !== memberId)
        : [...currentIds, memberId];

      return {
        ...previousSelection,
        [tab]: nextIds,
      };
    });
  };

  const toggleSelectAllMembers = (
    tab: MemberTab,
    membersOnPage: MembersType[]
  ) => {
    if (isAnyActionProcessing || membersOnPage.length === 0) return;

    setSelectedMemberIds((previousSelection) => {
      const currentIds = previousSelection[tab];
      const pageIds = membersOnPage.map((member) => member.id);
      const allPageMembersSelected = pageIds.every((id) => currentIds.includes(id));

      return {
        ...previousSelection,
        [tab]: allPageMembersSelected
          ? currentIds.filter((id) => !pageIds.includes(id))
          : Array.from(new Set([...currentIds, ...pageIds])),
      };
    });
  };

  const clearSelection = (tab: MemberTab) => {
    setSelectedMemberIds((previousSelection) => ({
      ...previousSelection,
      [tab]: [],
    }));
  };

  const runBulkStatusUpdate = async (
    tab: MemberTab,
    membersToUpdate: MembersType[],
    status: ProgressionStatus
  ) => {
    if (!membersToUpdate.length) {
      showNotification("Select at least one member to continue", "error");
      return;
    }

    setBulkProcessing({ tab, status });

    try {
      const bulkResponse: BulkUpdateMemberStatusResponse = (
        await api.post.bulkUpdateMemberStatus({
          status,
          user_ids: membersToUpdate.map((member) => member.id),
        })
      ).data;
      const responseResults = bulkResponse.results || [];
      const successfulResults = responseResults.filter((result) => result.success);
      const failedResults = responseResults.filter((result) => !result.success);
      const failedIdSet = new Set(
        failedResults.map((result) => String(result.user_id))
      );
      const successCount = bulkResponse.success_count;
      const failureCount = bulkResponse.failure_count;
      const membersById = new Map(
        membersToUpdate.map((member) => [String(member.id), member])
      );

      showNotification(
        `${successCount} succeeded, ${failureCount} failed.`,
        failureCount > 0 ? "error" : "success",
        {
          title:
            status === "CONFIRMED"
              ? failureCount > 0
                ? "Bulk confirmation completed with failures"
                : "Bulk confirmation completed"
              : failureCount > 0
              ? "Bulk functional promotion completed with failures"
              : "Bulk functional promotion completed",
          details: [
            ...(successfulResults.length > 0
              ? [
                  {
                    title: "Successful",
                    tone: "success" as const,
                    items: successfulResults.map((result) => ({
                      label: getBulkResultNotificationLabel(result, membersById),
                      description: getBulkResultSuccessMessage(result, status),
                    })),
                  },
                ]
              : []),
            ...(failedResults.length > 0
              ? [
                  {
                    title: "Failed",
                    tone: "error" as const,
                    items: failedResults.map((result) => ({
                      label: getBulkResultNotificationLabel(result, membersById),
                      description: getBulkResultFailureMessage(result, status),
                    })),
                  },
                ]
              : []),
          ],
        }
      );

      setSelectedMemberIds((previousSelection) => ({
        ...previousSelection,
        [tab]: previousSelection[tab].filter((id) => failedIdSet.has(String(id))),
      }));

      await refetch();
    } catch {
      // Request-level error notifications are handled by API error middleware.
    } finally {
      setBulkProcessing(null);
    }
  };

  const handleBulkConfirm = async () => {
    await runBulkStatusUpdate(
      "UNCONFIRMED",
      selectedUnconfirmedMembers,
      "CONFIRMED"
    );
  };

  const handleBulkMakeFunctional = async () => {
    await runBulkStatusUpdate("CONFIRMED", selectedConfirmedMembers, "MEMBER");
  };

  const handleMemberClick = (member: MembersType) => {
    navigate(`/home/members/${encodeQuery(member.id)}`, {
      state: { prefillMember: member },
    });
  };

  return (
    <div className="space-y-6">
      {activeLoading && activeMembers.length === 0 ? (
        <div className="text-sm text-gray-600">Loading members...</div>
      ) : null}

      <section className="rounded-xl border border-lightGray p-4">
        <label
          htmlFor="member-confirmation-search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search Members
        </label>
        <input
          id="member-confirmation-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name, member ID, email, or phone"
          className="w-full md:max-w-lg border border-lightGray rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </section>

      <section className="rounded-xl border border-lightGray bg-gradient-to-r from-lightGray/40 to-white p-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("UNCONFIRMED")}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              activeTab === "UNCONFIRMED"
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-lightGray bg-white text-primary hover:border-primary/40"
            }`}
          >
            <p className="text-sm font-semibold">Unconfirmed Queue</p>
            <p
              className={`text-xs ${
                activeTab === "UNCONFIRMED" ? "text-white/90" : "text-primaryGray"
              }`}
            >
              Awaiting confirmation ({unconfirmedTotalMembers})
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CONFIRMED")}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              activeTab === "CONFIRMED"
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-lightGray bg-white text-primary hover:border-primary/40"
            }`}
          >
            <p className="text-sm font-semibold">Confirmed Queue</p>
            <p
              className={`text-xs ${
                activeTab === "CONFIRMED" ? "text-white/90" : "text-primaryGray"
              }`}
            >
              Ready for functional promotion ({confirmedTotalMembers})
            </p>
          </button>
        </div>
      </section>

      {activeTab === "UNCONFIRMED" ? (
        <MembersTable
          title="Unconfirmed Members"
          description="Review and confirm unconfirmed members."
          members={paginatedUnconfirmedMembers}
          totalMembers={unconfirmedTotalMembers}
          totalPages={unconfirmedTotalPages}
          actionLabel="Confirm"
          currentPage={unconfirmedPage}
          pageSize={unconfirmedPageSize}
          onPageChange={setUnconfirmedPage}
          emptyStateMessage={
            searchQuery
              ? "No matching unconfirmed members found"
              : "No unconfirmed members found"
          }
          onMemberClick={handleMemberClick}
          onAction={openConfirmModal}
          canPerformAction={(member) => hasMemberStatus(member, "UNCONFIRMED")}
          blockedActionLabel="Not Eligible"
          processingId={processingId}
          selectedIds={selectedMemberIds.UNCONFIRMED}
          onToggleMemberSelection={(memberId) =>
            toggleMemberSelection("UNCONFIRMED", memberId)
          }
          onToggleSelectAll={(membersOnPage) =>
            toggleSelectAllMembers("UNCONFIRMED", membersOnPage)
          }
          onClearSelection={() => clearSelection("UNCONFIRMED")}
          bulkActionLabel={`Bulk Confirm (${selectedMemberIds.UNCONFIRMED.length})`}
          onBulkAction={handleBulkConfirm}
          bulkActionLoading={
            bulkProcessing?.tab === "UNCONFIRMED" &&
            bulkProcessing?.status === "CONFIRMED"
          }
          selectionDisabled={isAnyActionProcessing}
          actionsDisabled={isAnyActionProcessing}
        />
      ) : (
        <MembersTable
          title="Confirmed Members"
          description="Promote confirmed members to functional members. Backend validation checks member-required program completion."
          members={paginatedConfirmedMembers}
          totalMembers={confirmedTotalMembers}
          totalPages={confirmedTotalPages}
          actionLabel="Make Functional"
          currentPage={confirmedPage}
          pageSize={confirmedPageSize}
          onPageChange={setConfirmedPage}
          emptyStateMessage={
            searchQuery
              ? "No matching confirmed members found"
              : "No confirmed members found"
          }
          onMemberClick={handleMemberClick}
          onAction={makeMemberFunctional}
          canPerformAction={(member) => hasMemberStatus(member, "CONFIRMED")}
          blockedActionLabel="Not Confirmed"
          processingId={processingId}
          selectedIds={selectedMemberIds.CONFIRMED}
          onToggleMemberSelection={(memberId) =>
            toggleMemberSelection("CONFIRMED", memberId)
          }
          onToggleSelectAll={(membersOnPage) =>
            toggleSelectAllMembers("CONFIRMED", membersOnPage)
          }
          onClearSelection={() => clearSelection("CONFIRMED")}
          bulkActionLabel={`Bulk Make Functional (${selectedMemberIds.CONFIRMED.length})`}
          onBulkAction={handleBulkMakeFunctional}
          bulkActionLoading={
            bulkProcessing?.tab === "CONFIRMED" &&
            bulkProcessing?.status === "MEMBER"
          }
          selectionDisabled={isAnyActionProcessing}
          actionsDisabled={isAnyActionProcessing}
        />
      )}

      <Modal open={isConfirmModalOpen} persist={false} onClose={closeConfirmModal}>
        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-primary">Confirm Member</h3>
            <p className="text-sm text-gray-600">
              Review this member&apos;s details before confirming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-medium">
                {selectedMember ? getMemberDisplayName(selectedMember) : "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{selectedMember?.email || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">
                {selectedMember
                  ? formatPhoneNumber(
                      selectedMember.country_code,
                      selectedMember.primary_number
                    )
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Date Registered</p>
              <p className="font-medium">
                {selectedMember ? formatDate(selectedMember.created_at, "long") : "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Current Status</p>
              <p className="font-medium">
                {selectedMember
                  ? formatMemberStatus(selectedMember.status)
                  : "-"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button value="Cancel" variant="secondary" onClick={closeConfirmModal} />
            <Button
              value="Confirm Member"
              variant="primary"
              onClick={confirmSelectedMember}
              loading={Boolean(selectedMember && processingId === selectedMember.id)}
              disabled={Boolean(selectedMember && processingId === selectedMember.id)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberConfirmation;
