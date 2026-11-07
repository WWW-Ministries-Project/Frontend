import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import {
  COHORT_STATUS,
  COHORT_STATUS_VALUES,
  type CohortStatus,
  type LearningUnit,
  type SomCohort,
  type Topic,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProgramAssessments } from "./assessment/ProgramAssessments";
import { ProgramInstructorsPanel } from "./people/ProgramInstructorsPanel";
import { ProgramCertificates } from "./assessment/ProgramCertificates";
import { GradingModelPanel } from "./curriculum/GradingModelPanel";
import { ModuleBoard } from "./curriculum/ModuleBoard";
import { ProgramSetupChecklist } from "./ProgramSetupChecklist";
import { useSomData } from "./somDataContext";
import {
  audienceLabel,
  fmtDate,
  formatLabel,
  isAssessmentUnit,
  personName,
  somPaths,
  suggestClassName,
  suggestFirstCohort,
} from "./somUtils";
import {
  Btn,
  EmptyBlock,
  KebabMenu,
  LoadError,
  type MenuAction,
  Panel,
  Pill,
  SimpleTable,
  StatusPill,
  WorkspaceHeader,
} from "./ui";
import { useCohortEditors } from "./useCohortEditors";
import { useProgramEditor } from "./useProgramEditor";
import { useSomAccess } from "../utils/useSomAccess";

const TABS = [
  "Overview",
  "Curriculum",
  "Assessments",
  "Grading & completion",
  "Cohorts",
  "Instructors",
  "Certificate",
] as const;
type Tab = (typeof TABS)[number];

const unitOf = (topic: Topic): LearningUnit | undefined => topic.LearningUnit ?? topic.learningUnit;

