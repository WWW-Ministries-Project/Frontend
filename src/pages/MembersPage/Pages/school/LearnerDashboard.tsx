import { useFetch } from "@/CustomHooks/useFetch";
import {
  Btn,
  EmptyBlock,
  Kpi,
  LoadError,
  PageHeader,
  Panel,
  Pill,
  ProgressBar,
} from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { api } from "@/utils/api/apiCalls";
import { Link } from "react-router-dom";
import { learnerPaths } from "./learnerPaths";
import {
  ASSIGNMENT_STATE,
  SESSION_MODE,
  assignmentState,
  dayParts,
  flattenAssignments,
  isOutstanding,
  pct,
  relativeDay,
  shortDate,
  timeRange,
  useLearnerOverview,
} from "./learnerUtils";

const today = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const LearnerDashboard = () => {
  const { enrollments, active, loading, error, refetch } = useLearnerOverview();
  const { data: sessionsData } = useFetch(api.fetch.fetchLearnerSessions, {
    from: new Date().toISOString().slice(0, 10),
  });
  const { data: announcementsData } = useFetch(api.fetch.fetchLearnerAnnouncements);

  const sessions = (sessionsData?.data ?? []).filter((s) => !s.cancelled).slice(0, 3);
  const latest = announcementsData?.data?.[0] ?? null;
  const assignments = flattenAssignments(enrollments);
  const dueSoon = assignments.filter(isOutstanding).slice(0, 4);
  const dueThisWeek = assignments.filter((a) => assignmentState(a) === "due").length;

  // The program with the most recent activity leads the "continue" card.
  const current = active.find((e) => e.nextTopic) ?? active[0] ?? null;
  const graded = active.find((e) => e.finalGrade !== null) ?? null;
  const attended = active.find((e) => e.attendance !== null) ?? null;

  if (error && !enrollments.length) {
    return <LoadError msg="We could not load your learning right now." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={today}
        title="My learning"
        actions={<Btn to={learnerPaths.browse}>Browse programs</Btn>}
      />

      {!loading && !enrollments.length ? (
        <EmptyBlock
          msg="You are not enrolled in a School of Ministry program yet."
          action={<Btn variant="primary" to={learnerPaths.browse}>Browse programs</Btn>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Overall progress"
              value={pct(current?.progress.percent ?? 0)}
              sub={current?.program.title ?? "No active program"}
              to={learnerPaths.myPrograms}
            />
            <Kpi
              label="Current grade"
              value={pct(graded?.finalGrade)}
              sub={graded ? `Pass mark ${graded.grading.passMark}%` : "No grades yet"}
              to={learnerPaths.grades}
            />
            <Kpi
              label="Due this week"
              value={dueThisWeek}
              sub={dueSoon[0]?.dueDate ? `Next: ${shortDate(dueSoon[0].dueDate)}` : "Nothing due"}
              to={learnerPaths.assignments}
            />
            <Kpi
              label="Attendance"
              value={pct(attended?.attendance)}
              sub={attended ? attended.program.title : "Not recorded yet"}
              to={learnerPaths.schedule}
            />
          </div>

          {current && (
            <section className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  {current.nextTopic ? "Continue where you left off" : "All units complete"}
                </p>
                <h2 className="text-xl font-semibold text-primary">
                  {current.nextTopic?.moduleTitle ?? current.program.title}
                </h2>
                <p className="text-sm text-primaryGray">
                  {current.program.title} · {current.cohort.name} · {current.class.name}
                  {current.nextTopic && (
                    <>
                      {" "}— next: <b className="text-primary">{current.nextTopic.name}</b>
                    </>
                  )}
                </p>
                <div className="flex max-w-md items-center gap-2.5">
                  <ProgressBar value={current.progress.percent} />
                  <span className="text-[13px] font-semibold text-primary">
                    {current.progress.percent}%
                  </span>
                </div>
              </div>
              <Btn variant="primary" to={learnerPaths.program(current.program.id)}>
                {current.nextTopic ? "Resume lesson" : "Open program"}
              </Btn>
            </section>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Due soon"
              action={<Btn variant="ghost" to={learnerPaths.assignments}>All assignments</Btn>}
            >
              {dueSoon.length ? (
                dueSoon.map((a) => {
                  const state = ASSIGNMENT_STATE[assignmentState(a)];
                  return (
                    <Link
                      key={`${a.programId}-${a.topicId}`}
                      to={learnerPaths.program(a.programId)}
                      className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-[13px] first:border-0 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-primary">{a.name}</p>
                        <p className="text-xs text-mainGray">
                          {relativeDay(a.dueDate)} · {shortDate(a.dueDate)}
                        </p>
                      </div>
                      <Pill tone={state.tone}>{state.label}</Pill>
                    </Link>
                  );
                })
              ) : (
                <p className="px-4 py-6 text-sm text-primaryGray">You are all caught up.</p>
              )}
            </Panel>

            <Panel
              title="Next sessions"
              action={<Btn variant="ghost" to={learnerPaths.schedule}>Schedule</Btn>}
            >
              {sessions.length ? (
                sessions.map((s) => {
                  const d = dayParts(s.startsAt);
                  const mode = SESSION_MODE[s.mode] ?? SESSION_MODE.IN_PERSON;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-[13px] first:border-0"
                    >
                      <div className="w-11 flex-shrink-0 text-center">
                        <p className="text-[11px] uppercase text-mainGray">{d.day}</p>
                        <p className="text-lg font-bold text-primary">{d.date}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-primary">{s.title}</p>
                        <p className="text-xs text-mainGray">
                          {timeRange(s.startsAt, s.endsAt)}
                          {s.location ? ` · ${s.location}` : ""}
                        </p>
                      </div>
                      <Pill tone={mode.tone}>{mode.label}</Pill>
                    </div>
                  );
                })
              ) : (
                <p className="px-4 py-6 text-sm text-primaryGray">No upcoming sessions.</p>
              )}
            </Panel>
          </div>

          <Panel
            title="Latest announcement"
            action={<Btn variant="ghost" to={learnerPaths.announcements}>View all</Btn>}
          >
            {latest ? (
              <div className="flex flex-col gap-1 px-4 py-3.5">
                <p className="text-sm font-semibold text-primary">{latest.title}</p>
                <p className="whitespace-pre-line text-[13px] text-primaryGray">{latest.body}</p>
                <p className="text-xs text-mainGray">
                  {latest.sentByName ?? "School of Ministry"} · {shortDate(latest.sentAt)}
                </p>
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-primaryGray">No announcements yet.</p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
};

export default LearnerDashboard;
