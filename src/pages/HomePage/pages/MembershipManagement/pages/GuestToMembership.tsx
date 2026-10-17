import { Button } from "@/components";
import { Badge } from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { FormHeader, FormLayout } from "@/components/ui";
import { useFetch } from "@/CustomHooks/useFetch";
import { InputDiv } from "@/pages/HomePage/Components/reusable/InputDiv";
import { showNotification } from "@/pages/HomePage/utils";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils";
import type { MembershipRequestRow, MembershipRequestStatus } from "@/utils";
import { formatPhoneNumber } from "@/utils/helperFunctions";
import { useMemo, useState } from "react";

const STATUS_TABS: { label: string; value: MembershipRequestStatus }[] = [
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

const statusBadgeClass = (status: MembershipRequestStatus) => {
  switch (status) {
    case "APPROVED":
      return "border-success/20 bg-success/10 text-success";
    case "DECLINED":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-warning/20 bg-warning/10 text-warning";
  }
};

const displayName = (request: MembershipRequestRow) => {
  const info = request.user?.user_info;
  return (
    [info?.title, info?.first_name, info?.other_name, info?.last_name]
      .filter(Boolean)
      .join(" ") ||
    request.user?.name ||
    "—"
  );
};

/**
 * Guests who joined from the mobile app and then asked to become members.
 * Approving makes the guest a confirmed member (and the app notifies them);
 * declining keeps them a guest and tells them why.
 */
export const GuestToMembership = () => {
  const { activeBranchId } = useBranchStore();
  const [statusFilter, setStatusFilter] =
    useState<MembershipRequestStatus>("PENDING");

  const query = useMemo(
    () => ({
      ...(buildBranchQuery(activeBranchId) ?? {}),
      status: statusFilter,
      take: "500",
    }),
    [activeBranchId, statusFilter]
  );

  const { data, loading, refetch } = useFetch(
    api.fetch.fetchMembershipRequests,
    query
  );
  const requests = data?.data?.items ?? [];

  const [approveTarget, setApproveTarget] =
    useState<MembershipRequestRow | null>(null);
  const [declineTarget, setDeclineTarget] =
    useState<MembershipRequestRow | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const closeModals = () => {
    setApproveTarget(null);
    setDeclineTarget(null);
    setDeclineReason("");
  };

  const handleError = (error: unknown, fallback: string) => {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || fallback;
    showNotification(message, "error");
  };

  const submitApprove = async () => {
    if (!approveTarget) return;
    setSubmitting(true);
    try {
      const response = await api.put.approveMembershipRequest({
        id: approveTarget.id,
      });
      showNotification(
        (response as { message?: string })?.message ||
          "Membership confirmed.",
        "success"
      );
      closeModals();
      await refetch();
    } catch (error) {
      handleError(error, "Unable to approve this request.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDecline = async () => {
    if (!declineTarget) return;
    setSubmitting(true);
    try {
      const response = await api.put.declineMembershipRequest({
        id: declineTarget.id,
        reason: declineReason.trim() || undefined,
      });
      showNotification(
        (response as { message?: string })?.message || "Request declined.",
        "success"
      );
      closeModals();
      await refetch();
    } catch (error) {
      handleError(error, "Unable to decline this request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            Guest-to-Membership
          </h2>
          <p className="text-sm text-primaryGray">
            Guests who joined from the mobile app and asked to become members.
            Approving confirms their membership and notifies them in the app.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-lightGray p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
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

      {loading && requests.length === 0 ? (
        <p className="py-10 text-center text-sm text-primaryGray">Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState
          scope="section"
          msg="No requests found"
          description="There are no guest membership requests for this status."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-lightGray">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-lightGray/40 text-xs uppercase tracking-wide text-primaryGray">
              <tr>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined as guest</th>
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
                  <td className="px-4 py-3 text-primaryGray">
                    {formatDate(request.requested_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {displayName(request)}
                  </td>
                  <td className="px-4 py-3 text-primaryGray">
                    {request.user?.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-primaryGray">
                    {request.user?.user_info?.primary_number
                      ? formatPhoneNumber(
                          request.user.user_info.country_code ?? "",
                          request.user.user_info.primary_number
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-primaryGray">
                    {formatDate(request.user?.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`px-3 py-1 text-xs ${statusBadgeClass(request.status)}`}
                    >
                      {request.status.charAt(0) +
                        request.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {request.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setApproveTarget(request)}
                          className="inline-flex min-h-9 items-center rounded-lg border border-success/30 px-3 py-1.5 text-xs font-medium text-success transition hover:bg-success/5"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeclineTarget(request)}
                          className="inline-flex min-h-9 items-center rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error transition hover:bg-error/5"
                        >
                          Decline
                        </button>
                      </div>
                    ) : request.status === "DECLINED" &&
                      request.decline_reason ? (
                      <p className="text-right text-xs italic text-primaryGray">
                        {request.decline_reason}
                      </p>
                    ) : (
                      <p className="text-right text-xs text-primaryGray">
                        {request.decider?.name
                          ? `By ${request.decider.name}`
                          : "—"}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(approveTarget)} persist={false} onClose={closeModals}>
        <FormHeader>
          <div>
            <p className="text-lg font-semibold">Approve Membership</p>
            <p className="mt-1 text-sm text-white/80">
              {approveTarget ? displayName(approveTarget) : ""} becomes a
              confirmed member and is notified in the app.
            </p>
          </div>
        </FormHeader>
        <div className="space-y-6 p-6">
          <p className="text-sm text-primaryGray">
            A member ID is assigned if they don't have one. You can complete the
            rest of their record from the member profile later.
          </p>
          <div className="flex justify-end gap-3 border-t border-lightGray pt-4">
            <Button value="Cancel" variant="ghost" onClick={closeModals} />
            <Button
              value="Approve"
              onClick={submitApprove}
              loading={submitting}
            />
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(declineTarget)} persist={false} onClose={closeModals}>
        <FormHeader>
          <div>
            <p className="text-lg font-semibold">Decline Membership Request</p>
            <p className="mt-1 text-sm text-white/80">
              {declineTarget ? displayName(declineTarget) : ""} stays a guest.
              Your note is sent to them in the app.
            </p>
          </div>
        </FormHeader>
        <div className="space-y-6 p-6">
          <FormLayout $columns={1}>
            <InputDiv
              id="membership_decline_reason"
              type="textarea"
              label="Note to the guest (optional)"
              value={declineReason}
              placeholder="e.g. Please attend the membership class first."
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
            />
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default GuestToMembership;
