import { Modal } from "@/components/Modal";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import {
  COHORT_STATUS,
  normalizeCohortStatus,
  type ApplicationStatus,
  type LmsApplication,
} from "@/utils/api/ministrySchool/interfaces";
import { cn } from "@/utils/cn";
import type { QueryType } from "@/utils/interfaces";
import { useMemo, useState } from "react";
import { runAction } from "../runAction";
import { useSomData } from "../somDataContext";
import { fmtDate } from "../somUtils";
import { Avatar, Btn, Panel, Pill } from "../ui";

type Props = { canManage: boolean; programFilter?: string; onDecided?: () => void };

const TABS: { key: ApplicationStatus; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "DECLINED", label: "Declined" },
];

type ClassOption = { id: number; label: string; enrolled: number; capacity: number };

const inputCls = "rounded-lg border border-lightGray bg-inputBackground px-3 text-sm text-primary";

/** Applications that were not auto-enrolled (prerequisites, audience, full class) and need a decision. */
export const ReviewQueue = ({ canManage, programFilter, onDecided }: Props) => {
  const { programs } = useSomData();
  const [tab, setTab] = useState<ApplicationStatus>("PENDING");
  const [deciding, setDeciding] = useState<{ app: LmsApplication; decision: "APPROVE" | "DECLINE" } | null>(null);
  const [courseId, setCourseId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const scope: QueryType = programFilter ? { programId: programFilter } : {};
  const pending = useFetch(api.fetch.fetchLmsApplications, { status: "PENDING", ...scope }, !canManage);
  const history = useFetch(
    api.fetch.fetchLmsApplications,
    { status: tab === "PENDING" ? "APPROVED" : tab, ...scope },
    !canManage || tab === "PENDING"
  );

  const pendingRows = pending.data?.data ?? [];
  const active = tab === "PENDING" ? pending : history;
  const rows = useMemo(
    () =>
      [...(active.data?.data ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [active.data]
  );

  const classOptions = useMemo<ClassOption[]>(() => {
    if (!deciding) return [];
    const program = programs.find((p) => p.id === deciding.app.program.id);
    const options: ClassOption[] = (program?.cohorts ?? [])
      .filter((c) => normalizeCohortStatus(c.status) !== COHORT_STATUS.COMPLETED)
      .flatMap((cohort) =>
        cohort.courses.map((cls) => ({
          id: cls.id,
          label: `${cohort.name} · ${cls.name}`,
          enrolled: cls.enrolled ?? cls.enrollments?.length ?? 0,
          capacity: cls.capacity,
        }))
      );
    const applied = deciding.app.course;
    if (applied && !options.some((o) => o.id === applied.id)) {
      options.unshift({
        id: applied.id,
        label: `${deciding.app.cohort?.name ?? "Cohort"} · ${applied.name}`,
        enrolled: applied.enrolled,
        capacity: applied.capacity,
      });
    }
    return options;
  }, [deciding, programs]);

  if (!canManage) return null;

  const open = (app: LmsApplication, decision: "APPROVE" | "DECLINE") => {
    setDeciding({ app, decision });
    setCourseId(app.course ? String(app.course.id) : "");
    setNote("");
  };

  const close = () => {
    if (!saving) setDeciding(null);
  };

  const submit = async () => {
    if (!deciding) return;
    const approve = deciding.decision === "APPROVE";
    setSaving(true);
    const ok = await runAction(
      () =>
        api.put.decideLmsApplication({
          id: deciding.app.id,
          decision: deciding.decision,
          ...(approve && courseId ? { courseId: Number(courseId) } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      {
        success: approve ? `${deciding.app.user.name} enrolled` : "Application declined",
        failure: approve ? "Could not enroll this learner" : "Could not decline this application",
      }
    );
    setSaving(false);
    if (ok) {
      setDeciding(null);
      pending.refetch();
      if (tab !== "PENDING") history.refetch();
      onDecided?.();
    }
  };

  const selected = classOptions.find((o) => String(o.id) === courseId);
  const selectedFull = selected ? selected.enrolled >= selected.capacity : false;

  return (
    <Panel
      title="Needs your review"
      action={
        <div className="flex items-center gap-2">
          <Pill tone="amber">Not auto-enrolled</Pill>
          <span className="text-sm font-semibold text-primary" aria-label={`${pendingRows.length} pending`}>
            {pendingRows.length}
          </span>
        </div>
      }
    >
      <div role="tablist" aria-label="Application status" className="flex gap-1.5 border-b border-gray-100 px-4 py-2.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              tab === t.key
                ? "border-primary bg-primary text-white"
                : "border-gray-200 text-primaryGray hover:bg-gray-50"
            )}
          >
            {t.label}
            {t.key === "PENDING" && <span className="ml-1.5 text-xs opacity-75">{pendingRows.length}</span>}
          </button>
        ))}
      </div>

      {active.error && !active.data ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-red-800" role="alert">
          <span>Could not load applications.</span>
          <Btn size="sm" onClick={() => active.refetch()}>
            Try again
          </Btn>
        </div>
      ) : active.loading && !active.data ? (
        <p className="px-4 py-3 text-sm text-primaryGray">Loading applications…</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-3 text-sm text-primaryGray">
          {tab === "PENDING"
            ? "Nobody is waiting for review."
            : `No ${tab === "APPROVED" ? "approved" : "declined"} applications yet.`}
        </p>
      ) : (
        <ul className="max-h-[420px] overflow-y-auto">
          {rows.map((app) => (
            <li
              key={app.id}
              className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-0"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <Avatar name={app.user.name} />
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">{app.user.name}</p>
                    {app.user.email && <p className="truncate text-xs text-mainGray">{app.user.email}</p>}
                  </div>
                  <p className="text-xs text-primaryGray">
                    {[app.program.title, app.cohort?.name, app.course?.name].filter(Boolean).join(" · ")}
                  </p>
                  {app.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {app.reasons.map((r) => (
                        <Pill key={r} tone="amber" className="px-2 py-0 text-[11px] font-medium">
                          {r}
                        </Pill>
                      ))}
                    </div>
                  )}
                  {app.note && <p className="text-xs italic text-primaryGray">“{app.note}”</p>}
                  <p className="text-xs text-mainGray">
                    Applied {fmtDate(app.createdAt)}
                    {app.decidedAt && ` · Decided ${fmtDate(app.decidedAt)}`}
                  </p>
                </div>
              </div>
              {app.status === "PENDING" && (
                <div className="flex gap-2">
                  <Btn size="sm" onClick={() => open(app, "DECLINE")}>
                    Decline
                  </Btn>
                  <Btn size="sm" variant="primary" onClick={() => open(app, "APPROVE")}>
                    Enroll anyway
                  </Btn>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(deciding)}
        onClose={close}
        className="!max-w-lg"
        title={deciding?.decision === "APPROVE" ? "Enroll anyway" : "Decline application"}
      >
        {deciding && (
          <div className="flex flex-col gap-4 p-5">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {deciding.decision === "APPROVE" ? "Enroll anyway" : "Decline application"}
              </h3>
              <p className="text-sm text-primaryGray">
                {deciding.app.user.name} · {deciding.app.program.title}
              </p>
            </div>

            {deciding.decision === "APPROVE" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-primary">Class</span>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className={cn(inputCls, "h-10")}
                >
                  {!courseId && <option value="">Choose a class</option>}
                  {classOptions.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.label} ({o.enrolled}/{o.capacity}
                      {o.enrolled >= o.capacity ? ", full" : ""})
                    </option>
                  ))}
                </select>
                {selected && (
                  <span className={cn("text-xs", selectedFull ? "text-amber-700" : "text-mainGray")}>
                    {selected.enrolled}/{selected.capacity} seats taken.
                    {selectedFull && " This class is full; enrolling will take it over capacity."}
                  </span>
                )}
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-primary">Note (optional)</span>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  deciding.decision === "APPROVE"
                    ? "Why this learner is being enrolled"
                    : "Let the applicant know why"
                }
                className={cn(inputCls, "py-2")}
              />
            </label>

            <div className="flex justify-end gap-2">
              <Btn onClick={close} disabled={saving}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                onClick={submit}
                disabled={saving || (deciding.decision === "APPROVE" && !courseId)}
              >
                {saving ? "Saving…" : deciding.decision === "APPROVE" ? "Enroll" : "Decline"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </Panel>
  );
};

export default ReviewQueue;
