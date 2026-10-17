import { useRouteAccess } from "@/context/RouteAccessContext";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import type { LearningUnit, SomCohort, Topic } from "@/utils/api/ministrySchool/interfaces";
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AllTopics from "../Components/AllTopics";
import CertificateLogos from "../Components/CertificateLogos";
import { useSomData } from "./somDataContext";
import {
  audienceLabel,
  fmtDate,
  formatLabel,
  isAssessmentUnit,
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
  SimpleTable,
  StatusPill,
  WorkspaceHeader,
} from "./ui";
import { useCohortEditors } from "./useCohortEditors";
import { useProgramEditor } from "./useProgramEditor";

const TABS = ["Overview", "Curriculum", "Assessments", "Cohorts", "Instructors", "Certificate"] as const;
type Tab = (typeof TABS)[number];

const unitOf = (topic: Topic): LearningUnit | undefined => topic.LearningUnit ?? topic.learningUnit;

export const ProgramWorkspace = () => {
  const { id } = useParams();
  const programId = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canManageCurrentRoute } = useRouteAccess();
  const som = useSomData();
  const { data, loading, refetch } = useFetch(api.fetch.fetchProgramById, { id: String(id) });

  const detail = data?.data;
  const full = som.programs.find((p) => p.id === programId);
  const cohortRows = som.cohorts.filter((c) => c.program.id === programId);

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

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        crumbs={[{ label: "Programs", to: somPaths.programs }, { label: title }]}
        title={title}
        meta={[
          `${topics.length} units`,
          `${assessments.length} assessed`,
          `${cohortRows.length} cohort${cohortRows.length === 1 ? "" : "s"}`,
          `${summary?.total_enrolled_members ?? 0} learners`,
        ]}
        actions={
          canManageCurrentRoute && (
            <>
              <Btn variant="onDark" onClick={() => full && programEditor.openEdit(full)}>
                Edit
              </Btn>
              <Btn variant="onDarkSolid" onClick={() => cohortEditors.newCohort(programId)}>
                + New cohort
              </Btn>
            </>
          )
        }
        tabs={[...TABS]}
        activeTab={tab}
        onTab={setTab}
      />

      <div className="app-page-padding flex flex-col gap-4">
        {som.error && <LoadError msg={som.error} onRetry={som.refetch} />}
        {tab === "Overview" && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
            <Panel
              title="About this program"
              action={canManageCurrentRoute && full && <Btn size="sm" onClick={() => programEditor.openEdit(full)}>Edit</Btn>}
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
          <div className="grid gap-4 laptop:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <AllTopics topics={topics} programId={programId} refetchProgram={refreshAll} />
            </div>
            <aside className="flex h-fit flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
              <h3 className="font-semibold text-primary">At a glance</h3>
              <ul className="flex flex-col gap-1.5 text-primaryGray">
                {Object.entries(
                  topics.reduce<Record<string, number>>((acc, t) => {
                    const label = unitLabel(unitOf(t)?.type);
                    acc[label] = (acc[label] ?? 0) + 1;
                    return acc;
                  }, {})
                ).map(([label, n]) => (
                  <li key={label} className="flex items-center justify-between">
                    <StatusPill status={label} />
                    <span className="tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-mainGray">
                Learners complete the program when every unit is passed. Changes apply to all live and future cohorts.
              </p>
            </aside>
          </div>
        )}

        {tab === "Assessments" && (
          <Panel
            title="Assessments in this program"
            action={<Btn size="sm" onClick={() => setTab("Curriculum")}>Edit in curriculum</Btn>}
          >
            <SimpleTable<Topic>
              rows={assessments}
              rowKey={(t) => t.id}
              minWidth={620}
              empty={
                <EmptyBlock
                  msg="No quizzes or essays yet. Add a Quiz or Essay unit in the curriculum."
                  action={<Btn size="sm" onClick={() => setTab("Curriculum")}>Open curriculum</Btn>}
                />
              }
              columns={[
                { key: "name", header: "Assessment", render: (t) => <span className="font-medium">{t.name}</span> },
                { key: "type", header: "Type", render: (t) => <StatusPill status={unitLabel(unitOf(t)?.type)} /> },
                {
                  key: "qs",
                  header: "Questions",
                  render: (t) => {
                    const unit = unitOf(t);
                    return unit?.type === "assignment" ? unit.data.questions?.length ?? 0 : 1;
                  },
                },
                {
                  key: "pass",
                  header: "Pass mark",
                  render: (t) => {
                    const unit = unitOf(t);
                    const pass = unit && "passMark" in (unit.data ?? {}) ? (unit.data as { passMark?: number }).passMark : undefined;
                    return pass !== undefined ? `${pass}%` : "—";
                  },
                },
                {
                  key: "attempts",
                  header: "Attempts",
                  render: (t) => {
                    const d = (unitOf(t)?.data ?? {}) as { maxAttempts?: number; maxAttempt?: number };
                    return d.maxAttempts ?? d.maxAttempt ?? "—";
                  },
                },
              ]}
            />
            <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-mainGray">
              Each cohort opens assessments and sets its own due dates under Cohorts → Assessments.
            </p>
          </Panel>
        )}

        {tab === "Cohorts" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-primary">Cohorts of this program</h3>
              {canManageCurrentRoute && (
                <Btn variant="primary" size="sm" onClick={() => cohortEditors.newCohort(programId)}>
                  + New cohort
                </Btn>
              )}
            </div>
            {cohortRows.length === 0 && (
              <EmptyBlock msg="No cohorts yet. Create the first intake for this program." />
            )}
            {cohortRows.map((c) => (
              <CohortCard
                key={c.id}
                cohort={c}
                label={c.timing.label}
                learners={c.learnerCount}
                canManage={canManageCurrentRoute}
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
          <Panel title="Instructors teaching this program">
            {(full?.instructors ?? []).length === 0 ? (
              <EmptyBlock msg="No instructors yet. Assign one when you create or edit a class." />
            ) : (
              <ul>
                {full!.instructors.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0">
                    <Avatar name={personName(i)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary">{personName(i)}</p>
                      <p className="text-xs text-mainGray">
                        {i.courses.map((c) => `${c.cohort_name} · ${c.name}`).join("  ·  ")}
                      </p>
                    </div>
                    {i.email && <span className="text-xs text-mainGray">{i.email}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {tab === "Certificate" && (
          <div className="grid gap-4 laptop:grid-cols-[minmax(0,1fr)_320px]">
            <Panel title="Certificate template" bodyClassName="p-6">
              <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-lg border-2 border-double border-secondary/60 px-6 py-10 text-center">
                <CertificateLogos compact />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Certificate of completion</p>
                <p className="font-great-vibes text-3xl text-primary">{"{Learner name}"}</p>
                <p className="text-sm text-primaryGray">
                  has completed <b className="text-primary">{title}</b>
                </p>
                <p className="text-xs text-mainGray">{"{Completion date} · {Certificate no.}"} · QR verification</p>
              </div>
            </Panel>
            <Panel title="How certificates are issued" bodyClassName="flex flex-col gap-2 p-4 text-sm text-primaryGray">
              <p>A certificate is generated when a learner passes every unit in the program.</p>
              <p>Learners download it from <b>My learning</b>; anyone can verify it from the QR code.</p>
              <p>
                {summary?.completed_members ?? 0} learner{summary?.completed_members === 1 ? "" : "s"} have completed
                this program.
              </p>
            </Panel>
          </div>
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
      <div className="flex flex-wrap justify-end gap-1.5">
        {canManage && (
          <>
            <Btn size="sm" onClick={onAddClass}>+ Class</Btn>
            <Btn size="sm" onClick={onEdit}>Edit</Btn>
            <Btn size="sm" className="text-red-700" onClick={onDelete}>Delete</Btn>
          </>
        )}
        <Btn size="sm" variant="primary" onClick={onOpen}>Open cohort</Btn>
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
