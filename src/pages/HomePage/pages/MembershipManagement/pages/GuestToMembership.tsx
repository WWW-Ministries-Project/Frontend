import { useMemo, useState } from "react";

import {
  CellText,
  DialogShell,
  GridColumn,
  GridTable,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  daysAgoLabel,
  formatDate,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { DeclineReasonDialog } from "@/pages/HomePage/pages/MembershipManagement/components/manager/DeclineReasonDialog";
import {
  ManagerEmpty,
  ManagerSection,
  ShowMoreRows,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/ManagerSection";
import { useRowLimit } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useRowLimit";
import {
  errorText,
  matchesQuery,
  phoneLabel,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import { useManagerData } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useManagerData";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import type { MembershipRequestRow } from "@/utils/api/guests/interfaces";

const guestName = (request: MembershipRequestRow) => {
  const info = request.user?.user_info;
  return (
    [info?.title, info?.first_name, info?.other_name, info?.last_name]
      .filter(Boolean)
      .join(" ") ||
    request.user?.name ||
    "—"
  );
};

const responseMessage = (response: unknown, fallback: string) =>
  (response as { data?: { message?: string } } | undefined)?.data?.message || fallback;

/**
 * Guests who joined from the mobile app and asked to become members. The
 * approve endpoint itself turns the guest into a confirmed member (assigning a
 * member ID and notifying them), so approval stays an API action rather than
 * opening the member form.
 */
export const GuestToMembership = () => {
  const { guestRequests, guestsLoading, refetchGuests, refetchMembers } = useManagerData();
  const [query, setQuery] = useState("");
  const [approveTarget, setApproveTarget] = useState<MembershipRequestRow | null>(null);
  const [declineTarget, setDeclineTarget] = useState<MembershipRequestRow | null>(null);
  const [approving, setApproving] = useState(false);

  const rows = useMemo(
    () =>
      guestRequests.filter((request) =>
        matchesQuery(query, [
          guestName(request),
          request.user?.email,
          request.user?.member_id,
          request.user?.user_info?.primary_number,
        ])
      ),
    [guestRequests, query]
  );
  const { visible, remaining, showMore } = useRowLimit(rows, query);

  const approve = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const response = await api.put.approveMembershipRequest({ id: approveTarget.id });
      showNotification(responseMessage(response, `${guestName(approveTarget)} approved`));
      setApproveTarget(null);
      await Promise.all([refetchGuests(), refetchMembers()]);
    } catch (error) {
      showNotification(errorText(error, "Unable to approve this request."), "error");
    } finally {
      setApproving(false);
    }
  };

  const decline = async (reason: string) => {
    if (!declineTarget) return false;
    try {
      const response = await api.put.declineMembershipRequest({
        id: declineTarget.id,
        reason,
      });
      showNotification(responseMessage(response, "Request declined"));
      await refetchGuests();
      return true;
    } catch (error) {
      showNotification(errorText(error, "Unable to decline this request."), "error");
      return false;
    }
  };

  const columns: GridColumn<MembershipRequestRow>[] = [
    {
      key: "guest",
      header: "Guest",
      width: "minmax(200px,2fr)",
      render: (request) => (
        <CellText strong main={guestName(request)} sub={request.user?.email || "No email"} />
      ),
    },
    {
      key: "phone",
      header: "Phone number",
      width: "1.1fr",
      render: (request) => (
        <CellText
          main={phoneLabel(
            request.user?.user_info?.country_code,
            request.user?.user_info?.primary_number
          )}
        />
      ),
    },
    {
      key: "requested",
      header: "Requested",
      width: "1fr",
      render: (request) => (
        <CellText
          main={formatDate(request.requested_at)}
          sub={daysAgoLabel(request.requested_at)}
        />
      ),
    },
    {
      key: "note",
      header: "Note",
      width: "1.8fr",
      render: (request) => <CellText main={request.message?.trim() || "No note"} />,
    },
  ];

  return (
    <ManagerSection
      title="Membership requests from app guests"
      description="Approving makes the guest a confirmed member and notifies them in the app; declining sends them your reason."
      query={query}
      onQueryChange={setQuery}
    >
      {rows.length > 0 || (guestsLoading && guestRequests.length === 0) ? (
        <>
          <GridTable
            columns={columns}
            rows={visible}
            getRowId={(request) => String(request.id)}
            loading={guestsLoading}
            renderActions={(request) => (
              <>
                <UiButton tone="primary" size="sm" onClick={() => setApproveTarget(request)}>
                  Approve
                </UiButton>
                <UiButton tone="danger" size="sm" onClick={() => setDeclineTarget(request)}>
                  Decline
                </UiButton>
              </>
            )}
          />
          <ShowMoreRows remaining={remaining} onClick={showMore} />
        </>
      ) : (
        <ManagerEmpty
          query={query}
          onResetQuery={() => setQuery("")}
          title="No guest requests"
          text="Requests from people using the app as guests will appear here."
        />
      )}

      <DialogShell
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        title={`Approve ${approveTarget ? guestName(approveTarget) : "request"}`}
        subtitle="They become a confirmed member, get a member ID if they don't have one, and are notified in the app. You can complete their record from the member profile."
        ctaLabel="Approve"
        onConfirm={approve}
        loading={approving}
      />

      <DeclineReasonDialog
        open={Boolean(declineTarget)}
        count={1}
        audience="guest"
        onClose={() => setDeclineTarget(null)}
        onSubmit={decline}
      />
    </ManagerSection>
  );
};

export default GuestToMembership;
