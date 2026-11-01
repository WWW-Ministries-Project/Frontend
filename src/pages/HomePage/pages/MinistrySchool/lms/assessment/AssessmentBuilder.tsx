import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import type {
  AssignmentOption,
  AssignmentQuestion,
  DueRule,
  Rubric,
  Topic,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import DOMPurify from "dompurify";
import { ReactNode, useState } from "react";
import { useParams } from "react-router-dom";
import { describeRule, somPaths, unitLabel } from "../somUtils";
import {
  Banner,
  Btn,
  EmptyBlock,
  Panel,
  Pill,
  QUESTION_TONE,
  ToggleRow,
  WorkspaceHeader,
} from "../ui";

/** Quiz questions are copied from the bank, so they may also carry bankQuestionId. */
type QuizQuestion = AssignmentQuestion & { bankQuestionId?: number };

/** The learning-unit shape read off a topic — richer than the public union type. */
type UnitShape = {
  type?: string;
  rubricId?: number | null;
  due_rule?: DueRule | null;
  data?: {
    questions?: QuizQuestion[];
    question?: string;
    passMark?: number;
    maxAttempts?: number;
    maxAttempt?: number;
  };
};

const unitOf = (t: Topic) => (t.LearningUnit ?? t.learningUnit) as unknown as UnitShape | undefined;

type ViewQuestion = {
  id: string;
  prompt: string;
  isTrueFalse: boolean;
  options: AssignmentOption[];
  correctId: string | null;
};

/** Resolve the real stored question into options + the correct option id. */
const toViewQuestion = (q: QuizQuestion, index: number): ViewQuestion => {
  const options = Array.isArray(q.options) ? q.options : [];
  const correctId = q.correctOptionId ?? null;

  // True/false questions created directly carry two "True"/"False" options.
  const texts = options.map((o) => (o.text ?? "").trim().toLowerCase());
  const looksTrueFalse =
    options.length === 2 && texts.every((t) => t === "true" || t === "false");

  // Bank true/false questions may be stored with no options and a "true"/"false" id.
  if (!options.length && (correctId === "true" || correctId === "false")) {
    return {
      id: String(q.id ?? index),
      prompt: q.question ?? "",
      isTrueFalse: true,
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correctId,
    };
  }

  return {
    id: String(q.id ?? index),
    prompt: q.question ?? "",
    isTrueFalse: looksTrueFalse,
    options,
    correctId,
  };
};

const questionTypeLabel = (q: ViewQuestion) => (q.isTrueFalse ? "True / false" : "Multiple choice");

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="flex-shrink-0"
  >
    <path d="m5 12 5 5L20 6" />
  </svg>
);

const SettingRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
    <span className="text-primaryGray">{label}</span>
    <span className="font-medium text-primary">{children}</span>
  </div>
);

/**
 * Assessment builder — dedicated editor/preview surface for one assessment unit
 * (a quiz or essay topic). Reads :id (program) and :topicId from the route.
 *
 * Read/preview focused: editing the questions, rubric and due rules stays in the
 * Curriculum and Assessments modals, which this page links out to.
 */
