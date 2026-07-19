import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { FormHeader, FormLayout } from "@/components/ui";
import { useFetch } from "@/CustomHooks/useFetch";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { showNotification } from "@/pages/HomePage/utils";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type { JoinRequestRow, JoinRequestStatus } from "@/utils";
import { useMemo, useState } from "react";

const STATUS_TABS: { label: string; value: JoinRequestStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Declined", value: "DECLINED" },
];

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const statusBadgeClass = (status: JoinRequestStatus) => {
  switch (status) {
    case "APPROVED":
      return "border-success/20 bg-success/10 text-success";
    case "DECLINED":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-warning/20 bg-warning/10 text-warning";
  }
};

export const JoinDepartmentRequests = () => {
  const { activeBranchId } = useBranchStore();
  const [statusFilter, setStatusFilter] = useState<JoinRequestStatus>("PENDING");

  const query = useMemo(
    () => ({ ...(buildBranchQuery(activeBranchId) ?? {}), status: statusFilter }),
    [activeBranchId, statusFilter]
  );

  const { data, loading, refetch } = useFetch(api.fetch.fetchJoinRequests, query);
  const requests = data?.data ?? [];

  // Positions per department (for the confirm dropdown).
  const branchQuery = useMemo(
    () => buildBranchQuery(activeBranchId),
    [activeBranchId]
  );
  const { data: openDeptData } = useFetch(
    api.fetch.fetchOpenDepartmentsToJoin,
    branchQuery
  );
  const positionsByDept = useMemo(() => {
    const map = new Map<number, { label: string; value: string }[]>();
    (openDeptData?.data ?? []).forEach((department) => {
      map.set(
        department.id,
        (department.position ?? []).map((position) => ({
          label: position.name,
          value: String(position.id),
        }))
      );
    });
    return map;
  }, [openDeptData]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<JoinRequestRow | null>(null);
  const [declineTarget, setDeclineTarget] = useState<JoinRequestRow | null>(null);
  const [bulkMode, setBulkMode] = useState<"approve" | "decline" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirm form
  const [positionId, setPositionId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  // Decline form
  const [declineReason, setDeclineReason] = useState<string>("");

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  );
  const allSelected =
    pendingRequests.length > 0 &&
    selectedIds.length === pendingRequests.length;

  const resetForms = () => {
    setPositionId("");
    setStartDate("");
    setInstructions("");
    setDeclineReason("");
  };

  const closeModals = () => {
    setConfirmTarget(null);
    setDeclineTarget(null);
    setBulkMode(null);
    resetForms();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : pendingRequests.map((r) => r.id));
  };

  const afterAction = async (message: string) => {
    showNotification(message, "success");
    closeModals();
    setSelectedIds([]);
    await refetch();
  };

  const handleError = (error: unknown, fallback: string) => {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || fallback;
    showNotification(message, "error");
  };

  // ---- Single confirm ----
  const submitConfirm = async () => {
    if (!confirmTarget) return;
    setSubmitting(true);
    try {
      const response = await api.put.approveJoinRequest({
        id: confirmTarget.id,
        position_id: positionId ? Number(positionId) : undefined,
        start_date: startDate || undefined,
        instructions: instructions.trim() || undefined,
      });
      await afterAction(
        (response as { message?: string })?.message || "Request approved."
      );
    } catch (error) {
      handleError(error, "Unable to approve request.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Single decline ----
  const submitDecline = async () => {
    if (!declineTarget) return;
    setSubmitting(true);
    try {
      const response = await api.put.declineJoinRequest({
        id: declineTarget.id,
        decline_reason: declineReason.trim() || undefined,
      });
      await afterAction(
        (response as { message?: string })?.message || "Request declined."
      );
    } catch (error) {
      handleError(error, "Unable to decline request.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Bulk ----
  const submitBulk = async () => {
    if (!bulkMode || selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      const response = await api.post.bulkJoinRequestAction({
        ids: selectedIds,
        action: bulkMode,
        ...(bulkMode === "approve"
          ? {
              start_date: startDate || undefined,
              instructions: instructions.trim() || undefined,
            }
          : { decline_reason: declineReason.trim() || undefined }),
      });
      await afterAction(
        (response as { message?: string })?.message ||
          `Requests ${bulkMode === "approve" ? "approved" : "declined"}.`
      );
    } catch (error) {
      handleError(error, "Unable to process bulk action.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPositionOptions = confirmTarget
    ? positionsByDept.get(confirmTarget.department_id ?? -1) ?? []
    : [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            Join Department Requests
          </h2>
          <p className="text-sm text-primaryGray">
            Review requests members have raised to join a department or ministry.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-lightGray p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setSelectedIds([]);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                statusFilter === tab.value
                  ? "bg-lightGray font-semibold text-primary"
                  : "text-primary/80 hover:bg-lightGray/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {statusFilter === "PENDING" && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium text-primary">
            {selectedIds.length} selected
          </p>
          <div className="flex gap-2">
            <Button
              value="Confirm Selected"
              onClick={() => setBulkMode("approve")}
            />
            <Button
              value="Decline Selected"
              variant="secondary"
              onClick={() => setBulkMode("decline")}
            />
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-primaryGray">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No requests found"
          description="There are no join requests for this status."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-lightGray">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-lightGray/40 text-xs uppercase tracking-wide text-primaryGray">
              <tr>
                {statusFilter === "PENDING" && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-t border-lightGray/70 hover:bg-lightGray/20"
                >
                  {statusFilter === "PENDING" && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${request.member_name ?? "request"}`}
                        checked={selectedIds.includes(request.id)}
                        onChange={() => toggleSelect(request.id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-primaryGray">
                    {formatDate(request.requested_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {request.member_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-primaryGray">
                    {request.phone_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-primaryGray">
                    {request.department_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`px-3 py-1 text-xs ${statusBadgeClass(request.status)}`}>
                      {request.status.charAt(0) +
                        request.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {request.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmTarget(request)}
                          className="inline-flex min-h-9 items-center rounded-lg border border-success/30 px-3 py-1.5 text-xs font-medium text-success transition hover:bg-success/5"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeclineTarget(request)}
                          className="inline-flex min-h-9 items-center rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error transition hover:bg-error/5"
                        >
                          Decline
                        </button>
                      </div>
                    ) : request.status === "DECLINED" && request.decline_reason ? (
                      <p className="text-right text-xs italic text-primaryGray">
                        {request.decline_reason}
                      </p>
                    ) : (
                      <p className="text-right text-xs text-primaryGray">—</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Single confirm modal */}
      <Modal
        open={Boolean(confirmTarget)}
        persist={false}
        onClose={closeModals}
      >
        <FormHeader>
          <div>
            <p className="text-lg font-semibold">Confirm Join Request</p>
            <p className="mt-1 text-sm text-white/80">
              Add {confirmTarget?.member_name} to {confirmTarget?.department_name}
              .
            </p>
          </div>
        </FormHeader>
        <div className="space-y-6 p-6">
          <FormLayout $columns={1}>
            <SelectField
              id="position"
              label="Position"
              value={positionId}
              options={confirmPositionOptions}
              placeholder={
                confirmPositionOptions.length
                  ? "Select position"
                  : "No positions configured for this department"
              }
              onChange={(_, value) => setPositionId(value ? String(value) : "")}
            />
            <InputDiv
              id="start_date"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(_, value) => setStartDate(String(value))}
            />
            <InputDiv
              id="instructions"
              type="textarea"
              label="Instructions (optional)"
              value={instructions}
              placeholder="Any onboarding note for the member."
              onChange={(_, value) => setInstructions(String(value))}
            />
          </FormLayout>
          <div className="flex justify-end gap-3 border-t border-lightGray pt-4">
            <Button value="Cancel" variant="ghost" onClick={closeModals} />
            <Button
              value="Confirm & Add"
              onClick={submitConfirm}
              loading={submitting}
            />
          </div>
        </div>
      </Modal>

      {/* Single decline modal */}
      <Modal
        open={Boolean(declineTarget)}
        persist={false}
        onClose={closeModals}
      >
        <FormHeader>
          <div>
            <p className="text-lg font-semibold">Decline Join Request</p>
            <p className="mt-1 text-sm text-white/80">
              Let {declineTarget?.member_name} know why their request was
              declined.
            </p>
          </div>
        </FormHeader>
        <div className="space-y-6 p-6">
          <FormLayout $columns={1}>
            <InputDiv
              id="decline_reason"
              type="textarea"
              label="Justification"
              value={declineReason}
              placeholder="Reason for declining this request."
              onChange={(_, value) => setDeclineReason(String(value))}
            />
          </FormLayout>
          <div className="flex justify-end gap-3 border-t border-lightGray pt-4">
            <Button value="Cancel" variant="ghost" onClick={closeModals} />
            <Button
              value="Decline Request"
              variant="secondary"
              onClick={submitDecline}
              loading={submitting}
              disabled={!declineReason.trim()}
            />
          </div>
        </div>
      </Modal>

      {/* Bulk modal */}
      <Modal open={Boolean(bulkMode)} persist={false} onClose={closeModals}>
        <FormHeader>
          <div>
            <p className="text-lg font-semibold">
              {bulkMode === "approve"
                ? "Confirm Selected Requests"
                : "Decline Selected Requests"}
            </p>
            <p className="mt-1 text-sm text-white/80">
              This will apply to {selectedIds.length} request(s).
            </p>
          </div>
        </FormHeader>
        <div className="space-y-6 p-6">
          <FormLayout $columns={1}>
            {bulkMode === "approve" ? (
              <>
                <p className="text-sm text-primaryGray">
                  Positions differ per department, so set them individually
                  later if needed. A shared start date and instructions can be
                  applied now.
                </p>
                <InputDiv
                  id="bulk_start_date"
                  type="date"
                  label="Start Date (optional)"
                  value={startDate}
                  onChange={(_, value) => setStartDate(String(value))}
                />
                <InputDiv
                  id="bulk_instructions"
                  type="textarea"
                  label="Instructions (optional)"
                  value={instructions}
                  onChange={(_, value) => setInstructions(String(value))}
                />
              </>
            ) : (
              <InputDiv
                id="bulk_decline_reason"
                type="textarea"
                label="Justification"
                value={declineReason}
                placeholder="Reason for declining these requests."
                onChange={(_, value) => setDeclineReason(String(value))}
              />
            )}
          </FormLayout>
          <div className="flex justify-end gap-3 border-t border-lightGray pt-4">
            <Button value="Cancel" variant="ghost" onClick={closeModals} />
            <Button
              value={bulkMode === "approve" ? "Confirm All" : "Decline All"}
              variant={bulkMode === "approve" ? "default" : "secondary"}
              onClick={submitBulk}
              loading={submitting}
              disabled={bulkMode === "decline" && !declineReason.trim()}
            />
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default JoinDepartmentRequests;
