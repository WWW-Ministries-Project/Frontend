import { Modal } from "@/components/Modal";
import type { DueRule, GradingCategory, Weekday } from "@/utils/api/ministrySchool/interfaces";
import { useEffect, useState } from "react";
import { describeRule } from "../somUtils";
import { Btn } from "../ui";

const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const fieldClass = "h-10 rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";

/** Edits an assessment unit's week-based due rule and grading category. */
export const DueRuleModal = ({
  open,
  unitName,
  rule,
  category,
  defaultCategory,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  unitName: string;
  rule: DueRule | null;
  category: GradingCategory | null;
  defaultCategory: GradingCategory | null;
  saving: boolean;
  onClose: () => void;
  onSave: (next: { due_rule: DueRule | null; grading_category: GradingCategory | null }) => void;
}) => {
  const [hasRule, setHasRule] = useState(Boolean(rule));
  const [week, setWeek] = useState(rule?.week ?? 1);
  const [mode, setMode] = useState<DueRule["mode"]>(rule?.mode ?? "day");
  const [day, setDay] = useState<Weekday>(rule?.day ?? "Sun");
  const [days, setDays] = useState(rule?.days ?? 7);
  const [cat, setCat] = useState<GradingCategory | "">(category ?? "");

  useEffect(() => {
    if (!open) return;
    setHasRule(Boolean(rule));
    setWeek(rule?.week ?? 1);
    setMode(rule?.mode ?? "day");
    setDay(rule?.day ?? "Sun");
    setDays(rule?.days ?? 7);
    setCat(category ?? "");
  }, [open, rule, category]);

  const draft: DueRule | null = hasRule
    ? mode === "after"
      ? { week, mode, days }
      : { week, mode, day }
    : null;

  return (
    <Modal open={open} onClose={onClose} className="!max-w-lg" title="Due rule">
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-primary">{unitName}</h3>
          <p className="text-sm text-primaryGray">
            Due dates are set by week, so every cohort gets its own calendar dates from its start date.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-primary">
          <input type="checkbox" checked={hasRule} onChange={(e) => setHasRule(e.target.checked)} />
          Give this assessment a due date
        </label>

        {hasRule && (
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Week</span>
                <input
                  type="number"
                  min={1}
                  max={104}
                  value={week}
                  onChange={(e) => setWeek(Math.max(1, Number(e.target.value) || 1))}
                  className={`${fieldClass} w-24`}
                />
              </label>
              <div role="radiogroup" aria-label="Rule type" className="flex gap-1">
                {(["day", "after"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={`h-10 rounded-lg border px-3 text-sm ${
                      mode === m ? "border-primary bg-primary text-white" : "border-lightGray text-primary"
                    }`}
                  >
                    {m === "day" ? "On a weekday" : "Days after the week opens"}
                  </button>
                ))}
              </div>
            </div>
            {mode === "day" ? (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Weekday (23:59)</span>
                <select value={day} onChange={(e) => setDay(e.target.value as Weekday)} className={`${fieldClass} w-32`}>
                  {WEEKDAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Days</span>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
                  className={`${fieldClass} w-24`}
                />
              </label>
            )}
            <p className="text-xs text-mainGray">{describeRule(draft)}</p>
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-primary">Grading category</span>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as GradingCategory | "")}
            className={`${fieldClass} w-48`}
          >
            <option value="">Default ({defaultCategory ?? "none"})</option>
            <option value="quiz">Quiz</option>
            <option value="essay">Essay</option>
            <option value="exam">Exam</option>
          </select>
          <span className="text-xs text-mainGray">Used for weighted grading. Mark finals as Exam.</span>
        </label>

        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={saving}
            onClick={() => onSave({ due_rule: draft, grading_category: cat || null })}
          >
            Save
          </Btn>
        </div>
      </div>
    </Modal>
  );
};
