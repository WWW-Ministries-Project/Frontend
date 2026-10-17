import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useState } from "react";
import { runAction } from "../runAction";
import { fmtDate, safeHttpUrl } from "../somUtils";
import { Btn } from "../ui";

/** Grades one essay submission, with its rubric when the unit has one. Mount only while open. */
export const GradingModal = ({
  submissionId,
  onClose,
  onGraded,
}: {
  submissionId: number;
  onClose: () => void;
  onGraded: () => void;
}) => {
  const { data, loading, error } = useFetch(api.fetch.fetchGradingSubmission, { id: String(submissionId) });
  const sub = data?.data;
  const [scores, setScores] = useState<Record<string, string>>({});
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sub) return;
    setScores(sub.rubricScores ?? {});
    setScore(sub.score !== null ? String(sub.score) : "");
    setFeedback(sub.feedback ?? "");
  }, [sub]);

  const rubricPct = useMemo(() => {
    if (!sub?.rubric) return null;
    const factor = new Map(sub.rubric.levels.map((l) => [l.id, l.factor]));
    const total = sub.rubric.criteria.reduce((s, c) => s + c.weight, 0);
    if (!total || sub.rubric.criteria.some((c) => !factor.has(scores[c.id]))) return null;
    return Math.round(
      (sub.rubric.criteria.reduce((s, c) => s + c.weight * (factor.get(scores[c.id]) ?? 0), 0) / total) * 100
    );
  }, [sub, scores]);

  const numeric = Number(score);
  const canSave = sub?.rubric ? rubricPct !== null : score !== "" && numeric >= 0 && numeric <= 100;

  const save = async () => {
    if (!sub) return;
    setSaving(true);
    const ok = await runAction(
      () =>
        sub.rubric
          ? api.put.gradeWithRubric({ submissionId: sub.id, scores, feedback: feedback.trim() || undefined })
          : api.put.gradeAssignmentSubmission({ submissionId: sub.id, grade: numeric, feedback: feedback.trim() || null }),
      { success: "Grade saved", failure: "Could not save the grade" }
    );
    setSaving(false);
    if (ok) {
      onGraded();
      onClose();
    }
  };

  return (
    <Modal open onClose={onClose} className="!max-w-3xl" title="Grade submission">
      <div className="flex max-h-[88vh] flex-col gap-4 overflow-y-auto p-5">
        {error && !sub ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-primaryGray">
            <p>Could not load this submission.</p>
            <Btn size="sm" onClick={onClose}>Close</Btn>
          </div>
        ) : loading || !sub ? (
          <p className="py-10 text-center text-sm text-primaryGray">Loading submission…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-mainGray">
                  {sub.unit.name} · attempt {sub.attempt} · submitted {fmtDate(sub.submittedAt)}
                </p>
                <h3 className="text-lg font-semibold text-primary">{sub.learnerName}</h3>
                <p className="text-xs text-mainGray">{sub.className}</p>
              </div>
              {safeHttpUrl(sub.fileUrl) ? (
                <a
                  href={safeHttpUrl(sub.fileUrl)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center rounded-lg border border-lightGray px-3 text-sm font-medium text-primary hover:bg-gray-50"
                >
                  Open submission
                </a>
              ) : sub.fileUrl ? (
                <span className="text-xs text-red-700">Submission link is not a valid web address</span>
              ) : null}
            </div>

            {sub.unit.prompt && (
              <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-primaryGray">
                <span className="font-medium text-primary">Prompt: </span>
                {sub.unit.prompt}
              </div>
            )}
            {sub.content && (
              <div className="max-h-64 overflow-y-auto whitespace-pre-line rounded-lg border border-gray-200 px-3 py-2 text-sm text-primary">
                {sub.content}
              </div>
            )}

            {sub.rubric ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">{sub.rubric.title}</p>
                  <p className="text-sm text-primaryGray">
                    Score:{" "}
                    <b className={cn("text-primary", rubricPct !== null && rubricPct < sub.unit.passMark && "text-red-700")}>
                      {rubricPct ?? "—"}%
                    </b>{" "}
                    · pass {sub.unit.passMark}%
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs text-mainGray">
                        <th className="py-1.5 pr-2 font-medium">Criterion</th>
                        {sub.rubric.levels.map((l) => (
                          <th key={l.id} className="px-1 py-1.5 text-center font-medium">
                            {l.label}
                            <span className="block text-[10px]">{Math.round(l.factor * 100)}%</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sub.rubric.criteria.map((c) => (
                        <tr key={c.id} className="border-t border-gray-100">
                          <td className="py-2 pr-2 text-primary">
                            {c.label} <span className="text-xs text-mainGray">({c.weight}%)</span>
                          </td>
                          {sub.rubric!.levels.map((l) => (
                            <td key={l.id} className="px-1 py-2 text-center">
                              <input
                                type="radio"
                                name={`c-${c.id}`}
                                aria-label={`${c.label}: ${l.label}`}
                                checked={scores[c.id] === l.id}
                                onChange={() => setScores((s) => ({ ...s, [c.id]: l.id }))}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <span className="font-medium text-primary">Score</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="h-10 w-24 rounded-lg border border-lightGray bg-inputBackground px-3"
                />
                <span className="text-primaryGray">% · pass {sub.unit.passMark}%</span>
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Feedback to the learner (optional)</span>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="rounded-lg border border-lightGray bg-inputBackground px-3 py-2"
              />
            </label>

            <div className="flex justify-end gap-2">
              <Btn onClick={onClose}>Cancel</Btn>
              <Btn variant="primary" disabled={!canSave || saving} onClick={save}>
                Save grade
              </Btn>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default GradingModal;
