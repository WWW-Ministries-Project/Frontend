import { useBackNavigation } from "@/CustomHooks/useBackNavigation";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { errorText } from "@/pages/HomePage/pages/MembershipManagement/components/manager/managerHelpers";
import {
  BandTabs,
  CellText,
  GridColumn,
  GridTable,
  Pill,
  SectionEmpty,
  SectionHeading,
  UiButton,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUi";
import {
  daysAgoLabel,
  formatDate,
  initialsOf,
} from "@/pages/HomePage/pages/MembershipManagement/components/membershipUiUtils";
import { api } from "@/utils/api/apiCalls";
import type {
  FollowUpType,
  RawFollowUpType,
  VisitType,
} from "@/utils/api/visitors/interfaces";
import {
  COMPLETED_STATUS,
  isCompletedStatus,
  removeVisit,
  responsibleMemberIds,
  saveFollowUp,
  setResponsibleMembers,
} from "@/utils/api/visitors/visitorActions";
import { formatPhoneNumber } from "@/utils/helperFunctions";

import { responsibleOptions, useVisitorDialogs } from "../Components/useVisitorDialogs";
import { useVisitorAccess } from "../utils/useVisitorAccess";
import {
  followUpTypeLabel,
  heardLabel,
  isoDay,
  STAGE_PILL,
  visitorDetailsPath,
  visitorName,
  visitorsPath,
  visitorStage,
} from "../utils/visitorHelpers";

type Tab = "visits" | "follow";

const byDateDesc = <T extends { date: string }>(rows: T[]) =>
  [...rows].sort((a, b) => (isoDay(b.date) > isoDay(a.date) ? 1 : -1));

export const VisitorDetails = () => {
  const { visitorId = "" } = useParams();
  const navigate = useNavigate();
  const back = useBackNavigation(visitorsPath);
  const access = useVisitorAccess();
  const [tab, setTab] = useState<Tab>("visits");
  const [busy, setBusy] = useState(false);

  const visitorQuery = useMemo(() => ({ id: visitorId }), [visitorId]);
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchVisitorById, visitorQuery);
  // Raw rows keep the assignee id, which the details endpoint swaps for a name.
  const { data: rawFollowUps, refetch: refetchRaw } = useFetch(
    api.fetch.fetchVisitorFollowUps,
    undefined,
    false,
    { silent: true }
  );

  const visitor = data?.data ?? null;
  const refresh = () => Promise.all([refetch(), refetchRaw()]);
  const dialogs = useVisitorDialogs({
    onChanged: refresh,
    onDeleted: () => navigate(visitorsPath),
    afterConvertPath: visitorDetailsPath(visitorId),
  });

  const assigneeById = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(rawFollowUps?.data) ? (rawFollowUps.data as RawFollowUpType[]) : []).forEach(
      (row) => {
        if (row.assignedTo !== null && row.assignedTo !== undefined) {
          map.set(String(row.id), String(row.assignedTo));
        }
      }
    );
    return map;
  }, [rawFollowUps]);

  if (!visitor) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="flex flex-col gap-4 bg-primary px-4 pb-6 pt-5 text-white sm:px-6">
          <button
            type="button"
            onClick={back.goBack}
            className="self-start bg-transparent p-0 text-sm text-white/80 transition-colors hover:text-white"
          >
            ← Back to {back.label}
          </button>
          {loading || !error ? (
            <div className="h-[72px] w-72 animate-pulse rounded-xl bg-white/10" />
          ) : (
            <h1 className="text-2xl font-semibold leading-8">Visitor not found</h1>
          )}
        </div>
        {error && !loading && (
          <div className="bg-white px-4 py-6 sm:px-6">
            <SectionEmpty
              title="We couldn’t load this visitor"
              text="They may have been deleted, or you may not have access to them."
            />
          </div>
        )}
      </div>
    );
  }

  const visits: VisitType[] = byDateDesc(visitor.visits ?? []);
  const followUps: FollowUpType[] = byDateDesc(visitor.followUps ?? []);
  const stage = STAGE_PILL[visitorStage(visitor, followUps)];
  const canEditVisitor = access.canEdit(visitor);
  const canLogVisit = access.can("log_visit", visitor);
  const canFollowUp = access.can("record_follow_up", visitor);
  const canAssign = access.can("assign_responsible", visitor);
  const canConvert = access.canConvert && !visitor.is_member;
  const responsible = responsibleOptions(visitor);
  const firstVisit = isoDay(visitor.visitDate);
  const lastVisit = visits.length ? isoDay(visits[0].date) : firstVisit;
  const firstEvent = visits.length ? visits[visits.length - 1].eventName : visitor.eventName;
  const location = [visitor.city, visitor.state, visitor.country].filter(Boolean).join(", ");
  const meta = [
    visitor.email || "No email",
    visitor.phone ? formatPhoneNumber(visitor.country_code, visitor.phone) : "",
    location,
  ]
    .filter(Boolean)
    .join(" · ");

  const guard = async (task: () => Promise<unknown>, success: string, fallback: string) => {
    setBusy(true);
    try {
      await task();
      showNotification(success, "success");
      await refresh();
    } catch (failure) {
      showNotification(errorText(failure, fallback), "error");
    } finally {
      setBusy(false);
    }
  };

  /** The assignee id for a follow-up, from the raw rows or by matching the name. */
  const assigneeOf = (followUp: FollowUpType) =>
    assigneeById.get(String(followUp.id)) ??
    responsible.find((option) => option.label === followUp.assignedTo)?.value ??
    "";

  const draftOf = (followUp: FollowUpType) => ({
    id: followUp.id,
    date: followUp.date,
    type: followUp.type,
    status: followUp.status,
    notes: followUp.notes,
    assignedTo: assigneeOf(followUp),
  });

  const markCompleted = (followUp: FollowUpType) => {
    const assignedTo = assigneeOf(followUp);
    if (!assignedTo) {
      dialogs.recordFollowUp(visitor, { ...draftOf(followUp), status: COMPLETED_STATUS });
      return;
    }
    void guard(
      () =>
        saveFollowUp(
          visitor.id,
          {
            date: isoDay(followUp.date),
            type: followUp.type,
            assignedTo,
            notes: followUp.notes,
            status: COMPLETED_STATUS,
          },
          followUp.id
        ),
      "Follow-up completed",
      "Could not update the follow-up."
    );
  };

  const visitColumns: GridColumn<VisitType>[] = [
    {
      key: "date",
      header: "Date",
      width: "1fr",
      render: (row) => (
        <CellText main={formatDate(row.date)} sub={daysAgoLabel(row.date)} strong />
      ),
    },
    { key: "event", header: "Event", width: "1.4fr", render: (row) => <CellText main={row.eventName} /> },
    { key: "notes", header: "Notes", width: "2fr", render: (row) => <CellText main={row.notes} /> },
  ];

  const followUpColumns: GridColumn<FollowUpType>[] = [
    {
      key: "date",
      header: "Date",
      width: "1fr",
      render: (row) => <CellText main={formatDate(row.date)} strong />,
    },
    { key: "type", header: "Type", width: "1fr", render: (row) => <CellText main={followUpTypeLabel(row.type)} /> },
    { key: "assigned", header: "Assigned to", width: "1.3fr", render: (row) => <CellText main={row.assignedTo} /> },
    { key: "notes", header: "Note", width: "2fr", render: (row) => <CellText main={row.notes} /> },
    {
      key: "status",
      header: "Status",
      width: "1fr",
      render: (row) =>
        isCompletedStatus(row.status) ? (
          <Pill tone="success">Completed</Pill>
        ) : (
          <Pill tone="warning">Pending</Pill>
        ),
    },
  ];

  const isVisits = tab === "visits";
  const facts = [
    { label: "Visitor since", value: formatDate(firstVisit) },
    { label: "Last visit", value: formatDate(lastVisit) },
    { label: "First event", value: firstEvent || "—" },
    { label: "How they heard about us", value: heardLabel(visitor.howHeard) || "—" },
    {
      label: "Membership interest",
      value: visitor.is_member
        ? "Became a member"
        : visitor.membershipWish
          ? "Wants to become a member"
          : "Not asked yet",
    },
    { label: "Happy to be contacted", value: visitor.consentToContact ? "Yes" : "No" },
    ...(visitor.isClergy
      ? [
          {
            label: "Clergy",
            value:
              [visitor.churchRole, visitor.churchName, visitor.churchLocation]
                .filter(Boolean)
                .join(" · ") || "Yes",
          },
        ]
      : []),
  ];

  const bandButton =
    "min-h-10 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90";

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-4 bg-primary px-4 pt-5 text-white sm:px-6">
        <button
          type="button"
          onClick={back.goBack}
          className="self-start bg-transparent p-0 text-sm text-white/80 transition-colors hover:text-white"
        >
          ← Back to {back.label}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-lightGray/50 text-2xl font-bold outline outline-1 outline-white">
              {initialsOf([visitor.firstName, visitor.lastName].filter(Boolean).join(" "))}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold leading-8">{visitorName(visitor)}</h1>
                <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
                  {stage.label}
                </span>
              </div>
              <p className="text-sm text-white/85">{meta}</p>
            </div>
          </div>
          {(canEditVisitor || canLogVisit || canConvert || access.canDelete) && (
            <div className="flex flex-wrap gap-2">
              {canEditVisitor && (
                <button
                  type="button"
                  onClick={() => dialogs.edit(visitor)}
                  className={`${bandButton} border-white/40 bg-transparent text-white`}
                >
                  Edit visitor
                </button>
              )}
              {canLogVisit && (
                <button
                  type="button"
                  onClick={() => dialogs.recordVisit(visitor)}
                  className={`${bandButton} border-white/40 bg-transparent text-white`}
                >
                  Record visit
                </button>
              )}
              {canConvert && (
                <button
                  type="button"
                  onClick={() => dialogs.convert(visitor)}
                  className={`${bandButton} border-white bg-white text-primary`}
                >
                  Convert to member
                </button>
              )}
              {access.canDelete && (
                <button
                  type="button"
                  onClick={() => dialogs.remove(visitor)}
                  className={`${bandButton} border-white/40 bg-transparent text-white`}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
        <BandTabs
          ariaLabel="Visitor sections"
          tabs={[
            { key: "visits" as Tab, label: `Visits (${visits.length})` },
            { key: "follow" as Tab, label: `Follow-ups (${followUps.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="grid flex-1 items-start gap-4 bg-white px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionHeading
            title={isVisits ? "Visit history" : "Follow-ups"}
            description={
              isVisits
                ? `Every time ${visitor.firstName} has been with us.`
                : "Contact made by the responsible persons."
            }
          >
            {(isVisits ? canLogVisit : canFollowUp) && (
              <UiButton
                onClick={() =>
                  isVisits ? dialogs.recordVisit(visitor) : dialogs.recordFollowUp(visitor)
                }
              >
                {isVisits ? "Record visit" : "Record follow-up"}
              </UiButton>
            )}
          </SectionHeading>

          {isVisits ? (
            visits.length ? (
              <GridTable
                columns={visitColumns}
                rows={visits}
                getRowId={(row) => String(row.id)}
                minWidth="640px"
                actionsWidth="120px"
                renderActions={
                  access.canDelete && visits.length > 1
                    ? (row) => (
                        <UiButton
                          tone="danger"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void guard(
                              () => removeVisit(row.id),
                              "Visit removed",
                              "Could not remove the visit."
                            )
                          }
                        >
                          Remove
                        </UiButton>
                      )
                    : undefined
                }
              />
            ) : (
              <SectionEmpty title="No visits" text="Record a visit to start the history." />
            )
          ) : followUps.length ? (
            <GridTable
              columns={followUpColumns}
              rows={followUps}
              getRowId={(row) => String(row.id)}
              actionsWidth="200px"
              renderActions={
                canFollowUp
                  ? (row) => (
                      <>
                        {!isCompletedStatus(row.status) && (
                          <UiButton
                            tone="primary"
                            size="sm"
                            disabled={busy}
                            onClick={() => markCompleted(row)}
                          >
                            Mark completed
                          </UiButton>
                        )}
                        <UiButton
                          size="sm"
                          disabled={busy}
                          onClick={() => dialogs.recordFollowUp(visitor, draftOf(row))}
                        >
                          Edit
                        </UiButton>
                      </>
                    )
                  : undefined
              }
            />
          ) : (
            <SectionEmpty
              title="No follow-ups yet"
              text={
                responsible.length
                  ? "Record the first follow-up after contacting them."
                  : "Assign a responsible person, then record follow-ups."
              }
            />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-6 shadow-[0_8px_24px_rgb(var(--color-shadow)_/_0.08)]">
            <h2 className="text-base font-semibold text-primary">Visitor details</h2>
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">{fact.label}</span>
                <span className="break-words text-sm font-medium text-primary">{fact.value}</span>
              </div>
            ))}
          </section>
          <section className="flex flex-col gap-3 rounded-xl border border-lightGray bg-white p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-primary">Responsible persons</h2>
              {canAssign && (
                <button
                  type="button"
                  onClick={() => dialogs.assign(visitor)}
                  className="bg-transparent p-0 text-sm font-medium text-primary underline"
                >
                  Assign
                </button>
              )}
            </div>
            {responsible.map((person) => (
              <div key={person.value} className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-lightGray text-xs font-semibold text-primary/70">
                  {initialsOf(person.label)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">{person.label}</p>
                  <p className="text-xs text-gray-500">Responsible person</p>
                </div>
                {canAssign && (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Remove ${person.label}`}
                    onClick={() =>
                      void guard(
                        () =>
                          setResponsibleMembers(
                            visitor,
                            responsibleMemberIds(visitor).filter(
                              (id) => String(id) !== person.value
                            )
                          ),
                        `${person.label} removed`,
                        "Could not remove the responsible person."
                      )
                    }
                    className="bg-transparent p-0 text-sm text-red-700 disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {responsible.length === 0 && (
              <p className="text-sm text-amber-700">
                Not assigned. Assign someone before recording follow-ups.
              </p>
            )}
          </section>
        </aside>
      </div>
      {dialogs.dialogs}
    </div>
  );
};

export default VisitorDetails;