export const AssessmentBuilder = () => {
  const { id, topicId } = useParams();
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const { data, loading } = useFetch(api.fetch.fetchProgramById, { id: String(id) });
  const { data: rubricData } = useFetch(api.fetch.fetchRubrics);

  const detail = data?.data;
  const topic = (detail?.topics ?? []).find((t) => Number(t.id) === Number(topicId));
  const unit = topic ? unitOf(topic) : undefined;

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

  const programTitle = detail.title;
  const assessmentName = topic.name;
  const isQuiz = unit.type === "assignment";
  const questions = (unit.data?.questions ?? []).map(toViewQuestion);
  const rubrics: Rubric[] = rubricData?.data ?? [];
  const rubric = unit.rubricId ? rubrics.find((r) => r.id === unit.rubricId) ?? null : null;

  const passMark =
    unit.data?.passMark !== undefined ? `${unit.data.passMark}%` : "Not set";
  const attempts = unit.data?.maxAttempts ?? unit.data?.maxAttempt;

  const questionListEdit = (
    <ul className="divide-y divide-gray-100">
      {questions.map((q, idx) => (
        <li key={q.id} className="flex flex-col gap-2.5 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-primary">Q{idx + 1}</span>
            <Pill tone={QUESTION_TONE[questionTypeLabel(q)] ?? "gray"}>{questionTypeLabel(q)}</Pill>
          </div>
          <p className="text-sm font-medium text-primary">{q.prompt || "Untitled question"}</p>
          <ul className="flex flex-col gap-1.5">
            {q.options.map((opt) => {
              const correct = opt.id === q.correctId;
              return (
                <li
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    correct
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 text-primary"
                  )}
                >
                  {correct && <CheckIcon />}
                  <span className="min-w-0 flex-1">{opt.text}</span>
                  {correct && <span className="text-xs font-semibold uppercase tracking-wide">Correct</span>}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );

  const editMain = isQuiz ? (
    <Panel
      title={`Questions (${questions.length})`}
      action={
        <Btn size="sm" to={somPaths.program(Number(id), "Assessments")}>
          + Add from bank
        </Btn>
      }
    >
      {questions.length ? (
        questionListEdit
      ) : (
        <EmptyBlock
          msg="No questions yet. Add some from the question bank."
          action={<Btn size="sm" to={somPaths.program(Number(id), "Assessments")}>Add from bank</Btn>}
        />
      )}
    </Panel>
  ) : (
    <Panel title="Essay prompt">
      <div className="flex flex-col gap-4 p-4">
        {unit.data?.question ? (
          <div
            className="prose max-w-none text-sm text-primaryGray"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(unit.data.question)) }}
          />
        ) : (
          <p className="text-sm text-mainGray">No prompt set yet.</p>
        )}

        <div className="rounded-xl border border-gray-200">
          <p className="border-b border-gray-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-mainGray">
            Rubric
          </p>
          {rubric ? (
            <div className="flex flex-col gap-2 p-4">
              <p className="text-sm font-medium text-primary">{rubric.title}</p>
              <ul className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
                {rubric.criteria.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                    <span className="text-primaryGray">{c.label}</span>
                    <span className="font-medium text-primary">{c.weight}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="px-4 py-3 text-sm text-amber-700">No rubric — scored 0–100</p>
          )}
        </div>
      </div>
    </Panel>
  );

  const settingsAside = (
    <Panel title="Settings">
      <div className="flex flex-col">
        <div className="divide-y divide-gray-100">
          <SettingRow label="Pass mark">{passMark}</SettingRow>
          <SettingRow label="Attempts">{attempts ?? "Not set"}</SettingRow>
          <SettingRow label="Due rule">
            <span className={unit.due_rule ? "" : "text-amber-700"}>{describeRule(unit.due_rule)}</span>
          </SettingRow>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 p-4">
          <ToggleRow
            title="Show correct answers after submit"
            description="Available after a backend update"
            checked={false}
            onChange={() => {}}
            disabled
          />
          <ToggleRow
            title="Shuffle questions"
            description="Available after a backend update"
            checked={false}
            onChange={() => {}}
            disabled
          />
        </div>

        <div className="border-t border-gray-100 p-4">
          <Btn size="sm" to={somPaths.program(Number(id), "Curriculum")}>
            Edit in curriculum
          </Btn>
        </div>
      </div>
    </Panel>
  );

  const previewBody = (
    <>
      <Banner tone="preview" title="Previewing as a learner">
        This is how this assessment appears to learners. It is not interactive here.
      </Banner>

      {isQuiz ? (
        <Panel title={`Questions (${questions.length})`}>
          {questions.length ? (
            <ol className="flex flex-col divide-y divide-gray-100">
              {questions.map((q, idx) => (
                <li key={q.id} className="flex flex-col gap-2.5 px-4 py-3.5">
                  <p className="text-sm font-medium text-primary">
                    {idx + 1}. {q.prompt || "Untitled question"}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 text-sm text-primary">
                        <input type="radio" name={`preview-${q.id}`} disabled className="accent-primary" />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyBlock msg="No questions to preview yet." />
          )}
        </Panel>
      ) : (
        <Panel title="Essay">
          <div className="flex flex-col gap-3 p-4">
            {unit.data?.question ? (
              <div
                className="prose max-w-none text-sm text-primaryGray"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(unit.data.question)) }}
              />
            ) : (
              <p className="text-sm text-mainGray">No prompt set yet.</p>
            )}
            <textarea
              rows={6}
              disabled
              placeholder="Write your response here…"
              className="block w-full rounded-lg border border-lightGray px-3 py-2 text-sm text-primaryGray disabled:bg-gray-50"
            />
            <p className="text-xs text-mainGray">
              {rubric ? `Graded with the “${rubric.title}” rubric.` : "Graded 0–100."}
            </p>
          </div>
        </Panel>
      )}
    </>
  );

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        crumbs={[
          { label: "Programs", to: somPaths.programs },
          { label: programTitle, to: somPaths.program(Number(id)) },
          { label: assessmentName },
        ]}
        title={assessmentName}
        status={unitLabel(unit.type)}
        actions={
          <div className="inline-flex gap-1">
            <Btn variant={mode === "edit" ? "onDarkSolid" : "onDark"} onClick={() => setMode("edit")}>
              Edit
            </Btn>
            <Btn
              variant={mode === "preview" ? "onDarkSolid" : "onDark"}
              onClick={() => setMode("preview")}
            >
              Preview as learner
            </Btn>
          </div>
        }
      />

      <div className="app-page-padding">
        {mode === "edit" ? (
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4">{editMain}</div>
            <div className="flex flex-col gap-4">{settingsAside}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">{previewBody}</div>
        )}
      </div>
    </div>
  );
};

export default AssessmentBuilder;
