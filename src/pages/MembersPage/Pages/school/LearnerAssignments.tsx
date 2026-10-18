import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Btn,
  EmptyBlock,
  LoadError,
  PageHeader,
  Pill,
  SimpleTable,
  type Column,
} from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { learnerPaths } from "./learnerPaths";
import {
  ASSESSMENT_TYPE,
  ASSIGNMENT_STATE,
  assignmentState,
  flattenAssignments,
  isOutstanding,
  relativeDay,
  shortDate,
  useLearnerOverview,
  type LearnerAssignment,
} from "./learnerUtils";

const FILTERS: Record<string, (a: LearnerAssignment) => boolean> = {
  All: () => true,
  "To do": isOutstanding,
  Submitted: (a) => assignmentState(a) === "submitted",
  Graded: (a) => assignmentState(a) === "graded",
};

const LearnerAssignments = () => {
  const navigate = useNavigate();
  const { enrollments, loading, error, refetch } = useLearnerOverview();
  const [filter, setFilter] = useState("All");

  const all = flattenAssignments(enrollments);
  const rows = all.filter(FILTERS[filter]);
  const showProgram = new Set(all.map((a) => a.programId)).size > 1;

  const open = (a: LearnerAssignment) => {
    const state = assignmentState(a);
    navigate(
      state === "graded" || state === "submitted"
        ? learnerPaths.assignment(a.topicId)
        : learnerPaths.program(a.programId)
    );
  };

  const columns: Column<LearnerAssignment>[] = [
    {
      key: "name",
      header: "Assignment",
      render: (a) => (
        <div>
          <p className="font-semibold">{a.name}</p>
          <p className="text-xs text-mainGray">
            {[showProgram ? a.programTitle : null, a.moduleTitle].filter(Boolean).join(" · ") ||
              a.programTitle}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (a) => <span className="text-primaryGray">{ASSESSMENT_TYPE[a.type] ?? "Assessment"}</span>,
    },
    {
      key: "due",
      header: "Due",
      render: (a) => (
        <div>
          <p>{relativeDay(a.dueDate)}</p>
          <p className="text-xs text-mainGray">{shortDate(a.dueDate)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const s = ASSIGNMENT_STATE[assignmentState(a)];
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    {
      key: "action",
      header: <span className="sr-only">Action</span>,
      className: "text-right",
      render: (a) => {
        const state = assignmentState(a);
        const label =
          state === "graded"
            ? "View feedback"
            : state === "submitted"
              ? "View submission"
              : state === "locked" || state === "excused"
                ? "Open program"
                : "Start";
        return (
          <Btn size="sm" onClick={() => open(a)}>
            {label}
          </Btn>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Assignments"
        subtitle="Due dates follow your cohort's calendar. Extensions from your instructor are already applied."
      />

      <div role="tablist" aria-label="Filter assignments" className="flex flex-wrap gap-2">
        {Object.keys(FILTERS).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "h-[34px] rounded-full border border-primary bg-primary px-3.5 text-[13px] font-medium text-white"
                : "h-[34px] rounded-full border border-lightGray bg-white px-3.5 text-[13px] font-medium text-primaryGray hover:bg-gray-50"
            }
          >
            {f}
          </button>
        ))}
      </div>

      {error && !enrollments.length ? (
        <LoadError msg="We could not load your assignments." onRetry={() => refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <SimpleTable
            columns={columns}
            rows={rows}
            rowKey={(a) => `${a.programId}-${a.topicId}`}
            empty={
              loading ? undefined : (
                <div className="p-4">
                  <EmptyBlock
                    msg={
                      all.length
                        ? "Nothing here for this filter."
                        : "Quizzes and essays from your programs will show up here."
                    }
                  />
                </div>
              )
            }
          />
        </div>
      )}
    </div>
  );
};

export default LearnerAssignments;
