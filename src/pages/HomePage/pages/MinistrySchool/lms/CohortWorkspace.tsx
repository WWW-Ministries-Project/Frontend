import { Modal } from "@/components/Modal";
import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { CohortAssignment } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createLmsActionTracker } from "../utils/lmsGuardrails";
import { CohortSchedule } from "./CohortSchedule";
import { useSomData, type EnrollmentRow } from "./somDataContext";
import {
  ATTENTION_RULE,
  fmtDate,
  formatLabel,
  needsAttention,
  personName,
  somPaths,
  unitLabel,
} from "./somUtils";
import {
  Avatar,
  Btn,
  EmptyBlock,
  LoadError,
  Panel,
  Pill,
  ProgressBar,
  SimpleTable,
  StatusPill,
  WorkspaceHeader,
} from "./ui";
import { useCohortEditors } from "./useCohortEditors";

const TABS = ["Classes", "Roster", "Assessments", "Schedule"] as const;
type Tab = (typeof TABS)[number];
const ROSTER_FILTERS = ["All learners", "Needs attention", "Completed"] as const;

export const CohortWorkspace = () => {
  const { id } = useParams();
  const cohortId = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canManageCurrentRoute } = useRouteAccess();
  const som = useSomData();
  const editors = useCohortEditors({ onChanged: som.refetch });

  const cohort = som.cohorts.find((c) => c.id === cohortId);
  const roster = useMemo(
    () => som.enrollments.filter((e) => e.cohort.id === cohortId),
    [som.enrollments, cohortId]
  );

  const tabParam = params.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "Classes";
  const setTab = (t: string) => {
    params.set("tab", t);
    setParams(params, { replace: true });
  };

  if (!cohort) {
    if (som.loading) return <SkeletonLoader />;
    return (
      <div className="app-page-padding">
        {som.error ? (
          <LoadError msg={som.error} onRetry={som.refetch} />
        ) : (
          <EmptyBlock msg="Cohort not found." action={<Btn to={somPaths.cohorts}>Back to cohorts</Btn>} />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        crumbs={[
          { label: "Cohorts", to: somPaths.cohorts },
          { label: cohort.program.title, to: somPaths.program(cohort.program.id, "Cohorts") },
          { label: cohort.name },
        ]}
        title={cohort.name}
        status={cohort.timing.status}
        meta={[
          cohort.timing.label,
          `${cohort.learnerCount} learners`,
          `${cohort.courses.length} class${cohort.courses.length === 1 ? "" : "es"}`,
          `${cohort.attentionCount} need attention`,
          `Applications close ${fmtDate(cohort.applicationDeadline)}`,
        ]}
        actions={
          canManageCurrentRoute && (
            <>
              <Btn variant="onDark" onClick={() => editors.editCohort(cohort)}>
                Edit cohort
              </Btn>
              <Btn variant="onDarkSolid" onClick={() => editors.newClass(cohort.id)}>
                + Add class
              </Btn>
            </>
          )
        }
        tabs={[...TABS]}
        activeTab={tab}
        onTab={setTab}
      />

      <div className="app-page-padding flex flex-col gap-4">
        {tab === "Classes" && (
          <Panel>
            <SimpleTable
              rows={cohort.courses}
              rowKey={(k) => k.id}
              onRowClick={(k) => navigate(somPaths.class(cohort.id, k.id))}
              minWidth={760}
              empty={
                <EmptyBlock
                  msg="No classes yet. Add a class for each delivery mode (in person, online, hybrid)."
                  action={
                    canManageCurrentRoute && (
                      <Btn variant="primary" size="sm" onClick={() => editors.newClass(cohort.id)}>
                        + Add class
                      </Btn>
                    )
                  }
                />
              }
              columns={[
                { key: "n", header: "Class", render: (k) => <span className="font-semibold">{k.name}</span> },
                {
                  key: "f",
                  header: "Delivery",
                  render: (k) => <StatusPill status={k.classFormat ?? ""} label={formatLabel(k.classFormat)} />,
                },
                {
                  key: "who",
                  header: "Instructor",
                  render: (k) => (
                    <span className={k.instructor ? "" : "font-medium text-amber-700"}>{personName(k.instructor)}</span>
                  ),
                },
                { key: "sch", header: "Schedule", render: (k) => <span className="text-primaryGray">{k.schedule || "—"}</span> },
                {
                  key: "en",
                  header: "Seats",
                  render: (k) => (
                    <div className="flex w-28 flex-col gap-1">
                      <span className="text-xs text-primaryGray">
                        {k.enrollments.length} / {k.capacity}
                      </span>
                      <ProgressBar value={k.capacity ? (k.enrollments.length / k.capacity) * 100 : 0} />
                    </div>
                  ),
                },
                {
                  key: "risk",
                  header: "Attention",
                  className: "text-right",
                  render: (k) => {
                    const n = roster.filter((e) => e.cls.id === k.id && needsAttention(e.health)).length;
                    return n ? <span className="font-semibold text-red-700">{n}</span> : <span className="text-mainGray">0</span>;
                  },
                },
                {
                  key: "act",
                  header: <span className="sr-only">Actions</span>,
                  className: "text-right",
                  render: (k) => (
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {canManageCurrentRoute && (
                        <>
                          <Btn size="sm" onClick={() => editors.editClass(k)}>Edit</Btn>
                          <Btn size="sm" className="text-red-700" onClick={() => editors.deleteClass(k)}>
                            Delete
                          </Btn>
                        </>
                      )}
                      <Btn size="sm" variant="primary" onClick={() => navigate(somPaths.class(cohort.id, k.id))}>
                        Open
                      </Btn>
                    </div>
                  ),
                },
              ]}
            />
          </Panel>
        )}

        {tab === "Roster" && <CohortRoster roster={roster} />}

        {tab === "Schedule" && (
          <CohortSchedule
            cohortId={cohort.id}
            programId={cohort.program.id}
            roster={roster}
            canManage={canManageCurrentRoute}
          />
        )}

        {tab === "Assessments" && (
          <CohortAssessments
            cohortId={cohort.id}
            programId={cohort.program.id}
            canManage={canManageCurrentRoute}
          />
        )}
      </div>
      {editors.modals}
    </div>
  );
};

const CohortRoster = ({ roster }: { roster: EnrollmentRow[] }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof ROSTER_FILTERS)[number]>("All learners");
  const rows = roster
    .filter((e) =>
      filter === "Needs attention"
        ? needsAttention(e.health)
        : filter === "Completed"
          ? e.completion_status === "COMPLETED"
          : true
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ROSTER_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filter === f ? "border-primary bg-primary text-white" : "border-gray-200 text-primaryGray hover:bg-gray-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="text-xs text-mainGray">Enroll or unenroll learners from a class.</p>
      </div>
      <Panel>
        <SimpleTable<EnrollmentRow>
          rows={rows}
          rowKey={(e) => e.id}
          onRowClick={(e) => navigate(somPaths.student(e.cohort.id, e.cls.id, e.id))}
          minWidth={720}
          empty={<EmptyBlock msg="No learners match this filter." />}
          columns={[
            {
              key: "n",
              header: "Learner",
              render: (e) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={e.name} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.name}</p>
                    {e.user?.email && <p className="truncate text-xs text-mainGray">{e.user.email}</p>}
                  </div>
                </div>
              ),
            },
            { key: "c", header: "Class", render: (e) => <span className="text-primaryGray">{e.cls.name}</span> },
            {
              key: "p",
              header: "Progress",
              render: (e) => (
                <div className="flex w-36 items-center gap-2">
                  <ProgressBar value={e.completion_percent} />
                  <span className="w-12 text-right text-xs tabular-nums text-primaryGray">
                    {e.completed_topics}/{e.total_topics}
                  </span>
                </div>
              ),
            },
            { key: "d", header: "Enrolled", render: (e) => <span className="text-primaryGray">{fmtDate(e.enrolledAt)}</span> },
            { key: "s", header: "Status", render: (e) => <StatusPill status={e.health} /> },
          ]}
        />
        <p className="border-t border-gray-100 px-4 py-2 text-xs text-mainGray">{ATTENTION_RULE}</p>
      </Panel>
    </div>
  );
};

