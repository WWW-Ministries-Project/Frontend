import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BulkBar,
  CellText,
  GridColumn,
  GridTable,
  PillTabs,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  daysSince,
  formatDate,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { AssignDepartmentDialog } from "@/pages/HomePage/pages/MembershipManagement/components/manager/AssignDepartmentDialog";
import {
  ManagerEmpty,
  ManagerSection,
  ShowMoreRows,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/ManagerSection";
import { useRowLimit } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useRowLimit";
import {
  errorText,
  ManagerMember,
  matchesQuery,
  memberDisplayName,
  memberHasDepartment,
  memberStageSince,
  phoneLabel,
} from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import { useManagerData } from "@/pages/HomePage/pages/MembershipManagement/components/manager/useManagerData";
import { encodeQuery, showNotification } from "@/pages/HomePage/utils";
import { advanceMembers, describeOutcome } from "@/utils/api/members/membershipActions";

type Stage = "UNCONFIRMED" | "CONFIRMED";

const stageOf = (member: ManagerMember): Stage | "MEMBER" =>
  member.status === "MEMBER" ? "MEMBER" : member.status === "CONFIRMED" ? "CONFIRMED" : "UNCONFIRMED";

const waitingLabel = (since: string | null) => {
  const days = daysSince(since);
  if (days === null) return "";
  return `${days} ${days === 1 ? "day" : "days"} waiting`;
};

export const MemberConfirmation = () => {
  const navigate = useNavigate();
  const { members, membersLoading, refetchMembers } = useManagerData();
  const [stage, setStage] = useState<Stage>("UNCONFIRMED");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [assignIds, setAssignIds] = useState<number[]>([]);

  const active = useMemo(
    () => members.filter((member) => member.is_active !== false),
    [members]
  );
  const stageCounts = useMemo(
    () => ({
      UNCONFIRMED: active.filter((member) => stageOf(member) === "UNCONFIRMED").length,
      CONFIRMED: active.filter((member) => stageOf(member) === "CONFIRMED").length,
    }),
    [active]
  );

  const rows = useMemo(
    () =>
      active.filter(
        (member) =>
          stageOf(member) === stage &&
          matchesQuery(query, [
            memberDisplayName(member),
            member.member_id,
            member.email,
            member.primary_number,
            phoneLabel(member.country_code, member.primary_number),
          ])
      ),
    [active, stage, query]
  );
  const { visible, remaining, showMore } = useRowLimit(rows, `${stage}|${query}`);

  // Keep the selection to rows that are still in this queue.
  useEffect(() => {
    const ids = new Set(rows.map((member) => String(member.id)));
    setSelected((previous) => {
      const next = previous.filter((id) => ids.has(id));
      return next.length === previous.length ? previous : next;
    });
  }, [rows]);

  const byId = useMemo(
    () => new Map(members.map((member) => [String(member.id), member])),
    [members]
  );
  const selectedMembers = selected
    .map((id) => byId.get(id))
    .filter((member): member is ManagerMember => Boolean(member));

  const switchStage = (next: Stage) => {
    setStage(next);
    setSelected([]);
  };

  const advance = async (
    targets: ManagerMember[],
    status: "CONFIRMED" | "MEMBER",
    successText: (count: number) => string,
    suffix = ""
  ) => {
    if (targets.length === 0) {
      if (suffix) showNotification(suffix.replace(/^ · /, ""), "error");
      return;
    }
    setBusy(true);
    try {
      const outcome = await advanceMembers(
        targets.map((member) => member.id),
        status
      );
      const result = describeOutcome(outcome, successText);
      showNotification(result.message + suffix, result.type);
      setSelected([]);
      await refetchMembers();
    } catch (error) {
      showNotification(errorText(error, "Unable to update membership status."), "error");
    } finally {
      setBusy(false);
    }
  };

  const confirmOne = (member: ManagerMember) =>
    advance([member], "CONFIRMED", () => `${memberDisplayName(member)} confirmed`);

  const makeFunctionalOne = (member: ManagerMember) =>
    advance(
      [member],
      "MEMBER",
      () => `${memberDisplayName(member)} is now a functional member`
    );

  const confirmSelected = () =>
    advance(selectedMembers, "CONFIRMED", (count) => `${count} confirmed`);

  const makeSelectedFunctional = () => {
    const ready = selectedMembers.filter(memberHasDepartment);
    const missing = selectedMembers.length - ready.length;
    advance(
      ready,
      "MEMBER",
      (count) => `${count} made functional`,
      missing > 0
        ? ` · ${missing} still ${missing === 1 ? "needs" : "need"} a department`
        : ""
    );
  };

  const toggleRow = (id: string) =>
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    );

  const toggleAll = () => {
    const ids = visible.map((member) => String(member.id));
    const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected((previous) =>
      allOn
        ? previous.filter((id) => !ids.includes(id))
        : Array.from(new Set([...previous, ...ids]))
    );
  };

  const columns: GridColumn<ManagerMember>[] = [
    {
      key: "member",
      header: "Member",
      width: "minmax(200px,2fr)",
      render: (member) => (
        <CellText strong main={memberDisplayName(member)} sub={member.member_id} />
      ),
    },
    {
      key: "phone",
      header: "Phone number",
      width: "1.2fr",
      render: (member) => (
        <CellText main={phoneLabel(member.country_code, member.primary_number)} />
      ),
    },
    {
      key: "membership",
      header: "Membership",
      width: "1fr",
      render: (member) => (
        <CellText main={member.membership_type === "ONLINE" ? "Online" : "In person"} />
      ),
    },
    {
      key: "since",
      header: "In this stage since",
      width: "1.3fr",
      render: (member) => {
        const since = memberStageSince(member);
        return <CellText main={formatDate(since)} sub={waitingLabel(since)} />;
      },
    },
  ];

  const assignWho =
    assignIds.length === 1
      ? memberDisplayName(byId.get(String(assignIds[0])) ?? ({ name: "" } as ManagerMember))
      : `${assignIds.length} members`;

  return (
    <ManagerSection
      title={stage === "UNCONFIRMED" ? "Awaiting confirmation" : "Awaiting functional membership"}
      description={
        stage === "UNCONFIRMED"
          ? "Confirm members once they complete the membership class."
          : "Confirmed members become functional once they serve in a department."
      }
      query={query}
      onQueryChange={setQuery}
      toggle={
        <PillTabs
          ariaLabel="Filter"
          value={stage}
          onChange={switchStage}
          tabs={[
            { key: "UNCONFIRMED", label: "Unconfirmed", count: stageCounts.UNCONFIRMED },
            { key: "CONFIRMED", label: "Confirmed", count: stageCounts.CONFIRMED },
          ]}
        />
      }
    >
      {selected.length > 0 && (
        <BulkBar
          label={`${selected.length} ${selected.length === 1 ? "member" : "members"} selected`}
          onClear={() => setSelected([])}
          actions={[
            stage === "UNCONFIRMED"
              ? { label: "Confirm selected", onClick: confirmSelected, disabled: busy }
              : {
                  label: "Make selected functional",
                  onClick: makeSelectedFunctional,
                  disabled: busy,
                },
            {
              label: "Assign department",
              onClick: () => setAssignIds(selectedMembers.map((member) => member.id)),
              disabled: busy,
            },
          ]}
        />
      )}

      {rows.length > 0 || (membersLoading && members.length === 0) ? (
        <>
          <GridTable
            columns={columns}
            rows={visible}
            getRowId={(member) => String(member.id)}
            selectable
            selectedIds={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onRowClick={(member) =>
              navigate(`/home/members/${encodeQuery(member.id)}`, {
                state: { prefillMember: member },
              })
            }
            minWidth="900px"
            loading={membersLoading}
            renderActions={(member) =>
              stage === "UNCONFIRMED" ? (
                <UiButton
                  tone="primary"
                  size="sm"
                  disabled={busy}
                  onClick={() => confirmOne(member)}
                >
                  Confirm
                </UiButton>
              ) : memberHasDepartment(member) ? (
                <UiButton
                  tone="primary"
                  size="sm"
                  disabled={busy}
                  onClick={() => makeFunctionalOne(member)}
                >
                  Make functional
                </UiButton>
              ) : (
                <UiButton
                  tone="secondary"
                  size="sm"
                  disabled={busy}
                  title="Functional members serve in a department"
                  onClick={() => setAssignIds([member.id])}
                >
                  Assign department
                </UiButton>
              )
            }
          />
          <ShowMoreRows remaining={remaining} onClick={showMore} />
        </>
      ) : (
        <ManagerEmpty
          query={query}
          onResetQuery={() => setQuery("")}
          title="All caught up"
          text={
            stage === "UNCONFIRMED"
              ? "No members are waiting for confirmation."
              : "No confirmed members are waiting to become functional."
          }
        />
      )}

      <AssignDepartmentDialog
        memberIds={assignIds}
        who={assignWho}
        onClose={() => setAssignIds([])}
        onDone={() => {
          setSelected([]);
          void refetchMembers();
        }}
      />
    </ManagerSection>
  );
};

export default MemberConfirmation;