export const ProgramWorkspace = () => {
  const { id } = useParams();
  const programId = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const access = useSomAccess();
  const canDesign = access.can("design_curriculum");
  const canManageCohorts = access.can("manage_cohorts");
  const som = useSomData();
  const { data, loading, refetch } = useFetch(api.fetch.fetchProgramById, { id: String(id) });

  const detail = data?.data;
  const full = som.programs.find((p) => p.id === programId);
  const cohortRows = som.cohorts.filter((c) => c.program.id === programId);

  // Program cohorts are grouped by lifecycle (prototype: Upcoming / Ongoing / Completed).
  const [cohortTab, setCohortTab] = useState<CohortStatus>(COHORT_STATUS.ONGOING);
  const cohortCounts = useMemo(() => {
    const counts: Record<CohortStatus, number> = { Upcoming: 0, Ongoing: 0, Completed: 0 };
    cohortRows.forEach((c) => {
      counts[c.timing.status] += 1;
    });
    return counts;
  }, [cohortRows]);
  const shownCohorts = cohortRows.filter((c) => c.timing.status === cohortTab);

  const refreshAll = () => {
    refetch();
    som.refetch();
  };

  const programEditor = useProgramEditor({
    allPrograms: som.programs,
    onSaved: refreshAll,
    onDeleted: () => {
      som.refetch();
      navigate(somPaths.programs);
    },
  });
  const cohortEditors = useCohortEditors({ onChanged: refreshAll });

  // Guided setup for a freshly created program (opened with ?setup=1).
  const inSetup = params.get("setup") === "1";
  const [setupCollapsed, setSetupCollapsed] = useState(false);

  const tabParam = params.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "Overview";
  const setTab = (t: string) => {
    params.set("tab", t);
    setParams(params, { replace: true });
  };

  const topics = useMemo(
    () =>
      [...(detail?.topics ?? [])].sort(
        (a, b) =>
          Number((a as { order_number?: number }).order_number ?? a.order ?? 0) -
          Number((b as { order_number?: number }).order_number ?? b.order ?? 0)
      ),
    [detail]
  );
  const assessments = topics.filter((t) => isAssessmentUnit(unitOf(t)?.type));

  if (!detail && loading) return <SkeletonLoader />;
  if (!detail) {
    return (
      <div className="app-page-padding">
        <EmptyBlock msg="Program not found." action={<Btn to={somPaths.programs}>Back to programs</Btn>} />
      </div>
    );
  }

  const summary = full?.enrollment_summary;
  const title = detail.title;

  // Setup checklist state, ticked off from the program's real data.
  const moduleCount = full?.program_details?.module_count ?? 0;
  const unitCount = topics.length;
  const classCount = cohortRows.reduce((n, c) => n + c.courses.length, 0);
  const firstCohort = cohortRows[0];
  const isDraft = full?.program_details?.status === "DRAFT";

  const startFirstCohort = () =>
    cohortEditors.newCohort(programId, {
      prefill: {
        ...suggestFirstCohort(title, cohortRows.length),
        description: "",
        status: COHORT_STATUS.UPCOMING,
        branch_id: "",
      },
      chainClass: true,
      classPrefill: {
        name: suggestClassName(0),
        capacity: 20,
        schedule: "Saturdays 09:00",
        classFormat: "In_Person",
      },
    });

  const addFirstClass = () => {
    if (!firstCohort) return;
    cohortEditors.newClass(firstCohort.id, {
      name: suggestClassName(firstCohort.courses.length),
      capacity: 20,
      schedule: "Saturdays 09:00",
      classFormat: "In_Person",
    });
  };

  const finishSetup = () => {
    params.delete("setup");
    setParams(params, { replace: true });
  };

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        crumbs={[{ label: "Programs", to: somPaths.programs }, { label: title }]}
        title={title}
        status={
          full?.program_details?.status === "PUBLISHED"
            ? "Published"
            : full?.program_details?.status === "DRAFT"
              ? "Draft"
              : undefined
        }
        meta={[
          `${topics.length} units`,
          `${assessments.length} assessed`,
          `${cohortRows.length} cohort${cohortRows.length === 1 ? "" : "s"}`,
          `${summary?.total_enrolled_members ?? 0} learners`,
        ]}
        actions={
          <>
            <Btn variant="onDark" to={somPaths.publicProgram(title)}>
              Public page
            </Btn>
            {canDesign && (
              <Btn variant="onDark" onClick={() => full && programEditor.openEdit(full)}>
                Edit
              </Btn>
            )}
            {canDesign && full?.program_details?.status === "DRAFT" && (
              <Btn variant="onDarkSolid" onClick={() => full && programEditor.publish(full)}>
                Publish
              </Btn>
            )}
            {canManageCohorts && (
              <Btn variant="onDarkSolid" onClick={() => cohortEditors.newCohort(programId)}>
                + New cohort
              </Btn>
            )}
          </>
        }
        tabs={[...TABS]}
        activeTab={tab}
        onTab={setTab}
      />

      {inSetup && (canDesign || canManageCohorts) && (
        <ProgramSetupChecklist
          moduleCount={moduleCount}
          unitCount={unitCount}
          cohortCount={cohortRows.length}
          classCount={classCount}
          collapsed={setupCollapsed}
          canDesign={canDesign}
          canManageCohorts={canManageCohorts}
          isDraft={isDraft}
          onToggleCollapsed={() => setSetupCollapsed((v) => !v)}
          onGoCurriculum={() => setTab("Curriculum")}
          onGoCohorts={() => setTab("Cohorts")}
          onCreateCohort={startFirstCohort}
          onAddClass={addFirstClass}
          onPublish={() => full && programEditor.publish(full)}
          onOpenCohort={() => firstCohort && navigate(somPaths.cohort(firstCohort.id))}
          onFinish={finishSetup}
        />
      )}

      <div className="app-page-padding flex flex-col gap-4">
        {som.error && <LoadError msg={som.error} onRetry={som.refetch} />}
        {tab === "Overview" && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
            <Panel
              title="About this program"
              action={canDesign && full && <Btn size="sm" onClick={() => programEditor.openEdit(full)}>Edit</Btn>}
              bodyClassName="flex flex-col gap-4 p-4 text-sm"
            >
              <Field label="Title">{title}</Field>
              <Field label="Description">
                <span className="whitespace-pre-line">{detail.description || "—"}</span>
              </Field>
              <Field label="Created">{fmtDate(detail.createdAt)}</Field>
            </Panel>

            <Panel title="Enrollment & eligibility" bodyClassName="flex flex-col gap-3 p-4 text-sm">
              <p className="text-primaryGray">
                Members who meet these rules can apply through the member portal and pick a class with space.
              </p>
              <dl className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
                <Row label="Open to">{audienceLabel(detail)}</Row>
                <Row label="Prerequisites">
                  {full?.prerequisitePrograms.length
                    ? full.prerequisitePrograms.map((p) => p.prerequisite.title).join(", ")
                    : "None"}
                </Row>
                <Row label="Enrolled">{summary?.total_enrolled_members ?? 0}</Row>
                <Row label="In progress">{summary?.in_progress_members ?? 0}</Row>
                <Row label="Completed">{summary?.completed_members ?? 0}</Row>
                <Row label="Not started">{summary?.not_started_members ?? 0}</Row>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Btn size="sm" to={`${somPaths.learners}?program=${programId}`}>View learners</Btn>
                <Btn size="sm" onClick={() => setTab("Cohorts")}>Manage cohorts</Btn>
              </div>
            </Panel>
          </div>
        )}

        {tab === "Curriculum" && (
          <ModuleBoard
            programId={programId}
            detailTopics={topics}
            canManage={canDesign}
            onChanged={refreshAll}
          />
        )}

        {tab === "Grading & completion" && (
          <GradingModelPanel programId={programId} canManage={canDesign} />
        )}

        {tab === "Assessments" && (
          <ProgramAssessments
            programId={programId}
            topics={topics}
            canManage={canDesign}
            onChanged={refreshAll}
          />
        )}

        {tab === "Cohorts" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-primary">Cohorts of this program</h3>
              {canManageCohorts && (
                <Btn variant="primary" size="sm" onClick={() => cohortEditors.newCohort(programId)}>
                  + New cohort
                </Btn>
              )}
            </div>
            <div role="tablist" aria-label="Cohort status" className="flex gap-1 overflow-x-auto border-b border-gray-200">
              {COHORT_STATUS_VALUES.map((s) => {
                const selected = cohortTab === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setCohortTab(s)}
                    className={cn(
                      "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm",
                      selected ? "border-primary font-semibold text-primary" : "border-transparent text-primaryGray hover:text-primary"
                    )}
                  >
                    {s}
                    <span
                      className={cn(
                        "min-w-[20px] rounded-full px-1.5 text-xs font-semibold",
                        selected ? "bg-primary text-white" : "bg-gray-100 text-primaryGray"
                      )}
                    >
                      {cohortCounts[s]}
                    </span>
                  </button>
                );
              })}
            </div>
            {cohortRows.length === 0 ? (
              <EmptyBlock msg="No cohorts yet. Create the first intake for this program." />
            ) : (
              shownCohorts.length === 0 && (
                <EmptyBlock msg={`No ${cohortTab.toLowerCase()} cohorts.`} />
              )
            )}
            {shownCohorts.map((c) => (
              <CohortCard
                key={c.id}
                cohort={c}
                label={c.timing.label}
                learners={c.learnerCount}
                canManage={canManageCohorts}
                canDelete={access.canDelete}
                onOpen={() => navigate(somPaths.cohort(c.id))}
                onEdit={() => cohortEditors.editCohort(c)}
                onDelete={() => cohortEditors.deleteCohort(c)}
                onAddClass={() => cohortEditors.newClass(c.id)}
                onOpenClass={(classId) => navigate(somPaths.class(c.id, classId))}
              />
            ))}
          </div>
        )}

        {tab === "Instructors" && (
          <ProgramInstructorsPanel
            programId={programId}
            canManage={access.can("manage_instructors")}
            canView={access.viewsAll || access.instructor}
          />
        )}

        {tab === "Certificate" && (
          <ProgramCertificates programId={programId} canIssue={access.can("issue_certificates")} />
        )}
      </div>

      {programEditor.modal}
      {cohortEditors.modals}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-xs font-medium uppercase tracking-wide text-mainGray">{label}</p>
    <p className="text-primary">{children}</p>
  </div>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 px-3 py-2">
    <dt className="text-primaryGray">{label}</dt>
    <dd className="text-right font-medium text-primary">{children}</dd>
  </div>
);