const CohortAssessments = ({
  cohortId,
  programId,
  canManage,
}: {
  cohortId: number;
  programId: number;
  canManage: boolean;
}) => {
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(api.fetch.fetchCohortAssignments, {
    cohortId: String(cohortId),
  });
  const [opening, setOpening] = useState<CohortAssignment | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () => [...(data?.data ?? [])].sort((a, b) => a.topic.order - b.topic.order),
    [data]
  );

  const toggle = async (row: CohortAssignment, action: "activate" | "deactivate", due?: string) => {
    const tracker = createLmsActionTracker(`admin.cohort.assignment.${action}`, {
      cohortId: String(cohortId),
      topicId: String(row.topic.id),
    });
    setBusy(true);
    try {
      const payload = {
        cohortId: String(cohortId),
        topicId: String(row.topic.id),
        ...(action === "activate" && due ? { dueDate: new Date(due).toISOString() } : {}),
      };
      if (action === "activate") await api.put.activateCohortAssignment(payload);
      else await api.put.deactivateCohortAssignment(payload);
      tracker.success();
      showNotification(action === "activate" ? "Assessment opened" : "Assessment closed", "success");
      setOpening(null);
      refetch();
    } catch (error) {
      tracker.failure({ error });
      showNotification(`Could not ${action === "activate" ? "open" : "close"} the assessment`, "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !rows.length) return <SkeletonLoader />;

  return (
    <>
      <Panel
        title="Assessments for this cohort"
        action={<span className="text-xs text-mainGray">Open an assessment to let learners submit</span>}
      >
        <SimpleTable<CohortAssignment>
          rows={rows}
          rowKey={(r) => r.learningUnitId}
          minWidth={760}
          empty={
            <EmptyBlock
              msg="This program has no quizzes or essays yet."
              action={<Btn size="sm" to={somPaths.program(programId, "Curriculum")}>Open curriculum</Btn>}
            />
          }
          columns={[
            { key: "n", header: "Assessment", render: (r) => <span className="font-medium">{r.topic.name}</span> },
            { key: "t", header: "Type", render: (r) => <StatusPill status={unitLabel(r.type)} /> },
            {
              key: "s",
              header: "Status",
              render: (r) =>
                r.activation.isActive ? <Pill tone="green">Open</Pill> : r.activation.closedAt ? <Pill tone="blue">Closed</Pill> : <Pill>Not opened</Pill>,
            },
            { key: "d", header: "Due", render: (r) => <span className="text-primaryGray">{fmtDate(r.activation.dueDate)}</span> },
            { key: "sub", header: "Submitted", className: "text-right", render: (r) => r.activation.submissions ?? 0 },
            {
              key: "p",
              header: "To grade",
              className: "text-right",
              render: (r) =>
                (r.activation.pending ?? 0) > 0 ? (
                  <Pill tone="amber">{r.activation.pending}</Pill>
                ) : (
                  <span className="text-mainGray">0</span>
                ),
            },
            {
              key: "a",
              header: <span className="sr-only">Actions</span>,
              className: "text-right",
              render: (r) => (
                <div className="flex justify-end gap-1">
                  {canManage &&
                    (r.activation.isActive ? (
                      <Btn size="sm" disabled={busy} onClick={() => toggle(r, "deactivate")}>Close</Btn>
                    ) : (
                      <Btn
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setDueDate(r.activation.dueDate ? r.activation.dueDate.slice(0, 10) : "");
                          setOpening(r);
                        }}
                      >
                        Open
                      </Btn>
                    ))}
                  <Btn
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(somPaths.grading(programId, cohortId, r.topic.id))}
                  >
                    Grade
                  </Btn>
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Modal open={Boolean(opening)} onClose={() => setOpening(null)} className="!max-w-md" title="Open assessment">
        {opening && (
          <div className="flex flex-col gap-4 p-5">
            <div>
              <h3 className="text-lg font-semibold text-primary">Open “{opening.topic.name}”</h3>
              <p className="text-sm text-primaryGray">Learners in this cohort can submit until the due date.</p>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Due date (optional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-lg border border-lightGray bg-inputBackground px-3"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setOpening(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={busy} onClick={() => toggle(opening, "activate", dueDate)}>
                Open assessment
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CohortWorkspace;
