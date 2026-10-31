import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import type { GradingMode, GradingWeights, ProgramGrading } from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";
import { runAction } from "../runAction";
import { Btn, Panel } from "../ui";

const WEIGHT_LABELS: { key: keyof GradingWeights; label: string }[] = [
  { key: "quiz", label: "Quizzes" },
  { key: "essay", label: "Essays" },
  { key: "exam", label: "Final exam" },
  { key: "attendance", label: "Attendance" },
];

type Draft = Omit<ProgramGrading, "programId">;

/** Per-program grading model and completion rules ("Grading & completion" tab). */
export const GradingModelPanel = ({ programId, canManage }: { programId: number; canManage: boolean }) => {
  const { data, loading, refetch } = useFetch(api.fetch.fetchProgramGrading, { programId: String(programId) });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.data) {
      const { programId: _id, ...rest } = data.data;
      setDraft(rest);
    }
  }, [data]);

  if (!draft) return loading ? <SkeletonLoader /> : null;

  const weighted = draft.grading_mode === "WEIGHTED";
  const total = WEIGHT_LABELS.reduce((sum, w) => sum + (draft.grading_weights[w.key] ?? 0), 0);
  const invalid = weighted && total !== 100;
  const dirty = data?.data && JSON.stringify({ ...data.data, programId: undefined }) !== JSON.stringify({ ...draft, programId: undefined });

  const setMode = (grading_mode: GradingMode) => setDraft({ ...draft, grading_mode });
  const setWeight = (key: keyof GradingWeights, value: number) =>
    setDraft({ ...draft, grading_weights: { ...draft.grading_weights, [key]: value } });
  const setRule = <K extends keyof Draft["completion_rules"]>(key: K, value: Draft["completion_rules"][K]) =>
    setDraft({ ...draft, completion_rules: { ...draft.completion_rules, [key]: value } });

  const save = async () => {
    setSaving(true);
    const ok = await runAction(() => api.put.updateProgramGrading(draft, { programId: String(programId) }), {
      success: "Grading saved",
      failure: "Could not save grading",
    });
    setSaving(false);
    if (ok) refetch();
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
      <Panel title="Grading model" bodyClassName="flex flex-col gap-4 p-4 text-sm">
        <p className="text-primaryGray">Applies to every cohort of this program and to its gradebook.</p>
        <div role="radiogroup" aria-label="Grading model" className="grid gap-2 tablet:grid-cols-2">
          {(
            [
              ["WEIGHTED", "Weighted scores", "Scores roll up by category weight into a final grade."],
              ["PASS_FAIL", "Pass / fail per unit", "Each graded unit is passed or failed. No final percentage."],
            ] as const
          ).map(([mode, title, sub]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={draft.grading_mode === mode}
              disabled={!canManage}
              onClick={() => setMode(mode)}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-3 text-left",
                draft.grading_mode === mode ? "border-primary ring-1 ring-primary" : "border-gray-200 hover:bg-gray-50"
              )}
            >
              <span className="font-semibold text-primary">{title}</span>
              <span className="text-xs text-primaryGray">{sub}</span>
            </button>
          ))}
        </div>

        {weighted && (
          <div className="flex flex-col gap-2.5 rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-primary">Category weights</p>
              <span className={cn("text-xs font-semibold", invalid ? "text-red-700" : "text-green-700")}>
                {invalid ? `Totals ${total}%. Must be 100%` : "Totals 100%"}
              </span>
            </div>
            {WEIGHT_LABELS.map((w) => (
              <label key={w.key} className="grid grid-cols-[110px_1fr_48px] items-center gap-3">
                <span className="text-primaryGray">{w.label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={!canManage}
                  value={draft.grading_weights[w.key]}
                  onChange={(e) => setWeight(w.key, Number(e.target.value))}
                  className="accent-primary"
                  aria-label={`${w.label} weight`}
                />
                <span className="text-right tabular-nums text-primary">{draft.grading_weights[w.key]}%</span>
              </label>
            ))}
          </div>
        )}

        <label className="grid grid-cols-[110px_1fr_48px] items-center gap-3">
          <span className="font-medium text-primary">Pass mark</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={!canManage}
            value={draft.pass_mark}
            onChange={(e) => setDraft({ ...draft, pass_mark: Number(e.target.value) })}
            className="accent-primary"
            aria-label="Pass mark"
          />
          <span className="text-right tabular-nums text-primary">{draft.pass_mark}%</span>
        </label>
      </Panel>

      <Panel title="Completion rules" bodyClassName="flex flex-col gap-3 p-4 text-sm">
        <p className="text-primaryGray">A learner completes the program when every checked rule is met.</p>
        <label className="flex items-center gap-2 text-primary">
          <input
            type="checkbox"
            disabled={!canManage}
            checked={draft.completion_rules.requireAllUnits}
            onChange={(e) => setRule("requireAllUnits", e.target.checked)}
          />
          Every unit completed
        </label>
        <label className="flex items-center gap-2 text-primary">
          <input
            type="checkbox"
            disabled={!canManage}
            checked={draft.completion_rules.requireGrade}
            onChange={(e) => setRule("requireGrade", e.target.checked)}
          />
          {weighted ? `Final grade at or above ${draft.pass_mark}%` : `Every graded unit passed (${draft.pass_mark}%+)`}
        </label>
        <div className="flex flex-wrap items-center gap-2 text-primary">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled={!canManage}
              checked={draft.completion_rules.minAttendance !== null}
              onChange={(e) => setRule("minAttendance", e.target.checked ? 75 : null)}
            />
            Attendance at least
          </label>
          <input
            type="number"
            min={0}
            max={100}
            disabled={!canManage || draft.completion_rules.minAttendance === null}
            value={draft.completion_rules.minAttendance ?? ""}
            onChange={(e) => setRule("minAttendance", Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className="h-8 w-16 rounded-lg border border-lightGray bg-inputBackground px-2 text-sm disabled:opacity-50"
            aria-label="Minimum attendance percent"
          />
          <span>%</span>
        </div>
        <label className="mt-1 flex items-center gap-2 border-t border-gray-100 pt-3 text-primary">
          <input
            type="checkbox"
            disabled={!canManage}
            checked={draft.auto_certificate}
            onChange={(e) => setDraft({ ...draft, auto_certificate: e.target.checked })}
          />
          Issue the certificate automatically when all rules are met
        </label>
      </Panel>

      {canManage && (
        <div className="col-span-full flex items-center justify-end gap-2">
          {dirty && <span className="text-xs text-mainGray">Unsaved changes</span>}
          <Btn
            onClick={() => {
              if (data?.data) {
                const { programId: _id, ...rest } = data.data;
                setDraft(rest);
              }
            }}
            disabled={!dirty || saving}
          >
            Discard
          </Btn>
          <Btn variant="primary" disabled={!dirty || invalid || saving} onClick={save}>
            Save grading
          </Btn>
        </div>
      )}
    </div>
  );
};

export default GradingModelPanel;
