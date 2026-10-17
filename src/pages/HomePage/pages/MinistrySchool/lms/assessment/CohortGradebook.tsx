import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import type {
  GradebookCell,
  GradebookColumn,
  GradebookRow,
  SomClass,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { runAction } from "../runAction";
import { fmtDate, somPaths } from "../somUtils";
import { Btn, EmptyBlock, Panel, Pill, StatusPill } from "../ui";
import { GradingModal } from "./GradingModal";

const FILTERS = ["All learners", "At risk", "Needs grading"] as const;
type Filter = (typeof FILTERS)[number];

const CELL_STYLE: Record<GradebookCell["status"], string> = {
  graded: "",
  overridden: "underline decoration-dashed underline-offset-2",
  needs_grading: "bg-amber-100 text-amber-900 font-semibold cursor-pointer hover:bg-amber-200",
  missing: "text-red-700",
  open: "text-mainGray",
  excused: "text-mainGray italic",
};

const cellText = (c: GradebookCell) => {
  switch (c.status) {
    case "graded":
    case "overridden":
      return `${c.score}`;
    case "needs_grading":
      return "Grade";
    case "missing":
      return "Missing";
    case "excused":
      return "EX";
    default:
      return "·";
  }
};

const cellTitle = (c: GradebookCell, col: GradebookColumn) =>
  [
    col.name,
    c.status === "graded" ? `Graded ${c.score}% (${c.passed ? "pass" : "below pass"})` : null,
    c.status === "overridden" ? `Set to ${c.score}% by staff${c.note ? `: ${c.note}` : ""}` : null,
    c.status === "needs_grading" ? "Submitted, waiting to be graded" : null,
    c.status === "missing" ? "Past due with no submission" : null,
    c.status === "excused" ? `Excused${c.note ? `: ${c.note}` : ""}` : null,
    c.status === "open" ? (col.dueDate ? `Due ${fmtDate(col.dueDate)}` : "No due date") : null,
    c.extendedTo ? `Extended to ${fmtDate(c.extendedTo)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

const csvEscape = (v: string | number | null | undefined) => {
  let s = v === null || v === undefined ? "" : String(v);
  // Stop spreadsheet formula injection from learner-entered text.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

type OverrideTarget = { topicId: number; enrollmentIds: number[]; label: string };

export const CohortGradebook = ({
  cohortId,
  programId,
  classes,
  canManage,
}: {
  cohortId: number;
  programId: number;
  classes: SomClass[];
  canManage: boolean;
}) => {
  const [classId, setClassId] = useState("");
  const [filter, setFilter] = useState<Filter>("All learners");
  const [selected, setSelected] = useState<number[]>([]);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [override, setOverride] = useState<OverrideTarget | null>(null);
  const [form, setForm] = useState<{ mode: "score" | "excuse" | "clear"; score: string; note: string }>({
    mode: "score",
    score: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);

  const { data, loading, refetch } = useFetch(
    api.fetch.fetchGradebook,
    { cohortId: String(cohortId), ...(classId ? { courseId: classId } : {}) },
    !canManage
  );
  const book = data?.data;
  const columns = useMemo(() => book?.columns ?? [], [book]);

  const rows = useMemo(
    () =>
      (book?.rows ?? []).filter((r) =>
        filter === "At risk" ? r.status === "At risk" : filter === "Needs grading" ? r.needsGrading > 0 : true
      ),
    [book, filter]
  );

  const weighted = book?.grading.mode === "WEIGHTED";
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.enrollmentId));

  const openOverride = (target: OverrideTarget) => {
    setForm({ mode: "score", score: "", note: "" });
    setOverride(target);
  };

  const applyOverride = async () => {
    if (!override) return;
    const payload =
      form.mode === "clear"
        ? { clear: true }
        : form.mode === "excuse"
          ? { excused: true }
          : { score: Number(form.score) };
    setBusy(true);
    const ok = await runAction(
      () =>
        api.put.setGradeOverrides({
          topicId: override.topicId,
          enrollmentIds: override.enrollmentIds,
          ...payload,
          note: form.note.trim() || undefined,
        }),
      { success: "Gradebook updated", failure: "Could not update grades" }
    );
    setBusy(false);
    if (ok) {
      setOverride(null);
      setSelected([]);
      refetch();
    }
  };

  const zeroMissing = (col: GradebookColumn) => {
    const ids = (book?.rows ?? [])
      .filter((r) => r.cells.find((c) => c.topicId === col.topicId)?.status === "missing")
      .map((r) => r.enrollmentId);
    if (!ids.length) return;
    setForm({ mode: "score", score: "0", note: "Missing" });
    setOverride({
      topicId: col.topicId,
      enrollmentIds: ids,
      label: `${ids.length} learner${ids.length === 1 ? "" : "s"} missing “${col.name}”. Use after the late period has closed.`,
    });
  };

  const exportCsv = () => {
    if (!book) return;
    const header = ["Learner", "Class", ...columns.map((c) => c.name), ...(weighted ? ["Final grade"] : []), "Status"];
    const lines = (book.rows ?? []).map((r) => [
      r.name,
      r.className,
      ...r.cells.map((c) => (c.score !== null ? c.score : c.status === "excused" ? "EX" : c.status === "missing" ? "Missing" : "")),
      ...(weighted ? [r.finalGrade ?? ""] : []),
      r.status,
    ]);
    const csv = [header, ...lines].map((line) => line.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `gradebook-${book.program.title}-${book.cohort.name}.csv`.replace(/[^\w.-]+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
  };

  const onCell = (row: GradebookRow, col: GradebookColumn, cell: GradebookCell) => {
    if (cell.status === "needs_grading" && cell.submissionId) {
      setGradeId(cell.submissionId);
      return;
    }
    if (col.type === "assignment-essay" && cell.submissionId && cell.status === "graded") {
      setGradeId(cell.submissionId);
      return;
    }
    if (canManage) openOverride({ topicId: col.topicId, enrollmentIds: [row.enrollmentId], label: `${row.name} · ${col.name}` });
  };

  if (!canManage) return <EmptyBlock msg="The gradebook is available to instructors and School of Ministry managers." />;
  if (loading && !book) return <SkeletonLoader />;
  if (!book) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setSelected([]);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filter === f ? "border-primary bg-primary text-white" : "border-gray-200 text-primaryGray hover:bg-gray-50"
              )}
            >
              {f}
              <span className="ml-1.5 text-xs opacity-75">
                {f === "At risk" ? book.totals.atRisk : f === "Needs grading" ? book.rows.filter((r) => r.needsGrading).length : book.totals.learners}
              </span>
            </button>
          ))}
        </div>
        {classes.length > 1 && (
          <select
            aria-label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSelected([]);
            }}
            className="h-9 rounded-lg border border-lightGray bg-white px-2 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        )}
        <div className="ml-auto flex gap-2">
          <Btn size="sm" onClick={exportCsv}>
            Export CSV
          </Btn>
        </div>
      </div>

      {canManage && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-neutralGray px-3 py-2 text-sm">
          <b className="text-primary">{selected.length} selected</b>
          <select
            aria-label="Assessment"
            defaultValue=""
            onChange={(e) => {
              const col = columns.find((c) => String(c.topicId) === e.target.value);
              if (col) openOverride({ topicId: col.topicId, enrollmentIds: selected, label: `${selected.length} learners · ${col.name}` });
              e.target.value = "";
            }}
            className="h-8 rounded-lg border border-lightGray bg-white px-2 text-sm"
          >
            <option value="" disabled>
              Set score or excuse on…
            </option>
            {columns.map((c) => (
              <option key={c.topicId} value={c.topicId}>
                {c.name}
              </option>
            ))}
          </select>
          <Btn size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Btn>
        </div>
      )}

      {columns.length === 0 ? (
        <EmptyBlock
          msg="This program has no quizzes or essays to grade yet."
          action={<Btn size="sm" to={somPaths.program(programId, "Curriculum")}>Open curriculum</Btn>}
        />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: 360 + columns.length * 110 }}>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left align-bottom text-xs text-mainGray">
                  {canManage && (
                    <th className="sticky left-0 z-10 w-10 bg-gray-50 px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Select all learners"
                        checked={allSelected}
                        onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.enrollmentId) : [])}
                      />
                    </th>
                  )}
                  <th className={cn("sticky z-10 min-w-[180px] bg-gray-50 px-3 py-2 font-semibold uppercase tracking-wide", canManage ? "left-10" : "left-0")}>
                    Learner
                  </th>
                  {columns.map((col) => {
                    const toGrade = book.rows.filter((r) => r.cells.find((c) => c.topicId === col.topicId)?.status === "needs_grading").length;
                    const missing = book.rows.filter((r) => r.cells.find((c) => c.topicId === col.topicId)?.status === "missing").length;
                    return (
                      <th key={col.topicId} className="min-w-[110px] px-2 py-2 text-center font-medium">
                        <p className="line-clamp-2 text-primary" title={col.name}>
                          {col.name}
                        </p>
                        <p className="text-[11px]">
                          {col.category ?? "—"}
                          {weighted && col.category ? ` · ${book.grading.weights[col.category]}%` : ""}
                          {col.dueDate ? ` · ${fmtDate(col.dueDate).replace(/, \d{4}$/, "")}` : ""}
                        </p>
                        {toGrade > 0 && <Pill tone="amber" className="mt-1">{toGrade} to grade</Pill>}
                        {canManage && missing > 0 && (
                          <button type="button" onClick={() => zeroMissing(col)} className="mt-1 block w-full text-[11px] text-red-700 underline">
                            {missing} missing → 0
                          </button>
                        )}
                      </th>
                    );
                  })}
                  {weighted && <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide">Grade</th>}
                  <th className="px-3 py-2 font-semibold uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.enrollmentId} className="border-b border-gray-100 last:border-0">
                    {canManage && (
                      <td className="sticky left-0 z-[1] bg-white px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.name}`}
                          checked={selected.includes(row.enrollmentId)}
                          onChange={(e) =>
                            setSelected((s) => (e.target.checked ? [...s, row.enrollmentId] : s.filter((x) => x !== row.enrollmentId)))
                          }
                        />
                      </td>
                    )}
                    <td className={cn("sticky z-[1] bg-white px-3 py-2", canManage ? "left-10" : "left-0")}>
                      <Link to={somPaths.student(cohortId, row.classId, row.enrollmentId)} className="font-medium text-primary hover:underline">
                        {row.name}
                      </Link>
                      <p className="text-xs text-mainGray">{row.className}</p>
                    </td>
                    {columns.map((col) => {
                      const cell = row.cells.find((c) => c.topicId === col.topicId);
                      if (!cell) return <td key={col.topicId} />;
                      const interactive = canManage || cell.status === "needs_grading";
                      return (
                        <td key={col.topicId} className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            disabled={!interactive}
                            title={cellTitle(cell, col)}
                            onClick={() => onCell(row, col, cell)}
                            className={cn(
                              "min-w-[3.25rem] rounded-md px-2 py-1 tabular-nums",
                              CELL_STYLE[cell.status],
                              (cell.status === "graded" || cell.status === "overridden") && cell.passed === false && "text-red-700",
                              interactive && cell.status !== "needs_grading" && "hover:bg-gray-100",
                              cell.extendedTo && "ring-1 ring-blue-300"
                            )}
                          >
                            {cellText(cell)}
                          </button>
                        </td>
                      );
                    })}
                    {weighted && (
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-semibold tabular-nums",
                          row.finalGrade !== null && row.finalGrade < book.grading.passMark ? "text-red-700" : "text-primary"
                        )}
                      >
                        {row.finalGrade !== null ? `${row.finalGrade}%` : "—"}
                      </td>
                    )}
                    <td className="px-3 py-2" title={row.reasons.join(" · ")}>
                      <StatusPill status={row.status === "At risk" ? "Behind" : row.status} label={row.status} />
                      {row.reasons.length > 0 && <p className="mt-0.5 text-[11px] text-mainGray">{row.reasons.join(" · ")}</p>}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 4} className="px-4 py-8 text-center text-sm text-primaryGray">
                      No learners match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-gray-100 px-4 py-2 text-xs text-mainGray">
            {weighted
              ? `Weighted: quizzes ${book.grading.weights.quiz}%, essays ${book.grading.weights.essay}%, exam ${book.grading.weights.exam}%${
                  book.grading.attendanceTracked
                    ? `, attendance ${book.grading.weights.attendance}%.`
                    : `. Attendance (${book.grading.weights.attendance}%) is not recorded yet, so the other weights are scaled to 100%.`
                }`
              : "Pass / fail per unit."}{" "}
            Pass mark {book.grading.passMark}%. Yellow = waiting to be graded · dashed = set by staff · blue ring = extension.
            At risk = 2+ missing, below the pass mark, or low attendance.
          </p>
        </Panel>
      )}

      {gradeId !== null && <GradingModal submissionId={gradeId} onClose={() => setGradeId(null)} onGraded={refetch} />}

      <Modal open={Boolean(override)} onClose={() => setOverride(null)} className="!max-w-md" title="Update grade">
        {override && (
          <div className="flex flex-col gap-4 p-5">
            <div>
              <h3 className="text-lg font-semibold text-primary">Update grade</h3>
              <p className="text-sm text-primaryGray">{override.label}</p>
            </div>
            <div role="radiogroup" className="flex flex-col gap-2 text-sm">
              {(
                [
                  ["score", "Set a score"],
                  ["excuse", "Excuse (not counted, doesn’t block completion)"],
                  ["clear", "Clear a staff override"],
                ] as const
              ).map(([mode, label]) => (
                <label key={mode} className="flex items-center gap-2 text-primary">
                  <input type="radio" name="override-mode" checked={form.mode === mode} onChange={() => setForm({ ...form, mode })} />
                  {label}
                </label>
              ))}
            </div>
            {form.mode === "score" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.score}
                  onChange={(e) => setForm({ ...form, score: e.target.value })}
                  className="h-10 w-24 rounded-lg border border-lightGray bg-inputBackground px-3"
                  aria-label="Score"
                />
                <span className="text-primaryGray">%</span>
              </label>
            )}
            {form.mode !== "clear" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Note (optional)</span>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="h-10 rounded-lg border border-lightGray bg-inputBackground px-3"
                />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setOverride(null)}>Cancel</Btn>
              <Btn
                variant="primary"
                disabled={busy || (form.mode === "score" && (form.score === "" || Number(form.score) < 0 || Number(form.score) > 100))}
                onClick={applyOverride}
              >
                Apply
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CohortGradebook;
