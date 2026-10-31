import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type {
  BankQuestion,
  BankQuestionPayload,
  Difficulty,
  QuestionOption,
  QuestionType,
} from "@/utils/api/ministrySchool/interfaces";
import { useMemo, useState } from "react";
import { runAction } from "../runAction";
import { makeId } from "../somUtils";
import { Btn, EmptyBlock, Panel, Pill, SimpleTable, type Tone } from "../ui";

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / false",
  SHORT_ANSWER: "Short answer",
  ESSAY: "Essay",
};
const TYPE_TONE: Record<QuestionType, Tone> = {
  MULTIPLE_CHOICE: "indigo",
  TRUE_FALSE: "cyan",
  SHORT_ANSWER: "green",
  ESSAY: "fuchsia",
};
const DIFF_TONE: Record<Difficulty, Tone> = { EASY: "green", MEDIUM: "amber", HARD: "red" };
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const newOption = (): QuestionOption => ({ id: makeId(), text: "" });
const field = "h-10 w-full rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";

type Draft = {
  id?: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  correct: string;
  tags: string;
  difficulty: Difficulty;
};

const emptyDraft = (): Draft => {
  const options = [newOption(), newOption()];
  return { type: "MULTIPLE_CHOICE", prompt: "", options, correct: options[0].id, tags: "", difficulty: "MEDIUM" };
};

