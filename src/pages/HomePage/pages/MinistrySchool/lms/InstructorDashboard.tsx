import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import { COHORT_STATUS } from "@/utils/api/ministrySchool/interfaces";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSomAccess } from "../utils/useSomAccess";
import { useSomData } from "./somDataContext";
import { ATTENTION_RULE, isMyClass, needsAttention, somPaths } from "./somUtils";
import { Avatar, Btn, EmptyBlock, Kpi, PageHeader, Panel, Pill, ProgressBar, StatusPill, LoadError } from "./ui";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/**
 * "My teaching" — the School of Ministry dashboard an instructor sees. The data
 * context already returns only the programs they teach; this narrows further to
 * the classes they personally run and adds the grading backlog from the
 * instructor overview.
 */
export const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const myId = Number(user.id);
  const { loading, programs, cohorts, enrollments, error, refetch } = useSomData();
  const canSeeSessions = useSomAccess().can("take_attendance");

  const mine = useMemo(() => {
    const myClasses = cohorts.flatMap((c) =>
      c.courses.filter((cls) => isMyClass(cls, myId)).map((cls) => ({ cls, cohort: c }))
    );
    const myClassIds = new Set(myClasses.map((m) => m.cls.id));
    const myCohortIds = new Set(myClasses.map((m) => m.cohort.id));
    const myCohorts = cohorts.filter((c) => myCohortIds.has(c.id));
    const live = myCohorts.filter((c) => c.timing.status === COHORT_STATUS.ONGOING);
    const liveClassCount = myClasses.filter(
      (m) => m.cohort.timing.status === COHORT_STATUS.ONGOING
    ).length;
    const myEnrollments = enrollments.filter((e) => isMyClass(e.cls, myId));
    const liveEnrollments = myEnrollments.filter(
      (e) => e.cohort.timing.status === COHORT_STATUS.ONGOING
    );
    const learnerCount = new Set(liveEnrollments.map((e) => e.user_id)).size;
    const attention = liveEnrollments
      .filter((e) => needsAttention(e.health))
      .sort((a, b) => a.completion_percent - b.completion_percent);
    return { myClassIds, myCohortIds, live, liveClassCount, learnerCount, attention };
  }, [cohorts, enrollments, myId]);

  // Sessions in the next two weeks, kept to the cohorts this instructor runs.
  const dayKey = new Date().toDateString();
  const sessionQuery = useMemo(() => {
    const from = new Date(dayKey);
    return { from: from.toISOString(), to: new Date(from.getTime() + 14 * 86_400_000).toISOString() };
  }, [dayKey]);
  const { data: sessionData } = useFetch(api.fetch.fetchLmsSessions, sessionQuery, !canSeeSessions);
  const { data: overviewData } = useFetch(api.fetch.fetchInstructorsOverview);

  const me = (overviewData?.data ?? []).find((r) => r.userId === myId);
  const toGrade = me?.toGrade ?? 0;
  const gradingQueue = me?.gradingQueue ?? [];

  const weekEnd = useMemo(() => new Date(new Date(dayKey).getTime() + 7 * 86_400_000), [dayKey]);
  const mySessions = useMemo(
    () =>
      (sessionData?.data ?? [])
        .filter((s) => !s.cancelled)
        .filter((s) =>
          s.courseId ? mine.myClassIds.has(s.courseId) : mine.myCohortIds.has(s.cohortId)
        )
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)),
    [sessionData, mine.myClassIds, mine.myCohortIds]
  );
  const sessionsThisWeek = mySessions.filter((s) => new Date(s.starts_at) <= weekEnd);
  const nextSession = mySessions[0];

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
        <PageHeader eyebrow={today} title={`${greeting()}, ${user.name || "there"}`} />

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Kpi
            label="My learners"
            value={mine.learnerCount}
            sub={`in ${mine.liveClassCount} live class${mine.liveClassCount === 1 ? "" : "es"}`}
          />
          <Kpi
            label="Sessions this week"
            value={sessionsThisWeek.length}
            sub={
              nextSession
                ? `next ${new Date(nextSession.starts_at).toLocaleDateString("en-US", {
                    weekday: "short",
                  })} ${new Date(nextSession.starts_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "none scheduled"
            }
          />
          <Kpi
            label="At risk in my classes"
            value={mine.attention.length}
            sub="behind or not started"
            tone={mine.attention.length ? "warn" : "default"}
          />
          <Kpi
            label="Waiting for me to grade"
            value={toGrade}
            sub={me?.avgGradingHours != null ? `${me.avgGradingHours}h average turnaround` : "across my classes"}
            tone={toGrade ? "warn" : "default"}
            to={gradingQueue[0] ? somPaths.cohort(gradingQueue[0].cohortId, "Gradebook") : undefined}
          />
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
          <Panel
            title="At-risk learners"
            icon={<span className="size-2 rounded-full bg-red-600" aria-hidden />}
          >
            {mine.attention.length === 0 ? (
              <p className="px-4 py-6 text-sm text-primaryGray">Everyone in your live classes is keeping pace.</p>
            ) : (
              <ul>
                {mine.attention.slice(0, 6).map((e) => (
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
              title="Grading queue"
              action={
                gradingQueue.length ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {toGrade}
                  </span>
                ) : undefined
              }
            >
              {gradingQueue.length === 0 ? (
                <p className="px-4 py-5 text-sm text-primaryGray">Nothing is waiting for you to grade.</p>
              ) : (
                <ul>
                  {gradingQueue.map((q) => (
                    <li key={q.cohortId}>
                      <button
                        type="button"
                        onClick={() => navigate(somPaths.cohort(q.cohortId, "Gradebook"))}
                        className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 text-left last:border-0 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-primary">{q.cohortName}</p>
                          <p className="truncate text-xs text-mainGray">{q.programTitle}</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          {q.pending}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {canSeeSessions && (
              <Panel title="Next sessions">
                {mySessions.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-primaryGray">No sessions in the next two weeks.</p>
                ) : (
                  <ul>
                    {mySessions.slice(0, 4).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => navigate(somPaths.cohort(s.cohortId, "Sessions & attendance"))}
                          className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-2.5 text-left last:border-0 hover:bg-gray-50"
                        >
                          <DateTile value={s.starts_at} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-primary">
                              {s.cohort.program.title} · {s.title}
                            </p>
                            <p className="truncate text-xs text-mainGray">
                              {new Date(s.starts_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              {s.location ? ` · ${s.location}` : ""}
                            </p>
                          </div>
                          <Pill tone={s.mode === "ONLINE" ? "cyan" : s.mode === "HYBRID" ? "fuchsia" : "indigo"}>
                            {s.mode === "ONLINE" ? "Live online" : s.mode === "HYBRID" ? "Hybrid" : "In person"}
                          </Pill>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}
          </div>
        </div>

        <Panel title="My classes" action={<Btn variant="ghost" to={somPaths.cohorts}>All my classes</Btn>}>
          {mine.live.length === 0 ? (
            <EmptyBlock msg="None of your cohorts are running right now." />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
              {mine.live.map((c) => (
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
                  <ProgressBar value={c.timing.pct} tone="gold" />
                  {c.attentionCount > 0 && (
                    <span className="text-xs font-semibold text-red-700">{c.attentionCount} at risk</span>
                  )}
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

export default InstructorDashboard;
