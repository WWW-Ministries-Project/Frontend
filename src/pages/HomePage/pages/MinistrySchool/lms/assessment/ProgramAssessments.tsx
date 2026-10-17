import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { DueRule, Topic } from "@/utils/api/ministrySchool/interfaces";
import { useState } from "react";
import { runAction } from "../runAction";
import { describeRule, somPaths, unitLabel } from "../somUtils";
import { Btn, EmptyBlock, Panel, SimpleTable, StatusPill } from "../ui";

type UnitData = {
  type?: string;
  rubricId?: number | null;
  due_rule?: DueRule | null;
  data?: { questions?: { bankQuestionId?: number }[]; passMark?: number; maxAttempts?: number; maxAttempt?: number };
};

const unitOf = (t: Topic) => (t.LearningUnit ?? t.learningUnit) as unknown as UnitData | undefined;

/** Program → Assessments: quizzes and essays, question-bank import and rubric attachment. */
export const ProgramAssessments = ({
  topics,
  canManage,
  onChanged,
  onOpenCurriculum,
}: {
  topics: Topic[];
  canManage: boolean;
  onChanged: () => void;
  onOpenCurriculum: () => void;
}) => {
  // Both lists need manage access; view-only users never request them.
  const { data: rubricData } = useFetch(api.fetch.fetchRubrics, undefined, !canManage);
  const { data: bankData } = useFetch(api.fetch.fetchQuestionBank, undefined, !canManage);
  const [bankFor, setBankFor] = useState<Topic | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const closeBank = () => {
    setBankFor(null);
    setPicked([]);
  };

  const rubrics = rubricData?.data ?? [];
  const bank = (bankData?.data ?? []).filter((q) => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE");
  const assessments = topics.filter((t) => ["assignment", "assignment-essay"].includes(unitOf(t)?.type ?? ""));

  const setRubric = async (t: Topic, rubricId: number | null) => {
    setBusy(true);
    const ok = await runAction(() => api.put.setUnitRubric({ topicId: Number(t.id), rubricId }), {
      success: rubricId ? "Rubric attached" : "Rubric removed",
      failure: "Could not change the rubric",
    });
    setBusy(false);
    if (ok) onChanged();
  };

  const addFromBank = async () => {
    if (!bankFor || !picked.length) return;
    setBusy(true);
    let msg = "Questions added";
    const ok = await runAction(
      async () => {
        const res = await api.post.addBankQuestionsToUnit({ topicId: Number(bankFor.id), questionIds: picked });
        const r = res.data;
        if (r) msg = `Added ${r.added} question${r.added === 1 ? "" : "s"}${r.skipped ? ` (${r.skipped} already in this quiz)` : ""}`;
      },
      { failure: "Could not add questions" }
    );
    setBusy(false);
    if (ok) {
      showNotification(msg, "success");
      setBankFor(null);
      setPicked([]);
      onChanged();
    }
  };

  const alreadyIn = new Set(
    (bankFor ? unitOf(bankFor)?.data?.questions ?? [] : []).map((q) => q.bankQuestionId).filter(Boolean) as number[]
  );

  return (
    <>
      <Panel
        title="Assessments in this program"
        action={
          <div className="flex gap-2">
            <Btn size="sm" to={somPaths.library}>Assessment library</Btn>
            <Btn size="sm" onClick={onOpenCurriculum}>Edit in curriculum</Btn>
          </div>
        }
      >
        <SimpleTable<Topic>
          rows={assessments}
          rowKey={(t) => t.id}
          minWidth={820}
          empty={
            <EmptyBlock
              msg="No quizzes or essays yet. Add a quiz or essay unit in the curriculum."
              action={<Btn size="sm" onClick={onOpenCurriculum}>Open curriculum</Btn>}
            />
          }
          columns={[
            { key: "name", header: "Assessment", render: (t) => <span className="font-medium">{t.name}</span> },
            { key: "type", header: "Type", render: (t) => <StatusPill status={unitLabel(unitOf(t)?.type)} /> },
            {
              key: "qs",
              header: "Questions",
              render: (t) => (unitOf(t)?.type === "assignment" ? unitOf(t)?.data?.questions?.length ?? 0 : 1),
            },
            {
              key: "pass",
              header: "Pass mark",
              render: (t) => (unitOf(t)?.data?.passMark !== undefined ? `${unitOf(t)?.data?.passMark}%` : "—"),
            },
            {
              key: "due",
              header: "Due rule",
              render: (t) => (
                <span className={unitOf(t)?.due_rule ? "text-primaryGray" : "text-amber-700"}>{describeRule(unitOf(t)?.due_rule)}</span>
              ),
            },
            {
              key: "tools",
              header: "Questions / rubric",
              render: (t) => {
                const unit = unitOf(t);
                if (unit?.type === "assignment") {
                  return canManage ? (
                    <Btn
                      size="sm"
                      onClick={() => {
                        setPicked([]);
                        setBankFor(t);
                      }}
                    >
                      + From bank
                    </Btn>
                  ) : (
                    <span className="text-mainGray">—</span>
                  );
                }
                return (
                  <select
                    aria-label={`Rubric for ${t.name}`}
                    disabled={!canManage || busy}
                    value={unit?.rubricId ?? ""}
                    onChange={(e) => setRubric(t, e.target.value ? Number(e.target.value) : null)}
                    className="h-8 max-w-[12rem] rounded-lg border border-lightGray bg-white px-2 text-xs text-primary"
                  >
                    <option value="">No rubric (score 0–100)</option>
                    {rubrics.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                );
              },
            },
          ]}
        />
        <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-mainGray">
          Set due rules and grading categories in the Curriculum tab. Each cohort gets dates from its start date (Cohort →
          Schedule) and is graded in Cohort → Gradebook.
        </p>
      </Panel>

      <Modal open={Boolean(bankFor)} onClose={closeBank} className="!max-w-2xl" title="Add from question bank">
        {bankFor && (
          <div className="flex max-h-[85vh] flex-col gap-3 p-5">
            <div>
              <h3 className="text-lg font-semibold text-primary">Add to “{bankFor.name}”</h3>
              <p className="text-sm text-primaryGray">Multiple-choice and true/false questions only. Questions are copied into the quiz.</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-gray-200">
              {bank.length === 0 ? (
                <EmptyBlock msg="No usable questions in the bank yet." action={<Btn size="sm" to={somPaths.library}>Open library</Btn>} />
              ) : (
                <ul>
                  {bank.map((q) => {
                    const inQuiz = alreadyIn.has(q.id);
                    return (
                      <li key={q.id} className="border-b border-gray-100 last:border-0">
                        <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            disabled={inQuiz}
                            checked={inQuiz || picked.includes(q.id)}
                            onChange={(e) => setPicked((p) => (e.target.checked ? [...p, q.id] : p.filter((x) => x !== q.id)))}
                            className="mt-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-primary">{q.prompt}</span>
                            <span className="text-xs text-mainGray">
                              {q.type === "TRUE_FALSE" ? "True / false" : "Multiple choice"} · {(q.tags ?? []).join(", ") || "No tags"}
                              {inQuiz && " · already in this quiz"}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="mr-auto text-xs text-mainGray">{picked.length} selected</span>
              <Btn onClick={closeBank}>Cancel</Btn>
              <Btn variant="primary" disabled={!picked.length || busy} onClick={addFromBank}>
                Add {picked.length || ""} question{picked.length === 1 ? "" : "s"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProgramAssessments;
