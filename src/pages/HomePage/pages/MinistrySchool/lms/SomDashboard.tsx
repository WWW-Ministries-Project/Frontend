import { useSomAccess } from "../utils/useSomAccess";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import { api } from "@/utils";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { COHORT_STATUS } from "@/utils/api/ministrySchool/interfaces";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSomData } from "./somDataContext";
import {
  ATTENTION_RULE,
  fmtDate,
  formatLabel,
  needsAttention,
  personName,
  somPaths,
} from "./somUtils";
import { Avatar, Btn, EmptyBlock, Kpi, PageHeader, Panel, Pill, ProgressBar, StatusPill, LoadError } from "./ui";

export const SomDashboard = () => {
  const navigate = useNavigate();
  const { loading, programs, cohorts, enrollments, instructors, error, refetch } = useSomData();

  const stats = useMemo(() => {
    const live = cohorts.filter((c) => c.timing.status === COHORT_STATUS.ONGOING);
    const upcoming = cohorts
      .filter((c) => c.timing.status === COHORT_STATUS.UPCOMING)
      .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
    const liveEnrollments = enrollments.filter((e) => e.cohort.timing.status === COHORT_STATUS.ONGOING);
    const attention = liveEnrollments
      .filter((e) => needsAttention(e.health))
      .sort((a, b) => a.completion_percent - b.completion_percent);
    const completed = enrollments.filter((e) => e.completion_status === "COMPLETED").length;
    const unassigned = cohorts
      .filter((c) => c.timing.status !== COHORT_STATUS.COMPLETED)
      .flatMap((c) => c.courses.filter((cls) => !cls.instructor?.id).map((cls) => ({ cls, cohort: c })));
    return { live, upcoming, liveEnrollments, attention, completed, unassigned };
  }, [cohorts, enrollments]);

  // Manage-only endpoints: view-only users never call them.
  const access = useSomAccess();
  const canDecide = access.canAll("decide_applications");
  const canSeeSessions = access.can("take_attendance");
  const dayKey = new Date().toDateString(); // re-query when the day changes in a long-lived tab
  const sessionQuery = useMemo(() => {
    const from = new Date(dayKey);
    return { from: from.toISOString(), to: new Date(from.getTime() + 14 * 86_400_000).toISOString() };
  }, [dayKey]);
  const { data: sessionData } = useFetch(api.fetch.fetchLmsSessions, sessionQuery, !canSeeSessions);
  const { data: pendingData } = useFetch(api.fetch.fetchLmsApplications, { status: "PENDING" }, !canDecide);
  const nextSessions = (sessionData?.data ?? []).filter((x) => !x.cancelled).slice(0, 4);
  const pendingCount = pendingData?.data?.length ?? 0;

  if (loading && !programs.length) {
    return (
      <PageOutline>
        <SkeletonLoader />
      </PageOutline>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <PageOutline>
      <div className="flex flex-col gap-5">
        {error && <LoadError msg={error} onRetry={refetch} />}
        <PageHeader
          eyebrow={today}
          title="Learning dashboard"
          actions={
            <>
              <Btn to={somPaths.reports}>View reports</Btn>
              <Btn variant="primary" to={`${somPaths.programs}?new=1`}>
                + New program
              </Btn>
            </>
          }
        />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Kpi
            label="Active learners"
            value={stats.liveEnrollments.length}
            sub={`in ${stats.live.length} live cohort${stats.live.length === 1 ? "" : "s"}`}
            to={somPaths.learners}
          />
          <Kpi
            label="Need attention"
            value={stats.attention.length}
            sub="behind or not started"
            tone={stats.attention.length ? "warn" : "default"}
            to={`${somPaths.learners}?filter=attention`}
          />
          <Kpi
            label="Completions"
            value={stats.completed}
            sub={`across ${programs.length} program${programs.length === 1 ? "" : "s"}`}
            to={somPaths.learners}
          />
          <Kpi
            label="Instructors"
            value={instructors.length}
            sub={
              stats.unassigned.length
                ? `${stats.unassigned.length} class${stats.unassigned.length === 1 ? "" : "es"} unassigned`
                : "all classes covered"
            }
            to={somPaths.instructors}
          />
          {canDecide && (
            <Kpi
              label="Awaiting review"
              value={pendingCount}
              sub="applications held back"
              tone={pendingCount ? "warn" : "default"}
              to={somPaths.learners}
            />
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
          <Panel
            title="Learners needing attention"
            icon={<span className="size-2 rounded-full bg-red-600" aria-hidden />}
            action={<Btn variant="ghost" to={`${somPaths.learners}?filter=attention`}>View all</Btn>}
          >
            {stats.attention.length === 0 ? (
              <p className="px-4 py-6 text-sm text-primaryGray">Everyone in a live cohort is keeping pace.</p>
            ) : (
              <ul>
                {stats.attention.slice(0, 6).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0">
                    <Avatar name={e.name} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => navigate(somPaths.student(e.cohort.id, e.cls.id, e.id))}
                        className="block truncate text-left text-sm font-medium text-primary hover:underline"
                      >
                        {e.name}
                      </button>
                      <p className="truncate text-xs text-mainGray">
                        {e.program.title} · {e.cohort.name} · {e.cls.name}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-primaryGray">{Math.round(e.completion_percent)}%</span>
                    <StatusPill status={e.health} />
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-gray-100 px-4 py-2 text-xs text-mainGray">{ATTENTION_RULE}</p>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel
              title="Grading"
              action={<Btn variant="ghost" to={`${somPaths.dashboard}/instructor-portal`}>Open grading</Btn>}
            >
              {stats.live.length === 0 ? (
                <p className="px-4 py-5 text-sm text-primaryGray">No live cohorts to grade.</p>
              ) : (
                <ul>
                  {stats.live.slice(0, 4).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => navigate(somPaths.cohort(c.id, "Gradebook"))}
                        className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 text-left last:border-0 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-primary">{c.program.title}</p>
                          <p className="truncate text-xs text-mainGray">{c.name} · {c.timing.label}</p>
                        </div>
                        <span className="text-xs font-medium text-primary">Gradebook ›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {canSeeSessions && (
              <Panel title="Next sessions" action={<Btn variant="ghost" to={somPaths.cohorts}>All cohorts</Btn>}>
                {nextSessions.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-primaryGray">No sessions in the next two weeks.</p>
                ) : (
                  <ul>
                    {nextSessions.map((x) => (
                      <li key={x.id}>
                        <button
                          type="button"
                          onClick={() => navigate(somPaths.cohort(x.cohortId, "Sessions & attendance"))}
                          className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-left last:border-0 hover:bg-gray-50"
                        >
                          <DateTile value={x.starts_at} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-primary">
                              {x.cohort.program.title} · {x.title}
                            </p>
                            <p className="truncate text-xs text-mainGray">
                              {new Date(x.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ·{" "}
                              {x.course?.name ?? "Whole cohort"}
                              {x.location ? ` · ${x.location}` : ""}
                              {x.course?.instructor ? ` · ${x.course.instructor}` : ""}
                            </p>
                          </div>
                          <Pill tone={x.mode === "ONLINE" ? "cyan" : x.mode === "HYBRID" ? "fuchsia" : "indigo"}>
                            {x.mode === "ONLINE" ? "Live online" : x.mode === "HYBRID" ? "Hybrid" : "In person"}
                          </Pill>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            <Panel title="Coming up">
              {stats.upcoming.length === 0 && stats.unassigned.length === 0 ? (
                <p className="px-4 py-5 text-sm text-primaryGray">Nothing scheduled.</p>
              ) : (
                <ul>
                  {stats.upcoming.slice(0, 3).map((c) => (
                    <li key={`c-${c.id}`} className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5">
                      <DateTile value={c.startDate} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">
                          {c.program.title} · {c.name} starts
                        </p>
                        <p className="truncate text-xs text-mainGray">
                          Applications close {fmtDate(c.applicationDeadline)} · {c.learnerCount} enrolled
                        </p>
                      </div>
                    </li>
                  ))}
                  {stats.unassigned.slice(0, 3).map(({ cls, cohort }) => (
                    <li key={`u-${cls.id}`} className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-primary">{cls.name} has no instructor</p>
                        <p className="truncate text-xs text-mainGray">
                          {cohort.program.title} · {cohort.name} · {formatLabel(cls.classFormat)}
                        </p>
                      </div>
                      <Btn size="sm" to={somPaths.cohort(cohort.id)}>Assign</Btn>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        <Panel title="Live cohorts" action={<Btn variant="ghost" to={somPaths.cohorts}>All cohorts</Btn>}>
          {stats.live.length === 0 ? (
            <EmptyBlock msg="No cohort is running right now." />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
              {stats.live.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(somPaths.cohort(c.id))}
                  className="flex flex-col gap-2.5 border-b border-r border-gray-100 p-4 text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-primary">{c.program.title}</p>
                    <p className="text-xs text-mainGray">{c.name}</p>
                  </div>
                  <div className="flex justify-between text-xs text-primaryGray">
                    <span>{c.timing.label}</span>
                    <span>{c.learnerCount} learners</span>
                  </div>
                  <ProgressBar value={c.timing.pct} />
                  {c.attentionCount > 0 && (
                    <span className="text-xs font-semibold text-red-700">{c.attentionCount} need attention</span>
                  )}
                  <span className="text-xs text-mainGray">
                    {c.courses.map((cls) => personName(cls.instructor)).filter((n, i, a) => a.indexOf(n) === i).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </PageOutline>
  );
};

const DateTile = ({ value }: { value: string }) => {
  const d = new Date(value);
  const valid = !Number.isNaN(d.getTime());
  return (
    <div className="flex w-11 flex-shrink-0 flex-col items-center rounded-lg border border-gray-200 py-1">
      <span className="text-[10px] font-semibold uppercase text-mainGray">
        {valid ? d.toLocaleDateString("en-US", { month: "short" }) : "—"}
      </span>
      <span className="text-base font-bold leading-none text-primary">{valid ? d.getDate() : ""}</span>
    </div>
  );
};

export default SomDashboard;
