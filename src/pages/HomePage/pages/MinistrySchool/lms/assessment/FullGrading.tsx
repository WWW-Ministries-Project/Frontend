import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import type { SubmissionInlineComment } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useRef, useState } from "react";
import { runAction } from "../runAction";
import { fmtDate, safeHttpUrl } from "../somUtils";
import { Banner, Btn, FullOverlay, Panel, Pill } from "../ui";

const newCommentId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const KIND_LABEL: Record<NonNullable<SubmissionInlineComment["kind"]>, string> = {
  praise: "Strength",
  improve: "To improve",
};

type Affordance = { x: number; y: number; text: string };

/**
 * Full-panel grading view: a reading pane for the submission on the left and a
 * rubric + inline-comments + feedback aside on the right. Replaces the grading
 * modal. `queue` is the ordered list of submission ids to grade; `startIndex`
 * is the one to open first.
 */
export const FullGrading = ({
  queue,
  startIndex = 0,
  onClose,
  onGraded,
}: {
  queue: number[];
  startIndex?: number;
  onClose: () => void;
  onGraded: () => void;
}) => {
  const [idx, setIdx] = useState(startIndex);
  const submissionId = queue[idx];
  const { data, loading, error } = useFetch(api.fetch.fetchGradingSubmission, { id: String(submissionId) });
  const sub = data?.data;

  const [scores, setScores] = useState<Record<string, string>>({});
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [comments, setComments] = useState<SubmissionInlineComment[]>([]);
  const [saving, setSaving] = useState(false);

  // Inline-comment composer state.
  const paneRef = useRef<HTMLDivElement>(null);
  const [affordance, setAffordance] = useState<Affordance | null>(null);
  const [draftQuote, setDraftQuote] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftKind, setDraftKind] = useState<NonNullable<SubmissionInlineComment["kind"]>>("improve");

  useEffect(() => {
    if (!sub) return;
    setScores(sub.rubricScores ?? {});
    setScore(sub.score !== null ? String(sub.score) : "");
    setFeedback(sub.feedback ?? "");
    setComments(sub.inline_comments ?? []);
    // Clear any composer carried over from the previous submission.
    setAffordance(null);
    setDraftQuote(null);
    setDraftText("");
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
  const hasNext = idx < queue.length - 1;
  const hasPrev = idx > 0;

  const onPaneMouseUp = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!sel || !text || sel.rangeCount === 0 || !paneRef.current) {
      setAffordance(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!paneRef.current.contains(range.commonAncestorContainer)) {
      setAffordance(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setAffordance({ x: rect.left + rect.width / 2, y: rect.top, text });
  };

  const startComment = () => {
    if (!affordance) return;
    setDraftQuote(affordance.text);
    setDraftText("");
    setDraftKind("improve");
    setAffordance(null);
    window.getSelection()?.removeAllRanges();
  };

  const addComment = () => {
    if (draftQuote === null || !draftText.trim()) return;
    setComments((c) => [
      ...c,
      { id: newCommentId(), text: draftText.trim(), quote: draftQuote || undefined, kind: draftKind },
    ]);
    setDraftQuote(null);
    setDraftText("");
  };

  const save = async (advance: boolean) => {
    if (!sub) return;
    setSaving(true);
    const ok = await runAction(
      () =>
        sub.rubric
          ? api.put.gradeWithRubric({
              submissionId: sub.id,
              scores,
              feedback: feedback.trim() || undefined,
              comments: comments.length ? comments : undefined,
            })
          : api.put.gradeAssignmentSubmission({ submissionId: sub.id, grade: numeric, feedback: feedback.trim() || null }),
      { success: "Grade saved", failure: "Could not save the grade" }
    );
    setSaving(false);
    if (!ok) return;
    onGraded();
    if (advance && hasNext) setIdx((i) => i + 1);
    else onClose();
  };

  const header = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
      <div className="min-w-0">
        <p className="truncate text-xs text-mainGray">{sub ? sub.unit.name : "Grading"}</p>
        <h2 className="truncate text-lg font-semibold text-primary">{sub ? sub.learnerName : "Loading…"}</h2>
      </div>
      {queue.length > 1 && (
        <div className="flex items-center gap-1.5">
          <Btn size="sm" variant="secondary" disabled={!hasPrev} onClick={() => hasPrev && setIdx((i) => i - 1)} title="Previous submission">
            ‹ Prev
          </Btn>
          <span className="whitespace-nowrap text-xs text-primaryGray" aria-live="polite">
            {idx + 1} of {queue.length}
          </span>
          <Btn size="sm" variant="secondary" disabled={!hasNext} onClick={() => hasNext && setIdx((i) => i + 1)} title="Next submission">
            Next ›
          </Btn>
        </div>
      )}
    </div>
  );

  return (
    <FullOverlay open onClose={onClose} header={header}>
      {error && !sub ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-primaryGray">
          <p>Could not load this submission.</p>
          <Btn size="sm" onClick={onClose}>Close</Btn>
        </div>
      ) : loading || !sub ? (
        <p className="py-16 text-center text-sm text-primaryGray">Loading submission…</p>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 p-4 md:grid-cols-[1.4fr_1fr] md:p-6">
          {/* LEFT: reading pane */}
          <section aria-label="Submission" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-mainGray">
                Attempt {sub.attempt} · submitted {fmtDate(sub.submittedAt)} · {sub.className}
              </p>
              {safeHttpUrl(sub.fileUrl) ? (
                <a
                  href={safeHttpUrl(sub.fileUrl)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center rounded-lg border border-lightGray px-3 text-sm font-medium text-primary hover:bg-gray-50"
                >
                  Open file
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

            {sub.content ? (
              <div
                ref={paneRef}
                onMouseUp={onPaneMouseUp}
                className="whitespace-pre-line rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-primary"
              >
                {sub.content}
              </div>
            ) : !sub.fileUrl ? (
              <Banner tone="info">This submission has no written content.</Banner>
            ) : (
              <Banner tone="info">This submission was uploaded as a file. Open it above to read it.</Banner>
            )}
            {sub.content && (
              <p className="text-xs text-mainGray">Select any text to add an inline comment.</p>
            )}
          </section>

          {/* RIGHT: grading aside */}
          <aside aria-label="Grading" className="flex flex-col gap-4">
            {sub.rubric ? (
              <Panel title={sub.rubric.title} action={
                <span className="text-sm text-primaryGray">
                  <b className={cn("text-primary", rubricPct !== null && rubricPct < sub.unit.passMark && "text-red-700")}>
                    {rubricPct ?? "—"}%
                  </b>{" "}
                  · pass {sub.unit.passMark}%
                </span>
              }>
                <div className="overflow-x-auto p-3">
                  <table className="w-full min-w-[320px] border-collapse text-sm">
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
              </Panel>
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

            {/* Inline comments */}
            <Panel title={<span>Inline comments {comments.length > 0 && <Pill tone="gray">{comments.length}</Pill>}</span>}>
              <div className="flex flex-col gap-3 p-3">
                {draftQuote !== null && (
                  <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-neutralGray p-3">
                    {draftQuote && (
                      <blockquote className="border-l-2 border-primary/40 pl-2 text-xs italic text-primaryGray">
                        “{draftQuote}”
                      </blockquote>
                    )}
                    <textarea
                      rows={2}
                      autoFocus
                      aria-label="Comment text"
                      placeholder="Write a comment…"
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      className="rounded-lg border border-lightGray bg-white px-3 py-2 text-sm"
                    />
                    <div role="radiogroup" aria-label="Comment kind" className="flex gap-3 text-sm">
                      {(["praise", "improve"] as const).map((k) => (
                        <label key={k} className="flex items-center gap-1.5 text-primary">
                          <input type="radio" name="comment-kind" checked={draftKind === k} onChange={() => setDraftKind(k)} />
                          {KIND_LABEL[k]}
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Btn size="sm" variant="ghost" onClick={() => setDraftQuote(null)}>Cancel</Btn>
                      <Btn size="sm" variant="primary" disabled={!draftText.trim()} onClick={addComment}>Add comment</Btn>
                    </div>
                  </div>
                )}

                {comments.length === 0 && draftQuote === null ? (
                  <p className="text-xs text-mainGray">No inline comments yet. Select text in the submission to add one.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {comments.map((c) => (
                      <li key={c.id} className="rounded-lg border border-gray-200 p-2.5 text-sm">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <Pill tone={c.kind === "praise" ? "green" : "amber"}>
                            {KIND_LABEL[c.kind ?? "improve"]}
                          </Pill>
                          <button
                            type="button"
                            aria-label="Remove comment"
                            onClick={() => setComments((list) => list.filter((x) => x.id !== c.id))}
                            className="text-xs text-mainGray hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        {c.quote && (
                          <blockquote className="mb-1 border-l-2 border-gray-200 pl-2 text-xs italic text-mainGray">
                            “{c.quote}”
                          </blockquote>
                        )}
                        <p className="text-primary">{c.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Feedback to the learner (optional)</span>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="rounded-lg border border-lightGray bg-inputBackground px-3 py-2"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-2">
              <Btn onClick={onClose}>Cancel</Btn>
              {hasNext && (
                <Btn variant="secondary" disabled={!canSave || saving} onClick={() => save(true)}>
                  Save &amp; next
                </Btn>
              )}
              <Btn variant="primary" disabled={!canSave || saving} onClick={() => save(false)}>
                Save grade
              </Btn>
            </div>
          </aside>
        </div>
      )}

      {/* Floating "Add comment" affordance anchored to the current selection. */}
      {affordance && (
        <button
          type="button"
          onClick={startComment}
          style={{ position: "fixed", left: affordance.x, top: affordance.y, transform: "translate(-50%, -115%)" }}
          className="z-[60] rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white shadow-lg hover:bg-lighter"
        >
          Add comment
        </button>
      )}
    </FullOverlay>
  );
};

export default FullGrading;
