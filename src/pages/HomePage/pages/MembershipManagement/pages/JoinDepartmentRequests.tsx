import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import {
  BulkBar,
  CellText,
  GridColumn,
  GridTable,
  Pill,
  PillTabs,
  SelectOption,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  daysAgoLabel,
  formatDate,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import {
  ApproveJoinDialog,
  ApproveJoinValues,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/ApproveJoinDialog";
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
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import { joinRequestDetails } from "@/pages/HomePage/pages/MembershipManagement/components/departments/departmentShared";
import { useManagerData } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useManagerData";
import useSettingsStore from "@/pages/HomePage/pages/Settings/utils/settingsStore";
import { encodeQuery, showNotification } from "@/pages/HomePage/utils";
import { buildBranchQuery, useBranchStore } from "@/store/useBranchStore";
import { api } from "@/utils/api/apiCalls";
import type {
  JoinRequestRow,
  JoinRequestStatus,
} from "@/utils/api/departmentJoinRequests/interfaces";

const STATUS_TABS: { key: JoinRequestStatus; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "DECLINED", label: "Declined" },
];

const responseMessage = (response: unknown, fallback: string) =>
  (response as { data?: { message?: string } } | undefined)?.data?.message || fallback;

export const JoinDepartmentRequests = () => {
  const navigate = useNavigate();
  const { joinRequests, joinsLoading, refetchJoins, members, refetchMembers } =
    useManagerData();
  const [status, setStatus] = useState<JoinRequestStatus>("PENDING");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [approveIds, setApproveIds] = useState<number[]>([]);
  const [declineIds, setDeclineIds] = useState<number[]>([]);

  // Positions per department for the approve dialog.
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const branchQuery = useMemo(() => buildBranchQuery(activeBranchId), [activeBranchId]);
  const { data: openDepartments } = useFetch(
    api.fetch.fetchOpenDepartmentsToJoin,
    branchQuery,
    false,
    { silent: true }
  );
  const storePositionOptions = useSettingsStore((state) => state.positionOptions);
  const positionsFor = (departmentId?: number): SelectOption[] => {
    if (!departmentId) return [];
    const open = (openDepartments?.data ?? []).find((dept) => dept.id === departmentId);
    if (open && open.position.length > 0) {
      return open.position.map((position) => ({
        value: String(position.id),
        label: position.name,
      }));
    }
    return (storePositionOptions[departmentId] ?? []).map((option) => ({
      value: String(option.value),
      label: String(option.label),
    }));
  };

  const memberCodes = useMemo(
    () => new Map(members.map((member) => [String(member.id), member.member_id])),
    [members]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<JoinRequestStatus, number> = { PENDING: 0, APPROVED: 0, DECLINED: 0 };
    joinRequests.forEach((request) => {
      counts[request.status] = (counts[request.status] ?? 0) + 1;
    });
    return counts;
  }, [joinRequests]);

  const rows = useMemo(
    () =>
      joinRequests.filter(
        (request) =>
          request.status === status &&
          matchesQuery(query, [
            request.member_name,
            request.department_name,
            request.phone_number,
            memberCodes.get(String(request.member_id)),
          ])
      ),
    [joinRequests, status, query, memberCodes]
  );
  const { visible, remaining, showMore } = useRowLimit(rows, `${status}|${query}`);
  const selectable = status === "PENDING";

  useEffect(() => {
    const ids = new Set(rows.map((request) => String(request.id)));
    setSelected((previous) => {
      const next = previous.filter((id) => ids.has(id));
      return next.length === previous.length ? previous : next;
    });
  }, [rows]);

  const byId = useMemo(
    () => new Map(joinRequests.map((request) => [request.id, request])),
    [joinRequests]
  );
  const approveTargets = approveIds
    .map((id) => byId.get(id))
    .filter((request): request is JoinRequestRow => Boolean(request));

  const switchStatus = (next: JoinRequestStatus) => {
    setStatus(next);
    setSelected([]);
  };

  const toggleRow = (id: string) =>
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    );
  const toggleAll = () => {
    const ids = visible.map((request) => String(request.id));
    const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected(allOn ? [] : ids);
  };

  const afterDecision = async () => {
    setSelected([]);
    await Promise.all([refetchJoins(), refetchMembers()]);
  };

  // Bulk approval takes one position for all requests, so it is only offered
  // when every selected request is for the same department.
  const approveDepartments = Array.from(
    new Set(approveTargets.map((request) => request.department_id))
  );
  const sharedDepartment =
    approveDepartments.length === 1 ? approveDepartments[0] : undefined;

  const submitApprove = async (values: ApproveJoinValues) => {
    const positionId = values.positionId ? Number(values.positionId) : undefined;
    const common = {
      start_date: values.startDate || undefined,
      instructions: values.instructions || undefined,
    };
    try {
      if (approveIds.length === 1) {
        const response = await api.put.approveJoinRequest({
          id: approveIds[0],
          position_id: positionId,
          ...common,
        });
        showNotification(responseMessage(response, "Request approved"));
      } else {
        const response = await api.post.bulkJoinRequestAction({
          ids: approveIds,
          action: "approve",
          position_id: sharedDepartment ? positionId : undefined,
          ...common,
        });
        const results = (response.data ?? []) as { ok?: boolean; message?: string }[];
        const failed = results.filter((result) => result.ok === false);
        const ok = results.length ? results.length - failed.length : approveIds.length;
        showNotification(
          failed.length
            ? `${ok} approved · ${failed.length} failed. ${failed[0]?.message ?? ""}`.trim()
            : `${ok} requests approved`,
          failed.length ? "error" : "success"
        );
      }
      await afterDecision();
      return true;
    } catch (error) {
      showNotification(errorText(error, "Unable to approve."), "error");
      return false;
    }
  };

  const submitDecline = async (reason: string) => {
    try {
      if (declineIds.length === 1) {
        const response = await api.put.declineJoinRequest({
          id: declineIds[0],
          decline_reason: reason,
        });
        showNotification(responseMessage(response, "Request declined"));
      } else {
        const response = await api.post.bulkJoinRequestAction({
          ids: declineIds,
          action: "decline",
          decline_reason: reason,
        });
        const results = (response.data ?? []) as { ok?: boolean; message?: string }[];
        const failed = results.filter((result) => result.ok === false);
        const ok = results.length ? results.length - failed.length : declineIds.length;
        showNotification(
          failed.length
            ? `${ok} declined · ${failed.length} failed. ${failed[0]?.message ?? ""}`.trim()
            : `${ok} requests declined`,
          failed.length ? "error" : "success"
        );
      }
      await afterDecision();
      return true;
    } catch (error) {
      showNotification(errorText(error, "Unable to decline."), "error");
      return false;
    }
  };

  const details = (request: JoinRequestRow) => {
    const { main, sub } = joinRequestDetails(request);
    return <CellText main={main} sub={sub} />;
  };

  const columns: GridColumn<JoinRequestRow>[] = [
    {
      key: "member",
      header: "Member",
      width: "minmax(200px,2fr)",
      render: (request) => (
        <CellText
          strong
          main={request.member_name || "—"}
          sub={memberCodes.get(String(request.member_id)) || undefined}
        />
      ),
    },
    {
      key: "department",
      header: "Department",
      width: "1.2fr",
      render: (request) => <CellText main={request.department_name || "—"} />,
    },
    {
      key: "requested",
      header: "Requested",
      width: "1.1fr",
      render: (request) => (
        <CellText
          main={formatDate(request.requested_at)}
          sub={daysAgoLabel(request.requested_at)}
        />
      ),
    },
    { key: "details", header: "Details", width: "1.6fr", render: details },
  ];

  const singleApprove = approveTargets.length === 1 ? approveTargets[0] : null;

  return (
    <ManagerSection
      title="Requests to join a department"
      description="Members ask to serve from their portal. Approve with a position and start date, or decline with a reason."
      query={query}
      onQueryChange={setQuery}
      toggle={
        <PillTabs
          ariaLabel="Filter"
          value={status}
          onChange={switchStatus}
          tabs={STATUS_TABS.map((tab) => ({ ...tab, count: statusCounts[tab.key] }))}
        />
      }
    >
      {selectable && selected.length > 0 && (
        <BulkBar
          label={`${selected.length} ${selected.length === 1 ? "request" : "requests"} selected`}
          onClear={() => setSelected([])}
          actions={[
            { label: "Approve selected", onClick: () => setApproveIds(selected.map(Number)) },
            {
              label: "Decline selected",
              danger: true,
              onClick: () => setDeclineIds(selected.map(Number)),
            },
          ]}
        />
      )}

      {rows.length > 0 || (joinsLoading && joinRequests.length === 0) ? (
        <>
          <GridTable
            columns={columns}
            rows={visible}
            getRowId={(request) => String(request.id)}
            selectable={selectable}
            selectedIds={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onRowClick={(request) => {
              if (request.member_id) navigate(`/home/members/${encodeQuery(request.member_id)}`);
            }}
            minWidth="900px"
            loading={joinsLoading}
            renderActions={(request) =>
              request.status === "PENDING" ? (
                <>
                  <UiButton tone="primary" size="sm" onClick={() => setApproveIds([request.id])}>
                    Approve
                  </UiButton>
                  <UiButton tone="danger" size="sm" onClick={() => setDeclineIds([request.id])}>
                    Decline
                  </UiButton>
                </>
              ) : request.status === "APPROVED" ? (
                <Pill tone="success">Approved</Pill>
              ) : (
                <Pill tone="danger">Declined</Pill>
              )
            }
          />
          <ShowMoreRows remaining={remaining} onClick={showMore} />
        </>
      ) : (
        <ManagerEmpty
          query={query}
          onResetQuery={() => setQuery("")}
          title={`No ${status.toLowerCase()} requests`}
          text="Join requests will show here as members send them."
        />
      )}

      <ApproveJoinDialog
        open={approveIds.length > 0}
        title={
          singleApprove
            ? `Approve ${singleApprove.member_name || "request"}`
            : `Approve ${approveIds.length} requests`
        }
        subtitle={
          singleApprove
            ? `Add them to ${singleApprove.department_name || "the department"}. They will be notified with the details below.`
            : "Each member will be added to the department they asked to join."
        }
        positionOptions={sharedDepartment ? positionsFor(sharedDepartment) : null}
        positionNote={
          sharedDepartment
            ? undefined
            : "These requests are for different departments, so set positions from each member's profile later."
        }
        onClose={() => setApproveIds([])}
        onSubmit={submitApprove}
      />

      <DeclineReasonDialog
        open={declineIds.length > 0}
        count={declineIds.length}
        audience="member"
        onClose={() => setDeclineIds([])}
        onSubmit={submitDecline}
      />
    </ManagerSection>
  );
};

export default JoinDepartmentRequests;
