import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import SkeletonLoader from "@/pages/HomePage/Components/reusable/SkeletonLoader";
import { api } from "@/utils";
import type { CohortScheduleRow } from "@/utils/api/ministrySchool/interfaces";
import { useState } from "react";
import { runAction } from "./runAction";
import type { EnrollmentRow } from "./somDataContext";
import { fmtDate, somPaths, unitLabel } from "./somUtils";
import { Btn, EmptyBlock, Panel, SimpleTable, StatusPill } from "./ui";

/** yyyy-mm-dd in local time, for <input type="date">. */
const toInputDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** End of the chosen day in local time, matching the rule's 23:59 cut-off. */
const fromInputDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59).toISOString();
};

export const CohortSchedule = ({
  cohortId,
  programId,
  roster,
  canManage,
}: {
  cohortId: number;
  programId: number;
  roster: EnrollmentRow[];
  canManage: boolean;
}) => {
  const { data, loading, refetch } = useFetch(api.fetch.fetchCohortSchedule, { cohortId: String(cohortId) });
  const [busy, setBusy] = useState(false);
  const [extFor, setExtFor] = useState<CohortScheduleRow | null>(null);
  const [ext, setExt] = useState({ enrollmentId: "", date: "", reason: "" });

  const schedule = data?.data;
  const rows = schedule?.rows ?? [];

  const mutate = async (fn: () => Promise<unknown>, success: string, failure: string) => {
    setBusy(true);
    const ok = await runAction(fn, { success, failure });
    setBusy(false);
    if (ok) refetch();
    return ok;
  };

  const setDue = (row: CohortScheduleRow, value: string | null) =>
    mutate(
      () =>
        api.put.setCohortDueDate({
          cohortId,
          topicId: row.topicId,
          dueDate: value ? fromInputDate(value) : null,
        }),
      value ? "Due date changed for this cohort" : "Due date reset to the program rule",
      "Could not change the due date"
    );

  const saveExtension = async () => {
    if (!extFor || !ext.enrollmentId || !ext.date) return;
    const ok = await mutate(
      () =>
        api.post.grantAssignmentExtension({
          cohortId,
          topicId: extFor.topicId,
          enrollmentId: Number(ext.enrollmentId),
          dueDate: fromInputDate(ext.date),
          reason: ext.reason.trim() || undefined,
        }),
      "Extension granted",
      "Could not grant the extension"
    );
    if (ok) setExtFor(null);
  };

  if (loading && !schedule) return <SkeletonLoader />;

  return (
    <>
      <Panel
        title="Schedule"
        action={
          schedule?.startDate && (
            <span className="text-xs text-mainGray">Cohort starts {fmtDate(schedule.startDate)}</span>
          )
        }
      >
        <p className="border-b border-gray-100 px-4 py-2.5 text-sm text-primaryGray">
          Dates come from each assessment’s program rule and this cohort’s start date. Change a date to move it for
          this cohort only.
        </p>
        <SimpleTable<CohortScheduleRow>
          rows={rows}
          rowKey={(r) => r.learningUnitId}
          minWidth={860}
          empty={
            <EmptyBlock
              msg="This program has no quizzes or essays yet."
              action={<Btn size="sm" to={somPaths.program(programId, "Curriculum")}>Open curriculum</Btn>}
            />
          }
          columns={[
            {
              key: "n",
              header: "Assessment",
              render: (r) => (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{r.name}</span>
                  <StatusPill status={unitLabel(r.type)} />
                </div>
              ),
            },
            {
              key: "rule",
              header: "Program rule",
              render: (r) => (
                <div>
                  <p className={r.rule ? "text-primary" : "text-amber-700"}>{r.ruleLabel}</p>
                  {r.ruleDueDate && <p className="text-xs text-mainGray">→ {fmtDate(r.ruleDueDate)}</p>}
                </div>
              ),
            },
            {
              key: "due",
              header: "Due in this cohort",
              render: (r) => (
                <div className="flex flex-col gap-1">
                  <input
                    type="date"
                    aria-label={`Due date for ${r.name}`}
                    disabled={!canManage || busy}
                    value={toInputDate(r.effectiveDueDate)}
                    onChange={(e) => setDue(r, e.target.value || null)}
                    className="h-9 w-40 rounded-lg border border-lightGray bg-inputBackground px-2 text-sm"
                  />
                  {r.overrideDueDate ? (
                    <span className="text-xs text-amber-700">
                      Changed
                      {r.ruleDueDate && ` · rule gives ${fmtDate(r.ruleDueDate)}`}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setDue(r, null)}
                          className="ml-1 font-medium underline"
                          disabled={busy}
                        >
                          Reset
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-mainGray">{r.ruleDueDate ? "From program rule" : "No due date"}</span>
                  )}
                </div>
              ),
            },
            {
              key: "x",
              header: "Extensions",
              render: (r) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  {r.extensions.map((x) => (
                    <span
                      key={x.id}
                      title={x.reason ?? undefined}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-800"
                    >
                      {x.learnerName} → {fmtDate(x.dueDate)}
                      {canManage && (
                        <button
                          type="button"
                          aria-label={`Remove extension for ${x.learnerName}`}
                          disabled={busy}
                          onClick={() =>
                            mutate(
                              () => api.delete.removeAssignmentExtension({ id: String(x.id) }),
                              "Extension removed",
                              "Could not remove the extension"
                            )
                          }
                          className="font-bold leading-none"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {canManage && (
                    <Btn
                      size="sm"
                      onClick={() => {
                        setExt({ enrollmentId: "", date: toInputDate(r.effectiveDueDate), reason: "" });
                        setExtFor(r);
                      }}
                    >
                      + Extension
                    </Btn>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>

      <Modal open={Boolean(extFor)} onClose={() => setExtFor(null)} className="!max-w-md" title="Grant extension">
        {extFor && (
          <div className="flex flex-col gap-4 p-5">
            <div>
              <h3 className="text-lg font-semibold text-primary">Grant extension</h3>
              <p className="text-sm text-primaryGray">{extFor.name}</p>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Learner</span>
              <select
                value={ext.enrollmentId}
                onChange={(e) => setExt({ ...ext, enrollmentId: e.target.value })}
                className="h-10 rounded-lg border border-lightGray bg-inputBackground px-3"
              >
                <option value="">Choose a learner</option>
                {[...roster]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {e.cls.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">New due date</span>
              <input
                type="date"
                value={ext.date}
                onChange={(e) => setExt({ ...ext, date: e.target.value })}
                className="h-10 rounded-lg border border-lightGray bg-inputBackground px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Reason (optional)</span>
              <input
                value={ext.reason}
                onChange={(e) => setExt({ ...ext, reason: e.target.value })}
                className="h-10 rounded-lg border border-lightGray bg-inputBackground px-3"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setExtFor(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={busy || !ext.enrollmentId || !ext.date} onClick={saveExtension}>
                Grant extension
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CohortSchedule;
