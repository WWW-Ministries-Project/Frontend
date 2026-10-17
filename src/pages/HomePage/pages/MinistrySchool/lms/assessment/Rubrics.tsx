import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { showDeleteDialog } from "@/pages/HomePage/utils";
import { api } from "@/utils";
import type { Rubric, RubricCriterion, RubricLevel } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { runAction } from "../runAction";
import { makeId } from "../somUtils";
import { Btn, EmptyBlock, Panel } from "../ui";

const DEFAULT_LEVELS: RubricLevel[] = [
  { id: "excellent", label: "Excellent", factor: 1 },
  { id: "good", label: "Good", factor: 0.8 },
  { id: "fair", label: "Fair", factor: 0.6 },
  { id: "poor", label: "Poor", factor: 0.3 },
];
const field = "h-9 rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";
const criterion = (label = "", weight = 25): RubricCriterion => ({ id: makeId(), label, weight });

type Draft = { id?: number; title: string; criteria: RubricCriterion[]; levels: RubricLevel[] };

export const Rubrics = ({ canManage }: { canManage: boolean }) => {
  const { data, loading, refetch } = useFetch(api.fetch.fetchRubrics);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const rubrics = data?.data ?? [];
  const total = draft?.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) ?? 0;
  const canSave =
    draft &&
    draft.title.trim() &&
    draft.criteria.length > 0 &&
    draft.criteria.every((c) => c.label.trim()) &&
    total === 100 &&
    draft.levels.length >= 2 &&
    draft.levels.every((l) => l.label.trim() && l.factor >= 0 && l.factor <= 1);

  const save = async () => {
    if (!draft) return;
    const payload = { title: draft.title.trim(), criteria: draft.criteria, levels: draft.levels };
    setSaving(true);
    const ok = await runAction(
      () => (draft.id ? api.put.updateRubric(payload, { id: String(draft.id) }) : api.post.createRubric(payload)),
      { success: draft.id ? "Rubric updated" : "Rubric created", failure: "Could not save the rubric" }
    );
    setSaving(false);
    if (ok) {
      setDraft(null);
      refetch();
    }
  };

  const remove = (r: Rubric) =>
    showDeleteDialog({ name: r.title, id: r.id }, async () => {
      if (await runAction(() => api.delete.deleteRubric({ id: String(r.id) }), { success: "Rubric deleted", failure: "Could not delete" })) refetch();
    });

  if (loading && !data) return <SkeletonLoader />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-primaryGray">Attach a rubric to an essay to grade it criterion by criterion.</p>
        {canManage && (
          <Btn
            size="sm"
            variant="primary"
            onClick={() =>
              setDraft({
                title: "",
                criteria: [criterion("Biblical grounding", 40), criterion("Personal application", 30), criterion("Structure & clarity", 20), criterion("Length & format", 10)],
                levels: DEFAULT_LEVELS,
              })
            }
          >
            + Rubric
          </Btn>
        )}
      </div>

      {rubrics.length === 0 ? (
        <EmptyBlock msg="No rubrics yet." />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-3">
          {rubrics.map((r) => (
            <Panel
              key={r.id}
              title={r.title}
              action={
                canManage && (
                  <div className="flex gap-1">
                    <Btn size="sm" onClick={() => setDraft({ id: r.id, title: r.title, criteria: r.criteria, levels: r.levels })}>
                      Edit
                    </Btn>
                    <Btn size="sm" className="text-red-700" onClick={() => remove(r)}>
                      Delete
                    </Btn>
                  </div>
                )
              }
              bodyClassName="flex flex-col gap-2 p-4 text-sm"
            >
              <ul className="flex flex-col gap-1">
                {r.criteria.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span className="text-primary">{c.label}</span>
                    <span className="tabular-nums text-primaryGray">{c.weight}%</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-mainGray">
                Levels: {r.levels.map((l) => `${l.label} (${Math.round(l.factor * 100)}%)`).join(" · ")}
              </p>
              <p className="text-xs text-mainGray">Used by {r.usedBy ?? 0} essay{r.usedBy === 1 ? "" : "s"}</p>
            </Panel>
          ))}
        </div>
      )}

      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} className="!max-w-xl" title="Rubric">
        {draft && (
          <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5">
            <h3 className="text-lg font-semibold text-primary">{draft.id ? "Edit rubric" : "New rubric"}</h3>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Title</span>
              <input className={`${field} h-10 w-full`} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 flex w-full justify-between text-sm font-medium text-primary">
                <span>Criteria</span>
                <span className={cn("text-xs", total === 100 ? "text-green-700" : "text-red-700")}>Totals {total}%{total !== 100 && ". Must be 100%"}</span>
              </legend>
              {draft.criteria.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    className={`${field} flex-1`}
                    aria-label={`Criterion ${i + 1}`}
                    value={c.label}
                    onChange={(e) => setDraft({ ...draft, criteria: draft.criteria.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)) })}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    aria-label={`Weight for criterion ${i + 1}`}
                    className={`${field} w-20`}
                    value={c.weight}
                    onChange={(e) =>
                      setDraft({ ...draft, criteria: draft.criteria.map((x) => (x.id === c.id ? { ...x, weight: Math.round(Number(e.target.value) || 0) } : x)) })
                    }
                  />
                  <span className="text-sm text-mainGray">%</span>
                  <button
                    type="button"
                    aria-label={`Remove criterion ${i + 1}`}
                    disabled={draft.criteria.length <= 1}
                    onClick={() => setDraft({ ...draft, criteria: draft.criteria.filter((x) => x.id !== c.id) })}
                    className="px-2 text-lg text-mainGray hover:text-red-700 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              ))}
              <Btn size="sm" className="self-start" onClick={() => setDraft({ ...draft, criteria: [...draft.criteria, criterion("", 0)] })}>
                + Criterion
              </Btn>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium text-primary">Levels (score earned for each criterion)</legend>
              {draft.levels.map((l, i) => (
                <div key={l.id} className="flex items-center gap-2">
                  <input
                    className={`${field} flex-1`}
                    aria-label={`Level ${i + 1}`}
                    value={l.label}
                    onChange={(e) => setDraft({ ...draft, levels: draft.levels.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)) })}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    aria-label={`Score for level ${i + 1}`}
                    className={`${field} w-20`}
                    value={Math.round(l.factor * 100)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        levels: draft.levels.map((x) => (x.id === l.id ? { ...x, factor: Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100 } : x)),
                      })
                    }
                  />
                  <span className="text-sm text-mainGray">%</span>
                </div>
              ))}
            </fieldset>

            <div className="flex justify-end gap-2">
              <Btn onClick={() => setDraft(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={!canSave || saving} onClick={save}>
                Save rubric
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Rubrics;
