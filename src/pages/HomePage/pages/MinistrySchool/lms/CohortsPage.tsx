import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { COHORT_STATUS, type CohortStatus } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSomData, type CohortRow } from "./somDataContext";
import { formatLabel, personName, somPaths } from "./somUtils";
import { EmptyBlock, PageHeader, ProgressBar, StatusPill, LoadError } from "./ui";

/** Status tabs, in prototype order. "Completed" cohorts are shown as "Ended". */
const TABS: { label: string; status: CohortStatus }[] = [
  { label: "Upcoming", status: COHORT_STATUS.UPCOMING },
  { label: "Ongoing", status: COHORT_STATUS.ONGOING },
  { label: "Ended", status: COHORT_STATUS.COMPLETED },
];

const EMPTY_MSG: Record<CohortStatus, string> = {
  Upcoming: "No upcoming cohorts. Create one from a program's Cohorts tab.",
  Ongoing: "No cohorts are running right now.",
  Completed: "No cohorts have ended yet.",
};

type ProgramGroup = {
  id: number;
  title: string;
  cohorts: CohortRow[];
  learners: number;
};

export const CohortsPage = () => {
  const navigate = useNavigate();
  const { loading, cohorts, error, refetch } = useSomData();
  const [tab, setTab] = useState<CohortStatus>(COHORT_STATUS.ONGOING);

  const counts = useMemo(() => {
    const c: Record<CohortStatus, number> = { Upcoming: 0, Ongoing: 0, Completed: 0 };
    cohorts.forEach((x) => (c[x.timing.status] += 1));
    return c;
  }, [cohorts]);

  const groups = useMemo<ProgramGroup[]>(() => {
    const byProgram = new Map<number, ProgramGroup>();
    cohorts
      .filter((c) => c.timing.status === tab)
      .forEach((c) => {
        const g =
          byProgram.get(c.program.id) ??
          { id: c.program.id, title: c.program.title, cohorts: [], learners: 0 };
        g.cohorts.push(c);
        g.learners += c.learnerCount;
        byProgram.set(c.program.id, g);
      });
    const list = [...byProgram.values()];
    list.forEach((g) =>
      g.cohorts.sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
    );
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [cohorts, tab]);

  const statusLabel = (status: CohortStatus) =>
    status === COHORT_STATUS.COMPLETED ? "Ended" : status;

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          title="Cohorts"
          subtitle="Each cohort is one run of a program, split into classes by delivery mode. Create cohorts from a program."
        />

        <div role="tablist" aria-label="Cohort status" className="flex gap-1 overflow-x-auto border-b border-gray-200">
          {TABS.map((t) => {
            const on = tab === t.status;
            return (
              <button
                key={t.status}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.status)}
                className={cn(
                  "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm",
                  on
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent font-medium text-primaryGray hover:text-primary"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 py-px text-xs font-semibold",
                    on ? "bg-primary text-white" : "bg-gray-100 text-primaryGray"
                  )}
                >
                  {counts[t.status]}
                </span>
              </button>
            );
          })}
        </div>

        {loading && !cohorts.length ? (
          <SkeletonLoader />
        ) : groups.length === 0 ? (
          <EmptyBlock msg={EMPTY_MSG[tab]} />
        ) : (
          <div className="flex flex-col gap-7">
            {groups.map((g) => (
              <section key={g.id} aria-label={`${g.title} cohorts`} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-2">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h2 className="text-lg font-semibold text-primary">{g.title}</h2>
                    <span className="text-[13px] text-mainGray">
                      {g.cohorts.length} {g.cohorts.length === 1 ? "cohort" : "cohorts"} · {g.learners} learners
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(somPaths.program(g.id, "Cohorts"))}
                    className="text-[13px] font-medium text-primary hover:underline"
                  >
                    View program →
                  </button>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
                  {g.cohorts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate(somPaths.cohort(c.id))}
                      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-lightGray hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-base font-semibold text-primary">{c.name}</p>
                        <StatusPill status={c.timing.status} label={statusLabel(c.timing.status)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs text-primaryGray">
                          <span>{c.timing.label}</span>
                          <span>{c.timing.pct}%</span>
                        </div>
                        <ProgressBar value={c.timing.pct} tone="gold" />
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
              </section>
            ))}
          </div>
        )}
      </div>
    </PageOutline>
  );
};

export default CohortsPage;
