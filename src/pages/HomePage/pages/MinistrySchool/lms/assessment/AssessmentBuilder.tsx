import { Modal } from "@/components/Modal";
import { STALE, useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showConfirmDialog, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type {
  AssessmentLatePolicy,
  AssessmentShowAnswers,
  AssessmentStatus,
  AssignmentOption,
  AssignmentQuestion,
  AssignmentQuestionType,
  DueRule,
  Rubric,
  Topic,
  Weekday,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import DOMPurify from "dompurify";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { runAction } from "../runAction";
import { describeRule, somPaths, unitLabel } from "../somUtils";
import { Banner, Btn, EmptyBlock, Panel, Pill, QUESTION_TONE, WorkspaceHeader } from "../ui";

/** The learning-unit shape read off a topic — richer than the public union type. */
type UnitShape = {
  type?: string;
  rubricId?: number | null;
  due_rule?: DueRule | null;
  data?: {
    questions?: (AssignmentQuestion & { bankQuestionId?: number })[];
    question?: string;
    passMark?: number;
    maxAttempts?: number;
    maxAttempt?: number;
    weight?: string;
    status?: AssessmentStatus;
    timeLimit?: number | null;
    latePolicy?: AssessmentLatePolicy;
    showAnswers?: AssessmentShowAnswers;
    shuffle?: boolean;
  };
};

const unitOf = (t: Topic) => (t.LearningUnit ?? t.learningUnit) as unknown as UnitShape | undefined;

const QUESTION_TYPES: { value: AssignmentQuestionType; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" },
  { value: "TRUE_FALSE", label: "True / false" },
  { value: "SHORT_ANSWER", label: "Short answer" },
  { value: "ESSAY", label: "Essay" },
];
const TIME_LIMITS = ["None", "10 min", "20 min", "30 min", "60 min", "90 min"];
const ATTEMPTS = ["1", "2", "3", "Unlimited"];
const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AFTER_DAYS = [3, 5, 7, 10, 14, 21];
const UNLIMITED = 99;

const isOpen = (t?: AssignmentQuestionType) => t === "SHORT_ANSWER" || t === "ESSAY";
const uid = () => crypto.randomUUID();
const blankOption = (): AssignmentOption => ({ id: uid(), text: "" });
const tfOptions = (): AssignmentOption[] => [
  { id: "true", text: "True" },
  { id: "false", text: "False" },
];
const newQuestion = (type: AssignmentQuestionType): AssignmentQuestion => ({
  id: uid(),
  type,
  question: "",
  points: 1,
  options:
    type === "MULTIPLE_CHOICE"
      ? [blankOption(), blankOption(), blankOption(), blankOption()]
      : type === "TRUE_FALSE"
        ? tfOptions()
        : [],
  correctOptionId: null,
});

/** Map stored maxAttempts ⇄ the select's string value. */
const attemptsToValue = (n?: number) => (!n || n >= UNLIMITED ? "Unlimited" : String(n));
const valueToAttempts = (v: string) => (v === "Unlimited" ? UNLIMITED : Number(v) || 1);
const timeToValue = (n?: number | null) => (n ? `${n} min` : "None");
const valueToTime = (v: string) => (v === "None" ? null : Number(v.replace(/\D/g, "")) || null);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-primary">{label}</span>
    {children}
  </label>
);

const selectClass = "h-10 w-full rounded-lg border border-lightGray bg-white px-2.5 text-sm text-primary";
const inputClass = "h-10 w-full rounded-lg border border-lightGray bg-white px-3 text-sm text-primary";

/**
 * Assessment builder — full editor for one quiz/essay unit, matching the SoM LMS
 * prototype. Edits questions and settings inline, saves through the topic + unit
 * endpoints, and publishes/unpublishes the assessment (draft hides it from learners).
 */
export const AssessmentBuilder = () => {
  const { id, topicId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useFetch(api.fetch.fetchProgramById, { id: String(id) }, false, { staleTime: STALE.reference });
  const { data: rubricData } = useFetch(api.fetch.fetchRubrics, undefined, false, { staleTime: STALE.reference });
  const { data: bankData } = useFetch(api.fetch.fetchQuestionBank, undefined, false, { staleTime: STALE.reference });
  const [bankOpen, setBankOpen] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);

  const detail = data?.data;
  const topic = (detail?.topics ?? []).find((t) => Number(t.id) === Number(topicId));
  const unit = topic ? unitOf(topic) : undefined;
  const isQuiz = unit?.type === "assignment";
  const passMark = unit?.data?.passMark ?? (detail as { pass_mark?: number } | undefined)?.pass_mark ?? 50;
  const rubrics: Rubric[] = rubricData?.data ?? [];
  const weekOptions = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 1), []);

  // ── editable state, hydrated from the unit ────────────────────────────────
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [prompt, setPrompt] = useState("");
  const [rubricId, setRubricId] = useState<number | null>(null);
  const [weight, setWeight] = useState("");
  const [attempts, setAttempts] = useState("2");
  const [timeLimit, setTimeLimit] = useState("None");
  const [latePolicy, setLatePolicy] = useState<AssessmentLatePolicy>("lock");
  const [showAnswers, setShowAnswers] = useState<AssessmentShowAnswers>("after_due");
  const [shuffle, setShuffle] = useState(false);
  const [status, setStatus] = useState<AssessmentStatus>("published");
  const [dueMode, setDueMode] = useState<"day" | "after">("day");
  const [dueWeek, setDueWeek] = useState(1);
  const [dueDay, setDueDay] = useState<Weekday>("Fri");
  const [dueDays, setDueDays] = useState(7);

  // Hydrate once per topic/version so local edits are not clobbered on refetch.
  const hydrateKey = `${topicId}:${unit?.data?.status ?? ""}:${(unit?.data?.questions ?? []).length}`;
  const [hydrated, setHydrated] = useState<string | null>(null);
  useEffect(() => {
    if (!unit || hydrated === hydrateKey) return;
    const d = unit.data ?? {};
    setQuestions(
      (d.questions ?? []).map((q) => ({
        id: q.id ?? uid(),
        type: q.type ?? "MULTIPLE_CHOICE",
        question: q.question ?? "",
        points: Number(q.points) || 1,
        options: Array.isArray(q.options) ? q.options.map((o) => ({ id: o.id ?? uid(), text: o.text ?? "" })) : [],
        correctOptionId: q.correctOptionId ?? null,
      }))
    );
    setPrompt(String(d.question ?? ""));
    setRubricId(unit.rubricId ?? null);
    setWeight(String(d.weight ?? ""));
    setAttempts(attemptsToValue(Number(d.maxAttempts ?? d.maxAttempt) || undefined));
    setTimeLimit(timeToValue(d.timeLimit));
    setLatePolicy(d.latePolicy ?? "lock");
    setShowAnswers(d.showAnswers ?? "after_due");
    setShuffle(Boolean(d.shuffle));
    setStatus(d.status ?? "published");
    const rule = unit.due_rule;
    if (rule && rule.mode === "after") {
      setDueMode("after");
      setDueWeek(rule.week ?? 1);
      setDueDays(rule.days ?? 7);
    } else if (rule && rule.mode === "day") {
      setDueMode("day");
      setDueWeek(rule.week ?? 1);
      setDueDay(rule.day ?? "Fri");
    }
    setHydrated(hydrateKey);
  }, [unit, hydrateKey, hydrated]);

  if (!detail && loading) return <SkeletonLoader />;

  if (!detail || !topic || !unit || (unit.type !== "assignment" && unit.type !== "assignment-essay")) {
    return (
      <div className="app-page-padding">
        <EmptyBlock
          msg="This assessment could not be found."
          action={<Btn to={somPaths.program(Number(id), "Assessments")}>Back to assessments</Btn>}
        />
      </div>
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
  const bank = (bankData?.data ?? []).filter((q) => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE");

  // ── question editing ──────────────────────────────────────────────────────
  const patchQuestion = (index: number, patch: Partial<AssignmentQuestion>) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const changeType = (index: number, type: AssignmentQuestionType) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === index
          ? {
              ...q,
              type,
              options: type === "MULTIPLE_CHOICE" ? (q.options.length ? q.options : [blankOption(), blankOption(), blankOption(), blankOption()]) : type === "TRUE_FALSE" ? tfOptions() : [],
              correctOptionId: type === "TRUE_FALSE" ? "true" : null,
            }
          : q
      )
    );

  const patchOption = (qi: number, oi: number, text: string) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, text } : o)) } : q)));

  const move = (index: number, dir: -1 | 1) =>
    setQuestions((qs) => {
      const next = [...qs];
      const to = index + dir;
      if (to < 0 || to >= next.length) return qs;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  // ── save / publish / delete ───────────────────────────────────────────────
  const buildDueRule = (): DueRule =>
    dueMode === "after" ? { week: dueWeek, mode: "after", days: dueDays } : { week: dueWeek, mode: "day", day: dueDay };

  const validForPublish = () => {
    if (isQuiz) {
      if (!questions.length) return "Add at least one question before publishing.";
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) return `Question ${i + 1} needs prompt text.`;
        if (q.type === "MULTIPLE_CHOICE") {
          const filled = q.options.filter((o) => o.text.trim());
          if (filled.length < 2) return `Question ${i + 1} needs at least two options.`;
          if (!q.options.some((o) => o.id === q.correctOptionId && o.text.trim())) return `Question ${i + 1} needs a correct answer.`;
        }
        if (q.type === "TRUE_FALSE" && !q.correctOptionId) return `Question ${i + 1} needs a correct answer.`;
      }
      return null;
    }
    return prompt.trim() ? null : "Add the essay prompt before publishing.";
  };

  const buildTopicPayload = (nextStatus: AssessmentStatus) => {
    const maxAttempts = valueToAttempts(attempts);
    const common = {
      maxAttempts,
      passMark,
      weight,
      timeLimit: valueToTime(timeLimit),
      latePolicy,
      showAnswers,
      shuffle,
      status: nextStatus,
    };
    const unitData = isQuiz
      ? {
          ...common,
          questions: questions.map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question.trim(),
            points: Math.max(1, Number(q.points) || 1),
            options: isOpen(q.type) ? [] : q.options.filter((o) => o.text.trim() || o.id === "true" || o.id === "false"),
            correctOptionId: q.correctOptionId,
          })),
        }
      : { ...common, question: prompt.trim() };

    return {
      id: Number(topicId),
      name: topic.name,
      description: String(topic.description ?? ""),
      programId: Number(id),
      type: unit.type,
      learningUnit: { type: unit.type, maxAttempts, data: unitData },
    };
  };

  const persist = async (nextStatus: AssessmentStatus) => {
    await api.put.updateTopic(buildTopicPayload(nextStatus), { id: String(topicId) });
    await api.put.updateUnitSettings({ topicId: Number(topicId), due_rule: buildDueRule() });
    if (!isQuiz) await api.put.setUnitRubric({ topicId: Number(topicId), rubricId });
  };

  const save = async (nextStatus: AssessmentStatus) => {
    if (nextStatus === "published") {
      const problem = validForPublish();
      if (problem) {
        showNotification(problem, "error");
        return;
      }
    }
    setSaving(true);
    const ok = await runAction(() => persist(nextStatus), {
      success: nextStatus === "published" ? "Assessment published" : status === "published" ? "Assessment unpublished" : "Assessment saved",
      failure: "Could not save the assessment",
    });
    setSaving(false);
    if (ok) {
      setStatus(nextStatus);
      setHydrated(null);
      refetch?.();
    }
  };

  const addFromBank = async () => {
    if (!picked.length) return;
    setSaving(true);
    const ok = await runAction(
      async () => {
        // Persist current edits first so bank questions append to the latest set.
        await persist(status);
        await api.post.addBankQuestionsToUnit({ topicId: Number(topicId), questionIds: picked });
      },
      { success: "Questions added", failure: "Could not add questions" }
    );
    setSaving(false);
    if (ok) {
      setBankOpen(false);
      setPicked([]);
      setHydrated(null);
      refetch?.();
    }
  };

  const remove = () =>
    showConfirmDialog(
      `Delete “${topic.name}”?`,
      async () => {
        const ok = await runAction(() => api.delete.deleteTopic({ id: String(topicId) }), {
          success: "Assessment deleted",
          failure: "Could not delete the assessment",
        });
        if (ok) navigate(somPaths.program(Number(id), "Assessments"));
      },
      { confirmLabel: "Delete", tone: "danger", points: ["Submissions linked to this assessment are removed."] }
    );

  // ── render ────────────────────────────────────────────────────────────────
  const questionCard = (q: AssignmentQuestion, index: number) => (
    <div key={q.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2.5">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-primaryGray">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <Field label="Type">
            <select className={selectClass} value={q.type ?? "MULTIPLE_CHOICE"} onChange={(e) => changeType(index, e.target.value as AssignmentQuestionType)}>
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="w-20 flex-none">
          <Field label="Points">
            <input type="number" min={1} max={100} className={inputClass} value={q.points ?? 1} onChange={(e) => patchQuestion(index, { points: Number(e.target.value) || 1 })} />
          </Field>
        </div>
        <div className="flex flex-none items-center gap-1 pb-0.5">
          <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)} className="h-9 w-9 rounded-lg border border-gray-200 text-primaryGray disabled:opacity-30 hover:bg-gray-50">
            ↑
          </button>
          <button type="button" aria-label="Move down" disabled={index === questions.length - 1} onClick={() => move(index, 1)} className="h-9 w-9 rounded-lg border border-gray-200 text-primaryGray disabled:opacity-30 hover:bg-gray-50">
            ↓
          </button>
          <button type="button" aria-label="Remove question" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== index))} className="h-9 w-9 rounded-lg border border-gray-200 text-lg leading-none text-primaryGray hover:border-red-200 hover:bg-red-50 hover:text-red-700">
            ×
          </button>
        </div>
      </div>

      <Field label="Question">
        <textarea rows={2} className="w-full rounded-lg border border-lightGray px-3 py-2 text-sm text-primary" placeholder="Type the question learners will see" value={q.question} onChange={(e) => patchQuestion(index, { question: e.target.value })} />
      </Field>

      {q.type === "MULTIPLE_CHOICE" && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-primary">Options · select the correct one</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => (
              <div key={o.id} className="flex items-center gap-2">
                <input type="radio" name={`correct-${q.id}`} aria-label={`Mark option ${oi + 1} correct`} checked={q.correctOptionId === o.id} onChange={() => patchQuestion(index, { correctOptionId: o.id })} className="accent-primary" />
                <input className="h-9 min-w-0 flex-1 rounded-md border border-lightGray px-2.5 text-sm" placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={o.text} onChange={(e) => patchOption(index, oi, e.target.value)} />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => patchQuestion(index, { options: [...q.options, blankOption()] })} className="self-start text-xs font-semibold text-primary hover:underline">
            + Add option
          </button>
        </div>
      )}

      {q.type === "TRUE_FALSE" && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-primary">Correct answer</p>
          <div className="flex gap-4">
            {tfOptions().map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm text-primary">
                <input type="radio" name={`tf-${q.id}`} checked={q.correctOptionId === o.id} onChange={() => patchQuestion(index, { correctOptionId: o.id })} className="accent-primary" />
                {o.text}
              </label>
            ))}
          </div>
        </div>
      )}

      {isOpen(q.type) && (
        <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-primaryGray">
          Learners type their answer. It goes to the grading queue for the instructor.
        </p>
      )}
    </div>
  );

  const editMain = isQuiz ? (
    <Panel
      title={`Questions (${questions.length})`}
      action={
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => { setPicked([]); setBankOpen(true); }}>
            + From bank
          </Btn>
          <Btn size="sm" variant="primary" onClick={() => setQuestions((qs) => [...qs, newQuestion("MULTIPLE_CHOICE")])}>
            + New question
          </Btn>
        </div>
      }
    >
      {questions.length ? (
        <div className="flex flex-col gap-3 p-4">{questions.map(questionCard)}</div>
      ) : (
        <EmptyBlock
          msg="No questions yet. Add some from the question bank or write a new one."
          action={
            <Btn size="sm" variant="primary" onClick={() => setQuestions([newQuestion("MULTIPLE_CHOICE")])}>
              + New question
            </Btn>
          }
        />
      )}
    </Panel>
  ) : (
    <Panel title="Essay prompt">
      <div className="flex flex-col gap-4 p-4">
        <textarea rows={5} className="w-full rounded-lg border border-lightGray px-3 py-2 text-sm text-primary" placeholder="Write the prompt learners respond to" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Field label="Rubric">
          <select className={selectClass} value={rubricId ?? ""} onChange={(e) => setRubricId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">No rubric · score out of 100</option>
            {rubrics.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Panel>
  );

  const previewBody = (
    <>
      <Banner tone="preview" title="Previewing as a learner">
        This is what learners see. Answers here are not saved.
      </Banner>
      {isQuiz ? (
        questions.length ? (
          <Panel title={`Questions (${questions.length}) · ${totalPoints} points`}>
            <ol className="flex flex-col divide-y divide-gray-100">
              {questions.map((q, idx) => (
                <li key={q.id} className="flex flex-col gap-2.5 px-4 py-3.5">
                  <p className="text-sm font-medium text-primary">
                    {idx + 1}. {q.question || "Untitled question"}
                  </p>
                  {isOpen(q.type) ? (
                    <input disabled placeholder="Your answer" className="h-10 w-full rounded-lg border border-lightGray px-3 text-sm disabled:bg-gray-50" />
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {q.options.map((o) => (
                        <label key={o.id} className="flex items-center gap-2 text-sm text-primary">
                          <input type="radio" name={`preview-${q.id}`} disabled className="accent-primary" />
                          {o.text}
                        </label>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
        ) : (
          <EmptyBlock msg="Add questions to preview this assessment." />
        )
      ) : (
        <Panel title="Essay">
          <div className="flex flex-col gap-3 p-4">
            {prompt ? (
              <div className="prose max-w-none text-sm text-primaryGray" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prompt) }} />
            ) : (
              <p className="text-sm text-mainGray">No prompt set yet.</p>
            )}
            <textarea rows={6} disabled placeholder="Write your response here…" className="block w-full rounded-lg border border-lightGray px-3 py-2 text-sm disabled:bg-gray-50" />
            <p className="text-xs text-mainGray">{rubricId ? "Graded with the selected rubric." : "Graded 0–100."}</p>
          </div>
        </Panel>
      )}
    </>
  );

  const settingsAside = (
    <Panel title="Settings">
      <div className="flex flex-col gap-3.5 p-4 text-sm">
        {isQuiz && (
          <div className="flex items-center justify-between">
            <span className="text-primaryGray">Questions</span>
            <b className="text-primary">
              {questions.length} · {totalPoints} pts
            </b>
          </div>
        )}
        <Field label="Counts toward final grade">
          <input className={inputClass} placeholder="e.g. 10%" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Attempts">
            <select className={selectClass} value={attempts} onChange={(e) => setAttempts(e.target.value)}>
              {ATTEMPTS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Time limit">
            <select className={selectClass} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}>
              {TIME_LIMITS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-primary">Due</p>
          <div className="flex gap-2">
            {(["day", "after"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDueMode(m)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium",
                  dueMode === m ? "border-primary bg-primary text-white" : "border-lightGray text-primaryGray hover:bg-gray-50"
                )}
              >
                {m === "day" ? "Day of the week" : "Days after it opens"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Week" className={selectClass} value={dueWeek} onChange={(e) => setDueWeek(Number(e.target.value))}>
              {weekOptions.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
            {dueMode === "day" ? (
              <select aria-label="Day" className={selectClass} value={dueDay} onChange={(e) => setDueDay(e.target.value as Weekday)}>
                {WEEKDAYS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            ) : (
              <select aria-label="Days after opening" className={selectClass} value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))}>
                {AFTER_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-xs text-mainGray">{describeRule(buildDueRule())}. Each cohort turns this into a calendar date from its start date.</p>
        </div>

        <Field label="Late submissions">
          <select className={selectClass} value={latePolicy} onChange={(e) => setLatePolicy(e.target.value as AssessmentLatePolicy)}>
            <option value="accept">Accept, no penalty</option>
            <option value="penalty">Accept with 10% penalty</option>
            <option value="lock">Lock after due date</option>
          </select>
        </Field>
        <Field label="Show correct answers">
          <select className={selectClass} value={showAnswers} onChange={(e) => setShowAnswers(e.target.value as AssessmentShowAnswers)}>
            <option value="immediately">Immediately</option>
            <option value="after_due">After due date</option>
            <option value="never">Never</option>
          </select>
        </Field>
        <label className="flex items-center justify-between">
          <span className="font-medium text-primary">Shuffle questions</span>
          <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="h-4 w-4 accent-primary" />
        </label>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-primaryGray">Pass mark (from program)</span>
          <b className="text-primary">{passMark}%</b>
        </div>

        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Multiple choice and true/false grade automatically. Short answer and essay go to the grading queue.
        </p>

        <div className="mt-1 flex flex-col gap-2">
          <div className="flex gap-2">
            <Btn className="flex-1" disabled={saving} onClick={() => save(status)}>
              {saving ? "Saving…" : "Save"}
            </Btn>
            {status === "published" ? (
              <Btn className="flex-1" disabled={saving} onClick={() => save("draft")}>
                Unpublish
              </Btn>
            ) : (
              <Btn className="flex-1" variant="primary" disabled={saving} onClick={() => save("published")}>
                Publish
              </Btn>
            )}
          </div>
          <button type="button" onClick={remove} className="h-9 text-xs font-semibold text-red-700 hover:underline">
            Delete assessment
          </button>
        </div>
      </div>
    </Panel>
  );

  return (
    <>
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        crumbs={[
          { label: "Programs", to: somPaths.programs },
          { label: detail.title, to: somPaths.program(Number(id)) },
          { label: "Assessments", to: somPaths.program(Number(id), "Assessments") },
          { label: topic.name },
        ]}
        title={topic.name}
        status={unitLabel(unit.type)}
        actions={
          <div className="inline-flex gap-1">
            <Btn variant={mode === "edit" ? "onDarkSolid" : "onDark"} onClick={() => setMode("edit")}>
              Edit
            </Btn>
            <Btn variant={mode === "preview" ? "onDarkSolid" : "onDark"} onClick={() => setMode("preview")}>
              Preview as learner
            </Btn>
          </div>
        }
      />

      <div className="app-page-padding">
        <div className="mb-3 flex items-center gap-2">
          <Pill tone={QUESTION_TONE[isQuiz ? "Multiple choice" : "Essay"] ?? "gray"}>{unitLabel(unit.type)}</Pill>
          <Pill tone={status === "published" ? "green" : "amber"}>{status === "published" ? "Published" : "Draft"}</Pill>
        </div>
        {mode === "edit" ? (
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
            <div className="flex flex-col gap-4">{editMain}</div>
            <div className="flex flex-col gap-4">{settingsAside}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">{previewBody}</div>
        )}
      </div>
    </div>

    <Modal open={bankOpen} onClose={() => setBankOpen(false)} className="!max-w-2xl" title="Add from question bank">
      <div className="flex max-h-[85vh] flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold text-primary">Add to “{topic.name}”</h3>
          <p className="text-sm text-primaryGray">Multiple-choice and true/false questions only. Questions are copied into the quiz.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-200">
          {bank.length === 0 ? (
            <EmptyBlock msg="No usable questions in the bank yet." action={<Btn size="sm" to={somPaths.library}>Open library</Btn>} />
          ) : (
            <ul>
              {bank.map((q) => (
                <li key={q.id} className="border-b border-gray-100 last:border-0">
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={picked.includes(q.id)}
                      onChange={(e) => setPicked((p) => (e.target.checked ? [...p, q.id] : p.filter((x) => x !== q.id)))}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-primary">{q.prompt}</span>
                      <span className="text-xs text-mainGray">
                        {q.type === "TRUE_FALSE" ? "True / false" : "Multiple choice"} · {(q.tags ?? []).join(", ") || "No tags"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-mainGray">{picked.length} selected</span>
          <Btn onClick={() => setBankOpen(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={!picked.length || saving} onClick={addFromBank}>
            Add {picked.length || ""} question{picked.length === 1 ? "" : "s"}
          </Btn>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default AssessmentBuilder;
