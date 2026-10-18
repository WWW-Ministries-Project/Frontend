import { Link, useParams } from "react-router-dom";
import { useFetch } from "@/CustomHooks/useFetch";
import {
  Btn,
  EmptyBlock,
  LoadError,
  Panel,
  Pill,
  ProgressBar,
} from "@/pages/HomePage/pages/MinistrySchool/lms/ui";
import { initials, safeHttpUrl } from "@/pages/HomePage/pages/MinistrySchool/lms/somUtils";
import { api } from "@/utils/api/apiCalls";
import type { LearnerSubmission as Submission } from "@/utils";
import { learnerPaths } from "./learnerPaths";
import { ASSESSMENT_TYPE } from "./learnerUtils";

const when = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const StatusSteps = ({ data }: { data: Submission }) => {
  const sub = data.submission!;
  const graded = sub.status === "GRADED" || sub.status === "RETURNED";
  const steps = [
    { k: "Submitted", v: when(sub.submittedAt), done: true },
    { k: "Being graded", v: graded ? "Done" : "Your instructor is reviewing it", done: graded },
    { k: "Grade released", v: graded ? when(sub.gradedAt) : "You'll be notified", done: graded },
  ];
  return (
    <Panel title="Status" bodyClassName="flex flex-col p-4">
      {steps.map((t, i) => (
        <div key={t.k} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={
                t.done
                  ? "mt-0.5 size-3.5 flex-none rounded-full border-2 border-green-600 bg-green-600"
                  : "mt-0.5 size-3.5 flex-none rounded-full border-2 border-gray-300 bg-white"
              }
            />
            {i < steps.length - 1 && (
              <span className={t.done && steps[i + 1].done ? "min-h-7 w-0.5 flex-1 bg-green-600" : "min-h-7 w-0.5 flex-1 bg-gray-200"} />
            )}
          </div>
          <div className="pb-3.5">
            <p className="text-sm font-semibold text-primary">{t.k}</p>
            <p className="text-[13px] text-mainGray">{t.v}</p>
          </div>
        </div>
      ))}
    </Panel>
  );
};

