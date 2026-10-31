import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { COHORT_STATUS } from "@/utils/api/ministrySchool/interfaces";
import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSomData } from "./somDataContext";
import { audienceLabel, isAssessmentUnit, somPaths } from "./somUtils";
import { Btn, EmptyBlock, PageHeader, Panel, Pill, SimpleTable, type Column, LoadError } from "./ui";
import { useProgramEditor } from "./useProgramEditor";
import { useSomAccess } from "../utils/useSomAccess";

export const ProgramsPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const som = useSomAccess();
  // New programs need curriculum design for the whole school; instructors
  // with curriculum editing on a program may edit that one (the API checks).
  const canCreate = som.can("design_curriculum") && som.canAll("design_curriculum");
  const canEdit = som.can("design_curriculum");
  const canDelete = som.canDelete;
  const { loading, programs, cohorts, refetch, error } = useSomData();
  const editor = useProgramEditor({ allPrograms: programs, onSaved: refetch, onDeleted: refetch });

  useEffect(() => {
    if (params.get("new") === "1" && canCreate) {
      editor.openCreate();
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [params, setParams, editor, canCreate]);

  const rows = useMemo(
    () =>
      programs.map((p) => {
        const progCohorts = cohorts.filter((c) => c.program.id === p.id);
        return {
          program: p,
          units: p.topics.length,
          assessments: p.topics.filter((t) => isAssessmentUnit(t.LearningUnit?.type)).length,
          cohortCount: progCohorts.length,
          live: progCohorts.some((c) => c.timing.status === COHORT_STATUS.ONGOING),
          upcoming: progCohorts.some((c) => c.timing.status === COHORT_STATUS.UPCOMING),
          learners: p.enrollment_summary?.total_enrolled_members ?? 0,
        };
      }),
    [programs, cohorts]
  );

  type Row = (typeof rows)[number];

  const columns: Column<Row>[] = [
    {
      key: "program",
      header: "Program",
      className: "max-w-[340px]",
      render: (r) => (
        <div>
          <p className="font-semibold">{r.program.title}</p>
          <p className="line-clamp-1 text-xs text-mainGray">{r.program.description}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.live ? (
          <Pill tone="green">Running</Pill>
        ) : r.upcoming ? (
          <Pill tone="amber">Intake open</Pill>
        ) : (
          <Pill>No live cohort</Pill>
        ),
    },
    {
      key: "curriculum",
      header: "Curriculum",
      render: (r) => (
        <span className="whitespace-nowrap text-primaryGray">
          {r.units} units · {r.assessments} assessed
        </span>
      ),
    },
    { key: "who", header: "Who can join", render: (r) => <span className="text-primaryGray">{audienceLabel(r.program)}</span> },
    { key: "cohorts", header: "Cohorts", className: "text-right", render: (r) => r.cohortCount },
    { key: "learners", header: "Learners", className: "text-right", render: (r) => r.learners },
    ...(canEdit || canDelete
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            className: "text-right",
            render: (r: Row) => (
              <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                  <Btn size="sm" variant="secondary" onClick={() => editor.openEdit(r.program)}>
                    Edit
                  </Btn>
                )}
                {canDelete && (
                  <Btn
                    size="sm"
                    variant="secondary"
                    className="text-red-700"
                    onClick={() => editor.confirmDelete(r.program)}
                  >
                    Delete
                  </Btn>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          title="Programs"
          subtitle="Design the curriculum and enrollment rules once. Every cohort inherits them."
          actions={
            canCreate && (
              <Btn variant="primary" onClick={editor.openCreate}>
                + New program
              </Btn>
            )
          }
        />
        {loading && !programs.length ? (
          <SkeletonLoader />
        ) : (
          <Panel>
            <SimpleTable<Row>
              columns={columns}
              rows={rows}
              rowKey={(r) => r.program.id}
              onRowClick={(r) => navigate(somPaths.program(r.program.id))}
              minWidth={820}
              empty={
                <EmptyBlock
                  msg="No programs yet. Create one to start building its curriculum."
                  action={
                    canCreate && (
                      <Btn variant="primary" onClick={editor.openCreate}>
                        + New program
                      </Btn>
                    )
                  }
                />
              }
            />
          </Panel>
        )}
      </div>
      {editor.modal}
    </PageOutline>
  );
};

export default ProgramsPage;
