import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { COHORT_STATUS } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSomData } from "./somDataContext";
import { formatLabel, personName, somPaths } from "./somUtils";
import { EmptyBlock, PageHeader, ProgressBar, StatusPill, LoadError } from "./ui";

const FILTERS = ["All", COHORT_STATUS.ONGOING, COHORT_STATUS.UPCOMING, COHORT_STATUS.COMPLETED] as const;
const ORDER: Record<string, number> = { Ongoing: 0, Upcoming: 1, Completed: 2 };

export const CohortsPage = () => {
  const navigate = useNavigate();
  const { loading, cohorts, error, refetch } = useSomData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = useMemo(
    () =>
      cohorts
        .filter((c) => filter === "All" || c.timing.status === filter)
        .sort(
          (a, b) =>
            (ORDER[a.timing.status] ?? 3) - (ORDER[b.timing.status] ?? 3) ||
            +new Date(b.startDate) - +new Date(a.startDate)
        ),
    [cohorts, filter]
  );

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          title="Cohorts"
          subtitle="Each cohort is one run of a program, split into classes by delivery mode. Create cohorts from a program."
        />
        <div role="tablist" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filter === f
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 text-primaryGray hover:bg-gray-50"
              )}
            >
              {f === "All" ? "All" : f}
              <span className="ml-1.5 text-xs opacity-75">
                {f === "All" ? cohorts.length : cohorts.filter((c) => c.timing.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {loading && !cohorts.length ? (
          <SkeletonLoader />
        ) : rows.length === 0 ? (
          <EmptyBlock msg="No cohorts here. Open a program and create a cohort from its Cohorts tab." />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-3">
            {rows.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(somPaths.cohort(c.id))}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-lightGray hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-mainGray">{c.program.title}</p>
                    <p className="truncate text-base font-semibold text-primary">{c.name}</p>
                  </div>
                  <StatusPill status={c.timing.status} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-primaryGray">
                    <span>{c.timing.label}</span>
                    <span>{c.timing.pct}%</span>
                  </div>
                  <ProgressBar value={c.timing.pct} />
                </div>
                <ul className="flex flex-col gap-1">
                  {c.courses.slice(0, 4).map((k) => (
                    <li key={k.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-primary">
                        {k.name} <span className="font-normal text-mainGray">· {formatLabel(k.classFormat)}</span>
                      </span>
                      <span className="flex-shrink-0 text-mainGray">
                        {personName(k.instructor)} · {k.enrollments.length}/{k.capacity}
                      </span>
                    </li>
                  ))}
                  {c.courses.length === 0 && <li className="text-xs text-amber-700">No classes yet</li>}
                </ul>
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2.5 text-sm">
                  <span className="text-primaryGray">
                    <b className="text-primary">{c.learnerCount}</b> learners
                    {c.attentionCount > 0 && (
                      <>
                        {" · "}
                        <b className="text-red-700">{c.attentionCount} need attention</b>
                      </>
                    )}
                  </span>
                  <span className="text-xs font-medium text-primary">Open ›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageOutline>
  );
};

export default CohortsPage;
