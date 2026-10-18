import { useState } from "react";
import {
  Btn,
  EmptyBlock,
  LoadError,
  PageHeader,
  Pill,
  ProgressBar,
} from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { formatLabel } from "@/pages/HomePage/pages/MinistrySchool/lms/somUtils";
import { learnerPaths } from "./learnerPaths";
import { shortDate, useLearnerOverview } from "./learnerUtils";

const FILTERS = ["All", "In progress", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

const MyPrograms = () => {
  const { enrollments, loading, error, refetch } = useLearnerOverview();
  const [filter, setFilter] = useState<Filter>("All");

  const shown = enrollments.filter((e) =>
    filter === "All" ? true : filter === "Completed" ? e.completed : !e.completed
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="My programs"
        subtitle="Programs you're enrolled in, and the ones you've completed."
      />

      <div role="tablist" aria-label="Filter programs" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
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
        <LoadError msg="We could not load your programs." onRetry={() => refetch()} />
      ) : !loading && !shown.length ? (
        <EmptyBlock
          msg={
            enrollments.length
              ? "No programs match this filter."
              : "You are not enrolled in any program yet."
          }
          action={
            enrollments.length ? undefined : (
              <Btn variant="primary" to={learnerPaths.browse}>
                Browse programs
              </Btn>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((e) => {
            const format = e.class.format ? formatLabel(e.class.format) : null;
            return (
              <article
                key={e.enrollmentId}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-mainGray">
                      {[e.cohort.name, e.class.name, format].filter(Boolean).join(" · ")}
                    </p>
                    <h3 className="text-lg font-semibold text-primary">{e.program.title}</h3>
                  </div>
                  <Pill tone={e.completed ? "green" : "blue"}>
                    {e.completed ? "Completed" : "In progress"}
                  </Pill>
                </div>
                <div className="flex justify-between text-xs text-mainGray">
                  <span>
                    {e.completed
                      ? `Finished ${shortDate(e.completedAt)}`
                      : `${e.progress.completed} of ${e.progress.total} units`}
                  </span>
                  <span>{e.progress.percent}% complete</span>
                </div>
                <ProgressBar value={e.progress.percent} />
                {e.class.instructor?.name && (
                  <p className="text-xs text-primaryGray">Instructor: {e.class.instructor.name}</p>
                )}
                <div className="mt-auto">
                  <Btn
                    variant={e.completed ? "secondary" : "primary"}
                    to={learnerPaths.program(e.program.id)}
                  >
                    {e.completed ? "Review & certificate" : "Continue"}
                  </Btn>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPrograms;
