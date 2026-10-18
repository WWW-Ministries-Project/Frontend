import { useNavigate } from "react-router-dom";
import {
  EmptyBlock,
  Kpi,
  LoadError,
  PageHeader,
  Panel,
  Pill,
  SimpleTable,
  type Column,
} from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import type { LearnerAssessment, LearnerEnrollment } from "@/utils";
import { learnerPaths } from "./learnerPaths";
import { pct, useLearnerOverview } from "./learnerUtils";

const CATEGORY_LABEL: Record<string, string> = { quiz: "Quizzes", essay: "Essays", exam: "Exams" };

const isGraded = (a: LearnerAssessment) => a.status === "graded" || a.status === "overridden";

const scoreCell = (a: LearnerAssessment) => {
  if (isGraded(a)) {
    return (
      <span className={a.passed === false ? "font-bold text-red-700" : "font-bold text-primary"}>
        {pct(a.score)}
      </span>
    );
  }
  if (a.status === "needs_grading") return <Pill tone="blue">Awaiting grade</Pill>;
  if (a.status === "missing") return <Pill tone="red">Missing · 0%</Pill>;
  if (a.status === "excused") return <Pill>Excused</Pill>;
  return <span className="text-gray-400">—</span>;
};

const feedbackText = (a: LearnerAssessment) => {
  if (a.feedback) return a.feedback;
  if (a.status === "needs_grading") return "Submitted — your instructor will grade it soon.";
  if (isGraded(a)) return "No written feedback.";
  return "Not submitted yet";
};

const ProgramGrades = ({ enrollment }: { enrollment: LearnerEnrollment }) => {
  const navigate = useNavigate();
  const { grading, assessments } = enrollment;
  const weighted = grading.mode === "WEIGHTED";
  const graded = assessments.filter(isGraded);
  const passed = graded.filter((a) => a.passed !== false).length;
  const awaiting = assessments.filter((a) => a.status === "needs_grading").length;

  const columns: Column<LearnerAssessment>[] = [
    {
      key: "name",
      header: "Assessment",
      render: (a) => (
        <div>
          <p className="font-semibold">{a.name}</p>
          {a.moduleTitle && <p className="text-xs text-mainGray">{a.moduleTitle}</p>}
        </div>
      ),
    },
    {
      key: "weight",
      header: weighted ? "Counts toward" : "Pass mark",
      render: (a) => (
        <span className="text-primaryGray">
          {weighted
            ? a.category
              ? `${CATEGORY_LABEL[a.category]} · ${grading.weights[a.category]}%`
              : "Not counted"
            : `${a.passMark}%`}
        </span>
      ),
    },
    { key: "score", header: "Score", render: scoreCell },
    {
      key: "feedback",
      header: "Feedback",
      render: (a) => <span className="text-[13px] text-primaryGray">{feedbackText(a)}</span>,
    },
  ];

  return (
    <Panel
      title={enrollment.program.title}
      action={
        <span className="text-xs text-mainGray">
          {enrollment.cohort.name} · {enrollment.class.name}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-4 sm:grid-cols-3">
        {weighted ? (
          <Kpi
            label="Current grade"
            value={pct(enrollment.finalGrade)}
            sub={`Pass mark ${grading.passMark}% · weighted`}
            tone={
              enrollment.finalGrade !== null && enrollment.finalGrade < grading.passMark
                ? "warn"
                : "default"
            }
          />
        ) : (
          <Kpi
            label="Units passed"
            value={`${passed} of ${assessments.length}`}
            sub="Pass every graded unit to complete"
          />
        )}
        <Kpi
          label="Graded"
          value={`${graded.length} of ${assessments.length}`}
          sub={awaiting ? `${awaiting} awaiting grading` : "Nothing awaiting grading"}
        />
        <Kpi
          label="Attendance"
          value={pct(enrollment.attendance)}
          sub={
            weighted && grading.weights.attendance
              ? `Counts ${grading.weights.attendance}% of your grade`
              : "Taken at each live session"
          }
        />
      </div>
      <SimpleTable
        columns={columns}
        rows={assessments}
        rowKey={(a) => a.topicId}
        minWidth={600}
        onRowClick={(a) =>
          a.submissionId ? navigate(learnerPaths.assignment(a.topicId)) : undefined
        }
        empty={<p className="px-4 py-6 text-sm text-primaryGray">This program has no graded work.</p>}
      />
    </Panel>
  );
};

const LearnerGrades = () => {
  const { enrollments, loading, error, refetch } = useLearnerOverview();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Grades"
        subtitle="Scores appear here as soon as your instructor grades your work."
      />
      {error && !enrollments.length ? (
        <LoadError msg="We could not load your grades." onRetry={() => refetch()} />
      ) : !loading && !enrollments.length ? (
        <EmptyBlock msg="Enrol in a program to start building your grades." />
      ) : (
        enrollments.map((e) => <ProgramGrades key={e.enrollmentId} enrollment={e} />)
      )}
    </div>
  );
};

export default LearnerGrades;