export const CohortCard = ({
  cohort,
  label,
  learners,
  canManage,
  canDelete = canManage,
  onOpen,
  onEdit,
  onDelete,
  onAddClass,
  onOpenClass,
}: {
  cohort: SomCohort;
  label: string;
  learners: number;
  canManage: boolean;
  /** Deleting needs Full on School of Ministry. */
  canDelete?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddClass: () => void;
  onOpenClass: (classId: number) => void;
}) => (
  <Panel
    title={
      <span className="flex flex-wrap items-center gap-2">
        {cohort.name}
        <StatusPill status={cohort.status} />
        <span className="text-xs font-normal text-mainGray">
          {label} · {learners} learners
        </span>
      </span>
    }
    action={
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {canManage && <Btn size="sm" onClick={onAddClass}>+ Class</Btn>}
        <Btn size="sm" variant="primary" onClick={onOpen}>Open cohort</Btn>
        {(canManage || canDelete) && (
          <KebabMenu
            label="Cohort actions"
            actions={[
              ...(canManage ? [{ label: "Edit", onClick: onEdit }] : []),
              ...(canDelete ? [{ label: "Delete", onClick: onDelete, danger: true }] : []),
            ] as MenuAction[]}
          />
        )}
      </div>
    }
  >
    {cohort.courses.length === 0 ? (
      <p className="px-4 py-4 text-sm text-primaryGray">No classes yet. Add one to start enrolling learners.</p>
    ) : (
      <SimpleTable
        rows={cohort.courses}
        rowKey={(k) => k.id}
        onRowClick={(k) => onOpenClass(k.id)}
        minWidth={560}
        columns={[
          { key: "n", header: "Class", render: (k) => <span className="font-medium">{k.name}</span> },
          { key: "f", header: "Delivery", render: (k) => <Pill tone={k.classFormat === "Online" ? "cyan" : k.classFormat === "Hybrid" ? "fuchsia" : "indigo"}>{formatLabel(k.classFormat)}</Pill> },
          { key: "who", header: "Instructor", render: (k) => <span className={k.instructor ? "" : "text-amber-700"}>{personName(k.instructor)}</span> },
          { key: "sch", header: "Schedule", render: (k) => <span className="text-primaryGray">{k.schedule || "—"}</span> },
          { key: "en", header: "Enrolled", className: "text-right", render: (k) => `${k.enrollments?.length ?? k.enrolled} / ${k.capacity}` },
          { key: "go", header: "", className: "text-right text-mainGray", render: () => "View ›" },
        ]}
      />
    )}
  </Panel>
);

export default ProgramWorkspace;