const LearnerSubmission = () => {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const { data, loading, error, refetch } = useFetch(api.fetch.fetchLearnerSubmission, { topicId });
  const s = data?.data ?? null;

  const crumbs = (
    <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1 text-[13px] text-mainGray">
      <Link to={learnerPaths.assignments} className="hover:text-primary hover:underline">
        Assignments
      </Link>
      <span>/</span>
      <span className="font-medium text-primary">{s?.name ?? "Submission"}</span>
    </nav>
  );

  if (error && !s) {
    return (
      <div className="flex flex-col gap-4">
        {crumbs}
        <LoadError msg="We could not load this submission." onRetry={() => refetch()} />
      </div>
    );
  }
  if (!s) return loading ? null : <EmptyBlock msg="Submission not found." />;

  const sub = s.submission;
  const graded = !!sub && (sub.status === "GRADED" || sub.status === "RETURNED");
  const score = s.progress && graded ? Math.round(s.progress.score) : null;
  const passed = s.progress?.status === "PASS";
  const fileUrl = safeHttpUrl(sub?.fileUrl);
  const attemptsLeft = s.maxAttempts !== null ? Math.max(0, s.maxAttempts - s.attemptsUsed) : null;

  return (
    <div className="flex flex-col gap-5">
      {crumbs}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] text-mainGray">
            {[ASSESSMENT_TYPE[s.type] ?? "Assessment", s.moduleTitle].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-2xl font-bold text-primary">{s.name}</h1>
          {sub && (
            <p className="text-sm text-primaryGray">
              Submitted {when(sub.submittedAt)} · attempt {sub.attempt}
              {s.maxAttempts !== null && ` of ${s.maxAttempts}`}
            </p>
          )}
        </div>
        {graded && score !== null ? (
          <div
            className={
              passed
                ? "flex items-baseline gap-1.5 rounded-xl bg-green-50 px-4 py-3 text-green-800"
                : "flex items-baseline gap-1.5 rounded-xl bg-red-50 px-4 py-3 text-red-800"
            }
          >
            <span className="text-3xl font-bold leading-none">{score}%</span>
            <span className="text-sm font-semibold">{passed ? "Passed" : "Below pass mark"}</span>
          </div>
        ) : sub ? (
          <Pill tone="blue">Submitted · awaiting grade</Pill>
        ) : null}
      </div>

      {!sub ? (
        <EmptyBlock
          msg="You have not submitted this assignment yet."
          action={
            <Btn variant="primary" to={learnerPaths.program(s.programId)}>
              Go to assignment
            </Btn>
          }
        />
      ) : (
        <>
          {graded && (
            <section className="flex items-start gap-3.5 rounded-xl border border-gray-200 bg-white p-4 md:p-6">
              <span
                aria-hidden
                className="flex size-10 flex-none items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white"
              >
                {initials(sub.gradedByName ?? "Instructor")}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[13px] text-mainGray">
                  {sub.gradedByName ? `Feedback from ${sub.gradedByName}` : "Instructor feedback"} ·{" "}
                  {when(sub.gradedAt)}
                </p>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-primary">
                  {sub.feedback || (s.type === "assignment" ? "Auto-graded quiz." : "No written feedback.")}
                </p>
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
              {s.quiz ? (
                <Panel title="Your answers">
                  {s.quiz.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 border-t border-gray-100 px-4 py-3.5 first:border-0 md:px-6"
                    >
                      <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-[#F3F5FA] text-[13px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-[15px] font-semibold text-primary">{q.prompt}</p>
                        <p className="text-sm text-primaryGray">
                          Your answer: <b>{q.yours ?? "No answer"}</b>
                        </p>
                        {!q.isCorrect && q.correct && (
                          <p className="text-sm text-green-800">
                            Correct answer: <b>{q.correct}</b>
                          </p>
                        )}
                      </div>
                      <Pill tone={q.isCorrect ? "green" : "red"}>{q.isCorrect ? "1 / 1" : "0 / 1"}</Pill>
                    </div>
                  ))}
                  {s.quiz.some((q) => !q.isCorrect && !q.correct) && attemptsLeft !== 0 && (
                    <p className="border-t border-gray-100 px-4 py-3 text-[13px] text-mainGray md:px-6">
                      Correct answers are shown once you pass or use every attempt
                      {attemptsLeft !== null ? ` (${attemptsLeft} left)` : ""}.
                    </p>
                  )}
                </Panel>
              ) : (
                <Panel title="Your submission" bodyClassName="flex flex-col gap-3 p-4 md:p-6">
                  {s.prompt && (
                    <p className="border-l-[3px] border-[#9A5D1A] bg-[#FFFDF8] px-4 py-3 text-sm text-primaryGray">
                      {s.prompt}
                    </p>
                  )}
                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start text-sm font-medium text-primary underline"
                    >
                      Open your submitted file
                    </a>
                  ) : (
                    <p className="text-sm text-primaryGray">No file attached.</p>
                  )}
                  {!graded && attemptsLeft !== 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                      <p className="text-[13px] text-mainGray">
                        You can resubmit from the program
                        {attemptsLeft !== null ? ` (${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left)` : ""}.
                      </p>
                      <Btn to={learnerPaths.program(s.programId)}>Edit submission</Btn>
                    </div>
                  )}
                </Panel>
              )}
            </div>

            <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-6">
              {!graded && <StatusSteps data={s} />}
              {s.rubric && (
                <Panel title="Rubric" bodyClassName="flex flex-col gap-3 p-4">
                  {s.rubric.map((r) => (
                    <div key={r.label} className="flex flex-col gap-1.5">
                      <div className="flex justify-between gap-2 text-sm">
                        <span>{r.label}</span>
                        <b>{r.level ?? "—"}</b>
                      </div>
                      <ProgressBar value={(r.factor ?? 0) * 100} />
                    </div>
                  ))}
                  {s.rubricScore !== null && (
                    <div className="flex justify-between border-t border-gray-100 pt-2.5 text-[15px]">
                      <span className="font-semibold">Total</span>
                      <b>{s.rubricScore}%</b>
                    </div>
                  )}
                </Panel>
              )}
              <Btn to={learnerPaths.program(s.programId)}>Back to program</Btn>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default LearnerSubmission;
