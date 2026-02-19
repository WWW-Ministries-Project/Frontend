import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { encodeQuery, showNotification } from "@/pages/HomePage/utils";
import { MembersType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { formatDate, formatPhoneNumber } from "@/utils/helperFunctions";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ProgressionStatus = "CONFIRMED" | "MEMBER";

type MemberStatus = "UNCONFIRMED" | "CONFIRMED" | "MEMBER";

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
  actionLabel: string;
  emptyStateMessage: string;
  onMemberClick: (member: MembersType) => void;
  onAction: (member: MembersType) => void;
  processingId: string | number | null;
}

const MembersTable = ({
  title,
  description,
  members,
  actionLabel,
  emptyStateMessage,
  onMemberClick,
  onAction,
  processingId,
}: MembersTableProps) => {
  return (
    <section className="rounded-xl border border-lightGray">
      <div className="p-4 border-b border-lightGray space-y-1">
        <h2 className="text-lg font-semibold text-primary">
          {title} ({members.length})
        </h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {members.length === 0 ? (
        <div className="p-4">
          <EmptyState msg={emptyStateMessage} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-lightGray text-primary">
              <tr>
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

                return (
                  <tr key={member.id} className="border-t border-lightGray">
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
                        disabled={isProcessing}
                        onClick={() => onAction(member)}
                        className="px-3 py-2 text-xs rounded-md bg-primary text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Processing..." : actionLabel}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export const MemberConfirmation = () => {
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(api.fetch.fetchAllMembers);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MembersType | null>(null);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const members = useMemo(() => data?.data || [], [data]);
  const filteredMembers = useMemo(
    () => filterMembersByQuery(members, searchQuery),
    [members, searchQuery]
  );

  const unconfirmedMembers = useMemo(
    () =>
      filteredMembers.filter(
        (member) => normalizeMemberStatus(member.status) === "UNCONFIRMED"
      ),
    [filteredMembers]
  );

  const confirmedMembers = useMemo(
    () =>
      filteredMembers.filter(
        (member) => normalizeMemberStatus(member.status) === "CONFIRMED"
      ),
    [filteredMembers]
  );

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
    await updateStatus(member, "MEMBER");
  };

  const handleMemberClick = (member: MembersType) => {
    navigate(`/home/members/${encodeQuery(member.id)}`, {
      state: { prefillMember: member },
    });
  };

  return (
    <div className="space-y-6">
      {loading && members.length === 0 ? (
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

      <MembersTable
        title="Unconfirmed Members"
        description="Review and confirm unconfirmed members."
        members={unconfirmedMembers}
        actionLabel="Confirm"
        emptyStateMessage={
          searchQuery
            ? "No matching unconfirmed members found"
            : "No unconfirmed members found"
        }
        onMemberClick={handleMemberClick}
        onAction={openConfirmModal}
        processingId={processingId}
      />

      <MembersTable
        title="Confirmed Members"
        description="Promote confirmed members to functional members. Backend validation checks member-required program completion."
        members={confirmedMembers}
        actionLabel="Make Functional"
        emptyStateMessage={
          searchQuery
            ? "No matching confirmed members found"
            : "No confirmed members found"
        }
        onMemberClick={handleMemberClick}
        onAction={makeMemberFunctional}
        processingId={processingId}
      />

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