export const QuestionBank = ({ canManage }: { canManage: boolean }) => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<QuestionType | "">("");
  const [tag, setTag] = useState("");
  const { data, loading, refetch } = useFetch(api.fetch.fetchQuestionBank);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const all = useMemo(() => data?.data ?? [], [data]);
  const tags = useMemo(() => Array.from(new Set(all.flatMap((q) => q.tags ?? []))).sort(), [all]);
  const rows = all.filter(
    (q) =>
      (!type || q.type === type) &&
      (!tag || (q.tags ?? []).includes(tag)) &&
      (!search.trim() || q.prompt.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const edit = (q: BankQuestion) =>
    setDraft({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options?.length ? q.options : [newOption(), newOption()],
      correct: q.correct_option_id ?? "",
      tags: (q.tags ?? []).join(", "),
      difficulty: q.difficulty,
    });

  const save = async () => {
    if (!draft) return;
    const payload: BankQuestionPayload = {
      type: draft.type,
      prompt: draft.prompt.trim(),
      difficulty: draft.difficulty,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      ...(draft.type === "MULTIPLE_CHOICE"
        ? { options: draft.options.filter((o) => o.text.trim()), correct_option_id: draft.correct }
        : draft.type === "TRUE_FALSE"
          ? { correct_option_id: draft.correct === "false" ? "false" : "true" }
          : {}),
    };
    setSaving(true);
    const ok = await runAction(
      () => (draft.id ? api.put.updateBankQuestion(payload, { id: String(draft.id) }) : api.post.createBankQuestion(payload)),
      { success: draft.id ? "Question updated" : "Question added", failure: "Could not save the question" }
    );
    setSaving(false);
    if (ok) {
      setDraft(null);
      refetch();
    }
  };

  const remove = (q: BankQuestion) =>
    showDeleteDialog({ name: "this question", id: q.id }, async () => {
      if (await runAction(() => api.delete.deleteBankQuestion({ id: String(q.id) }), { success: "Question deleted", failure: "Could not delete" })) refetch();
    });

  const canSave =
    draft &&
    draft.prompt.trim() &&
    (draft.type !== "MULTIPLE_CHOICE" ||
      (draft.options.filter((o) => o.text.trim()).length >= 2 &&
        draft.options.some((o) => o.id === draft.correct && o.text.trim())));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search questions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-lg border border-lightGray bg-white px-3 text-sm"
        />
        <select
          aria-label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType | "")}
          className="h-9 rounded-lg border border-lightGray bg-white px-2 text-sm"
        >
          <option value="">All types</option>
          {Object.entries(QUESTION_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select aria-label="Tag" value={tag} onChange={(e) => setTag(e.target.value)} className="h-9 rounded-lg border border-lightGray bg-white px-2 text-sm">
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {canManage && (
          <Btn size="sm" variant="primary" className="ml-auto" onClick={() => setDraft(emptyDraft())}>
            + Question
          </Btn>
        )}
      </div>

      {loading && !data ? (
        <SkeletonLoader />
      ) : (
        <Panel>
          <SimpleTable<BankQuestion>
            rows={rows}
            rowKey={(q) => q.id}
            minWidth={720}
            onRowClick={canManage ? edit : undefined}
            empty={<EmptyBlock msg={all.length ? "No questions match these filters." : "The question bank is empty. Add questions to reuse them across quizzes."} />}
            columns={[
              { key: "q", header: "Question", className: "max-w-[420px]", render: (q) => <span className="line-clamp-2">{q.prompt}</span> },
              { key: "t", header: "Type", render: (q) => <Pill tone={TYPE_TONE[q.type]}>{QUESTION_TYPE_LABEL[q.type]}</Pill> },
              {
                key: "tags",
                header: "Tags",
                render: (q) => (
                  <div className="flex flex-wrap gap-1">
                    {(q.tags ?? []).map((t) => (
                      <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-primaryGray">
                        {t}
                      </span>
                    ))}
                  </div>
                ),
              },
              { key: "d", header: "Difficulty", render: (q) => <Pill tone={DIFF_TONE[q.difficulty]}>{titleCase(q.difficulty)}</Pill> },
              ...(canManage
                ? [
                    {
                      key: "a",
                      header: <span className="sr-only">Actions</span>,
                      className: "text-right",
                      render: (q: BankQuestion) => (
                        <span onClick={(e) => e.stopPropagation()}>
                          <Btn size="sm" className="text-red-700" onClick={() => remove(q)}>
                            Delete
                          </Btn>
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          <p className="border-t border-gray-100 px-4 py-2 text-xs text-mainGray">
            Multiple-choice and true/false questions can be added to quizzes from a program’s Assessments tab. Adding copies the
            question, so later edits here don’t change quizzes already in use.
          </p>
        </Panel>
      )}

      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} className="!max-w-xl" title="Question">
        {draft && (
          <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5">
            <h3 className="text-lg font-semibold text-primary">{draft.id ? "Edit question" : "New question"}</h3>
            <div className="grid gap-3 tablet:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Type</span>
                <select
                  className={field}
                  value={draft.type}
                  onChange={(e) => {
                    const t = e.target.value as QuestionType;
                    setDraft({ ...draft, type: t, correct: t === "TRUE_FALSE" ? "true" : draft.options[0]?.id ?? "" });
                  }}
                >
                  {Object.entries(QUESTION_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Difficulty</span>
                <select className={field} value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Question</span>
              <textarea
                rows={3}
                value={draft.prompt}
                onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                className="rounded-lg border border-lightGray bg-inputBackground px-3 py-2 text-sm text-primary"
              />
            </label>

            {draft.type === "MULTIPLE_CHOICE" && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-primary">Options (select the correct one)</legend>
                {draft.options.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      aria-label={`Option ${i + 1} is correct`}
                      checked={draft.correct === o.id}
                      onChange={() => setDraft({ ...draft, correct: o.id })}
                    />
                    <input
                      className={field}
                      placeholder={`Option ${i + 1}`}
                      value={o.text}
                      onChange={(e) =>
                        setDraft({ ...draft, options: draft.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })
                      }
                    />
                    <button
                      type="button"
                      aria-label={`Remove option ${i + 1}`}
                      disabled={draft.options.length <= 2}
                      onClick={() => setDraft({ ...draft, options: draft.options.filter((x) => x.id !== o.id) })}
                      className="px-2 text-lg text-mainGray hover:text-red-700 disabled:opacity-30"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {draft.options.length < 6 && (
                  <Btn size="sm" className="self-start" onClick={() => setDraft({ ...draft, options: [...draft.options, newOption()] })}>
                    + Option
                  </Btn>
                )}
              </fieldset>
            )}

            {draft.type === "TRUE_FALSE" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Correct answer</span>
                <select className={`${field} w-40`} value={draft.correct} onChange={(e) => setDraft({ ...draft, correct: e.target.value })}>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Tags (comma separated)</span>
              <input className={field} value={draft.tags} placeholder="Leadership, Module 1" onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
            </label>

            <div className="flex justify-end gap-2">
              <Btn onClick={() => setDraft(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={!canSave || saving} onClick={save}>
                Save question
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuestionBank;
